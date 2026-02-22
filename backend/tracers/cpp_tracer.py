"""
C++ tracer using GDB/MI.
Compiles with g++ -g, launches binary under GDB --interpreter=mi,
sets breakpoint on main(), then steps through using -exec-step,
capturing local variables at each stop.
Filters out internal/library code by stepping out of non-user files.
Hard limit: 500 steps, 10 second timeout.
"""

import os
import re
import subprocess
import tempfile
import shutil
from typing import Dict, List, Optional

MAX_STEPS = int(os.getenv("MAX_STEPS", "500"))
TIMEOUT = int(os.getenv("TIMEOUT", "10"))

COMMON_HEADERS = [
    "#include <iostream>",
    "#include <vector>",
    "#include <string>",
    "#include <algorithm>",
    "#include <map>",
    "#include <set>",
    "#include <queue>",
    "#include <stack>",
    "#include <cmath>",
    "using namespace std;"
]

def _parse_mi_variables(mi_output: str) -> List[Dict]:
    variables = []
    pattern = re.compile(r'\{name="([^"]+)",(?:arg="\d+",)?value="([^"]*)",type="([^"]*)"\}')
    for match in pattern.finditer(mi_output):
        name, value, vtype = match.groups()
        if not name.startswith("__") and name != "std":
            variables.append({"name": name, "value": value, "type": vtype})
    return variables

def _send_mi(proc, command: str) -> str:
    if not proc or proc.poll() is not None:
        return ""
    try:
        proc.stdin.write(command + "\n")
        proc.stdin.flush()
        output = []
        while True:
            line = proc.stdout.readline()
            if not line: break
            output.append(line.rstrip("\n"))
            if line.strip() == "(gdb)": break
        return "\n".join(output)
    except Exception:
        return ""

def _prepare_cpp_code(code: str) -> (str, List[str], int):
    """Inject headers and main wrapper if needed. Returns (code, lines, offset)."""
    lines = code.splitlines()
    has_main = any("int main" in line for line in lines)
    
    headers_to_add = []
    for h in COMMON_HEADERS:
        header_name = h.split('<')[-1].split('>')[0] if '<' in h else h
        if header_name not in code:
            headers_to_add.append(h)
    
    offset = len(headers_to_add) + 1 # +1 for the extra newline
    final_code = "\n".join(headers_to_add) + "\n\n"
    if not has_main:
        final_code += code + "\n\nint main() {\n    return 0;\n}"
    else:
        final_code += code
        
    return final_code, final_code.splitlines(), offset

def trace(code: str) -> List[Dict]:
    processed_code, source_lines, offset = _prepare_cpp_code(code)
    steps = []
    tmpdir = tempfile.mkdtemp()
    src_path = os.path.join(tmpdir, "main.cpp")
    ext = ".exe" if os.name == "nt" else ""
    bin_path = os.path.join(tmpdir, "main_bin" + ext)

    gpp_cmd = os.getenv("GPP_PATH", "g++")
    gdb_cmd = os.getenv("GDB_PATH", "gdb")

    if not shutil.which(gpp_cmd):
        return [{"step_number": 1, "line_number": 0, "line_text": "", "variables": [], "event": "error", "output": f"C++ Compiler ({gpp_cmd}) not found. Please install MinGW and set GPP_PATH in .env or add it to PATH.", "scope": "global"}]
    if not shutil.which(gdb_cmd):
        return [{"step_number": 1, "line_number": 0, "line_text": "", "variables": [], "event": "error", "output": f"GDB Debugger ({gdb_cmd}) not found. Please install GDB and set GDB_PATH in .env or add it to PATH.", "scope": "global"}]

    gdb_proc = None
    try:
        with open(src_path, "w", encoding="utf-8") as f:
            f.write(processed_code)

        compile_result = subprocess.run(
            [gpp_cmd, "-g", "-O0", "main.cpp", "-o", "main_bin" + ext],
            capture_output=True, text=True, timeout=TIMEOUT, cwd=tmpdir
        )
        if compile_result.returncode != 0:
            return [{"step_number": 1, "line_number": 0, "line_text": "", "variables": [], "event": "error", "output": f"Compilation error:\n{compile_result.stderr}", "scope": "global"}]

        gdb_proc = subprocess.Popen(
            [gdb_cmd, "--interpreter=mi", "--quiet", os.path.abspath(bin_path)],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=tmpdir
        )
        _send_mi(gdb_proc, "") 
        _send_mi(gdb_proc, "set inferior-tty " + ("NUL" if os.name == "nt" else "/dev/null"))
        _send_mi(gdb_proc, "-break-insert main")
        run_output = _send_mi(gdb_proc, "-exec-run")

        step_num = 0
        last_log = None

        while step_num < MAX_STEPS:
            line_match = re.search(r'line="(\d+)"', run_output)
            file_match = re.search(r'fullname="([^"]+)"', run_output)
            func_match = re.search(r'func="([^"]+)"', run_output)

            if "exited-normally" in run_output or "reason=\"exited" in run_output: break
            
            is_main_file = file_match and os.path.basename(file_match.group(1)).lower() == "main.cpp"
            
            if is_main_file:
                abs_lineno = int(line_match.group(1)) if line_match else -1
                scope = func_match.group(1) if func_match else "global"
                
                if abs_lineno > 0:
                    reported_lineno = abs_lineno - offset
                    # Don't report lines outside the user's provided code (e.g. injected headers)
                    if reported_lineno >= 1:
                        line_text = source_lines[abs_lineno - 1].strip() if 1 <= abs_lineno <= len(source_lines) else ""
                        
                        vars_output = _send_mi(gdb_proc, "-stack-list-variables --all-values")
                        variables = _parse_mi_variables(vars_output)
                        
                        step_num += 1
                        current_log = (reported_lineno, scope, str(variables))
                        if current_log != last_log:
                            steps.append({
                                "step_number": step_num,
                                "line_number": reported_lineno,
                                "line_text": line_text,
                                "variables": variables,
                                "event": "line",
                                "output": "",
                                "scope": scope if scope == "global" else f"{scope}()",
                            })
                            last_log = current_log
                
                run_output = _send_mi(gdb_proc, "-exec-step")
            else:
                # Outside main.cpp, step out
                run_output = _send_mi(gdb_proc, "-exec-finish")
                # If we can't finish (maybe in entry point?), try stepping
                if "^error" in run_output: run_output = _send_mi(gdb_proc, "-exec-step")

        _send_mi(gdb_proc, "-gdb-exit")
        try:
            gdb_proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            gdb_proc.kill()

    except Exception as e:
        if not steps:
            steps.append({"step_number": 1, "line_number": 0, "line_text": "Error", "variables": [], "event": "error", "output": f"C++ Tracer Error: {str(e)}", "scope": "global"})
    finally:
        if gdb_proc and gdb_proc.poll() is None:
            gdb_proc.kill()
        shutil.rmtree(tmpdir, ignore_errors=True)

    return steps[:MAX_STEPS] if steps else [{"step_number": 1, "line_number": 0, "line_text": "", "variables": [], "event": "error", "output": "No steps captured. Ensure your code has reachable logic.", "scope": "global"}]

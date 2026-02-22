"""
Java tracer with snippet support.
Auto-wraps code in Main class and main method if missing.
Injects utility imports by default.
"""

import os
import re
import subprocess
import tempfile
import shutil
import traceback
from typing import Dict, List, Set, Tuple

try:
    import javalang
    HAS_JAVALANG = True
except ImportError:
    HAS_JAVALANG = False

MAX_STEPS = int(os.getenv("MAX_STEPS", "500"))
TIMEOUT = int(os.getenv("TIMEOUT", "10"))
TRACE_MARKER = "__TRACE__"
VAR_MARKER = "__VAR__"

DEFAULT_IMPORTS = [
    "import java.util.*;",
    "import java.io.*;",
    "import java.math.*;"
]

def _prepare_java_code(code: str) -> (str, str):
    """Wraps Java snippets in Main class/main method if needed."""
    has_class = "class " in code
    has_main = "public static void main" in code
    
    imports = "\n".join(DEFAULT_IMPORTS) + "\n\n"
    
    if not has_class:
        # Code is just methods or logic
        if not has_main:
            # Code is just logic
            code = f"public class Main {{\n    public static void main(String[] args) {{\n{code}\n    }}\n}}"
        else:
            # Code contains main but no class (unlikely but possible)
            code = f"public class Main {{\n{code}\n}}"
    elif not has_main:
        # Code has class but no main (library style)
        # We can't easily run it without entry, so we add a dummy main to the public class
        lines = code.splitlines()
        found_class = -1
        for i, line in enumerate(lines):
            if "public class " in line or "class " in line:
                found_class = i
                break
        if found_class != -1:
            lines.insert(found_class + 1, "    public static void main(String[] args) {}")
            code = "\n".join(lines)
            
    return imports + code, _extract_class_name(code)

def _extract_class_name(code: str) -> str:
    match = re.search(r"public\s+class\s+(\w+)", code)
    if match: return match.group(1)
    match = re.search(r"class\s+(\w+)", code)
    if match: return match.group(1)
    return "Main"

def _analyze_java(code: str) -> Tuple[Set[int], Dict[int, List[str]], Dict[int, str]]:
    traceable = set()
    vars_at_line = {}
    scope_at_line = {}

    if not HAS_JAVALANG:
        for i, line in enumerate(code.splitlines(), start=1):
            if line.strip().endswith(";") or any(line.strip().startswith(k) for k in ["if", "for", "while", "return", "switch"]):
                traceable.add(i)
        return traceable, vars_at_line, scope_at_line

    try:
        tree = javalang.parse.parse(code)
        for path, node in tree:
            if isinstance(node, (javalang.tree.Statement, javalang.tree.VariableDeclaration)):
                if hasattr(node, "position") and node.position:
                    line = node.position.line
                    method_name = "global"
                    for p in reversed(path):
                        if isinstance(p, javalang.tree.MethodDeclaration):
                            method_name = p.name + "()"
                            break
                    traceable.add(line)
                    scope_at_line[line] = method_name
    except: pass
    return traceable, vars_at_line, scope_at_line

def _inject_trace_statements(code: str, traceable: Set[int], scope_at_line: Dict[int, str]) -> str:
    lines = code.splitlines()
    result = []
    for i, line in enumerate(lines, start=1):
        if i in traceable:
            stripped = line.strip().replace('"', '\\"')
            indent = " " * (len(line) - len(line.lstrip()))
            scope = scope_at_line.get(i, "main")
            result.append(f'{indent}System.err.println("{TRACE_MARKER}|{i}|{scope}|{stripped}");')
        result.append(line)
    return "\n".join(result)

def trace(code: str) -> List[Dict]:
    processed_code, class_name = _prepare_java_code(code)
    traceable, _, scope_at_line = _analyze_java(processed_code)
    instrumented = _inject_trace_statements(processed_code, traceable, scope_at_line)
    
    tmpdir = tempfile.mkdtemp()
    try:
        java_file = os.path.join(tmpdir, f"{class_name}.java")
        with open(java_file, "w", encoding="utf-8") as f: f.write(instrumented)

        subprocess.run(["javac", java_file], capture_output=True, text=True, timeout=TIMEOUT, cwd=tmpdir)
        run_result = subprocess.run(["java", "-cp", tmpdir, class_name], capture_output=True, text=True, timeout=TIMEOUT)

        steps = []
        source_lines = processed_code.splitlines()
        for err_line in run_result.stderr.splitlines():
            if err_line.startswith(TRACE_MARKER):
                parts = err_line.split("|", 3)
                if len(parts) >= 4:
                    _, lineno_str, scope, _ = parts
                    lineno = int(lineno_str)
                    steps.append({
                        "step_number": len(steps) + 1,
                        "line_number": lineno,
                        "line_text": source_lines[lineno-1].strip() if 1 <= lineno <= len(source_lines) else "",
                        "variables": [], "event": "line", "output": "", "scope": scope
                    })
        return steps[:MAX_STEPS] if steps else [{"step_number": 1, "line_number": 0, "line_text": "", "variables": [], "event": "error", "output": "No trace steps captured.", "scope": "global"}]
    finally: shutil.rmtree(tmpdir, ignore_errors=True)

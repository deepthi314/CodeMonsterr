"""
JavaScript tracer using Node.js instrumentation.
Injects __trace() calls at every line, runs via subprocess,
collects step data via stderr JSON output.
Hard limit: 500 steps, 10 second timeout.
"""

import json
import os
import re
import subprocess
import sys
import tempfile
from typing import Dict, List


MAX_STEPS = int(os.getenv("MAX_STEPS", "500"))
TIMEOUT = int(os.getenv("TIMEOUT", "10"))

TRACER_PREAMBLE = r"""
const __steps = [];
const __origLog = console.log.bind(console);
let __stepNum = 0;
let __pendingOutput = '';

console.log = function(...args) {
  const str = args.map(a => {
    try {
      if (typeof a === 'object' && a !== null) return JSON.stringify(a);
      return String(a);
    } catch(e) { return String(a); }
  }).join(' ');
  __pendingOutput += str + '\n';
  __origLog(...args);
};

function __trace(lineNum, lineText, scope, vars) {
  if (__stepNum >= {MAX_STEPS}) return;
  __stepNum++;
  
  // Format variables for the model
  const formattedVars = Object.entries(vars).map(([name, val]) => {
    let type = typeof val;
    let value = String(val);
    if (type === 'object' && val !== null) {
        try { value = JSON.stringify(val); } catch(e) {}
    }
    return { name, value, type };
  });

  const step = {
    step_number: __stepNum,
    line_number: lineNum,
    line_text: lineText,
    variables: formattedVars,
    event: 'line',
    output: __pendingOutput.trimEnd(),
    scope: scope || 'global'
  };
  __pendingOutput = '';
  __steps.push(step);
}

process.on('exit', function() {
  process.stderr.write('\n__STEPS_START__\n');
  process.stderr.write(JSON.stringify(__steps));
  process.stderr.write('\n__STEPS_END__\n');
});

process.on('uncaughtException', function(err) {
  __steps.push({
    step_number: __stepNum + 1,
    line_number: 0,
    line_text: '',
    variables: [],
    event: 'error',
    output: String(err),
    scope: 'global'
  });
  process.exit(1);
});
"""


def _instrument_js(code: str) -> str:
    """Inject __trace() at the start of each non-empty, non-comment line."""
    lines = code.splitlines()
    instrumented = []
    current_scope = "global"
    
    # Track variables declared so far
    known_vars = set()

    for i, line in enumerate(lines, start=1):
        stripped = line.strip()
        
        # Simple scope detection
        func_match = re.search(r'function\s+(\w+)', stripped)
        if func_match:
            current_scope = func_match.group(1) + "()"
            # Add function parameters if possible
            params_match = re.search(r'\(([^)]*)\)', stripped)
            if params_match:
                for p in params_match.group(1).split(','):
                    p = p.strip().split('=')[0].strip() # Handle default params
                    if p and not p.startswith('{') and not p.startswith('['):
                         known_vars.add(p)

        # Skip empty lines or comments
        if not stripped or stripped.startswith("//") or stripped.startswith("/*") or stripped == "}":
            # Still check for declarations even on "skipped" lines
            for m in re.finditer(r'(?:let|const|var|function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)', stripped):
                name = m.group(1)
                if name not in ("function", "class", "let", "const", "var"):
                    known_vars.add(name)
            instrumented.append(line)
            continue

        safe_text = stripped.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")

        # Build variable map ONLY for variables declared in PREVIOUS lines
        var_items = []
        for v in sorted(list(known_vars)):
            # Safer getter closure
            var_items.append(f"'{v}': (() => {{ try {{ return {v}; }} catch(e) {{ return undefined; }} }})()")
        
        var_map_str = "{" + ", ".join(var_items) + "}"
        trace_call = f"__trace({i}, `{safe_text}`, '{current_scope}', {var_map_str});"
        
        instrumented.append(trace_call)
        instrumented.append(line)

        # Update known vars with declarations from THIS line for SUBSEQUENT lines
        for m in re.finditer(r'(?:let|const|var|function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)', stripped):
            name = m.group(1)
            if name not in ("function", "class", "let", "const", "var"):
                known_vars.add(name)
        
        # Handle assignments to potentially new variables (globals)
        for m in re.finditer(r'([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=', stripped):
            name = m.group(1)
            if name not in ("let", "const", "var", "function", "class", "if", "for", "while", "return"):
                known_vars.add(name)

    preamble = TRACER_PREAMBLE.replace("{MAX_STEPS}", str(MAX_STEPS))
    return preamble + "\n" + "\n".join(instrumented)


def trace(code: str) -> List[Dict]:
    instrumented = _instrument_js(code)
    steps = []
    
    with tempfile.NamedTemporaryFile(mode="w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(instrumented)
        tmp_path = f.name

    try:
        result = subprocess.run(["node", tmp_path], capture_output=True, text=True, timeout=TIMEOUT)
        
        stderr_out = result.stderr
        if "__STEPS_START__" in stderr_out and "__STEPS_END__" in stderr_out:
            try:
                start_marker = stderr_out.find("__STEPS_START__") + len("__STEPS_START__")
                end_marker = stderr_out.find("__STEPS_END__")
                json_str = stderr_out[start_marker:end_marker].strip()
                steps = json.loads(json_str)
                # Filter out undefined variables from steps
                for s in steps:
                    s["variables"] = [v for v in s["variables"] if v["value"] != "undefined" and v["value"] != "function"]
            except Exception:
                steps = []

        if result.returncode != 0 and not steps:
            steps.append({"step_number": 1, "line_number": 0, "line_text": "", "variables": [], "event": "error", "output": result.stderr or result.stdout or "Unknown error", "scope": "global"})

    except Exception as e:
        steps.append({"step_number": 1, "line_number": 0, "line_text": "", "variables": [], "event": "error", "output": str(e), "scope": "global"})
    finally:
        try: os.unlink(tmp_path)
        except: pass

    return steps[:MAX_STEPS]

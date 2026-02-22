"""
Python tracer with pre-loaded common modules for algorithm snippets.
"""

import os
import sys
import threading
import traceback
from io import StringIO
from typing import Any, Dict, List


MAX_STEPS = int(os.getenv("MAX_STEPS", "500"))
TIMEOUT = int(os.getenv("TIMEOUT", "10"))

# Pre-load common modules for convenience in snippets
COMMON_IMPORTS = """
import math
import collections
import itertools
import bisect
import heapq
import json
"""

def _safe_str(val: Any) -> str:
    try:
        s = repr(val)
        return s[:200] if len(s) > 200 else s
    except Exception:
        return "<unrepresentable>"

def _type_name(val: Any) -> str:
    return type(val).__name__

def trace(code: str) -> List[Dict]:
    steps = []
    step_counter = [0]
    timed_out = [False]
    source_lines = code.splitlines()

    stdout_buffer = StringIO()
    last_output = [""]

    def get_new_output():
        current = stdout_buffer.getvalue()
        prev = last_output[0]
        last_output[0] = current
        new = current[len(prev):]
        return new.rstrip("\n") if new else ""

    def tracer(frame, event, arg):
        if timed_out[0]: raise TimeoutError("Execution timed out")
        if step_counter[0] >= MAX_STEPS: return None
        if event not in ("line", "call", "return", "exception"): return tracer

        lineno = frame.f_lineno
        line_text = source_lines[lineno - 1].strip() if 1 <= lineno <= len(source_lines) else ""

        local_vars = []
        # Modules pre-loaded into globals will be in frame.f_globals
        # If we are in the global scope, frame.f_locals == frame.f_globals
        preloaded_names = {"math", "collections", "itertools", "bisect", "heapq", "json", "os", "sys"}
        
        for name, val in frame.f_locals.items():
            if name.startswith("__") or name in preloaded_names: continue
            local_vars.append({"name": name, "value": _safe_str(val), "type": _type_name(val)})

        scope = frame.f_code.co_name
        scope = "global" if scope == "<module>" else f"{scope}()"

        step_counter[0] += 1
        steps.append({
            "step_number": step_counter[0],
            "line_number": lineno,
            "line_text": line_text,
            "variables": local_vars,
            "event": "error" if event == "exception" else event,
            "output": get_new_output(),
            "scope": scope,
        })
        return tracer

    def _run():
        try:
            safe_globals = {"__builtins__": __builtins__, "__name__": "__main__"}
            # Pre-populate globals with common modules
            try:
                exec(COMMON_IMPORTS, safe_globals)
            except: pass
            
            old_stdout = sys.stdout
            sys.stdout = stdout_buffer
            sys.settrace(tracer)
            try:
                exec(compile(code, "<string>", "exec"), safe_globals)
            finally:
                sys.settrace(None)
                sys.stdout = old_stdout
        except Exception as e:
            steps.append({
                "step_number": step_counter[0] + 1,
                "line_number": 0, "line_text": "", "variables": [], "event": "error",
                "output": f"{type(e).__name__}: {e}\n{traceback.format_exc()}",
                "scope": "global",
            })

    timer = threading.Timer(TIMEOUT, lambda: timed_out.__setitem__(0, True))
    timer.start()
    try:
        t = threading.Thread(target=_run)
        t.start()
        t.join(TIMEOUT + 1)
    finally:
        timer.cancel()
        sys.settrace(None)

    return steps if steps else [{"step_number": 1, "line_number": 0, "line_text": "", "variables": [], "event": "error", "output": "No steps captured.", "scope": "global"}]

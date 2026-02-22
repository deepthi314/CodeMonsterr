import os
import sys
from pathlib import Path

# Add tracers to path
sys.path.append(str(Path(__file__).resolve().parent / "backend"))

from tracers.python_tracer import trace as python_trace
from tracers.js_tracer import trace as js_trace

def test_python_tracer():
    print("Testing Python Tracer...")
    code = """
def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n-1)

res = factorial(3)
print(f"Result: {res}")
"""
    steps = python_trace(code)
    print(f"Steps captured: {len(steps)}")
    for s in steps[:5]:
        print(f"Step {s['step_number']}: Line {s['line_number']} | {s['line_text']} | Vars: {s['variables']}")
    
    if any(s['event'] == 'error' for s in steps):
        print("❌ Python tracer reported an error!")
    else:
        print("✅ Python tracer seems to be working.")

def test_js_tracer():
    print("\nTesting JS Tracer...")
    code = """
function greet(name) {
    const message = "Hello, " + name;
    return message;
}
let names = ["Alice", "Bob"];
for (let n of names) {
    console.log(greet(n));
}
"""
    # Note: this requires node to be installed
    try:
        steps = js_trace(code)
        print(f"Steps captured: {len(steps)}")
        for s in steps[:5]:
            print(f"Step {s['step_number']}: Line {s['line_number']} | {s['line_text']} | Vars: {s['variables']}")
        
        if any(s['event'] == 'error' for s in steps):
            print("❌ JS tracer reported an error!")
            for s in steps:
                if s['event'] == 'error':
                    print(f"Error output: {s['output']}")
        else:
            print("✅ JS tracer seems to be working.")
    except Exception as e:
        print(f"❌ JS tracer test failed: {e}")

if __name__ == "__main__":
    test_python_tracer()
    test_js_tracer()

import sys
import os
import json

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from tracers import java_tracer, js_tracer, cpp_tracer

def test_js():
    code = """
const x = 10;
const y = 20;
const result = x + y;
function greet(name) {
    const message = "Hello " + name;
    return message;
}
const g = greet("World");
console.log(g);
"""
    print("--- Testing JS Tracer ---")
    steps = js_tracer.trace(code)
    for s in steps:
        vars_str = ", ".join([f"{v['name']}={v['value']}" for v in s['variables']])
        print(f"Step {s['step_number']}: L{s['line_number']} [{s['scope']}] {s['line_text']} | Vars: {vars_str}")
    print("------------------------\n")

def test_java():
    code = """
public class Main {
    public static void main(String[] args) {
        int x = 10;
        int y = 20;
        int res = x + y;
        System.out.println(res);
    }
}
"""
    print("--- Testing Java Tracer ---")
    steps = java_tracer.trace(code)
    for s in steps:
        vars_str = ", ".join([f"{v['name']}={v['value']}" for v in s['variables']])
        print(f"Step {s['step_number']}: L{s['line_number']} [{s['scope']}] {s['line_text']} | Vars: {vars_str}")
    print("------------------------\n")

if __name__ == "__main__":
    test_js()
    test_java()

import sys
import os

# Add backend to path to test tracers directly
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from tracers import java_tracer, cpp_tracer

def test_java():
    code = """
public class Main {
    public static void main(String[] args) {
        int x = 10;
        System.out.println("Hello");
        return;
    }
}
"""
    print("Testing Java Tracer...")
    steps = java_tracer.trace(code)
    for s in steps:
        print(f"Step {s['step_number']}: L{s['line_number']} {s['event']} - {s['line_text']}")
        if s['event'] == 'error':
            print(f"ERROR: {s['output']}")

def test_cpp():
    # Only if g++/gdb available
    code = """
#include <iostream>
int main() {
    int x = 10;
    std::cout << x << std::endl;
    return 0;
}
"""
    print("\nTesting C++ Tracer...")
    steps = cpp_tracer.trace(code)
    for s in steps:
        print(f"Step {s['step_number']}: L{s['line_number']} {s['event']} - {s['line_text']}")
        if s['event'] == 'error':
            print(f"ERROR: {s['output']}")

if __name__ == "__main__":
    test_java()
    try:
        test_cpp()
    except Exception as e:
        print(f"C++ test skipped or failed: {e}")

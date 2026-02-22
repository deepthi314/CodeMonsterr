"""
training/build_dataset.py
Generates JSONL training + eval data for all 4 languages.
Each record: { "code": "...", "language": "...", "steps": [...] }
"""

import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

SAMPLES = {
    "python": [
        "x = 1\ny = 2\nz = x + y\nprint(z)",
        "for i in range(3):\n    print(i)",
        "def add(a, b):\n    return a + b\nresult = add(3, 4)\nprint(result)",
    ],
    "javascript": [
        "const x = 1;\nconst y = 2;\nconst z = x + y;\nconsole.log(z);",
        "for (let i = 0; i < 3; i++) {\n  console.log(i);\n}",
        "function add(a, b) {\n  return a + b;\n}\nconst result = add(3, 4);\nconsole.log(result);",
    ],
    "java": [
        "public class Main {\n    public static void main(String[] args) {\n        int x = 1;\n        int y = 2;\n        int z = x + y;\n        System.out.println(z);\n    }\n}",
        "public class Main {\n    public static void main(String[] args) {\n        for (int i = 0; i < 3; i++) {\n            System.out.println(i);\n        }\n    }\n}",
    ],
    "cpp": [
        "#include <iostream>\nusing namespace std;\nint main() {\n    int x = 1;\n    int y = 2;\n    int z = x + y;\n    cout << z << endl;\n    return 0;\n}",
        "#include <iostream>\nusing namespace std;\nint main() {\n    for (int i = 0; i < 3; i++) {\n        cout << i << endl;\n    }\n    return 0;\n}",
    ],
}

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'data')


def build_dataset():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    train_path = os.path.join(OUTPUT_DIR, 'train.jsonl')
    eval_path = os.path.join(OUTPUT_DIR, 'eval.jsonl')

    train_records = []
    eval_records = []

    for language, codes in SAMPLES.items():
        print(f"\n[{language.upper()}] Generating {len(codes)} samples...")
        try:
            if language == 'python':
                from tracers.python_tracer import trace
            elif language == 'javascript':
                from tracers.js_tracer import trace
            elif language == 'java':
                from tracers.java_tracer import trace
            elif language == 'cpp':
                from tracers.cpp_tracer import trace
        except ImportError as e:
            print(f"  Skipping {language}: {e}")
            continue

        for i, code in enumerate(codes):
            try:
                steps = trace(code)
                record = {"code": code, "language": language, "steps": steps}
                # 80/20 train/eval split
                if i < len(codes) * 0.8:
                    train_records.append(record)
                else:
                    eval_records.append(record)
                print(f"  Sample {i+1}: {len(steps)} steps captured")
            except Exception as e:
                print(f"  Sample {i+1} failed: {e}")

    with open(train_path, 'w', encoding='utf-8') as f:
        for r in train_records:
            f.write(json.dumps(r) + '\n')

    with open(eval_path, 'w', encoding='utf-8') as f:
        for r in eval_records:
            f.write(json.dumps(r) + '\n')

    print(f"\nDataset built:")
    print(f"  Train: {len(train_records)} records → {train_path}")
    print(f"  Eval:  {len(eval_records)} records → {eval_path}")


if __name__ == '__main__':
    build_dataset()

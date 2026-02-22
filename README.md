# CodeMonster 1.0 🦖

> **Multi-language code execution tracer** — visualize Python, JavaScript, Java, and C++ code running step-by-step.

## Features

- 🐍 **Python** — `sys.settrace()` with full variable capture and stdout redirection
- ⚡ **JavaScript** — Node.js instrumentation via `__trace()` injection + local HTTP receiver
- ☕ **Java** — `javac` compile + `javalang` AST-based trace marker injection
- ⚙️ **C++** — `g++ -g` + GDB/MI step-by-step debugging with `-stack-list-variables`
- ✨ **AI Explanations** — OpenAI-powered beginner-friendly step explanations
- 🎨 **Language-aware theming** — Blue (Python), Yellow (JS), Orange (Java), Purple (C++)

---

## Prerequisites

| Tool | Required for |
|------|-------------|
| Python 3.10+ | Backend |
| Node.js 18+ | JavaScript tracing |
| JDK 17+ (`javac`, `java`) | Java tracing |
| GCC/GDB (`g++`, `gdb`) | C++ tracing |
| npm 9+ | Frontend |

---

## Quick Start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

---

## Project Structure

```
CodeMonster1.0/
├── backend/
│   ├── main.py                  # FastAPI app — /trace, /explain
│   ├── requirements.txt
│   ├── .env.example
│   └── tracers/
│       ├── __init__.py
│       ├── python_tracer.py     # sys.settrace()
│       ├── js_tracer.py         # Node.js instrumentation
│       ├── java_tracer.py       # javac + javalang
│       └── cpp_tracer.py        # g++ + GDB/MI
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── components/
│       │   ├── CodeEditor.jsx
│       │   ├── ControlBar.jsx
│       │   ├── LanguageSelector.jsx
│       │   ├── StepPanel.jsx
│       │   └── VariablePanel.jsx
│       ├── hooks/
│       │   └── useTracer.js
│       └── utils/
│           ├── api.js
│           └── languageConfig.js
├── training/
│   └── build_dataset.py         # JSONL dataset generator
├── docker-compose.yml
└── README.md
```

---

## API Reference

### `POST /trace`

```json
{
  "code": "x = 1\nprint(x)",
  "language": "python"
}
```

Returns array of steps:

```json
[
  {
    "step_number": 1,
    "line_number": 1,
    "line_text": "x = 1",
    "variables": [{ "name": "x", "value": "1", "type": "int" }],
    "event": "line",
    "output": "",
    "scope": "global"
  }
]
```

### `POST /explain`

```json
{
  "step": { ...step object... },
  "language": "python"
}
```

Returns: `{ "explanation": "This line assigns the value 1 to the variable x." }`

---

## Docker

```bash
cp backend/.env.example backend/.env
# Add OPENAI_API_KEY to backend/.env
docker-compose up --build
```

---

## Training Dataset

```bash
cd training
python build_dataset.py
# Outputs: training/data/train.jsonl, training/data/eval.jsonl
```

---

## Limits

- Max **500 steps** per trace
- **10 second** execution timeout
- Java: single-class only (Phase 1)
- C++: requires GDB installed (use WSL on Windows)
"# CodeMonsterr" 

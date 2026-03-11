import json
import os
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional
import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

from pydantic import BaseModel, Field, EmailStr
import models, database, auth
from database import engine, get_db
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt

# Initialize database
models.Base.metadata.create_all(bind=engine)

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)
load_dotenv(override=True)

app = FastAPI(title="CodeMonster API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ────────────────────────────────────────────────────────────────────

class Language(str, Enum):
    python = "python"
    javascript = "javascript"
    java = "java"
    cpp = "cpp"


class TraceRequest(BaseModel):
    code: str
    language: Language

class Token(BaseModel):
    access_token: str
    token_type: str


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True

class TraceHistoryResponse(BaseModel):
    id: int
    language: str
    code: str
    steps: List[dict]
    explanation: Optional[str]
    created_at: datetime.datetime
    owner_id: int

    class Config:
        from_attributes = True

class NoteCreate(BaseModel):
    title: str
    content: str
    color: Optional[str] = "#ffffff"
    is_starred: Optional[bool] = False

class NoteResponse(BaseModel):
    id: int
    title: str
    content: str
    color: str
    is_starred: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


class VariableInfo(BaseModel):
    name: str
    value: str
    type: str


class TraceStep(BaseModel):
    step_number: int
    line_number: int
    line_text: str
    variables: List[VariableInfo]
    event: str          # "line" | "call" | "return" | "error"
    output: str
    scope: str


class ExplainRequest(BaseModel):
    step: Dict[str, Any]
    language: Language


# ── AI Providers ─────────────────────────────────────────────────────────────

def get_ai_response(prompt: str, system_instruction: str = "") -> str:
    """Unified helper to get response from Groq, OpenAI, or Gemini."""
    groq_key = os.getenv("GROQ_API_KEY", "")
    openai_or_gemini_key = os.getenv("OPENAI_API_KEY", "")

    if groq_key:
        if not GROQ_AVAILABLE:
            raise Exception("Groq library not installed. Please run 'pip install groq' and restart.")
        try:
            client = Groq(api_key=groq_key)
            response = client.chat.completions.create(
                model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=400,
                temperature=0.4,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise Exception(f"Groq Error: {str(e)}")

    api_key = openai_or_gemini_key

    if api_key and api_key.startswith("gsk_"):
        if not GROQ_AVAILABLE:
            raise Exception("Groq library not installed. Please run 'pip install groq' and restart.")
        try:
            client = Groq(api_key=api_key)
            response = client.chat.completions.create(
                model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=400,
                temperature=0.4,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise Exception(f"Groq Error: {str(e)}")

    if not api_key:
        raise ValueError("API key not configured.")

    if api_key.startswith("AIza"):
        if not GEMINI_AVAILABLE:
            raise Exception("Gemini library not installed. Please run 'pip install google-generativeai' and restart.")
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=system_instruction
            )
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            raise Exception(f"Gemini Error: {str(e)}")

    # Only treat as OpenAI if it's not a placeholder
    if api_key.startswith("sk-") and not api_key.startswith("sk-..."):
        if not OPENAI_AVAILABLE:
            raise Exception("OpenAI library not installed. Please run 'pip install openai' and restart.")
        try:
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=400,
                temperature=0.4,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            error_msg = str(e)
            if "insufficient_quota" in error_msg:
                raise Exception("Your OpenAI account has no credits or has exceeded its quota.")
            if "Incorrect API key provided" in error_msg or "401" in error_msg:
                raise Exception("Invalid OpenAI API key. Please check your .env file and ensure the key is correct.")
            raise Exception(f"OpenAI Error: {error_msg}")

    raise ValueError("No valid AI API key found. Please check your .env file and ensure either GROQ_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY is correctly set.")


# ── Routes ────────────────────────────────────────────────────────────────────

@app.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user_name = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user_name:
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/history", response_model=List[TraceHistoryResponse])
def get_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.TraceHistory).filter(models.TraceHistory.owner_id == current_user.id).order_by(models.TraceHistory.created_at.desc()).all()

@app.post("/history", response_model=TraceHistoryResponse)
def save_history(trace_data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_trace = models.TraceHistory(
        language=trace_data.get("language"),
        code=trace_data.get("code"),
        steps=trace_data.get("steps"),
        explanation=trace_data.get("explanation"),
        owner_id=current_user.id
    )
    db.add(new_trace)
    db.commit()
    db.refresh(new_trace)
    return new_trace

@app.delete("/history/{trace_id}")
def delete_history(trace_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    trace_to_delete = db.query(models.TraceHistory).filter(models.TraceHistory.id == trace_id, models.TraceHistory.owner_id == current_user.id).first()
    if not trace_to_delete:
        raise HTTPException(status_code=404, detail="Trace not found")
    db.delete(trace_to_delete)
    db.commit()
    return {"message": "Trace deleted"}

@app.get("/notes", response_model=List[NoteResponse])
def get_notes(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Note).filter(models.Note.owner_id == current_user.id).order_by(models.Note.created_at.desc()).all()

@app.post("/notes", response_model=NoteResponse)
def create_note(note: NoteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_note = models.Note(
        title=note.title,
        content=note.content,
        color=note.color,
        is_starred=note.is_starred,
        owner_id=current_user.id
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@app.delete("/notes/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    note_to_delete = db.query(models.Note).filter(models.Note.id == note_id, models.Note.owner_id == current_user.id).first()
    if not note_to_delete:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note_to_delete)
    db.commit()
    return {"message": "Note deleted"}

@app.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    total_traces = db.query(models.TraceHistory).filter(models.TraceHistory.owner_id == current_user.id).count()
    total_notes = db.query(models.Note).filter(models.Note.owner_id == current_user.id).count()
    
    # Get language breakdown
    from sqlalchemy import func
    lang_stats = db.query(models.TraceHistory.language, func.count(models.TraceHistory.id)).filter(models.TraceHistory.owner_id == current_user.id).group_by(models.TraceHistory.language).all()
    
    return {
        "totalTraces": total_traces,
        "totalNotes": total_notes,
        "languageBreakdown": {lang: count for lang, count in lang_stats}
    }

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/trace", response_model=List[TraceStep])
async def trace_code(request: TraceRequest):
    try:
        if request.language == Language.python:
            from tracers.python_tracer import trace as python_trace
            steps = python_trace(request.code)

        elif request.language == Language.javascript:
            from tracers.js_tracer import trace as js_trace
            steps = js_trace(request.code)

        elif request.language == Language.java:
            from tracers.java_tracer import trace as java_trace
            steps = java_trace(request.code)

        elif request.language == Language.cpp:
            from tracers.cpp_tracer import trace as cpp_trace
            steps = cpp_trace(request.code)

        else:
            raise HTTPException(status_code=400, detail="Unsupported language")

        return steps

    except Exception as e:
        return [
            TraceStep(
                step_number=1,
                line_number=0,
                line_text="",
                variables=[],
                event="error",
                output=str(e),
                scope="global",
            )
        ]


@app.post("/explain")
async def explain_step(request: ExplainRequest):
    step = request.step
    language = request.language.value

    # Build variables description
    variables_desc = ""
    if step.get("variables"):
        vars_list = [
            f"{v['name']} = {v['value']} ({v['type']})"
            for v in step["variables"]
        ]
        variables_desc = "Variables at this point: " + ", ".join(vars_list)

    # Build prompt based on event type
    if step.get("event") == "error":
        prompt = (
            f"Explain this {language} execution error in one simple sentence. "
            f"Error: {step.get('output', 'Unknown error')}. "
            f"The error happened around line {step.get('line_number', 'unknown')}. "
            "Explain what the error means and how to fix it in plain English for a beginner."
        )
    else:
        prompt = (
            f"Explain this {language} code execution step in one beginner-friendly sentence. "
            f"Line {step.get('line_number', '?')}: `{step.get('line_text', '')}`. "
            f"Event: {step.get('event', 'line')}. "
            f"{variables_desc}. "
            f"Output so far: {step.get('output', '')}. "
            f"Scope: {step.get('scope', 'global')}. "
            "Keep it simple, avoid jargon, explain what is happening in plain English."
        )

    system_instr = (
        "You are a friendly coding tutor explaining code execution to a complete beginner. "
        "Always respond in exactly one clear sentence. Never use technical jargon."
    )

    try:
        explanation = get_ai_response(prompt, system_instr)
        return {"explanation": explanation}
    except Exception as e:
        return {"explanation": f"Could not generate explanation: {str(e)}"}


@app.post("/analyze-bug")
async def analyze_bug(request: TraceRequest):
    # Run tracer to collect steps
    try:
        if request.language == Language.python:
            from tracers.python_tracer import trace as python_trace
            steps = python_trace(request.code)
        elif request.language == Language.javascript:
            from tracers.js_tracer import trace as js_trace
            steps = js_trace(request.code)
        elif request.language == Language.java:
            from tracers.java_tracer import trace as java_trace
            steps = java_trace(request.code)
        elif request.language == Language.cpp:
            from tracers.cpp_tracer import trace as cpp_trace
            steps = cpp_trace(request.code)
        else:
            steps = []
    except Exception:
        steps = []

    # Build a short trace summary for the prompt (max 30 steps)
    trace_summary = "\n".join([
        f"Step {s.step_number}: Line {s.line_number} | {s.line_text.strip()} | vars: {[v.name + '=' + v.value for v in s.variables]}"
        for s in steps[:30]
    ])

    lang_hints = {
        "python":     "Watch for: off-by-one errors, wrong indentation, mutable defaults.",
        "javascript": "Watch for: undefined vs null, var hoisting, missing return.",
        "java":       "Watch for: NullPointerException, array out of bounds, uninitialised variables.",
        "cpp":        "Watch for: uninitialised variables, array out of bounds, missing return in non-void. Explain segfaults simply.",
    }

    prompt = (
        f"Language: {request.language}\n\n"
        f"Code:\n{request.code}\n\n"
        f"Execution trace:\n{trace_summary if trace_summary else 'No steps captured — likely a compile or syntax error.'}\n\n"
        f"{lang_hints.get(request.language, '')}\n\n"
        "Respond ONLY with this exact JSON and nothing else:\n"
        "{\n"
        '  "went_wrong": "...",\n'
        '  "why_it_happened": "...",\n'
        '  "how_to_fix": "...",\n'
        '  "problematic_line_number": <integer or null>\n'
        "}"
    )

    system_instr = (
        f"You are a debugging tutor for {request.language} beginners. "
        "Explain bugs clearly in plain English. "
        "Always respond ONLY with valid JSON — no markdown, no extra text."
    )

    try:
        raw_response = get_ai_response(prompt, system_instr)

        # Strip markdown fences if any
        raw = raw_response.strip()
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else raw
            if raw.startswith("json"):
                raw = raw[4:]

        result = json.loads(raw.strip())
        return result

    except json.JSONDecodeError:
        return {
            "went_wrong": "Could not parse the bug analysis response.",
            "why_it_happened": "The model returned an unexpected format.",
            "how_to_fix": "Try running the analysis again.",
            "problematic_line_number": None,
        }
    except Exception as e:
        return {
            "went_wrong": f"Analysis failed: {str(e)}",
            "why_it_happened": "An error occurred while contacting the AI API.",
            "how_to_fix": "Check your API key and internet connection.",
            "problematic_line_number": None,
        }

if __name__ == "__main__":
    import uvicorn
    # Use 0.0.0.0 to be accessible within Docker if needed
    uvicorn.run(app, host="0.0.0.0", port=8000)

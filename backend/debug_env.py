import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)

print(f"GROQ_API_KEY: {os.getenv('GROQ_API_KEY', 'NOT SET')[:5]}...")
print(f"OPENAI_API_KEY: {os.getenv('OPENAI_API_KEY', 'NOT SET')[:5]}...")

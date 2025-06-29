import google.generativeai as genai
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
GOOGLE_GEMINI_API_KEY = "AIzaSyDlXz3d2pMsrPpDvOfbgmdNTCBdSBAzXVQ"

# Configure Gemini
genai.configure(api_key=GOOGLE_GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")

# FastAPI app
app = FastAPI()

# Allow frontend access with more specific CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600  # Cache preflight requests for 10 minutes
)

# Add middleware to handle preflight requests
@app.middleware("http")
async def add_cors_headers(request, call_next):
    if request.method == "OPTIONS":
        from fastapi.responses import Response
        response = Response(status_code=200)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Requested-With, X-Request-ID, X-Client-Version"
        return response
    return await call_next(request)

class Question(BaseModel):
    title: str
    desc: str

@app.post("/hint")
async def get_hint(q: Question):
    print(f"Received hint request for: {q.title}")
    try:
        prompt = (
            f"You're a helpful assistant that only gives high-quality, beginner-friendly HINTS (no code or full solution)."
            f"\n\nProblem Title: {q.title}\nDescription:\n{q.desc}"
            "\n\nGive a helpful hint or strategy to approach the problem."
        )

        response = model.generate_content(prompt)
        return {"hint": response.text.strip()}
    except Exception as e:
        print(f"Error in get_hint: {str(e)}")
        return {"error": str(e)}

@app.post("/solution")
async def get_solution(q: Question):
    print(f"Received solution request for: {q.title}")
    try:
        prompt = (
            f"You're a helpful assistant that only gives high-quality, beginner-friendly SOLUTIONS (no code or full solution)."
            f"\n\nProblem Title: {q.title}\nDescription:\n{q.desc}"
            "\n\nGive a helpful solution or strategy to approach the problem."
        )

        response = model.generate_content(prompt)
        return {"solution": response.text.strip()}
    except Exception as e:
        print(f"Error in get_solution: {str(e)}")
        return {"error": str(e)}
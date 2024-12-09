from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import scrubadub

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],
)

class TextInput(BaseModel):
    text: str

class TextOutput(BaseModel):
    anonymized_text: str

@app.post("/anonymize", response_model=TextOutput)
async def anonymize(input_data: TextInput):
    try:
        print("Processing new request")
        scrubbed = scrubadub.clean(input_data.text)
        return TextOutput(anonymized_text=scrubbed)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error scrubbing text")

@app.get("/", response_model=TextOutput)
async def hello():
    return TextOutput(message="Hello from the Anonymization Service!")

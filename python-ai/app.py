from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import chromadb
import os
import google.generativeai as genai
from dotenv import load_dotenv
import uuid
from fastapi.responses import StreamingResponse
import json
from pymongo import MongoClient

# ====================
# MongoDB Setup
# ====================
MONGO_URI = os.getenv("MONGO_URI")

mongo_client = MongoClient(MONGO_URI)

db = mongo_client["pdf_rag_chatbot"]

documents_collection = db["documents"]
chats_collection = db["chats"]

mongo_client.admin.command("ping")

print("✅ MongoDB Atlas Connected")
# =========================
# Load Environment Variables
# =========================
load_dotenv()

# =========================
# FastAPI App
# =========================
app = FastAPI()

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# =========================
# Gemini Setup
# =========================
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

gemini_model = genai.GenerativeModel(
    "models/gemini-flash-latest"
)

# =========================
# ChromaDB Setup
# =========================
client = chromadb.PersistentClient(path="./chroma_db")

collection = client.get_or_create_collection(
    name="documents"
)

# =========================
# Embedding Model
# =========================
embedding_model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)

# =========================
# Upload Folder
# =========================
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# =========================
# Request Models
# =========================
class ProcessRequest(BaseModel):
    documentId: str

class AskRequest(BaseModel):
    documentId: str
    question: str

# =========================
# Health Check
# =========================
@app.get("/")
def root():
    return {"message": "RAG Service Running 🚀"}

# =========================
# Upload PDF
# =========================
@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    if file.content_type != "application/pdf":
        return {
            "success": False,
            "message": "Only PDF files are allowed."
        }

    document_id = str(uuid.uuid4())

    file_path = os.path.join(UPLOAD_DIR, f"{document_id}.pdf")

    with open(file_path, "wb") as f:
        f.write(await file.read())

    return {
        "documentId": document_id,
        "filename": file.filename
    }

# =========================
# Process PDF
# =========================
@app.post("/process-pdf")
def process_pdf(data: ProcessRequest):

    file_path = f"{UPLOAD_DIR}/{data.documentId}.pdf"

    reader = PdfReader(file_path)

    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100
    )

    chunks = splitter.split_text(text)
    if not chunks:
     return {
        "success": False,
        "message": "Could not extract text from this PDF."
    }
    embeddings = embedding_model.encode(chunks).tolist()

    collection.add(
        documents=chunks,
        embeddings=embeddings,
        ids=[f"{data.documentId}_{i}" for i in range(len(chunks))],
        metadatas=[{"documentId": data.documentId} for _ in chunks]
    )

    return {
        "documentId": data.documentId,
        "chunks": len(chunks)
    }

# =========================
# Ask Question (RAG)
# =========================
# =========================
# Ask Question
# =========================

# =========================
# Ask Question - Streaming RAG
# =========================

@app.post("/ask")
def ask_question(data: AskRequest):

    print("\n==============================")
    print("QUESTION:", data.question)
    print("DOCUMENT ID:", data.documentId)
    print("==============================")

    try:

        # =========================
        # 1. Create question embedding
        # =========================

        question_embedding = embedding_model.encode(
            data.question
        ).tolist()

        # =========================
        # 2. Search ChromaDB
        # =========================

        results = collection.query(
            query_embeddings=[question_embedding],
            n_results=8,
            where={
                "documentId": data.documentId
            }
        )

        print("CHROMA RESULTS FOUND")

        # =========================
        # 3. Check results
        # =========================

        if (
            not results
            or not results.get("documents")
            or not results["documents"][0]
        ):

            print("❌ NO DOCUMENT RESULTS")

            def no_result():
                yield "Not in document"

            return StreamingResponse(
                no_result(),
                media_type="text/plain"
            )

        # =========================
        # 4. Get retrieved chunks
        # =========================

        documents = results["documents"][0]

        distances = results.get(
            "distances",
            [[]]
        )[0]

        print(
            "RETRIEVED CHUNKS:",
            len(documents)
        )

        # =========================
        # 5. Filter relevant chunks
        # =========================

        relevant_chunks = []

        for i, document in enumerate(documents):

            distance = (
                distances[i]
                if i < len(distances)
                else None
            )

            # Keep reasonably relevant results
            if (
                distance is None
                or distance < 1.2
            ):
                relevant_chunks.append(
                    document
                )

        # =========================
        # 6. Fallback
        # =========================

        if not relevant_chunks:

            relevant_chunks = documents[:3]

        # Maximum 5 chunks to Gemini
        relevant_chunks = (
            relevant_chunks[:5]
        )

        context = "\n\n---\n\n".join(
            relevant_chunks
        )

        print(
            "RELEVANT CHUNKS:",
            len(relevant_chunks)
        )

        print(
            "CONTEXT LENGTH:",
            len(context)
        )

        # =========================
        # 7. Gemini Prompt
        # =========================

        prompt = f"""
You are a document question-answering assistant.

Answer the user's question using ONLY the information contained
in the provided document context.

STRICT RULES:

1. Do not use outside knowledge.
2. Do not invent or assume information.
3. Do not say "Based on the provided document".
4. Do not mention "context".
5. Do not include a Sources section.
6. Do not repeat information.
7. If the answer is not present, respond exactly:
   "Not in document"
8. Preserve names, technologies, numbers, and terminology
   from the document.
9. Use clean Markdown.
10. Use headings, bullet points, and bold text when useful.
11. Keep the answer concise but complete.

DOCUMENT CONTEXT:

{context}

QUESTION:

{data.question}

ANSWER:
"""

        # =========================
        # 8. Streaming generator
        # =========================

        def generate():

            try:

                print(
                    "🤖 Starting Gemini stream..."
                )

                response = (
                    gemini_model.generate_content(
                        prompt,
                        stream=True
                    )
                )

                for chunk in response:

                    try:

                        text = chunk.text

                        if text:
                            print(
                                "CHUNK:",
                                text[:50]
                            )

                            yield text

                    except Exception:
                        # Some Gemini chunks may
                        # not contain text
                        continue

                print(
                    "\n✅ Gemini stream finished"
                )

            except Exception as e:

                print(
                    "❌ Streaming error:",
                    repr(e)
                )

                yield (
                    "\n\n❌ Error generating "
                    "response."
                )

        # =========================
        # 9. Return streaming response
        # =========================

        return StreamingResponse(
            generate(),
            media_type="text/plain"
        )

    except Exception as e:

        print(
            "❌ ASK ERROR:",
            repr(e)
        )

        def error_response():
            yield f"Backend error: {str(e)}"

        return StreamingResponse(
            error_response(),
            media_type="text/plain"
        )
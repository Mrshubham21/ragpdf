from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

import chromadb
import os
import uuid

import google.generativeai as genai
from dotenv import load_dotenv
from pymongo import MongoClient


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="PDF RAG Chatbot API",
    version="1.0.0"
)


# =========================================================
# ENVIRONMENT VARIABLES
# =========================================================

MONGO_URI = os.getenv("MONGO_URI")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000"
)


# =========================================================
# VALIDATE ENVIRONMENT VARIABLES
# =========================================================

if not MONGO_URI:
    print("⚠️ MONGO_URI is not configured")

if not GEMINI_API_KEY:
    print("⚠️ GEMINI_API_KEY is not configured")


# =========================================================
# CORS
# =========================================================

allowed_origins = [
    FRONTEND_URL,
    "http://localhost:3000",
]

# Remove duplicates
allowed_origins = list(set(allowed_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# MONGODB ATLAS
# =========================================================

mongo_client = None
db = None
documents_collection = None
chats_collection = None


def connect_mongodb():
    global mongo_client
    global db
    global documents_collection
    global chats_collection

    if not MONGO_URI:
        print("⚠️ MongoDB skipped: MONGO_URI not found")
        return

    try:
        mongo_client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=10000
        )

        # Test connection
        mongo_client.admin.command("ping")

        db = mongo_client["pdf_rag_chatbot"]

        documents_collection = db["documents"]
        chats_collection = db["chats"]

        print("✅ MongoDB Atlas Connected")

    except Exception as e:
        print(
            "❌ MongoDB Connection Error:",
            repr(e)
        )


# =========================================================
# GEMINI
# =========================================================

gemini_model = None


def configure_gemini():

    global gemini_model

    if not GEMINI_API_KEY:
        print(
            "⚠️ Gemini skipped: "
            "GEMINI_API_KEY not configured"
        )
        return

    try:

        genai.configure(
            api_key=GEMINI_API_KEY
        )

        gemini_model = genai.GenerativeModel(
            "models/gemini-flash-latest"
        )

        print("✅ Gemini configured")

    except Exception as e:

        print(
            "❌ Gemini configuration error:",
            repr(e)
        )


# =========================================================
# CHROMADB
# =========================================================

chroma_client = chromadb.PersistentClient(
    path="./chroma_db"
)

collection = (
    chroma_client.get_or_create_collection(
        name="documents"
    )
)

print("✅ ChromaDB initialized")


# =========================================================
# EMBEDDING MODEL
# =========================================================

embedding_model = None


def load_embedding_model():

    global embedding_model

    try:

        print(
            "🔄 Loading embedding model..."
        )

        embedding_model = SentenceTransformer(
            "sentence-transformers/all-MiniLM-L6-v2"
        )

        print(
            "✅ Embedding model loaded"
        )

    except Exception as e:

        print(
            "❌ Embedding model error:",
            repr(e)
        )

        raise


# =========================================================
# FASTAPI STARTUP
# =========================================================

@app.on_event("startup")
def startup_event():

    print("")
    print("==============================")
    print("🚀 Starting PDF RAG Service")
    print("==============================")

    # MongoDB
    connect_mongodb()

    # Gemini
    configure_gemini()

    # Embedding model
    load_embedding_model()

    print("==============================")
    print("✅ Application startup complete")
    print("==============================")


# =========================================================
# UPLOAD DIRECTORY
# =========================================================

UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


# =========================================================
# REQUEST MODELS
# =========================================================

class ProcessRequest(BaseModel):
    documentId: str


class AskRequest(BaseModel):
    documentId: str
    question: str


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/")
def root():

    return {
        "success": True,
        "message": "RAG Service Running 🚀"
    }


# =========================================================
# UPLOAD PDF
# =========================================================

@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...)
):

    # Validate file type

    if file.content_type != "application/pdf":

        return {
            "success": False,
            "message": "Only PDF files are allowed."
        }

    try:

        document_id = str(
            uuid.uuid4()
        )

        file_path = os.path.join(
            UPLOAD_DIR,
            f"{document_id}.pdf"
        )

        file_content = await file.read()

        with open(
            file_path,
            "wb"
        ) as f:

            f.write(file_content)

        print(
            "✅ PDF uploaded:",
            file.filename
        )

        print(
            "DOCUMENT ID:",
            document_id
        )

        return {

            "success": True,

            "documentId": document_id,

            "filename": file.filename
        }

    except Exception as e:

        print(
            "❌ Upload error:",
            repr(e)
        )

        return {

            "success": False,

            "message": str(e)
        }


# =========================================================
# PROCESS PDF
# =========================================================

@app.post("/process-pdf")
def process_pdf(
    data: ProcessRequest
):

    print("")
    print("==============================")
    print("📄 PROCESS PDF")
    print("DOCUMENT ID:", data.documentId)
    print("==============================")


    try:

        # -------------------------------------------------
        # Check embedding model
        # -------------------------------------------------

        if embedding_model is None:

            return {

                "success": False,

                "message":
                "Embedding model is not loaded."
            }


        # -------------------------------------------------
        # PDF path
        # -------------------------------------------------

        file_path = os.path.join(
            UPLOAD_DIR,
            f"{data.documentId}.pdf"
        )


        # -------------------------------------------------
        # Check file
        # -------------------------------------------------

        if not os.path.exists(
            file_path
        ):

            return {

                "success": False,

                "message":
                "PDF file not found."
            }


        # -------------------------------------------------
        # Read PDF
        # -------------------------------------------------

        reader = PdfReader(
            file_path
        )

        text = ""

        for page in reader.pages:

            page_text = (
                page.extract_text()
                or ""
            )

            text += page_text + "\n"


        print(
            "TEXT LENGTH:",
            len(text)
        )


        # -------------------------------------------------
        # Check extracted text
        # -------------------------------------------------

        if not text.strip():

            return {

                "success": False,

                "message":
                "Could not extract text from this PDF."
            }


        # -------------------------------------------------
        # Chunking
        # -------------------------------------------------

        splitter = (
            RecursiveCharacterTextSplitter(

                chunk_size=800,

                chunk_overlap=100,

                separators=[
                    "\n\n",
                    "\n",
                    ". ",
                    " ",
                    ""
                ]
            )
        )

        chunks = splitter.split_text(
            text
        )


        print(
            "CHUNKS:",
            len(chunks)
        )


        if not chunks:

            return {

                "success": False,

                "message":
                "No text chunks were created."
            }


        # -------------------------------------------------
        # Embeddings
        # -------------------------------------------------

        embeddings = (
            embedding_model
            .encode(
                chunks,
                show_progress_bar=False
            )
            .tolist()
        )


        # -------------------------------------------------
        # IDs
        # -------------------------------------------------

        ids = [

            f"{data.documentId}_{i}"

            for i in range(
                len(chunks)
            )
        ]


        # -------------------------------------------------
        # Metadata
        # -------------------------------------------------

        metadatas = [

            {
                "documentId":
                data.documentId
            }

            for _ in chunks
        ]


        # -------------------------------------------------
        # Add to Chroma
        # -------------------------------------------------

        collection.add(

            documents=chunks,

            embeddings=embeddings,

            ids=ids,

            metadatas=metadatas
        )


        # -------------------------------------------------
        # MongoDB document record
        # -------------------------------------------------

        if documents_collection is not None:

            documents_collection.update_one(

                {
                    "documentId":
                    data.documentId
                },

                {
                    "$set": {

                        "documentId":
                        data.documentId,

                        "chunks":
                        len(chunks),

                        "processed":
                        True
                    }
                },

                upsert=True
            )


        print(
            "✅ PDF processed successfully"
        )


        return {

            "success": True,

            "documentId":
            data.documentId,

            "chunks":
            len(chunks)
        }


    except Exception as e:

        print(
            "❌ PDF processing error:",
            repr(e)
        )

        return {

            "success": False,

            "message": str(e)
        }


# =========================================================
# ASK QUESTION - STREAMING RAG
# =========================================================

@app.post("/ask")
def ask_question(
    data: AskRequest
):

    print("")
    print("==============================")
    print("QUESTION:", data.question)
    print("DOCUMENT ID:", data.documentId)
    print("==============================")


    try:

        # -------------------------------------------------
        # Validate question
        # -------------------------------------------------

        if not data.question.strip():

            def empty_question():

                yield "Please enter a question."

            return StreamingResponse(
                empty_question(),
                media_type="text/plain"
            )


        # -------------------------------------------------
        # Validate embedding model
        # -------------------------------------------------

        if embedding_model is None:

            def model_error():

                yield (
                    "Embedding model is not loaded."
                )

            return StreamingResponse(
                model_error(),
                media_type="text/plain"
            )


        # -------------------------------------------------
        # Validate Gemini
        # -------------------------------------------------

        if gemini_model is None:

            def gemini_error():

                yield (
                    "Gemini API is not configured."
                )

            return StreamingResponse(
                gemini_error(),
                media_type="text/plain"
            )


        # -------------------------------------------------
        # Create question embedding
        # -------------------------------------------------

        question_embedding = (
            embedding_model
            .encode(
                data.question
            )
            .tolist()
        )


        # -------------------------------------------------
        # Search ChromaDB
        # -------------------------------------------------

        results = collection.query(

            query_embeddings=[
                question_embedding
            ],

            n_results=8,

            where={
                "documentId":
                data.documentId
            }
        )


        print(
            "✅ ChromaDB query completed"
        )


        # -------------------------------------------------
        # Check results
        # -------------------------------------------------

        if (

            not results

            or not results.get(
                "documents"
            )

            or not results[
                "documents"
            ][0]

        ):

            print(
                "❌ No document results"
            )


            def no_result():

                yield "Not in document"


            return StreamingResponse(

                no_result(),

                media_type="text/plain"
            )


        # -------------------------------------------------
        # Retrieved documents
        # -------------------------------------------------

        documents = (
            results[
                "documents"
            ][0]
        )


        distances = (
            results.get(
                "distances",
                [[]]
            )[0]
        )


        print(
            "RETRIEVED CHUNKS:",
            len(documents)
        )


        # -------------------------------------------------
        # Filter relevant chunks
        # -------------------------------------------------

        relevant_chunks = []


        for i, document in enumerate(
            documents
        ):

            distance = (

                distances[i]

                if i < len(distances)

                else None
            )


            # Chroma distance depends
            # on collection configuration.
            # Keep results when distance
            # isn't available or is reasonably close.

            if (

                distance is None

                or distance < 1.2

            ):

                relevant_chunks.append(
                    document
                )


        # -------------------------------------------------
        # Fallback
        # -------------------------------------------------

        if not relevant_chunks:

            relevant_chunks = (
                documents[:3]
            )


        # Maximum 5 chunks
        relevant_chunks = (
            relevant_chunks[:5]
        )


        # -------------------------------------------------
        # Build context
        # -------------------------------------------------

        context = (
            "\n\n---\n\n"
            .join(
                relevant_chunks
            )
        )


        print(
            "RELEVANT CHUNKS:",
            len(relevant_chunks)
        )

        print(
            "CONTEXT LENGTH:",
            len(context)
        )


        # -------------------------------------------------
        # Gemini Prompt
        # -------------------------------------------------

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

DOCUMENT CONTENT:

{context}

QUESTION:

{data.question}

ANSWER:
"""


        # -------------------------------------------------
        # Save user message to MongoDB
        # -------------------------------------------------

        if chats_collection is not None:

            chats_collection.insert_one({

                "documentId":
                data.documentId,

                "role":
                "user",

                "content":
                data.question
            })


        # -------------------------------------------------
        # Gemini streaming generator
        # -------------------------------------------------

        def generate():

            full_answer = ""

            try:

                print(
                    "🤖 Starting Gemini stream..."
                )


                response = (
                    gemini_model
                    .generate_content(

                        prompt,

                        stream=True
                    )
                )


                for chunk in response:

                    try:

                        text = chunk.text

                        if text:

                            full_answer += text

                            yield text

                    except Exception:

                        continue


                print(
                    "\n✅ Gemini stream finished"
                )


                # -------------------------------------------------
                # Save AI response
                # -------------------------------------------------

                if chats_collection is not None:

                    chats_collection.insert_one({

                        "documentId":
                        data.documentId,

                        "role":
                        "bot",

                        "content":
                        full_answer
                    })


            except Exception as e:

                print(
                    "❌ Streaming error:",
                    repr(e)
                )

                error_text = (
                    "\n\n❌ Error generating response."
                )

                yield error_text


        # -------------------------------------------------
        # Return streaming response
        # -------------------------------------------------

        return StreamingResponse(

            generate(),

            media_type="text/plain",

            headers={

                "Cache-Control":
                "no-cache",

                "X-Accel-Buffering":
                "no"
            }
        )


    except Exception as e:

        print(
            "❌ ASK ERROR:",
            repr(e)
        )


        def error_response():

            yield (
                f"Backend error: {str(e)}"
            )


        return StreamingResponse(

            error_response(),

            media_type="text/plain"
        )
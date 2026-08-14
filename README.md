x📄 PDF RAG Chatbot

A full-stack PDF Retrieval-Augmented Generation (RAG) chatbot that allows users to upload PDF documents, process their content, and ask AI-powered questions using semantic search, vector embeddings, ChromaDB, and Google Gemini.

🚀 Live Demo

Frontend: https://ragpdf-git-main-st689801-6062s-projects.vercel.app

Node.js API: https://ragpdf-6xru.onrender.com

Python RAG API: https://ragpdf-1.onrender.com

✨ Features
📤 Upload PDF documents
📑 Extract text from PDFs
✂️ Split documents into smaller chunks
🧠 Generate semantic embeddings
🔎 Perform similarity search using ChromaDB
🤖 Ask questions about uploaded PDFs using Google Gemini
⚡ Stream AI-generated responses
🔄 Redis-based PDF processing workflow
💬 Chat interface with multiple conversations
💾 Local chat history
🌐 Fully deployed frontend and backend
🔐 JWT authentication support
🗄️ MongoDB Atlas for document and user data
🏗️ Architecture
                    ┌─────────────────────┐
                    │      Next.js        │
                    │      Frontend       │
                    │      Vercel         │
                    └──────────┬──────────┘
                               │
                               │ HTTP / REST API
                               ▼
                    ┌─────────────────────┐
                    │   Node.js +         │
                    │   Express Backend   │
                    │      Render         │
                    └──────┬───────┬──────┘
                           │       │
                    MongoDB│       │Redis
                           │       │
                           ▼       ▼
                    ┌──────────┐ ┌──────────┐
                    │ MongoDB  │ │  Redis   │
                    │  Atlas   │ │  Queue   │
                    └──────────┘ └────┬─────┘
                                      │
                                      ▼
                           ┌──────────────────┐
                           │   Python RAG     │
                           │     FastAPI      │
                           │     Render       │
                           └────────┬─────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
             PDF Parser        Embeddings         ChromaDB
               pypdf        Sentence Transformers Vector DB
                                    │
                                    ▼
                              Google Gemini
                                    │
                                    ▼
                               AI Response
🛠️ Tech Stack
Frontend
Next.js
React
TypeScript
Tailwind CSS
Axios
Backend
Node.js
Express.js
TypeScript
MongoDB
Mongoose
Redis
JWT
Multer
AI / RAG
Python
FastAPI
LangChain
Sentence Transformers
ChromaDB
Google Gemini API
PyPDF
Deployment
Vercel
Render
MongoDB Atlas
Redis Cloud
📁 Project Structure
pdf-rag-chatbot/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts
│   │   │   └── redis.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── chatController.ts
│   │   │   └── documentController.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts
│   │   │   └── uploadMiddleware.ts
│   │   │
│   │   ├── models/
│   │   │   ├── Document.ts
│   │   │   └── User.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── chatRoutes.ts
│   │   │   └── documentRoutes.ts
│   │   │
│   │   ├── services/
│   │   │   └── pdfSubscriber.ts
│   │   │
│   │   ├── utils/
│   │   │   └── generateToken.ts
│   │   │
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── Chat.tsx
│   │   ├── Upload.tsx
│   │   └── ui/
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   │
│   ├── package.json
│   └── next.config.ts
│
├── python-ai/
│   ├── app.py
│   ├── gemni.py
│   └── requirements.txt
│
├── docker-compose.yml
├── .gitignore
└── README.md
🔄 How RAG Works

The application follows this workflow:

1. Upload PDF

The user uploads a PDF through the Next.js frontend.

Frontend
   ↓
POST /api/documents/upload
   ↓
Express Backend

The backend stores the document information in MongoDB and publishes a PDF-processing job through Redis.

2. Process PDF

The Python RAG service receives the document-processing request.

PDF
 ↓
PyPDF
 ↓
Extracted Text
 ↓
RecursiveCharacterTextSplitter
 ↓
Text Chunks
3. Generate Embeddings

Each text chunk is converted into a vector using:

sentence-transformers/all-MiniLM-L6-v2
4. Store in ChromaDB

The embeddings and document chunks are stored in ChromaDB along with the documentId.

5. Ask a Question

The user asks a question:

"What is this document about?"

The question is converted into an embedding.

6. Semantic Search

ChromaDB searches for the most relevant document chunks associated with the uploaded documentId.

7. Gemini

The retrieved chunks are passed to Gemini with instructions to answer only using the document information.

Question
   +
Relevant PDF Chunks
   ↓
Gemini
   ↓
Answer
🔌 API Endpoints
Node.js Backend
Upload PDF
POST /api/documents/upload

Uploads a PDF document.

Ask Question
POST /api/chat/ask

Example:

{
  "documentId": "document-id",
  "question": "What is this document about?"
}
Python RAG Service
Health Check
GET /
Upload PDF
POST /upload
Process PDF
POST /process-pdf
Ask Question
POST /ask
⚙️ Environment Variables
Backend

Create:

backend/.env
PORT=5000


MONGO_URI=your_mongodb_connection_string


JWT_SECRET=your_jwt_secret


REDIS_URL=your_redis_connection_string


PYTHON_AI_URL=your_python_rag_service_url


FRONTEND_URL=your_vercel_frontend_url
Python AI

Create:

python-ai/.env
GEMINI_API_KEY=your_gemini_api_key


MONGO_URI=your_mongodb_connection_string
Frontend

Create:

frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000

For production:

NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com

Never commit .env, .env.local, API keys, database passwords, or other secrets to GitHub.

💻 Run Locally
1. Clone Repository
git clone https://github.com/Mrshubham21/ragpdf.git


cd ragpdf
2. Backend
cd backend
npm install
npm run dev

Backend runs on:

http://localhost:5000
3. Frontend

Open another terminal:

cd frontend
npm install
npm run dev

Frontend runs on:

http://localhost:3000
4. Python RAG Service

Open another terminal:

cd python-ai
python -m venv venv

Windows:

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Run:

uvicorn app:app --reload --port 8000

Python service:

http://localhost:8000
🐳 Docker

The project also contains a docker-compose.yml for running supporting services.

docker compose up
🔐 Security Notes

Before using this project in a larger production environment, consider adding:

File-size limits
Stronger PDF validation
Rate limiting
Authentication on all sensitive endpoints
Persistent object storage for uploaded PDFs
Persistent vector database storage
Input validation
Better error handling
API monitoring
Secret rotation
HTTPS-only communication
🚀 Deployment
Frontend

The Next.js application is deployed using Vercel.

Backend

The Express API is deployed using Render.

Python AI

The FastAPI RAG service is deployed using Render.

Database

MongoDB is hosted using MongoDB Atlas.

Redis

Redis is hosted using Redis Cloud.

📌 Future Improvements
 Persistent cloud PDF storage
 Document processing progress
 MongoDB-based chat history
 User-specific document management
 Better semantic retrieval
 Hybrid keyword + vector search
 Streaming responses
 Citation support
 Multiple PDF conversations
 PDF preview
 Document deletion
 Production monitoring
 Rate limiting
⭐ Project

If you find this project useful, consider giving it a ⭐ on GitHub.

Built with Next.js, Node.js, Python, ChromaDB, Redis, MongoDB, and Gemini.
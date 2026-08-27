# 📄 PDF RAG Chatbot

A full-stack **PDF Retrieval-Augmented Generation (RAG) chatbot** that allows users to upload PDF documents, process their content, perform semantic search, and ask AI-powered questions using **Google Gemini**.

The application combines **Next.js, React, TypeScript, Node.js, Express.js, Python FastAPI, ChromaDB, Sentence Transformers, MongoDB Atlas, and Redis Cloud** into a complete RAG-based architecture.

## 🚀 Live Demo

**Frontend:** https://ragpdf-git-main-st689801-6062s-projects.vercel.app

**Node.js Backend:** https://ragpdf-6xru.onrender.com

**Python RAG API:** https://ragpdf-2.onrender.com

## ✨ Features

- 📤 Upload PDF documents
- 📑 Extract text from PDF files
- ✂️ Split documents into smaller chunks
- 🧠 Generate semantic embeddings
- 🔎 Perform similarity search using ChromaDB
- 🤖 Ask questions about uploaded PDFs using Google Gemini
- ⚡ Stream AI-generated responses
- 🔄 Redis-based PDF processing workflow
- 💬 Chat interface
- 🗂️ Multiple conversations
- 💾 Local chat history
- 🗄️ MongoDB Atlas document storage
- 🔐 JWT authentication support
- 🌐 Deployed frontend and backend
- 🔗 REST API architecture

## 🏗️ Architecture

```text
                         ┌─────────────────────────┐
                         │        Next.js           │
                         │        Frontend          │
                         │         Vercel           │
                         └────────────┬────────────┘
                                      │
                                      │ HTTP / REST API
                                      ▼
                         ┌─────────────────────────┐
                         │     Node.js + Express   │
                         │        Backend          │
                         │         Render          │
                         └───────────┬───────┬─────┘
                                     │       │
                              MongoDB│       │Redis
                                     │       │
                                     ▼       ▼
                              ┌──────────┐ ┌──────────┐
                              │ MongoDB  │ │  Redis   │
                              │  Atlas   │ │  Cloud   │
                              └──────────┘ └────┬─────┘
                                               │
                                               │ PDF Job
                                               ▼
                                    ┌────────────────────┐
                                    │    Python RAG      │
                                    │      FastAPI       │
                                    │       Render       │
                                    └─────────┬──────────┘
                                              │
                         ┌────────────────────┼────────────────────┐
                         │                    │                    │
                         ▼                    ▼                    ▼
                   ┌──────────┐       ┌──────────────┐      ┌──────────┐
                   │  PyPDF   │       │   Sentence   │      │ ChromaDB │
                   │  Parser  │       │ Transformers │      │ Vector DB│
                   └──────────┘       └──────────────┘      └────┬─────┘
                                                                   │
                                                                   ▼
                                                          ┌────────────────┐
                                                          │ Google Gemini  │
                                                          │      LLM       │
                                                          └───────┬────────┘
                                                                  │
                                                                  ▼
                                                               Answer
```

## 🛠️ Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- Redis
- JWT
- Multer

### AI / RAG
- Python
- FastAPI
- LangChain
- PyPDF
- Sentence Transformers
- ChromaDB
- Google Gemini API

### Database & Infrastructure
- MongoDB Atlas
- Redis Cloud
- Vercel
- Render
- Docker

## 📁 Project Structure

```text
pdf-rag-chatbot/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts
│   │   │   └── redis.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── chatController.ts
│   │   │   └── documentController.ts
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts
│   │   │   └── uploadMiddleware.ts
│   │   ├── models/
│   │   │   ├── Document.ts
│   │   │   └── User.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── chatRoutes.ts
│   │   │   └── documentRoutes.ts
│   │   ├── services/
│   │   │   └── pdfSubscriber.ts
│   │   ├── utils/
│   │   │   └── generateToken.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Chat.tsx
│   │   ├── Upload.tsx
│   │   └── ui/
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
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
```

## 🔄 How RAG Works

### 1. Upload PDF

```text
User
  ↓
Next.js Frontend
  ↓
POST /api/documents/upload
  ↓
Node.js / Express Backend
  ↓
MongoDB Atlas
```

The backend stores document metadata and publishes a PDF-processing job through Redis.

### 2. Process PDF

```text
PDF
 ↓
PyPDF
 ↓
Extracted Text
 ↓
RecursiveCharacterTextSplitter
 ↓
Text Chunks
```

### 3. Generate Embeddings

Each text chunk is converted into a vector using:

```text
sentence-transformers/all-MiniLM-L6-v2
```

### 4. Store in ChromaDB

The text chunks and embeddings are stored in ChromaDB along with the `documentId`.

### 5. Ask a Question

Example:

```text
What is this document about?
```

The question is converted into an embedding using the same embedding model.

### 6. Semantic Search

ChromaDB searches for the most relevant chunks associated with the selected `documentId`.

```text
Question
   ↓
Question Embedding
   ↓
ChromaDB
   ↓
Relevant PDF Chunks
```

### 7. Generate AI Answer

```text
Question
   +
Relevant PDF Chunks
   ↓
Google Gemini
   ↓
AI Generated Answer
```

## 🔌 API Endpoints

### Node.js Backend

#### Upload PDF

```http
POST /api/documents/upload
```

#### Ask Question

```http
POST /api/chat/ask
```

Example:

```json
{
  "documentId": "document-id",
  "question": "What is this document about?"
}
```

### Python RAG Service

#### Health Check

```http
GET /
```

#### Upload PDF

```http
POST /upload
```

#### Process PDF

```http
POST /process-pdf
```

Example:

```json
{
  "documentId": "document-id"
}
```

#### Ask Question

```http
POST /ask
```

Example:

```json
{
  "documentId": "document-id",
  "question": "What is this document about?"
}
```

## ⚙️ Environment Variables

### Backend

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_connection_string
PYTHON_AI_URL=your_python_rag_service_url
FRONTEND_URL=your_vercel_frontend_url
```

### Python AI

Create `python-ai/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
MONGO_URI=your_mongodb_connection_string
```

### Frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

For production:

```env
NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com
```

> ⚠️ Never commit `.env`, `.env.local`, API keys, database passwords, JWT secrets, or Redis credentials to GitHub.

## 💻 Run Locally

### 1. Clone Repository

```bash
git clone https://github.com/Mrshubham21/ragpdf.git
cd ragpdf
```

### 2. Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend:

```text
http://localhost:5000
```

### 3. Start Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

### 4. Start Python RAG Service

```bash
cd python-ai
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Linux / macOS:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn app:app --reload --port 8000
```

Python RAG API:

```text
http://localhost:8000
```

## 🐳 Docker

```bash
docker compose up
```

For detached mode:

```bash
docker compose up -d
```

## 🚀 Deployment

| Service | Platform |
|---|---|
| Next.js Frontend | Vercel |
| Node.js Backend | Render |
| Python RAG API | Render |
| Database | MongoDB Atlas |
| Redis | Redis Cloud |

## 🔐 Security Considerations

For a larger production deployment, consider adding:

- File-size limits
- Stronger PDF validation
- Rate limiting
- Authentication on sensitive endpoints
- Persistent cloud object storage
- Persistent vector database storage
- Input validation
- Improved error handling
- API monitoring
- Secret rotation
- HTTPS-only communication

## 📈 Future Improvements

- [ ] Persistent cloud PDF storage
- [ ] Document processing progress indicator
- [ ] MongoDB-based chat history
- [ ] User-specific document management
- [ ] Improved semantic retrieval
- [ ] Hybrid keyword + vector search
- [ ] Improved streaming responses
- [ ] Source citations
- [ ] Multiple PDF conversations
- [ ] PDF preview
- [ ] Document deletion
- [ ] Production monitoring
- [ ] Rate limiting
- [ ] Better error handling

## 🎯 What I Learned

Building this project provided practical experience with:

- Full-stack application architecture
- REST API development
- PDF processing
- Retrieval-Augmented Generation
- Vector embeddings
- Vector databases
- Semantic search
- Large Language Models
- Redis-based asynchronous processing
- MongoDB Atlas
- JWT authentication
- CORS configuration
- Cloud deployment
- Vercel
- Render
- Production debugging

GitHub: https://github.com/Mrshubham21/ragpdf

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.

---

### 🧰 Built With

**Next.js · React · TypeScript · Tailwind CSS · Node.js · Express.js · Python · FastAPI · LangChain · PyPDF · Sentence Transformers · ChromaDB · Google Gemini · MongoDB Atlas · Redis Cloud · Vercel · Render**

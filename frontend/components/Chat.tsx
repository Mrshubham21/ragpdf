"use client";

import remarkGfm from "remark-gfm";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "bot";
  content: string;
  sources?: string[];
}

interface ChatProps {
  documentId: string;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
}

export default function Chat({ documentId, messages, setMessages }: ChatProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // =========================
  // SAFE MESSAGES
  // =========================

  const safeMessages = Array.isArray(messages) ? messages : [];

  // =========================
  // AUTO SCROLL
  // =========================

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [safeMessages]);

  // =========================
  // ASK QUESTION
  // =========================

  const handleAsk = async () => {
    // =========================
    // VALIDATION
    // =========================

    if (!question.trim()) {
      return;
    }

    if (!documentId) {
      alert("Please upload a PDF first ⚠️");
      return;
    }

    if (loading) {
      return;
    }

    // =========================
    // CURRENT QUESTION
    // =========================

    const currentQuestion = question.trim();

    // =========================
    // USER MESSAGE
    // =========================

    const userMessage: Message = {
      role: "user",
      content: currentQuestion,
    };

    const updatedMessages = [...safeMessages, userMessage];

    setMessages(updatedMessages);
    setQuestion("");
    setLoading(true);

    try {
      // =========================
      // API URL
      // =========================

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

      // =========================
      // STREAM FROM FASTAPI
      // =========================

      const response = await fetch(`${API_URL}/ask`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          documentId,
          question: currentQuestion,
        }),
      });

      // =========================
      // CHECK RESPONSE
      // =========================

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body received");
      }

      // =========================
      // EMPTY BOT MESSAGE
      // =========================

      let botAnswer = "";

      setMessages([
        ...updatedMessages,
        {
          role: "bot",
          content: "",
        },
      ]);

      // =========================
      // READ STREAM
      // =========================

      const reader = response.body.getReader();

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Convert bytes → text
        const chunk = decoder.decode(value, {
          stream: true,
        });

        // Add chunk
        botAnswer += chunk;

        // Update bot message
        setMessages([
          ...updatedMessages,
          {
            role: "bot",
            content: botAnswer,
          },
        ]);
      }

      // Flush remaining decoder data
      const remaining = decoder.decode();

      if (remaining) {
        botAnswer += remaining;

        setMessages([
          ...updatedMessages,
          {
            role: "bot",
            content: botAnswer,
          },
        ]);
      }

      console.log("✅ Streaming completed");
    } catch (error) {
      console.error("Ask error:", error);

      setMessages([
        ...updatedMessages,
        {
          role: "bot",
          content:
            "Sorry, something went wrong while processing your question.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#343541]">
      {/* =========================
          HEADER
      ========================= */}

      <div className="border-b border-gray-700 p-4">
        <div className="text-lg font-semibold">💬 PDF Assistant</div>
      </div>

      {/* =========================
          MESSAGES
      ========================= */}

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* EMPTY STATE */}

        {safeMessages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-4">📄</div>

              <h2 className="text-xl mb-2">Ask your PDF</h2>

              <p className="text-sm">
                Upload a PDF and start asking questions.
              </p>
            </div>
          </div>
        )}

        {/* MESSAGE LIST */}

        {safeMessages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {/* =====================
                  AI ICON
              ===================== */}

            {msg.role === "bot" && (
              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-semibold shrink-0">
                AI
              </div>
            )}

            {/* =====================
                  MESSAGE BUBBLE
              ===================== */}

            <div
              className={`max-w-[75%] rounded-xl px-4 py-3 leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-[#444654] text-white"
              }`}
            >
              {/* =====================
                    MARKDOWN / THINKING
                ===================== */}

              {msg.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ ...props }) => (
                      <h1 className="text-2xl font-bold mb-3" {...props} />
                    ),

                    h2: ({ ...props }) => (
                      <h2 className="text-xl font-bold mb-3" {...props} />
                    ),

                    h3: ({ ...props }) => (
                      <h3
                        className="text-lg font-semibold mt-4 mb-2"
                        {...props}
                      />
                    ),

                    p: ({ ...props }) => (
                      <p className="mb-3 last:mb-0" {...props} />
                    ),

                    ul: ({ ...props }) => (
                      <ul
                        className="list-disc ml-5 space-y-1 mb-3"
                        {...props}
                      />
                    ),

                    ol: ({ ...props }) => (
                      <ol
                        className="list-decimal ml-5 space-y-1 mb-3"
                        {...props}
                      />
                    ),

                    li: ({ ...props }) => <li className="text-sm" {...props} />,

                    strong: ({ ...props }) => (
                      <strong className="font-semibold" {...props} />
                    ),

                    code: ({ ...props }) => (
                      <code
                        className="bg-black/30 rounded px-1.5 py-0.5 text-sm"
                        {...props}
                      />
                    ),

                    blockquote: ({ ...props }) => (
                      <blockquote
                        className="border-l-4 border-gray-500 pl-4 italic my-3 text-gray-300"
                        {...props}
                      />
                    ),

                    a: ({ ...props }) => (
                      <a
                        className="underline text-blue-300 hover:text-blue-200"
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                      />
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                loading &&
                msg.role === "bot" && (
                  <span className="animate-pulse text-gray-300">
                    AI is thinking...
                  </span>
                )
              )}

              {/* =====================
                    SOURCES
                ===================== */}

              {msg.sources && msg.sources.length > 0 && (
                <details className="mt-4 pt-3 border-t border-gray-600">
                  <summary className="cursor-pointer text-xs font-semibold text-gray-300">
                    View sources
                  </summary>

                  <div className="mt-2 space-y-2">
                    {msg.sources.map((source, sourceIndex) => (
                      <div
                        key={sourceIndex}
                        className="text-xs text-gray-400 bg-black/20 rounded p-2"
                      >
                        {source.slice(0, 200)}

                        {source.length > 200 ? "..." : ""}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* =====================
                  USER ICON
              ===================== */}

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs shrink-0">
                U
              </div>
            )}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* =========================
          INPUT
      ========================= */}

      <div className="border-t border-gray-700 p-4">
        <div className="flex gap-2">
          <input
            disabled={!documentId || loading}
            className="flex-1 bg-[#40414f] text-white px-4 py-3 rounded-lg outline-none placeholder-gray-400 disabled:opacity-50"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={documentId ? "Message PDF..." : "Upload PDF first..."}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
          />

          <button
            disabled={!documentId || loading || !question.trim()}
            onClick={handleAsk}
            className="bg-white text-black px-5 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

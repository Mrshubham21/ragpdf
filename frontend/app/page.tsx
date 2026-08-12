"use client";

import { useEffect, useState } from "react";
import Chat from "@/components/Chat";
import Upload from "@/components/Upload";

interface Message {
  role: "user" | "bot";
  content: string;
  sources?: string[];
}

interface ChatData {
  id: string;
  title: string;
  messages: Message[];
}

export default function Home() {
  const [chats, setChats] = useState<ChatData[]>([]);
  const [activeChatId, setActiveChatId] =
    useState<string | null>(null);

  const [docId, setDocId] = useState("");

  // =========================
  // LOAD CHAT HISTORY
  // =========================

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem("chats");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleanedChats: ChatData[] =
            parsed.map((chat: any) => ({
              id: String(chat.id),
              title:
                chat.title || "New Chat",
              messages: Array.isArray(
                chat.messages
              )
                ? chat.messages
                : [],
            }));

          setChats(cleanedChats);

          setActiveChatId(
            cleanedChats[0].id
          );

          return;
        }
      }

      // =========================
      // CREATE FIRST CHAT
      // =========================

      const firstChat: ChatData = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: [],
      };

      setChats([firstChat]);
      setActiveChatId(firstChat.id);

    } catch (error) {
      console.error(
        "Failed to load chat history:",
        error
      );

      const firstChat: ChatData = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: [],
      };

      setChats([firstChat]);
      setActiveChatId(firstChat.id);
    }
  }, []);

  // =========================
  // SAVE CHAT HISTORY
  // =========================

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem(
        "chats",
        JSON.stringify(chats)
      );
    }
  }, [chats]);

  // =========================
  // CREATE NEW CHAT
  // =========================

  const createNewChat = () => {
    const newChat: ChatData = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
    };

    setChats((prev) => [
      newChat,
      ...prev,
    ]);

    setActiveChatId(newChat.id);

    // New chat needs a new PDF
    setDocId("");
  };

  // =========================
  // DELETE CHAT
  // =========================

  const deleteChat = (id: string) => {
    setChats((prev) => {
      const updated = prev.filter(
        (chat) => chat.id !== id
      );

      if (id === activeChatId) {
        setActiveChatId(
          updated[0]?.id || null
        );
      }

      return updated;
    });

    if (id === activeChatId) {
      setDocId("");
    }
  };

  // =========================
  // ACTIVE CHAT
  // =========================

  const activeChat = chats.find(
    (chat) =>
      chat.id === activeChatId
  );

  // =========================
  // UPDATE MESSAGES
  // =========================

  const setMessages = (
    newMessages: Message[]
  ) => {
    setChats((prev) =>
      prev.map((chat) => {

        if (
          chat.id !== activeChatId
        ) {
          return chat;
        }

        let title = chat.title;

        // Automatically name chat
        // after first question
        if (
          chat.messages.length === 0 &&
          newMessages.length > 0
        ) {
          const firstUserMessage =
            newMessages.find(
              (message) =>
                message.role === "user"
            );

          if (firstUserMessage) {
            title =
              firstUserMessage.content.slice(
                0,
                30
              );

            if (
              firstUserMessage.content.length >
              30
            ) {
              title += "...";
            }
          }
        }

        return {
          ...chat,

          messages: Array.isArray(
            newMessages
          )
            ? newMessages
            : [],

          title,
        };
      })
    );
  };

  return (
    <div className="flex h-screen bg-[#343541] text-white">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="w-64 bg-[#202123] p-3 flex flex-col">

        <button
          onClick={createNewChat}
          className="border border-gray-500 rounded-md p-3 mb-4 hover:bg-gray-700 transition"
        >
          + New Chat
        </button>

        <div className="flex-1 overflow-y-auto space-y-2">

          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center gap-2 p-2 rounded-md ${
                chat.id === activeChatId
                  ? "bg-[#343541]"
                  : "hover:bg-gray-700"
              }`}
            >

              <button
                onClick={() => {
                  setActiveChatId(
                    chat.id
                  );

                  setDocId("");
                }}
                className="flex-1 text-left truncate"
              >
                {chat.title}
              </button>

              <button
                onClick={() =>
                  deleteChat(chat.id)
                }
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
              >
                🗑
              </button>

            </div>
          ))}

        </div>

      </aside>

      {/* =========================
          MAIN
      ========================= */}

      <main className="flex-1 flex flex-col min-w-0">

        {/* =========================
            UPLOAD
        ========================= */}

        <div className="border-b border-gray-700 p-3">

          <Upload
            setDocId={setDocId}
          />

        </div>

        {/* =========================
            CHAT
        ========================= */}

        <div className="flex-1 min-h-0">

          {activeChat ? (
            <Chat
              documentId={docId}
              messages={
                Array.isArray(
                  activeChat.messages
                )
                  ? activeChat.messages
                  : []
              }
              setMessages={setMessages}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Loading chat...
            </div>
          )}

        </div>

      </main>

    </div>
  );
}
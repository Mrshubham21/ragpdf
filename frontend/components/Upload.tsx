"use client";

import { useState } from "react";
import { API } from "@/lib/api";

export default function Upload({ setDocId }: any) {
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: File) => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await API.post(
        "/api/documents/upload",
        formData
      );

      console.log("UPLOAD RESPONSE:", res.data);

      const documentId = res.data.document._id;

      console.log("DOCUMENT ID:", documentId);

      setDocId(documentId);
      setFileName(file.name);

    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#343541] border-b border-gray-700 p-3 flex items-center gap-3">
      <label className="cursor-pointer bg-[#40414f] px-3 py-1 rounded text-sm hover:bg-gray-600">
        📄 Upload PDF

        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (file) {
              handleUpload(file);
            }
          }}
        />
      </label>

      {loading && (
        <span className="text-sm text-gray-400">
          Processing...
        </span>
      )}

      {fileName && (
        <span className="text-sm text-gray-300">
          {fileName} ✅
        </span>
      )}
    </div>
  );
}
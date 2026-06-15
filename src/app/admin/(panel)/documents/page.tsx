"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Upload, Trash2, Loader2 } from "lucide-react";

type Doc = {
  id: string;
  filename: string;
  createdAt: string;
  _count: { chunks: number };
};

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadDocs() {
    const res = await fetch("/api/documents");
    if (res.ok) setDocs(await res.json());
  }

  useEffect(() => {
    loadDocs();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setSuccess("");
    setUploading(true);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/documents", { method: "POST", body: form });
    const data = await res.json();

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";

    if (!res.ok) {
      setError(data.error ?? "Error al subir el archivo");
    } else {
      setSuccess(`PDF procesado — ${data.chunks} fragmentos indexados`);
      loadDocs();
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch("/api/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeletingId(null);
    if (res.ok) {
      setDocs((prev) => prev.filter((d) => d.id !== id));
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900">Documentos</h1>

      {/* Upload */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Subir PDF</h2>

        <label
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${
            uploading
              ? "border-gray-200 bg-gray-50 cursor-not-allowed"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
              <span className="text-sm text-gray-400">Procesando PDF…</span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-gray-400" />
              <span className="text-sm text-gray-500">
                Haz clic o arrastra un PDF aquí
              </span>
              <span className="text-xs text-gray-400">Máximo 10MB</span>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            disabled={uploading}
            onChange={handleUpload}
            className="hidden"
          />
        </label>

        {error && (
          <p className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
            {success}
          </p>
        )}
      </div>

      {/* List */}
      <div className="space-y-2">
        {docs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
            <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No hay documentos aún</p>
          </div>
        ) : (
          docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {doc.filename}
                  </p>
                  <p className="text-xs text-gray-400">
                    {doc._count.chunks} fragmentos ·{" "}
                    {new Date(doc.createdAt).toLocaleDateString("es", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                disabled={deletingId === doc.id}
                className="shrink-0 ml-4 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                {deletingId === doc.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

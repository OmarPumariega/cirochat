"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { LogOut, KeyRound, ChevronDown, Loader2 } from "lucide-react";
import type { Session } from "next-auth";

export default function AdminHeader({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowPasswordForm(false);
        setMsg(null);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/me/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setMsg({ type: "ok", text: "Contraseña actualizada" });
      setCurrent("");
      setNext("");
    } else {
      setMsg({ type: "err", text: data.error ?? "Error al cambiar contraseña" });
    }
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      <div />
      <div ref={ref} className="relative flex items-center gap-4">
        <button
          onClick={() => { setOpen((v) => !v); setShowPasswordForm(false); setMsg(null); }}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span>{session.user?.email}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {open && (
          <div className="absolute right-0 top-9 w-72 bg-white rounded-xl border border-gray-100 shadow-lg z-50 overflow-hidden">
            {!showPasswordForm ? (
              <>
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs text-gray-400">Sesión iniciada como</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{session.user?.email}</p>
                </div>
                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <KeyRound className="h-4 w-4" />
                    Cambiar contraseña
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: "/admin/login" })}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleChangePassword} className="p-4 space-y-3">
                <p className="text-sm font-medium text-gray-800">Cambiar contraseña</p>
                <input
                  type="password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  placeholder="Contraseña actual"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
                  required
                />
                <input
                  type="password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder="Nueva contraseña (mín. 8 caracteres)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
                  required
                  minLength={8}
                />
                {msg && (
                  <p className={`text-xs px-2 py-1 rounded ${msg.type === "ok" ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>
                    {msg.text}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowPasswordForm(false); setMsg(null); }}
                    className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Guardar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

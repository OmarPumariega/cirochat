"use client";

import { useState, useEffect } from "react";
import { Loader2, UserPlus, Trash2, Eye, EyeOff, ShieldCheck, User } from "lucide-react";

type UserRow = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCreating(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      setError(data.error ?? "Error al crear usuario");
    } else {
      setSuccess(`Usuario ${data.email} creado correctamente`);
      setEmail("");
      setPassword("");
      loadUsers();
    }
  }

  async function handleDelete(id: string, userEmail: string) {
    if (!confirm(`¿Eliminar al usuario ${userEmail}?`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al eliminar usuario");
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-semibold text-gray-900">Usuarios</h1>

      {/* Lista de usuarios */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Usuarios activos</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No hay usuarios</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  {u.role === "superadmin"
                    ? <ShieldCheck className="h-4 w-4 text-gray-600" />
                    : <User className="h-4 w-4 text-gray-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{u.email}</p>
                  <p className="text-xs text-gray-400">
                    {u.role === "superadmin" ? "Super admin" : "Admin"}
                  </p>
                </div>
                {u.role !== "superadmin" && (
                  <button
                    onClick={() => handleDelete(u.id, u.email)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Crear usuario */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Crear usuario</h2>

        <form onSubmit={handleCreate} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); setSuccess(""); }}
            placeholder="email@cliente.com"
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
          />
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); setSuccess(""); }}
              placeholder="Contraseña (mín. 8 caracteres)"
              required
              minLength={8}
              className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">{success}</p>}

          <button
            type="submit"
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Crear usuario
          </button>
        </form>
      </div>
    </div>
  );
}

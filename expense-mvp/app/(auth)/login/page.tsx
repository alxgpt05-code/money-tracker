"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("demo");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "Не удалось войти" }));
      setError(data.error || "Не удалось войти");
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <main className="app-shell" style={{ display: "grid", alignContent: "center", gap: 26 }}>
      <div className="login-logo" aria-hidden>
        M<span className="pink">O</span>
        <br />
        NE
        <br />Y
      </div>

      <form onSubmit={onSubmit} className="stack" style={{ padding: "0 22px" }}>
        <input className="input" placeholder="Почта" value={userId} onChange={(event) => setUserId(event.target.value)} />
        <input className="input" type="password" placeholder="Пароль" value={password} onChange={(event) => setPassword(event.target.value)} />

        <button className="button" style={{ background: "transparent", color: "#f2f2f2", border: "1px solid var(--accent-line)" }} disabled={loading}>
          {loading ? "Входим..." : "Войти"}
        </button>

        {error ? <p style={{ color: "#fda4af", margin: 0, textAlign: "center" }}>{error}</p> : null}
      </form>
    </main>
  );
}

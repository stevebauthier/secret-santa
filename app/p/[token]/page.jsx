"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ParticipantPage() {
  const params = useParams();
  const token = params.token;
  const [me, setMe] = useState(null);
  const [everyone, setEveryone] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/participants?token=${token}`);
      const data = await res.json();
      setMe(data.me || null);
      setEveryone(data.participants || []);
    }
    load();
  }, [token]);

  async function submitSuggestion(e) {
    e.preventDefault();
    if (!me?.id) return;
    setLoading(true);
    try {
      const targetId = document.getElementById("targetId").value;
      await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, targetId, text }),
      });
      setText("");
      alert("Suggestion added!");
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!me) return <p>Loading…</p>;

  return (
    <div>
      <h1>Hello {me.name}!</h1>
      <p>
        You are gifting to:{" "}
        <strong>{me.assignedToName || "— not yet assigned"}</strong>
      </p>

      <h2 style={{ marginTop: 24 }}>Add a suggestion for anyone</h2>
      <form
        onSubmit={submitSuggestion}
        style={{ display: "grid", gap: 8, maxWidth: 600 }}
      >
        <select id="targetId">
          {everyone
            .filter((p) => p.id !== me.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.surname} {p.nickname ? `(${p.nickname})` : ""}
              </option>
            ))}
        </select>
        <textarea
          required
          rows={4}
          placeholder="Gift idea…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button disabled={loading}>Submit</button>
      </form>

      <p style={{ marginTop: 16, opacity: 0.8 }}>
        You’ll receive email notifications when someone adds a suggestion for
        the person you’ve been assigned.
      </p>
    </div>
  );
}

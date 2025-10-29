"use client";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [participants, setParticipants] = useState([]);
  const [form, setForm] = useState({
    name: "",
    surname: "",
    nickname: "",
    email: "",
  });
  const [template, setTemplate] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchAll() {
    const [pRes, sRes] = await Promise.all([
      fetch("/api/participants"),
      fetch("/api/participants?settings=1"),
    ]);
    const p = await pRes.json();
    const s = await sRes.json();
    setParticipants(p.participants || []);
    setTemplate(s.settings?.messageTemplate || "");
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function addParticipant(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ name: "", surname: "", nickname: "", email: "" });
      await fetchAll();
    } finally {
      setLoading(false);
    }
  }

  async function saveTemplate() {
    setLoading(true);
    try {
      await fetch("/api/participants?settings=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageTemplate: template }),
      });
      await fetchAll();
    } finally {
      setLoading(false);
    }
  }

  async function assignAndEmail() {
    if (!confirm("Run assignments and send emails to all participants?"))
      return;
    setLoading(true);
    try {
      const res = await fetch("/api/assign", { method: "POST" });
      const data = await res.json();
      alert(data.message || "Done");
      await fetchAll();
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Admin</h1>

      <section style={{ marginTop: 24 }}>
        <h2>Add Participant</h2>
        <form
          onSubmit={addParticipant}
          style={{ display: "grid", gap: 8, maxWidth: 480 }}
        >
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            required
            placeholder="Surname"
            value={form.surname}
            onChange={(e) => setForm({ ...form, surname: e.target.value })}
          />
          <input
            placeholder="Nickname"
            value={form.nickname}
            onChange={(e) => setForm({ ...form, nickname: e.target.value })}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <button disabled={loading}>Add</button>
        </form>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Message Template</h2>
        <p>
          Use placeholders:{" "}
          <code>{`{{giverName}} {{receiverName}} {{receiverNickname}} {{receiverEmail}} {{participantLink}}`}</code>
        </p>
        <textarea
          rows={10}
          style={{ width: "100%", maxWidth: 700 }}
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        />
        <div style={{ marginTop: 8 }}>
          <button onClick={saveTemplate} disabled={loading}>
            Save Template
          </button>
          <button
            onClick={() =>
              setTemplate(
                `Hey {{giverName}}!\n\nYou’ve been assigned: {{receiverName}} ({{receiverNickname}})\nContact: {{receiverEmail}}\n\nManage suggestions here:\n{{participantLink}}\n\nHappy gifting! 🎄`
              )
            }
            style={{ marginLeft: 8 }}
          >
            Reset to Default
          </button>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Participants</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Name</th>
              <th align="left">Surname</th>
              <th align="left">Nickname</th>
              <th align="left">Email</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.surname}</td>
                <td>{p.nickname || "—"}</td>
                <td>{p.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: 24 }}>
        <button
          onClick={assignAndEmail}
          disabled={loading || participants.length < 2}
        >
          Assign & Send Emails
        </button>
      </section>
    </div>
  );
}

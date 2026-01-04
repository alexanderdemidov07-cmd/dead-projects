"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (!title.trim()) {
      setStatus("Please enter a title.");
      return;
    }
    if (!file) {
      setStatus("Please choose an audio file (mp3/m4a/wav).");
      return;
    }

    setBusy(true);

    try {
      const ext = file.name.split(".").pop() || "audio";
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const path = `projects/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("project-audio")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "audio/mpeg",
        });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("projects").insert({
        title: title.trim(),
        context: context.trim() || null,
        audio_path: path,
      });

      if (insertError) throw insertError;

      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message ?? "Something went wrong"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: 16 }}>
      <a href="/" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Back
      </a>

      <h1 style={{ fontSize: 24, fontWeight: 700 }}>New Project</h1>
      <p style={{ marginTop: 8, color: "#555" }}>
        Share something unfinished. Let people respond.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: 18 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., ‘Second verse never came’"
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 10,
            border: "1px solid #ccc",
          }}
        />

        <label
          style={{
            display: "block",
            fontWeight: 600,
            marginTop: 14,
            marginBottom: 6,
          }}
        >
          Context (optional)
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="If you want: what feels unfinished, or what you’re hoping someone hears."
          rows={4}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 10,
            border: "1px solid #ccc",
          }}
        />

        <label
          style={{
            display: "block",
            fontWeight: 600,
            marginTop: 14,
            marginBottom: 6,
          }}
        >
          Audio file
        </label>

        <div style={{ marginTop: 10 }}>
          <label
            style={{
              display: "block",
              border: "2px dashed #bbb",
              borderRadius: 14,
              padding: 16,
              cursor: "pointer",
              background: file ? "#f7f7f7" : "transparent",
            }}
          >
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={{ display: "none" }}
            />

            <div style={{ fontWeight: 700 }}>
              {file ? "Audio selected" : "Upload an audio file"}
            </div>

            <div style={{ marginTop: 6, color: "#666" }}>
              {file
                ? file.name
                : "Click to choose a file (mp3, wav, m4a). You can replace it anytime."}
            </div>

            {file && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setFile(null);
                }}
                style={{
                  marginTop: 10,
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #aaa",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Remove file
              </button>
            )}
          </label>
        </div>

        <button
          type="submit"
          disabled={busy}
          style={{
            marginTop: 18,
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #111",
            background: busy ? "#ddd" : "#111",
            color: busy ? "#333" : "#fff",
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Uploading…" : "Publish"}
        </button>

        {status && (
          <div style={{ marginTop: 12, color: "#b00020" }}>{status}</div>
        )}
      </form>
    </main>
  );
}

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

    if (!file) {
      setStatus("Please choose an audio file.");
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
        title: title.trim() || "Untitled",
        context: context.trim() || null,
        audio_path: path,
      });

      if (insertError) throw insertError;

      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setStatus(err?.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dp-page">
      <div className="dp-wrap">
        <a href="/" className="dp-meta hover:text-white">
          ← Back
        </a>

        <div className="mt-4">
          <h1 className="dp-title">New Project</h1>
          <p className="dp-subtitle">
            Share something unfinished. Let people respond.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 dp-card">
          <label className="dp-meta">Title</label>
          <input
            className="dp-input mt-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name it (or don’t)"
          />

          <div className="mt-5">
            <label className="dp-meta">Context (optional)</label>
            <textarea
              className="dp-input dp-textarea mt-2"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="A line or two. Where is it stuck?"
            />
          </div>

          <div className="mt-5">
            <label className="dp-meta">Audio file</label>
            <input
              className="dp-input mt-2"
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="dp-meta mt-2">
              mp3, wav, m4a — you can replace it anytime.
            </p>
          </div>

          {status && (
            <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-sm text-white/80">{status}</p>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <a className="dp-btn dp-btn-ghost" href="/">
              Cancel
            </a>

            <button
              className="dp-btn dp-btn-primary"
              type="submit"
              disabled={busy}
            >
              {busy ? "Publishing..." : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ProjectRow = {
  id: string;
  title: string;
  context: string | null;
  audio_path: string | null;
  created_at: string;
};

type ReplyRow = {
  id: string;
  project_id: string;
  body: string | null;
  audio_path: string | null;
  created_at: string;
};

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? decodeURIComponent(params.id) : "";

  const [project, setProject] = useState<ProjectRow | null>(null);
  const [projectAudioUrl, setProjectAudioUrl] = useState<string | null>(null);

  const [replies, setReplies] = useState<ReplyRow[]>([]);
  const [status, setStatus] = useState("Loading…");

  // Reply form state
  const [replyBody, setReplyBody] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [replyStatus, setReplyStatus] = useState<string | null>(null);
  const [replyBusy, setReplyBusy] = useState(false);

  async function loadProjectAndReplies(projectId: string) {
    setStatus("Loading…");

    // 1) Load project
    const { data: p, error: pErr } = await supabase
      .from("projects")
      .select("id,title,context,audio_path,created_at")
      .eq("id", projectId)
      .maybeSingle();

    if (pErr) {
      console.error(pErr);
      setStatus(`❌ Could not load project: ${pErr.message}`);
      return;
    }
    if (!p) {
      setStatus("❌ Could not load project: not found.");
      return;
    }

    setProject(p);

    // 2) Signed URL for project audio (private bucket)
    if (p.audio_path) {
      const { data: signed, error: signError } = await supabase.storage
        .from("project-audio")
        .createSignedUrl(p.audio_path, 60 * 60);

      if (signError) {
        console.error(signError);
        setStatus(`❌ Could not create audio URL: ${signError.message}`);
      } else {
        setProjectAudioUrl(signed.signedUrl);
      }
    }

    // 3) Load replies
    const { data: r, error: rErr } = await supabase
      .from("replies")
      .select("id,project_id,body,audio_path,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (rErr) {
      console.error(rErr);
      setStatus(`❌ Could not load replies: ${rErr.message}`);
      return;
    }

    setReplies(r ?? []);
    setStatus("✅ Loaded.");
  }

  useEffect(() => {
    if (!id) return;
    loadProjectAndReplies(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function getReplyAudioUrl(audioPath: string) {
    const { data: signed, error } = await supabase.storage
      .from("reply-audio")
      .createSignedUrl(audioPath, 60 * 60);

    if (error) {
      console.error(error);
      return null;
    }
    return signed.signedUrl;
  }

  async function handleAddReply(e: React.FormEvent) {
    e.preventDefault();
    setReplyStatus(null);

    if (!replyFile && !replyBody.trim()) {
      setReplyStatus("Add audio and/or a short blurb.");
      return;
    }

    setReplyBusy(true);

    try {
      let audio_path: string | null = null;

      // 1) Upload reply audio (optional)
      if (replyFile) {
        const ext = replyFile.name.split(".").pop() || "audio";
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const path = `replies/${id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("reply-audio")
          .upload(path, replyFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: replyFile.type || "audio/mpeg",
          });

        if (uploadError) throw uploadError;
        audio_path = path;
      }

      // 2) Insert reply row
      const { error: insertError } = await supabase.from("replies").insert({
        project_id: id,
        body: replyBody.trim() || null,
        audio_path,
      });

      if (insertError) throw insertError;

      // 3) Clear form + reload replies
      setReplyBody("");
      setReplyFile(null);
      setReplyStatus("✅ Posted.");
      await loadProjectAndReplies(id);
    } catch (err: any) {
      console.error(err);
      setReplyStatus(`Error: ${err.message ?? "Something went wrong"}`);
    } finally {
      setReplyBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: 16 }}>
      <a href="/" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Back
      </a>

      {!project ? (
        <div>{status}</div>
      ) : (
        <>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>{project.title}</h1>

          {project.context && (
            <p style={{ marginTop: 10, color: "#555", whiteSpace: "pre-wrap" }}>
              {project.context}
            </p>
          )}

          <div style={{ marginTop: 18 }}>
            {projectAudioUrl ? (
              <audio controls src={projectAudioUrl} style={{ width: "100%" }} />
            ) : (
              <p style={{ color: "#666" }}>No audio file attached.</p>
            )}
          </div>

          <hr style={{ margin: "24px 0" }} />

          <h2 style={{ fontSize: 18, fontWeight: 700 }}>
  Responses <span style={{ fontSize: 12, color: "#666" }}>(newest first)</span>
</h2>

          {/* Reply form */}
          <form onSubmit={handleAddReply} style={{ marginTop: 12 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
              Add a response (audio +/or blurb)
            </label>

            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Try this: ‘I listened and what I felt was… so I added… because…’"
              rows={3}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #ccc",
              }}
            />

            <div style={{ marginTop: 10 }}>
             <div style={{ marginTop: 10 }}>
  <label
    style={{
      display: "block",
      border: "2px dashed #bbb",
      borderRadius: 14,
      padding: 14,
      cursor: "pointer",
      background: replyFile ? "#f7f7f7" : "transparent",
    }}
  >
    <input
      type="file"
      accept="audio/*"
      onChange={(e) => setReplyFile(e.target.files?.[0] ?? null)}
      style={{ display: "none" }}
    />

    <div style={{ fontWeight: 700 }}>
      {replyFile ? "Reply audio selected" : "Add reply audio (optional)"}
    </div>

    <div style={{ marginTop: 6, color: "#666" }}>
      {replyFile
        ? replyFile.name
        : "Click to choose an audio clip. Or just write a blurb."}
    </div>

    {replyFile && (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setReplyFile(null);
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

            </div>

            <button
              type="submit"
              disabled={replyBusy}
              style={{
                marginTop: 12,
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #111",
                background: replyBusy ? "#ddd" : "#111",
                color: replyBusy ? "#333" : "#fff",
                cursor: replyBusy ? "not-allowed" : "pointer",
              }}
            >
              {replyBusy ? "Posting…" : "Post reply"}
            </button>

            {replyStatus && (
              <div style={{ marginTop: 10, color: replyStatus.startsWith("✅") ? "#0a7" : "#b00020" }}>
                {replyStatus}
              </div>
            )}
          </form>

          {/* Replies list */}
          <div style={{ marginTop: 18 }}>
            {replies.length === 0 ? (
              <p style={{ color: "#666" }}>No responses yet.</p>
            ) : (
              <ul style={{ padding: 0, listStyle: "none" }}>
                {replies.map((r) => (
                  <ReplyItem key={r.id} reply={r} getAudioUrl={getReplyAudioUrl} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </main>
  );
}

function ReplyItem({
  reply,
  getAudioUrl,
}: {
  reply: ReplyRow;
  getAudioUrl: (audioPath: string) => Promise<string | null>;
}) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!reply.audio_path) return;
      const url = await getAudioUrl(reply.audio_path);
      if (!cancelled) setAudioUrl(url);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [reply.audio_path, getAudioUrl]);

  return (
    <li
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <div style={{ fontSize: 12, color: "#666" }}>
        {new Date(reply.created_at).toLocaleString()}
      </div>

      {reply.body && (
        <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{reply.body}</div>
      )}

      <div style={{ marginTop: 10 }}>
        {audioUrl ? (
          <audio controls src={audioUrl} style={{ width: "100%" }} />
        ) : reply.audio_path ? (
          <div style={{ color: "#666" }}>Loading audio…</div>
        ) : (
          <div style={{ color: "#666" }}>No audio attached.</div>
        )}
      </div>
    </li>
  );
}

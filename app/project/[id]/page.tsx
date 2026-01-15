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

    // 2) Signed URL for project audio
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
    } else {
      setProjectAudioUrl(null);
    }

    // 3) Load replies (newest first)
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

      // 3) Clear form + reload
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
    <div className="dp-page">
      <div className="dp-wrap">
        <a href="/" className="dp-meta hover:text-white" style={{ textDecoration: "none" }}>
          ← Back
        </a>

        {!project ? (
          <div className="dp-card" style={{ marginTop: 12 }}>
            <div className="dp-meta">{status}</div>
          </div>
        ) : (
          <>
            <div style={{ marginTop: 14 }}>
              <h1 className="dp-title">{project.title || "Untitled"}</h1>
              {project.context ? (
                <p
                  className="dp-subtitle"
                  style={{ whiteSpace: "pre-wrap", marginTop: 10 }}
                >
                  {project.context}
                </p>
              ) : null}

              <div style={{ marginTop: 16 }}>
                {projectAudioUrl ? (
                  <audio controls src={projectAudioUrl} style={{ width: "100%" }} />
                ) : (
                  <p className="dp-meta">No audio file attached.</p>
                )}
              </div>

              <div className="dp-meta" style={{ marginTop: 10 }}>
                {new Date(project.created_at).toLocaleString()}
              </div>
            </div>

            <hr style={{ margin: "22px 0", opacity: 0.35 }} />

            <h2 style={{ fontSize: 16, fontWeight: 900 }}>
              Responses{" "}
              <span className="dp-meta" style={{ fontWeight: 700 }}>
                (newest first)
              </span>
            </h2>

            {/* Reply form */}
            <form onSubmit={handleAddReply} className="dp-card" style={{ marginTop: 12 }}>
              <label className="dp-meta" style={{ display: "block" }}>
                Add a response (audio +/or blurb)
              </label>

              <textarea
                className="dp-input dp-textarea"
                style={{ marginTop: 10 }}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Try this: ‘I listened and what I felt was… so I added… because…’"
              />

              {/* Dropzone-style file chooser */}
              <div style={{ marginTop: 12 }}>
                <label
                  style={{
                    display: "block",
                    border: "2px dashed rgba(255,255,255,0.18)",
                    borderRadius: 16,
                    padding: 14,
                    cursor: "pointer",
                    background: replyFile ? "rgba(255,255,255,0.05)" : "transparent",
                  }}
                >
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setReplyFile(e.target.files?.[0] ?? null)}
                    style={{ display: "none" }}
                  />

                  <div style={{ fontWeight: 900 }}>
                    {replyFile ? "Reply audio selected" : "Add reply audio (optional)"}
                  </div>

                  <div className="dp-meta" style={{ marginTop: 6 }}>
                    {replyFile
                      ? replyFile.name
                      : "Click to choose an audio clip. Or just write a blurb."}
                  </div>

                  {replyFile ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setReplyFile(null);
                      }}
                      className="dp-btn dp-btn-ghost"
                      style={{ marginTop: 10 }}
                    >
                      Remove file
                    </button>
                  ) : null}
                </label>
              </div>

              {replyStatus ? (
                <div style={{ marginTop: 12 }} className="dp-meta">
                  {replyStatus}
                </div>
              ) : null}

              <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                <button className="dp-btn dp-btn-primary" type="submit" disabled={replyBusy}>
                  {replyBusy ? "Posting…" : "Post reply"}
                </button>
              </div>
            </form>

            {/* Replies list */}
            <div style={{ marginTop: 14 }}>
              {replies.length === 0 ? (
                <p className="dp-meta">No responses yet.</p>
              ) : (
                <ul style={{ padding: 0, listStyle: "none", margin: 0 }}>
                  {replies.map((r) => (
                    <ReplyItem key={r.id} reply={r} getAudioUrl={getReplyAudioUrl} />
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
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
    <li className="dp-card" style={{ marginTop: 10 }}>
      <div className="dp-meta">{new Date(reply.created_at).toLocaleString()}</div>

      {reply.body ? (
        <div style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>{reply.body}</div>
      ) : null}

      <div style={{ marginTop: 12 }}>
        {audioUrl ? (
          <audio controls src={audioUrl} style={{ width: "100%" }} />
        ) : reply.audio_path ? (
          <div className="dp-meta">Loading audio…</div>
        ) : (
          <div className="dp-meta">No audio attached.</div>
        )}
      </div>
    </li>
  );
}

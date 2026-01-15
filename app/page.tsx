"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import VinylPreviewButton from "@/app/components/VinylPreviewButton";

type ProjectRow = {
  id: string;
  title: string;
  context: string | null;
  audio_path: string | null;
  created_at: string;
};

type ProjectWithPreview = ProjectRow & {
  previewUrl: string | null;
};

export default function HomePage() {
  const [items, setItems] = useState<ProjectWithPreview[]>([]);
  const [status, setStatus] = useState<string>("Loading…");

  async function load() {
    try {
      setStatus("Loading…");

      const { data, error } = await supabase
        .from("projects")
        .select("id,title,context,audio_path,created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setStatus(`❌ Supabase error: ${error.message}`);
        return;
      }

      const rows = (data ?? []) as ProjectRow[];

      const withPreviews: ProjectWithPreview[] = await Promise.all(
        rows.map(async (p) => {
          if (!p.audio_path) return { ...p, previewUrl: null };

          const { data: signed, error: signErr } = await supabase.storage
            .from("project-audio")
            .createSignedUrl(p.audio_path, 60 * 30);

          if (signErr) {
            console.error(signErr);
            return { ...p, previewUrl: null };
          }

          return { ...p, previewUrl: signed.signedUrl };
        })
      );

      setItems(withPreviews);
      setStatus(withPreviews.length ? "✅ Loaded." : "No posts yet.");
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Crash: ${err?.message ?? String(err)}`);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="dp-page">
      <div className="dp-wrap">
        <div className="mt-4">
          <h1 className="dp-title">Unfinished work</h1>
          <p className="dp-subtitle">
            Honest responses. Audio-first. No pretending it’s done.
          </p>
        </div>

        <div className="mt-6">
          {items.length ? (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {items.map((p) => (
                <li key={p.id} style={{ marginBottom: 12 }}>
                  {/* Whole card is clickable via overlay link */}
                  <div className="dp-card dp-card-click">
                    <a
                      className="dp-card-link"
                      href={`/project/${encodeURIComponent(p.id)}`}
                      aria-label={`Open project: ${p.title || "Untitled"}`}
                    />

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 14,
                        position: "relative",
                        zIndex: 1, // above overlay link; clickable elements can opt in
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>
                          {p.title || "Untitled"}
                        </div>

                        {p.context ? (
                          <div
                            className="dp-meta"
                            style={{
                              marginTop: 6,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              lineHeight: 1.45,
                            }}
                          >
                            {p.context}
                          </div>
                        ) : (
                          <div className="dp-meta" style={{ marginTop: 6 }}>
                            (no context)
                          </div>
                        )}

                        <div className="dp-meta" style={{ marginTop: 10 }}>
                          {new Date(p.created_at).toLocaleString()}
                        </div>
                      </div>

                      {/* Make sure the vinyl button stays clickable */}
                      <div className="dp-card-action">
                        <VinylPreviewButton src={p.previewUrl} />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dp-card">
              <div className="dp-meta">{status}</div>
            </div>
          )}
        </div>
      </div>

      {/* Small debug widget bottom-right */}
      <div className="dp-debug">
        <div className="dp-meta" style={{ fontWeight: 800 }}>
          {status}
        </div>
        <div className="dp-meta" style={{ marginTop: 6 }}>
          URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅" : "❌"}
          {" · "}
          Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅" : "❌"}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Project = {
  id: string;
  title: string;
  context: string | null;
  created_at: string;
};

type Reply = {
  id: string;
  project_id: string;
};

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: p, error: pErr } = await supabase
        .from("projects")
        .select("id,title,context,created_at")
        .order("created_at", { ascending: false });

      if (pErr) {
        console.error(pErr);
        setLoading(false);
        return;
      }

      setProjects(p ?? []);

      // Fetch replies just to count (MVP simple)
      const { data: r, error: rErr } = await supabase
        .from("replies")
        .select("id,project_id");

      if (rErr) {
        console.error(rErr);
        setLoading(false);
        return;
      }

      const counts: Record<string, number> = {};
      (r ?? []).forEach((reply: Reply) => {
        counts[reply.project_id] = (counts[reply.project_id] ?? 0) + 1;
      });

      setReplyCounts(counts);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Dead Projects</h1>

      <a href="/new" style={{ display: "inline-block", marginTop: 12 }}>
        + New Project
      </a>

      <div style={{ marginTop: 18 }}>
        {loading ? (
          <p>Loading…</p>
        ) : projects.length === 0 ? (
          <p>No projects yet.</p>
        ) : (
          <ul style={{ padding: 0, listStyle: "none" }}>
            {projects.map((p) => (
              <li
                key={p.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <a
                  href={`/project/${p.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ fontWeight: 700 }}>{p.title}</div>

                  {p.context && (
                    <div style={{ marginTop: 6, color: "#555" }}>
                      {p.context.length > 120
                        ? p.context.slice(0, 120) + "…"
                        : p.context}
                    </div>
                  )}

                  <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
                    {new Date(p.created_at).toLocaleString()} •{" "}
                    {(replyCounts[p.id] ?? 0).toString()} responses
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

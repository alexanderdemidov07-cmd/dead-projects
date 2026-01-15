"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function VinylPreviewButton({ src }: { src: string | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1

  const circumference = useMemo(() => 2 * Math.PI * 18, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onCanPlay = () => setReady(true);
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };

    a.addEventListener("canplay", onCanPlay);
    a.addEventListener("ended", onEnded);

    return () => {
      a.removeEventListener("canplay", onCanPlay);
      a.removeEventListener("ended", onEnded);
    };
  }, [src]);

  function tick() {
    const a = audioRef.current;
    if (a && a.duration && isFinite(a.duration)) {
      setProgress(a.currentTime / a.duration);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  async function toggle() {
    const a = audioRef.current;
    if (!a || !src) return;

    try {
      if (playing) {
        a.pause();
        setPlaying(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else {
        await a.play();
        setPlaying(true);
        if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
      }
    } catch {
      // ignore autoplay/permission issues
    }
  }

  const dashOffset = circumference * (1 - progress);

  return (
    <div className="dp-vinyl">
      <audio ref={audioRef} src={src ?? undefined} preload="metadata" />

      <button
        type="button"
        className="dp-vinyl-btn"
        onClick={toggle}
        disabled={!src || !ready}
        aria-label={playing ? "Pause preview" : "Play preview"}
        title={playing ? "Pause preview" : "Play preview"}
      >
        <svg width="44" height="44" viewBox="0 0 44 44">
          {/* ring base */}
          <circle
            cx="22"
            cy="22"
            r="18"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="2.5"
            fill="none"
          />
          {/* ring progress */}
          <circle
            cx="22"
            cy="22"
            r="18"
            stroke="rgba(255,255,255,0.88)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />

          {/* vinyl disc */}
          <circle cx="22" cy="22" r="12" fill="rgba(255,255,255,0.10)" />
          <circle cx="22" cy="22" r="3" fill="rgba(255,255,255,0.70)" />

          {/* play/pause */}
          {playing ? (
            <>
              <rect x="17" y="16" width="3.5" height="12" fill="white" />
              <rect x="23.5" y="16" width="3.5" height="12" fill="white" />
            </>
          ) : (
            <path d="M20 16.5v11l9-5.5-9-5.5z" fill="white" opacity="0.95" />
          )}
        </svg>
      </button>
    </div>
  );
}

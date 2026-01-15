"use client";

import { useEffect, useState } from "react";

// Short Beatles snippets (≤10 words)
const LYRICS = [
  "Let it be",
  "Here comes the sun",
  "All you need is love",
  "Come together",
  "Hey Jude",
  "I want to hold your hand",
  "Strawberry Fields forever",
  "Across the universe",
  "Paperback writer",
  "With a little help from my friends",
];

export default function FooterLyric() {
  const [line, setLine] = useState("");

  useEffect(() => {
    setLine(LYRICS[Math.floor(Math.random() * LYRICS.length)]);
  }, []);

  if (!line) return null;
  return <span className="dp-meta">“{line}”</span>;
}

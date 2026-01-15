export default function SkullMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      {/* skull */}
      <path
        d="M32 6c-12.7 0-23 10-23 22.4 0 9.2 5.7 17 13.8 20.4V56c0 1.7 1.3 3 3 3h2.5c1.4 0 2.5-1.1 2.5-2.5V53h2v3.5c0 1.4 1.1 2.5 2.5 2.5h2.5c1.7 0 3-1.3 3-3v-7.2C49.3 45.4 55 37.6 55 28.4 55 16 44.7 6 32 6Z"
        fill="white"
        opacity="0.92"
      />
      {/* eye sockets */}
      <path
        d="M23.2 33.2c0-3.1 2.3-5.6 5.2-5.6s5.2 2.5 5.2 5.6-2.3 5.6-5.2 5.6-5.2-2.5-5.2-5.6Zm12.4 0c0-3.1 2.3-5.6 5.2-5.6s5.2 2.5 5.2 5.6-2.3 5.6-5.2 5.6-5.2-2.5-5.2-5.6Z"
        fill="#0B0B0B"
        opacity="0.9"
      />
      {/* nose */}
      <path
        d="M32 40.5c-2 0-3.7 2-3.7 4.2 0 2.3 1.7 4.2 3.7 4.2s3.7-1.9 3.7-4.2c0-2.2-1.7-4.2-3.7-4.2Z"
        fill="#0B0B0B"
        opacity="0.9"
      />
      {/* teeth hint */}
      <path
        d="M26 52h12"
        stroke="#0B0B0B"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

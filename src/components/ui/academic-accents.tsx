type SvgProps = { className?: string; style?: React.CSSProperties };

export function TealUnderline({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 200 12" fill="none" className={className} aria-hidden>
      <path
        d="M2 9 C40 3, 80 11, 120 7 C150 4, 175 10, 198 6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function CircleAccent({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden>
      <ellipse
        cx="50" cy="50" rx="44" ry="38"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 3"
        transform="rotate(-8 50 50)"
      />
    </svg>
  );
}

export function ArrowAccent({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 48 32" fill="none" className={className} aria-hidden>
      <path
        d="M2 16 C8 10, 20 6, 36 14 L30 9 M36 14 L29 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarDot({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M8 0 L9.2 6.8 L16 8 L9.2 9.2 L8 16 L6.8 9.2 L0 8 L6.8 6.8 Z" />
    </svg>
  );
}

export function SquiggleDivider({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 1200 24" preserveAspectRatio="none" fill="none" className={`w-full ${className}`} aria-hidden>
      <path
        d="M0 12 C100 4, 200 20, 300 12 C400 4, 500 20, 600 12 C700 4, 800 20, 900 12 C1000 4, 1100 20, 1200 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function NoteLines({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden>
      {[12, 24, 36, 48, 60, 68].map((y) => (
        <line key={y} x1="8" y1={y} x2="112" y2={y} stroke="currentColor" strokeWidth="1" opacity="0.6" />
      ))}
      <line x1="24" y1="8" x2="24" y2="72" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}

export function ScribbleBox({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden>
      <path
        d="M8 8 L112 8 L112 72 L8 72 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="6 3"
      />
      <path d="M24 32 L64 32 M24 44 L88 44 M24 56 L52 56" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

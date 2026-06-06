"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Props = {
  href: string;
  label: string;
  subLabel?: string;
};

export function FloatingCta({ href, label, subLabel }: Props) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const velocity = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      velocity.current = y - lastScrollY.current;
      lastScrollY.current = y;

      // Always show near top or near bottom
      if (y < 80 || max - y < 120) {
        setHidden(false);
      } else {
        setHidden(velocity.current > 6);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`floating-cta${hidden ? " hidden-cta" : ""}`}>
      <Link
        href={href}
        className="group flex items-center gap-3 bg-teal text-paper font-display font-bold px-5 py-3 rounded-full shadow-2xl hover:bg-teal-dim transition-colors"
        style={{ boxShadow: "0 0 0 1px rgba(14,200,181,0.5), 0 16px 40px -8px rgba(14,200,181,0.4)" }}
      >
        <span className="text-sm font-semibold tracking-tight">{label}</span>
        {subLabel && (
          <span className="hidden sm:flex items-center gap-1 text-xs opacity-80 font-body font-normal">
            <span className="w-px h-4 bg-paper/30" />
            {subLabel}
          </span>
        )}
        <span className="text-base group-hover:translate-x-0.5 transition-transform">→</span>
      </Link>
    </div>
  );
}

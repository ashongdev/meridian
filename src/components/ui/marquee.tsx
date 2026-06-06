type Props = {
  items: string[];
  reverse?: boolean;
  separator?: string;
  className?: string;
};

export function Marquee({ items, reverse = false, separator = "·", className = "" }: Props) {
  const doubled = [...items, ...items];
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className={reverse ? "marquee-track-rev" : "marquee-track"}>
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center shrink-0">
            <span className="px-5 font-display text-ink-2 font-medium tracking-wide">{item}</span>
            <span className="text-teal text-xs opacity-60">{separator}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

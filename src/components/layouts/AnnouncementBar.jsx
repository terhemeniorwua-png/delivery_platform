/**
 * Top announcement strip, SKYClothe navy like the footer. A single line of
 * small promotional copy that flows right → left, looping seamlessly — two
 * identical copies slide by exactly one copy width (reuses the `marquee`
 * keyframe from globals.css). Pauses on hover; the global reduced-motion
 * rule freezes it for motion-sensitive users.
 */
const ITEMS = [
  "New season styles just landed",
  "Free delivery on orders over ₦50,000",
  "7-day easy returns",
  "Pay cash, card or bank transfer",
  "Supporting local riders nationwide",
];

function Track({ hidden = false }) {
  return (
    <div
      className="flex shrink-0 items-center"
      aria-hidden={hidden ? "true" : undefined}
      inert={hidden ? "" : undefined}
    >
      {ITEMS.map((item) => (
        <span
          key={item}
          className="flex items-center whitespace-nowrap text-xs font-medium tracking-wide text-sky-200/90 sm:text-[13px]"
        >
          <span className="px-4 sm:px-6">{item}</span>
          <span aria-hidden="true" className="text-sky-400/60">
            ✦
          </span>
        </span>
      ))}
    </div>
  );
}

export default function AnnouncementBar() {
  return (
    <div
      aria-label="Site announcements"
      className="group relative z-30 overflow-hidden border-b border-white/10 bg-navy-900 py-1.5 sm:py-2"
    >
      <div className="animate-marquee flex w-max group-hover:[animation-play-state:paused]">
        <Track />
        <Track hidden />
      </div>
    </div>
  );
}
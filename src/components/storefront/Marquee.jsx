/**
 * Endless horizontal product rail. Two identical copies of the children sit
 * side by side; a CSS keyframe (globals.css `.animate-marquee`) slides the
 * track by exactly one copy width (-50%) so the loop is seamless. The rail
 * pauses on hover/focus and is disabled by the global reduced-motion rule.
 */
export default function Marquee({ children }) {
  return (
    <div className="marquee-mask group relative w-full overflow-hidden">
      <div className="animate-marquee flex w-max group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
        <div className="flex shrink-0 gap-5 pr-5">{children}</div>
        <div className="flex shrink-0 gap-5 pr-5" aria-hidden="true" inert>
          {children}
        </div>
      </div>
    </div>
  );
}

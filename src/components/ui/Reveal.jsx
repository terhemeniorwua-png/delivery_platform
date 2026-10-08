"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll-reveal wrapper. Children fade/slide in the first time they scroll
 * into view.
 *
 * - Adds `is-visible` once the element intersects (optionally only when it
 *   has reached `threshold`% of its height).
 * - `delay` sets a per-element stagger (ms) via a CSS custom property.
 * - Respects prefers-reduced-motion and no-JS: content is only hidden when
 *   JS has run AND the user allows motion, so it can never be stuck invisible.
 */
export default function Reveal({
  as: Tag = "div",
  delay = 0,
  threshold = 0.15,
  className = "",
  children,
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      el.classList.add("is-visible");
      return;
    }

    document.documentElement.dataset.js = "1";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <Tag
      ref={ref}
      style={{ "--reveal-delay": `${delay}ms` }}
      className={`reveal ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
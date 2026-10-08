"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SLIDES = [
  "photo-1483985988355-763728e1935b",
  "photo-1441986300917-64674bd600d8",
  "photo-1445205170230-053b83016050",
  "photo-1489987707025-afc232f7ea0f",
  "photo-1469334031218-e382a71b716b",
];

const INTERVAL_MS = 3000;

/**
 * Rotating hero backdrop: five clothing lifestyle photographs crossfading
 * every 3 seconds. The first slide is prioritised for LCP; the rest fade in
 * as they load. Users who prefer reduced motion get a static first slide.
 */
export default function HeroSlideshow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(
      () => setActive((current) => (current + 1) % SLIDES.length),
      INTERVAL_MS
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0">
      {SLIDES.map((id, index) => (
        <Image
          key={id}
          src={`https://images.unsplash.com/${id}?auto=format&fit=crop&w=2000&q=80`}
          alt=""
          fill
          priority={index === 0}
          sizes="100vw"
          className={`object-cover object-center transition-opacity duration-[1200ms] ease-in-out ${
            index === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}

"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export default function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const cursorX = useSpring(x, { stiffness: 1400, damping: 45, mass: 0.4 });
  const cursorY = useSpring(y, { stiffness: 1400, damping: 45, mass: 0.4 });

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [x, y]);

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-3 border-ink bg-ink mix-blend-difference"
      style={{ x: cursorX, y: cursorY }}
    />
  );
}

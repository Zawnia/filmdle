"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type WinModalProps = {
  isOpen: boolean;
  title: string;
  attempts: number;
  posterUrl?: string;
  onReplay: () => void;
};

function getTimeToMidnight() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const diff = Math.max(0, next.getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

export function WinModal({
  isOpen,
  title,
  attempts,
  posterUrl,
  onReplay,
}: WinModalProps) {
  const [remaining, setRemaining] = useState(getTimeToMidnight());

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const timer = setInterval(() => {
      setRemaining(getTimeToMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, index) => ({
        id: index,
        left: 10 + (index * 6) % 80,
        delay: (index % 6) * 0.08,
      })),
    []
  );

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border-4 border-black bg-[#88FFA1] p-6 shadow-[8px_8px_0px_0px_#000]"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
          >
            <div className="pointer-events-none absolute inset-0">
              {confettiPieces.map((piece) => (
                <motion.span
                  key={piece.id}
                  className="absolute top-0 h-3 w-2 rounded-sm bg-[#5499F8]"
                  style={{ left: `${piece.left}%` }}
                  initial={{ y: -20, rotate: 0, opacity: 0 }}
                  animate={{ y: 220, rotate: 120, opacity: 1 }}
                  transition={{
                    duration: 1.4,
                    delay: piece.delay,
                    repeat: Infinity,
                    repeatDelay: 0.4,
                  }}
                />
              ))}
            </div>

            <div className="relative flex flex-col items-center gap-4 text-center">
              <h2 className="font-display text-3xl font-black">BRAVO ! 🎉</h2>
              <p className="text-base font-semibold text-[#18181B]/80">
                Tu as trouvé <span className="font-black">{title}</span> en{" "}
                <span className="font-black">{attempts}</span> essais.
              </p>
              <div className="w-40 overflow-hidden rounded-xl border-3 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center text-xs font-bold text-gray-400">
                    Pas d'affiche
                  </div>
                )}
              </div>
              <div className="rounded-full border-3 border-black bg-white px-4 py-2 text-xs font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Prochain film dans{" "}
                {String(remaining.hours).padStart(2, "0")}:
                {String(remaining.minutes).padStart(2, "0")}:
                {String(remaining.seconds).padStart(2, "0")}
              </div>
              <button
                type="button"
                onClick={onReplay}
                className="rounded-full border-3 border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000]"
              >
                Rejouer
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

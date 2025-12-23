"use client";

import { AnimatePresence, motion } from "framer-motion";

type PersonModalProps = {
  isOpen: boolean;
  name: string;
  photo?: string;
  onClose: () => void;
};

export function PersonModal({ isOpen, name, photo, onClose }: PersonModalProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-6 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-sm rounded-2xl border-4 border-black bg-white p-6 text-center shadow-[8px_8px_0px_0px_#000]"
            initial={{ scale: 0.9, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 w-40 overflow-hidden rounded-2xl border-3 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {photo ? (
                <img
                  src={photo}
                  alt={name}
                  className="h-48 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-xs font-bold text-gray-400">
                  Pas de photo
                </div>
              )}
            </div>
            <h3 className="font-display text-xl font-black">{name}</h3>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

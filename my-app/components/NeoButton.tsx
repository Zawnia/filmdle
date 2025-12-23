"use client";

import type { ComponentProps } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type NeoButtonProps = ComponentProps<typeof motion.button>;

export function NeoButton({ className, children, ...props }: NeoButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px 0px #000000" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "rounded-xl border-3 border-ink bg-primary px-5 py-3 font-display text-base font-bold text-ink shadow-hard",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

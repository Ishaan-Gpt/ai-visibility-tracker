"use client";

import { motion } from "framer-motion";
import type { SVGProps, ComponentType } from "react";

type TypeCardProps = {
  layoutId: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  onClick: () => void;
};

export function TypeCard({ layoutId, icon: Icon, title, description, onClick }: TypeCardProps) {
  return (
    <motion.button
      layoutId={layoutId}
      type="button"
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="flex flex-col items-start gap-3 rounded-2xl border border-foreground/10 bg-background/60 p-6 text-left backdrop-blur-md transition-colors hover:border-primary/30"
    >
      <Icon className="h-6 w-6 text-primary" />
      <p className="font-display text-lg text-foreground">{title}</p>
      <p className="font-body text-xs text-foreground/50">{description}</p>
    </motion.button>
  );
}

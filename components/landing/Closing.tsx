"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LogoMark } from "@/components/brand/Logo";
import { Halftone, PaintedSky } from "@/components/landing/Painted";
import { BtnLink, Lede } from "@/components/landing/ui";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Cloud-sky closing call to action. Flows straight into the painted footer below it. */
export function Closing() {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden pb-24 pt-32 sm:pb-40 sm:pt-44">
      <PaintedSky name="closing" />
      <Halftone />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ds-canvas to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-[#e6e3d8]" />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1, ease: EASE }}
        className="relative z-10 mx-auto max-w-[900px] px-4 text-center"
      >
        <LogoMark className="mx-auto h-8 w-8 text-ds-ink" />
        <h2 className="mt-6 font-serif text-[42px] leading-[1.04] tracking-[-0.025em] sm:text-[60px] lg:text-[68px]">
          Leave the spreadsheet audits behind.
          <br />
          Focus on the client.
        </h2>
        <Lede className="mt-6 max-w-[580px]">
          Whether you run an agency, freelance, or look after one site you love, seowise does the checking so you can do the part only you can: the advice
        </Lede>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <BtnLink href="/tools/page-audit" className="h-12 px-6">
            Run a free audit
          </BtnLink>
          <BtnLink href="/tools" variant="glass" className="h-12 px-6">
            See every tool
          </BtnLink>
        </div>
      </motion.div>
    </section>
  );
}

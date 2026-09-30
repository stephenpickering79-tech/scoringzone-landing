/**
 * The website's copy of the app's plan engine, for the calculator lead funnel
 * (js/plan-funnel.js). Built by scripts/build-plan-engine.sh from the APP repo's
 * `main` (read-only): the estimate and the plan are the app's own code, so the
 * emailed PDF matches what the app would build. Nothing here changes the app.
 *
 * The output (js/plan-engine.js) exposes `window.SZEngine`.
 */
import { estimateBaseline, type PracticeFrequency } from "@/lib/baselineEstimate";
import type { Category } from "@/lib/challenges";
import { generatePlan, planTypeFor } from "@/lib/practicePlan/generate";
import { SKILL_SESSION_ORDER } from "@/lib/practicePlan/skills";

export interface FunnelAnswers {
  hcp: number | null;
  weakest: Category | null;
  frequency: PracticeFrequency | null;
  upDowns: number | null;
  threePutts: number | null;
  bunkerUpDowns: number | null;
  shortPutts: number | null;
  shortSided: number | null;
  pitchShots: number | null;
}

/** The estimate card's numbers. */
export function estimate(a: FunnelAnswers) {
  const b = estimateBaseline({ handicapIndex: a.hcp, ...a });
  return {
    estimatedHcp: b.estimatedHcp,
    totalShotsLost: b.totalShotsLost,
    handicapUsed: b.handicapUsed,
    targetLabel: b.targetLabel,
    weakest: { category: b.weakest.category, label: b.weakest.label },
    skills: b.skills.map((s) => ({ category: s.category, label: s.label, shotsLost: s.shotsLost, share: s.share })),
  };
}

/** The `lead-plan` request: drill ids and numbers only (the server renders every word). */
export function leadBody(email: string, a: FunnelAnswers, anon: string | null) {
  const b = estimateBaseline({ handicapIndex: a.hcp, ...a });
  const now = Date.now();
  const plan = generatePlan({
    planId: `lead-${now}`,
    sourceBuiltAt: now,
    gapArea: b.weakest.category,
    handicap: b.handicapUsed,
    estimate: b.estimatedHcp,
    builder: { type: planTypeFor(b.weakest.category), sessionMinutes: 30, focus: [...SKILL_SESSION_ORDER], evenAreas: false },
  });
  return {
    email: email.trim(),
    hcp: a.hcp,
    estimate: b.estimatedHcp,
    level: plan.targetLevel,
    weakest: b.weakest.category,
    planType: plan.type,
    shotsLost: Object.fromEntries(b.skills.map((s) => [s.category, s.shotsLost])),
    sessions: plan.sessions.map((s) => ({
      week: s.week, index: s.index, minutes: s.minutes, test: s.kind === "assessment",
      ids: s.kind === "assessment" ? [] : s.blocks.map((x) => x.ref.id),
    })),
    anon,
    company: "",
  };
}

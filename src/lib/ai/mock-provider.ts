import type {
  DecisionIntake,
  DecisionType,
  NormalizedDecision,
  PremortemAnalysis,
  RegretAnalysis,
} from "@/lib/domain/decision";
import {
  normalizedDecisionSchema,
  premortemAnalysisSchema,
  regretAnalysisSchema,
  synthesisDraftSchema,
} from "@/lib/domain/decision";

function scoreFromStakes(stakes: DecisionIntake["stakesLevel"]) {
  return stakes === "high" ? 4 : stakes === "medium" ? 3 : 2;
}

function clampScore(value: number) {
  return Math.max(1, Math.min(5, Math.round(value)));
}

function lowerFirst(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function includesAny(content: string, phrases: string[]) {
  return phrases.some((phrase) => content.includes(phrase));
}

function uniqueList(values: string[], fallback: string) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, 4).length
    ? [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, 4)
    : [fallback];
}

type DecisionSignals = ReturnType<typeof decisionSignals>;

function decisionSignals(input: DecisionIntake) {
  const content = [
    input.title,
    input.primaryOption,
    input.baselineAlternative,
    input.whyThisMatters,
    input.successDefinition,
    ...input.constraints,
    ...input.biggestKnownUncertainties,
  ]
    .join(" ")
    .toLowerCase();

  const uncertaintyCount = input.biggestKnownUncertainties.length;

  return {
    uncertaintyCount,
    pilotLike: includesAny(content, ["pilot", "trial", "test", "experiment", "reversible"]),
    strongEvidence: includesAny(content, [
      "repeat usage",
      "design partners",
      "existing demand",
      "requested by customers",
      "clear pain",
      "paying pilot",
      "warm demand",
      "already asking",
    ]),
    urgent: includesAny(content, [
      "closing window",
      "market window",
      "manual status work",
      "every week",
      "roadmap blocked",
      "time-sensitive",
      "competitive pressure",
    ]),
    migrationHeavy: includesAny(content, [
      "migration",
      "replatform",
      "replace",
      "vendor lock-in",
      "rewrite",
      "procurement",
      "workflow stack",
    ]),
    complianceRisk: includesAny(content, [
      "compliance",
      "security",
      "customer data",
      "brand damage",
      "regulatory",
      "procurement-heavy",
    ]),
    supportHeavy: includesAny(content, [
      "custom work",
      "support burden",
      "manual support",
      "people management",
      "political",
      "enablement load",
      "cross-functional alignment",
    ]),
    convenienceOnly: includesAny(content, [
      "slight improvement",
      "nice to have",
      "minor convenience",
      "small cleanup",
      "tool enthusiasm",
    ]),
    weakEvidence:
      uncertaintyCount >= 4 ||
      includesAny(content, ["unknown", "unclear", "untested", "contradictory", "fragile", "advisory"]),
  };
}

function categoryNouns(decisionType: DecisionType) {
  switch (decisionType) {
    case "career_professional":
      return {
        option: "role",
        value: "career upside",
        constraint: "role boundary",
        operator: "you",
      };
    case "tool_workflow_adoption":
      return {
        option: "workflow change",
        value: "operational leverage",
        constraint: "migration boundary",
        operator: "team",
      };
    case "project_side_project":
      return {
        option: "project bet",
        value: "business upside",
        constraint: "execution boundary",
        operator: "operator",
      };
  }
}

function buildDecisionFrame(input: DecisionIntake, signals: DecisionSignals) {
  const nouns = categoryNouns(input.decisionType);
  const firstConstraint = input.constraints[0] ?? `keep the ${nouns.constraint} intact`;
  const firstUncertainty = input.biggestKnownUncertainties[0] ?? "the first unknown is still unresolved";
  const urgencyClause = signals.urgent
    ? "The timing matters enough that delay has a real cost."
    : "The timing is important, but not urgent enough to justify sloppy execution.";

  return `${input.whyThisMatters} ${input.title} is a choice between ${lowerFirst(
    input.primaryOption,
  )} and ${lowerFirst(input.baselineAlternative)}. The right call depends on whether the ${nouns.option} can create ${
    nouns.value
  } without breaking ${firstConstraint}. ${urgencyClause} The biggest open question is whether ${lowerFirst(
    firstUncertainty,
  )}.`;
}

function buildFailureNarrative(input: DecisionIntake) {
  const nouns = categoryNouns(input.decisionType);
  const firstConstraint = input.constraints[0] ?? `the stated ${nouns.constraint}`;
  const secondConstraint = input.constraints[1] ?? input.constraints[0] ?? `the original scope`;
  const firstUncertainty = input.biggestKnownUncertainties[0] ?? "the early signal";

  return `The ${nouns.option} fails if ${lowerFirst(input.primaryOption)} starts with a plausible thesis but expands beyond ${lowerFirst(
    firstConstraint,
  )}, never resolves whether ${lowerFirst(firstUncertainty)}, and keeps consuming attention after it is already breaking ${lowerFirst(
    secondConstraint,
  )}.`;
}

function buildRegretSummary(input: DecisionIntake, signals: DecisionSignals) {
  const nouns = categoryNouns(input.decisionType);
  const firstUncertainty = input.biggestKnownUncertainties[0] ?? "the main unknown";
  const urgencyClause = signals.urgent
    ? "Delay is not neutral here, because the timing window looks real."
    : "Delay may still be acceptable if the next evidence step is cheap and fast.";

  return `Avoiding ${lowerFirst(input.primaryOption)} preserves short-term certainty, but it also delays learning about whether this ${nouns.option} can produce ${nouns.value}. ${urgencyClause} The main cost of inaction is staying exposed to ${lowerFirst(
    firstUncertainty,
  )} for longer than necessary.`;
}

function buildCoreRationale(input: DecisionIntake, signals: DecisionSignals, scores: {
  evidenceQuality: number;
  downsideSeverity: number;
  mitigability: number;
  costOfDelay: number;
}) {
  const nouns = categoryNouns(input.decisionType);

  if (scores.downsideSeverity >= 4 && scores.mitigability <= 2) {
    return `The current version of this ${nouns.option} asks for too much commitment relative to how controllable the downside is. The risk is not just that it fails, but that it fails in a way that breaks a stated boundary before you get clean evidence.`;
  }

  if (scores.evidenceQuality <= 2 && scores.costOfDelay <= 3) {
    return `The upside may be real, but the current case is still under-evidenced. The better move is to wait for one stronger signal rather than treating open questions as if they were already resolved.`;
  }

  if (scores.evidenceQuality >= 4 && scores.downsideSeverity <= 3) {
    return `The case is concrete enough to move now, provided the first step stays bounded. The evidence is stronger than a typical medium-stakes decision, and the main risks look manageable with explicit guardrails.`;
  }

  return `There is enough signal to justify movement, but not enough to justify blind commitment. A bounded next step protects against the downside while still giving you a chance to learn quickly.`;
}

function buildRecommendedNextStep(input: DecisionIntake, signals: DecisionSignals, scores: {
  evidenceQuality: number;
  downsideSeverity: number;
  mitigability: number;
  costOfDelay: number;
}) {
  const nouns = categoryNouns(input.decisionType);
  const firstConstraint = input.constraints[0] ?? "the stated constraints";

  if (scores.downsideSeverity >= 4 && scores.mitigability <= 2) {
    return `Walk away from the current version of the ${nouns.option} and only revisit it if the downside can be reduced without breaking ${lowerFirst(
      firstConstraint,
    )}.`;
  }

  if (scores.evidenceQuality <= 2 && scores.costOfDelay <= 3) {
    return `Collect one decisive signal before committing: confirm that the first step fits ${lowerFirst(
      firstConstraint,
    )} and that the upside is more than theoretical.`;
  }

  if (scores.evidenceQuality >= 4 && scores.downsideSeverity <= 3) {
    return `Proceed with one owner, one checkpoint, and a narrow first scope so the initial move stays reversible if the signal weakens.`;
  }

  if (input.decisionType === "career_professional") {
    return "Run one bounded diligence step first: confirm the actual mandate, political load, and role boundary before committing.";
  }

  if (input.decisionType === "tool_workflow_adoption") {
    return "Run a short migration trial with one team ritual and one success metric before changing the whole workflow.";
  }

  return "Run a 2-week reversible test with one owner, one success metric, and one stop rule before expanding the scope.";
}

function buildGuardrails(input: DecisionIntake, signals: DecisionSignals) {
  const firstConstraint = input.constraints[0] ?? "the original constraints";
  const secondConstraint = input.constraints[1] ?? firstConstraint;
  const firstUncertainty = input.biggestKnownUncertainties[0] ?? "the first unknown";

  return uniqueList(
    [
      `Keep the first step inside ${firstConstraint}.`,
      `Do not expand the scope until you resolve whether ${lowerFirst(firstUncertainty)}.`,
      `Review against ${secondConstraint} before continuing.`,
      signals.pilotLike ? "Treat the first move as reversible until the evidence is clearly positive." : "",
    ],
    "Keep the first move bounded before expanding scope.",
  );
}

function buildEvidenceNeeded(input: DecisionIntake) {
  const firstUncertainty = input.biggestKnownUncertainties[0] ?? "the first unknown";
  const secondUncertainty = input.biggestKnownUncertainties[1] ?? firstUncertainty;

  return uniqueList(
    [
      `A clean answer to: ${firstUncertainty}`,
      `A first checkpoint that shows whether ${lowerFirst(secondUncertainty)}.`,
      `Evidence that the next step fits the stated constraints in practice, not just in theory.`,
    ],
    "One stronger piece of real evidence before committing further.",
  );
}

function riskEntries(input: DecisionIntake, signals: DecisionSignals, base: number) {
  const nouns = categoryNouns(input.decisionType);
  const firstConstraint = input.constraints[0] ?? `the ${nouns.constraint}`;
  const secondConstraint = input.constraints[1] ?? firstConstraint;
  const firstUncertainty = input.biggestKnownUncertainties[0] ?? "the early signal";
  const secondUncertainty = input.biggestKnownUncertainties[1] ?? firstUncertainty;

  return [
    {
      title:
        input.decisionType === "career_professional"
          ? "Role drift"
          : input.decisionType === "tool_workflow_adoption"
            ? "Migration drag"
            : "Execution cost overruns",
      description:
        input.decisionType === "career_professional"
          ? `The role expands into coordination, political work, or management beyond ${lowerFirst(firstConstraint)}.`
          : input.decisionType === "tool_workflow_adoption"
            ? `The workflow change takes longer than expected and creates migration drag before the team sees real leverage.`
            : `The primary option takes materially more time and focus than expected and breaks ${lowerFirst(firstConstraint)}.`,
      severity: clampScore(base + (signals.migrationHeavy ? 1 : 0) + (signals.supportHeavy ? 1 : 0)),
      likelihood: clampScore(base + (signals.weakEvidence ? 1 : 0) - (signals.strongEvidence ? 1 : 0)),
      detectability: 3,
      timeToImpact: "Within the first 2 to 4 weeks",
      ownerScope: input.decisionType === "career_professional" ? "You" : "Decision owner",
    },
    {
      title:
        input.decisionType === "tool_workflow_adoption" ? "Shallow adoption" : "Weak early signal",
      description:
        input.decisionType === "tool_workflow_adoption"
          ? `The team changes tools without actually changing behavior, so the new workflow never resolves whether ${lowerFirst(
              firstUncertainty,
            )}.`
          : `The first evidence gathered is too noisy to justify confidence about whether ${lowerFirst(
              firstUncertainty,
            )}.`,
      severity: clampScore(base + (signals.weakEvidence ? 1 : 0)),
      likelihood: clampScore(base + (signals.weakEvidence ? 1 : 0)),
      detectability: 2,
      timeToImpact: "Within the first 2 weeks",
      ownerScope: input.decisionType === "tool_workflow_adoption" ? "Team lead" : "Decision owner",
    },
    {
      title:
        input.decisionType === "career_professional"
          ? "Constraint mismatch"
          : input.decisionType === "tool_workflow_adoption"
            ? "Workflow disruption"
            : "Constraint drift",
      description:
        input.decisionType === "career_professional"
          ? `The offer looks attractive on paper but fails the real constraints around ${lowerFirst(firstConstraint)} and ${lowerFirst(
              secondConstraint,
            )}.`
          : input.decisionType === "tool_workflow_adoption"
            ? `The migration disrupts current planning habits before the new workflow proves it is better than the baseline.`
            : `The option violates ${lowerFirst(secondConstraint)} before it answers whether ${lowerFirst(
                secondUncertainty,
              )}.`,
      severity: clampScore(base + (signals.complianceRisk ? 1 : 0) + (signals.supportHeavy ? 1 : 0)),
      likelihood: clampScore(base - (signals.strongEvidence ? 1 : 0)),
      detectability: 4,
      timeToImpact: "During initial rollout",
      ownerScope: input.decisionType === "career_professional" ? "You" : "Decision owner",
    },
  ];
}

function assumptionEntries(input: DecisionIntake, signals: DecisionSignals, base: number) {
  const nouns = categoryNouns(input.decisionType);
  const firstConstraint = input.constraints[0] ?? `the ${nouns.constraint}`;
  const firstUncertainty = input.biggestKnownUncertainties[0] ?? "the core unknown";

  return [
    {
      statement: `The upside from ${lowerFirst(input.primaryOption)} is large enough to justify a bounded first move.`,
      fragility: clampScore(base + (signals.weakEvidence ? 1 : 0)),
      importance: 5,
      testability: 4,
    },
    {
      statement: `The first step can stay inside ${lowerFirst(firstConstraint)}.`,
      fragility: clampScore(base + 1 + (signals.supportHeavy ? 1 : 0)),
      importance: 5,
      testability: 4,
    },
    {
      statement: `The decision should become clearer once you resolve whether ${lowerFirst(firstUncertainty)}.`,
      fragility: clampScore(3 + (signals.weakEvidence ? 1 : 0)),
      importance: 4,
      testability: 3,
    },
  ];
}

function mitigationEntries(input: DecisionIntake, signals: DecisionSignals) {
  const firstConstraint = input.constraints[0] ?? "the original constraint";
  const firstUncertainty = input.biggestKnownUncertainties[0] ?? "the first unknown";

  return [
    {
      riskTitle:
        input.decisionType === "career_professional"
          ? "Role drift"
          : input.decisionType === "tool_workflow_adoption"
            ? "Migration drag"
            : "Execution cost overruns",
      checklistItem: `Time-box the first move so it stays inside ${lowerFirst(firstConstraint)}.`,
      priority: "high" as const,
      feasibility: clampScore(4 + (signals.pilotLike ? 1 : 0) - (signals.migrationHeavy ? 1 : 0)),
    },
    {
      riskTitle: input.decisionType === "tool_workflow_adoption" ? "Shallow adoption" : "Weak early signal",
      checklistItem: `Define one primary metric that resolves whether ${lowerFirst(firstUncertainty)}.`,
      priority: "high" as const,
      feasibility: clampScore(4 + (signals.strongEvidence ? 1 : 0)),
    },
    {
      riskTitle:
        input.decisionType === "career_professional"
          ? "Constraint mismatch"
          : input.decisionType === "tool_workflow_adoption"
            ? "Workflow disruption"
            : "Constraint drift",
      checklistItem: "Set a review checkpoint that explicitly compares the live result against the original constraints.",
      priority: "medium" as const,
      feasibility: clampScore(4 - (signals.supportHeavy ? 1 : 0)),
    },
  ];
}

function regretFactorEntries(input: DecisionIntake, signals: DecisionSignals, magnitude: number, timeSensitivity: number) {
  const nouns = categoryNouns(input.decisionType);

  return [
    {
      title: "Delayed learning",
      description: `Avoiding the move delays clarity on whether this ${nouns.option} can actually create ${nouns.value}.`,
      impactType: "delay_cost" as const,
      magnitude: clampScore(magnitude + (signals.urgent ? 1 : 0)),
      timeSensitivity,
    },
    {
      title:
        input.decisionType === "career_professional"
          ? "Missed career window"
          : input.decisionType === "tool_workflow_adoption"
            ? "Missed workflow leverage"
            : "Missed upside window",
      description:
        input.decisionType === "career_professional"
          ? "The role or scope expansion may be less available later if you avoid the decision now."
          : input.decisionType === "tool_workflow_adoption"
            ? "The current pain may keep compounding if the team delays a viable workflow change."
            : "A real but time-bound upside opportunity may close before the first evidence is gathered.",
      impactType:
        input.decisionType === "career_professional" ? "career_signal" : "missed_upside",
      magnitude: clampScore(magnitude + (signals.strongEvidence ? 1 : 0)),
      timeSensitivity,
    },
    {
      title:
        input.decisionType === "tool_workflow_adoption" ? "Capability stagnation" : "Capability delay",
      description:
        input.decisionType === "career_professional"
          ? "Staying put may preserve certainty, but it can also delay the scope and capability growth you want."
          : "Avoiding the option can delay a useful capability or operating improvement that matters beyond this one decision.",
      impactType: "capability_loss" as const,
      magnitude: clampScore(magnitude - (signals.convenienceOnly ? 1 : 0)),
      timeSensitivity: clampScore(timeSensitivity - 1),
    },
  ];
}

export const mockProvider = {
  name: "mock",
  model: "deterministic-local-simulator",
  async normalize(input: DecisionIntake) {
    const signals = decisionSignals(input);

    return normalizedDecisionSchema.parse({
      problemStatement: `Decide whether to ${lowerFirst(input.primaryOption)} instead of ${lowerFirst(input.baselineAlternative)}.`,
      decisionFrame: buildDecisionFrame(input, signals),
      normalizedPrimaryOption: input.primaryOption,
      normalizedBaselineAlternative: input.baselineAlternative,
      reversibility:
        signals.migrationHeavy || signals.complianceRisk
          ? "low"
          : input.decisionType === "tool_workflow_adoption" || signals.pilotLike
            ? "high"
            : input.stakesLevel === "high"
              ? "low"
              : "medium",
      timeHorizon: input.timeHorizon,
      successCriteria: uniqueList(
        [
          `Stay inside: ${input.constraints[0] ?? "the stated constraints"}`,
          input.constraints[1] ? `Also preserve: ${input.constraints[1]}` : "",
          `Evidence of success: ${input.successDefinition}`,
        ],
        `Evidence of success: ${input.successDefinition}`,
      ),
      keyUncertainties: uniqueList(input.biggestKnownUncertainties, "The next decisive uncertainty is still unresolved."),
      constraintSummary: uniqueList(input.constraints, "The first move must stay bounded."),
    });
  },
  async premortem(input: { intake: DecisionIntake; normalized: NormalizedDecision }) {
    const base = scoreFromStakes(input.intake.stakesLevel);
    const signals = decisionSignals(input.intake);

    return premortemAnalysisSchema.parse({
      failureNarrative: buildFailureNarrative(input.intake),
      risks: riskEntries(input.intake, signals, base),
      assumptions: assumptionEntries(input.intake, signals, base),
      mitigations: mitigationEntries(input.intake, signals),
    });
  },
  async regret(input: { intake: DecisionIntake; normalized: NormalizedDecision; premortem: PremortemAnalysis }) {
    const magnitude = scoreFromStakes(input.intake.stakesLevel);
    const signals = decisionSignals(input.intake);
    const timeSensitivity = clampScore(
      3 + (signals.urgent ? 1 : 0) + (signals.strongEvidence ? 1 : 0) - (signals.convenienceOnly ? 1 : 0),
    );
    const firstConstraint = input.intake.constraints[0] ?? "the stated constraints";

    return regretAnalysisSchema.parse({
      opportunityCostSummary: buildRegretSummary(input.intake, signals),
      regretFactors: regretFactorEntries(input.intake, signals, magnitude, timeSensitivity),
      evidenceThresholds: [
        {
          statement: "Proceed only if the first step stays inside the stated constraints.",
          direction: "proceed",
          metricType: "qualitative",
          thresholdText: `A scoped next step exists and fits ${lowerFirst(firstConstraint)} in practice.`,
        },
        {
          statement: "Walk away if the first signal is weak and the operating cost is clearly high.",
          direction: "walk_away",
          metricType: "qualitative",
          thresholdText: "The first checkpoint misses the primary signal and exposes a cost profile that the current constraints cannot absorb.",
        },
      ],
      killCriteria: [
        {
          statement: "Stop if the first move exceeds its original time or scope boundary by more than 50 percent.",
          triggerType: "deadline",
          windowText: "During the first test window",
        },
        {
          statement: "Stop if the first planned checkpoint still leaves the main uncertainty unresolved.",
          triggerType: "traction",
          windowText: "At the first review checkpoint",
        },
      ],
    });
  },
  async synthesize(input: {
    intake: DecisionIntake;
    normalized: NormalizedDecision;
    premortem: PremortemAnalysis;
    regret: RegretAnalysis;
  }) {
    const stakesScore = scoreFromStakes(input.intake.stakesLevel);
    const signals = decisionSignals(input.intake);
    const evidenceQuality = clampScore(
      3 +
        (signals.strongEvidence ? 1 : 0) -
        (signals.weakEvidence ? 1 : 0) -
        (signals.uncertaintyCount >= 6 ? 1 : 0),
    );
    const upsideMagnitude = clampScore(
      (input.regret.regretFactors[0]?.magnitude ?? stakesScore) +
        (signals.urgent ? 1 : 0) -
        (signals.convenienceOnly ? 1 : 0),
    );
    const downsideSeverity = Math.max(...input.premortem.risks.map((risk) => risk.severity));
    const mitigability = clampScore(
      Math.round(
        input.premortem.mitigations.reduce((sum, mitigation) => sum + mitigation.feasibility, 0) /
          input.premortem.mitigations.length,
      ) +
        (signals.pilotLike ? 1 : 0) -
        (signals.migrationHeavy ? 1 : 0) -
        (signals.complianceRisk ? 1 : 0),
    );
    const costOfDelay = clampScore(
      Math.max(...input.regret.regretFactors.map((factor) => factor.timeSensitivity)) -
        (signals.convenienceOnly ? 1 : 0) -
        (input.intake.decisionType === "tool_workflow_adoption" && !signals.urgent ? 1 : 0),
    );
    const assumptionFragility = clampScore(
      Math.max(...input.premortem.assumptions.map((assumption) => assumption.fragility)) +
        (signals.weakEvidence ? 1 : 0) -
        (signals.strongEvidence ? 1 : 0),
    );

    return synthesisDraftSchema.parse({
      evidenceQuality,
      upsideMagnitude,
      downsideSeverity,
      mitigability,
      costOfDelay,
      assumptionFragility,
      coreRationale: buildCoreRationale(input.intake, signals, {
        evidenceQuality,
        downsideSeverity,
        mitigability,
        costOfDelay,
      }),
      recommendedNextStep: buildRecommendedNextStep(input.intake, signals, {
        evidenceQuality,
        downsideSeverity,
        mitigability,
        costOfDelay,
      }),
      recommendedGuardrails: buildGuardrails(input.intake, signals),
      evidenceNeeded: buildEvidenceNeeded(input.intake),
    });
  },
};

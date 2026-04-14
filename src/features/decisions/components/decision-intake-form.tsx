"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { decisionTypeLabels } from "@/features/decisions/lib/options";
import {
  findStarterExample,
  starterExamples,
  type StarterExample,
} from "@/features/decisions/lib/starter-examples";
import { decisionTypes, stakesLevels, type DecisionIntake } from "@/lib/domain/decision";
import { cn } from "@/lib/utils/cn";

import { createDecisionAction, updateDecisionAction } from "../actions";

type Props = {
  initialValue?: DecisionIntake;
  decisionId?: string;
  starterExampleId?: string | null;
};

function asLines(value?: string[]) {
  return value?.join("\n") ?? "";
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toFormValues(value: DecisionIntake): DecisionFormValues {
  return {
    title: value.title,
    decisionType: value.decisionType,
    primaryOption: value.primaryOption,
    baselineAlternative: value.baselineAlternative,
    whyThisMatters: value.whyThisMatters,
    decisionDeadline: value.decisionDeadline,
    timeHorizon: value.timeHorizon,
    stakesLevel: value.stakesLevel,
    successDefinition: value.successDefinition,
    constraintsText: asLines(value.constraints),
    uncertaintiesText: asLines(value.biggestKnownUncertainties),
  };
}

function blankFormValues(): DecisionFormValues {
  return {
    title: "",
    decisionType: "project_side_project",
    primaryOption: "",
    baselineAlternative: "",
    whyThisMatters: "",
    decisionDeadline: "",
    timeHorizon: "",
    constraintsText: "",
    stakesLevel: "medium",
    successDefinition: "",
    uncertaintiesText: "",
  };
}

const multilineListField = z
  .string()
  .trim()
  .min(1, "Add at least one item.")
  .superRefine((value, context) => {
    const items = parseLines(value);

    if (!items.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one item.",
      });
      return;
    }

    if (items.length > 8) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use at most 8 items.",
      });
    }
  });

const decisionFormSchema = z.object({
  title: z.string().trim().min(1, "Enter a decision title.").max(120),
  decisionType: z.enum(decisionTypes),
  primaryOption: z.string().trim().min(1, "Enter the primary option.").max(240),
  baselineAlternative: z.string().trim().min(1, "Enter the baseline alternative.").max(240),
  whyThisMatters: z.string().trim().min(1, "Explain why this decision matters.").max(1200),
  decisionDeadline: z.string().date(),
  timeHorizon: z.string().trim().min(1, "Add a time horizon.").max(120),
  constraintsText: multilineListField,
  stakesLevel: z.enum(stakesLevels),
  successDefinition: z.string().trim().min(1, "Define success.").max(1200),
  uncertaintiesText: multilineListField,
});

type DecisionFormValues = z.infer<typeof decisionFormSchema>;

export function DecisionIntakeForm({ initialValue, decisionId, starterExampleId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(starterExampleId ?? null);
  const selectedExample = !decisionId ? findStarterExample(selectedExampleId) : null;
  const form = useForm<DecisionFormValues>({
    resolver: zodResolver(decisionFormSchema),
    defaultValues: initialValue
      ? toFormValues(initialValue)
      : selectedExample
        ? toFormValues(selectedExample.input)
        : blankFormValues(),
  });

  function applyStarterExample(example: StarterExample) {
    setSelectedExampleId(example.id);
    form.reset(toFormValues(example.input));
    setFormError(null);
  }

  function startBlank() {
    setSelectedExampleId(null);
    form.reset(blankFormValues());
    setFormError(null);
  }

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    const payload: DecisionIntake = {
      ...values,
      constraints: parseLines(values.constraintsText),
      biggestKnownUncertainties: parseLines(values.uncertaintiesText),
    };

    startTransition(async () => {
      const result = decisionId
        ? await updateDecisionAction(decisionId, payload)
        : await createDecisionAction(payload);

      if (!result.ok) {
        setFormError(result.error);
        return;
      }

      router.push(`/decisions/${result.decisionId}`);
      router.refresh();
    });
  });

  const fieldClassName =
    "w-full rounded-2xl border border-white/12 bg-slate-950/70 px-4 py-3 text-sm text-slate-50 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-300/30";
  const sectionClassName = "grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-[0_20px_80px_-45px_rgba(245,158,11,0.45)]";
  const groupClassName = "grid gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-5";
  const fieldError = (name: keyof DecisionFormValues) => form.formState.errors[name]?.message;

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      {!decisionId ? (
        <section className={sectionClassName}>
          <div className="grid gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Starter path</p>
            <h2 className="text-2xl font-semibold text-white">Start from blank or from an example</h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              Start from an example if you want to see a complete flow first. Examples prefill the form only and do not
              create a saved decision until you click Create decision.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startBlank}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                  selectedExampleId === null
                    ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
                    : "border-white/12 bg-white/5 text-slate-200 hover:bg-white/10",
                )}
              >
                Start blank
              </button>
              {starterExamples.map((example) => (
                <button
                  key={example.id}
                  type="button"
                  onClick={() => applyStarterExample(example)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition",
                    selectedExampleId === example.id
                      ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
                      : "border-white/12 bg-white/5 text-slate-200 hover:bg-white/10",
                  )}
                >
                  {example.title}
                </button>
              ))}
            </div>
            {selectedExample ? (
              <p className="text-sm leading-6 text-slate-300">{selectedExample.description}</p>
            ) : (
              <p className="text-sm leading-6 text-slate-400">
                Blank mode is best when you already know the exact decision framing you want to test.
              </p>
            )}
          </div>
        </section>
      ) : null}

      <section className={sectionClassName}>
        <div className="grid gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Intake</p>
          <h2 className="text-2xl font-semibold text-white">Capture the decision cleanly</h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">
            Fill in the facts we need to build a recommendation that is usable, replayable, and worth revisiting later.
          </p>
        </div>

        <fieldset className={groupClassName}>
          <legend className="px-1 text-base font-semibold text-white">Decision frame</legend>
          <p className="text-sm leading-6 text-slate-400">
            Set the decision, the baseline, and the stakes before you get into timing or evidence.
          </p>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-100">Decision title</span>
            <input className={fieldClassName} {...form.register("title")} />
            {fieldError("title") ? <span className="text-xs text-rose-200">{fieldError("title")}</span> : null}
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-100">Decision type</span>
              <select className={fieldClassName} {...form.register("decisionType")}>
                {decisionTypes.map((decisionType) => (
                  <option key={decisionType} value={decisionType}>
                    {decisionTypeLabels[decisionType]}
                  </option>
                ))}
              </select>
              {fieldError("decisionType") ? (
                <span className="text-xs text-rose-200">{fieldError("decisionType")}</span>
              ) : null}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-100">Stakes level</span>
              <select className={fieldClassName} {...form.register("stakesLevel")}>
                {stakesLevels.map((level) => (
                  <option key={level} value={level}>
                    {level[0]!.toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
              {fieldError("stakesLevel") ? (
                <span className="text-xs text-rose-200">{fieldError("stakesLevel")}</span>
              ) : null}
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-100">Primary option</span>
            <input className={fieldClassName} {...form.register("primaryOption")} />
            {fieldError("primaryOption") ? (
              <span className="text-xs text-rose-200">{fieldError("primaryOption")}</span>
            ) : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-100">Baseline alternative</span>
            <input className={fieldClassName} {...form.register("baselineAlternative")} />
            {fieldError("baselineAlternative") ? (
              <span className="text-xs text-rose-200">{fieldError("baselineAlternative")}</span>
            ) : null}
          </label>
        </fieldset>
      </section>

      <section className={sectionClassName}>
        <fieldset className={groupClassName}>
          <legend className="px-1 text-base font-semibold text-white">Timing and outcome</legend>
          <p className="text-sm leading-6 text-slate-400">
            Set the operating window and define what success looks like before the analysis starts.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-100">Decision deadline</span>
              <input className={fieldClassName} type="date" {...form.register("decisionDeadline")} />
              {fieldError("decisionDeadline") ? (
                <span className="text-xs text-rose-200">{fieldError("decisionDeadline")}</span>
              ) : null}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-100">Time horizon</span>
              <input
                className={fieldClassName}
                placeholder="e.g. 6 weeks, 3 months, 12 months"
                {...form.register("timeHorizon")}
              />
              {fieldError("timeHorizon") ? (
                <span className="text-xs text-rose-200">{fieldError("timeHorizon")}</span>
              ) : null}
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-100">Why this decision matters</span>
            <textarea className={cn(fieldClassName, "min-h-28")} {...form.register("whyThisMatters")} />
            {fieldError("whyThisMatters") ? (
              <span className="text-xs text-rose-200">{fieldError("whyThisMatters")}</span>
            ) : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-100">Success definition</span>
            <textarea className={cn(fieldClassName, "min-h-28")} {...form.register("successDefinition")} />
            {fieldError("successDefinition") ? (
              <span className="text-xs text-rose-200">{fieldError("successDefinition")}</span>
            ) : null}
          </label>
        </fieldset>

        <fieldset className={groupClassName}>
          <legend className="px-1 text-base font-semibold text-white">Constraints and unknowns</legend>
          <p className="text-sm leading-6 text-slate-400">
            Capture the practical limits and the biggest unanswered questions so the recommendation stays grounded.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-100">Constraints</span>
              <textarea
                className={cn(fieldClassName, "min-h-40")}
                placeholder={"One line per constraint\nTime cap\nBudget cap\nReputation limit"}
                {...form.register("constraintsText")}
              />
              {fieldError("constraintsText") ? (
                <span className="text-xs text-rose-200">{fieldError("constraintsText")}</span>
              ) : null}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-100">Biggest known uncertainties</span>
              <textarea
                className={cn(fieldClassName, "min-h-40")}
                placeholder={"One line per uncertainty\nSignal quality\nAdoption risk\nExecution cost"}
                {...form.register("uncertaintiesText")}
              />
              {fieldError("uncertaintiesText") ? (
                <span className="text-xs text-rose-200">{fieldError("uncertaintiesText")}</span>
              ) : null}
            </label>
          </div>
        </fieldset>
      </section>

      {(formError || Object.keys(form.formState.errors).length > 0) && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {formError ?? "Please fix the highlighted fields and try again."}
        </div>
      )}

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : decisionId ? "Save intake revision" : "Create decision"}
        </button>
        <p className="text-sm text-slate-400">
          Target completion time: 5 to 8 minutes. The recommendation becomes more useful when the constraints and
          uncertainties are concrete.
        </p>
      </div>
    </form>
  );
}

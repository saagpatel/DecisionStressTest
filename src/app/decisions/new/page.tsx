import { DecisionPageHeader } from "@/features/decisions/components/decision-page-header";
import { DecisionIntakeForm } from "@/features/decisions/components/decision-intake-form";
import { ProviderStatusStrip } from "@/features/decisions/components/provider-status-strip";
import { aiConfigIssues, env } from "@/lib/config/env";
import { deriveProviderStatus } from "@/features/decisions/lib/provider-status";

export const runtime = "nodejs";

export default async function NewDecisionPage({
  searchParams,
}: {
  searchParams: Promise<{ example?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const exampleParam = Array.isArray(resolvedSearchParams.example)
    ? resolvedSearchParams.example[0]
    : resolvedSearchParams.example;
  const providerStatus = deriveProviderStatus({
    provider: env.AI_PROVIDER,
    aiEnabled: env.AI_ENABLED,
    issues: aiConfigIssues,
  });

  return (
    <main id="page-content" tabIndex={-1} className="grid gap-8">
      <DecisionPageHeader
        backHref="/"
        backLabel="← Back to home"
        eyebrow="Structured intake"
        title="Start a new decision"
        description="This intake becomes the operating contract for the rest of the workbench. Keep it concrete enough that the later risk, evidence, and recommendation artifacts stay practical."
      />

      <ProviderStatusStrip
        status={providerStatus}
        note="Start from an example if you want to see a complete local flow first."
      />

      <DecisionIntakeForm starterExampleId={exampleParam ?? null} />
    </main>
  );
}

import Link from "next/link";

import { BackupPanel } from "@/features/decisions/components/backup-panel";
import { DecisionPageHeader } from "@/features/decisions/components/decision-page-header";
import { DecisionList } from "@/features/decisions/components/decision-list";
import { appDataDir } from "@/lib/config/paths";
import { getLatestDatabaseBackup } from "@/lib/db/backup";
import { listDecisions } from "@/lib/db/repositories";

export const runtime = "nodejs";

export default async function DecisionsPage() {
  const decisions = await listDecisions();
  const latestBackup = getLatestDatabaseBackup();

  return (
    <main id="page-content" tabIndex={-1} className="grid gap-8">
      <DecisionPageHeader
        backHref="/"
        backLabel="← Back to home"
        eyebrow="Saved history"
        title="Decision ledger"
        description="Use this page as the local control center for saved decisions and backup-safe operations. Open a decision to rerun the latest snapshot, inspect a memo, or review what changed over time."
        action={
          <Link
            href="/decisions/new"
            className="rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
          >
            New decision
          </Link>
        }
      />

      <BackupPanel appDataPath={appDataDir} latestBackup={latestBackup} />

      <DecisionList decisions={decisions} emptyCopy="No decisions saved yet." />
    </main>
  );
}

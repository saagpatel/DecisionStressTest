import { NextResponse } from "next/server";

import { exportFilename } from "@/lib/export/markdown";
import { getDecisionById } from "@/lib/db/repositories";
import { securityHeadersObject } from "@/lib/security/headers";
import { assertLocalRequest } from "@/lib/security/local-access";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ decisionId: string }> },
) {
  await assertLocalRequest();
  const { decisionId } = await params;
  const detail = await getDecisionById(decisionId);

  if (!detail?.decision || !detail.memo) {
    return new NextResponse("Memo not found", { status: 404 });
  }

  return new NextResponse(detail.memo, {
    status: 200,
    headers: {
      ...securityHeadersObject(),
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename(detail.decision.slug)}"`,
    },
  });
}

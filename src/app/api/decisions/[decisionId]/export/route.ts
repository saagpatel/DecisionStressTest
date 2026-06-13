import { NextResponse } from "next/server";
import { getDecisionById } from "@/lib/db/repositories";
import { exportFilename } from "@/lib/export/markdown";
import { securityHeadersObject } from "@/lib/security/headers";
import { assertLocalRequest } from "@/lib/security/local-access";

export const runtime = "nodejs";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ decisionId: string }> },
) {
	await assertLocalRequest();
	const { decisionId } = await params;
	const detail = await getDecisionById(decisionId);

	if (!detail?.decision || !detail.memo) {
		return new NextResponse("Memo not found", { status: 404 });
	}

	const format = new URL(request.url).searchParams.get("format");

	if (format === "json") {
		return new NextResponse(JSON.stringify(detail), {
			status: 200,
			headers: {
				...securityHeadersObject(),
				"Cache-Control": "no-store, max-age=0",
				"Content-Type": "application/json; charset=utf-8",
				"Content-Disposition": `attachment; filename="${exportFilename(detail.decision.slug, "json")}"`,
			},
		});
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

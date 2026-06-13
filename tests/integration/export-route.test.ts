import { beforeEach, describe, expect, test, vi } from "vitest";

const assertLocalRequestMock = vi.fn();
const getDecisionByIdMock = vi.fn();

vi.mock("@/lib/security/local-access", () => ({
	assertLocalRequest: assertLocalRequestMock,
}));

vi.mock("@/lib/db/repositories", () => ({
	getDecisionById: getDecisionByIdMock,
}));

const DECISION_STUB = {
	decision: { id: "decision_1", slug: "take-the-role-123abc" },
	snapshot: null,
	recommendation: { label: "Proceed" },
	memo: "# Decision memo\n\n## Recommendation\nProceed",
};

describe("decision memo export route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("returns 404 when the memo is missing", async () => {
		getDecisionByIdMock.mockResolvedValue({
			decision: { id: "decision_1", slug: "take-the-role-123abc" },
			memo: null,
		});

		const { GET } = await import(
			"@/app/api/decisions/[decisionId]/export/route"
		);
		const response = await GET(
			new Request("http://127.0.0.1:3000/api/decisions/decision_1/export"),
			{
				params: Promise.resolve({ decisionId: "decision_1" }),
			},
		);

		expect(assertLocalRequestMock).toHaveBeenCalled();
		expect(response.status).toBe(404);
		await expect(response.text()).resolves.toBe("Memo not found");
	});

	// regression: markdown path must be unaffected by the addition of format routing
	test("returns markdown with download and cache-safe headers when the memo exists", async () => {
		getDecisionByIdMock.mockResolvedValue(DECISION_STUB);

		const { GET } = await import(
			"@/app/api/decisions/[decisionId]/export/route"
		);
		const response = await GET(
			new Request("http://127.0.0.1:3000/api/decisions/decision_1/export"),
			{
				params: Promise.resolve({ decisionId: "decision_1" }),
			},
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe(
			"text/markdown; charset=utf-8",
		);
		expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
		expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
		expect(response.headers.get("X-Frame-Options")).toBe("DENY");
		expect(response.headers.get("Cross-Origin-Opener-Policy")).toBe(
			"same-origin",
		);
		expect(response.headers.get("Content-Disposition")).toContain(
			'attachment; filename="take-the-role-123abc-decision-memo.md"',
		);
		await expect(response.text()).resolves.toContain("## Recommendation");
	});

	test("returns JSON with download and cache-safe headers when format=json", async () => {
		getDecisionByIdMock.mockResolvedValue(DECISION_STUB);

		const { GET } = await import(
			"@/app/api/decisions/[decisionId]/export/route"
		);
		const response = await GET(
			new Request(
				"http://127.0.0.1:3000/api/decisions/decision_1/export?format=json",
			),
			{ params: Promise.resolve({ decisionId: "decision_1" }) },
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe(
			"application/json; charset=utf-8",
		);
		expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
		expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(response.headers.get("Content-Disposition")).toContain(
			'attachment; filename="take-the-role-123abc-decision-memo.json"',
		);

		const body = await response.json();
		expect(body.decision.id).toBe("decision_1");
		expect(body.recommendation.label).toBe("Proceed");
		expect(body.memo).toBe(DECISION_STUB.memo);
	});

	test("returns markdown (not JSON) when format param is absent", async () => {
		getDecisionByIdMock.mockResolvedValue(DECISION_STUB);

		const { GET } = await import(
			"@/app/api/decisions/[decisionId]/export/route"
		);
		const response = await GET(
			new Request("http://127.0.0.1:3000/api/decisions/decision_1/export"),
			{
				params: Promise.resolve({ decisionId: "decision_1" }),
			},
		);

		expect(response.headers.get("Content-Type")).toBe(
			"text/markdown; charset=utf-8",
		);
		expect(response.headers.get("Content-Disposition")).toContain('.md"');
	});
});

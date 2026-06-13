import { describe, expect, test } from "vitest";

import { deriveRecommendationStatus } from "@/features/decisions/lib/decision-status";

describe("deriveRecommendationStatus", () => {
	test("returns fresh when current recommendation exists", () => {
		const result = deriveRecommendationStatus({
			hasCurrentRecommendation: true,
			hasHistoricalRecommendation: false,
		});
		expect(result.tone).toBe("fresh");
		expect(result.badge).toBe("Fresh");
	});

	test("returns pending-refresh when historical rec exists and no timestamps provided", () => {
		const result = deriveRecommendationStatus({
			hasCurrentRecommendation: false,
			hasHistoricalRecommendation: true,
		});
		expect(result.tone).toBe("warning");
		expect(result.badge).toBe("Pending refresh");
	});

	test("returns not-generated when no recommendations exist", () => {
		const result = deriveRecommendationStatus({
			hasCurrentRecommendation: false,
			hasHistoricalRecommendation: false,
		});
		expect(result.tone).toBe("pending");
		expect(result.badge).toBe("Not generated");
	});

	describe("stale boundary — timestamp comparison", () => {
		const older = new Date("2024-01-10T10:00:00Z");
		const newer = new Date("2024-01-11T10:00:00Z");

		test("run newer than recommendation → stale (pending refresh)", () => {
			const result = deriveRecommendationStatus({
				hasCurrentRecommendation: false,
				hasHistoricalRecommendation: true,
				lastRunAt: newer,
				lastRecommendationAt: older,
			});
			expect(result.tone).toBe("warning");
			expect(result.badge).toBe("Pending refresh");
		});

		test("run older than recommendation → not stale (not generated)", () => {
			const result = deriveRecommendationStatus({
				hasCurrentRecommendation: false,
				hasHistoricalRecommendation: true,
				lastRunAt: older,
				lastRecommendationAt: newer,
			});
			expect(result.tone).toBe("pending");
			expect(result.badge).toBe("Not generated");
		});

		test("run at same instant as recommendation → not stale (not generated)", () => {
			const ts = new Date("2024-01-10T10:00:00Z");
			const result = deriveRecommendationStatus({
				hasCurrentRecommendation: false,
				hasHistoricalRecommendation: true,
				lastRunAt: ts,
				lastRecommendationAt: ts,
			});
			expect(result.tone).toBe("pending");
			expect(result.badge).toBe("Not generated");
		});

		test("only lastRunAt provided (lastRecommendationAt null) → falls back to stale", () => {
			const result = deriveRecommendationStatus({
				hasCurrentRecommendation: false,
				hasHistoricalRecommendation: true,
				lastRunAt: newer,
				lastRecommendationAt: null,
			});
			expect(result.tone).toBe("warning");
		});

		test("only lastRecommendationAt provided (lastRunAt null) → falls back to stale", () => {
			const result = deriveRecommendationStatus({
				hasCurrentRecommendation: false,
				hasHistoricalRecommendation: true,
				lastRunAt: null,
				lastRecommendationAt: older,
			});
			expect(result.tone).toBe("warning");
		});
	});
});

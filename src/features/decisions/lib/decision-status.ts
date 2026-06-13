import type { StageName } from "@/lib/domain/decision";

export function deriveRecommendationStatus(params: {
	hasCurrentRecommendation: boolean;
	hasHistoricalRecommendation: boolean;
	lastRunAt?: Date | null;
	lastRecommendationAt?: Date | null;
}) {
	if (params.hasCurrentRecommendation) {
		return {
			badge: "Fresh",
			title: "Recommendation is current for this snapshot.",
			tone: "fresh" as const,
		};
	}

	if (params.hasHistoricalRecommendation) {
		// When timestamps are available, only flag stale if a run occurred after the last recommendation.
		const isStale =
			params.lastRunAt != null && params.lastRecommendationAt != null
				? params.lastRunAt > params.lastRecommendationAt
				: true;

		if (isStale) {
			return {
				badge: "Pending refresh",
				title:
					"The latest intake changed. Re-run downstream stages before relying on the previous recommendation.",
				tone: "warning" as const,
			};
		}
	}

	return {
		badge: "Not generated",
		title: "The latest snapshot has not produced a recommendation yet.",
		tone: "pending" as const,
	};
}

export function decisionStatusToneClassName(
	tone: "fresh" | "warning" | "pending",
) {
	switch (tone) {
		case "fresh":
			return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
		case "warning":
			return "border-amber-300/20 bg-amber-300/10 text-amber-100";
		case "pending":
			return "border-white/12 bg-white/5 text-slate-200";
	}
}

export function describeStageForList(stage: StageName) {
	switch (stage) {
		case "intake":
			return "Intake revision";
		case "normalization":
			return "Decision frame";
		case "premortem":
			return "Risk review";
		case "regret":
			return "Tradeoff review";
		case "synthesis":
			return "Recommendation";
		case "memo":
			return "Memo ready";
	}
}

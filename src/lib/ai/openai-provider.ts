import OpenAI, { APIConnectionError, APIConnectionTimeoutError, APIError } from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { env } from "@/lib/config/env";
import type {
  DecisionIntake,
  NormalizedDecision,
  PremortemAnalysis,
  RegretAnalysis,
  SynthesisDraft,
} from "@/lib/domain/decision";
import {
  normalizedDecisionSchema,
  premortemAnalysisSchema,
  regretAnalysisSchema,
  synthesisDraftSchema,
} from "@/lib/domain/decision";

import {
  buildNormalizationPrompt,
  buildPremortemPrompt,
  buildRegretPrompt,
  buildSynthesisPrompt,
} from "./prompts";
import { StageExecutionError } from "../analysis/errors";

function getClient() {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai.");
  }

  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
}

async function parseStructured<T>(params: {
  schemaName: string;
  instructions: string;
  schema: Parameters<typeof zodTextFormat>[0];
}) {
  try {
    const client = getClient();
    const response = await client.responses.parse({
      model: env.AI_MODEL,
      input: [
        {
          role: "system",
          content: "Return only the structured fields that best fit the schema. Keep outputs concrete and concise.",
        },
        {
          role: "user",
          content: params.instructions,
        },
      ],
      text: {
        format: zodTextFormat(params.schema, params.schemaName),
      },
    });

    if (!response.output_parsed) {
      const refusal = (response.output as Array<{ content?: Array<{ type?: string; refusal?: string }> }>)
        .flatMap((item) => item.content ?? [])
        .find((item) => item.type === "refusal");

      if (refusal?.refusal) {
        throw new StageExecutionError({
          type: "refusal",
          message: "The model refused to complete this stage.",
          retryable: false,
          recoveryAction: "edit_intake",
          refusalReason: refusal.refusal,
        });
      }

      throw new StageExecutionError({
        type: "schema_invalid",
        message: "The AI provider returned no structured output for this stage.",
        retryable: true,
        recoveryAction: "review_prompt_contract",
      });
    }

    return response.output_parsed as T;
  } catch (error) {
    if (error instanceof StageExecutionError) {
      throw error;
    }

    if (error instanceof APIConnectionTimeoutError) {
      throw new StageExecutionError({
        type: "timeout",
        message: "The model request timed out before this stage completed.",
        retryable: true,
        recoveryAction: "retry_stage",
      });
    }

    if (error instanceof APIConnectionError || error instanceof APIError) {
      throw new StageExecutionError({
        type: "provider_unavailable",
        message: "The OpenAI provider is unavailable right now.",
        retryable: true,
        recoveryAction: env.AI_PROVIDER === "openai" ? "check_ai_configuration" : "switch_to_mock_provider",
      });
    }

    throw error;
  }
}

export const openAiProvider = {
  name: "openai",
  model: env.AI_MODEL,
  normalize(input: DecisionIntake) {
    return parseStructured<NormalizedDecision>({
      schemaName: "normalized_decision",
      instructions: buildNormalizationPrompt(input),
      schema: normalizedDecisionSchema,
    });
  },
  premortem(input: { intake: DecisionIntake; normalized: NormalizedDecision }) {
    return parseStructured<PremortemAnalysis>({
      schemaName: "premortem_analysis",
      instructions: buildPremortemPrompt(input),
      schema: premortemAnalysisSchema,
    });
  },
  regret(input: {
    intake: DecisionIntake;
    normalized: NormalizedDecision;
    premortem: PremortemAnalysis;
  }) {
    return parseStructured<RegretAnalysis>({
      schemaName: "regret_analysis",
      instructions: buildRegretPrompt(input),
      schema: regretAnalysisSchema,
    });
  },
  synthesize(input: {
    intake: DecisionIntake;
    normalized: NormalizedDecision;
    premortem: PremortemAnalysis;
    regret: RegretAnalysis;
  }) {
    return parseStructured<SynthesisDraft>({
      schemaName: "synthesis_draft",
      instructions: buildSynthesisPrompt(input),
      schema: synthesisDraftSchema,
    });
  },
};

// This file exists to maintain backwards compatibility.
// The actual AI logic has been moved to src/lib/ai/provider.ts

import { generateAISummary, generateBatchTransactionExplanations, generateChatContent } from "./ai/provider";
import { generateFallbackTransactionExplanation } from "./ai/fallback";

export {
  generateAISummary,
  generateBatchTransactionExplanations,
  generateFallbackTransactionExplanation,
};

export async function generateChatResponse(
  message: string,
  analysisContext: string | null,
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const systemPrompt = `You are FraudWatch AI, an expert financial fraud detection assistant. You help analysts understand fraud patterns, interpret results, and provide recommendations.${analysisContext ? `\n\nCurrent Analysis Context:\n${analysisContext}` : ""}`;
  
  try {
    const res = await generateChatContent(message, systemPrompt, history);
    return res.text;
  } catch (err) {
    return "I encountered an error processing your request. Please try again.";
  }
}

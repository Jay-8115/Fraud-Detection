import { generateWithGemini, generateChatWithGemini } from "./gemini-provider";
import { generateWithGroq, generateChatWithGroq } from "./groq-provider";
import { generateFallbackSummary, generateFallbackTransactionExplanation } from "./fallback";

export type AIProvider = "gemini" | "groq" | "system";

export async function generateContent(prompt: string): Promise<{ text: string, provider: AIProvider }> {
  const primary = process.env.AI_PRIMARY_PROVIDER === "groq" ? "groq" : "gemini";
  const fallback = process.env.AI_FALLBACK_PROVIDER === "groq" ? "groq" : "gemini";
  const enableFallback = process.env.AI_ENABLE_FALLBACK === "true";

  let lastError: any = null;

  try {
    if (primary === "gemini") {
      const text = await generateWithGemini(prompt);
      return { text, provider: "gemini" };
    } else if (primary === "groq") {
      const text = await generateWithGroq(prompt);
      return { text, provider: "groq" };
    }
  } catch (err: any) {
    lastError = err;
    console.warn(`Primary AI provider (${primary}) failed:`, err?.message || "Unknown error");
  }

  if (enableFallback) {
    try {
      if (fallback === "groq") {
        const text = await generateWithGroq(prompt);
        return { text, provider: "groq" };
      } else if (fallback === "gemini") {
        const text = await generateWithGemini(prompt);
        return { text, provider: "gemini" };
      }
    } catch (err: any) {
      console.warn(`Fallback AI provider (${fallback}) failed:`, err?.message || "Unknown error");
    }
  }

  throw new Error(`All configured AI providers failed. Last primary error: ${lastError?.message}`);
}

export async function generateChatContent(
  message: string, 
  systemPrompt: string, 
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<{ text: string, provider: AIProvider }> {
  const primary = process.env.AI_PRIMARY_PROVIDER === "groq" ? "groq" : "gemini";
  const fallback = process.env.AI_FALLBACK_PROVIDER === "groq" ? "groq" : "gemini";
  const enableFallback = process.env.AI_ENABLE_FALLBACK === "true";

  try {
    if (primary === "gemini") {
      const text = await generateChatWithGemini(message, systemPrompt, history);
      return { text, provider: "gemini" };
    } else if (primary === "groq") {
      const text = await generateChatWithGroq(message, systemPrompt, history);
      return { text, provider: "groq" };
    }
  } catch (err) {
    console.warn("Primary AI provider chat failed", err);
  }

  if (enableFallback) {
    try {
      if (fallback === "groq") {
        const text = await generateChatWithGroq(message, systemPrompt, history);
        return { text, provider: "groq" };
      } else if (fallback === "gemini") {
        const text = await generateChatWithGemini(message, systemPrompt, history);
        return { text, provider: "gemini" };
      }
    } catch (err) {
      console.warn("Fallback AI provider chat failed", err);
    }
  }

  throw new Error("AI Assistant is currently unavailable.");
}

// Map the old gemini.ts functions directly to the new multi-provider logic

export async function generateAISummary(params: any): Promise<{ text: string, provider: AIProvider }> {
  const txInfo = params.suspiciousTransactions && params.suspiciousTransactions.length > 0
    ? `Here are some of the flagged transactions: ${JSON.stringify(params.suspiciousTransactions.map((t: any) => ({ id: t.transactionId, amount: t.amount, merchant: t.merchant, location: t.location, reason: t.reason })))}`
    : "";

  const prompt = `You are a financial fraud analysis expert. Generate a comprehensive analysis report for a fraud detection audit.
  
Dataset: ${params.fileName}
Total Transactions: ${params.totalTransactions}
Fraud Detected: ${params.fraudCount} (${params.fraudPercentage.toFixed(1)}%)
Legitimate: ${params.legitimateCount}
Ensemble Engine Model: ${params.modelName}
Risk Breakdown: Critical=${params.riskBreakdown.critical}, High=${params.riskBreakdown.high}, Medium=${params.riskBreakdown.medium}, Low=${params.riskBreakdown.low}
${txInfo}

Please structure the output with clear headers exactly as follows:

# Executive Summary
[Write 3-4 sentences outlining the overall threat level, dataset details, and main outcomes.]

# Business Summary
[Provide a summary of the business impact, estimated exposure, and fraud prevalence.]

# Fraud Pattern Analysis
[Analyze common vectors, e.g., location anomalies, velocity failures, card-not-present indicators.]

# Suspicious Behaviour
[Describe the general characteristics of the anomalies found, like device or location mismatching.]

# High Risk Customers
[Identify high-risk customer behavior trends and lists.]

# High Risk Merchants
[Identify merchant categories or vendors showing elevated levels of risk.]

# Key Findings
[Provide bullet points of the critical findings from the dataset analysis.]

# Business Recommendations
[List 3-4 strategic business actions to take immediately based on findings.]

# Future Prevention
[Outline long-term security measures, monitoring rules, and architectural changes.]

# Transaction Flag Reasoning
[Provide a short 1-2 sentence explanation of why each of the flagged transactions was classified as anomalous based on model votes.]`;

  try {
    return await generateContent(prompt);
  } catch (err) {
    return { text: generateFallbackSummary(params), provider: "system" };
  }
}

export async function generateBatchTransactionExplanations(
  flaggedTxs: Array<{
    transactionId: string;
    amount: number | null;
    riskLevel: string;
    probability: number;
    rawData: any;
  }>,
  meanAmount: number
): Promise<{ explanations: Record<string, string>, provider: AIProvider }> {
  const results: Record<string, string> = {};

  // Initialize all with fallback first
  for (const tx of flaggedTxs) {
    results[tx.transactionId] = generateFallbackTransactionExplanation(tx, meanAmount);
  }

  if (flaggedTxs.length === 0) {
    return { explanations: results, provider: "system" };
  }

  // Generate for the entire batch
  const prompt = `You are a financial fraud analysis expert. Convert machine learning anomaly detection outputs for a batch of transactions into natural language, analyst-friendly explanations.

Mean average transaction amount in dataset: $${meanAmount.toFixed(2)}

Transactions data to explain:
${JSON.stringify(flaggedTxs.map(tx => ({
  transactionId: tx.transactionId,
  amount: tx.amount,
  riskLevel: tx.riskLevel,
  probability: tx.probability,
  rawData: tx.rawData
})))}

Please explain why each transaction is suspicious. You MUST return your output as a valid JSON object mapping transaction IDs to their explanations.
Example format:
{
  "TXN-2345": "• Transaction amount is 8x higher than the user's average.\\n• Login originated from a new country.\\n• Device risk score is 0.91.\\n• Transaction occurred at 2:13 AM.\\n• Similar patterns were seen in previous fraudulent transactions.\\n• Risk Level: High\\n• Confidence: 96%"
}

Do not include any markdown formatting like \`\`\`json or anything else. Return ONLY the raw JSON string.`;

  try {
    const { text, provider } = await generateContent(prompt);
    const cleanJsonStr = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleanJsonStr);
    
    for (const [txId, explanation] of Object.entries(parsed)) {
      if (typeof explanation === "string") {
        results[txId] = explanation;
      }
    }
    return { explanations: results, provider };
  } catch (err) {
    console.error("Error generating batch explanation, falling back to system rules:", err);
    return { explanations: results, provider: "system" };
  }
}

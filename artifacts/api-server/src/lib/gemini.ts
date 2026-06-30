import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!genAI) genAI = new GoogleGenerativeAI(key);
  return genAI;
}

export async function generateAISummary(params: {
  fileName: string;
  totalTransactions: number;
  fraudCount: number;
  legitimateCount: number;
  fraudPercentage: number;
  modelName: string;
  accuracy: number;
  riskBreakdown: { critical: number; high: number; medium: number; low: number };
}): Promise<string> {
  const client = getClient();

  if (!client) {
    return generateFallbackSummary(params);
  }

  const prompt = `You are a financial fraud analysis expert. Generate a concise executive summary (3-5 sentences) for a fraud detection report.

Dataset: ${params.fileName}
Total Transactions: ${params.totalTransactions}
Fraud Detected: ${params.fraudCount} (${params.fraudPercentage.toFixed(1)}%)
Legitimate: ${params.legitimateCount}
Model: ${params.modelName} with ${(params.accuracy * 100).toFixed(1)}% accuracy
Risk: Critical=${params.riskBreakdown.critical}, High=${params.riskBreakdown.high}, Medium=${params.riskBreakdown.medium}, Low=${params.riskBreakdown.low}

Write a professional executive summary with key findings, risk assessment, and 2-3 actionable recommendations. Be specific and use business language.`;

  try {
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch {
    return generateFallbackSummary(params);
  }
}

export async function generateChatResponse(
  message: string,
  analysisContext: string | null,
  history: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<string> {
  const client = getClient();

  if (!client) {
    return "AI Assistant is not configured. Please add your Gemini API key to enable AI chat. In the meantime, I can tell you that the analysis results are displayed in the dashboard and you can view detailed transaction breakdowns in the Results tab.";
  }

  const systemPrompt = `You are FraudWatch AI, an expert financial fraud detection assistant. You help analysts understand fraud patterns, interpret results, and provide recommendations.${analysisContext ? `\n\nCurrent Analysis Context:\n${analysisContext}` : ""}`;

  const contents = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user" as const, parts: [{ text: message }] },
  ];

  try {
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat({
      history: [{ role: "user", parts: [{ text: systemPrompt }] }, { role: "model", parts: [{ text: "Understood. I'm ready to help analyze fraud patterns and provide expert insights." }] }],
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (err) {
    return "I encountered an error processing your request. Please try again.";
  }
}

function generateFallbackSummary(params: {
  fileName: string;
  totalTransactions: number;
  fraudCount: number;
  fraudPercentage: number;
  modelName: string;
  accuracy: number;
  riskBreakdown: { critical: number; high: number; medium: number; low: number };
}): string {
  return `The uploaded dataset "${params.fileName}" contains ${params.totalTransactions.toLocaleString()} transactions analyzed using the ${params.modelName} model, achieving ${(params.accuracy * 100).toFixed(1)}% accuracy. ${params.fraudCount} transactions (${params.fraudPercentage.toFixed(1)}%) were classified as fraudulent, including ${params.riskBreakdown.critical} critical and ${params.riskBreakdown.high} high-risk cases requiring immediate attention. Recommended actions include implementing multi-factor authentication for high-value transactions, enabling real-time IP geolocation verification, and establishing transaction velocity monitoring to prevent repeat fraud attempts.`;
}

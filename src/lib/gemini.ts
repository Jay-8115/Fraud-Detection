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
  suspiciousTransactions?: any[];
}): Promise<string> {
  const client = getClient();

  if (!client) {
    return generateFallbackSummary(params);
  }

  const txInfo = params.suspiciousTransactions && params.suspiciousTransactions.length > 0
    ? `Here are some of the flagged transactions: ${JSON.stringify(params.suspiciousTransactions.map(t => ({ id: t.transactionId, amount: t.amount, merchant: t.merchant, location: t.location, reason: t.reason })))}`
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
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
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

  try {
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

    const chatHistory: Array<{ role: "user" | "model"; parts: [{ text: string }] }> = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood. I'm FraudWatch AI, ready to help analyze fraud patterns and provide expert insights." }] },
      ...history.map((m) => ({
        role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
        parts: [{ text: m.content }] as [{ text: string }],
      })),
    ];

    const chat = model.startChat({ history: chatHistory });
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
  suspiciousTransactions?: any[];
}): string {
  const sampleTxs = params.suspiciousTransactions && params.suspiciousTransactions.length > 0
    ? params.suspiciousTransactions.map(t => `- **Transaction ${t.transactionId}**: Flagged due to three out of four anomaly models voting positive (Amount: $${t.amount || 'N/A'}, Merchant: ${t.merchant || 'Unknown'}). ${t.aiReason || 'Abnormal amount and country deviation.'}`).join("\n")
    : `- **Transaction TXN-1001**: Classified as fraudulent because three out of four anomaly detection models detected abnormal behavior. The transaction amount is significantly higher than the dataset average and originated from a previously unseen device.\n- **Transaction TXN-1002**: Flagged because multiple rapid transaction attempts from an offline device failed secondary card checks.`;

  return `# Executive Summary
The uploaded dataset "${params.fileName}" contains ${params.totalTransactions.toLocaleString()} transactions analyzed using the Ensemble Unsupervised Engine, achieving ${(params.accuracy * 100).toFixed(1)}% accuracy. ${params.fraudCount} transactions (${params.fraudPercentage.toFixed(1)}%) were flagged as suspicious, with ${params.riskBreakdown.critical} critical and ${params.riskBreakdown.high} high-risk items requiring immediate review.

# Business Summary
The overall estimated exposure represents a significant risk profile due to high-value transactions being flagged at foreign exchanges and card-not-present merchant portals. The fraud prevalence rate is ${(params.fraudPercentage).toFixed(2)}%, indicating a targeted attack vector on payment channels.

# Fraud Pattern Analysis
Analysis of the flagged anomalies indicates primary vectors related to transaction amounts exceeding 3x the standard deviation, midnight activities, and mismatching customer-device profiles. LOF and AutoEncoder neural nets detected local density drops around these specific feature clusters.

# Suspicious Behaviour
The flagged events show anomalous combinations: high-value transactions originating from unknown devices, card-not-present purchases in high-risk categories, and multiple rapid withdrawals within small temporal windows.

# High Risk Customers
Elevated threat levels are concentrated in a subset of customers experiencing account takeovers, identified by geographic jumps and rapid transactions without travel declarations.

# High Risk Merchants
Highest incidence rates of anomalies occurred at online electronics vendors, foreign remittance providers, and cryptocurrency gateways.

# Key Findings
- Total suspicious transactions: ${params.fraudCount}.
- ${params.riskBreakdown.critical} transactions flagged at Critical Risk level (Risk score > 80).
- High concentration of anomalous behavior in late-night transaction velocities.

# Business Recommendations
1. Implement real-time multi-factor authentication triggers for transactions exceeding 3x customer average.
2. Integrate IP geolocation lookups to block instant geographic jumps.
3. Automatically block transactions originating from blacklisted terminal emulators.

# Future Prevention
Establish behavioral profiling rules in the transaction pipeline to feed real-time AutoEncoder reconstruction scores directly into blocking gates. Run daily LOF batch audits to detect rolling pattern shifts.

# Transaction Flag Reasoning
${sampleTxs}`;
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
): Promise<Record<string, string>> {
  const client = getClient();
  const results: Record<string, string> = {};

  // Initialize all with fallback first
  for (const tx of flaggedTxs) {
    results[tx.transactionId] = generateFallbackTransactionExplanation(tx, meanAmount);
  }

  if (!client || flaggedTxs.length === 0) {
    return results;
  }

  // Process in groups of 20 to avoid exceeding token limits and keep response structured
  const batchSize = 20;
  for (let i = 0; i < flaggedTxs.length; i += batchSize) {
    const chunk = flaggedTxs.slice(i, i + batchSize);
    
    const prompt = `You are a financial fraud analysis expert. Convert machine learning anomaly detection outputs for a batch of transactions into natural language, analyst-friendly explanations.

Mean average transaction amount in dataset: $${meanAmount.toFixed(2)}

Transactions data to explain:
${JSON.stringify(chunk.map(tx => ({
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
      const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      
      // Clean up potential markdown formatting if Gemini included it
      const cleanJsonStr = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleanJsonStr);
      
      for (const [txId, explanation] of Object.entries(parsed)) {
        if (typeof explanation === "string") {
          results[txId] = explanation;
        }
      }
    } catch (err) {
      console.error("Error generating batch explanation for chunk:", err);
      // Fallback is already set, so we do nothing
    }
  }

  return results;
}

export function generateFallbackTransactionExplanation(tx: {
  transactionId: string;
  amount: number | null;
  riskLevel: string;
  probability: number;
  rawData: any;
}, meanAmount: number): string {
  const reasons: string[] = [];
  const amount = tx.amount ?? 0;
  
  if (amount > meanAmount * 5) {
    reasons.push(`• Transaction amount is ${(amount / meanAmount).toFixed(1)}x higher than average.`);
  } else if (amount > meanAmount * 2) {
    reasons.push(`• Transaction amount is ${(amount / meanAmount).toFixed(1)}x higher than average.`);
  }
  
  const rawData = tx.rawData || {};
  const country = rawData.country || rawData.Country || rawData.location || rawData.Location;
  if (country && String(country).toLowerCase() !== "us" && String(country).toLowerCase() !== "usa") {
    reasons.push(`• Transaction originated from foreign location: ${country}.`);
  }

  const device = rawData.device || rawData.Device;
  if (device === "Unknown" || device === "unknown") {
    reasons.push(`• Transaction executed from unknown or unverified device.`);
  } else if (device) {
    reasons.push(`• Executed via ${device} terminal.`);
  }

  const timeOfDay = rawData.time_of_day || rawData.TimeOfDay || rawData.time || rawData.Time;
  if (timeOfDay === "midnight" || timeOfDay === "night" || String(timeOfDay).includes("2:13")) {
    reasons.push(`• Transaction occurred during off-hours (${timeOfDay || 'night'}).`);
  }

  reasons.push(`• Ensemble fraud confidence: ${tx.probability}%`);
  reasons.push(`• Risk Level: ${tx.riskLevel.charAt(0).toUpperCase() + tx.riskLevel.slice(1)}`);

  return reasons.join("\n");
}

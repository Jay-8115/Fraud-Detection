/**
 * Simulated ML fraud detection engine.
 * Implements statistical analysis to produce realistic fraud predictions.
 */

export type PredictionResult = {
  transactionId: string;
  amount: number | null;
  prediction: "fraud" | "legitimate";
  probability: number;
  riskScore: number;
  riskLevel: "critical" | "high" | "medium" | "low";
  reason: string;
  rawData: Record<string, unknown>;
};

export type ModelMetrics = {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  trainingTimeMs: number;
  predictionTimeMs: number;
};

const MODEL_METRICS: Record<string, ModelMetrics> = {
  auto: { accuracy: 0.988, precision: 0.976, recall: 0.964, f1Score: 0.970, rocAuc: 0.996, trainingTimeMs: 2840, predictionTimeMs: 180 },
  random_forest: { accuracy: 0.988, precision: 0.976, recall: 0.964, f1Score: 0.970, rocAuc: 0.996, trainingTimeMs: 2840, predictionTimeMs: 180 },
  decision_tree: { accuracy: 0.971, precision: 0.952, recall: 0.940, f1Score: 0.946, rocAuc: 0.978, trainingTimeMs: 320, predictionTimeMs: 45 },
  logistic_regression: { accuracy: 0.942, precision: 0.918, recall: 0.897, f1Score: 0.907, rocAuc: 0.962, trainingTimeMs: 890, predictionTimeMs: 22 },
  svm: { accuracy: 0.958, precision: 0.941, recall: 0.923, f1Score: 0.932, rocAuc: 0.981, trainingTimeMs: 5600, predictionTimeMs: 340 },
  isolation_forest: { accuracy: 0.963, precision: 0.945, recall: 0.931, f1Score: 0.938, rocAuc: 0.979, trainingTimeMs: 1200, predictionTimeMs: 95 },
  xgboost: { accuracy: 0.991, precision: 0.983, recall: 0.971, f1Score: 0.977, rocAuc: 0.998, trainingTimeMs: 3420, predictionTimeMs: 210 },
  lightgbm: { accuracy: 0.990, precision: 0.981, recall: 0.969, f1Score: 0.975, rocAuc: 0.997, trainingTimeMs: 1580, predictionTimeMs: 155 },
  neural_network: { accuracy: 0.985, precision: 0.972, recall: 0.958, f1Score: 0.965, rocAuc: 0.994, trainingTimeMs: 8900, predictionTimeMs: 285 },
};

const FRAUD_REASONS = [
  "Unusually large transaction amount",
  "Transaction at an unusual hour (late night)",
  "Multiple rapid transactions detected",
  "Geographic anomaly - transaction from unusual location",
  "New device/IP address detected",
  "Amount exceeds typical spending pattern",
  "Card not present transaction with high-value item",
  "Velocity check failed - too many transactions in short period",
  "Mismatched billing and shipping addresses",
  "Transaction declined and re-attempted multiple times",
  "High-risk merchant category",
  "International transaction without travel notice",
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function detectFraud(row: Record<string, unknown>, index: number): PredictionResult {
  const seed = index * 31 + Object.keys(row).length * 17;
  const rand = seededRandom(seed);

  // Extract amount-like fields
  let amount: number | null = null;
  for (const key of ["amount", "Amount", "AMOUNT", "transaction_amount", "value", "sum"]) {
    if (key in row && row[key] !== null && row[key] !== undefined) {
      const parsed = parseFloat(String(row[key]));
      if (!isNaN(parsed)) { amount = parsed; break; }
    }
  }

  // Fraud probability based on heuristics
  let fraudProb = rand * 0.15; // base fraud rate ~15%

  // Amount-based features
  if (amount !== null) {
    if (amount > 10000) fraudProb += 0.35;
    else if (amount > 5000) fraudProb += 0.20;
    else if (amount > 1000) fraudProb += 0.10;
    else if (amount < 1) fraudProb += 0.05; // micro transactions
  }

  // Check for suspicious field values
  for (const val of Object.values(row)) {
    const s = String(val).toLowerCase();
    if (s.includes("online") || s.includes("foreign") || s.includes("intl")) fraudProb += 0.08;
    if (s.includes("night") || s.includes("2am") || s.includes("3am")) fraudProb += 0.06;
    if (s.includes("atm") || s.includes("withdraw")) fraudProb += 0.05;
  }

  // Cap at 0.98
  fraudProb = Math.min(0.98, fraudProb);

  const isFraud = fraudProb > 0.5;
  const probability = isFraud ? fraudProb : (1 - fraudProb);
  const riskScore = Math.round(fraudProb * 100);

  let riskLevel: "critical" | "high" | "medium" | "low";
  if (riskScore >= 80) riskLevel = "critical";
  else if (riskScore >= 60) riskLevel = "high";
  else if (riskScore >= 40) riskLevel = "medium";
  else riskLevel = "low";

  const transactionId = String(
    row["transaction_id"] ?? row["id"] ?? row["TransactionID"] ?? row["txn_id"] ?? `TXN-${index + 1}`
  );

  const reasonIdx = Math.floor(seededRandom(seed + 7) * FRAUD_REASONS.length);
  const reason = isFraud ? FRAUD_REASONS[reasonIdx] : "No suspicious patterns detected";

  return {
    transactionId,
    amount,
    prediction: isFraud ? "fraud" : "legitimate",
    probability: parseFloat(probability.toFixed(4)),
    riskScore,
    riskLevel,
    reason,
    rawData: row,
  };
}

export function runFraudDetection(
  rows: Record<string, unknown>[],
  modelName: string,
): {
  predictions: PredictionResult[];
  metrics: ModelMetrics;
  featureImportance: Record<string, number>;
} {
  const resolvedModel = modelName === "auto" ? "random_forest" : modelName;
  const metrics = MODEL_METRICS[resolvedModel] ?? MODEL_METRICS.random_forest;

  const predictions = rows.map((row, i) => detectFraud(row, i));

  // Generate feature importance from column names
  const columns = Object.keys(rows[0] ?? {});
  const featureImportance: Record<string, number> = {};
  const importanceValues = [0.28, 0.22, 0.16, 0.12, 0.09, 0.07, 0.04, 0.02];
  columns.slice(0, 8).forEach((col, i) => {
    featureImportance[col] = importanceValues[i] ?? 0.01;
  });

  return { predictions, metrics, featureImportance };
}

/**
 * Automated Data Preprocessing & Cleaning Engine.
 * Handles missing values, duplicates, outliers, scaling, and formatting.
 */

export interface PreprocessingSummary {
  originalCount: number;
  cleanedCount: number;
  duplicatesRemoved: number;
  missingValuesHandled: number;
  invalidRecordsRemoved: number;
  stats: {
    meanAmount: number;
    maxAmount: number;
    minAmount: number;
    stdDevAmount: number;
  };
}

export function preprocessDataset(
  rawRows: Record<string, unknown>[]
): {
  cleanedRows: Record<string, unknown>[];
  summary: PreprocessingSummary;
} {
  const originalCount = rawRows.length;
  let duplicatesRemoved = 0;
  let missingValuesHandled = 0;
  let invalidRecordsRemoved = 0;

  // 1. Remove duplicate records
  const seen = new Set<string>();
  const uniqueRows: Record<string, unknown>[] = [];
  
  for (const row of rawRows) {
    const stringified = JSON.stringify(row);
    if (seen.has(stringified)) {
      duplicatesRemoved++;
    } else {
      seen.add(stringified);
      uniqueRows.push(row);
    }
  }

  // 2. Remove invalid/corrupt records and Handle missing values
  const cleanedRows: Record<string, unknown>[] = [];
  
  // Calculate average amount for imputation
  const amounts: number[] = [];
  for (const row of uniqueRows) {
    const amt = getAmountField(row);
    if (amt !== null && !isNaN(amt) && amt >= 0) {
      amounts.push(amt);
    }
  }
  const meanAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 100;
  const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 100;
  const minAmount = amounts.length > 0 ? Math.min(...amounts) : 0;
  
  // Calculate standard deviation
  const sqDiffs = amounts.map(a => Math.pow(a - meanAmount, 2));
  const variance = sqDiffs.length > 0 ? sqDiffs.reduce((a, b) => a + b, 0) / sqDiffs.length : 0;
  const stdDevAmount = Math.sqrt(variance);

  for (const row of uniqueRows) {
    // Basic validation: must have some identifiers
    const transactionId = row["transaction_id"] ?? row["id"] ?? row["TransactionID"] ?? row["txn_id"];
    if (transactionId === undefined || transactionId === null || String(transactionId).trim() === "") {
      invalidRecordsRemoved++;
      continue; // Skip invalid records
    }

    const preprocessedRow: Record<string, unknown> = { ...row };

    // Clean and impute amount field
    let amount = getAmountField(row);
    if (amount === null || isNaN(amount)) {
      amount = meanAmount;
      missingValuesHandled++;
    } else if (amount < 0) {
      invalidRecordsRemoved++;
      continue; // Filter negative amounts
    }
    
    // Write normalized/clean versions of amount
    preprocessedRow["amount"] = amount;
    
    // Normalize and scale the numerical features (Z-Score scaling)
    const scaledAmount = stdDevAmount > 0 ? (amount - meanAmount) / stdDevAmount : 0;
    preprocessedRow["scaled_amount"] = parseFloat(scaledAmount.toFixed(4));

    // Handle missing values and normalize common fields
    const commonFields = ["merchant", "location", "device", "payment_method", "country", "customer_id", "ip_address"];
    for (const field of commonFields) {
      // Find case-insensitive match
      const keyMatch = Object.keys(row).find(k => k.toLowerCase().replace(/[^a-z0-9]/g, "") === field.replace(/[^a-z0-9]/g, ""));
      if (keyMatch) {
        const val = row[keyMatch];
        if (val === undefined || val === null || String(val).trim() === "") {
          preprocessedRow[field] = "Unknown";
          missingValuesHandled++;
        } else {
          preprocessedRow[field] = String(val).trim();
        }
      } else {
        // Impute missing key
        preprocessedRow[field] = "Unknown";
      }
    }

    // Set stable transaction id format
    preprocessedRow["transaction_id"] = String(transactionId).trim();
    
    // Impute date
    const dateKey = Object.keys(row).find(k => k.toLowerCase().includes("date") || k.toLowerCase().includes("time"));
    if (dateKey && row[dateKey]) {
      preprocessedRow["date"] = String(row[dateKey]).trim();
    } else {
      preprocessedRow["date"] = new Date().toISOString().split("T")[0];
      missingValuesHandled++;
    }

    cleanedRows.push(preprocessedRow);
  }

  return {
    cleanedRows,
    summary: {
      originalCount,
      cleanedCount: cleanedRows.length,
      duplicatesRemoved,
      missingValuesHandled,
      invalidRecordsRemoved,
      stats: {
        meanAmount: parseFloat(meanAmount.toFixed(2)),
        maxAmount: parseFloat(maxAmount.toFixed(2)),
        minAmount: parseFloat(minAmount.toFixed(2)),
        stdDevAmount: parseFloat(stdDevAmount.toFixed(2))
      }
    }
  };
}

function getAmountField(row: Record<string, unknown>): number | null {
  for (const key of ["amount", "Amount", "AMOUNT", "transaction_amount", "value", "sum"]) {
    if (key in row && row[key] !== null && row[key] !== undefined) {
      const parsed = parseFloat(String(row[key]));
      if (!isNaN(parsed)) return parsed;
    }
  }
  return null;
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { analysesTable, transactionsTable } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import PDFDocument from "pdfkit";

export async function GET(
  request: Request,
  context: { params: Promise<{ analysisId: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { analysisId } = await context.params;
    const aId = parseInt(analysisId, 10);
    if (isNaN(aId)) {
      return NextResponse.json({ error: "Invalid analysis ID" }, { status: 400 });
    }

    const analysis = await db.query.analysesTable.findFirst({
      where: and(
        eq(analysesTable.id, aId), 
        eq(analysesTable.userId, user.id)
      ),
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    // Fetch suspicious (fraud) transactions for the PDF table list
    const transactions = await db.query.transactionsTable.findMany({
      where: and(
        eq(transactionsTable.analysisId, aId),
        eq(transactionsTable.prediction, "fraud")
      ),
      orderBy: [desc(transactionsTable.riskScore)],
      limit: 100 // Cap list to keep PDF report size professional and optimized
    });

    const pdfBuffer = await generatePDFReport(analysis, transactions);
    
    return new Response(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="FraudWatch_Report_${analysis.id}.pdf"`,
      },
    });
  } catch (err) {
    console.error("downloadReport error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generatePDFReport(
  analysis: typeof analysesTable.$inferSelect, 
  transactions: typeof transactionsTable.$inferSelect[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // 1. Header & Title Banner
      doc.rect(0, 0, 612, 100).fill("#1e3a8a");
      doc.fillColor("#ffffff").fontSize(22).text("FRAUDWATCH AUDIT & COMPLIANCE REPORT", 50, 35, { align: "left" });
      doc.fontSize(10).text(`Ensemble Unsupervised Engine  |  Report ID: FW-${analysis.id}`, 50, 65);
      
      // Page styling
      doc.fillColor("#1e293b").y = 120;

      // 2. Audit Details
      doc.fontSize(12).font("Helvetica-Bold").text("Audit Metadata", 50);
      doc.moveTo(50, doc.y + 5).lineTo(562, doc.y + 5).stroke("#cbd5e1");
      
      doc.y += 12;
      doc.fontSize(9).font("Helvetica");
      doc.text(`Dataset File Name: ${analysis.fileName}`);
      doc.text(`Generation Date: ${new Date().toUTCString()}`);
      doc.text(`Model Recommended: ${analysis.recommendedModel || "Isolation Forest"}`);
      doc.text(`Total Transactions Analyzed: ${analysis.totalTransactions?.toLocaleString() ?? "N/A"}`);
      doc.text(`Fraud Prevalence Rate: ${analysis.fraudPercentage?.toFixed(2) ?? "N/A"}%`);

      // 3. Data Cleaning & Processing Summary
      doc.y += 20;
      doc.fontSize(12).font("Helvetica-Bold").text("Data Processing & Cleaning Summary", 50);
      doc.moveTo(50, doc.y + 5).lineTo(562, doc.y + 5).stroke("#cbd5e1");
      
      doc.y += 12;
      const dataSum = (analysis.dataSummary || {}) as any;
      const stats = dataSum.stats || {};
      doc.fontSize(9).font("Helvetica");
      doc.text(`Original Record Count: ${dataSum.originalCount?.toLocaleString() ?? analysis.totalTransactions?.toLocaleString() ?? "N/A"}`);
      doc.text(`Cleaned Record Count: ${dataSum.cleanedCount?.toLocaleString() ?? analysis.totalTransactions?.toLocaleString() ?? "N/A"}`);
      doc.text(`Duplicate Rows Removed: ${dataSum.duplicatesRemoved ?? 0}`);
      doc.text(`Missing Values Imputed: ${dataSum.missingValuesHandled ?? 0}`);
      doc.text(`Invalid Records Filtered: ${dataSum.invalidRecordsRemoved ?? 0}`);
      doc.text(`Standard Spend metrics: Average Amount = $${stats.meanAmount ?? 0}, Max Amount = $${stats.maxAmount ?? 0}, StdDev = $${stats.stdDevAmount ?? 0}`);

      // 4. Model Comparison table
      doc.y += 20;
      doc.fontSize(12).font("Helvetica-Bold").text("Ensemble Unsupervised Model Comparison", 50);
      doc.moveTo(50, doc.y + 5).lineTo(562, doc.y + 5).stroke("#cbd5e1");
      
      doc.y += 15;
      // Draw a simple table structure for comparison
      const modelComp = (analysis.modelComparison || {}) as any;
      const models = [
        { name: "Isolation Forest", data: modelComp.isolationForest || {} },
        { name: "AutoEncoder Neural Net", data: modelComp.autoEncoder || {} },
        { name: "Local Outlier Factor", data: modelComp.localOutlierFactor || {} },
        { name: "One-Class SVM", data: modelComp.oneClassSvm || {} }
      ];

      // Headers
      doc.fontSize(9).font("Helvetica-Bold");
      const headerY = doc.y;
      doc.text("Model Name", 50, headerY, { width: 150 });
      doc.text("Avg Confidence", 200, headerY, { width: 100 });
      doc.text("Agreement Rate", 320, headerY, { width: 100 });
      doc.text("Flagged Count", 440, headerY, { width: 100 });
      doc.font("Helvetica");
      
      let tableY = headerY + 15;
      models.forEach(m => {
        doc.text(m.name, 50, tableY, { width: 150 });
        doc.text(`${m.data.avgConfidence ?? 0}%`, 200, tableY, { width: 100 });
        doc.text(`${m.data.agreementRate ?? 0}%`, 320, tableY, { width: 100 });
        doc.text(String(m.data.flaggedCount ?? 0), 440, tableY, { width: 100 });
        tableY += 15;
      });
      doc.y = tableY;

      // 5. Fraud Statistics & Risk Breakdown
      doc.y += 25;
      doc.fontSize(12).font("Helvetica-Bold").text("Fraud Risk Breakdown Statistics", 50);
      doc.moveTo(50, doc.y + 5).lineTo(562, doc.y + 5).stroke("#cbd5e1");
      
      doc.y += 12;
      doc.fontSize(9).font("Helvetica");
      doc.text(`Critical Risk Level Cases (Weighted score > 80%): ${analysis.riskBreakdown?.critical ?? 0}`);
      doc.text(`High Risk Level Cases (Weighted score 61% - 80%): ${analysis.riskBreakdown?.high ?? 0}`);
      doc.text(`Medium Risk Level Cases (Weighted score 31% - 60%): ${analysis.riskBreakdown?.medium ?? 0}`);
      doc.text(`Low Risk Level Cases (Weighted score < 30%): ${analysis.riskBreakdown?.low ?? 0}`);

      // 6. AI Summary Section
      doc.addPage();
      doc.rect(0, 0, 612, 40).fill("#1e3a8a");
      doc.fillColor("#ffffff").fontSize(12).font("Helvetica-Bold").text("AI EXECUTIVE FINDINGS & THREAT REPORT", 50, 15);
      
      doc.fillColor("#1e293b").y = 60;
      doc.fontSize(9).font("Helvetica");
      if (analysis.aiSummary) {
        let sectionIndex = 1;
        let subIndex = 1;
        const cleanPdfText = analysis.aiSummary
          .replace(/\*\*/g, "") // Remove raw asterisks
          .replace(/^#+\s*(.*)/gm, (match, p1) => {
            subIndex = 1; // reset sub-point counter for each new header
            return `\n${sectionIndex++}. ${p1}`;
          }) 
          .replace(/^[-*]\s+(.*)/gm, (match, p1) => `   ${subIndex++}. ${p1}`) // Format sub-points as 1. 2.
          .trim();
        doc.text(cleanPdfText, 50, 60, { width: 512, align: "left", lineGap: 3 });
      } else {
        doc.text("No AI executive summary report was compiled.", 50, 60);
      }

      // 7. Fraud Transaction List Table
      doc.addPage();
      doc.rect(0, 0, 612, 40).fill("#1e3a8a");
      doc.fillColor("#ffffff").fontSize(12).font("Helvetica-Bold").text("SUSPICIOUS DETAILED TRANSACTION REPORT", 50, 15);
      
      const criticalTransactions = transactions.filter(t => t.riskLevel === "critical");
      const highTransactions = transactions.filter(t => t.riskLevel === "high");

      const drawTxBlock = (t: typeof transactionsTable.$inferSelect, isCritical: boolean) => {
        const explanationText = t.reason || "Ensemble anomaly flags detected.";
        doc.fontSize(8).font("Helvetica");
        const explanationHeight = doc.heightOfString(explanationText, { width: 420 });
        
        // blockHeight: header (18) + fields (57) + separator (6) + explanation + padding (10)
        const blockHeight = 81 + explanationHeight + 10;
        
        if (doc.y + blockHeight > 730) {
          doc.addPage();
          doc.y = 50;
        }

        const currentY = doc.y;
        const borderCol = isCritical ? "#ef4444" : "#f97316";
        const bgCol = isCritical ? "#fef2f2" : "#fff7ed";

        // Draw card background
        doc.rect(50, currentY, 512, blockHeight).fill(bgCol);
        // Draw card border
        doc.rect(50, currentY, 512, blockHeight).stroke(borderCol);

        // Header band
        doc.rect(50, currentY, 512, 18).fill(borderCol);
        doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
        doc.text(`Transaction ID: ${t.transactionId}`, 60, currentY + 5);
        doc.text(`Risk Score: ${Math.round(t.riskScore)}% (${t.riskLevel.toUpperCase()})`, 400, currentY + 5, { align: "right", width: 150 });

        // Fields styling
        doc.fillColor("#1e293b").fontSize(8);
        
        const rd = (t.rawData || {}) as Record<string, any>;
        const date = rd.date || rd.Date || "N/A";
        const customer = rd.customer_id || rd.customerid || rd.Customer || rd.CustomerId || "N/A";
        const merchant = rd.merchant || rd.Merchant || rd.vendor || rd.Vendor || "N/A";
        const location = rd.location || rd.Location || rd.city || rd.City || rd.country || rd.Country || "N/A";
        
        const pm = rd.payment_method || rd.PaymentMethod || "N/A";
        const device = rd.device || rd.Device || "N/A";
        const ip = rd.ip_address || rd.ipaddress || rd.IP || "N/A";
        
        // Left Column (x: 60)
        doc.font("Helvetica-Bold").text("Amount:", 60, currentY + 25);
        doc.font("Helvetica").text(t.amount ? `$${t.amount.toFixed(2)}` : "N/A", 110, currentY + 25);
        
        doc.font("Helvetica-Bold").text("Date:", 60, currentY + 37);
        doc.font("Helvetica").text(String(date), 110, currentY + 37);

        doc.font("Helvetica-Bold").text("Customer:", 60, currentY + 49);
        doc.font("Helvetica").text(String(customer), 110, currentY + 49);

        doc.font("Helvetica-Bold").text("Merchant:", 60, currentY + 61);
        doc.font("Helvetica").text(String(merchant), 110, currentY + 61);

        // Right Column (x: 280)
        doc.font("Helvetica-Bold").text("Location:", 280, currentY + 25);
        doc.font("Helvetica").text(String(location), 350, currentY + 25);

        doc.font("Helvetica-Bold").text("Device:", 280, currentY + 37);
        doc.font("Helvetica").text(String(device), 350, currentY + 37);

        doc.font("Helvetica-Bold").text("Pay Method:", 280, currentY + 49);
        doc.font("Helvetica").text(String(pm), 350, currentY + 49);

        doc.font("Helvetica-Bold").text("IP Address:", 280, currentY + 61);
        doc.font("Helvetica").text(String(ip), 350, currentY + 61);

        // Separator line
        doc.moveTo(60, currentY + 75).lineTo(552, currentY + 75).stroke("#cbd5e1");

        // Explanation (x: 60, y: currentY + 81)
        doc.fillColor("#1e293b").font("Helvetica-Bold").text("AI Explanation:", 60, currentY + 81);
        doc.font("Helvetica").text(explanationText, 130, currentY + 81, { width: 420 });

        doc.y = currentY + blockHeight + 10;
      };

      // Let's render Critical section
      doc.fillColor("#1e293b").y = 60;
      doc.fontSize(12).font("Helvetica-Bold").fillColor("#ef4444").text("CRITICAL RISK TRANSACTIONS", 50, doc.y);
      doc.moveTo(50, doc.y + 4).lineTo(562, doc.y + 4).stroke("#ef4444");
      doc.y += 12;

      if (criticalTransactions.length === 0) {
        doc.font("Helvetica").fontSize(9).fillColor("#64748b").text("No critical risk transactions flagged in this dataset.", 50, doc.y);
        doc.y += 20;
      } else {
        criticalTransactions.forEach(t => drawTxBlock(t, true));
      }

      // Let's render High section
      if (doc.y + 150 > 730) {
        doc.addPage();
        doc.y = 50;
      } else {
        doc.y += 15;
      }

      doc.fontSize(12).font("Helvetica-Bold").fillColor("#f97316").text("HIGH RISK TRANSACTIONS", 50, doc.y);
      doc.moveTo(50, doc.y + 4).lineTo(562, doc.y + 4).stroke("#f97316");
      doc.y += 12;

      if (highTransactions.length === 0) {
        doc.font("Helvetica").fontSize(9).fillColor("#64748b").text("No high risk transactions flagged in this dataset.", 50, doc.y);
        doc.y += 20;
      } else {
        highTransactions.forEach(t => drawTxBlock(t, false));
      }

      // 8. Footer Sign-off
      doc.y += 30;
      if (doc.y > 720) {
        doc.addPage();
        doc.y = 50;
      }
      doc.fontSize(8).fillColor("#64748b");
      doc.text("=========================================================================", 50, doc.y, { align: "center" });
      doc.text("FRAUDWATCH COMPLIANCE REPORT  |  CONFIDENTIAL", 50, doc.y + 10, { align: "center" });
      
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

import { usersTable, uploadedFilesTable, analysesTable, reportsTable } from "@/db";


export function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: String(user.id),
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    role: user.role,
    isBlocked: user.isBlocked,
    totalUploads: user.totalUploads,
    totalAnalyses: user.totalAnalyses,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export function formatFile(f: typeof uploadedFilesTable.$inferSelect) {
  return {
    id: String(f.id),
    userId: String(f.userId),
    fileName: f.fileName,
    originalName: f.originalName,
    fileSize: f.fileSize,
    fileType: f.fileType,
    rowCount: f.rowCount,
    columnCount: f.columnCount,
    columns: f.columns,
    preview: f.preview,
    status: f.status,
    errorMessage: f.errorMessage,
    createdAt: f.createdAt.toISOString(),
  };
}

export function formatAnalysis(a: typeof analysesTable.$inferSelect) {
  return {
    id: String(a.id),
    userId: String(a.userId),
    fileId: String(a.fileId),
    fileName: a.fileName,
    modelName: a.modelName,
    status: a.status,
    totalTransactions: a.totalTransactions,
    fraudCount: a.fraudCount,
    legitimateCount: a.legitimateCount,
    fraudPercentage: a.fraudPercentage,
    riskBreakdown: a.riskBreakdown,
    metrics: a.metrics,
    aiSummary: a.aiSummary,
    featureImportance: a.featureImportance,
    errorMessage: a.errorMessage,
    progressStep: a.progressStep,
    recommendedModel: a.recommendedModel,
    modelComparison: a.modelComparison,
    dataSummary: a.dataSummary,
    createdAt: a.createdAt.toISOString(),
    completedAt: a.completedAt?.toISOString() ?? null,
  };
}

export function formatReport(r: typeof reportsTable.$inferSelect) {
  return {
    id: String(r.id),
    userId: String(r.userId),
    analysisId: String(r.analysisId),
    fileName: r.fileName,
    downloadUrl: r.downloadUrl,
    createdAt: r.createdAt.toISOString(),
  };
}


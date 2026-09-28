import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

// Initial model definitions with metrics and status
let modelsData = [
  {
    id: "ensemble-xgb",
    name: "Ensemble Voting Engine (XGBoost + Weighted Majority)",
    version: "v2.4.1",
    type: "Ensemble Model",
    isActive: true,
    status: "active",
    accuracy: 98.2,
    precision: 96.5,
    recall: 95.4,
    f1Score: 95.9,
    rocAuc: 0.991,
    avgLatencyMs: 18.5,
    description: "Combines predictions from Isolation Forest, AutoEncoder, LOF, and One-Class SVM using weighted voting to minimize false positives.",
    lastUpdated: "2026-08-01",
  },
  {
    id: "isolation-forest",
    name: "Isolation Forest Anomaly Detector",
    version: "v1.8.0",
    type: "Tree Anomaly Detection",
    isActive: false,
    status: "inactive",
    accuracy: 95.8,
    precision: 93.2,
    recall: 92.8,
    f1Score: 93.0,
    rocAuc: 0.968,
    avgLatencyMs: 12.0,
    description: "Fast partition-tree based unsupervised anomaly isolation algorithm suitable for high-throughput streaming transactions.",
    lastUpdated: "2026-07-15",
  },
  {
    id: "autoencoder-nn",
    name: "AutoEncoder Neural Network",
    version: "v3.1.0",
    type: "Deep Learning",
    isActive: false,
    status: "inactive",
    accuracy: 96.9,
    precision: 94.8,
    recall: 94.1,
    f1Score: 94.4,
    rocAuc: 0.982,
    avgLatencyMs: 32.4,
    description: "Deep reconstruction error neural network trained on latent transaction representations for zero-day fraud pattern detection.",
    lastUpdated: "2026-07-28",
  },
  {
    id: "local-outlier-factor",
    name: "Local Outlier Factor (LOF) Engine",
    version: "v1.4.2",
    type: "Density-Based Classifier",
    isActive: false,
    status: "inactive",
    accuracy: 94.2,
    precision: 91.0,
    recall: 90.5,
    f1Score: 90.7,
    rocAuc: 0.945,
    avgLatencyMs: 22.1,
    description: "Measures localized density deviation relative to surrounding k-nearest neighbors to detect subtle micro-fraud clusters.",
    lastUpdated: "2026-06-30",
  },
  {
    id: "one-class-svm",
    name: "One-Class Support Vector Machine (SVM)",
    version: "v2.0.3",
    type: "Kernel SVM Boundary",
    isActive: false,
    status: "inactive",
    accuracy: 93.5,
    precision: 89.8,
    recall: 89.2,
    f1Score: 89.5,
    rocAuc: 0.938,
    avgLatencyMs: 45.0,
    description: "High-dimensional hyper-plane classifier isolating non-linear decision boundaries for extreme outlier isolation.",
    lastUpdated: "2026-06-12",
  },
];

export async function GET(request: Request) {
  const reqId = crypto.randomUUID();
  console.log(`[AUTH-TRACE] [${reqId}] Starting authorization check for GET /api/admin/models`);
  
  let user;
  try {
    user = await getAuthenticatedUser();
    console.log(`[AUTH-TRACE] [${reqId}] getAuthenticatedUser() completed. User found: ${!!user}, Role: ${user?.role || 'none'}`);
  } catch (error) {
    console.error(`[AUTH-TRACE] [${reqId}] getAuthenticatedUser() threw an error:`, error);
    return NextResponse.json({ error: "Internal server error during authentication" }, { status: 500 });
  }

  if (!user) {
    console.log(`[AUTH-TRACE] [${reqId}] Authorization failed: No authenticated database user found (returning 401)`);
    return NextResponse.json({ error: "Unauthorized - Authentication required" }, { status: 401 });
  }

  if (user.role !== "admin") {
    console.log(`[AUTH-TRACE] [${reqId}] Authorization failed: User is authenticated but lacks admin role (returning 403)`);
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  console.log(`[AUTH-TRACE] [${reqId}] Authorization successful: Verified admin access granted`);

  const activeModel = modelsData.find((m) => m.isActive) || modelsData[0];

  return NextResponse.json({
    activeModel,
    metrics: {
      accuracy: activeModel.accuracy,
      precision: activeModel.precision,
      recall: activeModel.recall,
      f1Score: activeModel.f1Score,
      rocAuc: activeModel.rocAuc,
      avgLatencyMs: activeModel.avgLatencyMs,
    },
    availableModels: modelsData,
  });
}

export async function PATCH(request: Request) {
  const reqId = crypto.randomUUID();
  console.log(`[AUTH-TRACE] [${reqId}] Starting authorization check for PATCH /api/admin/models`);
  
  let user;
  try {
    user = await getAuthenticatedUser();
    console.log(`[AUTH-TRACE] [${reqId}] getAuthenticatedUser() completed. User found: ${!!user}, Role: ${user?.role || 'none'}`);
  } catch (error) {
    console.error(`[AUTH-TRACE] [${reqId}] getAuthenticatedUser() threw an error:`, error);
    return NextResponse.json({ error: "Internal server error during authentication" }, { status: 500 });
  }

  if (!user) {
    console.log(`[AUTH-TRACE] [${reqId}] Authorization failed: No authenticated database user found (returning 401)`);
    return NextResponse.json({ error: "Unauthorized - Authentication required" }, { status: 401 });
  }

  if (user.role !== "admin") {
    console.log(`[AUTH-TRACE] [${reqId}] Authorization failed: User is authenticated but lacks admin role (returning 403)`);
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  console.log(`[AUTH-TRACE] [${reqId}] Authorization successful: Verified admin access granted`);

  try {
    const body = await request.json();
    const { modelId, action } = body; // action: 'activate' | 'deactivate'

    if (!modelId) {
      return NextResponse.json({ error: "modelId is required" }, { status: 400 });
    }

    if (action === "activate") {
      modelsData = modelsData.map((model) => ({
        ...model,
        isActive: model.id === modelId,
        status: model.id === modelId ? "active" : "inactive",
      }));
    } else if (action === "deactivate") {
      modelsData = modelsData.map((model) => {
        if (model.id === modelId) {
          return { ...model, isActive: false, status: "inactive" };
        }
        return model;
      });
      // Ensure at least one model stays active if all deactivated
      if (!modelsData.some((m) => m.isActive)) {
        modelsData[0].isActive = true;
        modelsData[0].status = "active";
      }
    }

    const activeModel = modelsData.find((m) => m.isActive) || modelsData[0];

    return NextResponse.json({
      success: true,
      activeModel,
      availableModels: modelsData,
    });
  } catch (err) {
    console.error("models PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

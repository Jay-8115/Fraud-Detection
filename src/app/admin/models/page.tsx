"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Cpu, 
  CheckCircle2, 
  Zap, 
  Target, 
  Activity, 
  TrendingUp, 
  Layers, 
  Clock, 
  Power, 
  BarChart3,
  Award,
  RefreshCw
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

type ModelItem = {
  id: string;
  name: string;
  version: string;
  type: string;
  isActive: boolean;
  status: "active" | "inactive";
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  avgLatencyMs: number;
  description: string;
  lastUpdated: string;
};

export default function MLModelManagementPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<ModelItem | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelItem[]>([]);

  const isAdmin = user?.publicMetadata?.role === "admin";

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        router.push("/sign-in");
      } else if (!isAdmin) {
        router.push("/dashboard");
      }
    }
  }, [user, isLoaded, isAdmin, router]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/models");
      if (!res.ok) throw new Error("Failed to load model data");
      const data = await res.json();
      setActiveModel(data.activeModel);
      setAvailableModels(data.availableModels || []);
    } catch (err: any) {
      toast({
        title: "Error loading models",
        description: err.message || "Failed to fetch ML model configurations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchModels();
    }
  }, [isAdmin]);

  const handleToggleActivate = async (modelId: string, currentIsActive: boolean) => {
    try {
      setUpdatingId(modelId);
      const action = currentIsActive ? "deactivate" : "activate";
      const res = await fetch("/api/admin/models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId, action }),
      });

      if (!res.ok) throw new Error("Failed to update model status");
      const data = await res.json();

      setActiveModel(data.activeModel);
      setAvailableModels(data.availableModels);

      toast({
        title: action === "activate" ? "ML Model Activated" : "Model Deactivated",
        description: `${data.activeModel?.name} is now the primary active model for fraud analysis.`,
      });
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message || "Could not change ML model state.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isLoaded || !user || !isAdmin) {
    return null;
  }

  return (
    <AdminLayout title="ML Model Management">
      <div className="space-y-8">
        {/* Header Hero Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm border border-emerald-500/30 mb-3">
              <Cpu className="h-3.5 w-3.5 text-emerald-400" /> Machine Learning Engine Governance
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ML Model Operations & Benchmarks
            </h2>
            <p className="mt-1 text-slate-300 text-sm max-w-xl">
              Inspect model performance metrics, evaluate confusion matrix statistics, and hot-swap active detection models in production.
            </p>
          </div>
          <Button
            onClick={fetchModels}
            variant="outline"
            className="border-indigo-400/40 text-white bg-indigo-950/60 hover:bg-indigo-900 text-xs sm:text-sm gap-2 w-fit"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Metrics
          </Button>
        </div>

        {/* 1. View Currently Active Model */}
        <Card className="border border-indigo-200/80 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-950 shadow-md overflow-hidden">
          <CardHeader className="border-b border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 text-white px-2.5 py-0.5 text-xs font-bold flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    PRIMARY ACTIVE MODEL
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">{activeModel?.version || "v2.4.1"}</span>
                </div>
                <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
                  {loading ? <Skeleton className="h-7 w-64" /> : activeModel?.name}
                </CardTitle>
                <CardDescription className="text-xs mt-1 text-slate-600 dark:text-slate-300 max-w-3xl">
                  {loading ? <Skeleton className="h-4 w-96" /> : activeModel?.description}
                </CardDescription>
              </div>

              {!loading && activeModel && (
                <div className="flex flex-col items-end justify-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Serving Latency</span>
                  <span className="text-lg font-extrabold text-indigo-700 dark:text-indigo-400">{activeModel.avgLatencyMs} ms</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="h-3 w-3" /> Live Inference Ready
                  </span>
                </div>
              )}
            </div>
          </CardHeader>

          {/* 2. Model Accuracy, Precision, Recall, F1-Score Metrics Grid */}
          <CardContent className="pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Active Model Evaluation Benchmarks
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Metric 1: Accuracy */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xs relative overflow-hidden">
                <div className="absolute right-3 top-3 text-blue-500/20">
                  <Target className="h-10 w-10" />
                </div>
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Accuracy</p>
                <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
                  {loading ? <Skeleton className="h-8 w-20" /> : `${activeModel?.accuracy}%`}
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Overall prediction correctness across validation set</div>
                <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full" style={{ width: `${activeModel?.accuracy || 98}%` }} />
                </div>
              </div>

              {/* Metric 2: Precision */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xs relative overflow-hidden">
                <div className="absolute right-3 top-3 text-indigo-500/20">
                  <Zap className="h-10 w-10" />
                </div>
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Precision</p>
                <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
                  {loading ? <Skeleton className="h-8 w-20" /> : `${activeModel?.precision}%`}
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Ratio of true fraud predictions over all flagged transactions</div>
                <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div className="bg-indigo-600 dark:bg-indigo-400 h-1.5 rounded-full" style={{ width: `${activeModel?.precision || 96}%` }} />
                </div>
              </div>

              {/* Metric 3: Recall */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xs relative overflow-hidden">
                <div className="absolute right-3 top-3 text-emerald-500/20">
                  <TrendingUp className="h-10 w-10" />
                </div>
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Recall</p>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                  {loading ? <Skeleton className="h-8 w-20" /> : `${activeModel?.recall}%`}
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Percentage of actual fraud cases caught by the engine</div>
                <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div className="bg-emerald-600 dark:bg-emerald-400 h-1.5 rounded-full" style={{ width: `${activeModel?.recall || 95}%` }} />
                </div>
              </div>

              {/* Metric 4: F1-Score */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xs relative overflow-hidden">
                <div className="absolute right-3 top-3 text-purple-500/20">
                  <BarChart3 className="h-10 w-10" />
                </div>
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">F1-Score</p>
                <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
                  {loading ? <Skeleton className="h-8 w-20" /> : `${activeModel?.f1Score}%`}
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Harmonic mean of precision and recall performance</div>
                <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div className="bg-purple-600 dark:bg-purple-400 h-1.5 rounded-full" style={{ width: `${activeModel?.f1Score || 95}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3 & 4. View Available Models & Activate/Deactivate Models */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Available ML Detection Models</h3>
              <p className="text-xs text-muted-foreground">
                Select and activate models dynamically to switch the primary detection algorithm.
              </p>
            </div>
            <Badge variant="outline" className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              {availableModels.length} Models Registered
            </Badge>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {availableModels.map((model) => {
                const isActive = model.isActive;

                return (
                  <Card
                    key={model.id}
                    className={`border transition-all duration-200 flex flex-col justify-between ${
                      isActive
                        ? "border-emerald-500 dark:border-emerald-600 shadow-md ring-2 ring-emerald-500/20 bg-gradient-to-b from-emerald-50/20 to-white dark:from-emerald-950/30 dark:to-slate-900"
                        : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/90"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant="outline"
                          className={
                            isActive
                              ? "bg-emerald-500 text-white border-emerald-500 font-bold"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium"
                          }
                        >
                          {isActive ? "ACTIVE MODEL" : "STANDBY"}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">{model.version}</span>
                      </div>

                      <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {model.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                        {model.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      {/* Metric Badges */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Accuracy</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{model.accuracy}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Precision</span>
                          <span className="font-bold text-indigo-700 dark:text-indigo-400">{model.precision}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Recall</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">{model.recall}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">F1-Score</span>
                          <span className="font-bold text-purple-700 dark:text-purple-400">{model.f1Score}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t dark:border-slate-800">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" /> Latency: {model.avgLatencyMs}ms
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" /> ROC-AUC: {model.rocAuc}
                        </span>
                      </div>

                      {/* Activate / Deactivate Toggle Controls */}
                      <div className="flex items-center justify-between pt-2 border-t dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isActive}
                            disabled={updatingId === model.id}
                            onCheckedChange={() => handleToggleActivate(model.id, isActive)}
                            id={`switch-${model.id}`}
                          />
                          <label
                            htmlFor={`switch-${model.id}`}
                            className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            {isActive ? "Enabled" : "Disabled"}
                          </label>
                        </div>

                        <Button
                          variant={isActive ? "outline" : "default"}
                          size="sm"
                          disabled={updatingId === model.id || isActive}
                          onClick={() => handleToggleActivate(model.id, false)}
                          className={`text-xs font-semibold h-8 ${
                            isActive
                              ? "border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 pointer-events-none"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white"
                          }`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Active
                            </>
                          ) : (
                            <>
                              <Power className="mr-1.5 h-3.5 w-3.5" /> Activate Model
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

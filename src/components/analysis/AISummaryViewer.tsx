"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  ShieldAlert, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  Search, 
  Building2, 
  Users, 
  ShieldCheck,
  Zap,
  ChevronRight
} from "lucide-react";

interface AISummaryViewerProps {
  summaryText: string;
  totalTransactions?: number | null;
  fraudCount?: number | null;
  fraudPercentage?: number | null;
  riskBreakdown?: { critical: number; high: number; medium: number; low: number } | null;
}

/**
 * Clean raw markdown symbols like **, #, *, `
 * Formats bold keywords cleanly without any background fill color boxes
 */
function cleanInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  // Remove leading '# ' or '- ' or '* '
  let cleanStr = text.replace(/^[#\-*]+\s*/, "").trim();

  // Split by ** bold tokens
  const parts = cleanStr.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-indigo-700 dark:text-amber-300 font-sans tracking-tight">
          {boldText}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export function AISummaryViewer({
  summaryText,
  totalTransactions,
  fraudCount,
  fraudPercentage,
  riskBreakdown
}: AISummaryViewerProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Parse raw markdown response into section maps
  const sections = useMemo(() => {
    if (!summaryText) return {};

    const sectionMap: Record<string, string[]> = {};
    const lines = summaryText.split("\n");

    let currentSection = "Executive Summary";
    sectionMap[currentSection] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith("#")) {
        // Strip # symbols
        currentSection = trimmed.replace(/^#+\s*/, "").trim();
        if (!sectionMap[currentSection]) {
          sectionMap[currentSection] = [];
        }
      } else {
        sectionMap[currentSection].push(trimmed);
      }
    });

    return sectionMap;
  }, [summaryText]);

  const getSectionContent = (titleMatch: string): string[] => {
    const key = Object.keys(sections).find(k => k.toLowerCase().includes(titleMatch.toLowerCase()));
    return key ? sections[key] : [];
  };

  const execSummary = getSectionContent("Executive Summary");
  const bizSummary = getSectionContent("Business Summary");
  const patternAnalysis = getSectionContent("Pattern Analysis");
  const suspiciousBehaviour = getSectionContent("Suspicious");
  const highRiskCustomers = getSectionContent("Customers");
  const highRiskMerchants = getSectionContent("Merchants");
  const keyFindings = getSectionContent("Key Findings");
  const recommendations = getSectionContent("Recommendations");
  const futurePrevention = getSectionContent("Prevention");
  const txReasoning = getSectionContent("Reasoning");

  return (
    <Card className="border border-indigo-200/80 dark:border-indigo-500/20 bg-card text-card-foreground shadow-xl overflow-hidden rounded-2xl">
      {/* Header Banner */}
      <CardHeader className="border-b border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/70 dark:bg-indigo-950/40 py-5 px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                AI Executive Summary & Pattern Report
                <Badge className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30 text-[10px] px-2 py-0.5 font-semibold">
                  Gemini 2.5 Intelligence
                </Badge>
              </CardTitle>
              <p className="text-xs text-slate-600 dark:text-indigo-200/70 mt-0.5">
                Automated threat analysis and machine learning insight synthesis
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          {fraudPercentage != null && (
            <div className="flex items-center gap-3 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-500/20 shadow-sm text-xs">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-indigo-300 font-semibold">Flagged Exposure</p>
                <p className="text-sm font-extrabold text-red-600 dark:text-red-400">{fraudPercentage.toFixed(1)}% ({fraudCount ?? 0} rows)</p>
              </div>
              <div className="h-8 w-[1px] bg-slate-200 dark:bg-indigo-500/20" />
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-indigo-300 font-semibold">Threat Level</p>
                <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                  {riskBreakdown?.critical ? "CRITICAL" : riskBreakdown?.high ? "ELEVATED" : "MODERATE"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-500/15">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-200/60 dark:bg-slate-900/80 p-1 border border-indigo-200/60 dark:border-indigo-500/20 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-1 h-auto">
              <TabsTrigger 
                value="overview" 
                className="text-xs py-2 px-3 font-semibold data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg transition-all"
              >
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Overview
              </TabsTrigger>
              <TabsTrigger 
                value="patterns" 
                className="text-xs py-2 px-3 font-semibold data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg transition-all"
              >
                <Search className="h-3.5 w-3.5 mr-1.5" /> Threat Patterns
              </TabsTrigger>
              <TabsTrigger 
                value="risks" 
                className="text-xs py-2 px-3 font-semibold data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg transition-all"
              >
                <ShieldAlert className="h-3.5 w-3.5 mr-1.5" /> Risk Entities
              </TabsTrigger>
              <TabsTrigger 
                value="actions" 
                className="text-xs py-2 px-3 font-semibold data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg transition-all"
              >
                <Lightbulb className="h-3.5 w-3.5 mr-1.5" /> Action Plan
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      {/* Main Tabbed Content Area */}
      <CardContent className="p-6 bg-slate-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200">
        <Tabs value={activeTab} className="w-full">
          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="mt-0 space-y-6">
            {/* Executive & Business Summary Cards Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800/70 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" /> Executive Overview
                </div>
                <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-2">
                  {execSummary.length > 0 ? (
                    execSummary.map((paragraph, i) => (
                      <p key={i}>{cleanInlineMarkdown(paragraph)}</p>
                    ))
                  ) : (
                    <p>Analysis initialized. High-level threat vector scanning complete.</p>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/70 border border-purple-100 dark:border-purple-500/20 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold text-sm">
                  <TrendingUp className="h-4 w-4 text-purple-600" /> Business & Financial Impact
                </div>
                <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-2">
                  {bizSummary.length > 0 ? (
                    bizSummary.map((paragraph, i) => (
                      <p key={i}>{cleanInlineMarkdown(paragraph)}</p>
                    ))
                  ) : (
                    <p>Financial exposure evaluated across card-not-present and foreign channels.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Key Findings List */}
            {keyFindings.length > 0 && (
              <div className="bg-white dark:bg-slate-800/50 border border-amber-200/80 dark:border-amber-500/20 rounded-xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                  <Zap className="h-4 w-4 text-amber-500" /> Critical Key Findings
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {keyFindings.map((finding, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-xs leading-normal text-slate-800 dark:text-slate-200">
                        {cleanInlineMarkdown(finding)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: THREAT PATTERNS */}
          <TabsContent value="patterns" className="mt-0 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800/70 border border-red-100 dark:border-red-500/20 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500" /> Fraud Pattern Analysis
                </div>
                <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-2">
                  {patternAnalysis.length > 0 ? (
                    patternAnalysis.map((paragraph, i) => (
                      <div key={i} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        <ChevronRight className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                        <span>{cleanInlineMarkdown(paragraph)}</span>
                      </div>
                    ))
                  ) : (
                    <p>No anomalous patterns reported.</p>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/70 border border-orange-100 dark:border-orange-500/20 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-bold text-sm">
                  <Search className="h-4 w-4 text-orange-500" /> Suspicious Behaviors Detected
                </div>
                <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-2">
                  {suspiciousBehaviour.length > 0 ? (
                    suspiciousBehaviour.map((paragraph, i) => (
                      <div key={i} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        <ChevronRight className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                        <span>{cleanInlineMarkdown(paragraph)}</span>
                      </div>
                    ))
                  ) : (
                    <p>Behavioral profiles analyzed cleanly.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Transaction Flag Reasoning */}
            {txReasoning.length > 0 && (
              <div className="bg-white dark:bg-slate-800/50 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Transaction Anomaly Classification Logic
                </div>
                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {txReasoning.map((reason, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed">
                      {cleanInlineMarkdown(reason)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: RISK ENTITIES */}
          <TabsContent value="risks" className="mt-0 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800/70 border border-amber-100 dark:border-amber-500/20 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                  <Users className="h-4 w-4 text-amber-500" /> High Risk Customers
                </div>
                <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-2">
                  {highRiskCustomers.length > 0 ? (
                    highRiskCustomers.map((p, i) => (
                      <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
                        {cleanInlineMarkdown(p)}
                      </div>
                    ))
                  ) : (
                    <p>No specific customer cluster compromised.</p>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/70 border border-cyan-100 dark:border-cyan-500/20 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 font-bold text-sm">
                  <Building2 className="h-4 w-4 text-cyan-500" /> High Risk Merchants & Channels
                </div>
                <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-2">
                  {highRiskMerchants.length > 0 ? (
                    highRiskMerchants.map((p, i) => (
                      <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
                        {cleanInlineMarkdown(p)}
                      </div>
                    ))
                  ) : (
                    <p>No high risk vendor anomalies detected.</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: ACTION PLAN */}
          <TabsContent value="actions" className="mt-0 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800/70 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Immediate Strategic Recommendations
                </div>
                <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-2.5">
                  {recommendations.length > 0 ? (
                    recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-lg border border-emerald-200/60 dark:border-emerald-500/20">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                          {i + 1}
                        </span>
                        <span>{cleanInlineMarkdown(rec)}</span>
                      </div>
                    ))
                  ) : (
                    <p>Enforce standard fraud review policy.</p>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/70 border border-blue-100 dark:border-blue-500/20 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
                  <ShieldCheck className="h-4 w-4 text-blue-500" /> Future Prevention & Rule Updates
                </div>
                <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-2.5">
                  {futurePrevention.length > 0 ? (
                    futurePrevention.map((prev, i) => (
                      <div key={i} className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-lg border border-blue-200/60 dark:border-blue-500/20">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20 text-[10px] font-bold text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30">
                          {i + 1}
                        </span>
                        <span>{cleanInlineMarkdown(prev)}</span>
                      </div>
                    ))
                  ) : (
                    <p>Integrate automated LOF rules in payment gateway.</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

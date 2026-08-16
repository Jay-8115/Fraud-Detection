"use client";

import React, { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGetAnalysis, useListTransactions } from "@/api-client"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Download, RefreshCw, Sparkles, Filter, Search, CheckCircle2, ChevronRight, FileSpreadsheet, FileText, ChevronDown, ChevronUp, ShieldAlert, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { useUser } from "@clerk/react"
import { AISummaryViewer } from "@/components/analysis/AISummaryViewer"
import * as XLSX from "xlsx"

const PROGRESS_STEPS = [
  "Preparing Dataset",
  "Running Isolation Forest",
  "Running LOF",
  "Running One-Class SVM",
  "Running AutoEncoder",
  "Combining Predictions",
  "Generating AI Summary",
  "Creating PDF Report"
];

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-2xl text-xs font-sans">
        <p className="font-semibold text-slate-300 border-b border-slate-700/60 pb-1 mb-1">{label || payload[0].name}</p>
        <div className="flex items-center gap-2 text-indigo-300 font-bold">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color || payload[0].fill || '#8b5cf6' }} />
          <span>Count: <strong className="text-white">{payload[0].value.toLocaleString()}</strong></span>
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalysisResultPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || ""
  
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<string>("riskScore")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [riskFilter, setRiskFilter] = useState<string>("all")
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in")
    }
  }, [user, isLoaded, router])

  // Poll if status is not completed
  const { data: analysis, isLoading: analysisLoading } = useGetAnalysis(id, {
    query: {
      queryKey: ['getAnalysis', id],
      refetchInterval: (query) => {
        const status = query.state.data?.status
        if (status === 'pending' || status === 'running') return 1500
        return false
      }
    }
  })

  // Fetch transactions (Get all suspicious fraud ones for charts and table listing)
  const { data: transactionsData, isLoading: transactionsLoading } = useListTransactions(id, { 
    page, 
    limit: 10, 
    search, 
    prediction: "fraud" 
  })

  // Fetch a larger set for dynamic client-side charts to show detailed aggregates
  const { data: allSuspiciousData } = useListTransactions(id, {
    page: 1,
    limit: 500,
    prediction: "fraud"
  })

  if (!isLoaded || !user) {
    return null
  }

  const isComplete = analysis?.status === 'completed'
  const isFailed = analysis?.status === 'failed'

  // Stepper calculations
  const currentStepIndex = useMemo(() => {
    if (!analysis?.progressStep) return 0;
    return PROGRESS_STEPS.indexOf(analysis.progressStep as string);
  }, [analysis?.progressStep]);

  // Data aggregations for charts
  const chartData = useMemo(() => {
    if (!allSuspiciousData || !Array.isArray(allSuspiciousData.data)) return null;
    const list = allSuspiciousData.data;

    const countries: Record<string, number> = {};
    const merchants: Record<string, number> = {};
    const paymentMethods: Record<string, number> = {};
    const devices: Record<string, number> = {};
    const trends: Record<string, number> = {};

    list.forEach(t => {
      const rd = (t.rawData || {}) as any;
      
      const c = String(rd.country || rd.Country || "US");
      countries[c] = (countries[c] || 0) + 1;

      const m = String(rd.merchant || rd.Merchant || "Unknown Merchant");
      merchants[m] = (merchants[m] || 0) + 1;

      const pm = String(rd.payment_method || rd.PaymentMethod || "Unknown Method");
      paymentMethods[pm] = (paymentMethods[pm] || 0) + 1;

      const d = String(rd.device || rd.Device || "Unknown Device");
      devices[d] = (devices[d] || 0) + 1;

      const dateStr = String(rd.date || rd.Date || "Recent");
      trends[dateStr] = (trends[dateStr] || 0) + 1;
    });

    return {
      countries: Object.entries(countries).map(([name, count]) => ({ name, count })).slice(0, 5),
      merchants: Object.entries(merchants).map(([name, count]) => ({ name, count })).slice(0, 5),
      paymentMethods: Object.entries(paymentMethods).map(([name, count]) => ({ name, count })).slice(0, 5),
      devices: Object.entries(devices).map(([name, count]) => ({ name, count })).slice(0, 5),
      trends: Object.entries(trends).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 10),
    };
  }, [allSuspiciousData]);

  // Formatted summaries
  const pieData = analysis ? [
    { name: 'Fraud', value: analysis.fraudCount || 0 },
    { name: 'Normal', value: (analysis.totalTransactions || 0) - (analysis.fraudCount || 0) },
  ] : []

  const riskData = analysis?.riskBreakdown ? [
    { name: 'Critical', count: analysis.riskBreakdown.critical, fill: 'hsl(var(--destructive))' },
    { name: 'High', count: analysis.riskBreakdown.high, fill: '#f97316' }, 
    { name: 'Medium', count: analysis.riskBreakdown.medium, fill: '#fbbf24' }, 
    { name: 'Low', count: analysis.riskBreakdown.low, fill: '#22c55e' }, 
  ] : []

  // Check columns dynamically in rawData to hide missing ones
  const visibleColumns = useMemo(() => {
    const defaultCols = {
      transactionId: true,
      date: false,
      customerId: false,
      merchant: false,
      amount: true,
      country: false,
      location: false,
      paymentMethod: false,
      device: false,
      ipAddress: false,
    };

    if (!transactionsData?.data || transactionsData.data.length === 0) return defaultCols;

    const firstRow = transactionsData.data[0].rawData || {};
    const hasKey = (key: string) => Object.keys(firstRow).some(k => k.toLowerCase().replace(/[^a-z0-9]/g, "") === key.toLowerCase());

    return {
      transactionId: true,
      date: hasKey("date") || hasKey("time"),
      customerId: hasKey("customerid") || hasKey("customer"),
      merchant: hasKey("merchant") || hasKey("vendor"),
      amount: true,
      country: hasKey("country"),
      location: hasKey("location") || hasKey("city"),
      paymentMethod: hasKey("paymentmethod") || hasKey("payment"),
      device: hasKey("device"),
      ipAddress: hasKey("ipaddress") || hasKey("ip"),
    };
  }, [transactionsData]);

  // Export functions
  const handleExportExcel = () => {
    if (!allSuspiciousData?.data) return;
    setExporting(true);
    const rows = allSuspiciousData.data.map(t => {
      const rd = (t.rawData || {}) as any;
      const ens = rd.ensemble || {};
      return {
        "Transaction ID": t.transactionId,
        "Amount": t.amount,
        "Fraud Probability": `${t.probability}%`,
        "Ensemble Confidence": `${ens.confidence || t.probability}%`,
        "Risk Score": t.riskScore,
        "Risk Level": t.riskLevel,
        "Recommended Model": analysis?.recommendedModel || "Isolation Forest",
        "AI Explanation": t.reason,
        "Merchant": rd.merchant || "N/A",
        "Location": rd.location || "N/A",
        "Country": rd.country || "N/A",
        "Device": rd.device || "N/A",
        "IP Address": rd.ip_address || "N/A",
        "Date": rd.date || "N/A"
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Flagged Fraud");
    XLSX.writeFile(wb, `Suspicious_Transactions_${id}.xlsx`);
    setExporting(false);
  };

  const handleExportCSV = () => {
    if (!allSuspiciousData?.data) return;
    setExporting(true);
    const headers = ["Transaction ID", "Amount", "Probability", "Risk Score", "Risk Level", "Explanation"];
    const csvRows = [headers.join(",")];

    allSuspiciousData.data.forEach(t => {
      csvRows.push([
        t.transactionId,
        t.amount || 0,
        `${t.probability}%`,
        t.riskScore,
        t.riskLevel,
        `"${t.reason?.replace(/"/g, '""')}"`
      ].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `Suspicious_Transactions_${id}.csv`);
    a.click();
    setExporting(false);
  };

  const handleDownloadPDFReport = async () => {
    setGeneratingReport(true);
    try {
      // Direct call to generate/register report in DB and get download link
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId: id })
      });
      const report = await res.json();
      if (report.downloadUrl) {
        // Trigger file download
        window.open(report.downloadUrl, '_blank');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Render stepper during running state
  if (!isComplete && !isFailed) {
    return (
      <AppLayout title="Analyzing Dataset">
        <div className="max-w-3xl mx-auto py-8">
          <div className="flex flex-col items-center justify-center space-y-6 mb-12 text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-2xl bg-primary/30 animate-pulse"></div>
              <RefreshCw className="relative h-14 w-14 animate-spin text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Processing {analysis?.fileName}</h2>
              <p className="text-muted-foreground">Running Ensemble Unsupervised Fraud Detection Engine...</p>
            </div>
          </div>

          <Card className="shadow-lg border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/10 pb-6 border-b">
              <CardTitle className="text-sm uppercase tracking-wider font-semibold text-muted-foreground">ML Execution Steps</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative border-l pl-6 ml-3 space-y-6">
                {PROGRESS_STEPS.map((step, idx) => {
                  const isCompleted = idx < currentStepIndex;
                  const isActive = idx === currentStepIndex;
                  
                  return (
                    <div key={step} className="relative flex items-start gap-4">
                      {/* Stepper Dot */}
                      <span className={`absolute -left-[35px] flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isCompleted ? 'bg-green-500 text-white' :
                        isActive ? 'bg-primary text-primary-foreground border-2 border-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                      </span>
                      
                      <div className="space-y-0.5">
                        <p className={`text-sm font-medium leading-none ${
                          isCompleted ? 'text-green-600 font-semibold' :
                          isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                        }`}>{step}</p>
                        {isActive && (
                          <p className="text-xs text-muted-foreground animate-pulse mt-1">In progress...</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (isFailed) {
    return (
      <AppLayout title="Analysis Failed">
        <Card className="border-destructive max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Analysis Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">{analysis?.errorMessage || "An unexpected error occurred during analysis."}</p>
            <Button className="mt-6" onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  if (analysisLoading || !analysis) {
    return (
      <AppLayout title="Loading Analysis Results">
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-pulse">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const safeTransactions = transactionsData && Array.isArray(transactionsData.data) ? transactionsData.data : []
  const totalTxPages = transactionsData && typeof transactionsData.totalPages === 'number' ? transactionsData.totalPages : 1

  return (
    <AppLayout title={`Analysis Results`}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{analysis.fileName}</h2>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-semibold">
                Ensemble Engine
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
              <span>{analysis.totalTransactions?.toLocaleString()} Total Rows</span>
              <span>•</span>
              <span className="font-medium text-primary">Recommended Model: {analysis.recommendedModel || "Isolation Forest"}</span>
            </div>
          </div>
          <Button onClick={handleDownloadPDFReport} disabled={generatingReport} className="shadow-sm">
            <FileText className="mr-2 h-4 w-4" /> 
            {generatingReport ? "Generating Report..." : "Download PDF Report"}
          </Button>
        </div>

        {/* AI Executive Summary Card */}
        {analysis.aiSummary && (
          <AISummaryViewer
            summaryText={analysis.aiSummary}
            totalTransactions={analysis.totalTransactions ?? undefined}
            fraudCount={analysis.fraudCount ?? undefined}
            fraudPercentage={analysis.fraudPercentage ?? undefined}
            riskBreakdown={analysis.riskBreakdown ?? undefined}
          />
        )}

        {/* Dashboard Summary Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysis.totalTransactions?.toLocaleString()}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Total dataset size processed</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-destructive">Fraud Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{analysis.fraudCount?.toLocaleString()}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Classified anomalous by ensemble</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fraud Percentage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysis.fraudPercentage?.toFixed(2)}%</div>
              <p className="text-[10px] text-muted-foreground mt-1">Flagged exposure percentage</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-orange-500">Critical Risk Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{analysis.riskBreakdown?.critical.toLocaleString()}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Weighted risk score &gt; 80%</p>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Main Distribution Chart */}
          <Card className="shadow-md border-slate-200/80 dark:border-slate-800 bg-card hover:shadow-lg transition-shadow">
            <CardHeader className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-3.5">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Fraud vs Normal Distribution</span>
                <Badge variant="outline" className="text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">Pie Analysis</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[250px] w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      <Cell fill="#ef4444" stroke="#ffffff" strokeWidth={2} />
                      <Cell fill="#3b82f6" stroke="#ffffff" strokeWidth={2} />
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Badge indicator */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-muted-foreground font-medium">Fraud Share</span>
                  <span className="text-lg font-extrabold text-red-600">{analysis.fraudPercentage?.toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-4 pt-3 border-t dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Fraud ({analysis.fraudCount?.toLocaleString()})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Normal ({((analysis.totalTransactions || 0) - (analysis.fraudCount || 0)).toLocaleString()})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Level Distribution */}
          <Card className="shadow-md border-slate-200/80 dark:border-slate-800 bg-card hover:shadow-lg transition-shadow">
            <CardHeader className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-3.5">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Risk Level Severity Spectrum</span>
                <Badge variant="outline" className="text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">4 Severity Tiers</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" fontSize={11} />
                    <YAxis dataKey="name" type="category" width={65} stroke="#475569" fontSize={12} fontWeight={600} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic breakdowns from dataset columns */}
          {chartData && (
            <>
              {/* Fraud by Country */}
              {chartData.countries.length > 0 && (
                <Card className="shadow-md border-slate-200/80 dark:border-slate-800 bg-card hover:shadow-lg transition-shadow">
                  <CardHeader className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-3.5">
                    <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Fraud Distribution by Country</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.countries}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#475569" fontSize={12} fontWeight={500} />
                          <YAxis stroke="#64748b" fontSize={11} />
                          <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
                          <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fraud by Merchant */}
              {chartData.merchants.length > 0 && (
                <Card className="shadow-md border-slate-200/80 dark:border-slate-800 bg-card hover:shadow-lg transition-shadow">
                  <CardHeader className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-3.5">
                    <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Top Suspicious Merchants</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.merchants} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                          <XAxis type="number" stroke="#64748b" fontSize={11} />
                          <YAxis dataKey="name" type="category" width={110} stroke="#475569" fontSize={11} />
                          <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fraud by Payment Method */}
              {chartData.paymentMethods.length > 0 && (
                <Card className="shadow-md border-slate-200/80 dark:border-slate-800 bg-card hover:shadow-lg transition-shadow">
                  <CardHeader className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-3.5">
                    <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Fraud by Payment Channel</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.paymentMethods}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#475569" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} />
                          <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
                          <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fraud by Device */}
              {chartData.devices.length > 0 && (
                <Card className="shadow-md border-slate-200/80 dark:border-slate-800 bg-card hover:shadow-lg transition-shadow">
                  <CardHeader className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-3.5">
                    <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Fraud by Device Vector</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.devices}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            dataKey="count"
                            label
                          >
                            {chartData.devices.map((e, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#ffffff" strokeWidth={2} />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

            </>
          )}
        </div>

        {/* Suspicious Transaction Table Card */}
        <Card className="shadow-md border border-border bg-card overflow-hidden rounded-2xl">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b bg-muted/30 py-4 px-6">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                Flagged Suspicious Transactions
              </CardTitle>
              <CardDescription className="text-xs">Inspect anomalous transactions identified by ensemble voting.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Search Tx ID..." 
                  className="pl-8 bg-background h-8 w-full sm:w-44 text-xs rounded-lg" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={handleExportExcel} disabled={exporting} variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                Excel
              </Button>
              <Button onClick={handleExportCSV} disabled={exporting} variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5 text-blue-500" />
                CSV
              </Button>
            </div>
          </CardHeader>

          {/* Quick Severity Filter Bar */}
          <div className="px-6 py-2.5 bg-muted/10 border-b flex items-center justify-between gap-2 overflow-x-auto text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">Severity:</span>
              {[
                { id: "all", label: "All Flagged", count: safeTransactions.length },
                { id: "critical", label: "Critical", count: safeTransactions.filter(t => t.riskLevel === "critical").length },
                { id: "high", label: "High", count: safeTransactions.filter(t => t.riskLevel === "high").length },
                { id: "medium", label: "Medium", count: safeTransactions.filter(t => t.riskLevel === "medium").length },
                { id: "low", label: "Low", count: safeTransactions.filter(t => t.riskLevel === "low").length },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setRiskFilter(t.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                    riskFilter === t.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {t.count > 0 && <span className="opacity-80">({t.count})</span>}
                </button>
              ))}
            </div>
          </div>

          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="text-xs">
                  <TableHead className="w-[140px] pl-6 font-bold">Transaction ID</TableHead>
                  <TableHead className="font-bold">Amount</TableHead>
                  <TableHead className="font-bold">Merchant / Channel</TableHead>
                  <TableHead className="font-bold">Fraud Probability</TableHead>
                  <TableHead className="font-bold">Risk Score</TableHead>
                  <TableHead className="font-bold">Severity</TableHead>
                  <TableHead className="pr-6 text-right font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {transactionsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="h-7 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (() => {
                  const filteredTxs = safeTransactions.filter(t => riskFilter === "all" || t.riskLevel === riskFilter);
                  
                  if (filteredTxs.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          No suspicious transactions found for severity "{riskFilter}"
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return filteredTxs.map((tx) => {
                    const rd = (tx.rawData || {}) as any;
                    const merchant = rd.merchant || rd.Merchant || rd.vendor || "N/A";
                    const country = rd.country || rd.Country || "N/A";
                    const isExpanded = expandedTxId === tx.id;

                    return (
                      <React.Fragment key={tx.id}>
                        <TableRow className={`hover:bg-muted/40 transition-colors ${isExpanded ? 'bg-muted/30' : ''}`}>
                          <TableCell className="font-mono text-[11px] pl-6 font-bold text-foreground">
                            {tx.transactionId}
                            <div className="text-[10px] font-sans font-normal text-muted-foreground mt-0.5">
                              {String(rd.date || rd.Date || "Recent")}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-foreground">
                            {tx.amount ? formatCurrency(tx.amount) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground">{String(merchant)}</div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                              <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">{String(country)}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-extrabold text-red-500">
                            {tx.probability.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    tx.riskScore > 80 ? 'bg-red-500' : tx.riskScore > 60 ? 'bg-orange-500' : 'bg-yellow-500'
                                  }`} 
                                  style={{ width: `${Math.min(100, tx.riskScore)}%` }} 
                                />
                              </div>
                              <span className="font-bold text-xs">{Math.round(tx.riskScore)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {tx.riskLevel === 'critical' ? (
                              <Badge variant="destructive" className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-300 text-[10px] px-2 py-0.5 font-bold uppercase">Critical</Badge>
                            ) : tx.riskLevel === 'high' ? (
                              <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-300 text-[10px] px-2 py-0.5 font-bold uppercase">High</Badge>
                            ) : tx.riskLevel === 'medium' ? (
                              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 text-[10px] px-2 py-0.5 font-bold uppercase">Medium</Badge>
                            ) : (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 text-[10px] px-2 py-0.5 font-bold uppercase">Low</Badge>
                            )}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                              className="h-7 px-2.5 text-xs gap-1 font-semibold text-primary hover:bg-primary/10"
                            >
                              {isExpanded ? <>Less <ChevronUp className="h-3.5 w-3.5" /></> : <>Details <ChevronDown className="h-3.5 w-3.5" /></>}
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Expandable Detail Card */}
                        {isExpanded && (
                          <TableRow className="bg-muted/20 border-b border-border">
                            <TableCell colSpan={7} className="p-4 pl-6 pr-6">
                              <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
                                {/* AI Reason Header */}
                                <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs">
                                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-red-600 dark:text-red-400">AI Anomaly Reason:</span>
                                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                                      {tx.reason || "Flagged due to multi-model unsupervised anomaly score deviation."}
                                    </p>
                                  </div>
                                </div>

                                {/* Full Parameters Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                                  <div className="p-2.5 bg-muted/40 rounded-lg border">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Customer ID</span>
                                    <p className="font-mono text-xs font-semibold text-foreground mt-0.5">{String(rd.customer_id || rd.CustomerID || "N/A")}</p>
                                  </div>
                                  <div className="p-2.5 bg-muted/40 rounded-lg border">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Device Terminal</span>
                                    <p className="font-semibold text-foreground mt-0.5">{String(rd.device || rd.Device || "N/A")}</p>
                                  </div>
                                  <div className="p-2.5 bg-muted/40 rounded-lg border">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Payment Channel</span>
                                    <p className="font-semibold text-foreground mt-0.5">{String(rd.payment_method || rd.PaymentMethod || "N/A")}</p>
                                  </div>
                                  <div className="p-2.5 bg-muted/40 rounded-lg border">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">IP Geolocation</span>
                                    <p className="font-mono text-xs font-semibold text-foreground mt-0.5">{String(rd.ip_address || rd.ip || "N/A")}</p>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  });
                })()}
              </TableBody>
            </Table>
            
            {/* Pagination Controls */}
            {transactionsData && totalTxPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3.5 border-t bg-muted/30 text-xs">
                <span className="text-muted-foreground">
                  Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, transactionsData.total)} of {transactionsData.total} suspicious items
                </span>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 text-xs"
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.min(totalTxPages, p + 1))}
                    disabled={page === totalTxPages}
                    className="h-8 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

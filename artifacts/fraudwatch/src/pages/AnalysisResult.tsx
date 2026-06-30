import { useEffect, useState } from "react"
import { useParams } from "wouter"
import { useGetAnalysis, useListTransactions } from "@workspace/api-client-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, CheckCircle2, Download, RefreshCw, ShieldAlert, Sparkles, Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils"

export function AnalysisResultPage() {
  const { id } = useParams<{ id: string }>()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  
  // Poll if status is not completed
  const { data: analysis, isLoading: analysisLoading, refetch: refetchAnalysis } = useGetAnalysis(id, {
    query: {
      refetchInterval: (query) => {
        const status = query.state.data?.status
        if (status === 'pending' || status === 'running') return 2000
        return false
      }
    }
  })

  const { data: transactionsData, isLoading: transactionsLoading } = useListTransactions(id, { page, limit: 10, search })

  const isComplete = analysis?.status === 'completed'
  const isFailed = analysis?.status === 'failed'

  const pieData = analysis ? [
    { name: 'Fraud', value: analysis.fraudCount || 0 },
    { name: 'Legitimate', value: analysis.legitimateCount || 0 },
  ] : []
  
  const COLORS = ['hsl(var(--destructive))', 'hsl(var(--chart-3))']

  const riskData = analysis?.riskBreakdown ? [
    { name: 'Critical', count: analysis.riskBreakdown.critical, fill: 'hsl(var(--destructive))' },
    { name: 'High', count: analysis.riskBreakdown.high, fill: '#f97316' }, // orange-500
    { name: 'Medium', count: analysis.riskBreakdown.medium, fill: '#fbbf24' }, // amber-400
    { name: 'Low', count: analysis.riskBreakdown.low, fill: '#22c55e' }, // green-500
  ] : []

  if (analysisLoading && !analysis) {
    return (
      <AppLayout title="Analysis Results">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
          </div>
        </div>
      </AppLayout>
    )
  }

  if (isFailed) {
    return (
      <AppLayout title="Analysis Failed">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Analysis Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{analysis?.errorMessage || "An unexpected error occurred during analysis."}</p>
            <Button className="mt-4" onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  if (!isComplete) {
    return (
      <AppLayout title="Analyzing Dataset">
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl bg-primary/30 animate-pulse"></div>
            <RefreshCw className="relative h-16 w-16 animate-spin text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Processing {analysis?.fileName}</h2>
            <p className="text-muted-foreground">Running {analysis?.modelName.replace('_', ' ')} model on {analysis?.totalTransactions?.toLocaleString()} transactions...</p>
          </div>
          <Card className="w-full max-w-md p-6 bg-muted/30">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Feature extraction</span>
                <span className="text-green-500 font-medium">Done</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Model inference</span>
                <span className="text-primary font-medium animate-pulse">Running</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Report generation</span>
                <span className="text-muted-foreground/50">Pending</span>
              </div>
            </div>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title={`Analysis: ${analysis.fileName}`}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{analysis.fileName}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Badge variant="outline" className="font-mono">{analysis.modelName.replace('_', ' ')}</Badge>
              <span>•</span>
              <span>{analysis.totalTransactions?.toLocaleString()} rows</span>
              <span>•</span>
              <span>Acc: {(analysis.metrics?.accuracy ? analysis.metrics.accuracy * 100 : 0).toFixed(2)}%</span>
            </div>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" /> Download Report
          </Button>
        </div>

        {analysis.aiSummary && (
          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" /> AI Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-700">{analysis.aiSummary}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analysis.totalTransactions?.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fraud Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{analysis.fraudCount?.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fraud Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analysis.fraudPercentage?.toFixed(2)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Critical Risk Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">{analysis.riskBreakdown?.critical.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive"></div>
                  <span className="text-sm font-medium">Fraud ({analysis.fraudCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-3))]"></div>
                  <span className="text-sm font-medium">Legitimate ({analysis.legitimateCount})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={60} />
                    <RechartsTooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transaction Details</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search ID..." 
                  className="pl-9 bg-muted/50" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[150px] pl-6">Transaction ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Prediction</TableHead>
                  <TableHead className="pr-6">Primary Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="pr-6"><Skeleton className="h-4 w-48" /></TableCell>
                    </TableRow>
                  ))
                ) : transactionsData?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactionsData?.data.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs pl-6">{tx.transactionId}</TableCell>
                      <TableCell className="font-medium">{tx.amount ? formatCurrency(tx.amount) : 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div 
                              className={`h-full ${
                                tx.riskScore > 80 ? 'bg-destructive' : 
                                tx.riskScore > 60 ? 'bg-orange-500' : 
                                tx.riskScore > 40 ? 'bg-amber-400' : 'bg-green-500'
                              }`} 
                              style={{ width: `${tx.riskScore}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-muted-foreground">{Math.round(tx.riskScore)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tx.prediction === 'fraud' ? (
                          <Badge variant="destructive" className="bg-destructive/10 text-destructive border-0 hover:bg-destructive/20">Fraud</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-0">Legitimate</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground pr-6 truncate max-w-[200px]" title={tx.reason || ''}>
                        {tx.reason || 'Normal behavior pattern'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Pagination Controls */}
            {transactionsData && transactionsData.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/50">
                <span className="text-sm text-muted-foreground">
                  Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, transactionsData.total)} of {transactionsData.total}
                </span>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.min(transactionsData.totalPages, p + 1))}
                    disabled={page === transactionsData.totalPages}
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

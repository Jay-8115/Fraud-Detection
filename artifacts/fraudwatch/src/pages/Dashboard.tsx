import { useGetDashboardStats, useGetFraudTrends, useGetRecentActivity } from "@workspace/api-client-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { FileUp, AlertTriangle, CheckCircle2, ShieldAlert, Activity } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { format, parseISO } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats()
  const { data: trends, isLoading: trendsLoading } = useGetFraudTrends({ days: 30 })
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity()

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <FileUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalFiles.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Uploaded datasets</p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fraud Detected</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                <>
                  <div className="text-2xl font-bold text-destructive">{stats?.totalFraud.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.fraudPercentage.toFixed(1)}% of {stats?.totalTransactions.toLocaleString()} total
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Alerts</CardTitle>
              <ShieldAlert className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                <>
                  <div className="text-2xl font-bold text-orange-500">{stats?.highRiskCount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Requires immediate review</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Legitimate Activity</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                <>
                  <div className="text-2xl font-bold text-green-500">{stats?.totalLegitimate.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Cleared transactions</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-7">
          <Card className="md:col-span-4 lg:col-span-5">
            <CardHeader>
              <CardTitle>Fraud Detection Trends</CardTitle>
              <CardDescription>30-day moving average of flagged transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {trendsLoading ? <Skeleton className="h-full w-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => format(parseISO(val), 'MMM d')}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                      />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                        labelFormatter={(val) => format(parseISO(val as string), 'MMM d, yyyy')}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="fraudCount" 
                        name="Fraud Detected"
                        stroke="hsl(var(--destructive))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorFraud)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3 lg:col-span-2 overflow-hidden flex flex-col">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> 
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
              {activityLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : activity?.length === 0 ? (
                <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                  No recent activity
                </div>
              ) : (
                <div className="divide-y">
                  {activity?.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                          item.type === 'analysis' ? 'bg-primary' : 
                          item.type === 'upload' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(item.createdAt), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

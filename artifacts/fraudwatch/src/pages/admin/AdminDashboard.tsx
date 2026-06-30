import { AdminLayout } from "@/components/layout/AdminLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetAdminStats, useListAdminAnalyses } from "@workspace/api-client-react"
import { Users, FileUp, Activity, Database, AlertOctagon } from "lucide-react"
import { formatBytes } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { format, parseISO } from "date-fns"

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats()
  const { data: recentAnalyses, isLoading: recentLoading } = useListAdminAnalyses({ limit: 5 })

  return (
    <AdminLayout title="System Overview">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-100 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                <>
                  <div className="text-2xl font-bold text-blue-950">{stats?.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-blue-700">{stats?.activeUsers} active</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-900">Total Analyses</CardTitle>
              <Activity className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-2xl font-bold text-emerald-950">{stats?.totalAnalyses.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-orange-100 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-900">System Fraud Detections</CardTitle>
              <AlertOctagon className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-2xl font-bold text-orange-950">{stats?.totalFraudDetected.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-purple-50/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Storage Used</CardTitle>
              <Database className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                <>
                  <div className="text-2xl font-bold text-purple-950">{formatBytes(stats?.storageUsedBytes || 0)}</div>
                  <p className="text-xs text-purple-700">Across {stats?.totalUploads} files</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent System Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : (
              <div className="divide-y border rounded-lg">
                {recentAnalyses?.data.map(analysis => (
                  <div key={analysis.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="font-medium">{analysis.fileName}</p>
                      <p className="text-xs text-muted-foreground">User ID: {analysis.userId} • Model: {analysis.modelName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium capitalize text-slate-700">{analysis.status}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(analysis.createdAt), 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

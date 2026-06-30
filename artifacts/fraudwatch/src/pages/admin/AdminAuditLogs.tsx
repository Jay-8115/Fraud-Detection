import { useState } from "react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useGetAuditLogs } from "@workspace/api-client-react"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"

export function AdminAuditLogsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGetAuditLogs({ page, limit: 20 })

  return (
    <AdminLayout title="Audit Logs">
      <Card>
        <CardHeader>
          <CardTitle>System Audit Trail</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="pl-6 w-[180px]">Timestamp</TableHead>
                <TableHead>User Email</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead className="pr-6">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading logs...</TableCell></TableRow>
              ) : (
                data?.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="pl-6 text-xs text-muted-foreground font-mono">
                      {format(parseISO(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{log.userEmail}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{log.resource}</TableCell>
                    <TableCell className="pr-6 text-xs text-muted-foreground max-w-[300px] truncate" title={log.details || ''}>
                      {log.details || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <span className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

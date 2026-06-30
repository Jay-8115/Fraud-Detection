import { useState } from "react"
import { Link } from "wouter"
import { useListAnalyses, useDeleteAnalysis } from "@workspace/api-client-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { formatBytes } from "@/lib/utils"
import { Trash2, Eye, FileSearch, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { getListAnalysesQueryKey } from "@workspace/api-client-react"

export function HistoryPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useListAnalyses({ page, limit: 10 })
  const deleteAnalysis = useDeleteAnalysis()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this analysis?")) return;
    
    deleteAnalysis.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Analysis deleted" })
        queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey({ page, limit: 10 }) })
      },
      onError: () => {
        toast({ title: "Failed to delete analysis", variant: "destructive" })
      }
    })
  }

  return (
    <AppLayout title="Analysis History">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle>Past Analyses</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search analyses..." className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="pl-6">Dataset</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Findings</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <FileSearch className="h-12 w-12 mx-auto mb-4 text-muted" />
                    No analyses found. Upload a file to get started.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-6">
                      <div className="font-medium">{item.fileName}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.totalTransactions?.toLocaleString() || 0} rows
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.modelName.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.status === 'completed' ? (
                        <Badge variant="success" className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>
                      ) : item.status === 'failed' ? (
                        <Badge variant="destructive">Failed</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 animate-pulse">Running</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.status === 'completed' && item.fraudCount !== null && (
                        <div className="flex items-center gap-2">
                          <span className={item.fraudCount > 0 ? "text-destructive font-bold" : "text-green-600 font-bold"}>
                            {item.fraudCount}
                          </span>
                          <span className="text-xs text-muted-foreground">fraudulent</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(parseISO(item.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/analysis/${item.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteAnalysis.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  )
}

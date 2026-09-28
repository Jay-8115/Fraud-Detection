"use client";

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useListAnalyses, useDeleteAnalysis } from "@/api-client"
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
import { getListAnalysesQueryKey } from "@/api-client"
import { useUser } from "@/hooks/use-user"
import { useRouter } from "next/navigation"

export default function HistoryPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useListAnalyses({ page, limit: 10 })
  const deleteAnalysis = useDeleteAnalysis()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in")
    }
  }, [user, isLoaded, router])

  if (!isLoaded || !user) {
    return null
  }

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

  const safeData = data && Array.isArray(data.data) ? data.data : []
  const totalPages = data && typeof data.totalPages === 'number' ? data.totalPages : 1

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
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="pl-6 font-bold">Dataset</TableHead>
                <TableHead className="font-bold">Model</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Findings</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="text-right pr-6 font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : safeData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <FileSearch className="h-12 w-12 mx-auto mb-4 text-muted" />
                    No analyses found. Upload a file to get started.
                  </TableCell>
                </TableRow>
              ) : (
                safeData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="pl-6">
                      <div className="font-semibold text-foreground">{item.fileName}</div>
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
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold">Completed</Badge>
                      ) : item.status === 'failed' ? (
                        <Badge variant="destructive" className="font-bold">Failed</Badge>
                      ) : (
                        <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 animate-pulse font-bold">Running</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.status === 'completed' && typeof item.fraudCount === 'number' && (
                        <div className="flex items-center gap-2">
                          <span className={item.fraudCount > 0 ? "text-destructive font-bold" : "text-green-600 font-bold"}>
                            {item.fraudCount}
                          </span>
                          <span className="text-xs text-muted-foreground">fraudulent</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(() => {
                        try {
                          return format(parseISO(item.createdAt), 'MMM d, yyyy');
                        } catch (e) {
                          return item.createdAt;
                        }
                      })()}
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

          {data && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  )
}

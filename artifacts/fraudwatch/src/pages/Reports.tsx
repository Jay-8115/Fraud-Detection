import { useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useListReports, useDeleteReport } from "@workspace/api-client-react"
import { format, parseISO } from "date-fns"
import { Download, Trash2, FileText, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { getListReportsQueryKey } from "@workspace/api-client-react"

export function ReportsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useListReports({ page, limit: 10 })
  const deleteReport = useDeleteReport()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleDelete = (id: string) => {
    if (!confirm("Delete this report?")) return;
    deleteReport.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Report deleted" })
        queryClient.invalidateQueries({ queryKey: getListReportsQueryKey({ page, limit: 10 }) })
      }
    })
  }

  return (
    <AppLayout title="Audit Reports">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Generated Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="pl-6">Report Name</TableHead>
                <TableHead>Generated At</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted" />
                    No reports generated yet.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="pl-6 font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        {report.fileName}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(parseISO(report.createdAt), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={report.downloadUrl} target="_blank" rel="noreferrer">
                            <Download className="mr-2 h-4 w-4" /> Download
                          </a>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(report.id)}
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
        </CardContent>
      </Card>
    </AppLayout>
  )
}

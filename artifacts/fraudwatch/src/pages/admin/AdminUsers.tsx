import { useState } from "react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useListAdminUsers, useUpdateAdminUser } from "@workspace/api-client-react"
import { format, parseISO } from "date-fns"
import { Shield, ShieldOff, Ban, CheckCircle2, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { getListAdminUsersQueryKey } from "@workspace/api-client-react"

export function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useListAdminUsers({ page, limit: 15 })
  const updateUser = useUpdateAdminUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleToggleBlock = (id: string, currentlyBlocked: boolean) => {
    updateUser.mutate({ id, data: { isBlocked: !currentlyBlocked } }, {
      onSuccess: () => {
        toast({ title: currentlyBlocked ? "User unblocked" : "User blocked" })
        queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey({ page, limit: 15 }) })
      }
    })
  }

  const handleToggleRole = (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    updateUser.mutate({ id, data: { role: newRole as any } }, {
      onSuccess: () => {
        toast({ title: `Role changed to ${newRole}` })
        queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey({ page, limit: 15 }) })
      }
    })
  }

  return (
    <AdminLayout title="User Management">
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="pl-6">User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : (
                data?.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? "default" : "outline"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isBlocked ? (
                        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-0">Blocked</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-0">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.totalAnalyses} analyses
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(parseISO(user.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleRole(user.id, user.role)}
                          className="text-xs"
                        >
                          {user.role === 'admin' ? <ShieldOff className="mr-1 h-3 w-3" /> : <Shield className="mr-1 h-3 w-3" />}
                          {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </Button>
                        <Button 
                          variant={user.isBlocked ? "outline" : "ghost"} 
                          size="sm"
                          onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                          className={!user.isBlocked ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : "text-green-600 border-green-200"}
                        >
                          {user.isBlocked ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <Ban className="mr-1 h-3 w-3" />}
                          {user.isBlocked ? 'Unblock' : 'Block'}
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

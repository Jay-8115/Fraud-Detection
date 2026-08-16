"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useListAdminUsers, useUpdateAdminUser, useDeleteAdminUser, getListAdminUsersQueryKey } from "@/api-client";
import { format, parseISO } from "date-fns";
import { 
  Shield, 
  ShieldOff, 
  Ban, 
  CheckCircle2, 
  User as UserIcon, 
  Trash2, 
  Search, 
  Activity, 
  Calendar,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminUsersPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; email: string } | null>(null);

  const isAdmin = user?.publicMetadata?.role === "admin";

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        router.push("/sign-in");
      } else if (!isAdmin) {
        router.push("/dashboard");
      }
    }
  }, [user, isLoaded, isAdmin, router]);

  const { data, isLoading } = useListAdminUsers({ 
    page, 
    limit: 10,
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined
  });
  
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!isLoaded || !user || !isAdmin) {
    return null;
  }

  const handleToggleBlock = (id: string, currentlyBlocked: boolean, userEmail: string) => {
    updateUser.mutate(
      { id, data: { isBlocked: !currentlyBlocked } },
      {
        onSuccess: () => {
          toast({
            title: currentlyBlocked ? "User Activated" : "User Deactivated",
            description: `${userEmail} has been ${currentlyBlocked ? "activated (unblocked)" : "deactivated (blocked)"}.`,
          });
          queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey({ page, limit: 10 }) });
        },
        onError: (err: any) => {
          toast({
            title: "Action failed",
            description: err?.message || "Failed to update user status.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleToggleRole = (id: string, currentRole: string, userEmail: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    updateUser.mutate(
      { id, data: { role: newRole as any } },
      {
        onSuccess: () => {
          toast({
            title: "Role Updated",
            description: `${userEmail} role changed to ${newRole.toUpperCase()}.`,
          });
          queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey({ page, limit: 10 }) });
        },
        onError: (err: any) => {
          toast({
            title: "Action failed",
            description: err?.message || "Failed to change user role.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    deleteUser.mutate(
      { id: userToDelete.id },
      {
        onSuccess: () => {
          toast({
            title: "Account Deleted",
            description: `User ${userToDelete.email} was deleted permanently.`,
          });
          setUserToDelete(null);
          queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey({ page, limit: 10 }) });
        },
        onError: (err: any) => {
          toast({
            title: "Delete failed",
            description: err?.message || "Failed to delete user account.",
            variant: "destructive",
          });
          setUserToDelete(null);
        },
      }
    );
  };

  const safeUsers = data && Array.isArray(data.data) ? data.data : [];
  const totalUsersCount = data && typeof data.total === "number" ? data.total : safeUsers.length;
  const totalPages = data && typeof data.totalPages === "number" ? data.totalPages : 1;

  return (
    <AdminLayout title="User Management">
      <div className="space-y-6">
        {/* Top Controls Bar: Search & Status Filters */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-card dark:bg-slate-900/60">
          <CardHeader className="pb-3 border-b dark:border-slate-800">
            <CardTitle className="text-base font-bold flex items-center justify-between text-foreground">
              <span>Account Governance & Directory</span>
              <Badge variant="outline" className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                {totalUsersCount} Registered Users
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              View registered users, activate/deactivate accounts, monitor user activity, and manage administrative roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by email or name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 w-full sm:w-auto bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => { setStatusFilter("all"); setPage(1); }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    statusFilter === "all" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  All Status
                </button>
                <button
                  onClick={() => { setStatusFilter("active"); setPage(1); }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    statusFilter === "active" ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => { setStatusFilter("blocked"); setPage(1); }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    statusFilter === "blocked" ? "bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-2xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  Deactivated
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Table */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-card dark:bg-slate-900/60 overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80">
                <TableRow className="border-b dark:border-slate-800">
                  <TableHead className="pl-6 text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">User Profile</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Role</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Account Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Registration Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Activity & Usage</TableHead>
                  <TableHead className="text-right pr-6 text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Actions & Management</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                      Loading user accounts...
                    </TableCell>
                  </TableRow>
                ) : safeUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                      No matching user accounts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  safeUsers.map((userItem) => {
                    const isBlocked = userItem.isBlocked;
                    const formattedDate = (() => {
                      try {
                        return format(parseISO(userItem.createdAt), "MMM d, yyyy");
                      } catch {
                        return userItem.createdAt;
                      }
                    })();

                    return (
                      <TableRow key={userItem.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 border-b dark:border-slate-800/60 transition-colors">
                        {/* User Profile */}
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                              {userItem.name?.[0]?.toUpperCase() || userItem.email?.[0]?.toUpperCase() || <UserIcon className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{userItem.name || "Analyst User"}</p>
                              <p className="text-xs text-muted-foreground">{userItem.email}</p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Role */}
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              userItem.role === "admin" 
                                ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-semibold" 
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            }
                          >
                            {userItem.role === "admin" ? "Admin" : "User"}
                          </Badge>
                        </TableCell>

                        {/* Status (Activate / Deactivate view) */}
                        <TableCell>
                          {isBlocked ? (
                            <Badge variant="outline" className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 font-semibold flex items-center gap-1 w-fit">
                              <Ban className="h-3 w-3" /> Deactivated
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-1 w-fit">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </Badge>
                          )}
                        </TableCell>

                        {/* Registration Date */}
                        <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                            <span>{formattedDate}</span>
                          </div>
                        </TableCell>

                        {/* Activity & Usage */}
                        <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                            <span className="font-medium">{userItem.totalAnalyses ?? 0}</span> analyses run
                          </div>
                        </TableCell>

                        {/* Actions / Delete / Manage */}
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            {/* Activate / Deactivate Button */}
                            <Button
                              variant={isBlocked ? "outline" : "ghost"}
                              size="sm"
                              onClick={() => handleToggleBlock(userItem.id, isBlocked, userItem.email)}
                              className={`h-8 text-xs font-medium ${
                                isBlocked 
                                  ? "border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50" 
                                  : "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                              }`}
                              title={isBlocked ? "Activate User Account" : "Deactivate User Account"}
                            >
                              {isBlocked ? (
                                <>
                                  <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Activate
                                </>
                              ) : (
                                <>
                                  <Ban className="mr-1 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Deactivate
                                </>
                              )}
                            </Button>

                            {/* Toggle Admin Role */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleRole(userItem.id, userItem.role, userItem.email)}
                              className="h-8 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title={userItem.role === "admin" ? "Demote to standard User" : "Promote to Admin"}
                            >
                              {userItem.role === "admin" ? (
                                <>
                                  <ShieldOff className="mr-1 h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Demote
                                </>
                              ) : (
                                <>
                                  <Shield className="mr-1 h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Make Admin
                                </>
                              )}
                            </Button>

                            {/* Delete Account Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setUserToDelete({ id: userItem.id, name: userItem.name || "User", email: userItem.email })}
                              className="h-8 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-300"
                              title="Delete User Account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-xs text-muted-foreground">
                  Page <span className="font-semibold text-slate-800 dark:text-slate-200">{page}</span> of <span className="font-semibold text-slate-800 dark:text-slate-200">{totalPages}</span>
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="text-xs h-8"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="text-xs h-8"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete User Confirmation Modal */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" /> Confirm Account Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm pt-2 text-muted-foreground">
              Are you sure you want to permanently delete the account for{" "}
              <strong className="text-slate-900 dark:text-slate-100">{userToDelete?.email}</strong>? This action cannot be undone and will erase all associated activity records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold"
            >
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

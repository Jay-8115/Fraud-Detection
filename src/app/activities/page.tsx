"use client";

import React, { useState, useEffect } from "react";
import { useGetRecentActivity } from "@/api-client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { 
  Activity, 
  Search, 
  Upload, 
  FileText, 
  ShieldAlert, 
  LogIn, 
  Clock, 
  Filter,
  RefreshCw
} from "lucide-react";
import { useUser } from "@clerk/react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getGetRecentActivityQueryKey } from "@/api-client";

type FilterType = "all" | "upload" | "analysis" | "report" | "login";

export default function ActivitiesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

  const { data: activity, isLoading, refetch, isRefetching } = useGetRecentActivity();

  if (!isLoaded || !user) {
    return null;
  }

  const safeActivity = Array.isArray(activity) ? activity : [];

  // Filter activities based on category and search query
  const filteredActivities = safeActivity.filter((item) => {
    const matchesFilter = activeFilter === "all" || item.type === activeFilter;
    const matchesSearch = searchTerm === "" || 
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "upload":
        return <Upload className="h-4 w-4 text-amber-500" />;
      case "analysis":
        return <Activity className="h-4 w-4 text-primary" />;
      case "report":
        return <FileText className="h-4 w-4 text-emerald-500" />;
      case "login":
        return <LogIn className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case "upload":
        return <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10">Upload</Badge>;
      case "analysis":
        return <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">Analysis</Badge>;
      case "report":
        return <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">Report</Badge>;
      case "login":
        return <Badge variant="outline" className="border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10">Login</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
    refetch();
  };

  return (
    <AppLayout title="All Activities">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Activity Log
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Complete chronological audit history of your actions and systemic operations.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="self-start sm:self-auto gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter activities by keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1 shrink-0" />
                {(["all", "upload", "analysis", "report", "login"] as FilterType[]).map((type) => (
                  <Button
                    key={type}
                    variant={activeFilter === type ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveFilter(type)}
                    className={`h-8 text-xs capitalize shrink-0 font-medium ${
                      activeFilter === type ? "bg-primary/10 text-primary font-semibold" : ""
                    }`}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center gap-4 py-2">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">No activities found</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {searchTerm || activeFilter !== "all"
                    ? "Try adjusting your search query or category filter."
                    : "Your recent activity log is currently empty."}
                </p>
                {(searchTerm || activeFilter !== "all") && (
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchTerm("");
                      setActiveFilter("all");
                    }}
                    className="mt-3 text-xs text-primary"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <div className="px-6 py-2.5 bg-muted/20 border-b flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>Showing {filteredActivities.length} {filteredActivities.length === 1 ? "activity" : "activities"}</span>
                  {activeFilter !== "all" && <span className="capitalize">Category: {activeFilter}</span>}
                </div>

                <div className="divide-y">
                  {filteredActivities.map((item) => (
                    <div 
                      key={item.id} 
                      className="px-6 py-4 hover:bg-muted/40 transition-colors flex items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="mt-0.5 p-2 rounded-lg bg-muted/60 shrink-0">
                          {getActivityIcon(item.type)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground leading-snug">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              {(() => {
                                try {
                                  return format(parseISO(item.createdAt), 'MMM d, yyyy h:mm:ss a');
                                } catch (e) {
                                  return item.createdAt;
                                }
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 self-center">
                        {getActivityBadge(item.type)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

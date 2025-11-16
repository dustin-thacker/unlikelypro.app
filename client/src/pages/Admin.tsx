import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, FileText, Calendar, MapPin, Search, Filter, TrendingUp, TrendingDown, FileCheck, Download } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function Admin() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchCertType, setBatchCertType] = useState<'as_permitted' | 'as_built'>('as_permitted');
  
  const batchGenerateMutation = trpc.certifications.generateBatch.useMutation();

  const { data: projects, isLoading } = trpc.projects.list.useQuery();
  const { data: tasks } = trpc.tasks.listAll.useQuery();
  const { data: deliverables } = trpc.deliverables.listPending.useQuery();
  const { data: invoices } = trpc.invoices.listAll.useQuery();

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    return projects.filter(project => {
      const matchesSearch = 
        project.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.permitNumber && project.permitNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_verification":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "verified":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "scheduled":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "in_progress":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const upcomingTasks = useMemo(() => {
    if (!tasks) return [];
    
    const now = new Date();
    return tasks
      .filter(task => task.scheduledDate && new Date(task.scheduledDate) >= now && task.status !== "completed" && task.status !== "cancelled")
      .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
      .slice(0, 5);
  }, [tasks]);

  // Helper to calculate week-over-week change
  const getWeekAgoDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  };

  // Project stats with trends
  const projectStats = useMemo(() => {
    if (!projects) return { 
      total: 0, pending: 0, verified: 0, scheduled: 0, inProgress: 0, completed: 0,
      trends: { total: 0, pending: 0, verified: 0, scheduled: 0, inProgress: 0, completed: 0 }
    };
    
    const weekAgo = getWeekAgoDate();
    const currentWeek = projects;
    const lastWeek = projects.filter(p => new Date(p.createdAt) < weekAgo);
    
    const current = {
      total: currentWeek.length,
      pending: currentWeek.filter(p => p.status === "pending_verification" || p.status === "draft").length,
      verified: currentWeek.filter(p => p.status === "verified").length,
      scheduled: currentWeek.filter(p => p.status === "scheduled").length,
      inProgress: currentWeek.filter(p => p.status === "in_progress").length,
      completed: currentWeek.filter(p => p.status === "completed" || p.status === "closed").length,
    };
    
    const previous = {
      total: lastWeek.length,
      pending: lastWeek.filter(p => p.status === "pending_verification" || p.status === "draft").length,
      verified: lastWeek.filter(p => p.status === "verified").length,
      scheduled: lastWeek.filter(p => p.status === "scheduled").length,
      inProgress: lastWeek.filter(p => p.status === "in_progress").length,
      completed: lastWeek.filter(p => p.status === "completed" || p.status === "closed").length,
    };
    
    return {
      ...current,
      trends: {
        total: current.total - previous.total,
        pending: current.pending - previous.pending,
        verified: current.verified - previous.verified,
        scheduled: current.scheduled - previous.scheduled,
        inProgress: current.inProgress - previous.inProgress,
        completed: current.completed - previous.completed,
      }
    };
  }, [projects]);

  // Task stats with trends
  const taskStats = useMemo(() => {
    if (!tasks) return { 
      total: 0, pending: 0, assigned: 0, inProgress: 0, completed: 0,
      trends: { total: 0, pending: 0, assigned: 0, inProgress: 0, completed: 0 }
    };
    
    const weekAgo = getWeekAgoDate();
    const currentWeek = tasks;
    const lastWeek = tasks.filter(t => new Date(t.createdAt) < weekAgo);
    
    const current = {
      total: currentWeek.length,
      pending: currentWeek.filter(t => t.status === "pending").length,
      assigned: currentWeek.filter(t => t.status === "assigned" || t.status === "scheduled").length,
      inProgress: currentWeek.filter(t => t.status === "in_progress").length,
      completed: currentWeek.filter(t => t.status === "completed" || t.status === "verified").length,
    };
    
    const previous = {
      total: lastWeek.length,
      pending: lastWeek.filter(t => t.status === "pending").length,
      assigned: lastWeek.filter(t => t.status === "assigned" || t.status === "scheduled").length,
      inProgress: lastWeek.filter(t => t.status === "in_progress").length,
      completed: lastWeek.filter(t => t.status === "completed" || t.status === "verified").length,
    };
    
    return {
      ...current,
      trends: {
        total: current.total - previous.total,
        pending: current.pending - previous.pending,
        assigned: current.assigned - previous.assigned,
        inProgress: current.inProgress - previous.inProgress,
        completed: current.completed - previous.completed,
      }
    };
  }, [tasks]);

  // Deliverable stats with trends
  const deliverableStats = useMemo(() => {
    if (!deliverables) return { 
      total: 0, pending: 0, submitted: 0, approved: 0, needsRevision: 0,
      trends: { total: 0, pending: 0, submitted: 0, approved: 0, needsRevision: 0 }
    };
    
    const weekAgo = getWeekAgoDate();
    const currentWeek = deliverables;
    const lastWeek = deliverables.filter(d => new Date(d.createdAt) < weekAgo);
    
    const current = {
      total: currentWeek.length,
      pending: currentWeek.filter(d => d.status === "pending" || d.status === "in_progress").length,
      submitted: currentWeek.filter(d => d.status === "submitted").length,
      approved: currentWeek.filter(d => d.status === "approved").length,
      needsRevision: currentWeek.filter(d => d.status === "needs_revision").length,
    };
    
    const previous = {
      total: lastWeek.length,
      pending: lastWeek.filter(d => d.status === "pending" || d.status === "in_progress").length,
      submitted: lastWeek.filter(d => d.status === "submitted").length,
      approved: lastWeek.filter(d => d.status === "approved").length,
      needsRevision: lastWeek.filter(d => d.status === "needs_revision").length,
    };
    
    return {
      ...current,
      trends: {
        total: current.total - previous.total,
        pending: current.pending - previous.pending,
        submitted: current.submitted - previous.submitted,
        approved: current.approved - previous.approved,
        needsRevision: current.needsRevision - previous.needsRevision,
      }
    };
  }, [deliverables]);

  // Invoice stats with trends
  const invoiceStats = useMemo(() => {
    if (!invoices) return { 
      total: 0, draft: 0, sent: 0, paid: 0, overdue: 0,
      trends: { total: 0, draft: 0, sent: 0, paid: 0, overdue: 0 }
    };
    
    const weekAgo = getWeekAgoDate();
    const currentWeek = invoices;
    const lastWeek = invoices.filter(i => new Date(i.createdAt) < weekAgo);
    
    const current = {
      total: currentWeek.length,
      draft: currentWeek.filter(i => i.status === "draft").length,
      sent: currentWeek.filter(i => i.status === "sent").length,
      paid: currentWeek.filter(i => i.status === "paid").length,
      overdue: currentWeek.filter(i => i.status === "overdue").length,
    };
    
    const previous = {
      total: lastWeek.length,
      draft: lastWeek.filter(i => i.status === "draft").length,
      sent: lastWeek.filter(i => i.status === "sent").length,
      paid: lastWeek.filter(i => i.status === "paid").length,
      overdue: lastWeek.filter(i => i.status === "overdue").length,
    };
    
    return {
      ...current,
      trends: {
        total: current.total - previous.total,
        draft: current.draft - previous.draft,
        sent: current.sent - previous.sent,
        paid: current.paid - previous.paid,
        overdue: current.overdue - previous.overdue,
      }
    };
  }, [invoices]);

  // Generate calendar strip showing exactly 7 weekdays (excluding Sundays)
  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Start from 2 days ago and collect up to 7 non-Sunday days
    // But limit the search range to prevent showing too many days
    let currentOffset = -2;
    const maxOffset = 10; // Maximum 10 days forward to find 7 weekdays
    
    while (days.length < 7 && currentOffset <= maxOffset) {
      const date = new Date(today);
      date.setDate(today.getDate() + currentOffset);
      
      // Skip Sundays (0 = Sunday)
      if (date.getDay() !== 0) {
        days.push(date);
      }
      
      currentOffset++;
    }
    
    // Ensure we only return exactly 7 days
    return days.slice(0, 7);
  }, []);

  // Group tasks by day for the 7-day strip
  const tasksByDay = useMemo(() => {
    if (!tasks) return new Map();
    
    const grouped = new Map<string, typeof tasks>();
    
    calendarDays.forEach(day => {
      const dayKey = day.toISOString().split('T')[0];
      grouped.set(dayKey, []);
    });
    
    tasks.forEach(task => {
      if (!task.scheduledDate) return;
      
      const taskDate = new Date(task.scheduledDate);
      taskDate.setHours(0, 0, 0, 0);
      const taskKey = taskDate.toISOString().split('T')[0];
      
      if (grouped.has(taskKey)) {
        grouped.get(taskKey)!.push(task);
      }
    });
    
    return grouped;
  }, [tasks, calendarDays]);

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500";
      case "in_progress":
        return "bg-orange-500";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-gray-400";
      default:
        return "bg-slate-500";
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Trend indicator component
  const TrendIndicator = ({ value, isPositive = true }: { value: number; isPositive?: boolean }) => {
    if (value === 0) return null;
    
    const isGood = isPositive ? value > 0 : value < 0;
    const color = isGood ? "text-green-600" : "text-red-600";
    const Icon = value > 0 ? TrendingUp : TrendingDown;
    
    return (
      <div className={`flex items-center gap-0.5 text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        <span>{Math.abs(value)}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage all inspection projects and tasks</p>
        </div>
        {/* Status Dashboard - Compact Tabbed View */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <Tabs defaultValue="projects" className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-9">
                <TabsTrigger value="projects" className="text-xs">Projects</TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs">Tasks</TabsTrigger>
                <TabsTrigger value="deliverables" className="text-xs">Deliverables</TabsTrigger>
                <TabsTrigger value="invoices" className="text-xs">Invoices</TabsTrigger>
              </TabsList>
              
              {/* Projects Tab */}
              <TabsContent value="projects" className="mt-2 space-y-0">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { label: "Total", value: projectStats.total, trend: projectStats.trends.total, onClick: () => { setStatusFilter("all"); setSearchTerm(""); } },
                    { label: "Pending", value: projectStats.pending, trend: projectStats.trends.pending, color: "text-yellow-600", onClick: () => { setStatusFilter("pending_verification"); setSearchTerm(""); }, trendPositive: false },
                    { label: "Verified", value: projectStats.verified, trend: projectStats.trends.verified, color: "text-blue-600", onClick: () => { setStatusFilter("verified"); setSearchTerm(""); } },
                    { label: "Scheduled", value: projectStats.scheduled, trend: projectStats.trends.scheduled, color: "text-purple-600", onClick: () => { setStatusFilter("scheduled"); setSearchTerm(""); } },
                    { label: "In Progress", value: projectStats.inProgress, trend: projectStats.trends.inProgress, color: "text-orange-600", onClick: () => { setStatusFilter("in_progress"); setSearchTerm(""); } },
                    { label: "Completed", value: projectStats.completed, trend: projectStats.trends.completed, color: "text-green-600", onClick: () => { setStatusFilter("completed"); setSearchTerm(""); } },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="cursor-pointer hover:bg-slate-50 p-2 rounded border transition-all"
                      onClick={stat.onClick}
                    >
                      <div className="text-[10px] text-slate-600 mb-0.5">{stat.label}</div>
                      <div className="flex items-center justify-between">
                        <div className={`text-lg font-bold ${stat.color || ''}`}>{stat.value}</div>
                        <TrendIndicator value={stat.trend} isPositive={stat.trendPositive !== false} />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Tasks Tab */}
              <TabsContent value="tasks" className="mt-2 space-y-0">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {[
                    { label: "Total", value: taskStats.total, trend: taskStats.trends.total },
                    { label: "Pending", value: taskStats.pending, trend: taskStats.trends.pending, color: "text-yellow-600", trendPositive: false },
                    { label: "Assigned", value: taskStats.assigned, trend: taskStats.trends.assigned, color: "text-blue-600" },
                    { label: "In Progress", value: taskStats.inProgress, trend: taskStats.trends.inProgress, color: "text-orange-600" },
                    { label: "Completed", value: taskStats.completed, trend: taskStats.trends.completed, color: "text-green-600" },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="cursor-pointer hover:bg-slate-50 p-2 rounded border transition-all"
                      onClick={() => setLocation("/admin/calendar")}
                    >
                      <div className="text-[10px] text-slate-600 mb-0.5">{stat.label}</div>
                      <div className="flex items-center justify-between">
                        <div className={`text-lg font-bold ${stat.color || ''}`}>{stat.value}</div>
                        <TrendIndicator value={stat.trend} isPositive={stat.trendPositive !== false} />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Deliverables Tab */}
              <TabsContent value="deliverables" className="mt-2 space-y-0">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {[
                    { label: "Total", value: deliverableStats.total, trend: deliverableStats.trends.total },
                    { label: "Pending", value: deliverableStats.pending, trend: deliverableStats.trends.pending, color: "text-yellow-600", trendPositive: false },
                    { label: "Submitted", value: deliverableStats.submitted, trend: deliverableStats.trends.submitted, color: "text-blue-600" },
                    { label: "Approved", value: deliverableStats.approved, trend: deliverableStats.trends.approved, color: "text-green-600" },
                    { label: "Needs Revision", value: deliverableStats.needsRevision, trend: deliverableStats.trends.needsRevision, color: "text-red-600", trendPositive: false },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="cursor-pointer hover:bg-slate-50 p-2 rounded border transition-all"
                      onClick={() => setLocation("/admin/deliverables")}
                    >
                      <div className="text-[10px] text-slate-600 mb-0.5">{stat.label}</div>
                      <div className="flex items-center justify-between">
                        <div className={`text-lg font-bold ${stat.color || ''}`}>{stat.value}</div>
                        <TrendIndicator value={stat.trend} isPositive={stat.trendPositive !== false} />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Invoices Tab */}
              <TabsContent value="invoices" className="mt-2 space-y-0">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {[
                    { label: "Total", value: invoiceStats.total, trend: invoiceStats.trends.total },
                    { label: "Draft", value: invoiceStats.draft, trend: invoiceStats.trends.draft, color: "text-gray-600", trendPositive: false },
                    { label: "Sent", value: invoiceStats.sent, trend: invoiceStats.trends.sent, color: "text-blue-600" },
                    { label: "Paid", value: invoiceStats.paid, trend: invoiceStats.trends.paid, color: "text-green-600" },
                    { label: "Overdue", value: invoiceStats.overdue, trend: invoiceStats.trends.overdue, color: "text-red-600", trendPositive: false },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="cursor-pointer hover:bg-slate-50 p-2 rounded border transition-all"
                      onClick={() => setLocation("/admin/invoices")}
                    >
                      <div className="text-[10px] text-slate-600 mb-0.5">{stat.label}</div>
                      <div className="flex items-center justify-between">
                        <div className={`text-lg font-bold ${stat.color || ''}`}>{stat.value}</div>
                        <TrendIndicator value={stat.trend} isPositive={stat.trendPositive !== false} />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
           </CardContent>
        </Card>

        {/* 7-Day Calendar Strip */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Task Overview</CardTitle>
            <CardDescription>Tasks for the week (Monday - Saturday, excluding Sundays)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-3">
              {calendarDays.map((day, index) => {
                const dayKey = day.toISOString().split('T')[0];
                const dayTasks = tasksByDay.get(dayKey) || [];
                const isCurrentDay = isToday(day);
                const isPastDay = isPast(day);
                
                return (
                  <div
                    key={dayKey}
                    className={`flex flex-col border rounded-lg p-3 min-h-[140px] transition-all ${
                      isCurrentDay
                        ? "bg-blue-50 border-blue-300 shadow-md"
                        : isPastDay
                        ? "bg-slate-50 border-slate-200"
                        : "bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm"
                    }`}
                  >
                    <div className="text-center mb-2 pb-2 border-b">
                      <div className={`text-xs font-medium ${
                        isCurrentDay ? "text-blue-600" : "text-slate-500"
                      }`}>
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-bold ${
                        isCurrentDay ? "text-blue-700" : isPastDay ? "text-slate-400" : "text-slate-900"
                      }`}>
                        {day.getDate()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {day.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[200px]">
                      {dayTasks.length === 0 ? (
                        <div className="text-xs text-slate-400 text-center py-2">
                          No tasks
                        </div>
                      ) : (
                        dayTasks.map((task: any) => (
                          <div
                            key={task.id}
                            className="text-xs p-2 rounded bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors"
                            onClick={() => setLocation(`/admin/project/${task.projectId}`)}
                            title={`${task.title}${task.description ? ' - ' + task.description : ''}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className={`w-2 h-2 rounded-full ${getTaskStatusColor(task.status)}`} />
                              <span className="font-medium text-slate-700 truncate">
                                {task.title}
                              </span>
                            </div>
                            {task.scheduledDate && (
                              <div className="text-[10px] text-slate-500 ml-3.5">
                                {new Date(task.scheduledDate).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    
                    {dayTasks.length > 0 && (
                      <div className="mt-2 pt-2 border-t text-center">
                        <span className={`text-xs font-semibold ${
                          isCurrentDay ? "text-blue-600" : "text-slate-600"
                        }`}>
                          {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Inspections</CardTitle>
              <CardDescription>Next 5 scheduled inspection tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/admin/project/${task.projectId}`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-slate-600">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(task.scheduledDate!).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Projects</CardTitle>
                <CardDescription>View and manage inspection projects</CardDescription>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client, address, or permit number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="verified">Verified</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No projects found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors"
                  >
                    {project.status === 'completed' && (
                      <input
                        type="checkbox"
                        checked={selectedProjects.includes(project.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setSelectedProjects([...selectedProjects, project.id]);
                          } else {
                            setSelectedProjects(selectedProjects.filter(id => id !== project.id));
                          }
                        }}
                        className="mt-1 w-4 h-4 cursor-pointer"
                      />
                    )}
                    <div className="flex-1 cursor-pointer" onClick={() => setLocation(`/admin/project/${project.id}`)}>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{project.address}</h3>
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-slate-600">
                        <div className="flex items-center gap-4">
                          <span><span className="font-medium">Property Owner:</span> {project.propertyOwnerName || 'N/A'}</span>
                          <span><span className="font-medium">Customer #:</span> {project.customerNumber || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span><span className="font-medium">Jurisdiction:</span> {project.jurisdiction || 'N/A'}</span>
                          {project.permitNumber && (
                            <span><span className="font-medium">Permit #:</span> {project.permitNumber}</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Client:</span> {project.clientName}
                        </div>
                        <div className="text-xs text-slate-500">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Created {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/admin/project/${project.id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Batch Certification Button */}
        {selectedProjects.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              size="lg"
              onClick={() => setShowBatchDialog(true)}
              disabled={batchGenerating}
              className="shadow-lg"
            >
              {batchGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 mr-2" />
                  Generate {selectedProjects.length} Certification{selectedProjects.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Batch Certification Type Dialog */}
        <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate {selectedProjects.length} Certifications</DialogTitle>
              <DialogDescription>
                Select the certification type for all selected projects.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <RadioGroup value={batchCertType} onValueChange={(v) => setBatchCertType(v as 'as_permitted' | 'as_built')}>
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="as_permitted" id="batch_as_permitted" />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="batch_as_permitted" className="font-medium cursor-pointer">
                      As Permitted
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Projects completed exactly as shown in permits and plans.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="as_built" id="batch_as_built" />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="batch_as_built" className="font-medium cursor-pointer">
                      As Built
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Projects with field changes from original permitted scope.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBatchDialog(false)}>Cancel</Button>
              <Button onClick={async () => {
                setShowBatchDialog(false);
                setBatchGenerating(true);
                try {
                  const result = await batchGenerateMutation.mutateAsync({
                    projectIds: selectedProjects,
                    certificationType: batchCertType,
                  });
                  const successCount = result.results.filter((r: any) => r.success).length;
                  toast.success(`Generated ${successCount} of ${selectedProjects.length} certifications successfully!`);
                  setSelectedProjects([]);
                } catch (error: any) {
                  toast.error(`Failed to generate certifications: ${error.message}`);
                } finally {
                  setBatchGenerating(false);
                }
              }}>
                Generate Certifications
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

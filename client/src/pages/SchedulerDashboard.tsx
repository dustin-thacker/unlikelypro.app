import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Calendar, FileText, Loader2, MapPin, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function SchedulerDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: projects, isLoading } = trpc.projects.list.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "client_scheduler" }
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "client_scheduler") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be logged in as a client scheduler to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Filter projects
  const filteredProjects = projects?.filter((project) => {
    const matchesSearch =
      searchQuery === "" ||
      project.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.propertyOwnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.permitNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.customerNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_verification: { label: "Pending Verification", variant: "secondary" as const },
      verified: { label: "Verified", variant: "default" as const },
      scheduled: { label: "Scheduled", variant: "default" as const },
      in_progress: { label: "In Progress", variant: "default" as const },
      completed: { label: "Completed", variant: "default" as const },
      cancelled: { label: "Cancelled", variant: "outline" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_verification;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const stats = {
    total: projects?.length || 0,
    pending: projects?.filter(p => p.status === "pending_verification").length || 0,
    verified: projects?.filter(p => p.status === "verified").length || 0,
    scheduled: projects?.filter(p => p.status === "scheduled").length || 0,
    completed: projects?.filter(p => p.status === "completed").length || 0,
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Scheduler Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage inspection requests for {user.client || "your client"}
          </p>
        </div>
        <Button onClick={() => setLocation("/scheduler/new-project")}>
          <Plus className="w-4 h-4 mr-2" />
          New Project Request
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Projects</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Verification</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Verified</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.verified}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Scheduled</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{stats.scheduled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/scheduler/calendar")}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>View Calendar</CardTitle>
                <CardDescription>See all scheduled inspections</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/scheduler/new-project")}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>Submit New Request</CardTitle>
                <CardDescription>Request a new inspection</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>View and manage your inspection requests</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by address, owner, permit, or customer number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-md"
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

          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No projects found</p>
              <Button className="mt-4" onClick={() => setLocation("/scheduler/new-project")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{project.address}</h3>
                          {getStatusBadge(project.status)}
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
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
                        </div>
                        
                        <div className="mt-3 text-xs text-muted-foreground">
                          Created {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <Link href={`/scheduler/project/${project.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      <Link href="/scheduler/new-project">
        <Button
          className="fixed bottom-6 right-6 shadow-lg hover:shadow-xl transition-shadow rounded-full px-6 py-6 text-base font-medium"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Submit a New Request
        </Button>
      </Link>
    </div>
  );
}

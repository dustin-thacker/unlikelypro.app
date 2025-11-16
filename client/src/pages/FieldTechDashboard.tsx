import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Calendar, Loader2, MapPin, Clock, FileText } from "lucide-react";
import { Link } from "wouter";

export default function FieldTechDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Fetch tasks assigned to this field tech
  const { data: tasks, isLoading } = trpc.tasks.listForUser.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "field_tech" }
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "field_tech") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be logged in as a field technician to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Group tasks by status
  const todayTasks = tasks?.filter(t => {
    if (!t.scheduledDate) return false;
    const taskDate = new Date(t.scheduledDate);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString() && t.status === "scheduled";
  }) || [];

  const upcomingTasks = tasks?.filter(t => {
    if (!t.scheduledDate) return false;
    const taskDate = new Date(t.scheduledDate);
    const today = new Date();
    return taskDate > today && t.status === "scheduled";
  }) || [];

  const inProgressTasks = tasks?.filter(t => t.status === "in_progress") || [];
  const completedToday = tasks?.filter(t => {
    const taskDate = new Date(t.updatedAt);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString() && t.status === "completed";
  }) || [];

  const getStatusBadge = (status: string) => {
    const config = {
      scheduled: { label: "Scheduled", class: "bg-blue-100 text-blue-800" },
      in_progress: { label: "In Progress", class: "bg-orange-100 text-orange-800" },
      completed: { label: "Completed", class: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelled", class: "bg-gray-100 text-gray-800" },
    };
    const { label, class: className } = config[status as keyof typeof config] || config.scheduled;
    return <Badge className={className}>{label}</Badge>;
  };

  const formatTime = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Field Inspections</h1>
            <p className="text-sm opacity-90">{user.name}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{todayTasks.length}</div>
            <div className="text-xs opacity-90">Today's Tasks</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-orange-600">{inProgressTasks.length}</div>
              <div className="text-xs text-muted-foreground mt-1">In Progress</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-blue-600">{upcomingTasks.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Upcoming</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-green-600">{completedToday.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Tasks */}
        {todayTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Inspections
            </h2>
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <Link key={task.id} href={`/field-tech/task/${task.id}`}>
                  <Card className="active:scale-98 transition-transform cursor-pointer hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-base mb-1">
                            {task.project?.address || "Unknown Address"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {task.project?.propertyOwnerName}
                          </div>
                        </div>
                        {getStatusBadge(task.status)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(task.scheduledDate)}</span>
                        </div>
                        {task.project?.permitNumber && (
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>{task.project.permitNumber}</span>
                          </div>
                        )}
                      </div>
                      
                      <Button className="w-full mt-3" size="sm">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* In Progress Tasks */}
        {inProgressTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 text-orange-600">In Progress</h2>
            <div className="space-y-3">
              {inProgressTasks.map((task) => (
                <Link key={task.id} href={`/field-tech/task/${task.id}`}>
                  <Card className="border-orange-200 active:scale-98 transition-transform cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-base mb-1">
                            {task.project?.address || "Unknown Address"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {task.project?.propertyOwnerName}
                          </div>
                        </div>
                        {getStatusBadge(task.status)}
                      </div>
                      
                      <Button className="w-full mt-3" size="sm" variant="outline">
                        Continue Inspection
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Upcoming Inspections</h2>
            <div className="space-y-3">
              {upcomingTasks.slice(0, 5).map((task) => (
                <Link key={task.id} href={`/field-tech/task/${task.id}`}>
                  <Card className="active:scale-98 transition-transform cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-base mb-1">
                            {task.project?.address || "Unknown Address"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {task.project?.propertyOwnerName}
                          </div>
                        </div>
                        {getStatusBadge(task.status)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(task.scheduledDate)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {todayTasks.length === 0 && inProgressTasks.length === 0 && upcomingTasks.length === 0 && (
          <Card className="mt-8">
            <CardContent className="p-8 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Inspections Scheduled</h3>
              <p className="text-muted-foreground text-sm">
                You don't have any inspections assigned at the moment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

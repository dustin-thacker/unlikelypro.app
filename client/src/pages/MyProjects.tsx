import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, FileText, Calendar, MapPin } from "lucide-react";
import { useLocation } from "wouter";

export default function MyProjects() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: projects, isLoading } = trpc.projects.list.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="container max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">My Projects</h1>
            <p className="text-slate-600 mt-2">View and manage your inspection projects</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setLocation("/calendar")} variant="outline" size="lg">
              <Calendar className="w-5 h-5 mr-2" />
              Calendar
            </Button>
            <Button onClick={() => setLocation("/new-project")} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {!projects || projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No projects yet</h3>
              <p className="text-slate-500 mb-6">Get started by creating your first inspection project</p>
              <Button onClick={() => setLocation("/new-project")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/project/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">{project.address}</CardTitle>
                    <Badge className={getStatusColor(project.status)}>
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-600">Property Owner: <span className="text-slate-900 font-medium">{project.propertyOwnerName}</span></span>
                      {project.customerNumber && (
                        <span className="text-slate-600">Customer #: <span className="text-slate-900 font-medium">{project.customerNumber}</span></span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      {project.jurisdiction && (
                        <span className="text-slate-600">Jurisdiction: <span className="text-slate-900 font-medium">{project.jurisdiction}</span></span>
                      )}
                      {project.permitNumber && (
                        <span className="text-slate-600">Permit #: <span className="text-slate-900 font-medium">{project.permitNumber}</span></span>
                      )}
                    </div>
                    <div className="text-slate-600">Client: <span className="text-slate-900 font-medium">{project.clientName}</span></div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t">
                      <Calendar className="w-3 h-3" />
                      <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

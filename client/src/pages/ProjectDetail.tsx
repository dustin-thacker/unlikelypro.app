import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Loader2, FileText, Calendar, MapPin, ArrowLeft, Download } from "lucide-react";

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.id || "0");

  // Helper function to download files properly
  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: try opening in new tab
      window.open(url, '_blank');
    }
  };

  const { data: projectDetails, isLoading } = trpc.projects.getWithDetails.useQuery({ projectId });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!projectDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Project Not Found</h2>
          <Button onClick={() => setLocation("/my-projects")}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  const { project, attachments, tasks } = projectDetails;

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

  const getTaskStatusColor = (status: string) => {
    switch (status) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="container max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => setLocation("/my-projects")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>

        <div className="space-y-6">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl">{project.clientName}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <MapPin className="w-4 h-4" />
                    {project.address}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {project.propertyOwnerName && (
                  <div>
                    <p className="text-sm font-medium text-slate-500">Property Owner</p>
                    <p className="text-base text-slate-900">{project.propertyOwnerName}</p>
                  </div>
                )}
                {project.jurisdiction && (
                  <div>
                    <p className="text-sm font-medium text-slate-500">Jurisdiction</p>
                    <p className="text-base text-slate-900">{project.jurisdiction}</p>
                  </div>
                )}
                {project.permitNumber && (
                  <div>
                    <p className="text-sm font-medium text-slate-500">Permit Number</p>
                    <p className="text-base text-slate-900">{project.permitNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-500">Created</p>
                  <p className="text-base text-slate-900">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {project.scopeOfWork && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-2">Scope of Work</p>
                    <p className="text-base text-slate-900 whitespace-pre-wrap">{project.scopeOfWork}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Plans and permits uploaded for this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-slate-900">{attachment.fileName}</p>
                          <p className="text-sm text-slate-500">
                            {attachment.fileType} • {new Date(attachment.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadFile(attachment.fileUrl, attachment.fileName)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tasks/Inspections */}
          {tasks && tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Inspections</CardTitle>
                <CardDescription>Upcoming and past inspection tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-slate-900">{task.title}</p>
                          <Badge className={getTaskStatusColor(task.status)}>
                            {getStatusLabel(task.status)}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                        )}
                        {task.scheduledDate && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(task.scheduledDate).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  MessageSquare,
  Plus,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminRFI() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [requestType, setRequestType] = useState<"production_photos" | "updated_plans_permit" | "drive_logs" | "rdp_statement" | "other">("other");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [dueDate, setDueDate] = useState("");

  // Fetch all open RFIs
  const { data: rfis, isLoading, refetch } = trpc.rfi.listAllOpen.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  // Fetch projects for dropdown
  const { data: projects } = trpc.projects.list.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  // Mutations
  const createMutation = trpc.rfi.create.useMutation({
    onSuccess: () => {
      toast.success("RFI created successfully");
      refetch();
      closeCreateDialog();
    },
    onError: (error) => {
      toast.error(`Failed to create RFI: ${error.message}`);
    },
  });

  const updateStatusMutation = trpc.rfi.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("RFI status updated");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const openCreateDialog = (projectId?: number) => {
    setSelectedProjectId(projectId || null);
    setRequestType("other");
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
    setSelectedProjectId(null);
  };

  const handleCreate = () => {
    if (!selectedProjectId) {
      toast.error("Please select a project");
      return;
    }
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    createMutation.mutate({
      projectId: selectedProjectId,
      requestType,
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: dueDate || undefined,
    });
  };

  const handleStatusChange = (rfiId: number, status: "open" | "in_progress" | "resolved" | "closed") => {
    updateStatusMutation.mutate({ roiId: rfiId, status });
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline" }> = {
      low: { variant: "secondary" },
      medium: { variant: "default" },
      high: { variant: "destructive" },
      urgent: { variant: "destructive" },
    };
    return (
      <Badge variant={config[priority]?.variant || "default"}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: any; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      open: { icon: AlertCircle, variant: "destructive" },
      in_progress: { icon: MessageSquare, variant: "default" },
      resolved: { icon: CheckCircle, variant: "outline" },
      closed: { icon: XCircle, variant: "secondary" },
    };
    const { icon: Icon, variant } = config[status] || config.open;
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Access denied. Admin role required.</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Requests for Information</h1>
            <p className="text-muted-foreground mt-2">
              Manage information requests to client schedulers
            </p>
          </div>
          <Button onClick={() => openCreateDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            New RFI
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !rfis || rfis.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Open RFIs</h3>
              <p className="text-muted-foreground mb-4">
                All information requests have been resolved
              </p>
                <Button onClick={() => openCreateDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First RFI
                </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rfis.map((rfi) => (
              <Card key={rfi.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{rfi.title}</CardTitle>
                        {getPriorityBadge(rfi.priority)}
                        {getStatusBadge(rfi.status)}
                      </div>
                      <CardDescription>{rfi.description}</CardDescription>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Project ID: {rfi.projectId}</span>
                        {rfi.dueDate && (
                          <span className={isOverdue(rfi.dueDate.toString()) ? "text-destructive font-semibold" : ""}>
                            <Clock className="w-4 h-4 inline mr-1" />
                            Due: {new Date(rfi.dueDate).toLocaleDateString()}
                            {isOverdue(rfi.dueDate.toString()) && " (OVERDUE)"}
                          </span>
                        )}
                        <span>
                          Created: {new Date(rfi.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(rfi.status === "in_progress" || rfi.status === "resolved") && rfi.responseText && (
                    <div className="mb-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Response:</h4>
                      <p className="text-sm whitespace-pre-wrap">{rfi.responseText}</p>
                      {rfi.respondedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Responded: {new Date(rfi.respondedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {rfi.status === "open" && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleStatusChange(rfi.id, "in_progress")}
                        >
                          Mark In Progress
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStatusChange(rfi.id, "closed")}
                        >
                          Close
                        </Button>
                      </>
                    )}
                    {rfi.status === "in_progress" && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleStatusChange(rfi.id, "resolved")}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Resolved
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(rfi.id, "open")}
                        >
                          Reopen
                        </Button>
                      </>
                    )}
                    {rfi.status === "resolved" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(rfi.id, "open")}
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create ROI Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create RFI (Request for Information)</DialogTitle>
            <DialogDescription>
              Request additional information from the client scheduler
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="project">Project *</Label>
              <Select
                value={selectedProjectId?.toString() || ""}
                onValueChange={(value) => setSelectedProjectId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.clientName} - {project.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="requestType">Request Type *</Label>
              <Select
                value={requestType}
                onValueChange={(value: any) => setRequestType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select request type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production_photos">Production Photos Requested</SelectItem>
                  <SelectItem value="updated_plans_permit">Updated Plans & Permit Requested</SelectItem>
                  <SelectItem value="drive_logs">Drive Logs Requested</SelectItem>
                  <SelectItem value="rdp_statement">RDP Statement Requested</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief title for the request"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of what information is needed..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeCreateDialog} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create RFI"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

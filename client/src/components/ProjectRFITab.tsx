import { useState } from "react";
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
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface ProjectRFITabProps {
  projectId: number;
  isAdmin?: boolean;
}

export function ProjectRFITab({ projectId, isAdmin = false }: ProjectRFITabProps) {
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [selectedRFI, setSelectedRFI] = useState<any>(null);
  
  // Create RFI form state
  const [requestType, setRequestType] = useState<"production_photos" | "updated_plans_permit" | "drive_logs" | "rdp_statement" | "other">("other");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [dueDate, setDueDate] = useState("");
  
  // Response form state
  const [responseText, setResponseText] = useState("");

  // Fetch RFIs for this project
  const { data: rfis, isLoading, refetch } = trpc.rfi.listByProject.useQuery({ projectId });

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

  const respondMutation = trpc.rfi.respond.useMutation({
    onSuccess: () => {
      toast.success("Response submitted successfully");
      refetch();
      closeRespondDialog();
    },
    onError: (error) => {
      toast.error(`Failed to submit response: ${error.message}`);
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

  const openCreateDialog = () => {
    setRequestType("other");
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  const openRespondDialog = (rfi: any) => {
    setSelectedRFI(rfi);
    setResponseText("");
    setRespondDialogOpen(true);
  };

  const closeRespondDialog = () => {
    setRespondDialogOpen(false);
    setSelectedRFI(null);
  };

  const handleCreate = () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    createMutation.mutate({
      projectId,
      requestType,
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: dueDate || undefined,
    });
  };

  const handleRespond = () => {
    if (!selectedRFI || !responseText.trim()) {
      toast.error("Response text is required");
      return;
    }

    respondMutation.mutate({
      roiId: selectedRFI.id,
      responseText: responseText.trim(),
    });
  };

  const handleStatusChange = (rfiId: number, status: "open" | "in_progress" | "resolved" | "closed") => {
    updateStatusMutation.mutate({ roiId: rfiId, status });
  };

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      production_photos: "Production Photos",
      updated_plans_permit: "Updated Plans & Permit",
      drive_logs: "Drive Logs",
      rdp_statement: "RDP Statement",
      other: "Other",
    };
    return labels[type] || type;
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
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const isOverdue = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Requests for Information</h3>
          <p className="text-sm text-muted-foreground">
            {rfis?.length || 0} RFI{rfis?.length !== 1 ? "s" : ""} for this project
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Create RFI
          </Button>
        )}
      </div>

      {!rfis || rfis.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No RFIs</h3>
            <p className="text-muted-foreground mb-4">
              No information requests for this project yet
            </p>
            {isAdmin && (
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Create First RFI
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rfis.map((rfi) => (
            <Card key={rfi.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{rfi.title}</CardTitle>
                      <Badge variant="outline">{getRequestTypeLabel(rfi.requestType)}</Badge>
                      {getPriorityBadge(rfi.priority)}
                      {getStatusBadge(rfi.status)}
                    </div>
                    <CardDescription>{rfi.description}</CardDescription>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
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
                <div className="flex items-center gap-2 flex-wrap">
                  {isAdmin ? (
                    <>
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
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStatusChange(rfi.id, "closed")}
                          >
                            Close
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {rfi.status === "open" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openRespondDialog(rfi)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Respond
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create RFI Dialog (Admin only) */}
      {isAdmin && (
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
                  <Label htmlFor="dueDate">Due Date</Label>
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
              <Button variant="outline" onClick={closeCreateDialog}>
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
      )}

      {/* Respond Dialog (Scheduler only) */}
      {!isAdmin && (
        <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Respond to RFI</DialogTitle>
              <DialogDescription>
                {selectedRFI?.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Request:</h4>
                <p className="text-sm">{selectedRFI?.description}</p>
              </div>

              <div>
                <Label htmlFor="response">Your Response *</Label>
                <Textarea
                  id="response"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Provide the requested information..."
                  rows={6}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeRespondDialog}>
                Cancel
              </Button>
              <Button onClick={handleRespond} disabled={respondMutation.isPending}>
                {respondMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Response"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

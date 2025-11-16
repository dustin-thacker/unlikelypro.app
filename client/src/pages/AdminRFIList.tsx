import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  MessageSquare,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AdminRFIList() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<"open" | "in_progress" | "resolved" | "closed" | "">("");

  // Fetch all RFIs with optional filtering
  const { data: rfis, isLoading, refetch } = trpc.rfi.listAll.useQuery(
    {
      client: selectedClient || undefined,
      status: selectedStatus || undefined,
    },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  // Update status mutation
  const updateStatusMutation = trpc.rfi.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("RFI status updated");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

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

  // Get unique clients from RFIs
  const clients = Array.from(new Set(rfis?.map(rfi => rfi.projectClient).filter(Boolean))) as string[];

  // Calculate status counts
  const statusCounts = {
    open: rfis?.filter(rfi => rfi.status === "open").length || 0,
    in_progress: rfis?.filter(rfi => rfi.status === "in_progress").length || 0,
    resolved: rfis?.filter(rfi => rfi.status === "resolved").length || 0,
    closed: rfis?.filter(rfi => rfi.status === "closed").length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">RFI Requests</h1>
          <p className="text-muted-foreground">
            Manage all information requests across projects
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Open</CardDescription>
              <CardTitle className="text-3xl text-destructive">{statusCounts.open}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-3xl text-blue-600">{statusCounts.in_progress}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Resolved</CardDescription>
              <CardTitle className="text-3xl text-green-600">{statusCounts.resolved}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Closed</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">{statusCounts.closed}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client} value={client}>
                    {client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* RFI List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !rfis || rfis.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No RFIs Found</h3>
              <p className="text-muted-foreground">
                {selectedClient || selectedStatus
                  ? "Try adjusting your filters"
                  : "No information requests have been created yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rfis.map((rfi) => (
              <Card key={rfi.id} className="hover:shadow-md transition-shadow">
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
                        <span className="font-medium">{rfi.projectClient}</span>
                        <span>{rfi.projectAddress}</span>
                        <span>{rfi.propertyOwnerName}</span>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/admin/projects/${rfi.projectId}`)}
                    >
                      View Project
                    </Button>
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

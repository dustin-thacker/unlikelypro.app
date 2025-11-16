import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  FileText,
  Image,
  Award,
  File,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminDeliverables() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [selectedDeliverable, setSelectedDeliverable] = useState<any>(null);

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
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "revision" | "reject">("approve");
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch pending deliverables
  const { data: deliverables, isLoading, refetch } = trpc.deliverables.listPending.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  // Mutations
  const approveMutation = trpc.deliverables.approve.useMutation({
    onSuccess: () => {
      toast.success("Deliverable approved");
      refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Approval failed: ${error.message}`);
    },
  });

  const revisionMutation = trpc.deliverables.requestRevision.useMutation({
    onSuccess: () => {
      toast.success("Revision requested");
      refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Request failed: ${error.message}`);
    },
  });

  const rejectMutation = trpc.deliverables.reject.useMutation({
    onSuccess: () => {
      toast.success("Deliverable rejected");
      refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Rejection failed: ${error.message}`);
    },
  });

  const openReviewDialog = (deliverable: any, action: "approve" | "revision" | "reject") => {
    setSelectedDeliverable(deliverable);
    setReviewAction(action);
    setReviewNotes("");
    setRejectionReason("");
    setReviewDialogOpen(true);
  };

  const closeDialog = () => {
    setReviewDialogOpen(false);
    setSelectedDeliverable(null);
    setReviewNotes("");
    setRejectionReason("");
  };

  const handleReview = () => {
    if (!selectedDeliverable) return;

    switch (reviewAction) {
      case "approve":
        approveMutation.mutate({
          deliverableId: selectedDeliverable.id,
          reviewNotes: reviewNotes.trim() || undefined,
        });
        break;
      case "revision":
        if (!reviewNotes.trim()) {
          toast.error("Please provide revision notes");
          return;
        }
        revisionMutation.mutate({
          deliverableId: selectedDeliverable.id,
          reviewNotes: reviewNotes.trim(),
        });
        break;
      case "reject":
        if (!rejectionReason.trim()) {
          toast.error("Please provide a rejection reason");
          return;
        }
        rejectMutation.mutate({
          deliverableId: selectedDeliverable.id,
          rejectionReason: rejectionReason.trim(),
        });
        break;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "report":
        return <FileText className="w-5 h-5" />;
      case "photos":
        return <Image className="w-5 h-5" />;
      case "certificate":
        return <Award className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pending", variant: "secondary" },
      submitted: { label: "Awaiting Review", variant: "default" },
      approved: { label: "Approved", variant: "outline" },
      needs_revision: { label: "Needs Revision", variant: "destructive" },
      rejected: { label: "Rejected", variant: "destructive" },
    };

    const { label, variant } = config[status] || config.pending;
    return <Badge variant={variant}>{label}</Badge>;
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

  const isPending = approveMutation.isPending || revisionMutation.isPending || rejectMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Deliverables Review</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve field technician deliverables
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !deliverables || deliverables.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Deliverables</h3>
              <p className="text-muted-foreground">
                All deliverables have been reviewed
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {deliverables.map((deliverable) => (
              <Card key={deliverable.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getTypeIcon(deliverable.deliverableType)}</div>
                      <div>
                        <CardTitle className="text-lg">{deliverable.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {deliverable.description || "No description provided"}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span>Project ID: {deliverable.projectId}</span>
                          {deliverable.taskId && <span>• Task ID: {deliverable.taskId}</span>}
                          {deliverable.submittedAt && (
                            <span>
                              • Submitted: {new Date(deliverable.submittedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(deliverable.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {deliverable.fileUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deliverable.fileUrl && downloadFile(deliverable.fileUrl, `${deliverable.title || deliverable.deliverableType}.pdf`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Download File
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openReviewDialog(deliverable, "approve")}
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openReviewDialog(deliverable, "revision")}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Request Revision
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openReviewDialog(deliverable, "reject")}
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" && "Approve Deliverable"}
              {reviewAction === "revision" && "Request Revision"}
              {reviewAction === "reject" && "Reject Deliverable"}
            </DialogTitle>
            <DialogDescription>
              {selectedDeliverable?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reviewAction === "approve" && (
              <div>
                <Label htmlFor="review-notes">Review Notes (Optional)</Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any comments or feedback..."
                  rows={4}
                />
              </div>
            )}

            {reviewAction === "revision" && (
              <div>
                <Label htmlFor="revision-notes">Revision Notes *</Label>
                <Textarea
                  id="revision-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Explain what needs to be revised..."
                  rows={4}
                  required
                />
              </div>
            )}

            {reviewAction === "reject" && (
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this deliverable is being rejected..."
                  rows={4}
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={isPending}
              variant={reviewAction === "reject" ? "destructive" : "default"}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {reviewAction === "approve" && "Approve"}
                  {reviewAction === "revision" && "Request Revision"}
                  {reviewAction === "reject" && "Reject"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

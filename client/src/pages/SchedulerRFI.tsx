import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
// Storage uploads now handled via tRPC

export default function SchedulerRFI() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [selectedRFI, setSelectedRFI] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Fetch open RFIs for scheduler
  const { data: rfis, isLoading, refetch } = trpc.rfi.listOpen.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "client_scheduler" }
  );

  // Respond mutation
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

  const openRespondDialog = (rfi: any) => {
    setSelectedRFI(rfi);
    setResponseText("");
    setUploadedFiles([]);
    setRespondDialogOpen(true);
  };

  const closeRespondDialog = () => {
    setRespondDialogOpen(false);
    setSelectedRFI(null);
    setResponseText("");
    setUploadedFiles([]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Upload to S3
        const response = await fetch("/api/trpc/storage.upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileData: Array.from(uint8Array),
            contentType: file.type,
          }),
        });

        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        return data.result.data.url;
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedFiles([...uploadedFiles, ...urls]);
      toast.success(`${files.length} file(s) uploaded`);
    } catch (error) {
      toast.error("File upload failed");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitResponse = () => {
    if (!selectedRFI) return;
    if (!responseText.trim()) {
      toast.error("Please provide a response");
      return;
    }

    respondMutation.mutate({
      roiId: selectedRFI.id,
      responseText: responseText.trim(),
      responseAttachments: uploadedFiles.length > 0 ? uploadedFiles : undefined,
    });
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

  if (user?.role !== "client_scheduler") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Access denied. Scheduler role required.</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Information Requests</h1>
          <p className="text-muted-foreground mt-2">
            Respond to information requests from Blackhouse
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !rfis || rfis.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
              <p className="text-muted-foreground">
                All information requests have been responded to
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rfis?.map((rfi) => (
              <Card key={rfi.id} className={isOverdue(rfi.dueDate?.toString() || null) ? "border-destructive" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{rfi.title}</CardTitle>
                        {getPriorityBadge(rfi.priority)}

                        {isOverdue(rfi.dueDate?.toString() || null) && (
                          <Badge variant="destructive">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            OVERDUE
                          </Badge>
                        )}
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
                  <Button onClick={() => openRespondDialog(rfi)}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Respond
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Respond Dialog */}
      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Information Request</DialogTitle>
            <DialogDescription>
              {selectedRFI?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Request Details:</h4>
              <p className="text-sm whitespace-pre-wrap">{selectedRFI?.description}</p>
            </div>

            <div>
              <Label htmlFor="response">Your Response *</Label>
              <Textarea
                id="response"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Provide the requested information..."
                rows={6}
                required
              />
            </div>

            <div>
              <Label htmlFor="attachments">Attachments (Optional)</Label>
              <Input
                id="attachments"
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {uploadedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {uploadedFiles.map((url, index) => (
                    <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      File {index + 1} uploaded
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeRespondDialog} disabled={respondMutation.isPending || uploading}>
              Cancel
            </Button>
            <Button onClick={handleSubmitResponse} disabled={respondMutation.isPending || uploading}>
              {respondMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Response
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

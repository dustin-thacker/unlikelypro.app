import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Upload, Loader2, FileText, Image, Award, File, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface DeliverableUploadProps {
  projectId: number;
  taskId?: number;
}

export default function DeliverableUpload({ projectId, taskId }: DeliverableUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deliverableType, setDeliverableType] = useState<"report" | "photos" | "certificate" | "other">("photos");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch deliverables
  const { data: deliverables, refetch } = trpc.deliverables.listByTask.useQuery(
    { taskId: taskId || 0 },
    { enabled: !!taskId }
  );

  // Upload mutation
  const uploadMutation = trpc.deliverables.upload.useMutation({
    onSuccess: () => {
      toast.success("Deliverable uploaded successfully");
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setUploading(false);
    },
  });

  // Submit mutation
  const submitMutation = trpc.deliverables.submit.useMutation({
    onSuccess: () => {
      toast.success("Deliverable submitted for review");
      refetch();
    },
    onError: (error) => {
      toast.error(`Submit failed: ${error.message}`);
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDeliverableType("photos");
    setSelectedFile(null);
    setUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setUploading(true);

    try {
      // Upload to S3 using the storage API
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const { fileKey, url } = await response.json();

      // Create deliverable record
      await uploadMutation.mutateAsync({
        projectId,
        taskId,
        title: title.trim(),
        description: description.trim() || undefined,
        deliverableType,
        fileKey,
        fileUrl: url,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
      setUploading(false);
    }
  };

  const handleSubmit = (deliverableId: number) => {
    submitMutation.mutate({ deliverableId });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "needs_revision":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "submitted":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      submitted: "default",
      approved: "outline",
      needs_revision: "destructive",
      rejected: "destructive",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.replace("_", " ")}
      </Badge>
    );
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

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Deliverable</CardTitle>
          <CardDescription>
            Upload inspection reports, photos, or certificates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file">File *</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
              accept="image/*,.pdf,.doc,.docx"
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Foundation Inspection Report"
              disabled={uploading}
            />
          </div>

          <div>
            <Label htmlFor="type">Type *</Label>
            <Select
              value={deliverableType}
              onValueChange={(value: any) => setDeliverableType(value)}
              disabled={uploading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="photos">Photos</SelectItem>
                <SelectItem value="certificate">Certificate</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about this deliverable"
              disabled={uploading}
              rows={3}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Deliverable
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Deliverables List */}
      {deliverables && deliverables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Deliverables</CardTitle>
            <CardDescription>
              Review and submit your deliverables for approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <div className="mt-1">{getTypeIcon(deliverable.deliverableType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{deliverable.title}</h4>
                        {deliverable.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {deliverable.description}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(deliverable.status)}
                    </div>

                    {deliverable.reviewNotes && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <p className="font-medium">Review Notes:</p>
                        <p className="text-muted-foreground">{deliverable.reviewNotes}</p>
                      </div>
                    )}

                    {deliverable.rejectionReason && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded text-sm">
                        <p className="font-medium text-destructive">Rejection Reason:</p>
                        <p className="text-destructive/80">{deliverable.rejectionReason}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      {deliverable.fileUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(deliverable.fileUrl!, "_blank")}
                        >
                          View File
                        </Button>
                      )}
                      {deliverable.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleSubmit(deliverable.id)}
                          disabled={submitMutation.isPending}
                        >
                          {submitMutation.isPending ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit for Review"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

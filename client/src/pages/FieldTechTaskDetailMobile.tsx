import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Camera, CheckCircle, Clock, MapPin, Upload, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { AddTaskDialog } from "@/components/AddTaskDialog";
// Storage uploads now handled via tRPC

/**
 * Mobile-optimized field tech task detail page
 * Features: Large touch targets (min 48px), simplified layout, camera capture
 */
export default function FieldTechTaskDetailMobile() {
  const { user, isAuthenticated } = useAuth();
  const [, params] = useRoute("/field-tech/task/:id");
  const [, setLocation] = useLocation();
  const taskId = params?.id ? parseInt(params.id) : null;

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [gpsLocation, setGPSLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);

  // Get GPS location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGPSLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("GPS error:", error);
        }
      );
    }
  }, []);

  const { data: tasks, isLoading } = trpc.tasks.listForUser.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "field_tech" }
  );

  const task = tasks?.find(t => t.id === taskId);

  const { data: deliverables, refetch: refetchDeliverables } = trpc.deliverables.listByTask.useQuery(
    { taskId: taskId! },
    { enabled: !!taskId && isAuthenticated }
  );

  const uploadFileMutation = trpc.storage.uploadFile.useMutation();
  
  const createDeliverableMutation = trpc.deliverables.upload.useMutation({
    onSuccess: () => {
      toast.success("Photos uploaded successfully!");
      setSelectedFiles([]);
      refetchDeliverables();
    },
    onError: (error: any) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleUpload = async () => {
    if (!task || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of selectedFiles) {
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        const base64Data = btoa(String.fromCharCode(...Array.from(uint8Array)));
        
        // Generate unique filename with timestamp and GPS coords if available
        const timestamp = Date.now();
        const gpsTag = gpsLocation ? `_${gpsLocation.lat.toFixed(6)}_${gpsLocation.lng.toFixed(6)}` : '';
        const filename = `task-${taskId}-${timestamp}${gpsTag}-${file.name}`;
        
        const uploadResult = await uploadFileMutation.mutateAsync({
          fileName: filename,
          fileData: base64Data,
          contentType: file.type,
          folder: 'deliverables',
        });
        
        uploadedUrls.push(uploadResult.url);
      }

      createDeliverableMutation.mutate({
        projectId: task.projectId,
        taskId: taskId!,
        title: "Field Photo",
        deliverableType: "photos",
        fileKey: `deliverables/task-${taskId}-${Date.now()}`,
        fileUrl: uploadedUrls[0],
        description: gpsLocation ? `GPS: ${gpsLocation.lat}, ${gpsLocation.lng}` : undefined,
      });
    } catch (error) {
      toast.error("Upload failed");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Task not found</p>
            <Button onClick={() => setLocation("/field-tech")} className="mt-4 h-12 px-6 text-lg">
              Back to Tasks
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setLocation("/field-tech")}
            className="h-12 w-12 p-0"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold line-clamp-1">{task.title}</h1>
            <p className="text-sm text-muted-foreground">Task #{task.id}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Task Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Task Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {task.description && (
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span>Due: {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString() : 'Not scheduled'}</span>
            </div>

            {gpsLocation && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <MapPin className="w-5 h-5" />
                <span>GPS: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Camera Capture Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Capture Photos</CardTitle>
            <CardDescription>Take photos of the inspection site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleCameraCapture}
              className="hidden"
              id="camera-input"
            />
            
            <label htmlFor="camera-input">
              <Button
                type="button"
                size="lg"
                className="w-full h-16 text-lg"
                asChild
              >
                <div>
                  <Camera className="w-6 h-6 mr-3" />
                  Open Camera
                </div>
              </Button>
            </label>

            {selectedFiles.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  {selectedFiles.length} photo(s) selected
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden border">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  size="lg"
                  className="w-full h-14 text-lg mt-4"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-3" />
                      Upload Photos
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Follow-up Task Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Follow-up Task</CardTitle>
            <CardDescription>Schedule additional inspection or site visit</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowAddTaskDialog(true)}
              className="w-full h-14 text-lg"
              variant="outline"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Follow-up Task
            </Button>
          </CardContent>
        </Card>

        {/* Uploaded Deliverables */}
        {deliverables && deliverables.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Uploaded Photos ({deliverables.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {deliverables.map((deliverable) => (
                  <div key={deliverable.id} className="space-y-2">
                    <div className="aspect-square rounded-lg overflow-hidden border">
                      <img
                        src={deliverable.fileUrl || ""}
                        alt="Deliverable"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {deliverable.status === "approved" && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Approved
                        </span>
                      )}
                      {deliverable.status === "pending" && (
                        <span className="text-yellow-600">Pending Review</span>
                      )}
                      {deliverable.status === "needs_revision" && (
                        <span className="text-destructive">Needs Revision</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Task Dialog */}
      {task && (
        <AddTaskDialog
          open={showAddTaskDialog}
          onOpenChange={setShowAddTaskDialog}
          projectId={task.projectId}
          onSuccess={() => {
            toast.success("Follow-up task created successfully");
          }}
        />
      )}
    </div>
  );
}

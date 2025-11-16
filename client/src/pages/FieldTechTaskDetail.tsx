import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  Loader2, 
  MapPin, 
  Calendar, 
  FileText, 
  Clock,
  Navigation,
  Camera,
  MessageSquare,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { MapView } from "@/components/Map";
import DeliverableUpload from "@/components/DeliverableUpload";

export default function FieldTechTaskDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const taskId = parseInt(params.id || "");
  const [newNote, setNewNote] = useState("");
  const [productionDays, setProductionDays] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Fetch task with project data
  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.listForUser.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "field_tech" }
  );

  const task = tasks?.find(t => t.id === taskId);
  const project = task?.project;

  // Fetch notes
  const { data: notes, refetch: refetchNotes } = trpc.projectNotes.list.useQuery(
    { projectId: project?.id || 0 },
    { enabled: !!project?.id }
  );

  // Fetch files
  const { data: files, refetch: refetchFiles } = trpc.projectFiles.list.useQuery(
    { projectId: project?.id || 0 },
    { enabled: !!project?.id }
  );

  // Mutations
  const createNoteMutation = trpc.projectNotes.create.useMutation({
    onSuccess: () => {
      toast.success("Note added successfully");
      setNewNote("");
      refetchNotes();
    },
    onError: (error: any) => {
      toast.error(`Failed to add note: ${error.message}`);
    },
  });

  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Task updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Production days updated");
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const uploadFileMutation = trpc.projectFiles.upload.useMutation({
    onSuccess: () => {
      toast.success("Photos uploaded successfully");
      refetchFiles();
      setUploadingPhotos(false);
    },
    onError: (error: any) => {
      toast.error(`Upload failed: ${error.message}`);
      setUploadingPhotos(false);
    },
  });

  if (authLoading || tasksLoading) {
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
            <CardDescription>You must be logged in as a field technician.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isNaN(taskId) || !task || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Task Not Found</CardTitle>
            <CardDescription>The requested inspection task could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/field-tech">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddNote = () => {
    if (!newNote.trim() || !project) return;
    
    createNoteMutation.mutate({
      projectId: project.id,
      note: newNote.trim(),
    });
  };

  const handleStatusChange = (newStatus: "in_progress" | "completed") => {
    updateTaskMutation.mutate({
      projectId: project.id,
      taskId: task.id,
      status: newStatus,
    });
  };

  const handleUpdateProductionDays = () => {
    const days = parseInt(productionDays);
    if (isNaN(days) || days < 0 || !project) return;
    
    updateProjectMutation.mutate({
      projectId: project.id,
      productionDays: days,
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !project) return;
    
    setUploadingPhotos(true);
    
    // In a real implementation, you would upload to S3 first
    // For now, we'll just create file records
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        uploadFileMutation.mutate({
          projectId: project.id,
          fileType: "production_photo",
          fileName: file.name,
          fileData: base64, // In production, this would be an S3 URL
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNavigate = () => {
    if (project?.address) {
      const encodedAddress = encodeURIComponent(project.address);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
    }
  };

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

  const productionPhotos = files?.filter((f: any) => f.fileType === "production_photo") || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/field-tech">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Inspection Details</h1>
            <p className="text-sm opacity-90">{project.propertyOwnerName}</p>
          </div>
          {getStatusBadge(task.status)}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Location & Navigation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm font-medium">{project.address}</div>
            
            {/* Map */}
            <div className="h-48 rounded-lg overflow-hidden border">
              <MapView
                onMapReady={(map: any) => {
                  if (!window.google) return;
                  const geocoder = new window.google.maps.Geocoder();
                  geocoder.geocode({ address: project.address }, (results: any, status: any) => {
                    if (status === 'OK' && results && results[0]) {
                      const location = results[0].geometry.location;
                      map.setCenter(location);
                      new window.google.maps.Marker({
                        map: map,
                        position: location,
                        title: project.address,
                      });
                    }
                  });
                }}
                zoom={15}
              />
            </div>
            
            <Button onClick={handleNavigate} className="w-full" size="lg">
              <Navigation className="w-5 h-5 mr-2" />
              Navigate to Site
            </Button>
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-muted-foreground text-xs mb-1">Client</div>
                <div className="font-medium">{project.clientName}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Customer #</div>
                <div className="font-medium">{project.customerNumber || "N/A"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Permit #</div>
                <div className="font-medium">{project.permitNumber || "N/A"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Jurisdiction</div>
                <div className="font-medium">{project.jurisdiction || "N/A"}</div>
              </div>
            </div>
            
            {project.scopeOfWork && (
              <div>
                <div className="text-muted-foreground text-xs mb-1">Scope of Work</div>
                <div className="text-sm">{project.scopeOfWork}</div>
              </div>
            )}
            
            {task.scheduledDate && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {new Date(task.scheduledDate).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Status Actions */}
        {task.status !== "completed" && task.status !== "cancelled" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {task.status === "scheduled" && (
                <Button 
                  onClick={() => handleStatusChange("in_progress")} 
                  className="w-full"
                  size="lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Start Inspection
                </Button>
              )}
              {task.status === "in_progress" && (
                <Button 
                  onClick={() => handleStatusChange("completed")} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Mark as Completed
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Production Days (for CSI projects) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Production Days</CardTitle>
            <CardDescription className="text-xs">
              Track the number of days required for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                value={productionDays}
                onChange={(e) => setProductionDays(e.target.value)}
                placeholder={project.productionDays?.toString() || "Enter days"}
                className="flex-1"
              />
              <Button onClick={handleUpdateProductionDays} disabled={!productionDays}>
                Update
              </Button>
            </div>
            {project.productionDays !== null && (
              <div className="text-sm text-muted-foreground">
                Current: <span className="font-medium">{project.productionDays} days</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photo Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Production Photos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="photo-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm font-medium">Tap to upload photos</div>
                <div className="text-xs text-muted-foreground mt-1">JPG, PNG up to 10MB</div>
              </div>
            </Label>
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploadingPhotos}
            />
            
            {productionPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {productionPhotos.map((photo: any) => (
                  <div key={photo.id} className="aspect-square rounded-lg overflow-hidden border">
                    <img 
                      src={photo.fileUrl} 
                      alt={photo.fileName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Field Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Field Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add observations, scope changes, conversations with crew/homeowner..."
                rows={4}
                className="resize-none"
              />
              <Button 
                onClick={handleAddNote} 
                disabled={!newNote.trim() || createNoteMutation.isPending}
                className="w-full"
              >
                {createNoteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Note"
                )}
              </Button>
            </div>
            
            {notes && notes.length > 0 && (
              <div className="space-y-2 mt-4 pt-4 border-t">
                <div className="text-sm font-medium mb-2">Previous Notes</div>
                {notes.map((note: any) => (
                  <div key={note.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="text-xs text-muted-foreground mb-1">
                      {new Date(note.createdAt).toLocaleString()}
                    </div>
                    <div>{note.content}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deliverables Section */}
        <DeliverableUpload projectId={project.id} taskId={task.id} />
      </div>
    </div>
  );
}

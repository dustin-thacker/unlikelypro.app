import { useParams, useLocation } from "wouter";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, FileText, Calendar, MapPin, ArrowLeft, Download, Plus, Upload, MessageSquare, History, Mail, X, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { CertificationDialog } from "@/components/CertificationDialog";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { ProjectRFITab } from "@/components/ProjectRFITab";

export default function AdminProjectDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

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
  const projectId = parseInt(params.id || "0");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Validate projectId
  if (!params.id || isNaN(projectId) || projectId === 0) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Project ID</h2>
          <p className="text-slate-600 mb-4">The project ID in the URL is invalid or missing.</p>
          <Button onClick={() => setLocation("/admin")}>Back to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }
  
  // Note state
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState<"general" | "scope_change" | "production" | "conversation">("general");
  
  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileType, setFileType] = useState<"production_photo" | "updated_plan" | "updated_permit" | "pier_log" | "other">("production_photo");
  
  // Billing emails state
  const [editingEmails, setEditingEmails] = useState(false);
  const [billingEmails, setBillingEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  
  // Certification dialog state
  const [certificationDialogOpen, setCertificationDialogOpen] = useState(false);
  
  // Add task dialog state
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);

  const { data: projectDetails, isLoading } = trpc.projects.getWithDetails.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );
  const { data: notes } = trpc.projectNotes.list.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );
  const { data: files } = trpc.projectFiles.list.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );
  const { data: auditLog } = trpc.auditTrail.list.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );
  const { data: deliverables } = trpc.deliverables.list.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );
  
  const updateProject = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Project status updated");
    },
  });
  
  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Task status updated");
    },
  });
  
  const createNote = trpc.projectNotes.create.useMutation({
    onSuccess: () => {
      toast.success("Note added");
      setNewNote("");
      utils.projectNotes.list.invalidate({ projectId });
      utils.auditTrail.list.invalidate({ projectId });
    },
  });
  
  const uploadFile = trpc.projectFiles.upload.useMutation({
    onSuccess: () => {
      toast.success("File uploaded");
      utils.projectFiles.list.invalidate({ projectId });
      utils.auditTrail.list.invalidate({ projectId });
      setUploadingFile(false);
    },
    onError: () => {
      toast.error("File upload failed");
      setUploadingFile(false);
    },
  });

  const utils = trpc.useUtils();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!projectDetails) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Project Not Found</h2>
          <Button onClick={() => setLocation("/admin")}>Back to Dashboard</Button>
        </div>
      </DashboardLayout>
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

  const handleProjectStatusChange = async (newStatus: string) => {
    await updateProject.mutateAsync({
      projectId,
      status: newStatus as any,
    });
    utils.projects.getWithDetails.invalidate({ projectId });
  };

  const handleTaskStatusChange = async (taskId: number, newStatus: string) => {
    await updateTask.mutateAsync({
      taskId,
      projectId,
      status: newStatus as any,
    });
    utils.projects.getWithDetails.invalidate({ projectId });
  };
  
  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }
    
    await createNote.mutateAsync({
      projectId,
      note: newNote,
      noteType,
    });
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingFile(true);
    
    // Read file as base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const base64Data = base64.split(',')[1]; // Remove data:mime;base64, prefix
      
      await uploadFile.mutateAsync({
        projectId,
        fileName: file.name,
        fileData: base64Data,
        fileType,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/admin")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

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
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCertificationDialogOpen(true)}
                  className="gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  Generate Certification
                </Button>
                <Badge className={getStatusColor(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
                <Select
                  value={project.status}
                  onValueChange={handleProjectStatusChange}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_verification">Pending Verification</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {project.propertyOwnerName && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Property Owner</p>
                  <p className="text-base text-slate-900">{project.propertyOwnerName}</p>
                </div>
              )}
              {project.customerNumber && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Customer Number</p>
                  <p className="text-base text-slate-900">{project.customerNumber}</p>
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
              {project.productionDays !== undefined && project.productionDays !== null && project.productionDays > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Production Days</p>
                  <p className="text-base text-slate-900">{project.productionDays}</p>
                </div>
              )}
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
            
            {/* Billing Emails Section */}
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <p className="text-sm font-medium text-slate-500">Billing Email Addresses</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (editingEmails) {
                      // Save emails
                      updateProject.mutate({
                        projectId,
                        billingEmails: billingEmails.length > 0 ? JSON.stringify(billingEmails) : undefined,
                      });
                      setEditingEmails(false);
                    } else {
                      // Start editing
                      const currentEmails = project.billingEmails 
                        ? JSON.parse(project.billingEmails) 
                        : [];
                      setBillingEmails(currentEmails);
                      setEditingEmails(true);
                    }
                  }}
                >
                  {editingEmails ? "Save" : "Edit"}
                </Button>
              </div>
              
              {!editingEmails ? (
                <div>
                  {project.billingEmails ? (
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(project.billingEmails).map((email: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          {email}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No billing emails configured</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  {billingEmails.length > 0 && (
                    <div className="space-y-2">
                      {billingEmails.map((email, index) => (
                        <div key={index} className="flex items-center gap-2 bg-white p-2 rounded border">
                          <span className="flex-1 text-sm">{email}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setBillingEmails(prev => prev.filter((_, i) => i !== index));
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                            if (!billingEmails.includes(newEmail)) {
                              setBillingEmails(prev => [...prev, newEmail]);
                              setNewEmail("");
                            } else {
                              toast.error("This email is already added");
                            }
                          } else {
                            toast.error("Please enter a valid email address");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                          if (!billingEmails.includes(newEmail)) {
                            setBillingEmails(prev => [...prev, newEmail]);
                            setNewEmail("");
                          } else {
                            toast.error("This email is already added");
                          }
                        } else {
                          toast.error("Please enter a valid email address");
                        }
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">
              <Calendar className="w-4 h-4 mr-2" />
              Tasks {tasks && tasks.length > 0 && `(${tasks.length})`}
            </TabsTrigger>
            <TabsTrigger value="notes">
              <MessageSquare className="w-4 h-4 mr-2" />
              Notes {notes && notes.length > 0 && `(${notes.length})`}
            </TabsTrigger>
            <TabsTrigger value="rfi">
              <MessageSquare className="w-4 h-4 mr-2" />
              RFIs
            </TabsTrigger>
            <TabsTrigger value="files">
              <Upload className="w-4 h-4 mr-2" />
              Files {files && files.length > 0 && `(${files.length})`}
            </TabsTrigger>
            <TabsTrigger value="audit">
              <History className="w-4 h-4 mr-2" />
              Audit Trail
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Deliverables Section */}
            {deliverables && deliverables.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Deliverables</CardTitle>
                  <CardDescription>Generated certifications, reports, and final documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {deliverables.map((deliverable) => (
                      <div
                        key={deliverable.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileCheck className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900">{deliverable.title}</p>
                              <Badge variant={deliverable.status === 'submitted' ? 'default' : deliverable.status === 'pending' ? 'secondary' : 'outline'}>
                                {deliverable.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500">
                              Submitted {deliverable.submittedAt ? new Date(deliverable.submittedAt).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        {deliverable.fileUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadFile(deliverable.fileUrl!, `${deliverable.deliverableType}-${project.address}.pdf`)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Initial Attachments */}
            {attachments && attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Initial Documents</CardTitle>
                  <CardDescription>Plans and permits uploaded during project creation</CardDescription>
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
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Note</CardTitle>
                <CardDescription>Add notes about scope changes, production details, or conversations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="noteType">Note Type</Label>
                  <Select value={noteType} onValueChange={(value: any) => setNoteType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="scope_change">Scope Change</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="conversation">Conversation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="note">Note</Label>
                  <Textarea
                    id="note"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter note details..."
                    rows={4}
                  />
                </div>
                <Button onClick={handleAddNote} disabled={createNote.isPending}>
                  {createNote.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Note
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {notes && notes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Project Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="p-4 bg-slate-50 rounded-lg border">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline">{note.noteType.replace('_', ' ')}</Badge>
                          <span className="text-sm text-slate-500">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-900 whitespace-pre-wrap">{note.note}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload File</CardTitle>
                <CardDescription>Upload production photos, updated plans, permits, or pier logs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fileType">File Type</Label>
                  <Select value={fileType} onValueChange={(value: any) => setFileType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production_photo">Production Photo</SelectItem>
                      <SelectItem value="updated_plan">Updated Plan</SelectItem>
                      <SelectItem value="updated_permit">Updated Permit</SelectItem>
                      <SelectItem value="pier_log">Pier Log</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                  />
                </div>
                {uploadingFile && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categorized Files */}
            {files && files.length > 0 && (
              <div className="space-y-4">
                {/* Deliverables */}
                {deliverables && deliverables.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Deliverables</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {deliverables.map((deliverable) => (
                          <div key={deliverable.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <FileCheck className="w-5 h-5 text-green-600" />
                              <div>
                                <p className="font-medium text-slate-900">{deliverable.title}</p>
                                <p className="text-sm text-slate-500">
                                  {deliverable.deliverableType.replace('_', ' ')} • {new Date(deliverable.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            {deliverable.fileUrl && (
                              <Button variant="ghost" size="sm" onClick={() => downloadFile(deliverable.fileUrl!, `${deliverable.deliverableType}-${project.address}.pdf`)}>
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Production Photos */}
                {files.filter(f => f.fileType === 'production_photo').length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Production Photos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {files.filter(f => f.fileType === 'production_photo').map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="font-medium text-slate-900">{file.fileName}</p>
                                <p className="text-sm text-slate-500">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => downloadFile(file.fileUrl, file.fileName)}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Drive Logs (Pier Logs) */}
                {files.filter(f => f.fileType === 'pier_log').length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Drive Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {files.filter(f => f.fileType === 'pier_log').map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="font-medium text-slate-900">{file.fileName}</p>
                                <p className="text-sm text-slate-500">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => downloadFile(file.fileUrl, file.fileName)}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Plan Revisions */}
                {files.filter(f => f.fileType === 'updated_plan').length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Plan Revisions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {files.filter(f => f.fileType === 'updated_plan').map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="font-medium text-slate-900">{file.fileName}</p>
                                <p className="text-sm text-slate-500">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => downloadFile(file.fileUrl, file.fileName)}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Permit Revisions */}
                {files.filter(f => f.fileType === 'updated_permit').length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Permit Revisions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {files.filter(f => f.fileType === 'updated_permit').map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="font-medium text-slate-900">{file.fileName}</p>
                                <p className="text-sm text-slate-500">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => downloadFile(file.fileUrl, file.fileName)}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Other Files */}
                {files.filter(f => f.fileType === 'other').length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Other Files</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {files.filter(f => f.fileType === 'other').map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="font-medium text-slate-900">{file.fileName}</p>
                                <p className="text-sm text-slate-500">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => downloadFile(file.fileUrl, file.fileName)}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* RFI Tab */}
          <TabsContent value="rfi">
            <ProjectRFITab projectId={parseInt(params.id!)} isAdmin={true} />
          </TabsContent>

          {/* Audit Trail Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>Complete history of changes to this project</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLog && auditLog.length > 0 ? (
                  <div className="space-y-2">
                    {auditLog.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border">
                        <History className="w-4 h-4 text-slate-500 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{entry.action}</p>
                          <p className="text-xs text-slate-500">
                            {entry.userName || 'Unknown User'} • {new Date(entry.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">No audit entries yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            {tasks && tasks.length > 0 ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Scheduled Inspections</CardTitle>
                      <CardDescription>Manage inspection tasks for this project</CardDescription>
                    </div>
                    <Button onClick={() => setAddTaskDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
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
                            <Badge className={getStatusColor(task.status)}>
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
                        <Select
                          value={task.status}
                          onValueChange={(newStatus) => handleTaskStatusChange(task.id, newStatus)}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-slate-500">No tasks scheduled yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Certification Dialog */}
      <CertificationDialog
        projectId={projectId}
        open={certificationDialogOpen}
        onOpenChange={setCertificationDialogOpen}
        onSuccess={() => {
          // Refresh project details to show updated certification
          window.location.reload();
        }}
      />
      
      <AddTaskDialog
        projectId={projectId}
        open={addTaskDialogOpen}
        onOpenChange={setAddTaskDialogOpen}
      />
    </DashboardLayout>
  );
}

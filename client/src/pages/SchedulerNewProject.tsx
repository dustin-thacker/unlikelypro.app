import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Upload, FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";

export default function SchedulerNewProject() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  const [propertyOwnerName, setPropertyOwnerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [permitFiles, setPermitFiles] = useState<FileList | null>(null);
  const [plansFiles, setPlansFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  const createProject = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success("Project created successfully");
      setLocation(`/scheduler/verify/${data.projectId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create project");
      setUploading(false);
    },
  });

  const uploadAttachment = trpc.attachments.upload.useMutation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || user.role !== "client_scheduler") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">
              Access denied. This page is only available to client schedulers.
            </p>
            <Button className="w-full mt-4" onClick={() => setLocation("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!propertyOwnerName.trim()) {
      toast.error("Please enter the property owner name");
      return;
    }

    if (!permitFiles || permitFiles.length === 0) {
      toast.error("Please upload at least one building permit PDF");
      return;
    }

    if (!plansFiles || plansFiles.length === 0) {
      toast.error("Please upload at least one building plans PDF");
      return;
    }

    setUploading(true);

    try {
      // Create the project first
      const project = await createProject.mutateAsync({
        clientName: user.client || "Unknown Client",
        propertyOwnerName,
        customerNumber: customerNumber.trim() || undefined,
        address: "", // Will be extracted from PDF
        isPostConstruction: false, // Will be determined during verification
      });

      // Upload permit files
      for (let i = 0; i < permitFiles.length; i++) {
        const file = permitFiles[i];
        const reader = new FileReader();
        
        await new Promise<void>((resolve, reject) => {
          reader.onload = async (event) => {
            try {
              const base64 = event.target?.result as string;
              const base64Data = base64.split(',')[1];
              
              await uploadAttachment.mutateAsync({
                projectId: project.projectId,
                fileName: file.name,
                fileData: base64Data,
                fileType: "permit",
                mimeType: file.type,
              });
              
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      // Upload plans files
      for (let i = 0; i < plansFiles.length; i++) {
        const file = plansFiles[i];
        const reader = new FileReader();
        
        await new Promise<void>((resolve, reject) => {
          reader.onload = async (event) => {
            try {
              const base64 = event.target?.result as string;
              const base64Data = base64.split(',')[1];
              
              await uploadAttachment.mutateAsync({
                projectId: project.projectId,
                fileName: file.name,
                fileData: base64Data,
                fileType: "plan",
                mimeType: file.type,
              });
              
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      // Navigation happens in onSuccess callback
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container max-w-3xl py-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/scheduler")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">New Inspection Request</CardTitle>
            <CardDescription>
              Submit project details and upload permit documents for inspection scheduling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Property Owner Name */}
              <div>
                <Label htmlFor="propertyOwnerName">
                  Property Owner Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="propertyOwnerName"
                  value={propertyOwnerName}
                  onChange={(e) => setPropertyOwnerName(e.target.value)}
                  placeholder="Enter property owner's full name"
                  required
                />
              </div>

              {/* Customer Number */}
              <div>
                <Label htmlFor="customerNumber">
                  Customer Number (Optional)
                </Label>
                <Input
                  id="customerNumber"
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  placeholder="Your internal customer tracking number"
                />
                <p className="text-sm text-slate-500 mt-1">
                  For your internal tracking purposes
                </p>
              </div>

              {/* Building Permit Upload */}
              <div>
                <Label htmlFor="permit">
                  Building Permit PDF <span className="text-red-500">*</span>
                </Label>
                <div className="mt-2">
                  <label
                    htmlFor="permit"
                    className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-blue-400 focus:outline-none"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="w-8 h-8 text-slate-400" />
                      <span className="font-medium text-slate-600">
                        {permitFiles && permitFiles.length > 0
                          ? `${permitFiles.length} file(s) selected`
                          : "Click to upload building permit"}
                      </span>
                      <span className="text-sm text-slate-500">PDF files only</span>
                    </div>
                    <input
                      id="permit"
                      type="file"
                      className="hidden"
                      accept="application/pdf"
                      multiple
                      onChange={(e) => setPermitFiles(e.target.files)}
                      required
                    />
                  </label>
                </div>
                {permitFiles && permitFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {Array.from(permitFiles).map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                        <FileText className="w-4 h-4" />
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Building Plans Upload */}
              <div>
                <Label htmlFor="plans">
                  Building Plans / Permit Package PDF <span className="text-red-500">*</span>
                </Label>
                <div className="mt-2">
                  <label
                    htmlFor="plans"
                    className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-blue-400 focus:outline-none"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="w-8 h-8 text-slate-400" />
                      <span className="font-medium text-slate-600">
                        {plansFiles && plansFiles.length > 0
                          ? `${plansFiles.length} file(s) selected`
                          : "Click to upload building plans"}
                      </span>
                      <span className="text-sm text-slate-500">PDF files only</span>
                    </div>
                    <input
                      id="plans"
                      type="file"
                      className="hidden"
                      accept="application/pdf"
                      multiple
                      onChange={(e) => setPlansFiles(e.target.files)}
                      required
                    />
                  </label>
                </div>
                {plansFiles && plansFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {Array.from(plansFiles).map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                        <FileText className="w-4 h-4" />
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/scheduler")}
                  disabled={uploading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploading}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Continue to Verification"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

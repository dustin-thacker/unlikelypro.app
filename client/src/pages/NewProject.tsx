import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, FileText, Loader2, Camera, Plus, X } from "lucide-react";
import { CLIENT_BRANCHES } from "@shared/branches";

export default function NewProject() {
  const [, setLocation] = useLocation();
  const [clientName, setClientName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [propertyOwnerName, setPropertyOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [billingEmails, setBillingEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isPostConstruction, setIsPostConstruction] = useState(false);
  const [completionDate, setCompletionDate] = useState("");
  const [files, setFiles] = useState<{ file: File; type: "plan" | "permit" | "production_photo" }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createProject = trpc.projects.create.useMutation();
  const uploadAttachment = trpc.attachments.upload.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "plan" | "permit" | "production_photo") => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({ file, type }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName || !propertyOwnerName || !address) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (files.length === 0) {
      toast.error("Please upload at least one plan or permit");
      return;
    }

    if (isPostConstruction && !completionDate) {
      toast.error("Please enter the completion date for post-construction projects");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create project
      const { projectId } = await createProject.mutateAsync({
        clientName,
        customerNumber: customerNumber || undefined,
        propertyOwnerName,
        address,
        billingEmails: billingEmails.length > 0 ? JSON.stringify(billingEmails) : undefined,
        isPostConstruction,
        completionDate: completionDate || undefined,
      });

      // Upload files
      const uploadPromises = files.map(async ({ file, type }) => {
        const reader = new FileReader();
        return new Promise<void>((resolve, reject) => {
          reader.onload = async () => {
            try {
              const base64 = reader.result?.toString().split(",")[1];
              if (!base64) throw new Error("Failed to read file");

              await uploadAttachment.mutateAsync({
                projectId,
                fileName: file.name,
                fileType: type,
                fileData: base64,
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
      });

      await Promise.all(uploadPromises);

      toast.success("Project created successfully! Redirecting to verification...");
      setLocation(`/verify-project/${projectId}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="container max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">New Inspection Project</CardTitle>
            <CardDescription>
              Submit your project details and upload plans/permits for inspection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client *</Label>
                <Select value={clientName} onValueChange={setClientName} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your client" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_BRANCHES.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerNumber">Customer Number (Optional)</Label>
                <Input
                  id="customerNumber"
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  placeholder="Your internal customer/project number for tracking"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyOwnerName">Property Owner Name *</Label>
                <Input
                  id="propertyOwnerName"
                  value={propertyOwnerName}
                  onChange={(e) => setPropertyOwnerName(e.target.value)}
                  placeholder="Enter property owner name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address of Permitted Work *</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter full street address, city, state, and zip code"
                  required
                />
                <p className="text-xs text-muted-foreground">Please enter a complete, valid address</p>
              </div>

              {/* Billing Emails Management */}
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="space-y-2">
                  <Label>Billing Email Addresses</Label>
                  <p className="text-xs text-muted-foreground">
                    Add email addresses that will receive invoice PDFs when invoices are sent
                  </p>
                </div>
                
                {/* Email List */}
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
                
                {/* Add Email Input */}
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

              <div className="flex items-center space-x-2 p-4 bg-slate-50 rounded-lg border">
                <Checkbox
                  id="isPostConstruction"
                  checked={isPostConstruction}
                  onCheckedChange={(checked) => setIsPostConstruction(checked === true)}
                />
                <Label htmlFor="isPostConstruction" className="cursor-pointer font-normal">
                  This is a post-construction project
                </Label>
              </div>

              {isPostConstruction && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="space-y-2">
                    <Label htmlFor="completionDate">Date Work Was Completed *</Label>
                    <Input
                      id="completionDate"
                      type="date"
                      value={completionDate}
                      onChange={(e) => setCompletionDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      required={isPostConstruction}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Production Photos</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        multiple
                        onChange={(e) => handleFileChange(e, "production_photo")}
                        className="flex-1"
                      />
                      <Camera className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">Upload photos of the completed work</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload Plans *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={(e) => handleFileChange(e, "plan")}
                      className="flex-1"
                    />
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload Permits *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={(e) => handleFileChange(e, "permit")}
                      className="flex-1"
                    />
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Files</Label>
                    <div className="space-y-2">
                      {files.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">{item.file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({item.type})
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Project...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, FileCheck, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface CertificationDialogProps {
  projectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface CertificationPreview {
  companyName: string;
  companyContact: string;
  propertyOwner: string;
  siteAddress: string;
  contractorName: string;
  scopeOfWork: string;
  inspectedProducts: string;
  buildingCode: string;
  codeYear: string;
  fieldChanges?: string;
}

export function CertificationDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess,
}: CertificationDialogProps) {
  const [certificationType, setCertificationType] = useState<"as_permitted" | "as_built">("as_permitted");
  const [fieldChanges, setFieldChanges] = useState("");
  const [step, setStep] = useState<"select" | "field_changes" | "preview" | "generating">("select");
  const [previewData, setPreviewData] = useState<CertificationPreview | null>(null);

  const generatePreviewMutation = trpc.certifications.generatePreview.useMutation({
    onSuccess: (data) => {
      setPreviewData(data);
      setStep("preview");
    },
    onError: (error: any) => {
      toast.error(`Failed to generate preview: ${error.message}`);
      setStep("select");
    },
  });

  const generateMutation = trpc.certifications.generate.useMutation({
    onSuccess: () => {
      toast.success("Certification generated successfully!");
      onOpenChange(false);
      resetDialog();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(`Failed to generate certification: ${error.message}`);
      setStep("preview");
    },
  });

  const resetDialog = () => {
    setCertificationType("as_permitted");
    setFieldChanges("");
    setStep("select");
    setPreviewData(null);
  };

  const handleNext = () => {
    if (certificationType === "as_built") {
      setStep("field_changes");
    } else {
      handleGeneratePreview();
    }
  };

  const handleGeneratePreview = () => {
    setStep("generating");
    generatePreviewMutation.mutate({
      projectId,
      certificationType,
      fieldChanges: certificationType === "as_built" ? fieldChanges : undefined,
    });
  };

  const handleGenerate = () => {
    if (!previewData) return;
    setStep("generating");
    generateMutation.mutate({
      projectId,
      certificationType,
      fieldChanges: certificationType === "as_built" ? fieldChanges : undefined,
      previewData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetDialog();
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        {step === "select" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Generate Certification
              </DialogTitle>
              <DialogDescription>
                Was the project completed as permitted, or were there field changes?
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <RadioGroup
                value={certificationType}
                onValueChange={(value) => setCertificationType(value as "as_permitted" | "as_built")}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="as_permitted" id="as_permitted" />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor="as_permitted"
                      className="font-medium cursor-pointer"
                    >
                      As Permitted
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      The project was completed exactly as shown in the permit and plans.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="as_built" id="as_built" />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor="as_built"
                      className="font-medium cursor-pointer"
                    >
                      As Built
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      There were field changes from the original permitted scope.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleNext}>
                {certificationType === "as_built" ? "Next" : "Preview Certification"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "field_changes" && (
          <>
            <DialogHeader>
              <DialogTitle>Document Field Changes</DialogTitle>
              <DialogDescription>
                Please describe the as-built conditions and any changes from the permitted scope.
                These will be logged in the project notes and reflected in the certification.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Textarea
                placeholder="Example: Pier spacing changed from 8ft to 7ft due to site conditions. Total pier count increased from 24 to 28 piers."
                value={fieldChanges}
                onChange={(e) => setFieldChanges(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button 
                onClick={handleGeneratePreview}
                disabled={!fieldChanges.trim()}
              >
                Preview Certification
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "preview" && previewData && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                Review & Edit Certification
              </DialogTitle>
              <DialogDescription>
                Review the certification details below. You can edit any field before generating the final document.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={previewData.companyName}
                    onChange={(e) => setPreviewData({ ...previewData, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="companyContact">Company Contact</Label>
                  <Input
                    id="companyContact"
                    value={previewData.companyContact}
                    onChange={(e) => setPreviewData({ ...previewData, companyContact: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="propertyOwner">Property Owner</Label>
                <Input
                  id="propertyOwner"
                  value={previewData.propertyOwner}
                  onChange={(e) => setPreviewData({ ...previewData, propertyOwner: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="siteAddress">Site Address</Label>
                <Input
                  id="siteAddress"
                  value={previewData.siteAddress}
                  onChange={(e) => setPreviewData({ ...previewData, siteAddress: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="contractorName">Contractor Name</Label>
                <Input
                  id="contractorName"
                  value={previewData.contractorName}
                  onChange={(e) => setPreviewData({ ...previewData, contractorName: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="scopeOfWork">Permitted Scope of Work</Label>
                <Textarea
                  id="scopeOfWork"
                  value={previewData.scopeOfWork}
                  onChange={(e) => setPreviewData({ ...previewData, scopeOfWork: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="inspectedProducts">Inspected Products</Label>
                <Textarea
                  id="inspectedProducts"
                  value={previewData.inspectedProducts}
                  onChange={(e) => setPreviewData({ ...previewData, inspectedProducts: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buildingCode">Building Code</Label>
                  <Input
                    id="buildingCode"
                    value={previewData.buildingCode}
                    onChange={(e) => setPreviewData({ ...previewData, buildingCode: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="codeYear">Code Year</Label>
                  <Input
                    id="codeYear"
                    value={previewData.codeYear}
                    onChange={(e) => setPreviewData({ ...previewData, codeYear: e.target.value })}
                  />
                </div>
              </div>

              {certificationType === "as_built" && (
                <div>
                  <Label htmlFor="fieldChanges">Field Changes (As-Built Conditions)</Label>
                  <Textarea
                    id="fieldChanges"
                    value={previewData.fieldChanges || ""}
                    onChange={(e) => setPreviewData({ ...previewData, fieldChanges: e.target.value })}
                    rows={3}
                    className="bg-yellow-50"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(certificationType === "as_built" ? "field_changes" : "select")}>
                Back
              </Button>
              <Button onClick={handleGenerate}>
                Generate Final Certification
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "generating" && (
          <>
            <DialogHeader>
              <DialogTitle>Generating Certification</DialogTitle>
              <DialogDescription>
                Please wait while we generate your certification document...
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                {previewData ? "Creating final certification document" : "Parsing project documents and generating preview"}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

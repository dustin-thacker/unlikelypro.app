import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VerifyProject() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.id || "0");

  const [propertyOwnerName, setPropertyOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [permitNumber, setPermitNumber] = useState("");
  const [datePermitIssued, setDatePermitIssued] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [subdivision, setSubdivision] = useState("");
  const [lot, setLot] = useState("");
  const [block, setBlock] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionComplete, setExtractionComplete] = useState(false);

  const { data: projectDetails, isLoading } = trpc.projects.getWithDetails.useQuery({ projectId });
  const extractData = trpc.attachments.extractData.useMutation();
  const verifyData = trpc.extractedData.verify.useMutation();

  useEffect(() => {
    if (projectDetails?.project) {
      setPropertyOwnerName(projectDetails.project.propertyOwnerName || "");
      setAddress(projectDetails.project.address || "");
      setJurisdiction(projectDetails.project.jurisdiction || "");
      setPermitNumber(projectDetails.project.permitNumber || "");
      setDatePermitIssued(projectDetails.project.datePermitIssued ? new Date(projectDetails.project.datePermitIssued).toISOString().split('T')[0] : "");
      setContractorName(projectDetails.project.contractorName || "");
      setSubdivision(projectDetails.project.subdivision || "");
      setLot(projectDetails.project.lot || "");
      setBlock(projectDetails.project.block || "");
      setScopeOfWork(projectDetails.project.scopeOfWork || "");
    }
  }, [projectDetails]);

  const handleExtractData = async () => {
    if (!projectDetails?.attachments || projectDetails.attachments.length === 0) {
      toast.error("No attachments found to extract data from");
      return;
    }

    setIsExtracting(true);

    try {
      // Extract data from all attachments
      const extractionPromises = projectDetails.attachments.map(attachment =>
        extractData.mutateAsync({
          projectId,
          attachmentId: attachment.id,
        })
      );

      const results = await Promise.all(extractionPromises);

      // Merge results and update form fields
      const mergedData = results.reduce((acc, result) => {
        if (result.extractedData.propertyOwnerName && !acc.propertyOwnerName) {
          acc.propertyOwnerName = result.extractedData.propertyOwnerName;
        }
        if (result.extractedData.address && !acc.address) {
          acc.address = result.extractedData.address;
        }
        if (result.extractedData.jurisdiction && !acc.jurisdiction) {
          acc.jurisdiction = result.extractedData.jurisdiction;
        }
        if (result.extractedData.permitNumber && !acc.permitNumber) {
          acc.permitNumber = result.extractedData.permitNumber;
        }
        if (result.extractedData.datePermitIssued && !acc.datePermitIssued) {
          acc.datePermitIssued = result.extractedData.datePermitIssued;
        }
        if (result.extractedData.contractorName && !acc.contractorName) {
          acc.contractorName = result.extractedData.contractorName;
        }
        if (result.extractedData.subdivision && !acc.subdivision) {
          acc.subdivision = result.extractedData.subdivision;
        }
        if (result.extractedData.lot && !acc.lot) {
          acc.lot = result.extractedData.lot;
        }
        if (result.extractedData.block && !acc.block) {
          acc.block = result.extractedData.block;
        }
        if (result.extractedData.scopeOfWork) {
          acc.scopeOfWork = acc.scopeOfWork
            ? `${acc.scopeOfWork}\n\n${result.extractedData.scopeOfWork}`
            : result.extractedData.scopeOfWork;
        }
        return acc;
      }, { propertyOwnerName: "", address: "", jurisdiction: "", permitNumber: "", datePermitIssued: "", contractorName: "", subdivision: "", lot: "", block: "", scopeOfWork: "" });

      setPropertyOwnerName(mergedData.propertyOwnerName || propertyOwnerName);
      setAddress(mergedData.address || address);
      setJurisdiction(mergedData.jurisdiction || jurisdiction);
      setPermitNumber(mergedData.permitNumber || permitNumber);
      setDatePermitIssued(mergedData.datePermitIssued || datePermitIssued);
      setContractorName(mergedData.contractorName || contractorName);
      setSubdivision(mergedData.subdivision || subdivision);
      setLot(mergedData.lot || lot);
      setBlock(mergedData.block || block);
      setScopeOfWork(mergedData.scopeOfWork || scopeOfWork);

      setExtractionComplete(true);
      toast.success("Data extracted successfully! Please review and verify.");
    } catch (error) {
      console.error("Error extracting data:", error);
      toast.error("Failed to extract data. Please try again or enter manually.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleVerify = async () => {
    if (!address) {
      toast.error("Address is required");
      return;
    }

    try {
      // Get the first extracted data ID (or create a new one)
      const extractedDataList = projectDetails?.extractedData || [];
      const dataId = extractedDataList.length > 0 ? extractedDataList[0].id : 0;

      await verifyData.mutateAsync({
        dataId,
        projectId,
        propertyOwnerName: propertyOwnerName || undefined,
        address,
        jurisdiction: jurisdiction || undefined,
        permitNumber: permitNumber || undefined,
        datePermitIssued: datePermitIssued || undefined,
        contractorName: contractorName || undefined,
        subdivision: subdivision || undefined,
        lot: lot || undefined,
        block: block || undefined,
        scopeOfWork: scopeOfWork || undefined,
      });

      // Check if this is a post-construction project
      const isPostConstruction = projectDetails?.project?.isPostConstruction;

      if (isPostConstruction) {
        // Post-construction projects don't need scheduling - redirect to project list
        toast.success("Data verified successfully! Post-construction project submitted.");
        setLocation("/my-projects");
      } else {
        // Non-post-construction projects need inspection scheduling
        toast.success("Data verified successfully! Proceeding to schedule inspection...");
        setLocation(`/schedule-inspection/${projectId}`);
      }
    } catch (error) {
      console.error("Error verifying data:", error);
      toast.error("Failed to verify data. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="container max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Verify Project Data</CardTitle>
            <CardDescription>
              Review and verify the extracted information from your uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {projectDetails?.attachments && projectDetails.attachments.length > 0 && (
              <div className="space-y-3">
                <Label>Uploaded Documents</Label>
                <div className="space-y-2">
                  {projectDetails.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">{attachment.fileName}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        ({attachment.fileType})
                      </span>
                    </div>
                  ))}
                </div>

                {!extractionComplete && (
                  <Button
                    onClick={handleExtractData}
                    disabled={isExtracting}
                    className="w-full"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Extracting Data...
                      </>
                    ) : (
                      "Extract Data from Documents"
                    )}
                  </Button>
                )}

                {extractionComplete && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Data extraction complete! Please review the information below and make any necessary corrections.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {!projectDetails?.attachments || projectDetails.attachments.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No documents found. Please go back and upload plans or permits.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="propertyOwnerName">Property Owner Name</Label>
                <Input
                  id="propertyOwnerName"
                  value={propertyOwnerName}
                  onChange={(e) => setPropertyOwnerName(e.target.value)}
                  placeholder="Enter property owner name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address of Permitted Work *</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter the full address"
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jurisdiction">Jurisdiction</Label>
                  <Input
                    id="jurisdiction"
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    placeholder="e.g., Prince George's County"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permitNumber">Permit Number</Label>
                  <Input
                    id="permitNumber"
                    value={permitNumber}
                    onChange={(e) => setPermitNumber(e.target.value)}
                    placeholder="Enter permit number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="datePermitIssued">Date Permit Issued</Label>
                  <Input
                    id="datePermitIssued"
                    type="date"
                    value={datePermitIssued}
                    onChange={(e) => setDatePermitIssued(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractorName">Contractor Name</Label>
                  <Input
                    id="contractorName"
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    placeholder="Enter contractor name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subdivision">Subdivision</Label>
                  <Input
                    id="subdivision"
                    value={subdivision}
                    onChange={(e) => setSubdivision(e.target.value)}
                    placeholder="Subdivision name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lot">Lot</Label>
                  <Input
                    id="lot"
                    value={lot}
                    onChange={(e) => setLot(e.target.value)}
                    placeholder="Lot number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="block">Block</Label>
                  <Input
                    id="block"
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    placeholder="Block number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scopeOfWork">Scope of Work</Label>
                <Textarea
                  id="scopeOfWork"
                  value={scopeOfWork}
                  onChange={(e) => setScopeOfWork(e.target.value)}
                  placeholder="Describe the scope of work"
                  rows={6}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleVerify}
                disabled={!address || verifyData.isPending}
                className="flex-1"
              >
                {verifyData.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

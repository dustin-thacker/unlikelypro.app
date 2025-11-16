import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { PRODUCTS, type Product } from "@shared/productsAndServices";
import { calculateInspectionServices, type CalculatedService } from "@shared/pricingLogic";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function SchedulerVerifyProject() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const params = useParams();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.id || "");

  // Fetch project data
  const { data: project, isLoading: projectLoading } = trpc.projects.getById.useQuery(
    { projectId },
    { enabled: !isNaN(projectId) && isAuthenticated }
  );

  // Fetch extracted data
  const { data: extractedData, isLoading: extractionLoading } = trpc.extraction.getByProject.useQuery(
    { projectId },
    { enabled: !isNaN(projectId) && isAuthenticated }
  );

  // Form state
  const [propertyOwnerName, setPropertyOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [permitNumber, setPermitNumber] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [datePermitIssued, setDatePermitIssued] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [subdivision, setSubdivision] = useState("");
  const [lot, setLot] = useState("");
  const [block, setBlock] = useState("");

  // Product selection
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [calculatedServices, setCalculatedServices] = useState<CalculatedService[]>([]);

  // Workflow state
  const [isPostProduction, setIsPostProduction] = useState<string>("no");
  const [productionStartDate, setProductionStartDate] = useState("");
  const [productionEndDate, setProductionEndDate] = useState("");

  // Populate form when extracted data loads
  useEffect(() => {
    if (extractedData) {
      setPropertyOwnerName(extractedData.propertyOwnerName || "");
      setAddress(extractedData.address || "");
      setJurisdiction(extractedData.jurisdiction || "");
      setPermitNumber(extractedData.permitNumber || "");
      setScopeOfWork(extractedData.scopeOfWork || "");
      setDatePermitIssued(extractedData.datePermitIssued ? new Date(extractedData.datePermitIssued).toISOString().split('T')[0] : "");
      setContractorName(extractedData.contractorName || "");
      setSubdivision(extractedData.subdivision || "");
      setLot(extractedData.lot || "");
      setBlock(extractedData.block || "");
      
      // Set initially detected products
      if (extractedData.detectedProductIds) {
        try {
          const productIds = JSON.parse(extractedData.detectedProductIds);
          if (Array.isArray(productIds) && productIds.length > 0) {
            setSelectedProducts(productIds);
          }
        } catch (e) {
          console.error('Failed to parse detectedProductIds:', e);
        }
      }
    }
  }, [extractedData]);

  // Recalculate services when products change
  useEffect(() => {
    if (selectedProducts.length > 0) {
      const services = calculateInspectionServices(selectedProducts);
      setCalculatedServices(services);
    } else {
      setCalculatedServices([]);
    }
  }, [selectedProducts]);

  const verifyMutation = trpc.projects.verify.useMutation({
    onSuccess: () => {
      toast.success("Project verified successfully!");
      
      // Check if any services require production days (CSI)
      const requiresProductionDays = calculatedServices.some(s => s.requiresProductionDays);
      
      if (isPostProduction === "yes" && requiresProductionDays) {
        // Post-production with CSI products - stay on this page to enter production dates
        // (handled by conditional rendering below)
      } else if (isPostProduction === "no") {
        // In-production - redirect to scheduling
        setLocation(`/scheduler/schedule/${projectId}`);
      } else {
        // Post-production without CSI or production dates entered - go to project list
        setLocation("/scheduler/projects");
      }
    },
    onError: (error: any) => {
      toast.error(`Verification failed: ${error.message}`);
    }
  });

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleVerify = () => {
    if (!propertyOwnerName || !address || !permitNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    verifyMutation.mutate({
      projectId,
      propertyOwnerName,
      address,
      jurisdiction,
      permitNumber,
      scopeOfWork,
      datePermitIssued: datePermitIssued || undefined,
      contractorName: contractorName || undefined,
      subdivision: subdivision || undefined,
      lot: lot || undefined,
      block: block || undefined,
      detectedProductIds: selectedProducts,
      isPostProduction: isPostProduction === "yes",
      productionStartDate: productionStartDate || undefined,
      productionEndDate: productionEndDate || undefined,
    });
  };

  // Get all products as flat array
  const allProducts: Product[] = Object.values(PRODUCTS).flat();

  if (authLoading || projectLoading || extractionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "client_scheduler") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be logged in as a client scheduler to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isNaN(projectId) || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Project Not Found</CardTitle>
            <CardDescription>The requested project does not exist.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const requiresProductionDays = calculatedServices.some(s => s.requiresProductionDays);
  const showProductionDateFields = isPostProduction === "yes" && requiresProductionDays;

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Verify Project Information</CardTitle>
          <CardDescription>
            Review the extracted data, adjust products as needed, and confirm project details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Extracted Data Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Extracted Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="propertyOwnerName">Property Owner Name *</Label>
                <Input
                  id="propertyOwnerName"
                  value={propertyOwnerName}
                  onChange={(e) => setPropertyOwnerName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Address of Permitted Work *</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="jurisdiction">Jurisdiction</Label>
                <Input
                  id="jurisdiction"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="permitNumber">Permit Number *</Label>
                <Input
                  id="permitNumber"
                  value={permitNumber}
                  onChange={(e) => setPermitNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="datePermitIssued">Date Permit Issued</Label>
                <Input
                  id="datePermitIssued"
                  type="date"
                  value={datePermitIssued}
                  onChange={(e) => setDatePermitIssued(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="contractorName">Contractor Name</Label>
                <Input
                  id="contractorName"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="subdivision">Subdivision</Label>
                <Input
                  id="subdivision"
                  value={subdivision}
                  onChange={(e) => setSubdivision(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="lot">Lot</Label>
                <Input
                  id="lot"
                  value={lot}
                  onChange={(e) => setLot(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="block">Block</Label>
                <Input
                  id="block"
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="scopeOfWork">Scope of Work</Label>
              <textarea
                id="scopeOfWork"
                className="w-full min-h-[100px] p-2 border rounded-md"
                value={scopeOfWork}
                onChange={(e) => setScopeOfWork(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Product Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Products Being Installed</h3>
              <span className="text-sm text-muted-foreground">
                ({selectedProducts.length} selected)
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Check or uncheck products to match what's actually being installed
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-4 border rounded-md">
              {allProducts.map((product) => (
                <div key={product.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={product.id}
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={() => handleProductToggle(product.id)}
                  />
                  <Label htmlFor={product.id} className="cursor-pointer">
                    {product.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Calculated Services Section */}
          {calculatedServices.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold">Inspection Services Required</h3>
              </div>

              <div className="space-y-3">
                {calculatedServices.map((service, idx) => (
                  <Card key={idx} className="bg-muted/30">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-semibold">{service.serviceName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Category: {service.category === 'TPI' ? 'Third-Party Inspection' : 
                                      service.category === 'CSI' ? 'Continuous Special Inspection' : 
                                      'Periodic Special Inspection'}
                          </p>
                          <p className="text-xs text-muted-foreground">{service.notes}</p>
                          <div className="text-xs text-muted-foreground mt-2">
                            <strong>Products:</strong> {service.products.map(pid => {
                              const p = allProducts.find(prod => prod.id === pid);
                              return p?.name;
                            }).join(', ')}
                          </div>
                        </div>
                        {service.requiresProductionDays && (
                          <div className="flex items-center gap-1 text-amber-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs">Requires production days</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Production Status Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Project Status</h3>
            
            <RadioGroup value={isPostProduction} onValueChange={setIsPostProduction}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="in-production" />
                <Label htmlFor="in-production" className="cursor-pointer">
                  In-Production (work not yet started or in progress)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="post-production" />
                <Label htmlFor="post-production" className="cursor-pointer">
                  Post-Production (work already completed)
                </Label>
              </div>
            </RadioGroup>

            {showProductionDateFields && (
              <Card className="bg-blue-50 dark:bg-blue-950/20">
                <CardContent className="pt-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This project includes Continuous Special Inspection products. Please specify the production date range.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="productionStartDate">Production Start Date *</Label>
                      <Input
                        id="productionStartDate"
                        type="date"
                        value={productionStartDate}
                        onChange={(e) => setProductionStartDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="productionEndDate">Production End Date *</Label>
                      <Input
                        id="productionEndDate"
                        type="date"
                        value={productionEndDate}
                        onChange={(e) => setProductionEndDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        min={productionStartDate}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/scheduler/projects")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Verify and Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

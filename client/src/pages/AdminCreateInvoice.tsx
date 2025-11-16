import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { calculateInspectionServices } from "@shared/pricingLogic";

export default function AdminCreateInvoice() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const projectId = params.projectId ? parseInt(params.projectId) : undefined;

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [lineItems, setLineItems] = useState<Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>>([]);
  const [tax, setTax] = useState(0);

  const { data: project } = trpc.projects.getById.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const createInvoiceMutation = trpc.invoices.create.useMutation({
    onSuccess: () => {
      toast.success("Invoice created successfully");
      setLocation("/admin/invoices");
    },
    onError: (error) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    },
  });

  // Auto-generate line items from project data
  useEffect(() => {
    if (project && (project as any).detectedProductIds) {
      try {
        const productIds = JSON.parse((project as any).detectedProductIds as string) as string[];
        const services = calculateInspectionServices(productIds);
        
        const items = services.map(service => ({
          description: `${service.serviceName} - ${service.products.join(', ')}${service.notes ? ' (' + service.notes + ')' : ''}`,
          quantity: 1,
          unitPrice: Math.round(service.basePrice * 100), // Convert to cents
        }));
        
        setLineItems(items);
        
        // Generate invoice number
        const invoiceNum = `INV-${project.id}-${Date.now().toString().slice(-6)}`;
        setInvoiceNumber(invoiceNum);
        
        // Set due date to 30 days from now
        const due = new Date();
        due.setDate(due.getDate() + 30);
        setDueDate(due.toISOString().split("T")[0]);
      } catch (error) {
        console.error("Error generating line items:", error);
      }
    }
  }, [project]);

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = subtotal + tax;

  const handleSubmit = () => {
    if (!projectId) {
      toast.error("Project ID is required");
      return;
    }

    if (!invoiceNumber) {
      toast.error("Invoice number is required");
      return;
    }

    if (lineItems.length === 0) {
      toast.error("At least one line item is required");
      return;
    }

    createInvoiceMutation.mutate({
      projectId,
      invoiceNumber,
      lineItems,
      tax,
      issuedDate,
      dueDate,
    });
  };

  if (!projectId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Project ID is required to create an invoice
            </p>
            <Button
              variant="outline"
              className="mt-4 mx-auto block"
              onClick={() => setLocation("/admin")}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        onClick={() => setLocation("/admin/invoices")}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Invoices
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number *</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-001"
              />
            </div>
            <div>
              <Label htmlFor="projectInfo">Project</Label>
              <Input
                id="projectInfo"
                value={project ? `${project.clientName} - ${project.address}` : "Loading..."}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="issuedDate">Issued Date *</Label>
              <Input
                id="issuedDate"
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <Label>Line Items</Label>
              <Button variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-24">Quantity</TableHead>
                  <TableHead className="w-32">Unit Price ($)</TableHead>
                  <TableHead className="w-32">Total</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateLineItem(index, "description", e.target.value)}
                        placeholder="Service description"
                        rows={2}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, "quantity", parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={(item.unitPrice / 100).toFixed(2)}
                        onChange={(e) => updateLineItem(index, "unitPrice", Math.round(parseFloat(e.target.value) * 100) || 0)}
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      ${((item.quantity * item.unitPrice) / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {lineItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No line items added. Click "Add Item" to create invoice items.
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">${(subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <Label htmlFor="tax">Tax ($):</Label>
                <Input
                  id="tax"
                  type="number"
                  value={(tax / 100).toFixed(2)}
                  onChange={(e) => setTax(Math.round(parseFloat(e.target.value) * 100) || 0)}
                  className="w-32"
                  step="0.01"
                />
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${(total / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/admin/invoices")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createInvoiceMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, Loader2, MapPin, User, Hash, Calendar } from "lucide-react";
import EmailDeliveryHistory from "@/components/EmailDeliveryHistory";
import { format } from "date-fns";
import { toast } from "sonner";

export default function APInvoiceDetail() {
  const [, params] = useRoute("/ap/invoices/:id");
  const [, setLocation] = useLocation();
  const invoiceId = params?.id ? parseInt(params.id) : NaN;

  // Validate invoiceId
  if (isNaN(invoiceId)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-600">Invalid invoice ID</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setLocation("/ap")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fetch invoice details
  const { data, isLoading } = trpc.invoices.getDetails.useQuery(
    { invoiceId },
    { enabled: !isNaN(invoiceId) }
  );

  // PDF generation mutation
  const generatePDFMutation = trpc.invoices.generatePDF.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob and download
      const byteCharacters = atob(data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice PDF downloaded successfully');
    },
    onError: (error) => {
      toast.error(`Failed to generate PDF: ${error.message}`);
    },
  });

  const handleDownloadPDF = () => {
    generatePDFMutation.mutate({ invoiceId });
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-500";
      case "sent":
        return "bg-blue-500";
      case "paid":
        return "bg-green-500";
      case "overdue":
        return "bg-red-500";
      case "cancelled":
        return "bg-gray-400";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.invoice) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-600">Invoice not found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setLocation("/ap")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { invoice, lineItems } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/ap")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Invoice {invoice.invoiceNumber}</h1>
              <p className="text-muted-foreground">Invoice details and line items</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status}
            </Badge>
            <Button
              onClick={handleDownloadPDF}
              disabled={generatePDFMutation.isPending}
            >
              {generatePDFMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle>Line Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Totals */}
                <div className="mt-6 space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax:</span>
                      <span className="font-medium">{formatCurrency(invoice.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Invoice Info */}
          <div className="space-y-6">
            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Important Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoice.issuedDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Issued</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(invoice.issuedDate), "MMMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                )}
                {invoice.dueDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Due Date</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(invoice.dueDate), "MMMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                )}
                {invoice.paidDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-green-600">Paid</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(invoice.paidDate), "MMMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Hash className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Project ID</div>
                    <div className="text-sm text-muted-foreground">
                      #{invoice.projectId}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Email Delivery History */}
        <div className="mt-6">
          <EmailDeliveryHistory invoiceId={invoiceId} />
        </div>
      </div>
    </div>
  );
}

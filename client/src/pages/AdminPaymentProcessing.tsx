import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, Mail, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function AdminPaymentProcessing() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{
    matched: Array<{ invoiceNumber: string; invoiceId: number; amount?: string }>;
    unmatched: Array<{ invoiceNumber: string; emailSubject: string; amount?: string }>;
    totalProcessed: number;
  } | null>(null);

  const processPaymentsMutation = trpc.invoices.processPayments.useMutation({
    onSuccess: (data) => {
      setResults(data);
      setProcessing(false);
      toast.success(`Processed ${data.totalProcessed} payment emails. ${data.matched.length} invoices updated.`);
    },
    onError: (error) => {
      setProcessing(false);
      toast.error(`Failed to process payments: ${error.message}`);
    },
  });

  const handleProcessPayments = () => {
    setProcessing(true);
    setResults(null);
    processPaymentsMutation.mutate();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Processing</h1>
          <p className="text-muted-foreground mt-2">
            Automatically process payment emails and update invoice status
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Check for Payments</CardTitle>
            <CardDescription>
              Search your email inbox for payment confirmations and automatically mark invoices as paid
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleProcessPayments}
              disabled={processing}
              size="lg"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Processing Payments...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  Check for Payments
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              This will search for emails with subjects containing "EFT Payment" or "Remittance" and automatically
              update matching invoices to paid status.
            </p>
          </CardContent>
        </Card>

        {results && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Matched Invoices
                </CardTitle>
                <CardDescription>
                  {results.matched.length} invoice{results.matched.length !== 1 ? 's' : ''} automatically marked as paid
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.matched.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No invoices were matched</p>
                ) : (
                  <div className="space-y-3">
                    {results.matched.map((match, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Invoice {match.invoiceNumber}</p>
                          {match.amount && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {match.amount}
                            </p>
                          )}
                        </div>
                        <Badge variant="default" className="bg-green-600">
                          Paid
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-orange-600" />
                  Unmatched Payments
                </CardTitle>
                <CardDescription>
                  {results.unmatched.length} payment{results.unmatched.length !== 1 ? 's' : ''} could not be matched to invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.unmatched.length === 0 ? (
                  <p className="text-sm text-muted-foreground">All payments were successfully matched</p>
                ) : (
                  <div className="space-y-3">
                    {results.unmatched.map((unmatch, index) => (
                      <div key={index} className="p-3 border rounded-lg border-orange-200 bg-orange-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {unmatch.invoiceNumber === 'UNKNOWN' ? 'No invoice number found' : `Invoice ${unmatch.invoiceNumber}`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {unmatch.emailSubject}
                            </p>
                            {unmatch.amount && (
                              <p className="text-sm font-medium mt-1 flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {unmatch.amount}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="border-orange-600 text-orange-600">
                            Manual Review
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Processing Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold">{results.totalProcessed}</p>
                  <p className="text-sm text-muted-foreground">Emails Processed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-600">{results.matched.length}</p>
                  <p className="text-sm text-muted-foreground">Invoices Paid</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-orange-600">{results.unmatched.length}</p>
                  <p className="text-sm text-muted-foreground">Needs Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

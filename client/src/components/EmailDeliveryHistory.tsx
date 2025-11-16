import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, XCircle, Clock, User, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface EmailDeliveryHistoryProps {
  invoiceId: number;
}

export default function EmailDeliveryHistory({ invoiceId }: EmailDeliveryHistoryProps) {
  const [retrying, setRetrying] = useState(false);
  const { data: emailLogs, isLoading, refetch } = trpc.invoices.getEmailLogs.useQuery({ invoiceId });
  
  const retryEmailMutation = trpc.invoices.retryEmail.useMutation({
    onSuccess: () => {
      toast.success("Invoice email resent successfully");
      refetch();
      setRetrying(false);
    },
    onError: (error) => {
      toast.error(`Failed to resend email: ${error.message}`);
      refetch(); // Refresh to show the failed retry log
      setRetrying(false);
    },
  });
  
  const handleRetry = async () => {
    setRetrying(true);
    retryEmailMutation.mutate({ invoiceId });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Mail className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Delivery History
          </CardTitle>
          <CardDescription>Loading email delivery logs...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!emailLogs || emailLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Delivery History
          </CardTitle>
          <CardDescription>No emails have been sent for this invoice yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Delivery History
            </CardTitle>
            <CardDescription>
              Track when invoice emails were sent and their delivery status
            </CardDescription>
          </div>
          <Button
            onClick={handleRetry}
            disabled={retrying}
            variant="outline"
            size="sm"
          >
            {retrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Resending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend Invoice
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {emailLogs.map((log) => {
            const recipients = JSON.parse(log.recipients) as string[];
            
            return (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 border rounded-lg bg-slate-50"
              >
                <div className="mt-1">{getStatusIcon(log.status)}</div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(log.status)}
                      <span className="text-sm text-slate-600">
                        {format(new Date(log.sentAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-700">Recipients:</span>
                      <span className="text-slate-600">{recipients.join(", ")}</span>
                    </div>
                    
                    {log.sentByName && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700">Sent by:</span>
                        <span className="text-slate-600">{log.sentByName}</span>
                      </div>
                    )}
                    
                    {log.errorMessage && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <span className="font-medium">Error:</span> {log.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {emailLogs.length > 0 && (
          <div className="mt-4 pt-4 border-t text-sm text-slate-600">
            <p>
              <strong>Total deliveries:</strong> {emailLogs.length} |{" "}
              <strong>Successful:</strong> {emailLogs.filter(log => log.status === 'success').length} |{" "}
              <strong>Failed:</strong> {emailLogs.filter(log => log.status === 'failed').length}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

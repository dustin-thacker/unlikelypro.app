import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, FileText, DollarSign, Loader2, MoreVertical, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminInvoices() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch all invoices
  const { data: invoices, isLoading, refetch } = trpc.invoices.listAll.useQuery();

  // Status update mutation
  const updateStatusMutation = trpc.invoices.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Invoice status updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const handleStatusUpdate = (invoiceId: number, newStatus: string) => {
    updateStatusMutation.mutate({
      invoiceId,
      status: newStatus as any,
    });
  };

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

  const handleDownloadPDF = (invoiceId: number) => {
    generatePDFMutation.mutate({ invoiceId });
  };

  // Filter invoices based on search and status
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];

    return invoices.filter((invoice) => {
      // Status filter
      if (statusFilter !== "all" && invoice.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          invoice.invoiceNumber.toLowerCase().includes(query) ||
          invoice.clientName?.toLowerCase().includes(query) ||
          invoice.address?.toLowerCase().includes(query) ||
          invoice.propertyOwnerName?.toLowerCase().includes(query) ||
          invoice.customerNumber?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [invoices, searchQuery, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!invoices) {
      return {
        total: 0,
        pending: 0,
        paidThisMonth: 0,
        overdue: 0,
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return {
      total: invoices.length,
      pending: invoices
        .filter((inv) => inv.status === "sent")
        .reduce((sum, inv) => sum + inv.total, 0),
      paidThisMonth: invoices
        .filter((inv) => {
          if (inv.status !== "paid" || !inv.paidDate) return false;
          const paidDate = new Date(inv.paidDate);
          return (
            paidDate.getMonth() === currentMonth &&
            paidDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, inv) => sum + inv.total, 0),
      overdue: invoices
        .filter((inv) => inv.status === "overdue")
        .reduce((sum, inv) => sum + inv.total, 0),
    };
  }, [invoices]);

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

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-muted-foreground">
            Create and manage project invoices
          </p>
        </div>
        <Button onClick={() => setLocation("/admin/invoices/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
          setStatusFilter("all");
          setSearchQuery("");
        }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
          setStatusFilter("sent");
          setSearchQuery("");
        }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pending)}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
          setStatusFilter("paid");
          setSearchQuery("");
        }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.paidThisMonth)}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
          setStatusFilter("overdue");
          setSearchQuery("");
        }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by invoice number, client, or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "No invoices match your filters"
                  : "No invoices found"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setLocation("/admin/invoices/new")}
              >
                Create First Invoice
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.clientName}</div>
                        {invoice.customerNumber && (
                          <div className="text-sm text-muted-foreground">
                            #{invoice.customerNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.propertyOwnerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.address}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invoice.issuedDate
                        ? format(new Date(invoice.issuedDate), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {invoice.dueDate
                        ? format(new Date(invoice.dueDate), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setLocation(`/admin/invoices/${invoice.id}`)
                              }
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPDF(invoice.id);
                              }}
                              disabled={generatePDFMutation.isPending}
                            >
                              {generatePDFMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(invoice.id, "draft")}
                                  disabled={invoice.status === "draft"}
                                >
                                  Mark as Draft
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(invoice.id, "sent")}
                                  disabled={invoice.status === "sent"}
                                >
                                  Mark as Sent
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(invoice.id, "paid")}
                                  disabled={invoice.status === "paid"}
                                >
                                  Mark as Paid
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(invoice.id, "overdue")}
                                  disabled={invoice.status === "overdue"}
                                >
                                  Mark as Overdue
                                </DropdownMenuItem>

                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

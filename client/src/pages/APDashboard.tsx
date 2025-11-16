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
import { Search, FileText, DollarSign, Loader2, Download, TrendingUp, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function APDashboard() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch invoices (automatically filtered by branch for AP users)
  const { data: invoices, isLoading } = trpc.invoices.listAll.useQuery();

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
          invoice.address?.toLowerCase().includes(query) ||
          invoice.propertyOwnerName?.toLowerCase().includes(query) ||
          invoice.customerNumber?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [invoices, searchQuery, statusFilter]);

  // Calculate financial stats
  const stats = useMemo(() => {
    if (!invoices) {
      return {
        total: 0,
        totalRevenue: 0,
        pending: 0,
        pendingAmount: 0,
        paidThisMonth: 0,
        paidThisMonthAmount: 0,
        overdue: 0,
        overdueAmount: 0,
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const pendingInvoices = invoices.filter((inv) => inv.status === "sent");
    const paidThisMonthInvoices = invoices.filter((inv) => {
      if (inv.status !== "paid" || !inv.paidDate) return false;
      const paidDate = new Date(inv.paidDate);
      return (
        paidDate.getMonth() === currentMonth &&
        paidDate.getFullYear() === currentYear
      );
    });
    const overdueInvoices = invoices.filter((inv) => inv.status === "overdue");

    return {
      total: invoices.length,
      totalRevenue,
      pending: pendingInvoices.length,
      pendingAmount: pendingInvoices.reduce((sum, inv) => sum + inv.total, 0),
      paidThisMonth: paidThisMonthInvoices.length,
      paidThisMonthAmount: paidThisMonthInvoices.reduce((sum, inv) => sum + inv.total, 0),
      overdue: overdueInvoices.length,
      overdueAmount: overdueInvoices.reduce((sum, inv) => sum + inv.total, 0),
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
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">AP Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Financial overview and invoice management for your branch
          </p>
        </div>

        {/* Financial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total} total invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.pendingAmount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pending} pending invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.paidThisMonthAmount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.paidThisMonth} invoices paid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.overdueAmount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.overdue} overdue invoices
              </p>
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
                  placeholder="Search by invoice number, property owner, or address..."
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
            <CardTitle>Branch Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? "No invoices match your filters"
                    : "No invoices found for your branch"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Property Owner</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Customer #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>{invoice.propertyOwnerName}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={invoice.address || ""}>
                            {invoice.address}
                          </div>
                        </TableCell>
                        <TableCell>
                          {invoice.customerNumber || "-"}
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
                          {invoice.paidDate
                            ? format(new Date(invoice.paidDate), "MMM d, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setLocation(`/ap/invoices/${invoice.id}`)
                              }
                            >
                              View
                            </Button>
                            {invoice.pdfUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(invoice.pdfUrl!, "_blank")}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

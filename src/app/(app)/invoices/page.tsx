
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function InvoicesPage() {
  const invoices: any[] = [];

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                  <CardTitle>Recent Invoices</CardTitle>
                  <CardDescription>A list of your most recent invoices.</CardDescription>
              </div>
              <div className="flex gap-2">
                  <Select>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Financial Year" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="2026">2026-2027</SelectItem>
                          <SelectItem value="2025">2025-2026</SelectItem>
                          <SelectItem value="2024">2024-2025</SelectItem>
                          <SelectItem value="2023">2023-2024</SelectItem>
                      </SelectContent>
                  </Select>
                  <Select>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="4">April</SelectItem>
                          <SelectItem value="5">May</SelectItem>
                          <SelectItem value="6">June</SelectItem>
                          <SelectItem value="7">July</SelectItem>
                          <SelectItem value="8">August</SelectItem>
                          <SelectItem value="9">September</SelectItem>
                          <SelectItem value="10">October</SelectItem>
                          <SelectItem value="11">November</SelectItem>
                          <SelectItem value="12">December</SelectItem>
                          <SelectItem value="1">January</SelectItem>
                          <SelectItem value="2">February</SelectItem>
                          <SelectItem value="3">March</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices && invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.client}</TableCell>
                      <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(invoice.status) as any}>{invoice.status}</Badge>
                      </TableCell>
                      <TableCell>{invoice.date}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No data to display.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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

export default function InvoicesPage() {
  const invoices = [
    { id: 'INV001', client: 'Innovate Inc.', amount: 2500, status: 'Paid', date: '2023-01-15' },
    { id: 'INV002', client: 'Solutions Co.', amount: 1800, status: 'Pending', date: '2023-02-20' },
    { id: 'INV003', client: 'Tech Gadgets', amount: 3200, status: 'Paid', date: '2023-03-10' },
    { id: 'INV004', client: 'Global Exports', amount: 800, status: 'Overdue', date: '2023-04-05' },
    { id: 'INV005', client: 'Market Makers', amount: 4500, status: 'Pending', date: '2023-05-12' },
  ];

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
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>A list of your most recent invoices.</CardDescription>
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
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.client}</TableCell>
                    <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(invoice.status) as any}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell>{invoice.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

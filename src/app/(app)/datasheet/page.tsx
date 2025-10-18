"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DatasheetPage() {
  const data = [
    { id: 'DS001', client: 'Innovate Inc.', amount: 2500, status: 'Paid', date: '2023-01-15' },
    { id: 'DS002', client: 'Solutions Co.', amount: 1800, status: 'Pending', date: '2023-02-20' },
    { id: 'DS003', client: 'Tech Gadgets', amount: 3200, status: 'Paid', date: '2023-03-10' },
    { id: 'DS004', client: 'Global Exports', amount: 800, status: 'Overdue', date: '2023-04-05' },
    { id: 'DS005', client: 'Market Makers', amount: 4500, status: 'Pending', date: '2023-05-12' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Datasheet</h1>
      <Card>
        <CardHeader>
          <CardTitle>Financial Data</CardTitle>
          <CardDescription>A detailed view of your financial datasheet.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.client}</TableCell>
                    <TableCell>${item.amount.toLocaleString()}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>{item.date}</TableCell>
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

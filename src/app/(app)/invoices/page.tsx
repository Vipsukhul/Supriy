
"use client";

import { useState } from "react";
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

const financialYears = [
    { value: "2026", label: "2026-2027" },
    { value: "2025", label: "2025-2026" },
    { value: "2024", label: "2024-2025" },
    { value: "2023", label: "2023-2024" },
];

const getMonthsForYear = (startYear: number) => {
    const months = [];
    const endYear = startYear + 1;
    const monthNames = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    const monthNumbers = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

    for(let i=0; i<12; i++) {
        const month = monthNumbers[i];
        const year = month >= 4 ? startYear : endYear;
        const yearSuffix = year.toString().slice(-2);
        months.push({
            value: `${month}`,
            label: `${monthNames[i]}-${yearSuffix}`
        });
    }
    return months;
}

export default function InvoicesPage() {
  const invoices: any[] = [];
  const [financialYear, setFinancialYear] = useState<string>("");
  const [months, setMonths] = useState<{value: string, label: string}[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

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
  
  const handleYearChange = (year: string) => {
    setFinancialYear(year);
    setSelectedMonth("");
    if (year) {
        setMonths(getMonthsForYear(parseInt(year)));
    } else {
        setMonths([]);
    }
  }

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
                  <Select onValueChange={handleYearChange} value={financialYear}>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Financial Year" />
                      </SelectTrigger>
                      <SelectContent>
                          {financialYears.map(fy => (
                              <SelectItem key={fy.value} value={fy.value}>{fy.label}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  <Select onValueChange={setSelectedMonth} value={selectedMonth} disabled={!financialYear}>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                          {months.map(m => (
                              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
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

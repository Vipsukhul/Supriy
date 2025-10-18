
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

export default function DatasheetPage() {
  const data: any[] = [];
  const [financialYear, setFinancialYear] = useState<string>("");
  const [months, setMonths] = useState<{value: string, label: string}[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

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
      <h1 className="text-3xl font-bold tracking-tight">Datasheet</h1>
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <CardTitle>Financial Data</CardTitle>
                    <CardDescription>A detailed view of your financial datasheet.</CardDescription>
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
                  <TableHead>Data ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data && data.length > 0 ? (
                  data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.client}</TableCell>
                      <TableCell>${item.amount.toLocaleString()}</TableCell>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>{item.date}</TableCell>
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

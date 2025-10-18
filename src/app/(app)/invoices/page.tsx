
"use client";

import { useState, useMemo, Fragment } from "react";
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
import { useCollection, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { FinancialRecord, Customer, Invoice } from "@/models/data.model";
import { useMemoFirebase } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { InvoiceSummary, MonthlySummary } from "@/models/invoice-summary.model";

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
            label: `${monthNames[i]}-${yearSuffix}`,
            year: year,
            month: month,
        });
    }
    return months;
}

const calculateSummaries = (records: (FinancialRecord & {id: string})[], customersMap: Record<string, string>): MonthlySummary[] => {
    if (!records) return [];

    const summaryByPeriod: Record<string, InvoiceSummary> = {};

    records.forEach(record => {
        const periodLabel = `${new Date(record.year, record.month - 1).toLocaleString('default', { month: 'short' })}-${record.year.toString().slice(-2)}`;
        
        if (!summaryByPeriod[periodLabel]) {
            summaryByPeriod[periodLabel] = {
                period: periodLabel,
                currentMonthInvoicesCount: 0,
                previousMonthsInvoicesCount: 0, // Placeholder
                disputedInvoicesCount: 0,
                currentOutstanding: 0,
                recoveredOutstanding: 0, // Placeholder
                increasedOutstanding: 0, // Placeholder
                invoices: [],
            };
        }

        const summary = summaryByPeriod[periodLabel];
        
        record.invoices.forEach(invoice => {
            summary.currentMonthInvoicesCount += 1;
            summary.currentOutstanding += invoice.outstandingAmount;
            if (invoice.dispute === 'Yes') {
                summary.disputedInvoicesCount += 1;
            }
            summary.invoices.push({
                ...invoice,
                customerCode: record.customerCode,
                customerName: customersMap[record.customerCode] || 'Unknown',
            });
        });
    });

    return Object.values(summaryByPeriod).map(summary => ({
        ...summary,
        // More complex calculations would go here if we had historical data
        // For now, we are just showing the current month's data.
    }));
};

export default function InvoicesPage() {
  const firestore = useFirestore();
  const [financialYear, setFinancialYear] = useState<string>("");

  const financialRecordsCollectionRef = useMemoFirebase(() => collection(firestore, 'financialRecords'), [firestore]);
  const { data: records, isLoading: recordsLoading } = useCollection<FinancialRecord>(financialRecordsCollectionRef);
  
  const customersCollectionRef = useMemoFirebase(() => collection(firestore, 'customers'), [firestore]);
  const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersCollectionRef);

  const customersMap = useMemo(() => {
    if (!customers) return {};
    return customers.reduce((acc, customer) => {
        acc[customer.customerCode] = customer.customerName;
        return acc;
    }, {} as Record<string, string>);
  }, [customers]);

  const monthlySummaries = useMemo(() => {
    if (!records || !customers) return [];
    
    const filteredRecords = financialYear
        ? records.filter(r => {
            const startYear = parseInt(financialYear);
            const endYear = startYear + 1;
            return (r.year === startYear && r.month >= 4) || (r.year === endYear && r.month <= 3);
          })
        : records;

    return calculateSummaries(filteredRecords, customersMap);
  }, [records, customers, customersMap, financialYear]);

  const isLoading = recordsLoading || customersLoading;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Invoices Summary</h1>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                  <CardTitle>Monthly Overview</CardTitle>
                  <CardDescription>A summary of invoices by month.</CardDescription>
              </div>
              <div className="flex gap-2">
                  <Select onValueChange={setFinancialYear} value={financialYear}>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="All Financial Years" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="">All Financial Years</SelectItem>
                          {financialYears.map(fy => (
                              <SelectItem key={fy.value} value={fy.value}>{fy.label}</SelectItem>
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
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Current Month Invoices</TableHead>
                  <TableHead>Previous Months Invoices</TableHead>
                  <TableHead>Disputed Invoices</TableHead>
                  <TableHead>Current Outstanding</TableHead>
                  <TableHead>Recovered Outstanding</TableHead>
                  <TableHead>Increased Outstanding</TableHead>
                </TableRow>
              </TableHeader>
                {isLoading ? (
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                ) : monthlySummaries.length > 0 ? (
                    monthlySummaries.map((summary) => (
                    <Collapsible asChild key={summary.period}>
                        <TableBody>
                            <TableRow className="font-medium">
                                <TableCell>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <ChevronRight className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-90" />
                                        </Button>
                                    </CollapsibleTrigger>
                                </TableCell>
                                <TableCell>{summary.period}</TableCell>
                                <TableCell>{summary.currentMonthInvoicesCount}</TableCell>
                                <TableCell>{summary.previousMonthsInvoicesCount}</TableCell>
                                <TableCell>{summary.disputedInvoicesCount}</TableCell>
                                <TableCell>${summary.currentOutstanding.toLocaleString()}</TableCell>
                                <TableCell>${summary.recoveredOutstanding.toLocaleString()}</TableCell>
                                <TableCell>${summary.increasedOutstanding.toLocaleString()}</TableCell>
                            </TableRow>
                            <CollapsibleContent asChild>
                                <TableRow>
                                    <TableCell colSpan={8} className="p-0">
                                         <div className="p-4 bg-muted/50">
                                            <h4 className="font-semibold mb-2">Invoices for {summary.period}</h4>
                                             <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Customer Code</TableHead>
                                                        <TableHead>Invoice #</TableHead>
                                                        <TableHead>Invoice Amount</TableHead>
                                                        <TableHead>Outstanding Amount</TableHead>
                                                        <TableHead>Region</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {summary.invoices.map(invoice => (
                                                        <TableRow key={invoice.invoiceNumber}>
                                                            <TableCell>{invoice.customerCode}</TableCell>
                                                            <TableCell>{invoice.invoiceNumber}</TableCell>
                                                            <TableCell>${invoice.invoiceAmount.toLocaleString()}</TableCell>
                                                            <TableCell>${invoice.outstandingAmount.toLocaleString()}</TableCell>
                                                            <TableCell>{invoice.region}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                             </Table>
                                         </div>
                                    </TableCell>
                                </TableRow>
                            </CollapsibleContent>
                        </TableBody>
                     </Collapsible>
                    ))
                ) : (
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                            No data to display.
                            </TableCell>
                        </TableRow>
                    </TableBody>
                )}
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


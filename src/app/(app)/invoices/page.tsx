
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
import { ChevronRight, Loader2, Filter } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { InvoiceSummary, MonthlySummary, EnrichedInvoiceSummary } from "@/models/invoice-summary.model";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

const financialYears = Array.from({ length: 15 }, (_, i) => {
    const year = new Date().getFullYear() + 1 - i;
    return { value: `${year}`, label: `${year}-${year + 1}` };
});

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
        record.invoices.forEach(invoice => {
            const invoiceDate = new Date(invoice.invoiceDate);
            const periodLabel = `${invoiceDate.toLocaleString('default', { month: 'short' })}-${invoiceDate.getFullYear().toString().slice(-2)}`;
            
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
    
    return Object.values(summaryByPeriod).sort((a, b) => {
        const dateA = new Date(a.invoices[0].invoiceDate);
        const dateB = new Date(b.invoices[0].invoiceDate);
        return dateB.getTime() - dateA.getTime();
    });
};

export default function InvoicesPage() {
  const firestore = useFirestore();
  const [financialYear, setFinancialYear] = useState<string>("all");
  const [region, setRegion] = useState<string>("all");
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [previousMonth, setPreviousMonth] = useState<string>("");


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

  const availableRegions = useMemo(() => {
    if (!records) return [];
    const allRegions = new Set<string>();
    records.forEach(r => r.invoices.forEach(i => {
        if(i.region) allRegions.add(i.region);
    }));
    return Array.from(allRegions);
  }, [records]);
  
  const monthsForYear = useMemo(() => {
    return financialYear && financialYear !== 'all' ? getMonthsForYear(parseInt(financialYear)) : [];
  }, [financialYear]);

  const monthlySummaries = useMemo(() => {
    if (!records || !customers) return [];
    
    let filteredRecords = records;

    if (financialYear && financialYear !== 'all') {
        const startYear = parseInt(financialYear);
        const endYear = startYear + 1;
        filteredRecords = filteredRecords.filter(r => 
            (r.year === startYear && r.month >= 4) || (r.year === endYear && r.month <= 3)
        );
    }
    
    if (region && region !== 'all') {
        filteredRecords = filteredRecords.map(record => {
            const invoicesInRegion = record.invoices.filter(invoice => invoice.region === region);
            return { ...record, invoices: invoicesInRegion };
        }).filter(record => record.invoices.length > 0);
    }

    return calculateSummaries(filteredRecords, customersMap);
  }, [records, customers, customersMap, financialYear, region]);

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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Filters</h4>
                      <p className="text-sm text-muted-foreground">
                        Adjust the filters to refine the summary.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="financial-year">Financial Year</Label>
                        <div className="col-span-2">
                            <Select onValueChange={setFinancialYear} value={financialYear}>
                                <SelectTrigger id="financial-year" className="w-full">
                                    <SelectValue placeholder="All Financial Years" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Financial Years</SelectItem>
                                    {financialYears.map(fy => (
                                        <SelectItem key={fy.value} value={fy.value}>{fy.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="region">Region</Label>
                        <div className="col-span-2">
                            <Select onValueChange={setRegion} value={region}>
                                <SelectTrigger id="region" className="w-full">
                                    <SelectValue placeholder="All Regions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Regions</SelectItem>
                                    {availableRegions.map(r => (
                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="current-month">Current Month</Label>
                        <div className="col-span-2">
                            <Select onValueChange={setCurrentMonth} value={currentMonth} disabled={!financialYear || financialYear === 'all'}>
                                <SelectTrigger id="current-month" className="w-full">
                                    <SelectValue placeholder="Current Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {monthsForYear.map(m => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="previous-month">Previous Month</Label>
                        <div className="col-span-2">
                            <Select onValueChange={setPreviousMonth} value={previousMonth} disabled={!financialYear || financialYear === 'all'}>
                                <SelectTrigger id="previous-month" className="w-full">
                                    <SelectValue placeholder="Previous Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {monthsForYear.map(m => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
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
                                <TableRow className="font-medium bg-transparent hover:bg-muted/50">
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
                                            <div className="p-4 bg-muted/50 overflow-x-auto">
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
                                                        {summary.invoices.map((invoice: EnrichedInvoiceSummary) => (
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

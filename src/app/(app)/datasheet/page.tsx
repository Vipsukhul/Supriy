
"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where, doc, updateDoc, writeBatch } from "firebase/firestore";
import { FinancialRecord, Customer } from "@/models/data.model";
import type { CustomerData, EnrichedInvoice } from "@/models/view.model";
import { useMemoFirebase } from "@/firebase/provider";
import { differenceInDays } from 'date-fns';
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

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

const getAgingBucket = (invoiceDate: string): keyof CustomerData['aging'] => {
    if (!invoiceDate) return 'unclassified';
    const today = new Date();
    const date = new Date(invoiceDate);
    const days = differenceInDays(today, date);

    if (days <= 30) return 'days0_30';
    if (days <= 90) return 'days31_90';
    if (days <= 180) return 'days91_180';
    if (days <= 365) return 'days181_365';
    return 'above1Year';
};

export default function DatasheetPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [financialYear, setFinancialYear] = useState<string>("");
  const [months, setMonths] = useState<{value: string, label: string}[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const [customerData, setCustomerData] = useState<Record<string, CustomerData>>({});

  const financialRecordsQuery = useMemoFirebase(() => {
    if (!firestore || !financialYear || !selectedMonth) return null;
    const recordsRef = collection(firestore, "financialRecords");
    return query(
        recordsRef, 
        where("year", "==", parseInt(financialYear)), 
        where("month", "==", parseInt(selectedMonth))
    );
  }, [firestore, financialYear, selectedMonth]);

  const { data: records, isLoading: recordsLoading } = useCollection<FinancialRecord>(financialRecordsQuery);

  const customersCollectionRef = useMemoFirebase(() => collection(firestore, 'customers'), [firestore]);
  const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersCollectionRef);
  
  const customersMap = useMemo(() => {
    if (!customers) return {};
    return customers.reduce((acc, customer) => {
        acc[customer.customerCode] = customer.customerName;
        return acc;
    }, {} as Record<string, string>);
  }, [customers]);


  useEffect(() => {
    if (records) {
        const groupedByCustomer: Record<string, { recordId: string, data: FinancialRecord }[]> = {};

        records.forEach(record => {
            if (!groupedByCustomer[record.customerCode]) {
                groupedByCustomer[record.customerCode] = [];
            }
            groupedByCustomer[record.customerCode].push({ recordId: record.id, data: record });
        });

        const newCustomerData: Record<string, CustomerData> = {};
        
        for (const customerCode in groupedByCustomer) {
            const customerRecords = groupedByCustomer[customerCode];
            const firstRecord = customerRecords[0].data; // Use first record for remarks/notes

            newCustomerData[customerCode] = {
                customerCode,
                customerName: customersMap[customerCode] || 'Loading...',
                aging: { days0_30: 0, days31_90: 0, days91_180: 0, days181_365: 0, above1Year: 0, unclassified: 0 },
                invoices: [],
                remarks: firstRecord.remarks || 'None',
                notes: firstRecord.notes || '',
                recordId: customerRecords[0].recordId // Assuming one record per customer per month
            };

            customerRecords.forEach(({ data: record }) => {
                record.invoices.forEach(invoice => {
                    const bucket = getAgingBucket(invoice.invoiceDate);
                    newCustomerData[customerCode].aging[bucket] += invoice.outstandingAmount;
                    newCustomerData[customerCode].invoices.push({
                        ...invoice,
                        dispute: invoice.dispute || 'No',
                        note: invoice.note || '',
                    });
                });
            });
        }
        setCustomerData(newCustomerData);
    }
  }, [records, customersMap]);

  const handleYearChange = (year: string) => {
    setFinancialYear(year);
    setSelectedMonth("");
    setCustomerData({});
    if (year) {
        setMonths(getMonthsForYear(parseInt(year)));
    } else {
        setMonths([]);
    }
  }

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setCustomerData({});
  }

  const handleFieldChange = (customerCode: string, field: 'remarks' | 'notes', value: string) => {
      const customerInfo = customerData[customerCode];
      if (!customerInfo || !customerInfo.recordId) return;

      setCustomerData(prev => ({
          ...prev,
          [customerCode]: {
              ...prev[customerCode],
              [field]: value
          }
      }));

      const recordRef = doc(firestore, 'financialRecords', customerInfo.recordId);
      updateDocumentNonBlocking(recordRef, { [field]: value });
      
      toast({
          title: "Update Queued",
          description: `Customer ${field} has been updated.`,
      });
  }

  const handleInvoicesUpdate = async (customerCode: string, updatedInvoices: EnrichedInvoice[]) => {
      const customerInfo = customerData[customerCode];
      if (!customerInfo || !customerInfo.recordId) return;

      // Update local state first for immediate UI feedback
      setCustomerData(prev => ({
        ...prev,
        [customerCode]: {
            ...prev[customerCode],
            invoices: updatedInvoices
        }
      }));
      
      const recordRef = doc(firestore, 'financialRecords', customerInfo.recordId);

      // We need to update the entire invoices array.
      try {
        await updateDoc(recordRef, { invoices: updatedInvoices });
        toast({
            title: "Success",
            description: "Invoice details updated successfully.",
        });
      } catch (error: any) {
        console.error("Error updating invoices:", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not save invoice details. " + error.message,
        });
        // Optionally revert local state on failure
      }
  }

  const isLoading = recordsLoading || customersLoading;
  const displayData = useMemo(() => Object.values(customerData), [customerData]);

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
                    <Select onValueChange={handleMonthChange} value={selectedMonth} disabled={!financialYear}>
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
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Customer Code</TableHead>
                  <TableHead className="min-w-[150px]">Customer Name</TableHead>
                  <TableHead className="min-w-[120px]">0-30 Days</TableHead>
                  <TableHead className="min-w-[120px]">31-90 Days</TableHead>
                  <TableHead className="min-w-[120px]">91-180 Days</TableHead>
                  <TableHead className="min-w-[120px]">181-365 Days</TableHead>
                  <TableHead className="min-w-[120px]">Above 1 year</TableHead>
                  <TableHead className="min-w-[200px]">Remarks</TableHead>
                  <TableHead className="min-w-[250px]">Notes</TableHead>
                  <TableHead className="min-w-[150px]">Assigned to</TableHead>
                  <TableHead>View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : displayData && displayData.length > 0 ? (
                  displayData.map((item) => (
                    <TableRow key={item.customerCode}>
                      <TableCell className="font-medium">{item.customerCode}</TableCell>
                      <TableCell>{customersMap[item.customerCode] || item.customerName}</TableCell>
                      <TableCell>${item.aging.days0_30.toLocaleString()}</TableCell>
                      <TableCell>${item.aging.days31_90.toLocaleString()}</TableCell>
                      <TableCell>${item.aging.days91_180.toLocaleString()}</TableCell>
                      <TableCell>${item.aging.days181_365.toLocaleString()}</TableCell>
                      <TableCell>${item.aging.above1Year.toLocaleString()}</TableCell>
                      <TableCell>
                        <Select value={item.remarks} onValueChange={(value) => handleFieldChange(item.customerCode, 'remarks', value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Payment Received">Payment Received</SelectItem>
                                <SelectItem value="Partial Payment Received">Partial Payment Received</SelectItem>
                                <SelectItem value="Under Follow up">Under Follow up</SelectItem>
                                <SelectItem value="Dispute">Dispute</SelectItem>
                                <SelectItem value="None">None</SelectItem>
                            </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Textarea 
                            value={item.notes} 
                            onBlur={(e) => handleFieldChange(item.customerCode, 'notes', e.target.value)}
                            onChange={(e) => setCustomerData(prev => ({...prev, [item.customerCode]: {...prev[item.customerCode], notes: e.target.value}}))}
                            className="min-h-[60px]"
                        />
                      </TableCell>
                       <TableCell>
                        {/* Placeholder for Assigned to */}
                        N/A
                      </TableCell>
                      <TableCell>
                        <CustomerInvoicesDialog 
                            customer={item} 
                            onSave={handleInvoicesUpdate}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
                      No data to display. Select a financial year and month.
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

interface CustomerInvoicesDialogProps {
    customer: CustomerData;
    onSave: (customerCode: string, invoices: EnrichedInvoice[]) => Promise<void>;
}

function CustomerInvoicesDialog({ customer, onSave }: CustomerInvoicesDialogProps) {
    const [invoices, setInvoices] = useState<EnrichedInvoice[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setInvoices(JSON.parse(JSON.stringify(customer.invoices)));
        }
    }, [isOpen, customer.invoices]);


    const handleInvoiceChange = (invoiceNumber: string, field: 'dispute' | 'note', value: string) => {
        setInvoices(prev => prev.map(inv => 
            inv.invoiceNumber === invoiceNumber ? { ...inv, [field]: value } : inv
        ));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        await onSave(customer.customerCode, invoices);
        setIsSaving(false);
        setIsOpen(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Eye className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Invoices for {customer.customerName} ({customer.customerCode})</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Outstanding</TableHead>
                                <TableHead>Dispute</TableHead>
                                <TableHead>Note</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map(invoice => (
                                <TableRow key={invoice.invoiceNumber}>
                                    <TableCell>{invoice.invoiceNumber}</TableCell>
                                    <TableCell>{invoice.invoiceDate}</TableCell>
                                    <TableCell>${invoice.invoiceAmount.toLocaleString()}</TableCell>
                                    <TableCell>${invoice.outstandingAmount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Select value={invoice.dispute} onValueChange={(value) => handleInvoiceChange(invoice.invoiceNumber, 'dispute', value)}>
                                            <SelectTrigger className="w-[80px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                     <TableCell>
                                        <Textarea 
                                            value={invoice.note}
                                            onChange={(e) => handleInvoiceChange(invoice.invoiceNumber, 'note', e.target.value)}
                                            className="min-h-[40px] w-[200px]"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="pt-4 flex justify-end">
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

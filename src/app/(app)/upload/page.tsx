
"use client";

import { useState } from "react";
import { useFirestore } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  arrayUnion,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud } from 'lucide-react';
import type { Invoice, FinancialRecord, Customer } from "@/models/data.model";

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


export default function UploadPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for manual entry form
  const [financialYear, setFinancialYear] = useState("");
  const [month, setMonth] = useState("");
  const [months, setMonths] = useState<{value: string, label: string}[]>([]);

  const [customerCode, setCustomerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [outstandingAmount, setOutstandingAmount] = useState("");
  const [region, setRegion] = useState("");

  const handleYearChange = (year: string) => {
    setFinancialYear(year);
    setMonth("");
    if (year) {
        setMonths(getMonthsForYear(parseInt(year)));
    } else {
        setMonths([]);
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!financialYear || !month || !customerCode || !invoiceNumber || !invoiceDate || !invoiceAmount || !outstandingAmount) {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please fill out all required fields, including Financial Year and Month.",
        });
        setIsSubmitting(false);
        return;
    }

    try {
        const year = parseInt(financialYear);
        const monthNum = parseInt(month);

        const newInvoice: Omit<Invoice, 'id'> = {
            invoiceNumber,
            invoiceDate,
            invoiceAmount: parseFloat(invoiceAmount),
            outstandingAmount: parseFloat(outstandingAmount),
            region,
        };

        const financialRecordsRef = collection(firestore, "financialRecords");
        const q = query(
            financialRecordsRef,
            where("customerCode", "==", customerCode),
            where("year", "==", year),
            where("month", "==", monthNum)
        );

        const querySnapshot = await getDocs(q);
        const batch = writeBatch(firestore);

        if (querySnapshot.empty) {
            // No record for this customer this month, create a new one
            const newFinancialRecordRef = doc(financialRecordsRef);
            const newRecord: FinancialRecord = {
                customerCode,
                year: year,
                month: monthNum,
                invoices: [newInvoice],
            };
            batch.set(newFinancialRecordRef, newRecord);
        } else {
            // Record exists, update it
            const recordDoc = querySnapshot.docs[0];
            batch.update(recordDoc.ref, {
                invoices: arrayUnion(newInvoice)
            });
        }
        
        // Also create/update the customer document
        const customerRef = doc(firestore, "customers", customerCode);
        const customerData: Customer = { customerCode, customerName };
        batch.set(customerRef, customerData, { merge: true });

        await batch.commit();

        toast({
            title: "Success",
            description: "Invoice data saved successfully.",
        });

        // Reset form
        setFinancialYear('');
        setMonth('');
        setMonths([]);
        setCustomerCode('');
        setCustomerName('');
        setInvoiceNumber('');
        setInvoiceAmount('');
        setInvoiceDate('');
        setOutstandingAmount('');
        setRegion('');

    } catch (error: any) {
        console.error("Error saving manual entry: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: `Could not save data: ${error.message}`,
        });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Upload Data</h1>
      <Tabs defaultValue="manual-entry" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload-file">Upload Excel</TabsTrigger>
          <TabsTrigger value="manual-entry">Manual Entry</TabsTrigger>
        </TabsList>
        <TabsContent value="upload-file">
          <Card>
            <CardHeader>
              <CardTitle>Upload Excel File</CardTitle>
              <CardDescription>
                Select an Excel file from your computer to upload financial data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-center w-full">
                    <Label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted/50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">XLSX, XLS (MAX. 10MB)</p>
                        </div>
                        <Input id="file-upload" type="file" className="hidden" />
                    </Label>
                </div>
              <Button className="w-full">Upload File</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="manual-entry">
          <Card>
            <form onSubmit={handleManualSubmit}>
              <CardHeader>
                <CardTitle>Manual Data Entry</CardTitle>
                <CardDescription>
                  Enter the financial data manually using the form below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                        <Label>Financial Year</Label>
                        <Select onValueChange={handleYearChange} value={financialYear} disabled={isSubmitting}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                                {financialYears.map(fy => (
                                    <SelectItem key={fy.value} value={fy.value}>{fy.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                   </div>
                    <div className="space-y-2">
                        <Label>Month</Label>
                        <Select onValueChange={setMonth} value={month} disabled={isSubmitting || !financialYear}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-code">Customer Code</Label>
                    <Input id="customer-code" placeholder="Enter customer code" value={customerCode} onChange={(e) => setCustomerCode(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-name">Customer Name</Label>
                    <Input id="customer-name" placeholder="Enter customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice-number">Invoice Number</Label>
                    <Input id="invoice-number" placeholder="Enter unique invoice number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice-amount">Invoice Amount</Label>
                    <Input id="invoice-amount" type="number" placeholder="Enter invoice amount" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice-date">Invoice Date</Label>
                    <Input id="invoice-date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="outstanding-amount">Outstanding Amount</Label>
                    <Input id="outstanding-amount" type="number" placeholder="Enter outstanding amount" value={outstandingAmount} onChange={(e) => setOutstandingAmount(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input id="region" placeholder="Enter region" value={region} onChange={(e) => setRegion(e.target.value)} disabled={isSubmitting} />
                  </div>
                </div>
                <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Manual Entry'}
                </Button>
              </CardContent>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

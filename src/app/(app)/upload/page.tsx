
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
  serverTimestamp,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UploadCloud } from 'lucide-react';
import type { Invoice, FinancialRecord, Customer } from "@/models/data.model";

export default function UploadPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for manual entry form
  const [customerCode, setCustomerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [outstandingAmount, setOutstandingAmount] = useState("");
  const [region, setRegion] = useState("");

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!customerCode || !invoiceNumber || !invoiceDate || !invoiceAmount || !outstandingAmount) {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please fill out all required fields.",
        });
        setIsSubmitting(false);
        return;
    }

    try {
        const date = new Date(invoiceDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

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
            where("month", "==", month)
        );

        const querySnapshot = await getDocs(q);
        const batch = writeBatch(firestore);

        if (querySnapshot.empty) {
            // No record for this customer this month, create a new one
            const newFinancialRecordRef = doc(financialRecordsRef);
            const newRecord: FinancialRecord = {
                customerCode,
                year,
                month,
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

    
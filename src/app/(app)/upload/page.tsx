
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UploadCloud } from 'lucide-react';

export default function UploadPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Upload Data</h1>
      <Tabs defaultValue="upload-file" className="w-full">
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
                  <Input id="customer-code" placeholder="Enter customer code" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Customer Name</Label>
                  <Input id="customer-name" placeholder="Enter customer name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-number">Invoice Number</Label>
                  <Input id="invoice-number" placeholder="Enter unique invoice number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-amount">Invoice Amount</Label>
                  <Input id="invoice-amount" type="number" placeholder="Enter invoice amount" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-date">Invoice Date</Label>
                  <Input id="invoice-date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outstanding-amount">Outstanding Amount</Label>
                  <Input id="outstanding-amount" type="number" placeholder="Enter outstanding amount" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="region">Region</Label>
                  <Input id="region" placeholder="Enter region" />
                </div>
              </div>
              <Button className="w-full mt-4">Submit Manual Entry</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

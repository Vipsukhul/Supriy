
export interface Invoice {
    invoiceNumber: string;
    invoiceDate: string;
    invoiceAmount: number;
    outstandingAmount: number;
    region?: string;
}

export interface FinancialRecord {
    customerCode: string;
    year: number;
    month: number;
    invoices: Invoice[];
}

export interface Customer {
    customerCode: string;
    customerName: string;
}

    
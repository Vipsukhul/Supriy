
export interface Invoice {
    invoiceNumber: string;
    invoiceDate: string;
    invoiceAmount: number;
    outstandingAmount: number;
    region?: string;
    dispute?: 'Yes' | 'No';
    note?: string;
    status?: 'Paid' | 'Pending' | 'Overdue';
}

export interface FinancialRecord {
    customerCode: string;
    year: number;
    month: number;
    invoices: Invoice[];
    remarks?: 'Payment Received' | 'Partial Payment Received' | 'Under Follow up' | 'Dispute' | 'None';
    notes?: string;
    assignedEngineerId?: string;
}

export interface Customer {
    customerCode: string;
    customerName: string;
}

    
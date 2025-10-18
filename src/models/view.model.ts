
import type { Invoice } from './data.model';

export interface EnrichedInvoice extends Invoice {
    dispute: 'Yes' | 'No';
    note: string;
}

export interface CustomerData {
    customerCode: string;
    customerName: string;
    aging: {
        days0_30: number;
        days31_90: number;
        days91_180: number;
        days181_365: number;
        above1Year: number;
        unclassified: number;
    };
    invoices: EnrichedInvoice[];
    remarks: 'Payment Received' | 'Partial Payment Received' | 'Under Follow up' | 'Dispute' | 'None';
    notes: string;
}

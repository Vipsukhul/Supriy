
import type { Invoice } from './data.model';

export interface EnrichedInvoiceSummary extends Invoice {
    customerCode: string;
    customerName: string;
}

export interface InvoiceSummary {
    period: string;
    currentMonthInvoicesCount: number;
    previousMonthsInvoicesCount: number;
    disputedInvoicesCount: number;
    currentOutstanding: number;
    recoveredOutstanding: number;
    increasedOutstanding: number;
    invoices: EnrichedInvoiceSummary[];
}

export type MonthlySummary = InvoiceSummary;

export interface InvoiceSettings {
  id: string;
  user_id: string;
  company_name: string | null;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  logo_url: string | null;
  tax_rate: number;
  tax_enabled: boolean;
  default_payment_terms: string;
  thank_you_message: string;
  include_signature_line: boolean;
  invoice_prefix: string;
  next_invoice_number: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  project_id: string;
  invoice_number: string;
  client_name: string | null;
  invoice_date: string;
  due_date: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceFormData {
  client_name: string;
  invoice_date: string;
  due_date: string;
  discount_amount: number;
  include_tax: boolean;
}

export interface InvoiceExpenseItem {
  no: number;
  description: string;
  quantity: number;
  price: number;
  amount: number;
}

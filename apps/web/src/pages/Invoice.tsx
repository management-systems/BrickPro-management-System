import { useState, useEffect } from 'react';
import { useAppStore } from '../store/app';
import { useAuthStore } from '../store/auth';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  firm?: string;
  mobile: string;
  address?: string;
  gstin?: string;
}

interface Dispatch {
  id: string;
  date: string;
  challanNo: string;
  brickType: string;
  quantity: number;
  rate: number;
  amount: number;
  truckNo: string;
}

interface InvoiceSettings {
  id?: string;
  companyName: string;
  companyAddress: string;
  companyGstin?: string;
  companyMobile?: string;
  companyEmail?: string;
  layout: 'modern' | 'classic' | 'minimal';
  showGst: boolean;
  gstType: 'SGST_CGST' | 'IGST';
  gstRate: number;
  sgstRate: number;
  cgstRate: number;
  igstRate: number;
  showHsn: boolean;
  showTerms: boolean;
  termsText?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  signatoryName?: string;
}

interface Invoice {
  id?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  customerId: string;
  billingName?: string;
  vehicleNo?: string;
  dateFrom?: string;
  dateTo?: string;
  items: InvoiceItem[];
  subtotal: number;
  sgstAmount: number;
  cgstAmount: number;
  igstAmount: number;
  gstAmount: number;
  totalAmount: number;
  amountInWords?: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  notes?: string;
}

interface InvoiceItem {
  id?: string;
  dispatchId?: string;
  description: string;
  brickType: string;
  quantity: number;
  rate: number;
  amount: number;
  hsnCode: string;
}

export default function Invoice() {
  const { activeFactory: selectedFactory } = useAppStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'settings'>('create');
  
  // Create Invoice State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customerDispatches, setCustomerDispatches] = useState<Dispatch[]>([]);
  const [selectedDispatches, setSelectedDispatches] = useState<string[]>([]);
  const [invoice, setInvoice] = useState<Invoice>({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    customerId: '',
    items: [],
    subtotal: 0,
    gstAmount: 0,
    totalAmount: 0,
    status: 'draft'
  });
  
  // Settings State
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    companyName: '',
    companyAddress: '',
    layout: 'modern',
    showGst: true,
    gstType: 'SGST_CGST',
    gstRate: 18.0,
    sgstRate: 9.0,
    cgstRate: 9.0,
    igstRate: 18.0,
    showHsn: true,
    showTerms: true,
    signatoryName: ''
  });
  
  // List State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadInvoiceSettings();
    loadInvoices();
    generateInvoiceNumber();
  }, [selectedFactory]);

  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to load customers');
    }
  };

  const loadInvoiceSettings = async () => {
    try {
      const response = await api.get('/invoice-settings');
      if (response.data) {
        setInvoiceSettings(response.data);
      }
    } catch (error) {
      console.log('No invoice settings found, using defaults');
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await api.get(`/invoices?factoryId=${selectedFactory}`);
      setInvoices(response.data);
    } catch (error) {
      toast.error('Failed to load invoices');
    }
  };

  const generateInvoiceNumber = async () => {
    try {
      const response = await api.get('/invoices/next-number');
      setInvoice(prev => ({ ...prev, invoiceNumber: response.data.invoiceNumber }));
    } catch (error) {
      const number = `INV-${Date.now()}`;
      setInvoice(prev => ({ ...prev, invoiceNumber: number }));
    }
  };

  const numberToWords = (amount: number) => {
    const units = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convert = (num: number): string => {
      if (num < 20) return units[num];
      if (num < 100) return `${tens[Math.floor(num / 10)]}${num % 10 ? ` ${units[num % 10]}` : ''}`;
      if (num < 1000) return `${units[Math.floor(num / 100)]} Hundred${num % 100 ? ` ${convert(num % 100)}` : ''}`;
      if (num < 100000) return `${convert(Math.floor(num / 1000))} Thousand${num % 1000 ? ` ${convert(num % 1000)}` : ''}`;
      if (num < 10000000) return `${convert(Math.floor(num / 100000))} Lakh${num % 100000 ? ` ${convert(num % 100000)}` : ''}`;
      return `${convert(Math.floor(num / 10000000))} Crore${num % 10000000 ? ` ${convert(num % 10000000)}` : ''}`;
    };

    const whole = Math.floor(amount);
    const fraction = Math.round((amount - whole) * 100);
    let words = `${convert(whole)} Rupees`;
    if (fraction > 0) {
      words += ` and ${convert(fraction)} Paise`;
    }
    return `${words} Only`;
  };

  const loadCustomerDispatches = async (customerId: string) => {
    try {
      const params: any = { customerId, uninvoiced: 'true' };
      if (selectedFactory) params.factoryId = selectedFactory;
      const response = await api.get('/dispatches', { params });
      setCustomerDispatches(response.data);
    } catch (error) {
      toast.error('Failed to load customer dispatches');
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomer(customerId);
    setInvoice(prev => ({ ...prev, customerId }));
    if (customerId) {
      loadCustomerDispatches(customerId);
    } else {
      setCustomerDispatches([]);
    }
    setSelectedDispatches([]);
  };

  const handleDispatchSelect = (dispatchId: string, checked: boolean) => {
    if (checked) {
      setSelectedDispatches(prev => [...prev, dispatchId]);
    } else {
      setSelectedDispatches(prev => prev.filter(id => id !== dispatchId));
    }
  };

  const calculateInvoice = () => {
    const selectedDispatchData = customerDispatches.filter(d => selectedDispatches.includes(d.id));
    
    const items: InvoiceItem[] = selectedDispatchData.map(dispatch => ({
      dispatchId: dispatch.id,
      description: `${dispatch.brickType} - Challan: ${dispatch.challanNo}`,
      brickType: dispatch.brickType,
      quantity: dispatch.quantity,
      rate: dispatch.rate,
      amount: dispatch.amount,
      hsnCode: '6901'
    }));

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = invoiceSettings.showGst ? (subtotal * invoiceSettings.gstRate) / 100 : 0;
    const sgstAmount = invoiceSettings.showGst && invoiceSettings.gstType === 'SGST_CGST' ? (subtotal * invoiceSettings.sgstRate) / 100 : 0;
    const cgstAmount = invoiceSettings.showGst && invoiceSettings.gstType === 'SGST_CGST' ? (subtotal * invoiceSettings.cgstRate) / 100 : 0;
    const igstAmount = invoiceSettings.showGst && invoiceSettings.gstType === 'IGST' ? (subtotal * invoiceSettings.igstRate) / 100 : 0;
    const totalAmount = subtotal + sgstAmount + cgstAmount + igstAmount;
    const amountInWords = numberToWords(totalAmount);

    setInvoice(prev => ({
      ...prev,
      items,
      subtotal,
      gstAmount,
      sgstAmount,
      cgstAmount,
      igstAmount,
      totalAmount,
      amountInWords
    }));
  };

  useEffect(() => {
    calculateInvoice();
  }, [selectedDispatches, invoiceSettings.showGst, invoiceSettings.gstRate]);

  const saveInvoice = async () => {
    if (!selectedCustomer || selectedDispatches.length === 0) {
      toast.error('Please select customer and at least one dispatch');
      return;
    }

    setLoading(true);
    try {
      const invoiceData = {
        ...invoice,
        factoryId: selectedFactory,
        createdBy: user?.name || 'Unknown'
      };

      await api.post('/invoices', invoiceData);
      toast.success('Invoice created successfully');
      
      // Reset form
      setSelectedCustomer('');
      setSelectedDispatches([]);
      setCustomerDispatches([]);
      generateInvoiceNumber();
      loadInvoices();
      
    } catch (error) {
      toast.error('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const saveInvoiceSettings = async () => {
    setLoading(true);
    try {
      await api.post('/invoice-settings', invoiceSettings);
      toast.success('Invoice settings saved successfully');
    } catch (error) {
      toast.error('Failed to save invoice settings');
    } finally {
      setLoading(false);
    }
  };

  const previewInvoice = () => {
    if (!selectedCustomer || selectedDispatches.length === 0) {
      toast.error('Please select customer and dispatches first');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomer);
    if (!customer) return;

    // Open preview in new window
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(generateInvoiceHTML(customer, invoice, invoiceSettings));
      previewWindow.document.close();
    }
  };

  const generateInvoiceHTML = (customer: Customer, invoice: Invoice, settings: InvoiceSettings) => {
    const layoutClass = settings.layout === 'modern' ? 'modern-layout' : 
                       settings.layout === 'classic' ? 'classic-layout' : 'minimal-layout';

    const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString() : '--';
    const billingName = invoice.billingName ? `M/s ${invoice.billingName}` : `M/s ${customer.name}`;
    const gstRows = settings.gstType === 'SGST_CGST' ? `
      <div class="total-row">
        <span>SGST (${settings.sgstRate}%):</span>
        <span>₹${invoice.sgstAmount.toLocaleString()}</span>
      </div>
      <div class="total-row">
        <span>CGST (${settings.cgstRate}%):</span>
        <span>₹${invoice.cgstAmount.toLocaleString()}</span>
      </div>
      <div class="total-row">
        <span>IGST (0%):</span>
        <span>₹0</span>
      </div>
    ` : `
      <div class="total-row">
        <span>SGST (0%):</span>
        <span>₹0</span>
      </div>
      <div class="total-row">
        <span>CGST (0%):</span>
        <span>₹0</span>
      </div>
      <div class="total-row">
        <span>IGST (${settings.igstRate}%):</span>
        <span>₹${invoice.igstAmount.toLocaleString()}</span>
      </div>
    `;

    const tableRows = Array.from({ length: Math.max(7, invoice.items.length) }, (_, index) => {
      const item = invoice.items[index];
      if (item) {
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${item.description}</td>
            ${settings.showHsn ? `<td>${item.hsnCode}</td>` : ''}
            <td>${item.quantity.toLocaleString()}</td>
            <td>₹${item.rate.toFixed(2)}</td>
            <td>₹${item.amount.toLocaleString()}</td>
          </tr>
        `;
      }

      return `
        <tr>
          <td>${index + 1}</td>
          <td>&nbsp;</td>
          ${settings.showHsn ? '<td>&nbsp;</td>' : ''}
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 24px; }
          .company-info h1 { margin: 0 0 8px 0; font-size: 28px; color: #1d4ed8; }
          .company-info p, .meta-block p { margin: 2px 0; font-size: 13px; }
          .meta-block { text-align: right; min-width: 280px; }
          .meta-block h2 { margin: 0 0 8px 0; font-size: 20px; letter-spacing: 1px; }
          .customer-info { margin: 20px 0; padding: 16px; background: #f3f4f6; border-radius: 8px; }
          .customer-info h3 { margin: 0 0 8px 0; font-size: 16px; }
          .customer-info p { margin: 4px 0; font-size: 13px; }
          .details-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 20px 0; }
          .detail-card { background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e5e7eb; }
          .detail-card p { margin: 4px 0; font-size: 13px; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          .items-table th, .items-table td { border: 1px solid #d1d5db; padding: 10px 12px; text-align: left; font-size: 13px; }
          .items-table th { background: #e2e8f0; font-weight: 600; }
          .invoice-body { min-height: 520px; }
          .body-spacer { height: 120px; }
          .totals-grid { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; margin-top: 18px; }
          .totals { flex: 1 1 340px; }
          .total-row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 14px; }
          .final-total { font-weight: 700; font-size: 16px; border-top: 2px solid #111; padding-top: 10px; }
          .amount-words { margin-top: 16px; font-size: 13px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; }
          .payment-details { flex: 0 0 260px; margin-top: 0; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb; align-self: flex-start; }
          .payment-details h4, .terms h4 { margin: 0 0 10px 0; font-size: 15px; }
          .payment-details p, .terms p { margin: 4px 0; font-size: 13px; }
          .payment-details p, .terms p { margin: 4px 0; font-size: 13px; }
          .signature-block { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 32px; gap: 20px; }
          .signature-block p { margin: 4px 0; font-size: 13px; }
          .sign-right { text-align: right; min-width: 220px; }
          .signature-line { margin-top: 40px; display: inline-block; border-top: 1px solid #111; padding-top: 6px; font-weight: 700; }
          .modern-layout { border-left: 4px solid #2563eb; padding-left: 20px; }
          .classic-layout { border: 2px solid #333; padding: 20px; }
          .minimal-layout { border-bottom: 1px solid #ddd; }
        </style>
      </head>
      <body class="${layoutClass}">
        <div class="invoice-header">
          <div class="company-info">
            <h1>${settings.companyName}</h1>
            <p>${settings.companyAddress}</p>
            ${settings.companyGstin ? `<p>GSTIN: ${settings.companyGstin}</p>` : ''}
            ${settings.companyMobile ? `<p>Mobile: ${settings.companyMobile}</p>` : ''}
            ${settings.companyEmail ? `<p>Email: ${settings.companyEmail}</p>` : ''}
          </div>
          <div class="meta-block">
            <h2>INVOICE</h2>
            <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Dt. of Issue:</strong> ${formatDate(invoice.invoiceDate)}</p>
            ${invoice.vehicleNo ? `<p><strong>Vehicle No:</strong> ${invoice.vehicleNo}</p>` : ''}
            ${settings.companyGstin && customer.gstin ? `<p><strong>GSTIN From:</strong> ${settings.companyGstin} <strong>To:</strong> ${customer.gstin}</p>` : customer.gstin ? `<p><strong>GSTIN:</strong> ${customer.gstin}</p>` : ''}
            ${invoice.dateFrom || invoice.dateTo ? `<p><strong>From:</strong> ${formatDate(invoice.dateFrom)} <strong>To:</strong> ${formatDate(invoice.dateTo)}</p>` : ''}
          </div>
        </div>

        <div class="customer-info">
          <h3>Bill To:</h3>
          <p><strong>${billingName}</strong></p>
          ${customer.firm ? `<p>${customer.firm}</p>` : ''}
          <p>Mobile: ${customer.mobile}</p>
          ${customer.address ? `<p>${customer.address}</p>` : ''}
          ${customer.gstin ? `<p>GSTIN: ${customer.gstin}</p>` : ''}
        </div>

        <div class="invoice-body">
          <table class="items-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Particulars</th>
                ${settings.showHsn ? '<th>HSN Code</th>' : ''}
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="body-spacer"></div>

          <div class="totals-grid">
            ${settings.bankName || settings.accountNumber || settings.ifscCode || settings.upiId ? `
              <div class="payment-details">
                <h4>Bank Details</h4>
                ${settings.bankName ? `<p>Bank Name: ${settings.bankName}</p>` : ''}
                ${settings.accountNumber ? `<p>A/C No.: ${settings.accountNumber}</p>` : ''}
                ${settings.ifscCode ? `<p>IFSC Code: ${settings.ifscCode}</p>` : ''}
                ${settings.upiId ? `<p>UPI: ${settings.upiId}</p>` : ''}
              </div>
            ` : ''}
            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>₹${invoice.subtotal.toLocaleString()}</span>
              </div>
              ${gstRows}
              <div class="total-row final-total">
                <span>Total Amount:</span>
                <span>₹${invoice.totalAmount.toLocaleString()}</span>
              </div>
              <div class="amount-words"><strong>Amount in words:</strong> ${invoice.amountInWords || ''}</div>
            </div>
          </div>
        </div>

        ${settings.showTerms && settings.termsText ? `
          <div class="terms">
            <h4>Terms & Conditions</h4>
            <p>${settings.termsText}</p>
          </div>
        ` : ''}

        <div class="signature-block">
          <div>
            <p>Certified that above are true and correct.</p>
          </div>
          <div class="sign-right">
            <p>For ${settings.companyName}</p>
            <p class="signature-line">${settings.signatoryName || 'Authorized Signatory'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📄 Invoice Management</h1>
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Invoice
          </button>
          <button 
            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            Invoice List
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="tab-content">
          <div className="form-section">
            <h3>Invoice Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Invoice Number</label>
                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={(e) => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Invoice Date</label>
                <input
                  type="date"
                  value={invoice.invoiceDate}
                  onChange={(e) => setInvoice(prev => ({ ...prev, invoiceDate: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Bill To Name (on invoice)</label>
                <input
                  type="text"
                  value={invoice.billingName || ''}
                  onChange={(e) => setInvoice(prev => ({ ...prev, billingName: e.target.value }))}
                  placeholder="M/s Customer Name"
                />
              </div>
              <div className="form-group">
                <label>Vehicle No.</label>
                <input
                  type="text"
                  value={invoice.vehicleNo || ''}
                  onChange={(e) => setInvoice(prev => ({ ...prev, vehicleNo: e.target.value }))}
                  placeholder="Vehicle number"
                />
              </div>
              <div className="form-group">
                <label>From Date</label>
                <input
                  type="date"
                  value={invoice.dateFrom || ''}
                  onChange={(e) => setInvoice(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>To Date</label>
                <input
                  type="date"
                  value={invoice.dateTo || ''}
                  onChange={(e) => setInvoice(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Due Date (Optional)</label>
                <input
                  type="date"
                  value={invoice.dueDate || ''}
                  onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Customer Selection</h3>
            <div className="form-group">
              <label>Select Customer</label>
              <select
                value={selectedCustomer}
                onChange={(e) => handleCustomerSelect(e.target.value)}
              >
                <option value="">Choose Customer...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.mobile}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedCustomer && (
            <div className="form-section">
              <h3>Select Dispatches</h3>
              {customerDispatches.length === 0 ? (
                <p className="no-data">No uninvoiced dispatches found for this customer</p>
              ) : (
                <div className="dispatch-list">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={selectedDispatches.length === customerDispatches.length && customerDispatches.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDispatches(customerDispatches.map(d => d.id));
                          } else {
                            setSelectedDispatches([]);
                          }
                        }}
                      />
                      Select All ({customerDispatches.length})
                    </label>
                    <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{selectedDispatches.length} selected</span>
                  </div>
                  {customerDispatches.map(dispatch => (
                    <div key={dispatch.id} className="dispatch-item">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedDispatches.includes(dispatch.id)}
                          onChange={(e) => handleDispatchSelect(dispatch.id, e.target.checked)}
                        />
                        <div className="dispatch-details">
                          <div className="dispatch-main">
                            <span className="challan">Challan: {dispatch.challanNo}</span>
                            <span className="date">{new Date(dispatch.date).toLocaleDateString()}</span>
                          </div>
                          <div className="dispatch-info">
                            <span>{dispatch.brickType}</span>
                            <span>{dispatch.quantity.toLocaleString()} × ₹{dispatch.rate}</span>
                            <span className="amount">₹{dispatch.amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {invoice.items.length > 0 && (
            <div className="form-section">
              <h3>Invoice Summary</h3>
              <div className="invoice-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{invoice.subtotal.toLocaleString()}</span>
                </div>
                {invoiceSettings.showGst && (
                  <div className="summary-row">
                    <span>GST ({invoiceSettings.gstRate}%):</span>
                    <span>₹{invoice.gstAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span>₹{invoice.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={invoice.notes || ''}
                  onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any additional notes..."
                />
              </div>

              <div className="form-actions">
                <button onClick={previewInvoice} className="btn-secondary">
                  Preview Invoice
                </button>
                <button onClick={saveInvoice} disabled={loading} className="btn-primary">
                  {loading ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'list' && (
        <div className="tab-content">
          <div className="invoice-list">
            {invoices.length === 0 ? (
              <p className="no-data">No invoices found</p>
            ) : (
              invoices.map(inv => (
                <div key={inv.id} className="invoice-card">
                  <div className="invoice-header">
                    <span className="invoice-number">{inv.invoiceNumber}</span>
                    <span className={`status ${inv.status}`}>{inv.status.toUpperCase()}</span>
                  </div>
                  <div className="invoice-details">
                    <p>Date: {new Date(inv.invoiceDate).toLocaleDateString()}</p>
                    <p>Amount: ₹{inv.totalAmount.toLocaleString()}</p>
                    <p>Items: {inv.items?.length || 0}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="tab-content">
          <div className="settings-form">
            <div className="form-section">
              <h3>Company Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    value={invoiceSettings.companyName}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="form-group">
                  <label>Company Address *</label>
                  <textarea
                    value={invoiceSettings.companyAddress}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, companyAddress: e.target.value }))}
                    placeholder="Complete company address"
                  />
                </div>
                <div className="form-group">
                  <label>GSTIN</label>
                  <input
                    type="text"
                    value={invoiceSettings.companyGstin || ''}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, companyGstin: e.target.value }))}
                    placeholder="GST Number"
                  />
                </div>
                <div className="form-group">
                  <label>Mobile</label>
                  <input
                    type="text"
                    value={invoiceSettings.companyMobile || ''}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, companyMobile: e.target.value }))}
                    placeholder="Contact number"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={invoiceSettings.companyEmail || ''}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, companyEmail: e.target.value }))}
                    placeholder="company@email.com"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Invoice Layout</h3>
              <div className="layout-options">
                {['modern', 'classic', 'minimal'].map(layout => (
                  <label key={layout} className="layout-option">
                    <input
                      type="radio"
                      name="layout"
                      value={layout}
                      checked={invoiceSettings.layout === layout}
                      onChange={(e) => setInvoiceSettings(prev => ({ ...prev, layout: e.target.value as any }))}
                    />
                    <div className="layout-preview">
                      <div className={`preview-${layout}`}>
                        <div className="preview-header"></div>
                        <div className="preview-content"></div>
                      </div>
                      <span>{layout.charAt(0).toUpperCase() + layout.slice(1)}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h3>GST Settings</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={invoiceSettings.showGst}
                      onChange={(e) => setInvoiceSettings(prev => ({ ...prev, showGst: e.target.checked }))}
                    />
                    Show GST in Invoice
                  </label>
                </div>
                {invoiceSettings.showGst && (
                  <>
                    <div className="form-group">
                      <label>GST Type</label>
                      <select
                        value={invoiceSettings.gstType}
                        onChange={(e) => setInvoiceSettings(prev => ({ ...prev, gstType: e.target.value as any }))}
                      >
                        <option value="SGST_CGST">SGST + CGST</option>
                        <option value="IGST">IGST</option>
                      </select>
                    </div>
                    {invoiceSettings.gstType === 'SGST_CGST' ? (
                      <>
                        <div className="form-group">
                          <label>SGST Rate (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={invoiceSettings.sgstRate}
                            onChange={(e) => setInvoiceSettings(prev => ({ ...prev, sgstRate: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="form-group">
                          <label>CGST Rate (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={invoiceSettings.cgstRate}
                            onChange={(e) => setInvoiceSettings(prev => ({ ...prev, cgstRate: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="form-group">
                        <label>IGST Rate (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={invoiceSettings.igstRate}
                          onChange={(e) => setInvoiceSettings(prev => ({ ...prev, igstRate: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    )}
                  </>
                )}
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={invoiceSettings.showHsn}
                      onChange={(e) => setInvoiceSettings(prev => ({ ...prev, showHsn: e.target.checked }))}
                    />
                    Show HSN Code
                  </label>
                </div>
                <div className="form-group">
                  <label>Signatory Name</label>
                  <input
                    type="text"
                    value={invoiceSettings.signatoryName || ''}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, signatoryName: e.target.value }))}
                    placeholder="Authorized signatory"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Terms & Conditions</h3>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={invoiceSettings.showTerms}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, showTerms: e.target.checked }))}
                  />
                  Show Terms & Conditions
                </label>
              </div>
              {invoiceSettings.showTerms && (
                <div className="form-group">
                  <label>Terms Text</label>
                  <textarea
                    value={invoiceSettings.termsText || ''}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, termsText: e.target.value }))}
                    placeholder="Enter your terms and conditions..."
                  />
                </div>
              )}
            </div>

            <div className="form-section">
              <h3>Payment Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    value={invoiceSettings.bankName || ''}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="Bank name"
                  />
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input
                    type="text"
                    value={invoiceSettings.accountNumber || ''}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="Account number"
                  />
                </div>
                <div className="form-group">
                  <label>IFSC Code</label>
                  <input
                    type="text"
                    value={invoiceSettings.ifscCode || ''}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, ifscCode: e.target.value }))}
                    placeholder="IFSC code"
                  />
                </div>
                <div className="form-group">
                  <label>UPI ID</label>
                  <input
                    type="text"
                    value={invoiceSettings.upiId || ''}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, upiId: e.target.value }))}
                    placeholder="UPI ID"
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button onClick={saveInvoiceSettings} disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';

interface InvoicePaymentProps {
  onPayInvoice: (invoice: string) => Promise<void>;
  isLoading?: boolean;
}

const InvoicePayment: React.FC<InvoicePaymentProps> = ({ onPayInvoice, isLoading }) => {
  const [invoice, setInvoice] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    await onPayInvoice(invoice);
    setInvoice('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="input-group">
        <textarea
          value={invoice}
          onChange={(e) => setInvoice(e.target.value)}
          placeholder="Paste invoice here"
          required
          disabled={isLoading}
          className="invoice-textarea"
          rows={3}
        />
      </div>
      <button
        type="submit"
        disabled={!invoice || isLoading}
        className="pay-invoice-btn"
      >
        {isLoading ? 'Processing Payment...' : 'Pay Invoice'}
      </button>
    </form>
  );
};

export default InvoicePayment; 
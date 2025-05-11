import React, { useState } from 'react';

interface InvoiceCreatorProps {
  onCreateInvoice: (amount: string) => Promise<void>;
  isLoading?: boolean;
}

const InvoiceCreator: React.FC<InvoiceCreatorProps> = ({ onCreateInvoice, isLoading }) => {
  const [amount, setAmount] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    await onCreateInvoice(amount);
    setAmount('');
  };

  return (
    <div className="section">
      <h2>Create Invoice</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="input-group">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount in sats"
            min="1"
            required
            disabled={isLoading}
            className="flex-1"
          />
          <button
            type="submit"
            disabled={!amount || isLoading}
            className="create-invoice-btn"
          >
            {isLoading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceCreator; 
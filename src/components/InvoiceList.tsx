import React from 'react';
import { LightningInvoice } from '../types/lightning';

interface InvoiceListProps {
  invoices: LightningInvoice[];
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="section">
      <h2>Recent Invoices</h2>
      <div className="list-container">
        {invoices.length === 0 ? (
          <p className="text-gray-500">No invoices found</p>
        ) : (
          invoices.map((inv) => (
            <div key={inv.paymentHash} className="list-item bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-lg font-semibold">
                    Amount: {Number(inv.valueMsat) / 1000} sats
                  </p>
                  {inv.memo && <p className="text-gray-400">Memo: {inv.memo}</p>}
                </div>
                <span className={`status-badge ${inv.status.toLowerCase()}`}>
                  {inv.status}
                </span>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-400">Created: {formatDate(inv.createdAt)}</p>
                <p className="text-sm text-gray-400">Expires: {formatDate(inv.expiresAt)}</p>
              </div>
              <div className="mt-3">
                <p className="text-sm text-gray-400 mb-1">Invoice:</p>
                <code className="text-xs break-all bg-gray-900 p-2 rounded block">
                  {inv.invoice}
                </code>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InvoiceList; 
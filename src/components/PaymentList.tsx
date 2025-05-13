import React from 'react';
import { LightningPayment } from '../types/lightning';

interface PaymentListProps {
  payments: LightningPayment[];
  onPaymentSelect: (payment: LightningPayment) => void;
}

const PaymentList: React.FC<PaymentListProps> = ({ payments, onPaymentSelect }) => {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return 'badge badge-success';
      case 'FAILED':
        return 'badge badge-error';
      default:
        return 'badge badge-warning';
    }
  };

  return (
      <div className="list-container">
        {payments.map((payment) => (
          <div 
            key={payment.paymentHash} 
          className="list-item cursor-pointer hover:bg-opacity-80"
            onClick={() => onPaymentSelect(payment)}
          >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-lg font-medium">
                Amount: {Number(payment.valueMsat) / 1000} sats
              </p>
              <p className="text-sm text-text-secondary">
                Fee: {Number(payment.feeMsat) / 1000} sats
              </p>
            </div>
            <span className={getStatusBadgeClass(payment.status)}>
              {payment.status}
            </span>
          </div>
          
          {payment.status === 'FAILED' && payment.failureReason && (
            <p className="text-error text-sm mt-2">
              Failure: {payment.failureReason}
            </p>
          )}
          
          <div className="mt-2">
            <p className="text-sm text-text-secondary">
              Time: {new Date(payment.timestamp).toLocaleString()}
              {payment.preimage && <span className="ml-2 text-xs text-green-400">(With Preimage)</span>}
            </p>
            <div className="text-xs text-text-secondary mt-1">
              <p className="font-medium mb-1">Hash:</p> 
              <code className="font-mono break-all bg-gray-900 p-1 rounded block max-h-12 overflow-y-auto text-xs">
                {payment.paymentHash}
              </code>
            </div>
          </div>
          </div>
        ))}
    </div>
  );
};

export default PaymentList; 
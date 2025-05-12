import React from 'react';
import { LightningPayment } from '../types/lightning';

interface PaymentDetailsProps {
  payment: LightningPayment;
  onClose: () => void;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({ payment, onClose }) => {
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
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <h2 className="card-title">Payment Details</h2>
        <button onClick={onClose} className="btn btn-secondary">
          Close
        </button>
      </div>
      
      <div className="space-y-4 mt-4">
        <div className="flex justify-between items-center">
          <span className="text-text-secondary">Status</span>
          <span className={getStatusBadgeClass(payment.status)}>
            {payment.status}
          </span>
        </div>

        {payment.status === 'FAILED' && payment.failureReason && (
          <div className="bg-error bg-opacity-10 text-error rounded-md p-4">
            <h3 className="text-sm font-medium mb-1">Failure Reason</h3>
            <p className="text-sm">{payment.failureReason}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm text-text-secondary mb-1">Amount</h3>
            <p className="text-lg font-medium">{Number(payment.valueMsat) / 1000} sats</p>
          </div>
          <div>
            <h3 className="text-sm text-text-secondary mb-1">Fee</h3>
            <p className="text-lg font-medium">{Number(payment.feeMsat) / 1000} sats</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm text-text-secondary mb-1">Payment Hash</h3>
          <div className="bg-background-darker p-2 rounded-md overflow-hidden">
            <p className="font-mono text-sm break-all overflow-y-auto max-h-20">
              {payment.paymentHash}
            </p>
          </div>
        </div>

        {payment.destination && (
          <div>
            <h3 className="text-sm text-text-secondary mb-1">Destination</h3>
            <div className="bg-background-darker p-2 rounded-md overflow-hidden">
              <p className="font-mono text-sm break-all overflow-y-auto max-h-20">
                {payment.destination}
              </p>
            </div>
          </div>
        )}

        {payment.invoice && (
          <div>
            <h3 className="text-sm text-text-secondary mb-1">Invoice</h3>
            <div className="bg-background-darker p-2 rounded-md overflow-hidden">
              <p className="font-mono text-sm break-all overflow-y-auto max-h-20">
                {payment.invoice}
              </p>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm text-text-secondary mb-1">Timestamp</h3>
          <p>{new Date(payment.timestamp).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails; 
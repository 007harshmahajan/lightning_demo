import React from 'react';
import { LightningPayment } from '../types/lightning';

interface PaymentDetailsProps {
  payment: LightningPayment;
  onClose: () => void;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({ payment, onClose }) => {
  return (
    <div className="section">
      <h2>Payment Details</h2>
      <div className="payment-details">
        <p><strong>Payment Hash:</strong> {payment.paymentHash}</p>
        <p><strong>Amount:</strong> {Number(payment.valueMsat) / 1000} sats</p>
        <p><strong>Fee:</strong> {Number(payment.feeMsat) / 1000} sats</p>
        <p><strong>Status:</strong> {payment.status}</p>
        <p><strong>Time:</strong> {new Date(payment.timestamp).toLocaleString()}</p>
      </div>
      <button onClick={onClose} className="secondary-button">
        Close
      </button>
    </div>
  );
};

export default PaymentDetails; 
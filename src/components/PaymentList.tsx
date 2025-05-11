import React from 'react';
import { LightningPayment } from '../types/lightning';

interface PaymentListProps {
  payments: LightningPayment[];
  onPaymentSelect: (payment: LightningPayment) => void;
}

const PaymentList: React.FC<PaymentListProps> = ({ payments, onPaymentSelect }) => {
  return (
    <div className="section">
      <h2>Recent Payments</h2>
      <div className="list-container">
        {payments.map((payment) => (
          <div 
            key={payment.paymentHash} 
            className="list-item"
            onClick={() => onPaymentSelect(payment)}
          >
            <p>Amount: {Number(payment.valueMsat) / 1000} sats</p>
            <p>Status: {payment.status}</p>
            <p>Fee: {Number(payment.feeMsat) / 1000} sats</p>
            <p>Time: {new Date(payment.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentList; 
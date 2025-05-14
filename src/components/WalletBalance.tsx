import React from 'react';
import { BitGoWallet } from '../types/lightning';

interface WalletBalanceProps {
  wallet: BitGoWallet;
}

// Helper function to convert millisats to sats and format with commas
const formatSats = (millisatsValue: string): string => {
  try {
    // Convert from millisats to sats (divide by 1000)
    const satsValue = Math.floor(parseInt(millisatsValue || '0') / 1000);
    return new Intl.NumberFormat().format(satsValue);
  } catch (error) {
    return '0';
  }
};

export const WalletBalance: React.FC<WalletBalanceProps> = ({ wallet }) => {
  return (
    <div className="wallet-balance grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {/* Lightning Inbound Balance */}
      <div className="balance-card p-4 bg-background-darker rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2 text-primary">Lightning Inbound</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-text-secondary">Available: </span>
            <span className="font-mono">{formatSats(wallet.inboundBalance)} sats</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Pending: </span>
            <span className="font-mono">{formatSats(wallet.inboundPendingBalance)} sats</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Unsettled: </span>
            <span className="font-mono">{formatSats(wallet.inboundUnsettledBalance)} sats</span>
          </div>
        </div>
      </div>

      {/* Lightning Outbound Balance */}
      <div className="balance-card p-4 bg-background-darker rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2 text-primary">Lightning Outbound</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-text-secondary">Available: </span>
            <span className="font-mono">{formatSats(wallet.outboundBalance)} sats</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Pending: </span>
            <span className="font-mono">{formatSats(wallet.outboundPendingBalance)} sats</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Unsettled: </span>
            <span className="font-mono">{formatSats(wallet.outboundUnsettledBalance)} sats</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 
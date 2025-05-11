import React from 'react';
import { BitGoNetwork } from '../types/lightning';

interface NetworkSelectorProps {
  value: BitGoNetwork;
  onChange: (network: BitGoNetwork) => void;
  className?: string;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({ value, onChange, className = '' }) => {
  return (
    <div className={`network-selector ${className}`}>
      <label className="block text-sm font-medium text-text-secondary mb-2">Network</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as BitGoNetwork)}
        className="w-full px-4 py-2.5 rounded-md bg-input-bg border border-border-color text-text-primary cursor-pointer focus:outline-none focus:border-primary-color focus:ring-2 focus:ring-primary-color/20"
      >
        <option value="tlnbtc">Bitcoin Lightning Network Testnet (TLNBTC)</option>
        <option value="lnbtc">Bitcoin Lightning Network (LNBTC)</option>
      </select>
      <p className="mt-2 text-sm text-text-secondary">
        {value === 'tlnbtc' 
          ? 'Test network for development and testing'
          : 'Production network for real transactions'}
      </p>
    </div>
  );
};

export default NetworkSelector; 
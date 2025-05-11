import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BitGoNetwork } from '../types/lightning';

interface NetworkContextType {
  network: BitGoNetwork;
  setNetwork: (network: BitGoNetwork) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [network, setNetwork] = useState<BitGoNetwork>('tlnbtc');

  return (
    <NetworkContext.Provider value={{ network, setNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}; 
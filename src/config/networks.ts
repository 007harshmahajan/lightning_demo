import { BitGoNetwork, NetworkConfig } from '../types/lightning';

export const NETWORK_CONFIGS: Record<BitGoNetwork, NetworkConfig> = {
  tlnbtc: {
    network: 'tlnbtc',
    environment: 'test',
    apiUrl: 'https://app.bitgo-test.com',
    displayName: 'Testnet (TLNBTC)',
    description: 'Bitcoin Lightning Network Testnet'
  },
  lnbtc: {
    network: 'lnbtc',
    environment: 'prod',
    apiUrl: 'https://app.bitgo.com',
    displayName: 'Mainnet (LNBTC)',
    description: 'Bitcoin Lightning Network Mainnet'
  }
}; 
import { BitGoAPI } from '@bitgo/sdk-api';
import { Lnbtc } from '@bitgo/sdk-coin-lnbtc';
import { getLightningWallet } from '@bitgo/abstract-lightning';
import { 
  LightningInvoice, 
  LightningPayment,
  CreateInvoiceParams, 
  PayInvoiceParams,
  BitGoLightningPayment,
  BitGoNetwork
} from '../types/lightning';
import { NETWORK_CONFIGS } from '../config/networks';

// Base URL for our backend proxy
const API_URL = 'http://localhost:3001/api/bitgo';

// Initialize BitGo SDK with network support
const initializeBitGoSDK = (bearerToken: string, network: BitGoNetwork = 'tlnbtc') => {
  const config = NETWORK_CONFIGS[network];
  return new BitGoAPI({
    accessToken: bearerToken,
    env: config.environment,
    customRootURI: config.apiUrl,
  });
};

// Helper function to get the correct coin based on network
const getCoinForNetwork = (network: BitGoNetwork) => {
  switch (network) {
    case 'tlnbtc':
      return 'tlnbtc';
    case 'lnbtc':
      return 'lnbtc';
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
};

// Helper function to make API calls through our backend proxy
const makeBitGoRequest = async (
  endpoint: string, 
  bearerToken: string, 
  method: string = 'GET', 
  body?: any, 
  query: Record<string, any> = {}
) => {
  const url = new URL(`${API_URL}${endpoint}`);
  
  // Add all query parameters
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bearerToken}`
    },
    body: body ? JSON.stringify(body) : undefined
  };

  try {
    const response = await fetch(url.toString(), options);
    if (!response.ok) {
      const error = await response.json();
      console.error('BitGo API error:', {
        status: response.status,
        statusText: response.statusText,
        error
      });
      throw new Error(error.error || 'API request failed');
    }
    return await response.json();
  } catch (error: any) {
    console.error('BitGo API request failed:', error);
    throw new Error(`BitGo API request failed: ${error.message}`);
  }
};

// Verify token is working
export const verifyToken = async (bearerToken: string) => {
  try {
    const me = await makeBitGoRequest('/user/me', bearerToken);
    console.log('BitGo token verified successfully', me);
    return me;
  } catch (error) {
    console.error('BitGo token verification failed:', error);
    throw new Error('Failed to authenticate with BitGo. Please check your access token.');
  }
};

// Create a Lightning self-custodial wallet
export const createLightningWallet = async (
  bearerToken: string,
  label: string,
  passphrase: string,
  passcodeEncryptionCode: string,
  network: BitGoNetwork = 'tlnbtc'
): Promise<any> => {
  try {
    const coin = getCoinForNetwork(network);
    const walletOptions = {
      label,
      passphrase,
      enterprise: 'your-enterprise-id',
      passcodeEncryptionCode,
      subType: 'lightningSelfCustody',
      tags: ['lightning', 'self-custody'],
    };

    console.log(`Creating Lightning self-custodial wallet on ${network} with coin ${coin}...`);
    const response = await makeBitGoRequest(
      `/${coin}/wallet/generate`, 
      bearerToken, 
      'POST', 
      walletOptions, 
      { network }
    );
    
    return {
      wallet: response.wallet,
      userKeychain: response.userKeychain,
      passcodeEncryptionCode
    };
  } catch (error: any) {
    console.error('Error creating Lightning wallet:', error);
    throw new Error(`Failed to create Lightning wallet: ${error.message || 'Unknown error'}`);
  }
};

export const getBitGoLightningWallet = async (
  bearerToken: string, 
  walletId: string,
  network: BitGoNetwork = 'tlnbtc'
) => {
  if (!walletId) throw new Error('Wallet ID is required');
  
  try {
    const coin = getCoinForNetwork(network);
    const formattedWalletId = walletId.toLowerCase().trim();
    if (!/^[a-f0-9]{32}$/.test(formattedWalletId)) {
      throw new Error('Invalid wallet ID format. Should be a 32-character hex string');
    }

    console.log(`Fetching wallet with ID: ${formattedWalletId} on network ${network} with coin ${coin}`);
    return await makeBitGoRequest(
      `/${coin}/wallet/${formattedWalletId}`, 
      bearerToken, 
      'GET', 
      undefined, 
      { network }
    );
  } catch (error: any) {
    console.error('Error getting BitGo Lightning wallet:', error);
    throw new Error(`Failed to get Lightning wallet: ${error.message || 'Unknown error'}`);
  }
};

// Helper functions to map BitGo types to our application types
const mapBitGoInvoice = (invoice: any): LightningInvoice => {
  return {
    paymentHash: invoice.paymentHash,
    walletId: invoice.walletId,
    status: invoice.status,
    invoice: invoice.invoice,
    valueMsat: invoice.valueMsat.toString(),
    expiresAt: invoice.expiresAt,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    memo: invoice.memo
  };
};

const mapBitGoPayment = (payment: any): LightningPayment => {
  let status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  switch (payment.status) {
    case 'settled':
      status = 'SUCCEEDED';
      break;
    case 'failed':
      status = 'FAILED';
      break;
    default:
      status = 'PENDING';
  }

  return {
    paymentHash: payment.paymentHash,
    valueMsat: payment.amountMsat,
    feeMsat: payment.feeLimitMsat,
    status,
    timestamp: new Date(payment.createdAt).getTime()
  };
};

export const createInvoice = async (
  bearerToken: string,
  walletId: string,
  params: CreateInvoiceParams,
  network: BitGoNetwork = 'tlnbtc'
): Promise<LightningInvoice> => {
  const coin = getCoinForNetwork(network);
  console.log(`Creating invoice on network: ${network} with coin: ${coin}`);
  
  const bitgoParams = {
    valueMsat: params.valueMsat.toString(),
    memo: params.memo || '',
    expiry: params.expiry || 3600,
    fallbackAddress: undefined,
  };
  
  const bitgoInvoice = await makeBitGoRequest(
    `/wallet/${walletId}/lightning/invoice`,
    bearerToken,
    'POST',
    bitgoParams,
    { network }
  );
  return mapBitGoInvoice(bitgoInvoice);
};

export const payInvoice = async (
  bearerToken: string,
  walletId: string,
  params: PayInvoiceParams,
  passphrase: string,
  network: BitGoNetwork = 'tlnbtc'
): Promise<LightningPayment> => {
  try {
    const coin = getCoinForNetwork(network);
    console.log(`Processing payment on network: ${network} with coin: ${coin}`);

    // Make the payment request through our proxy with minimal parameters
    const payment = await makeBitGoRequest(
      `/wallet/${walletId}/lightning/payment`,
      bearerToken,
      'POST',
      {
        invoice: params.paymentRequest,
        passphrase
      },
      { network }
    );

    // Map the response to our application type
    return {
      paymentHash: payment.paymentHash || '',
      valueMsat: BigInt(payment.amountMsat?.toString() || '0'),
      feeMsat: BigInt(payment.feeLimitMsat?.toString() || '0'),
      status: payment.status === 'settled' ? 'SUCCEEDED' :
              payment.status === 'failed' ? 'FAILED' : 'PENDING',
      timestamp: Date.now()
    };
  } catch (error: any) {
    console.error('Error paying invoice:', error);
    throw new Error(`Failed to pay invoice: ${error.message || 'Unknown error'}`);
  }
};

export const listInvoices = async (
  bearerToken: string,
  walletId: string,
  limit = 10,
  network: BitGoNetwork = 'tlnbtc'
): Promise<LightningInvoice[]> => {
  const bitgoInvoices = await makeBitGoRequest(
    `/wallet/${walletId}/lightning/invoice`,
    bearerToken,
    'GET',
    undefined,
    { limit, network }
  );
  return Array.isArray(bitgoInvoices.invoices)
    ? bitgoInvoices.invoices.map(mapBitGoInvoice)
    : [];
};

export const listPayments = async (
  bearerToken: string,
  walletId: string,
  limit = 10,
  network: BitGoNetwork = 'tlnbtc'
): Promise<LightningPayment[]> => {
  const bitgoPayments = await makeBitGoRequest(
    `/wallet/${walletId}/lightning/payment`,
    bearerToken,
    'GET',
    undefined,
    { limit, network }
  );
  return Array.isArray(bitgoPayments.payments)
    ? bitgoPayments.payments.map(mapBitGoPayment)
    : [];
};

export const getPayment = async (
  bearerToken: string, 
  walletId: string, 
  paymentHash: string,
  network: BitGoNetwork = 'tlnbtc'
): Promise<LightningPayment> => {
  const bitgoPayment = await makeBitGoRequest(
    `/wallet/${walletId}/lightning/payment/${paymentHash}`, 
    bearerToken,
    'GET',
    undefined,
    { network }
  );
  return mapBitGoPayment(bitgoPayment);
};

export const getInvoice = async (
  bearerToken: string, 
  walletId: string, 
  paymentHash: string,
  network: BitGoNetwork = 'tlnbtc'
): Promise<LightningInvoice> => {
  const bitgoInvoice = await makeBitGoRequest(
    `/wallet/${walletId}/lightning/invoice/${paymentHash}`, 
    bearerToken,
    'GET',
    undefined,
    { network }
  );
  return mapBitGoInvoice(bitgoInvoice);
};

export const getTransaction = async (
  bearerToken: string, 
  walletId: string, 
  txId: string,
  network: BitGoNetwork = 'tlnbtc'
): Promise<any> => {
  return await makeBitGoRequest(
    `/wallet/${walletId}/lightning/transaction/${txId}`, 
    bearerToken,
    'GET',
    undefined,
    { network }
  );
};

export const listTransactions = async (
  bearerToken: string, 
  walletId: string, 
  limit = 10,
  network: BitGoNetwork = 'tlnbtc'
): Promise<any[]> => {
  const response = await makeBitGoRequest(
    `/wallet/${walletId}/lightning/transaction`,
    bearerToken,
    'GET',
    undefined,
    { limit, network }
  );
  return Array.isArray(response.transactions)
    ? response.transactions
    : [];
}; 
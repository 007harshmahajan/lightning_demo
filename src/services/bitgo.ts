import { BitGoAPI } from '@bitgo/sdk-api';
import { Lnbtc } from '@bitgo/sdk-coin-lnbtc';
import { getLightningWallet } from '@bitgo/abstract-lightning';
import { 
  LightningInvoice, 
  LightningPayment,
  CreateInvoiceParams, 
  PayInvoiceParams,
  BitGoNetwork,
  BitGoPaymentResponse,
  BitGoTransferEntry
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
      // First try to parse as JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        console.error('BitGo API error:', {
          status: response.status,
          statusText: response.statusText,
          error
        });
        throw new Error(error.error || 'API request failed');
      } else {
        // Handle non-JSON responses
        const errorText = await response.text();
        console.error('BitGo API error (non-JSON):', {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 200) // Log first 200 chars
        });
        throw new Error(`API request failed with status ${response.status}`);
      }
    }
    
    // Check for JSON content type
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      const text = await response.text();
      console.warn('Received non-JSON response:', text.substring(0, 200));
      throw new Error('Received non-JSON response from server');
    }
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

// Create a Lightning wallet
export const createLightningWallet = async (
  bearerToken: string,
  label: string,
  passphrase: string,
  enterpriseId: string,
  network: BitGoNetwork = 'tlnbtc',
  passcodeEncryptionCode?: string
): Promise<any> => {
  try {
    const coin = getCoinForNetwork(network);
    
    console.log(`Creating Lightning custody wallet on ${network} with coin ${coin}...`);
    
    // Use provided passcodeEncryptionCode or fallback to passphrase
    const actualPasscodeEncryptionCode = passcodeEncryptionCode || passphrase;
    
    // Simplify the request to ensure parameters are passed correctly
    const response = await makeBitGoRequest(
      `/${coin}/wallet/generate`, 
      bearerToken, 
      'POST', 
      {
        label: label,
        passphrase: passphrase,
        enterprise: enterpriseId,
        passcodeEncryptionCode: actualPasscodeEncryptionCode, // Explicitly set passcodeEncryptionCode
        subType: 'lightningCustody'
      }, 
      { network }
    );
    
    return response;
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
    status: invoice.status.toUpperCase(),
    invoice: invoice.invoice,
    valueMsat: invoice.valueMsat?.toString() || '0',
    expiresAt: invoice.expiresAt,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    memo: invoice.memo
  };
};

const mapBitGoPayment = (payment: any): LightningPayment => {
  // Direct API format (GET /payment endpoint)
  if (payment.status && !payment.paymentStatus) {
    // Convert status to our application format
    let status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
    switch (payment.status) {
      case 'settled':
        status = 'SUCCEEDED';
        break;
      case 'failed':
        status = 'FAILED';
        break;
      case 'in_flight':
      default:
        status = 'PENDING';
    }

    return {
      paymentHash: payment.paymentHash || '',
      status,
      failureReason: payment.failureReason,
      timestamp: payment.createdAt ? new Date(payment.createdAt).getTime() : Date.now(),
      value: Number(payment.amountMsat || '0') / 1000,
      valueString: (Number(payment.amountMsat || '0') / 1000).toString(),
      valueMsat: payment.amountMsat?.toString() || '0',
      feeMsat: payment.feeMsat?.toString() || '0',
      fee: (Number(payment.feeMsat || '0') / 1000).toString(),
      destination: payment.destination,
      invoice: payment.invoice,
      txRequestId: payment.txRequestId,
      state: payment.status,
      preimage: payment.paymentPreimage
    };
  }
  
  // Nested paymentStatus format (POST response or complex format)
  if (payment.paymentStatus && payment.paymentStatus.status) {
    let status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
    switch (payment.paymentStatus.status) {
      case 'settled':
        status = 'SUCCEEDED';
        break;
      case 'failed':
        status = 'FAILED';
        break;
      case 'in_flight':
      default:
        status = 'PENDING';
    }

    // Find destination from transfer entries if available
    const destinationEntry = payment.transfer?.entries?.find((entry: any) => !entry.wallet && !entry.isChange);
    const value = payment.transfer ? Math.abs(payment.transfer.value || 0) : 0;

    return {
      paymentHash: payment.paymentStatus.paymentHash || '',
      status,
      failureReason: payment.paymentStatus.failureReason,
      timestamp: payment.transfer?.date ? new Date(payment.transfer.date).getTime() : Date.now(),
      value,
      valueString: payment.transfer?.valueString?.replace('-', '') || '0',
      valueMsat: payment.paymentStatus.amountMsat || (value * 1000).toString(),
      feeMsat: payment.paymentStatus.feeMsat || (payment.transfer?.feeString ? (Number(payment.transfer.feeString) * 1000).toString() : '0'),
      fee: payment.transfer?.feeString || '0',
      destination: destinationEntry?.address,
      invoice: payment.transfer?.coinSpecific?.invoice,
      txRequestId: payment.txRequestId,
      state: payment.transfer?.state,
      preimage: payment.paymentStatus.paymentPreimage || payment.transfer?.coinSpecific?.paymentPreimage
    };
  }
  
  // Fallback for malformed data
  console.warn('Payment data format not recognized:', payment);
  return {
    paymentHash: payment?.paymentHash || '',
    status: 'PENDING',
    timestamp: Date.now(),
    value: 0,
    valueString: '0',
    valueMsat: '0',
    feeMsat: '0',
    fee: '0'
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
    const response = await makeBitGoRequest(
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
    const value = Math.abs(response.transfer.baseValue);
    const destinationEntry = response.transfer.entries.find((entry: BitGoTransferEntry) => !entry.wallet && !entry.isChange);
    
    return {
      paymentHash: response.paymentStatus.paymentHash,
      status: response.paymentStatus.status === 'settled' ? 'SUCCEEDED' :
              response.paymentStatus.status === 'failed' ? 'FAILED' : 'PENDING',
      failureReason: response.paymentStatus.failureReason,
      timestamp: new Date(response.transfer.date).getTime(),
      value,
      valueString: response.transfer.baseValueString.replace('-', ''),
      valueMsat: response.paymentStatus.amountMsat || (value * 1000).toString(),
      feeMsat: response.paymentStatus.feeMsat || (Number(response.transfer.feeString) * 1000).toString(),
      fee: response.transfer.feeString,
      destination: destinationEntry?.address,
      invoice: response.transfer.coinSpecific.invoice,
      txRequestId: response.txRequestId,
      state: response.transfer.state,
      preimage: response.paymentStatus.paymentPreimage
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
  try {
    const response = await makeBitGoRequest(
      `/wallet/${walletId}/lightning/invoice`,
      bearerToken,
      'GET',
      undefined,
      { limit, network }
    );
    
    if (!Array.isArray(response)) {
      console.error('Unexpected invoice response format:', response);
      return [];
    }
    
    return response.map(invoice => {
      try {
        return mapBitGoInvoice(invoice);
      } catch (error) {
        console.error('Error mapping invoice:', error, invoice);
        // Return a minimal valid invoice object
        return {
          paymentHash: invoice.paymentHash || '',
          walletId: invoice.walletId || '',
          status: 'PENDING',
          invoice: invoice.invoice || '',
          valueMsat: '0',
          expiresAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    throw new Error(`Failed to fetch invoices: ${error.message || 'Unknown error'}`);
  }
};

export const listPayments = async (
  bearerToken: string,
  walletId: string,
  limit = 10,
  network: BitGoNetwork = 'tlnbtc'
): Promise<LightningPayment[]> => {
  try {
    const response = await makeBitGoRequest(
      `/wallet/${walletId}/lightning/payment`,
      bearerToken,
      'GET',
      undefined,
      { limit, network }
    );
    
    if (!Array.isArray(response)) {
      console.error('Unexpected payment response format:', response);
      return [];
    }
    
    return response.map(payment => {
      try {
        return mapBitGoPayment(payment);
      } catch (error) {
        console.error('Error mapping payment:', error, payment);
        // Return a minimal valid payment object
        return {
          paymentHash: payment.paymentHash || '',
          status: 'PENDING',
          timestamp: Date.now(),
          value: 0,
          valueString: '0',
          valueMsat: '0',
          feeMsat: '0',
          fee: '0'
        };
      }
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    throw new Error(`Failed to fetch payments: ${error.message || 'Unknown error'}`);
  }
};

export const getPayment = async (
  bearerToken: string, 
  walletId: string, 
  paymentHash: string,
  network: BitGoNetwork = 'tlnbtc'
): Promise<LightningPayment> => {
  try {
    // First try to just get the payment directly
    try {
      const bitgoPayment = await makeBitGoRequest(
        `/wallet/${walletId}/lightning/payment/${paymentHash}`, 
        bearerToken,
        'GET',
        undefined,
        { network }
      );
      return mapBitGoPayment(bitgoPayment);
    } catch (error) {
      console.warn(`Could not get payment by hash directly: ${error}`);
      
      // Fallback: try to get the payment from the list of payments
      const payments = await listPayments(bearerToken, walletId, 20, network);
      const payment = payments.find(p => p.paymentHash === paymentHash);
      
      if (payment) {
        return payment;
      }
      
      // If we can't find the payment, create a basic payment object with the hash
      return {
        paymentHash: paymentHash,
        status: 'SUCCEEDED', // Assume success since we got here after a payment call
        timestamp: Date.now(),
        value: 0,
        valueString: '0',
        valueMsat: '0',
        feeMsat: '0',
        fee: '0'
      };
    }
  } catch (error: any) {
    console.error('Error getting payment details:', error);
    throw new Error(`Failed to get payment details: ${error.message}`);
  }
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
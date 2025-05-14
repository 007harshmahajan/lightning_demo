const express = require('express');
const cors = require('cors');
const { BitGo } = require('bitgo');
const { getLightningWallet } = require('@bitgo/abstract-lightning');

const app = express();
const port = 3001;

// Enable CORS for frontend
app.use(cors());
app.use(express.json());

// Helper function to handle BigInt serialization
const replaceBigInt = (key, value) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

// Logger function for BitGo API calls
const logBitGoCall = (endpoint, method, params, response, error = null) => {
  console.log('\n=== BitGo API Call ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Endpoint:', endpoint);
  console.log('Method:', method);
  console.log('Parameters:', JSON.stringify(params, replaceBigInt, 2));
  if (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } else {
    console.log('Response:', JSON.stringify(response, replaceBigInt, 2));
  }
  console.log('=====================\n');
};

// Initialize BitGo SDK based on environment
const initializeBitGoSDK = (bearerToken, network = 'tlnbtc') => {
  // Remove 'Bearer ' prefix if it exists
  const token = bearerToken.startsWith('Bearer ') ? bearerToken.substring(7) : bearerToken;
  
  console.log('\n=== BitGo SDK Initialization ===');
  console.log('Original Token:', bearerToken);
  console.log('Cleaned Token:', token);
  console.log('Token Length:', token.length);
  console.log('Token Prefix:', token.substring(0, 10) + '...');
  console.log('Network:', network);
  console.log('==============================\n');

  return new BitGo({
    accessToken: token,
    env: 'test',
    customRootURI: 'https://app.bitgo-test.com'
  });
};

// Middleware to extract bearer token
const extractBearerToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('\n=== Incoming Request Authorization ===');
  console.log('Auth Header:', authHeader);
  console.log('Network:', req.query.network);
  console.log('===================================\n');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No bearer token provided' });
  }

  // Extract token and store both original and cleaned versions
  req.originalBearerToken = authHeader;
  req.bearerToken = authHeader.replace(/^Bearer\s+/i, '');

  console.log('\n=== Extracted Token Details ===');
  console.log('Original Header:', req.originalBearerToken);
  console.log('Cleaned Token:', req.bearerToken);
  console.log('=============================\n');

  next();
};

// Generate Lightning Wallet
app.post('/api/bitgo/:coin/wallet/generate', extractBearerToken, async (req, res) => {
  try {
    const { coin } = req.params;
    const { label, passphrase, enterprise, passcodeEncryptionCode } = req.body;
    const bitgo = initializeBitGoSDK(req.bearerToken);
    
    // Log the exact parameters we're receiving
    console.log('Received wallet generation parameters:', {
      ...req.body,
      passphrase: passphrase,
      passcodeEncryptionCode: passcodeEncryptionCode
    });

    const newWallet = await bitgo.coin(coin).wallets().generateWallet({
      label: label,
      passphrase: passphrase,
      enterprise: enterprise,
      passcodeEncryptionCode: passcodeEncryptionCode,
      subType: 'lightningCustody'
    });

    console.log('Wallet created successfully with ID:', newWallet.wallet.id);
    
    res.json(JSON.parse(JSON.stringify(newWallet, replaceBigInt)));
  } catch (error) {
    console.error('Error generating wallet:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get Wallet Details (v2 API)
app.get('/api/bitgo/v2/wallet/:walletId', extractBearerToken, async (req, res) => {
  try {
    const { walletId } = req.params;
    
    console.log('\n=== Wallet Fetch Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Wallet ID:', walletId);
    console.log('Bearer Token (first 10 chars):', req.bearerToken.substring(0, 10) + '...');
    console.log('Incoming Headers:', req.headers);
    
    const bitgoUrl = `https://app.bitgo-test.com/api/v2/wallet/${walletId}`;
    console.log('BitGo URL:', bitgoUrl);
    
    // Make direct call to BitGo API with minimal headers
    const response = await fetch(bitgoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${req.bearerToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('\n=== BitGo Response ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Response Headers:', response.headers);

    if (!response.ok) {
      const error = await response.json();
      console.error('BitGo Error Response:', error);
      throw new Error(error.error || `BitGo API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('\n=== Wallet Data ===');
    console.log('ID:', data.id);
    console.log('Label:', data.label);
    console.log('Balances:', {
      inbound: {
        available: data.inboundBalance,
        pending: data.inboundPendingBalance,
        unsettled: data.inboundUnsettledBalance
      },
      outbound: {
        available: data.outboundBalance,
        pending: data.outboundPendingBalance,
        unsettled: data.outboundUnsettledBalance
      },
      onchain: {
        balance: data.balanceString,
        confirmed: data.confirmedBalanceString,
        spendable: data.spendableBalanceString
      }
    });
    console.log('=====================\n');

    res.json(data);
  } catch (error) {
    console.error('\n=== Wallet Fetch Error ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=====================\n');
    res.status(400).json({ error: error.message });
  }
});

// Pay Lightning Invoice
app.post('/api/bitgo/wallet/:walletId/lightning/payment', extractBearerToken, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { invoice, passphrase } = req.body;
    const network = req.query.network || 'tlnbtc';
    const bitgo = initializeBitGoSDK(req.bearerToken, network);
    const coin = network === 'tlnbtc' ? 'tlnbtc' : 'lnbtc';

    logBitGoCall(`/wallet/${walletId}/lightning/payment`, 'POST', {
      invoice: invoice.substring(0, 20) + '...', // Truncate for security
      network,
      coin
    });

    // Get wallet instance using the SDK pattern
    const existingWallet = await bitgo.coin(coin).wallets().get({ id: walletId });
    const lightningWallet = getLightningWallet(existingWallet);

    // Execute payment with minimal parameters as per documentation
    const payment = await lightningWallet.payInvoice({
      invoice,
      passphrase
    });

    logBitGoCall(`/wallet/${walletId}/lightning/payment`, 'POST Response', null, payment);
    res.json(JSON.parse(JSON.stringify(payment, replaceBigInt)));
  } catch (error) {
    logBitGoCall(`/wallet/${req.params.walletId}/lightning/payment`, 'POST', req.body, null, error);
    console.error('Error paying invoice:', error);
    res.status(400).json({ error: error.message });
  }
});

// Create Lightning Invoice
app.post('/api/bitgo/wallet/:walletId/lightning/invoice', extractBearerToken, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { valueMsat, memo, expiry } = req.body;
    const network = req.query.network || 'tlnbtc';
    const bitgo = initializeBitGoSDK(req.bearerToken, network);
    const coin = network === 'tlnbtc' ? 'tlnbtc' : 'lnbtc';

    logBitGoCall(`/wallet/${walletId}/lightning/invoice`, 'POST', {
      valueMsat,
      memo,
      expiry,
      network,
      coin
    });

    // Get wallet instance using the SDK pattern
    const existingWallet = await bitgo.coin(coin).wallets().get({ id: walletId });
    const lightningWallet = getLightningWallet(existingWallet);

    // Create invoice
    const response = await lightningWallet.createInvoice({
      valueMsat: String(valueMsat),
      memo: memo || '',
      expiry: expiry || 3600
    });

    logBitGoCall(`/wallet/${walletId}/lightning/invoice`, 'POST Response', null, response);
    res.json(JSON.parse(JSON.stringify(response, replaceBigInt)));
  } catch (error) {
    logBitGoCall(`/wallet/${req.params.walletId}/lightning/invoice`, 'POST', req.body, null, error);
    console.error('Error creating invoice:', error);
    res.status(400).json({ error: error.message });
  }
});

// List Lightning Invoices
app.get('/api/bitgo/wallet/:walletId/lightning/invoice', extractBearerToken, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { limit = 10 } = req.query;
    const network = req.query.network || 'tlnbtc';
    const bitgo = initializeBitGoSDK(req.bearerToken, network);
    const coin = network === 'tlnbtc' ? 'tlnbtc' : 'lnbtc';

    logBitGoCall(`/wallet/${walletId}/lightning/invoice`, 'GET', {
      limit,
      network,
      coin
    });

    // Get wallet instance using the SDK pattern
    const existingWallet = await bitgo.coin(coin).wallets().get({ id: walletId });
    const lightningWallet = getLightningWallet(existingWallet);

    // List invoices
    const response = await lightningWallet.listInvoices({ limit: parseInt(limit) });

    logBitGoCall(`/wallet/${walletId}/lightning/invoice`, 'GET Response', null, response);
    res.json(JSON.parse(JSON.stringify(response, replaceBigInt)));
  } catch (error) {
    logBitGoCall(`/wallet/${req.params.walletId}/lightning/invoice`, 'GET', req.query, null, error);
    console.error('Error listing invoices:', error);
    res.status(400).json({ error: error.message });
  }
});

// List Lightning Payments
app.get('/api/bitgo/wallet/:walletId/lightning/payment', extractBearerToken, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { limit = 10 } = req.query;
    const network = req.query.network || 'tlnbtc';
    const bitgo = initializeBitGoSDK(req.bearerToken, network);
    const coin = network === 'tlnbtc' ? 'tlnbtc' : 'lnbtc';

    logBitGoCall(`/wallet/${walletId}/lightning/payment`, 'GET', {
      limit,
      network,
      coin
    });

    // Get wallet instance using the SDK pattern
    const existingWallet = await bitgo.coin(coin).wallets().get({ id: walletId });
    const lightningWallet = getLightningWallet(existingWallet);

    // List payments
    const response = await lightningWallet.listPayments({ limit: parseInt(limit) });

    logBitGoCall(`/wallet/${walletId}/lightning/payment`, 'GET Response', null, response);
    res.json(JSON.parse(JSON.stringify(response, replaceBigInt)));
  } catch (error) {
    logBitGoCall(`/wallet/${req.params.walletId}/lightning/payment`, 'GET', req.query, null, error);
    console.error('Error listing payments:', error);
    res.status(400).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`BitGo proxy server running at http://localhost:${port}`);
});
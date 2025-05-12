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
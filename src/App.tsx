import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import WalletSetup from './components/WalletSetup';
import { WalletCreator } from './components/WalletCreator';
import InvoiceCreator from './components/InvoiceCreator';
import InvoicePayment from './components/InvoicePayment';
import InvoiceList from './components/InvoiceList';
import PaymentList from './components/PaymentList';
import PaymentDetails from './components/PaymentDetails';
import ErrorDisplay from './components/ErrorDisplay';
import { LightningInvoice, LightningPayment, BitGoWallet } from './types/lightning';
import { NetworkProvider } from './contexts/NetworkContext';
import { NetworkSelector } from './components/NetworkSelector';
import { useNetwork } from './contexts/NetworkContext';
import { WalletBalance } from './components/WalletBalance';

// Import the real BitGo service
import * as bitgoService from './services/bitgo';

// Wrap the main content in a component to use the network context
const MainContent: React.FC = () => {
  const { network, setNetwork } = useNetwork();
  const [amount, setAmount] = useState<string>('');
  const [createdInvoice, setCreatedInvoice] = useState<string>(''); // For display only
  const [payInvoiceInput, setPayInvoiceInput] = useState<string>(''); // For pay invoice box
  const [paymentResult, setPaymentResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [invoices, setInvoices] = useState<LightningInvoice[]>([]);
  const [payments, setPayments] = useState<LightningPayment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<LightningPayment | null>(null);
  const [walletId, setWalletId] = useState<string>('');
  const [bearerToken, setBearerToken] = useState('');
  const [passphrase, setPassphrase] = useState<string>('');
  const [showCreateWallet, setShowCreateWallet] = useState<boolean>(false);
  const [showConnectWallet, setShowConnectWallet] = useState<boolean>(false);
  const [connectWalletId, setConnectWalletId] = useState('');
  const [connectPassphrase, setConnectPassphrase] = useState('');
  const [walletData, setWalletData] = useState<BitGoWallet | null>(null);

  // Use useCallback to memoize functions that are used in useEffect
  const fetchInvoices = useCallback(async () => {
    if (!walletId || !bearerToken) return;
    try {
      const response = await bitgoService.listInvoices(bearerToken, walletId);
      setInvoices(response);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError('Error fetching invoices: ' + (err.message || 'Unknown error'));
    }
  }, [walletId, bearerToken]);

  const fetchPayments = useCallback(async () => {
    if (!walletId || !bearerToken) return;
    try {
      const response = await bitgoService.listPayments(bearerToken, walletId);
      setPayments(response);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      setError('Error fetching payments: ' + (err.message || 'Unknown error'));
    }
  }, [walletId, bearerToken]);

  const fetchWalletData = useCallback(async () => {
    if (!walletId || !bearerToken) return;
    try {
      const response = await bitgoService.getBitGoLightningWallet(bearerToken, walletId, network);
      setWalletData(response);
    } catch (err: any) {
      console.error('Error fetching wallet data:', err);
      setError('Error fetching wallet data: ' + (err.message || 'Unknown error'));
    }
  }, [walletId, bearerToken, network]);

  // Fetch invoices, payments, and wallet data on component mount or wallet ID change
  useEffect(() => {
    if (walletId) {
      fetchInvoices();
      fetchPayments();
      fetchWalletData();
    }
  }, [walletId, fetchInvoices, fetchPayments, fetchWalletData]);

  const handleCreateInvoice = async (amount: string) => {
    if (!walletId || !bearerToken) {
      setError('Please enter wallet ID and bearer token');
      return;
    }
    try {
      setLoading(true);
      const response = await bitgoService.createInvoice(
        bearerToken, 
        walletId, 
        {
          valueMsat: BigInt(parseInt(amount) * 1000), // Convert satoshis to millisatoshis
          memo: 'Test invoice',
          expiry: 3600, // 1 hour expiry
        },
        network
      );
      setCreatedInvoice(response.invoice);
      await fetchInvoices(); // Refresh the invoice list
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      setError('Failed to create invoice: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async (invoice: string) => {
    if (!walletId || !bearerToken) {
      setError('Please enter wallet ID and bearer token');
      return;
    }
    try {
      if (!passphrase) {
        setError('Please enter your passphrase');
        return;
      }
      setLoading(true);
      setError('');
      setPaymentResult('');
      
      try {
        const response = await bitgoService.payInvoice(
          bearerToken,
          walletId, 
          {
            paymentRequest: invoice,
            maxFeeMsat: BigInt(1000000), // 1000 sats in millisatoshis for fee limit
          },
          passphrase,
          network
        );

        // If we get here, the payment was sent successfully 
        // Payment hash is available, show immediate feedback
        setPaymentResult(`Payment sent! Payment Hash: ${response.paymentHash}${response.preimage ? ` | Preimage: ${response.preimage}` : ''}`);
        
        // Wait for a moment and fetch the payment status for additional information
        try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const payment = await bitgoService.getPayment(bearerToken, walletId, response.paymentHash, network);
          
          if (payment.status === 'FAILED') {
            throw new Error(payment.failureReason || 'Payment verification failed');
          } else if (payment.status === 'PENDING') {
            setPaymentResult(`Payment is being processed. Payment Hash: ${payment.paymentHash}${payment.preimage ? ` | Preimage: ${payment.preimage}` : ''}`);
          } else {
            setPaymentResult(`Payment successful! Amount: ${payment.value} sats, Fee: ${payment.fee} sats, Hash: ${payment.paymentHash}${payment.preimage ? ` | Preimage: ${payment.preimage}` : ''}`);
          }
        } catch (verifyError) {
          // If we can't verify the payment status, still consider it successful since the initial request worked
          console.warn('Could not verify payment status:', verifyError);
          setPaymentResult(`Payment sent successfully, but could not verify final status. Payment Hash: ${response.paymentHash}`);
        }
        
        // Refresh the payment list
        await fetchPayments();
      } catch (invoiceError: any) {
        // This is a payment submission error
        console.error('Error submitting payment:', invoiceError);
        setError(`Failed to submit payment: ${invoiceError.message}`);
      }
    } catch (err: any) {
      console.error('Error paying invoice:', err);
      setError(`Failed to pay invoice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletCreated = (newWalletId: string) => {
    setWalletId(newWalletId);
    setShowCreateWallet(false);
  };

  const handleConnectWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectWalletId || !connectPassphrase) {
      alert('Please enter both Wallet ID and Passphrase');
      return;
    }
    setWalletId(connectWalletId);
    setPassphrase(connectPassphrase);
    setShowConnectWallet(false);
  };

  return (
    <div className="App">
      <div className="container">
        <header className="card-header text-center">
          <h1 className="text-4xl font-bold mb-8">BitGo Lightning Wallet Demo</h1>
          
          <div className="network-selector">
            <NetworkSelector
              value={network}
              onChange={setNetwork}
              className="w-full max-w-md mx-auto"
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              placeholder="Enter Bearer Token"
              value={bearerToken}
              onChange={(e) => setBearerToken(e.target.value)}
              className="form-control max-w-md mx-auto"
            />
          </div>
        </header>

        {!walletId ? (
          <div className="card">
            <div className="flex justify-center gap-4 mb-6">
              <button 
                className="btn btn-secondary"
                onClick={() => { setShowConnectWallet(true); setShowCreateWallet(false); }}
              >
                Connect Wallet
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => { setShowCreateWallet(true); setShowConnectWallet(false); }}
              >
                Create Wallet
              </button>
            </div>

            {showConnectWallet && (
              <form onSubmit={handleConnectWallet} className="card">
                <h2 className="card-title mb-4">Connect Existing Wallet</h2>
                <div className="space-y-4">
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Wallet ID"
                      value={connectWalletId}
                      onChange={(e) => setConnectWalletId(e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="password"
                      placeholder="Wallet Passphrase"
                      value={connectPassphrase}
                      onChange={(e) => setConnectPassphrase(e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary w-full"
                    disabled={!connectWalletId || !connectPassphrase}
                  >
                    Connect
                  </button>
                </div>
              </form>
            )}

            {showCreateWallet && (
              <WalletCreator onWalletCreated={handleWalletCreated} bearerToken={bearerToken} />
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {walletData && (
              <div className="card">
                <h2 className="card-title mb-4">Wallet Balance</h2>
                <WalletBalance wallet={walletData} />
              </div>
            )}

            <div className="card">
              <h2 className="card-title">Create Invoice</h2>
              <div className="invoice-form">
                <InvoiceCreator
                  onCreateInvoice={handleCreateInvoice}
                  isLoading={loading}
                />
              </div>

              {createdInvoice && (
                <div className="invoice-result">
                  <p className="font-medium mb-2">Created Invoice:</p>
                  <code className="block p-3 bg-background-darker rounded-md overflow-x-auto">
                    {createdInvoice}
                  </code>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="card-title">Pay Invoice</h2>
              <InvoicePayment
                onPayInvoice={handlePayInvoice}
                isLoading={loading}
              />

              {paymentResult && (
                <div className="message message-success">
                  <p>{paymentResult}</p>
                </div>
              )}
            </div>

            <div className="list-grid">
              <div className="card">
                <h2 className="card-title">Recent Invoices</h2>
                {invoices.length > 0 ? (
                  <InvoiceList invoices={invoices} />
                ) : (
                  <div className="list-empty">No invoices found</div>
                )}
              </div>

              <div className="card">
                <h2 className="card-title">Recent Payments</h2>
                {payments.length > 0 ? (
                  <PaymentList 
                    payments={payments} 
                    onPaymentSelect={setSelectedPayment} 
                  />
                ) : (
                  <div className="list-empty">No payments found</div>
                )}
              </div>
            </div>

            {selectedPayment && (
              <PaymentDetails 
                payment={selectedPayment} 
                onClose={() => setSelectedPayment(null)} 
              />
            )}

            {error && (
              <div className="message message-error">
                <p>{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <NetworkProvider>
      <MainContent />
    </NetworkProvider>
  );
};

export default App; 
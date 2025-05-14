import React, { useState } from 'react';
import { createLightningWallet } from '../services/bitgo';
import { BitGoNetwork } from '../types/lightning';

interface WalletCreatorProps {
  onWalletCreated: (walletId: string) => void;
  bearerToken: string;
}

export const WalletCreator: React.FC<WalletCreatorProps> = ({ onWalletCreated, bearerToken }) => {
  const [label, setLabel] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [passcodeEncryptionCode, setPasscodeEncryptionCode] = useState('');
  const [enterpriseId, setEnterpriseId] = useState('');
  const [backupInfo, setBackupInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateWallet = async () => {
    if (!bearerToken) {
      setError('Bearer token is missing');
      return;
    }

    if (!label) {
      setError('Please enter a wallet label');
      return;
    }

    if (!passphrase) {
      setError('Please enter a wallet passphrase');
      return;
    }

    if (!passcodeEncryptionCode) {
      setError('Please enter a passcode encryption code');
      return;
    }

    if (!enterpriseId) {
      setError('Please enter your enterprise ID');
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      
      console.log('Creating wallet with params:', {
        label,
        enterpriseId,
        passphrase: '********', // Hide actual passphrase in logs
        passcodeEncryptionCode: '********' // Hide actual encryption code in logs
      });
      
      // Create the wallet with required passcodeEncryptionCode
      const result = await createLightningWallet(
        bearerToken,
        label,
        passphrase,
        enterpriseId,
        'tlnbtc' as BitGoNetwork,
        passcodeEncryptionCode
      );

      // Store wallet information for display
      setBackupInfo(result);

      // Notify parent component
      onWalletCreated(result.wallet.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Lightning Wallet</h2>
      
      <div className="space-y-4">
        <div className="form-group">
          <input
            type="text"
            placeholder="Wallet Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="form-control w-full p-3 bg-background-darker border border-border rounded-md"
          />
        </div>
        
        <div className="form-group">
          <input
            type="password"
            placeholder="Wallet Passphrase"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="form-control w-full p-3 bg-background-darker border border-border rounded-md"
          />
          <p className="text-xs text-text-secondary mt-1">
            This passphrase will be used to secure your wallet. Store it securely - you'll need it to access your wallet.
          </p>
        </div>

        <div className="form-group">
          <input
            type="password"
            placeholder="Passcode Encryption Code"
            value={passcodeEncryptionCode}
            onChange={(e) => setPasscodeEncryptionCode(e.target.value)}
            className="form-control w-full p-3 bg-background-darker border border-border rounded-md"
            required
          />
          <p className="text-xs text-text-secondary mt-1">
            Required: Enter a secure encryption code for your wallet. This is separate from your passphrase and provides an additional layer of security.
          </p>
        </div>
        
        <div className="form-group">
          <input
            type="text"
            placeholder="Enterprise ID"
            value={enterpriseId}
            onChange={(e) => setEnterpriseId(e.target.value)}
            className="form-control w-full p-3 bg-background-darker border border-border rounded-md"
          />
        </div>
      </div>

      {error && (
        <div className="error-message bg-red-500 bg-opacity-20 text-red-500 p-3 rounded-md mt-4">
          {error}
        </div>
      )}

      <button 
        onClick={handleCreateWallet} 
        disabled={isLoading}
        className="btn btn-primary w-full mt-6 p-3 rounded-md"
      >
        {isLoading ? 'Creating Wallet...' : 'Create Wallet'}
      </button>

      {backupInfo && (
        <div className="backup-info mt-6 p-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-md">
          <h3 className="text-xl font-bold text-green-500 mb-2">Wallet Created Successfully!</h3>
          <p className="mb-2">Wallet ID: <span className="font-mono">{backupInfo.wallet.id}</span></p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 mb-4">
            {/* Lightning Inbound Balance */}
            <div className="p-3 bg-background-darker rounded-md">
              <h4 className="text-sm font-semibold text-text-secondary mb-1">Lightning Inbound</h4>
              <div className="space-y-1">
                <p className="text-sm">
                  Available: <span className="font-mono">{formatSats(backupInfo.wallet.inboundBalance)}</span> sats
                </p>
                <p className="text-sm">
                  Pending: <span className="font-mono">{formatSats(backupInfo.wallet.inboundPendingBalance)}</span> sats
                </p>
                <p className="text-sm">
                  Unsettled: <span className="font-mono">{formatSats(backupInfo.wallet.inboundUnsettledBalance)}</span> sats
                </p>
              </div>
            </div>

            {/* Lightning Outbound Balance */}
            <div className="p-3 bg-background-darker rounded-md">
              <h4 className="text-sm font-semibold text-text-secondary mb-1">Lightning Outbound</h4>
              <div className="space-y-1">
                <p className="text-sm">
                  Available: <span className="font-mono">{formatSats(backupInfo.wallet.outboundBalance)}</span> sats
                </p>
                <p className="text-sm">
                  Pending: <span className="font-mono">{formatSats(backupInfo.wallet.outboundPendingBalance)}</span> sats
                </p>
                <p className="text-sm">
                  Unsettled: <span className="font-mono">{formatSats(backupInfo.wallet.outboundUnsettledBalance)}</span> sats
                </p>
              </div>
            </div>

            {/* Onchain Balance */}
            <div className="p-3 bg-background-darker rounded-md">
              <h4 className="text-sm font-semibold text-text-secondary mb-1">Onchain Balance</h4>
              <div className="space-y-1">
                <p className="text-sm">
                  Total: <span className="font-mono">{formatSats(backupInfo.wallet.balanceString)}</span> sats
                </p>
                <p className="text-sm">
                  Confirmed: <span className="font-mono">{formatSats(backupInfo.wallet.confirmedBalanceString)}</span> sats
                </p>
                <p className="text-sm">
                  Spendable: <span className="font-mono">{formatSats(backupInfo.wallet.spendableBalanceString)}</span> sats
                </p>
              </div>
            </div>
          </div>

          <p className="mb-2">Please save your backup information:</p>
          <div className="max-h-60 overflow-y-auto">
            <pre className="bg-background-darker p-3 rounded-md text-sm overflow-x-auto">
              {JSON.stringify(backupInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format satoshi values
const formatSats = (value: string): string => {
  try {
    return new Intl.NumberFormat().format(parseInt(value || '0'));
  } catch (error) {
    return '0';
  }
};
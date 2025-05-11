import React, { useState } from 'react';
import { createLightningWallet } from '../services/bitgo';

interface WalletCreatorProps {
  onWalletCreated: (walletId: string) => void;
}

export const WalletCreator: React.FC<WalletCreatorProps> = ({ onWalletCreated }) => {
  const [label, setLabel] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [passcodeEncryptionCode, setPasscodeEncryptionCode] = useState('');
  const [bearerToken, setBearerToken] = useState('');
  const [backupInfo, setBackupInfo] = useState<any>(null);
  const [error, setError] = useState('');

  const handleCreateWallet = async () => {
    if (!bearerToken) {
      setError('Please enter bearer token');
      return;
    }

    try {
      setError('');
      
      // Create the wallet
      const result = await createLightningWallet(
        bearerToken,
        label,
        passphrase,
        passcodeEncryptionCode
      );

      // Store wallet information for display
      setBackupInfo({
        walletId: result.wallet.id,
        userKeychain: result.userKeychain,
        passcodeEncryptionCode: result.passcodeEncryptionCode
      });

      // Notify parent component
      onWalletCreated(result.wallet.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create wallet');
    }
  };

  return (
    <div className="wallet-creator">
      <h2>Create New Lightning Wallet</h2>
      
          <div className="input-group">
            <input
              type="text"
          placeholder="Enter Bearer Token"
          value={bearerToken}
          onChange={(e) => setBearerToken(e.target.value)}
        />
        <input
          type="text"
          placeholder="Wallet Label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <input
              type="password"
          placeholder="Passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
        />
        <input
          type="password"
          placeholder="Passcode Encryption Code"
          value={passcodeEncryptionCode}
          onChange={(e) => setPasscodeEncryptionCode(e.target.value)}
            />
          </div>

      {error && <div className="error">{error}</div>}

      <button onClick={handleCreateWallet}>Create Wallet</button>

      {backupInfo && (
        <div className="backup-info">
          <h3>Wallet Created Successfully!</h3>
          <p>Wallet ID: {backupInfo.walletId}</p>
          <p>Please save your backup information:</p>
          <pre>{JSON.stringify(backupInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
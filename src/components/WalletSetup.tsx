import React, { useState } from 'react';

interface WalletSetupProps {
  onWalletIdSet: (walletId: string) => void;
  onPassphraseSet: (passphrase: string) => void;
}

const WalletSetup: React.FC<WalletSetupProps> = ({ onWalletIdSet, onPassphraseSet }) => {
  const [walletId, setWalletId] = useState<string>('');
  const [passphrase, setPassphrase] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onWalletIdSet(walletId);
    onPassphraseSet(passphrase);
  };

  return (
    <div className="section">
      <h2>Connect Existing Wallet</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            placeholder="Wallet ID"
            required
          />
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Wallet Passphrase"
            required
          />
          <button type="submit">Connect Wallet</button>
        </div>
      </form>
    </div>
  );
};

export default WalletSetup; 
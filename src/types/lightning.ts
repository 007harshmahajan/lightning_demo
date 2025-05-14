// Network Types
export type BitGoNetwork = 'tlnbtc' | 'lnbtc';
export type BitGoEnvironment = 'test' | 'prod';

export interface NetworkConfig {
  network: BitGoNetwork;
  environment: BitGoEnvironment;
  apiUrl: string;
  displayName: string;
  description: string;
}

// BitGo Response Types
export interface BitGoLightningInvoice {
  valueMsat: bigint;
  paymentHash: string;
  invoice: string;
  walletId: string;
  status: "open" | "settled" | "canceled";
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  memo?: string;
}

export interface BitGoPaymentStatus {
  paymentHash: string;
  status: "settled" | "in_flight" | "failed";
  failureReason?: string;
}

export interface BitGoTransferEntry {
  address: string;
  wallet?: string;
  value: number;
  valueString: string;
  isChange?: boolean;
  isPayGo?: boolean;
}

export interface BitGoTransfer {
  entries: BitGoTransferEntry[];
  id: string;
  coin: string;
  wallet: string;
  txid: string;
  date: string;
  value: number;
  valueString: string;
  feeString: string;
  state: string;
  coinSpecific: {
    isOffchain: boolean;
  invoice: string;
    _requestId: string;
  };
}

export interface BitGoPaymentResponse {
  txRequestId: string;
  txRequestState: string;
  paymentStatus: BitGoPaymentStatus;
  transfer: BitGoTransfer;
}

// Our Application Types
export interface LightningInvoice {
  paymentHash: string;
  walletId: string;
  status: string;
  invoice: string;
  valueMsat: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  memo?: string;
}

export interface LightningPayment {
  paymentHash: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  failureReason?: string;
  timestamp: number;
  value: number;
  valueString: string;
  valueMsat: string;
  feeMsat: string;
  fee: string;
  destination?: string;
  invoice?: string;
  txRequestId?: string;
  state?: string;
  preimage?: string;
}

export interface CreateInvoiceParams {
  valueMsat: bigint;
  memo?: string;
  expiry?: number;
}

export interface PayInvoiceParams {
  paymentRequest: string;
  maxFeeMsat: bigint;
  memo?: string;
  amountMsat?: bigint;
}

export interface BitGoWallet {
  id: string;
  label: string;
  enterprise: string;
  coin: string;
  // Lightning-specific balances
  inboundBalance: string;
  inboundPendingBalance: string;
  inboundUnsettledBalance: string;
  outboundBalance: string;
  outboundPendingBalance: string;
  outboundUnsettledBalance: string;
  // On-chain balances
  balanceString: string;
  confirmedBalanceString: string;
  spendableBalanceString: string;
  // Other wallet properties
  type: string;
  subType: string;
} 
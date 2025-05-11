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

export interface BitGoLightningPayment {
  paymentHash: string;
  walletId: string;
  txRequestId: string;
  status: "settled" | "in_flight" | "failed";
  invoice: string;
  feeLimitMsat: bigint;
  destination: string;
  updatedAt: Date;
  createdAt: Date;
  amountMsat: bigint;
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
  valueMsat: bigint;
  feeMsat: bigint;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  timestamp: number;
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
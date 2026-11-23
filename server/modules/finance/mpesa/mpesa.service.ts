import crypto from 'node:crypto';
import type {
  DarajaOAuthResponse,
  DarajaStkPushRequestPayload,
  DarajaStkPushSuccessResponse,
} from './mpesa.types.ts';
import {
  generateDarajaPassword,
  generateDarajaTimestamp,
  getDarajaConfig,
  isDarajaConfigured,
} from './mpesa.utils.ts';

export interface InitiateStkResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  customerMessage: string;
  responseDescription: string;
  mode: 'LIVE_DARAJA' | 'SANDBOX_SIMULATOR';
}

export const mpesaService = {
  async getAccessToken(): Promise<string> {
    const cfg = getDarajaConfig();
    if (!cfg.consumerKey || !cfg.consumerSecret) {
      throw new Error('Daraja consumer key/secret are not configured.');
    }
    const credentials = Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`, 'utf8').toString(
      'base64'
    );

    const response = await fetch(
      `${cfg.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${credentials}`,
        },
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!response.ok) {
      throw new Error(`Daraja OAuth authentication failed (${response.status}).`);
    }

    const data = (await response.json()) as DarajaOAuthResponse;
    if (!data.access_token) {
      throw new Error('Daraja OAuth response did not contain an access token.');
    }
    return data.access_token;
  },

  async initiateStkPush(input: {
    phoneNumber: string;
    amount: number;
    accountReference: string;
    transactionDesc?: string;
  }): Promise<InitiateStkResult> {
    const cfg = getDarajaConfig();

    if (!isDarajaConfigured()) {
      // Preview/Sandbox simulator mode when Safaricom Daraja credentials are not set in env
      const rand = crypto.randomBytes(5).toString('hex').toUpperCase();
      return {
        merchantRequestId: `SIM-MR-${rand}`,
        checkoutRequestId: `ws_CO_${Date.now()}_${rand}`,
        customerMessage: 'Success. Request accepted for processing (Sandbox Mode)',
        responseDescription: 'Success. Request accepted for processing',
        mode: 'SANDBOX_SIMULATOR',
      };
    }

    const token = await this.getAccessToken();
    const timestamp = generateDarajaTimestamp();
    const password = generateDarajaPassword(cfg.shortCode, cfg.passkey, timestamp);

    const payload: DarajaStkPushRequestPayload = {
      BusinessShortCode: cfg.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: cfg.transactionType,
      Amount: Math.round(input.amount),
      PartyA: input.phoneNumber,
      PartyB: cfg.shortCode,
      PhoneNumber: input.phoneNumber,
      CallBackURL: cfg.callbackUrl,
      AccountReference: (input.accountReference || cfg.accountReference).slice(0, 12),
      TransactionDesc: (input.transactionDesc || cfg.transactionDescription).slice(0, 13),
    };

    const response = await fetch(`${cfg.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });

    const data = (await response.json().catch(() => ({}))) as Partial<DarajaStkPushSuccessResponse> & {
      errorMessage?: string;
    };

    if (!response.ok || data.ResponseCode !== '0' || !data.CheckoutRequestID) {
      throw new Error(
        data.errorMessage ||
          data.ResponseDescription ||
          'Safaricom Daraja STK Push request failed.'
      );
    }

    return {
      merchantRequestId: data.MerchantRequestID || `MR-${Date.now()}`,
      checkoutRequestId: data.CheckoutRequestID,
      customerMessage:
        data.CustomerMessage || 'M-Pesa prompt sent to your mobile phone.',
      responseDescription: data.ResponseDescription || 'Accepted for processing',
      mode: 'LIVE_DARAJA',
    };
  },
};

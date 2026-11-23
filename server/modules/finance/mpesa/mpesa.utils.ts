import type {
  DarajaCallbackMetadataItem,
  ExtractedMpesaCallbackMetadata,
} from './mpesa.types.ts';

const KENYAN_PHONE_PATTERN = /^(\+254|254|0)([17]\d{8})$/;

export function normalizeKenyanPhoneNumber(rawPhone: string): string | null {
  const cleaned = String(rawPhone ?? '').replace(/[\s()-]+/g, '').trim();
  const match = cleaned.match(KENYAN_PHONE_PATTERN);
  if (!match) return null;
  return `254${match[2]}`;
}

export function isValidKenyanPhoneNumber(rawPhone: string): boolean {
  return normalizeKenyanPhoneNumber(rawPhone) !== null;
}

export function generateDarajaTimestamp(date = new Date()): string {
  const pad = (val: number) => String(val).padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hour = pad(date.getUTCHours());
  const minute = pad(date.getUTCMinutes());
  const second = pad(date.getUTCSeconds());
  return `${year}${month}${day}${hour}${minute}${second}`;
}

export function generateDarajaPassword(
  shortCode: string,
  passkey: string,
  timestamp: string
): string {
  return Buffer.from(`${shortCode}${passkey}${timestamp}`, 'utf8').toString('base64');
}

export function extractCallbackMetadata(
  items: DarajaCallbackMetadataItem[] | undefined
): ExtractedMpesaCallbackMetadata {
  if (!Array.isArray(items)) return {};
  const result: ExtractedMpesaCallbackMetadata = {};

  for (const item of items) {
    if (!item || typeof item.Name !== 'string') continue;
    if (item.Name === 'Amount' && item.Value !== undefined) {
      const n = Number(item.Value);
      if (Number.isFinite(n)) result.amount = n;
    } else if (item.Name === 'MpesaReceiptNumber' && item.Value !== undefined) {
      result.mpesaReceiptNumber = String(item.Value).trim();
    } else if (item.Name === 'TransactionDate' && item.Value !== undefined) {
      result.transactionDate = String(item.Value).trim();
    } else if (item.Name === 'PhoneNumber' && item.Value !== undefined) {
      result.phoneNumber = String(item.Value).trim();
    }
  }

  return result;
}

export function getDarajaConfig() {
  const env = process.env.MPESA_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
  const baseUrl =
    env === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

  return {
    env,
    baseUrl,
    consumerKey: (process.env.MPESA_CONSUMER_KEY ?? '').trim(),
    consumerSecret: (process.env.MPESA_CONSUMER_SECRET ?? '').trim(),
    shortCode: (process.env.MPESA_SHORTCODE ?? '').trim(),
    passkey: (process.env.MPESA_PASSKEY ?? '').trim(),
    transactionType:
      process.env.MPESA_TRANSACTION_TYPE === 'CustomerBuyGoodsOnline'
        ? ('CustomerBuyGoodsOnline' as const)
        : ('CustomerPayBillOnline' as const),
    callbackUrl: (process.env.MPESA_CALLBACK_URL ?? '').trim(),
    accountReference: (process.env.MPESA_ACCOUNT_REFERENCE ?? 'HITECH-FEES').trim(),
    transactionDescription: (
      process.env.MPESA_TRANSACTION_DESCRIPTION ?? 'College Fee Payment'
    ).trim(),
  };
}

export function isDarajaConfigured(): boolean {
  const cfg = getDarajaConfig();
  return Boolean(
    cfg.consumerKey &&
      cfg.consumerSecret &&
      cfg.shortCode &&
      cfg.passkey &&
      cfg.callbackUrl
  );
}

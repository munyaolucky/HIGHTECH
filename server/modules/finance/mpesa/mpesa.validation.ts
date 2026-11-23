import { normalizeKenyanPhoneNumber } from './mpesa.utils.ts';
import type { DarajaStkCallbackBody } from './mpesa.types.ts';

export class FinanceHttpError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'FinanceHttpError';
  }
}

export function validateStkPushInput(body: unknown, idempotencyKeyHeader?: string) {
  const obj = (body ?? {}) as Record<string, unknown>;
  const phoneNormalized = normalizeKenyanPhoneNumber(String(obj.phoneNumber ?? ''));
  if (!phoneNormalized) {
    throw new FinanceHttpError(
      400,
      'Enter a valid Kenyan Safaricom/Airtel mobile number (e.g. 0712345678 or 254712345678).'
    );
  }

  const amount = Math.round(Number(obj.amount));
  if (!Number.isFinite(amount) || amount < 100 || amount > 500_000) {
    throw new FinanceHttpError(
      400,
      'Payment amount must be between KES 100 and KES 500,000.'
    );
  }

  const keyFromBody = typeof obj.idempotencyKey === 'string' ? obj.idempotencyKey.trim() : '';
  const idempotencyKey = (idempotencyKeyHeader ?? '').trim() || keyFromBody;
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 120) {
    throw new FinanceHttpError(
      400,
      'A valid Idempotency-Key header is required to prevent duplicate M-Pesa requests.'
    );
  }

  return {
    phoneNumber: phoneNormalized,
    amount,
    idempotencyKey,
  };
}

export function validateBankReferenceInput(body: unknown) {
  const obj = (body ?? {}) as Record<string, unknown>;
  const bankName = String(obj.bankName ?? '').trim();
  const referenceNumber = String(obj.referenceNumber ?? '').trim().toUpperCase();
  const depositedAt = String(obj.depositedAt ?? '').trim();
  const amount = Math.round(Number(obj.amount));
  const notes = typeof obj.notes === 'string' ? obj.notes.trim().slice(0, 300) : undefined;

  if (bankName.length < 3) {
    throw new FinanceHttpError(400, 'Select or enter the receiving bank name.');
  }
  if (!/^[A-Z0-9-]{6,32}$/.test(referenceNumber)) {
    throw new FinanceHttpError(
      400,
      'Enter a valid bank deposit slip or EFT reference number (6-32 alphanumeric characters).'
    );
  }
  if (!Number.isFinite(amount) || amount < 100 || amount > 1_000_000) {
    throw new FinanceHttpError(400, 'Enter a valid deposit amount (KES 100 – 1,000,000).');
  }
  if (!depositedAt) {
    throw new FinanceHttpError(400, 'Specify the bank deposit/transfer date.');
  }

  return { bankName, referenceNumber, amount, depositedAt, notes };
}

export function validatePaymentPlanRequestInput(body: unknown) {
  const obj = (body ?? {}) as Record<string, unknown>;
  const instalmentCount = Number(obj.instalmentCount ?? 3);
  const requestedNotes = String(obj.requestedNotes ?? '').trim().slice(0, 400);

  if (!Number.isInteger(instalmentCount) || instalmentCount < 2 || instalmentCount > 6) {
    throw new FinanceHttpError(400, 'Payment plan instalments must be between 2 and 6.');
  }
  if (requestedNotes.length < 10) {
    throw new FinanceHttpError(
      400,
      'Explain your requested payment schedule or financial arrangement (min 10 characters).'
    );
  }

  return { instalmentCount, requestedNotes };
}

export function validateRefundRequestInput(body: unknown) {
  const obj = (body ?? {}) as Record<string, unknown>;
  const amount = Math.round(Number(obj.amount));
  const reason = String(obj.reason ?? '').trim().slice(0, 500);
  const payoutChannel = obj.payoutChannel === 'BANK' ? ('BANK' as const) : ('MPESA' as const);
  const payoutAccount = String(obj.payoutAccount ?? '').trim();
  const supportingReference =
    typeof obj.supportingReference === 'string'
      ? obj.supportingReference.trim().slice(0, 80)
      : undefined;

  if (!Number.isFinite(amount) || amount < 100 || amount > 500_000) {
    throw new FinanceHttpError(400, 'Refund amount must be between KES 100 and KES 500,000.');
  }
  if (reason.length < 10) {
    throw new FinanceHttpError(400, 'Provide a clear reason for the refund request (min 10 characters).');
  }
  if (payoutChannel === 'MPESA') {
    const normalized = normalizeKenyanPhoneNumber(payoutAccount);
    if (!normalized) {
      throw new FinanceHttpError(400, 'Provide a valid M-Pesa payout phone number.');
    }
    return {
      amount,
      reason,
      payoutChannel,
      payoutAccount: normalized,
      supportingReference,
    };
  }

  if (payoutAccount.length < 6) {
    throw new FinanceHttpError(400, 'Provide a valid bank account number and branch for refund payout.');
  }
  return {
    amount,
    reason,
    payoutChannel,
    payoutAccount,
    supportingReference,
  };
}

export function validateDarajaCallbackPayload(body: unknown) {
  const parsed = (body ?? {}) as DarajaStkCallbackBody;
  const stk = parsed?.Body?.stkCallback;
  if (!stk || typeof stk.CheckoutRequestID !== 'string' || !stk.CheckoutRequestID.trim()) {
    throw new FinanceHttpError(400, 'Invalid Daraja STK callback: CheckoutRequestID is missing.');
  }
  const resultCode = Number(stk.ResultCode);
  if (!Number.isFinite(resultCode)) {
    throw new FinanceHttpError(400, 'Invalid Daraja STK callback: ResultCode is missing.');
  }
  return {
    merchantRequestId: String(stk.MerchantRequestID ?? '').trim(),
    checkoutRequestId: stk.CheckoutRequestID.trim(),
    resultCode,
    resultDesc: String(stk.ResultDesc ?? '').trim() || 'Processed',
    callbackItems: stk.CallbackMetadata?.Item ?? [],
  };
}

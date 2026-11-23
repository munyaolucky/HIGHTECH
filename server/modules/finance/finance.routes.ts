import { Router, type Request, type Response } from 'express';
import {
  requireAuth,
  requirePermission,
  requirePortalAuth,
} from '../../middleware/auth.ts';
import { STAFF_PERMISSIONS } from '../staff/staff.permissions.ts';
import { financeService, type FinanceStudentIdentity } from './finance.service.ts';
import { FinanceHttpError } from './mpesa/mpesa.validation.ts';

function handleFinanceError(res: Response, err: unknown): void {
  if (err instanceof FinanceHttpError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : 'Unexpected finance service error.';
  res.status(500).json({ success: false, error: message });
}

function resolveStudentIdentity(req: Request): FinanceStudentIdentity {
  if (req.portalUser) {
    return {
      studentId: req.portalUser.uid,
      studentRegNo: req.portalUser.registrationNumber || 'HCA/STU/2026/001',
      studentName: req.portalUser.fullName,
    };
  }
  if (req.staffUser) {
    // Authenticated staff previewing student portal defaults to sample student when not student role
    return {
      studentId: 'stu-sample-001',
      studentRegNo: 'HCA/STU/2026/001',
      studentName: 'Amina Wanjiku',
    };
  }
  throw new FinanceHttpError(401, 'Authentication required.');
}

// ============================================================================
// STUDENT FEES & M-PESA ROUTES (/api/student/fees)
// ============================================================================
export const studentFeesRoutes = Router();

studentFeesRoutes.use(requirePortalAuth);

studentFeesRoutes.get('/overview', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const data = financeService.getStudentOverview(identity);
    res.json({ success: true, data });
  } catch (err) {
    handleFinanceError(res, err);
  }
});

studentFeesRoutes.get('/statement', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const term = typeof req.query.term === 'string' ? req.query.term : undefined;
    const data = financeService.getStudentStatement(identity, term);
    res.json({ success: true, data });
  } catch (err) {
    handleFinanceError(res, err);
  }
});

studentFeesRoutes.get('/payments', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const data = financeService.listStudentPayments(identity, {
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      method: typeof req.query.method === 'string' ? req.query.method : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    });
    res.json({ success: true, data: { payments: data } });
  } catch (err) {
    handleFinanceError(res, err);
  }
});

studentFeesRoutes.get('/payments/:id', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const data = financeService.getStudentPaymentById(identity, String(req.params.id));
    res.json({ success: true, data });
  } catch (err) {
    handleFinanceError(res, err);
  }
});

studentFeesRoutes.post('/payments/mpesa/stk-push', async (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const headerKey =
      typeof req.headers['idempotency-key'] === 'string'
        ? req.headers['idempotency-key']
        : undefined;
    const data = await financeService.initiateMpesaStkPush(identity, req.body, headerKey);
    res.status(data.reusedIdempotencyKey ? 200 : 201).json({ success: true, data });
  } catch (err) {
    handleFinanceError(res, err);
  }
});

studentFeesRoutes.post('/payments/mpesa/:id/sandbox-complete', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const outcome =
      req.body?.outcome === 'CANCELLED'
        ? 'CANCELLED'
        : req.body?.outcome === 'FAILED'
        ? 'FAILED'
        : 'SUCCESS';
    const data = financeService.completeSandboxStkPayment(
      identity,
      String(req.params.id),
      outcome
    );
    res.json({ success: true, data });
  } catch (err) {
    handleFinanceError(res, err);
  }
});

studentFeesRoutes.post('/payments/bank-reference', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const payment = financeService.submitBankReference(identity, req.body);
    res.status(201).json({ success: true, data: { payment } });
  } catch (err) {
    handleFinanceError(res, err);
  }
});

studentFeesRoutes.get('/receipts', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const receipts = financeService.listStudentReceipts(identity);
    res.json({ success: true, data: { receipts } });
  } catch (err) {
    handleFinanceError(res, err);
  }
});

studentFeesRoutes.get('/receipts/:id', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const receipt = financeService.getStudentReceipt(identity, String(req.params.id));
    res.json({ success: true, data: { receipt } });
  } catch (err) {
    handleFinanceError(res, err);
  }
});

studentFeesRoutes.get('/structure', (req, res) => {
  try {
    const programme =
      typeof req.query.programme === 'string' ? req.query.programme : undefined;
    const structures = financeService.listFeeStructures(programme);
    res.json({ success: true, data: { structures } });
  } catch (err) {
    handleFinanceError(res, err);
  }
});

studentFeesRoutes.get('/payment-plans', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const plans = financeService.getPaymentPlans(identity);
    res.json({ success: true, data: { plans } });
  } catch (err) {
    handleFinanceError(res, err);
  }
});

studentFeesRoutes.post('/payment-plans', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const plan = financeService.requestPaymentPlan(identity, req.body);
    res.status(201).json({ success: true, data: { plan } });
  } catch (err) {
    handleFinanceError(res, err);
  }
});

studentFeesRoutes.get('/clearance', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const data = financeService.getFinancialClearance(identity);
    res.json({ success: true, data });
  } catch (err) {
    handleFinanceError(res, err);
  }
});

studentFeesRoutes.get('/refund-requests', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const requests = financeService.listRefundRequests(identity);
    res.json({ success: true, data: { requests } });
  } catch (err) {
    handleFinanceError(res, err);
  }
});

studentFeesRoutes.post('/refund-requests', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const request = financeService.submitRefundRequest(identity, req.body);
    res.status(201).json({ success: true, data: { request } });
  } catch (err) {
    handleFinanceError(res, err);
  }
});

// ============================================================================
// PUBLIC M-PESA DARAJA WEBHOOK ROUTE (/api/payments/mpesa/callback)
// ============================================================================
export const mpesaWebhookRoutes = Router();

mpesaWebhookRoutes.post('/mpesa/callback', (req, res) => {
  try {
    const result = financeService.processMpesaCallback(req.body);
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
      data: result,
    });
  } catch (err) {
    handleFinanceError(res, err);
  }
});

// ============================================================================
// STAFF FINANCE OFFICER ROUTES (/api/finance)
// ============================================================================
export const staffFinanceRoutes = Router();

staffFinanceRoutes.use(requireAuth);

staffFinanceRoutes.get(
  '/dashboard',
  requirePermission(STAFF_PERMISSIONS.FINANCE_VIEW),
  (_req, res) => {
    try {
      const data = financeService.getStaffFinanceDashboard();
      res.json({ success: true, data });
    } catch (err) {
      handleFinanceError(res, err);
    }
  }
);

staffFinanceRoutes.post(
  '/payments/manual',
  requirePermission(STAFF_PERMISSIONS.FINANCE_MANAGE),
  (req, res) => {
    try {
      const actor = req.staffUser!;
      const data = financeService.recordStaffManualPayment({
        studentRegNo: String(req.body?.studentRegNo ?? ''),
        amount: Number(req.body?.amount),
        method: req.body?.method ?? 'BANK',
        referenceNumber: String(req.body?.referenceNumber ?? ''),
        description:
          typeof req.body?.description === 'string' ? req.body.description : undefined,
        actor: { id: actor.id, name: actor.fullName, role: actor.role },
      });
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleFinanceError(res, err);
    }
  }
);

staffFinanceRoutes.post(
  '/payments/:paymentId/verify-bank',
  requirePermission(STAFF_PERMISSIONS.PAYMENTS_RECONCILE),
  (req, res) => {
    try {
      const actor = req.staffUser!;
      const decision = req.body?.decision === 'REJECT' ? 'REJECT' : 'CONFIRM';
      const data = financeService.verifyBankPayment({
        paymentId: String(req.params.paymentId),
        decision,
        notes: typeof req.body?.notes === 'string' ? req.body.notes : undefined,
        actor: { id: actor.id, name: actor.fullName, role: actor.role },
      });
      res.json({ success: true, data });
    } catch (err) {
      handleFinanceError(res, err);
    }
  }
);

staffFinanceRoutes.post(
  '/payment-plans/:planId/review',
  requirePermission(STAFF_PERMISSIONS.FINANCE_MANAGE),
  (req, res) => {
    try {
      const actor = req.staffUser!;
      const decision = req.body?.decision === 'REJECT' ? 'REJECT' : 'APPROVE';
      const plan = financeService.reviewPaymentPlan({
        planId: String(req.params.planId),
        decision,
        notes: typeof req.body?.notes === 'string' ? req.body.notes : undefined,
        actor: { id: actor.id, name: actor.fullName, role: actor.role },
      });
      res.json({ success: true, data: { plan } });
    } catch (err) {
      handleFinanceError(res, err);
    }
  }
);

staffFinanceRoutes.post(
  '/refund-requests/:refundId/review',
  requirePermission(STAFF_PERMISSIONS.FINANCE_MANAGE),
  (req, res) => {
    try {
      const actor = req.staffUser!;
      const decision =
        req.body?.decision === 'REJECT'
          ? 'REJECT'
          : req.body?.decision === 'DISBURSE'
          ? 'DISBURSE'
          : 'APPROVE';
      const refund = financeService.reviewRefundRequest({
        refundId: String(req.params.refundId),
        decision,
        notes: typeof req.body?.notes === 'string' ? req.body.notes : undefined,
        actor: { id: actor.id, name: actor.fullName, role: actor.role },
      });
      res.json({ success: true, data: { refund } });
    } catch (err) {
      handleFinanceError(res, err);
    }
  }
);

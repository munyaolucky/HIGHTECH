import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../../middleware/auth.ts';
import type { RegistrationCategory } from '../registration/registration.permissions.ts';
import { UsersHttpError, usersService } from './users.service.ts';

const router = Router();

const VALID_CATEGORIES = new Set<RegistrationCategory>([
  'STUDENT',
  'STAFF',
  'PARENT',
  'ALUMNI',
  'CONTRACTOR',
  'PARTNER',
  'GUEST',
]);

function handleUsersError(res: Response, err: unknown, fallbackMessage: string): void {
  if (err instanceof UsersHttpError) {
    res.status(err.statusCode).json({ success: false, message: err.message, error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : fallbackMessage;
  res.status(500).json({ success: false, message, error: message });
}

router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await usersService.listAccounts(req.staffUser!, {
      page: Number(req.query.page ?? 1) || 1,
      pageSize: Number(req.query.pageSize ?? 10) || 10,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
    });
    res.json(result);
  } catch (err) {
    handleUsersError(res, err, 'Unable to load portal accounts.');
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const categoryRaw = String(req.body?.category ?? 'STAFF').toUpperCase() as RegistrationCategory;
    if (!VALID_CATEGORIES.has(categoryRaw)) {
      throw new UsersHttpError(400, 'Invalid account category specified.');
    }
    const created = await usersService.createAccount(req.staffUser!, {
      fullName: String(req.body?.fullName ?? ''),
      email: String(req.body?.email ?? ''),
      phone: typeof req.body?.phone === 'string' ? req.body.phone : undefined,
      category: categoryRaw,
      role: typeof req.body?.role === 'string' ? req.body.role : undefined,
      campusId: typeof req.body?.campusId === 'string' ? req.body.campusId : undefined,
      departmentId: typeof req.body?.departmentId === 'string' ? req.body.departmentId : undefined,
    });
    res.status(201).json({ success: true, account: created });
  } catch (err) {
    handleUsersError(res, err, 'Unable to register portal account.');
  }
});

router.post('/:id/resend-invitation', async (req: Request, res: Response) => {
  try {
    const out = await usersService.resendInvitation(req.staffUser!, String(req.params.id));
    res.json({ ok: true, success: true, message: out.message });
  } catch (err) {
    handleUsersError(res, err, 'Unable to resend activation invitation.');
  }
});

router.post('/:id/suspend', async (req: Request, res: Response) => {
  try {
    const out = await usersService.suspendAccount(req.staffUser!, String(req.params.id));
    res.json({ ok: true, success: true, message: out.message });
  } catch (err) {
    handleUsersError(res, err, 'Unable to suspend portal account.');
  }
});

router.post('/:id/reactivate', async (req: Request, res: Response) => {
  try {
    const out = await usersService.reactivateAccount(req.staffUser!, String(req.params.id));
    res.json({ ok: true, success: true, message: out.message });
  } catch (err) {
    handleUsersError(res, err, 'Unable to reactivate portal account.');
  }
});

export default router;

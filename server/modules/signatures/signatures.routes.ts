import crypto from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { Router } from 'express';
import { db } from '../../../src/db/index.ts';
import {
  documentSigners,
  notifications,
  signatureAuditEvents,
  signatureRecords,
  signatureRequests,
  signingAuthorities,
  signingCertificates,
  users,
} from '../../../src/db/schema.ts';
import { getDb } from '../../data/store.ts';
import { ensurePostgresSeeded } from '../../lib/pg-sync.ts';
import { requireAuth } from '../../middleware/auth.ts';

const router = Router();

// Public-safe verification of a digital signature request or digest
router.get('/verify/:code', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const code = String(req.params.code ?? '').trim().toUpperCase();
    if (!code) {
      res.status(400).json({ success: false, error: 'Verification code is required.' });
      return;
    }

    const [requestRow] = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.verificationCode, code))
      .limit(1);

    if (!requestRow) {
      res.json({
        success: true,
        data: {
          verified: false,
          status: 'NOT_FOUND',
          message: 'No HI-TECH College digital signature record matches this code.',
        },
      });
      return;
    }

    const records = await db
      .select()
      .from(signatureRecords)
      .where(eq(signatureRecords.requestId, requestRow.id));

    const signers = await db
      .select()
      .from(documentSigners)
      .where(eq(documentSigners.requestId, requestRow.id));

    res.json({
      success: true,
      data: {
        verified: requestRow.status === 'COMPLETED' || records.length > 0,
        status: requestRow.status,
        verificationCode: requestRow.verificationCode,
        documentTitle: requestRow.documentTitle,
        documentReference: requestRow.documentReference,
        versionNumber: requestRow.versionNumber,
        versionChecksumSha256: requestRow.versionChecksumSha256,
        signingMode: requestRow.signingMode,
        completedAt: requestRow.completedAt,
        signatures: records.map((r) => ({
          signerName: r.signerName,
          signerTitle: r.signerTitle,
          signatureType: r.signatureType,
          signatureDigest: r.signatureDigest,
          signedAt: r.signedAt,
        })),
        pendingSigners: signers.filter((s) => s.status === 'PENDING').length,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Verification lookup failed.',
    });
  }
});

router.use(requireAuth);

router.get('/requests', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const staff = req.staffUser!;
    const allRequests = await db
      .select()
      .from(signatureRequests)
      .orderBy(desc(signatureRequests.createdAt));

    const allSigners = await db.select().from(documentSigners);
    const allRecords = await db.select().from(signatureRecords);

    const enriched = allRequests
      .map((r) => {
        const signers = allSigners
          .filter((s) => s.requestId === r.id)
          .sort((a, b) => a.stepOrder - b.stepOrder);
        const records = allRecords.filter((rec) => rec.requestId === r.id);
        const mySignerRow = signers.find((s) => s.signerStaffId === staff.id);
        const isAllowedViewer =
          r.requestedById === staff.id ||
          Boolean(mySignerRow) ||
          staff.role === 'ADMIN' ||
          staff.role === 'PRINCIPAL' ||
          staff.role === 'REGISTRAR';

        if (!isAllowedViewer) return null;

        let canSignNow = false;
        if (mySignerRow && mySignerRow.status === 'PENDING' && r.status !== 'DECLINED' && r.status !== 'REJECTED' && r.status !== 'COMPLETED') {
          if (r.signingMode === 'PARALLEL') {
            canSignNow = true;
          } else {
            const priorUnsigned = signers.some(
              (s) => s.stepOrder < mySignerRow.stepOrder && s.status !== 'SIGNED'
            );
            canSignNow = !priorUnsigned;
          }
        }

        return {
          ...r,
          signers,
          records,
          canSignNow,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to fetch signature requests.',
    });
  }
});

router.get('/requests/:id', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const [requestRow] = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.id, String(req.params.id)))
      .limit(1);

    if (!requestRow) {
      res.status(404).json({ success: false, error: 'Signature request not found.' });
      return;
    }

    const signers = await db
      .select()
      .from(documentSigners)
      .where(eq(documentSigners.requestId, requestRow.id));
    const records = await db
      .select()
      .from(signatureRecords)
      .where(eq(signatureRecords.requestId, requestRow.id));
    const auditEvents = await db
      .select()
      .from(signatureAuditEvents)
      .where(eq(signatureAuditEvents.requestId, requestRow.id))
      .orderBy(desc(signatureAuditEvents.createdAt));

    res.json({
      success: true,
      data: {
        request: requestRow,
        signers: signers.sort((a, b) => a.stepOrder - b.stepOrder),
        records,
        auditEvents,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to fetch signature request details.',
    });
  }
});

router.post('/requests', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const staff = req.staffUser!;
    const documentId = String(req.body?.documentId ?? '').trim();
    const signingMode = String(req.body?.signingMode ?? 'SEQUENTIAL').toUpperCase() === 'PARALLEL'
      ? 'PARALLEL'
      : 'SEQUENTIAL';
    const notes = String(req.body?.notes ?? '').trim();
    const signerIds: string[] = Array.isArray(req.body?.signerStaffIds)
      ? req.body.signerStaffIds.map((id: unknown) => String(id))
      : [];

    if (!documentId || signerIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Select a document and at least one authorized signer.',
      });
      return;
    }

    const store = getDb();
    const doc = store.documents.find((d) => d.id === documentId);
    if (!doc) {
      res.status(404).json({ success: false, error: 'Target document not found.' });
      return;
    }

    const signersToAdd = signerIds
      .map((sid) => store.staffAccounts.find((s) => s.id === sid))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));

    if (signersToAdd.length === 0) {
      res.status(400).json({ success: false, error: 'No valid staff signers selected.' });
      return;
    }

    const versionChecksum = crypto
      .createHash('sha256')
      .update(`${doc.id}:v${doc.currentVersion}:${doc.subjectLine}:${doc.bodyContent}`)
      .digest('hex');

    const requestId = `sreq-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const verificationCode = `HCA-SIG-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const [created] = await db
      .insert(signatureRequests)
      .values({
        id: requestId,
        documentId: doc.id,
        documentTitle: doc.title,
        documentReference: doc.referenceNumber ?? `DRAFT-v${doc.currentVersion}`,
        versionNumber: doc.currentVersion,
        versionChecksumSha256: versionChecksum,
        signingMode,
        status: 'PENDING',
        verificationCode,
        requestedById: staff.id,
        requestedByName: staff.fullName,
        notes: notes || null,
      })
      .returning();

    for (let i = 0; i < signersToAdd.length; i += 1) {
      const s = signersToAdd[i];
      await db.insert(documentSigners).values({
        id: `dsgn-${Date.now()}-${i}-${crypto.randomBytes(2).toString('hex')}`,
        requestId,
        stepOrder: i + 1,
        signerStaffId: s.id,
        signerName: s.fullName,
        signerRole: s.role,
        signerTitle: s.roleTitle,
        status: 'PENDING',
      });

      // Notify signer (step 1 or all if parallel)
      if (signingMode === 'PARALLEL' || i === 0) {
        const [pgTarget] = await db
          .select()
          .from(users)
          .where(eq(users.email, s.email.toLowerCase()))
          .limit(1);
        if (pgTarget) {
          await db.insert(notifications).values({
            id: `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
            recipientUserId: pgTarget.id,
            category: 'DOCUMENT',
            priority: 'HIGH',
            title: 'Digital signature requested',
            message: `${staff.fullName} requested your digital signature on "${doc.title}" (${signingMode} workflow).`,
            actionUrl: '/staff/signatures',
            senderName: staff.fullName,
          });
        }
      }
    }

    await db.insert(signatureAuditEvents).values({
      id: `saud-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      requestId,
      actorId: staff.id,
      actorName: staff.fullName,
      eventType: 'REQUEST_CREATED',
      detail: `Initiated ${signingMode} signing request with ${signersToAdd.length} signer(s), pinned to SHA-256 ${versionChecksum.slice(0, 12)}...`,
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create signature request.',
    });
  }
});

router.post('/requests/:id/sign', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const staff = req.staffUser!;
    const requestId = String(req.params.id);
    const signatureType = String(req.body?.signatureType ?? 'TYPED').toUpperCase();
    const signaturePayload = String(req.body?.signaturePayload ?? staff.fullName).trim();

    if (!signaturePayload) {
      res.status(400).json({ success: false, error: 'Signature input is required.' });
      return;
    }

    const [requestRow] = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.id, requestId))
      .limit(1);

    if (!requestRow) {
      res.status(404).json({ success: false, error: 'Signature request not found.' });
      return;
    }

    if (requestRow.status === 'COMPLETED' || requestRow.status === 'REJECTED') {
      res.status(409).json({
        success: false,
        error: `Cannot sign a request in ${requestRow.status} status.`,
      });
      return;
    }

    const signers = await db
      .select()
      .from(documentSigners)
      .where(eq(documentSigners.requestId, requestRow.id));
    const ordered = signers.sort((a, b) => a.stepOrder - b.stepOrder);
    const myRow = ordered.find((s) => s.signerStaffId === staff.id);

    if (!myRow) {
      res.status(403).json({
        success: false,
        error: 'You are not an assigned signer on this signature request.',
      });
      return;
    }
    if (myRow.status !== 'PENDING') {
      res.status(409).json({ success: false, error: `Your signing step is already ${myRow.status}.` });
      return;
    }

    if (requestRow.signingMode === 'SEQUENTIAL') {
      const priorPending = ordered.find(
        (s) => s.stepOrder < myRow.stepOrder && s.status !== 'SIGNED'
      );
      if (priorPending) {
        res.status(409).json({
          success: false,
          error: `Sequential workflow order: awaiting prior signature from ${priorPending.signerName} (${priorPending.signerRole}).`,
        });
        return;
      }
    }

    // Verify active institutional signing certificate
    const [activeCert] = await db
      .select()
      .from(signingCertificates)
      .where(eq(signingCertificates.status, 'ACTIVE'))
      .limit(1);

    if (!activeCert) {
      res.status(409).json({
        success: false,
        error: 'No active institutional signing certificate is available.',
      });
      return;
    }

    const now = new Date();
    const digest = `SIG-HCA-${crypto
      .createHash('sha256')
      .update(
        `${requestRow.id}:${requestRow.versionChecksumSha256}:${staff.id}:${activeCert.serialNumber}:${now.toISOString()}`
      )
      .digest('hex')
      .slice(0, 14)
      .toUpperCase()}`;

    await db
      .update(documentSigners)
      .set({ status: 'SIGNED', signedAt: now })
      .where(eq(documentSigners.id, myRow.id));

    const [sigRecord] = await db
      .insert(signatureRecords)
      .values({
        id: `srec-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        requestId: requestRow.id,
        signerRowId: myRow.id,
        documentId: requestRow.documentId,
        signerStaffId: staff.id,
        signerName: staff.fullName,
        signerTitle: staff.roleTitle,
        signatureType,
        signaturePayload,
        certificateId: activeCert.id,
        documentChecksumSha256: requestRow.versionChecksumSha256,
        signatureDigest: digest,
        ipAddress: req.ip || '127.0.0.1',
        signedAt: now,
      })
      .returning();

    const remainingPending = ordered.filter(
      (s) => s.id !== myRow.id && s.status === 'PENDING'
    );
    const nextStatus = remainingPending.length === 0 ? 'COMPLETED' : 'IN_PROGRESS';

    await db
      .update(signatureRequests)
      .set({
        status: nextStatus,
        completedAt: nextStatus === 'COMPLETED' ? now : null,
        updatedAt: now,
      })
      .where(eq(signatureRequests.id, requestRow.id));

    await db.insert(signatureAuditEvents).values({
      id: `saud-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      requestId: requestRow.id,
      actorId: staff.id,
      actorName: staff.fullName,
      eventType: 'DOCUMENT_SIGNED',
      detail: `Applied ${signatureType} signature (${digest}) using certificate ${activeCert.serialNumber}.`,
    });

    // Notify next sequential signer if applicable
    if (requestRow.signingMode === 'SEQUENTIAL' && remainingPending.length > 0) {
      const nextSigner = remainingPending[0];
      const store = getDb();
      const nextStaff = store.staffAccounts.find((s) => s.id === nextSigner.signerStaffId);
      if (nextStaff) {
        const [pgNext] = await db
          .select()
          .from(users)
          .where(eq(users.email, nextStaff.email.toLowerCase()))
          .limit(1);
        if (pgNext) {
          await db.insert(notifications).values({
            id: `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
            recipientUserId: pgNext.id,
            category: 'DOCUMENT',
            priority: 'HIGH',
            title: 'Your sequential signature turn is ready',
            message: `${staff.fullName} signed "${requestRow.documentTitle}". It is now awaiting your signature.`,
            actionUrl: '/staff/signatures',
            senderName: 'Digital Signature Engine',
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        signatureRecord: sigRecord,
        requestStatus: nextStatus,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Signing operation failed.',
    });
  }
});

router.post('/requests/:id/decline', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const staff = req.staffUser!;
    const requestId = String(req.params.id);
    const reason = String(req.body?.reason ?? '').trim();
    if (!reason) {
      res.status(400).json({ success: false, error: 'A decline reason is required.' });
      return;
    }

    const [myRow] = await db
      .select()
      .from(documentSigners)
      .where(
        and(
          eq(documentSigners.requestId, requestId),
          eq(documentSigners.signerStaffId, staff.id)
        )
      )
      .limit(1);

    if (!myRow) {
      res.status(403).json({ success: false, error: 'Not an assigned signer on this request.' });
      return;
    }

    const now = new Date();
    await db
      .update(documentSigners)
      .set({ status: 'DECLINED', declineReason: reason })
      .where(eq(documentSigners.id, myRow.id));

    await db
      .update(signatureRequests)
      .set({ status: 'REJECTED', updatedAt: now })
      .where(eq(signatureRequests.id, requestId));

    await db.insert(signatureAuditEvents).values({
      id: `saud-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      requestId,
      actorId: staff.id,
      actorName: staff.fullName,
      eventType: 'SIGNING_DECLINED',
      detail: `Declined to sign: "${reason}".`,
    });

    res.json({ success: true, data: { status: 'REJECTED' } });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to decline signature request.',
    });
  }
});

// Signing Authorities & Institutional Certificates Administration
router.get('/authorities', async (_req, res) => {
  try {
    await ensurePostgresSeeded();
    const rows = await db.select().from(signingAuthorities);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to fetch signing authorities.',
    });
  }
});

router.post('/authorities/:id/delegate', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const staff = req.staffUser!;
    if (!['ADMIN', 'PRINCIPAL', 'REGISTRAR'].includes(staff.role)) {
      res.status(403).json({ success: false, error: 'Only Admin, Principal, or Registrar can update signing delegations.' });
      return;
    }
    const delegatedToStaffId = req.body?.delegatedToStaffId ? String(req.body.delegatedToStaffId) : null;
    const store = getDb();
    const target = delegatedToStaffId
      ? store.staffAccounts.find((s) => s.id === delegatedToStaffId)
      : null;

    await db
      .update(signingAuthorities)
      .set({
        delegatedToStaffId: target?.id ?? null,
        delegatedToName: target?.fullName ?? null,
      })
      .where(eq(signingAuthorities.id, String(req.params.id)));

    res.json({ success: true, data: { updated: true } });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Delegation update failed.',
    });
  }
});

router.get('/certificates', async (_req, res) => {
  try {
    await ensurePostgresSeeded();
    const rows = await db
      .select()
      .from(signingCertificates)
      .orderBy(desc(signingCertificates.issuedAt));
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to fetch signing certificates.',
    });
  }
});

router.post('/certificates/:id/revoke', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const staff = req.staffUser!;
    if (!['ADMIN', 'PRINCIPAL'].includes(staff.role)) {
      res.status(403).json({ success: false, error: 'Certificate revocation requires Admin or Principal authority.' });
      return;
    }
    const reason = String(req.body?.reason ?? 'Administrative certificate rotation').trim();
    await db
      .update(signingCertificates)
      .set({ status: 'REVOKED', revokedReason: reason })
      .where(eq(signingCertificates.id, String(req.params.id)));
    res.json({ success: true, data: { revoked: true } });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Certificate revocation failed.',
    });
  }
});

router.post('/certificates', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const staff = req.staffUser!;
    if (!['ADMIN', 'PRINCIPAL'].includes(staff.role)) {
      res.status(403).json({ success: false, error: 'Certificate issuance requires Admin or Principal authority.' });
      return;
    }
    const serialNumber = `HCA-CA-2026-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${serialNumber}:${Date.now()}`)
      .digest('hex')
      .toUpperCase();
    const [created] = await db
      .insert(signingCertificates)
      .values({
        id: `cert-${Date.now()}`,
        serialNumber,
        subjectName: String(req.body?.subjectName || 'HI-TECH College Institutional Signatory Authority'),
        issuerName: 'HI-TECH College Institutional Root CA',
        fingerprintSha256: fingerprint,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
      })
      .returning();
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to issue signing certificate.',
    });
  }
});

export default router;

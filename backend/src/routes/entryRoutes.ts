import { Router, Request, Response } from 'express';
import { CustomerSessionService } from '../services/customerSessionService';
import { CustomerStatusService } from '../services/customerStatusService';
import { MemoryDB } from '../db/MemoryDB';

const router = Router();
const sessionService = new CustomerSessionService();
const statusService = new CustomerStatusService();
const db = MemoryDB.getInstance();

// Resolve QR/NFC entry
router.get('/resolve/:identifier', (req: Request, res: Response, next) => {
  try {
    const { identifier } = req.params;
    const authType = (req.query.type === 'nfc' ? 'nfc' : 'qr') as 'qr' | 'nfc';
    const sk = (req.query.sk || req.query.sessionKey || req.query.key || req.query.token) as string | undefined;

    const { business, offer, entry, isActive } = sessionService.resolveMerchant(identifier);

    if (!isActive || !offer) {
      return res.json({
        success: true,
        isActive: false,
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          category: business.category,
          logoEmoji: business.logoEmoji,
          logoUrl: business.logoUrl,
          accentColor: business.accentColor,
        },
        offer: null,
        message: 'No active offers currently running for this business.',
      });
    }

    const requestedEntryType = (req.query.entryType as string) || (entry?.entryType === 'loyalty' || entry?.entryType === 'instant_loyalty' ? 'loyalty' : 'combined');
    const effectiveEntryType: 'combined' | 'loyalty' = requestedEntryType === 'loyalty' ? 'loyalty' : 'combined';

    let session = sk ? db.getCustomerSession(sk) : undefined;

    if (sk) {
      if (!session) {
        return res.status(403).json({
          success: false,
          error: 'SESSION_EXPIRED',
          message: 'Token already used or expired',
        });
      }

      if (new Date(session.expiresAt).getTime() < Date.now()) {
        return res.status(403).json({
          success: false,
          error: 'SESSION_EXPIRED',
          message: 'Token already used or expired',
        });
      }

      if (session.status === 'completed') {
        return res.status(403).json({
          success: false,
          error: 'SESSION_ALREADY_USED',
          message: 'Token already used or expired',
        });
      }

      if (!session.entryType) {
        session.entryType = effectiveEntryType;
        db.saveCustomerSession(session);
      }
    } else {
      // NFC tap or entry without pre-existing session key
      session = sessionService.createSession(business.id, offer.id, authType, undefined, undefined, effectiveEntryType);
    }

    // Initial status without logged-in customer
    const sessionEntryType = session.entryType || effectiveEntryType;
    const statusPayload = statusService.formatStatusResponse(business, offer, null, sessionEntryType);

    res.json({
      success: true,
      isActive: true,
      sessionToken: session.sessionToken,
      sessionKey: session.sessionKey,
      entryType: sessionEntryType,
      ...statusPayload,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

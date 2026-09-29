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

    // Create session
    const session = sessionService.createSession(business.id, offer.id, authType);

    // Initial status without logged-in customer
    const statusPayload = statusService.formatStatusResponse(business, offer, null);

    res.json({
      success: true,
      isActive: true,
      sessionToken: session.sessionToken,
      entryType: entry?.entryType || 'merchant_qr',
      ...statusPayload,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { StaffService } from '../services/staffService';
import { MemoryDB } from '../db/MemoryDB';
import { staffAuthMiddleware, AuthenticatedStaffRequest } from '../middleware/staffMiddleware';
import { maskMobile, extractConfiguredPin } from '../utils/crypto';
import { Offer } from '../../../shared/types/offer';

const router = Router();
const staffService = new StaffService();
const db = MemoryDB.getInstance();

// Staff Login
router.post('/login', (req: Request, res: Response, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier and password are required' });
    }
    const result = staffService.login(identifier, password);
    res.json({
      success: true,
      sessionToken: result.session.sessionId,
      businessId: result.session.businessId,
      businessName: result.session.businessName,
      businessSlug: result.session.businessSlug,
      tier: result.session.tier,
      expiresAt: result.session.expiresAt,
    });
  } catch (err) {
    next(err);
  }
});

// Staff Terminal Data (Protected)
router.get('/terminal-data', staffAuthMiddleware, async (req: AuthenticatedStaffRequest, res: Response, next) => {
  try {
    const businessId = req.staffSession!.businessId;
    const business = db.getBusinessById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const offer = db.getActiveOfferByBusinessId(businessId) || null;
    const entries = db.getMerchantEntriesByBusinessId(businessId);
    const customers = db.getCustomersByBusinessId(businessId);
    const rewards = db.getRewardsByBusinessId(businessId);
    const reviews = db.getReviewLogsByBusinessId(businessId);

    // Format loyalty records
    const loyaltyTarget = offer?.loyaltyTarget || business.loyaltyTarget || 6;
    const loyaltyRecords = customers.map(c => ({
      id: c.id,
      name: c.name || 'Guest',
      mobileMasked: maskMobile(c.mobile),
      visitCount: c.visitCount || 0,
      target: loyaltyTarget,
      totalVisits: c.totalVisits || 0,
      lastVisitAt: c.lastVisitAt,
    })).sort((a, b) => (b.totalVisits || 0) - (a.totalVisits || 0));

    // Generate QR data URLs for entries
    let baseUrl = process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
      ? process.env.APP_URL.replace(/\/$/, '')
      : '';

    if (!baseUrl) {
      const forwardedHost = req.get('x-forwarded-host');
      const forwardedProto = req.get('x-forwarded-proto') || (req.protocol === 'https' ? 'https' : 'http');
      if (forwardedHost) {
        baseUrl = `${forwardedProto}://${forwardedHost}`;
      } else {
        const host = req.get('host') || 'localhost:3000';
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        baseUrl = `${protocol}://${host}`;
      }
    }

    const entriesWithQr = await Promise.all(
      entries.map(async entry => {
        let customerUrl = `${baseUrl}/c/${business.slug}/v`;
        if (entry.entryType === 'instant_loyalty') {
          customerUrl = `${baseUrl}/c/${business.slug}/loyalty`;
        }
        let qrDataUrl = '';
        try {
          qrDataUrl = await QRCode.toDataURL(customerUrl, {
            margin: 1,
            width: 280,
            color: { dark: '#0e7c66', light: '#ffffff' },
          });
        } catch (e) {
          // ignore qr generation error
        }
        return {
          ...entry,
          customerUrl,
          qrDataUrl,
        };
      })
    );

    res.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        email: business.email,
        tier: business.tier,
        category: business.category,
        city: business.city,
        country: business.country,
        timezone: business.timezone,
        logoEmoji: business.logoEmoji,
        logoUrl: business.logoUrl,
        accentColor: business.accentColor,
        loyaltyTarget: business.loyaltyTarget,
        loyaltyValidationDays: business.loyaltyValidationDays,
        loyaltyReward: business.loyaltyReward,
        spinWheelConfiguration: business.spinWheelConfiguration,
        googleReviewUrl: business.googleReviewUrl,
        configuredStaffPin: extractConfiguredPin(business.staffPinHash) || '••••',
      },
      offer: offer ? {
        id: offer.id,
        title: offer.title,
        tier: offer.tier,
        status: offer.status,
        createdAt: offer.createdAt,
        activatedAt: offer.activatedAt,
        spinWheelConfiguration: offer.spinWheelConfiguration,
        loyaltyTarget: offer.loyaltyTarget,
        loyaltyValidationDays: offer.loyaltyValidationDays,
        loyaltyReward: offer.loyaltyReward,
        metrics: offer.metrics,
      } : null,
      entries: entriesWithQr,
      loyaltyRecords,
      rewards,
      reviews,
      offerHistory: staffService.getOfferHistory(business.id),
    });
  } catch (err) {
    next(err);
  }
});

// Redeem Customer Reward Voucher with 4-digit PIN
router.post('/redeem-voucher', staffAuthMiddleware, (req: AuthenticatedStaffRequest, res: Response, next) => {
  try {
    const businessId = req.staffSession!.businessId;
    const { voucherCode, staffPin } = req.body;

    if (!voucherCode || !staffPin) {
      return res.status(400).json({ success: false, message: 'voucherCode and staffPin are required' });
    }

    const cleanPin = String(staffPin).trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      return res.status(400).json({ success: false, message: 'Staff verification PIN must be exactly 4 digits' });
    }

    const result = staffService.redeemVoucher(businessId, String(voucherCode).trim(), cleanPin);
    res.json({
      success: true,
      message: `Voucher ${result.reward.code} successfully redeemed for ${result.customerName}`,
      reward: result.reward,
    });
  } catch (err) {
    next(err);
  }
});

// Delete / Deactivate active offer (preserves history, transitions offer status to cancelled)
router.post(['/delete-offer', '/cancel-offer'], staffAuthMiddleware, (req: AuthenticatedStaffRequest, res: Response, next) => {
  try {
    const businessId = req.staffSession!.businessId;
    const result = staffService.deleteActiveOffer(businessId);

    res.json({
      success: true,
      message: 'Active offer has been deactivated and archived in Offer History.',
      offer: result.offer,
    });
  } catch (err) {
    next(err);
  }
});

// Get business offer history (Strictly business-scoped)
router.get('/offer-history', staffAuthMiddleware, (req: AuthenticatedStaffRequest, res: Response, next) => {
  try {
    const businessId = req.staffSession!.businessId;
    const offers = staffService.getOfferHistory(businessId);
    res.json({
      success: true,
      offers,
    });
  } catch (err) {
    next(err);
  }
});

// Helper route to generate standalone QR code for any URL
router.get('/qr-code', async (req: Request, res: Response, next) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }
    const qrDataUrl = await QRCode.toDataURL(url, {
      margin: 1,
      width: 320,
      color: { dark: '#10181c', light: '#ffffff' },
    });
    res.json({ success: true, qrDataUrl });
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { MemoryDB } from '../db/MemoryDB';
import { CustomerStatusService } from '../services/customerStatusService';
import { SpinService } from '../services/spinService';
import { LoyaltyService } from '../services/loyaltyService';
import { ReviewService } from '../services/reviewService';
import { maskMobile } from '../utils/crypto';
import { TOP_RANKERS_LIMIT } from '../../../shared/constants/limits';

const router = Router();
const db = MemoryDB.getInstance();
const statusService = new CustomerStatusService();
const spinService = new SpinService();
const loyaltyService = new LoyaltyService();
const reviewService = new ReviewService();

// Helper to resolve customer from session token or query
function getCustomerFromReq(req: Request) {
  const sessionToken = req.headers['x-customer-session'] as string;
  if (sessionToken) {
    const session = db.getCustomerSession(sessionToken);
    if (session && session.customerId) {
      return db.getCustomerById(session.customerId);
    }
  }
  const custId = req.headers['x-customer-id'] as string || req.body?.customerId;
  if (custId) {
    return db.getCustomerById(custId);
  }
  return undefined;
}

// Get customer status for a business
router.get('/status/:slug', (req: Request, res: Response, next) => {
  try {
    const { slug } = req.params;
    const business = db.getBusinessBySlug(slug);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const offer = db.getActiveOfferByBusinessId(business.id) || null;
    const customer = getCustomerFromReq(req) || null;

    const payload = statusService.formatStatusResponse(business, offer, customer);
    res.json({
      success: true,
      ...payload,
    });
  } catch (err) {
    next(err);
  }
});

// Spin wheel execution
router.post('/spin', (req: Request, res: Response, next) => {
  try {
    const { businessId, customerId } = req.body;
    const result = spinService.executeSpin(businessId, customerId);

    const business = db.getBusinessById(businessId);
    const offer = db.getActiveOfferByBusinessId(businessId);
    const customer = db.getCustomerById(customerId);

    const statusPayload = statusService.formatStatusResponse(business!, offer || null, customer!);

    res.json({
      success: true,
      reward: result.reward,
      sliceIndex: result.sliceIndex,
      slice: result.slice,
      ...statusPayload,
    });
  } catch (err) {
    next(err);
  }
});

// Loyalty stamp visit
router.post('/loyalty/stamp', (req: Request, res: Response, next) => {
  try {
    const { businessId, customerId } = req.body;
    const result = loyaltyService.stampVisit(businessId, customerId);

    const business = db.getBusinessById(businessId);
    const offer = db.getActiveOfferByBusinessId(businessId);

    const statusPayload = statusService.formatStatusResponse(business!, offer || null, result.customer);

    res.json({
      success: true,
      milestoneReached: result.milestoneReached,
      reward: result.reward,
      ...statusPayload,
    });
  } catch (err) {
    next(err);
  }
});

// Persist review before Google Maps handoff
router.post('/review/persist', (req: Request, res: Response, next) => {
  try {
    const { businessId, customerId, rating, tags, reviewText } = req.body;
    const result = reviewService.persistReview(
      businessId,
      customerId,
      Number(rating) || 5,
      Array.isArray(tags) ? tags : [],
      reviewText || ''
    );

    res.json({
      success: true,
      reviewLogId: result.reviewLog.id,
      googleReviewUrl: result.googleReviewUrl,
    });
  } catch (err) {
    next(err);
  }
});

// Mark Google opened
router.post('/review/opened', (req: Request, res: Response, next) => {
  try {
    const { reviewLogId, customerId } = req.body;
    reviewService.markGoogleOpened(reviewLogId, customerId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Top 5 Loyal Legends for a business
router.get('/top-rankers/:slug', (req: Request, res: Response, next) => {
  try {
    const { slug } = req.params;
    const business = db.getBusinessBySlug(slug);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const customers = db.getCustomersByBusinessId(business.id);
    // Sort by lifetime totalVisits descending
    const sorted = [...customers].sort((a, b) => (b.totalVisits || 0) - (a.totalVisits || 0));
    const topRankers = sorted.slice(0, TOP_RANKERS_LIMIT).map((c, index) => ({
      rank: index + 1,
      name: c.name || 'Loyal Guest',
      maskedMobile: maskMobile(c.mobile),
      totalVisits: c.totalVisits || 0,
      visitCount: c.visitCount || 0,
    }));

    res.json({
      success: true,
      businessName: business.name,
      topRankers,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

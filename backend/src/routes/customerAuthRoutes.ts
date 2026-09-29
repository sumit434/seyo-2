import { Router, Request, Response } from 'express';
import { CustomerAuthService } from '../services/customerAuthService';
import { CustomerStatusService } from '../services/customerStatusService';
import { MemoryDB } from '../db/MemoryDB';

const router = Router();
const authService = new CustomerAuthService();
const statusService = new CustomerStatusService();
const db = MemoryDB.getInstance();

// Request OTP
router.post(['/otp/request', '/customer/otp/request'], async (req: Request, res: Response, next) => {
  try {
    const { businessId, mobile, countryCode } = req.body;
    if (!businessId || !mobile) {
      return res.status(400).json({ success: false, message: 'businessId and mobile are required' });
    }
    const result = await authService.requestOtp(businessId, mobile, countryCode);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Verify OTP
router.post(['/otp/verify', '/customer/otp/verify'], async (req: Request, res: Response, next) => {
  try {
    const { businessId, mobile, otp, name, countryCode } = req.body;
    if (!businessId || !mobile || !otp) {
      return res.status(400).json({ success: false, message: 'businessId, mobile, and otp are required' });
    }
    const { customer, isNew, sessionToken } = await authService.verifyOtp(businessId, mobile, otp, name, countryCode);

    const business = db.getBusinessById(businessId);
    const offer = db.getActiveOfferByBusinessId(businessId);

    const statusPayload = statusService.formatStatusResponse(business!, offer || null, customer);

    res.json({
      success: true,
      sessionToken,
      isNew,
      ...statusPayload,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

import { MemoryDB } from '../db/MemoryDB';
import { generateSecureToken, verifyPassword, verifyPin } from '../utils/crypto';
import { StaffSession } from '../../../shared/types/session';
import { Reward } from '../../../shared/types/reward';
import { STAFF_SESSION_TTL_MS } from '../../../shared/constants/limits';

export class StaffService {
  private db: MemoryDB;

  constructor() {
    this.db = MemoryDB.getInstance();
  }

  /**
   * Authenticate staff member by business email/slug and password
   */
  public login(identifier: string, password: string): { session: StaffSession; businessName: string } {
    let business = this.db.getBusinessByEmail(identifier);
    if (!business) {
      business = this.db.getBusinessBySlug(identifier);
    }

    if (!business) {
      throw new Error('INVALID_CREDENTIALS: Business account not found');
    }

    const isValid = verifyPassword(password, business.passwordHash);
    if (!isValid) {
      throw new Error('INVALID_CREDENTIALS: Incorrect staff password');
    }

    const sessionId = generateSecureToken(32);
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + STAFF_SESSION_TTL_MS).toISOString();

    const session: StaffSession = {
      sessionId,
      businessId: business.id,
      businessName: business.name,
      businessSlug: business.slug,
      tier: business.tier,
      createdAt: nowIso,
      expiresAt,
    };

    this.db.saveStaffSession(session);

    return {
      session,
      businessName: business.name,
    };
  }

  /**
   * Validate staff session token
   */
  public validateSession(sessionId: string): StaffSession {
    const session = this.db.getStaffSession(sessionId);
    if (!session) {
      throw new Error('UNAUTHORIZED: Staff session expired or invalid');
    }
    return session;
  }

  /**
   * Redeem customer reward voucher using 4-digit staff PIN
   */
  public redeemVoucher(
    businessId: string,
    voucherCode: string,
    staffPin: string
  ): { reward: Reward; customerName: string } {
    const business = this.db.getBusinessById(businessId);
    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    // Verify 4-digit PIN
    const isPinValid = verifyPin(staffPin, business.staffPinHash);
    if (!isPinValid) {
      throw new Error('INVALID_STAFF_PIN: The 4-digit staff verification PIN is incorrect');
    }

    // Find reward by code and businessId
    const reward = this.db.getRewardByCodeAndBusiness(voucherCode, businessId);
    if (!reward) {
      throw new Error('VOUCHER_NOT_FOUND: Voucher code not found for this business');
    }

    if (reward.status === 'redeemed') {
      throw new Error('REWARD_ALREADY_REDEEMED: This reward has already been redeemed');
    }

    // Mark redeemed
    const nowIso = new Date().toISOString();
    reward.status = 'redeemed';
    reward.redeemedAt = nowIso;
    reward.staffPinVerifiedBy = `Staff Terminal (${business.name})`;
    this.db.saveReward(reward);

    // Clear activeVoucher on customer if it matches this reward
    const customer = this.db.getCustomerById(reward.customerId);
    if (customer && customer.activeVoucher?.rewardId === reward.id) {
      customer.activeVoucher = undefined;
      customer.updatedAt = nowIso;
      this.db.saveCustomer(customer);
    }

    // Update offer metrics
    const offer = this.db.getActiveOfferByBusinessId(businessId);
    if (offer) {
      offer.metrics.rewardsRedeemed += 1;
      this.db.saveOffer(offer);
    }

    return {
      reward,
      customerName: reward.customerName || 'Valued Customer',
    };
  }
}

import { Business } from '../../../shared/types/business';
import { Offer } from '../../../shared/types/offer';
import { Customer } from '../../../shared/types/customer';
import { CustomerJourneyStage, CustomerStatusResponse } from '../../../shared/types/qr';
import { isSameMerchantDay } from '../utils/timezone';
import { maskMobile } from '../utils/crypto';

export class CustomerStatusService {
  /**
   * Calculate complete server-authoritative status and determine the first incomplete stage
   */
  public evaluateStatus(
    business: Business,
    offer: Offer | null,
    customer: Customer | null
  ): CustomerStatusResponse['status'] {
    if (!customer) {
      return {
        spinAvailable: false,
        spinCompletedToday: false,
        loyaltyAvailable: false,
        loyaltyCompletedToday: false,
        loyaltyMilestoneReached: false,
        activeReward: null,
        reviewJourneyCompleted: false,
        currentStage: 'auth',
        isCooldown: false,
      };
    }

    const now = new Date();
    const tz = business.timezone || 'UTC';

    // Daily checks in merchant timezone
    const spinCompletedToday = isSameMerchantDay(customer.lastSpinAt, now, tz);
    const loyaltyCompletedToday = isSameMerchantDay(customer.lastVisitAt, now, tz);

    const hasSpinTier = business.tier === 'spin' || business.tier === 'combined';
    const hasLoyaltyTier = business.tier === 'loyalty' || business.tier === 'combined';
    const hasReviewTier = business.tier === 'review' || business.tier === 'combined';

    const loyaltyTarget = offer?.loyaltyTarget || business.loyaltyTarget || 6;
    const loyaltyMilestoneReached = (customer.visitCount >= loyaltyTarget);

    const activeReward = customer.activeVoucher ? {
      rewardId: customer.activeVoucher.rewardId,
      code: customer.activeVoucher.code,
      title: customer.activeVoucher.title,
      type: customer.activeVoucher.type,
    } : null;

    const spinAvailable = hasSpinTier && !spinCompletedToday && !activeReward;
    const loyaltyAvailable = hasLoyaltyTier && !loyaltyCompletedToday;
    const reviewJourneyCompleted = customer.reviewJourneyCompleted === true;

    // Determine First Incomplete Stage
    let currentStage: CustomerJourneyStage = 'cooldown';
    let isCooldown = false;

    if (activeReward) {
      currentStage = 'voucher';
    } else if (hasSpinTier && !spinCompletedToday) {
      currentStage = 'spin';
    } else if (hasLoyaltyTier && loyaltyMilestoneReached) {
      currentStage = 'loyalty_reward';
    } else if (hasLoyaltyTier && !loyaltyCompletedToday) {
      currentStage = 'loyalty';
    } else if (hasReviewTier && !reviewJourneyCompleted) {
      currentStage = 'review';
    } else {
      currentStage = 'cooldown';
      isCooldown = true;
    }

    return {
      spinAvailable,
      spinCompletedToday,
      loyaltyAvailable,
      loyaltyCompletedToday,
      loyaltyMilestoneReached,
      activeReward,
      reviewJourneyCompleted,
      currentStage,
      isCooldown,
      cooldownMessage: isCooldown
        ? 'Your offer will reset at midnight 00:00. Thank you for visiting us again!'
        : undefined,
    };
  }

  /**
   * Format full status response payload
   */
  public formatStatusResponse(
    business: Business,
    offer: Offer | null,
    customer: Customer | null
  ): CustomerStatusResponse {
    const status = this.evaluateStatus(business, offer, customer);

    return {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        tier: business.tier,
        category: business.category,
        city: business.city,
        country: business.country,
        timezone: business.timezone,
        logoEmoji: business.logoEmoji,
        logoUrl: business.logoUrl,
        accentColor: business.accentColor,
      },
      offer: offer ? {
        id: offer.id,
        title: offer.title,
        tier: offer.tier,
        status: offer.status,
        spinWheelConfiguration: offer.spinWheelConfiguration,
        loyaltyTarget: offer.loyaltyTarget,
        loyaltyValidationDays: offer.loyaltyValidationDays,
        loyaltyReward: offer.loyaltyReward,
        googleReviewUrl: offer.googleReviewUrl,
      } : null,
      customer: customer ? {
        id: customer.id,
        name: customer.name,
        mobileMasked: maskMobile(customer.mobile),
        visitCount: customer.visitCount,
        totalVisits: customer.totalVisits,
        activeVoucher: customer.activeVoucher,
      } : null,
      status,
    };
  }
}

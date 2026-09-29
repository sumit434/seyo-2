import { MemoryDB } from '../db/MemoryDB';
import { generateSecureToken } from '../utils/crypto';
import { CustomerSession, MerchantEntry } from '../../../shared/types/qr';
import { Business } from '../../../shared/types/business';
import { Offer } from '../../../shared/types/offer';
import { CUSTOMER_SESSION_TTL_MS } from '../../../shared/constants/limits';

export class CustomerSessionService {
  private db: MemoryDB;

  constructor() {
    this.db = MemoryDB.getInstance();
  }

  /**
   * Resolve a merchant entry by slug or permanent entry code
   */
  public resolveMerchant(identifier: string): {
    business: Business;
    offer: Offer | null;
    entry: MerchantEntry | null;
    isActive: boolean;
  } {
    let business = this.db.getBusinessBySlug(identifier);
    let entry: MerchantEntry | null = null;

    if (!business) {
      // Try resolving by permanent code
      const foundEntry = this.db.getMerchantEntryByPermanentCode(identifier);
      if (foundEntry) {
        entry = foundEntry;
        business = this.db.getBusinessById(foundEntry.businessId);
      }
    } else {
      const entries = this.db.getMerchantEntriesByBusinessId(business.id);
      entry = entries.length > 0 ? entries[0] : null;
    }

    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND: Business could not be located');
    }

    const offer = this.db.getActiveOfferByBusinessId(business.id) || null;
    const isActive = !!offer && offer.status === 'active';

    if (offer && isActive) {
      // Record scan metric
      offer.metrics.scans += 1;
      this.db.saveOffer(offer);
    }

    return {
      business,
      offer,
      entry,
      isActive,
    };
  }

  /**
   * Create or validate a customer session
   */
  public createSession(businessId: string, offerId: string, authType: 'qr' | 'nfc', customerId?: string): CustomerSession {
    const sessionToken = generateSecureToken(32);
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + CUSTOMER_SESSION_TTL_MS).toISOString();

    const session: CustomerSession = {
      sessionId: `cs_${generateSecureToken(8)}`,
      sessionToken,
      businessId,
      offerId,
      customerId,
      authType,
      currentStage: customerId ? 'spin' : 'auth',
      isUsed: false,
      createdAt: nowIso,
      expiresAt,
    };

    this.db.saveCustomerSession(session);
    return session;
  }

  /**
   * Validate and retrieve customer session
   */
  public validateSession(sessionToken: string): CustomerSession {
    const session = this.db.getCustomerSession(sessionToken);
    if (!session) {
      throw new Error('SESSION_EXPIRED: Customer session expired or invalid');
    }
    return session;
  }
}

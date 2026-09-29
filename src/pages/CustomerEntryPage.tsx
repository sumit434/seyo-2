import React, { useEffect, useState } from 'react';
import { customerService } from '../services/customerService';
import { CustomerStatusResponse } from '../../shared/types/qr';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { NoOfferScreen } from '../components/customer/NoOfferScreen';
import { CustomerAuthFlow } from '../components/customer/CustomerAuthFlow';
import { SpinWheel } from '../components/customer/SpinWheel';
import { RewardVoucher } from '../components/customer/RewardVoucher';
import { LoyaltyTracker } from '../components/customer/LoyaltyTracker';
import { ReviewGenerator } from '../components/review/ReviewGenerator';
import { CooldownScreen } from '../components/customer/CooldownScreen';

interface CustomerEntryPageProps {
  slug: string;
  entryMode?: 'combined' | 'spin' | 'loyalty' | 'review';
}

export const CustomerEntryPage: React.FC<CustomerEntryPageProps> = ({ slug, entryMode = 'combined' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<CustomerStatusResponse | null>(null);
  const [isActiveOffer, setIsActiveOffer] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // URL Sanitization on entry (Specification section 50)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('key') || params.get('token')) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  const loadCustomerJourney = async () => {
    setLoading(true);
    setError(null);
    try {
      const storedToken = sessionStorage.getItem(`seyo_customer_session_${slug}`);
      const storedCustomerId = sessionStorage.getItem(`seyo_customer_id_${slug}`);

      // 1. Resolve merchant entry
      const resolveRes = await customerService.resolveEntry(slug);

      if (!resolveRes.isActive) {
        setIsActiveOffer(false);
        setStatusData({
          business: resolveRes.business as any,
          offer: null,
          customer: null,
          status: {
            spinAvailable: false,
            spinCompletedToday: false,
            loyaltyAvailable: false,
            loyaltyCompletedToday: false,
            loyaltyMilestoneReached: false,
            activeReward: null,
            reviewJourneyCompleted: false,
            currentStage: 'auth',
            isCooldown: false,
          },
        });
        setLoading(false);
        return;
      }

      setIsActiveOffer(true);
      const token = storedToken || resolveRes.sessionToken || null;
      if (token) {
        setSessionToken(token);
        sessionStorage.setItem(`seyo_customer_session_${slug}`, token);
      }

      // 2. Fetch customer status if authenticated
      if (token && storedCustomerId) {
        const fullStatus = await customerService.getStatus(slug, token, storedCustomerId);
        setStatusData(fullStatus);
      } else {
        setStatusData({
          business: resolveRes.business as any,
          offer: resolveRes.offer as any,
          customer: null,
          status: resolveRes.status as any,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Could not load rewards experience.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerJourney();
  }, [slug]);

  if (loading) {
    return <LoadingScreen message="Connecting to rewards station..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Unable to Connect"
        message={error}
        onRetry={loadCustomerJourney}
      />
    );
  }

  if (!statusData || !statusData.business) {
    return (
      <ErrorMessage
        title="Business Not Found"
        message="The merchant QR or NFC identifier could not be verified."
      />
    );
  }

  // Fallback screen if offer is inactive
  if (!isActiveOffer || !statusData.offer) {
    return (
      <div className="min-h-screen bg-[#f1f3f2] flex flex-col items-center justify-center p-4">
        <NoOfferScreen
          businessName={statusData.business.name}
          logoEmoji={statusData.business.logoEmoji}
          accentColor={statusData.business.accentColor}
        />
      </div>
    );
  }

  const { business, offer, customer, status } = statusData;

  // If customer is not authenticated yet -> show CustomerAuthFlow
  if (!customer) {
    return (
      <div className="min-h-screen bg-[#f1f3f2] flex flex-col items-center justify-center p-4">
        <CustomerAuthFlow
          businessId={business.id}
          businessName={business.name}
          logoEmoji={business.logoEmoji}
          accentColor={business.accentColor}
          onAuthenticated={payload => {
            sessionStorage.setItem(`seyo_customer_session_${slug}`, payload.sessionToken);
            if (payload.customer) {
              sessionStorage.setItem(`seyo_customer_id_${slug}`, payload.customer.id);
            }
            setStatusData(payload);
          }}
        />
      </div>
    );
  }

  // Customer is authenticated: Render the FIRST INCOMPLETE STAGE
  return (
    <div className="min-h-screen bg-[#f1f3f2] flex flex-col items-center justify-between py-6 px-4">
      {/* Customer Header Branding */}
      <div className="w-full max-w-sm flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-xs border border-[#e2e7e6]"
            style={{ backgroundColor: `${business.accentColor}15` }}
          >
            <span>{business.logoEmoji}</span>
          </div>
          <div className="text-left">
            <h1 className="font-bold text-sm text-[#10181c] leading-tight">{business.name}</h1>
            <p className="text-[11px] text-[#6a787e]">
              Hello, <strong className="text-[#0e7c66]">{customer.name}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem(`seyo_customer_id_${slug}`);
            sessionStorage.removeItem(`seyo_customer_session_${slug}`);
            loadCustomerJourney();
          }}
          className="text-xs text-[#6a787e] hover:text-[#10181c] underline cursor-pointer"
        >
          Sign Out
        </button>
      </div>

      {/* STAGE 1: ACTIVE VOUCHER (Needs staff PIN redemption) */}
      {status.currentStage === 'voucher' && status.activeReward && (
        <RewardVoucher
          voucher={{
            rewardId: status.activeReward.rewardId,
            code: status.activeReward.code,
            title: status.activeReward.title,
            type: status.activeReward.type,
            claimedAt: new Date().toISOString(),
          }}
          businessName={business.name}
          businessId={business.id}
          onRedeemed={async () => {
            const updated = await customerService.getStatus(slug, sessionToken || undefined, customer.id);
            setStatusData(updated);
          }}
          onContinue={async () => {
            const updated = await customerService.getStatus(slug, sessionToken || undefined, customer.id);
            setStatusData(updated);
          }}
        />
      )}

      {/* STAGE 2: SPIN WHEEL (If tier has spin and not spun today) */}
      {status.currentStage === 'spin' && offer.spinWheelConfiguration && (
        <SpinWheel
          businessId={business.id}
          customerId={customer.id}
          slices={offer.spinWheelConfiguration}
          accentColor={business.accentColor}
          onSpinCompleted={async reward => {
            const updated = await customerService.getStatus(slug, sessionToken || undefined, customer.id);
            setStatusData(updated);
          }}
        />
      )}

      {/* STAGE 3: LOYALTY REWARD (Milestone unlocked, waiting for voucher redemption) */}
      {status.currentStage === 'loyalty_reward' && customer.activeVoucher && (
        <RewardVoucher
          voucher={{
            rewardId: customer.activeVoucher.rewardId,
            code: customer.activeVoucher.code,
            title: customer.activeVoucher.title,
            type: 'loyalty',
            claimedAt: customer.activeVoucher.claimedAt,
          }}
          businessName={business.name}
          businessId={business.id}
          onRedeemed={async () => {
            const updated = await customerService.getStatus(slug, sessionToken || undefined, customer.id);
            setStatusData(updated);
          }}
          onContinue={async () => {
            const updated = await customerService.getStatus(slug, sessionToken || undefined, customer.id);
            setStatusData(updated);
          }}
        />
      )}

      {/* STAGE 4: LOYALTY TRACKER (If tier has loyalty and not stamped today) */}
      {status.currentStage === 'loyalty' && (
        <LoyaltyTracker
          businessId={business.id}
          customerId={customer.id}
          visitCount={customer.visitCount}
          loyaltyTarget={offer.loyaltyTarget || 6}
          totalVisits={customer.totalVisits}
          loyaltyRewardTitle={offer.loyaltyReward || 'Special Gift'}
          isStampedToday={status.loyaltyCompletedToday}
          onStampSuccess={async () => {
            const updated = await customerService.getStatus(slug, sessionToken || undefined, customer.id);
            setStatusData(updated);
          }}
          onContinue={async () => {
            const updated = await customerService.getStatus(slug, sessionToken || undefined, customer.id);
            setStatusData(updated);
          }}
        />
      )}

      {/* STAGE 5: REVIEW GENERATOR (If tier has review and not completed yet) */}
      {status.currentStage === 'review' && offer.googleReviewUrl && (
        <ReviewGenerator
          businessId={business.id}
          businessName={business.name}
          customerId={customer.id}
          customerName={customer.name}
          googleReviewUrl={offer.googleReviewUrl}
          onReviewCompleted={async () => {
            const updated = await customerService.getStatus(slug, sessionToken || undefined, customer.id);
            setStatusData(updated);
          }}
        />
      )}

      {/* STAGE 6: COOLDOWN (All daily activities completed!) */}
      {status.currentStage === 'cooldown' && (
        <CooldownScreen
          businessName={business.name}
          businessSlug={business.slug}
          logoEmoji={business.logoEmoji}
          accentColor={business.accentColor}
          onRefresh={loadCustomerJourney}
        />
      )}

      {/* Minimal Footer */}
      <footer className="mt-8 text-center">
        <p className="text-[11px] text-[#6a787e] uppercase tracking-wider font-semibold">
          Powered by SEYO Platform
        </p>
      </footer>
    </div>
  );
};

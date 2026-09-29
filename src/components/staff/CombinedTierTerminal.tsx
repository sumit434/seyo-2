import React, { useState } from 'react';
import { LoyaltyRecordsList } from './LoyaltyRecordsList';
import { RewardRecordsList } from './RewardRecordsList';
import { QRGenerator } from './QRGenerator';
import { StaffPINModal } from './StaffPINModal';
import { Button } from '../common/Button';
import { staffApi } from '../../services/staffApi';
import {
  Users,
  Gift,
  Award,
  Star,
  KeyRound,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

interface CombinedTierTerminalProps {
  sessionToken: string;
  business: any;
  offer: any;
  entries: any[];
  loyaltyRecords: any[];
  rewards: any[];
  reviews: any[];
  onRefresh: () => void;
  onLogout: () => void;
}

export const CombinedTierTerminal: React.FC<CombinedTierTerminalProps> = ({
  sessionToken,
  business,
  offer,
  entries,
  loyaltyRecords,
  rewards,
  reviews,
  onRefresh,
  onLogout,
}) => {
  const isCombined = business.tier === 'combined';
  const hasLoyalty = business.tier === 'loyalty' || isCombined;
  const hasRewards = business.tier === 'spin' || isCombined;
  const hasReview = business.tier === 'review' || isCombined;

  // Active view toggle for Combined or tier-specific default
  const [activeTab, setActiveTab] = useState<'loyalty' | 'rewards' | 'qr' | 'reviews'>(
    hasLoyalty ? 'loyalty' : hasRewards ? 'rewards' : 'reviews'
  );

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [targetVoucherCode, setTargetVoucherCode] = useState<string | undefined>(undefined);
  const [isCancellingOffer, setIsCancellingOffer] = useState(false);

  const metrics = offer?.metrics || {
    scans: 0,
    identifiedGuests: 0,
    rewardsIssued: 0,
    rewardsRedeemed: 0,
    loyaltyStampsIssued: 0,
  };

  const handleOpenRedeem = (code?: string) => {
    setTargetVoucherCode(code);
    setIsPinModalOpen(true);
  };

  const handleCancelOffer = async () => {
    if (!window.confirm('Are you sure you want to cancel the active campaign? Once cancelled, active configuration will close and you can launch a fresh offer.')) {
      return;
    }
    setIsCancellingOffer(true);
    try {
      await staffApi.cancelOffer(sessionToken);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel offer');
    } finally {
      setIsCancellingOffer(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Merchant Info and Quick Redeem Button */}
      <div className="bg-white rounded-3xl border border-[#e2e7e6] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border border-[#e2e7e6] shadow-inner"
            style={{ backgroundColor: `${business.accentColor || '#0e7c66'}15` }}
          >
            {business.logoUrl ? (
              <img src={business.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span>{business.logoEmoji || '🏪'}</span>
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#10181c]">{business.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#0e7c66] text-white">
                {business.tier}
              </span>
            </div>
            <p className="text-xs text-[#6a787e] mt-0.5">
              {business.city}, {business.country} • Timezone: <span className="font-semibold text-[#10181c]">{business.timezone}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleOpenRedeem()}
            variant="primary"
            size="md"
            className="gap-2 shadow-sm"
          >
            <KeyRound className="w-4 h-4" />
            <span>Verify Voucher PIN</span>
          </Button>

          <Button onClick={onLogout} variant="outline" size="md">
            Sign Out
          </Button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        <div className="bg-white p-5 rounded-3xl border border-[#e2e7e6] shadow-xs">
          <div className="flex items-center justify-between text-[#6a787e] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Scans</span>
            <Sparkles className="w-4 h-4 text-[#0e7c66]" />
          </div>
          <span className="text-2xl font-black text-[#10181c] font-mono">{metrics.scans}</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#e2e7e6] shadow-xs">
          <div className="flex items-center justify-between text-[#6a787e] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Loyal Guests</span>
            <Users className="w-4 h-4 text-[#0e7c66]" />
          </div>
          <span className="text-2xl font-black text-[#10181c] font-mono">{loyaltyRecords.length}</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#e2e7e6] shadow-xs">
          <div className="flex items-center justify-between text-[#6a787e] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Stamps Issued</span>
            <Award className="w-4 h-4 text-[#0e7c66]" />
          </div>
          <span className="text-2xl font-black text-[#10181c] font-mono">{metrics.loyaltyStampsIssued}</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#e2e7e6] shadow-xs">
          <div className="flex items-center justify-between text-[#6a787e] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Redeemed Treats</span>
            <CheckCircle className="w-4 h-4 text-[#0e7c66]" />
          </div>
          <span className="text-2xl font-black text-[#10181c] font-mono">{metrics.rewardsRedeemed}</span>
        </div>
      </div>

      {/* Active Offer Status Banner */}
      {offer && (
        <div className="bg-white rounded-3xl border border-[#e2e7e6] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Offer Active & Immutable
              </span>
            </div>
            <h4 className="font-bold text-[#10181c] text-base">{offer.title}</h4>
            <p className="text-xs text-[#6a787e]">{offer.description}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCancelOffer}
              disabled={isCancellingOffer}
              className="text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors cursor-pointer border border-red-200"
            >
              Cancel Campaign
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e2e7e6] pb-2">
        {hasLoyalty && (
          <button
            type="button"
            onClick={() => setActiveTab('loyalty')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'loyalty'
                ? 'bg-[#0e7c66] text-white shadow-sm'
                : 'text-[#6a787e] hover:text-[#10181c] hover:bg-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Loyalty Records ({loyaltyRecords.length})</span>
          </button>
        )}

        {hasRewards && (
          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'rewards'
                ? 'bg-[#0e7c66] text-white shadow-sm'
                : 'text-[#6a787e] hover:text-[#10181c] hover:bg-white'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Reward History ({rewards.length})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('qr')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'qr'
              ? 'bg-[#0e7c66] text-white shadow-sm'
              : 'text-[#6a787e] hover:text-[#10181c] hover:bg-white'
          }`}
        >
          <span>QR & NFC Tags</span>
        </button>

        {hasReview && reviews.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-[#0e7c66] text-white shadow-sm'
                : 'text-[#6a787e] hover:text-[#10181c] hover:bg-white'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Customer Feedback ({reviews.length})</span>
          </button>
        )}
      </div>

      {/* Tab Panels */}
      {activeTab === 'loyalty' && hasLoyalty && (
        <LoyaltyRecordsList
          records={loyaltyRecords}
          target={offer?.loyaltyTarget || business.loyaltyTarget || 6}
        />
      )}

      {activeTab === 'rewards' && hasRewards && (
        <RewardRecordsList
          rewards={rewards}
          onOpenRedeemModal={code => handleOpenRedeem(code)}
        />
      )}

      {activeTab === 'qr' && (
        <QRGenerator entries={entries} businessName={business.name} businessSlug={business.slug} />
      )}

      {activeTab === 'reviews' && hasReview && (
        <div className="bg-white rounded-3xl border border-[#e2e7e6] p-6 text-left space-y-4">
          <h3 className="font-bold text-[#10181c] text-base flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>Persisted Review Logs</span>
          </h3>
          <div className="divide-y divide-[#e2e7e6]">
            {reviews.map((r: any) => (
              <div key={r.id} className="py-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#10181c]">{r.customerName || 'Guest'}</span>
                  <span className="text-amber-500 font-bold">{'★'.repeat(r.rating || 5)}</span>
                </div>
                <p className="text-xs text-[#10181c]">{r.reviewText}</p>
                <div className="flex gap-1">
                  {r.tags?.map((t: string) => (
                    <span key={t} className="text-[10px] bg-[#f1f3f2] px-2 py-0.5 rounded-md text-[#6a787e]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff PIN Modal */}
      <StaffPINModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        sessionToken={sessionToken}
        initialCode={targetVoucherCode}
        onSuccess={() => {
          onRefresh();
        }}
      />
    </div>
  );
};

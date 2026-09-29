import React, { useState } from 'react';
import { Button } from '../common/Button';
import { TopRankersModal } from './TopRankersModal';
import { Moon, RotateCcw, Trophy, CheckCircle2 } from 'lucide-react';

interface CooldownScreenProps {
  businessName: string;
  businessSlug: string;
  logoEmoji: string;
  accentColor?: string;
  onRefresh: () => void;
}

export const CooldownScreen: React.FC<CooldownScreenProps> = ({
  businessName,
  businessSlug,
  logoEmoji,
  accentColor = '#0e7c66',
  onRefresh,
}) => {
  const [isRankersOpen, setIsRankersOpen] = useState(false);

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-3xl border border-[#e2e7e6] shadow-xl p-8 text-center space-y-6">
      <div className="flex flex-col items-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-4 border border-[#e2e7e6]"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <span>{logoEmoji}</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e2f1ec] text-[#0e7c66] text-xs font-bold uppercase tracking-wider mb-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>All Stages Completed</span>
        </div>

        <h2 className="text-2xl font-black text-[#10181c] tracking-tight">Offer completed for today.</h2>

        <div className="mt-4 p-4 rounded-2xl bg-[#f1f3f2]/80 border border-[#e2e7e6] flex items-start gap-3 text-left">
          <Moon className="w-5 h-5 text-[#0e7c66] shrink-0 mt-0.5" />
          <p className="text-xs text-[#10181c] leading-relaxed font-medium">
            Your offer will reset at midnight 00:00. Thank you for visiting us again!
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <Button
          onClick={onRefresh}
          variant="primary"
          size="lg"
          fullWidth
          className="gap-2 shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Refresh Page</span>
        </Button>

        <Button
          onClick={() => setIsRankersOpen(true)}
          variant="outline"
          size="md"
          fullWidth
          className="gap-2"
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Top Loyalty Rankers</span>
        </Button>
      </div>

      <TopRankersModal
        isOpen={isRankersOpen}
        onClose={() => setIsRankersOpen(false)}
        businessSlug={businessSlug}
      />
    </div>
  );
};

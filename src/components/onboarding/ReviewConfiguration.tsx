import React from 'react';
import { Input } from '../common/Input';
import { Star, Link as LinkIcon, MapPin } from 'lucide-react';

interface ReviewConfigurationProps {
  googleReviewUrl: string;
  googlePlaceId?: string;
  onChange: (fields: { googleReviewUrl?: string; googlePlaceId?: string }) => void;
  errors?: { [key: string]: string };
}

export const ReviewConfiguration: React.FC<ReviewConfigurationProps> = ({
  googleReviewUrl,
  googlePlaceId,
  onChange,
  errors = {},
}) => {
  return (
    <div className="space-y-4 bg-white p-6 rounded-3xl border border-[#e2e7e6] text-left">
      <div className="pb-3 border-b border-[#e2e7e6]">
        <h3 className="text-lg font-bold text-[#10181c] flex items-center gap-2">
          <span>Google Review Handoff Accelerator</span>
        </h3>
        <p className="text-xs text-[#6a787e] mt-0.5">
          Customers craft verified review prompts with 1-tap clipboard copying, persisted before redirection.
        </p>
      </div>

      <Input
        label="Google Business Review Direct URL"
        placeholder="https://maps.google.com/?q=Your+Business+Name or https://g.page/r/..."
        value={googleReviewUrl}
        onChange={e => onChange({ googleReviewUrl: e.target.value })}
        error={errors.googleReviewUrl}
        helperText="Direct Google Maps Review link provided by Google Business Profile."
        leftAddon={<LinkIcon className="w-5 h-5 text-[#0e7c66]" />}
      />

      <Input
        label="Google Place ID (Optional)"
        placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
        value={googlePlaceId || ''}
        onChange={e => onChange({ googlePlaceId: e.target.value })}
        helperText="Optional place ID for deep integration and verified reviews."
        leftAddon={<MapPin className="w-5 h-5 text-[#6a787e]" />}
      />
    </div>
  );
};

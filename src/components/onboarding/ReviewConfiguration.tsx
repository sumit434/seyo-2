import React, { useState } from 'react';
import { Input } from '../common/Input';
import { Star, Link as LinkIcon, MapPin, Check, PlusCircle } from 'lucide-react';

interface ReviewConfigurationProps {
  googleReviewUrl: string;
  googlePlaceId?: string;
  isAddon?: boolean;
  onChange: (fields: { googleReviewUrl?: string; googlePlaceId?: string }) => void;
  errors?: { [key: string]: string };
}

export const ReviewConfiguration: React.FC<ReviewConfigurationProps> = ({
  googleReviewUrl,
  googlePlaceId,
  isAddon = false,
  onChange,
  errors = {},
}) => {
  const [addonEnabled, setAddonEnabled] = useState<boolean>(Boolean(googleReviewUrl && googleReviewUrl.trim().length > 0));

  const handleToggleAddon = (enabled: boolean) => {
    setAddonEnabled(enabled);
    if (!enabled) {
      onChange({ googleReviewUrl: '', googlePlaceId: '' });
    } else if (!googleReviewUrl) {
      onChange({ googleReviewUrl: 'https://maps.google.com/?q=Your+Business+Name' });
    }
  };

  return (
    <div className="space-y-4 bg-white p-6 rounded-3xl border border-[#e2e7e6] text-left">
      <div className="pb-3 border-b border-[#e2e7e6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#10181c] flex items-center gap-2">
            <span>Google Review Handoff Accelerator</span>
            {isAddon ? (
              <span className="text-[11px] font-bold uppercase tracking-wider bg-[#0e7c66]/10 text-[#0e7c66] px-2.5 py-0.5 rounded-full">
                Tier Add-On (+$0 Worth)
              </span>
            ) : (
              <span className="text-[11px] font-bold uppercase tracking-wider bg-[#0e7c66] text-white px-2.5 py-0.5 rounded-full">
                Core Feature
              </span>
            )}
          </h3>
          <p className="text-xs text-[#6a787e] mt-0.5 leading-relaxed">
            {isAddon
              ? 'Checks if a guest has ever completed the review flow. If false, prompts them once before the daily cooldown.'
              : 'Customers craft verified review prompts with 1-tap clipboard copying, persisted before redirection.'}
          </p>
        </div>

        {isAddon && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleToggleAddon(!addonEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                addonEnabled ? 'bg-[#0e7c66]' : 'bg-[#e2e7e6]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  addonEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-xs font-bold text-[#10181c]">
              {addonEnabled ? 'Add-on Active' : 'Add-on Disabled'}
            </span>
          </div>
        )}
      </div>

      {(!isAddon || addonEnabled) && (
        <div className="space-y-4 pt-1">
          <Input
            label={isAddon ? "Google Business Review Direct URL (Add-On Active)" : "Google Business Review Direct URL"}
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
      )}

      {isAddon && !addonEnabled && (
        <div className="p-3.5 rounded-2xl bg-[#f8faf9] border border-[#e2e7e6] text-xs text-[#6a787e] flex items-center justify-between">
          <span>Review accelerator add-on disabled for this tier campaign. Guests will go straight to the daily cooldown.</span>
          <button
            type="button"
            onClick={() => handleToggleAddon(true)}
            className="text-xs text-[#0e7c66] font-bold hover:underline flex items-center gap-1 cursor-pointer shrink-0 ml-2"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Enable Add-on</span>
          </button>
        </div>
      )}
    </div>
  );
};

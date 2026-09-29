import React, { useState } from 'react';
import { ALLOWED_COUNTRIES } from '../../../shared/constants/countries';
import { customerAuthService } from '../../services/customerAuthService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Phone, KeyRound, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { CustomerStatusResponse } from '../../../shared/types/qr';

interface CustomerAuthFlowProps {
  businessId: string;
  businessName: string;
  logoEmoji: string;
  accentColor: string;
  onAuthenticated: (payload: { sessionToken: string } & CustomerStatusResponse) => void;
}

type AuthStep = 'mobile' | 'otp' | 'name';

export const CustomerAuthFlow: React.FC<CustomerAuthFlowProps> = ({
  businessId,
  businessName,
  logoEmoji,
  accentColor,
  onAuthenticated,
}) => {
  const [step, setStep] = useState<AuthStep>('mobile');
  const [countryCode, setCountryCode] = useState('+1');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim() || mobile.replace(/\D/g, '').length < 6) {
      setError('Please enter a valid mobile number');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await customerAuthService.requestOtp(businessId, mobile, countryCode);
      setMaskedMobile(res.maskedMobile);
      setDemoOtp(res.demoOtp);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await customerAuthService.verifyOtp(businessId, mobile, otp, undefined, countryCode);
      if (res.isNew && (!res.customer?.name || res.customer.name === 'Guest')) {
        setStep('name');
      } else {
        onAuthenticated(res);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await customerAuthService.verifyOtp(businessId, mobile, otp, name.trim(), countryCode);
      onAuthenticated(res);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-3xl border border-[#e2e7e6] shadow-lg p-6 sm:p-8 text-left">
      <div className="flex flex-col items-center text-center mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-3 border border-[#e2e7e6]"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <span>{logoEmoji}</span>
        </div>
        <h2 className="text-xl font-bold text-[#10181c]">{businessName}</h2>
        <p className="text-xs text-[#6a787e] mt-1">
          {step === 'mobile' && 'Enter your mobile number to unlock rewards'}
          {step === 'otp' && 'Verify your one-time passkey'}
          {step === 'name' && 'Welcome! What should we call you?'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {step === 'mobile' && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#10181c]">Mobile Number</label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                className="w-28 rounded-2xl border border-[#e2e7e6] bg-white px-2 py-3.5 text-sm font-semibold text-[#10181c] focus:outline-none focus:ring-2 focus:ring-[#0e7c66]"
              >
                {ALLOWED_COUNTRIES.map(c => (
                  <option key={c.code} value={c.dialCode}>
                    {c.flagEmoji} {c.dialCode}
                  </option>
                ))}
              </select>

              <input
                type="tel"
                placeholder="555 123 4567"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                className="flex-1 rounded-2xl border border-[#e2e7e6] bg-white px-4 py-3.5 text-base text-[#10181c] focus:outline-none focus:ring-2 focus:ring-[#0e7c66]"
                autoFocus
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading} className="gap-2">
            <span>Send Passcode</span>
            <ArrowRight className="w-5 h-5" />
          </Button>

          <p className="text-[11px] text-center text-[#6a787e] flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0e7c66]" />
            <span>Fast, passwordless mobile access</span>
          </p>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <Input
            label={`Verification Code sent to ${maskedMobile}`}
            type="text"
            inputMode="numeric"
            placeholder="6-digit code (demo: 123456)"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            leftAddon={<KeyRound className="w-5 h-5 text-[#0e7c66]" />}
            autoFocus
          />

          {demoOtp && (
            <div className="p-2.5 bg-[#e2f1ec] rounded-xl text-center">
              <p className="text-xs text-[#0e7c66] font-semibold">
                Demo Quick-Fill: <span className="font-mono font-bold tracking-widest text-sm">{demoOtp}</span>
              </p>
              <button
                type="button"
                onClick={() => setOtp(demoOtp)}
                className="text-[11px] text-[#0a6252] underline mt-0.5 cursor-pointer font-medium"
              >
                Auto-fill demo code
              </button>
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading} className="gap-2">
            <span>Verify & Continue</span>
            <ArrowRight className="w-5 h-5" />
          </Button>

          <button
            type="button"
            onClick={() => setStep('mobile')}
            className="w-full text-center text-xs text-[#6a787e] hover:text-[#10181c] cursor-pointer pt-1"
          >
            Change mobile number
          </button>
        </form>
      )}

      {step === 'name' && (
        <form onSubmit={handleSaveName} className="space-y-4">
          <Input
            label="Your First & Last Name"
            type="text"
            placeholder="e.g. Alex Chen"
            value={name}
            onChange={e => setName(e.target.value)}
            leftAddon={<User className="w-5 h-5 text-[#0e7c66]" />}
            autoFocus
          />

          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading} className="gap-2">
            <span>Enter Rewards Lounge</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </form>
      )}
    </div>
  );
};

import { request } from './api';
import { CustomerStatusResponse } from '../../shared/types/qr';

export const customerAuthService = {
  // Request OTP for customer login
  async requestOtp(businessId: string, mobile: string, countryCode: string = '+1') {
    return request<{
      success: boolean;
      maskedMobile: string;
      demoOtp: string;
      isExistingCustomer: boolean;
    }>('/api/auth/customer/otp/request', {
      method: 'POST',
      body: JSON.stringify({ businessId, mobile, countryCode }),
    });
  },

  // Verify OTP
  async verifyOtp(
    businessId: string,
    mobile: string,
    otp: string,
    name?: string,
    countryCode: string = '+1'
  ): Promise<{
    success: boolean;
    sessionToken: string;
    isNew: boolean;
  } & CustomerStatusResponse> {
    return request('/api/auth/customer/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ businessId, mobile, otp, name, countryCode }),
    });
  },
};

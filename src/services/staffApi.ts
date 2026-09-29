import { request } from './api';

export const staffApi = {
  // Staff login
  async login(identifier: string, password: string) {
    return request('/api/staff/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  // Terminal data
  async getTerminalData(sessionToken: string) {
    return request('/api/staff/terminal-data', {
      headers: {
        'x-staff-session': sessionToken,
      },
    });
  },

  // Redeem voucher using 4-digit PIN
  async redeemVoucher(sessionToken: string, voucherCode: string, staffPin: string) {
    return request('/api/staff/redeem-voucher', {
      method: 'POST',
      headers: {
        'x-staff-session': sessionToken,
      },
      body: JSON.stringify({ voucherCode, staffPin }),
    });
  },

  // Cancel offer
  async cancelOffer(sessionToken: string) {
    return request('/api/staff/cancel-offer', {
      method: 'POST',
      headers: {
        'x-staff-session': sessionToken,
      },
    });
  },

  // Standalone QR code generation
  async getQrCode(url: string) {
    return request<{ success: boolean; qrDataUrl: string }>(`/api/staff/qr-code?url=${encodeURIComponent(url)}`);
  },
};

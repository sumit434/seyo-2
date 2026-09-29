export interface CountryConfig {
  code: string;
  name: string;
  dialCode: string;
  flagEmoji: string;
  defaultTimezone: string;
  timezones: string[];
}

export const ALLOWED_COUNTRIES: CountryConfig[] = [
  {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    flagEmoji: '🇺🇸',
    defaultTimezone: 'America/New_York',
    timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu'],
  },
  {
    code: 'CN',
    name: 'China',
    dialCode: '+86',
    flagEmoji: '🇨🇳',
    defaultTimezone: 'Asia/Shanghai',
    timezones: ['Asia/Shanghai', 'Asia/Urumqi'],
  },
  {
    code: 'DE',
    name: 'Germany',
    dialCode: '+49',
    flagEmoji: '🇩🇪',
    defaultTimezone: 'Europe/Berlin',
    timezones: ['Europe/Berlin'],
  },
  {
    code: 'JP',
    name: 'Japan',
    dialCode: '+81',
    flagEmoji: '🇯🇵',
    defaultTimezone: 'Asia/Tokyo',
    timezones: ['Asia/Tokyo'],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    flagEmoji: '🇬🇧',
    defaultTimezone: 'Europe/London',
    timezones: ['Europe/London'],
  },
  {
    code: 'IN',
    name: 'India',
    dialCode: '+91',
    flagEmoji: '🇮🇳',
    defaultTimezone: 'Asia/Kolkata',
    timezones: ['Asia/Kolkata'],
  },
  {
    code: 'FR',
    name: 'France',
    dialCode: '+33',
    flagEmoji: '🇫🇷',
    defaultTimezone: 'Europe/Paris',
    timezones: ['Europe/Paris'],
  },
  {
    code: 'IT',
    name: 'Italy',
    dialCode: '+39',
    flagEmoji: '🇮🇹',
    defaultTimezone: 'Europe/Rome',
    timezones: ['Europe/Rome'],
  },
  {
    code: 'RU',
    name: 'Russia',
    dialCode: '+7',
    flagEmoji: '🇷🇺',
    defaultTimezone: 'Europe/Moscow',
    timezones: ['Europe/Moscow', 'Asia/Yekaterinburg', 'Asia/Novosibirsk', 'Asia/Vladivostok'],
  },
  {
    code: 'BR',
    name: 'Brazil',
    dialCode: '+55',
    flagEmoji: '🇧🇷',
    defaultTimezone: 'America/Sao_Paulo',
    timezones: ['America/Sao_Paulo', 'America/Manaus', 'America/Belem'],
  },
];

export const ALLOWED_COUNTRY_NAMES = ALLOWED_COUNTRIES.map(c => c.name);

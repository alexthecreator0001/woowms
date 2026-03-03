const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', CZK: 'Kč', PLN: 'zł', HUF: 'Ft',
  CAD: 'CA$', AUD: 'A$', CHF: 'CHF', SEK: 'kr', NOK: 'kr', DKK: 'kr',
  RON: 'lei', BGN: 'лв', HRK: 'kn', JPY: '¥', CNY: '¥', KRW: '₩',
  INR: '₹', BRL: 'R$', MXN: 'MX$', TRY: '₺', RUB: '₽', ZAR: 'R',
  NZD: 'NZ$', SGD: 'S$', HKD: 'HK$', TWD: 'NT$', THB: '฿', PHP: '₱',
  IDR: 'Rp', MYR: 'RM', VND: '₫', AED: 'د.إ', SAR: '﷼', ILS: '₪',
};

const POSTFIX_CURRENCIES = ['CZK', 'SEK', 'NOK', 'DKK', 'PLN', 'HUF', 'RON', 'BGN', 'HRK'];

export function currencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || code;
}

export function fmtMoney(amount: string | number, currency: string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `0.00 ${currency}`;
  const sym = CURRENCY_SYMBOLS[currency] || currency + ' ';
  const formatted = num.toFixed(2);
  if (POSTFIX_CURRENCIES.includes(currency)) {
    return `${formatted} ${sym}`;
  }
  return `${sym}${formatted}`;
}

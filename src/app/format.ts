const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat('en');

export const formatCompact = (value: number) => compact.format(value);
export const formatNumber = (value: number) => full.format(value);
export const formatDate = (iso: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) =>
  new Date(iso).toLocaleDateString('en', { ...options, timeZone: 'UTC' });

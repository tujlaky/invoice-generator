export type VatRate = "21" | "9" | "0" | "exempt";

export type CurrencyCode =
  | "EUR"
  | "USD"
  | "JPY"
  | "BGN"
  | "CZK"
  | "DKK"
  | "GBP"
  | "HUF"
  | "PLN"
  | "RON"
  | "SEK"
  | "CHF"
  | "ISK"
  | "NOK"
  | "TRY"
  | "AUD"
  | "BRL"
  | "CAD"
  | "CNY"
  | "HKD"
  | "IDR"
  | "ILS"
  | "INR"
  | "KRW"
  | "MXN"
  | "MYR"
  | "NZD"
  | "PHP"
  | "SGD"
  | "THB"
  | "ZAR";

export const VAT_OPTIONS: Array<{ value: VatRate; label: string }> = [
  { value: "21", label: "21% VAT" },
  { value: "9", label: "9% VAT" },
  { value: "0", label: "0% VAT" },
  { value: "exempt", label: "Exempt" },
];

// ECB euro foreign exchange reference currencies, plus INR, BRL and ZAR.
export const CURRENCY_OPTIONS: Array<{ value: CurrencyCode; label: string }> = [
  { value: "EUR", label: "EUR - Euro" },
  { value: "USD", label: "USD - US dollar" },
  { value: "GBP", label: "GBP - Pound sterling" },
  { value: "CHF", label: "CHF - Swiss franc" },
  { value: "JPY", label: "JPY - Japanese yen" },
  { value: "AUD", label: "AUD - Australian dollar" },
  { value: "BGN", label: "BGN - Bulgarian lev" },
  { value: "BRL", label: "BRL - Brazilian real" },
  { value: "CAD", label: "CAD - Canadian dollar" },
  { value: "CNY", label: "CNY - Chinese yuan renminbi" },
  { value: "CZK", label: "CZK - Czech koruna" },
  { value: "DKK", label: "DKK - Danish krone" },
  { value: "HKD", label: "HKD - Hong Kong dollar" },
  { value: "HUF", label: "HUF - Hungarian forint" },
  { value: "IDR", label: "IDR - Indonesian rupiah" },
  { value: "ILS", label: "ILS - Israeli shekel" },
  { value: "INR", label: "INR - Indian rupee" },
  { value: "ISK", label: "ISK - Icelandic krona" },
  { value: "KRW", label: "KRW - South Korean won" },
  { value: "MXN", label: "MXN - Mexican peso" },
  { value: "MYR", label: "MYR - Malaysian ringgit" },
  { value: "NOK", label: "NOK - Norwegian krone" },
  { value: "NZD", label: "NZD - New Zealand dollar" },
  { value: "PHP", label: "PHP - Philippine peso" },
  { value: "PLN", label: "PLN - Polish zloty" },
  { value: "RON", label: "RON - Romanian leu" },
  { value: "SEK", label: "SEK - Swedish krona" },
  { value: "SGD", label: "SGD - Singapore dollar" },
  { value: "THB", label: "THB - Thai baht" },
  { value: "TRY", label: "TRY - Turkish lira" },
  { value: "ZAR", label: "ZAR - South African rand" },
];

export function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function vatLabel(rate: VatRate) {
  return rate === "exempt" ? "Vrijgesteld" : `${rate}%`;
}

export function vatFactor(rate: VatRate) {
  return rate === "exempt" ? 0 : Number(rate) / 100;
}

export function formatDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("nl-NL").format(new Date(`${value}T00:00:00`));
}

export function formatQuantity(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMoney(value: number, currency: CurrencyCode) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency,
  }).format(value);
}

function currencyDigits(currency: CurrencyCode) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency,
  }).resolvedOptions().maximumFractionDigits;
}

// A plain number with the currency's decimal places and no symbol or code.
export function formatAmount(value: number, currency: CurrencyCode) {
  const digits = currencyDigits(currency);
  return new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

// The PDF uses the base Helvetica font, which cannot render most currency
// symbols, so amounts are prefixed with the ISO code instead.
export function formatMoneyPdf(value: number, currency: CurrencyCode) {
  return `${currency} ${formatAmount(value, currency)}`;
}

export function wrapText(value: string, maxLength: number, maxLines = 4) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    if ((current + " " + word).trim().length > maxLength) {
      lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  });

  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

export function truncate(value: string, maxLength: number) {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 3)}...`
    : value;
}

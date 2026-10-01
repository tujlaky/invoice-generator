export type FormatSettings = {
  locale: string;
  currency: string;
  // Overrides the currency's default number of decimals (e.g. 0 for HUF).
  currencyDigits?: number;
};

export type Formatters = ReturnType<typeof createFormatters>;

export function createFormatters(settings: FormatSettings) {
  const { locale, currency } = settings;
  const digits = settings.currencyDigits ??
    new Intl.NumberFormat(locale, { style: "currency", currency })
      .resolvedOptions().maximumFractionDigits;
  const fraction = {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  };

  const moneyFormat = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    ...fraction,
  });
  const amountFormat = new Intl.NumberFormat(locale, fraction);
  const quantityFormat = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  });
  const dateFormat = new Intl.DateTimeFormat(locale);
  const timeFormat = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  });

  return {
    currency,
    // Symbol or code as the locale prefers, for on-screen use.
    money: (value: number) => moneyFormat.format(value),
    // Plain number with the currency's decimals and no symbol.
    amount: (value: number) => amountFormat.format(value),
    // The PDF uses base Helvetica, which lacks most currency symbols, so the
    // ISO code is used instead.
    moneyPdf: (value: number) => `${currency} ${amountFormat.format(value)}`,
    quantity: (value: number) => quantityFormat.format(value),
    date: (value: string) =>
      value ? dateFormat.format(new Date(`${value}T00:00:00`)) : "",
    time: (value: string) =>
      /^\d{2}:\d{2}/.test(value)
        ? timeFormat.format(new Date(`2000-01-01T${value.slice(0, 5)}:00`))
        : value,
    percent: (rate: number) =>
      `${
        new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(
          rate * 100,
        )
      }%`,
  };
}

export function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function toInputTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${
    String(date.getMinutes()).padStart(2, "0")
  }`;
}

export function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

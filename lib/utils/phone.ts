/**
 * Phone Number Normalization to E.164 Standard
 * Specifically optimized for Indian mobile numbers (+91) while supporting international numbers.
 */

export interface PhoneNormalizationResult {
  normalized: string;
  raw: string;
  isValid: boolean;
  countryCode: string;
}

export function normalizePhoneE164(
  phone: string | null | undefined,
  defaultCountryCode = "91"
): PhoneNormalizationResult {
  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return { normalized: "", raw: "", isValid: false, countryCode: defaultCountryCode };
  }

  const raw = phone.trim();
  // Strip spaces, dashes, parentheses, dots
  let digits = raw.replace(/[^\d+]/g, "");

  // Handle leading "+"
  if (digits.startsWith("+")) {
    digits = digits.substring(1);
  } else if (digits.startsWith("00")) {
    // 0091XXXXXXXXXX
    digits = digits.substring(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    // 09876543210 -> 9876543210
    digits = digits.substring(1);
  }

  // If 10 digits, prepend default country code (India: 91)
  if (digits.length === 10) {
    digits = `${defaultCountryCode}${digits}`;
  }

  // Standard validation: E.164 numbers are between 10 and 15 digits
  const isValid = digits.length >= 10 && digits.length <= 15;
  const normalized = isValid ? `+${digits}` : raw;

  return {
    normalized,
    raw,
    isValid,
    countryCode: digits.startsWith(defaultCountryCode) ? defaultCountryCode : digits.substring(0, 3),
  };
}

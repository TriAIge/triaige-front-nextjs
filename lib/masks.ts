/** Digits only, optionally capped. */
export function digitsOnly(value: string, max?: number) {
  const digits = value.replace(/\D/g, "");
  return max === undefined ? digits : digits.slice(0, max);
}

/** Progressive CNPJ mask: 00.000.000/0000-00 */
export function maskCnpj(value: string) {
  const digits = digitsOnly(value, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/**
 * Progressive Brazilian phone mask:
 * (00) 0000-0000  (10 digits) or (00) 00000-0000 (11 digits).
 */
export function maskPhone(value: string) {
  const digits = digitsOnly(value, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

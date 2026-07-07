export function normalizeNigerianPhoneNumber(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) return `234${digits.slice(1)}`;
  return digits;
}

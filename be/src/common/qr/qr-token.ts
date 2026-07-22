import { createHash, randomBytes } from 'crypto';
import { QrPurpose } from '@prisma/client';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function normalizeQrToken(rawToken: string) {
  return rawToken.trim();
}

export function createQrTokenFingerprint(rawToken: string) {
  return createHash('sha256')
    .update(normalizeQrToken(rawToken), 'utf8')
    .digest('hex');
}

export function createSecureQrLoginToken() {
  return randomBytes(32).toString('base64url');
}

function toBase32(buffer: Buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function buildQrLoginUrl(frontendPublicUrl: string, rawToken: string) {
  const baseUrl = frontendPublicUrl.trim();
  if (!baseUrl) {
    throw new Error('FRONTEND_PUBLIC_URL is required to build QR login URLs');
  }

  const url = new URL('/qr-login', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  url.searchParams.set('token', normalizeQrToken(rawToken));
  return url.toString();
}

export function buildTeamLoginQrToken(teamNumber: string) {
  return `MV26-TEAM-${teamNumber}-LOGIN`;
}

export function createSecureStationQrToken(purpose: QrPurpose) {
  const purposeCode = purpose === QrPurpose.CHECK_IN ? 'I' : 'O';
  const randomToken = toBase32(randomBytes(16));
  return `MV26-SQ1-${purposeCode}-${randomToken}`;
}

export function isOfficialStationQrToken(rawToken: string) {
  return /^MV26-SQ1-[IO]-[A-Z2-7]{26}$/.test(normalizeQrToken(rawToken));
}

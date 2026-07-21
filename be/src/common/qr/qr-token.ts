import { createHash, randomBytes } from 'crypto';
import { QrPurpose } from '@prisma/client';

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

export function buildTeamLoginQrToken(teamNumber: string) {
  return `MV26-TEAM-${teamNumber}-LOGIN`;
}

export function buildStationQrToken(stationId: string, purpose: QrPurpose) {
  return `MV26-STATION-${stationId}-${purpose}`;
}

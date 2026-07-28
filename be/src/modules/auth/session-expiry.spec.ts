import {
  getNextSessionExpiry,
  SESSION_TIME_ZONE,
  toJwtExpirySeconds,
} from './session-expiry';

describe('session expiry', () => {
  it('uses the confirmed Asia/Ho_Chi_Minh timezone', () => {
    expect(SESSION_TIME_ZONE).toBe('Asia/Ho_Chi_Minh');
  });

  it('expires a session created before 22:00 at 22:00 the same local day', () => {
    const expiresAt = getNextSessionExpiry(
      new Date('2026-07-28T14:59:59.999Z'),
    );

    expect(expiresAt.toISOString()).toBe('2026-07-28T15:00:00.000Z');
  });

  it('expires a session created exactly at 22:00 at 22:00 the next local day', () => {
    const expiresAt = getNextSessionExpiry(
      new Date('2026-07-28T15:00:00.000Z'),
    );

    expect(expiresAt.toISOString()).toBe('2026-07-29T15:00:00.000Z');
  });

  it('expires a session created after 22:00 at 22:00 the next local day', () => {
    const expiresAt = getNextSessionExpiry(
      new Date('2026-07-28T16:30:00.000Z'),
    );

    expect(expiresAt.toISOString()).toBe('2026-07-29T15:00:00.000Z');
    expect(toJwtExpirySeconds(expiresAt)).toBe(1785337200);
  });
});

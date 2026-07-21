import {
  buildQrLoginUrl,
  createQrTokenFingerprint,
  createSecureQrLoginToken,
} from './qr-token';

describe('QR login token helpers', () => {
  it('builds a QR login URL without duplicating slashes', () => {
    expect(buildQrLoginUrl('https://heroes.nalth.top', 'raw-token')).toBe(
      'https://heroes.nalth.top/qr-login?token=raw-token',
    );
    expect(buildQrLoginUrl('https://heroes.nalth.top/', 'raw-token')).toBe(
      'https://heroes.nalth.top/qr-login?token=raw-token',
    );
  });

  it('builds local and LAN QR login URLs', () => {
    expect(buildQrLoginUrl('http://localhost:4173', 'raw-token')).toBe(
      'http://localhost:4173/qr-login?token=raw-token',
    );
    expect(buildQrLoginUrl('http://192.168.1.100:4173', 'raw-token')).toBe(
      'http://192.168.1.100:4173/qr-login?token=raw-token',
    );
  });

  it('generates URL-safe random tokens and stable hashes', () => {
    const tokenA = createSecureQrLoginToken();
    const tokenB = createSecureQrLoginToken();

    expect(tokenA).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(tokenB).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(tokenA).not.toBe(tokenB);
    expect(createQrTokenFingerprint(tokenA)).toHaveLength(64);
    expect(createQrTokenFingerprint(` ${tokenA} `)).toBe(
      createQrTokenFingerprint(tokenA),
    );
  });
});

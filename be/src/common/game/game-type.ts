export const GAME_TYPES = ['ST', 'STANDARD'] as const;

export type GameType = (typeof GAME_TYPES)[number];

export function isSupportedYoutubeUrl(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    return (
      url.protocol === 'https:' &&
      (hostname === 'youtube.com' ||
        hostname === 'm.youtube.com' ||
        hostname === 'youtu.be')
    );
  } catch {
    return false;
  }
}

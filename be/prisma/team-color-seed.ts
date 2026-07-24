export const SEED_TEAM_COUNT = 25;

export const TEAM_COLOR_PALETTE = [
  '#1677FF',
  '#722ED1',
  '#13C2C2',
  '#389E0D',
  '#C41D7F',
  '#CF1322',
  '#D46B08',
  '#D4B106',
  '#D4380D',
  '#1D39C4',
  '#D48806',
  '#7CB305',
  '#0958D9',
  '#531DAB',
  '#08979C',
  '#237804',
  '#9E1068',
  '#A8071A',
  '#AD4E00',
  '#AD8B00',
  '#AD2102',
  '#10239E',
  '#AD6800',
  '#5B8C00',
  '#003A8C',
] as const;

type TeamSeedUpdateInput = Readonly<{
  isProduction: boolean;
  name: string;
  captainName: string;
  passwordHash: string;
  color: string;
  totalMaxPoints: number;
}>;

export function validateTeamColorPalette(
  palette: readonly string[],
  requiredCount = SEED_TEAM_COUNT,
) {
  if (palette.length < requiredCount) {
    throw new Error('TEAM_COLOR_PALETTE_TOO_SHORT');
  }

  const colors = palette.slice(0, requiredCount);
  for (const color of colors) {
    if (!/^#[0-9A-F]{6}$/.test(color)) {
      throw new Error(`TEAM_COLOR_PALETTE_INVALID_COLOR:${color}`);
    }
  }

  if (new Set(colors).size !== colors.length) {
    throw new Error('TEAM_COLOR_PALETTE_DUPLICATE_COLOR');
  }
}

export function getSeedTeamColor(index: number) {
  validateTeamColorPalette(TEAM_COLOR_PALETTE);
  if (!Number.isInteger(index) || index < 0 || index >= SEED_TEAM_COUNT) {
    throw new Error('TEAM_COLOR_INDEX_OUT_OF_RANGE');
  }
  return TEAM_COLOR_PALETTE[index];
}

export function isSeedManagedTeamUsername(username: string) {
  return /^team(?:0[1-9]|1[0-9]|2[0-5])$/.test(username);
}

export function planTeamSeedOperation(params: {
  isProduction: boolean;
  username: string;
  exists: boolean;
}) {
  if (!params.isProduction) {
    return 'upsert' as const;
  }
  if (!isSeedManagedTeamUsername(params.username) || !params.exists) {
    return 'skip' as const;
  }
  return 'update-color' as const;
}

export function buildTeamSeedUpdateData({
  isProduction,
  name,
  captainName,
  passwordHash,
  color,
  totalMaxPoints,
}: TeamSeedUpdateInput) {
  if (isProduction) {
    return {color};
  }

  return {
    name,
    captainName,
    passwordHash,
    color,
    maxPossiblePoints: totalMaxPoints,
  };
}

export function buildSeedTeams() {
  validateTeamColorPalette(TEAM_COLOR_PALETTE);
  return Array.from({length: SEED_TEAM_COUNT}, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    return {
      name: `Team ${number}`,
      username: `team${number}`,
      captainName: `Captain ${number}`,
      password: `team${number}`,
      color: getSeedTeamColor(index),
    };
  });
}

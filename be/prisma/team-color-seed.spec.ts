import {
  buildSeedTeams,
  buildTeamSeedUpdateData,
  getSeedTeamColor,
  isSeedManagedTeamUsername,
  planTeamSeedOperation,
  SEED_TEAM_COUNT,
  TEAM_COLOR_PALETTE,
  validateTeamColorPalette,
} from './team-color-seed';

describe('team color seed policy', () => {
  it('defines 25 unique uppercase HEX colors', () => {
    expect(TEAM_COLOR_PALETTE).toHaveLength(SEED_TEAM_COUNT);
    expect(() => validateTeamColorPalette(TEAM_COLOR_PALETTE)).not.toThrow();
    expect(new Set(TEAM_COLOR_PALETTE).size).toBe(SEED_TEAM_COUNT);
    expect(TEAM_COLOR_PALETTE.every((color) => /^#[0-9A-F]{6}$/.test(color))).toBe(true);
  });

  it('maps Team 01-25 to 25 stable unique colors', () => {
    const teams = buildSeedTeams();
    expect(teams).toHaveLength(SEED_TEAM_COUNT);
    expect(teams[0]).toMatchObject({username: 'team01', color: TEAM_COLOR_PALETTE[0]});
    expect(teams[24]).toMatchObject({username: 'team25', color: TEAM_COLOR_PALETTE[24]});
    expect(new Set(teams.map((team) => team.color)).size).toBe(SEED_TEAM_COUNT);
    expect(getSeedTeamColor(9)).toBe(TEAM_COLOR_PALETTE[9]);
  });

  it('rejects invalid palette definitions', () => {
    expect(() => validateTeamColorPalette(['#1677FF'])).toThrow('TEAM_COLOR_PALETTE_TOO_SHORT');
    expect(() => validateTeamColorPalette([...TEAM_COLOR_PALETTE.slice(0, 24), '#abcdef'])).toThrow('TEAM_COLOR_PALETTE_INVALID_COLOR:#abcdef');
    expect(() => validateTeamColorPalette([...TEAM_COLOR_PALETTE.slice(0, 24), TEAM_COLOR_PALETTE[0]])).toThrow('TEAM_COLOR_PALETTE_DUPLICATE_COLOR');
    expect(() => getSeedTeamColor(25)).toThrow('TEAM_COLOR_INDEX_OUT_OF_RANGE');
  });

  it('matches only seed-managed Team usernames', () => {
    expect(isSeedManagedTeamUsername('team01')).toBe(true);
    expect(isSeedManagedTeamUsername('team25')).toBe(true);
    expect(isSeedManagedTeamUsername('team00')).toBe(false);
    expect(isSeedManagedTeamUsername('team26')).toBe(false);
    expect(isSeedManagedTeamUsername('Team01')).toBe(false);
    expect(isSeedManagedTeamUsername('team1')).toBe(false);
    expect(isSeedManagedTeamUsername('admin')).toBe(false);
  });

  it('plans Production color repair only for existing seed-managed Teams', () => {
    expect(planTeamSeedOperation({isProduction: true, username: 'team01', exists: true})).toBe('update-color');
    expect(planTeamSeedOperation({isProduction: true, username: 'team01', exists: false})).toBe('skip');
    expect(planTeamSeedOperation({isProduction: true, username: 'team26', exists: true})).toBe('skip');
    expect(planTeamSeedOperation({isProduction: false, username: 'team01', exists: false})).toBe('upsert');
  });

  it('returns only color update data in Production', () => {
    expect(buildTeamSeedUpdateData({
      isProduction: true,
      name: 'Team 01',
      captainName: 'Captain 01',
      passwordHash: 'hash',
      color: '#1677FF',
      totalMaxPoints: 1000,
    })).toEqual({color: '#1677FF'});
  });

  it('returns fixture update data outside Production', () => {
    expect(buildTeamSeedUpdateData({
      isProduction: false,
      name: 'Team 01',
      captainName: 'Captain 01',
      passwordHash: 'hash',
      color: '#1677FF',
      totalMaxPoints: 1000,
    })).toEqual({
      name: 'Team 01',
      captainName: 'Captain 01',
      passwordHash: 'hash',
      color: '#1677FF',
      maxPossiblePoints: 1000,
    });
  });
});

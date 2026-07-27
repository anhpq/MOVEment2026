import {
  RESET_GAMEPLAY_BACKUP_VALUE,
  RESET_GAMEPLAY_CONFIRM_VALUE,
  assertResetGuards,
  executeResetGameplayWithGuards,
  parseResetMode,
  type ResetTarget,
} from './reset-gameplay-seed';

const localTarget: ResetTarget = {
  nodeEnv: 'development',
  appEnv: '',
  host: '127.0.0.1',
  database: 'movement',
  productionLike: false,
};

const productionTarget: ResetTarget = {
  nodeEnv: 'production',
  appEnv: '',
  host: 'db.example',
  database: 'movement_prod',
  productionLike: true,
};

describe('reset-gameplay-seed guards', () => {
  it('defaults to dry-run unless execute is explicit', () => {
    expect(parseResetMode([])).toBe('dry-run');
    expect(parseResetMode(['--dry-run'])).toBe('dry-run');
    expect(parseResetMode(['--execute'])).toBe('execute');
  });

  it('allows dry-run without mutation guards', () => {
    expect(() => assertResetGuards('dry-run', productionTarget, {})).not.toThrow();
  });

  it('requires the reset confirmation for every execute run', () => {
    expect(() => assertResetGuards('execute', localTarget, {})).toThrow(
      `Execute mode requires RESET_GAMEPLAY_CONFIRM="${RESET_GAMEPLAY_CONFIRM_VALUE}"`,
    );
  });

  it('requires backup acknowledgement for production-like execute runs', () => {
    expect(() =>
      assertResetGuards('execute', productionTarget, {
        confirm: RESET_GAMEPLAY_CONFIRM_VALUE,
      }),
    ).toThrow(
      `Production-like execute mode requires RESET_GAMEPLAY_BACKUP_CONFIRMED="${RESET_GAMEPLAY_BACKUP_VALUE}"`,
    );
  });

  it('accepts all required guards for production-like execute runs', () => {
    expect(() =>
      assertResetGuards('execute', productionTarget, {
        confirm: RESET_GAMEPLAY_CONFIRM_VALUE,
        backupConfirmed: RESET_GAMEPLAY_BACKUP_VALUE,
      }),
    ).not.toThrow();
  });

  it('enforces guards before entering the destructive transaction path', async () => {
    const fakeDb = {
      $transaction: jest.fn(),
    };

    await expect(
      executeResetGameplayWithGuards(fakeDb as never, {
        mode: 'execute',
        target: localTarget,
        guards: {},
      }),
    ).rejects.toThrow(
      `Execute mode requires RESET_GAMEPLAY_CONFIRM="${RESET_GAMEPLAY_CONFIRM_VALUE}"`,
    );

    expect(fakeDb.$transaction).not.toHaveBeenCalled();
  });
});

import {describe, expect, it} from 'vitest';
import {
  getStationReferencePointsDisplay,
  getStationScoreEntryMax,
  isStationReferenceExceeded,
} from './utils';

describe('Station reference point presentation', () => {
  it('uses the shared exact ??? display for ST007 marker/list/detail surfaces', () => {
    expect(getStationReferencePointsDisplay({maxPoints: null})).toBe('???');
  });

  it('keeps the global entry cap separate from a lower reference', () => {
    expect(getStationScoreEntryMax({scoreEntryMax: 105})).toBe(105);
    expect(isStationReferenceExceeded({maxPoints: 30}, 31)).toBe(true);
    expect(isStationReferenceExceeded({maxPoints: null}, 105)).toBe(false);
  });
});

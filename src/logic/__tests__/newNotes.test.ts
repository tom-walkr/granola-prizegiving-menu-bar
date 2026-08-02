import { describe, expect, it } from 'vitest';
import { diffNewNoteIds } from '../newNotes';

describe('diffNewNoteIds', () => {
  it('seeds the baseline on an empty seen set without treating current ids as new', () => {
    const result = diffNewNoteIds([], ['a', 'b']);
    expect(result.isBaseline).toBe(true);
    expect(result.newIds).toEqual([]);
    expect(result.nextSeenIds).toEqual(['a', 'b']);
  });

  it('returns only ids not already seen', () => {
    const result = diffNewNoteIds(['a', 'b'], ['b', 'c', 'd']);
    expect(result.isBaseline).toBe(false);
    expect(result.newIds).toEqual(['c', 'd']);
    expect(result.nextSeenIds.sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('returns no new ids when the list is unchanged', () => {
    const result = diffNewNoteIds(['a'], ['a']);
    expect(result.isBaseline).toBe(false);
    expect(result.newIds).toEqual([]);
    expect(result.nextSeenIds).toEqual(['a']);
  });
});

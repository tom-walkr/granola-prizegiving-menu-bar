/**
 * Diff current note ids against a persisted "seen" set so we can notify only
 * for meetings that appeared after the app's baseline was established.
 */

export interface SeenNotesDiff {
  /** True when the persisted set was empty — seed without notifying. */
  isBaseline: boolean;
  /** Ids present in `currentIds` but not in `seenIds` (empty when baseline). */
  newIds: string[];
  /** Full set to persist after this poll (union of seen + current). */
  nextSeenIds: string[];
}

/**
 * Compare list ids to the persisted seen set.
 * First successful poll (empty seen) seeds the baseline with no "new" ids.
 */
export function diffNewNoteIds(seenIds: Iterable<string>, currentIds: Iterable<string>): SeenNotesDiff {
  const seen = new Set(seenIds);
  const current = [...new Set(currentIds)];
  const nextSeenIds = [...new Set([...seen, ...current])];

  if (seen.size === 0) {
    return { isBaseline: true, newIds: [], nextSeenIds: current };
  }

  const newIds = current.filter((id) => !seen.has(id));
  return { isBaseline: false, newIds, nextSeenIds };
}

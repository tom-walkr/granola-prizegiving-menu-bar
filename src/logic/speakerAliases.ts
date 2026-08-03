import type { SpeakerProfile, SpeakerStats } from './speakerStats';

function applyAlias(profile: SpeakerProfile, aliases: Record<string, string>): SpeakerProfile {
  const alias = aliases[profile.key]?.trim();
  if (!alias) return profile;
  return { ...profile, displayName: alias };
}

/** Overlay per-meeting display-name overrides onto computed speaker stats. */
export function applySpeakerAliases(
  stats: SpeakerStats,
  aliases: Record<string, string>
): SpeakerStats {
  if (Object.keys(aliases).length === 0) return stats;

  if (stats.mode === 'full') {
    return {
      mode: 'full',
      speakers: stats.speakers.map((speaker) => applyAlias(speaker, aliases)),
    };
  }

  return {
    mode: 'two-way',
    you: applyAlias(stats.you, aliases),
    restOfCall: applyAlias(stats.restOfCall, aliases),
  };
}

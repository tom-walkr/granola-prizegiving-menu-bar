<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import type { NoteListItem } from '../api/types';
import {
  formatAttendeeLine,
  formatMeetingTime,
  groupNotesByDate,
  initialsFromTitle,
} from '../logic/meetingDisplay';
import type { PrizegivingCapability } from '../logic/prizegivingCapability';
import MeetingDateHeader from './MeetingDateHeader.vue';
import MeetingEntry from './MeetingEntry.vue';

const COLLAPSE_DELAY_MS = 160;

type HeaderRow = { kind: 'header'; key: string; label: string };
type NoteRow = { kind: 'note'; key: string; note: NoteListItem; stagger: number };
type ListRow = HeaderRow | NoteRow;

const props = withDefaults(
  defineProps<{
    notes: NoteListItem[];
    selectedId?: string | null;
    /** Group under date headers (browse). Flat chronological list when false (recent). */
    grouped?: boolean;
    /**
     * After selection, tuck non-selected rows into a hover-to-expand stack.
     * Off by default — the popover uses a recent / browse split instead.
     */
    collapsible?: boolean;
    /** Per-note prizegiving capability once transcripts have been probed. */
    prizegivingById?: Record<string, PrizegivingCapability>;
  }>(),
  {
    selectedId: null,
    grouped: true,
    collapsible: false,
    prizegivingById: () => ({}),
  }
);

defineEmits<{ select: [noteId: string] }>();

const root = ref<HTMLElement | null>(null);
const pointerInside = ref(false);
const focusInside = ref(false);
let collapseTimer: ReturnType<typeof setTimeout> | undefined;

const flatNotes = computed(() => {
  if (!props.grouped) return props.notes;
  return groupNotesByDate(props.notes).flatMap((g) => g.notes);
});

const selectedInList = computed(() =>
  Boolean(props.selectedId && flatNotes.value.some((note) => note.id === props.selectedId))
);

const canCollapse = computed(
  () =>
    props.collapsible &&
    selectedInList.value &&
    flatNotes.value.length > 1
);

/** Stay open while the pointer or focus is in the list — including right after a click. */
const collapsed = computed(
  () => canCollapse.value && !pointerInside.value && !focusInside.value
);

const hiddenCount = computed(() =>
  Math.max(0, flatNotes.value.length - (props.selectedId ? 1 : 0))
);

const peekCount = computed(() => Math.min(2, hiddenCount.value));

const rows = computed((): ListRow[] => {
  const selectedIndex = props.selectedId
    ? flatNotes.value.findIndex((n) => n.id === props.selectedId)
    : -1;

  const out: ListRow[] = [];
  let noteIndex = 0;

  if (!props.grouped) {
    for (const note of props.notes) {
      const stagger =
        selectedIndex >= 0 ? Math.abs(noteIndex - selectedIndex) : noteIndex;
      out.push({ kind: 'note', key: note.id, note, stagger });
      noteIndex += 1;
    }
    return out;
  }

  for (const group of groupNotesByDate(props.notes)) {
    out.push({ kind: 'header', key: `h-${group.key}`, label: group.label });

    for (const note of group.notes) {
      const stagger =
        selectedIndex >= 0 ? Math.abs(noteIndex - selectedIndex) : noteIndex;
      out.push({ kind: 'note', key: note.id, note, stagger });
      noteIndex += 1;
    }
  }

  return out;
});

function clearCollapseTimer(): void {
  if (collapseTimer !== undefined) {
    clearTimeout(collapseTimer);
    collapseTimer = undefined;
  }
}

function onPointerEnter(): void {
  clearCollapseTimer();
  pointerInside.value = true;
}

function onPointerLeave(): void {
  clearCollapseTimer();
  collapseTimer = setTimeout(() => {
    pointerInside.value = false;
    collapseTimer = undefined;
  }, COLLAPSE_DELAY_MS);
}

function onFocusIn(): void {
  focusInside.value = true;
}

function onFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null;
  if (next && root.value?.contains(next)) return;
  focusInside.value = false;
}

function isTucked(row: ListRow): boolean {
  if (!collapsed.value || !selectedInList.value) return false;
  if (row.kind === 'header') return true;
  return row.note.id !== props.selectedId;
}

onUnmounted(() => clearCollapseTimer());
</script>

<template>
  <div
    ref="root"
    class="meeting-list"
    :class="{ 'is-collapsed': collapsed }"
    :aria-expanded="canCollapse ? !collapsed : undefined"
    @mouseenter="onPointerEnter"
    @mouseleave="onPointerLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <ul class="meeting-list__rows">
      <li
        v-for="row in rows"
        :key="row.key"
        class="meeting-list__slot"
        :class="{
          'is-header': row.kind === 'header',
          'is-note': row.kind === 'note',
          'is-active': row.kind === 'note' && row.note.id === selectedId,
          'is-tucked': isTucked(row),
        }"
        :style="row.kind === 'note' ? { '--stagger': row.stagger } : undefined"
        :inert="isTucked(row)"
      >
        <div class="meeting-list__slot-inner">
          <MeetingDateHeader v-if="row.kind === 'header'" :label="row.label" />

          <div v-else class="meeting-list__note">
            <div
              v-if="collapsed && row.note.id === selectedId && peekCount > 0"
              class="meeting-list__peeks"
              aria-hidden="true"
            >
              <span
                v-for="i in peekCount"
                :key="i"
                class="meeting-list__peek"
                :style="{ '--peek': peekCount - i + 1 }"
              />
            </div>

            <MeetingEntry
              :title="row.note.title"
              :subtitle="formatAttendeeLine(row.note.attendees)"
              :time="formatMeetingTime(row.note.created_at)"
              :initials="initialsFromTitle(row.note.title)"
              :selected="row.note.id === selectedId"
              :shared="(row.note.attendees?.length ?? 0) > 1"
              :prizegiving="prizegivingById[row.note.id] ?? null"
              @select="$emit('select', row.note.id)"
            />
          </div>
        </div>
      </li>
    </ul>

    <p v-if="collapsed" class="meeting-list__hint" aria-hidden="true">
      <span class="meeting-list__hint-count">{{ hiddenCount }} more</span>
      <span class="meeting-list__hint-action">Hover to switch</span>
    </p>
  </div>
</template>

<style scoped>
.meeting-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.meeting-list__rows {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

/*
 * Each slot is a 0fr/1fr grid row so tucked meetings animate height away
 * instead of display:none — keeps the selected card as a stable stack face.
 */
.meeting-list__slot {
  display: grid;
  grid-template-rows: 1fr;
  opacity: 1;
  transform: translateY(0) scale(1);
  transform-origin: center top;
  transition:
    grid-template-rows var(--duration-slow) var(--ease-out-expo),
    opacity var(--duration-moderate) var(--ease-out),
    transform var(--duration-slow) var(--ease-out-expo);
  transition-delay: calc(var(--stagger, 0) * 22ms);
}

.meeting-list__slot-inner {
  overflow: hidden;
  min-height: 0;
}

.meeting-list__slot.is-tucked {
  grid-template-rows: 0fr;
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
  pointer-events: none;
  /* Collapse farther cards slightly sooner so the stack gathers inward. */
  transition-delay: calc(var(--stagger, 0) * 16ms);
}

.meeting-list__slot.is-header.is-tucked {
  transition-delay: 0ms;
}

.meeting-list__note {
  position: relative;
  z-index: 0;
}

.meeting-list__slot.is-active {
  position: relative;
  z-index: 1;
}

.meeting-list__peeks {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.meeting-list__peek {
  position: absolute;
  left: var(--space-md);
  right: var(--space-md);
  top: 0;
  bottom: 0;
  border-radius: var(--radius-xl);
  background: var(--oats-fill-soft-opaque);
  opacity: calc(0.5 - (var(--peek) - 1) * 0.16);
  transform: translateY(calc(var(--peek) * 5px)) scale(calc(1 - var(--peek) * 0.028));
  transform-origin: center top;
  transition:
    opacity var(--duration-moderate) var(--ease-out),
    transform var(--duration-slow) var(--ease-out-expo);
}

.meeting-list__note :deep(.meeting-entry) {
  position: relative;
  z-index: 1;
}

.meeting-list__hint {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-md);
  margin: 0;
  padding: var(--space-xxs) var(--space-md) 0;
  font-size: var(--text-xs-size);
  line-height: var(--text-xs-leading);
  letter-spacing: var(--text-xs-tracking);
  color: var(--color-ink-quiet);
  animation: meeting-hint-in var(--duration-moderate) var(--ease-out) both;
  animation-delay: 60ms;
}

.meeting-list__hint-count {
  font-weight: var(--font-weight-medium);
  color: var(--color-ink-muted);
}

@keyframes meeting-hint-in {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .meeting-list__slot,
  .meeting-list__peek {
    transition: none;
  }

  .meeting-list__hint {
    animation: none;
  }
}
</style>

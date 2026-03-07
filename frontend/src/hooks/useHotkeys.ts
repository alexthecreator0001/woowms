import { useEffect, useRef, useCallback } from 'react';

interface HotkeyDef {
  key: string;        // e.g. '?', 'd', 'k'
  shift?: boolean;
  meta?: boolean;     // Cmd/Ctrl
  chord?: string;     // If set, this is a "G then X" chord — chord = 'g', key = 'x'
  handler: () => void;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function useHotkeys(hotkeys: HotkeyDef[]) {
  const chordRef = useRef<string | null>(null);
  const chordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearChord = useCallback(() => {
    chordRef.current = null;
    if (chordTimerRef.current) {
      clearTimeout(chordTimerRef.current);
      chordTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isInputFocused()) return;

      const key = e.key.toLowerCase();

      // Check for chord completions first
      if (chordRef.current) {
        const chord = chordRef.current;
        clearChord();

        for (const hk of hotkeys) {
          if (hk.chord === chord && hk.key === key) {
            e.preventDefault();
            hk.handler();
            return;
          }
        }
        // Chord didn't match — fall through to check normal keys
      }

      // Check for chord starters (e.g. pressing 'g')
      const hasChords = hotkeys.some((hk) => hk.chord === key);
      if (hasChords && !e.metaKey && !e.ctrlKey && !e.altKey) {
        chordRef.current = key;
        chordTimerRef.current = setTimeout(clearChord, 1000);
        return;
      }

      // Check for regular hotkeys
      for (const hk of hotkeys) {
        if (hk.chord) continue; // skip chord-based

        const shiftMatch = hk.shift ? e.shiftKey : !e.shiftKey;
        const metaMatch = hk.meta ? (e.metaKey || e.ctrlKey) : (!e.metaKey && !e.ctrlKey);

        if (hk.key === key && shiftMatch && metaMatch && !e.altKey) {
          e.preventDefault();
          hk.handler();
          return;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearChord();
    };
  }, [hotkeys, clearChord]);
}

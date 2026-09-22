import { useState, useMemo, useCallback } from "react";
import { journalStore, todayKey } from "../lib/storage";
import { writeJournalEntry } from "../lib/clickup";

export function useJournal() {
  const today = todayKey();
  const todayEntry = journalStore.get(today);

  const [text, setText] = useState(todayEntry?.text ?? "");
  const [mood, setMood] = useState(todayEntry?.mood ?? null);
  const [savedTime, setSavedTime] = useState(todayEntry?.saved ?? null);

  const words = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean).length,
    [text]
  );

  const save = useCallback(() => {
    const now = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    journalStore.set(today, { text, mood, words, saved: now });
    setSavedTime(now);
    const dateLabel = new Date().toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    writeJournalEntry(dateLabel, { text, mood });
  }, [today, text, mood, words]);

  const stats = useMemo(() => journalStore.stats(), [savedTime]);

  const allDates = useMemo(() => journalStore.listDates(), [savedTime]);

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return { text, setText, mood, setMood, words, savedTime, save, stats, allDates, todayDate };
}

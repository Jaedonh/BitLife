import { personRef } from '@/engine/events/text';
import type { GameState, LogKind, Person } from '@/engine/types';

/**
 * Which of a year's journal lines is worth a toast: milestones first. A card's own line ("text → choice")
 * is what the player just read, so it is never the headline; what the choice led to can be.
 */
const HIGHLIGHT_RANK: Partial<Record<LogKind, number>> = { milestone: 4, bad: 2, good: 2, money: 1 };

/** A card that sent me to prison this year (or back, after a release this year): what it did is the year's news. */
const JAILED_RANK = 5;
/** The death of a parent, a spouse, a partner or a child outranks everything else the year brought. */
const CLOSE_DEATH_RANK = 6;

/** Whose death is always the year's headline. */
const CLOSE_FAMILY: readonly Person['kind'][] = ['mother', 'father', 'stepmother', 'stepfather', 'spouse', 'lover', 'child'];

/** How a death reads in the journal: the engine's own line ("Mom died of a stroke at 71.") or a card's. */
const DEATH_WORDS = /\b(died|passed away|drowned|perished|was killed)\b/;

/** A letter or a digit, accented ones included ("é" in "Zoé", where a regex `\b` would see a gap). */
const isWordChar = (ch: string | undefined): boolean => !!ch && (ch.toLowerCase() !== ch.toUpperCase() || (ch >= '0' && ch <= '9'));

/** Whether the line names one of them as a whole word ("Mom died", "Mom's heart", "Zoé died"; not "Momo"). */
function names(text: string, who: readonly string[]): boolean {
  return who.some((n) => {
    if (!n) return false;
    for (let i = text.indexOf(n); i >= 0; i = text.indexOf(n, i + 1)) {
      if (!isWordChar(text[i - 1]) && !isWordChar(text[i + n.length])) return true;
    }
    return false;
  });
}

/**
 * The close family who died this year (alive at the last birthday, dead now), as the journal names them: "Mom",
 * "Aunt Rosa", and the first name ("My girlfriend Hollie Allen died...").
 */
function closeLosses(before: GameState, after: GameState): string[] {
  const lost = new Set<string>();
  for (const p of Object.values(after.people)) {
    const was = before.people[p.id];
    if (p.alive || !was?.alive || !(CLOSE_FAMILY.includes(p.kind) || CLOSE_FAMILY.includes(was.kind))) continue;
    lost.add(personRef(p, after.people)).add(p.firstName);
  }
  return [...lost];
}

/**
 * The year's most notable new line, skipping any line that also happened last year (a debt reminder or a
 * recurring chore would otherwise be the headline every single year). A milestone is news every time, though:
 * a parole granted two years running is still this year's release. Once the year's cards are closed it covers
 * their outcomes too, so the recap never contradicts them ("Another year behind bars" in the year parole was
 * granted). Lines from `cardsFrom` on were written by the year's cards: they are its latest news, so they win a
 * tie with what the year wrote before them ("1 year to go" from a card that then added a year to the sentence).
 *
 * Two kinds of news outrank everything else: the death of a parent, a spouse, a partner or a child (never "I
 * started middle school." in the year Mom died), and a card that sent me to prison, or back to prison after a
 * release earlier that year (never "I walked out of prison" under "In prison · 2 years left").
 */
export function yearHighlight(before: GameState, after: GameState, cardsFrom = after.log.length): string | null {
  const lastYear = new Set(before.log.filter((l) => l.kind !== 'year' && l.age === before.character.age).map((l) => l.text));
  const lost = closeLosses(before, after);
  // Locked up by one of this year's cards: outside at the last birthday, or released at this one.
  const jailedByCard = after.crime.inPrison && cardsFrom < after.log.length && (!before.crime.inPrison || after.crime.lastRelease?.age === after.character.age);
  let best: { text: string; rank: number; card: boolean } | null = null;
  for (let i = before.log.length; i < after.log.length; i++) {
    const l = after.log[i]!;
    const card = i >= cardsFrom;
    let rank = HIGHLIGHT_RANK[l.kind] ?? 0;
    if (lost.length && l.kind !== 'event' && l.kind !== 'year' && DEATH_WORDS.test(l.text) && names(l.text, lost)) rank = CLOSE_DEATH_RANK;
    // The latest bad news from the cards: the sentence, or what the court made of it.
    else if (jailedByCard && card && l.kind === 'bad') rank = JAILED_RANK;
    if (!rank || (l.kind !== 'milestone' && rank < CLOSE_DEATH_RANK && lastYear.has(l.text))) continue;
    const better = !best || rank > best.rank || (rank === best.rank && ((card && !best.card) || rank === JAILED_RANK));
    if (better) best = { text: l.text, rank, card };
  }
  return best?.text ?? null;
}

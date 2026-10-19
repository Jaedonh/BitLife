/**
 * Guards that keep cards from different files out of each other's way, checked over the whole catalog rather than
 * one file's share: twin scenes wait for each other in both directions, no card brings a new partner in the grief
 * window, and a text message waits for its era.
 */
import { EVENTS } from '@/data/events';
import { evaluateCondition } from '../events/conditions';
import { EVENT_REGISTRY } from '../events/registry';
import type { Condition, Effect, EventDef } from '../events/schema';
import { isEligible, openNextEvent } from '../events/select';
import { createLife } from '../systems/character';
import { GRIEF_FLAG } from '../systems/romance';
import type { GameState, Job } from '../types';

const BY_ID: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
const byId = (id: string): EventDef => {
  const e = BY_ID[id];
  if (!e) throw new Error(`no event ${id}`);
  return e;
};

/** A card's wait for another: `{ not: { sinceEvent, lte } }` (lte years) or `{ eventNotFired }` (for life, lte undefined). */
interface Guard {
  other: string;
  lte?: number;
}

/** The top-level guards a card keeps against other cards. */
function guards(e: EventDef): Guard[] {
  const out: Guard[] = [];
  for (const c of e.conditions ?? []) {
    if ('not' in c && 'sinceEvent' in c.not && c.not.sinceEvent !== e.id) out.push({ other: c.not.sinceEvent, lte: c.not.lte });
    // { eventNotFired } and its long form { not: { eventFired } } both wait for life.
    if ('eventNotFired' in c && c.eventNotFired !== e.id) out.push({ other: c.eventNotFired });
    if ('not' in c && 'eventFired' in c.not && c.not.eventFired !== e.id) out.push({ other: c.not.eventFired });
  }
  return out;
}

const guardOf = (e: EventDef, other: string): Guard | undefined => guards(e).find((g) => g.other === other);

/**
 * Whether `twin` can open after `card` inside the guard's window, going by their age ranges. When it cannot (the twin
 * always comes earlier in life), the guard only ever has one order to stop and needs no partner.
 */
function canFollow(card: EventDef, twin: EventDef, g: Guard): boolean {
  return twin.maxAge >= card.minAge && (g.lte === undefined || twin.minAge <= card.maxAge + g.lte);
}

/**
 * Guards that are one-way on purpose: they order a sequence rather than keep two tellings of one scene apart, so the
 * other card going on after this one is the story working, not a repeat.
 */
const SEQUENCES: readonly { card: string; others: readonly string[]; why: string }[] = [
  {
    card: 'tl_first_phone',
    others: ['tm_screen_time_intervention', 'tm_lost_phone', 'tm_chain_message', 'tm_group_chat_drama', 'sl_hallway_fight', 'tl_grade_group_chat', 'tl_scam_dm', 'tl_app_permissions', 'tl_regretted_post', 'tl_mean_comments', 'tl_wrong_chat'],
    why: 'the first phone comes before any card that already puts a phone in my hand; those cards go on after it',
  },
  { card: 'tl_permit_test', others: ['tn_learning_to_drive'], why: 'the permit test comes before driving lessons with a parent, which can follow it' },
  { card: 'yp_invisible_roommate', others: ['ya_move_in_together'], why: 'the roommate I never see is gone once I move in with a partner; moving in can follow him' },
  { card: 'gp_holiday_dinner', others: ['gp_assisted_living'], why: 'a grandparent hosting at home comes before the move to assisted living' },
  { card: 'gp_somebody_has_to', others: ['gp_assisted_living'], why: 'a grandparent at home comes before the move to assisted living' },
  { card: 'gp_two_coats', others: ['gp_assisted_living'], why: 'a grandparent heating their own home comes before the move to assisted living' },
  { card: 'gp_who_gets_what', others: ['gp_assisted_living'], why: 'the sideboard at home comes before the move to assisted living' },
  {
    card: 'gc_family_moves_in',
    others: ['ll_grandchild_born', 'lf_grandparent_news', 'gc_child_expecting_again'],
    why: 'a grown child moving their family in does not land in the year of baby news; the news can follow the move',
  },
  { card: 'gc_child_expecting_again', others: ['ll_grandchild_born', 'lf_grandparent_news'], why: 'another baby is not announced in the year of the last one' },
];
const ONE_WAY = new Set(SEQUENCES.flatMap((s) => s.others.map((o) => `${s.card}>${o}`)));

describe('twin cards wait for each other in both directions', () => {
  const pairs = EVENTS.flatMap((card) => guards(card).map((g) => ({ card, g })));

  it('every guard names a card that exists', () => {
    expect(pairs.filter(({ g }) => !BY_ID[g.other]).map(({ card, g }) => `${card.id} -> ${g.other}`)).toEqual([]);
  });

  it('a card that waits for its twin is waited for in turn, by the same distance', () => {
    const problems: string[] = [];
    for (const { card, g } of pairs) {
      const twin = BY_ID[g.other];
      if (!twin || ONE_WAY.has(`${card.id}>${twin.id}`) || !canFollow(card, twin, g)) continue;
      const back = guardOf(twin, card.id);
      const span = (x: Guard) => (x.lte === undefined ? 'for life' : `${x.lte} years`);
      if (!back) problems.push(`${twin.id} does not wait for ${card.id} (${card.id} waits ${span(g)})`);
      else if (back.lte !== g.lte) problems.push(`${card.id} waits ${span(g)} for ${twin.id}, which waits ${span(back)} back`);
    }
    expect(problems).toEqual([]);
  });

  it('the one-way list holds only guards that exist and are still one-way', () => {
    for (const { card, others } of SEQUENCES) {
      for (const other of others) {
        expect([card, other, !!guardOf(byId(card), other)]).toEqual([card, other, true]);
        expect([other, card, guardOf(byId(other), card)]).toEqual([other, card, undefined]);
      }
    }
  });

  // The pairs the playtest fuzz saw in the unguarded order, pinned so that dropping both guards still fails.
  it.each([
    ['wk_office_party', 'hd_office_party', 3],
    ['nc_noisy_neighbour', 'ad_neighbour_noise', 3],
    ['nc_jury_duty', 'ad_jury_duty', 6],
    ['mn_friend_loan', 'lf_sibling_loan', 3],
    ['mn_distant_inheritance', 'ad_surprise_inheritance', 10],
    ['mn_distant_inheritance', 'pt_inherit_parrot', 3],
    ['kd_stray_cat', 'pt_stray_cat_rain', 6],
    ['fs_lost_dog', 'pt_stray_cat_rain', 3],
    ['yp_hallway_mural', 'gu_hallway_mural', 'life'],
    ['yp_cereal_aisle', 'gu_cereal_aisle', 6],
    ['yp_daycare_math', 'gu_daycare_bill', 4],
    ['yp_baby_night_shift', 'gu_baby_three_am', 3],
    ['ya_forgot_anniversary', 'lf_anniversary_slip', 2],
    ['ya_meet_the_parents', 'lf_meet_their_parents', 4],
    ['ad_friend_mlm', 'mn_mlm_pitch', 3],
    ['ad_friend_mlm', 'fs_powder_pitch', 2],
    ['gu_widowed_closet', 'gy_widow_closet', 'life'],
    ['gu_widowed_dinner_invite', 'gy_widow_dinner_invite', 'life'],
    ['ll_hearing_aid', 'gy_hearing_aid_gift', 'life'],
  ] as const)('%s and %s keep apart both ways (years: %s)', (a, b, span) => {
    const years = span === 'life' ? undefined : span;
    const s = createLife({ countryCode: 'US' }, 7);
    for (const [card, twin] of [[a, b], [b, a]] as const) {
      expect([card, guardOf(byId(card), twin)]).toEqual([card, { other: twin, lte: years }]);
      const cond: Condition = years === undefined ? { eventNotFired: twin } : { not: { sinceEvent: twin, lte: years } };
      const at40 = (firedAt?: number): GameState => ({ ...s, character: { ...s.character, age: 40 }, firedEvents: firedAt === undefined ? {} : { [twin]: firedAt } });
      expect(evaluateCondition(at40(), cond)).toBe(true);
      expect(evaluateCondition(at40(40 - (years ?? 30)), cond)).toBe(false);
      if (years !== undefined) expect(evaluateCondition(at40(40 - years - 1), cond)).toBe(true);
    }
  });
});

describe('no card brings a new partner in the grief window', () => {
  const bringsPartner = (effects: readonly Effect[]): boolean =>
    effects.some((e) => ('newPerson' in e && (e.newPerson.kind === 'lover' || e.newPerson.kind === 'spouse')) || ('chance' in e && (bringsPartner(e.then) || bringsPartner(e.else ?? []))) || ('random' in e && e.random.some((o) => bringsPartner(o.effects))));
  const waits = (conds: readonly Condition[] | undefined) => (conds ?? []).some((c) => 'flag' in c && c.flag === GRIEF_FLAG && c.exists === false);

  it('every choice in the catalog that brings a lover or spouse waits out the grieving flag', () => {
    const offers = EVENTS.flatMap((e) => e.choices.filter((c) => bringsPartner(c.effects)).map((c) => ({ e, c })));
    expect(offers.map(({ e }) => e.id)).toEqual(expect.arrayContaining(['tm_catfish_match', 'wk_workplace_flirt']));
    expect(offers.filter(({ e, c }) => !waits(e.conditions) && !waits(c.conditions)).map(({ e, c }) => `${e.id}.${c.id}`)).toEqual([]);
  });

  it('the dating app and the flirt at work wait until the grief window has closed', () => {
    const s = createLife({ countryCode: 'US' }, 11);
    const JOB: Job = { defId: 'accountant', title: 'Accountant', company: 'Granite & Sons', salary: 60_000, level: 1, performance: 70, yearsHeld: 4, yearsAtLevel: 2, category: 'finance', partTime: false, askedThisYear: false, workedHarderThisYear: false };
    const ready: GameState = { ...s, year: 2020, people: {}, firedEvents: {}, flags: {}, eventQueue: [], character: { ...s.character, age: 35 }, career: { ...s.career, job: JOB, retired: false } };
    for (const id of ['tm_catfish_match', 'wk_workplace_flirt']) {
      expect([id, isEligible(ready, byId(id))]).toEqual([id, true]);
      expect([id, isEligible({ ...ready, flags: { [GRIEF_FLAG]: 34 } }, byId(id))]).toEqual([id, false]);
    }
  });
});

describe('a text message waits for its era', () => {
  it("the great-aunt's twenty can be thanked by text only from 2003", () => {
    const s = createLife({ countryCode: 'US' }, 5);
    const choicesIn = (year: number) => {
      const at15: GameState = { ...s, year, character: { ...s.character, age: 15, birthYear: year - 15 }, firedEvents: {}, pendingEvent: null, eventQueue: [{ eventId: 'tl_birthday_15', context: {} }] };
      return openNextEvent(at15, EVENT_REGISTRY).pendingEvent?.choices.map((c) => c.id);
    };
    for (const year of [2000, 2001, 2002]) expect([year, choicesIn(year)]).toEqual([year, ['letter', 'inflation']]);
    expect(choicesIn(2003)).toEqual(['letter', 'text', 'inflation']);
  });
});

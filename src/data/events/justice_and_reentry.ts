import type { Condition, EventDef } from '@/engine/events/schema';

/**
 * Justice and re-entry (src/engine/systems/justice.ts, docs/GAME_DESIGN.md §14): parole, life after a release,
 * a sealed juvenile record, school after juvenile detention, adult prison cards that feed the parole board,
 * a second stay in juvenile detention, and witnesses and jurors.
 *
 * Gates:
 *   ON_PAROLE        the `parole` flag lasts the rest of the release year and two full years after an early (adult)
 *                    release, and goes on a new conviction. The hearing frees me after that year's prison cards are
 *                    rolled, so these cards open in the two years outside; no card assumes another fired.
 *                    A `prison` effect on parole counts double; the engine says so after the event's own line.
 *   RECENTLY_OUT     out of adult prison within about two years ({ sinceRelease: 'adult' }) or on parole, and free
 *                    now with the `released` flag.
 *   BACK_AT_SCHOOL   released before 18 can only mean juvenile detention; JUST_BACK adds a release this year or last.
 *   CLEAN_RECORD     arrested at some point but no record now: a juvenile record sealed at 18, or an acquittal.
 *   SEALED_JUVENILE  released (so locked up once) with no record: only a juvenile record is ever cleared.
 *   ADULT_INSIDE     adult prison; cards here write up good conduct or infractions, which drive parole odds.
 *   IN_DETENTION     juvenile detention (only cards with { juvenile: true } open there).
 *   JUVIE_AGAIN      in detention with the `released` flag from an earlier stay. The samplers almost never play a
 *                    second stay, so these cards are follow-ups of jr_juvie_count (any stay) and are skipped
 *                    when they open on a first stay.
 *
 * Flags:
 *   cp_prison_good_conduct / cp_prison_infraction (count) read by the parole board (justice.ts)
 *   jd_write_up (count) trouble in a detention file (juvenile_detention.ts)
 *   jr_po_rapport (bool) my parole officer trusts me
 */

/** On parole: two full years after an early release from adult prison. */
const ON_PAROLE: Condition[] = [{ flag: 'parole' }, { inPrison: false }];

/** Out of adult prison within about two years (crime.lastRelease, set on every release). */
const RECENTLY_OUT: Condition[] = [
  { inPrison: false },
  { flag: 'released' },
  { criminalRecord: true },
  { any: [{ flag: 'parole' }, { sinceRelease: 'adult', lte: 2 }] },
];

/** Released before 18 means juvenile detention: an adult sentence cannot end before 19. */
const BACK_AT_SCHOOL: Condition[] = [{ flag: 'released' }, { inPrison: false }, { enrolled: true }, { stage: ['middle', 'high'] }];

/** Out of juvenile detention this year or last. */
const JUST_BACK: Condition = { sinceRelease: 'juvenile', lte: 1 };

/** Arrested once but nothing on the record now: sealed at 18, or acquitted. */
const CLEAN_RECORD: Condition[] = [{ inPrison: false }, { criminalRecord: false }, { count: 'arrests', gte: 1 }];

/** A sealed juvenile record: locked up once, and an adult conviction would still be on the record. */
const SEALED_JUVENILE: Condition[] = [{ inPrison: false }, { criminalRecord: false }, { flag: 'released' }];

/** Adult prison only. */
const ADULT_INSIDE: Condition[] = [{ inPrison: true }, { juvenile: false }];

/** Juvenile detention. */
const IN_DETENTION: Condition[] = [{ inPrison: true }, { juvenile: true }];

/**
 * A second stay in juvenile detention: the released flag comes from the first one. Once/cooldown are not
 * checked for queued cards, so each follow-up also says it has not opened before (jr_juvie_count can open in
 * both years of a stay).
 */
const JUVIE_AGAIN: Condition[] = [...IN_DETENTION, { flag: 'released' }];

export const JUSTICE_AND_REENTRY_EVENTS: EventDef[] = [
  // ───────────────────────────────── parole ─────────────────────────────────
  {
    id: 'jr_parole_first_meeting',
    category: 'crime',
    title: 'My parole officer',
    text: "My parole officer, Ms. Delgado, has a desk buried in other people's files and a mug that says WORLD'S OKAYEST BOSS. She read my conditions aloud: curfew, tests, work, no trouble. Then she asked if I had questions.",
    minAge: 18,
    maxAge: 90,
    weight: 3,
    once: true,
    conditions: [...ON_PAROLE],
    choices: [
      {
        id: 'questions',
        label: 'Ask every question I have',
        effects: [
          { energy: -1 },
          { karma: 1 },
          { stat: 'happiness', delta: 2 },
          { flag: 'jr_po_rapport', set: true },
          { log: 'I asked fourteen questions. Ms. Delgado answered every one and wrote "engaged" in my file.', kind: 'good' },
        ],
      },
      {
        id: 'sign',
        label: 'Nod and sign everything',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I nodded and signed six pages. Twenty minutes, in and out, and no idea what half of it said.', kind: 'info' }],
      },
      {
        id: 'drill',
        label: 'Tell her I know the drill',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { flag: 'jr_po_rapport', set: true }, { log: 'She quizzed me on three conditions and I knew all three. She wrote "knows the rules" in my file.', kind: 'good' }],
            else: [{ karma: -1 }, { stat: 'happiness', delta: -3 }, { log: 'She smiled the way people smile at a storm warning. My check-ins got a lot longer.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'jr_parole_curfew',
    category: 'friends',
    title: 'Home by ten',
    text: "{{person}} is throwing a birthday party tonight, and it won't really get going until after my parole curfew. {{They}} says one late night can't hurt. My parole officer has never once said that.",
    minAge: 18,
    maxAge: 90,
    weight: 2,
    cooldown: 2,
    conditions: [...ON_PAROLE],
    person: { kind: ['friend', 'bestFriend'], minAge: 18 },
    choices: [
      {
        id: 'leave',
        label: 'Leave at nine-thirty',
        effects: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -1 }, { karma: 1 }, { log: 'I left at nine-thirty, mid-cake. {{person}} hugged me at the door and said {{they}} understood.', kind: 'info' }],
      },
      {
        id: 'stay',
        label: 'Stay for the cake',
        effects: [
          { relationship: 'person', delta: 5 },
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.2,
            then: [{ stat: 'happiness', delta: -15 }, { log: "My parole officer did a curfew check at eleven. I wasn't home. She called it a violation.", kind: 'bad' }, { prison: 1 }],
            else: [{ log: 'I got home at one. Nobody called. I lay awake anyway, listening for a knock.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'ask_trusted',
        label: 'Ask permission first',
        conditions: [{ flag: 'jr_po_rapport' }],
        effects: [
          {
            chance: 0.75,
            then: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 4 }, { log: 'My parole officer gave me until midnight, in writing. I have never held a paper so carefully.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'My parole officer said no, kindly. I made it to the party for one slice and left.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'ask',
        label: 'Ask permission first',
        conditions: [{ not: { flag: 'jr_po_rapport' } }],
        effects: [
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 4 }, { log: 'My parole officer gave me until midnight, in writing. I have never held a paper so carefully.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'My parole officer said no, and that I should know better. One slice of cake, then home.', kind: 'info' }],
          },
        ],
      },
    ],
  },
  {
    id: 'jr_parole_test',
    category: 'crime',
    title: 'A random test',
    text: 'My parole officer called at noon: a random drug test, today, before four. The testing center is two buses and an hour away, and my plans for the afternoon suddenly look very optional.',
    minAge: 18,
    maxAge: 90,
    weight: 2,
    cooldown: 2,
    conditions: [...ON_PAROLE],
    choices: [
      {
        id: 'go',
        label: 'Catch the first bus',
        conditions: [{ noAddiction: 'drugs' }],
        effects: [{ energy: -1 }, { money: -10 }, { stat: 'happiness', delta: 1 }, { log: 'Two buses, one cup, ten minutes, two buses home. I passed. The afternoon was the price.', kind: 'info' }],
      },
      {
        id: 'go_hope',
        label: 'Go and hope',
        conditions: [{ addiction: 'drugs' }],
        effects: [
          { energy: -1 },
          { money: -10 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'Somehow I passed. I sat on the curb outside, shaking, and promised myself a lot of things.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -15 }, { log: "The test came back positive. My parole officer didn't argue. I went back inside.", kind: 'bad' }, { prison: 1 }],
          },
        ],
      },
      {
        id: 'reschedule',
        label: 'Ask to come tomorrow',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -1 }, { log: 'She moved it to tomorrow morning, with a sigh I could hear through the phone.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: "She said a test I schedule myself isn't random. It went in my file as a warning.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Keep my plans',
        effects: [
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -15 }, { log: 'A missed test counts as a failed one. My parole officer filed the violation that night.', kind: 'bad' }, { prison: 1 }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I kept my plans. She let the missed test go with a warning so stern it had footnotes.', kind: 'info' }],
          },
        ],
      },
    ],
  },
  {
    id: 'jr_parole_travel',
    category: 'family',
    title: 'Across the country',
    text: "My cousin is getting married on the other side of the country, and {{person}} has asked five times whether I'm coming. On parole, a trip that far takes a travel permit and my parole officer's signature.",
    minAge: 18,
    maxAge: 90,
    weight: 1.5,
    once: true,
    conditions: [...ON_PAROLE],
    // My side of the family (a spouse would simply come along).
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather', 'grandparent', 'sibling'], minAge: 12 },
    choices: [
      {
        id: 'permit',
        label: 'Apply for a travel permit',
        effects: [
          {
            chance: 0.6,
            then: [{ money: -400 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 5 }, { log: 'The permit came through two days before the wedding. {{person}} cried at the vows. So did I.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -4 }, { log: "Permit denied: too early in my parole. I watched the wedding on {{person}}'s phone.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'go',
        label: 'Go without asking',
        effects: [
          { money: -400 },
          { relationship: 'person', delta: 6 },
          { stat: 'happiness', delta: 4 },
          { karma: -2 },
          {
            chance: 0.25,
            then: [{ stat: 'happiness', delta: -15 }, { log: 'A routine check on the way home turned into a call to my parole officer. Violation.', kind: 'bad' }, { prison: 1 }],
            else: [{ log: "I danced at the wedding and was home by Monday. Nobody ever asked where I'd been.", kind: 'good' }],
          },
        ],
      },
      {
        id: 'video',
        label: 'Watch on a video call',
        effects: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -2 }, { log: 'I watched the vows on a cracked phone screen. {{person}} turned the camera toward the cake for me.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'jr_parole_interview',
    category: 'work',
    title: 'The gap',
    text: 'A warehouse manager agreed to interview me. My parole requires a job, my résumé has a gap shaped exactly like a prison sentence, and he just leaned back and asked me about it.',
    minAge: 18,
    maxAge: 70,
    weight: 2,
    cooldown: 2,
    conditions: [...ON_PAROLE, { hasJob: false }, { retired: false }],
    choices: [
      {
        id: 'truth',
        label: 'Tell him the truth',
        effects: [
          { karma: 2 },
          {
            chance: 0.45,
            then: [{ money: 800 }, { stat: 'happiness', delta: 6 }, { log: 'He said his brother did time too, and offered me a paid trial week. {{$800}} and a reason to get up.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'He thanked me for my honesty and never called. Honesty is not a box on the form.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'letter',
        label: "Show my officer's letter",
        effects: [
          { energy: -1 },
          {
            chance: 0.55,
            then: [{ money: 800 }, { stat: 'happiness', delta: 5 }, { log: 'The letter said I show up on time. He tested that with a paid trial week, and I passed.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: "He read my parole officer's letter, nodded slowly and said they'd be in touch. They were not.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'lie',
        label: 'Say I was traveling',
        effects: [
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ money: 800 }, { stat: 'happiness', delta: 2 }, { log: 'He bought the traveling story and gave me a paid trial week. I spent it waiting to be found out.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -6 }, { log: 'The background check came back before I got home. So did the rejection.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'jr_parole_fees',
    category: 'money',
    title: 'The cost of being watched',
    text: 'Parole, it turns out, sends a bill: a monthly supervision fee, a fee for every test, and a required class that costs more than my groceries. The first notice came stamped FINAL, somehow.',
    minAge: 18,
    maxAge: 90,
    weight: 2,
    once: true,
    conditions: [...ON_PAROLE],
    choices: [
      {
        id: 'pay',
        label: 'Pay it all on time',
        effects: [{ money: -600 }, { stat: 'happiness', delta: -3 }, { log: 'I paid every fee on time. My parole file looks great. My fridge does not.', kind: 'money' }],
      },
      {
        id: 'waiver',
        label: 'Ask for a fee waiver',
        effects: [
          { energy: -1 },
          {
            chance: 0.5,
            then: [{ money: -150 }, { stat: 'happiness', delta: 3 }, { log: 'A clerk cut the fees down to {{$150}} after a long form and a longer line.', kind: 'money' }],
            else: [{ money: -600 }, { stat: 'happiness', delta: -4 }, { log: 'Waiver denied, after a whole afternoon of forms. I paid the full amount anyway.', kind: 'money' }],
          },
        ],
      },
      {
        id: 'late',
        label: 'Pay what I can, late',
        effects: [
          { money: -250 },
          {
            chance: 0.25,
            then: [{ money: -350 }, { stat: 'happiness', delta: -6 }, { log: 'The unpaid fees came back as a violation warning. My parole officer said "pay it," twice.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'I paid in pieces, a little late each time. Nobody said a word, which felt worse than a warning.', kind: 'money' }],
          },
        ],
      },
    ],
  },
  {
    id: 'jr_parole_moving_job',
    category: 'crime',
    title: 'Moving furniture',
    text: 'Someone from the old days texted: a moving job tonight, cash, a truck and a storage unit across town. He swore it was just furniture. Nobody has ever been that specific about furniture.',
    minAge: 18,
    maxAge: 80,
    weight: 1.5,
    cooldown: 2,
    conditions: [...ON_PAROLE],
    choices: [
      {
        id: 'delete',
        label: 'Delete the text',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: -1 }, { log: 'I deleted the text, then the number, then sat on my hands for an hour. Boring is my whole plan.', kind: 'good' }],
      },
      {
        id: 'go',
        label: 'Take the cash job',
        effects: [
          { karma: -4 },
          { counter: 'crimes' },
          {
            random: [
              { weight: 5, effects: [{ money: 1500 }, { stat: 'happiness', delta: 3 }, { log: "It was mostly furniture. I didn't ask about the rest. {{$1500}} I can never explain.", kind: 'money' }] },
              { weight: 3, effects: [{ stat: 'happiness', delta: -5 }, { log: 'Halfway through I saw what was in the boxes and walked home. No money, but no handcuffs.', kind: 'bad' }] },
              { weight: 2, effects: [{ stat: 'happiness', delta: -20 }, { log: 'The storage unit was being watched. Stolen goods, a fresh charge and a parole violation.', kind: 'bad' }, { prison: 2 }] },
            ],
          },
        ],
      },
      {
        id: 'report',
        label: 'Tell my parole officer',
        effects: [
          { karma: 3 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 2 }, { flag: 'jr_po_rapport', set: true }, { log: 'I showed my parole officer the text. She said I had made her whole week.', kind: 'good' }],
            else: [
              { stat: 'happiness', delta: -5 },
              { newPerson: { kind: 'enemy', relationship: 10, minAge: 20, maxAge: 55, log: 'Word got around that I talked to my parole officer. {{person}} made sure I knew it.' } },
            ],
          },
        ],
      },
    ],
  },

  // ───────────────────────────────── life after release ─────────────────────────────────
  {
    id: 'jr_out_pay_stub',
    category: 'work',
    title: 'Pay stub',
    text: 'Payday at {{company}}. Since I got out, every pay stub with my name on it has felt like proof of something. I keep them all in a shoebox, like love letters from the outside.',
    minAge: 18,
    maxAge: 80,
    weight: 2,
    once: true,
    conditions: [...RECENTLY_OUT, { hasJob: true }],
    person: { kind: ['mother', 'father', 'sibling', 'grandparent', 'bestFriend', 'spouse'], minAge: 16, minRelationship: 50 },
    choices: [
      {
        id: 'frame',
        label: 'Frame this one',
        effects: [{ money: -20 }, { stat: 'happiness', delta: 4 }, { log: 'I framed a pay stub and hung it by the door. Nobody is allowed to comment on it.', kind: 'good' }],
      },
      {
        id: 'dinner',
        label: 'Take {{person}} to dinner',
        effects: [{ money: -150 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 3 }, { log: 'I took {{person}} to dinner and paid the whole bill. {{They}} let me, which was the real gift.', kind: 'good' }],
      },
      {
        id: 'save',
        label: 'Open a savings account',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 1 }, { karma: 1 }, { log: "I opened a savings account with a teller who didn't ask a single question. Small balance. Mine.", kind: 'money' }],
      },
    ],
  },
  {
    id: 'jr_out_reunion',
    category: 'family',
    title: 'The family reunion',
    text: 'My first family reunion since getting out. The cousins went quiet when I walked into the yard, and an uncle checked where his wallet was. {{person}} crossed the whole lawn to hug me first.',
    minAge: 18,
    maxAge: 80,
    weight: 2,
    once: true,
    conditions: [...RECENTLY_OUT],
    person: { kind: ['grandparent'] },
    choices: [
      {
        id: 'grill',
        label: 'Work the grill all day',
        effects: [
          { energy: -1 },
          { relationship: 'sibling', delta: 3 },
          { relationship: 'mother', delta: 3 },
          { relationship: 'father', delta: 3 },
          { stat: 'happiness', delta: 2 },
          { log: 'I flipped burgers for four hours. By the end, even the wallet uncle asked me for seconds.', kind: 'good' },
        ],
      },
      {
        id: 'sit',
        label: 'Sit with {{person}}',
        effects: [{ relationship: 'person', delta: 8 }, { relationship: 'sibling', delta: -2 }, { stat: 'happiness', delta: 4 }, { log: '{{person}} and I sat in the shade all afternoon and talked about anything but prison.', kind: 'good' }],
      },
      {
        id: 'questions',
        label: 'Answer every question',
        effects: [{ karma: 2 }, { relationship: 'person', delta: 3 }, { stat: 'happiness', delta: -2 }, { log: 'I answered every question, even the rude ones. By dessert there were none left.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'jr_out_two_kinds',
    category: 'friends',
    title: 'Two kinds of friends',
    // Unbound: a friend in the game may have been made inside or since, so the old friend who calls is new to it.
    text: 'Since I got out, my old friends have sorted themselves into two groups: the ones who call and the ones who cross the street. Last night one called who never wrote once while I was inside.',
    minAge: 18,
    maxAge: 80,
    weight: 1.5,
    once: true,
    conditions: [...RECENTLY_OUT],
    choices: [
      {
        id: 'coffee',
        label: 'Meet for coffee',
        effects: [
          { money: -10 },
          { stat: 'happiness', delta: 4 },
          { newPerson: { kind: 'friend', relationship: 55, minAge: 18, log: 'Coffee with {{person}} ran three hours. We talked about everything except the time in between.' } },
        ],
      },
      {
        id: 'texts',
        label: 'Keep it to texts for now',
        effects: [{ stat: 'happiness', delta: 1 }, { log: "I texted back but kept my distance. I'm still learning who I am out here.", kind: 'info' }],
      },
      {
        id: 'why',
        label: 'Ask why they never wrote',
        effects: [
          {
            chance: 0.5,
            then: [
              { stat: 'happiness', delta: 3 },
              { newPerson: { kind: 'friend', relationship: 65, minAge: 18, log: "{{person}} said {{they}} didn't know what to write. Neither did I, honestly. We started over." } },
            ],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'My old friend got defensive, then quiet. We left it there, which is where it had been all along.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'jr_out_landlord',
    category: 'money',
    title: 'A note under the door',
    text: "My landlord searched my name online and found my record. She slid a note under my door: she'd like to talk today, and she had been \"meaning to raise the rent anyway.\"",
    // 24+: younger adults without a home may still live with their parents (conditions.ts livesAtHome).
    minAge: 24,
    maxAge: 85,
    weight: 0.8,
    once: true,
    conditions: [{ inPrison: false }, { flag: 'released' }, { criminalRecord: true }, { noAsset: 'house' }],
    choices: [
      {
        id: 'talk',
        label: 'Talk it through with her',
        effects: [
          { karma: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: "I told her everything at her kitchen table. She said I'm the only tenant who pays early. I stay.", kind: 'good' }],
            else: [{ money: -1200 }, { stat: 'happiness', delta: -5 }, { log: 'She listened, then raised my rent by {{$100}} a month. Staying costs more than it used to.', kind: 'money' }],
          },
        ],
      },
      {
        id: 'letter',
        label: 'Bring her a reference letter',
        effects: [
          { energy: -1 },
          {
            chance: 0.65,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'My old landlord wrote that I was never late and never trouble. The rent stayed the same.', kind: 'good' }],
            else: [{ money: -1200 }, { stat: 'happiness', delta: -4 }, { log: 'She read the letter twice and raised my rent by {{$100}} a month anyway.', kind: 'money' }],
          },
        ],
      },
      {
        id: 'move',
        label: 'Start looking elsewhere',
        effects: [{ money: -800 }, { stat: 'happiness', delta: -3 }, { log: "I didn't wait to find out. Moving cost {{$800}} and a weekend, but nobody there knows my name.", kind: 'money' }],
      },
    ],
  },
  {
    id: 'jr_out_mugshot',
    category: 'work',
    title: 'The break room',
    text: '{{person}} found my old mugshot online and passed a phone around the break room at {{company}}. When I walked in, six people suddenly found their sandwiches fascinating.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    once: true,
    conditions: [{ inPrison: false }, { flag: 'released' }, { criminalRecord: true }, { hasJob: true }],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'own',
        label: 'Own it, out loud',
        effects: [
          {
            chance: 0.6,
            then: [{ jobPerformance: 2 }, { stat: 'happiness', delta: 5 }, { log: "I said yes, that's me, worst haircut of my life. Somebody laughed, and the room breathed again.", kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'I owned it. Half the room respected that. The other half started locking their lockers.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'confront',
        label: 'Talk to {{person}} privately',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 2 }, { log: "{{person}} apologized, red to the ears, and said {{they}} didn't think. Most people don't.", kind: 'good' }],
            else: [{ relationship: 'person', delta: -10 }, { stat: 'happiness', delta: -3 }, { log: '{{person}} shrugged and said it was public information. I keep my distance now.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'manager',
        label: 'Take it to my manager',
        effects: [
          { relationship: 'person', delta: -6 },
          {
            chance: 0.5,
            then: [{ jobPerformance: 1 }, { stat: 'happiness', delta: 2 }, { log: 'My manager had a word with {{person}}. The phone stayed in {{their}} pocket after that.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'My manager said there was nothing to do about public records, and looked at me differently after.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'jr_out_apps',
    category: 'random',
    title: 'There is an app for that',
    text: 'After years inside, the outside runs on apps. The bus, the parking meter, the diner menu, even the laundromat wants me to download something. My phone has opinions about all of it.',
    minAge: 20,
    maxAge: 90,
    weight: 2,
    once: true,
    conditions: [...RECENTLY_OUT, { count: 'yearsInPrison', gte: 4 }],
    choices: [
      {
        id: 'class',
        label: 'Take the library class',
        effects: [{ energy: -1 }, { stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I learned apps in a library class full of retirees. We graduated together, sort of.', kind: 'good' }],
      },
      {
        id: 'teen',
        label: 'Ask a teenager for help',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'A teenager at the bus stop set up my phone in four minutes and called me "boss." I felt ancient.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'The teenager sighed so deeply I felt it in my bones. My phone works now, though.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'cash',
        label: 'Insist on paying cash',
        effects: [{ money: -50 }, { stat: 'happiness', delta: 2 }, { log: 'I paid cash for everything, missed every app discount and got a lecture on convenience. No regrets.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'jr_out_polite_guest',
    category: 'family',
    title: 'A polite guest',
    text: "{{person}} grew up a lot while I was inside, and now treats me like a polite guest: please, thank you, and a careful look whenever my voice gets loud. {{They}} hasn't asked me a single question.",
    minAge: 20,
    maxAge: 70,
    weight: 2,
    once: true,
    // Two years or more inside, so there was time to grow up a lot.
    conditions: [...RECENTLY_OUT, { count: 'yearsInPrison', gte: 2 }],
    // At least four, so they were alive while I was inside (RECENTLY_OUT: out within about two years).
    person: { kind: ['child', 'grandchild', 'sibling'], minAge: 4, maxAge: 17 },
    choices: [
      {
        id: 'show_up',
        label: 'Show up, every single day',
        effects: [{ energy: -1 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 3 }, { log: 'I showed up for every pickup, game and dinner. By spring, {{person}} was saving me a seat.', kind: 'good' }],
      },
      {
        id: 'truth',
        label: 'Tell {{them}} the truth',
        effects: [
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 10 }, { stat: 'happiness', delta: 4 }, { log: 'I told {{person}} why I went away, in words {{they}} could carry. Then came a hundred questions.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -4 }, { log: '{{person}} listened to the truth, nodded and went to {{their}} room. It will take time.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'gift',
        label: 'Buy {{them}} something big',
        effects: [{ money: -400 }, { relationship: 'person', delta: 3 }, { stat: 'happiness', delta: -1 }, { log: 'I bought {{person}} the expensive sneakers. {{They}} said thank you, politely, like a guest would.', kind: 'money' }],
      },
    ],
  },

  // ───────────────────────────────── a sealed juvenile record ─────────────────────────────────
  {
    id: 'jr_sealed_coach_check',
    category: 'random',
    title: 'Coach, cleared',
    text: 'The youth soccer league ran a background check before letting me coach the under-tens. It came back spotless. Nothing from my past is on any page they can see.',
    minAge: 20,
    maxAge: 65,
    weight: 0.7,
    once: true,
    conditions: [...CLEAN_RECORD],
    choices: [
      {
        id: 'tell',
        label: 'Tell the director anyway',
        effects: [
          { karma: 3 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I told the director everything. She said those kids needed someone like me, and handed me a whistle.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -6 }, { log: 'The director thanked me for my honesty and gave the team to someone else. It stung all season.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'coach',
        label: 'Just coach',
        effects: [{ energy: -1 }, { stat: 'happiness', delta: 5 }, { stat: 'health', delta: 2 }, { log: 'I coached eleven tiny players who chased the ball as one big blob. We lost every game and loved it.', kind: 'good' }],
      },
      {
        id: 'withdraw',
        label: 'Step back after all',
        effects: [{ stat: 'happiness', delta: -2 }, { log: 'I withdrew my name. Some days the past feels heavier than any form says it is.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'jr_sealed_tell_partner',
    category: 'romance',
    title: 'What I was like as a kid',
    text: '{{person}} asked what I was like growing up, and I realized {{they}} has never heard about juvenile detention. My record is sealed. Nobody ever has to know unless I tell {{them}}.',
    minAge: 18,
    maxAge: 65,
    weight: 1,
    once: true,
    conditions: [...SEALED_JUVENILE],
    person: { kind: ['lover', 'spouse'] },
    choices: [
      {
        id: 'tell',
        label: 'Tell {{them}} everything',
        effects: [
          {
            chance: 0.7,
            then: [{ love: 8 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 5 }, { log: '{{person}} held my hand through all of it and said it explained a lot, in a good way.', kind: 'good' }],
            else: [{ love: -8 }, { stat: 'happiness', delta: -6 }, { log: "{{person}} went quiet, then asked what else I hadn't told {{them}}. It was a long week.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'funny',
        label: 'Tell the funny parts',
        effects: [{ love: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I told {{person}} about the cafeteria food and the nine o\'clock bedtime. The rest stayed sealed.', kind: 'info' }],
      },
      {
        id: 'dodge',
        label: 'Change the subject',
        effects: [{ karma: -1 }, { stat: 'happiness', delta: -2 }, { log: 'I said I was a boring kid and changed the subject. {{person}} believed me, which was worse.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'jr_sealed_mentor',
    category: 'random',
    title: 'Been through the system',
    text: 'A youth program wants mentors who have "been through the system" to meet one kid in detention every week. My juvenile record is sealed, so nobody would know I qualify unless I said so.',
    minAge: 22,
    maxAge: 70,
    weight: 0.7,
    once: true,
    conditions: [...SEALED_JUVENILE],
    choices: [
      {
        id: 'sign',
        label: 'Sign up',
        effects: [
          { energy: -1 },
          { karma: 4 },
          {
            chance: 0.65,
            then: [{ stat: 'happiness', delta: 6 }, { log: 'For a month the kid barely talked. Then one Tuesday came the question: how did I stay out?', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The kid I met with stopped coming after three weeks. I keep the Tuesday open anyway.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'donate',
        label: 'Donate instead',
        effects: [{ money: -300 }, { karma: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I sent the program {{$300}} with no name attached. Some of us help better from a distance.', kind: 'money' }],
      },
      {
        id: 'pass',
        label: 'Leave the past sealed',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I threw the flyer away, fished it out, and threw it away again. Sealed means sealed.', kind: 'info' }],
      },
    ],
  },

  // ───────────────────────────────── witnesses and jurors ─────────────────────────────────
  {
    id: 'jr_jury_arrest_question',
    category: 'random',
    title: 'Jury selection',
    text: "Jury selection. The judge asked the room, \"Has anyone here ever been arrested?\" Forty strangers studied their shoes. My record is clean on paper, but the question didn't ask about paper.",
    minAge: 18,
    maxAge: 75,
    weight: 0.7,
    cooldown: 10,
    conditions: [...CLEAN_RECORD],
    choices: [
      {
        id: 'raise',
        label: 'Raise my hand',
        effects: [
          { karma: 3 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'I raised my hand, answered three questions and was sent home before lunch. Honest and free.', kind: 'good' }],
            else: [{ money: 200 }, { log: 'I raised my hand and explained. The lawyers picked me anyway. Two weeks on a jury.', kind: 'info' }, { queue: 'jr_jury_note' }],
          },
        ],
      },
      {
        id: 'quiet',
        label: 'Keep my hand down',
        effects: [
          { karma: -2 },
          {
            chance: 0.6,
            then: [{ money: 200 }, { log: 'I kept my hand down and was picked. My arrest sat next to me in the jury box all trial.', kind: 'info' }, { queue: 'jr_jury_note' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'I kept my hand down. They sent me home anyway, and I argued with myself the whole bus ride.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'private',
        label: 'Ask to speak privately',
        effects: [
          { energy: -1 },
          { karma: 2 },
          {
            chance: 0.5,
            then: [{ money: 200 }, { stat: 'happiness', delta: 2 }, { log: 'In chambers, the judge thanked me and let me serve. Two weeks and a clear conscience.', kind: 'good' }, { queue: 'jr_jury_note' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'In chambers, the judge thanked me and excused me. Nobody else ever heard a word of it.', kind: 'info' }],
          },
        ],
      },
    ],
  },
  {
    id: 'jr_jury_note',
    category: 'random',
    title: 'Juror number seven',
    text: "Day four of the trial. Juror number seven has been reading news about our case on his phone under the table, and at lunch he's already telling everyone what the verdict should be.",
    minAge: 18,
    maxAge: 80,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'note',
        label: 'Send the judge a note',
        effects: [
          { karma: 3 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'The judge swapped juror seven for an alternate. Nobody knew who sent the note. I knew.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'My note caused a mistrial. Two weeks of testimony, gone. The right call, and a heavy one.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'tell',
        label: 'Tell him to stop',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { karma: 1 }, { log: 'I quietly told him to put the phone away. He did, and sulked for the rest of the trial.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'He told the whole jury I was a hall monitor. Deliberations were very chilly.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Stay out of it',
        effects: [{ karma: -2 }, { stat: 'happiness', delta: -1 }, { log: 'I said nothing. We reached a verdict on day six. I never knew how much of it came from his phone.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'jr_witness_character',
    category: 'friends',
    title: 'Character witness',
    text: '{{person}} pleaded guilty and will be sentenced next month. The defense lawyer asked if I would stand up in court and tell the judge who {{person}} really is, on the record.',
    minAge: 18,
    maxAge: 80,
    weight: 0.6,
    cooldown: 10,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend', 'sibling'], minAge: 18, minRelationship: 40 },
    choices: [
      {
        id: 'speak',
        label: 'Speak for {{them}} in court',
        effects: [
          { energy: -1 },
          { karma: 3 },
          { relationship: 'person', delta: 10 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I spoke for five minutes with my hands shaking. The judge gave {{person}} probation.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I said every true, good thing I knew. The judge listened, and gave {{person}} two years anyway.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'letter',
        label: 'Write a letter instead',
        effects: [{ karma: 1 }, { relationship: 'person', delta: 4 }, { log: 'I wrote the judge two pages about {{person}}. Easier than a courtroom, and less than {{they}} hoped.', kind: 'info' }],
      },
      {
        id: 'decline',
        label: 'Stay out of it',
        effects: [{ relationship: 'person', delta: -10 }, { stat: 'happiness', delta: -2 }, { log: "I told {{person}} I couldn't do it. {{They}} said {{they}} understood. {{They}} didn't.", kind: 'bad' }],
      },
    ],
  },
  {
    id: 'jr_witness_crash',
    category: 'random',
    title: 'What I saw',
    text: "I saw a delivery van run a red light and clip a cyclist. Now the van company's lawyer wants my statement, and hinted that a \"consulting fee\" is available if I'm less sure about the light.",
    minAge: 18,
    maxAge: 80,
    weight: 0.7,
    cooldown: 10,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'truth',
        label: 'Tell exactly what I saw',
        effects: [{ energy: -1 }, { karma: 4 }, { stat: 'happiness', delta: 2 }, { log: "I said red, three times, under oath. The cyclist's family sent a card with a drawing of a stoplight.", kind: 'good' }],
      },
      {
        id: 'fee',
        label: 'Take the consulting fee',
        effects: [
          { money: 2000 },
          { karma: -6 },
          {
            chance: 0.25,
            then: [{ money: -1500 }, { stat: 'happiness', delta: -10 }, { log: 'A camera on the corner saw the light too. Lying under oath got me arrested and fined.', kind: 'bad' }, { arrest: true }],
            else: [{ stat: 'happiness', delta: -3 }, { log: "I said I wasn't sure. The {{$2000}} cleared on Friday. My conscience did not.", kind: 'money' }],
          },
        ],
      },
      {
        id: 'nothing',
        label: 'Say I saw nothing',
        effects: [{ karma: -2 }, { stat: 'happiness', delta: -1 }, { log: 'I told them I was looking at my phone. I was not. I think about that cyclist sometimes.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'jr_witness_alibi',
    category: 'crime',
    title: 'Friday night',
    text: "{{person}} asked me to tell the police we were together last Friday night, watching movies at my place. We weren't. {{They}} won't say where {{they}} actually was.",
    minAge: 15,
    maxAge: 60,
    weight: 0.7,
    cooldown: 8,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend', 'sibling'], minAge: 14 },
    choices: [
      {
        id: 'lie',
        label: 'Back up the story',
        effects: [
          { relationship: 'person', delta: 6 },
          { karma: -4 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -8 }, { log: 'The detective had a photo of {{person}} across town. Lying to the police went on my record.', kind: 'bad' }, { arrest: true }],
            else: [{ stat: 'happiness', delta: -2 }, { log: "I backed up the story. The police wrote it down and left. I still don't know what I covered for.", kind: 'info' }],
          },
        ],
      },
      {
        id: 'refuse',
        label: "Say I won't lie for {{them}}",
        effects: [{ relationship: 'person', delta: -8 }, { karma: 2 }, { log: "I told {{person}} I wouldn't lie for {{them}}. {{They}} hung up. I didn't sleep much.", kind: 'info' }],
      },
      {
        id: 'police',
        label: 'Tell the police the truth',
        effects: [
          { relationship: 'person', delta: -15 },
          { karma: 3 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'I told the detective the truth. {{person}} found out within a day and stopped speaking to me.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: "I told the truth, and {{person}} was charged. {{They}} hasn't spoken to me since.", kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ───────────────────────────────── back at school after detention ─────────────────────────────────
  {
    id: 'jr_school_teacher_knew',
    category: 'school',
    title: 'The teacher who knew',
    text: "My English teacher kept me after class. She said she knew I'd been in juvenile detention, that it would stay between us, and that my essays were too good to waste.",
    minAge: 12,
    maxAge: 17,
    weight: 2,
    once: true,
    conditions: [...BACK_AT_SCHOOL],
    choices: [
      {
        id: 'thank',
        label: 'Thank her and mean it',
        effects: [{ grade: 5 }, { stat: 'happiness', delta: 4 }, { log: 'I thanked her and meant it. My next essay came back with an A and a note: "Told you."', kind: 'good' }],
      },
      {
        id: 'shrug',
        label: 'Shrug it off',
        effects: [{ grade: 1 }, { stat: 'happiness', delta: -1 }, { log: "I shrugged and said thanks, I guess. She smiled like she'd heard that one before.", kind: 'info' }],
      },
      {
        id: 'who',
        label: 'Ask who else knows',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'She said only the principal and her. Two people. I could live with two.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'She hesitated a second too long. I spent the rest of the year wondering who else knew.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'jr_school_friend_parents',
    category: 'friends',
    title: 'Not allowed',
    text: "{{person}} told me, staring at {{their}} shoes, that {{their}} mom says we can't hang out anymore. Not since juvenile detention. {{They}} says it isn't {{their}} idea.",
    minAge: 12,
    maxAge: 17,
    weight: 2,
    once: true,
    conditions: [...BACK_AT_SCHOOL, JUST_BACK],
    person: { kind: ['friend', 'bestFriend', 'classmate'], minAge: 10, maxAge: 18 },
    choices: [
      {
        id: 'accept',
        label: 'Tell {{them}} I understand',
        effects: [{ relationship: 'person', delta: -3 }, { karma: 1 }, { stat: 'happiness', delta: -4 }, { log: 'I told {{person}} I understood. We still nod at each other in the hallway, which is something.', kind: 'info' }],
      },
      {
        id: 'mom',
        label: 'Talk to {{their}} mom',
        effects: [
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 6 }, { log: "I knocked on {{person}}'s door and told {{their}} mom the truth. She let me stay for dinner.", kind: 'good' }],
            else: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -5 }, { log: "{{person}}'s mom listened on the porch, then closed the door. Politely, which was worse.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'secret',
        label: 'Hang out in secret',
        effects: [
          { relationship: 'person', delta: 4 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -4 }, { log: "{{person}}'s mom caught us at the park. Now {{person}} is grounded, and I'm the reason.", kind: 'bad' }],
            else: [{ log: 'We meet at the library after school. {{person}} calls it a book club. It is not a book club.', kind: 'info' }],
          },
        ],
      },
    ],
  },
  {
    id: 'jr_school_catching_up',
    category: 'school',
    title: 'Three chapters behind',
    text: 'School in detention was one room and every grade at once. Back in a real school, my math class is three chapters ahead of me, and the teacher talks like everyone remembers last month.',
    minAge: 12,
    maxAge: 17,
    weight: 3,
    once: true,
    conditions: [...BACK_AT_SCHOOL, JUST_BACK],
    choices: [
      {
        id: 'tutor',
        label: 'Stay after for tutoring',
        effects: [{ energy: -1 }, { grade: 8 }, { stat: 'happiness', delta: -2 }, { log: 'I stayed after school three days a week. By spring I had caught up, and nobody saw me sweat.', kind: 'good' }],
      },
      {
        id: 'notes',
        label: "Borrow a classmate's notes",
        effects: [
          { grade: 4 },
          {
            chance: 0.6,
            then: [{ newPerson: { kind: 'friend', relationship: 50, minAge: 12, maxAge: 18, log: '{{person}} lent me three chapters of notes and a lot of patience. We study together now.' } }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The first classmate I asked said no, loudly. I worked through the chapters alone, slowly.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'wing',
        label: 'Wing it',
        effects: [{ grade: -6 }, { stat: 'happiness', delta: 2 }, { log: 'I decided math would sort itself out. Math did not get the message.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'jr_school_legend',
    category: 'school',
    title: 'The legend of me',
    text: 'Since I came back, the story of why I was gone has grown wings: an armored truck, a police helicopter and possibly a getaway goat. The truth is much more boring. Nobody wants the boring version.',
    minAge: 12,
    maxAge: 17,
    weight: 2,
    once: true,
    conditions: [...BACK_AT_SCHOOL, JUST_BACK],
    choices: [
      {
        id: 'grow',
        label: 'Let the legend grow',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I never confirmed the goat. By spring, the younger kids stepped aside when I walked past.', kind: 'info' }],
            else: [{ injury: 3 }, { stat: 'happiness', delta: -5 }, { log: 'A kid who believed the legend wanted to test it behind the gym. The legend lost.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'truth',
        label: 'Tell the boring truth',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: -1 }, { log: 'I told everyone the boring truth. They looked disappointed, then left me alone. Perfect.', kind: 'info' }],
      },
      {
        id: 'monster',
        label: 'Add a sea monster',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I added a sea monster. The story collapsed under its own weight, and people laughed with me.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I added a sea monster. A teacher overheard and phoned home, and nobody there laughed.', kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ───────────────────────────────── adult prison: the file the board reads ─────────────────────────────────
  {
    id: 'jr_prison_tutor',
    category: 'prison',
    title: 'The equivalency class',
    text: 'The education office needs a tutor for the high school equivalency class: eight students, one dying whiteboard marker and a test in three months. The pay is mostly gratitude.',
    minAge: 18,
    maxAge: 90,
    weight: 1,
    cooldown: 4,
    conditions: [...ADULT_INSIDE, { stat: 'smarts', gte: 55 }],
    choices: [
      {
        id: 'tutor',
        label: 'Take the job',
        effects: [
          { energy: -1 },
          { stat: 'smarts', delta: 1 },
          { flag: 'cp_prison_good_conduct', inc: 1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 6 }, { karma: 2 }, { log: 'Six of my eight passed. One framed the certificate in cardboard and hung it over the bunk.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'Two of my eight passed. The teacher said that was a good year. I want a better one.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'cellmate',
        label: 'Help my cellmate only',
        effects: [{ energy: -1 }, { karma: 2 }, { stat: 'happiness', delta: 3 }, { log: 'I tutored my cellmate after count. Fractions, mostly. We both got better at patience.', kind: 'good' }],
      },
      {
        id: 'decline',
        label: 'Keep my head down',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I said no and kept my evenings to myself. The sign-up sheet stayed on the board for weeks.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'jr_prison_shakedown',
    category: 'prison',
    title: 'Shakedown',
    text: "The guards tossed our cell at dawn and found a phone charger taped under the sink. Contraband. It's my cellmate's, and my cellmate is staring at the floor, waiting to see what I say.",
    minAge: 18,
    maxAge: 90,
    weight: 1,
    cooldown: 3,
    conditions: [...ADULT_INSIDE],
    choices: [
      {
        id: 'blame',
        label: 'Take the blame',
        effects: [
          { karma: 2 },
          { stat: 'happiness', delta: -4 },
          { flag: 'cp_prison_infraction', inc: 1 },
          { log: 'I said it was mine. Thirty days without commissary. My cellmate has shared a lot of soups since.', kind: 'bad' },
        ],
      },
      {
        id: 'not_mine',
        label: "Say it isn't mine",
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: -2 }, { log: "I said it wasn't mine, and the guards believed me. My cellmate didn't speak to me for a month.", kind: 'info' }],
            else: [{ stat: 'happiness', delta: -5 }, { flag: 'cp_prison_infraction', inc: 1 }, { log: 'Neither of us claimed it, so they wrote us both up. Shared cell, shared problem.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'silent',
        label: 'Say nothing at all',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'I said nothing. My cellmate finally spoke up and took it. We never mentioned it again.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -3 }, { flag: 'cp_prison_infraction', inc: 1 }, { log: 'Silence counted as guilt. We both got written up, and we both blamed each other.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'jr_prison_tattoo',
    category: 'prison',
    title: 'Homemade ink',
    text: 'Someone on my tier does tattoos with a machine built from a cassette motor and a guitar string. Commissary prices, decent work, strictly against the rules, and nobody asks about the needle.',
    minAge: 18,
    maxAge: 90,
    weight: 1,
    cooldown: 4,
    conditions: [...ADULT_INSIDE],
    choices: [
      {
        id: 'get',
        label: 'Get a small one',
        hint: '{{$30}} in commissary',
        conditions: [{ money: { gte: 30 } }],
        effects: [
          { money: -30 },
          {
            random: [
              { weight: 5, effects: [{ stat: 'happiness', delta: 4 }, { log: 'I got a small swallow on my wrist. It is slightly crooked, like me, and I love it.', kind: 'good' }] },
              { weight: 3, effects: [{ stat: 'happiness', delta: -2 }, { flag: 'cp_prison_infraction', inc: 1 }, { log: 'A guard spotted the fresh ink at count. A write-up, a lecture and a swallow on my wrist.', kind: 'bad' }] },
              { weight: 2, effects: [{ stat: 'health', delta: -6 }, { flag: 'cp_prison_infraction', inc: 1 }, { log: 'It got infected. The nurse cleaned it, sighed and wrote it up anyway.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'draw',
        label: 'Draw the designs instead',
        effects: [
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.8,
            then: [{ log: 'I draw the designs now, and someone else holds the needle. Clean hands, extra soups.', kind: 'info' }],
            else: [{ flag: 'cp_prison_infraction', inc: 1 }, { log: 'A guard found my sketchbook full of tattoo designs. Apparently drawings count. Written up.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'pass',
        label: 'Keep my skin blank',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I passed. My skin and my file both stayed clean. My wrist looks very plain.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'jr_prison_choir',
    category: 'prison',
    title: 'The chapel choir',
    text: "The chaplain started a choir: Thursday nights, twenty voices, no talent required, which is lucky. There's a concert for families at the end of the season, if we survive the harmonies.",
    minAge: 18,
    maxAge: 95,
    weight: 1,
    cooldown: 4,
    conditions: [...ADULT_INSIDE],
    choices: [
      {
        id: 'join',
        label: 'Join the choir',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 5 },
          { flag: 'cp_prison_good_conduct', inc: 1 },
          { log: 'I sang the low part, mostly on key. At the family concert, people stood up. Some were guards.', kind: 'good' },
        ],
      },
      {
        id: 'solo',
        label: 'Audition for the solo',
        effects: [
          { energy: -1 },
          { flag: 'cp_prison_good_conduct', inc: 1 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 10 }, { log: 'I sang the solo at the family concert. The chapel went silent, then loud. I will never forget it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I froze on the second line of the solo. The choir carried me through. That counts for something.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Listen from my cell',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'On Thursdays I lay on my bunk and listened through the vents. Even from there, it sounded good.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'jr_prison_lieutenant',
    category: 'prison',
    title: 'Who started it',
    text: "A lieutenant pulled me into her office after yesterday's fight in the dayroom. She knows I saw who started it. She also knows the whole block saw me walk in here.",
    minAge: 18,
    maxAge: 90,
    weight: 1,
    cooldown: 3,
    conditions: [...ADULT_INSIDE],
    choices: [
      {
        // Prisons are single-sex, so the enemy on my block shares my gender.
        id: 'tell_m',
        label: 'Tell her who started it',
        conditions: [{ gender: 'male' }],
        effects: [
          { flag: 'cp_prison_good_conduct', inc: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'I told her. The one who started it went to another unit, and the block decided to forget I talked.', kind: 'info' }],
            else: [
              { stat: 'happiness', delta: -6 },
              { newPerson: { kind: 'enemy', gender: 'male', relationship: 5, minAge: 20, maxAge: 60, log: 'I told her who started it. {{person}} found out by dinner and has been waiting ever since.' } },
            ],
          },
        ],
      },
      {
        id: 'tell_f',
        label: 'Tell her who started it',
        conditions: [{ gender: 'female' }],
        effects: [
          { flag: 'cp_prison_good_conduct', inc: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'I told her. The one who started it went to another unit, and the block decided to forget I talked.', kind: 'info' }],
            else: [
              { stat: 'happiness', delta: -6 },
              { newPerson: { kind: 'enemy', gender: 'female', relationship: 5, minAge: 20, maxAge: 60, log: 'I told her who started it. {{person}} found out by dinner and has been waiting ever since.' } },
            ],
          },
        ],
      },
      {
        id: 'nothing',
        label: 'Say I saw nothing',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I said I saw nothing, ten different ways. She wrote something down and let me go.', kind: 'info' }],
      },
      {
        id: 'deal',
        label: 'Ask what it gets me',
        effects: [
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { flag: 'cp_prison_good_conduct', inc: 1 }, { log: 'She promised a good word in my file. I gave her a description vague enough to fit half the block.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -4 }, { flag: 'cp_prison_infraction', inc: 1 }, { log: 'She said bargaining with staff earns its own write-up. I left with nothing but a mark.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'jr_prison_card_artist',
    category: 'prison',
    title: 'Cards for the kids',
    text: "Word got out that I can draw. Now half the block wants birthday cards for their kids: a dinosaur, a princess, a truck with flames. They'll pay in soups, which is technically running a business.",
    minAge: 18,
    maxAge: 90,
    weight: 1,
    cooldown: 4,
    conditions: [...ADULT_INSIDE],
    choices: [
      {
        id: 'soups',
        label: 'Charge two soups a card',
        effects: [
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.3,
            then: [{ flag: 'cp_prison_infraction', inc: 1 }, { log: 'A guard found forty soups and a price list in my locker. Unauthorized business. Written up.', kind: 'bad' }],
            else: [{ log: 'I drew thirty cards and ate well all winter. Somewhere, thirty kids have a truck with flames.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'free',
        label: 'Draw them for free',
        effects: [
          { energy: -1 },
          { karma: 3 },
          { stat: 'happiness', delta: 3 },
          { flag: 'cp_prison_good_conduct', inc: 1 },
          { log: 'I drew the cards for free. A counselor saw one and wrote "positive influence" in my file.', kind: 'good' },
        ],
      },
      {
        id: 'no',
        label: 'Keep my pencils to myself',
        effects: [{ stat: 'happiness', delta: -2 }, { log: 'I said I was out of practice. Nobody believed me, and the block stopped saying hello.', kind: 'info' }],
      },
    ],
  },

  // ───────────────────────────────── juvenile detention, again ─────────────────────────────────
  // jr_juvie_count opens in any stay. Its choices queue jr_juvie_again, which opens only on a second stay (the
  // released flag) and is skipped otherwise; jr_juvie_again queues the teacher or the caseworker in turn.
  {
    id: 'jr_juvie_count',
    category: 'prison',
    title: 'Count',
    text: 'Nightly count: everyone stands on a painted line outside their doors while the supervisor ticks names off a clipboard. The kid beside me whispered a joke, and the supervisor looked straight at me.',
    minAge: 12,
    maxAge: 17,
    weight: 2,
    cooldown: 1,
    conditions: [...IN_DETENTION],
    choices: [
      {
        id: 'still',
        label: 'Stand like a statue',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I stood so still I forgot to breathe. The supervisor moved on. The joke was not worth it.', kind: 'info' }, { queue: 'jr_juvie_again' }],
      },
      {
        id: 'laugh',
        label: 'Laugh anyway',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I laughed. So did half the line. The supervisor sighed and kept counting.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -3 }, { flag: 'jd_write_up', inc: 1 }, { log: 'I laughed, and only I got written up. The kid who told the joke studied the ceiling.', kind: 'bad' }],
          },
          { queue: 'jr_juvie_again' },
        ],
      },
      {
        id: 'shush',
        label: 'Shush the joker',
        effects: [
          { karma: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'I shushed the joker. The supervisor gave me a tiny nod, which in here is basically a medal.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I shushed the joker. Now everyone on the unit calls me Deputy.', kind: 'bad' }],
          },
          { queue: 'jr_juvie_again' },
        ],
      },
    ],
  },
  {
    id: 'jr_juvie_again',
    category: 'prison',
    title: 'Again',
    text: "After count, the supervisor waved me over. \"I remember you,\" he said, flipping back through the clipboard as if my last stay were written on it. \"I was hoping I wouldn't.\"",
    minAge: 12,
    maxAge: 17,
    weight: 1,
    followUpOnly: true,
    conditions: [...JUVIE_AGAIN, { eventNotFired: 'jr_juvie_again' }],
    choices: [
      {
        id: 'joke',
        label: 'Say I missed the food',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'He almost laughed. Almost. In here, almost counts as a warm welcome.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -3 }, { flag: 'jd_write_up', inc: 1 }, { log: 'He didn\'t laugh. He wrote "attitude" next to my name, and my caseworker read it.', kind: 'bad' }],
          },
          { queue: 'jr_juvie_caseworker' },
        ],
      },
      {
        id: 'quiet',
        label: 'Say nothing',
        effects: [{ stat: 'happiness', delta: -2 }, { log: 'I said nothing and went back to my room. I knew the way. That was the worst part.', kind: 'info' }, { queue: 'jr_juvie_okafor' }],
      },
      {
        id: 'promise',
        label: "Promise it's the last time",
        effects: [{ karma: 1 }, { stat: 'happiness', delta: 1 }, { log: "I said this was the last time. He said he hears that every week, and hoped I'd mean it.", kind: 'info' }, { queue: 'jr_juvie_caseworker' }],
      },
    ],
  },
  {
    id: 'jr_juvie_okafor',
    category: 'prison',
    title: 'Mr. Okafor, again',
    text: "In class the next morning, Mr. Okafor, my teacher from last time, looked up from the attendance sheet and put his pen down. \"I hoped I'd never see you in this room again,\" he said, and handed me a textbook.",
    minAge: 12,
    maxAge: 17,
    weight: 1,
    followUpOnly: true,
    conditions: [...JUVIE_AGAIN, { enrolled: true }, { eventNotFired: 'jr_juvie_okafor' }],
    choices: [
      {
        id: 'work',
        label: 'Work harder this time',
        effects: [{ energy: -1 }, { grade: 8 }, { stat: 'happiness', delta: 2 }, { log: "I did every assignment, early. Mr. Okafor didn't say anything. He didn't have to.", kind: 'good' }],
      },
      {
        id: 'sorry',
        label: "Tell him I'm sorry",
        effects: [{ grade: 2 }, { karma: 1 }, { stat: 'happiness', delta: 3 }, { log: 'I said sorry. Mr. Okafor said to save it for the person I would be at twenty-five.', kind: 'good' }],
      },
      {
        id: 'back',
        label: 'Sit in the back row',
        effects: [{ grade: -4 }, { stat: 'happiness', delta: -1 }, { log: 'I took the seat in the back by the window. Mr. Okafor kept calling on me anyway. He never stopped.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'jr_juvie_caseworker',
    category: 'prison',
    title: 'The report she wrote',
    text: "My caseworker brought my old file to our first meeting. On the last page of my last report, in her handwriting: \"Low risk of returning.\" She didn't say anything. She just let me read it.",
    minAge: 12,
    maxAge: 17,
    weight: 1,
    followUpOnly: true,
    conditions: [...JUVIE_AGAIN, { eventNotFired: 'jr_juvie_caseworker' }],
    choices: [
      {
        id: 'sorry',
        label: 'Apologize to her',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: 2 }, { log: "I said I was sorry. She said the report wasn't wrong about me, just early. We started a new one.", kind: 'good' }],
      },
      {
        id: 'explain',
        label: 'Explain what went wrong',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 3 }, { log: 'I told her what went wrong after I got out, step by step. She turned it into a plan for next time.', kind: 'good' }],
      },
      {
        id: 'angry',
        label: 'Tell her she was wrong',
        effects: [{ stat: 'happiness', delta: -3 }, { flag: 'jd_write_up', inc: 1 }, { log: 'I said her report was garbage and so was this place. She wrote one word in the new file.', kind: 'bad' }],
      },
    ],
  },
];

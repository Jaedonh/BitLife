import { ASSETS } from '@/data/assets';
import type { Condition, EventDef, PersonSelector } from '@/engine/events/schema';

/**
 * Ages 25-64, the grown-up middle of a life: proposing, planning a wedding and
 * the day itself, sharing a home, the long tail of a divorce, losing a spouse,
 * raising a baby or toddler, grown children who come back or go quiet, single
 * and childless life, and the bills that come with owning a home or a car.
 *
 * The wedding chain is queued, never random: gu_ring_in_pocket (a yes) queues
 * gu_wedding_planning with the same partner, and every plan queues
 * gu_wedding_day. lf_engaged is never cleared on a breakup or when the
 * Propose action marries the couple, so a random card gated on it would
 * usually bind a different partner from the one who said yes.
 * Follow-ups (followUpOnly) are queued by the events that set them up.
 */

/** Real cars: the 'car' asset kind also covers the bicycle and the scooter. */
const REAL_CARS = ['old_hatchback', 'sedan', 'pickup', 'ev', 'luxury_sedan', 'sports_car', 'supercar', 'classic_car'];
/** Real cars with an engine, oil and a gas cap (not the electric car). */
const FUEL_CARS = REAL_CARS.filter((id) => id !== 'ev');
/** Homes with a roof of their own (not a studio, condo or penthouse in a block). */
const ROOFED_HOMES = ['townhouse', 'suburban', 'farmhouse', 'beach_house', 'mansion'];
/**
 * Living under a roof of my own, not just owning one. I live in my primary house (the first one bought, or the next
 * once it is sold, never rented out) and may rent out another, but conditions only see what I own: so every house I
 * own must have its own roof, and then the one I live in does too.
 */
const LIVES_UNDER_OWN_ROOF: Condition[] = [
  { ownsAssetId: ROOFED_HOMES },
  { not: { ownsAssetId: ASSETS.filter((a) => a.kind === 'house' && !ROOFED_HOMES.includes(a.id)).map((a) => a.id) } },
];
/**
 * Widowhood cards grieve the one marriage of the life: one wedding and no spouse now, so the late spouse they bind
 * is the person I married and nobody since (never a first husband after a second wedding, or a second widowhood).
 */
const WIDOWED: Condition[] = [{ married: false }, { count: 'marriages', eq: 1 }];
/**
 * The first months after the loss (the casseroles, the voicemail greeting, the ring I still wear, the closet): within
 * the grief window, the year of the loss and the next (GAME_DESIGN §10), never decades later. Weighted up, as a
 * short window.
 */
const NEWLY_WIDOWED: Condition[] = [...WIDOWED, { flag: 'grieving' }];
/**
 * The late spouse those first months are about: one who died within the grief window (the year of the loss and the
 * next). The `grieving` flag alone would also hold after a later partner's death, years after the spouse's.
 */
const LATE_SPOUSE_JUST_LOST: PersonSelector = { kind: ['spouse'], alive: false, diedWithin: 1 };

export const GROWN_UP_LIFE_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ the wedding chain
  {
    id: 'gu_ring_in_pocket',
    category: 'romance',
    title: 'The ring in my pocket',
    text: 'I have carried a ring in my pocket for three weeks, waiting for the perfect moment with {{person}}. Every time I reach for my keys, my heart stops.',
    minAge: 22,
    maxAge: 55,
    weight: 1.2,
    cooldown: 5,
    // gu_wed: gu_wedding_day logs a wedding but no effect can turn the partner into a spouse yet, so
    // without this guard the card would offer to propose to someone I already married.
    conditions: [{ married: false }, { not: { flag: 'lf_engaged', eq: true } }, { not: { flag: 'gu_wed', eq: true } }],
    person: { kind: ['lover'], minRelationship: 55 },
    choices: [
      {
        id: 'dinner',
        label: 'Propose at dinner tonight',
        effects: [
          {
            chance: 0.75,
            then: [
              { flag: 'lf_engaged', set: true },
              { flag: 'gu_i_proposed', set: true },
              { love: 12 },
              { relationship: 'person', delta: 8 },
              { stat: 'happiness', delta: 10 },
              { log: 'I knelt between the main course and dessert. {{person}} said yes before I finished. Engaged!', kind: 'milestone' },
              { queue: 'gu_wedding_planning' },
            ],
            else: [{ love: -8 }, { stat: 'happiness', delta: -8 }, { log: '{{person}} said {{they}} was not ready. We finished dessert in a silence I can still hear.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'place',
        label: 'Propose somewhere that matters',
        effects: [
          { energy: -1 },
          {
            chance: 0.8,
            then: [
              { flag: 'lf_engaged', set: true },
              { flag: 'gu_i_proposed', set: true },
              { love: 15 },
              { relationship: 'person', delta: 10 },
              { stat: 'happiness', delta: 10 },
              { log: 'I took {{person}} back to where we first met and asked. {{They}} laughed, cried and said yes.', kind: 'milestone' },
              { queue: 'gu_wedding_planning' },
            ],
            else: [{ love: -10 }, { stat: 'happiness', delta: -10 }, { log: 'I asked where we first met. {{person}} said no, kindly. The way home was very long.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'wait',
        label: 'Wait for a better moment',
        effects: [{ stat: 'happiness', delta: -2 }, { log: 'The ring stays in my pocket. The perfect moment, I am learning, is a myth.' }],
      },
      {
        id: 'return',
        label: 'Take the ring back',
        effects: [{ money: 300 }, { love: -3 }, { stat: 'happiness', delta: -3 }, { log: 'The store kept a fat restocking fee and gave me {{$300}}. Maybe I was less sure than my pocket.', kind: 'money' }],
      },
    ],
  },
  {
    id: 'gu_wedding_planning',
    category: 'romance',
    title: 'Planning the wedding',
    text: '{{person}} and I are engaged, and the wedding has become a second job. There are spreadsheets, a guest list that keeps growing, and three of {{their}} relatives who each expect to give a speech.',
    minAge: 22,
    maxAge: 64,
    weight: 1,
    followUpOnly: true,
    conditions: [{ flag: 'lf_engaged', eq: true }, { married: false }],
    person: { kind: ['lover'] },
    choices: [
      {
        id: 'big',
        label: 'Go big',
        hint: '{{$9000}}',
        effects: [
          { money: -9000 },
          { love: 6 },
          { relationship: 'person', delta: 4 },
          { relationship: 'mother', delta: 3 },
          { relationship: 'father', delta: 3 },
          { stat: 'happiness', delta: 5 },
          { stat: 'health', delta: -2 },
          { log: 'We booked a hall, a band and a cake with four tiers. My savings now have one.', kind: 'money' },
          { queue: 'gu_wedding_day' },
        ],
      },
      {
        id: 'small',
        label: 'Keep it small',
        hint: '{{$2500}}',
        effects: [
          { money: -2500 },
          { love: 4 },
          { stat: 'happiness', delta: 3 },
          { log: 'Thirty guests, a rented garden and folding chairs. Even the guest list fights were small.' },
          // Their aunt, not mine: a foster child (the orphan scenario) has no aunts in the life.
          { chance: 0.3, then: [{ stat: 'happiness', delta: -2 }, { log: "{{person}}'s aunt did not make the thirty and has stopped returning our calls.", kind: 'bad' }] },
          { queue: 'gu_wedding_day' },
        ],
      },
      {
        id: 'courthouse',
        label: 'Courthouse, then tacos',
        hint: '{{$200}}',
        effects: [
          { money: -200 },
          {
            chance: 0.6,
            then: [{ love: 6 }, { stat: 'happiness', delta: 4 }, { log: '{{They}} loved the plan: a courthouse appointment, two witnesses, a taco truck after.', kind: 'good' }],
            else: [{ love: -6 }, { stat: 'happiness', delta: 1 }, { log: '{{They}} agreed, quietly. I think {{they}} had pictured something with a cake.' }],
          },
          { queue: 'gu_wedding_day' },
        ],
      },
      {
        id: 'elope',
        label: 'Run off and elope',
        hint: '{{$2500}}',
        effects: [
          { money: -2500 },
          { love: 8 },
          { stat: 'happiness', delta: 5 },
          { relationship: 'mother', delta: -4 },
          { relationship: 'father', delta: -4 },
          { log: 'We booked a trip for two and told nobody. Our families will find out from a postcard.' },
          { queue: 'gu_wedding_day' },
        ],
      },
    ],
  },
  {
    id: 'gu_wedding_day',
    category: 'romance',
    title: 'The wedding day',
    text: 'Our wedding day. I woke at dawn with my heart going like a drum. {{person}} called before seven with one question: "Are we really doing this?" We are.',
    minAge: 22,
    maxAge: 64,
    weight: 1,
    followUpOnly: true,
    conditions: [{ flag: 'lf_engaged', eq: true }, { married: false }],
    person: { kind: ['lover'] },
    choices: [
      {
        id: 'written',
        label: 'Read the vows I wrote',
        effects: [
          { love: 8 },
          { relationship: 'person', delta: 6 },
          { stat: 'happiness', delta: 8 },
          { flag: 'lf_engaged', set: false },
          { marry: true }, { flag: 'gu_wed', set: true }, { flag: 'gu_i_proposed', set: false },
          { log: 'I read my vows with shaking hands. By line two {{person}} was crying, and so was the officiant.', kind: 'milestone' },
        ],
      },
      {
        id: 'heart',
        label: 'Speak from the heart',
        effects: [
          { flag: 'lf_engaged', set: false },
          { marry: true }, { flag: 'gu_wed', set: true }, { flag: 'gu_i_proposed', set: false },
          {
            chance: 0.6,
            then: [{ love: 12 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 12 }, { log: 'I lost my notes and said what was true. The best thing I have ever said, and the shortest.', kind: 'milestone' }],
            else: [{ love: 3 }, { stat: 'happiness', delta: 4 }, { log: 'I improvised and somehow mentioned my dentist. {{person}} laughed and married me anyway.', kind: 'milestone' }],
          },
        ],
      },
      {
        id: 'short',
        label: "Say 'I do', then party",
        effects: [
          { love: 4 },
          { stat: 'happiness', delta: 11 },
          { stat: 'health', delta: -2 },
          { flag: 'lf_engaged', set: false },
          { marry: true }, { flag: 'gu_wed', set: true }, { flag: 'gu_i_proposed', set: false },
          { log: 'Two words, one kiss, done before anyone found a tissue. Then we danced until the lights came on.', kind: 'milestone' },
        ],
      },
      {
        id: 'minute',
        label: 'Ask for five minutes alone',
        effects: [
          { flag: 'lf_engaged', set: false },
          {
            chance: 0.8,
            then: [{ love: 10 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 10 }, { marry: true }, { flag: 'gu_wed', set: true }, { flag: 'gu_i_proposed', set: false }, { log: 'Five minutes on a fire escape, one deep breath, and I walked back in sure. We said our vows.', kind: 'milestone' }],
            else: [
              { relationship: 'person', delta: -25 },
              { removePerson: true },
              { stat: 'happiness', delta: -12 },
              { karma: -2 },
              { log: 'Five minutes became an hour. I could not go back in. The wedding ended in the parking lot.', kind: 'bad' },
              { queue: 'gu_ring_in_drawer' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'gu_ring_in_drawer',
    category: 'romance',
    title: 'The ring',
    text: 'A week after the wedding that did not happen, the engagement ring is back in its box on my dresser. Every morning it is the first thing I see.',
    minAge: 22,
    maxAge: 64,
    weight: 1,
    followUpOnly: true,
    conditions: [{ married: false }],
    person: { kind: ['ex'] },
    choices: [
      {
        id: 'mail',
        label: 'Mail it back to {{them}}',
        conditions: [{ not: { flag: 'gu_i_proposed', eq: true } }],
        effects: [{ flag: 'gu_i_proposed', set: false }, { karma: 2 }, { relationship: 'person', delta: 5 }, { stat: 'happiness', delta: -2 }, { log: 'I mailed it back with a short note. {{They}} did not reply. I did not expect {{them}} to.' }],
      },
      {
        id: 'sell',
        label: 'Sell it',
        effects: [{ flag: 'gu_i_proposed', set: false }, { money: 900 }, { stat: 'happiness', delta: -2 }, { log: 'A jeweler weighed it, frowned, and gave me {{$900}}. Smaller than the promise.', kind: 'money' }],
      },
      {
        id: 'drawer',
        label: 'Put it in a drawer',
        effects: [{ flag: 'gu_i_proposed', set: false }, { stat: 'happiness', delta: -1 }, { log: 'I put the box at the back of a drawer. Some things are allowed to just sit there.' }],
      },
      {
        id: 'donate',
        label: 'Drop it in a charity box',
        effects: [{ flag: 'gu_i_proposed', set: false }, { karma: 3 }, { stat: 'happiness', delta: -3 }, { log: 'Into the charity box it went. Somebody will get a better ending out of it.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'gu_living_together',
    category: 'romance',
    title: 'Shared space',
    text: 'Living with {{person}} has taught me things dating never did. {{They}} owns forty mugs, hums while brushing {{their}} teeth, and believes a wet towel on the bed is a lifestyle.',
    minAge: 20,
    maxAge: 64,
    weight: 2,
    once: true,
    // A spouse shares my home anyway. lf_living_together now goes with the partner who leaves or dies, but an older
    // save may still hold it from a partner a card removed; so a lover only counts when I have no ex at all, and
    // the lover is the one I moved in with.
    conditions: [{ flag: 'lf_living_together' }, { any: [{ married: true }, { noPerson: ['ex'] }] }],
    person: { kind: ['lover', 'spouse'] },
    choices: [
      {
        id: 'rules',
        label: 'Have the house-rules talk',
        effects: [
          {
            chance: 0.6,
            then: [{ love: 4 }, { stat: 'happiness', delta: 3 }, { log: 'We wrote rules on the fridge. Towels on hooks, mugs on a diet. Peace, mostly.', kind: 'good' }],
            else: [{ love: -4 }, { stat: 'happiness', delta: -2 }, { log: 'The rules talk became a fight about my sock piles. Fair, but still.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'let',
        label: 'Let it all go',
        effects: [{ love: 2 }, { karma: 1 }, { stat: 'happiness', delta: -2 }, { log: 'I hang up the towel every morning and say nothing. Love is also laundry.' }],
      },
      {
        id: 'chaos',
        label: 'Match {{their}} chaos',
        effects: [{ love: 2 }, { stat: 'happiness', delta: 3 }, { stat: 'health', delta: -1 }, { log: 'I stopped folding anything. We now live like two raccoons in love.' }],
      },
      {
        id: 'bigger',
        label: 'Rent a bigger place',
        hint: '{{$1500}}',
        conditions: [{ noAsset: 'house' }],
        effects: [{ money: -1500 }, { love: 5 }, { stat: 'happiness', delta: 2 }, { log: 'We moved somewhere with two closets. The mugs got a cabinet of their own.', kind: 'money' }],
      },
    ],
  },

  // ------------------------------------------------------------ after a divorce
  {
    id: 'gu_friend_custody',
    category: 'friends',
    title: 'Friend custody',
    text: 'Since the divorce, {{person}} has carefully invited me and my ex to different things. This week {{they}} slipped and invited us both to the same birthday dinner. Neither of us has said no yet.',
    minAge: 25,
    maxAge: 64,
    weight: 1.5,
    cooldown: 10,
    conditions: [{ count: 'divorces', gte: 1 }, { hasPerson: ['ex'] }],
    person: { kind: ['friend', 'bestFriend'], minRelationship: 30 },
    choices: [
      {
        id: 'go',
        label: 'Go and be gracious',
        effects: [
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 4 }, { log: 'We sat at opposite ends and were perfectly civil. {{person}} hugged me twice.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'Civil lasted until dessert. Then someone mentioned the house.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Bow out politely',
        effects: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -1 }, { log: 'I sent a gift and an excuse. In the photos, everyone looked fine without me. Rude.' }],
      },
      {
        id: 'choose',
        label: 'Ask {{them}} to pick a side',
        effects: [
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 3 }, { log: '{{They}} picked me, a little too quickly. I did not ask why.' }],
            else: [{ relationship: 'person', delta: -10 }, { stat: 'happiness', delta: -5 }, { log: '{{They}} picked my ex. I asked, so I can hardly complain. I complain anyway.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'host',
        label: 'Host a rival dinner',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          { karma: -1 },
          { relationship: 'person', delta: -4 },
          { stat: 'happiness', delta: 4 },
          { log: 'I threw a dinner the same night. Half the guest list came to mine. Petty and delicious.' },
        ],
      },
    ],
  },
  {
    id: 'gu_holidays_rearranged',
    category: 'holiday',
    title: 'Holidays, rearranged',
    text: 'The holidays came around again. Since the divorce they run on a new calendar: no in-laws, no shared plans, nobody to argue with about the stuffing. Some years that is freedom. This year it is just quiet.',
    minAge: 25,
    maxAge: 64,
    weight: 1.5,
    cooldown: 5,
    conditions: [{ count: 'divorces', gte: 1 }, { married: false }, { hasLover: false }],
    choices: [
      {
        id: 'volunteer',
        label: 'Serve dinner at a shelter',
        effects: [{ karma: 4 }, { stat: 'happiness', delta: 3 }, { energy: -1 }, { log: 'I served four hundred plates at the shelter. Nobody had time to be lonely, including me.', kind: 'good' }],
      },
      {
        id: 'friends',
        label: "Join a friend's chaos",
        conditions: [{ hasPerson: ['friend', 'bestFriend'] }],
        effects: [{ relationship: 'friend', delta: 2 }, { relationship: 'bestFriend', delta: 2 }, { stat: 'happiness', delta: 4 }, { log: "A friend's table: nine kids, two dogs, one gravy fire. I laughed until I cried.", kind: 'good' }],
      },
      {
        id: 'family',
        label: 'Go home to family',
        conditions: [{ hasPerson: ['mother', 'father', 'sibling'] }],
        effects: [
          { relationship: 'mother', delta: 3 },
          { relationship: 'father', delta: 3 },
          { relationship: 'sibling', delta: 2 },
          { stat: 'happiness', delta: 2 },
          { log: 'I went home. Nobody asked about the divorce, and somebody kept refilling my plate.' },
        ],
      },
      {
        id: 'solo',
        label: 'Make the day my own',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'A long walk, a movie, a meal I liked. I may do this on purpose next year.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'By evening the quiet got loud. I called three people just to hear voices.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gu_handoff',
    category: 'family',
    title: 'The handoff',
    text: 'Every other Friday I hand {{person}} over in a gas station parking lot, halfway between my place and {{their}} other home. Tonight {{they}} asked why we cannot all just live in one house.',
    minAge: 25,
    maxAge: 64,
    weight: 1.5,
    cooldown: 4,
    // No partner at all: a child born to a current lover lives with both of us, not in two homes.
    conditions: [{ count: 'divorces', gte: 1 }, { hasPerson: ['ex'] }, { hasLover: false }],
    person: { kind: ['child'], minAge: 4, maxAge: 12 },
    choices: [
      {
        id: 'explain',
        label: 'Explain it gently',
        effects: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: -2 }, { log: 'I said some families do better in two houses. {{They}} thought about it and asked for fries.' }],
      },
      {
        id: 'treat',
        label: 'Change the subject to ice cream',
        hint: '{{$10}}',
        effects: [
          { money: -10 },
          { relationship: 'person', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { log: '{{They}} asked again halfway through the cone. Ice cream only delays these things.' },
        ],
      },
      {
        id: 'together',
        label: 'Talk to {{their}} other parent',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 4 }, { log: 'We sat {{person}} down together and told the same story for once. It helped.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'We tried to talk and ended up arguing about a lamp from years ago.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'counselor',
        label: 'Find a family counselor',
        hint: '{{$600}}',
        effects: [{ money: -600 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 2 }, { log: 'A counselor with a box of puppets got further in an hour than I had in a year.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'gu_ex_moved_on',
    category: 'romance',
    title: 'Properly happy',
    text: 'At the farmers market I turned a corner and there was {{person}}, holding hands with someone new and laughing the laugh I used to get. {{They}} looked happy. Properly, annoyingly happy.',
    minAge: 25,
    maxAge: 64,
    weight: 1,
    once: true,
    // A pang over an ex's new partner waits out the grief window (GAME_DESIGN §10), as later_life's ll_old_flame does.
    conditions: [{ flag: 'grieving', exists: false }],
    person: { kind: ['ex'], minAge: 22 },
    choices: [
      {
        id: 'hello',
        label: 'Say hello and mean it',
        effects: [
          { karma: 3 },
          {
            chance: 0.55,
            then: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 4 }, { log: 'I said hello and we were kind to each other. I walked home lighter than I expected.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'I said hello and my voice did a thing. I bought a lot of peaches to recover.' }],
          },
        ],
      },
      {
        id: 'hide',
        label: 'Hide behind the peaches',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I studied a crate of peaches for six minutes until the coast was clear. Very good peaches.' }],
      },
      {
        id: 'study',
        label: 'Size up the new partner',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -5 }, { log: 'The new partner is tall, kind to dogs and good at parking. I hate it here.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 3 }, { log: 'The new partner wore socks with sandals. I feel fine about everything now.' }],
          },
        ],
      },
      {
        id: 'call',
        label: 'Call a friend about it',
        conditions: [{ hasPerson: ['friend', 'bestFriend'] }],
        effects: [{ energy: -1 }, { relationship: 'bestFriend', delta: 2 }, { relationship: 'friend', delta: 2 }, { stat: 'happiness', delta: 3 }, { log: 'A friend listened for an hour and called {{person}} several names I will treasure.' }],
      },
    ],
  },
  {
    id: 'gu_ex_still_logged_in',
    category: 'random',
    title: 'Still logged in',
    text: 'Long after we split, {{person}} is still logged into my streaming account. I can see everything {{they}} watches. Lately it is mostly documentaries about people who start over.',
    minAge: 25,
    maxAge: 64,
    weight: 1,
    once: true,
    // A streaming account with profiles.
    conditions: [{ year: { gte: 2013 } }],
    person: { kind: ['ex'], minAge: 22 },
    choices: [
      {
        id: 'password',
        label: 'Change the password',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I changed the password. It felt like closing a door I should have closed ages ago.' }],
      },
      {
        id: 'leave',
        label: 'Leave it be',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: -1 }, { log: 'I left it. Somewhere, {{person}} is watching a man build a cabin, on my account.' }],
      },
      {
        id: 'rename',
        label: "Rename {{their}} profile 'Get Your Own'",
        effects: [
          { karma: -1 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: -5 }, { log: 'The profile vanished within the hour. Message received.' }],
            else: [{ log: "{{They}} renamed it 'No'. We are, apparently, still doing this." }],
          },
        ],
      },
      {
        id: 'note',
        label: 'Send {{them}} a friendly note',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 3 }, { log: 'I sent a note and a show I thought {{they}} would like. {{They}} sent one back. Oddly nice.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -2 }, { log: 'My note got a thumbs-up and a logout. Fair enough.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gu_wedding_album',
    category: 'family',
    title: 'The wedding album',
    text: 'Clearing out a closet, I found our old wedding album, the heavy kind with tissue paper between the pages. Everyone in it looks so certain, me most of all.',
    minAge: 25,
    maxAge: 64,
    weight: 1,
    once: true,
    conditions: [{ count: 'divorces', gte: 1 }, { married: false }],
    choices: [
      {
        id: 'shelf',
        label: 'Put it back on the shelf',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I put it back. It is part of the story, even the parts that did not last.' }],
      },
      {
        id: 'kids',
        label: 'Save it for the family',
        conditions: [{ hasChildren: true }],
        effects: [{ relationship: 'child', delta: 2 }, { karma: 1 }, { log: 'I boxed it up for the family. One day someone will ask, and I will tell the good parts.' }],
      },
      {
        id: 'toss',
        label: 'Throw it out',
        effects: [
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -6 }, { log: 'I regretted it by Tuesday. The garbage truck had come on Monday.', kind: 'bad' }],
            else: [{ log: 'Out it went. The tissue paper fluttered a little, theatrically.' }],
          },
        ],
      },
      {
        id: 'look',
        label: 'Look through it one last time',
        effects: [{ energy: -1 }, { stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 1 }, { log: 'I turned every page and cried at the cake, of all things. Then I felt better.' }],
      },
    ],
  },

  // ------------------------------------------------------------ losing a spouse
  {
    id: 'gu_widowed_casseroles',
    category: 'family',
    title: 'After the casseroles',
    text: 'Everyone was kind when {{person}} died. The casseroles came, the cards came, and then, slowly, everyone went back to their own lives. Which is fair, and which leaves me an evening every evening.',
    minAge: 25,
    maxAge: 64,
    weight: 3,
    once: true,
    conditions: [...NEWLY_WIDOWED, { hasLover: false }],
    person: LATE_SPOUSE_JUST_LOST,
    choices: [
      {
        id: 'group',
        label: 'Try a grief group',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 3 },
          { stat: 'health', delta: 1 },
          { log: 'The grief group meets Thursdays in a church basement. It helps more than I wanted it to.', kind: 'good' },
          { chance: 0.5, then: [{ newPerson: { kind: 'friend', relationship: 50, log: 'At the grief group I met {{person}}, who brings bad coffee and good jokes.' } }] },
        ],
      },
      {
        id: 'work',
        label: 'Bury myself in work',
        conditions: [{ hasJob: true }],
        effects: [{ jobPerformance: 6 }, { stat: 'happiness', delta: -3 }, { stat: 'health', delta: -2 }, { log: 'I worked late every night. My numbers improved. Nothing else did.' }],
      },
      {
        id: 'family',
        label: 'Lean on my family',
        conditions: [{ hasPerson: ['child', 'sibling', 'mother', 'father'] }],
        effects: [
          { relationship: 'child', delta: 3 },
          { relationship: 'sibling', delta: 3 },
          { relationship: 'mother', delta: 2 },
          { relationship: 'father', delta: 2 },
          { stat: 'happiness', delta: 3 },
          { log: 'I said yes to every invitation from family. Some weeks that was all that held me up.', kind: 'good' },
        ],
      },
      {
        id: 'alone',
        label: 'Let myself fall apart',
        effects: [
          { stat: 'health', delta: -3 },
          { log: 'I stopped answering the door for a while. The grief needed room, so I gave it the whole place.' },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'When I came out of it, something in me was steadier than before.' }],
            else: [{ stat: 'happiness', delta: -6 }, { log: 'It took a long time to open the curtains again.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gu_widowed_closet',
    category: 'family',
    title: 'The closet',
    text: "{{person}}'s side of the closet is exactly as {{they}} left it, down to the shoes. I keep telling people I will deal with it soon, and I keep meaning it.",
    minAge: 25,
    maxAge: 64,
    weight: 3,
    once: true,
    // golden_years' gy_widow_closet is the same closet, later in life: one per life (it guards against this one too).
    conditions: [...NEWLY_WIDOWED, { hasLover: false }, { eventNotFired: 'gy_widow_closet' }],
    person: LATE_SPOUSE_JUST_LOST,
    choices: [
      {
        id: 'donate',
        label: 'Donate most of it',
        effects: [{ karma: 4 }, { stat: 'happiness', delta: -3 }, { log: 'I gave almost everything to a shelter. I hope whoever got {{their}} good jacket stands up straight.', kind: 'good' }],
      },
      {
        id: 'one',
        label: 'Keep one sweater, give the rest',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I gave the rest away and kept one sweater. I wear it when the house is too quiet.' }],
      },
      {
        id: 'help',
        label: 'Ask family to help',
        conditions: [{ hasPerson: ['child', 'sibling'] }],
        effects: [
          { energy: -1 },
          { relationship: 'child', delta: 4 },
          { relationship: 'sibling', delta: 4 },
          { stat: 'happiness', delta: 2 },
          { log: "We sorted it together, laughing at {{their}} terrible taste in hats. A better day than I feared.", kind: 'good' },
        ],
      },
      {
        id: 'notyet',
        label: 'Not yet',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'health', delta: -1 }, { log: 'I closed the closet door again. Some nights I open it just to breathe in. Not yet.' }],
      },
    ],
  },
  {
    id: 'gu_widowed_old_number',
    category: 'family',
    title: 'The old number',
    text: "The phone company wrote: {{person}}'s old number will go to someone new unless I keep paying for it. I still call it sometimes, just to hear {{their}} voicemail greeting.",
    minAge: 25,
    maxAge: 64,
    weight: 3,
    once: true,
    conditions: [...NEWLY_WIDOWED, { hasLover: false }],
    person: LATE_SPOUSE_JUST_LOST,
    choices: [
      {
        id: 'pay',
        label: 'Keep paying for it',
        hint: '{{$240}} a year',
        effects: [{ money: -240 }, { stat: 'happiness', delta: 2 }, { log: 'I kept the line. {{$20}} a month for eleven seconds of {{their}} voice. A bargain.' }],
      },
      {
        id: 'record',
        label: 'Record it, then let go',
        effects: [{ stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: 1 }, { log: "A neighbor's kid helped me save the greeting. I have it forever, and the number went free." }],
      },
      {
        id: 'release',
        label: 'Let the number go',
        effects: [{ stat: 'happiness', delta: -2 }, { karma: 2 }, { log: 'I let it go. Someone else has that number now. I hope they get good calls.' }],
      },
    ],
  },
  {
    id: 'gu_widowed_dinner_invite',
    category: 'romance',
    title: 'A dinner invitation',
    text: 'A friend of a friend asked me to dinner, clearly meaning a date. I said I would think about it, then sat on a park bench thinking about {{person}} and what {{they}} would say. {{They}} would say go.',
    minAge: 30,
    maxAge: 64,
    weight: 1,
    once: true,
    // A date: not in the first two years after the loss (the grief window, GAME_DESIGN §10), and one per life with
    // golden_years' gy_widow_dinner_invite, the same invitation later in life (it guards against this one too).
    conditions: [...WIDOWED, { hasLover: false }, { flag: 'grieving', exists: false }, { eventNotFired: 'gy_widow_dinner_invite' }],
    person: { kind: ['spouse'], alive: false },
    choices: [
      {
        id: 'go',
        label: 'Go to dinner',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { newPerson: { kind: 'lover', relationship: 55, log: 'Dinner with {{person}} ran three hours. I laughed, felt guilty, then laughed again.' } }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The dinner was pleasant. Afterward I sat in the car and cried, which I had not planned.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'coffee',
        label: 'Suggest coffee as friends',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.7,
            then: [{ newPerson: { kind: 'friend', relationship: 50, log: 'Coffee as friends, no pressure. {{person}} and I have met every week since.' } }],
            else: [{ log: 'We had coffee as friends. It was pleasant, and we never quite arranged a second.' }],
          },
        ],
      },
      {
        id: 'notready',
        label: 'Say I am not ready',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I said not yet. {{person}} would have rolled {{their}} eyes at me, gently.' }],
      },
    ],
  },
  {
    id: 'gu_widowed_ring',
    category: 'family',
    title: 'My other half',
    text: 'A new coworker at {{company}} noticed my wedding ring and asked, brightly, what my other half does. I still wear it. I had not prepared for the question.',
    minAge: 25,
    maxAge: 64,
    weight: 3,
    once: true,
    conditions: [{ hasJob: true }, ...NEWLY_WIDOWED, { hasLover: false }],
    person: LATE_SPOUSE_JUST_LOST,
    choices: [
      {
        id: 'truth',
        label: 'Tell the truth',
        effects: [{ stat: 'happiness', delta: -2 }, { karma: 1 }, { log: 'I said {{person}} died. The coworker went pale, then brought me a muffin every Friday after.' }],
      },
      {
        id: 'present',
        label: 'Talk about {{them}} anyway',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I talked about {{person}} for ten minutes, all the good parts. It was nice to say them out loud.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'I talked about {{person}} until I had to explain, and then I cried in the supply closet.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'dodge',
        label: 'Change the subject',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I asked about the weather. The coworker, thankfully, had a lot to say about the weather.' }],
      },
      {
        id: 'off',
        label: 'Take the ring off tonight',
        effects: [
          { log: 'That night I took the ring off and put it in a dish by the bed. My hand felt very light.' },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'A week later, it felt right.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'Two days later it was back on. That is allowed too.' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ little ones (my baby or toddler)
  {
    id: 'gu_baby_three_am',
    category: 'family',
    title: 'Three in the morning',
    text: '{{person}} has decided that sleep is for other babies. It is three in the morning, I have sung every song I know twice, and {{they}} is wide awake and delighted about it.',
    minAge: 25,
    maxAge: 64,
    weight: 2,
    cooldown: 2,
    // Not within a few years of young_adult_paths' yp_baby_night_shift, the same wide-awake baby at 3 a.m.
    conditions: [{ not: { sinceEvent: 'yp_baby_night_shift', lte: 3 } }],
    person: { kind: ['child'], maxAge: 1 },
    choices: [
      {
        id: 'drive',
        label: 'Drive laps around the block',
        conditions: [{ ownsAssetId: REAL_CARS }],
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 2 }, { stat: 'health', delta: -1 }, { log: '{{They}} fell asleep at the second stop sign. I drove in circles until dawn, afraid to stop.' }],
      },
      {
        id: 'walk',
        label: 'Walk {{them}} up and down',
        effects: [{ relationship: 'person', delta: 4 }, { stat: 'health', delta: -2 }, { stat: 'happiness', delta: -1 }, { log: 'Four hundred laps of the hallway. {{They}} slept at five. I may never sleep again.' }],
      },
      {
        id: 'shift',
        label: 'Wake {{spouse}} for a shift',
        conditions: [{ married: true }],
        effects: [{ relationship: 'spouse', delta: -2 }, { stat: 'happiness', delta: 2 }, { stat: 'health', delta: 1 }, { log: 'I handed over the baby and slept three glorious hours. The debt will be collected.' }],
      },
      {
        id: 'fuss',
        label: 'Let {{them}} fuss a little',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { stat: 'health', delta: 2 }, { log: 'Ten minutes of protest, then silence. I stood outside the door, amazed.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -3 }, { log: 'Ten minutes became forty. We both cried. Nobody won.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gu_first_word_oops',
    category: 'family',
    title: 'Baby talk',
    text: '{{person}} said {{their}} first clear word today, at the grocery checkout, loudly and with feeling. It was the word I said on Tuesday when I dropped a can of beans on my foot.',
    minAge: 25,
    maxAge: 64,
    weight: 2,
    once: true,
    person: { kind: ['child'], minAge: 1, maxAge: 1 },
    choices: [
      {
        id: 'duck',
        label: "Insist it was 'duck'",
        effects: [{ karma: -1 }, { stat: 'happiness', delta: 3 }, { log: "I told the cashier it was 'duck'. {{person}} said it again. It was not duck." }],
      },
      {
        id: 'own',
        label: 'Own it with dignity',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I nodded at the cashier and paid. Somewhere, everyone who ever raised a toddler is laughing.' }],
      },
      {
        id: 'blame',
        label: 'Blame my partner',
        conditions: [{ hasLover: true }],
        effects: [{ karma: -2 }, { stat: 'happiness', delta: 4 }, { log: 'I told the cashier my partner taught {{them}} that word. My partner was standing right there.' }],
      },
      {
        id: 'laugh',
        label: 'Laugh out loud',
        effects: [
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 2 },
          { log: '{{person}} saw that the word got a laugh and has said it forty times since. Mostly in public.' },
          { chance: 0.4, then: [{ stat: 'happiness', delta: -3 }, { log: 'Including, memorably, at a funeral.', kind: 'bad' }] },
        ],
      },
    ],
  },
  {
    id: 'gu_daycare_bill',
    category: 'money',
    title: 'The daycare bill',
    text: 'The daycare with a spot for {{person}} sent its fees. I read the yearly total twice and sat down. All that, for a place where {{they}} will mostly nap and bite the other toddlers.',
    minAge: 25,
    maxAge: 64,
    weight: 1.5,
    cooldown: 3,
    // Not within a few years of young_adult_paths' yp_daycare_math, the same bill.
    conditions: [{ hasJob: true }, { not: { sinceEvent: 'yp_daycare_math', lte: 4 } }],
    person: { kind: ['child'], maxAge: 2 },
    choices: [
      {
        id: 'pay',
        label: 'Pay it and keep working',
        hint: '{{$4000}}',
        effects: [{ money: -4000 }, { jobPerformance: 2 }, { stat: 'happiness', delta: -1 }, { log: 'I paid. {{person}} loves it there. The bitten have filed no formal complaint.', kind: 'money' }],
      },
      {
        id: 'grandma',
        label: 'Ask {{mother}} to help',
        hint: '{{$300}} in thank-yous',
        conditions: [{ hasPerson: ['mother'] }],
        effects: [
          { money: -300 },
          { relationship: 'mother', delta: 4 },
          { stat: 'happiness', delta: 2 },
          { log: '{{mother}} takes {{person}} three days a week. {{mother}} has also taken over my kitchen.' },
          { chance: 0.4, then: [{ relationship: 'mother', delta: -5 }, { stat: 'happiness', delta: -3 }, { log: '{{mother}} has opinions about naps, snacks and me. All of them, daily.', kind: 'bad' }] },
        ],
      },
      {
        id: 'hours',
        label: 'Cut back my hours',
        conditions: [{ partTime: false }],
        effects: [{ money: -2000 }, { jobPerformance: -6 }, { relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 3 }, { log: 'I went down to four days. Less money, more Fridays with {{person}}.' }],
      },
      {
        id: 'cheap',
        label: 'Find somewhere cheaper',
        hint: '{{$1500}}',
        effects: [
          { money: -1500 },
          {
            chance: 0.6,
            then: [{ log: 'The cheaper place is fine. Less finger painting, more television, a whole new set of people to bite.' }],
            else: [{ money: -2500 }, { stat: 'happiness', delta: -4 }, { log: 'The cheaper place lost track of {{person}} twice in a week. Back to the expensive one.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gu_cereal_aisle',
    category: 'family',
    title: 'Cereal aisle standoff',
    text: 'In the cereal aisle, {{person}} lay face-down on the floor and screamed because I broke {{their}} banana in half. {{They}} wanted it in half. Just not by me.',
    minAge: 25,
    maxAge: 64,
    weight: 1.5,
    once: true,
    // Not within a few years of young_adult_paths' yp_cereal_aisle, the same tantrum in the same aisle.
    conditions: [{ not: { sinceEvent: 'yp_cereal_aisle', lte: 6 } }],
    person: { kind: ['child'], minAge: 2, maxAge: 4 },
    choices: [
      {
        id: 'wait',
        label: 'Sit down and wait it out',
        effects: [{ relationship: 'person', delta: 3 }, { karma: 1 }, { stat: 'happiness', delta: -2 }, { log: 'I sat on the floor beside {{them}} until it passed. A stranger gave me a nod of solidarity.' }],
      },
      {
        id: 'carry',
        label: 'Carry {{them}} out',
        effects: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: 1 }, { log: 'I carried {{them}} out like a rolled-up rug and abandoned the cart. Toast for dinner.' }],
      },
      {
        id: 'banana',
        label: 'Offer a fresh banana',
        effects: [
          { money: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'A fresh, whole banana ended it instantly. I have learned nothing useful.' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: '{{They}} threw the new banana too. The produce manager and I are on a first-name basis now.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'join',
        label: 'Lie down and wail too',
        effects: [
          { stat: 'happiness', delta: 4 },
          { karma: -1 },
          { log: '{{person}} stopped mid-scream, stared at me, and got up, deeply embarrassed. It worked.' },
          { chance: 0.3, then: [{ fame: 1 }, { log: 'Someone filmed it. I am briefly famous in three parenting forums.' }] },
        ],
      },
    ],
  },
  {
    id: 'gu_hallway_mural',
    category: 'family',
    title: 'The hallway mural',
    text: '{{person}} found a permanent marker and turned the hallway wall into a mural. It is mostly circles. One of them, {{they}} explains proudly, is me.',
    minAge: 25,
    maxAge: 64,
    weight: 1.2,
    once: true,
    // young_adult_paths' yp_hallway_mural tells the same marker on the same wall: one per life.
    conditions: [{ eventNotFired: 'yp_hallway_mural' }],
    person: { kind: ['child'], minAge: 2, maxAge: 5 },
    choices: [
      {
        id: 'paint',
        label: 'Paint over it',
        hint: '{{$80}}',
        effects: [{ money: -80 }, { relationship: 'person', delta: -2 }, { stat: 'happiness', delta: 3 }, { log: 'Two coats of paint and it was gone. {{person}} was quietly devastated for an afternoon.' }],
      },
      {
        id: 'frame',
        label: 'Frame it and keep it',
        hint: '{{$40}}',
        effects: [
          { money: -40 },
          { relationship: 'person', delta: 4 },
          { stat: 'happiness', delta: 1 },
          { log: 'I hung an empty frame around it. Guests ask. I say it is a commissioned piece.' },
          { chance: 0.4, then: [{ money: -400 }, { log: 'Years later, covering it took a professional, three coats and {{$400}}.', kind: 'money' }] },
        ],
      },
      {
        id: 'scrub',
        label: 'Make {{them}} help scrub',
        effects: [{ karma: 1 }, { relationship: 'person', delta: -1 }, { stat: 'happiness', delta: -1 }, { log: 'We scrubbed together. {{person}} learned about consequences. The wall learned nothing.' }],
      },
      {
        id: 'photo',
        label: 'Take a photo, then paint',
        hint: '{{$80}}',
        effects: [{ money: -80 }, { relationship: 'person', delta: 1 }, { stat: 'happiness', delta: 1 }, { log: 'I took a photo before I painted. The before picture hangs right beside the after.' }],
      },
    ],
  },
  {
    id: 'gu_preschool_dropoff',
    category: 'family',
    title: 'First day of preschool',
    text: 'First day of preschool. {{person}} marched in, hung {{their}} backpack on the hook with {{their}} name on it, and did not look back once. I am the one crying on the sidewalk outside.',
    minAge: 25,
    maxAge: 64,
    weight: 2,
    once: true,
    person: { kind: ['child'], minAge: 3, maxAge: 3 },
    choices: [
      {
        id: 'window',
        label: 'Peek through the window',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I watched through the window until a teacher waved me away, kindly but firmly.' }],
            else: [{ relationship: 'person', delta: -1 }, { stat: 'happiness', delta: -3 }, { log: '{{person}} spotted me at the window and the tears started. Mine too.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'leave',
        label: 'Leave before I cave',
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: -2 }, { log: 'I left and cried in a coffee shop. {{person}} had a wonderful day without me.' }],
      },
      {
        id: 'stay',
        label: 'Ask to stay a while',
        effects: [
          { relationship: 'person', delta: 2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'I stayed. After ten minutes {{person}} asked me, politely, to go home.' }],
            else: [{ stat: 'happiness', delta: 3 }, { log: 'I stayed an hour. {{person}} showed me every single crayon.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'pastry',
        label: 'Celebrate my free morning',
        hint: '{{$8}}',
        effects: [{ money: -8 }, { karma: -1 }, { stat: 'happiness', delta: 5 }, { log: 'I ate a pastry in total silence. I felt guilty for almost a full minute.' }],
      },
    ],
  },
  {
    id: 'gu_elevator_question',
    category: 'family',
    title: 'Out loud',
    text: 'In a packed elevator, {{person}} pointed at the man beside us and asked, at full volume, why his head has no hair on it. Eleven floors to go.',
    minAge: 25,
    maxAge: 64,
    weight: 1.5,
    once: true,
    person: { kind: ['child'], minAge: 3, maxAge: 5 },
    choices: [
      {
        id: 'sorry',
        label: 'Apologize to him',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: -2 }, { log: 'I apologized. He said it happens weekly. {{person}} asked if his head gets cold.' }],
      },
      {
        id: 'explain',
        label: 'Explain it kindly',
        effects: [
          {
            chance: 0.7,
            then: [{ karma: 2 }, { relationship: 'person', delta: 2 }, { log: "I said some heads are just like that. The man added, 'Saves on shampoo.' A hero.", kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'My explanation made it worse. The man got off two floors early.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'answer',
        label: 'Let him answer',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'He said it fell out from thinking too hard. {{person}} now thinks very hard about everything.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'He did not want to answer. Ten silent floors. The longest ride of my life.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'shush',
        label: 'Stare hard at the buttons',
        effects: [{ relationship: 'person', delta: -1 }, { stat: 'happiness', delta: -1 }, { log: "I stared at the floor numbers. {{person}} asked again, louder, in case I hadn't heard." }],
      },
    ],
  },

  // ------------------------------------------------------------ grown children
  {
    id: 'gu_boomerang_kid',
    category: 'family',
    title: 'Eleven boxes',
    text: "{{person}} asked if {{they}} could move back in 'just for a few months' while {{they}} gets back on {{their}} feet. {{They}} has eleven boxes, a houseplant and, as far as I can tell, no timeline.",
    minAge: 40,
    maxAge: 64,
    weight: 1.5,
    cooldown: 10,
    person: { kind: ['child'], minAge: 22, maxAge: 35, movedOut: true },
    choices: [
      {
        id: 'rules',
        label: 'Yes, with house rules',
        effects: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: -1 }, { log: '{{They}} moved back in. {{They}} follows about half the rules, which is more than I expected.' }],
      },
      {
        id: 'rent',
        label: 'Yes, but charge rent',
        effects: [{ money: 1200 }, { relationship: 'person', delta: -3 }, { log: '{{They}} pays a little rent and grumbles, and is saving more than {{they}} ever has.', kind: 'money' }],
      },
      {
        id: 'deposit',
        label: 'Pay a deposit elsewhere',
        hint: '{{$2000}}',
        effects: [{ money: -2000 }, { relationship: 'person', delta: 5 }, { log: 'I paid the deposit on a small place nearby. {{They}} comes over for dinner and laundry.', kind: 'money' }],
      },
      {
        id: 'no',
        label: 'Say no',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: 2 }, { log: "I said no. {{They}} found a roommate within a week and calls it my 'tough love era'." }],
            else: [{ relationship: 'person', delta: -10 }, { stat: 'happiness', delta: -3 }, { log: 'I said no. {{They}} has not called much since.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gu_grown_child_money',
    category: 'money',
    title: 'The money call',
    text: '{{person}} called and talked about the weather for four full minutes before asking for {{$1500}}. {{They}} did not say what it was for, and {{they}} sounded tired.',
    minAge: 36,
    maxAge: 64,
    weight: 1.5,
    cooldown: 4,
    person: { kind: ['child'], minAge: 19 },
    choices: [
      {
        id: 'send',
        label: 'Send it',
        hint: '{{$1500}}',
        effects: [
          { money: -1500 },
          { relationship: 'person', delta: 6 },
          { karma: 1 },
          {
            chance: 0.4,
            then: [{ money: 1500 }, { log: 'I sent it that night. Months later {{they}} paid it back without being asked.', kind: 'good' }],
            else: [{ log: 'I sent it. We never mentioned it again, which may be what {{they}} needed.' }],
          },
        ],
      },
      {
        id: 'half',
        label: 'Send half',
        hint: '{{$750}}',
        effects: [{ money: -750 }, { relationship: 'person', delta: 2 }, { log: 'I sent half and a note saying the door is always open. {{They}} sent back a heart.' }],
      },
      {
        id: 'ask',
        label: 'Ask what is going on',
        effects: [
          {
            chance: 0.6,
            then: [{ money: -1500 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 2 }, { log: '{{They}} told me everything: a job gone, rent due. I helped, and we made a plan together.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -5 }, { log: '{{They}} said never mind and hung up. The right question, the wrong moment.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'no',
        label: 'Say no',
        effects: [{ relationship: 'person', delta: -8 }, { karma: -1 }, { stat: 'happiness', delta: -2 }, { log: '{{They}} said "fine." Neither of us believed it.' }],
      },
    ],
  },
  {
    id: 'gu_grown_child_arrested',
    category: 'family',
    title: 'A call at two',
    text: 'At two in the morning the phone rang: {{person}} was picked up after a bar fight and is sitting in a holding cell, asking for me. {{They}} sounded about nine years old.',
    minAge: 36,
    maxAge: 64,
    weight: 0.8,
    once: true,
    person: { kind: ['child'], minAge: 21, maxAge: 40 },
    choices: [
      {
        id: 'bail',
        label: 'Post bail tonight',
        hint: '{{$1500}}',
        effects: [{ money: -1500 }, { relationship: 'person', delta: 6 }, { stat: 'health', delta: -1 }, { log: 'I went down in my pajamas and paid. {{person}} would not meet my eyes all the way home.', kind: 'money' }],
      },
      {
        id: 'lawyer',
        label: 'Hire a proper lawyer',
        hint: '{{$4000}}',
        effects: [{ money: -4000 }, { relationship: 'person', delta: 8 }, { log: 'The lawyer got the charges reduced. {{person}} has not touched a drink since, so far.', kind: 'money' }],
      },
      {
        id: 'night',
        label: 'Let {{them}} sit until morning',
        effects: [
          { karma: 1 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 6 }, { log: 'One night in a cell, then a long breakfast together. {{They}} called it a wake-up call.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -3 }, { log: 'I let {{them}} sit. {{They}} has not forgotten it, and maybe should not.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gu_estranged_child',
    category: 'family',
    title: 'The quiet between us',
    // A cool bond (the selector cannot see when we last talked, so the text names the quarrel, not a silence).
    text: 'Things between {{person}} and me have been cold since an argument that ended with a slammed door. We are polite now, carefully, and the politeness has started to feel like furniture.',
    minAge: 40,
    maxAge: 64,
    weight: 1,
    cooldown: 6,
    person: { kind: ['child'], minAge: 23, maxRelationship: 35 },
    choices: [
      {
        id: 'letter',
        label: 'Write {{them}} a letter',
        effects: [
          { karma: 2 },
          { log: 'I wrote four drafts and sent the shortest. It said I was sorry, and that I miss {{them}}.' },
          { chance: 0.55, then: [{ queue: 'gu_estranged_reply' }], else: [{ stat: 'happiness', delta: -3 }, { log: 'No reply came. I check the mailbox anyway.' }] },
        ],
      },
      {
        id: 'wait',
        label: 'Wait for {{them}} to call',
        effects: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: 1 }, { log: '{{They}} should call first, I decided. The phone has been very quiet, and so have I.' }],
      },
      {
        id: 'door',
        label: 'Show up at {{their}} door',
        effects: [
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: 12 }, { stat: 'happiness', delta: 6 }, { log: '{{They}} opened the door, looked at me a long time, and stepped aside to let me in.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -5 }, { log: '{{They}} did not open the door. I left {{their}} favorite cookies on the step.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'card',
        label: 'Send a birthday card',
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: -1 }, { log: 'I sent a card with a short note. No reply, but it did not come back either.' }],
      },
    ],
  },
  {
    id: 'gu_estranged_reply',
    category: 'family',
    title: 'A reply',
    text: "A reply came: three short paragraphs in {{person}}'s handwriting. Not an apology, not an accusation. At the bottom, one word: 'Coffee?'",
    minAge: 40,
    maxAge: 64,
    weight: 1,
    followUpOnly: true,
    person: { kind: ['child'], minAge: 23 },
    choices: [
      {
        id: 'coffee',
        label: 'Meet for coffee',
        effects: [{ energy: -1 }, { relationship: 'person', delta: 12 }, { stat: 'happiness', delta: 6 }, { log: 'We talked for two hours and stepped around the big thing. It was a start.', kind: 'good' }],
      },
      {
        id: 'sorry',
        label: 'Lead with an apology',
        effects: [
          { energy: -1 },
          { karma: 2 },
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 16 }, { stat: 'happiness', delta: 8 }, { log: 'I apologized before the coffee came. {{They}} cried. So did I. We ordered a second round.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 4 }, { log: 'I apologized. {{They}} said it was not that simple. It is not. We will meet again.' }],
          },
        ],
      },
      {
        id: 'phone',
        label: 'Call instead',
        effects: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 3 }, { log: 'We talked on the phone instead. Easier on both of us. We laughed once.' }],
      },
    ],
  },
  {
    id: 'gu_child_brings_partner',
    category: 'family',
    title: 'The new partner',
    text: '{{person}} brought someone home for dinner: {{their}} partner, who is very polite, very quiet, and either terrified of me or simply like that. {{person}} keeps checking my expression.',
    minAge: 40,
    maxAge: 64,
    weight: 1.2,
    cooldown: 6,
    person: { kind: ['child'], minAge: 20, maxAge: 40, married: false },
    choices: [
      {
        id: 'charm',
        label: 'Win them over',
        effects: [
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 4 }, { log: "By dessert the partner was telling stories. {{person}} mouthed 'thank you' across the table.", kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I tried too hard and told my best story twice. The partner was very polite about it.' }],
          },
        ],
      },
      {
        id: 'grill',
        label: 'Ask a few tough questions',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: -6 }, { log: 'The questions were fair. The tone, {{person}} told me later, was not.', kind: 'bad' }],
            else: [{ relationship: 'person', delta: 2 }, { stat: 'smarts', delta: 1 }, { log: 'The partner answered everything calmly. I am, grudgingly, impressed.' }],
          },
        ],
      },
      {
        id: 'photos',
        label: 'Bring out the baby photos',
        effects: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: 4 }, { log: 'Out came the baby photos. {{person}} wanted the floor to swallow {{them}}. The partner loved them.' }],
      },
      {
        id: 'light',
        label: 'Keep it light',
        effects: [{ relationship: 'person', delta: 3 }, { log: 'I kept it light and let them be. They stayed late, which I am taking as a review.' }],
      },
    ],
  },

  // ------------------------------------------------------------ single, no kids
  {
    id: 'gu_dating_profile',
    category: 'romance',
    title: 'Dating at {{age}}',
    text: "I made a dating profile. The app wants three photos where I look 'approachable', my 'love language' and my most irrational fear. My most irrational fear is dating apps.",
    minAge: 40,
    maxAge: 59,
    weight: 1.2,
    cooldown: 5,
    conditions: [{ married: false }, { hasLover: false }, { flag: 'grieving', exists: false }],
    choices: [
      {
        id: 'honest',
        label: 'Write an honest profile',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 5 }, { newPerson: { kind: 'lover', relationship: 50, log: '{{person}} liked my honesty and my terrible photo. We have a second date.' } }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'Honesty got me three matches: two bots and a former coworker. We agreed never to speak of it.' }],
          },
        ],
      },
      {
        id: 'old',
        label: 'Use photos from years ago',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { newPerson: { kind: 'lover', relationship: 40, log: '{{person}} noticed the old photos and laughed. We kept seeing each other anyway.' } }],
            else: [{ stat: 'happiness', delta: -4 }, { log: "My date looked at me, then at the photo, then at me. 'Long time ago?' Yes.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'friend',
        label: 'Let a friend write it',
        conditions: [{ hasPerson: ['friend', 'bestFriend'] }],
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { newPerson: { kind: 'lover', relationship: 50, log: "My friend's version of me got a date with {{person}}. I am trying to live up to it." } }],
            else: [{ stat: 'happiness', delta: -1 }, { log: "My friend described me as 'a lot of fun in small doses'. Accurate. Unhelpful." }],
          },
        ],
      },
      {
        id: 'delete',
        label: 'Delete the app',
        effects: [{ stat: 'happiness', delta: 2 }, { money: -60 }, { log: 'I deleted it and took myself to dinner. Excellent company, terrible at splitting the bill.' }],
      },
    ],
  },
  {
    id: 'gu_table_nine',
    category: 'friends',
    title: 'Table nine',
    text: "At {{person}}'s wedding I was seated at table nine, the singles table: a cousin from out of town, a coworker nobody claimed, and a man who sells insurance and wants me to know it.",
    minAge: 30,
    maxAge: 59,
    weight: 1.2,
    cooldown: 8,
    conditions: [{ hasLover: false }, { flag: 'grieving', exists: false }],
    person: { kind: ['friend', 'bestFriend'], minAge: 25, minRelationship: 30 },
    choices: [
      {
        id: 'dance',
        label: 'Dance anyway',
        effects: [{ energy: -1 }, { stat: 'happiness', delta: 5 }, { stat: 'health', delta: 1 }, { relationship: 'person', delta: 2 }, { log: 'I danced to every song, including the one with the chicken moves. Best night in months.', kind: 'good' }],
      },
      {
        id: 'cousin',
        label: 'Talk to the cousin',
        effects: [
          {
            chance: 0.35,
            then: [{ stat: 'happiness', delta: 5 }, { newPerson: { kind: 'lover', relationship: 50, log: 'The cousin, {{person}}, and I talked until the staff stacked the chairs around us.' } }],
            else: [{ stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: 1 }, { log: 'The cousin talked exclusively about trains. I now know a great deal about trains.' }],
          },
        ],
      },
      {
        id: 'leave',
        label: 'Slip out after the cake',
        effects: [{ relationship: 'person', delta: -3 }, { energy: 1 }, { stat: 'happiness', delta: 1 }, { log: '{{person}} noticed my empty chair in the photos. I did get cake, and an early night.' }],
      },
      {
        id: 'toast',
        label: 'Give an unplanned toast',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 4 }, { log: 'My unplanned toast made half the room cry, the good kind. {{person}} hugged me at the bar.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -5 }, { stat: 'happiness', delta: -4 }, { log: 'The unplanned toast went on too long. The DJ played me off.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gu_settle_down',
    category: 'family',
    title: 'Settling down',
    text: "Over dinner {{person}} asked, between the potatoes and the gravy, when I am going to 'settle down'. Everyone else at the table suddenly found their plates very interesting.",
    minAge: 30,
    maxAge: 45,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ married: false }, { hasChildren: false }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'joke',
        label: 'Deflect with a joke',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I said I was waiting for the gravy to settle first. Nobody laughed. I did.' }],
      },
      {
        id: 'happy',
        label: "Say I'm happy as I am",
        effects: [
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 4 }, { log: 'I said I like my life. {{person}} paused, then said that was all {{they}} wanted, really.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { log: "I said I like my life. {{person}} said 'for now' and passed the potatoes." }],
          },
        ],
      },
      {
        id: 'invent',
        label: 'Invent a partner',
        conditions: [{ hasLover: false }],
        effects: [{ karma: -2 }, { stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 2 }, { log: 'I invented someone called Morgan. {{person}} now asks about Morgan every single week.' }],
      },
      {
        id: 'back',
        label: 'Ask {{them}} the same question',
        effects: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: 3 }, { log: '{{person}} laughed so hard {{they}} forgot to wait for an answer. Topic closed, for now.' }],
      },
    ],
  },
  {
    id: 'gu_party_of_one',
    category: 'random',
    title: 'Party of one',
    text: 'I have a free week and nobody to coordinate with. A city I have wanted to see for years has cheap flights, and for once the only person who has to agree is me.',
    minAge: 30,
    maxAge: 59,
    weight: 1,
    cooldown: 6,
    conditions: [{ married: false }, { hasLover: false }, { hasChildren: false }],
    choices: [
      {
        id: 'go',
        label: 'Book it, just me',
        hint: '{{$1800}}',
        effects: [
          { money: -1800 },
          { stat: 'happiness', delta: 7 },
          { stat: 'smarts', delta: 2 },
          { counter: 'vacations' },
          { log: 'A table for one at a beautiful restaurant, museums at my own pace. Great company, me.', kind: 'good' },
          { chance: 0.3, then: [{ newPerson: { kind: 'friend', relationship: 45, farAway: true, log: 'On a walking tour I met {{person}}, also traveling alone, also lost. We still write.' } }] },
        ],
      },
      {
        id: 'buddy',
        label: 'Bring a friend along',
        hint: '{{$1800}}',
        conditions: [{ hasPerson: ['friend', 'bestFriend'] }],
        effects: [
          { money: -1800 },
          { counter: 'vacations' },
          {
            chance: 0.5,
            then: [{ relationship: 'friend', delta: 5 }, { relationship: 'bestFriend', delta: 5 }, { stat: 'happiness', delta: 6 }, { log: 'My friend and I wanted the same things: food, then more food. A perfect trip.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'My friend wanted to sleep late and shop. I saw the inside of many shoe stores.' }],
          },
        ],
      },
      {
        id: 'local',
        label: 'Play tourist at home',
        hint: '{{$200}}',
        effects: [{ money: -200 }, { stat: 'happiness', delta: 3 }, { log: 'I played tourist in {{city}} for a week. It turns out I live somewhere interesting.' }],
      },
      {
        id: 'stay',
        label: 'Stay home and save',
        effects: [{ stat: 'happiness', delta: -2 }, { log: 'I stayed home and cleaned the oven. The flights went up the next day, to spite me.' }],
      },
    ],
  },
  {
    id: 'gu_friends_had_babies',
    category: 'friends',
    title: 'Everyone had a baby',
    text: 'All of my close friends have had babies in the same eighteen months. Every conversation is about tiny socks, and every plan gets canceled for a nap that is not even mine.',
    minAge: 30,
    maxAge: 42,
    weight: 1.2,
    once: true,
    conditions: [{ hasChildren: false }, { hasPerson: ['friend', 'bestFriend'] }],
    choices: [
      {
        id: 'favorite',
        label: 'Become the favorite grown-up',
        effects: [
          { karma: 2 },
          { energy: -1 },
          { relationship: 'friend', delta: 4 },
          { relationship: 'bestFriend', delta: 4 },
          { stat: 'happiness', delta: 3 },
          { log: 'I learned to fold a stroller and do voices. Now I am the fun one, and invited to everything.', kind: 'good' },
        ],
      },
      {
        id: 'new',
        label: 'Make some new friends',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { newPerson: { kind: 'friend', relationship: 50, log: 'A pottery class gave me {{person}}, who is also free on Friday nights.' } }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I took a pottery class. I made one lopsided bowl and zero friends.' }],
          },
        ],
      },
      {
        id: 'dinner',
        label: 'Host an adults-only dinner',
        hint: '{{$120}}',
        effects: [
          { money: -120 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 5 }, { relationship: 'friend', delta: 3 }, { log: 'Four friends came, nobody said the word teething, and we stayed up past ten like legends.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'Two friends canceled for naps. The third fell asleep at the table.' }],
          },
        ],
      },
      {
        id: 'drift',
        label: 'Let the friendships drift',
        effects: [{ relationship: 'friend', delta: -3 }, { relationship: 'bestFriend', delta: -3 }, { energy: 1 }, { stat: 'happiness', delta: -1 }, { log: 'I stopped asking. We will find each other again when the kids can tie their shoes.' }],
      },
    ],
  },
  {
    id: 'gu_single_supplement',
    category: 'money',
    title: 'Single supplement',
    text: "{{person}} organized a group trip, priced 'per person, based on double occupancy'. I am one person, occupying singly, and the brochure would like extra for that.",
    minAge: 30,
    maxAge: 59,
    weight: 1,
    cooldown: 5,
    conditions: [{ hasLover: false }],
    person: { kind: ['friend', 'bestFriend'], minRelationship: 30 },
    choices: [
      {
        id: 'pay',
        label: 'Pay for my own room',
        hint: '{{$2200}}',
        effects: [{ money: -2200 }, { counter: 'vacations' }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 5 }, { log: 'I paid for my own room and slept diagonally every night. Worth every cent.', kind: 'good' }],
      },
      {
        id: 'stranger',
        label: 'Room with a stranger',
        hint: '{{$1300}}',
        effects: [
          { money: -1300 },
          { counter: 'vacations' },
          { relationship: 'person', delta: 4 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { newPerson: { kind: 'friend', relationship: 50, log: 'My assigned roommate, {{person}}, snored but shared snacks. A keeper.' } }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'My assigned roommate sang opera in the shower at six every morning. Badly.' }],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Skip the trip',
        effects: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -2 }, { log: 'I stayed home. The group photos had a very good beach in them.' }],
      },
    ],
  },

  // ------------------------------------------------------------ owning a home
  {
    id: 'gu_roof_leak',
    category: 'money',
    title: 'Drip',
    text: 'A brown stain spread across the bedroom ceiling overnight, and by morning it was dripping into one of my shoes. The roof, it seems, has been keeping a secret.',
    minAge: 25,
    maxAge: 64,
    weight: 1,
    cooldown: 6,
    conditions: [...LIVES_UNDER_OWN_ROOF],
    choices: [
      {
        id: 'patch',
        label: 'Patch it myself',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          {
            chance: 0.5,
            then: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 4 }, { log: 'I climbed up with a tube of sealant and a prayer. Both worked.', kind: 'good' }],
            else: [{ injury: 4 }, { money: -2500 }, { asset: 'damage', kind: 'house', amount: 10 }, { log: 'I slid down two rows of shingles and caught the gutter. A roofer finished the job, at a premium.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'roofer',
        label: 'Call a roofer',
        hint: '{{$3000}}',
        effects: [
          { money: -3000 },
          { stat: 'happiness', delta: 1 },
          { log: 'The roofer replaced a section and showed me photos of the rot. I paid with a wince.', kind: 'money' },
          { chance: 0.3, then: [{ money: -1500 }, { stat: 'happiness', delta: -3 }, { log: 'Next spring the stain came back, one room over.', kind: 'bad' }] },
        ],
      },
      {
        id: 'whole',
        label: 'Replace the whole roof',
        hint: '{{$12000}}',
        effects: [{ money: -12000 }, { stat: 'happiness', delta: 4 }, { log: 'A whole new roof. The house is solid, my savings are not, and the rain sounds different.', kind: 'money' }],
      },
      {
        id: 'bucket',
        label: 'Put a bucket under it',
        effects: [
          { asset: 'damage', kind: 'house', amount: 10 },
          {
            chance: 0.5,
            then: [{ money: -4000 }, { stat: 'happiness', delta: -6 }, { log: 'The bucket held until the big storm. Then part of the ceiling came down.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The bucket works. I empty it every morning like a sad little ritual.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gu_property_tax',
    category: 'money',
    title: 'Reassessed',
    text: 'The city reassessed my home. Good news: on paper it is worth far more than I paid. Bad news: the property tax bill knows that too, and it is due next month.',
    minAge: 25,
    maxAge: 64,
    weight: 1.2,
    cooldown: 5,
    conditions: [{ ownsAsset: 'house' }],
    choices: [
      {
        id: 'pay',
        label: 'Pay it',
        hint: '{{$1800}}',
        effects: [{ money: -1800 }, { stat: 'happiness', delta: -2 }, { log: 'I paid the bill and felt like a responsible adult, which is to say poorer.', kind: 'money' }],
      },
      {
        id: 'appeal',
        label: 'Appeal the assessment',
        effects: [
          { energy: -1 },
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.45,
            then: [{ money: -900 }, { stat: 'happiness', delta: 4 }, { log: 'I brought photos of every crack in the place. They cut the bill in half.', kind: 'good' }],
            else: [{ money: -1950 }, { stat: 'happiness', delta: -3 }, { log: 'I lost the appeal and paid a filing fee for the privilege.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'council',
        label: 'Pay, then complain publicly',
        hint: '{{$1800}}',
        effects: [{ money: -1800 }, { energy: -1 }, { karma: 1 }, { stat: 'happiness', delta: 1 }, { log: 'I paid, then used my three minutes at the council meeting. It changed nothing. It felt great.' }],
      },
    ],
  },
  {
    id: 'gu_one_tile',
    category: 'money',
    title: 'Just one tile',
    text: "I set out to replace one cracked bathroom tile. Under the tile was a soft floor, under that was a slow leak, and under that, I am told, is 'a conversation about the subfloor'.",
    minAge: 25,
    maxAge: 64,
    weight: 1,
    cooldown: 8,
    conditions: [{ ownsAsset: 'house' }, { money: { gte: 2000 } }],
    choices: [
      {
        id: 'all',
        label: 'Redo the whole bathroom',
        hint: '{{$7000}}',
        effects: [{ money: -7000 }, { stat: 'happiness', delta: 5 }, { log: 'Three weeks, one contractor and a whole new bathroom. I visit it like a museum.', kind: 'money' }],
      },
      {
        id: 'leak',
        label: 'Fix the leak, nothing else',
        hint: '{{$1800}}',
        effects: [
          { money: -1800 },
          {
            chance: 0.3,
            then: [{ money: -2500 }, { asset: 'damage', kind: 'house', amount: 10 }, { stat: 'happiness', delta: -4 }, { log: 'The leak found a new route. The bathroom got redone anyway, in stages, angrily.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'The leak is fixed. The tile is still cracked. We have made our peace.' }],
          },
        ],
      },
      {
        id: 'diy',
        label: 'Learn to do it myself',
        hint: '{{$600}}',
        effects: [
          { money: -600 },
          { energy: -1 },
          { stat: 'smarts', delta: 3 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 6 }, { log: 'A how-to book, knee pads and swearing. It is a little crooked, and it is mine.', kind: 'good' }],
            else: [{ injury: 3 }, { money: -3000 }, { asset: 'damage', kind: 'house', amount: 10 }, { stat: 'happiness', delta: -5 }, { log: 'I put my foot through the floor. A contractor finished it, laughing the whole time.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'rug',
        label: 'Put a rug over it',
        hint: '{{$90}}',
        effects: [{ money: -90 }, { asset: 'damage', kind: 'house', amount: 15 }, { stat: 'happiness', delta: -1 }, { log: 'A nice rug now covers the problem. The problem is growing under it, quietly.' }],
      },
    ],
  },
  {
    id: 'gu_hoa_treasurer',
    category: 'random',
    title: 'Elected in absentia',
    text: "The residents' association needed a treasurer. Nobody volunteered, so they elected whoever missed the meeting. That was me. I now have a binder, a password and enemies.",
    minAge: 30,
    maxAge: 64,
    weight: 0.8,
    once: true,
    // A residents' association and its money, as everywhere (a homeowners' association is American): no paint rules.
    conditions: [{ ownsAsset: 'house' }],
    choices: [
      {
        id: 'serious',
        label: 'Take it seriously',
        effects: [
          { energy: -1 },
          { stat: 'smarts', delta: 2 },
          { karma: 2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { fame: 1 }, { log: "I found {{$4000}} the old treasurer had 'misplaced'. I am feared and respected now.", kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I balanced every book. Nobody thanked me. Somebody complained about the font.' }],
          },
        ],
      },
      {
        id: 'resign',
        label: 'Resign immediately',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I resigned by email within the hour. They elected the next person who missed a meeting.' }],
      },
      {
        id: 'yes',
        label: 'Approve every request',
        effects: [
          { karma: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -3 }, { log: 'I approved everything. We now own a bounce house and a wind turbine. Meetings are tense.' }],
            else: [{ stat: 'happiness', delta: 4 }, { log: 'I said yes to every request for money. The most popular treasurer in history.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'strict',
        label: 'Block every expense',
        effects: [{ karma: -3 }, { stat: 'happiness', delta: 3 }, { log: 'I blocked every expense, down to the meeting cookies. I have become the person with the clipboard.' }],
      },
    ],
  },
  {
    id: 'gu_burst_pipe',
    category: 'money',
    title: 'Indoor lake',
    text: 'A pipe burst in the wall while I was out. I came home to a kitchen floor under water, a slipper floating past the fridge, and the gentle sound of my money leaving.',
    minAge: 25,
    maxAge: 64,
    weight: 1,
    cooldown: 6,
    conditions: [{ ownsAsset: 'house' }],
    choices: [
      {
        id: 'plumber',
        label: 'Call an emergency plumber',
        hint: '{{$1500}}',
        effects: [{ money: -1500 }, { asset: 'damage', kind: 'house', amount: 5 }, { log: 'The plumber came at midnight, fixed it in forty minutes, and charged like a surgeon.', kind: 'money' }],
      },
      {
        id: 'diy',
        label: 'Shut it off and fix it',
        hint: '{{$200}}',
        effects: [
          { money: -200 },
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I found the shutoff valve, a wrench and the diagram in the manual. Fixed. I am unstoppable.', kind: 'good' }],
            else: [{ money: -2000 }, { asset: 'damage', kind: 'house', amount: 15 }, { stat: 'happiness', delta: -4 }, { log: 'My fix held for a day. The second flood was bigger and had opinions.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'insurance',
        label: 'File an insurance claim',
        hint: '{{$1000}} for the deductible',
        effects: [
          { asset: 'damage', kind: 'house', amount: 10 },
          {
            chance: 0.6,
            then: [{ money: -1000 }, { log: 'Insurance covered the rest after only nine phone calls.' }],
            else: [{ money: -3500 }, { stat: 'happiness', delta: -4 }, { log: "The policy covers 'sudden' leaks. The adjuster decided mine was 'gradual'.", kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ owning a car
  {
    id: 'gu_check_engine',
    category: 'money',
    title: 'The orange light',
    text: 'The check-engine light has been on for three months. The car seems fine. The light seems very sure. I have started driving with my thumb over it.',
    minAge: 25,
    maxAge: 64,
    weight: 1.2,
    cooldown: 5,
    conditions: [{ ownsAssetId: FUEL_CARS }],
    choices: [
      {
        id: 'shop',
        label: 'Take it to the shop',
        hint: '{{$450}}',
        effects: [{ money: -450 }, { stat: 'happiness', delta: 1 }, { log: 'A loose sensor and a bill for {{$450}}. The light is off. I miss nothing about it.', kind: 'money' }],
      },
      {
        id: 'ignore',
        label: 'Keep ignoring it',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'The light went off on its own one morning. I have chosen to believe it healed.' }],
            else: [{ money: -2800 }, { stat: 'happiness', delta: -5 }, { log: 'The light was right. The engine gave a final, expensive speech on the highway.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'reader',
        label: 'Buy a code reader',
        hint: '{{$60}}',
        effects: [
          { money: -60 },
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: "The code said 'loose gas cap'. I tightened it. I am basically a mechanic.", kind: 'good' }],
            else: [{ money: -900 }, { log: 'The code meant nothing to me or the internet. The shop charged {{$900}} anyway.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gu_parking_lot_bump',
    category: 'money',
    title: 'Crunch',
    text: "Backing out of a grocery store space, I met a minivan. Slowly, with a crunch. Nobody is hurt. The minivan's driver is getting out, and so is a great deal of opinion.",
    minAge: 25,
    maxAge: 64,
    weight: 1,
    cooldown: 5,
    conditions: [{ ownsAssetId: REAL_CARS }],
    choices: [
      {
        id: 'insurance',
        label: 'Swap insurance details',
        hint: '{{$500}} for the deductible',
        effects: [{ money: -500 }, { karma: 1 }, { stat: 'happiness', delta: -2 }, { log: 'We swapped details politely. My premium went up, and so did my blood pressure.', kind: 'money' }],
      },
      {
        id: 'cash',
        label: 'Offer cash on the spot',
        effects: [
          {
            chance: 0.6,
            then: [{ money: -400 }, { log: '{{$400}} in cash and a handshake. We both drove away happy, or close to it.' }],
            else: [{ money: -1400 }, { stat: 'happiness', delta: -3 }, { log: 'The cash deal became a body shop invoice for {{$1400}} a week later.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'blame',
        label: 'Insist it was their fault',
        effects: [
          { karma: -2 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I argued with total confidence. The other driver, oddly, apologized.' }],
            else: [{ money: -900 }, { stat: 'happiness', delta: -4 }, { log: 'A parking lot camera had seen everything. My confidence cost me {{$900}}.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gu_towed',
    category: 'money',
    title: 'Gone',
    text: 'My car was not where I parked it, right outside my own front door. A tiny sign two blocks away mentions street sweeping on Thursdays. Today is Thursday.',
    minAge: 25,
    maxAge: 64,
    weight: 1,
    cooldown: 5,
    conditions: [{ ownsAssetId: REAL_CARS }],
    choices: [
      {
        id: 'pay',
        label: 'Pay the impound lot',
        hint: '{{$300}}',
        effects: [{ money: -300 }, { stat: 'happiness', delta: -2 }, { log: '{{$300}} to a man behind thick glass. The street got swept. The car did not.', kind: 'money' }],
      },
      {
        id: 'fight',
        label: 'Contest the tow',
        effects: [
          { energy: -1 },
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.35,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'I won. The sign was legally too small. I framed the ruling.', kind: 'good' }],
            else: [{ money: -380 }, { stat: 'happiness', delta: -3 }, { log: 'I lost, and the storage fee kept running while I argued.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'bus',
        label: 'Take the bus for a week',
        hint: '{{$600}} in fees',
        effects: [{ money: -600 }, { stat: 'health', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I took the bus for a week and liked it more than I expected. The storage fees did not.' }],
      },
    ],
  },
  {
    id: 'gu_mechanic_retires',
    category: 'random',
    title: 'My mechanic',
    text: "The mechanic who has kept my cars running for years is retiring. He never once upsold me, he called every car 'old girl', and there was always coffee on. I do not know anyone else.",
    minAge: 40,
    maxAge: 64,
    weight: 0.8,
    once: true,
    conditions: [{ ownsAssetId: FUEL_CARS }],
    choices: [
      {
        id: 'gift',
        label: 'Bring him a cake',
        hint: '{{$30}}',
        effects: [{ money: -30 }, { karma: 2 }, { stat: 'happiness', delta: 3 }, { log: 'I brought a cake and a card. He gave me the names of the only three mechanics he trusts.', kind: 'good' }],
      },
      {
        id: 'learn',
        label: 'Learn the basics myself',
        effects: [{ energy: -1 }, { stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: 1 }, { log: 'I can change my own oil now. I have saved money and ruined two shirts.' }],
      },
      {
        id: 'search',
        label: 'Find a new shop online',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'The shop with the best reviews was honest and fast. No coffee, but honest.', kind: 'good' }],
            else: [{ money: -800 }, { stat: 'happiness', delta: -3 }, { log: 'The new shop found {{$800}} of problems he would have fixed with a coat hanger.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gu_one_more_drive',
    category: 'family',
    title: 'One more drive',
    text: '{{person}} asked me to drive {{them}} back to the town where {{they}} grew up. Five hours each way, one more look at the old house, and every story I have ever heard, again.',
    minAge: 35,
    maxAge: 64,
    weight: 1,
    once: true,
    conditions: [{ ownsAssetId: REAL_CARS }],
    person: { kind: ['mother', 'father'], minAge: 65 },
    choices: [
      {
        id: 'go',
        label: 'Pack the car and go',
        hint: '{{$300}}',
        effects: [
          { money: -300 },
          { energy: -1 },
          { relationship: 'person', delta: 12 },
          { stat: 'happiness', delta: 6 },
          { log: 'We found the old house, the old school and a café that remembered {{them}}. I heard new stories.', kind: 'good' },
        ],
      },
      {
        id: 'fly',
        label: 'Fly there instead',
        hint: '{{$900}}',
        effects: [{ money: -900 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 3 }, { log: 'We flew and rented a car. Faster, less scenic, but {{person}} still cried at the old school.' }],
      },
      {
        id: 'later',
        label: 'Promise next summer',
        effects: [{ relationship: 'person', delta: -6 }, { karma: -1 }, { energy: 1 }, { stat: 'happiness', delta: -2 }, { log: '{{person}} said next summer would be lovely, and did not say what we were both thinking.' }],
      },
    ],
  },
  {
    id: 'gu_odometer',
    category: 'random',
    title: 'Two hundred thousand',
    text: 'On the way home the odometer on my old hatchback crept toward 200,000. I am about to see a number I will never see again, in a car held together by hope.',
    minAge: 25,
    maxAge: 64,
    weight: 0.8,
    once: true,
    conditions: [{ ownsAssetId: ['old_hatchback'] }],
    choices: [
      {
        id: 'pull',
        label: 'Pull over and watch',
        effects: [{ stat: 'happiness', delta: 4 }, { log: 'I pulled over and took a photo as it rolled over. Two hundred thousand, and still going.', kind: 'good' }],
      },
      {
        id: 'party',
        label: 'Throw it a little party',
        hint: '{{$40}}',
        effects: [{ money: -40 }, { stat: 'happiness', delta: 5 }, { log: 'I bought the car a cupcake and took its portrait by the curb. It seemed moved.' }],
      },
      {
        id: 'save',
        label: 'Start saving for a new one',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }, { log: "I opened a savings account labeled 'Next car'. The hatchback can sense it." }],
      },
    ],
  },
];

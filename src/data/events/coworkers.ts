import { JOBS } from '@/data/jobs';
import type { Condition, EventDef } from '@/engine/events/schema';

/**
 * Coworkers (GAME_DESIGN §10a): the two or three people a full-time hire brings, bound with
 * person { kind: ['coworker'] }. They exist only while the player holds that full-time job, so
 * every card here needs { hasJob: true } and { partTime: false } (FULL_TIME), and goes when the
 * job does. Topics: leaving parties and cards, stolen and misplaced credit, carpooling, wedding
 * invitations, birthday cake politics, covering for a coworker in trouble, office rumors, a peer
 * who becomes the boss, a sick pet, lunch rituals, references and interviews, a coworker treated
 * unfairly, the holiday gift exchange, a retirement handover, mentoring a new hire, grief, a baby
 * shower, the thermostat and a school fundraiser.
 *
 * A coworker who leaves, retires or is let go ends with coworkerLeaves after the choice's own line:
 * a close one (50+) stays in my life as a friend, anyone else drops out of it (CONTENT_STYLE). The mentee
 * is a new person (newPerson), so the mentoring card has no follow-up: a queued card would bind the
 * event's person, not the new hire. Follow-ups (followUpOnly): cw_carpool_late (from
 * cw_carpool_driver) and cw_boss_off_record (from cw_new_boss).
 */

/** Coworkers come with full-time jobs only (systems/coworkers.ts). */
const FULL_TIME: Condition[] = [{ hasJob: true }, { partTime: false }];

/** Below the top rung of the ladder, so "my boss" exists: owners, chiefs, CEOs and partners have nobody above them. */
const HAS_A_BOSS: Condition = {
  any: [...new Set(JOBS.filter((d) => !d.partTime).map((d) => d.ladder.length))].map(
    (rungs): Condition => ({ all: [{ jobId: JOBS.filter((d) => !d.partTime && d.ladder.length === rungs).map((d) => d.id) }, { jobLevel: { lt: rungs - 1 } }] }),
  ),
};

/** Notice, references, interviews, promotions applied for and new hires: soldiers serve a term and are posted, not hired. */
const CIVILIAN: Condition = { not: { jobId: ['military'] } };

/** Real cars: the 'car' asset kind also covers the bicycle and the scooter. */
const REAL_CARS = ['old_hatchback', 'sedan', 'pickup', 'ev', 'luxury_sedan', 'sports_car', 'supercar', 'classic_car'];

/** Jobs with a desk, email and meetings. */
const DESK_WORK: Condition = {
  any: [{ jobCategory: ['office', 'tech', 'finance'] }, { jobId: ['paralegal', 'lawyer', 'civil_servant', 'journalist', 'writer', 'graphic_designer'] }],
};

/** Jobs run on shifts and a schedule someone else makes. */
const SHIFT_WORK: Condition = {
  jobId: ['fast_food', 'retail', 'waiter', 'warehouse', 'security', 'bartender', 'janitor', 'caregiver', 'paramedic', 'nurse', 'police', 'firefighter', 'chef'],
};

/** The bottom two rungs of a ladder: a supervisor, manager or head of the place makes the schedule above them. */
const NOT_A_MANAGER: Condition = { jobLevel: { lte: 1 } };

/** Careers with no ordinary team ladder or shared workplace routine (sets, tours, stadiums, office). */
const NOT_GIG: Condition = { not: { jobId: ['athlete', 'actor', 'musician', 'chef_tv', 'politician'] } };

/** No shared commute: soldiers live on base, and gig careers travel. */
const COMMUTES: Condition = { not: { jobId: ['military', 'athlete', 'actor', 'musician', 'chef_tv'] } };

/** A daily lunch break in one place: drivers eat on the road and pilots in the air. */
const ON_SITE: Condition = { not: { jobId: ['driver', 'pilot'] } };

export const COWORKERS_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ leaving
  {
    id: 'cw_leaving_party',
    category: 'work',
    title: 'The send-off',
    text: '{{person}} handed in {{their}} notice. Friday is {{their}} last day, and somebody has to organize the send-off before it turns into six people eating crackers in silence.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    cooldown: 4,
    conditions: [...FULL_TIME, NOT_GIG, CIVILIAN],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'organize',
        label: 'Organize a proper send-off',
        hint: '{{$60}}',
        effects: [
          { money: -60 },
          { energy: -1 },
          { relationship: 'coworker', delta: 2 },
          { stat: 'happiness', delta: 3 },
          { karma: 2 },
          { log: 'I organized cake, a card and a slideshow. {{person}} laughed at every photo and cried at the last.', kind: 'good' },
          { coworkerLeaves: true },
        ],
      },
      {
        id: 'toast',
        label: 'Give a short toast',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'My toast got a real laugh and one tear. {{person}} left with the card under {{their}} arm.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'My toast ran long and mentioned the printer twice. {{person}} clapped anyway, kindly.' }],
          },
          { coworkerLeaves: true },
        ],
      },
      {
        id: 'skip',
        label: 'Keep working through it',
        effects: [
          { jobPerformance: 2 },
          { stat: 'happiness', delta: -2 },
          { karma: -1 },
          { log: 'I kept working through the send-off. {{person}} waved goodbye from the door. I waved back, too late.' },
          { coworkerLeaves: true },
        ],
      },
      {
        id: 'ask',
        label: 'Ask why {{they}} is leaving',
        effects: [
          {
            random: [
              { weight: 1, effects: [{ stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 1 }, { log: '{{person}} said the new place pays more and says thank you. I have been thinking about it since.' }] },
              { weight: 1, effects: [{ stat: 'happiness', delta: 2 }, { log: '{{person}} said it was simply time for something new. I wished {{them}} luck and meant it.', kind: 'good' }] },
            ],
          },
          { coworkerLeaves: true },
        ],
      },
    ],
  },
  {
    id: 'cw_leaving_card',
    category: 'work',
    title: 'The leaving card',
    text: "The card for {{person}}'s last day reached my desk. Every inch is already full of warm, specific memories. I have spoken to {{person}} maybe four times, twice about the elevator.",
    minAge: 18,
    maxAge: 75,
    weight: 0.8,
    cooldown: 4,
    conditions: [...FULL_TIME, DESK_WORK],
    // Someone I have spoken to four times: below 50, where coworkerLeaves would keep them on as a friend.
    person: { kind: ['coworker'], maxRelationship: 49 },
    choices: [
      {
        id: 'generic',
        label: 'Write something generic',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I wrote "Best of luck!" in the only gap left. It looked very lonely among the paragraphs.' }, { coworkerLeaves: true }],
      },
      {
        id: 'invent',
        label: 'Invent a fond memory',
        effects: [
          { karma: -1 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'I wrote about "that time in the elevator." {{person}} read it and laughed. I think it worked.' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: '{{person}} read my card out loud, frowned and asked which elevator. Everyone heard.', kind: 'bad' }],
          },
          { coworkerLeaves: true },
        ],
      },
      {
        id: 'goodbye',
        label: 'Say goodbye in person',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 3 },
          { karma: 2 },
          { log: 'I said a proper goodbye to {{person}}. We talked for twenty minutes. I wish we had started sooner.', kind: 'good' },
          { coworkerLeaves: true },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ credit
  {
    id: 'cw_credit_newsletter',
    category: 'work',
    title: 'The newsletter',
    text: 'The company newsletter ran a story about the project that saved our quarter, with a big photo of {{person}} holding my report. My name appears once, in the last paragraph, spelled wrong.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    cooldown: 5,
    conditions: [...FULL_TIME, DESK_WORK, HAS_A_BOSS],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'editor',
        label: 'Send the editor a correction',
        effects: [
          {
            chance: 0.6,
            then: [{ jobPerformance: 3 }, { stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -2 }, { log: "Next month's issue ran a correction with my name spelled right. Small print. I framed it.", kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The editor replied that corrections are "not really a thing we do." My name stays misspelled.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'talk',
        label: 'Talk to {{person}} about it',
        effects: [
          {
            chance: 0.55,
            then: [{ relationship: 'person', delta: 4 }, { jobPerformance: 2 }, { log: '{{person}} was mortified and told the whole team I did the work. Our next report has both names.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -6 }, { stat: 'happiness', delta: -3 }, { log: "{{person}} said the photo was the editor's idea and I should let it go. I have not.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'congratulate',
        label: 'Congratulate {{person}} anyway',
        effects: [{ karma: 2 }, { relationship: 'person', delta: 3 }, { stat: 'happiness', delta: -3 }, { log: 'I congratulated {{person}} on the big photo. It cost me something, but it was mine to give.' }],
      },
      {
        id: 'pin',
        label: 'Pin it up, corrected',
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: -4 }, { relationship: 'coworker', delta: 1 }, { log: 'I pinned the article up with my name fixed in red pen. It is the most-read thing on the board.' }],
      },
    ],
  },
  {
    id: 'cw_credit_misplaced',
    category: 'work',
    title: 'Not my idea',
    text: "In front of the whole team, my boss praised me for the fix that saved the week. The fix was {{person}}'s. {{person}} was sitting right there, very still, waiting to see what I would say.",
    minAge: 18,
    maxAge: 75,
    weight: 1,
    cooldown: 5,
    // "My boss" in front of the team: not a judge (as cw_new_boss) or a soldier, whose superiors are no boss in this sense.
    conditions: [...FULL_TIME, NOT_GIG, HAS_A_BOSS, { not: { jobId: ['judge', 'military'] } }],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'correct',
        label: 'Correct the boss',
        effects: [{ karma: 3 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 2 }, { log: "I said the fix was {{person}}'s. The boss praised {{them}} instead. {{person}} bought me a coffee.", kind: 'good' }],
      },
      {
        id: 'team',
        label: 'Call it a team effort',
        effects: [{ jobPerformance: 1 }, { relationship: 'person', delta: -2 }, { log: 'I said it was a team effort, which was true in the sense that {{person}} is on the team.' }],
      },
      {
        id: 'take',
        label: 'Take the praise',
        effects: [
          { jobPerformance: 5 },
          { karma: -4 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: -12 }, { stat: 'happiness', delta: -3 }, { log: '{{person}} told everyone whose fix it really was. They believed {{them}}, and they were right.', kind: 'bad' }],
            else: [{ relationship: 'person', delta: -6 }, { stat: 'happiness', delta: 1 }, { log: 'I took the praise. {{person}} said nothing, but {{they}} has stopped sharing ideas with me.' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ carpooling
  {
    id: 'cw_carpool_driver',
    category: 'work',
    title: 'Room in the car',
    text: '{{person}} found out we live ten minutes apart and asked, very casually, whether my car has room for one more on the way to work. {{They}} offered to chip in.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    cooldown: 6,
    conditions: [...FULL_TIME, COMMUTES, { ownsAssetId: REAL_CARS }],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'split',
        label: 'Split the running costs',
        effects: [
          { money: 200 },
          { relationship: 'person', delta: 5 },
          { log: 'We carpool now. {{person}} pays half the running costs and picks the radio station.', kind: 'money' },
          { queue: 'cw_carpool_late' },
        ],
      },
      {
        id: 'free',
        label: 'Drive {{them}} for free',
        effects: [
          { money: -100 },
          { karma: 2 },
          { relationship: 'person', delta: 8 },
          { log: 'I said no money needed. {{person}} brings me a pastry most mornings, which is better than money.', kind: 'good' },
          { queue: 'cw_carpool_late' },
        ],
      },
      {
        id: 'excuse',
        label: 'Make an excuse',
        effects: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: 1 }, { log: 'I said I run errands after work. I have never run an errand in my life. {{person}} knows.' }],
      },
    ],
  },
  {
    id: 'cw_carpool_late',
    category: 'work',
    title: 'Waiting at the curb',
    text: 'Carpooling with {{person}} has one problem: {{they}} is never ready. This morning I waited twelve minutes outside {{their}} building while {{they}} looked for {{their}} keys.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    followUpOnly: true,
    conditions: [...FULL_TIME, COMMUTES, { ownsAssetId: REAL_CARS }],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'wait',
        label: 'Wait patiently, as always',
        effects: [{ jobPerformance: -2 }, { relationship: 'person', delta: 3 }, { karma: 1 }, { log: 'I waited. We were both late. {{person}} found the keys in the fridge, which raised questions.' }],
      },
      {
        id: 'leave',
        label: 'Leave without {{them}}',
        effects: [{ jobPerformance: 1 }, { relationship: 'person', delta: -8 }, { log: '{{person}} took the bus in and did not speak to me until lunch.', kind: 'bad' }],
      },
      {
        id: 'rule',
        label: 'Set a five-minute rule',
        effects: [
          {
            chance: 0.6,
            then: [{ jobPerformance: 1 }, { relationship: 'person', delta: 2 }, { log: 'I set a five-minute rule. {{person}} now waits at the curb, hair still wet, but on time.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -4 }, { log: 'I set a five-minute rule. {{person}} called it "very corporate" and went back to the bus.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cw_carpool_passenger',
    category: 'work',
    title: 'A ride to work',
    text: '{{person}} saw me waiting for the bus in the rain and pulled over. Now {{they}} offers me a ride every morning, on one condition: I listen to {{their}} audiobooks about ancient history.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    cooldown: 6,
    conditions: [...FULL_TIME, COMMUTES, { not: { ownsAssetId: REAL_CARS } }],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'gas',
        label: 'Accept, and pay for gas',
        hint: '{{$150}}',
        effects: [{ money: -150 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'I ride with {{person}} now. I pay for gas and know far more about ancient empires than before.', kind: 'good' }],
      },
      {
        id: 'breakfast',
        label: 'Accept, and bring breakfast',
        hint: '{{$60}}',
        effects: [{ money: -60 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 2 }, { log: 'I pay my way in breakfast sandwiches. {{person}} says it is the best deal {{they}} has ever made.', kind: 'good' }],
      },
      {
        id: 'bus',
        label: 'Stick with the bus',
        effects: [{ stat: 'happiness', delta: -1 }, { relationship: 'person', delta: -2 }, { log: 'I thanked {{person}} and kept taking the bus. It is slower, but nobody quizzes me on emperors.' }],
      },
    ],
  },

  // ------------------------------------------------------------ weddings
  {
    id: 'cw_wedding_invite',
    category: 'work',
    title: 'A wedding invitation',
    text: '{{person}} handed me a cream-colored envelope at work: an invitation to {{their}} wedding. We have had maybe a dozen real conversations, and I am apparently one of 140 guests.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    // A coworker's wedding happens once, and no card can tell who already married, so the card is once a life; "a
    // dozen real conversations" is someone I have known a few years at most.
    once: true,
    conditions: [...FULL_TIME, { not: { sinceEvent: 'cw_wedding_speech', lte: 2 } }],
    person: { kind: ['coworker'], minAge: 20, maxRelationship: 64, knownFor: { lte: 5 } },
    choices: [
      {
        id: 'go',
        label: 'Go, and bring a gift',
        hint: '{{$150}}',
        effects: [{ money: -150 }, { energy: -1 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 3 }, { log: 'I went, danced badly and hugged {{person}} twice. A lovely day, and I barely knew anyone.', kind: 'good' }],
      },
      {
        id: 'spouse',
        label: 'Go with {{spouse}}',
        hint: '{{$220}}',
        conditions: [{ married: true }],
        effects: [
          { money: -220 },
          { energy: -1 },
          { relationship: 'person', delta: 8 },
          { relationship: 'spouse', delta: 3 },
          { stat: 'happiness', delta: 4 },
          { log: '{{spouse}} and I danced until the band packed up. {{person}} said we made the best photos.', kind: 'good' },
        ],
      },
      {
        id: 'gift',
        label: 'Send a gift instead',
        hint: '{{$80}}',
        effects: [{ money: -80 }, { relationship: 'person', delta: 3 }, { log: 'I sent a gift and a kind card. {{person}} showed me the photos on Monday. I looked at all of them.' }],
      },
      {
        id: 'decline',
        label: 'Politely decline',
        effects: [{ relationship: 'person', delta: -5 }, { stat: 'happiness', delta: 1 }, { log: 'I said I had a conflict. {{person}} said that was fine, in the voice people use when it is not.' }],
      },
    ],
  },
  {
    id: 'cw_wedding_speech',
    category: 'work',
    title: 'Asked to speak',
    text: '{{person}} asked me to give a speech at {{their}} wedding. "You know me better than anyone at work," {{they}} said, which is true and also a little worrying.',
    minAge: 18,
    maxAge: 75,
    weight: 0.6,
    // A coworker's wedding happens once (as cw_wedding_invite).
    once: true,
    conditions: [...FULL_TIME, { not: { sinceEvent: 'cw_wedding_invite', lte: 2 } }],
    person: { kind: ['coworker'], minAge: 20, minRelationship: 65 },
    choices: [
      {
        id: 'heartfelt',
        label: 'Write a heartfelt speech',
        effects: [
          { energy: -1 },
          {
            chance: 0.65,
            then: [{ relationship: 'person', delta: 10 }, { stat: 'happiness', delta: 6 }, { log: 'My speech made {{person}} cry and the caterers stop to listen. The best thing I have written.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: -2 }, { log: 'I lost my place twice and thanked the wrong aunt. {{person}} laughed and said it was perfect.' }],
          },
        ],
      },
      {
        id: 'funny',
        label: 'Tell the funny stories',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 8 }, { relationship: 'coworker', delta: 2 }, { stat: 'happiness', delta: 4 }, { log: 'I told the one about {{person}} and the goose in the parking lot. The whole room roared.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -6 }, { stat: 'happiness', delta: -4 }, { log: "One of my funny stories was not funny to {{person}}'s new in-laws. I sat down quickly.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Decline the honor',
        effects: [{ relationship: 'person', delta: -6 }, { stat: 'happiness', delta: 1 }, { log: 'I said I would be a terrible speaker. {{person}} asked a cousin instead. I clapped very hard.' }],
      },
    ],
  },

  // ------------------------------------------------------------ cake politics
  {
    id: 'cw_cake_vote',
    category: 'work',
    title: 'The cake vote',
    text: 'There are two cake factions at work: a cake for every birthday, or one cake a month for everyone. {{person}} leads the every-birthday side and is counting on my vote today.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    // The same two cake factions: at most twice in a life (CONTENT_STYLE).
    cooldown: 29,
    conditions: [...FULL_TIME, NOT_GIG],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'every',
        label: 'Vote for every birthday',
        effects: [{ money: -40 }, { stat: 'health', delta: -1 }, { relationship: 'person', delta: 6 }, { log: 'Every birthday gets a cake now. My waistline and wallet both noticed. {{person}} calls me a hero.' }],
      },
      {
        id: 'monthly',
        label: 'Vote for one a month',
        effects: [{ stat: 'health', delta: 1 }, { relationship: 'person', delta: -6 }, { log: 'One cake a month won by a single vote: mine. {{person}} has not looked at me directly since.' }],
      },
      {
        id: 'bake',
        label: 'Bake every cake myself',
        hint: '{{$120}}',
        effects: [{ money: -120 }, { energy: -1 }, { relationship: 'coworker', delta: 4 }, { karma: 2 }, { stat: 'happiness', delta: -1 }, { log: 'I offered to bake every cake myself. Both factions applauded. I may have made a mistake.' }],
      },
      {
        id: 'abstain',
        label: 'Abstain and eat whatever',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: -2 }, { log: 'I abstained. Both sides now suspect me, but I still get cake either way.' }],
      },
    ],
  },
  {
    id: 'cw_last_slice',
    category: 'work',
    title: 'The last slice',
    text: "One slice of my birthday cake was left in the fridge at work, with a sticky note: my name. At three o'clock I found {{person}} eating it, the note still stuck to the plate.",
    minAge: 18,
    maxAge: 75,
    weight: 1,
    // The same slice and the same sticky note: twice in a working life at most.
    cooldown: 29,
    conditions: [...FULL_TIME, NOT_GIG],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'laugh',
        label: 'Laugh it off',
        effects: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: -1 }, { log: 'I laughed. {{person}} laughed, mouth full. I will never see that slice again, but I have a story.' }],
      },
      {
        id: 'replace',
        label: 'Demand a replacement cake',
        effects: [
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 3 }, { log: '{{person}} brought in a whole cake the next morning, with "SORRY" written in frosting.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -5 }, { stat: 'happiness', delta: -2 }, { log: '{{person}} said the note was "more of a suggestion." We are fine now, which means we are not.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'rules',
        label: 'Post new fridge rules',
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'coworker', delta: -3 }, { karma: -1 }, { log: 'I taped laminated fridge rules to the door. Three people signed them sarcastically.' }],
      },
    ],
  },

  // ------------------------------------------------------------ covering for someone
  {
    id: 'cw_shift_swap',
    category: 'work',
    title: 'One more late shift',
    text: '{{person}} is one late shift away from being let go. {{They}} has nobody to watch {{their}} kids before nine and asked if I would trade my early shifts for {{their}} late ones this month.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    cooldown: 4,
    conditions: [...FULL_TIME, SHIFT_WORK, NOT_A_MANAGER],
    person: { kind: ['coworker'], minAge: 24 },
    choices: [
      {
        id: 'all',
        label: 'Trade every shift',
        effects: [{ energy: -1 }, { stat: 'health', delta: -2 }, { stat: 'happiness', delta: -2 }, { karma: 3 }, { relationship: 'person', delta: 10 }, { log: 'I worked every late shift for a month and saw a lot of midnights. {{person}} kept {{their}} job.', kind: 'good' }],
      },
      {
        id: 'week',
        label: 'Trade one week only',
        effects: [
          { karma: 1 },
          { relationship: 'person', delta: 2 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 3 }, { log: 'One week gave {{person}} time to find a sitter. {{They}} kept the job, just barely.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'One week was not enough. {{person}} was late the Thursday after and lost the job.', kind: 'bad' }, { coworkerLeaves: true }],
          },
        ],
      },
      {
        id: 'supervisor',
        label: 'Tell {{them}} to ask the supervisor',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 3 }, { log: 'The supervisor moved {{person}} to afternoons. {{They}} said asking was the hardest part.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The supervisor said rules are rules. {{person}} was let go at the end of the month.', kind: 'bad' }, { coworkerLeaves: true }],
          },
        ],
      },
      {
        id: 'no',
        label: 'Say I cannot',
        effects: [
          { relationship: 'person', delta: -6 },
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: -4 }, { log: 'I said no. Two weeks later {{person}} was let go. I keep thinking about that schedule.', kind: 'bad' }, { coworkerLeaves: true }],
            else: [{ log: 'I said no. {{person}} found a neighbor to help with the kids. We are fine, mostly.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cw_vacation_cover',
    category: 'work',
    title: 'Just answer the emails',
    text: '{{person}} left for two weeks of vacation and handed me {{their}} work with a sticky note: "Easy, just answer emails." On day one I found the emails. There are four hundred of them.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    cooldown: 4,
    conditions: [...FULL_TIME, DESK_WORK, HAS_A_BOSS, { year: { gte: 2000 } }],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'all',
        label: 'Answer every last one',
        effects: [{ energy: -1 }, { stat: 'health', delta: -1 }, { stat: 'happiness', delta: -3 }, { jobPerformance: 4 }, { relationship: 'person', delta: 6 }, { log: 'I answered all four hundred. {{person}} came back tan, rested and owing me lunch for life.', kind: 'good' }],
      },
      {
        id: 'urgent',
        label: 'Answer only the urgent ones',
        effects: [{ jobPerformance: 1 }, { relationship: 'person', delta: 2 }, { log: 'I answered the urgent ones and flagged the rest. {{person}} came back to a manageable mess.' }],
      },
      {
        id: 'forward',
        label: 'Forward everything to {{them}}',
        effects: [
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -6 },
          {
            chance: 0.5,
            then: [{ jobPerformance: -3 }, { log: 'I forwarded it all to {{person}} on vacation. The boss heard about it before {{person}} did.', kind: 'bad' }],
            else: [{ log: 'I forwarded it all to {{person}} on vacation. {{They}} replied from a beach with one word: "Wow."' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ rumors and secrets
  {
    id: 'cw_umbrella_rumor',
    category: 'work',
    title: 'One umbrella',
    text: 'Someone saw {{person}} and me sharing an umbrella to the parking lot, and by lunch everyone at work had us secretly dating. {{person}} heard it too and turned the color of a stop sign.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    cooldown: 5,
    conditions: [...FULL_TIME],
    person: { kind: ['coworker'], minAge: 18 },
    choices: [
      {
        id: 'laugh',
        label: 'Laugh it off together',
        effects: [
          { relationship: 'person', delta: 4 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 2 }, { log: '{{person}} and I laughed about it over coffee, in public, which only made it worse. Worth it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'We laughed about it over coffee, in public. By Friday the rumor had a wedding date.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'straight',
        label: 'Set the record straight',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 1 }, { relationship: 'coworker', delta: 1 }, { log: 'I told the team, calmly, that we share an umbrella and nothing else. The rumor died by Friday.' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I denied it so firmly that everyone believes it more. {{person}} has bought a second umbrella.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'source',
        label: 'Find out who started it',
        effects: [
          { karma: -1 },
          { relationship: 'coworker', delta: -3 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I traced it to the loudest person at work, who apologized to us both and now avoids umbrellas.' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I asked around until a second rumor started: that I am obsessed with the first one.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'spouse',
        label: 'Tell {{spouse}} before anyone else',
        conditions: [{ married: true }],
        effects: [{ relationship: 'spouse', delta: 3 }, { stat: 'happiness', delta: 2 }, { log: 'I told {{spouse}} the rumor over dinner. There was laughing, and then a lot more laughing.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'cw_kept_secret',
    category: 'work',
    title: 'Keeping a secret',
    text: '{{person}} told me, quietly, that {{they}} is dating someone else at work and asked me to keep it to myself. Now the gossips have started asking me questions with their eyebrows.',
    minAge: 18,
    maxAge: 75,
    weight: 0.8,
    cooldown: 5,
    conditions: [...FULL_TIME],
    person: { kind: ['coworker'], minAge: 18 },
    choices: [
      {
        id: 'keep',
        label: 'Keep the secret',
        effects: [{ karma: 2 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: -1 }, { log: 'I said nothing, even under heavy eyebrow pressure. {{person}} trusts me with everything now.', kind: 'good' }],
      },
      {
        id: 'hint',
        label: 'Drop a vague hint',
        effects: [
          { karma: -3 },
          { relationship: 'coworker', delta: 2 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: -10 }, { log: 'My hint traveled faster than I did. {{person}} knew exactly who had talked.', kind: 'bad' }],
            else: [{ log: 'My hint confused everyone, including me. {{person}} never found out, I think.' }],
          },
        ],
      },
      {
        id: 'public',
        label: 'Tell {{them}} to go public',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 2 }, { log: '{{person}} took my advice and told everyone. The gossips lost interest within the hour.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -4 }, { log: '{{person}} said it was not my call. {{They}} was right, and I said so.' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ the new boss
  {
    id: 'cw_new_boss',
    category: 'work',
    title: 'My new boss',
    text: '{{person}} got the promotion we both applied for. We used to complain about management together at lunch. As of Monday, {{they}} is management.',
    minAge: 18,
    maxAge: 75,
    weight: 0.8,
    cooldown: 8,
    // Judges are appointed to the bench, not promoted into management.
    conditions: [...FULL_TIME, NOT_GIG, CIVILIAN, NOT_A_MANAGER, { not: { jobId: ['judge'] } }],
    person: { kind: ['coworker'], minAge: 22, maxAge: 62, minRelationship: 45 },
    choices: [
      {
        id: 'congratulate',
        label: 'Congratulate {{them}} sincerely',
        effects: [
          { karma: 2 },
          { relationship: 'person', delta: 5 },
          { jobPerformance: 2 },
          { stat: 'happiness', delta: -2 },
          { log: "I shook {{person}}'s hand and meant it, mostly. Our lunch complaints will need a new target.", kind: 'good' },
          { queue: 'cw_boss_off_record' },
        ],
      },
      {
        id: 'honest',
        label: 'Ask {{them}} to stay honest',
        effects: [
          { relationship: 'person', delta: 3 },
          {
            chance: 0.6,
            then: [{ jobPerformance: 3 }, { log: 'I asked {{person}} to stay straight with me. {{They}} promised, and so far {{they}} has.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { log: 'I asked {{person}} to stay straight with me. {{They}} said, "Let\'s take that offline." It begins.' }],
          },
          { queue: 'cw_boss_off_record' },
        ],
      },
      {
        id: 'test',
        label: 'Test the new boss',
        effects: [{ jobPerformance: -4 }, { stat: 'happiness', delta: 3 }, { relationship: 'person', delta: -5 }, { karma: -1 }, { log: 'I came in late on purpose to see what {{person}} would do. {{They}} wrote it down.', kind: 'bad' }],
      },
      {
        id: 'hunt',
        label: 'Quietly look elsewhere',
        effects: [{ jobPerformance: -2 }, { stat: 'happiness', delta: 2 }, { log: 'I updated my résumé that night. Taking orders from {{person}} was not in my plans.' }],
      },
    ],
  },
  {
    id: 'cw_boss_off_record',
    category: 'work',
    title: 'Off the record',
    text: '{{person}}, my old lunch partner and now my boss, closed the door and asked me, off the record, who on the team is not pulling their weight. {{They}} said it would stay between us.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    followUpOnly: true,
    // Queued by cw_new_boss: still below the old lunch partner, so not if I have since reached the top rung.
    conditions: [...FULL_TIME, NOT_GIG, HAS_A_BOSS],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'names',
        label: 'Name names',
        effects: [
          { jobPerformance: 5 },
          { karma: -4 },
          { relationship: 'person', delta: 4 },
          {
            chance: 0.4,
            then: [{ relationship: 'coworker', delta: -5 }, { log: 'I named two people. A week later both knew it was me. Nothing stays between us.', kind: 'bad' }],
            else: [{ log: 'I named two people. {{person}} thanked me. I have avoided their eyes ever since.' }],
          },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse politely',
        effects: [{ karma: 3 }, { jobPerformance: -1 }, { relationship: 'person', delta: -4 }, { log: 'I said I was not comfortable with that. {{person}} nodded slowly, like a boss.' }],
      },
      {
        id: 'mine',
        label: 'Talk about my own work',
        effects: [{ jobPerformance: 2 }, { relationship: 'person', delta: 1 }, { log: 'I talked about my own projects for ten minutes. {{person}} gave up and let me go.' }],
      },
    ],
  },

  // ------------------------------------------------------------ pets, babies, loss
  {
    id: 'cw_sick_dog',
    category: 'work',
    title: 'An old dog',
    text: "{{person}}'s old dog has been sick for weeks. Today {{they}} came to work with red eyes and a vet estimate folded in {{their}} pocket, and spent lunch staring at it.",
    minAge: 18,
    maxAge: 75,
    weight: 1,
    cooldown: 5,
    // A vet's coworkers would treat the dog themselves, not bring in an estimate.
    conditions: [...FULL_TIME, { not: { jobId: ['vet'] } }],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'chip',
        label: 'Chip in for the vet',
        hint: '{{$200}}',
        effects: [
          { money: -200 },
          { karma: 3 },
          { relationship: 'person', delta: 8 },
          {
            random: [
              { weight: 6, effects: [{ stat: 'happiness', delta: 3 }, { log: '{{person}} sent me a photo of the dog asleep on the couch. It pulled through.', kind: 'good' }] },
              { weight: 4, effects: [{ stat: 'happiness', delta: -2 }, { log: '{{person}} said the dog died gently that weekend, and that our help gave it one more good week.' }] },
            ],
          },
        ],
      },
      {
        id: 'cover',
        label: 'Cover {{their}} afternoon',
        effects: [{ energy: -1 }, { jobPerformance: -1 }, { karma: 2 }, { relationship: 'person', delta: 8 }, { log: 'I covered the afternoon so {{person}} could be at the vet. {{They}} hugged me in the hallway.', kind: 'good' }],
      },
      {
        id: 'card',
        label: 'Get everyone to sign a card',
        effects: [{ relationship: 'person', delta: 3 }, { relationship: 'coworker', delta: 1 }, { log: 'We all signed a card with a cartoon dog on it. {{person}} kept it for months.' }],
      },
      {
        id: 'professional',
        label: 'Keep things professional',
        effects: [{ jobPerformance: 1 }, { relationship: 'person', delta: -3 }, { log: 'I said I was sorry and went back to work. {{person}} said thanks, and nothing else.' }],
      },
    ],
  },
  {
    id: 'cw_baby_shower',
    category: 'work',
    title: 'The baby shower',
    text: '{{person}} starts parental leave on Friday, and the team is throwing a small shower at work. Somehow I am in charge of the games, which so far is one game: guess the baby food.',
    minAge: 18,
    maxAge: 75,
    weight: 0.8,
    cooldown: 4,
    conditions: [...FULL_TIME],
    person: { kind: ['coworker'], minAge: 22, maxAge: 45 },
    choices: [
      {
        id: 'games',
        label: 'Run the games with gusto',
        effects: [{ energy: -1 }, { relationship: 'coworker', delta: 3 }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 3 }, { log: 'I ran the baby food game like a quiz show. {{person}} laughed until {{they}} had to sit down.', kind: 'good' }],
      },
      {
        id: 'gift',
        label: 'Buy a really good gift',
        hint: '{{$120}}',
        effects: [{ money: -120 }, { karma: 1 }, { relationship: 'person', delta: 8 }, { log: 'I bought the soft blanket {{person}} actually wanted. {{They}} hugged me and held up the line.', kind: 'good' }],
      },
      {
        id: 'cover',
        label: 'Offer to cover {{their}} work',
        effects: [{ energy: -1 }, { stat: 'happiness', delta: -2 }, { jobPerformance: 2 }, { karma: 2 }, { relationship: 'person', delta: 8 }, { log: 'I offered to cover for {{person}} during the leave. {{They}} looked at me like I had offered sleep.', kind: 'good' }],
      },
      {
        id: 'slip',
        label: 'Sign the card, slip out',
        effects: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: 1 }, { log: 'I signed the card, ate one cupcake and slipped out early. I hope the baby food guesses went well.' }],
      },
    ],
  },
  {
    id: 'cw_grief',
    category: 'work',
    title: 'Back too soon',
    text: "{{person}} came back to work a week after {{their}} mother's funeral. People keep saying they are sorry in the hallway and hurrying off. {{person}} looks like {{they}} has not slept.",
    minAge: 18,
    maxAge: 75,
    weight: 0.6,
    // A coworker loses a mother once.
    once: true,
    conditions: [...FULL_TIME],
    person: { kind: ['coworker'], minAge: 25 },
    choices: [
      {
        id: 'work',
        label: 'Take some work off {{them}}',
        effects: [{ energy: -1 }, { jobPerformance: -1 }, { stat: 'happiness', delta: -1 }, { karma: 3 }, { relationship: 'person', delta: 8 }, { log: "I quietly took two tasks off {{person}}'s list. {{They}} noticed and squeezed my arm.", kind: 'good' }],
      },
      {
        id: 'ask',
        label: 'Ask about {{their}} mother',
        effects: [
          {
            chance: 0.7,
            then: [{ karma: 2 }, { relationship: 'person', delta: 8 }, { log: 'I asked what {{their}} mother was like. {{person}} talked for twenty minutes and smiled twice.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -1 }, { log: 'I asked about {{their}} mother. {{person}} was not ready and left the room. I let {{them}} be.' }],
          },
        ],
      },
      {
        id: 'card',
        label: 'Leave a card on {{their}} chair',
        hint: '{{$20}}',
        effects: [{ money: -20 }, { karma: 1 }, { relationship: 'person', delta: 4 }, { log: 'I left a card saying I was sorry and lunch was on me. {{person}} kept it, and took the lunch.' }],
      },
      {
        id: 'space',
        label: 'Give {{them}} space',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 3 }, { log: 'I gave {{person}} space. Weeks later {{they}} thanked me for being the one who made no fuss.' }],
            else: [{ relationship: 'person', delta: -2 }, { log: 'I gave {{person}} space. It may have looked like I did not care. I did.' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ lunch rituals
  {
    id: 'cw_lunch_bench',
    category: 'work',
    title: 'The lunch bench',
    text: 'Every day at noon, {{person}} and I eat on the same bench and argue about the same things. Today a new hire hovered nearby with a sandwich, clearly hoping to be invited.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    cooldown: 5,
    conditions: [...FULL_TIME, NOT_GIG, ON_SITE, CIVILIAN],
    person: { kind: ['coworker'], minRelationship: 45 },
    choices: [
      {
        id: 'invite',
        label: 'Invite the new hire over',
        effects: [
          { karma: 1 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -2 },
          { log: 'I waved the new hire over. {{person}} sighed, then made room.' },
          { newPerson: { kind: 'coworker', relationship: 55, log: '{{person}} joined our bench. {{They}} has strong opinions about sandwiches, which is the entry fee.' } },
        ],
      },
      {
        id: 'ours',
        label: 'Keep it our bench',
        effects: [{ karma: -2 }, { relationship: 'person', delta: 5 }, { log: 'We kept eating and did not look up. {{person}} said some traditions are worth being rude for.' }],
      },
      {
        id: 'decide',
        label: 'Let {{person}} decide',
        effects: [
          {
            chance: 0.5,
            then: [
              { relationship: 'person', delta: 2 },
              { log: '{{person}} shrugged and waved the new hire over.' },
              { newPerson: { kind: 'coworker', relationship: 50, log: '{{person}} took the end of the bench and has not left it since. We are three now.' } },
            ],
            else: [{ relationship: 'person', delta: 3 }, { log: '{{person}} said "not today" with great kindness. The new hire found another bench.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cw_potluck',
    category: 'work',
    title: 'Something homemade',
    text: '{{person}} organized a potluck for the team and signed me up for "something homemade." My cooking peaked years ago with a grilled cheese, and {{person}} knows it.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    cooldown: 4,
    // Cooking for a living makes the grilled cheese line untrue.
    conditions: [...FULL_TIME, { not: { jobId: ['chef', 'chef_tv'] } }],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'cook',
        label: 'Cook something brave',
        hint: '{{$20}}',
        effects: [
          { money: -20 },
          { energy: -1 },
          {
            chance: 0.5,
            then: [{ relationship: 'coworker', delta: 3 }, { stat: 'happiness', delta: 4 }, { log: 'My casserole was gone in ten minutes. {{person}} asked for the recipe, so I had to invent one.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: 2 }, { log: 'Nobody touched my casserole except {{person}}, out of loyalty. {{They}} was quiet all afternoon.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'buy',
        label: 'Buy something, act natural',
        hint: '{{$40}}',
        effects: [
          { money: -40 },
          { karma: -1 },
          {
            chance: 0.35,
            then: [{ relationship: 'coworker', delta: -2 }, { stat: 'happiness', delta: -3 }, { log: '{{person}} found the bakery sticker under my "homemade" pie and announced it to the room.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 2 }, { log: 'My bakery pie got compliments. I accepted them humbly, as its creator.' }],
          },
        ],
      },
      {
        id: 'plates',
        label: 'Bring the paper plates',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: -3 }, { log: 'I brought paper plates. {{person}} said that is not cooking. The plates were very useful.' }],
      },
    ],
  },
  {
    id: 'cw_lunch_laps',
    category: 'work',
    title: 'Lunch laps',
    text: '{{person}} has started spending lunch walking laps around the building, and every day {{they}} stops by to ask if I am coming. Every day I hold up my sandwich as an excuse.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    cooldown: 4,
    conditions: [...FULL_TIME, NOT_GIG, ON_SITE],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'join',
        label: 'Join the lunch laps',
        effects: [{ energy: -1 }, { stat: 'health', delta: 4 }, { relationship: 'person', delta: 6 }, { log: 'I walk laps with {{person}} now, sandwich in hand. We have covered many miles of gossip.', kind: 'good' }],
      },
      {
        id: 'weekly',
        label: 'Join once a week',
        effects: [{ stat: 'health', delta: 2 }, { relationship: 'person', delta: 3 }, { log: 'I walk with {{person}} on Wednesdays. It is the best part of my Wednesdays, which says a lot.' }],
      },
      {
        id: 'sandwich',
        label: 'Keep the sandwich excuse',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'health', delta: -1 }, { relationship: 'person', delta: -2 }, { log: 'I kept my lunch and my chair. {{person}} waves on the way past, a little faster each week.' }],
      },
    ],
  },

  // ------------------------------------------------------------ references and interviews
  {
    id: 'cw_reference',
    category: 'work',
    title: 'A reference',
    text: '{{person}} is applying for a job somewhere else and asked me to be a reference. {{They}} is great at the work and terrible at mornings. If {{they}} gets it, {{they}} leaves.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    cooldown: 4,
    conditions: [...FULL_TIME, NOT_GIG, CIVILIAN],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'glowing',
        label: 'Give a glowing reference',
        effects: [
          { karma: 2 },
          { relationship: 'person', delta: 8 },
          {
            chance: 0.65,
            then: [{ stat: 'happiness', delta: 1 }, { log: '{{person}} got the job and called me first to tell me. Work is quieter without {{them}}.', kind: 'good' }, { coworkerLeaves: true }],
            else: [{ log: '{{person}} did not get it. {{They}} thanked me anyway and stayed, a little sad, a little relieved.' }],
          },
        ],
      },
      {
        id: 'honest',
        label: 'Give an honest one',
        effects: [
          { karma: 3 },
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: 2 }, { log: 'I mentioned the mornings. {{person}} got the job anyway. The new place starts at ten.', kind: 'good' }, { coworkerLeaves: true }],
            else: [{ relationship: 'person', delta: -4 }, { log: 'I was honest about the mornings. {{person}} did not get it and suspects my honesty was why.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'stay',
        label: 'Ask {{them}} to stay',
        effects: [
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 2 }, { log: 'I told {{person}} the team would fall apart without {{them}}. {{They}} stayed. The team agrees.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: '{{person}} said that was sweet, took the new job anyway and left on good terms.' }, { coworkerLeaves: true }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Decline to be a reference',
        effects: [{ relationship: 'person', delta: -6 }, { stat: 'happiness', delta: 1 }, { log: 'I said I was not comfortable being a reference. {{person}} found someone else and remembered.' }],
      },
    ],
  },
  {
    id: 'cw_interview_cover',
    category: 'work',
    title: 'Interview day',
    text: '{{person}} slipped out for a job interview somewhere else and asked me to cover for {{them}}. Twenty minutes later the boss stopped by and asked if I knew where {{person}} had gone.',
    minAge: 18,
    maxAge: 75,
    weight: 0.8,
    cooldown: 5,
    // The boss stopping by: not a judge's chambers (as cw_new_boss).
    conditions: [...FULL_TIME, NOT_GIG, CIVILIAN, HAS_A_BOSS, { not: { jobId: ['judge'] } }],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'dentist',
        label: 'Say {{they}} is at the dentist',
        effects: [
          { karma: -1 },
          { relationship: 'person', delta: 6 },
          {
            chance: 0.75,
            then: [{ log: 'I said dentist. The boss nodded. {{person}} came back an hour later and quietly bought me lunch.' }],
            else: [{ jobPerformance: -3 }, { log: 'I said dentist. The boss had just seen {{person}} at the coffee shop in a suit.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'shrug',
        label: 'Shrug and say nothing',
        effects: [
          { relationship: 'person', delta: 2 },
          {
            chance: 0.5,
            then: [{ jobPerformance: -1 }, { log: 'I shrugged. The boss waited. I shrugged again. {{person}} later got a talk about long lunches.' }],
            else: [{ log: 'I shrugged. The boss shrugged back and left. {{person}} never knew how close it was.' }],
          },
        ],
      },
      {
        id: 'truth',
        label: 'Tell the truth',
        effects: [{ jobPerformance: 2 }, { karma: -2 }, { relationship: 'person', delta: -10 }, { log: 'I said {{person}} was at an interview. The boss went quiet. {{person}} found out by the afternoon.', kind: 'bad' }],
      },
    ],
  },

  // ------------------------------------------------------------ treated unfairly
  {
    id: 'cw_age_jokes',
    category: 'work',
    title: 'Fresh energy',
    text: 'Our manager keeps joking about {{person}}\'s age in meetings, and this week took {{them}} off the project {{they}} has led for years, for "fresh energy." {{person}} laughed along, then sat very still.',
    // The player is younger than the coworker the jokes target (coworkers are hired within a few years of my age).
    minAge: 18,
    maxAge: 50,
    weight: 0.8,
    cooldown: 6,
    // An HR player would be the one receiving the complaint, not watching it.
    conditions: [...FULL_TIME, DESK_WORK, HAS_A_BOSS, { not: { jobId: ['hr'] } }],
    person: { kind: ['coworker'], minAge: 52 },
    choices: [
      {
        id: 'speak',
        label: 'Speak up in the meeting',
        effects: [
          { karma: 4 },
          { relationship: 'person', delta: 8 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: "I said the jokes were not funny and the project was {{person}}'s. The room went quiet. It stopped.", kind: 'good' }],
            else: [{ jobPerformance: -4 }, { stat: 'happiness', delta: -2 }, { log: 'I spoke up. The manager called me "very passionate." My next review mentioned it.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'document',
        label: 'Help {{them}} write it down',
        effects: [
          { energy: -1 },
          { karma: 3 },
          { relationship: 'person', delta: 10 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'We wrote down every date and remark. HR read it, and {{person}} got the project back.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'We wrote it all down. HR promised to "keep an eye on it." {{person}} is quietly job hunting.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'check',
        label: 'Check on {{them}} privately',
        effects: [{ karma: 1 }, { relationship: 'person', delta: 4 }, { log: 'I asked {{person}} if {{they}} was okay. {{They}} said no, then thanked me for asking.' }],
      },
      {
        id: 'out',
        label: 'Stay out of it',
        effects: [{ karma: -3 }, { jobPerformance: 2 }, { relationship: 'person', delta: -6 }, { stat: 'happiness', delta: -2 }, { log: 'I stayed out of it and off the manager\'s radar. {{person}} stopped joining us for lunch.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'cw_holiday_shifts',
    category: 'work',
    title: 'Every holiday shift',
    text: 'The supervisor gave {{person}} every holiday shift on the new schedule, while {{their}} own time-off requests sit unanswered in a folder. Everyone has noticed. Nobody has said anything.',
    minAge: 18,
    maxAge: 75,
    weight: 0.8,
    cooldown: 5,
    conditions: [...FULL_TIME, SHIFT_WORK, NOT_A_MANAGER],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'raise',
        label: 'Raise it with the supervisor',
        effects: [
          { karma: 3 },
          { relationship: 'person', delta: 6 },
          {
            chance: 0.55,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'I asked the supervisor how holidays get assigned. By Friday the schedule had changed.', kind: 'good' }],
            else: [{ jobPerformance: -3 }, { stat: 'happiness', delta: -2 }, { log: 'The supervisor said the schedule was "not up for discussion." Mine got worse the next week.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'take',
        label: 'Take one of {{their}} shifts',
        effects: [{ energy: -1 }, { stat: 'happiness', delta: -3 }, { karma: 3 }, { relationship: 'person', delta: 8 }, { log: "I took one of {{person}}'s holiday shifts so {{they}} could be home for it. The supervisor frowned.", kind: 'good' }],
      },
      {
        id: 'rally',
        label: 'Rally the whole team',
        effects: [
          { karma: 2 },
          { relationship: 'coworker', delta: 4 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'Six of us signed a note asking for a holiday rotation. We got one. {{person}} got a holiday.', kind: 'good' }],
            else: [{ jobPerformance: -5 }, { log: 'Our note went up the chain and came back with my name circled. The rotation never happened.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'head_down',
        label: 'Keep my head down',
        effects: [{ karma: -2 }, { jobPerformance: 1 }, { relationship: 'person', delta: -4 }, { log: '{{person}} worked every holiday. I kept my head down and felt strange at every dinner.' }],
      },
    ],
  },

  // ------------------------------------------------------------ the gift exchange
  {
    id: 'cw_gift_exchange',
    category: 'work',
    title: 'The gift exchange',
    text: 'The holiday gift exchange at work has a {{$25}} limit, and I drew {{person}}. I know exactly one thing about {{them}}: {{they}} owns a very large mug, and {{they}} guards it.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    cooldown: 4,
    conditions: [...FULL_TIME, { not: { sinceEvent: 'cw_gift_received', lte: 0 } }],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'ask',
        label: 'Ask around for ideas',
        hint: '{{$25}}',
        effects: [
          { money: -25 },
          { energy: -1 },
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 3 }, { log: 'I learned {{person}} loves crosswords. The puzzle book I gave {{them}} got a real grin.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 2 }, { log: 'Everyone I asked said "mugs?" I bought {{person}} a book {{they}} already had.' }],
          },
        ],
      },
      {
        id: 'mug',
        label: 'Buy another large mug',
        hint: '{{$25}}',
        effects: [
          { money: -25 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 2 }, { log: '{{person}} now has two very large mugs and an expression I choose to read as joy.' }],
            else: [{ log: '{{person}} unwrapped the mug and said, "Oh. A mug." It was the right size, at least.' }],
          },
        ],
      },
      {
        id: 'over',
        label: 'Blow past the limit',
        hint: '{{$90}}',
        effects: [{ money: -90 }, { relationship: 'person', delta: 6 }, { relationship: 'coworker', delta: -2 }, { log: "I went well over the limit. {{person}} loved it. The other gifts looked small, and people said so." }],
      },
      {
        id: 'regift',
        label: 'Regift something from home',
        effects: [
          { karma: -1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'I regifted a scented candle. {{person}} liked it. I have told no one, until now.' }],
            else: [{ relationship: 'person', delta: -5 }, { stat: 'happiness', delta: -2 }, { log: "I regifted a candle. {{person}} found the old gift tag inside, with someone else's name on it.", kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cw_gift_received',
    category: 'work',
    title: 'A thoughtful gift',
    text: '{{person}} drew my name in the holiday gift exchange and gave me something I mentioned once, months ago, in passing. The coworker I drew got a box of chocolates from a gas station.',
    minAge: 18,
    maxAge: 75,
    weight: 0.8,
    cooldown: 4,
    conditions: [...FULL_TIME, { not: { sinceEvent: 'cw_gift_exchange', lte: 0 } }],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'note',
        label: 'Write {{them}} a real thank-you',
        effects: [{ energy: -1 }, { karma: 1 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 3 }, { log: 'I wrote {{person}} a proper thank-you note. {{They}} said listening is free. I felt seen, and cheap.', kind: 'good' }],
      },
      {
        id: 'late',
        label: 'Buy {{them}} a late gift too',
        hint: '{{$40}}',
        effects: [{ money: -40 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 2 }, { log: 'I bought {{person}} a late gift to even the score. {{They}} said it was not a contest. It was.' }],
      },
      {
        id: 'thanks',
        label: 'Say thanks and move on',
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 1 }, { log: 'I said thanks and enjoyed my gift. Next year I am listening harder to everyone.' }],
      },
    ],
  },

  // ------------------------------------------------------------ retiring
  {
    id: 'cw_retiring_box',
    category: 'work',
    title: 'The handover box',
    text: '{{person}} retires on Friday. This morning {{they}} left a box on my chair: a stapler, a sad plant and a binder labeled "Things Nobody Tells You." {{They}} said I would know what to do with it.',
    minAge: 18,
    maxAge: 75,
    weight: 0.8,
    cooldown: 5,
    // wk_retiring_colleague (work_life.ts) throws a coworker's retirement party; two retirements back to back read as one told twice.
    conditions: [...FULL_TIME, { not: { sinceEvent: 'wk_retiring_colleague', lte: 2 } }],
    person: { kind: ['coworker'], minAge: 60 },
    choices: [
      {
        id: 'binder',
        label: 'Read the whole binder',
        effects: [
          { energy: -1 },
          { stat: 'smarts', delta: 3 },
          { jobPerformance: 5 },
          { log: "I read {{person}}'s binder cover to cover. Half is gold. The other half is about the coffee machine.", kind: 'good' },
          { coworkerLeaves: true },
        ],
      },
      {
        id: 'lunch',
        label: 'Take {{them}} to a farewell lunch',
        hint: '{{$50}}',
        effects: [
          { money: -50 },
          { stat: 'happiness', delta: 4 },
          { log: 'Over a long lunch {{person}} told me the stories that never made the binder. I took napkin notes.', kind: 'good' },
          { coworkerLeaves: true },
        ],
      },
      {
        id: 'plant',
        label: 'Save the sad plant',
        effects: [
          { karma: 1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'The plant lived. It is the greenest thing at work now, and I named it after {{person}}.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The plant died within a month. I think it missed {{person}}. I did too.' }],
          },
          { coworkerLeaves: true },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ the new hire I mentor
  {
    id: 'cw_mentor_new_hire',
    category: 'work',
    title: 'The eager new hire',
    text: 'My boss made me the official mentor of our new hire, who has read every manual, asks why we do everything the way we do, and has already found a mistake in my work.',
    minAge: 25,
    maxAge: 75,
    weight: 1,
    cooldown: 6,
    // A boss assigns the new hire: not a judge (as cw_new_boss).
    conditions: [...FULL_TIME, NOT_GIG, CIVILIAN, HAS_A_BOSS, { jobLevel: { gte: 1 } }, { not: { jobId: ['judge'] } }],
    choices: [
      {
        id: 'everything',
        label: 'Teach everything I know',
        effects: [
          { energy: -1 },
          { karma: 2 },
          { jobPerformance: 3 },
          { newPerson: { kind: 'coworker', relationship: 75, log: 'I taught {{person}} everything I know. Now {{they}} teaches me things, which is the point.' } },
        ],
      },
      {
        id: 'thank',
        label: 'Admit the mistake gracefully',
        effects: [
          { stat: 'smarts', delta: 1 },
          { jobPerformance: 1 },
          { newPerson: { kind: 'coworker', relationship: 60, log: 'I thanked {{person}} for catching my mistake. {{They}} looked stunned, then relieved.' } },
        ],
      },
      {
        id: 'project',
        label: 'Give the new hire a project',
        effects: [
          {
            chance: 0.5,
            then: [
              { jobPerformance: 4 },
              { newPerson: { kind: 'coworker', relationship: 70, log: '{{person}} ran the project brilliantly and credited me in the meeting. Mentoring is easy.' } },
            ],
            else: [
              { jobPerformance: -4 },
              { newPerson: { kind: 'coworker', relationship: 60, log: '{{person}} ran the project into a wall. We fixed it together, late, and became friends.' } },
            ],
          },
        ],
      },
      {
        id: 'manual',
        label: 'Hand over the manual',
        effects: [
          { stat: 'happiness', delta: 2 },
          { newPerson: { kind: 'coworker', relationship: 40, log: 'I gave {{person}} the manual {{they}} had already read. {{They}} asks other people now.' } },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ small wars and asks
  {
    id: 'cw_thermostat',
    category: 'work',
    title: 'The thermostat war',
    text: '{{person}} and I have been fighting a silent war over the office thermostat. I turn it up; {{they}} turns it down. Today someone taped a sign to it: "PLEASE STOP. Signed, Everyone."',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    cooldown: 5,
    conditions: [...FULL_TIME, DESK_WORK],
    person: { kind: ['coworker'] },
    choices: [
      {
        id: 'truce',
        label: 'Propose a truce',
        effects: [
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 6 }, { relationship: 'coworker', delta: 2 }, { log: 'We agreed on one number and a spare sweater in the supply closet. Peace in our time.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { log: '{{person}} accepted my truce, then turned it down two degrees on the way out. The war goes on.' }],
          },
        ],
      },
      {
        id: 'heater',
        label: 'Buy a desk heater',
        hint: '{{$40}}',
        effects: [{ money: -40 }, { stat: 'happiness', delta: 3 }, { relationship: 'person', delta: -3 }, { log: 'I bought a tiny heater for under my desk. {{person}} calls it "the sun" and resents it.' }],
      },
      {
        id: 'sweater',
        label: 'Surrender and wear a sweater',
        effects: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: 4 }, { relationship: 'coworker', delta: 1 }, { log: 'I surrendered and wore a sweater. {{person}} brought me tea as war reparations.', kind: 'good' }],
      },
      {
        id: 'facilities',
        label: 'Escalate to facilities',
        effects: [
          { karma: -1 },
          { relationship: 'person', delta: -6 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'Facilities locked the thermostat at my number. {{person}} has not forgiven me.' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: "Facilities locked the thermostat at {{person}}'s number. I keep a blanket at my desk now.", kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cw_fundraiser',
    category: 'work',
    title: 'The order form',
    text: "{{person}} slid me the order form for {{their}} kid's school fundraiser, with a smiley face drawn next to the popcorn tins. Everyone above me on the list ordered at least two.",
    minAge: 18,
    maxAge: 75,
    weight: 0.8,
    cooldown: 4,
    conditions: [...FULL_TIME],
    person: { kind: ['coworker'], minAge: 28, maxAge: 58 },
    choices: [
      {
        id: 'two',
        label: 'Order two popcorn tins',
        hint: '{{$40}}',
        effects: [{ money: -40 }, { relationship: 'person', delta: 4 }, { log: 'I ordered two tins. The popcorn came a month later, tasting faintly of good intentions.' }],
      },
      {
        id: 'deluxe',
        label: 'Order the big gift box',
        hint: '{{$120}}',
        effects: [{ money: -120 }, { karma: 1 }, { relationship: 'person', delta: 8 }, { log: "I ordered the deluxe box. {{person}}'s kid made me a thank-you card with my name almost right.", kind: 'good' }],
      },
      {
        id: 'pass',
        label: 'Pass it on politely',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: -3 }, { log: 'I passed the form along without signing. {{person}} took it back with a smile that did not move.' }],
      },
    ],
  },
];

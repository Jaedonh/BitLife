import { COUNTRIES } from '@/data/countries';
import type { Condition, EventDef, PersonSelector } from '@/engine/events/schema';

/**
 * Events written for the starting scenarios (GAME_DESIGN §4a), each gated on the scenario's flag:
 *
 * - Foster care (`foster_care`): the foster parent is a stepmother or stepfather marked foster, renders by first
 *   name and is bound with FOSTER_PARENT; the text never says Mom, Dad or "my parents". Other foster kids are the
 *   household's siblings. The engine keeps the child with the same foster family from birth to 18, so "a new
 *   home" is a respite weekend, and the one who changes placement is a foster sibling (removePerson).
 * - Immigrant (`immigrant`, the birth country code, set at the move at 6-14): NEW_LANGUAGE and NEW_CULTURE below
 *   say when the move changed the language or the culture, so a family that moved from Canada to the United States
 *   is never handed a dictionary, and RICHER when it moved somewhere that pays better (money sent home). There is
 *   no placeholder for the old country, so the text says "back home". Nothing records how long ago the move was,
 *   so the arrival cards carry a high weight to land soon after it.
 * - Farm kid (`farm`), big family (`scenario:big_family`), single parent (`scenario:single_parent`) and
 *   prodigy (`prodigy`). Scenario cards reach only one life in eight, so their weights sit at the top of the
 *   range (a few once-only milestones in short windows go above it) or most of those lives would never see them.
 * - Seven everyday toddler moments with parent-neutral text, bound to whoever raises the child (RAISER), so
 *   the children of single fathers and orphans get them too. The first steps, the first word and potty training
 *   are the variants of `first_steps` and `ec_potty_training` (need a mother) and `ec_first_word` (needs both
 *   parents), gated the other way so no life gets both; the other four are new for every life.
 *
 * Follow-ups: the show-day card is queued by ss_fm_fair_lamb and the citizenship retake by a failed
 * ss_im_citizenship; neither opens on its own.
 */

const FOSTER: Condition = { flag: 'foster_care' };
const IMMIGRANT: Condition = { flag: 'immigrant' };
const FARM: Condition = { flag: 'farm' };
/** The farm is the family's: a farm kid whose parents have both died was taken in by relatives elsewhere. */
const FARM_FAMILY: Condition = { hasPerson: ['mother', 'father'] };
const BIG_FAMILY: Condition = { flag: 'scenario:big_family' };
const SINGLE_PARENT: Condition = { flag: 'scenario:single_parent' };
/** A single parent can still be born wealthy (8%); the two-jobs, latchkey and bills cards are about tight money. */
const NOT_WEALTHY: Condition = { flag: 'wealthyFamily', exists: false };
const PRODIGY: Condition = { flag: 'prodigy' };
const IN_SCHOOL: Condition = { enrolled: true };

/** The foster parent (an orphan has no mother or father; the engine makes the foster parent a step-parent). */
const FOSTER_PARENT: PersonSelector = { kind: ['stepmother', 'stepfather'], household: true };
/** Whoever is raising a small child: a parent, a step-parent or a foster parent. */
const RAISER: PersonSelector = { kind: ['mother', 'father', 'stepmother', 'stepfather'], household: true };
/** A mother or father the player still lives with ("Mom", "Dad"). */
const PARENT_AT_HOME: PersonSelector = { kind: ['mother', 'father'], household: true };
/** The one parent of a single-parent home, with no step-parent in the picture. */
const NO_STEP_PARENT: Condition = { noPerson: ['stepmother', 'stepfather'] };

/**
 * The languages spoken in each country of src/data/countries.ts. Canada counts French, India English, so a move
 * between two of them is not "a new language". A country added later and missing here never counts as an origin.
 */
const LANGUAGES: Readonly<Record<string, readonly string[]>> = {
  US: ['en'], GB: ['en'], CA: ['en', 'fr'], AU: ['en'], DE: ['de'], FR: ['fr'], ES: ['es'], IT: ['it'], MX: ['es'], BR: ['pt'], JP: ['ja'], IN: ['hi', 'en'], NG: ['en'],
};
const ORIGINS = Object.keys(LANGUAGES);

/** The immigrant family now lives where people speak a language the family did not grow up with. */
const NEW_LANGUAGE: Condition = {
  any: ORIGINS.map((from): Condition => ({
    all: [{ flag: 'immigrant', eq: from }, { notCountry: ORIGINS.filter((to) => (LANGUAGES[to] ?? []).some((l) => (LANGUAGES[from] ?? []).includes(l))) }],
  })),
};
/**
 * The immigrant family now lives in another culture (another name pool): the player's name and the food from
 * home stand out.
 */
const NEW_CULTURE: Condition = {
  any: COUNTRIES.map((from): Condition => ({
    all: [{ flag: 'immigrant', eq: from.code }, { notCountry: COUNTRIES.filter((to) => to.namePool === from.namePool).map((c) => c.code) }],
  })),
};
/** The immigrant family moved to a country that pays better than the one it left, so relatives back home ask for help. */
const RICHER: Condition = {
  any: COUNTRIES.filter((from) => COUNTRIES.some((to) => to.salaryMultiplier > from.salaryMultiplier)).map((from): Condition => ({
    all: [{ flag: 'immigrant', eq: from.code }, { country: COUNTRIES.filter((to) => to.salaryMultiplier > from.salaryMultiplier).map((c) => c.code) }],
  })),
};

export const STARTING_SCENARIOS_EVENTS: EventDef[] = [
  // ------------------------------------------------------------------ foster care
  {
    id: 'ss_fc_respite_weekend',
    category: 'family',
    title: 'A weekend away',
    text: "{{person}} had to go out of town, so I am spending the weekend with a respite foster family I have never met. Their house smells like someone else's soap. My bag is still packed.",
    minAge: 5,
    maxAge: 10,
    weight: 2.5,
    once: true,
    conditions: [FOSTER],
    person: FOSTER_PARENT,
    choices: [
      {
        id: 'unpack',
        label: 'Unpack my bag',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I unpacked everything. They had pancakes and a dog, and the weekend went fast.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I unpacked, then felt silly about it. I slept badly and counted the hours.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'packed',
        label: 'Keep my bag packed',
        effects: [
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: 4 },
          { log: 'I kept my bag by the door all weekend. When {{person}} pulled up, I was already on the step.' },
        ],
      },
      {
        id: 'call',
        label: 'Ask to phone {{person}}',
        effects: [
          { relationship: 'person', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { log: 'I phoned {{person}} every night of the weekend. {{They}} picked up every time.' },
        ],
      },
    ],
  },
  {
    id: 'ss_fc_caseworker',
    category: 'family',
    title: 'The caseworker',
    text: 'My caseworker came for her visit with a big binder and a small pen. She wants to know how things are at home, and {{person}} is pretending to wash a clean plate right behind me.',
    minAge: 6,
    maxAge: 15,
    weight: 2.5,
    cooldown: 4,
    conditions: [FOSTER],
    person: FOSTER_PARENT,
    choices: [
      {
        id: 'honest',
        label: 'Tell her everything',
        effects: [
          {
            chance: 0.75,
            then: [
              { relationship: 'person', delta: 3 },
              { stat: 'happiness', delta: 3 },
              { log: 'I told her it is good here. She wrote it down. {{person}} finally put down the plate.', kind: 'good' },
            ],
            else: [
              { relationship: 'person', delta: -4 },
              { stat: 'happiness', delta: -2 },
              { log: 'I told her about the shouting. {{person}} heard every word. Dinner was quiet for a week.', kind: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'fine',
        label: 'Say everything is fine',
        effects: [{ stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 1 }, { log: 'I said "fine" eleven times. She wrote "fine" eleven times. Nobody learned anything.' }],
      },
      {
        id: 'ask',
        label: 'Ask about my birth family',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            random: [
              { weight: 50, effects: [{ stat: 'happiness', delta: -3 }, { log: 'She said there was nothing new in my file. She said it kindly, which made it worse.', kind: 'bad' }] },
              { weight: 50, effects: [{ stat: 'happiness', delta: 3 }, { log: 'She promised to look into my file. Nobody has ever promised me that before.', kind: 'good' }] },
            ],
          },
        ],
      },
    ],
  },
  {
    // A foster brother and sister do not share a bedroom, so this is about the rest of the house.
    id: 'ss_fc_not_related',
    category: 'family',
    title: 'Not related',
    text: '{{person}} is another foster kid in our house. We are not related, but we have shared a bathroom, a back seat and a cereal box long enough to fight like we are.',
    minAge: 6,
    maxAge: 14,
    // Needs a foster sibling still at home, which 60% of orphans have.
    weight: 3,
    once: true,
    conditions: [FOSTER],
    person: { kind: ['sibling'], household: true, minAge: 4, maxAge: 17 },
    choices: [
      {
        id: 'pact',
        label: 'Make a secret pact',
        effects: [
          { relationship: 'person', delta: 6 },
          { stat: 'happiness', delta: 3 },
          { log: '{{person}} and I swore a pact over the cereal: whatever happens, we tell each other first.', kind: 'good' },
        ],
      },
      {
        id: 'chair',
        label: 'Fight for the good chair',
        effects: [
          { relationship: 'person', delta: -2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I won the good chair by the TV. {{person}} sits on the arm of it every night as rent.' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I lost the fight for the good chair. I watch TV from the floor, which {{person}} calls my seat.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'line',
        label: 'Tape a line down the couch',
        effects: [
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -3 },
          { log: 'I taped a line down the middle of the couch. {{person}} built a toll booth on it.' },
        ],
      },
    ],
  },
  {
    id: 'ss_fc_sibling_moved',
    category: 'family',
    title: 'Two trash bags',
    text: 'The caseworker came for {{person}} today. {{They}} is being moved to a new placement two hours away, and everything {{they}} owns fits in two trash bags by the door.',
    minAge: 6,
    maxAge: 15,
    // Changing placements is part of most foster childhoods; it needs a foster sibling, which 60% of orphans have.
    weight: 1.5,
    once: true,
    conditions: [FOSTER],
    person: { kind: ['sibling'], household: true, maxAge: 16 },
    choices: [
      {
        id: 'gift',
        label: 'Give {{them}} my best thing',
        effects: [
          { karma: 3 },
          { stat: 'happiness', delta: -5 },
          { log: 'I gave {{person}} my flashlight for the new place. {{They}} waved it from the car window.' },
          { removePerson: true },
        ],
      },
      {
        id: 'address',
        label: 'Swap addresses',
        effects: [
          { stat: 'happiness', delta: -4 },
          { stat: 'smarts', delta: 1 },
          { log: 'We swapped addresses on a napkin. I wrote twice. {{person}} wrote back once, which counts.' },
          { removePerson: true },
        ],
      },
      {
        id: 'hide',
        label: 'Hide until it is over',
        effects: [
          { stat: 'happiness', delta: -2 },
          { karma: -2 },
          { log: 'I hid in the closet until the car left. I never said goodbye to {{person}}.', kind: 'bad' },
          { removePerson: true },
        ],
      },
    ],
  },
  {
    id: 'ss_fc_birthday',
    category: 'family',
    title: 'Birthday in care',
    text: 'It is my birthday. {{person}} made a cake from a box and wrote my name on it in frosting, spelled right this year. My caseworker mailed a card signed by an entire office.',
    minAge: 6,
    maxAge: 12,
    weight: 2.5,
    once: true,
    conditions: [FOSTER],
    person: FOSTER_PARENT,
    choices: [
      {
        id: 'wish',
        label: 'Make a big wish',
        effects: [{ stat: 'happiness', delta: 4 }, { log: 'I blew out every candle in one breath and wished for something I will not write down.' }],
      },
      {
        id: 'share',
        label: 'Share it with the house',
        effects: [
          { karma: 2 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: 3 },
          { log: 'I cut the cake into enough pieces for the whole house. Mine was small and perfect.', kind: 'good' },
        ],
      },
      {
        id: 'card',
        label: 'Read the office card',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            random: [
              { weight: 50, effects: [{ stat: 'happiness', delta: 3 }, { log: 'I taped the office card to my wall. Eleven signatures I do not know. Still mine.' }] },
              { weight: 50, effects: [{ stat: 'happiness', delta: -3 }, { log: 'I read the office card twice. Nobody who signed it knows what I look like.', kind: 'bad' }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ss_fc_card_craft',
    category: 'school',
    title: 'The card',
    text: "Our class is making Mother's Day cards. Everyone else knows exactly who theirs is for. I never knew my birth mother, but I do have {{person}}, and a lot of glitter.",
    minAge: 5,
    maxAge: 9,
    weight: 2.5,
    once: true,
    conditions: [FOSTER, IN_SCHOOL, { stage: ['primary'] }],
    person: FOSTER_PARENT,
    choices: [
      {
        id: 'foster',
        label: 'Make it for {{person}}',
        effects: [
          { relationship: 'person', delta: 6 },
          { stat: 'happiness', delta: 2 },
          { log: 'I made the card for {{person}}. It went straight on the fridge, glitter and all.', kind: 'good' },
        ],
      },
      {
        id: 'teacher',
        label: 'Make it for my teacher',
        effects: [{ grade: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I made my card for my teacher. She put it on her desk and looked at it for a long time.' }],
      },
      {
        id: 'me',
        label: 'Make it out to me',
        effects: [{ stat: 'happiness', delta: 4 }, { log: 'I made the card out to me, from me. Somebody had to.' }],
      },
    ],
  },
  {
    id: 'ss_fc_teacher_notices',
    category: 'school',
    title: 'Somebody noticed',
    text: 'My teacher kept me after class. She noticed I never take a book home and asked why. I told her foster kids learn not to borrow what they might lose.',
    minAge: 8,
    maxAge: 14,
    weight: 2.5,
    once: true,
    conditions: [FOSTER, IN_SCHOOL],
    choices: [
      {
        id: 'accept',
        label: 'Accept her help',
        effects: [
          { stat: 'smarts', delta: 4 },
          { grade: 5 },
          { stat: 'happiness', delta: -1 },
          { flag: 'ss_fc_mentor', set: true },
          { log: 'I read in her room at lunch now instead of playing. I finished six books by the holidays.', kind: 'good' },
        ],
      },
      {
        id: 'college',
        label: 'Ask her about college',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { flag: 'ss_fc_mentor', set: true },
          { log: 'I asked how a kid in foster care gets to college. She printed me a list. I keep it.' },
        ],
      },
      {
        id: 'fine',
        label: 'Say I am fine',
        // Keeping my pride: no help, no pity.
        effects: [{ stat: 'happiness', delta: 3 }, { log: 'I told her I was fine. She gave me a book anyway and never asked for it back.' }],
      },
    ],
  },
  {
    id: 'ss_fc_holidays',
    category: 'holiday',
    title: "Someone else's holiday",
    text: "We spent the holidays at the house of {{person}}'s sister. Everyone there has the same nose and the same jokes, and they all call me \"the foster kid\" in a nice voice.",
    minAge: 6,
    maxAge: 15,
    weight: 2,
    cooldown: 4,
    conditions: [FOSTER],
    person: FOSTER_PARENT,
    choices: [
      {
        id: 'help',
        label: 'Help in the kitchen',
        effects: [
          { karma: 2 },
          { relationship: 'person', delta: 3 },
          { stat: 'happiness', delta: 1 },
          { log: 'I peeled potatoes with the aunts. By dessert, one of them used my actual name.' },
        ],
      },
      {
        id: 'cousins',
        label: 'Join the cousins outside',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'The cousins let me into their game in the yard. I was picked second, not last.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The cousins had a game with rules nobody told me. I sat on the steps until dinner.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'read',
        label: 'Read in a corner',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: -1 }, { log: 'I read in a corner under the coats. Someone brought me pie there, which was nice.' }],
      },
    ],
  },
  {
    id: 'ss_fc_independent_living',
    category: 'school',
    title: 'Independent living',
    text: 'Foster kids my age have to take an independent-living class. This week: how to read a lease, cook rice and say no to a credit card. Eighteen is coming fast.',
    minAge: 16,
    maxAge: 17,
    weight: 4,
    once: true,
    conditions: [FOSTER],
    choices: [
      {
        id: 'notes',
        label: 'Take careful notes',
        effects: [
          { stat: 'smarts', delta: 3 },
          { flag: 'ss_fc_prepared', set: true },
          { log: 'I filled a notebook: leases, deposits, rice. The rice part I have since tested.', kind: 'good' },
        ],
      },
      {
        id: 'cook',
        label: 'Volunteer to cook',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'health', delta: 1 }, { log: 'I cooked rice for the whole class. It was edible. The teacher called it "a strong start."' }],
      },
      {
        id: 'skip',
        label: 'Skip it to babysit',
        hint: '+{{$120}}',
        effects: [{ money: 120 }, { log: 'I skipped the class to babysit for a neighbor. The money is real. Leases are still a mystery.', kind: 'money' }],
      },
    ],
  },
  {
    id: 'ss_fc_aging_out_fund',
    category: 'money',
    title: 'The aging-out fund',
    text: "When I turn 18, I am on my own. I did the math on a napkin: first month's rent, a deposit, a bed. The napkin says I need a summer job.",
    minAge: 15,
    maxAge: 17,
    weight: 3,
    once: true,
    conditions: [FOSTER],
    choices: [
      {
        id: 'one',
        label: 'Bag groceries all summer',
        hint: '+{{$900}}',
        effects: [
          { money: 900 },
          { stat: 'happiness', delta: -1 },
          { flag: 'ss_fc_fund', set: true },
          { log: 'I bagged groceries all summer and saved every check. The napkin looks less scary.', kind: 'money' },
        ],
      },
      {
        id: 'two',
        label: 'Work two summer jobs',
        hint: '+{{$1800}}',
        effects: [
          { money: 1800 },
          { stat: 'health', delta: -4 },
          { stat: 'happiness', delta: -4 },
          { flag: 'ss_fc_fund', set: true },
          { log: 'I washed dishes by day and stocked shelves by night. I slept through September.', kind: 'money' },
        ],
      },
      {
        id: 'summer',
        label: 'Have one normal summer',
        effects: [{ stat: 'happiness', delta: 5 }, { log: 'I spent one summer being a kid on purpose. The napkin is in a drawer. I know.' }],
      },
    ],
  },
  {
    id: 'ss_fc_sibling_ages_out',
    category: 'family',
    title: 'Eighteen',
    text: '{{person}} is aging out of foster care, which means that any day now {{they}} will be on {{their}} own. {{They}} has a bus pass, a phone and a plan written on {{their}} arm in pen.',
    minAge: 6,
    maxAge: 16,
    // A foster sibling is 17 or 18 for only two of my years.
    weight: 4,
    once: true,
    conditions: [FOSTER],
    person: { kind: ['sibling'], household: true, minAge: 17, maxAge: 18 },
    choices: [
      {
        id: 'pack',
        label: 'Help {{them}} pack',
        effects: [
          { relationship: 'person', delta: 5 },
          { stat: 'happiness', delta: -2 },
          { log: 'I carried the heavy bag to the bus stop for {{person}}. {{They}} hugged me. First time ever.' },
        ],
      },
      {
        id: 'money',
        label: 'Give {{them}} my savings',
        hint: '{{$100}}',
        conditions: [{ money: { gte: 100 } }],
        effects: [
          { money: -100, payer: 'self' },
          { karma: 4 },
          { relationship: 'person', delta: 6 },
          { log: 'I gave {{person}} the money from my sock drawer. {{They}} promised to pay me back. I said no.', kind: 'good' },
        ],
      },
      {
        id: 'mad',
        label: 'Be mad that {{they}} is leaving',
        effects: [
          { stat: 'happiness', delta: -3 },
          { relationship: 'person', delta: -4 },
          { log: 'I was mad at {{person}} for leaving, which was not fair. I knew it as the door shut.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'ss_fc_rent_due',
    category: 'money',
    title: 'Nobody to call',
    text: 'My rent is due Friday and I am {{$200}} short. Other people my age call home for this. I grew up in foster care, and there is no family savings account with my name on it.',
    minAge: 18,
    maxAge: 22,
    // Most orphans of this age hold more than a month's rent, so the card is weighted up for the ones who do not.
    weight: 3,
    cooldown: 4,
    // A renter with too little cash to cover a $200 gap.
    conditions: [FOSTER, { noAsset: 'house' }, { money: { lt: 1000 } }],
    choices: [
      {
        id: 'sell',
        label: 'Sell something I love',
        effects: [{ stat: 'happiness', delta: -4 }, { log: 'I sold the nicest thing I own to a stranger online. Rent is paid. My shelf looks wrong.', kind: 'bad' }],
      },
      {
        id: 'late',
        label: 'Pay late, eat the fee',
        hint: '{{$150}}',
        effects: [{ money: -150 }, { stat: 'happiness', delta: -1 }, { log: 'I paid three days late. The fee stung, but I kept the things I love.', kind: 'money' }],
      },
      {
        id: 'rice',
        label: 'Live on rice for two weeks',
        effects: [{ stat: 'health', delta: -3 }, { stat: 'happiness', delta: -1 }, { log: 'I ate rice and eggs for two weeks and paid on time. Nobody knew. That was the point.' }],
      },
    ],
  },
  {
    id: 'ss_fc_holidays_alone',
    category: 'holiday',
    title: 'Holidays, alone',
    text: 'Most people I know went home to their families for the holidays. When you grow up in foster care, home is a complicated word, so I stayed put. My phone is quiet and the whole day is mine to fill.',
    minAge: 18,
    maxAge: 25,
    weight: 2,
    cooldown: 3,
    // Alone means no spouse, no partner I live with and no child of my own; a partner who lives elsewhere went home too.
    conditions: [FOSTER, { married: false }, { not: { flag: 'lf_living_together' } }, { hasChildren: false }],
    choices: [
      {
        id: 'host',
        label: 'Host everyone with nowhere to go',
        hint: '{{$80}}',
        effects: [
          { money: -80 },
          { karma: 2 },
          { stat: 'happiness', delta: 6 },
          { log: 'I invited everyone with nowhere to go. Six of us, one tiny oven, my best holiday yet.', kind: 'good' },
        ],
      },
      {
        id: 'volunteer',
        label: 'Volunteer at a shelter',
        effects: [{ karma: 4 }, { stat: 'happiness', delta: 2 }, { log: 'I served lunch at a shelter. A man told me I had a good ladle hand. I will take it.' }],
      },
      {
        id: 'rest',
        label: 'Sleep in and rest',
        effects: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: -4 }, { log: 'I slept late and watched movies alone. It was restful. It was also very quiet.' }],
      },
    ],
  },
  {
    id: 'ss_fc_chosen_family',
    category: 'friends',
    title: 'Emergency contact',
    text: 'A form at the clinic asked for an emergency contact. Most people put down a parent. I sat with the pen for a long time, then thought of {{person}}, who has shown up for me every single time.',
    minAge: 19,
    maxAge: 25,
    weight: 3,
    once: true,
    // A spouse would be the obvious name for the form.
    conditions: [FOSTER, { married: false }],
    person: { kind: ['friend', 'bestFriend'], minRelationship: 60 },
    choices: [
      {
        id: 'write',
        label: 'Write down {{person}}',
        effects: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 2 }, { log: 'I put {{person}} down as my emergency contact. It felt like signing a family tree.' }],
      },
      {
        id: 'ask',
        label: 'Ask {{them}} first',
        effects: [
          {
            chance: 0.8,
            then: [
              { relationship: 'person', delta: 8 },
              { stat: 'happiness', delta: 5 },
              { log: '{{person}} said "obviously," then bought me lunch to make it official.', kind: 'good' },
            ],
            else: [
              { relationship: 'person', delta: -3 },
              { stat: 'happiness', delta: -4 },
              { log: '{{person}} said {{they}} was not sure that was a friend thing. I wrote my own number.', kind: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'teacher',
        label: 'Write down my old teacher',
        conditions: [{ flag: 'ss_fc_mentor' }],
        effects: [{ stat: 'happiness', delta: 4 }, { log: 'I wrote down my old teacher, the one with the books. She still answers on the first ring.', kind: 'good' }],
      },
      {
        id: 'self',
        label: 'Write my own number',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I wrote my own number in the emergency box. The nurse gave me a look. I gave one back.' }],
      },
    ],
  },

  // ------------------------------------------------------------------ immigrant
  {
    id: 'ss_im_new_language',
    category: 'school',
    title: 'Still learning',
    text: 'School here happens in a language I am still learning. The class laughs at jokes I catch one second late, and every idiom trips me like a loose shoelace.',
    minAge: 6,
    maxAge: 14,
    // An arrival card: weighted to open soon after the move, since no condition can say how long ago it was.
    weight: 5,
    once: true,
    conditions: [IMMIGRANT, NEW_LANGUAGE, IN_SCHOOL],
    choices: [
      {
        id: 'study',
        label: 'Study ten words a night',
        effects: [
          { stat: 'smarts', delta: 4 },
          { grade: 3 },
          { stat: 'happiness', delta: -2 },
          { stat: 'health', delta: -1 },
          { log: 'I learned ten words a night under my blanket with a flashlight. By spring I dreamed in both.', kind: 'good' },
        ],
      },
      {
        id: 'friend',
        label: 'Find a kid who translates',
        effects: [{ stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 1 }, { log: 'A kid in my class started whispering the jokes to me. Now I laugh on time.', kind: 'good' }],
      },
      {
        id: 'listen',
        label: 'Stay quiet and listen',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: 2 }, { log: 'I listened for a month. Then I answered a question in perfect sentences. Silence.' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'I stayed so quiet that the teacher started talking to me very slowly and loudly.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ss_im_name',
    category: 'school',
    title: 'My name, their way',
    text: 'Every teacher here says my name a slightly different wrong way. Today a substitute gave up halfway through and called me "you there." {{name}} is not that hard.',
    minAge: 6,
    maxAge: 15,
    weight: 3,
    once: true,
    conditions: [IMMIGRANT, NEW_CULTURE, IN_SCHOOL],
    choices: [
      {
        id: 'correct',
        label: 'Correct them every time',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'I corrected every teacher, every time. By winter they all said {{name}} right.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I corrected the substitute and the class went "ooh." She still got it wrong.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'nickname',
        label: 'Pick an easy nickname',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I picked a nickname that fits mouths here. It works. It is also not my name.' }],
      },
      {
        id: 'teach',
        label: 'Teach the class to say it',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'I wrote {{name}} on the board in big letters and made the class repeat it. Most got it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I tried to teach the class my name. They turned it into a chant. Not the good kind.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ss_im_translator',
    category: 'family',
    title: 'The family translator',
    text: 'I speak the new language best in our house, so I go everywhere with {{person}}: the bank, the doctor, the phone company. Today it is my own parent-teacher meeting.',
    minAge: 8,
    maxAge: 16,
    weight: 2.5,
    once: true,
    conditions: [IMMIGRANT, NEW_LANGUAGE, IN_SCHOOL],
    person: PARENT_AT_HOME,
    choices: [
      {
        id: 'honest',
        label: 'Translate every word',
        effects: [
          { karma: 2 },
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 3 }, { log: 'I translated every word, even "talks in class." {{person}} squeezed my shoulder anyway.' }],
            else: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -2 }, { log: 'I translated every word, including "missing homework." The walk home was long.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'edit',
        label: 'Improve it a little',
        effects: [
          { karma: -3 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'In my version, the teacher called me "a delight." {{person}} was very proud.' }],
            else: [{ relationship: 'person', delta: -5 }, { stat: 'happiness', delta: -3 }, { log: 'The teacher spoke a little of our language. My edits did not survive.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'interpreter',
        label: 'Ask for a real interpreter',
        effects: [
          { stat: 'smarts', delta: 1 },
          { relationship: 'person', delta: 1 },
          { log: 'I asked the school for a real interpreter. {{person}} heard the bad parts from a stranger.' },
        ],
      },
    ],
  },
  {
    id: 'ss_im_lunch',
    category: 'school',
    title: 'Lunch from home',
    text: '{{person}} packed me food from home, the real kind, the kind that smells like our old kitchen. The boy next to me held his nose. Half the table wants a bite.',
    minAge: 6,
    maxAge: 13,
    weight: 2.5,
    once: true,
    conditions: [IMMIGRANT, NEW_CULTURE, IN_SCHOOL],
    person: PARENT_AT_HOME,
    choices: [
      {
        id: 'share',
        label: 'Offer everyone a taste',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'I handed out bites. Now three kids ask what {{person}} packed before they open their own.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I offered bites. The nose boy made a noise. Two others loved it, which helped.' }],
          },
        ],
      },
      {
        id: 'sandwich',
        label: 'Ask for sandwiches instead',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: -3 }, { log: 'I asked {{person}} for plain sandwiches. {{They}} made them, and looked a little sad doing it.' }],
      },
      {
        id: 'proud',
        label: 'Eat it slowly and proudly',
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 2 }, { log: 'I ate every bite slowly, like it was a show. It was delicious. That was the point.' }],
      },
    ],
  },
  {
    id: 'ss_im_old_friend',
    category: 'friends',
    title: 'Back home',
    text: 'My best friend from back home called long distance. Ten minutes in, I realized there are new jokes and new friends there, and I have been gone long enough to miss the reasons.',
    minAge: 7,
    maxAge: 16,
    weight: 2,
    once: true,
    conditions: [IMMIGRANT],
    choices: [
      {
        id: 'weekly',
        label: 'Promise to call every week',
        effects: [{ stat: 'happiness', delta: 2 }, { energy: -1 }, { log: 'We set a weekly call. We made it eight weeks, which is a record for that distance.' }],
      },
      {
        id: 'here',
        label: 'Focus on friends here',
        effects: [{ stat: 'happiness', delta: 3 }, { karma: -1 }, { log: 'I let the calls slip and said yes to a sleepover here instead. It felt like cheating. It was fun.' }],
      },
      {
        id: 'family',
        label: 'Say I miss home',
        effects: [
          { stat: 'happiness', delta: 1 },
          { relationship: 'mother', delta: 2 },
          { relationship: 'father', delta: 2 },
          { log: 'I told {{parents}} I missed home. We made the old Sunday soup and ate it on the floor.' },
        ],
      },
    ],
  },
  {
    id: 'ss_im_trip_back',
    category: 'random',
    title: 'The trip back',
    text: 'I finally saved enough to visit the country where I was born, my first time back since we moved. Here, I am from there. I am about to find out whether, there, I am from here.',
    minAge: 18,
    maxAge: 45,
    weight: 2,
    once: true,
    conditions: [IMMIGRANT, { money: { gte: 1500 } }],
    choices: [
      {
        id: 'relatives',
        label: 'Visit every relative',
        hint: '{{$1500}}',
        effects: [
          { money: -1500 },
          { stat: 'happiness', delta: 6 },
          { stat: 'health', delta: -1 },
          { counter: 'vacations' },
          { log: 'I visited every aunt, uncle and cousin back home. Eleven dinners in nine days.', kind: 'good' },
        ],
      },
      {
        id: 'streets',
        label: 'Wander my old streets',
        hint: '{{$900}}',
        effects: [
          { money: -900 },
          { stat: 'happiness', delta: 4 },
          { stat: 'smarts', delta: 1 },
          { counter: 'vacations' },
          { log: 'I found my old school and my old street. Smaller than I remembered, and still mine.' },
        ],
      },
      {
        id: 'save',
        label: 'Keep the money for now',
        effects: [{ stat: 'happiness', delta: -2 }, { log: 'I kept the trip money in the bank. Back home can wait another year. It has before.' }],
      },
    ],
  },
  {
    id: 'ss_im_citizenship',
    category: 'random',
    title: 'The citizenship test',
    text: 'My citizenship test is on Thursday. I know the dates, the rights and the name of every river. I know more history than most people born here, which is not saying much.',
    minAge: 18,
    maxAge: 40,
    // The immigrant life's milestone, in a pool of hundreds of adult cards.
    weight: 4,
    once: true,
    conditions: [IMMIGRANT],
    choices: [
      {
        id: 'course',
        label: 'Pay for a prep course',
        hint: '{{$200}}',
        effects: [
          { money: -200 },
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.9,
            then: [
              { stat: 'happiness', delta: 8 },
              { flag: 'ss_citizen', set: true },
              { log: 'I passed. At the ceremony I held a tiny flag and cried more than I planned to.', kind: 'milestone' },
            ],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'I failed one question about a river. I can retake it in spring. I will.', kind: 'bad' }, { queue: 'ss_im_citizenship_retake' }],
          },
        ],
      },
      {
        id: 'confident',
        label: 'Walk in confident',
        effects: [
          {
            chance: 0.75,
            then: [
              { stat: 'happiness', delta: 8 },
              { flag: 'ss_citizen', set: true },
              { log: 'I walked in, answered everything and walked out a citizen. The ceremony had cake.', kind: 'milestone' },
            ],
            else: [
              { stat: 'happiness', delta: -5 },
              { log: 'I was too confident. I mixed up two dates and have to come back in spring.', kind: 'bad' },
              { queue: 'ss_im_citizenship_retake' },
            ],
          },
        ],
      },
      {
        id: 'family',
        label: 'Bring {{parents}} along',
        // Someone to bring: {{parents}} would otherwise read "my family". Nerves in front of them cost a little.
        conditions: [{ hasPerson: ['mother', 'father'] }],
        effects: [
          { relationship: 'mother', delta: 3 },
          { relationship: 'father', delta: 3 },
          {
            chance: 0.7,
            then: [
              { stat: 'happiness', delta: 10 },
              { flag: 'ss_citizen', set: true },
              { log: 'I passed with {{parents}} in the front row of the ceremony. Even the official cried.', kind: 'milestone' },
            ],
            else: [
              { stat: 'happiness', delta: -4 },
              { log: 'I froze with {{parents}} waiting outside and failed. We got ice cream anyway and planned a retake.', kind: 'bad' },
              { queue: 'ss_im_citizenship_retake' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ss_im_citizenship_retake',
    category: 'random',
    title: 'The retake',
    text: 'Spring, and the citizenship test again. Same room, same plastic chairs, same official, who remembered my face. This time I studied the thing I got wrong until I dreamed about it.',
    minAge: 18,
    maxAge: 40,
    weight: 1,
    followUpOnly: true,
    conditions: [IMMIGRANT],
    choices: [
      {
        id: 'retake',
        label: 'Take it again',
        effects: [
          {
            chance: 0.85,
            then: [
              { stat: 'happiness', delta: 8 },
              { flag: 'ss_citizen', set: true },
              { log: 'Second try, every answer right. At the ceremony I said the oath without reading it.', kind: 'milestone' },
            ],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'I failed the retake by one question. I am taking a long break from rivers.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'later',
        label: 'Put it off for now',
        effects: [{ stat: 'happiness', delta: -2 }, { log: 'I skipped the retake. Resident is a fine word. I keep telling myself that.' }],
      },
    ],
  },
  {
    id: 'ss_im_really_from',
    category: 'friends',
    title: 'Really from',
    text: 'At a party a stranger asked where I was from. I said {{city}}. They smiled and asked where I was really from, as if I had answered the wrong question.',
    minAge: 16,
    maxAge: 45,
    weight: 1.5,
    cooldown: 6,
    conditions: [IMMIGRANT, NEW_CULTURE],
    choices: [
      {
        id: 'explain',
        label: 'Explain it politely',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: -1 }, { log: 'I gave the stranger my whole history in four sentences. They said "how exotic." Great.' }],
      },
      {
        id: 'joke',
        label: 'Say "a hospital, mostly"',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I said "a hospital, mostly." They laughed. Then they asked again.' }],
      },
      {
        id: 'leave',
        label: 'Go find better company',
        effects: [{ stat: 'happiness', delta: 3 }, { karma: -1 }, { log: 'I said "{{city}}" one more time and went to find better company and better snacks.' }],
      },
    ],
  },
  {
    id: 'ss_im_money_home',
    category: 'money',
    title: 'Money for back home',
    text: 'My aunt back home called. The roof is leaking again and my cousin needs school fees. Everyone there assumes life here is easy. My bank account would like a word.',
    minAge: 22,
    maxAge: 55,
    weight: 1.5,
    cooldown: 5,
    conditions: [IMMIGRANT, RICHER, { hasJob: true }],
    choices: [
      {
        id: 'all',
        label: 'Send what they need',
        hint: '{{$1500}}',
        effects: [{ money: -1500 }, { karma: 4 }, { stat: 'happiness', delta: 2 }, { log: 'I sent money for the roof and the fees. My aunt sent back a photo of a dry ceiling.', kind: 'money' }],
      },
      {
        id: 'some',
        label: 'Send a little',
        hint: '{{$300}}',
        effects: [{ money: -300 }, { karma: 1 }, { log: 'I sent what I could spare. It was not enough, and everyone was too polite to say so.', kind: 'money' }],
      },
      {
        id: 'none',
        label: "Explain I can't right now",
        effects: [{ stat: 'happiness', delta: -3 }, { karma: -1 }, { log: 'I explained that life here costs money too. The call ended fast. The guilt did not.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'ss_im_bilingual_work',
    category: 'work',
    title: 'Two languages, one paycheck',
    text: 'Word got out at {{company}} that I speak a second language. Now whenever someone who speaks it needs help, I get pulled away from my own work to translate.',
    minAge: 20,
    maxAge: 60,
    weight: 1.5,
    cooldown: 6,
    conditions: [IMMIGRANT, NEW_LANGUAGE, { hasJob: true }],
    choices: [
      {
        id: 'paid',
        label: 'Ask to be paid for it',
        effects: [
          {
            chance: 0.5,
            then: [{ money: 2000 }, { stat: 'happiness', delta: 3 }, { log: 'I asked to be paid for translating. They agreed, grudgingly. My bonus says so.', kind: 'money' }],
            else: [{ jobPerformance: -4 }, { stat: 'happiness', delta: -2 }, { log: 'I asked to be paid for translating. My manager called it "a team thing." Noted.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'free',
        label: 'Help for free',
        effects: [{ jobPerformance: 6 }, { stat: 'happiness', delta: -1 }, { karma: 2 }, { log: 'I translated for anyone who needed it. My own work piled up, but everyone knows my name.' }],
      },
      {
        id: 'busy',
        label: 'Say I am too busy',
        effects: [{ jobPerformance: -2 }, { stat: 'happiness', delta: 1 }, { log: 'I said I was too busy to translate. True, and it cost me a little goodwill.' }],
      },
    ],
  },

  // ------------------------------------------------------------------ farm kid
  {
    id: 'ss_fm_chores',
    category: 'childhood',
    title: 'Before the bus',
    text: 'The school bus comes at 7:10. Before that: feed the chickens, check the water troughs and find whichever calf got out again. {{person}} says it builds character. My boots disagree.',
    minAge: 7,
    maxAge: 14,
    weight: 2.5,
    cooldown: 4,
    conditions: [FARM, IN_SCHOOL],
    person: PARENT_AT_HOME,
    choices: [
      {
        id: 'rush',
        label: 'Rush through it',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'I did every chore at a run and caught the bus with one second to spare.' }],
            else: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -2 }, { log: 'I rushed and left a gate open. {{person}} spent the morning chasing calves.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'properly',
        label: 'Do it properly',
        effects: [{ stat: 'health', delta: 2 }, { relationship: 'person', delta: 3 }, { grade: -2 }, { log: 'I did every chore properly and missed the bus. {{person}} drove me in, proud and late.' }],
      },
      {
        id: 'early',
        label: 'Get up an hour earlier',
        effects: [{ stat: 'health', delta: -2 }, { stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 2 }, { log: 'I set my alarm for five. Chores done, bus caught, eyes shut the whole ride.' }],
      },
    ],
  },
  {
    id: 'ss_fm_calf',
    category: 'childhood',
    title: 'Born at 3 a.m.',
    text: '{{person}} shook me awake at three in the morning. A cow is calving in the barn, the vet is an hour away, and {{they}} needs another pair of hands. Mine are small but warm.',
    minAge: 6,
    maxAge: 12,
    weight: 2.5,
    once: true,
    conditions: [FARM],
    person: PARENT_AT_HOME,
    choices: [
      {
        id: 'lantern',
        label: 'Hold the lantern steady',
        effects: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 3 }, { log: 'I held the lantern while {{person}} pulled. The calf slid out, wet and furious. I named her June.', kind: 'good' }],
      },
      {
        id: 'pull',
        label: 'Help pull',
        effects: [
          { stat: 'health', delta: -1 },
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 7 }, { stat: 'happiness', delta: 7 }, { log: 'I pulled with {{person}}, both of us knee-deep in straw. The calf stood in ten minutes.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: -4 }, { log: 'The calf came out still. {{person}} rubbed it with straw for a long time. It did not wake.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'bed',
        label: 'Ask to go back to bed',
        effects: [{ stat: 'health', delta: 2 }, { relationship: 'person', delta: -3 }, { log: 'I went back to bed. At breakfast there was a new calf and a story I was not in.' }],
      },
    ],
  },
  {
    id: 'ss_fm_fair_lamb',
    category: 'childhood',
    title: 'A lamb for the fair',
    text: 'This year I get to raise my own lamb for the livestock show at the fair. She is all knees and opinions. If I train her well, we might bring home a ribbon.',
    minAge: 9,
    maxAge: 15,
    weight: 2.5,
    once: true,
    conditions: [FARM, FARM_FAMILY],
    choices: [
      {
        id: 'train',
        label: 'Train her every evening',
        effects: [
          { stat: 'health', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { flag: 'ss_fm_lamb', set: 'trained' },
          { log: 'I walked my lamb every evening until she followed me like a dog.' },
          { queue: 'ss_fm_fair_show' },
        ],
      },
      {
        id: 'spoil',
        label: 'Spoil her rotten',
        effects: [
          { stat: 'happiness', delta: 4 },
          { flag: 'ss_fm_lamb', set: 'spoiled' },
          { log: 'I fed my lamb apple slices and let her nap on the porch. Training was optional.' },
          { queue: 'ss_fm_fair_show' },
        ],
      },
      {
        id: 'skip',
        label: 'Sit this year out',
        effects: [{ stat: 'happiness', delta: -2 }, { energy: 1 }, { log: 'I did not show a lamb this year. Watching from the fence, I wished I had.' }],
      },
    ],
  },
  {
    id: 'ss_fm_fair_show',
    category: 'childhood',
    title: 'Show day',
    text: 'Show day at the fair. My lamb has been washed, brushed and told she is beautiful. The judge is walking down the line with a clipboard and no expression at all.',
    minAge: 9,
    maxAge: 15,
    weight: 1,
    followUpOnly: true,
    conditions: [FARM],
    choices: [
      {
        id: 'practiced',
        label: 'Show her like we practiced',
        conditions: [{ flag: 'ss_fm_lamb', eq: 'trained' }],
        effects: [
          {
            random: [
              { weight: 55, effects: [{ stat: 'happiness', delta: 8 }, { log: 'We won a blue ribbon. I slept with it on my pillow for a week.', kind: 'milestone' }] },
              { weight: 35, effects: [{ stat: 'happiness', delta: 3 }, { log: 'We won a red ribbon. Second place, which my lamb took personally.', kind: 'good' }] },
              { weight: 10, effects: [{ stat: 'happiness', delta: -2 }, { log: 'All that practice, and she sat down in front of the judge. No ribbon. Big laugh.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'hope',
        label: 'Hope she remembers something',
        conditions: [{ flag: 'ss_fm_lamb', eq: 'spoiled' }],
        effects: [
          {
            random: [
              { weight: 20, effects: [{ stat: 'happiness', delta: 8 }, { log: 'My spoiled lamb strutted like a queen and won a blue ribbon. Apples work.', kind: 'milestone' }] },
              { weight: 40, effects: [{ stat: 'happiness', delta: 2 }, { log: 'We got a white ribbon for third place. She ate part of it.' }] },
              { weight: 40, effects: [{ stat: 'happiness', delta: -3 }, { log: 'My lamb walked out of the ring to find apples. The judge wrote something down.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'judge',
        label: 'Smile hard at the judge',
        effects: [
          { stat: 'looks', delta: 1 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'I smiled at the judge so hard my face hurt. We got a ribbon. Unclear which of us earned it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'I smiled at the judge the whole time. The judge looked only at the lamb. No ribbon.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ss_fm_tractor',
    category: 'childhood',
    title: 'Tractor before car',
    text: '{{person}} decided I am old enough to drive the tractor in the back field. It goes about as fast as a jog and has more levers than a spaceship. Nobody at school believes me.',
    minAge: 11,
    maxAge: 15,
    weight: 2.5,
    once: true,
    conditions: [FARM],
    person: PARENT_AT_HOME,
    choices: [
      {
        id: 'straight',
        label: 'Go slow and straight',
        effects: [{ stat: 'smarts', delta: 1 }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 1 }, { log: 'I drove one slow, perfect line across the field. {{person}} was proud. I was a little bored.', kind: 'good' }],
      },
      {
        id: 'fast',
        label: 'Find the top gear',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'I found top gear. It is not fast. It is very loud. I loved every second.' }],
            else: [
              { injury: 3 },
              { relationship: 'person', delta: -4 },
              { stat: 'happiness', delta: -3 },
              { log: 'I took the corner too fast, hit a fence post and bumped my head. {{person}} took the keys.', kind: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'audience',
        label: 'Invite kids from school',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'Two kids from school came to watch. Now everyone believes me, and wants a turn.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'Nobody came to watch. The cows watched. They were unimpressed.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ss_fm_harvest_storm',
    category: 'childhood',
    title: 'Beat the storm',
    text: 'The radio says a storm will hit tonight, and half the crop is still in the field. {{person}} needs every pair of hands, and mine are supposed to be studying for a test.',
    minAge: 10,
    maxAge: 17,
    weight: 2,
    cooldown: 4,
    conditions: [FARM, IN_SCHOOL],
    person: PARENT_AT_HOME,
    choices: [
      {
        id: 'field',
        label: 'Work the field all day',
        effects: [
          { stat: 'health', delta: -2 },
          { grade: -3 },
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 4 }, { log: 'We got the crop in as the first drops fell. The test the next day went less well.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: -4 }, { log: 'The storm came early and took a third of the crop. {{person}} said little at dinner.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'study',
        label: 'Stay in and study',
        effects: [{ grade: 3 }, { stat: 'smarts', delta: 1 }, { relationship: 'person', delta: -3 }, { log: 'I studied while everyone else worked the field. I aced the test. Dinner was very quiet.' }],
      },
      {
        id: 'both',
        label: 'Work, then study late',
        effects: [{ stat: 'health', delta: -4 }, { grade: 1 }, { relationship: 'person', delta: 3 }, { log: 'I worked until dark and studied until two. The crop and I both barely made it.' }],
      },
    ],
  },
  {
    id: 'ss_fm_dry_summer',
    category: 'family',
    title: 'Dry summer',
    text: 'No rain for six weeks. The pasture has gone brown, the creek is a rumor, and last night {{parents}} sat at the kitchen table doing math until long after I went to bed.',
    minAge: 8,
    maxAge: 16,
    weight: 2,
    cooldown: 5,
    conditions: [FARM, FARM_FAMILY, NOT_WEALTHY],
    choices: [
      {
        id: 'haul',
        label: 'Haul water every morning',
        effects: [{ stat: 'health', delta: 1 }, { stat: 'happiness', delta: -2 }, { karma: 2 }, { log: 'I hauled buckets to the troughs every morning. My arms got strong. The rain came late.' }],
      },
      {
        id: 'savings',
        label: 'Put my savings in the jar',
        hint: '{{$100}}',
        conditions: [{ money: { gte: 100 } }],
        effects: [
          { money: -100, payer: 'self' },
          { karma: 4 },
          { stat: 'happiness', delta: -1 },
          { log: '{{parents}} tried to refuse my birthday money. I left it in the coffee jar anyway.', kind: 'good' },
        ],
      },
      {
        id: 'dance',
        label: 'Do a rain dance',
        effects: [
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.2,
            then: [{ log: 'I did a rain dance in the yard. It rained two days later. I am taking full credit.', kind: 'good' }],
            else: [{ log: 'I did a rain dance in the yard. The sky ignored me. The chickens watched.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ss_fm_egg_stand',
    category: 'money',
    title: 'The egg stand',
    text: 'I am in charge of selling our eggs at the Saturday farmers market this summer. I get to keep a cut, which makes me, technically, a businessperson.',
    minAge: 9,
    maxAge: 15,
    weight: 2,
    once: true,
    conditions: [FARM, FARM_FAMILY],
    choices: [
      {
        id: 'fair',
        label: 'Sell at a fair price',
        hint: '+{{$120}}',
        effects: [{ money: 120 }, { karma: 1 }, { log: 'I sold eggs all summer at a fair price. The regulars call me "the egg kid."', kind: 'money' }],
      },
      {
        id: 'city',
        label: 'Charge city prices',
        effects: [
          {
            chance: 0.5,
            then: [{ money: 250 }, { log: 'I doubled the price and wrote "artisan" on the sign. City people paid it.', kind: 'money' }],
            else: [{ money: 40 }, { stat: 'happiness', delta: -2 }, { log: 'I doubled the price. Everyone bought eggs from the stand next to mine.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'chat',
        label: 'Talk to every customer',
        hint: '+{{$60}}',
        effects: [{ money: 60 }, { stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'I talked to everyone who stopped. I sold fewer eggs and heard twelve life stories.' }],
      },
    ],
  },
  {
    id: 'ss_fm_stay_or_go',
    category: 'family',
    title: 'Staying or going',
    text: 'Most of my class is leaving town for the city. {{person}} has not asked me to stay on the farm, which is exactly how I know {{they}} is hoping I will.',
    minAge: 17,
    maxAge: 19,
    // A three-year window in a crowded pool: weighted so most farm kids reach the choice.
    weight: 5,
    once: true,
    // Finishing or just past high school, still living on the farm, not already away at university.
    conditions: [FARM, { married: false }, { stage: ['high', 'done'] }],
    person: { kind: ['mother', 'father'], household: true },
    choices: [
      {
        id: 'stay',
        label: 'Stay and work the farm',
        effects: [
          { relationship: 'person', delta: 8 },
          { stat: 'happiness', delta: 2 },
          { stat: 'health', delta: 2 },
          { flag: 'ss_farm_stayed', set: true },
          { log: 'I said I would stay. {{person}} gave me my own work gloves, which in our family is a speech.', kind: 'milestone' },
        ],
      },
      {
        id: 'go',
        label: 'Leave for the city',
        effects: [
          { relationship: 'person', delta: -3 },
          { stat: 'happiness', delta: 4 },
          { flag: 'ss_farm_left', set: true },
          { log: 'I told {{person}} my future is in the city. {{They}} said "good" and went out to check the fence.', kind: 'milestone' },
        ],
      },
      {
        id: 'weekends',
        label: 'Go, but come back weekends',
        effects: [
          { relationship: 'person', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { stat: 'health', delta: -1 },
          { flag: 'ss_farm_left', set: true },
          { log: 'I promised to try the city and come home most weekends to help. {{person}} wrote it down.', kind: 'milestone' },
        ],
      },
    ],
  },
  {
    id: 'ss_fm_who_gets_the_farm',
    category: 'family',
    title: 'Who gets the farm',
    text: '{{person}} sat me down at the kitchen table. The farm is getting to be too much, and {{they}} wants to know: will it be mine one day, or should it be sold?',
    minAge: 26,
    maxAge: 40,
    weight: 2,
    once: true,
    conditions: [FARM],
    person: { kind: ['mother', 'father'], minAge: 55 },
    choices: [
      {
        id: 'take',
        label: 'Promise to take it over',
        effects: [
          { relationship: 'person', delta: 8 },
          { stat: 'happiness', delta: 3 },
          { flag: 'ss_farm_heir', set: true },
          { log: 'I said the farm would be mine. {{person}} let out a breath {{they}} had held for years.', kind: 'milestone' },
        ],
      },
      {
        id: 'sell',
        label: 'Tell {{them}} to sell',
        hint: '+{{$5000}}',
        effects: [
          { relationship: 'person', delta: -4 },
          { stat: 'happiness', delta: -2 },
          { money: 5000 },
          { log: 'I told {{person}} to sell. {{They}} gave me a share of the sale and stared out the window.', kind: 'money' },
        ],
      },
      {
        id: 'lease',
        label: 'Suggest leasing the fields',
        effects: [{ stat: 'smarts', delta: 2 }, { relationship: 'person', delta: 2 }, { log: 'I suggested leasing the fields to the neighbors and keeping the house. {{person}} is thinking.' }],
      },
    ],
  },

  // ------------------------------------------------------------------ big family
  {
    // The hand-me-down coat is ec_hand_me_downs (every poor family, big ones included), so this one is the bike.
    id: 'ss_bf_family_bike',
    category: 'childhood',
    title: 'The family bike',
    text: "The family bike has been ridden by every kid in this house before me, oldest first. Now it is mine. It has one working brake, a seat held on with tape and everyone's initials scratched into the frame.",
    minAge: 8,
    maxAge: 13,
    weight: 2.5,
    once: true,
    conditions: [BIG_FAMILY],
    choices: [
      {
        id: 'proud',
        label: 'Ride it like it is new',
        effects: [{ stat: 'happiness', delta: 3 }, { karma: 1 }, { log: "I scratched my initials under everyone else's and rode to school like it was a limousine." }],
      },
      {
        id: 'fix',
        label: 'Fix the brake myself',
        effects: [
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'I fixed the brake with a borrowed wrench and a library book. It stops now, mostly.', kind: 'good' }],
            else: [{ injury: 2 }, { stat: 'happiness', delta: -2 }, { log: 'I fixed the brake myself. At the bottom of the big hill, the brake disagreed.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'beg',
        label: 'Beg for a new one',
        effects: [
          {
            chance: 0.3,
            then: [{ money: -150 }, { stat: 'happiness', delta: 5 }, { log: "{{parents}} found the money for a new bike. Nobody's initials on it but mine. Strange.", kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I asked for a new bike. {{parents}} laughed kindly and handed me a roll of tape.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ss_bf_never_alone',
    category: 'family',
    title: 'Somewhere quiet',
    text: 'In a house this full there is no such thing as alone. Someone is always in the bathroom or on the stairs, and right now {{person}} is on my bed reading my diary out loud. I need one square foot of quiet.',
    // Older siblings move out from 24, so by the mid-teens the house is not this full any more.
    minAge: 8,
    maxAge: 13,
    weight: 2.5,
    cooldown: 4,
    conditions: [BIG_FAMILY],
    // Old enough to read the diary.
    person: { kind: ['sibling'], household: true, minAge: 7 },
    choices: [
      {
        id: 'closet',
        label: 'Claim the hall closet',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I put a pillow and a flashlight in the hall closet. It is mine now. Everyone knocks.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: 2 }, { log: 'I made the hall closet my quiet spot. By Friday {{person}} had moved in with a beanbag.' }],
          },
        ],
      },
      {
        id: 'early',
        label: 'Wake up before everyone',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'health', delta: -2 }, { stat: 'smarts', delta: 1 }, { log: 'I started getting up at five, the one quiet hour in the house. I read a lot of books.' }],
      },
      {
        id: 'tell',
        label: 'Tell on {{them}}',
        effects: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: -4 }, { log: 'I told on {{person}}. I got my diary back, and a glare that lasted a week.' }],
      },
    ],
  },
  {
    id: 'ss_bf_in_charge',
    category: 'family',
    title: 'In charge of me',
    text: '{{parents}} started working late on Thursdays, so {{person}} is in charge of me. {{They}} takes it very seriously: there are rules, a whistle and a chart with my name on it.',
    minAge: 4,
    maxAge: 9,
    weight: 1.5,
    once: true,
    // {{parents}} must name a parent who works late, not "my family".
    conditions: [BIG_FAMILY, { hasPerson: ['mother', 'father', 'stepmother', 'stepfather'] }],
    person: { kind: ['sibling'], household: true, minAge: 14, maxAge: 19 },
    choices: [
      {
        id: 'obey',
        label: 'Follow every rule',
        effects: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: -1 }, { log: '{{person}} ran Thursdays like a ship. I got a gold star on the chart. I earned it.' }],
      },
      {
        id: 'test',
        label: 'Test the rules',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: -2 }, { log: 'I found a loophole in rule three and stayed up late. {{person}} is rewriting the rules.' }],
            else: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: -3 }, { log: 'I broke rule two. {{person}} blew the whistle and told on me the second the door opened.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'deal',
        label: 'Trade chores for popcorn',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 1 }, { relationship: 'person', delta: 2 }, { log: '{{person}} and I made a deal: I folded laundry, {{they}} made popcorn. Everyone won.' }],
      },
    ],
  },
  {
    id: 'ss_bf_last_piece',
    category: 'family',
    title: 'The last piece',
    text: 'Dinner at our table is a contact sport. There is one piece of chicken left, every fork in the house is in the air, and {{person}} is already reaching across me.',
    minAge: 6,
    maxAge: 14,
    weight: 1.2,
    cooldown: 4,
    conditions: [BIG_FAMILY],
    person: { kind: ['sibling'], household: true },
    choices: [
      {
        id: 'grab',
        label: 'Grab it first',
        effects: [
          { relationship: 'person', delta: -2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I stabbed the last piece before {{person}} could. Victory tastes like chicken.' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: '{{person}} got there first and ate it slowly while looking right at me.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'split',
        label: 'Offer to split it',
        effects: [{ karma: 2 }, { relationship: 'person', delta: 3 }, { log: 'I offered {{person}} half. We cut it with surgical care. Nobody was happy, which is fair.' }],
      },
      {
        id: 'full',
        label: 'Pretend I am full',
        effects: [{ karma: 1 }, { stat: 'health', delta: -1 }, { relationship: 'person', delta: 1 }, { log: 'I said I was full. I was not. Later I found a cracker behind the toaster.' }],
      },
    ],
  },

  // ------------------------------------------------------------------ single parent
  {
    id: 'ss_sp_two_jobs',
    category: 'family',
    title: 'Two jobs',
    text: '{{person}} took a second job this year: one in the day, one at night. I see {{them}} at breakfast and in the blur between the two, changing shirts in the hallway.',
    minAge: 6,
    maxAge: 12,
    weight: 1.5,
    once: true,
    conditions: [SINGLE_PARENT, NO_STEP_PARENT, NOT_WEALTHY],
    person: PARENT_AT_HOME,
    choices: [
      {
        id: 'dinner',
        label: 'Learn to make dinner',
        effects: [{ relationship: 'person', delta: 4 }, { stat: 'smarts', delta: 1 }, { stat: 'health', delta: -1 }, { log: 'I learned to make three dinners. {{person}} ate the burnt one and said it was perfect.' }],
      },
      {
        id: 'wait',
        label: 'Wait up every night',
        effects: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 3 }, { stat: 'health', delta: -3 }, { grade: -2 }, { log: 'I waited up every night for {{person}}. We had ten minutes. I kept every one.' }],
      },
      {
        id: 'miss',
        label: 'Say I miss {{them}}',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 3 }, { log: 'I told {{person}} I missed {{them}}. {{They}} swapped a shift so we get Sundays now.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -1 }, { stat: 'happiness', delta: -3 }, { log: 'I said I missed {{them}}. {{person}} cried in the car. Nothing could change yet.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ss_sp_latchkey',
    category: 'childhood',
    title: 'The key on a string',
    text: 'I have my own house key on a string around my neck. After school I let myself in, lock the door, phone {{person}} at work and have the place to myself until six.',
    minAge: 8,
    maxAge: 13,
    weight: 1.5,
    once: true,
    conditions: [SINGLE_PARENT, NO_STEP_PARENT, NOT_WEALTHY, IN_SCHOOL],
    person: PARENT_AT_HOME,
    choices: [
      {
        id: 'homework',
        label: 'Do homework first',
        effects: [{ grade: 4 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }, { log: 'I did my homework first every afternoon. By six I was done and {{person}} was impressed.' }],
      },
      {
        id: 'tv',
        label: 'Watch TV until six',
        effects: [{ stat: 'happiness', delta: 4 }, { grade: -2 }, { log: 'Afternoons were mine: cartoons, cereal and a very quick tidy at 5:55.' }],
      },
      {
        id: 'cook',
        label: 'Start dinner for us',
        effects: [
          { relationship: 'person', delta: 4 },
          {
            chance: 0.15,
            then: [{ injury: 2 }, { log: 'I tried to start dinner and burned my wrist on the pan. {{person}} came home early.', kind: 'bad' }],
            else: [{ log: 'I started dinner every night. Pasta, mostly. {{person}} walked into a warm kitchen.', kind: 'good' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ss_sp_dinner_guest',
    category: 'family',
    title: 'Somebody new',
    text: '{{person}} has been seeing someone, and tonight that someone is coming to dinner. {{They}} ironed a shirt, cleaned the bathroom twice and asked me to please be normal.',
    minAge: 7,
    maxAge: 14,
    weight: 1.2,
    once: true,
    conditions: [SINGLE_PARENT, NO_STEP_PARENT],
    person: { kind: ['mother', 'father'], household: true, maxAge: 60 },
    choices: [
      {
        id: 'behave',
        label: 'Be on my best behavior',
        effects: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: -1 }, { log: 'I said please and thank you all night. {{person}} squeezed my hand under the table.' }],
      },
      {
        id: 'grill',
        label: 'Ask a lot of questions',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 1 }, { log: 'I interviewed the dinner guest like a detective. They passed. Barely.' }],
            else: [{ relationship: 'person', delta: -3 }, { log: 'My third question was "are you going to leave too?" Dessert was very short.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'room',
        label: 'Eat in my room',
        effects: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: 1 }, { log: 'I ate in my room. Through the wall I heard {{person}} laugh, which I had not heard in a while.' }],
      },
    ],
  },
  {
    id: 'ss_sp_second_grown_up',
    category: 'family',
    title: 'The second grown-up',
    text: '{{person}} is the only parent in our house and works long hours, so I have become the second grown-up. I do the shopping, I remember the bills, and I am the one who talks to the plumber.',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    once: true,
    conditions: [SINGLE_PARENT, NO_STEP_PARENT, NOT_WEALTHY],
    person: PARENT_AT_HOME,
    choices: [
      {
        id: 'more',
        label: 'Take on even more',
        effects: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: -3 }, { stat: 'health', delta: -1 }, { log: 'I took over the bills and the shopping. {{person}} got one evening a week back.' }],
      },
      {
        id: 'night',
        label: 'Ask for Fridays off',
        effects: [{ relationship: 'person', delta: 1 }, { stat: 'happiness', delta: 3 }, { log: 'I asked for Fridays off from being a grown-up. {{person}} said yes and hugged me too long.' }],
      },
      {
        id: 'summer',
        label: 'Get a summer job',
        hint: '+{{$400}}',
        effects: [{ money: 400 }, { karma: 1 }, { stat: 'happiness', delta: -2 }, { stat: 'health', delta: -1 }, { log: 'I stocked shelves all summer, kept half the pay and put the other half toward groceries.', kind: 'money' }],
      },
    ],
  },
  {
    id: 'ss_sp_empty_seat',
    category: 'school',
    title: 'The empty seat',
    text: 'Tonight is the school show and I am a rain cloud with one line. The seat I saved for {{person}} is still empty, and the curtain goes up in five minutes.',
    minAge: 6,
    maxAge: 11,
    weight: 1.2,
    once: true,
    conditions: [SINGLE_PARENT, IN_SCHOOL],
    person: PARENT_AT_HOME,
    choices: [
      {
        id: 'wait',
        label: 'Keep the seat saved',
        effects: [
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 5 }, { log: '{{person}} slid into the seat during my line, still in {{their}} work clothes. Perfect timing.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -5 }, { log: 'The seat stayed empty. {{person}} watched the video later and clapped at the screen.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'give',
        label: 'Give the seat away',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 2 }, { log: 'I gave the seat to a grandpa who was standing. {{person}} ran in late and stood at the back.' }],
      },
      {
        id: 'act',
        label: 'Forget it and act',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'looks', delta: 1 }, { log: 'I stopped watching the door and said my line like a rain cloud with ambition. Applause.' }],
      },
    ],
  },

  // ------------------------------------------------------------------ prodigy
  {
    id: 'ss_pd_party_trick',
    category: 'childhood',
    title: 'The party trick',
    text: 'At a family party, {{person}} asked me to multiply big numbers in my head for the guests. Again. A circle has formed, and somebody has a calculator out to check me.',
    minAge: 5,
    maxAge: 8,
    weight: 1.5,
    once: true,
    conditions: [PRODIGY],
    person: RAISER,
    choices: [
      {
        id: 'perform',
        label: 'Do the math',
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I multiplied numbers until dessert. The guest with the calculator went home quiet.' }],
      },
      {
        id: 'refuse',
        label: 'Say I am not a calculator',
        effects: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: 3 }, { log: 'I said I was not a party trick. {{person}} looked embarrassed. I got cake first anyway.' }],
      },
      {
        id: 'wrong',
        label: 'Get one wrong on purpose',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 2 }, { log: 'I got one wrong on purpose. The guests relaxed. {{person}} knew, and winked at me.' }],
      },
    ],
  },
  {
    id: 'ss_pd_math_up',
    category: 'school',
    title: 'Three grades up',
    text: 'The principal wants me to take math with the kids three grades up. They are taller, they already have friends, and they will not love being beaten by someone my size.',
    minAge: 7,
    maxAge: 10,
    weight: 2,
    once: true,
    conditions: [PRODIGY, IN_SCHOOL, { stage: ['primary'] }],
    choices: [
      {
        id: 'go',
        label: 'Go up three grades',
        effects: [
          { stat: 'smarts', delta: 5 },
          { grade: 3 },
          { stat: 'happiness', delta: -3 },
          { flag: 'ss_pd_accelerated', set: true },
          { log: 'I take math with the big kids now. I sit at the front. Nobody sits next to me yet.' },
        ],
      },
      {
        id: 'stay',
        label: 'Stay with my friends',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'I stayed in math with my friends and did the hard worksheets in secret.' }],
      },
      {
        id: 'tutor',
        label: 'Help my classmates instead',
        effects: [{ karma: 3 }, { stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I stayed in my class and helped the others. Teaching it made me understand it twice.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'ss_pd_competition',
    category: 'school',
    title: 'The regional final',
    text: 'I made it to the regional math competition: forty kids, forty pencils, three hours. The trophy is ugly and huge, and I want it more than I have wanted anything.',
    minAge: 11,
    maxAge: 16,
    weight: 1.5,
    cooldown: 3,
    conditions: [PRODIGY, IN_SCHOOL],
    choices: [
      {
        id: 'cram',
        label: 'Cram all week',
        effects: [
          { stat: 'health', delta: -3 },
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 8 }, { log: 'I won. The trophy is ugly and huge and on my shelf. I look at it every day.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'I came fourth. Fourth gets a handshake. I have never shaken a hand so hard.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'rest',
        label: 'Sleep well, trust myself',
        effects: [
          { stat: 'health', delta: 1 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 8 }, { log: 'I slept nine hours and won by two points. The trophy is ugly and it is mine.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I placed sixth, calm and rested. I will be back, and I will cram next time.' }],
          },
        ],
      },
      {
        id: 'enjoy',
        label: 'Just enjoy the puzzles',
        effects: [
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.2,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'I enjoyed every puzzle and won by accident. The judges were confused. So was I.', kind: 'good' }],
            else: [{ log: 'I enjoyed every puzzle and placed in the middle. Best three hours of my year.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ss_pd_burnout',
    category: 'school',
    title: 'Running on empty',
    text: 'Everyone says I am gifted. Lately the gift feels like a job: extra classes, competitions, a schedule on the fridge. This morning I stared at a math problem and felt nothing.',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    once: true,
    conditions: [PRODIGY, IN_SCHOOL],
    choices: [
      {
        id: 'drop',
        label: 'Drop one activity',
        effects: [{ stat: 'happiness', delta: 6 }, { stat: 'smarts', delta: -1 }, { log: 'I dropped the Saturday competition team. I slept in. The world did not end.', kind: 'good' }],
      },
      {
        id: 'push',
        label: 'Push through it',
        effects: [{ stat: 'smarts', delta: 3 }, { grade: 3 }, { stat: 'health', delta: -4 }, { stat: 'happiness', delta: -5 }, { log: 'I pushed through. My grades held. I stopped remembering what I liked about any of it.', kind: 'bad' }],
      },
      {
        id: 'counselor',
        label: 'Talk to the school counselor',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'health', delta: 1 }, { log: 'I told the school counselor everything. We made a schedule with empty squares on purpose.' }],
      },
    ],
  },
  {
    // The professor's research-assistant offer is sl_office_hours (every student); this is the prodigy's own.
    id: 'ss_pd_grad_seminar',
    category: 'school',
    title: 'The graduate seminar',
    text: 'My math professor took one look at my homework and walked me to the department head. Now they say I can skip ahead to a graduate seminar, with students who have beards, mortgages and strong opinions about chalk.',
    minAge: 17,
    maxAge: 21,
    // The prodigy's one university card, in an adult pool weighing about 250.
    weight: 4,
    once: true,
    conditions: [PRODIGY, IN_SCHOOL, { stage: ['university'] }],
    choices: [
      {
        id: 'seminar',
        label: 'Join the graduate seminar',
        effects: [{ stat: 'smarts', delta: 4 }, { stat: 'happiness', delta: -2 }, { stat: 'health', delta: -1 }, { log: 'I joined the graduate seminar. I am the youngest by years and the only one who did the reading.', kind: 'good' }],
      },
      {
        id: 'freshman',
        label: 'Stay in my regular classes',
        effects: [{ stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 1 }, { log: 'I stayed in my regular classes, made friends my age and finished every exam early.' }],
      },
      {
        id: 'tutor',
        label: 'Tutor first-years for pay',
        hint: '+{{$800}}',
        effects: [{ money: 800 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }, { log: 'I tutored first-years instead. I explain the same proof nine ways a week, for money.', kind: 'money' }],
      },
    ],
  },

  // ------------------------------------------------------------------ toddlers, for whoever raises them
  {
    id: 'ss_tc_first_steps',
    category: 'childhood',
    title: 'Wobbly',
    text: 'I let go of the couch and took four wobbly steps toward {{person}}, who dropped everything and held out both arms. Step five is the hardest one. Everyone is watching.',
    minAge: 1,
    maxAge: 1,
    weight: 3,
    once: true,
    // The first steps of a child with no mother at home: `first_steps` needs one.
    conditions: [{ noPerson: ['mother'] }],
    person: RAISER,
    choices: [
      {
        id: 'walk',
        label: 'Keep walking',
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 3 }, { log: 'I made it to {{person}} in six steps and fell into {{their}} arms like I had planned it.', kind: 'milestone' }],
      },
      {
        id: 'sit',
        label: 'Sit down hard',
        effects: [{ stat: 'happiness', delta: -1 }, { stat: 'smarts', delta: 1 }, { log: 'I sat down hard after step four and crawled the rest of the way. Efficient.', kind: 'milestone' }],
      },
      {
        id: 'stairs',
        label: 'Head for the stairs',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I turned and marched toward the stairs. {{person}} caught me at the bottom step.', kind: 'milestone' }],
            else: [{ injury: 1 }, { stat: 'happiness', delta: -2 }, { log: 'I aimed for the stairs and bumped my head on the coffee table. A lump and a lesson.', kind: 'milestone' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ss_tc_first_word',
    category: 'childhood',
    title: 'My first word',
    text: 'For weeks {{person}} has been pointing at {{their}} own chest and saying "{{person}}" at me, slowly and loudly, like a tourist. Today a word is finally ready to come out.',
    minAge: 1,
    maxAge: 2,
    weight: 3,
    once: true,
    // A one-parent or foster home: `ec_first_word` is written for a mother and a father.
    conditions: [{ not: { all: [{ hasPerson: ['mother'] }, { hasPerson: ['father'] }] } }],
    person: RAISER,
    choices: [
      {
        id: 'name',
        label: 'Say "{{person}}"',
        effects: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 2 }, { log: 'My first word was "{{person}}." {{They}} phoned everyone {{they}} knew. Some twice.', kind: 'milestone' }],
      },
      {
        id: 'no',
        label: 'Say "No"',
        effects: [{ stat: 'smarts', delta: 2 }, { relationship: 'person', delta: -1 }, { log: 'My first word was "No." {{person}} laughed, then stopped laughing around age three.', kind: 'milestone' }],
      },
      {
        id: 'cookie',
        label: 'Say "Cookie"',
        effects: [{ stat: 'happiness', delta: 4 }, { log: 'My first word was "cookie." It worked instantly. I have built my life on it.', kind: 'milestone' }],
      },
    ],
  },
  {
    id: 'ss_tc_potty',
    category: 'childhood',
    title: 'The little potty',
    text: '{{person}} set a small plastic potty in the bathroom and explained what it is for, slowly, twice. There is a chart on the wall with stickers. Everyone is acting like this is the moon landing.',
    minAge: 2,
    maxAge: 3,
    weight: 3,
    once: true,
    // Potty training for a child with no mother at home: `ec_potty_training` needs one.
    conditions: [{ noPerson: ['mother'] }],
    person: RAISER,
    choices: [
      {
        id: 'try',
        label: 'Give it a real try',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: 3 }, { log: 'I figured out the potty in a week. {{person}} put the chart on the fridge like a diploma.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -1 }, { log: 'There were accidents. {{person}} bought a lot of paper towels and said nothing.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse on principle',
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: -3 }, { karma: -1 }, { log: 'I refused the potty for months, on principle. {{person}} started buying diapers in bulk.' }],
      },
      {
        id: 'hat',
        label: 'Wear it as a hat',
        effects: [{ stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: -1 }, { log: 'I wore the potty as a hat for a week. {{person}} took photos. They will resurface.' }],
      },
    ],
  },
  {
    id: 'ss_tc_toothbrush',
    category: 'childhood',
    title: 'The toothbrush',
    text: 'Every night {{person}} tries to brush my teeth, and every night I clamp my mouth shut like a treasure chest. Tonight {{they}} has brought a toothbrush that lights up.',
    minAge: 2,
    maxAge: 4,
    weight: 1.5,
    once: true,
    person: RAISER,
    choices: [
      {
        id: 'open',
        label: 'Open wide for the light',
        effects: [{ stat: 'health', delta: 3 }, { relationship: 'person', delta: 2 }, { log: 'The light-up toothbrush worked. I opened wide and hummed. {{person}} called it a miracle.', kind: 'good' }],
      },
      {
        id: 'clamp',
        label: 'Clamp shut anyway',
        effects: [{ stat: 'health', delta: -2 }, { stat: 'happiness', delta: 2 }, { log: 'I clamped shut. {{person}} brushed my lips, my chin and one lucky tooth.' }],
      },
      {
        id: 'myself',
        label: 'Demand to do it myself',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 1 }, { log: 'I brushed my own teeth. Mostly I brushed the sink. {{person}} did the back ones.' }],
      },
    ],
  },
  {
    id: 'ss_tc_laundry',
    category: 'childhood',
    title: 'Laundry mountain',
    text: '{{person}} dumped a mountain of warm, clean laundry on the bed and turned around for one second. The mountain is the best thing that has ever happened to me.',
    minAge: 2,
    maxAge: 4,
    weight: 1.5,
    once: true,
    person: RAISER,
    choices: [
      {
        id: 'dive',
        label: 'Dive into the mountain',
        effects: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: -1 }, { log: 'I dove into the warm laundry and refused to come out. {{person}} folded around me.', kind: 'good' }],
      },
      {
        id: 'fold',
        label: 'Help fold',
        effects: [{ relationship: 'person', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'I "helped" fold. Every sock got its own pile. {{person}} said I was very thorough.' }],
      },
      {
        id: 'sock',
        label: 'Hide one sock',
        effects: [{ stat: 'happiness', delta: 2 }, { karma: -1 }, { log: 'I hid one sock behind the dresser. It is still there. Nobody knows. Until now.' }],
      },
    ],
  },
  {
    id: 'ss_tc_fever',
    category: 'health',
    title: 'Fever night',
    text: 'I have a fever and everything feels too big: my blanket, my bed, the dark. {{person}} has been sitting on the floor beside me with a cool cloth for hours.',
    minAge: 1,
    maxAge: 3,
    weight: 1.2,
    once: true,
    person: RAISER,
    choices: [
      {
        id: 'hand',
        label: 'Hold {{their}} hand',
        effects: [{ relationship: 'person', delta: 5 }, { stat: 'health', delta: 1 }, { log: "I held {{person}}'s hand all night. By morning the fever was gone and {{they}} was asleep." }],
      },
      {
        id: 'cry',
        label: 'Cry it out',
        effects: [{ stat: 'health', delta: -1 }, { stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 2 }, { log: 'I cried until I was too tired to cry, then felt better. {{person}} hummed the whole time, badly.' }],
      },
      {
        id: 'water',
        label: 'Drink all the water',
        effects: [{ stat: 'health', delta: 3 }, { log: 'I drank the whole cup of water like {{person}} asked. The fever broke by sunrise.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'ss_tc_story_time',
    category: 'childhood',
    title: 'Story time',
    text: '{{person}} took me to story time at the library. Twenty kids sit on a rug shaped like a whale, and the librarian does all the voices. I have never wanted to sit still more.',
    minAge: 3,
    maxAge: 5,
    weight: 1.2,
    once: true,
    person: RAISER,
    choices: [
      {
        id: 'listen',
        label: 'Sit perfectly still',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I sat still on the whale rug and remembered every word. {{person}} got me a library card.', kind: 'good' }],
      },
      {
        id: 'answer',
        label: 'Answer every question',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 3 }, { log: 'I shouted the answer to every question, even the ones for other kids. The librarian knows me.' }],
      },
      {
        id: 'wander',
        label: 'Explore the shelves',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: 1 }, { log: 'I wandered off and found the dinosaur shelf. {{person}} found me there, reading pictures.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -1 }, { log: 'I wandered off and pulled a whole row of books down. We left early.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
];

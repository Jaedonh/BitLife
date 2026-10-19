import type { EventDef } from '@/engine/events/schema';

/**
 * Ages 45-110, told by the grandparent: grandchildren from first steps to their
 * wedding (babysitting, the tooth fairy's rates, school plays and games, a teen who
 * wants advice or money, graduation, the family tree and old photos, being taught
 * the new emojis, spoiling them against the rules at home, a summer job at my
 * work), and the grown children in between (the empty nest, the first visit
 * home, a child's family who need a place to stay, a child moving back to
 * look after me, an elopement, a remarriage, another baby on the way, a job far
 * away, a first house, hosting the holidays, the Sunday call, turning forty).
 * In prison, the family brings a young grandchild on visiting day.
 *
 * Grandchildren are the engine's (systems/family.ts): they are bound, never
 * created, and have no milestones of their own, so a grandchild's graduation and
 * wedding are once-a-life or short-window cards. A grandchild never lives with
 * the player, and their parent may be single or gone, so the text says "home"
 * or "the family", never "your parents". Weddings and babies of the player's own
 * children make the milestone happen with childMilestone on every choice, so the
 * engine does not tell them again.
 */

/** Real cars: the 'car' asset kind also covers the bicycle and the scooter. */
const REAL_CARS = ['old_hatchback', 'sedan', 'pickup', 'ev', 'luxury_sedan', 'sports_car', 'supercar', 'classic_car'];
/** A grown child and I keep separate homes: not moved in with my kids, and none moved back in with me (both set gy_lives_with_kids). */
const LIVING_APART = { not: { flag: 'gy_lives_with_kids' } };
/** I still keep a place of my own: not in assisted living, and not sharing a home with a grown child (golden_years.ts). */
const MY_OWN_PLACE = [{ not: { flag: 'gy_assisted_living' } }, LIVING_APART];
/**
 * No child of mine has a baby announced but not yet born: the events that announce one (childMilestone 'expecting')
 * have not fired in the last year, so "another baby" means a grandchild is already here (the baby comes the next year).
 */
const NO_BABY_PENDING = ['ll_grandchild_born', 'lf_grandparent_news', 'gc_child_expecting_again'].map((id) => ({ not: { sinceEvent: id, lte: 1 } }));
/** Set when a grown child takes a job across the country (gc_child_far_job), so I no longer drop by with soup. */
const CHILD_FAR_AWAY = 'gc_child_far_away';

export const GRANDCHILDREN_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ little ones
  {
    id: 'gc_first_steps',
    category: 'family',
    title: 'Three wobbly steps',
    text: 'I was babysitting {{person}} when {{they}} let go of my coffee table, swayed, and took three wobbly steps straight into my arms. First steps, and nobody else saw them.',
    minAge: 45,
    maxAge: 85,
    weight: 1.5,
    cooldown: 4,
    // "My coffee table": babysitting at my own place.
    conditions: [...MY_OWN_PLACE],
    person: { kind: ['grandchild'], minAge: 1, maxAge: 1 },
    choices: [
      {
        id: 'call',
        label: 'Call the family right away',
        effects: [
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 3 },
          { relationship: 'child', delta: 2 },
          { log: 'I called right away. They cried, laughed and made me describe all three steps twice.', kind: 'good' },
        ],
      },
      {
        id: 'secret',
        label: 'Keep it our secret',
        effects: [
          { stat: 'happiness', delta: 5 },
          { relationship: 'person', delta: 4 },
          { karma: -1 },
          { log: 'I said nothing. A week later the family filmed the "first" steps and I clapped like it was news.' },
        ],
      },
      {
        id: 'film',
        label: 'Try to get it on video',
        effects: [
          { energy: -1 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'child', delta: 3 }, { log: 'I caught the second try on video. It has been sent to everyone, including my dentist.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I filmed forty minutes of {{person}} sitting very still. The steps were a one-time show.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gc_toddler_weekend',
    category: 'family',
    title: 'The long weekend',
    text: 'I agreed to watch {{person}} for the whole weekend. It is Saturday noon, and {{they}} has already unrolled every roll of toilet paper, hidden my reading glasses in a plant pot and named my left slipper Gary.',
    minAge: 45,
    maxAge: 85,
    weight: 1.5,
    cooldown: 3,
    conditions: [...MY_OWN_PLACE],
    // Toddlers only: the weekend stay with older grandkids and their list of rules is ll_grandkid_weekend (4-12).
    person: { kind: ['grandchild'], minAge: 2, maxAge: 3 },
    choices: [
      {
        id: 'keep',
        label: 'Keep up, somehow',
        effects: [
          { energy: -2 },
          { stat: 'health', delta: -2 },
          { stat: 'happiness', delta: 6 },
          { relationship: 'person', delta: 6 },
          { log: 'I crawled, chased and sang for two days. My knees complained. {{person}} wants to come back.', kind: 'good' },
        ],
      },
      {
        id: 'cartoons',
        label: 'Put on cartoons',
        effects: [
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: 2 },
          { log: 'Cartoons, snacks and a nap for both of us. Not my finest weekend, but we both came out rested.' },
        ],
      },
      {
        id: 'park',
        label: 'Wear {{them}} out at the park',
        effects: [
          { energy: -1 },
          {
            chance: 0.75,
            then: [{ stat: 'happiness', delta: 4 }, { stat: 'health', delta: 1 }, { relationship: 'person', delta: 4 }, { log: 'Two hours on the swings and {{person}} was asleep by six. I am a genius, briefly.', kind: 'good' }],
            else: [{ injury: 3 }, { stat: 'happiness', delta: -2 }, { log: 'I followed {{person}} up the slide and came down it the hard way. My back is not speaking to me.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'early',
        label: 'Ask for an early pickup',
        effects: [
          { energy: 1 },
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: -1 },
          { relationship: 'child', delta: -3 },
          { log: 'I asked for a Saturday night pickup. It came very fast and very quietly. I slept until ten.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'gc_tooth_fairy',
    category: 'family',
    title: 'The going rate',
    // The sleepover with a list of rules from home is ll_grandkid_weekend; this one is about the fairy's rates.
    text: "{{person}} lost a tooth while sleeping over at my place and put it under the pillow with a note. The note says the tooth fairy pays more at grandparents' houses, and names a figure.",
    minAge: 45,
    maxAge: 100,
    weight: 1.2,
    cooldown: 3,
    conditions: [...MY_OWN_PLACE],
    person: { kind: ['grandchild'], minAge: 6, maxAge: 9 },
    choices: [
      {
        id: 'usual',
        label: 'Pay the usual rate',
        hint: '{{$5}}',
        effects: [
          { money: -5 },
          { stat: 'happiness', delta: 1 },
          { relationship: 'person', delta: 1 },
          { relationship: 'child', delta: 2 },
          { log: 'The tooth fairy paid {{$5}}, the usual rate. {{person}} has asked for an explanation in writing.' },
        ],
      },
      {
        id: 'premium',
        label: 'Pay the grandparent premium',
        hint: '{{$20}}',
        effects: [
          { money: -20 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 5 },
          {
            chance: 0.5,
            then: [{ relationship: 'child', delta: -3 }, { log: 'The fairy left {{$20}}. {{person}} told everyone at home, and now every tooth has a price.', kind: 'bad' }],
            else: [{ log: 'The fairy left {{$20}} and a tiny receipt. {{person}} is guarding both with {{their}} life.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'letter',
        label: 'Leave a letter from the fairy',
        hint: '{{$5}}',
        effects: [
          { money: -5 },
          { energy: -1 },
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 4 },
          { log: 'The fairy left {{$5}} and a long letter about flossing, in glitter pen. {{person}} believes every word.', kind: 'good' },
        ],
      },
      {
        id: 'asleep',
        label: 'Fall asleep first',
        effects: [
          { stat: 'health', delta: 1 },
          {
            chance: 0.5,
            then: [{ money: -5 }, { stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 2 }, { log: 'I fell asleep first, woke at four and did the job in my socks. Nobody suspects a thing.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -3 }, { log: 'I slept straight through. In the morning I blamed a fairy strike. {{person}} has filed a complaint.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gc_skin_questions',
    category: 'family',
    title: 'Three questions',
    text: '{{person}} climbed onto my lap, studied my face very closely and asked, "Why is your skin too big?" Then, "Are you going to die soon?" Then, "Can I have a cookie?"',
    minAge: 60,
    maxAge: 110,
    weight: 1.2,
    cooldown: 4,
    person: { kind: ['grandchild'], minAge: 3, maxAge: 6 },
    choices: [
      {
        id: 'honest',
        label: 'Answer all three honestly',
        effects: [
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: 1 },
          { relationship: 'person', delta: 5 },
          { log: 'Skin gets roomy, not for a long time I hope, and yes. {{person}} accepted all three answers.', kind: 'good' },
        ],
      },
      {
        id: 'wizard',
        label: 'Claim to be a wizard',
        effects: [
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 3 },
          { karma: -1 },
          { log: 'I said the skin is a wizard disguise. {{person}} has told everyone {{they}} has met since.' },
        ],
      },
      {
        id: 'cookie',
        label: 'Skip to the cookie',
        effects: [
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 2 },
          { relationship: 'child', delta: -1 },
          { log: 'I went straight to the cookie. Two cookies later, nobody remembered the first two questions.' },
        ],
      },
    ],
  },
  {
    id: 'gc_college_fund',
    category: 'money',
    title: 'Compound interest',
    text: "A financial planner on the radio said the best gift for a grandchild is compound interest. I looked at {{person}}'s photo on my fridge and did some very rough math on a napkin.",
    minAge: 45,
    maxAge: 100,
    weight: 1,
    cooldown: 8,
    person: { kind: ['grandchild'], minAge: 0, maxAge: 6 },
    choices: [
      {
        id: 'big',
        label: 'Open a fund properly',
        hint: '{{$5000}}',
        conditions: [{ money: { gte: 5000 } }],
        effects: [
          { money: -5000 },
          { karma: 2 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'child', delta: 4 },
          { log: 'I put {{$5000}} in a fund for {{person}} and explained compound interest to {{them}}. No questions.', kind: 'money' },
        ],
      },
      {
        id: 'small',
        label: 'Start small',
        hint: '{{$500}}',
        effects: [
          { money: -500 },
          { karma: 1 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: 2 },
          { log: 'I started small: {{$500}} now, more when I can. Slow money is still money.', kind: 'money' },
        ],
      },
      {
        id: 'memories',
        label: 'Spend it on memories instead',
        hint: '{{$200}}',
        effects: [
          { money: -200 },
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 4 },
          { log: 'No fund. {{person}} gets zoo trips and ice cream with me instead. Compound interest, my way.' },
        ],
      },
      {
        id: 'later',
        label: 'Think about it later',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I wrote "fund??" on a sticky note and put it on the fridge, where it still lives.' }],
      },
    ],
  },

  // ------------------------------------------------------------ school-age grandkids
  {
    id: 'gc_school_play',
    category: 'family',
    title: 'Look, the moon!',
    text: '{{person}} is in the school play and has one line: "Look, the moon!" {{They}} has rehearsed it at me on the phone every night for a month, with a different emphasis each time.',
    minAge: 45,
    maxAge: 100,
    weight: 1.5,
    cooldown: 3,
    // Rehearsing "on the phone": we do not share a home.
    conditions: [LIVING_APART],
    person: { kind: ['grandchild'], minAge: 5, maxAge: 10 },
    choices: [
      {
        id: 'front',
        label: 'Get a front-row seat',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 5 },
          { relationship: 'person', delta: 5 },
          {
            chance: 0.6,
            then: [{ log: 'Front row. I cried at "Look, the moon!" The moon was a paper plate. I stand by it.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 2 }, { log: '{{person}} spotted me, waved mid-scene and forgot the line. I cheered anyway, loudest of all.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'film',
        label: 'Film the whole thing',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 2 },
          { relationship: 'child', delta: 2 },
          { log: "I filmed the whole play, mostly the back of someone's head. The family has watched it eleven times." },
        ],
      },
      {
        id: 'flowers',
        label: 'Bring flowers for the star',
        hint: '{{$40}}',
        effects: [
          { money: -40 },
          { energy: -1 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 6 },
          { log: 'I brought flowers for {{person}}, who had one line and took four bows. A natural.', kind: 'good' },
        ],
      },
      {
        id: 'skip',
        label: 'Watch the video later',
        effects: [
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: -3 },
          { log: '{{person}} asked if I saw the moon line. I said yes. On a small screen, a week later.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'gc_soccer_game',
    category: 'family',
    title: 'The final score',
    text: "I am at {{person}}'s soccer game. The score is either 14-2 or 2-14, nobody is sure, and {{person}} has spent most of the second half lying in the grass, looking at a cloud.",
    minAge: 45,
    maxAge: 95,
    weight: 1.2,
    cooldown: 3,
    person: { kind: ['grandchild'], minAge: 6, maxAge: 11 },
    choices: [
      {
        id: 'cheer',
        label: 'Cheer like it is a final',
        effects: [
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 4 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'A referee who is eleven years old asked me to calm down. I did not calm down.', kind: 'bad' }],
            else: [{ log: '{{person}} looked up from the grass and waved at my cheering. We won, or we lost. Great game.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'cloud',
        label: 'Watch the cloud with {{them}}',
        effects: [
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 6 },
          { stat: 'health', delta: -1 },
          { log: 'After the game I lay in the wet grass with {{person}}. The cloud was a duck. My back disagreed.' },
        ],
      },
      {
        id: 'coach',
        label: 'Shout coaching tips',
        effects: [
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: -3 },
          { log: 'I shouted tactics all game. {{person}} asked me, very politely, to just bring snacks next time.', kind: 'bad' },
        ],
      },
      {
        id: 'oranges',
        label: 'Hand out orange slices',
        hint: '{{$30}}',
        effects: [
          { money: -30 },
          { karma: 1 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 3 },
          { log: 'I handed out orange slices after. Nobody remembers the score; everyone remembers the oranges.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'gc_grandparents_day',
    category: 'family',
    title: "Grandparents' Day",
    text: "{{person}}'s class invited me in for Grandparents' Day, to talk about my life for ten minutes. The children have prepared questions. One of them is \"Did you know any knights?\"",
    minAge: 50,
    maxAge: 100,
    weight: 1,
    cooldown: 5,
    person: { kind: ['grandchild'], minAge: 6, maxAge: 10 },
    choices: [
      {
        id: 'job',
        label: 'Talk about being a {{job}}',
        conditions: [{ hasJob: true }],
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 5 },
          {
            chance: 0.5,
            then: [{ log: 'I talked about being a {{job}}. Three kids now want to be one.', kind: 'good' }],
            else: [{ log: 'One boy asked how much a {{job}} earns. I said "enough". He lost interest.' }],
          },
        ],
      },
      {
        id: 'career',
        label: 'Tell them about my career',
        conditions: [{ retired: true }],
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 5 },
          { log: 'I told the class about my whole working life in ten minutes. They liked the fire drill part best.', kind: 'good' },
        ],
      },
      {
        id: 'knights',
        label: 'Confirm the knights',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 5 },
          { relationship: 'person', delta: 3 },
          { karma: -1 },
          { log: 'I said yes, I knew several knights, all very polite. {{person}} is now famous in class.' },
        ],
      },
      {
        id: 'photos',
        label: 'Bring old photos',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 4 },
          { stat: 'smarts', delta: 1 },
          { log: 'I passed around photos of me at their age. The class refused to believe I was ever that small.' },
        ],
      },
    ],
  },
  {
    id: 'gc_family_history',
    category: 'family',
    title: 'The family tree',
    // The grandchild's own project (golden_years.ts has the interview a grown child's kid records with me).
    text: '{{person}} is drawing our family tree for school. Above my name the branches are mostly empty boxes, and {{they}} has handed me a green marker and a very serious look.',
    minAge: 50,
    maxAge: 110,
    weight: 1.2,
    cooldown: 8,
    person: { kind: ['grandchild'], minAge: 8, maxAge: 16 },
    choices: [
      {
        id: 'truth',
        label: 'Fill in what I know',
        effects: [
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 5 },
          { log: 'I filled in every name I knew, with a story for each. {{person}} got an A and a sore hand.', kind: 'good' },
        ],
      },
      {
        id: 'legend',
        label: 'Add a few famous ancestors',
        effects: [
          { stat: 'happiness', delta: 5 },
          { relationship: 'person', delta: 3 },
          { karma: -1 },
          {
            chance: 0.4,
            then: [{ relationship: 'child', delta: -2 }, { log: 'I added a pirate and a lighthouse keeper. The teacher sent a note home about the pirate.', kind: 'bad' }],
            else: [{ log: 'I added a pirate and a lighthouse keeper. {{person}} believes in both. They are family now.' }],
          },
        ],
      },
      {
        id: 'abroad',
        label: 'Draw the branch overseas',
        conditions: [{ flag: 'immigrant', exists: true }],
        effects: [
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 6 },
          { log: 'I drew our roots back in the country I left as a child. {{person}} wants to go and see them.', kind: 'good' },
        ],
      },
      {
        id: 'foster',
        label: 'Explain the empty boxes',
        conditions: [{ flag: 'foster_care' }],
        effects: [
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: 8 },
          { karma: 1 },
          { log: 'I told {{person}} I grew up in foster care. We drew my foster family in, in green.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'gc_old_photos',
    category: 'family',
    title: 'The shoebox',
    text: '{{person}} found my shoebox of old photos and wants the story behind every single one, starting with one of me in a hat that I cannot explain to anyone, including myself.',
    minAge: 50,
    maxAge: 110,
    weight: 1.2,
    cooldown: 6,
    person: { kind: ['grandchild'], minAge: 9, maxAge: 25 },
    choices: [
      {
        id: 'every',
        label: 'Tell every story',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 5 },
          { relationship: 'person', delta: 5 },
          { log: 'We went through the whole box. {{person}} took photos of my photos. The hat is online now.', kind: 'good' },
        ],
      },
      {
        id: 'edit',
        label: 'Skip the embarrassing ones',
        effects: [
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 1 },
          { log: 'I skipped a few. {{person}} noticed exactly which ones and has written them down for later.' },
        ],
      },
      {
        id: 'farm',
        label: 'Find the farm photos',
        conditions: [{ flag: 'farm' }],
        effects: [
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 6 },
          { log: 'I showed {{person}} the farm: dawn chores, mud and a goat with opinions. {{They}} was horrified.', kind: 'good' },
        ],
      },
      {
        id: 'siblings',
        label: 'Name every sibling in it',
        conditions: [{ flag: 'scenario:big_family' }],
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'smarts', delta: 1 },
          { relationship: 'person', delta: 5 },
          { log: 'I named every sibling in the photo, in order, with one crime each. {{person}} took notes.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'gc_family_recipe',
    category: 'family',
    title: 'The family recipe',
    text: '{{person}} wants to learn my famous recipe, the one nobody has ever seen me make because I always do it alone with the door shut. {{They}} has brought an apron and a notebook.',
    minAge: 50,
    maxAge: 100,
    weight: 1.2,
    cooldown: 5,
    // My own kitchen, with a door to shut.
    conditions: [...MY_OWN_PLACE],
    person: { kind: ['grandchild'], minAge: 8, maxAge: 18 },
    choices: [
      {
        id: 'all',
        label: 'Teach {{them}} everything',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 5 },
          { relationship: 'person', delta: 7 },
          { log: 'I taught {{person}} every step, even the one I never tell. The secret is safe with someone now.', kind: 'good' },
        ],
      },
      {
        id: 'secret',
        label: 'Leave out the secret ingredient',
        effects: [
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 2 },
          { karma: -1 },
          { log: 'I left out one ingredient. {{person}} says {{their}} version is "close". It will stay close.' },
        ],
      },
      {
        id: 'card',
        label: 'Write it down for {{them}}',
        effects: [
          { stat: 'smarts', delta: 1 },
          { relationship: 'person', delta: 4 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I wrote it out by hand. {{person}} keeps the card in a frame, grease stain and all.', kind: 'good' }],
            else: [{ log: 'I wrote it out by hand. {{person}} made it alone and called it "pretty good". It was.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gc_drum_kit',
    category: 'family',
    title: 'Nothing loud',
    text: "{{person}}'s birthday is coming and {{they}} wants a drum kit more than {{they}} has ever wanted anything. The rule at {{their}} house is very clear: nothing loud. I do not live at {{their}} house.",
    minAge: 50,
    maxAge: 100,
    weight: 1.2,
    cooldown: 5,
    // "I do not live at their house": not for a grandparent who moved in with the kids.
    conditions: [...MY_OWN_PLACE],
    person: { kind: ['grandchild'], minAge: 7, maxAge: 13 },
    choices: [
      {
        id: 'drums',
        label: 'Buy the drums',
        hint: '{{$300}}',
        effects: [
          { money: -300 },
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 10 },
          { relationship: 'child', delta: -5 },
          { log: 'I had the drums delivered. {{person}} called me a legend. Nobody else in that house has called.', kind: 'bad' },
        ],
      },
      {
        id: 'mine',
        label: 'Keep the drums at my place',
        hint: '{{$300}}',
        effects: [
          { money: -300 },
          { stat: 'happiness', delta: -1 },
          { relationship: 'person', delta: 8 },
          { log: 'The drums live at my place. {{person}} comes over to practice. My neighbors have noticed.' },
        ],
      },
      {
        id: 'books',
        label: 'Respect the rule, buy books',
        hint: '{{$40}}',
        effects: [
          { money: -40 },
          { karma: 1 },
          { relationship: 'person', delta: -2 },
          { relationship: 'child', delta: 3 },
          { log: 'I bought books, as approved. {{person}} thanked me the way people thank a dentist.' },
        ],
      },
      {
        id: 'lessons',
        label: 'Pay for drum lessons',
        hint: '{{$600}}',
        effects: [
          { money: -600 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: 6 },
          { relationship: 'child', delta: 1 },
          { log: 'I paid for lessons at a music school, where the drums stay. Everyone was happy but my wallet.', kind: 'money' },
        ],
      },
    ],
  },
  {
    id: 'gc_kids_table',
    category: 'holiday',
    title: "The kids' table",
    text: 'At the family holiday dinner the chairs ran out and I ended up at the kids\' table with {{person}}. The conversation is about slime, sharks and a teacher who is "probably a robot". I am having a better time.',
    minAge: 55,
    maxAge: 105,
    weight: 1.2,
    cooldown: 4,
    person: { kind: ['grandchild'], minAge: 5, maxAge: 12 },
    choices: [
      {
        id: 'stay',
        label: "Stay at the kids' table",
        effects: [
          { stat: 'happiness', delta: 5 },
          { relationship: 'person', delta: 5 },
          { relationship: 'child', delta: -1 },
          { log: "I stayed at the kids' table all night. We built a napkin fort and nobody asked about my health." },
        ],
      },
      {
        id: 'adults',
        label: 'Go back to the grown-ups',
        effects: [
          { stat: 'happiness', delta: -1 },
          { relationship: 'child', delta: 2 },
          { relationship: 'person', delta: -1 },
          { log: "Back at the grown-up table, I heard about everyone's mortgage. {{person}} waved at me sadly." },
        ],
      },
      {
        id: 'robot',
        label: 'Investigate the robot teacher',
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'smarts', delta: 1 },
          { relationship: 'person', delta: 6 },
          { relationship: 'child', delta: -1 },
          { log: '{{person}} and I spent dessert building the case that the teacher is a robot. It is very strong.', kind: 'good' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ teenage and grown grandkids
  {
    id: 'gc_teen_advice',
    category: 'family',
    title: 'Just being nice?',
    text: "{{person}} sat down beside me and, without looking up from {{their}} phone, asked how you can tell if someone likes you or is just being nice. I am apparently the only one in the family who won't make it weird.",
    minAge: 50,
    maxAge: 105,
    weight: 1.2,
    cooldown: 3,
    person: { kind: ['grandchild'], minAge: 13, maxAge: 17 },
    choices: [
      {
        id: 'honest',
        label: 'Give a real answer',
        effects: [
          { relationship: 'person', delta: 6 },
          { karma: 1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I said you ask, kindly, and live with either answer. {{person}} nodded like I was wise.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'I gave my best answer. {{person}} said "that is not how it works anymore" and took it anyway.' }],
          },
        ],
      },
      {
        id: 'story',
        label: 'Tell my most embarrassing story',
        effects: [
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 4 },
          { log: 'I told {{person}} how I once hid behind a potted palm at a dance. {{They}} laughed and relaxed.', kind: 'good' },
        ],
      },
      {
        id: 'weird',
        label: 'Make it a little weird',
        effects: [
          { stat: 'happiness', delta: 5 },
          { relationship: 'person', delta: -3 },
          { log: 'I asked for a name, an address and a photo. {{person}} said this is why nobody tells me things.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'gc_trip_money',
    category: 'money',
    title: 'The school trip',
    text: '{{person}} called, which {{they}} never does, spent two minutes asking how I was, and then asked whether I could help with {{$400}} for a school trip abroad. The deadline, naturally, is Friday.',
    minAge: 50,
    maxAge: 105,
    weight: 1.2,
    cooldown: 3,
    // "Called, which they never does": we do not share a home.
    conditions: [LIVING_APART],
    person: { kind: ['grandchild'], minAge: 14, maxAge: 17 },
    choices: [
      {
        id: 'all',
        label: 'Cover all of it',
        hint: '{{$400}}',
        effects: [
          { money: -400 },
          { karma: 1 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 8 },
          { log: '{{person}} sent me a photo from the trip: a castle, a thumbs up and a very happy face.', kind: 'good' },
        ],
      },
      {
        id: 'half',
        label: 'Pay half, {{they}} earns half',
        hint: '{{$200}}',
        effects: [
          { money: -200 },
          {
            chance: 0.6,
            then: [{ karma: 1 }, { relationship: 'person', delta: 4 }, { log: '{{person}} mowed lawns for the other half and came back from the trip taller and broke.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -2 }, { log: '{{person}} did not raise the rest by Friday and stayed home. I may have been too wise.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'no',
        label: 'Say money is tight',
        effects: [
          { relationship: 'person', delta: -4 },
          { log: 'I said money was tight. {{person}} said "no worries" in the voice that means many worries.' },
        ],
      },
    ],
  },
  {
    id: 'gc_emoji_lesson',
    category: 'elderly',
    title: 'Something old people do',
    text: '{{person}} explained, patiently and for the third time, that the crying-laughing face I put at the end of every message is "something only old people do". I have sent it to everyone for years, including my doctor.',
    minAge: 55,
    maxAge: 105,
    weight: 1.2,
    cooldown: 5,
    person: { kind: ['grandchild'], minAge: 11, maxAge: 20 },
    choices: [
      {
        id: 'learn',
        label: 'Learn the new ones',
        effects: [
          { stat: 'smarts', delta: 2 },
          { relationship: 'person', delta: 4 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'I sent my doctor a skull face to mean "hilarious". Correct usage. My doctor did not know that.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 2 }, { log: 'I learned six new faces. I now text like a teenager. {{person}} is proud and slightly afraid.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'keep',
        label: 'Keep my crying-laughing face',
        effects: [
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 1 },
          { log: 'The crying-laughing face is my signature now. {{person}} has started using it ironically. I win.' },
        ],
      },
      {
        id: 'trade',
        label: 'Teach {{them}} cursive in return',
        effects: [
          { stat: 'smarts', delta: 1 },
          { relationship: 'person', delta: 3 },
          { log: 'One emoji lesson for one cursive lesson. {{person}} now signs {{their}} name like an old bank manager.' },
        ],
      },
    ],
  },
  {
    id: 'gc_late_night_call',
    category: 'family',
    title: 'One in the morning',
    text: 'My phone rang at one in the morning. It was {{person}}, at a party that had gotten out of hand, asking me to come and get {{them}} and begging me not to tell anyone at home.',
    minAge: 50,
    maxAge: 90,
    weight: 1,
    cooldown: 5,
    // "Not to tell anyone at home": I do not live in that home.
    conditions: [LIVING_APART],
    person: { kind: ['grandchild'], minAge: 15, maxAge: 17 },
    choices: [
      {
        id: 'drive',
        label: 'Drive over right now',
        conditions: [{ ownsAssetId: REAL_CARS }, { not: { flag: 'gy_stopped_driving' } }],
        effects: [
          { energy: -2 },
          { karma: 2 },
          { relationship: 'person', delta: 8 },
          {
            chance: 0.25,
            then: [{ relationship: 'child', delta: -4 }, { log: 'I drove over in my slippers. The family found out a week later. Now I get the lecture.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 2 }, { log: 'I drove over in my slippers. {{person}} got in, said nothing, then said thank you the whole drive.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'cab',
        label: 'Send a taxi',
        hint: '{{$60}}',
        effects: [
          { money: -60 },
          { karma: 1 },
          { relationship: 'person', delta: 5 },
          { log: 'I sent a taxi and stayed on the phone the whole ride. {{person}} texted "home" at two.', kind: 'good' },
        ],
      },
      {
        id: 'tell',
        label: 'Help, then tell the family',
        effects: [
          { karma: 2 },
          { relationship: 'person', delta: -4 },
          { relationship: 'child', delta: 4 },
          { log: 'I got {{person}} home safe and told the family in the morning. Grounded, furious and safe.' },
        ],
      },
    ],
  },
  {
    id: 'gc_summer_job',
    category: 'work',
    title: 'A good word',
    text: "{{person}} needs a summer job and asked whether I could put in a good word at {{company}}. {{They}} has never held a job and describes {{their}} main skill as 'vibes'.",
    minAge: 55,
    maxAge: 75,
    weight: 1,
    cooldown: 4,
    // A civilian employer: no summer jobs in the Army. No "manager" in the lines: the player may be the top rung.
    // Not the owner of the business either (salon, gym, shop, studio, pharmacy, practice, clinic, contractor),
    // who would simply hire the grandchild rather than put in a word.
    conditions: [
      { hasJob: true },
      { partTime: false },
      { not: { jobId: ['military'] } },
      {
        not: {
          any: [
            { all: [{ jobId: ['dentist'] }, { jobLevel: { gte: 2 } }] },
            { all: [{ jobId: ['hairdresser', 'fitness_trainer', 'mechanic', 'photographer', 'pharmacist', 'vet', 'electrician', 'plumber', 'carpenter'] }, { jobLevel: { gte: 3 } }] },
          ],
        },
      },
    ],
    person: { kind: ['grandchild'], minAge: 15, maxAge: 20 },
    choices: [
      {
        id: 'word',
        label: 'Put in a good word',
        effects: [
          {
            chance: 0.6,
            then: [{ jobPerformance: 2 }, { stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 6 }, { log: '{{person}} got the job and was on time all summer. At work they say it runs in the family.', kind: 'good' }],
            else: [{ jobPerformance: -4 }, { stat: 'happiness', delta: -3 }, { relationship: 'person', delta: 2 }, { log: '{{person}} got the job and was late eleven times. At work, somehow, the lateness is now mine.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'apply',
        label: 'Help {{them}} apply elsewhere',
        effects: [
          { energy: -1 },
          { relationship: 'person', delta: 4 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'We wrote a real résumé together. {{person}} got a job on {{their}} own and is insufferable about it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'We wrote a résumé together. No callbacks yet, but {{person}} has one. I did not at that age.' }],
          },
        ],
      },
      {
        id: 'no',
        label: 'Keep work and family apart',
        effects: [
          { jobPerformance: 1 },
          { relationship: 'person', delta: -4 },
          { log: 'I said I keep work and family apart. {{person}} scoops ice cream now and still mentions it.' },
        ],
      },
    ],
  },
  {
    id: 'gc_graduation',
    category: 'family',
    title: 'Cap and gown',
    text: '{{person}} is graduating from high school. There are four tickets for the whole family, and somehow one of them has my name on it. I have ironed something for the first time in years.',
    minAge: 55,
    maxAge: 110,
    weight: 1.5,
    cooldown: 3,
    person: { kind: ['grandchild'], minAge: 17, maxAge: 18 },
    choices: [
      {
        id: 'cheer',
        label: 'Cheer louder than allowed',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 6 },
          { relationship: 'person', delta: 5 },
          {
            chance: 0.3,
            then: [{ log: 'I cheered so loudly when {{person}} crossed the stage that the principal paused. Worth it.', kind: 'good' }],
            else: [{ log: 'I cheered, cried and dropped my program. {{person}} pretended not to know me, then hugged me.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'check',
        label: 'Tuck a check in a card',
        hint: '{{$1000}}',
        effects: [
          { money: -1000 },
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 8 },
          { log: 'I tucked a check for {{$1000}} into a card. {{person}} read it twice and hugged me unprompted.', kind: 'money' },
        ],
      },
      {
        id: 'advice',
        label: 'Give some life advice',
        effects: [
          { energy: -1 },
          { karma: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: 5 }, { log: 'I told {{person}} to be kind, save a little and call {{their}} grandparents. {{They}} wrote it down.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: 1 }, { log: 'I gave advice for twenty minutes. {{person}} kept glancing at the exit like a cat at the vet.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gc_sunday_dinners',
    category: 'family',
    title: 'Sunday regular',
    text: '{{person}} has started coming over every Sunday for dinner and to use my washing machine. I am almost certain it is mostly for my company.',
    minAge: 60,
    maxAge: 105,
    weight: 1,
    cooldown: 6,
    conditions: [...MY_OWN_PLACE],
    person: { kind: ['grandchild'], minAge: 18, maxAge: 24 },
    choices: [
      {
        id: 'feast',
        label: 'Cook a feast every week',
        hint: '{{$300}}',
        effects: [
          { money: -300 },
          { energy: -1 },
          { stat: 'happiness', delta: 5 },
          { relationship: 'person', delta: 7 },
          { log: 'Every Sunday I cooked like a holiday. {{person}} started bringing friends. My table is full again.', kind: 'good' },
        ],
      },
      {
        id: 'chores',
        label: 'Dinner in exchange for chores',
        effects: [
          { stat: 'health', delta: 1 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: 2 },
          { log: '{{person}} gets dinner, I get my jars opened and my shelves put up. A fair trade, we both agree.' },
        ],
      },
      {
        id: 'teach',
        label: 'Make {{them}} cook with me',
        effects: [
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 4 },
          {
            chance: 0.3,
            then: [{ log: 'I taught {{person}} to cook. The smoke alarm now goes off every Sunday, like church bells.' }],
            else: [{ log: '{{person}} learned three real dishes this year. {{They}} calls me now to ask how long to boil things.', kind: 'good' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gc_grandchild_wedding',
    category: 'family',
    title: 'A few words',
    text: '{{person}} is getting married, and the invitation came with a handwritten note asking me to say a few words at the reception. I have been rehearsing in front of the bathroom mirror. The mirror is unconvinced.',
    minAge: 65,
    maxAge: 110,
    weight: 1,
    once: true,
    person: { kind: ['grandchild'], minAge: 23, maxAge: 36 },
    choices: [
      {
        id: 'speech',
        label: 'Speak from the heart',
        effects: [
          { energy: -1 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 7 }, { relationship: 'person', delta: 6 }, { log: 'I spoke slowly and kept it short. Half the room cried. {{person}} held my hand through dessert.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 3 }, { log: 'I lost my place twice. People said it was moving. It was also quite long.', kind: 'milestone' }],
          },
        ],
      },
      {
        id: 'story',
        label: 'Tell the clown story',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 6 }, { relationship: 'person', delta: 4 }, { log: 'I told the one about {{person}} biting a clown at age three. It brought the house down.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -4 }, { log: 'I told the clown story. The in-laws did not laugh. The clown, it turns out, was their cousin.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'gift',
        label: 'Give a generous gift',
        hint: '{{$2000}}',
        effects: [
          { money: -2000 },
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 8 },
          { log: 'I gave {{person}} {{$2000}} toward a first home. {{They}} asked if I was sure, then hugged me.', kind: 'milestone' },
        ],
      },
      {
        id: 'quiet',
        label: 'Raise a glass and sit down',
        effects: [
          { stat: 'health', delta: 1 },
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 2 },
          { log: 'I said one line, raised my glass and sat down to cake. Some days you do not need the microphone.', kind: 'milestone' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ prison
  {
    id: 'gc_prison_grandchild_visit',
    category: 'prison',
    title: 'Why I live here',
    // A small grandchild's question (cp_prison_visitor has the grown-up visits, pl_kid_asks the talk after release).
    text: 'The family brought {{person}} on visiting day. {{They}} looked around at the guards, the bolted chairs and the vending machine, then at me, and asked, very loudly, why I have to live here.',
    minAge: 45,
    maxAge: 110,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: true }],
    person: { kind: ['grandchild'], minAge: 4, maxAge: 9 },
    choices: [
      {
        id: 'truth',
        label: 'Explain it simply',
        effects: [
          { karma: 2 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 6 }, { log: 'I said I broke a big rule and this is my time-out. {{person}} said time-outs are the worst.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: 2 }, { log: 'I told {{person}} the truth, simply. {{They}} went quiet and held my hand until the guard called time.' }],
          },
        ],
      },
      {
        id: 'school',
        label: 'Call it a school for grown-ups',
        effects: [
          { karma: -1 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 3 },
          { log: 'I said this is a school for grown-ups who made mistakes. {{person}} asked if I get homework.' },
        ],
      },
      {
        id: 'game',
        label: 'Play tic-tac-toe instead',
        effects: [
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 2 },
          { log: 'We played tic-tac-toe on a napkin all hour. {{person}} won every game, then asked the question again.' },
        ],
      },
      {
        id: 'away',
        label: 'Ask them not to bring {{them}}',
        effects: [
          { karma: 3 },
          { stat: 'happiness', delta: -6 },
          { relationship: 'person', delta: -4 },
          { log: 'I asked the family to keep {{person}} away from here. I see {{them}} in photos now. Safer, and it hurts.', kind: 'bad' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ grown children
  {
    id: 'gc_empty_nest',
    category: 'family',
    title: 'Empty nest',
    text: 'Since {{person}} moved out, home does not sound right. I keep buying the cereal {{they}} likes, and at nine every night I still listen for the front door.',
    minAge: 37,
    maxAge: 75,
    weight: 1.5,
    once: true,
    // An only child: with { count: 'children', eq: 1 } the child who left was the last one at home.
    conditions: [{ count: 'children', eq: 1 }, ...MY_OWN_PLACE],
    person: { kind: ['child'], minAge: 19, maxAge: 23, movedOut: true },
    choices: [
      {
        id: 'hobby',
        label: 'Take up something new',
        hint: '{{$200}}',
        effects: [
          { money: -200 },
          { stat: 'happiness', delta: 5 },
          { stat: 'smarts', delta: 1 },
          { log: 'I signed up for a pottery class. My first bowl is a plate. So is my second bowl.', kind: 'good' },
        ],
      },
      {
        id: 'room',
        label: 'Take over {{their}} old room',
        effects: [
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: -2 },
          { log: 'I turned {{person}}\'s room into a reading room. {{They}} stood in the doorway and said, "Wow. Okay."' },
        ],
      },
      {
        id: 'call',
        label: 'Call {{them}} every day',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 4 }, { log: 'I called every day for a week. Then {{person}} started calling first, which is better.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -4 }, { log: 'I called every day. On day six {{person}} texted: "Still alive, still love you, please stop."', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'quiet',
        label: 'Enjoy the quiet',
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'health', delta: 2 },
          { relationship: 'person', delta: -1 },
          { log: 'I ate dinner standing up, watched what I liked and slept nine hours. The quiet is mine too.' },
        ],
      },
    ],
  },
  {
    id: 'gc_first_visit_home',
    category: 'family',
    title: 'Home for the weekend',
    text: '{{person}} came home for the weekend with a duffel bag of dirty laundry and a whole set of new opinions about everything, including how I store the bread.',
    minAge: 37,
    maxAge: 80,
    weight: 1.2,
    cooldown: 5,
    conditions: [...MY_OWN_PLACE],
    person: { kind: ['child'], minAge: 19, maxAge: 23, movedOut: true },
    choices: [
      {
        id: 'laundry',
        label: 'Do {{their}} laundry, quietly',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: 5 },
          { log: 'I washed and folded everything like I used to. {{person}} said nothing, which means thank you.', kind: 'good' },
        ],
      },
      {
        id: 'lesson',
        label: 'Give a laundry lesson',
        effects: [
          { karma: 1 },
          { relationship: 'person', delta: -1 },
          { log: 'I gave {{person}} a laundry lesson. {{They}} rolled {{their}} eyes and took notes on {{their}} phone.' },
        ],
      },
      {
        id: 'debate',
        label: 'Argue about the opinions',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 2 }, { log: '{{person}} explained the world to me over dinner. I argued back. We both loved it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: -5 }, { log: 'Dinner turned into a debate and the debate into a slammed door. {{person}} left a day early.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'cook',
        label: 'Cook {{their}} favorite dinner',
        hint: '{{$60}}',
        effects: [
          { money: -60 },
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 4 },
          { log: "I made {{person}}'s favorite. {{They}} left with the leftovers, my containers and my paper towels." },
        ],
      },
    ],
  },
  {
    id: 'gc_family_moves_in',
    category: 'family',
    title: 'Just until we find something',
    text: '{{person}} called: the landlord is selling, the lease ends in sixty days, and could the whole family stay with me "just until we find something"? In the background, somebody asked if I have a pool.',
    minAge: 50,
    maxAge: 90,
    weight: 1,
    cooldown: 10,
    // A child with kids of their own who left home long ago. kids counts a baby on the way, so none may be pending:
    // the "whole family" and the cereal in my pockets need a grandchild already here. Nothing records the stay.
    conditions: [...MY_OWN_PLACE, ...NO_BABY_PENDING],
    person: { kind: ['child'], minAge: 26, maxAge: 42, movedOut: true, kids: { gte: 1 } },
    choices: [
      {
        id: 'yes',
        label: 'Squeeze everyone in',
        effects: [
          { energy: -2 },
          { stat: 'health', delta: -2 },
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 10 },
          { relationship: 'grandchild', delta: 4 },
          { log: 'They stayed five months. I slept badly, laughed a lot and found cereal in every pocket I own.', kind: 'good' },
        ],
      },
      {
        // The child-moves-home choice of paying a deposit elsewhere lives in grown_up_life.ts (gu_boomerang_kid).
        id: 'schedule',
        label: 'Yes, with a bathroom schedule',
        effects: [
          { energy: -1 },
          { relationship: 'person', delta: 5 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { relationship: 'grandchild', delta: 2 }, { log: 'They stayed four months. My bathroom schedule held. Everyone still salutes it at holidays.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'My bathroom schedule lasted until Tuesday. After that it was every family for itself.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'month',
        label: 'Yes, for one month',
        effects: [
          { energy: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 3 }, { log: 'One month became six weeks, then they found a place. We are all still speaking. A triumph.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -4 }, { log: 'On day thirty-one I handed {{person}} a list of apartments. The goodbye was very polite.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'no',
        label: 'Say I cannot',
        effects: [
          { karma: -1 },
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: -8 },
          { log: 'I said I could not. {{person}} found a short rental across town, and visits a little less.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'gc_child_moves_back_to_help',
    category: 'elderly',
    title: 'Keeping an eye on things',
    text: '{{person}} has announced that {{they}} is moving back in with me "to keep an eye on things". The things, I gather, are me. {{They}} arrived with two suitcases and a pill organizer.',
    minAge: 75,
    maxAge: 105,
    weight: 1,
    once: true,
    // A one-time card. "Alone": no spouse or partner (hasLover covers both). Welcoming them sets the shared
    // gy_lives_with_kids flag, so cards about living alone or apart from the kids stop opening.
    // A single child: a married one would not leave a spouse behind with two suitcases.
    conditions: [...MY_OWN_PLACE, { hasLover: false }],
    person: { kind: ['child'], minAge: 40, movedOut: true, married: false, minRelationship: 40 },
    choices: [
      {
        id: 'welcome',
        label: 'Welcome {{them}} home',
        effects: [
          { flag: 'gy_lives_with_kids', set: true },
          { stat: 'happiness', delta: 1 },
          { stat: 'health', delta: 4 },
          { relationship: 'person', delta: 6 },
          { log: 'My fridge is full, my pills are sorted, I am never alone. {{person}} also reorganized my spices.', kind: 'good' },
        ],
      },
      {
        id: 'fine',
        label: 'Insist I am fine alone',
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'health', delta: -2 },
          { relationship: 'person', delta: -4 },
          { log: 'I said I am fine alone. {{person}} took the suitcases home and now calls twice a day to check.' },
        ],
      },
      {
        id: 'visits',
        label: 'Settle on Sunday visits',
        effects: [
          { stat: 'happiness', delta: 2 },
          { stat: 'health', delta: 1 },
          { relationship: 'person', delta: 2 },
          { log: 'We agreed on Sunday visits and nightly calls. {{person}} brings soup and inspects the stairs.' },
        ],
      },
    ],
  },
  {
    id: 'gc_child_elopes',
    category: 'family',
    title: 'Ten minutes married',
    text: '{{person}} called from the courthouse steps. {{They}} got married ten minutes ago, to someone I have met twice, and wanted me to be the first to know. Well, second. The judge knew first.',
    minAge: 45,
    maxAge: 95,
    weight: 0.8,
    cooldown: 5,
    // Every choice makes the wedding the engine would otherwise write (systems/family.ts).
    person: { kind: ['child'], minAge: 24, maxAge: 45, married: false },
    choices: [
      {
        id: 'party',
        label: 'Throw them a party anyway',
        hint: '{{$2000}}',
        effects: [
          { childMilestone: 'married' },
          { money: -2000 },
          { stat: 'happiness', delta: 6 },
          { relationship: 'person', delta: 10 },
          { log: 'A month later I threw the newlyweds a party in a rented hall. {{person}} cried at my toast.', kind: 'milestone' },
        ],
      },
      {
        id: 'card',
        label: 'Send a card and a check',
        hint: '{{$200}}',
        effects: [
          { childMilestone: 'married' },
          { money: -200 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 5 },
          { log: 'I sent a card and a check. {{person}} said it was their best wedding gift. It was their only one.', kind: 'milestone' },
        ],
      },
      {
        id: 'hurt',
        label: "Say I wish I'd been there",
        effects: [
          { childMilestone: 'married' },
          { stat: 'happiness', delta: -3 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 6 }, { log: 'I said I wished I had been there. A week later they said their vows again, just for me.', kind: 'milestone' }],
            else: [{ relationship: 'person', delta: -5 }, { log: 'I said I wished I had been there. {{person}} said that was exactly why {{they}} did it this way.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gc_child_remarries',
    category: 'family',
    title: 'Done this before',
    text: '{{person}} is getting married, to someone who has been married before and has the paperwork, the ex and the calm to prove it. {{They}} wants my blessing more than my opinion, and is watching my face.',
    minAge: 50,
    maxAge: 100,
    weight: 0.6,
    once: true,
    // The fiancé's second marriage: the engine has no divorce for the player's children (see engineGaps).
    person: { kind: ['child'], minAge: 30, maxAge: 45, married: false },
    choices: [
      {
        id: 'bless',
        label: 'Give my blessing, warmly',
        effects: [
          { childMilestone: 'married' },
          { karma: 1 },
          { stat: 'happiness', delta: 5 },
          { relationship: 'person', delta: 8 },
          { log: 'I gave my blessing and meant it. The wedding was small, calm and very sure of itself.', kind: 'milestone' },
        ],
      },
      {
        id: 'questions',
        label: 'Ask a few careful questions',
        effects: [
          { childMilestone: 'married' },
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 6 }, { relationship: 'person', delta: 4 }, { log: 'I asked careful questions. The answers were good. I danced at the wedding with a clear head.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -6 }, { log: 'I asked one careful question too many. {{person}} married anyway and seated me near the kitchen.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'prenup',
        label: 'Mention a prenup, gently',
        effects: [
          { childMilestone: 'married' },
          { stat: 'smarts', delta: 1 },
          { relationship: 'person', delta: -3 },
          { log: '{{person}} said {{they}} had already signed one, thanks, and was a little insulted I asked.', kind: 'milestone' },
        ],
      },
      {
        id: 'honeymoon',
        label: 'Pay for the honeymoon',
        hint: '{{$3000}}',
        effects: [
          { childMilestone: 'married' },
          { money: -3000 },
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 10 },
          { log: 'I paid for the honeymoon. A postcard came: "Thank you. Second time\'s the charm, apparently."', kind: 'milestone' },
        ],
      },
    ],
  },
  {
    id: 'gc_child_expecting_again',
    category: 'family',
    title: 'Another one',
    text: '{{person}} called: another baby is on the way. In the same breath {{they}} asked whether I could come and help for a few weeks after the birth. {{They}} sounded tired already, and it is months away.',
    minAge: 45,
    maxAge: 90,
    weight: 1,
    cooldown: 4,
    // A second or third grandchild through this child, born next year (systems/family.ts). kids counts babies on
    // the way too, so no announcement may be pending: then every baby counted has been born.
    conditions: [...NO_BABY_PENDING],
    person: { kind: ['child'], minAge: 24, maxAge: 42, kids: { gte: 1, lte: 2 } },
    choices: [
      {
        id: 'help',
        label: 'Promise to come and help',
        effects: [
          { childMilestone: 'expecting' },
          { stat: 'health', delta: -2 },
          { stat: 'happiness', delta: 6 },
          { relationship: 'person', delta: 10 },
          { log: 'I promised three weeks of help after the birth. I packed that night, which {{person}} calls early.', kind: 'milestone' },
        ],
      },
      {
        id: 'nurse',
        label: 'Pay for a night nurse',
        hint: '{{$2500}}',
        effects: [
          { childMilestone: 'expecting' },
          { money: -2500 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 7 },
          { log: 'I offered a night nurse for the first month. {{person}} cried with relief. That says a lot.', kind: 'milestone' },
        ],
      },
      {
        id: 'weekends',
        label: 'Offer weekends only',
        effects: [
          { childMilestone: 'expecting' },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 2 },
          { log: 'I offered weekends. {{person}} said it was more than {{they}} expected and less than {{they}} hoped.', kind: 'milestone' },
        ],
      },
    ],
  },
  {
    id: 'gc_child_far_job',
    category: 'family',
    title: 'The other side of the country',
    text: '{{person}} got the job {{they}} has wanted for years. It is on the other side of the country, it starts next month, and {{they}} told me with the face of someone hoping I will be happy. I am trying.',
    minAge: 45,
    maxAge: 90,
    weight: 1,
    cooldown: 8,
    conditions: [LIVING_APART],
    person: { kind: ['child'], minAge: 24, maxAge: 50, movedOut: true },
    choices: [
      {
        id: 'proud',
        label: "Tell {{them}} I'm proud",
        effects: [
          { flag: CHILD_FAR_AWAY, set: true },
          { karma: 1 },
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: 6 },
          { log: 'I said I was proud, and I was. Then I went home and sat with it for a long while.' },
        ],
      },
      {
        id: 'move',
        label: 'Pay for the moving truck',
        hint: '{{$800}}',
        effects: [
          { flag: CHILD_FAR_AWAY, set: true },
          { money: -800 },
          { energy: -1 },
          { stat: 'happiness', delta: 1 },
          { relationship: 'person', delta: 8 },
          { log: 'I paid for the truck and packed the kitchen myself. Every plate was wrapped like it was off to war.', kind: 'good' },
        ],
      },
      {
        id: 'visit',
        label: 'Book a visit right away',
        hint: '{{$400}}',
        effects: [
          { flag: CHILD_FAR_AWAY, set: true },
          { money: -400 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 4 },
          { log: 'I booked a visit before {{person}} had even unpacked. A guest room was mentioned, eventually.' },
        ],
      },
      {
        id: 'guilt',
        label: "Remind {{them}} I'm not young",
        effects: [
          { karma: -2 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -3 }, { log: '{{person}} turned the job down to stay near me. I got what I asked for. Neither of us mentions it.', kind: 'bad' }],
            else: [{ flag: CHILD_FAR_AWAY, set: true }, { stat: 'happiness', delta: -3 }, { relationship: 'person', delta: -6 }, { log: 'I mentioned my age, twice. {{person}} took the job anyway and calls a little less now.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gc_child_first_house',
    category: 'money',
    title: 'The down payment',
    text: '{{person}} found the right house and is short on the down payment. {{They}} did not ask outright. {{They}} just mentioned the number three times during dinner and looked at me after each one.',
    minAge: 45,
    maxAge: 90,
    weight: 1,
    cooldown: 8,
    person: { kind: ['child'], minAge: 26, maxAge: 45, movedOut: true },
    choices: [
      {
        id: 'gift',
        label: 'Cover the gap',
        hint: '{{$10000}}',
        conditions: [{ money: { gte: 10000 } }],
        effects: [
          { money: -10000 },
          { karma: 2 },
          { stat: 'happiness', delta: 5 },
          { relationship: 'person', delta: 12 },
          { log: 'I covered the missing {{$10000}}. In the empty living room, {{person}} called it our house. It was nice.', kind: 'money' },
        ],
      },
      {
        id: 'loan',
        label: 'Lend it, with terms',
        hint: '{{$10000}}',
        conditions: [{ money: { gte: 10000 } }],
        effects: [
          { money: -10000 },
          { relationship: 'person', delta: 4 },
          {
            chance: 0.6,
            then: [{ money: 10000 }, { log: 'I lent it with a written plan. {{person}} paid back every cent, on the first of every month.', kind: 'money' }],
            else: [{ money: 5000 }, { relationship: 'person', delta: -3 }, { log: 'Half the loan came back before life got expensive. We stopped mentioning the rest.', kind: 'money' }],
          },
        ],
      },
      {
        id: 'some',
        label: 'Chip in what I can',
        hint: '{{$2000}}',
        effects: [
          { money: -2000 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: 5 },
          { log: 'My {{$2000}} covered the closing costs and one very ugly lamp that came with the house.', kind: 'money' },
        ],
      },
      {
        id: 'no',
        label: 'Let {{them}} manage it',
        effects: [
          { relationship: 'person', delta: -4 },
          { log: '{{person}} saved for two more years and bought it alone. I got a polite tour at the housewarming.' },
        ],
      },
    ],
  },
  {
    id: 'gc_child_hosts_holiday',
    category: 'holiday',
    title: 'Guest of honor',
    text: 'For the first time, {{person}} is hosting the big holiday dinner, not me. I have been told to bring nothing, arrive on time and, under no circumstances, go into the kitchen.',
    minAge: 50,
    maxAge: 100,
    weight: 1.2,
    once: true,
    person: { kind: ['child'], minAge: 27, movedOut: true },
    choices: [
      {
        id: 'guest',
        label: 'Be the perfect guest',
        effects: [
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: 6 },
          { log: 'I sat, ate and praised everything, including a dry roast I will never mention. {{person}} glowed.', kind: 'good' },
        ],
      },
      {
        id: 'kitchen',
        label: 'Sneak into the kitchen',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 6 }, { relationship: 'person', delta: 5 }, { log: 'I snuck in and rescued the gravy. {{person}} pretended not to see. We both knew.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -5 }, { log: '{{person}} escorted me out of the kitchen with a wooden spoon. Fair.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'dish',
        label: 'Bring my famous dish anyway',
        hint: '{{$40}}',
        effects: [
          { money: -40 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 6 }, { relationship: 'person', delta: 2 }, { log: 'My dish was eaten first. {{person}} said "of course" in a tone I chose to ignore.' }],
            else: [{ relationship: 'person', delta: -4 }, { log: "My dish sat next to {{person}}'s version of it, which was the point I had missed.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'torch',
        label: 'Sit back and watch',
        effects: [
          { stat: 'smarts', delta: 1 },
          { karma: 1 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 3 },
          { log: 'Watching {{person}} carve, pour and boss everyone, I saw the torch had passed. It felt lighter.' },
        ],
      },
    ],
  },
  {
    id: 'gc_sunday_call',
    category: 'family',
    title: 'The Sunday call',
    text: "{{person}} and I have a standing phone call every Sunday. This week {{they}} canceled, then canceled the rescheduled one, then sent a text that said 'busy love you' with no punctuation at all.",
    minAge: 45,
    maxAge: 105,
    weight: 1.5,
    cooldown: 6,
    // A phone call and a drop-by: we do not share a home.
    conditions: [LIVING_APART],
    person: { kind: ['child'], minAge: 22, movedOut: true },
    choices: [
      {
        id: 'wait',
        label: 'Wait for {{them}} to call',
        effects: [
          { stat: 'happiness', delta: -1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 4 }, { log: 'On Wednesday {{person}} called and talked for an hour, mostly about work. I loved every minute.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { log: 'The call came three weeks later. We were both a little out of practice.' }],
          },
        ],
      },
      {
        id: 'soup',
        label: 'Drop by with soup',
        hint: '{{$30}}',
        // Not once a child of mine has moved across the country (gc_child_far_job).
        conditions: [{ not: { flag: CHILD_FAR_AWAY } }],
        effects: [
          { money: -30 },
          { energy: -1 },
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 6 }, { log: '{{person}} looked exhausted, ate two bowls of my soup and fell asleep on {{their}} own couch.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { log: 'I dropped by unannounced with soup. {{person}} had friends over and was mortified.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'sulk',
        label: "Text back 'fine, whatever'",
        effects: [
          { karma: -2 },
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: 2 },
          { log: "I texted 'fine, whatever'. {{person}} called within the hour to apologize. I felt worse." },
        ],
      },
      {
        id: 'plans',
        label: 'Make my own Sunday plans',
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'health', delta: 1 },
          { relationship: 'person', delta: -1 },
          { log: 'I joined a Sunday walking group. When {{person}} finally called, I was busy. It felt fantastic.' },
        ],
      },
    ],
  },
  {
    id: 'gc_child_turns_forty',
    category: 'family',
    title: 'My baby is forty',
    text: '{{person}} turned forty today. My baby is forty. I have been sitting with this fact all morning, doing the math backwards to find where the years went.',
    minAge: 55,
    maxAge: 100,
    weight: 1,
    cooldown: 3,
    person: { kind: ['child'], minAge: 40, maxAge: 40 },
    choices: [
      {
        id: 'party',
        label: 'Throw a surprise party',
        hint: '{{$600}}',
        effects: [
          { money: -600 },
          { energy: -1 },
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 7 },
          { log: 'I threw {{person}} a surprise party and showed the baby photos. {{They}} forgave me by dessert.', kind: 'good' },
        ],
      },
      {
        id: 'letter',
        label: 'Write {{them}} a long letter',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 6 },
          { log: 'I wrote {{person}} about the day {{they}} was born. {{They}} called afterwards, voice wobbling.', kind: 'good' },
        ],
      },
      {
        id: 'card',
        label: 'Send an over-the-hill card',
        effects: [
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: 2 },
          { log: 'I sent {{person}} an over-the-hill card. {{They}} sent back a photo of me at forty. Touché.' },
        ],
      },
      {
        id: 'mope',
        label: 'Mourn my own youth',
        effects: [
          { stat: 'happiness', delta: -1 },
          { stat: 'smarts', delta: 1 },
          { relationship: 'person', delta: 2 },
          { log: 'I spent the day looking at photos of myself at forty. Then I called {{person}} and felt better.' },
        ],
      },
    ],
  },
];

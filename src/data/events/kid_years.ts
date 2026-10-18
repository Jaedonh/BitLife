import type { EventDef } from '@/engine/events/schema';

/**
 * Ages 6-12: primary school, home life, allowance, pets, siblings, small
 * crimes and smaller triumphs. Follow-ups (followUpOnly) are queued by the
 * events that set them up and never fire on their own.
 */
export const KID_YEARS_EVENTS: EventDef[] = [
  // ---------------------------------------------------------------- school
  {
    id: 'kd_first_day_intro',
    category: 'childhood',
    title: 'Introduce yourself',
    text: 'First day in a new classroom. The teacher asked everyone to stand up and say one interesting thing about themselves. My turn came far too quickly.',
    minAge: 6,
    maxAge: 8,
    weight: 2,
    once: true,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'bold',
        label: 'Announce something bold',
        effects: [
          {
            chance: 0.6,
            then: [{ log: 'I said I could whistle through my nose. The class demanded proof. I delivered. Instant legend.', kind: 'good' }, { stat: 'happiness', delta: 5 }],
            else: [{ log: 'I said something bold and the room went very quiet. The teacher moved on quickly.', kind: 'bad' }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'mumble',
        label: 'Mumble and sit down',
        effects: [{ log: 'I mumbled my name and sat down. Nobody remembers it, which was the goal.' }, { stat: 'happiness', delta: -1 }],
      },
      {
        id: 'honest',
        label: 'Say something true',
        effects: [
          { log: 'I said I like reading about volcanoes. A kid at the back said "same".', kind: 'good' },
          { stat: 'happiness', delta: 2 },
          { chance: 0.5, then: [{ newPerson: { kind: 'friend', relationship: 55, log: 'I made a friend called {{person}} over a shared interest in volcanoes.' } }] },
        ],
      },
    ],
  },
  {
    id: 'kd_copy_homework',
    category: 'childhood',
    title: 'Forgotten homework',
    text: 'I forgot my homework again. {{person}} slid {{their}} worksheet across the desk and whispered that I could copy it if I was quick about it.',
    minAge: 7,
    maxAge: 12,
    weight: 2,
    cooldown: 2,
    conditions: [{ enrolled: true }],
    person: { kind: ['friend', 'bestFriend', 'classmate'] },
    choices: [
      {
        id: 'copy',
        label: 'Copy it fast',
        effects: [
          { karma: -2 },
          {
            chance: 0.7,
            then: [{ log: 'I copied every answer, wrong ones included. Same mark, which was suspicious but survivable.' }, { grade: 2 }, { relationship: 'person', delta: 2 }],
            else: [{ log: 'The teacher noticed two identical worksheets and gave us both a zero. {{person}} was not thrilled.', kind: 'bad' }, { grade: -5 }, { relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'own',
        label: 'Own up to the teacher',
        effects: [{ karma: 2 }, { grade: -2 }, { stat: 'happiness', delta: -1 }, { log: 'I told the teacher the truth. I lost a mark and gained a lecture about responsibility.' }],
      },
      {
        id: 'rush',
        label: 'Scribble it at break',
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'I wrote the whole thing in eleven minutes flat. It was not good, but it was mine.', kind: 'good' }, { grade: 1 }, { stat: 'smarts', delta: 1 }],
            else: [{ log: 'I ran out of time halfway through and handed in a page of guesses.', kind: 'bad' }, { grade: -2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'kd_answer_sheet',
    category: 'childhood',
    title: 'The answer sheet',
    text: "The big spelling test is tomorrow. During cleanup I spotted the answer sheet sitting face up on the teacher's desk. Nobody else was looking.",
    minAge: 7,
    maxAge: 12,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'peek',
        label: 'Take a quick look',
        effects: [
          { karma: -4 },
          {
            chance: 0.6,
            then: [{ log: 'I memorised the hard words and aced the test. It felt good, then slightly rotten.' }, { grade: 6 }, { stat: 'happiness', delta: 2 }],
            else: [
              { log: 'The teacher saw me peeking. I got a zero and a note home that my parents read aloud, slowly.', kind: 'bad' },
              { grade: -8 },
              { stat: 'happiness', delta: -5 },
              { relationship: 'mother', delta: -3 },
              { relationship: 'father', delta: -3 },
            ],
          },
        ],
      },
      {
        id: 'study',
        label: 'Go home and study',
        effects: [{ stat: 'smarts', delta: 3 }, { grade: 3 }, { stat: 'happiness', delta: -1 }, { log: 'I studied the list until the words stopped looking like words. Passed fair and square.', kind: 'good' }],
      },
      {
        id: 'tell',
        label: 'Point it out',
        effects: [
          { karma: 3 },
          {
            chance: 0.5,
            then: [{ log: 'I told the teacher the answers were showing. Honesty counts, she said. Two bonus marks\' worth.', kind: 'good' }, { grade: 2 }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'I pointed it out. The teacher said thanks and put it away. That was it. Virtue is quiet.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'kd_talent_show',
    category: 'childhood',
    title: 'Talent show',
    text: 'The talent show sign-up sheet went up outside the hall. Half my class signed up to sing the same song. There were three spaces left.',
    minAge: 7,
    maxAge: 12,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'sing',
        label: 'Sing my heart out',
        effects: [
          {
            random: [
              { weight: 4, effects: [{ log: 'I hit most of the notes and the audience clapped like they meant it. Best night of my life so far.', kind: 'good' }, { stat: 'happiness', delta: 8 }, { stat: 'looks', delta: 1 }] },
              { weight: 3, effects: [{ log: 'My voice cracked on the chorus. People were kind about it, which was somehow worse.', kind: 'bad' }, { stat: 'happiness', delta: -4 }] },
              { weight: 1, effects: [{ log: 'I forgot the words, improvised a verse about the headteacher, and brought the house down.', kind: 'good' }, { stat: 'happiness', delta: 10 }, { stat: 'smarts', delta: 1 }] },
            ],
          },
        ],
      },
      {
        id: 'magic',
        label: 'Do a magic act',
        effects: [
          {
            chance: 0.55,
            then: [{ log: 'The card trick worked on the first try. A kid in the front row screamed. Magic is real.', kind: 'good' }, { stat: 'happiness', delta: 6 }, { stat: 'smarts', delta: 2 }],
            else: [{ log: 'I dropped the entire deck during the big reveal. I took a bow anyway.', kind: 'bad' }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'original',
        label: 'Perform my own song',
        conditions: [{ trait: 'creative' }],
        effects: [
          {
            chance: 0.75,
            then: [{ log: 'I played a song I wrote myself. A teacher asked where it was from. "Me," I said. "It is from me."', kind: 'good' }, { stat: 'happiness', delta: 10 }, { stat: 'smarts', delta: 2 }],
            else: [{ log: 'My own song went over heads. One kid clapped. I will remember that kid.' }, { stat: 'happiness', delta: 1 }],
          },
        ],
      },
      {
        id: 'crew',
        label: 'Work the lights',
        effects: [{ log: 'I ran the lights and nobody noticed, which is exactly what good lighting is.', kind: 'good' }, { stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 2 }, { karma: 1 }],
      },
    ],
  },
  {
    id: 'kd_sports_day',
    category: 'childhood',
    title: 'Sports day',
    text: 'Sports day. I am down for the sprint, the sack race and something called the egg-and-spoon, which nobody has explained. Parents are lining the field with cameras.',
    minAge: 6,
    maxAge: 11,
    weight: 2,
    cooldown: 2,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'allout',
        label: 'Go all out',
        effects: [
          {
            chance: 0.5,
            then: [
              { log: 'I won the sprint by a nose and the sack race by a hop. Two ribbons. My parents cheered, loudly.', kind: 'good' },
              { stat: 'happiness', delta: 6 },
              { stat: 'health', delta: 2 },
              { relationship: 'mother', delta: 2 },
              { relationship: 'father', delta: 2 },
            ],
            else: [{ log: 'I tripped in the sack race and took three kids down with me. The egg survived. My knee did not.', kind: 'bad' }, { injury: 2 }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'athletic',
        label: 'Dominate the whole day',
        conditions: [{ trait: 'athletic' }],
        effects: [
          {
            chance: 0.8,
            then: [{ log: 'I won everything, including events I had not entered. A teacher put me down for the district team.', kind: 'good' }, { stat: 'happiness', delta: 8 }, { stat: 'health', delta: 3 }],
            else: [{ log: 'I pulled a muscle showing off before the first race and watched the rest from a bench.', kind: 'bad' }, { injury: 2 }, { stat: 'happiness', delta: -4 }],
          },
        ],
      },
      {
        id: 'pace',
        label: 'Just enjoy it',
        effects: [{ log: 'I came a respectable fourth in everything and ate three ice lollies. A good day.', kind: 'good' }, { stat: 'happiness', delta: 3 }, { stat: 'health', delta: 1 }],
      },
      {
        id: 'fake',
        label: 'Fake a stomach ache',
        effects: [
          { karma: -2 },
          {
            chance: 0.6,
            then: [{ log: "I spent sports day in the nurse's office reading comics. Zero regrets." }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'The nurse saw me doing cartwheels an hour later. My parents heard about it.', kind: 'bad' }, { relationship: 'mother', delta: -3 }, { relationship: 'father', delta: -3 }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'kd_museum_trip',
    category: 'childhood',
    title: 'Museum trip',
    text: 'Class trip to the museum. The teacher handed out worksheets, counted heads twice, and made us promise not to touch anything. There was a dinosaur. It looked touchable.',
    minAge: 6,
    maxAge: 12,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'worksheet',
        label: 'Fill in the worksheet',
        effects: [{ stat: 'smarts', delta: 4 }, { grade: 2 }, { stat: 'happiness', delta: -1 }, { log: 'I filled in every box and learned a trilobite is not a kind of bread. The dinosaur went untouched.', kind: 'good' }],
      },
      {
        id: 'touch',
        label: 'Touch the dinosaur',
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'I touched a dinosaur. Nothing happened, and yet everything happened.', kind: 'good' }, { stat: 'happiness', delta: 5 }],
            else: [{ log: 'An alarm went off. I was escorted to the entrance and banned from the gift shop.', kind: 'bad' }, { grade: -2 }, { stat: 'happiness', delta: -3 }, { karma: -1 }],
          },
        ],
      },
      {
        id: 'wander',
        label: 'Wander off alone',
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'I found a room full of old maps that nobody else saw. I stayed until a guard found me.', kind: 'good' }, { stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: 4 }],
            else: [{ log: 'I got lost for an hour and the whole class had to wait on the bus. The headcount became a legend.', kind: 'bad' }, { stat: 'happiness', delta: -5 }, { relationship: 'mother', delta: -2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'kd_bully_crying',
    category: 'childhood',
    title: 'Behind the gym',
    text: 'Behind the gym I found the kid who has been shoving me all term, sitting on the steps and crying into a sleeve. They had not seen me yet.',
    minAge: 7,
    maxAge: 12,
    weight: 1,
    once: true,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'sit',
        label: 'Sit down next to them',
        effects: [
          { karma: 4 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.6,
            then: [{ newPerson: { kind: 'friend', relationship: 50, log: 'Things at home were bad, it turned out. {{person}} and I are friends now. Nobody at school gets it.' } }],
            else: [{ log: 'They told me to go away, but the shoving stopped after that. Something changed.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'walk',
        label: 'Walk away quietly',
        effects: [{ karma: 1 }, { log: 'I backed away without a sound. Some things are not mine to see.' }],
      },
      {
        id: 'tell',
        label: 'Tell everyone',
        effects: [
          { karma: -6 },
          {
            chance: 0.5,
            then: [{ log: 'The whole class heard by lunch. People laughed. It did not feel as good as I expected.' }, { stat: 'happiness', delta: 1 }],
            else: [{ log: 'The shoving got worse, and now half the class thinks I am cruel. They are not wrong.', kind: 'bad' }, { stat: 'happiness', delta: -5 }, { injury: 1 }],
          },
        ],
      },
    ],
  },
  {
    id: 'kd_spelling_bee',
    category: 'childhood',
    title: 'Spelling bee',
    text: "I qualified for the regional spelling bee by accident, by spelling 'necessary' right when everyone else got it wrong. The real thing is in two weeks.",
    minAge: 8,
    maxAge: 12,
    weight: 1,
    once: true,
    conditions: [{ enrolled: true }, { stat: 'smarts', gte: 35 }],
    choices: [
      {
        id: 'study',
        label: 'Study every night',
        effects: [
          { stat: 'smarts', delta: 4 },
          {
            chance: 0.5,
            then: [{ log: 'I won on "chrysanthemum". A trophy, a cheque, and a photo in the local paper.', kind: 'milestone' }, { money: 50 }, { stat: 'happiness', delta: 8 }],
            else: [{ log: 'Out in round four on "rhythm". It has no proper vowels. That is a trap.', kind: 'bad' }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
      {
        id: 'wing',
        label: 'Wing it',
        effects: [
          {
            chance: 0.2,
            then: [{ log: 'I guessed every word and somehow won. I will never understand it either.', kind: 'good' }, { money: 50 }, { stat: 'happiness', delta: 8 }],
            else: [{ log: 'Out in round one. The word was "weird", which felt personal.', kind: 'bad' }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'out',
        label: 'Pull out',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I said I was busy that day. I was not busy that day.' }],
      },
    ],
  },
  {
    id: 'kd_report_card',
    category: 'childhood',
    title: 'Report card',
    text: "Report card day. Mine says 'could try harder' in three different handwritings. It needs a parent's signature by Monday. {{mother}} has not seen it yet.",
    minAge: 7,
    maxAge: 12,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ enrolled: true }, { grade: { lte: 55 } }, { hasPerson: ['mother'] }],
    choices: [
      {
        id: 'show',
        label: 'Show it honestly',
        effects: [
          { karma: 2 },
          { relationship: 'mother', delta: 3 },
          {
            chance: 0.5,
            then: [{ log: 'Grounded for a week, no screens. Fair, probably.', kind: 'bad' }, { stat: 'happiness', delta: -4 }],
            else: [{ log: 'We made a study plan with coloured pens. It was almost nice.' }, { stat: 'happiness', delta: -1 }, { stat: 'smarts', delta: 1 }],
          },
        ],
      },
      {
        id: 'hide',
        label: 'Hide it',
        effects: [
          { karma: -3 },
          {
            chance: 0.5,
            then: [{ log: 'It lived under my mattress for a month. Nobody asked. A small, guilty victory.' }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'It was found during a sheet change. The lying bothered them more than the grades.', kind: 'bad' }, { relationship: 'mother', delta: -6 }, { stat: 'happiness', delta: -5 }],
          },
        ],
      },
      {
        id: 'forge',
        label: 'Forge the signature',
        effects: [
          { karma: -5 },
          {
            chance: 0.65,
            then: [{ log: 'My forgery was flawless. I am not sure what that says about me.' }, { stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: 1 }],
            else: [{ log: 'The school phoned home to compliment the signature. Everything unravelled from there.', kind: 'bad' }, { relationship: 'mother', delta: -10 }, { stat: 'happiness', delta: -6 }, { grade: -3 }],
          },
        ],
      },
    ],
  },
  {
    id: 'kd_science_fair',
    category: 'childhood',
    title: 'Science fair',
    text: "Science fair in two weeks. {{person}} has already bought a glue gun and started saying 'our project'. I have an idea about plants and music that is actually mine.",
    minAge: 9,
    maxAge: 12,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ enrolled: true }],
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather'] },
    choices: [
      {
        id: 'mine',
        label: 'Do my own idea',
        effects: [
          { stat: 'smarts', delta: 5 },
          {
            chance: 0.35,
            then: [{ log: 'First place. The plants preferred jazz and so did the judges.', kind: 'milestone' }, { money: 50 }, { stat: 'happiness', delta: 8 }],
            else: [{ log: 'No ribbon, but the plants grew and the idea was mine. {{person}} was quietly proud.' }, { stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 2 }],
          },
        ],
      },
      {
        id: 'parent',
        label: 'Let {{them}} build it',
        effects: [
          { karma: -3 },
          { relationship: 'person', delta: 3 },
          {
            chance: 0.6,
            then: [{ log: 'We won. The trophy felt heavier than it should have.' }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'A judge asked me one question about the method and I had nothing. Disqualified.', kind: 'bad' }, { stat: 'happiness', delta: -5 }, { grade: -3 }],
          },
        ],
      },
      {
        id: 'volcano',
        label: 'Build a volcano',
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'The volcano erupted on cue and covered a judge. Third place for drama.', kind: 'good' }, { stat: 'happiness', delta: 5 }, { stat: 'smarts', delta: 2 }],
            else: [{ log: 'Four volcanoes this year. Mine was the one that leaked.', kind: 'bad' }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'kd_class_election',
    category: 'childhood',
    title: 'Class election',
    text: "Class representative elections. {{person}} is running on a platform of 'more pizza'. The teacher says it's about responsibility. We all know it's about pizza.",
    minAge: 8,
    maxAge: 12,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ enrolled: true }],
    person: { kind: ['friend', 'bestFriend', 'classmate'] },
    choices: [
      {
        id: 'run',
        label: 'Run against {{them}}',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.45,
            then: [{ log: 'I won on a platform of longer breaks. Power is exhausting.', kind: 'good' }, { stat: 'happiness', delta: 6 }, { relationship: 'person', delta: -2 }],
            else: [{ log: 'I lost fourteen to nine. Pizza is undefeated.', kind: 'bad' }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'manage',
        label: 'Run {{their}} campaign',
        effects: [
          { relationship: 'person', delta: 5 },
          { stat: 'happiness', delta: 3 },
          { chance: 0.6, then: [{ log: 'We won. {{person}} gave a speech thanking me first. I nearly cried.', kind: 'good' }, { stat: 'happiness', delta: 3 }], else: [{ log: 'We lost narrowly, but the posters were excellent.' }] },
        ],
      },
      {
        id: 'abstain',
        label: 'Stay out of it',
        effects: [{ log: 'I voted for pizza like everyone else and went home.' }],
      },
    ],
  },

  // ------------------------------------------------------------------ home
  {
    id: 'kd_fence_dare',
    category: 'childhood',
    title: 'The big fence',
    text: '{{person}} dared me to climb the big fence behind the playground, the one with the warning sign. {{They}} swore {{they}} would go after me. Everyone was watching.',
    minAge: 7,
    maxAge: 12,
    weight: 1.5,
    cooldown: 2,
    person: { kind: ['friend', 'bestFriend', 'sibling'] },
    choices: [
      {
        id: 'climb',
        label: 'Climb it',
        effects: [
          {
            chance: 0.6,
            then: [{ log: 'I made it to the top and sat there like a king. {{person}} chickened out.', kind: 'good' }, { stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 4 }],
            else: [{ log: 'The sign was right. I fell from halfway and landed badly.', kind: 'bad' }, { injury: 4 }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'dare',
        label: 'Dare {{them}} back',
        effects: [
          {
            chance: 0.5,
            then: [{ log: '{{person}} climbed it, whooped, and came down grinning. We both felt brave for free.', kind: 'good' }, { stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 2 }],
            else: [{ log: '{{person}} slipped and sprained a wrist. {{They}} blamed me. {{They}} was not entirely wrong.', kind: 'bad' }, { karma: -2 }, { relationship: 'person', delta: -4 }],
          },
        ],
      },
      {
        id: 'no',
        label: 'Say no',
        effects: [{ karma: 1 }, { relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -1 }, { log: 'I said no. There was some clucking. I have both my arms.' }],
      },
    ],
  },
  {
    id: 'kd_allowance_deal',
    category: 'childhood',
    title: 'The allowance chart',
    text: '{{person}} sat me down with a chart. Allowance, {{they}} said, but it comes with chores: dishes, bins, and something involving the gutters. The chart had stickers.',
    minAge: 6,
    maxAge: 11,
    weight: 1.5,
    once: true,
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather'] },
    choices: [
      {
        id: 'deal',
        label: 'Take the deal',
        effects: [{ money: 120 }, { stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 3 }, { log: 'A year of chores, a year of pocket money. The gutters were as bad as promised.', kind: 'money' }],
      },
      {
        id: 'negotiate',
        label: 'Negotiate for more',
        effects: [
          {
            chance: 0.4,
            then: [{ log: 'I argued for a raise before I had done a single chore. {{person}} was impressed enough to agree.', kind: 'money' }, { money: 200 }, { relationship: 'person', delta: 2 }],
            else: [{ log: 'Counter-offer: half the money, all the gutters. I took it.', kind: 'money' }, { money: 60 }],
          },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse on principle',
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -3 }, { log: 'I said my time was worth more. I had no money and no plan.' }],
      },
    ],
  },
  {
    id: 'kd_lemonade_stand',
    category: 'childhood',
    title: 'Lemonade stand',
    text: 'It is hot, the street is busy, and we have lemons. I set up a stand at the end of the drive with a sign that may or may not have spelled lemonade correctly.',
    minAge: 7,
    maxAge: 11,
    weight: 1.5,
    cooldown: 2,
    choices: [
      {
        id: 'classic',
        label: 'Sell classic cups',
        effects: [
          {
            random: [
              { weight: 5, effects: [{ log: 'Steady trade all afternoon. I counted the coins four times.', kind: 'money' }, { money: 40 }, { stat: 'happiness', delta: 3 }] },
              { weight: 3, effects: [{ log: 'A wedding party walked past and bought everything. I ran out of lemons by two.', kind: 'money' }, { money: 120 }, { stat: 'happiness', delta: 5 }] },
              { weight: 2, effects: [{ log: 'The sign was upside down. Two customers, one of them my own mother.' }, { money: 10 }, { stat: 'happiness', delta: -2 }] },
            ],
          },
        ],
      },
      {
        id: 'premium',
        label: 'Charge premium prices',
        effects: [
          {
            chance: 0.3,
            then: [{ log: 'Tourists. They paid anything. I felt briefly like a tycoon.', kind: 'money' }, { money: 250 }, { stat: 'happiness', delta: 6 }],
            else: [{ log: 'Nobody paid that much for lemonade. I drank most of it myself.', kind: 'bad' }, { money: 5 }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'free',
        label: 'Give it away',
        effects: [{ karma: 3 }, { stat: 'happiness', delta: 4 }, { log: 'Free lemonade for the whole street. I made no money and about nine friends.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'kd_lost_dog',
    category: 'childhood',
    title: 'The open gate',
    text: "The neighbours' dog, which we were minding for the weekend, got out through the gate that someone, me, left open. The whole street is driving laps and I have shouted his name until my voice went.",
    minAge: 6,
    maxAge: 12,
    weight: 1,
    cooldown: 4,
    choices: [
      {
        id: 'search',
        label: 'Search until dark',
        effects: [
          {
            chance: 0.6,
            then: [{ log: 'Found him at dusk, asleep under a hedge two streets away. I carried him home.', kind: 'good' }, { stat: 'happiness', delta: 6 }, { stat: 'health', delta: 1 }, { relationship: 'mother', delta: 2 }],
            else: [{ log: 'We searched until it was too dark to see. We put his bowl out anyway.', kind: 'bad' }, { stat: 'happiness', delta: -8 }],
          },
        ],
      },
      {
        id: 'posters',
        label: 'Print posters',
        hint: 'Costs {{$20}}',
        conditions: [{ money: { gte: 20 } }],
        effects: [
          { money: -20 },
          {
            chance: 0.75,
            then: [{ log: 'A neighbour rang the next morning. He had been eating her bins and was very pleased with himself.', kind: 'good' }, { stat: 'happiness', delta: 6 }],
            else: [{ log: 'The posters faded on the lampposts. Nobody called.', kind: 'bad' }, { stat: 'happiness', delta: -8 }],
          },
        ],
      },
      {
        id: 'wait',
        label: 'Wait at home',
        effects: [
          {
            chance: 0.4,
            then: [{ log: 'He came back at midnight, muddy and unrepentant. I was forgiven by everyone except the carpet.', kind: 'good' }, { stat: 'happiness', delta: 5 }],
            else: [{ log: 'He did not come back. I left the gate open every night for a month in case.', kind: 'bad' }, { stat: 'happiness', delta: -8 }],
          },
        ],
      },
    ],
  },
  {
    id: 'kd_stray_cat',
    category: 'childhood',
    title: 'The stray',
    text: 'A thin grey cat followed me home from school and sat on the doorstep like it owned the place. It has no collar. It has opinions.',
    minAge: 6,
    maxAge: 12,
    weight: 1,
    once: true,
    choices: [
      {
        id: 'beg',
        label: 'Beg to keep it',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 8 }, { newPerson: { kind: 'pet', species: 'cat', relationship: 70, log: 'After a long family meeting and a vet bill, {{person}} the cat is officially ours.' } }],
            else: [{ log: 'The answer was no. The cat watched me lose the argument from the windowsill.', kind: 'bad' }, { stat: 'happiness', delta: -4 }],
          },
        ],
      },
      {
        id: 'secret',
        label: 'Feed it secretly',
        effects: [
          { karma: 2 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.35,
            then: [{ newPerson: { kind: 'pet', species: 'cat', relationship: 65, log: 'My parents found the tins under my bed and gave up. {{person}} the cat moved in.' } }],
            else: [{ log: 'I fed it on the back step for a month. One day it just stopped coming.' }],
          },
        ],
      },
      {
        id: 'shoo',
        label: 'Shoo it away',
        effects: [{ karma: -1 }, { stat: 'happiness', delta: -2 }, { log: 'I clapped and it left. It looked back once. I think about that.' }],
      },
    ],
  },
  {
    id: 'kd_parent_lost_job',
    category: 'childhood',
    title: 'The quiet dinner',
    text: "{{person}} came home early and sat in the car for a long time before coming in. Later I heard the word 'redundant'. Dinner was quiet and the TV stayed off.",
    minAge: 6,
    maxAge: 12,
    weight: 0.7,
    once: true,
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather'] },
    choices: [
      {
        id: 'ask',
        label: 'Ask what happened',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: -3 }, { relationship: 'person', delta: 4 }, { log: '{{person}} explained it properly, like I was a person. I understood more than {{they}} expected.' }, { queue: 'kd_tight_months' }],
      },
      {
        id: 'savings',
        label: 'Offer my savings',
        hint: 'Gives {{$20}}',
        conditions: [{ money: { gte: 20 } }],
        effects: [{ money: -20 }, { karma: 3 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: -1 }, { log: 'I put my coins on the table. {{person}} laughed, then cried, then put them back in my jar.', kind: 'good' }, { queue: 'kd_tight_months' }],
      },
      {
        id: 'hide',
        label: 'Stay out of the way',
        effects: [{ stat: 'happiness', delta: -5 }, { log: 'I went to my room and listened to the house be quiet.' }, { queue: 'kd_tight_months' }],
      },
    ],
  },
  {
    id: 'kd_tight_months',
    category: 'childhood',
    title: 'Tight months',
    text: 'The next few months were tight. Brand-name cereal vanished from our cupboard. The heating came on later. {{person}} started applying for jobs at the kitchen table every morning.',
    minAge: 6,
    maxAge: 13,
    weight: 1,
    followUpOnly: true,
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather'] },
    choices: [
      {
        id: 'help',
        label: 'Help without being asked',
        effects: [
          { karma: 3 },
          { relationship: 'person', delta: 5 },
          { stat: 'happiness', delta: -1 },
          { log: 'I did the dishes, folded things, stopped asking for stuff. Nobody said anything. Everybody noticed.' },
          { chance: 0.7, then: [{ log: '{{person}} found a new job by spring. The cereal came back.', kind: 'good' }, { stat: 'happiness', delta: 4 }], else: [{ log: 'It took longer than anyone wanted. We got through it.' }, { stat: 'happiness', delta: -3 }] },
        ],
      },
      {
        id: 'complain',
        label: 'Complain about the cereal',
        effects: [
          { karma: -3 },
          { relationship: 'person', delta: -4 },
          { stat: 'happiness', delta: 1 },
          { log: 'I complained about the cereal. {{person}} looked at me for a long second and said nothing.', kind: 'bad' },
          { chance: 0.7, then: [{ log: '{{person}} found a new job by spring. I never mentioned the cereal again.' }, { stat: 'happiness', delta: 3 }], else: [{ log: 'The job hunt dragged on. I learned to eat the own-brand stuff.' }, { stat: 'happiness', delta: -3 }] },
        ],
      },
      {
        id: 'bottles',
        label: 'Start collecting bottles',
        effects: [
          { money: 40 },
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 2 },
          { log: 'I returned bottles for the deposit all winter and handed over the coins. It helped. A bit.', kind: 'money' },
          { chance: 0.7, then: [{ log: '{{person}} found a new job by spring and bought me a bike with the first pay.', kind: 'good' }, { stat: 'happiness', delta: 4 }], else: [{ log: 'The job hunt dragged into summer. The bottles kept coming.' }, { stat: 'happiness', delta: -2 }] },
        ],
      },
    ],
  },
  {
    id: 'kd_moving_house',
    category: 'childhood',
    title: 'Moving house',
    text: 'My parents announced it at dinner: we are moving to the other side of {{country}} for work. New house, new school, new everything. The boxes arrived the next day.',
    minAge: 6,
    maxAge: 12,
    weight: 0.6,
    once: true,
    choices: [
      {
        id: 'pack',
        label: 'Help pack',
        effects: [{ relationship: 'mother', delta: 3 }, { relationship: 'father', delta: 3 }, { stat: 'happiness', delta: -2 }, { karma: 1 }, { log: 'I labelled every box in my best handwriting. Half of them just said "stuff".' }, { queue: 'kd_new_town' }],
      },
      {
        id: 'refuse',
        label: 'Refuse to leave my room',
        effects: [{ stat: 'happiness', delta: -6 }, { relationship: 'mother', delta: -3 }, { relationship: 'father', delta: -3 }, { log: 'I barricaded my door with a chair. The movers were very patient. We left anyway.', kind: 'bad' }, { queue: 'kd_new_town' }],
      },
      {
        id: 'goodbye',
        label: 'Say goodbye properly',
        effects: [{ stat: 'happiness', delta: -3 }, { relationship: 'friend', delta: 4 }, { relationship: 'bestFriend', delta: 4 }, { karma: 2 }, { log: 'I went round every house on the street and said goodbye like a grown-up. It hurt more that way.' }, { queue: 'kd_new_town' }],
      },
    ],
  },
  {
    id: 'kd_new_town',
    category: 'childhood',
    title: 'The new town',
    text: 'First week in the new town. The house smells of paint. The school is bigger. Nobody knows my name, which is either terrifying or a fresh start.',
    minAge: 6,
    maxAge: 13,
    weight: 1,
    followUpOnly: true,
    choices: [
      {
        id: 'introduce',
        label: 'Introduce myself to everyone',
        effects: [
          {
            chance: 0.65,
            then: [{ stat: 'happiness', delta: 6 }, { newPerson: { kind: 'friend', relationship: 55, log: 'By Friday I had a friend called {{person}} and a seat at a lunch table.' } }],
            else: [{ log: 'I introduced myself to everyone. Everyone already had friends. I ate lunch by the bins.', kind: 'bad' }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'old',
        label: 'Cling to old friends',
        effects: [{ relationship: 'friend', delta: 2 }, { relationship: 'bestFriend', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I wrote long messages to everyone back home. They wrote back less and less.' }],
      },
      {
        id: 'explore',
        label: 'Explore alone',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 2 }, { chance: 0.3, then: [{ log: 'I found a creek behind the new house with actual frogs. The move is forgiven.', kind: 'good' }, { stat: 'happiness', delta: 3 }], else: [{ log: 'I mapped every street within a mile. It is a very normal town.' }] }],
      },
    ],
  },
  {
    id: 'kd_attic_find',
    category: 'childhood',
    title: 'The attic',
    text: 'Rummaging in the attic I found a dusty guitar with five strings, a tin of dried-up paints, and a chess set missing one knight. All three were somehow calling to me.',
    minAge: 7,
    maxAge: 12,
    weight: 1.2,
    once: true,
    choices: [
      {
        id: 'guitar',
        label: 'Take the guitar',
        effects: [
          { flag: 'kd_hobby', set: 'music' },
          { stat: 'happiness', delta: 4 },
          { chance: 0.5, then: [{ log: 'Three chords by the end of the month. The neighbours have asked about the fourth.', kind: 'good' }, { stat: 'smarts', delta: 2 }], else: [{ log: 'I learned one chord and played it until a string snapped. Rock and roll.' }] },
        ],
      },
      {
        id: 'paints',
        label: 'Take the paints',
        effects: [{ flag: 'kd_hobby', set: 'art' }, { stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 1 }, { log: 'I revived the paints with water and covered every spare surface in the house. Some of it was good.', kind: 'good' }],
      },
      {
        id: 'chess',
        label: 'Take the chess set',
        effects: [{ flag: 'kd_hobby', set: 'chess' }, { stat: 'smarts', delta: 5 }, { stat: 'happiness', delta: 2 }, { log: 'I use a bottle cap for the missing knight. I have beaten everyone in the house at least once.', kind: 'good' }],
      },
      {
        id: 'back',
        label: 'Put it all back',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I put it all back where I found it. The dust settled again.' }],
      },
    ],
  },
  {
    id: 'kd_braces',
    category: 'childhood',
    title: 'Braces, probably',
    text: 'The dentist said the word every kid dreads: braces. Two years, maybe more. {{mother}} nodded like it was good news. The dentist showed me a picture of a straight smile.',
    minAge: 9,
    maxAge: 12,
    weight: 1,
    once: true,
    conditions: [{ hasPerson: ['mother'] }],
    choices: [
      {
        id: 'get',
        label: 'Get the braces',
        effects: [
          { stat: 'happiness', delta: -4 },
          { stat: 'looks', delta: 7 },
          { stat: 'health', delta: 1 },
          { log: 'Two years of wires and rubber bands, and then a smile that photographs well. Worth it, eventually.', kind: 'good' },
          { chance: 0.4, then: [{ log: 'A kid called me "metal mouth" for a full term. He now has braces too.', kind: 'bad' }, { stat: 'happiness', delta: -3 }] },
        ],
      },
      {
        id: 'clear',
        label: 'Ask for the clear kind',
        hint: 'Family can afford it',
        conditions: [{ flag: 'wealthyFamily' }],
        effects: [{ stat: 'looks', delta: 8 }, { stat: 'happiness', delta: -1 }, { log: 'Clear braces. Nobody noticed, which cost a fortune.', kind: 'good' }],
      },
      {
        id: 'refuse',
        label: 'Refuse',
        effects: [{ stat: 'looks', delta: -3 }, { stat: 'happiness', delta: 2 }, { relationship: 'mother', delta: -2 }, { log: 'I refused and nobody forced me. My teeth went their own way. They are still going.' }],
      },
    ],
  },
  {
    id: 'kd_found_wallet',
    category: 'childhood',
    title: 'The wallet',
    text: 'On the path through the park I found a wallet. Inside: {{$60}}, a library card and a photo of a sad-looking spaniel. Nobody was around.',
    minAge: 6,
    maxAge: 12,
    weight: 1,
    cooldown: 4,
    choices: [
      {
        id: 'handin',
        label: 'Hand it in',
        effects: [
          { karma: 4 },
          {
            chance: 0.5,
            then: [{ log: 'The owner came by with a tin of biscuits and {{$20}} as a thank-you. The spaniel came too.', kind: 'good' }, { money: 20 }, { stat: 'happiness', delta: 4 }],
            else: [{ log: 'I handed it to the park office. Nobody said thanks. That is fine. That is allowed.' }, { stat: 'happiness', delta: 2 }],
          },
        ],
      },
      {
        id: 'keep',
        label: 'Keep the cash',
        effects: [
          { money: 60 },
          { karma: -5 },
          {
            chance: 0.25,
            then: [{ log: "The spaniel's owner lives three doors down. They know. They have not said anything. That is worse.", kind: 'bad' }, { stat: 'happiness', delta: -4 }, { relationship: 'mother', delta: -3 }],
            else: [{ log: 'I bought a frankly enormous amount of sweets. The spaniel haunts me a little.', kind: 'money' }, { stat: 'happiness', delta: 3 }],
          },
        ],
      },
      {
        id: 'leave',
        label: 'Leave it there',
        effects: [{ karma: 1 }, { log: 'I left it on the bench where they would look. Someone else probably found it. Mostly not my problem.' }],
      },
    ],
  },
  {
    id: 'kd_broken_window',
    category: 'childhood',
    title: 'The window',
    text: "The ball went up, the ball came down, and the neighbour's kitchen window came down with it. {{person}} was standing right next to me. Nobody else saw.",
    minAge: 6,
    maxAge: 12,
    weight: 1.2,
    cooldown: 3,
    person: { kind: ['sibling'] },
    choices: [
      {
        id: 'confess',
        label: 'Confess to the neighbour',
        effects: [
          { karma: 3 },
          {
            chance: 0.6,
            then: [{ log: 'The neighbour sighed, said at least I was honest, and let me off. I washed his car anyway.', kind: 'good' }, { stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 2 }],
            else: [{ log: 'I paid for it in car-washing, weeding and one terrible Saturday of gutter-clearing.', kind: 'bad' }, { stat: 'happiness', delta: -3 }, { stat: 'health', delta: 1 }],
          },
        ],
      },
      {
        id: 'run',
        label: 'Run',
        effects: [
          { karma: -4 },
          {
            chance: 0.5,
            then: [{ log: 'We ran. Nobody came. We never speak of the window.' }, { stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 2 }],
            else: [{ log: 'The neighbour had seen everything from the garden. My parents paid, and I paid for a long time.', kind: 'bad' }, { relationship: 'mother', delta: -5 }, { relationship: 'father', delta: -5 }, { stat: 'happiness', delta: -5 }],
          },
        ],
      },
      {
        id: 'blame',
        label: 'Blame {{person}}',
        effects: [
          { karma: -6 },
          { relationship: 'person', delta: -12 },
          {
            chance: 0.5,
            then: [{ log: '{{person}} took the blame and the punishment. I felt about two inches tall for a month.', kind: 'bad' }, { stat: 'happiness', delta: -2 }],
            else: [{ log: "The neighbour didn't buy it for a second. Now I was in trouble for the window and the lie.", kind: 'bad' }, { relationship: 'mother', delta: -5 }, { stat: 'happiness', delta: -5 }],
          },
        ],
      },
    ],
  },
  {
    id: 'kd_sleepover',
    category: 'childhood',
    title: 'Sleepover invite',
    text: "{{person}} invited me to a sleepover: pizza, a scary film {{their}} parents don't know about, and sleeping bags on the living-room floor.",
    minAge: 7,
    maxAge: 12,
    weight: 2,
    cooldown: 2,
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'go',
        label: 'Go',
        effects: [
          {
            random: [
              { weight: 5, effects: [{ log: 'We stayed up until three talking about everything. Best night of the year.', kind: 'good' }, { stat: 'happiness', delta: 6 }, { relationship: 'person', delta: 5 }] },
              { weight: 3, effects: [{ log: 'I got homesick at two in the morning and had to be collected. Nobody mentioned it. Everybody knew.', kind: 'bad' }, { stat: 'happiness', delta: -3 }, { relationship: 'person', delta: -1 }] },
              { weight: 2, effects: [{ log: 'The scary film was too scary. Nobody slept. We all pretended it was great.' }, { stat: 'health', delta: -1 }, { stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 3 }] },
            ],
          },
        ],
      },
      {
        id: 'host',
        label: 'Host one instead',
        effects: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 3 }, { relationship: 'mother', delta: -2 }, { log: 'I hosted. The living room took a week to recover. {{person}} says mine was better.', kind: 'good' }],
      },
      {
        id: 'stay',
        label: 'Stay home',
        effects: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -3 }, { log: 'I said I was busy. I spent the night wondering what they were doing.' }],
      },
    ],
  },
  {
    id: 'kd_sibling_bike',
    category: 'childhood',
    title: 'The new bike',
    text: "{{person}} got a brand-new bike for no reason I could identify. Mine has a bent wheel and a bell that doesn't ring. The injustice was total.",
    minAge: 6,
    maxAge: 12,
    weight: 1.5,
    cooldown: 3,
    person: { kind: ['sibling'] },
    choices: [
      {
        id: 'complain',
        label: 'Complain to the parents',
        effects: [
          {
            chance: 0.4,
            then: [{ log: 'They fixed my wheel and said my turn would come. It did, eventually.', kind: 'good' }, { stat: 'happiness', delta: 3 }],
            else: [{ log: 'I was told to stop whining. I did not stop whining. I was told again.', kind: 'bad' }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'sabotage',
        label: 'Let the tyres down',
        effects: [
          { karma: -5 },
          { relationship: 'person', delta: -10 },
          {
            chance: 0.5,
            then: [{ log: 'I was caught, valve cap in hand. Everyone was disappointed in me, which is worse than angry.', kind: 'bad' }, { relationship: 'mother', delta: -4 }, { stat: 'happiness', delta: -3 }],
            else: [{ log: 'Two flat tyres, no witnesses. {{person}} suspected. {{person}} was right.' }, { stat: 'happiness', delta: 2 }],
          },
        ],
      },
      {
        id: 'ask',
        label: 'Ask for a go',
        effects: [
          { relationship: 'person', delta: 3 },
          {
            chance: 0.6,
            then: [{ log: '{{person}} let me ride it round the block. It was glorious. It was not mine.', kind: 'good' }, { stat: 'happiness', delta: 4 }],
            else: [{ log: '"No." {{They}} did not even look up.' }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
      {
        id: 'happy',
        label: 'Be happy for {{them}}',
        effects: [{ karma: 2 }, { relationship: 'person', delta: 3 }, { stat: 'happiness', delta: -1 }, { log: 'I said it was a great bike and meant it, mostly. {{person}} looked suspicious.' }],
      },
    ],
  },
  {
    id: 'kd_game_weekend',
    category: 'childhood',
    title: 'Rainy weekend',
    text: 'A rainy weekend, a brand-new video game, and nothing else on my calendar. {{person}} came over with snacks and the firm intention of never leaving the sofa.',
    minAge: 8,
    maxAge: 12,
    weight: 2,
    cooldown: 2,
    person: { kind: ['sibling', 'friend', 'bestFriend'] },
    choices: [
      {
        id: 'marathon',
        label: 'Play all weekend',
        effects: [
          { stat: 'happiness', delta: 6 },
          { stat: 'health', delta: -2 },
          { relationship: 'person', delta: 3 },
          { log: 'Forty hours. Square eyes. We beat the final boss at 1am on Sunday and screamed.', kind: 'good' },
          { chance: 0.3, then: [{ log: 'Homework did not happen. The teacher noticed on Monday.', kind: 'bad' }, { grade: -2 }] },
        ],
      },
      {
        id: 'turns',
        label: 'Take turns, go outside',
        effects: [{ stat: 'health', delta: 3 }, { stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 2 }, { log: 'We played a few levels, then went out in the rain and came back soaked and starving. Balanced.', kind: 'good' }],
      },
      {
        id: 'hog',
        label: 'Hog the controller',
        effects: [{ relationship: 'person', delta: -5 }, { stat: 'happiness', delta: 3 }, { karma: -2 }, { log: '{{person}} watched me play for six hours and then went home early. I finished the game. Alone.' }],
      },
    ],
  },
  {
    id: 'kd_birthday_worry',
    category: 'childhood',
    title: 'Birthday nerves',
    text: "My birthday is Saturday and I have been lying awake worrying nobody will come. {{person}} promised to be there, but one guest is not a party. My parents say I'm being ridiculous.",
    minAge: 6,
    maxAge: 12,
    weight: 1.5,
    cooldown: 3,
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'whole',
        label: 'Invite the whole class',
        effects: [
          {
            chance: 0.7,
            then: [{ log: 'Nineteen kids, one cake, zero survivors among the balloons. Incredible.', kind: 'good' }, { stat: 'happiness', delta: 8 }, { newPerson: { kind: 'friend', relationship: 50, log: 'A kid called {{person}} stayed to help clean up. We have been friends ever since.' } }],
            else: [{ log: 'Three people came. One was my cousin. {{person}} ate most of the cake out of loyalty.', kind: 'bad' }, { stat: 'happiness', delta: -6 }, { relationship: 'person', delta: 3 }],
          },
        ],
      },
      {
        id: 'small',
        label: 'Small party with {{person}}',
        effects: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 4 }, { log: 'Just {{person}}, a film, and a cake the size of a tyre. The best parties are small.', kind: 'good' }],
      },
      {
        id: 'skip',
        label: 'Skip the party',
        effects: [{ stat: 'happiness', delta: -3 }, { money: 50 }, { relationship: 'person', delta: -1 }, { log: 'No party. My parents gave me the party money instead, which was practical and a little sad.', kind: 'money' }],
      },
    ],
  },
  {
    id: 'kd_piggy_bank',
    category: 'childhood',
    title: 'The piggy bank',
    text: '{{person}} left {{their}} piggy bank on the kitchen table, lid off, coins glinting. {{They}} was outside. The house was quiet. The bank was very full. I was alone with it.',
    minAge: 6,
    maxAge: 11,
    weight: 1.2,
    cooldown: 3,
    person: { kind: ['sibling'] },
    choices: [
      {
        id: 'take',
        label: 'Take a handful',
        effects: [
          { money: 30 },
          { karma: -5 },
          {
            chance: 0.5,
            then: [{ log: '{{person}} counts {{their}} money every night. {{They}} knew within the hour. So did everyone else.', kind: 'bad' }, { relationship: 'person', delta: -12 }, { relationship: 'mother', delta: -4 }, { stat: 'happiness', delta: -4 }],
            else: [{ log: 'Nobody noticed. I spent it fast so I would stop feeling it in my pocket.' }, { stat: 'happiness', delta: 2 }],
          },
        ],
      },
      {
        id: 'leave',
        label: 'Leave it alone',
        effects: [{ karma: 2 }, { log: 'I looked at it for a while and then went outside. Nothing happened, which was the point.' }],
      },
      {
        id: 'warn',
        label: 'Tell {{them}} to hide it',
        effects: [{ relationship: 'person', delta: 3 }, { karma: 1 }, { log: 'I told {{person}} to hide it better. {{They}} hid it from me. Fair.' }],
      },
    ],
  },
  {
    id: 'kd_neighbor_leaves',
    category: 'childhood',
    title: 'Infinite leaves',
    text: 'The old man next door offered me {{$20}} to rake his leaves. His yard is enormous. His leaves are infinite. He was already holding out the rake.',
    minAge: 8,
    maxAge: 12,
    weight: 1.5,
    cooldown: 2,
    choices: [
      {
        id: 'rake',
        label: 'Rake it all',
        effects: [{ money: 20 }, { stat: 'health', delta: 1 }, { stat: 'happiness', delta: -1 }, { karma: 1 }, { log: 'Four hours, eleven bags, one blister. He paid in exact change and a slice of cake.', kind: 'money' }],
      },
      {
        id: 'negotiate',
        label: 'Negotiate the rate',
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'I pointed at the yard and asked for more. He respected the hustle and paid up.', kind: 'money' }, { money: 35 }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'He hired the kid across the road instead. I watched from the window, unemployed.', kind: 'bad' }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
      {
        id: 'badly',
        label: 'Rake it badly',
        effects: [
          { money: 20 },
          { karma: -2 },
          { stat: 'happiness', delta: 2 },
          { chance: 0.4, then: [{ log: 'I moved the leaves from one side of the yard to the other. He paid, and never asked again.' }, { stat: 'happiness', delta: -1 }], else: [{ log: 'Half a job, full pay. He did not seem to notice. The leaves came back anyway.', kind: 'money' }] },
        ],
      },
    ],
  },
  {
    id: 'kd_tooth_fairy',
    category: 'childhood',
    title: 'Loose tooth',
    text: 'My tooth came out in an apple at lunch. It is now wrapped in a tissue, and the whole class has opinions about what the tooth fairy pays these days.',
    minAge: 6,
    maxAge: 8,
    weight: 2,
    cooldown: 2,
    choices: [
      {
        id: 'pillow',
        label: 'Under the pillow',
        effects: [{ money: 5 }, { stat: 'happiness', delta: 3 }, { log: 'A coin appeared under the pillow overnight. The system works.', kind: 'money' }],
      },
      {
        id: 'negotiate',
        label: 'Leave a note demanding more',
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'A note came back: "Fine." Double rate. The fairy is a pushover.', kind: 'money' }, { money: 10 }, { stat: 'happiness', delta: 4 }],
            else: [{ log: 'A note came back: "The fairy does not negotiate." Standard rate. My parents seemed tired.' }, { money: 5 }, { relationship: 'mother', delta: -1 }],
          },
        ],
      },
      {
        id: 'science',
        label: 'Keep it for science',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I kept the tooth in a jar and studied it. It is still in the jar. It is still a tooth.' }],
      },
    ],
  },
  {
    id: 'kd_parents_argue',
    category: 'childhood',
    title: 'Through the wall',
    text: 'Late at night I heard {{mother}} and {{father}} arguing through the wall about money and something about a cousin. In the morning everyone acted normal. I did not feel normal.',
    minAge: 6,
    maxAge: 12,
    weight: 1,
    cooldown: 3,
    conditions: [{ hasPerson: ['mother'] }, { hasPerson: ['father'] }],
    choices: [
      {
        id: 'ask',
        label: 'Ask them about it',
        effects: [{ stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 1 }, { relationship: 'mother', delta: 2 }, { relationship: 'father', delta: 2 }, { log: 'They explained, carefully, that grown-ups argue and it is not my fault. I half believed them.' }],
      },
      {
        id: 'pretend',
        label: 'Pretend I heard nothing',
        effects: [{ stat: 'happiness', delta: -4 }, { log: 'I said nothing and carried it around for weeks like a stone in my shoe.', kind: 'bad' }],
      },
      {
        id: 'music',
        label: 'Turn the music up',
        effects: [{ stat: 'happiness', delta: -1 }, { chance: 0.5, then: [{ log: 'I got told off for the volume, which at least changed the subject.' }, { relationship: 'mother', delta: -1 }], else: [{ log: 'I drowned it out with music. Not a solution, but it got me to sleep.' }] }],
      },
    ],
  },
  {
    id: 'kd_new_sibling',
    category: 'childhood',
    title: 'Big news',
    text: '{{person}} sat me down with a careful face and said I was going to be a big sibling. There was cake, so it seemed to be good news.',
    minAge: 6,
    maxAge: 11,
    weight: 0.5,
    once: true,
    person: { kind: ['mother'], maxAge: 43 },
    choices: [
      {
        id: 'name',
        label: 'Help pick a name',
        effects: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 4 }, { newPerson: { kind: 'sibling', minAge: 0, maxAge: 0, relationship: 60, log: 'My new sibling {{person}} arrived in the spring, loud and tiny. They did not use my name suggestion.' } }],
      },
      {
        id: 'sulk',
        label: 'Sulk about attention',
        effects: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: -2 }, { karma: -1 }, { newPerson: { kind: 'sibling', minAge: 0, maxAge: 0, relationship: 45, log: '{{person}} arrived in the spring anyway. The baby got all the attention, exactly as I had predicted.' } }],
      },
      {
        id: 'puppy',
        label: 'Ask for a puppy instead',
        effects: [{ stat: 'happiness', delta: 1 }, { newPerson: { kind: 'sibling', minAge: 0, maxAge: 0, relationship: 55, log: 'The answer was no. The baby, {{person}}, came anyway. Smaller than a puppy and twice as loud.' } }],
      },
    ],
  },
];

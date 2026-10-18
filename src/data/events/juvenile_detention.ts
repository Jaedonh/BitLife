import type { EventDef } from '@/engine/events/schema';

/**
 * Juvenile detention: a sentence passed before 18 (see src/engine/systems/justice.ts). Every card needs both
 * { inPrison: true } and { juvenile: true }: only cards written for detention open there, and these never
 * open in adult prison. School carries on inside, so classroom cards also check { enrolled: true }.
 *
 * Flags:
 *   jd_write_up (count) trouble noted in my file
 */
const INSIDE = [{ inPrison: true }, { juvenile: true }] as const;

export const JUVENILE_DETENTION_EVENTS: EventDef[] = [
  {
    id: 'jd_first_night',
    category: 'prison',
    title: 'First night inside',
    text: "They took my shoelaces and gave me a gray sweatshirt two sizes too big. My room had a bolted-down bed, a steel sink and a window that didn't open. Lights out came early.",
    minAge: 12,
    maxAge: 17,
    weight: 3,
    once: true,
    conditions: [...INSIDE],
    choices: [
      {
        id: 'cry',
        label: 'Let myself cry',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I cried into a pillow that smelled like bleach. In the morning I felt a little lighter.', kind: 'info' }],
      },
      {
        id: 'tough',
        label: "Act like I don't care",
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'Nobody bothered me at breakfast. Acting tough worked, for now.', kind: 'info' }],
            else: [
              { stat: 'happiness', delta: -3 },
              { newPerson: { kind: 'enemy', relationship: 15, minAge: 13, maxAge: 17, log: '{{person}} from across the hall laughed at my act. Day one, and I already had a rival.' } },
            ],
          },
        ],
      },
      {
        id: 'write',
        label: 'Write a letter home',
        effects: [
          { stat: 'happiness', delta: 1 },
          { relationship: 'mother', delta: 3 },
          { relationship: 'father', delta: 3 },
          { log: 'I wrote a letter home on lined paper. I said I was fine. I underlined it twice.', kind: 'info' },
        ],
      },
    ],
  },
  {
    id: 'jd_classroom',
    category: 'prison',
    title: 'School, but smaller',
    text: 'School in detention is one classroom with twelve kids of every grade and a teacher, Mr. Okafor, who refuses to give up on any of us. Today he asked me to read aloud.',
    minAge: 12,
    maxAge: 17,
    weight: 2,
    cooldown: 1,
    conditions: [...INSIDE, { enrolled: true }],
    choices: [
      {
        id: 'read',
        label: 'Read it properly',
        effects: [{ grade: 6 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 1 }, { log: "I read the whole page without stumbling. Mr. Okafor nodded like I'd won something.", kind: 'good' }],
      },
      {
        id: 'mumble',
        label: 'Mumble through it',
        effects: [{ grade: 1 }, { log: 'I mumbled through it. Nobody laughed, which in here counts as kindness.', kind: 'info' }],
      },
      {
        id: 'refuse',
        label: 'Refuse',
        effects: [{ grade: -5 }, { stat: 'happiness', delta: 2 }, { karma: -1 }, { log: 'I said no. Mr. Okafor said okay, and asked again the next day. And the next.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'jd_counselor',
    category: 'prison',
    title: 'The counselor',
    text: "A counselor with a lanyard full of keys asked me why I did it. She said \"because\" wasn't an answer, and that she had all afternoon.",
    minAge: 12,
    maxAge: 17,
    weight: 1.5,
    cooldown: 2,
    conditions: [...INSIDE],
    choices: [
      {
        id: 'truth',
        label: 'Tell her the truth',
        effects: [{ stat: 'happiness', delta: 5 }, { karma: 2 }, { log: 'I told her the truth. It took an hour and most of a box of tissues. I slept well that night.', kind: 'good' }],
      },
      {
        id: 'short',
        label: 'Give the short version',
        effects: [{ stat: 'happiness', delta: 1 }, { log: "I gave her the short version. She wrote something down and said we'd keep going next week.", kind: 'info' }],
      },
      {
        id: 'stare',
        label: 'Stare at the wall',
        effects: [{ stat: 'happiness', delta: -2 }, { log: "I stared at the wall until she gave up. The wall won. I'm not sure I did.", kind: 'bad' }],
      },
    ],
  },
  {
    id: 'jd_visiting_day',
    category: 'prison',
    title: 'Visiting day',
    text: "{{person}} came on visiting day and sat across a plastic table from me. {{They}} brought a sandwich I wasn't allowed to keep and a look I won't forget.",
    minAge: 12,
    maxAge: 17,
    weight: 2,
    cooldown: 1,
    conditions: [...INSIDE],
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather'] },
    choices: [
      {
        id: 'sorry',
        label: "Say I'm sorry",
        effects: [{ relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 4 }, { log: '{{person}} held my hand across the table until the guard called time.', kind: 'good' }],
      },
      {
        id: 'fine',
        label: "Pretend I'm fine",
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: -1 }, { log: 'I told {{person}} the food was great and everyone was nice. Neither of us believed it.', kind: 'info' }],
      },
      {
        id: 'blame',
        label: 'Blame {{them}}',
        effects: [
          { relationship: 'person', delta: -8 },
          { stat: 'happiness', delta: -3 },
          { karma: -1 },
          { log: 'I said it was {{their}} fault I ended up here. {{person}} left early. I wanted to take it back.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'jd_mail_call',
    category: 'prison',
    title: 'Mail call',
    text: '{{person}} wrote me a letter. Two pages, terrible handwriting, mostly about nothing at all. I read it eleven times before lights out.',
    minAge: 12,
    maxAge: 17,
    weight: 1.5,
    cooldown: 2,
    conditions: [...INSIDE],
    // Someone old enough to write two pages, not a toddler sibling.
    person: { kind: ['friend', 'bestFriend', 'sibling'], minAge: 8 },
    choices: [
      {
        id: 'reply',
        label: 'Write back right away',
        effects: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 3 }, { log: 'I wrote back four pages about nothing. {{person}} said it was the best letter {{they}} ever got.', kind: 'good' }],
      },
      {
        id: 'keep',
        label: 'Keep it under my pillow',
        effects: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: 2 }, { log: 'I kept the letter under my pillow and never answered. I meant to. Every night.', kind: 'info' }],
      },
      {
        id: 'stop',
        label: 'Tell {{them}} not to write',
        effects: [{ relationship: 'person', delta: -10 }, { stat: 'happiness', delta: -2 }, { log: "I sent one line: don't write here. I didn't want anyone I knew to see this place, even on paper.", kind: 'bad' }],
      },
    ],
  },
  {
    id: 'jd_rec_time',
    category: 'prison',
    title: 'Rec time',
    text: 'Rec time is forty minutes in a fenced yard with one basketball and a lot of opinions. The older kids run the court and decide who plays.',
    minAge: 12,
    maxAge: 17,
    weight: 1.5,
    cooldown: 2,
    conditions: [...INSIDE],
    choices: [
      {
        id: 'ask',
        label: 'Ask to play',
        effects: [
          {
            chance: 0.55,
            then: [
              { stat: 'health', delta: 2 },
              { newPerson: { kind: 'friend', relationship: 50, minAge: 13, maxAge: 17, log: "They let me in. I missed every shot, but {{person}} kept passing to me anyway. We're friends now." } },
            ],
            else: [{ injury: 2 }, { stat: 'happiness', delta: -3 }, { log: 'They said no, then made sure I understood why. I watched from the bench with a sore shoulder.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'shoot',
        label: 'Shoot alone in the corner',
        effects: [{ stat: 'health', delta: 3 }, { stat: 'happiness', delta: 1 }, { log: 'I shot free throws at the far hoop until the whistle. Forty minutes of nobody needing me.', kind: 'info' }],
      },
      {
        id: 'read',
        label: 'Stay inside and read',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I read a paperback with the cover torn off. It was about a shipwreck. It helped.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'jd_sugar',
    category: 'prison',
    title: 'Sugar is currency',
    text: "Somebody slid a candy bar under my door with a note that said \"You owe me.\" In here, anything with sugar in it is worth more than money.",
    minAge: 12,
    maxAge: 17,
    weight: 1,
    cooldown: 3,
    conditions: [...INSIDE],
    choices: [
      {
        id: 'eat',
        label: 'Eat it',
        effects: [
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.5,
            then: [{ log: 'I ate it in three bites. A week later I paid it back with my dessert, plus interest.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'I ate it. Then the note writer wanted favors, not candy. I said no. It got tense.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'return',
        label: 'Slide it back',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: -1 }, { log: "I slid it back under the door. Someone laughed in the hallway. I'd rather owe nobody.", kind: 'info' }],
      },
      {
        id: 'staff',
        label: 'Hand it to staff',
        effects: [
          { karma: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'I handed it in. Staff wrote "cooperative" in my file. I felt oddly proud.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I handed it to staff, who ate it in front of me. Lesson learned, just not theirs.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'jd_hallway',
    category: 'prison',
    title: 'Hallway trouble',
    text: "A kid twice my size shoulder-checked me in the hallway and stood there, waiting to see what I'd do. The staff member on duty was busy with a clipboard.",
    minAge: 12,
    maxAge: 17,
    weight: 1.5,
    cooldown: 2,
    conditions: [...INSIDE],
    choices: [
      {
        id: 'shove',
        label: 'Shove back',
        effects: [
          { karma: -2 },
          { flag: 'jd_write_up', inc: 1 },
          {
            chance: 0.5,
            then: [{ injury: 2 }, { stat: 'happiness', delta: 3 }, { log: 'I shoved back. We both lost rec time for a week, and nobody tried it again.', kind: 'info' }],
            else: [{ injury: 6 }, { stat: 'happiness', delta: -5 }, { log: 'He was faster than he looked. I spent the night in the nurse\'s office with an ice pack.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'walk',
        label: 'Walk past',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: -1 }, { log: 'I walked past. Boring, but my file stayed clean.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'I walked past. He decided I was easy, and made the next month a long one.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'staff',
        label: 'Get the staff member',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'The staff member put down the clipboard and handled it. Fair, for once.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: "Staff gave us both a warning. Now I'm the kid who tells. That's worse than losing.", kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'jd_paint_night',
    category: 'prison',
    title: 'Paint night',
    text: "A volunteer brought in paint and paper and said we could make anything we wanted, as long as it wasn't a weapon or a portrait of the staff.",
    minAge: 12,
    maxAge: 17,
    weight: 1,
    cooldown: 3,
    conditions: [...INSIDE],
    choices: [
      {
        id: 'honest',
        label: 'Paint something honest',
        effects: [{ stat: 'happiness', delta: 5 }, { karma: 1 }, { log: 'I painted my street from memory, every crack in the sidewalk. The volunteer asked to hang it up.', kind: 'good' }],
      },
      {
        id: 'staff',
        label: 'Paint the staff anyway',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 6 }, { log: 'I painted the night supervisor as a potato. Even he laughed, eventually.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { flag: 'jd_write_up', inc: 1 }, { log: 'I painted the night supervisor as a potato. He did not laugh. No paint night for a month.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'nap',
        label: 'Skip it and nap',
        effects: [{ stat: 'health', delta: 1 }, { log: 'I skipped paint night and slept. Afterward everyone said it was the best night all month.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'jd_birthday',
    category: 'prison',
    title: 'Birthday inside',
    text: "I turned {{age}} in detention. The kitchen sent a cupcake with one candle I wasn't allowed to light. A few kids sang, badly, on purpose.",
    minAge: 12,
    maxAge: 17,
    weight: 1,
    once: true,
    conditions: [...INSIDE],
    choices: [
      {
        id: 'wish',
        label: 'Make a wish anyway',
        effects: [{ stat: 'happiness', delta: 3 }, { log: "I blew out a candle that wasn't lit and made a wish. I'm not telling anyone what it was.", kind: 'good' }],
      },
      {
        id: 'share',
        label: 'Split the cupcake',
        effects: [{ stat: 'happiness', delta: 2 }, { karma: 2 }, { log: 'I split the cupcake six ways. Mostly crumbs, but the best party I had been to in ages.', kind: 'good' }],
      },
      {
        id: 'normal',
        label: "Pretend it's a normal day",
        effects: [{ stat: 'happiness', delta: -2 }, { log: 'I told everyone it was just a normal Tuesday. It was a Thursday. Nobody corrected me.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'jd_progress_report',
    category: 'prison',
    title: 'Progress report',
    text: 'Every few months my caseworker reads the judge a report about me. This time she let me read the draft first and asked if I wanted to add anything.',
    minAge: 12,
    maxAge: 17,
    weight: 1,
    cooldown: 2,
    conditions: [...INSIDE],
    choices: [
      {
        id: 'add',
        label: "Add what I've learned",
        effects: [{ stat: 'happiness', delta: 3 }, { karma: 1 }, { log: "I added a paragraph about what I'd learned. She kept it word for word. I felt heard.", kind: 'good' }],
      },
      {
        id: 'fine',
        label: "Say it's fine as is",
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I said it was fine. It was mostly fine. Some of it was even nice.', kind: 'info' }],
      },
      {
        id: 'argue',
        label: 'Argue with every line',
        effects: [{ stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 1 }, { log: 'I argued with every line. She changed one word, "defiant" to "spirited." I took it.', kind: 'info' }],
      },
    ],
  },
];

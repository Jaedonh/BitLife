import { TEEN_DRIVERS } from '@/data/events/teen_life';
import type { EventDef } from '@/engine/events/schema';

/**
 * Ages 13-17: cliques, exams, crushes, parties, peer pressure, part-time
 * jobs, driving, prom, applications, curfews and siblings. Friends, parents,
 * siblings and partners are bound through person selectors so the events
 * read as personal. Follow-ups (party police, driving test, after prom) are
 * queued by their parent event and never fire on their own.
 */
export const TEEN_YEARS_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ school life
  {
    id: 'tn_cafeteria_tribes',
    category: 'school',
    title: 'Cafeteria tribes',
    text: 'First week of high school. The cafeteria has sorted itself into tribes: the athletes, the honor-roll table, the theater kids. Everyone seems to know where they belong except me.',
    minAge: 14,
    maxAge: 15,
    weight: 3,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['high'] }],
    choices: [
      {
        id: 'athletes',
        label: 'Sit with the athletes',
        effects: [
          { stat: 'health', delta: 3 },
          { stat: 'looks', delta: 2 },
          { stat: 'smarts', delta: -1 },
          { flag: 'tn_clique', set: 'athletes' },
          { log: 'I sat with the athletes. A lot of protein talk, but they dragged me to morning runs and it showed.', kind: 'good' },
        ],
      },
      {
        id: 'honor',
        label: 'Sit with the honor roll',
        effects: [
          { stat: 'smarts', delta: 3 },
          { grade: 4 },
          { stat: 'happiness', delta: -1 },
          { flag: 'tn_clique', set: 'honor' },
          { log: 'The honor-roll table argued about one math problem for the whole lunch. Somehow I enjoyed it.', kind: 'good' },
        ],
      },
      {
        id: 'theater',
        label: 'Sit with the theater kids',
        effects: [
          { stat: 'happiness', delta: 4 },
          { stat: 'looks', delta: 1 },
          { grade: -2 },
          { flag: 'tn_clique', set: 'theater' },
          { log: 'The theater kids adopted me on the spot. Lunch is now a daily performance. My homework is not.', kind: 'good' },
        ],
      },
      {
        id: 'alone',
        label: 'Eat alone',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: -3 }, { log: 'I ate alone with a book. Peaceful, mostly. A little lonely.' }],
      },
    ],
  },
  {
    id: 'tn_pop_quiz',
    category: 'school',
    // The written pop quiz (sl_pop_quiz is the other did-not-do-the-reading scene), and never within two years of it.
    title: 'Five questions',
    text: 'Ten minutes into class, the teacher handed out half a sheet of paper with five questions on it and announced, cheerfully, that it counts. I did not do the reading. The kid beside me is already writing.',
    minAge: 13,
    maxAge: 17,
    weight: 2,
    cooldown: 3,
    conditions: [{ enrolled: true }, { not: { sinceEvent: 'sl_pop_quiz', lte: 2 } }],
    choices: [
      {
        id: 'wing',
        label: 'Guess my way through',
        effects: [
          {
            chance: 0.5,
            then: [{ grade: 3 }, { stat: 'smarts', delta: 1 }, { log: 'I guessed all five with total confidence and got three right. Pure instinct.', kind: 'good' }],
            else: [{ grade: -3 }, { log: 'My guesses were confident, creative and mostly wrong.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'copy',
        label: 'Copy off my neighbor',
        effects: [
          { karma: -3 },
          {
            chance: 0.3,
            then: [{ grade: -8 }, { relationship: 'mother', delta: -3 }, { relationship: 'father', delta: -3 }, { log: 'The teacher had been standing right behind me. Zero, and a call home.', kind: 'bad' }],
            else: [{ grade: 4 }, { log: 'I copied carefully and got away with it. It did not feel like winning.' }],
          },
        ],
      },
      {
        id: 'honest',
        label: 'Admit I did not read',
        effects: [{ karma: 2 }, { grade: -2 }, { stat: 'happiness', delta: -1 }, { log: 'I wrote "did not do the reading" on top. The teacher gave me a makeup assignment and a long look.' }],
      },
    ],
  },
  {
    id: 'tn_finals_week',
    category: 'school',
    title: 'Finals week',
    text: 'Final exams start Monday. My notes are a mess, my friends want to go out, and the weather is suddenly, suspiciously perfect.',
    minAge: 13,
    maxAge: 17,
    weight: 2,
    cooldown: 3,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'cram',
        label: 'Cram all night',
        effects: [{ grade: 8 }, { stat: 'smarts', delta: 2 }, { stat: 'health', delta: -3 }, { stat: 'happiness', delta: -2 }, { log: 'I studied until the birds started singing. The exams went well. My face did not.', kind: 'good' }],
      },
      {
        id: 'group',
        label: 'Study with friends',
        effects: [{ grade: 4 }, { relationship: 'friend', delta: 3 }, { stat: 'happiness', delta: 2 }, { log: 'We studied as a group. Half of it was studying. The other half was snacks.', kind: 'good' }],
      },
      {
        id: 'out',
        label: 'Go out anyway',
        effects: [
          { stat: 'happiness', delta: 6 },
          { grade: -7 },
          {
            chance: 0.25,
            then: [{ relationship: 'mother', delta: -4 }, { relationship: 'father', delta: -4 }, { log: 'My grades slipped and {{parents}} noticed. The weekend was worth it. Probably.', kind: 'bad' }],
            else: [{ log: 'I had a great weekend and scraped through the exams. Living on the edge.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tn_teacher_believes',
    category: 'school',
    title: 'Someone believes',
    text: 'After class, my teacher asked me to stay behind. Not for trouble. "You have a real knack for this," she said, and offered to coach me on Tuesdays for a regional competition.',
    minAge: 14,
    maxAge: 17,
    weight: 1.5,
    once: true,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'yes',
        label: 'Say yes',
        effects: [
          { stat: 'smarts', delta: 5 },
          { grade: 5 },
          { stat: 'happiness', delta: -1 },
          { flag: 'tn_mentor', set: true },
          { log: 'I said yes. Goodbye, free Tuesdays. For the first time, somebody expects something of me.', kind: 'milestone' },
        ],
      },
      {
        id: 'no',
        label: 'Politely decline',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I said no. More free afternoons, and a small nagging feeling that I had closed a door.' }],
      },
      {
        id: 'ask',
        label: 'Ask what it involves',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'smarts', delta: 3 }, { grade: 3 }, { flag: 'tn_mentor', set: true }, { log: 'It meant Tuesdays and some Saturdays too. I gave them up. She is the best teacher I have ever had.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'It meant giving up Saturdays too. I said I would think about it. I did not think about it.' }],
          },
        ],
      },
    ],
  },
  // ------------------------------------------------------------ romance
  {
    id: 'tn_first_crush',
    category: 'school',
    title: 'First crush',
    text: 'There is someone in my class I cannot stop looking at. I told {{person}} about it, which was a mistake, because now {{they}} will not stop grinning at me.',
    minAge: 13,
    maxAge: 15,
    weight: 2,
    once: true,
    conditions: [{ enrolled: true }],
    person: { kind: ['friend', 'bestFriend'], minRelationship: 30 },
    choices: [
      {
        id: 'note',
        label: 'Have {{them}} pass a note',
        effects: [
          { relationship: 'person', delta: 2 },
          {
            chance: 0.45,
            then: [{ stat: 'happiness', delta: 8 }, { stat: 'looks', delta: 1 }, { log: 'The note came back with a smiley face and a phone number. I floated home.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'The note was read aloud at the back of the bus. I have never known shame like it.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'secret',
        label: 'Swear {{them}} to secrecy',
        effects: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: -1 }, { stat: 'smarts', delta: 1 }, { log: '{{person}} swore on {{their}} dog. The crush stayed a secret and I wrote a lot of bad poems.' }],
      },
      {
        id: 'direct',
        label: 'Just go say hi',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 6 }, { log: 'I said hi. They said hi. We said hi for about a week before it became a conversation.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I said hi, forgot every word in the language, and walked into a door. We never spoke of it.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tn_first_kiss',
    category: 'school',
    title: 'First kiss',
    text: 'The end-of-year dance. The lights went low, a slow song came on, and the person I had been dancing with all night leaned in a little closer.',
    minAge: 14,
    maxAge: 17,
    weight: 1.5,
    once: true,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'kiss',
        label: 'Lean in',
        effects: [{ stat: 'happiness', delta: 10 }, { stat: 'looks', delta: 1 }, { log: 'My first kiss, under a disco ball, to a song I will never again hear without blushing.', kind: 'milestone' }],
      },
      {
        id: 'cheek',
        label: 'Offer a cheek',
        effects: [{ stat: 'happiness', delta: 2 }, { karma: 1 }, { log: 'I turned my head at the last second. A cheek kiss. Sweet, awkward, and entirely my choice.' }],
      },
      {
        id: 'bolt',
        label: 'Panic and get punch',
        effects: [{ stat: 'happiness', delta: -3 }, { stat: 'smarts', delta: 1 }, { log: 'I yelled "Punch?" and fled to the snacks. I learned something about myself. Not what, exactly.', kind: 'bad' }],
      },
    ],
  },
  // ------------------------------------------------------------ parties and pressure
  {
    id: 'tn_house_party',
    category: 'school',
    title: 'House party',
    text: 'Someone whose parents are away is throwing a party. The music is loud, the lights are off, and a stranger is pushing a red cup into my hand.',
    minAge: 15,
    maxAge: 17,
    weight: 2,
    cooldown: 2,
    choices: [
      {
        id: 'drink',
        label: 'Take the cup',
        effects: [
          { addiction: 'alcohol', delta: 3 },
          {
            random: [
              { weight: 55, effects: [{ stat: 'happiness', delta: 5 }, { stat: 'health', delta: -2 }, { log: 'I drank, danced badly, and told everyone they were my best friend. My head disagreed in the morning.' }] },
              { weight: 25, effects: [{ stat: 'health', delta: -4 }, { stat: 'happiness', delta: -3 }, { stat: 'looks', delta: -1 }, { log: 'Two cups in, I threw up in a stranger\'s flower bed. Half my grade was watching. Of course they were.', kind: 'bad' }] },
              { weight: 20, effects: [{ stat: 'happiness', delta: 3 }, { log: 'The party was great right up until it was not.' }, { queue: 'tn_party_police' }] },
            ],
          },
        ],
      },
      {
        id: 'soda',
        label: 'Stick to soda',
        effects: [
          { karma: 1 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'Someone called me boring. I was the only one who remembered the night, so who is boring?' }],
            else: [{ log: 'I stuck to soda and had a great time anyway. I walked three people home and became very popular.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'leave',
        label: 'Leave early',
        effects: [{ stat: 'happiness', delta: -2 }, { stat: 'health', delta: 1 }, { relationship: 'mother', delta: 2 }, { relationship: 'father', delta: 2 }, { log: 'I left before it got messy. {{parents}} seemed weirdly proud. My friends told me everything on Monday.' }],
      },
    ],
  },
  {
    id: 'tn_party_police',
    category: 'school',
    title: 'Flashing lights',
    text: 'Red and blue lights swept across the curtains. Someone shouted "Police!" and forty teenagers, me included, tried to use one back door at the same time.',
    minAge: 15,
    maxAge: 17,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'back',
        label: 'Slip out the back',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I hopped two fences and walked home whistling. Nobody will ever know.', kind: 'good' }],
            else: [{ relationship: 'mother', delta: -8 }, { relationship: 'father', delta: -8 }, { stat: 'happiness', delta: -5 }, { log: 'A very tired officer drove me home. {{parents}} met me in the doorway. In a bathrobe.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'stay',
        label: 'Stay and cooperate',
        effects: [{ karma: 1 }, { relationship: 'mother', delta: -4 }, { relationship: 'father', delta: -4 }, { stat: 'happiness', delta: -3 }, { log: 'I gave my name and number. Grounded for a month, but the officer wrote "polite" on her form.' }],
      },
      {
        id: 'hide',
        label: 'Hide in a closet',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'I spent forty minutes in a closet behind a stranger\'s vacuum cleaner. Nobody checked. I emerged a hero.' }],
            else: [{ relationship: 'mother', delta: -6 }, { relationship: 'father', delta: -6 }, { stat: 'happiness', delta: -4 }, { log: 'The closet was the first place they checked. My name went on a list.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tn_shoplift_dare',
    category: 'school',
    title: 'The dare',
    text: 'At the corner store, {{person}} nudged me toward the candy aisle and whispered, "Nobody is watching. Just pocket one. Everyone does it."',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'steal',
        label: 'Pocket it',
        effects: [
          { karma: -4 },
          { counter: 'crimes' },
          {
            chance: 0.35,
            then: [
              { stat: 'happiness', delta: -6 },
              { relationship: 'mother', delta: -6 },
              { relationship: 'father', delta: -6 },
              {
                chance: 0.3,
                then: [{ arrest: true }, { log: 'The owner called the police. A warning, a record, and a very quiet car ride home.', kind: 'bad' }],
                else: [{ log: 'The owner caught my wrist at the door. Banned from the store, and he phoned {{parents}}.', kind: 'bad' }],
              },
            ],
            else: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 3 }, { log: 'A stolen chocolate bar tastes exactly like a chocolate bar. {{person}} was impressed. I was not.' }],
          },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse',
        effects: [{ karma: 2 }, { relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -1 }, { log: '{{person}} called me a coward. I paid for my candy like a coward and slept fine like a coward.' }],
      },
      {
        id: 'distract',
        label: 'Suggest something else',
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 1 }, { log: 'I suggested we go skip rocks at the river instead. {{person}} shrugged. The rocks were great.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'tn_vape_offer',
    category: 'school',
    title: 'Fake mango',
    text: 'Behind the gym, some older kids were passing a vape around. It reached me. A small cloud of fake mango hung in the air, waiting for my decision.',
    minAge: 14,
    maxAge: 17,
    weight: 2,
    cooldown: 2,
    conditions: [{ enrolled: true }, { year: { gte: 2013 } }],
    choices: [
      {
        id: 'try',
        label: 'Try it',
        effects: [
          { stat: 'health', delta: -3 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.25,
            then: [{ grade: -3 }, { relationship: 'mother', delta: -3 }, { relationship: 'father', delta: -3 }, { log: 'A teacher rounded the corner mid-puff. Detention, a phone call home, and a lecture with slides.', kind: 'bad' }],
            else: [{ log: 'I coughed for a solid minute. Everyone laughed. I pretended to like it. I did not like it.' }],
          },
        ],
      },
      {
        id: 'pass',
        label: 'Pass it along',
        effects: [
          { karma: 1 },
          { stat: 'health', delta: 1 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'Someone muttered "boring." I was fine with boring. Boring has working lungs.' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'I passed it along. Nobody cared. Peer pressure, it turns out, is mostly in your head.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'report',
        label: 'Tell a teacher',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: -4 }, { relationship: 'friend', delta: -3 }, { log: 'I told a teacher. The older kids found out who. The hallways got colder for a while.', kind: 'bad' }],
      },
    ],
  },
  // ------------------------------------------------------------ work
  {
    id: 'tn_shift_vs_test',
    category: 'school',
    title: 'Shift or study',
    text: 'My manager at {{company}} scheduled me for a late shift the night before a big test. "Everyone else is busy," she said, which is what she says every time.',
    minAge: 15,
    maxAge: 17,
    weight: 2,
    cooldown: 2,
    // Students with a part-time job. The reachability sampler never holds a job while enrolled, so part-time also qualifies.
    conditions: [{ hasJob: true }, { any: [{ enrolled: true }, { partTime: true }] }],
    choices: [
      {
        id: 'work',
        label: 'Work the shift',
        effects: [{ money: 120 }, { jobPerformance: 5 }, { grade: -4 }, { stat: 'health', delta: -1 }, { log: 'I worked until midnight and took the test on four hours of sleep. The {{$120}} helped. My grade did not.', kind: 'money' }],
      },
      {
        id: 'sick',
        label: 'Call in sick',
        effects: [
          { grade: 3 },
          {
            chance: 0.4,
            then: [{ jobPerformance: -12 }, { stat: 'happiness', delta: -3 }, { log: 'My manager saw me at the library. "Feeling better?" she asked. I am now on very thin ice at work.', kind: 'bad' }],
            else: [{ log: 'I "recovered" just in time for the test and nobody asked any questions.' }],
          },
        ],
      },
      {
        id: 'swap',
        label: 'Ask to swap shifts',
        effects: [
          {
            chance: 0.6,
            then: [{ grade: 2 }, { relationship: 'coworker', delta: 3 }, { stat: 'happiness', delta: 2 }, { log: 'A coworker took the shift. I owe them one, and I passed the test.', kind: 'good' }],
            else: [{ jobPerformance: -4 }, { grade: -2 }, { stat: 'happiness', delta: -2 }, { log: 'Nobody could swap. I worked the shift, bombed the test, and got written up for asking.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tn_odd_job',
    category: 'school',
    title: 'Odd job offer',
    text: 'A neighbor knocked and asked whether I would clear her yard of leaves, weeds and one very angry bush. She mentioned cash. I mentioned I was free on Saturday.',
    minAge: 13,
    maxAge: 17,
    weight: 2,
    cooldown: 3,
    choices: [
      {
        id: 'take',
        label: 'Take the job',
        effects: [
          {
            random: [
              { weight: 70, effects: [{ money: 80 }, { stat: 'health', delta: 1 }, { stat: 'happiness', delta: 2 }, { log: 'Six hours of raking, {{$80}} in cash, and a blister shaped like a map of nowhere.', kind: 'money' }] },
              { weight: 30, effects: [{ money: 80 }, { injury: 2 }, { log: 'The angry bush won. I got paid {{$80}} and a rash that lasted a week.', kind: 'money' }] },
            ],
          },
        ],
      },
      {
        id: 'haggle',
        label: 'Ask for more',
        effects: [
          {
            chance: 0.5,
            then: [{ money: 150 }, { stat: 'smarts', delta: 1 }, { log: 'She laughed, then paid {{$150}}. "Negotiator," she said. I have a new favorite word.', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'She said her nephew would do it for free. The nephew did a terrible job, which was some comfort.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Keep my Saturday',
        effects: [{ stat: 'happiness', delta: 3 }, { log: 'I spent Saturday doing nothing at all. Nothing at all is underrated.' }],
      },
    ],
  },
  // ------------------------------------------------------------ driving
  {
    id: 'tn_learning_to_drive',
    category: 'school',
    title: 'Learning to drive',
    text: '{{person}} tossed me the car keys in an empty parking lot. "Ten and two. Eyes up. Breathe," {{they}} said, gripping the door handle in a way that did not inspire confidence.',
    minAge: 16,
    maxAge: 17,
    weight: 2,
    once: true,
    // Behind the wheel at 16 with a parent beside me: where teens learn that young (the driving test follows).
    conditions: [TEEN_DRIVERS],
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather'] },
    choices: [
      {
        id: 'careful',
        label: 'Take it slow',
        effects: [
          { stat: 'smarts', delta: 2 },
          { relationship: 'person', delta: 4 },
          { stat: 'happiness', delta: 2 },
          { log: 'I crawled around the lot at walking pace. {{person}} said I was a natural. A kind lie.' },
          { queue: 'tn_driving_test' },
        ],
      },
      {
        id: 'showoff',
        label: 'Show off a little',
        effects: [
          {
            random: [
              { weight: 65, effects: [{ stat: 'happiness', delta: 6 }, { relationship: 'person', delta: -2 }, { log: 'I spun a perfect donut. {{person}} screamed, then laughed, then made me promise never again.', kind: 'good' }, { queue: 'tn_driving_test' }] },
              { weight: 35, effects: [{ injury: 3 }, { relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -4 }, { log: 'I clipped a light pole. Casualties: one knee, one bumper and {{their}} faith in me. Lessons are off.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'refuse',
        label: 'Hand the keys back',
        effects: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: 1 }, { log: 'I decided today was not the day. {{person}} drove us home and did not mention it. Much.' }],
      },
    ],
  },
  {
    id: 'tn_driving_test',
    category: 'school',
    title: 'The driving test',
    text: 'Months of practice later, test day. The examiner had a clipboard and no visible emotions. {{person}} waved from the parking lot like I was going off to war.',
    minAge: 16,
    maxAge: 17,
    weight: 1,
    followUpOnly: true,
    conditions: [TEEN_DRIVERS],
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather'] },
    choices: [
      {
        id: 'steady',
        label: 'Drive like I practiced',
        effects: [
          {
            chance: 0.6,
            then: [{ flag: 'tn_license', set: true }, { stat: 'happiness', delta: 8 }, { relationship: 'person', delta: 3 }, { log: 'I passed! The examiner said "adequate," which from him was a standing ovation.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'Failed on parallel parking. The examiner wrote something long and underlined it twice.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'confident',
        label: 'Drive with flair',
        effects: [
          {
            chance: 0.45,
            then: [{ flag: 'tn_license', set: true }, { stat: 'happiness', delta: 10 }, { stat: 'looks', delta: 1 }, { log: 'I passed on the first try, with flair. The examiner did not enjoy the flair. The license is mine.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: -6 }, { relationship: 'person', delta: -2 }, { log: 'I checked my hair more than my mirrors. Failed. {{person}} said nothing in the car, which was worse.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'postpone',
        label: 'Ask to postpone',
        effects: [{ stat: 'happiness', delta: -1 }, { stat: 'smarts', delta: 1 }, { log: 'I lost my nerve and rescheduled. {{person}} bought me a milkshake anyway.' }],
      },
    ],
  },
  // ------------------------------------------------------------ social media
  {
    id: 'tn_viral_fall',
    category: 'school',
    title: 'Gone viral',
    text: 'Someone filmed me slipping on the wet cafeteria floor, tray and all. By lunch it had a soundtrack. By dinner, half the school had seen it.',
    minAge: 13,
    maxAge: 17,
    weight: 2,
    // The same cafeteria slip twice is a rerun; and not right after another fifteen minutes of fame
    // (friends_and_strangers' fs_viral_moment, which guards back).
    once: true,
    conditions: [{ enrolled: true }, { year: { gte: 2010 } }, { not: { sinceEvent: 'fs_viral_moment', lte: 2 } }],
    choices: [
      {
        id: 'laugh',
        label: 'Laugh along',
        effects: [{ stat: 'happiness', delta: 3 }, { fame: 1 }, { stat: 'looks', delta: 1 }, { log: 'I reposted it myself with a better caption. Owning the joke took the sting out of it.', kind: 'good' }],
      },
      {
        id: 'hide',
        label: 'Delete everything and hide',
        effects: [{ stat: 'happiness', delta: -5 }, { log: 'I deleted my accounts and ate lunch in the library for a month. The video outlived my shame.', kind: 'bad' }],
      },
      {
        id: 'sequel',
        label: 'Make a better video',
        effects: [
          {
            random: [
              { weight: 40, effects: [{ fame: 3 }, { stat: 'happiness', delta: 7 }, { log: 'My sequel got more views than the original. I am, briefly, a somebody.', kind: 'good' }] },
              { weight: 60, effects: [{ stat: 'happiness', delta: -3 }, { log: 'My sequel got eleven views. Nine of them were me.', kind: 'bad' }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'tn_screenshot_leak',
    category: 'school',
    title: 'The screenshot',
    text: 'A screenshot of something I wrote about {{person}} in a private chat has found its way to {{them}}. It was a joke. It does not read as a joke.',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ year: { gte: 2010 } }],
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'apologize',
        label: 'Apologize properly',
        effects: [{ karma: 2 }, { relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -2 }, { log: 'I apologized in person, no excuses. {{person}} was hurt but thanked me for not lying. We will be okay.' }],
      },
      {
        id: 'deny',
        label: 'Claim it was faked',
        effects: [
          { karma: -3 },
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: -2 }, { log: 'Somehow {{they}} bought it. I felt worse than if {{they}} had not.' }],
            else: [{ relationship: 'person', delta: -12 }, { stat: 'happiness', delta: -4 }, { log: '{{person}} had the original. Now I am a liar as well as a gossip.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'own',
        label: 'Say I meant it',
        effects: [{ relationship: 'person', delta: -12 }, { stat: 'happiness', delta: 2 }, { karma: -2 }, { log: 'I doubled down. {{person}} stopped sitting with me. Honest, it turns out, is not the same as kind.', kind: 'bad' }],
      },
    ],
  },
  // ------------------------------------------------------------ prom
  {
    id: 'tn_prom',
    category: 'school',
    title: 'Prom night',
    text: 'Prom is in three weeks. There are posters everywhere, everyone is planning outfits, and {{person}} keeps asking what my plan is. I do not have a plan.',
    minAge: 16,
    maxAge: 17,
    weight: 2,
    once: true,
    // A prom is a North American and British school tradition.
    conditions: [{ enrolled: true }, { stage: ['high'] }, { country: ['US', 'CA', 'GB'] }],
    person: { kind: ['friend', 'bestFriend'], minRelationship: 30 },
    choices: [
      {
        id: 'date',
        label: 'Go with my date',
        conditions: [{ hasLover: true }],
        effects: [
          {
            random: [
              { weight: 70, effects: [{ stat: 'happiness', delta: 10 }, { relationship: 'lover', delta: 6 }, { stat: 'looks', delta: 2 }, { log: 'Prom with my date. Terrible DJ, great photos, and a slow dance I will remember when I am ninety.', kind: 'milestone' }] },
              { weight: 30, effects: [{ stat: 'happiness', delta: -4 }, { relationship: 'lover', delta: -5 }, { log: 'We argued in the car on the way there and sulked through every slow song. Great photos, though.', kind: 'bad' }] },
            ],
          },
          { queue: 'tn_after_prom' },
        ],
      },
      {
        id: 'friends',
        label: 'Go with {{person}} and friends',
        effects: [{ stat: 'happiness', delta: 7 }, { relationship: 'person', delta: 6 }, { stat: 'looks', delta: 1 }, { log: 'We went as a pack. No pressure, just bad dancing and a suspicious buffet split five ways.', kind: 'good' }, { queue: 'tn_after_prom' }],
      },
      {
        id: 'skip',
        label: 'Skip it',
        effects: [{ stat: 'happiness', delta: -3 }, { stat: 'smarts', delta: 2 }, { log: 'I skipped prom and watched movies at home. I regret it exactly as much as I expected: a little.' }],
      },
    ],
  },
  {
    id: 'tn_after_prom',
    category: 'school',
    title: 'After prom',
    text: 'After prom, someone with a car suggested driving out to the lake. The driver had been sipping from a flask all night and swore he was fine. Everyone piled in and waited for me.',
    minAge: 16,
    maxAge: 17,
    weight: 1,
    followUpOnly: true,
    choices: [
      {
        id: 'ride',
        label: 'Get in the car',
        effects: [
          { karma: -2 },
          {
            chance: 0.05,
            then: [{ death: 'a car crash on prom night' }],
            else: [
              {
                random: [
                  { weight: 80, effects: [{ stat: 'happiness', delta: 6 }, { log: 'We made it to the lake and watched the sun come up. Stupid, lucky, and unforgettable.' }] },
                  { weight: 15, effects: [{ injury: 8 }, { stat: 'happiness', delta: -8 }, { log: 'He took a corner too fast and put us in a ditch. Bruises, glass, a night in the emergency room.', kind: 'bad' }] },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'keys',
        label: 'Take his keys',
        effects: [
          { karma: 4 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'friend', delta: 4 }, { log: 'I took his keys and called a taxi for everyone. He was furious at midnight and grateful by noon.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'He shoved me off and drove away. I walked home in dress shoes. They all got home, somehow.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'home',
        label: 'Go home',
        effects: [{ stat: 'happiness', delta: -1 }, { stat: 'health', delta: 1 }, { relationship: 'mother', delta: 2 }, { relationship: 'father', delta: 2 }, { log: 'I went home. {{parents}} stayed up, pretending not to wait, and made toast.' }],
      },
    ],
  },
  // ------------------------------------------------------------ applications
  {
    id: 'tn_college_apps',
    category: 'school',
    title: 'College applications',
    text: 'My last year of school, and the college applications are due. A teacher keeps saying "reach, match, safety" like it is a spell. At home, every dinner ends with "Well?"',
    minAge: 17,
    maxAge: 17,
    weight: 3,
    once: true,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'reach',
        label: 'Shoot for a top school',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.3,
            then: [{ flag: 'tn_college_reach', set: true }, { stat: 'happiness', delta: 10 }, { relationship: 'mother', delta: 4 }, { relationship: 'father', delta: 4 }, { log: 'I got in! A thick envelope, a scream from the kitchen, and {{parents}} dancing. It cannot be unseen.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'A thin envelope. "We regret to inform you." The regret was mutual, for about a week.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'match',
        label: 'Apply somewhere sensible',
        effects: [{ flag: 'tn_college_match', set: true }, { stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 1 }, { log: 'I applied to places that would actually have me, and they did. No drama, some relief.', kind: 'good' }],
      },
      {
        id: 'mentor',
        label: 'Ask my mentor for a letter',
        hint: 'She believed in me once',
        conditions: [{ flag: 'tn_mentor', eq: true }],
        effects: [
          {
            chance: 0.6,
            then: [{ flag: 'tn_college_reach', set: true }, { stat: 'happiness', delta: 10 }, { log: "My teacher's letter made me cry. Apparently it worked on the admissions office too. I got in.", kind: 'milestone' }],
            else: [{ flag: 'tn_college_match', set: true }, { stat: 'happiness', delta: -3 }, { log: 'Even with a glowing letter, the top school said no. The second choice said yes, warmly.' }],
          },
        ],
      },
      {
        id: 'none',
        label: 'Skip college',
        effects: [{ flag: 'tn_no_college', set: true }, { stat: 'happiness', delta: 3 }, { relationship: 'mother', delta: -3 }, { relationship: 'father', delta: -3 }, { log: 'I told {{parents}} college was not for me. Dinner was quiet. I meant it, though. Mostly.' }],
      },
    ],
  },
  // ------------------------------------------------------------ home
  {
    id: 'tn_curfew',
    category: 'school',
    title: 'Past curfew',
    text: 'I crept in two hours after curfew. The hall light was on. {{person}} was sitting on the stairs with a cold cup of tea and an expression I had never seen before.',
    minAge: 14,
    maxAge: 17,
    weight: 2,
    cooldown: 2,
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather'] },
    choices: [
      {
        id: 'sorry',
        label: 'Apologize',
        effects: [{ karma: 1 }, { relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -1 }, { log: '"I was worried," {{they}} said, which was worse than shouting. I apologized and meant it.' }],
      },
      {
        id: 'argue',
        label: 'Argue it is unfair',
        effects: [
          { relationship: 'person', delta: -8 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'We argued for an hour and {{they}} finally pushed curfew thirty minutes later. A costly victory.' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'The argument ended with me grounded for two weeks.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'lie',
        label: 'Say the bus was late',
        effects: [
          { karma: -2 },
          {
            chance: 0.55,
            then: [{ stat: 'happiness', delta: 2 }, { log: '{{person}} sighed and let it go. {{They}} did not believe me, but {{they}} wanted to.' }],
            else: [{ relationship: 'person', delta: -12 }, { stat: 'happiness', delta: -4 }, { log: "{{person}} had already called my friend's parents. The bus, it turned out, was on time.", kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tn_friend_moving',
    category: 'school',
    title: 'Last day at our table',
    text: '{{person}} told me at lunch, staring at {{their}} tray: {{their}} family is moving to another city at the end of the school year. Lunch without {{them}} is hard to picture.',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    once: true,
    // Not right after another friend's move (nc_friend_moving_away).
    conditions: [{ enrolled: true }, { not: { sinceEvent: 'nc_friend_moving_away', lte: 2 } }],
    person: { kind: ['friend', 'bestFriend'], minRelationship: 40 },
    // The friend moves whatever I choose: kept in touch, they live far away (moveAway); let go, they leave the life.
    choices: [
      {
        id: 'online',
        label: 'Promise to stay in touch',
        effects: [{ relationship: 'person', delta: -5 }, { stat: 'happiness', delta: -4 }, { log: 'We called every week, then every month. The distance is real, but so are we.' }, { moveAway: true }],
      },
      {
        id: 'party',
        label: 'Throw a goodbye party',
        effects: [{ relationship: 'person', delta: 8 }, { karma: 2 }, { stat: 'happiness', delta: -2 }, { stat: 'health', delta: -1 }, { log: 'The whole class came. {{person}} cried, I cried, then someone played a slow song and everyone cried.', kind: 'good' }, { moveAway: true }],
      },
      {
        id: 'drift',
        label: 'Let it drift',
        // The new friend is made before the old one leaves, so the old friend's name is still taken.
        effects: [
          { log: 'We said goodbye and meant it. Some friendships belong to a time and a place.' },
          { stat: 'happiness', delta: -6 },
          { chance: 0.5, then: [{ newPerson: { kind: 'friend', log: 'I made a new friend, {{person}}, who sits where my old friend used to.' } }] },
          { removePerson: true },
        ],
      },
    ],
  },
  {
    id: 'tn_golden_sibling',
    category: 'school',
    title: 'The golden child',
    text: '{{person}} came home with a glowing report card and {{parents}} talked about nothing else all week. There is a photo of it on the fridge. A photo.',
    minAge: 13,
    maxAge: 17,
    weight: 2,
    cooldown: 3,
    // Someone raising us both is at home to make a fuss ({{parents}} names them).
    conditions: [{ hasPerson: ['mother', 'father', 'stepmother', 'stepfather'] }],
    // A sibling young enough to still bring home report cards.
    person: { kind: ['sibling'], minAge: 6, maxAge: 18 },
    choices: [
      {
        id: 'congrats',
        label: 'Congratulate {{them}}',
        effects: [{ karma: 2 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: -2 }, { log: '"Nice one," I said, and meant it, mostly. {{person}} looked surprised, then pleased. Fridge unchanged.' }],
      },
      {
        id: 'compete',
        label: 'Beat {{them}} next semester',
        effects: [{ grade: 5 }, { stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: -1 }, { relationship: 'person', delta: -2 }, { log: 'I studied out of pure spite. Spite, it turns out, is an excellent tutor.', kind: 'good' }],
      },
      {
        id: 'sabotage',
        label: 'Hide the report card',
        effects: [
          { karma: -4 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: -5 }, { log: 'The report card vanished. The fridge went back to magnets. Nobody suspected me. Nobody.' }],
            else: [{ relationship: 'person', delta: -12 }, { relationship: 'mother', delta: -5 }, { relationship: 'father', delta: -5 }, { relationship: 'stepmother', delta: -5 }, { relationship: 'stepfather', delta: -5 }, { stat: 'happiness', delta: -4 }, { log: 'It was found in my sock drawer. Now there are two photos on the fridge, and a family meeting.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tn_sibling_borrowed',
    category: 'school',
    title: 'Borrowed, ruined',
    text: '{{person}} borrowed my headphones without asking and returned them with one side dead and the other sticky. {{They}} said "they were like that," which is a lie.',
    minAge: 13,
    maxAge: 17,
    weight: 2,
    cooldown: 3,
    // A sibling who plausibly still lives at home.
    person: { kind: ['sibling'], minAge: 8, maxAge: 19 },
    choices: [
      {
        id: 'demand',
        label: 'Demand a replacement',
        effects: [
          {
            chance: 0.5,
            then: [{ money: 40 }, { relationship: 'person', delta: -3 }, { log: '{{person}} grudgingly handed over {{$40}} and called me a lawyer. I will take that.', kind: 'money' }],
            else: [{ relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -3 }, { log: 'It turned into a shouting match. No money, and {{person}} "borrowed" my best sweater out of spite.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'forgive',
        label: 'Let it go',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: -2 }, { relationship: 'person', delta: 3 }, { log: 'I let it go. {{person}} noticed, and a week later shared {{their}} snacks without being asked. Progress.' }],
      },
      {
        id: 'revenge',
        label: 'Borrow {{their}} stuff back',
        effects: [
          { karma: -2 },
          { relationship: 'person', delta: -6 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.3,
            then: [{ relationship: 'mother', delta: -3 }, { relationship: 'father', delta: -3 }, { log: 'The hostage exchange escalated until a parent confiscated everything. Nobody won.', kind: 'bad' }],
            else: [{ log: 'I took {{their}} speaker. An uneasy ceasefire followed.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tn_detention',
    category: 'school',
    title: 'After-school detention',
    text: 'I got caught passing a note in class for the third time this week, and the teacher finally snapped. Detention, after school, with the kids who set the trash cans on fire.',
    minAge: 13,
    maxAge: 17,
    weight: 2,
    cooldown: 3,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'serve',
        label: 'Serve it quietly',
        effects: [{ stat: 'happiness', delta: -2 }, { grade: 1 }, { stat: 'smarts', delta: 1 }, { log: 'I did my homework in detention. Weirdly productive. The trash-can arsonists were nice.' }],
      },
      {
        id: 'argue',
        label: 'Argue my case',
        effects: [
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I argued the note was an emergency. It was not, but I argued well. Detention canceled.', kind: 'good' }],
            else: [{ grade: -3 }, { stat: 'happiness', delta: -3 }, { log: 'Arguing earned me a second detention and a reputation.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Skip detention',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I just did not go. Nobody followed up. The system has gaps.' }],
            else: [{ grade: -4 }, { relationship: 'mother', delta: -5 }, { relationship: 'father', delta: -5 }, { stat: 'happiness', delta: -3 }, { log: 'Skipping detention escalated to a parent meeting. I now have three detentions and no weekends.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  // ------------------------------------------------------------ clubs and teams
  {
    id: 'tn_school_play',
    category: 'school',
    title: 'Play auditions',
    text: 'The drama department put up a sign-up sheet for the spring play. The lead gets a monologue, a sword fight and a kiss scene. The crew gets to paint things and leave early. I cannot decide.',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'lead',
        label: 'Audition for the lead',
        conditions: [{ notTrait: 'creative' }],
        effects: [
          {
            chance: 0.4,
            then: [{ fame: 2 }, { stat: 'happiness', delta: 8 }, { stat: 'looks', delta: 2 }, { log: 'I got the lead! Opening night, three hundred people, and I only dropped the sword once.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I was cast as "Villager 3." Villager 3 has one line. I delivered it beautifully.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'lead_creative',
        label: 'Audition for the lead',
        hint: 'Creative: better odds',
        conditions: [{ trait: 'creative' }],
        effects: [
          {
            chance: 0.65,
            then: [{ fame: 2 }, { stat: 'happiness', delta: 8 }, { stat: 'looks', delta: 2 }, { log: 'I got the lead! Opening night, three hundred people, and I only dropped the sword once.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I was cast as "Villager 3." Villager 3 has one line. I delivered it beautifully.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'crew',
        label: 'Join the crew',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 3 }, { relationship: 'friend', delta: 2 }, { log: 'I painted a castle, learned to rig lights, and left early most days. Honestly the better deal.', kind: 'good' }],
      },
      {
        id: 'skip',
        label: 'Not my thing',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I watched from the back row. Villager 3 was surprisingly good.' }],
      },
    ],
  },
  {
    id: 'tn_tryouts',
    category: 'school',
    // The night before the cut list, not the tryout itself (sl_sports_tryout), and never within two years of it.
    title: 'The cut list',
    text: 'Tryouts ended an hour ago. The coach said the cut list goes up on the gym door at seven tomorrow, and anyone who wants to run drills tonight can stay. Half of us are lacing up again.',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ enrolled: true }, { not: { sinceEvent: 'sl_sports_tryout', lte: 2 } }],
    choices: [
      {
        id: 'tryout',
        label: 'Stay and run the drills',
        conditions: [{ notTrait: 'athletic' }],
        effects: [
          { energy: -1 },
          {
            chance: 0.45,
            then: [{ stat: 'health', delta: 4 }, { stat: 'happiness', delta: 6 }, { stat: 'looks', delta: 1 }, { flag: 'tn_team', set: true }, { log: 'My name was on the list at seven. Practice is brutal, the bus is loud, and I love it.', kind: 'milestone' }],
            else: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: -3 }, { log: 'I ran drills until I saw colors. The list went up at seven without my name. I read it twice.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'tryout_athletic',
        label: 'Stay and run the drills',
        hint: 'Athletic: better odds',
        conditions: [{ trait: 'athletic' }],
        effects: [
          { energy: -1 },
          {
            chance: 0.75,
            then: [{ stat: 'health', delta: 4 }, { stat: 'happiness', delta: 6 }, { stat: 'looks', delta: 1 }, { flag: 'tn_team', set: true }, { log: 'My name was on the list at seven. Practice is brutal, the bus is loud, and I love it.', kind: 'milestone' }],
            else: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: -3 }, { log: 'I ran drills until I saw colors. The list went up at seven without my name. I read it twice.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'cheer',
        label: 'Go home and rest',
        effects: [
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: 5 }, { flag: 'tn_team', set: true }, { log: 'I went home, slept nine hours and found my name on the list anyway, in the last spot.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: -2 }, { stat: 'health', delta: 1 }, { log: 'I slept well. The list went up without me. Part of me had known.' }],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Take my name off the list',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 1 }, { log: 'I withdrew before the list went up and spent the season on homework. I did not see a single color.' }],
      },
    ],
  },
  {
    id: 'tn_science_fair',
    category: 'school',
    title: 'Things that hum',
    text: 'The high school science fair is Friday. The ambitious kids are building things that hum. I have a shoebox, a borrowed soldering iron and an idea I cannot fully explain.',
    minAge: 13,
    maxAge: 16,
    weight: 1.5,
    cooldown: 3,
    // Not right after the younger kids' science fair cards (sl_science_fair, kd_science_fair).
    conditions: [{ enrolled: true }, { stage: ['high'] }, { not: { sinceEvent: 'sl_science_fair', lte: 2 } }, { not: { sinceEvent: 'kd_science_fair', lte: 2 } }],
    choices: [
      {
        id: 'big',
        label: 'Go big',
        effects: [
          {
            random: [
              { weight: 45, effects: [{ stat: 'smarts', delta: 4 }, { grade: 6 }, { stat: 'happiness', delta: 6 }, { log: 'My project worked, hummed, and won second place. A judge called it "alarming but rigorous."', kind: 'good' }] },
              { weight: 35, effects: [{ grade: 2 }, { stat: 'happiness', delta: -2 }, { log: 'It did not work on the day. The judges were kind. The soldering iron was not.' }] },
              { weight: 20, effects: [{ injury: 2 }, { grade: 3 }, { stat: 'happiness', delta: 3 }, { log: 'It worked slightly too well. Minor burn, evacuated gym, instant legend.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'minimum',
        label: 'Do the minimum',
        effects: [{ grade: 1 }, { stat: 'happiness', delta: 1 }, { log: 'A poster about the mold growing in my own lunchbox. The judges stood well back. It passed.' }],
      },
      {
        id: 'help',
        label: 'Help a friend instead',
        effects: [{ karma: 2 }, { relationship: 'friend', delta: 5 }, { stat: 'smarts', delta: 1 }, { grade: -1 }, { log: "I spent the week soldering someone else's dream. It won. My name was in small print.", kind: 'good' }],
      },
    ],
  },
  // ------------------------------------------------------------ grades
  {
    id: 'tn_report_card',
    category: 'school',
    title: 'Grades are out',
    text: 'The report card is in my bag and it is not pretty. At dinner, {{person}} put down {{their}} fork and asked, casually, whether grades had come out yet.',
    minAge: 13,
    maxAge: 17,
    weight: 2,
    cooldown: 3,
    conditions: [{ enrolled: true }, { grade: { lte: 50 } }],
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather'] },
    choices: [
      {
        id: 'promise',
        label: 'Hand it over, promise better',
        effects: [{ karma: 1 }, { relationship: 'person', delta: 2 }, { grade: 4 }, { stat: 'happiness', delta: -2 }, { log: 'I handed it over and promised to try. A tutor appeared the following week, unbidden.' }],
      },
      {
        id: 'blame',
        label: 'Blame the teacher',
        effects: [
          { karma: -2 },
          { relationship: 'person', delta: -4 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -3 }, { log: '{{person}} actually called the teacher. The teacher talked at length. It did not help my case.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: '{{person}} seemed to half believe me. I half believed me too.' }],
          },
        ],
      },
      {
        id: 'hide',
        label: 'Say they are not out yet',
        effects: [
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: '"Not yet," I said, and {{person}} went back to dinner. The school mails a copy home, eventually.' }],
            else: [{ relationship: 'person', delta: -10 }, { stat: 'happiness', delta: -4 }, { log: "{{person}} had the school's copy in {{their}} pocket the whole time. The silence had texture.", kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tn_honor_roll',
    category: 'school',
    title: 'Honor roll',
    text: 'My name went up on the honor roll board outside the office. Someone drew a small crown next to it. I do not know who. I like them.',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ enrolled: true }, { grade: { gte: 80 } }],
    choices: [
      {
        id: 'celebrate',
        label: 'Celebrate loudly',
        effects: [{ stat: 'happiness', delta: 5 }, { fame: 1 }, { log: 'I told everyone. Twice. Some of them cheered. The crown artist remains unknown.', kind: 'good' }],
      },
      {
        id: 'reward',
        label: 'Ask {{parents}} for a reward',
        effects: [
          {
            chance: 0.6,
            then: [{ money: 100 }, { stat: 'happiness', delta: 3 }, { log: '{{parents}} came through with {{$100}} and a dinner out. Academic capitalism works.', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -1 }, { relationship: 'mother', delta: -1 }, { relationship: 'father', delta: -1 }, { log: '"Your reward is your education," I was told, and that was the end of it.' }],
          },
        ],
      },
      {
        id: 'quiet',
        label: 'Keep it quiet',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 2 }, { karma: 1 }, { log: 'I kept it to myself and let the crown do the talking.' }],
      },
    ],
  },
  // ------------------------------------------------------------ dating
  {
    id: 'tn_meet_parents',
    category: 'school',
    title: 'The wobbly chair',
    text: 'I invited {{person}} over for dinner with {{parents}}. {{They}} arrived early, with flowers, and sat on the one chair that wobbles. {{mother}} opened with "So."',
    minAge: 16,
    maxAge: 17,
    weight: 2,
    cooldown: 2,
    conditions: [{ hasPerson: ['mother'] }],
    person: { kind: ['lover'] },
    choices: [
      {
        id: 'natural',
        label: 'Let it play out',
        effects: [
          {
            random: [
              { weight: 60, effects: [{ relationship: 'person', delta: 6 }, { love: 5 }, { relationship: 'mother', delta: 3 }, { stat: 'happiness', delta: 5 }, { log: 'By dessert, {{person}} was doing dishes and {{mother}} had the baby photos out. Mortifying. Wonderful.', kind: 'good' }] },
              { weight: 40, effects: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: -3 }, { love: -3 }, { log: '{{mother}} asked about {{their}} "prospects." {{person}} laughed at the wrong moment. We left early.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'coach',
        label: 'Coach {{them}} beforehand',
        effects: [{ stat: 'smarts', delta: 1 }, { relationship: 'person', delta: 3 }, { love: 3 }, { stat: 'happiness', delta: 2 }, { log: 'I briefed {{person}} on safe topics. The evening went smoothly, like a well-rehearsed play.' }],
      },
      {
        id: 'short',
        label: 'Keep it short',
        effects: [{ relationship: 'person', delta: -3 }, { love: -2 }, { stat: 'happiness', delta: 1 }, { log: 'We ate fast and left for the movies. {{parents}} said {{person}} seemed "nice, in a hurry."' }],
      },
    ],
  },
  {
    id: 'tn_rumor',
    category: 'school',
    title: 'Seen at the mall',
    text: 'Someone told me, with far too much enjoyment, that {{person}} was seen holding hands with somebody else at the mall on Saturday. I was at the mall on Saturday. I saw nothing.',
    minAge: 16,
    maxAge: 17,
    weight: 1.5,
    cooldown: 2,
    person: { kind: ['lover'] },
    choices: [
      {
        id: 'ask',
        label: 'Ask {{them}} directly',
        effects: [
          {
            chance: 0.65,
            then: [{ relationship: 'person', delta: 5 }, { love: 6 }, { stat: 'happiness', delta: 3 }, { log: 'It was {{their}} cousin. {{person}} laughed for a full minute, then held my hand in front of everyone.', kind: 'good' }],
            else: [{ log: 'The silence before {{they}} answered told me everything. We broke up in the parking lot.', kind: 'bad' }, { removePerson: true }, { stat: 'happiness', delta: -10 }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore it',
        effects: [{ stat: 'happiness', delta: 1 }, { love: -3 }, { log: 'I decided not to ask. Peaceful, for now. The not-asking sat between us for weeks.' }],
      },
      {
        id: 'dump',
        label: 'Break up first',
        effects: [{ log: 'I ended it before {{they}} could. It was the cousin. I found that out later.', kind: 'bad' }, { removePerson: true }, { stat: 'happiness', delta: -6 }, { karma: -2 }],
      },
    ],
  },
  // ------------------------------------------------------------ friends
  {
    id: 'tn_cafeteria_fight',
    category: 'school',
    title: 'Cafeteria fight',
    text: 'A shove became a punch and suddenly the cafeteria was a ring. One of the two kids swinging was {{person}}, who does not usually swing at anything. Everyone looked at me.',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ enrolled: true }],
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'pull',
        label: 'Pull {{them}} out',
        effects: [
          { karma: 2 },
          { relationship: 'person', delta: 8 },
          {
            chance: 0.3,
            then: [{ injury: 3 }, { stat: 'happiness', delta: -1 }, { log: 'I got between them and caught an elbow. Black eye, but {{person}} walked away with me.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 3 }, { log: 'I dragged {{person}} out before the teachers came. {{They}} was shaking. We cut the next class together.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'film',
        label: 'Film it',
        conditions: [{ year: { gte: 2010 } }],
        effects: [
          { karma: -3 },
          { fame: 1 },
          {
            chance: 0.4,
            then: [{ grade: -2 }, { stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -8 }, { log: 'A teacher took my phone and called me "part of the problem." {{person}} did not speak to me for a week.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -4 }, { log: 'The video did numbers. {{person}} was not thrilled to be the star.' }],
          },
        ],
      },
      {
        id: 'away',
        label: 'Stay out of it',
        effects: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -4 }, { log: 'I stayed at my table. {{person}} got suspended for three days and asked why I had not helped.' }],
      },
    ],
  },
  {
    id: 'tn_study_buddy',
    category: 'school',
    title: 'Study buddy',
    text: '{{person}} is failing a class I happen to be good at, and asked, a little sheepishly, whether I would help {{them}} study before the exam.',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ enrolled: true }, { grade: { gte: 65 } }],
    person: { kind: ['friend', 'bestFriend'], minRelationship: 30 },
    choices: [
      {
        id: 'help',
        label: 'Help for free',
        effects: [{ karma: 2 }, { relationship: 'person', delta: 6 }, { stat: 'smarts', delta: 1 }, { grade: -1 }, { stat: 'happiness', delta: 2 }, { log: 'We studied every evening. {{person}} passed, and I understood the subject better than before.', kind: 'good' }],
      },
      {
        id: 'charge',
        label: 'Charge {{$15}} an hour',
        effects: [{ money: 90 }, { relationship: 'person', delta: -3 }, { log: 'A week of tutoring, {{$90}}, and a friend who now calls me "the bank."', kind: 'money' }],
      },
      {
        id: 'no',
        label: 'Say no',
        effects: [{ relationship: 'person', delta: -5 }, { stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: 1 }, { log: 'I said I was too busy. I was not. {{person}} found someone else, and I kept my evenings.' }],
      },
    ],
  },
  // ------------------------------------------------------------ senior year
  {
    id: 'tn_senior_prank',
    category: 'school',
    title: 'Senior prank',
    text: "Last week of school. The senior prank is being planned in whispers: three hundred paper cups of water across the principal's office floor. The organizers asked me to hold the door.",
    minAge: 17,
    maxAge: 17,
    weight: 2,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['high'] }],
    choices: [
      {
        id: 'door',
        label: 'Hold the door',
        effects: [
          { karma: -1 },
          {
            chance: 0.65,
            then: [{ stat: 'happiness', delta: 8 }, { relationship: 'friend', delta: 4 }, { log: 'The principal waded through a lake of cups and, to her credit, laughed. Legend status, earned.', kind: 'good' }],
            else: [{ grade: -4 }, { relationship: 'mother', delta: -4 }, { relationship: 'father', delta: -4 }, { stat: 'happiness', delta: -3 }, { log: "The cameras caught the door-holder. Me. Two days' suspension in my final week.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'plan',
        label: 'Plan it better',
        effects: [
          { stat: 'smarts', delta: 3 },
          { karma: -2 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 6 }, { fame: 1 }, { log: 'I mapped the camera blind spots. Flawless execution. Nobody ever knew.', kind: 'good' }],
            else: [{ grade: -3 }, { relationship: 'mother', delta: -3 }, { relationship: 'father', delta: -3 }, { stat: 'happiness', delta: -3 }, { log: 'The plan was in my notebook, in my handwriting. Masterminds get suspended too.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'out',
        label: 'Sit it out',
        effects: [{ stat: 'happiness', delta: -1 }, { karma: 1 }, { grade: 1 }, { log: 'I sat it out and finished my coursework. The cups were impressive, I admit.' }],
      },
    ],
  },
];

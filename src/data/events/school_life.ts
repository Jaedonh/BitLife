import type { EventDef } from '@/engine/events/schema';

/**
 * Ages 6-22, all while enrolled: primary and middle school scrapes, high
 * school politics and temptations, and the university years. Follow-ups
 * (followUpOnly) are queued by the events that set them up and never fire
 * on their own.
 */
export const SCHOOL_LIFE_EVENTS: EventDef[] = [
  // ---------------------------------------------------------------- primary
  {
    id: 'sl_show_and_tell',
    category: 'school',
    title: 'The fancy watch',
    text: "Show and tell is tomorrow and I have nothing to show. {{father}}'s fancy watch is sitting right there on the dresser. Nobody has said no, technically.",
    minAge: 6,
    maxAge: 9,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ hasPerson: ['mother'] }, { enrolled: true }, { stage: ['primary'] }, { hasPerson: ['father'] }],
    choices: [
      {
        id: 'watch',
        label: 'Borrow the watch',
        effects: [
          { karma: -2 },
          {
            chance: 0.6,
            then: [{ log: 'The watch was a hit. I returned it before anyone noticed. A victimless crime, probably.', kind: 'good' }, { stat: 'happiness', delta: 4 }],
            else: [{ log: 'I dropped the watch. {{father}} found the dent. The conversation that followed was long and quiet.', kind: 'bad' }, { relationship: 'father', delta: -8 }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'rock',
        label: 'Bring an interesting rock',
        effects: [{ log: 'I presented a rock and gave it a backstory. The class was oddly moved. Rocks have stories too.', kind: 'good' }, { stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 1 }],
      },
      {
        id: 'ask',
        label: 'Ask {{mother}} for ideas',
        effects: [
          { log: "{{mother}} helped me make a shoebox diorama. The teacher said 'ambitious'. I took that as praise.", kind: 'good' },
          { relationship: 'mother', delta: 3 },
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 1 },
        ],
      },
    ],
  },
  {
    id: 'sl_lost_permission_slip',
    category: 'school',
    title: 'Permission slip',
    text: 'The field trip to the museum is tomorrow and my permission slip has vanished. {{person}} signed it a week ago. I have searched my backpack four times. It is not in my backpack.',
    minAge: 7,
    maxAge: 12,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ enrolled: true }, { stage: ['primary', 'middle'] }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'forge',
        label: 'Forge the signature',
        effects: [
          { karma: -3 },
          {
            chance: 0.65,
            then: [{ log: 'My forgery passed inspection. I saw the dinosaurs. I also learned something unsettling about myself.' }, { stat: 'happiness', delta: 3 }, { grade: 1 }],
            else: [{ log: 'The teacher compared signatures. {{person}} got a phone call. I got a lecture and no dinosaurs.', kind: 'bad' }, { relationship: 'person', delta: -6 }, { stat: 'happiness', delta: -4 }],
          },
        ],
      },
      {
        id: 'confess',
        label: 'Confess to {{person}}',
        effects: [
          { karma: 2 },
          { relationship: 'person', delta: 3 },
          {
            chance: 0.8,
            then: [{ log: '{{person}} sighed, signed a new slip, and told me to check my backpack again. It was in my backpack.', kind: 'good' }, { stat: 'happiness', delta: 2 }],
            else: [{ log: '{{person}} was fed up and refused to sign another one. I spent trip day in the library.', kind: 'bad' }, { stat: 'happiness', delta: -3 }, { stat: 'smarts', delta: 1 }],
          },
        ],
      },
      {
        id: 'stay',
        label: 'Stay behind quietly',
        effects: [{ log: 'I said nothing and spent the day in the library while everyone saw dinosaurs. Peaceful, but sad.' }, { stat: 'happiness', delta: -3 }, { stat: 'smarts', delta: 2 }, { karma: 1 }],
      },
    ],
  },
  {
    id: 'sl_recess_trade',
    category: 'school',
    title: 'Recess trade',
    text: 'A kid at recess offered to trade me a shiny, slightly sticky marble for my entire lunch. The marble was, admittedly, very shiny.',
    minAge: 6,
    maxAge: 10,
    weight: 1,
    cooldown: 2,
    conditions: [{ enrolled: true }, { stage: ['primary'] }],
    choices: [
      {
        id: 'take',
        label: 'Take the marble',
        effects: [{ log: 'I traded a sandwich for a marble. I was hungry by noon, but I had a marble.' }, { stat: 'happiness', delta: 2 }, { stat: 'health', delta: -1 }],
      },
      {
        id: 'haggle',
        label: 'Haggle for half',
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'I got the marble and kept my juice. Business instincts: confirmed.', kind: 'good' }, { stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }],
            else: [{ log: 'My negotiation collapsed. No marble, no deal, and somehow a bruised ego.' }, { stat: 'happiness', delta: -1 }],
          },
        ],
      },
      {
        id: 'keep',
        label: 'Keep the lunch',
        effects: [{ log: 'I kept my lunch. The marble went to someone less sensible. I ate my sandwich with quiet dignity.' }, { stat: 'health', delta: 1 }, { karma: 1 }],
      },
    ],
  },
  {
    id: 'sl_fire_drill',
    category: 'school',
    title: 'Fire drill',
    text: "The fire alarm went off in the middle of class. The teacher said 'calm and orderly'. Half the class interpreted this as a race. I was somewhere near the door.",
    minAge: 6,
    maxAge: 12,
    weight: 1,
    cooldown: 3,
    conditions: [{ enrolled: true }, { stage: ['primary', 'middle'] }],
    choices: [
      {
        id: 'lead',
        label: 'Lead the line calmly',
        effects: [
          {
            chance: 0.7,
            then: [{ log: 'I led the line out like a tiny officer. The teacher made me class fire monitor on the spot.', kind: 'good' }, { stat: 'happiness', delta: 3 }, { karma: 2 }, { stat: 'smarts', delta: 1 }],
            else: [{ log: 'I led confidently in the wrong direction. We ended up in the cafeteria kitchen.' }, { stat: 'happiness', delta: -1 }],
          },
        ],
      },
      {
        id: 'sprint',
        label: 'Sprint for the field',
        effects: [
          {
            chance: 0.8,
            then: [{ log: 'I was first on the field by a mile. Nobody was impressed, but I was.' }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'I tripped over a backpack in the hallway and scraped both knees.', kind: 'bad' }, { injury: 2 }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
      {
        id: 'help',
        label: 'Help a panicking kid',
        effects: [
          { karma: 2 },
          {
            chance: 0.8,
            then: [{ log: 'A younger kid froze. I held their hand all the way out. They called me their hero for a week.', kind: 'good' }, { stat: 'happiness', delta: 3 }, { karma: 1 }],
            else: [{ log: 'The kid was fine. I was the one who froze. A teacher walked me out by the elbow. Not very heroic.' }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'sl_library_fine',
    category: 'school',
    title: 'Overdue book',
    text: 'The school librarian stopped me in the hallway. A book about sharks that I borrowed in the fall is now overdue by a season. The fine is {{$15}}. I love that book.',
    minAge: 7,
    maxAge: 13,
    weight: 1,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['primary', 'middle'] }],
    choices: [
      {
        id: 'pay',
        label: 'Pay the fine',
        hint: 'Costs {{$15}}',
        conditions: [{ money: { gte: 15 } }],
        effects: [{ money: -15, payer: 'self' }, { log: "I paid up and returned the sharks. The librarian said 'thank you' in the way that means 'finally'.", kind: 'money' }, { karma: 1 }],
      },
      {
        id: 'apologise',
        label: 'Return it and apologize',
        effects: [
          {
            chance: 0.6,
            then: [{ log: 'I returned it and apologized. The librarian waived the fine and recommended a book about squid.', kind: 'good' }, { karma: 2 }, { stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'The fine went home in a letter. {{parents}} paid it, and I did the dishes for a month.', kind: 'bad' }, { relationship: 'mother', delta: -3 }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
      {
        id: 'deny',
        label: 'Claim I never had it',
        effects: [
          { karma: -3 },
          {
            chance: 0.5,
            then: [{ log: 'The librarian shrugged and marked it lost. I kept the shark book. I am a shark book pirate now.' }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'The librarian pulled up the records. Lying to a librarian, I learned, is a special kind of foolish.', kind: 'bad' }, { grade: -2 }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
    ],
  },
  {
    id: 'sl_bake_sale',
    category: 'school',
    title: 'Bake sale',
    text: 'The class bake sale is on Friday and everyone is supposed to bring something. {{person}} offered to help, then looked at the oven the way people look at a wild animal.',
    minAge: 8,
    maxAge: 13,
    weight: 1,
    cooldown: 3,
    conditions: [{ enrolled: true }, { stage: ['primary', 'middle'] }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'solo',
        label: 'Bake it myself',
        effects: [
          {
            random: [
              { weight: 55, effects: [{ log: 'My cookies were flat but they sold. I handed {{$30}} to the class fund with enormous pride.', kind: 'good' }, { stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }] },
              { weight: 30, effects: [{ log: "I misread 'tablespoon'. The cookies tasted like the sea. Nobody bought a second one." }, { stat: 'happiness', delta: -2 }] },
              { weight: 15, effects: [{ log: 'I set off the smoke alarm. {{person}} opened every window and did not say a word.', kind: 'bad' }, { relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -3 }] },
            ],
          },
        ],
      },
      {
        id: 'together',
        label: 'Bake with {{person}}',
        effects: [
          { relationship: 'person', delta: 4 },
          {
            chance: 0.75,
            then: [{ log: '{{person}} and I baked a lopsided cake. It sold out. The kitchen looked like a flour bomb went off.', kind: 'good' }, { stat: 'happiness', delta: 3 }],
            else: [{ log: '{{person}} took over halfway through. The cake sold out. I felt like a guest at my own bake sale.' }, { stat: 'happiness', delta: -1 }],
          },
        ],
      },
      {
        id: 'fake',
        label: 'Buy something and pretend',
        effects: [
          { karma: -2 },
          {
            chance: 0.7,
            then: [{ log: 'I put store-bought brownies on a homemade plate. Nobody suspected a thing. A clean operation.' }, { stat: 'happiness', delta: 1 }],
            else: [{ log: 'My brownies still had the price sticker on. A classmate announced this to the entire room.', kind: 'bad' }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
    ],
  },
  {
    id: 'sl_science_fair',
    category: 'school',
    title: 'My own work',
    text: "The science fair is in two weeks. The project is supposed to be 'my own work'. Everybody knows that is more of a suggestion than a rule.",
    minAge: 8,
    maxAge: 14,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ enrolled: true }, { stage: ['primary', 'middle'] }, { not: { sinceEvent: 'kd_science_fair', lte: 3 } }, { not: { sinceEvent: 'tn_science_fair', lte: 2 } }],
    person: { kind: ['mother', 'father', 'sibling'], minAge: 12 },
    choices: [
      {
        id: 'volcano',
        label: 'Build the classic volcano',
        effects: [{ log: 'My volcano erupted on schedule. The judges had seen eleven already. I got a participation ribbon.' }, { stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: 1 }, { grade: 1 }],
      },
      {
        id: 'ambitious',
        label: 'Attempt something ambitious',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: -2 },
          {
            random: [
              {
                weight: 40,
                effects: [
                  { log: 'My project on plants under colored light worked. First place, and a spot at the regional fair.', kind: 'milestone' },
                  { stat: 'happiness', delta: 8 },
                  { grade: 5 },
                  { flag: 'sl_science_fair_winner', set: true },
                  { queue: 'sl_science_fair_regionals' },
                ],
              },
              { weight: 40, effects: [{ log: "The experiment half-worked. The judges said 'promising', which I chose to hear as a compliment." }, { stat: 'happiness', delta: 2 }, { grade: 2 }] },
              { weight: 20, effects: [{ log: 'Nothing worked. My poster had three charts of nothing happening. A humbling afternoon.', kind: 'bad' }, { stat: 'happiness', delta: -4 }] },
            ],
          },
        ],
      },
      {
        id: 'help',
        label: 'Ask {{person}} to help',
        effects: [
          { relationship: 'person', delta: 3 },
          {
            chance: 0.7,
            then: [{ log: "{{person}} 'helped', meaning {{they}} did most of it. Second place. I felt a little hollow about it." }, { stat: 'happiness', delta: 3 }, { grade: 2 }, { karma: -1 }],
            else: [{ log: '{{person}} and I argued about the hypothesis for two hours. We entered a poster about the argument.' }, { stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: 1 }],
          },
        ],
      },
    ],
  },
  {
    id: 'sl_science_fair_regionals',
    category: 'school',
    title: 'Regional fair',
    text: 'The regional science fair was held in a convention hall that smelled of carpet. My plant-light poster looked very small next to a working robot arm.',
    minAge: 8,
    maxAge: 15,
    weight: 1,
    once: true,
    followUpOnly: true,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'present',
        label: 'Present with confidence',
        effects: [
          {
            chance: 0.35,
            then: [{ log: 'The judges loved how clearly I explained it. A regional medal, and a photo in the local paper.', kind: 'milestone' }, { stat: 'happiness', delta: 8 }, { stat: 'smarts', delta: 3 }, { fame: 2 }],
            else: [{ log: "The robot arm won. Of course it did. I shook its builder's hand and went for ice cream." }, { stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 2 }],
          },
        ],
      },
      {
        id: 'wander',
        label: 'Study the other projects',
        effects: [{ log: "I read everyone else's posters instead of standing by mine. No prize, but my brain felt bigger." }, { stat: 'smarts', delta: 4 }, { stat: 'happiness', delta: 1 }],
      },
    ],
  },
  {
    id: 'sl_substitute_teacher',
    category: 'school',
    title: 'Substitute teacher',
    text: 'Our teacher is out sick and the substitute looks nervous. The class has already quietly agreed that today the rules are more like folklore.',
    minAge: 7,
    maxAge: 13,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ enrolled: true }, { stage: ['primary', 'middle'] }],
    choices: [
      {
        id: 'swap',
        label: 'Swap names with someone',
        effects: [
          { karma: -1 },
          {
            chance: 0.7,
            then: [{ log: 'I answered to a different name all day. The sub never knew. A perfect crime with no victims.' }, { stat: 'happiness', delta: 4 }],
            else: [{ log: "The substitute checked the seating chart. My real name went in the 'note for the teacher'.", kind: 'bad' }, { stat: 'happiness', delta: -2 }, { grade: -2 }],
          },
        ],
      },
      {
        id: 'help',
        label: 'Help the substitute out',
        effects: [{ log: "I quietly explained where everything was. The sub left a note calling me 'a credit to the class'.", kind: 'good' }, { karma: 3 }, { stat: 'happiness', delta: 2 }, { grade: 2 }],
      },
      {
        id: 'nap',
        label: 'Nap behind a textbook',
        effects: [{ log: 'I slept through a whole class with my eyes open. A useful life skill, in the long run.' }, { stat: 'happiness', delta: 3 }, { stat: 'health', delta: 1 }, { grade: -2 }],
      },
    ],
  },
  {
    id: 'sl_picture_day',
    category: 'school',
    title: 'Picture day',
    text: "School picture day. One photo, one chance, and the photographer says 'big smile' like it is a threat.",
    minAge: 6,
    maxAge: 17,
    weight: 1,
    cooldown: 3,
    conditions: [{ enrolled: true }, { stage: ['primary', 'middle', 'high'] }],
    choices: [
      {
        id: 'outfit',
        label: 'Go all out',
        effects: [
          {
            chance: 0.6,
            then: [{ log: 'The photo came out great. Even I had to admit it. {{parents}} ordered the large print.', kind: 'good' }, { stat: 'looks', delta: 2 }, { stat: 'happiness', delta: 3 }],
            else: [{ log: 'My outfit looked loud in print. I am immortalized, unfortunately, in the yearbook.' }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
      {
        id: 'standard',
        label: 'Standard smile',
        effects: [{ log: 'I produced a perfectly acceptable photo. Nobody will remember it, which is the ideal outcome.' }, { stat: 'happiness', delta: 1 }],
      },
      {
        id: 'face',
        label: 'Pull a face',
        effects: [
          { karma: -1 },
          {
            random: [
              { weight: 50, effects: [{ log: 'My face made the yearbook. I was briefly famous in the hallway.', kind: 'good' }, { stat: 'happiness', delta: 4 }, { fame: 1 }] },
              { weight: 50, effects: [{ log: 'The photographer sighed and did a retake. My retake was somehow worse.', kind: 'bad' }, { stat: 'happiness', delta: -2 }, { stat: 'looks', delta: -1 }] },
            ],
          },
        ],
      },
    ],
  },

  // ----------------------------------------------------------- middle / high
  {
    id: 'sl_cafeteria_politics',
    category: 'school',
    title: 'Cafeteria politics',
    text: 'The cafeteria has an unspoken seating map. Today the popular table waved me over, right as {{person}} was saving me a seat at our usual spot.',
    minAge: 11,
    maxAge: 17,
    weight: 2,
    cooldown: 2,
    conditions: [{ enrolled: true }, { stage: ['middle', 'high'] }],
    person: { kind: ['friend', 'bestFriend', 'classmate'] },
    choices: [
      {
        id: 'popular',
        label: 'Join the popular table',
        effects: [
          { relationship: 'person', delta: -6 },
          {
            chance: 0.5,
            then: [{ log: 'I was welcomed in. The jokes were worse than ours, but the status was real.' }, { stat: 'happiness', delta: 4 }, { fame: 1 }],
            else: [{ log: 'They only wanted to copy my homework. I slunk back to {{person}}, who said nothing, loudly.', kind: 'bad' }, { stat: 'happiness', delta: -4 }],
          },
        ],
      },
      {
        id: 'loyal',
        label: 'Sit with {{person}}',
        effects: [
          { log: 'I sat with {{person}}. The popular table forgot me in a minute. Loyalty tastes like school pizza.', kind: 'good' },
          { relationship: 'person', delta: 5 },
          { karma: 2 },
          { stat: 'happiness', delta: 2 },
        ],
      },
      {
        id: 'alone',
        label: 'Eat alone with a book',
        effects: [{ log: 'I took my tray to the far corner and read. Everyone thought I was mysterious. I was just hungry.' }, { stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: -1 }],
      },
    ],
  },
  {
    id: 'sl_group_project_freeloader',
    category: 'school',
    title: 'Group project',
    text: "Group project due Monday. {{person}} has contributed one idea, and it was 'make the title bigger'. The rest, apparently, is on me.",
    minAge: 12,
    maxAge: 22,
    weight: 2,
    cooldown: 2,
    conditions: [{ enrolled: true }, { stage: ['middle', 'high', 'university', 'graduate'] }, { not: { sinceEvent: 'ya_group_project', lte: 2 } }],
    person: { kind: ['friend', 'bestFriend', 'classmate'] },
    choices: [
      {
        id: 'cover',
        label: 'Do {{their}} part too',
        effects: [
          { log: "I did {{person}}'s part at midnight. Good grade. {{They}} thanked me like {{they}} had helped." },
          { stat: 'happiness', delta: -3 },
          { grade: 4 },
          { relationship: 'person', delta: 2 },
        ],
      },
      {
        id: 'report',
        label: 'Report {{them}}',
        effects: [
          { relationship: 'person', delta: -8 },
          {
            chance: 0.7,
            then: [{ log: "We were graded separately. My grade went up, {{person}}'s went down, and so did our friendship." }, { grade: 3 }, { stat: 'happiness', delta: -1 }],
            else: [{ log: "The only answer I got was 'work it out yourselves'. Nobody won, least of all me.", kind: 'bad' }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'omit',
        label: 'Leave {{their}} name off',
        effects: [
          { relationship: 'person', delta: -10 },
          { karma: -2 },
          {
            chance: 0.6,
            then: [{ log: "I handed it in without {{person}}'s name. It was accepted. {{person}} called me a traitor." }, { grade: 3 }, { stat: 'happiness', delta: -2 }],
            else: [{ log: 'Someone noticed the missing name and the whole group got a late penalty. Everyone blamed me.', kind: 'bad' }, { grade: -3 }, { stat: 'happiness', delta: -4 }],
          },
        ],
      },
      {
        id: 'confront',
        label: 'Confront {{them}} directly',
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'I told {{person}} I was done covering. {{They}} apologized and pulled an all-nighter. Not bad.', kind: 'good' }, { relationship: 'person', delta: 3 }, { grade: 2 }],
            else: [{ log: '{{person}} got defensive and did even less out of spite. We scraped a pass.' }, { stat: 'happiness', delta: -2 }, { grade: -1 }, { relationship: 'person', delta: -4 }],
          },
        ],
      },
    ],
  },
  {
    id: 'sl_detention',
    category: 'school',
    title: 'Detention hour',
    text: "I got detention for 'excessive commentary' during class. One hour after school in a silent room with a teacher who grades in red ink and sighs.",
    minAge: 11,
    maxAge: 17,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ enrolled: true }, { stage: ['middle', 'high'] }],
    choices: [
      {
        id: 'serve',
        label: 'Serve it quietly',
        effects: [{ log: 'I sat in silence for an hour and accidentally finished all my homework. Surprisingly productive.' }, { grade: 2 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }],
      },
      {
        id: 'skip',
        label: 'Skip it',
        effects: [
          { karma: -2 },
          {
            chance: 0.6,
            then: [{ log: 'I walked straight past the room and nobody said a word. Freedom, with a faint aftertaste of dread.' }, { stat: 'happiness', delta: 3 }],
            else: [
              { log: 'Skipping detention earned me a two-day suspension and a very quiet dinner at home.', kind: 'bad' },
              { grade: -5 },
              { stat: 'happiness', delta: -4 },
              { relationship: 'mother', delta: -3 },
              { relationship: 'father', delta: -3 },
            ],
          },
        ],
      },
      {
        id: 'argue',
        label: 'Argue the charge',
        effects: [
          {
            chance: 0.3,
            then: [{ log: 'I argued my case with such conviction that the teacher laughed and let me go. Lawyering works.', kind: 'good' }, { stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 1 }],
            else: [{ log: "The argument earned me a second detention for 'excessive commentary about excessive commentary'.", kind: 'bad' }, { stat: 'happiness', delta: -3 }, { grade: -1 }],
          },
        ],
      },
    ],
  },
  {
    id: 'sl_school_trip',
    category: 'school',
    title: 'School trip',
    text: 'The school is running a three-day trip to the coast. It costs {{$150}}, and I know for a fact that everyone I like is going.',
    minAge: 9,
    maxAge: 16,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ enrolled: true }, { stage: ['primary', 'middle', 'high'] }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'ask',
        label: 'Ask {{person}} to pay',
        effects: [
          {
            chance: 0.65,
            then: [{ log: '{{person}} paid without much fuss. Three days of sea air, bad bunk beds and the time of my life.', kind: 'good' }, { stat: 'happiness', delta: 8 }, { stat: 'health', delta: 2 }, { relationship: 'person', delta: 3 }],
            else: [{ log: '{{person}} said money was tight this year. I understood, which somehow made it worse.', kind: 'bad' }, { stat: 'happiness', delta: -5 }],
          },
        ],
      },
      {
        id: 'chores',
        label: 'Offer to do chores',
        effects: [
          { relationship: 'person', delta: 4 },
          { karma: 1 },
          { energy: -1 },
          {
            chance: 0.8,
            then: [{ log: 'I washed every dish for a month and earned my ticket. The sea was worth every plate.', kind: 'good' }, { stat: 'happiness', delta: 6 }, { stat: 'health', delta: 2 }],
            else: [{ log: 'I did the chores. Then the trip was canceled for weather. The dishes remained washed.' }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
      {
        id: 'pay',
        label: 'Pay for it myself',
        hint: 'Costs {{$150}}',
        conditions: [{ money: { gte: 150 } }],
        effects: [{ money: -150, payer: 'self' }, { log: 'I paid my own way. Three days of sea air, bad bunk beds and a new feeling of independence.', kind: 'good' }, { stat: 'happiness', delta: 8 }, { stat: 'health', delta: 2 }],
      },
      {
        id: 'stay',
        label: 'Stay home',
        effects: [{ log: 'I stayed behind with the three other kids who did not go. We bonded over being left behind.' }, { stat: 'happiness', delta: -3 }, { stat: 'smarts', delta: 1 }],
      },
    ],
  },
  {
    id: 'sl_unfair_teacher',
    category: 'school',
    title: 'Unfair teacher',
    text: 'My history teacher has decided I am a troublemaker and marks me down for things other kids do freely. Today my essay scored lower than a doodle of a horse.',
    minAge: 11,
    maxAge: 17,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ hasPerson: ['mother'] }, { enrolled: true }, { stage: ['middle', 'high'] }],
    choices: [
      {
        id: 'principal',
        label: 'Complain to the principal',
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'The principal reviewed my essay and quietly had it regraded. The teacher now avoids eye contact.', kind: 'good' }, { grade: 5 }, { stat: 'happiness', delta: 3 }],
            else: [{ log: 'The principal backed the teacher. I am now a troublemaker who also complains.', kind: 'bad' }, { grade: -3 }, { stat: 'happiness', delta: -4 }],
          },
        ],
      },
      {
        id: 'parent',
        label: 'Ask {{mother}} to step in',
        conditions: [{ hasPerson: ['mother'] }],
        effects: [
          {
            chance: 0.6,
            then: [{ log: '{{mother}} came in for a meeting and was terrifyingly polite. My grades improved immediately.', kind: 'good' }, { grade: 4 }, { relationship: 'mother', delta: 3 }, { stat: 'happiness', delta: 2 }],
            else: [{ log: '{{mother}} came in, the meeting went badly, and now two adults think I am a problem.' }, { stat: 'happiness', delta: -3 }, { grade: -1 }],
          },
        ],
      },
      {
        id: 'prove',
        label: 'Prove them wrong quietly',
        effects: [{ log: 'I kept my head down and made every piece of work undeniable. Slowly, the red ink dried up.', kind: 'good' }, { stat: 'smarts', delta: 2 }, { grade: 2 }, { stat: 'happiness', delta: -2 }, { karma: 1 }, { energy: -1 }],
      },
      {
        id: 'quit',
        label: 'Stop trying',
        effects: [{ log: 'If the grade is decided in advance, why bother? I stopped bothering. Freeing, briefly.', kind: 'bad' }, { grade: -6 }, { stat: 'happiness', delta: 1 }],
      },
    ],
  },
  {
    id: 'sl_pop_quiz',
    category: 'school',
    title: 'Ten questions',
    text: 'My teacher smiled, which is never good, and told us to take out a blank sheet of paper. Ten questions on the chapter I was definitely going to read tonight.',
    minAge: 11,
    maxAge: 17,
    weight: 2,
    cooldown: 2,
    // The written quiz. teen_years has its own "did not do the reading" card (tn_pop_quiz); the two are never told
    // back to back.
    conditions: [{ enrolled: true }, { stage: ['middle', 'high'] }, { not: { sinceEvent: 'tn_pop_quiz', lte: 2 } }],
    choices: [
      {
        id: 'know',
        label: 'Actually know it',
        conditions: [{ stat: 'smarts', gte: 60 }],
        effects: [
          {
            chance: 0.8,
            then: [{ log: 'One skim of that chapter was enough, apparently. Nine out of ten. I told nobody about the skim.', kind: 'good' }, { grade: 3 }, { stat: 'happiness', delta: 1 }],
            else: [{ log: 'I knew the gist. All ten questions were about the footnotes.' }, { grade: 1 }, { stat: 'happiness', delta: -1 }],
          },
        ],
      },
      {
        id: 'guess',
        label: 'Invent answers boldly',
        effects: [
          {
            random: [
              { weight: 40, effects: [{ log: 'I made up every answer with total conviction. Enough of them were right to pass.' }, { grade: 2 }, { stat: 'happiness', delta: 2 }] },
              { weight: 60, effects: [{ log: 'My answers were bold, detailed and nearly all invented. The red pen had a long night.', kind: 'bad' }, { grade: -3 }, { stat: 'happiness', delta: -2 }] },
            ],
          },
        ],
      },
      {
        id: 'peek',
        label: 'Peek at the next desk',
        effects: [
          { karma: -3 },
          {
            chance: 0.65,
            then: [{ log: 'Two answers drifted over from the next desk. Nobody noticed. I did not feel great about it.' }, { grade: 2 }],
            else: [{ log: 'The teacher caught me looking. My paper came back with a zero and a note to take home.', kind: 'bad' }, { grade: -5 }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'nurse',
        label: 'Ask for the nurse',
        effects: [
          {
            chance: 0.5,
            then: [{ log: "A sudden, mysterious headache got me an hour on the nurse's cot. The quiz went on without me." }, { grade: -1 }, { stat: 'happiness', delta: 3 }],
            else: [{ log: "The teacher said 'after the quiz'. My headache became real." }, { grade: -3 }, { stat: 'happiness', delta: -1 }],
          },
        ],
      },
    ],
  },
  {
    id: 'sl_hallway_fight',
    category: 'school',
    title: 'The circle',
    text: 'Two older kids cornered {{person}} by the lockers and started shoving. A circle formed around them. {{person}} looked straight at me.',
    minAge: 11,
    maxAge: 17,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ enrolled: true }, { stage: ['middle', 'high'] }],
    person: { kind: ['friend', 'bestFriend', 'classmate'] },
    choices: [
      {
        id: 'stepin',
        label: 'Step in',
        effects: [
          { karma: 3 },
          { relationship: 'person', delta: 8 },
          {
            chance: 0.5,
            then: [{ log: 'I pushed between them and shouted something incoherent. The bullies left. {{person}} hugged me.', kind: 'good' }, { stat: 'happiness', delta: 5 }],
            else: [{ log: 'I stepped in and caught an elbow to the face. Heroism has a bruise-shaped cost.', kind: 'bad' }, { injury: 4 }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
      {
        id: 'teacher',
        label: 'Get a teacher',
        effects: [{ log: 'I ran for a teacher. By the time we got back, the crowd was gone. {{person}} was shaken but okay.' }, { karma: 2 }, { relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 1 }],
      },
      {
        id: 'film',
        label: 'Film it',
        // A phone that films, in every pocket.
        conditions: [{ year: { gte: 2010 } }],
        effects: [
          { karma: -4 },
          { relationship: 'person', delta: -8 },
          {
            chance: 0.5,
            then: [{ log: 'The video went around the whole school. {{person}} did not speak to me for weeks.' }, { stat: 'happiness', delta: -3 }, { fame: 2 }],
            else: [{ log: 'A teacher confiscated my phone mid-recording and gave me a lecture about bystanders.', kind: 'bad' }, { stat: 'happiness', delta: -4 }, { grade: -1 }],
          },
        ],
      },
    ],
  },
  {
    id: 'sl_sports_tryout',
    category: 'school',
    title: 'One player short',
    text: 'The coach stopped me in the hallway. The school team is one player short for the season, and somebody told her I am fast. Practice is this afternoon, and she wants an answer now.',
    minAge: 11,
    maxAge: 17,
    weight: 1.5,
    // A coach asks once; and not right after teen_years' tryouts (tn_tryouts), nor once I am on that team.
    once: true,
    conditions: [{ enrolled: true }, { stage: ['middle', 'high'] }, { not: { sinceEvent: 'tn_tryouts', lte: 2 } }, { not: { flag: 'tn_team' } }],
    choices: [
      {
        id: 'tryout',
        label: 'Say yes and run hard',
        effects: [
          {
            chance: 0.4,
            then: [{ log: 'I said yes and ran until my legs were jelly. She kept me on the team. My grin was permanent.', kind: 'good' }, { stat: 'happiness', delta: 6 }, { stat: 'health', delta: 3 }, { queue: 'sl_big_game' }],
            else: [{ log: 'I ran my hardest and still came in last. Someone had oversold me. She found another player.' }, { stat: 'happiness', delta: -4 }, { stat: 'health', delta: 1 }],
          },
        ],
      },
      {
        id: 'showoff',
        label: 'Show off my speed',
        conditions: [{ trait: 'athletic' }],
        effects: [
          {
            chance: 0.85,
            then: [{ log: 'The coach stopped the drill to watch me run. Starting lineup, first day.', kind: 'good' }, { stat: 'happiness', delta: 8 }, { stat: 'health', delta: 3 }, { fame: 1 }, { queue: 'sl_big_game' }],
            else: [{ log: 'I pulled a muscle showing off in the warm-up. The coach was not impressed by the limp.', kind: 'bad' }, { injury: 3 }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'mascot',
        label: 'Offer to be the mascot',
        effects: [{ log: 'I said I was more of a mascot person. The costume smelled of history, but the crowd loved me.', kind: 'good' }, { stat: 'happiness', delta: 4 }, { fame: 1 }, { karma: 1 }],
      },
      {
        id: 'skip',
        label: 'Say I am busy',
        effects: [{ log: 'I said I was busy and watched practice from the bleachers with a snack. Zero risk, excellent snack.' }, { stat: 'happiness', delta: 1 }, { stat: 'health', delta: -1 }],
      },
    ],
  },
  {
    id: 'sl_big_game',
    category: 'school',
    title: 'The big game',
    text: 'The biggest game of the season. The bleachers are full, my family is holding a sign with my name on it, and the coach has just pointed at me.',
    minAge: 11,
    maxAge: 18,
    weight: 1,
    once: true,
    followUpOnly: true,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'hard',
        label: 'Play hard',
        effects: [
          {
            random: [
              { weight: 45, effects: [{ log: 'I played the game of my life. We won. Someone chanted my name, briefly and off-key.', kind: 'milestone' }, { stat: 'happiness', delta: 8 }, { stat: 'health', delta: 2 }, { fame: 2 }] },
              { weight: 40, effects: [{ log: "We lost narrowly. I played well. The coach said 'proud of you', and I think he meant it." }, { stat: 'happiness', delta: 3 }, { stat: 'health', delta: 1 }] },
              { weight: 15, effects: [{ log: 'I went down hard in the second half and limped off. The season ended early for me.', kind: 'bad' }, { injury: 6 }, { stat: 'happiness', delta: -4 }] },
            ],
          },
        ],
      },
      {
        id: 'safe',
        label: 'Play it safe',
        effects: [{ log: 'I played a careful, unremarkable game. We drew. Nobody got hurt and nobody chanted.' }, { stat: 'happiness', delta: 2 }, { stat: 'health', delta: 1 }],
      },
    ],
  },
  {
    id: 'sl_school_play',
    category: 'school',
    title: 'School play',
    text: 'Auditions for the school play are this week. The lead has a lot of lines. The tree in the second act has none, but it has a very good costume.',
    minAge: 8,
    maxAge: 16,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ enrolled: true }, { stage: ['primary', 'middle', 'high'] }],
    choices: [
      {
        id: 'lead',
        label: 'Audition for the lead',
        effects: [
          {
            chance: 0.35,
            then: [{ log: 'I got the lead. Weeks of rehearsals, one standing ovation, and a brief taste of fame.', kind: 'milestone' }, { stat: 'happiness', delta: 8 }, { fame: 2 }, { stat: 'smarts', delta: 1 }],
            else: [{ log: "I did not get the lead. I got 'Villager 3'. Villager 3 has one line, which I delivered perfectly." }, { stat: 'happiness', delta: 1 }],
          },
        ],
      },
      {
        id: 'improv',
        label: 'Improvise something strange',
        conditions: [{ trait: 'creative' }],
        effects: [
          {
            chance: 0.7,
            then: [{ log: "I improvised at the audition. The director wrote me a part. Reviews: 'strange, but memorable'.", kind: 'good' }, { stat: 'happiness', delta: 7 }, { fame: 2 }],
            else: [{ log: "My improvisation ran long. The director said 'thank you' before I had finished." }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
      {
        id: 'backstage',
        label: 'Work backstage instead',
        effects: [{ log: 'I ran the lights and never missed a cue. The applause was for the cast, but I knew.', kind: 'good' }, { stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 2 }, { karma: 1 }],
      },
      {
        id: 'tree',
        label: 'Be the tree',
        effects: [{ log: 'I was the tree. I did not move for forty minutes. It was, honestly, a kind of meditation.' }, { stat: 'happiness', delta: 2 }, { stat: 'health', delta: 1 }],
      },
    ],
  },
  {
    id: 'sl_quiz_team',
    category: 'school',
    title: 'Quiz team',
    text: 'The school quiz team needs one more member for the inter-school finals. The teacher scanned the room and landed on me, mostly because I made eye contact.',
    minAge: 12,
    maxAge: 17,
    weight: 1,
    cooldown: 3,
    conditions: [{ enrolled: true }, { stage: ['middle', 'high'] }],
    choices: [
      {
        id: 'prepare',
        label: 'Join and prepare',
        effects: [
          { energy: -1 },
          { stat: 'smarts', delta: 3 },
          { stat: 'happiness', delta: -1 },
          {
            random: [
              { weight: 40, effects: [{ log: 'We won the finals on a question about volcanoes. I knew it because of a rock I once owned.', kind: 'good' }, { stat: 'happiness', delta: 6 }, { fame: 1 }, { grade: 3 }] },
              { weight: 60, effects: [{ log: 'We lost in the semifinals. I did learn every capital city, which has to count for something.' }, { stat: 'happiness', delta: 1 }, { grade: 1 }] },
            ],
          },
        ],
      },
      {
        id: 'wing',
        label: 'Join and wing it',
        conditions: [{ stat: 'smarts', gte: 65 }],
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'I winged it and carried the team. Natural talent, questionable preparation.', kind: 'good' }, { stat: 'happiness', delta: 5 }, { fame: 1 }],
            else: [{ log: 'I winged it and buzzed in wrong five times. The team captain has not forgiven me.', kind: 'bad' }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Decline politely',
        effects: [{ log: 'I said I was busy. I was not. I watched the finals from the back, relieved and sorry in equal parts.' }, { stat: 'happiness', delta: 1 }],
      },
    ],
  },
  {
    id: 'sl_class_president',
    category: 'school',
    title: 'Class president',
    text: "Elections for class president are next week. The frontrunner's entire platform is 'longer lunch'. It is, annoyingly, a strong platform.",
    minAge: 14,
    maxAge: 17,
    weight: 1,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['high'] }],
    choices: [
      {
        id: 'serious',
        label: 'Run on real ideas',
        effects: [
          {
            chance: 0.45,
            then: [
              { log: 'I ran on a platform of actual changes and, astonishingly, won. The responsibility hit immediately.', kind: 'milestone' },
              { stat: 'happiness', delta: 7 },
              { fame: 2 },
              { stat: 'smarts', delta: 2 },
              { flag: 'sl_class_president', set: true },
              { queue: 'sl_president_term' },
            ],
            else: [{ log: "I lost to 'longer lunch'. Democracy is a humbling business." }, { stat: 'happiness', delta: -3 }, { stat: 'smarts', delta: 1 }],
          },
        ],
      },
      {
        id: 'joke',
        label: 'Run as a joke',
        effects: [
          {
            chance: 0.3,
            then: [
              { log: "My joke campaign, 'a hamster in every classroom', won by a landslide. Now I owe everyone hamsters.", kind: 'milestone' },
              { stat: 'happiness', delta: 6 },
              { fame: 3 },
              { flag: 'sl_class_president', set: true },
              { queue: 'sl_president_term' },
            ],
            else: [{ log: 'My joke campaign got laughs but no votes. Worth it for the posters.' }, { stat: 'happiness', delta: 2 }],
          },
        ],
      },
      {
        id: 'manage',
        label: "Run the frontrunner's campaign",
        effects: [{ log: "I ran the frontrunner's campaign instead. Longer lunch passed. I am the power behind the throne.", kind: 'good' }, { stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 2 }, { karma: 1 }],
      },
      {
        id: 'abstain',
        label: 'Stay out of it',
        effects: [{ log: 'I did not run and did not vote. Lunch stayed exactly the same length.' }, { stat: 'happiness', delta: 1 }],
      },
    ],
  },
  {
    id: 'sl_president_term',
    category: 'school',
    title: 'First term',
    text: 'First semester as class president. The student council has a budget of {{$200}}, two broken chairs and a list of demands as long as the hallway.',
    minAge: 14,
    maxAge: 18,
    weight: 1,
    once: true,
    followUpOnly: true,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'vending',
        label: 'Fix the vending machine',
        effects: [{ log: 'I spent the entire budget getting the vending machine repaired. Approval ratings: astronomical.', kind: 'good' }, { stat: 'happiness', delta: 4 }, { fame: 1 }, { karma: 1 }],
      },
      {
        id: 'dance',
        label: 'Fund a school dance',
        effects: [
          {
            chance: 0.6,
            then: [{ log: 'I pulled the dance off. It was awkward and wonderful. Someone cried in a good way.', kind: 'good' }, { stat: 'happiness', delta: 7 }, { fame: 2 }, { karma: 1 }],
            else: [{ log: 'My dance budget ran out before the music did. The DJ left at nine. Riots, metaphorically.', kind: 'bad' }, { stat: 'happiness', delta: -3 }, { fame: -1 }],
          },
        ],
      },
      {
        id: 'skim',
        label: 'Skim a little off',
        effects: [
          { karma: -5 },
          {
            chance: 0.7,
            then: [{ log: "A small 'administrative fee' found its way into my pocket. Nobody audited the student council.", kind: 'money' }, { money: 60 }, { stat: 'happiness', delta: 1 }],
            else: [{ log: 'The treasurer noticed. I was impeached in a school assembly, a sentence I will never forget.', kind: 'bad' }, { stat: 'happiness', delta: -8 }, { fame: -2 }, { grade: -3 }],
          },
        ],
      },
    ],
  },
  {
    id: 'sl_cheating_temptation',
    category: 'school',
    title: 'Exam temptation',
    text: "Final exam tomorrow. {{person}} says {{they}} got hold of the questions from someone who knows someone. {{They}} offered to share, for free, 'because we're friends'.",
    minAge: 14,
    maxAge: 22,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ enrolled: true }, { stage: ['high', 'university', 'graduate'] }],
    person: { kind: ['friend', 'bestFriend', 'classmate'] },
    choices: [
      {
        id: 'cheat',
        label: 'Take the answers',
        effects: [
          { karma: -4 },
          {
            random: [
              { weight: 50, effects: [{ log: 'The questions were real. I aced the exam and felt sick about it for a week.' }, { grade: 8 }, { stat: 'happiness', delta: -1 }, { flag: 'sl_cheated_exam', set: true }] },
              { weight: 25, effects: [{ log: "The questions were from last year's exam. I had memorized the wrong answers to the wrong test.", kind: 'bad' }, { grade: -6 }, { stat: 'happiness', delta: -3 }] },
              { weight: 25, effects: [{ log: 'The leak was traced. {{person}} and I were both caught. Zero on the exam and a note on my record.', kind: 'bad' }, { grade: -15 }, { stat: 'happiness', delta: -6 }, { relationship: 'person', delta: -5 }] },
            ],
          },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse and study',
        effects: [
          { karma: 3 },
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.6,
            then: [{ log: 'I studied properly and did fine on my own. Clean conscience, honest grade.', kind: 'good' }, { grade: 4 }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'I studied until two and still did badly. Honesty is its own reward, which is frustrating.' }, { grade: -2 }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
      {
        id: 'report',
        label: 'Report the leak',
        effects: [
          { karma: 2 },
          { relationship: 'person', delta: -15 },
          {
            chance: 0.7,
            then: [{ log: 'The school canceled and rewrote the exam. {{person}} knew who talked. We are no longer friends.' }, { stat: 'happiness', delta: -3 }, { grade: 1 }],
            else: [{ log: 'The school did nothing, {{person}} found out, and I got nothing but a reputation.', kind: 'bad' }, { stat: 'happiness', delta: -5 }],
          },
        ],
      },
    ],
  },
  {
    id: 'sl_lab_mishap',
    category: 'school',
    title: 'Chemistry mishap',
    text: "Chemistry lab. The instructions say 'add slowly'. My lab partner is half asleep and the beaker is already starting to do something interesting.",
    minAge: 14,
    maxAge: 22,
    weight: 1,
    cooldown: 3,
    conditions: [{ enrolled: true }, { stage: ['high', 'university', 'graduate'] }],
    choices: [
      {
        id: 'procedure',
        label: 'Follow the procedure',
        effects: [{ log: 'I added slowly, like the sheet said. The reaction fizzed politely and we got full credit.', kind: 'good' }, { grade: 3 }, { stat: 'smarts', delta: 1 }],
      },
      {
        id: 'fast',
        label: 'Speed it up',
        effects: [
          {
            chance: 0.6,
            then: [{ log: 'I dumped it in. Dramatic, foamy, over in seconds. The whole lab was impressed and alarmed.' }, { stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 1 }],
            else: [{ log: 'The beaker overflowed onto my hand. A trip to first aid and a scar-shaped lesson about patience.', kind: 'bad' }, { injury: 4 }, { grade: -2 }],
          },
        ],
      },
      {
        id: 'partner',
        label: 'Wake my partner up',
        effects: [{ log: 'I nudged my partner awake. We finished slowly and correctly. Teamwork, under duress.' }, { karma: 1 }, { grade: 2 }, { stat: 'happiness', delta: 1 }],
      },
    ],
  },
  {
    id: 'sl_scholarship_essay',
    category: 'school',
    title: 'Scholarship essay',
    text: "A local foundation is offering a {{$2500}} scholarship for the best essay on 'what I would change about my town'. The deadline is Sunday. I have opinions about my town.",
    minAge: 16,
    maxAge: 18,
    weight: 0.8,
    once: true,
    conditions: [{ hasPerson: ['mother'] }, { enrolled: true }, { stage: ['high'] }],
    choices: [
      {
        id: 'heart',
        label: 'Write from the heart',
        effects: [
          { energy: -1 },
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.35,
            then: [{ log: 'My essay on the broken crosswalk by school won. {{$2500}}, a handshake and a photo in the paper.', kind: 'milestone' }, { money: 2500 }, { stat: 'happiness', delta: 8 }, { fame: 2 }],
            else: [{ log: 'I did not win, but the judges sent a kind note. Honorable mention. Dishonorable bank balance.' }, { stat: 'happiness', delta: 1 }],
          },
        ],
      },
      {
        id: 'recycle',
        label: 'Recycle an old essay',
        effects: [
          {
            chance: 0.1,
            then: [{ log: 'An old essay about recycling won a scholarship. The irony was not lost on me.', kind: 'money' }, { money: 2500 }, { stat: 'happiness', delta: 6 }, { karma: -1 }],
            else: [{ log: 'The recycled essay went nowhere. I spent Sunday doing nothing instead. A fair trade.' }, { stat: 'happiness', delta: 1 }],
          },
        ],
      },
      {
        id: 'proofread',
        label: 'Ask {{mother}} to proofread',
        conditions: [{ hasPerson: ['mother'] }],
        effects: [
          { energy: -1 },
          { relationship: 'mother', delta: 3 },
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.3,
            then: [{ log: "{{mother}}'s edits made it sharper. It won {{$2500}}, and a mother who will never let me forget it.", kind: 'milestone' }, { money: 2500 }, { stat: 'happiness', delta: 7 }, { fame: 1 }],
            else: [{ log: "Even with {{mother}}'s edits, it did not win. We had a nice evening arguing about commas." }, { stat: 'happiness', delta: 2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'sl_graduation_jitters',
    category: 'school',
    title: 'Graduation day',
    text: 'Graduation is next week. Cap, gown, folding chairs. My name will be read aloud in front of everyone, and I have just realized I do not know how to walk normally.',
    minAge: 17,
    maxAge: 18,
    weight: 2,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['high'] }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'walk',
        label: 'Walk like a normal person',
        effects: [
          {
            chance: 0.75,
            then: [{ log: 'I walked, took the diploma, shook the hand. Nobody noticed a thing, as planned. {{person}} cried.', kind: 'good' }, { stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 3 }],
            else: [{ log: 'I tripped on the steps. The applause got louder, which was somehow worse. {{person}} cried anyway.' }, { stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 3 }],
          },
        ],
      },
      {
        id: 'dance',
        label: 'Do a little dance',
        effects: [
          {
            random: [
              { weight: 60, effects: [{ log: 'I danced across the stage. The crowd roared. The principal pretended to disapprove.', kind: 'good' }, { stat: 'happiness', delta: 7 }, { fame: 2 }] },
              { weight: 40, effects: [{ log: "I danced and nobody laughed. The silence had texture. {{person}} said 'brave' afterwards.", kind: 'bad' }, { stat: 'happiness', delta: -3 }] },
            ],
          },
        ],
      },
      {
        id: 'hug',
        label: 'Stop to hug {{person}}',
        effects: [
          { karma: 1 },
          { relationship: 'person', delta: 6 },
          {
            chance: 0.7,
            then: [{ log: 'I skipped the handshake and hugged {{person}} in the front row. The photo is on the fridge now.', kind: 'good' }, { stat: 'happiness', delta: 5 }],
            else: [{ log: 'I hugged {{person}} and missed my cue. The principal read the next name. My diploma came by mail.' }, { stat: 'happiness', delta: 1 }],
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------- university
  {
    id: 'sl_lecture_nap',
    category: 'school',
    title: 'Lecture nap',
    text: 'I fell asleep in a two-hour lecture and woke to an empty hall and a whiteboard full of symbols. {{person}} was still packing up and had seen everything.',
    minAge: 18,
    maxAge: 22,
    weight: 2,
    cooldown: 2,
    conditions: [{ enrolled: true }, { stage: ['university', 'graduate'] }],
    person: { kind: ['friend', 'bestFriend', 'classmate'], minAge: 17 },
    choices: [
      {
        id: 'notes',
        label: "Borrow {{person}}'s notes",
        effects: [
          { relationship: 'person', delta: 2 },
          {
            chance: 0.7,
            then: [{ log: '{{person}} lent me {{their}} notes. They were color-coded. I owe {{them}} a coffee for life.', kind: 'good' }, { grade: 2 }, { stat: 'happiness', delta: 1 }],
            else: [{ log: "{{person}}'s notes were two words and a doodle. We were, it turns out, equally lost." }, { stat: 'happiness', delta: -1 }],
          },
        ],
      },
      {
        id: 'email',
        label: 'Ask the professor',
        effects: [
          {
            chance: 0.5,
            then: [{ log: "The professor lent me the slides with one piece of advice: 'Sleep at night.' Fair.", kind: 'good' }, { grade: 2 }, { stat: 'smarts', delta: 1 }],
            else: [{ log: "The professor said it 'was covered in lecture'. Technically correct, and no help at all." }, { grade: -1 }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
      {
        id: 'wing',
        label: 'Wing it',
        effects: [{ log: 'I took the afternoon off instead. The symbols showed up on the exam. It was not a happy reunion.', kind: 'bad' }, { grade: -4 }, { stat: 'happiness', delta: 2 }],
      },
    ],
  },
  {
    id: 'sl_office_hours',
    category: 'school',
    title: 'Research assistant',
    text: "After office hours, my professor asked if I wanted to work as a research assistant this semester. It pays {{$800}} and involves a lot of spreadsheets and 'some' weekends.",
    minAge: 18,
    maxAge: 22,
    weight: 0.8,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['university', 'graduate'] }],
    choices: [
      {
        id: 'accept',
        label: 'Accept',
        effects: [
          { log: "I spent my weekends cleaning data. Exhausting, but my name made it into a paper's acknowledgments.", kind: 'money' },
          { money: 800 },
          { stat: 'smarts', delta: 4 },
          { grade: 2 },
          { energy: -2 },
          { stat: 'happiness', delta: -1 },
        ],
      },
      {
        id: 'negotiate',
        label: 'Negotiate',
        effects: [
          {
            chance: 0.4,
            then: [{ log: 'I asked for {{$1200}} and no weekends. The professor blinked and agreed. Spreadsheets with dignity.', kind: 'money' }, { money: 1200 }, { stat: 'smarts', delta: 3 }, { grade: 2 }],
            else: [{ log: 'I asked for more. The professor politely gave the job to the student who did not.', kind: 'bad' }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Decline',
        effects: [{ log: 'I declined. My weekends stayed mine. I spent most of them thinking about {{$800}}.' }, { stat: 'happiness', delta: 1 }],
      },
    ],
  },
  {
    id: 'sl_night_before_exam',
    category: 'school',
    title: 'Night before exam',
    text: 'The night before my biggest exam, the whole floor of my dorm is going to a party. Someone has a speaker, someone has drinks, and my notes look very lonely.',
    minAge: 18,
    maxAge: 22,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ enrolled: true }, { stage: ['university', 'graduate'] }],
    choices: [
      {
        id: 'party',
        label: 'Go to the party',
        effects: [
          { stat: 'happiness', delta: 5 },
          {
            random: [
              { weight: 50, effects: [{ log: 'The party was great. The exam was not. I wrote an essay I do not fully remember.', kind: 'bad' }, { grade: -6 }] },
              { weight: 30, effects: [{ log: 'I went, danced, left early. The exam was fine. Balance, apparently, exists.' }, { grade: -1 }] },
              { weight: 20, effects: [{ log: 'I drank more than I meant to and slept through the exam entirely. A costly, headachey lesson.', kind: 'bad' }, { grade: -10 }, { stat: 'health', delta: -3 }, { stat: 'happiness', delta: -4 }] },
            ],
          },
        ],
      },
      {
        id: 'study',
        label: 'Study all night',
        effects: [{ log: 'I studied until sunrise. I knew everything and felt nothing. Passed with a number I was proud of.', kind: 'good' }, { grade: 5 }, { stat: 'smarts', delta: 2 }, { stat: 'health', delta: -2 }, { stat: 'happiness', delta: -3 }],
      },
      {
        id: 'hour',
        label: 'One hour, then study',
        effects: [
          {
            chance: 0.6,
            then: [{ log: 'One hour of party, then back to the notes. The best of both, and I was asleep by midnight.', kind: 'good' }, { stat: 'happiness', delta: 3 }, { grade: 2 }],
            else: [{ log: 'One hour became four. I studied in a blur. Average grade, excellent memories.' }, { stat: 'happiness', delta: 3 }, { grade: -2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'sl_study_abroad',
    category: 'school',
    title: 'Study abroad',
    text: 'The international office offered me a semester abroad. New city, new language, new everything. It costs {{$3000}} on top of tuition, and the deposit is due next week.',
    minAge: 18,
    maxAge: 21,
    weight: 0.8,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['university'] }],
    choices: [
      {
        id: 'pay',
        label: 'Pay and go',
        hint: 'Costs {{$3000}}',
        conditions: [{ money: { gte: 3000 } }],
        effects: [
          { money: -3000 },
          { log: 'I spent a semester abroad, got lost on purpose, and came back a slightly different person.', kind: 'milestone' },
          { stat: 'happiness', delta: 10 },
          { stat: 'smarts', delta: 6 },
          { stat: 'looks', delta: 1 },
          { counter: 'vacations' },
        ],
      },
      {
        id: 'grant',
        label: 'Apply for a grant',
        effects: [
          { energy: -1 },
          {
            chance: 0.4,
            then: [{ log: 'The grant covered everything. A free semester abroad. I nearly hugged the office clerk.', kind: 'milestone' }, { stat: 'happiness', delta: 10 }, { stat: 'smarts', delta: 6 }, { counter: 'vacations' }],
            else: [{ log: 'The grant fell through and the deadline passed. I watched everyone else leave from my window.', kind: 'bad' }, { stat: 'happiness', delta: -4 }],
          },
        ],
      },
      {
        id: 'parents',
        label: 'Ask {{parents}} for help',
        conditions: [{ hasPerson: ['mother', 'father'] }],
        effects: [
          {
            chance: 0.35,
            then: [
              { log: '{{parents}} scraped the money together. I sent a postcard from every city. Every one is still on the fridge.', kind: 'milestone' },
              { stat: 'happiness', delta: 10 },
              { stat: 'smarts', delta: 6 },
              { relationship: 'mother', delta: 4 },
              { relationship: 'father', delta: 4 },
              { counter: 'vacations' },
            ],
            else: [{ log: '{{parents}} could not manage it. We had a long, kind conversation instead. I stayed.' }, { stat: 'happiness', delta: -3 }, { relationship: 'mother', delta: 2 }, { relationship: 'father', delta: 2 }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Decline the offer',
        effects: [{ log: "I turned it down. Home had its charms, I told myself, mostly while looking at other people's photos." }, { stat: 'happiness', delta: -2 }],
      },
    ],
  },
  {
    id: 'sl_thesis_crisis',
    category: 'school',
    title: 'Thesis crisis',
    text: "Three weeks before my thesis is due, my main argument fell apart during a routine meeting. My advisor said 'interesting' in a tone that meant the opposite.",
    minAge: 21,
    maxAge: 23,
    weight: 1.5,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['university', 'graduate'] }],
    choices: [
      {
        id: 'rebuild',
        label: 'Rebuild it from scratch',
        effects: [
          { stat: 'health', delta: -4 },
          { stat: 'happiness', delta: -4 },
          { stat: 'smarts', delta: 5 },
          {
            chance: 0.7,
            then: [{ log: "Three weeks of caffeine and panic. A better argument. My advisor said 'interesting' and meant it.", kind: 'good' }, { grade: 8 }],
            else: [{ log: 'I rebuilt it and ran out of time anyway. Submitted something half-finished and fully exhausted.', kind: 'bad' }, { grade: -3 }],
          },
        ],
      },
      {
        id: 'extension',
        label: 'Ask for an extension',
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'Extension granted. One extra month turned the wreck into something I was proud of.', kind: 'good' }, { grade: 6 }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'Extension denied. I patched the holes with footnotes and hoped my committee was tired.' }, { grade: -1 }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'submit',
        label: 'Submit what I have',
        effects: [{ log: 'I handed it in, holes and all. My committee noticed. I barely passed and slept for two days.' }, { grade: -5 }, { stat: 'happiness', delta: 2 }],
      },
    ],
  },
  {
    id: 'sl_dorm_fridge',
    category: 'school',
    title: 'Fridge thief',
    text: 'Someone on my floor has been eating my labeled food from the shared fridge. Today my leftover noodles vanished, and the only evidence is a suspiciously well-fed roommate.',
    minAge: 18,
    maxAge: 22,
    weight: 1.2,
    cooldown: 2,
    // Not within two years of young_adult's ya_roommate_food, the other roommate who eats my food.
    conditions: [{ enrolled: true }, { stage: ['university', 'graduate'] }, { not: { sinceEvent: 'ya_roommate_food', lte: 2 } }],
    choices: [
      {
        id: 'confront',
        label: 'Confront the suspect',
        effects: [
          {
            chance: 0.6,
            then: [
              { log: 'I confronted them. They confessed, apologized, and bought me a week of noodles. Justice.', kind: 'good' },
              { stat: 'happiness', delta: 3 },
              { chance: 0.3, then: [{ newPerson: { kind: 'friend', relationship: 55, log: 'Oddly, the noodle thief and I became friends. {{person}} still owes me noodles.' } }] },
            ],
            else: [{ log: 'They denied everything with noodle breath. My fridge war escalated.', kind: 'bad' }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'trap',
        label: 'Set a spicy trap',
        effects: [
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ log: 'I left out a container of extremely spicy noodles. The thief identified themselves by screaming.', kind: 'good' }, { stat: 'happiness', delta: 5 }],
            else: [{ log: 'I forgot about the trap and ate the spicy noodles myself at 2 a.m. Nobody won.', kind: 'bad' }, { stat: 'happiness', delta: -3 }, { stat: 'health', delta: -1 }],
          },
        ],
      },
      {
        id: 'fridge',
        label: 'Buy a mini fridge',
        hint: 'Costs {{$120}}',
        conditions: [{ money: { gte: 120 } }],
        effects: [{ money: -120 }, { log: 'I bought a mini fridge for my room. The noodles are safe. The room is slightly louder.', kind: 'money' }, { stat: 'happiness', delta: 2 }],
      },
      {
        id: 'letgo',
        label: 'Let it go',
        effects: [{ log: 'I let it go, mostly. I now label my food with a passive-aggressive smiley face.' }, { karma: 1 }, { stat: 'happiness', delta: -2 }],
      },
    ],
  },
];

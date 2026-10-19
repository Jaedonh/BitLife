import type { EventDef } from '@/engine/events/schema';

/**
 * Ages 18-29: university, first apartments, bad landlords, worse roommates,
 * student debt, backpacking, weddings, networking, scams, the quarter-life
 * wobble and the first serious relationship. Follow-ups (followUpOnly) are
 * queued by the events that set them up and never fire on their own.
 * Players turn 18 between 1993 and 2028: phone-and-app cards carry a { year }
 * gate and everything else is worded to read right in either decade.
 */
export const YOUNG_ADULT_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ university
  {
    id: 'ya_dorm_roommate',
    category: 'random',
    title: 'Three a.m. drums',
    text: 'My dorm roommate practices the drums at three in the morning and insists it helps them think. The walls are thin and so is my patience.',
    minAge: 18,
    maxAge: 23,
    weight: 2,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['university'] }],
    choices: [
      {
        id: 'confront',
        label: 'Talk it out',
        effects: [
          {
            chance: 0.6,
            then: [{ log: 'We agreed on a schedule: no drums after midnight. Civilization prevailed.', kind: 'good' }, { stat: 'happiness', delta: 4 }],
            else: [{ log: 'They said I was stifling their art. The drums got louder.', kind: 'bad' }, { stat: 'happiness', delta: -4 }],
          },
        ],
      },
      {
        id: 'earplugs',
        label: 'Buy industrial earplugs',
        hint: '{{$40}}',
        effects: [
          { money: -40 },
          { stat: 'happiness', delta: 2 },
          { log: 'I bought airport-grade earplugs. I now sleep like a stone and occasionally through my alarm.' },
          { chance: 0.3, then: [{ grade: -2 }, { log: 'I slept through one lecture too many.', kind: 'bad' }] },
        ],
      },
      {
        id: 'transfer',
        label: 'Request a room transfer',
        effects: [
          {
            chance: 0.5,
            then: [
              { log: 'Housing moved me in with a quiet physics student who only speaks before exams. Bliss.', kind: 'good' },
              { stat: 'happiness', delta: 5 },
              { newPerson: { kind: 'friend', relationship: 50, log: 'My new roommate {{person}} and I actually got along.' } },
            ],
            else: [{ log: 'Housing said the waiting list was eleven people long. I learned to love the drums.' }, { stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 1 }],
          },
        ],
      },
    ],
  },
  {
    id: 'ya_all_nighter',
    category: 'random',
    title: 'Night before finals',
    text: 'Finals are tomorrow and I have read exactly none of the material. The library is open all night and so, apparently, am I.',
    minAge: 18,
    maxAge: 24,
    weight: 2,
    cooldown: 2,
    conditions: [{ enrolled: true }, { stage: ['university'] }],
    person: { kind: ['friend', 'bestFriend', 'classmate'] },
    choices: [
      {
        id: 'cram',
        label: 'Pull an all-nighter',
        effects: [
          { stat: 'health', delta: -3 },
          {
            chance: 0.65,
            then: [{ grade: 6 }, { log: 'I crammed a semester into nine hours and somehow it stuck. I slept for a day afterward.', kind: 'good' }],
            else: [{ grade: 1 }, { stat: 'happiness', delta: -3 }, { log: 'I crammed until dawn and then wrote nonsense. The exam and I were both tired.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'sleep',
        label: 'Sleep and hope',
        effects: [
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.4,
            then: [{ grade: 3 }, { log: 'Rested and relaxed, I guessed well. Sometimes the universe is kind.', kind: 'good' }],
            else: [{ grade: -5 }, { stat: 'happiness', delta: -4 }, { log: 'Rested and relaxed, I failed cheerfully.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'group',
        label: "Join {{person}}'s study group",
        effects: [
          { energy: -1 },
          { relationship: 'person', delta: 3 },
          {
            chance: 0.7,
            then: [{ grade: 4 }, { stat: 'smarts', delta: 1 }, { log: '{{person}} explained the whole course in two hours using snacks as diagrams. I passed.', kind: 'good' }],
            else: [{ grade: 1 }, { log: "The study group mostly discussed {{person}}'s ex. I learned a lot, none of it on the exam." }],
          },
        ],
      },
    ],
  },
  {
    id: 'ya_campus_club',
    category: 'random',
    title: 'Clubs fair',
    text: 'Clubs fair on the quad. A hundred tables, a thousand flyers, and someone in a full dinosaur costume shouting about the improv society.',
    minAge: 18,
    maxAge: 22,
    weight: 2,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['university'] }],
    choices: [
      {
        id: 'debate',
        label: 'Join the debate society',
        effects: [
          { stat: 'smarts', delta: 4 },
          { stat: 'happiness', delta: 2 },
          { log: 'I joined debate. I now argue about everything, including things I agree with.', kind: 'good' },
          { chance: 0.5, then: [{ newPerson: { kind: 'friend', relationship: 55, log: 'I met {{person}} at debate and we argued ourselves into friendship.' } }] },
        ],
      },
      {
        id: 'sports',
        label: 'Sign up for intramurals',
        effects: [
          { stat: 'health', delta: 4 },
          { stat: 'happiness', delta: 3 },
          { counter: 'workouts', by: 3 },
          { log: 'Intramural football, twice a week. I was bad at it and happy anyway.', kind: 'good' },
          { chance: 0.15, then: [{ injury: 4 }, { log: 'I turned an ankle in week three.', kind: 'bad' }] },
        ],
      },
      {
        id: 'improv',
        label: 'Follow the dinosaur',
        effects: [
          {
            chance: 0.5,
            then: [
              { stat: 'happiness', delta: 6 },
              { log: 'Improv club. Yes-and-ing my way to confidence and some truly terrible scenes.', kind: 'good' },
              { newPerson: { kind: 'friend', relationship: 55, log: 'The dinosaur turned out to be {{person}}. We became friends.' } },
            ],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'Improv was mostly one man doing accents. I lasted one session.' }],
          },
        ],
      },
      {
        id: 'pens',
        label: 'Take the free pens',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I took eleven free pens and committed to nothing. The pens were good.' }],
      },
    ],
  },
  {
    id: 'ya_professor_notice',
    category: 'random',
    title: 'Unexpectedly good',
    text: 'A professor asked me to stay after class. Apparently my last paper was "unexpectedly good," which I chose to hear as a compliment. There is an opening on a research project.',
    minAge: 19,
    maxAge: 24,
    weight: 1.5,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['university'] }, { grade: { gte: 55 } }],
    choices: [
      {
        id: 'accept',
        label: 'Take the research spot',
        effects: [
          { stat: 'smarts', delta: 5 },
          { grade: 4 },
          { energy: -2 },
          { stat: 'happiness', delta: -1 },
          { flag: 'ya_research_assistant', set: true },
          { log: 'Research assistant: long hours, bad coffee, and my name in a footnote. Worth it.', kind: 'good' },
        ],
      },
      {
        id: 'decline',
        label: 'Politely decline',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I said I needed my weekends. The professor nodded like someone who remembered weekends.' }],
      },
      {
        id: 'grad',
        label: 'Ask about graduate school',
        effects: [
          { stat: 'smarts', delta: 2 },
          { chance: 0.5, then: [{ grade: 2 }] },
          { log: 'We talked for an hour about graduate school. I left with a reading list and mild dread.' },
        ],
      },
    ],
  },
  {
    id: 'ya_group_project',
    category: 'random',
    // The presentation, not the freeloader (sl_group_project_freeloader), and never within two years of it.
    title: 'The presenter',
    text: 'Our group presents in an hour. {{person}} volunteered weeks ago to present the slides, and has just admitted, cheerfully, that {{they}} has not opened them yet.',
    minAge: 18,
    maxAge: 24,
    weight: 2,
    cooldown: 2,
    conditions: [{ enrolled: true }, { stage: ['university'] }, { not: { sinceEvent: 'sl_group_project_freeloader', lte: 2 } }],
    person: { kind: ['friend', 'bestFriend', 'classmate'], minAge: 17 },
    choices: [
      {
        id: 'carry',
        label: 'Present it all myself',
        effects: [
          { grade: 5 },
          { stat: 'happiness', delta: -3 },
          { stat: 'health', delta: -1 },
          { relationship: 'person', delta: -3 },
          { log: 'I presented every slide while {{person}} nodded beside me. We all got the same grade. I have thoughts.' },
        ],
      },
      {
        id: 'confront',
        label: 'Coach {{them}} in the hallway',
        effects: [
          { energy: -1 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 3 }, { grade: 3 }, { log: '{{person}} learned the slides in forty minutes and was, annoyingly, great. We were fine.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -6 }, { grade: 1 }, { stat: 'happiness', delta: -3 }, { log: '{{person}} froze on slide two. I took over from slide three. We do not talk much now.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'tell',
        label: 'Tell the professor',
        effects: [
          { karma: -1 },
          { grade: 4 },
          { relationship: 'person', delta: -10 },
          { log: 'The professor let me present alone and graded us separately. {{person}} found out who talked.' },
        ],
      },
      {
        id: 'match',
        label: 'Let {{them}} wing it',
        effects: [{ grade: -6 }, { stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 2 }, { log: '{{person}} winged it with great charm and no facts. Our grade reflected both.' }],
      },
    ],
  },

  // ------------------------------------------------------------ student debt
  {
    id: 'ya_student_debt_letter',
    category: 'random',
    title: 'The thick envelope',
    text: 'A thick envelope from the loan servicer. The number inside has more digits than I remember agreeing to, and a cheerful note says repayment begins soon.',
    minAge: 20,
    maxAge: 29,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }, { any: [{ enrolled: true }, { hasDegree: true }] }],
    choices: [
      {
        id: 'pay',
        label: 'Pay a chunk now',
        hint: '{{$1500}}',
        conditions: [{ money: { gte: 1500 } }],
        effects: [{ money: -1500 }, { stat: 'happiness', delta: 3 }, { log: 'I paid down a chunk. The number shrank slightly, like a glacier in a warm year.', kind: 'money' }],
      },
      {
        id: 'plan',
        label: 'Call and set up a plan',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'After forty minutes of hold music I got onto an income-based plan. Manageable. Almost.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: "The call dropped twice. The third agent said I'd dialed the wrong department.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'drawer',
        label: 'Put it in a drawer',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I put the letter in the drawer with the other letters. The drawer is getting full.' }, { queue: 'ya_debt_collector' }],
      },
    ],
  },
  {
    id: 'ya_debt_collector',
    category: 'random',
    title: 'The calls start',
    text: "The calls started. A collections agency now has my number, my family's number, and a disturbingly accurate idea of my daily schedule.",
    minAge: 20,
    maxAge: 29,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'pay',
        label: 'Pay what I can',
        effects: [{ money: -800 }, { stat: 'happiness', delta: 1 }, { log: 'I paid what I could. The calls stopped, which was worth something. My bank balance sulked.', kind: 'money' }],
      },
      {
        id: 'negotiate',
        label: 'Negotiate a settlement',
        effects: [
          {
            chance: 0.5,
            then: [{ money: -400 }, { log: 'I talked them down and paid a smaller lump. Felt like a tiny victory.', kind: 'good' }],
            else: [{ money: -1000 }, { stat: 'happiness', delta: -4 }, { log: 'Negotiating made it worse somehow. I paid more and felt dumber.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'block',
        label: 'Stop answering',
        effects: [
          { karma: -2 },
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.5,
            then: [{ money: -1500 }, { stat: 'happiness', delta: -6 }, { log: 'Not answering did not stop the court letter. The fees had fees.', kind: 'bad' }],
            else: [{ log: "They gave up. Or lost my file. I'll take it." }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ housing
  {
    id: 'ya_first_apartment',
    category: 'random',
    title: 'Keys in hand',
    text: 'Keys in hand. My first apartment is a narrow box with one window and a radiator that clanks like a ghost, and it is entirely, gloriously mine.',
    minAge: 18,
    maxAge: 26,
    weight: 2,
    once: true,
    conditions: [{ inPrison: false }, { any: [{ hasJob: true }, { enrolled: true }] }],
    choices: [
      {
        id: 'party',
        label: 'Throw a housewarming',
        hint: '{{$250}}',
        effects: [
          { money: -250 },
          { stat: 'happiness', delta: 7 },
          { log: 'I threw a housewarming. The neighbors came, then complained, then came back for the dip.', kind: 'good' },
          { chance: 0.6, then: [{ newPerson: { kind: 'friend', relationship: 50, log: 'A neighbor named {{person}} came to the housewarming and stayed a friend.' } }] },
        ],
      },
      {
        id: 'furnish',
        label: 'Furnish it properly',
        hint: '{{$1200}}',
        conditions: [{ money: { gte: 1200 } }],
        effects: [{ money: -1200 }, { stat: 'happiness', delta: 5 }, { stat: 'health', delta: 1 }, { log: 'A real bed, a real table, a lamp. I felt like an adult with a spine.', kind: 'good' }],
      },
      {
        id: 'floor',
        label: 'Mattress on the floor',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'health', delta: -2 }, { log: 'Mattress on the floor, milk crate as a table. Bohemian, I told myself. My back disagreed.' }],
      },
    ],
  },
  {
    id: 'ya_terrible_landlord',
    category: 'random',
    title: 'The boat photo',
    text: 'The heat went out in the dead of winter. My landlord answered three phone messages by mailing me, for some reason, a photo of his boat.',
    minAge: 19,
    maxAge: 29,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }, { noAsset: 'house' }, { atHome: false }],
    choices: [
      {
        id: 'fix',
        label: 'Fix it myself',
        hint: '{{$200}}',
        effects: [
          { money: -200 },
          { stat: 'smarts', delta: 2 },
          { log: 'I borrowed a repair manual and fixed the furnace. I am now a plumber in my own mind.' },
          { chance: 0.2, then: [{ injury: 2 }, { log: 'I also burned my hand on it.', kind: 'bad' }] },
        ],
      },
      {
        id: 'report',
        label: 'Report him to the city',
        effects: [
          { karma: 1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'An inspector came. The landlord fixed the heat in two days and sent no more boat photos.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -6 }, { money: -600 }, { log: 'The landlord fixed it, then declined to renew my lease. Moving costs money. I moved.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'withhold',
        label: 'Withhold rent',
        effects: [
          {
            chance: 0.5,
            then: [{ money: 400 }, { stat: 'happiness', delta: 4 }, { log: 'He fixed it within a week and we never spoke of the missing month.', kind: 'money' }],
            else: [{ money: -800 }, { stat: 'happiness', delta: -5 }, { karma: -1 }, { log: 'He kept my deposit over it and called me a troublemaker. We were both right.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'blanket',
        label: 'Buy a bigger blanket',
        effects: [{ money: -60 }, { stat: 'happiness', delta: -2 }, { stat: 'health', delta: -3 }, { log: 'I bought a blanket the size of a tent and slept inside it until spring.' }],
      },
    ],
  },
  {
    id: 'ya_roommate_rent',
    category: 'random',
    title: 'About to clear',
    text: '{{person}} has not paid {{their}} half of the rent in three months. {{They}} keeps saying a payment is "about to clear." The landlord only knows my name.',
    minAge: 19,
    maxAge: 29,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }, { noAsset: 'house' }, { married: false }, { atHome: false }],
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'cover',
        label: 'Cover it quietly',
        hint: '{{$900}}',
        effects: [
          { money: -900 },
          { karma: 2 },
          { relationship: 'person', delta: 4 },
          { stat: 'happiness', delta: -3 },
          { log: 'I covered the rent and said nothing. {{person}} hugged me. My savings did not.', kind: 'money' },
        ],
      },
      {
        id: 'demand',
        label: 'Demand the money',
        effects: [
          {
            chance: 0.5,
            then: [{ money: 600 }, { relationship: 'person', delta: -2 }, { log: '{{person}} paid most of it the next day, muttering. Friendship, slightly dented.', kind: 'money' }],
            else: [{ relationship: 'person', delta: -10 }, { stat: 'happiness', delta: -5 }, { log: '{{person}} cried, then got angry, then moved out owing me the lot.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'evict',
        label: 'Ask {{them}} to move out',
        effects: [
          { relationship: 'person', delta: -15 },
          { stat: 'happiness', delta: -3 },
          { karma: -1 },
          { money: -300 },
          { log: 'I asked {{person}} to leave. {{They}} left. I paid full rent alone and talked to the fridge.' },
        ],
      },
    ],
  },
  {
    id: 'ya_roommate_food',
    category: 'random',
    // Shared supplies, not stolen leftovers (sl_dorm_fridge), and never within two years of that card.
    title: 'The household budget',
    text: 'My roommate {{person}} has not bought toilet paper, dish soap or milk in five months, but uses all three with real enthusiasm. {{They}} calls this "the household budget."',
    minAge: 18,
    maxAge: 29,
    weight: 2,
    cooldown: 3,
    person: { kind: ['friend', 'bestFriend', 'sibling'], minAge: 18 },
    // A shared flat, not the family home.
    conditions: [{ inPrison: false }, { atHome: false }, { not: { sinceEvent: 'sl_dorm_fridge', lte: 2 } }],
    choices: [
      {
        id: 'note',
        label: 'Leave a passive-aggressive note',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: -3 }, { log: 'I left a note. {{person}} left a note back. The fridge door became a debate.' }],
      },
      {
        id: 'trap',
        label: 'Stop buying anything',
        effects: [
          { karma: -2 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: -4 }, { log: 'I stopped buying. On day four {{person}} came home with toilet paper and a look of betrayal.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: '{{person}} did not notice I had stopped. We lived without dish soap for a month.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'share',
        label: 'Start a shared kitty',
        effects: [{ karma: 2 }, { relationship: 'person', delta: 5 }, { money: -100 }, { log: 'We each put in every Friday. {{person}} now runs the kitty with alarming precision.', kind: 'good' }],
      },
    ],
  },

  // ------------------------------------------------------------ travel
  {
    id: 'ya_backpacking',
    category: 'random',
    title: 'The circled map',
    text: '{{person}} wants to go backpacking for a month: cheap hostels, overnight trains, no plan whatsoever. {{They}} has already bought a paper map and circled things.',
    minAge: 18,
    maxAge: 27,
    weight: 1.5,
    once: true,
    person: { kind: ['friend', 'bestFriend', 'sibling'] },
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'go',
        label: 'Go all in',
        hint: '{{$2500}}',
        conditions: [{ money: { gte: 2500 } }],
        effects: [
          { money: -2500 },
          { stat: 'happiness', delta: 12 },
          { stat: 'health', delta: 2 },
          { counter: 'vacations' },
          { relationship: 'person', delta: 10 },
          { log: 'A month of trains, cheap noodles and sunrises. {{person}} and I came home better friends.', kind: 'good' },
          { chance: 0.25, then: [{ queue: 'ya_backpack_passport' }] },
        ],
      },
      {
        id: 'budget',
        label: 'Go on a shoestring',
        hint: '{{$800}}',
        effects: [
          { money: -800 },
          { stat: 'happiness', delta: 7 },
          { counter: 'vacations' },
          { relationship: 'person', delta: 6 },
          { log: 'We did it on nothing. Slept in a station once. Ate things I cannot name.', kind: 'good' },
          { chance: 0.3, then: [{ illness: 'food_poisoning' }, { log: 'One of the things I cannot name did not agree with me.', kind: 'bad' }] },
          { chance: 0.2, then: [{ queue: 'ya_backpack_passport' }] },
        ],
      },
      {
        id: 'stay',
        label: 'Stay home and save',
        effects: [
          { stat: 'happiness', delta: -3 },
          { relationship: 'person', delta: -3 },
          { log: 'I stayed. {{person}} sent a postcard from every stop. I put each one on the fridge through gritted teeth.' },
          { chance: 0.5, then: [{ money: 300 }, { log: 'I picked up odd jobs instead and felt briefly responsible.', kind: 'money' }] },
        ],
      },
    ],
  },
  {
    id: 'ya_backpack_passport',
    category: 'random',
    title: 'The missing bag',
    text: 'Somewhere between two border towns my bag went missing, along with my passport, my toothbrush and the only pair of socks I trusted.',
    minAge: 18,
    maxAge: 29,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend', 'sibling'] },
    choices: [
      {
        id: 'embassy',
        label: 'Trek to the embassy',
        effects: [
          { money: -300 },
          { stat: 'happiness', delta: -4 },
          { stat: 'smarts', delta: 2 },
          { log: 'Two days of lines and forms. The emergency passport photo is the worst picture of me ever taken.' },
        ],
      },
      {
        id: 'lean',
        label: 'Let {{person}} handle it',
        effects: [
          { money: -150 },
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: -2 },
          { log: '{{person}} handled the whole thing while I sat on a curb. I owe {{them}} forever.' },
        ],
      },
      {
        id: 'stay',
        label: 'Stay an extra week',
        effects: [{ money: -500 }, { stat: 'happiness', delta: 4 }, { log: 'Stranded, I stopped trying. Best week of the trip. Eventually a passport found me.', kind: 'good' }],
      },
    ],
  },

  // ------------------------------------------------------------ friends
  {
    id: 'ya_wedding_invite',
    category: 'random',
    title: 'Cream envelope',
    text: "A heavy cream envelope: {{person}} is getting married. There's a venue, a dress code and a registry with a toaster that costs more than my rent.",
    minAge: 21,
    maxAge: 29,
    weight: 1.5,
    cooldown: 4,
    person: { kind: ['friend', 'bestFriend', 'sibling', 'ex'], minAge: 20 },
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'generous',
        label: 'Go and give generously',
        hint: '{{$300}}',
        effects: [
          { money: -300 },
          { relationship: 'person', delta: 8 },
          { stat: 'happiness', delta: 5 },
          { log: 'I danced badly, cried a little and bought the toaster. {{person}} looked happy. Good day.', kind: 'good' },
        ],
      },
      {
        id: 'card',
        label: 'Go, bring a card',
        effects: [
          { money: -40 },
          { relationship: 'person', delta: 2 },
          { stat: 'happiness', delta: 3 },
          { log: 'I went, ate the dinner, signed the card with a warm message. Nobody checks the registry. Probably.' },
        ],
      },
      {
        id: 'speech',
        label: 'Volunteer to give a speech',
        effects: [
          { money: -150 },
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 12 }, { stat: 'happiness', delta: 6 }, { log: 'My speech killed. Laughter, tears, applause. {{person}} hugged me for a full minute.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -5 }, { stat: 'happiness', delta: -6 }, { log: 'My speech died. I mentioned an ex at a wedding. You could hear a fork drop.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Send regrets',
        effects: [{ relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -1 }, { log: 'I said I could not make it. {{person}} said "no worries" in the way that means worries.' }],
      },
    ],
  },
  {
    id: 'ya_friend_startup',
    category: 'random',
    title: 'Early believers',
    text: '{{person}} has gone all in on starting a company. The pitch involves a lot of hand gestures. {{They}} needs {{$2000}} from "early believers," and {{they}} is looking at me.',
    minAge: 20,
    maxAge: 29,
    weight: 1.5,
    cooldown: 5,
    // A grown-up founder (a student friend has no job to quit, and a little sibling no company to found).
    person: { kind: ['friend', 'bestFriend', 'sibling'], minAge: 20 },
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'invest',
        label: 'Invest',
        hint: '{{$2000}}',
        conditions: [{ money: { gte: 2000 } }],
        effects: [
          { money: -2000 },
          { relationship: 'person', delta: 6 },
          { log: 'I handed over the money. {{person}} called me a visionary. I called my bank.', kind: 'money' },
          { queue: 'ya_startup_update' },
        ],
      },
      {
        id: 'help',
        label: 'Help for free instead',
        effects: [
          { karma: 2 },
          { relationship: 'person', delta: 5 },
          { stat: 'smarts', delta: 3 },
          { energy: -1 },
          { log: 'I built {{their}} spreadsheets and {{their}} logo. No equity, but I learned a lot and ate {{their}} pizza.', kind: 'good' },
        ],
      },
      {
        id: 'questions',
        label: 'Ask tough questions first',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: 2 }, { log: 'My questions found a hole you could drive a bus through. {{person}} went quiet. I kept my money.' }],
            else: [{ relationship: 'person', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: "The answers were good. Annoyingly good. I still didn't invest, but I was impressed." }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Decline kindly',
        effects: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: 1 }, { log: 'I said my money was tied up in rent. {{person}} said it was fine, in the voice that means fine.' }],
      },
    ],
  },
  {
    id: 'ya_startup_update',
    category: 'random',
    title: 'Investor update',
    text: 'The first investor update from {{person}} arrived: lots of exclamation points, one graph, and a line about "runway" that I had to look up.',
    minAge: 20,
    maxAge: 29,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend', 'sibling'] },
    choices: [
      {
        id: 'hold',
        label: 'Hold my stake',
        effects: [
          {
            random: [
              { weight: 2, effects: [{ stat: 'happiness', delta: -4 }, { log: 'The company folded eight months later. My {{$2000}} bought a logo and a lesson.', kind: 'bad' }] },
              { weight: 1.5, effects: [{ money: 2500 }, { log: 'They got acquired by a bigger fish. I got my money back and a little more. Fine.', kind: 'money' }] },
              {
                weight: 0.5,
                effects: [
                  { money: 15000 },
                  { stat: 'happiness', delta: 10 },
                  { relationship: 'person', delta: 10 },
                  { log: 'It actually worked. My tiny stake became real money and {{person}} sent a giant fruit basket.', kind: 'milestone' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'sell',
        label: 'Sell my stake back',
        effects: [
          {
            chance: 0.6,
            then: [{ money: 1200 }, { log: '{{person}} bought me out at a loss, slightly offended. I slept better.', kind: 'money' }],
            else: [{ money: 2200 }, { relationship: 'person', delta: -3 }, { log: '{{person}} bought me out at a small profit and never mentioned it again.', kind: 'money' }],
          },
        ],
      },
      {
        id: 'double',
        label: 'Invest more',
        hint: '{{$2000}}',
        conditions: [{ money: { gte: 2000 } }],
        effects: [
          { money: -2000 },
          {
            random: [
              { weight: 2.5, effects: [{ stat: 'happiness', delta: -8 }, { log: '{{person}} folded the company and went back to {{their}} old job. My savings did not come back.', kind: 'bad' }] },
              {
                weight: 1,
                effects: [
                  { money: 30000 },
                  { stat: 'happiness', delta: 12 },
                  { relationship: 'person', delta: 12 },
                  { log: 'Doubling down paid off. The acquisition check had a comma in a very pleasing place.', kind: 'milestone' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ya_group_chat_drama',
    category: 'random',
    title: 'Group chat meltdown',
    text: 'The group chat exploded at midnight. {{person}} said something careless, someone screenshotted it, and now there are three new group chats, none of which include everyone.',
    minAge: 18,
    maxAge: 29,
    weight: 2,
    cooldown: 3,
    person: { kind: ['friend', 'bestFriend'] },
    conditions: [{ inPrison: false }, { year: { gte: 2010 } }, { not: { sinceEvent: 'tm_group_chat_drama', lte: 2 } }],
    choices: [
      {
        id: 'mediate',
        label: 'Try to mediate',
        effects: [
          { karma: 3 },
          { energy: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: 6 }, { log: 'I got everyone into one call. Apologies happened. One group chat again, slightly scarred.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { relationship: 'person', delta: -3 }, { log: "Mediating made me the problem. Now there's a group chat without me, too.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'side',
        label: "Take {{person}}'s side",
        effects: [
          { relationship: 'person', delta: 8 },
          { stat: 'happiness', delta: -2 },
          { karma: -1 },
          { log: 'I backed {{person}}. Loyalty, with casualties. Two people stopped replying to me.' },
        ],
      },
      {
        id: 'mute',
        label: 'Mute everything',
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: -3 }, { log: 'I muted every chat and went to bed. By morning, peace or exile; I never checked which.' }],
      },
    ],
  },
  {
    id: 'ya_surprise_reunion',
    category: 'random',
    title: 'Gate B12',
    text: 'I ran into {{person}} at the airport, at the gate next to mine. Both our flights are delayed two hours, and there is nowhere to hide.',
    minAge: 20,
    maxAge: 29,
    weight: 1.5,
    cooldown: 5,
    person: { kind: ['friend', 'bestFriend', 'ex', 'classmate'], maxRelationship: 60 },
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'catchup',
        label: 'Catch up properly',
        effects: [
          { energy: -1 },
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 12 }, { stat: 'happiness', delta: 5 }, { log: 'Two hours of catching up. We laughed about who we used to be. {{person}} hugged me at boarding.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: -2 }, { log: 'Twenty minutes in, the conversation ran dry. The other hour and forty were long.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'hide',
        label: 'Pretend not to see {{them}}',
        effects: [
          { stat: 'happiness', delta: 1 },
          { relationship: 'person', delta: -4 },
          { karma: -1 },
          { log: 'I studied the departure board with enormous interest. {{person}} saw me. We both pretended.' },
        ],
      },
      {
        id: 'numbers',
        label: 'Swap numbers, never call',
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'We swapped numbers and promised to "do something." We will not. It was still nice.' }],
      },
    ],
  },
  {
    id: 'ya_old_friend_online',
    category: 'random',
    title: 'Is this you?',
    text: 'A message request from a name I had not thought about since elementary school: "Is this you?? I live in {{city}} now!" Plus a photo of someone I almost recognize.',
    minAge: 18,
    maxAge: 29,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }, { year: { gte: 2010 } }],
    choices: [
      {
        id: 'meet',
        label: 'Meet for coffee',
        effects: [
          { money: -25 },
          {
            chance: 0.7,
            then: [
              { stat: 'happiness', delta: 5 },
              { log: 'We met. Half the stories matched, the other half were better in their version.', kind: 'good' },
              { newPerson: { kind: 'friend', relationship: 55, log: 'My old school friend {{person}} and I picked up right where we left off.' } },
            ],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'We met. They mostly wanted to talk about a "business opportunity." I left early.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'chat',
        label: 'Reply, keep it online',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'We messaged for a week, then it faded into reactions. Pleasant, lightweight, done.' }],
      },
      {
        id: 'ignore',
        label: 'Leave it on read',
        effects: [{ stat: 'happiness', delta: -1 }, { karma: -1 }, { log: 'I left it on read. I think about it sometimes, usually at night.' }],
      },
    ],
  },

  // ------------------------------------------------------------ work & money
  {
    id: 'ya_networking_mixer',
    category: 'random',
    title: 'Industry mixer',
    text: 'Someone at {{company}} forwarded an invite to an "industry mixer." Name badges, lukewarm sparkling water, and a room full of people pretending not to read each other\'s badges.',
    minAge: 21,
    maxAge: 29,
    weight: 2,
    cooldown: 3,
    conditions: [{ hasJob: true }],
    choices: [
      {
        id: 'work',
        label: 'Work the room',
        effects: [
          { energy: -2 },
          {
            chance: 0.6,
            then: [
              { jobPerformance: 6 },
              { stat: 'happiness', delta: 3 },
              { log: 'I shook hands, remembered names and got a card from someone important. My boss heard about it.', kind: 'good' },
              { chance: 0.5, then: [{ newPerson: { kind: 'coworker', relationship: 55, log: 'I hit it off with {{person}}, who turned out to work two floors up.' } }] },
            ],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I talked too much to the wrong person for forty minutes. They were the caterer.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'charm',
        label: 'Charm the keynote speaker',
        conditions: [{ trait: 'charming' }],
        effects: [
          { energy: -1 },
          { jobPerformance: 8 },
          { stat: 'happiness', delta: 4 },
          { log: 'I made the keynote speaker laugh twice. By Monday, three people had asked my boss who I was.', kind: 'good' },
        ],
      },
      {
        id: 'snacks',
        label: 'Guard the snack table',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'health', delta: -1 }, { log: 'I ate seventeen tiny quiches and spoke to no one. A productive evening by my standards.' }],
      },
      {
        id: 'leave',
        label: 'Leave after ten minutes',
        effects: [{ stat: 'happiness', delta: 1 }, { energy: 1 }, { log: 'I signed in, took a badge, left. The badge is on my fridge as a trophy.' }],
      },
    ],
  },
  {
    id: 'ya_mentor_offer',
    category: 'random',
    // An introduction from outside work, not the workplace mentor in wk_mentor_offer, and never within two years of it.
    title: 'The introduction',
    text: '{{person}} knows someone very senior in my line of work and has set up a coffee for me with her next week. "Bring good questions," {{they}} said. "She does not do small talk."',
    minAge: 21,
    maxAge: 29,
    weight: 1.5,
    once: true,
    conditions: [{ hasJob: true }, { not: { sinceEvent: 'wk_mentor_offer', lte: 2 } }],
    person: { kind: ['friend', 'bestFriend', 'sibling'], minAge: 24 },
    choices: [
      {
        id: 'accept',
        label: 'Prepare a page of questions',
        effects: [
          { energy: -1 },
          { stat: 'smarts', delta: 3 },
          {
            chance: 0.7,
            then: [{ jobPerformance: 6 }, { relationship: 'person', delta: 4 }, { log: 'She answered all twelve questions and asked me two. I use her advice weekly. {{person}} looks smug.', kind: 'good' }],
            else: [{ jobPerformance: 2 }, { relationship: 'person', delta: 2 }, { log: 'She was kind, brisk and gone in twenty minutes. I got three answers and a business card.' }],
          },
        ],
      },
      {
        id: 'ghost',
        label: 'Wing it',
        effects: [
          {
            chance: 0.4,
            then: [{ jobPerformance: 4 }, { stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 3 }, { log: 'I winged it and we got on famously. She called me "refreshing," which I am choosing to keep.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -3 }, { log: 'I asked her what she does. She told me, slowly. {{person}} heard about it by dinner.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Decline politely',
        effects: [
          { relationship: 'person', delta: -2 },
          { stat: 'happiness', delta: 1 },
          { log: "I said I'd figure it out alone. {{person}} said that was exactly what {{they}} said at my age." },
        ],
      },
    ],
  },
  {
    id: 'ya_first_tax_return',
    category: 'random',
    title: 'Forty boxes',
    text: 'A letter says I need to file a tax return. The form has forty boxes, a glossary longer than the form, and a deadline I have already half-missed.',
    minAge: 18,
    maxAge: 29,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ hasJob: true }],
    choices: [
      {
        id: 'diy',
        label: 'Do it myself',
        effects: [
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.6,
            then: [{ money: 400 }, { stat: 'happiness', delta: 3 }, { log: 'I did it myself and got a refund. Like finding money in a coat, except the coat was math.', kind: 'money' }],
            else: [{ money: -300 }, { stat: 'happiness', delta: -3 }, { log: 'I did it myself and owed money plus a small penalty for a box I checked with confidence.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'pro',
        label: 'Pay a preparer',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          {
            chance: 0.8,
            then: [{ money: 350 }, { log: "The preparer found deductions I didn't know existed. Net positive and zero stress.", kind: 'money' }],
            else: [{ log: 'The preparer charged me to tell me I owed nothing and got nothing. Fair, I suppose.' }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore it',
        effects: [
          { karma: -1 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.65,
            then: [{ log: "Nothing happened. I assume that's how taxes work." }],
            else: [{ money: -600 }, { stat: 'happiness', delta: -5 }, { log: 'A sterner letter arrived with a fine attached. Taxes, it turns out, are not optional.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ya_gym_trap',
    category: 'random',
    title: 'The eighteen-month contract',
    text: 'I signed up for a gym in January with the confidence of a new person. The contract is eighteen months long. The new person has not shown up yet.',
    minAge: 18,
    maxAge: 29,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'go',
        label: 'Actually go',
        effects: [
          { money: -300 },
          { energy: -1 },
          { stat: 'health', delta: 6 },
          { stat: 'looks', delta: 2 },
          { stat: 'happiness', delta: 2 },
          { counter: 'workouts', by: 20 },
          { log: 'I went. Three times a week, grudgingly, then not grudgingly. My jeans noticed before I did.', kind: 'good' },
        ],
      },
      {
        id: 'cancel',
        label: 'Fight to cancel',
        effects: [
          {
            chance: 0.5,
            then: [{ money: -50 }, { stat: 'happiness', delta: 3 }, { log: 'Four phone calls, one letter, and a man named Kevin. Canceled. Victory.', kind: 'good' }],
            else: [{ money: -400 }, { stat: 'happiness', delta: -4 }, { log: "They would not let me cancel. I now pay for a building I've seen twice.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'pay',
        label: 'Keep paying, never go',
        effects: [{ money: -400 }, { stat: 'happiness', delta: -2 }, { log: 'I paid for the gym all year as a kind of tax on optimism. Did not go once.' }],
      },
    ],
  },
  {
    id: 'ya_unemployed_funk',
    category: 'random',
    title: 'Forty applications',
    text: "Forty applications sent, two form-letter replies, zero interviews. My days have lost their shape; I'm not sure whether it's Tuesday or just afternoon.",
    minAge: 19,
    maxAge: 29,
    weight: 2,
    cooldown: 3,
    conditions: [{ hasJob: false }, { inPrison: false }],
    choices: [
      {
        id: 'skill',
        label: 'Learn a new skill',
        hint: '{{$100}}',
        effects: [
          { money: -100 },
          { stat: 'smarts', delta: 4 },
          { stat: 'happiness', delta: 2 },
          { log: 'I took a night course and built a tiny portfolio. The next application got a reply from a human.', kind: 'good' },
        ],
      },
      {
        id: 'gigs',
        label: 'Pick up cash gigs',
        effects: [
          { money: 400 },
          { stat: 'health', delta: -2 },
          { stat: 'happiness', delta: 1 },
          { log: 'I moved couches, walked dogs and built bookshelves for strangers. Tired, and paid.', kind: 'money' },
        ],
      },
      {
        id: 'floor',
        label: 'Lie on the floor',
        effects: [{ stat: 'happiness', delta: -5 }, { stat: 'health', delta: -2 }, { log: 'I lay on the floor for a while. The ceiling had no suggestions.' }],
      },
    ],
  },

  // ------------------------------------------------------------ crisis & home
  {
    id: 'ya_quarter_life_crisis',
    category: 'random',
    title: 'Cereal for dinner',
    text: 'I turned {{age}}, and this week everyone I went to school with seems to have bought a house, run a marathon or gotten engaged. I ate cereal for dinner and reconsidered my entire existence.',
    minAge: 24,
    maxAge: 29,
    weight: 1.5,
    once: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'quit',
        label: 'Quit everything, start over',
        conditions: [{ hasJob: true }],
        effects: [
          { loseJob: true, reason: 'left' },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 10 }, { stat: 'smarts', delta: 3 }, { log: 'I quit. Scary, then thrilling. I finally had time to figure out what I actually wanted.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: -8 }, { money: -1500 }, { log: 'I quit with no plan. Three months of noodles and regret later, the plan was "find a job."', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'hobby',
        label: 'Take up a hobby',
        hint: '{{$200}}',
        effects: [{ money: -200 }, { stat: 'happiness', delta: 5 }, { stat: 'smarts', delta: 2 }, { log: 'Pottery. I am bad at it. Every bowl leans. I love every leaning bowl.', kind: 'good' }],
      },
      {
        id: 'therapy',
        label: 'Talk to a therapist',
        hint: '{{$600}}',
        conditions: [{ money: { gte: 600 } }],
        effects: [
          { money: -600 },
          { stat: 'happiness', delta: 8 },
          { stat: 'health', delta: 2 },
          { log: 'A therapist said comparison is the thief of joy. I paid {{$600}} to hear it. Worth it.', kind: 'good' },
        ],
      },
      {
        id: 'grind',
        label: 'Double down on work',
        conditions: [{ hasJob: true }],
        effects: [
          { jobPerformance: 8 },
          { stat: 'happiness', delta: -4 },
          { stat: 'health', delta: -2 },
          { log: 'I decided the answer was working harder. My boss loved it. My friends stopped calling.' },
          { chance: 0.5, then: [{ money: 1500 }, { log: 'The overtime at least paid.', kind: 'money' }] },
        ],
      },
    ],
  },
  {
    id: 'ya_move_back_home',
    category: 'random',
    title: 'The old room',
    text: 'Rent went up; my income did not. {{person}} said my old room is "exactly how you left it," which is both an offer and a threat.',
    minAge: 19,
    maxAge: 29,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }, { atHome: false }, { any: [{ hasJob: false }, { money: { lt: 2500 } }] }],
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather'] },
    choices: [
      {
        id: 'move',
        label: 'Move back home',
        effects: [
          { money: 1200 },
          { stat: 'happiness', delta: -5 },
          { relationship: 'person', delta: 6 },
          { log: 'I moved back into my childhood room. The posters are still up. So is the curfew, apparently.', kind: 'money' },
          { queue: 'ya_house_rules' },
        ],
      },
      {
        id: 'couch',
        label: 'Couch-surf with friends',
        conditions: [{ hasPerson: ['friend', 'bestFriend'] }],
        effects: [
          { money: 400 },
          { stat: 'happiness', delta: -3 },
          { relationship: 'friend', delta: -3 },
          { log: 'I rotated between three couches. Each friend was lovely for about nine days.' },
        ],
      },
      {
        id: 'tough',
        label: 'Tough it out',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 1 }, { log: 'I cut every cost, sold my games and made it. Independence, with rice.', kind: 'good' }],
            else: [
              { money: -1000 },
              { stat: 'happiness', delta: -6 },
              { stat: 'health', delta: -2 },
              { relationship: 'person', delta: 2 },
              { log: "I didn't make it. I borrowed, skipped meals and ended up home anyway, three months later.", kind: 'bad' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ya_house_rules',
    category: 'random',
    title: 'House rules',
    text: '{{person}} has rules. Dishes immediately. Lights out by eleven. A call if I am "going to be late," and "late" means after dinner.',
    minAge: 19,
    maxAge: 29,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather'] },
    choices: [
      {
        id: 'comply',
        label: 'Follow the rules',
        effects: [{ relationship: 'person', delta: 8 }, { stat: 'happiness', delta: -3 }, { stat: 'health', delta: 2 }, { log: 'I followed the rules. Slept well, ate properly, felt fourteen.' }],
      },
      {
        id: 'negotiate',
        label: 'Negotiate like an adult',
        effects: [
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 3 }, { log: "We agreed I'd cook twice a week in exchange for no curfew. Diplomacy.", kind: 'good' }],
            else: [{ relationship: 'person', delta: -5 }, { stat: 'happiness', delta: -2 }, { log: 'Negotiation failed. {{person}} reminded me whose name is on the deed.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'rebel',
        label: 'Ignore the rules',
        effects: [
          { relationship: 'person', delta: -12 },
          { stat: 'happiness', delta: 2 },
          { karma: -2 },
          { log: 'I came and went as I pleased. {{person}} started leaving the porch light off.' },
        ],
      },
    ],
  },
  {
    id: 'ya_car_breakdown',
    category: 'random',
    // Stranded in traffic, not the mechanic's verdict (mn_car_repair), and never within two years of it.
    title: 'Fast lane, no engine',
    text: 'My car lost all power and coasted to a stop in the fast lane. Hazard lights on, horns everywhere, and a tow truck that charges by the minute.',
    minAge: 18,
    maxAge: 29,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }, { ownsAssetId: ['old_hatchback', 'sedan', 'pickup', 'ev', 'luxury_sedan', 'sports_car', 'supercar', 'classic_car'] }, { not: { sinceEvent: 'mn_car_repair', lte: 2 } }],
    choices: [
      {
        id: 'mechanic',
        label: 'Pay the mechanic',
        hint: '{{$900}}',
        conditions: [{ money: { gte: 900 } }],
        effects: [{ money: -900 }, { stat: 'happiness', delta: -3 }, { log: "The mechanic said a word I didn't know and charged me {{$900}} for it. The car runs. For now.", kind: 'money' }],
      },
      {
        id: 'diy',
        label: 'Fix it myself',
        effects: [
          {
            chance: 0.5,
            then: [{ money: -150 }, { stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: 4 }, { log: 'A weekend, a library repair manual and a borrowed wrench. It started. I may have cheered.', kind: 'good' }],
            else: [{ money: -1400 }, { stat: 'happiness', delta: -5 }, { asset: 'damage', kind: 'car', amount: 20 }, { log: 'I made it worse. The mechanic now charges me a "you tried" fee.', kind: 'bad' }],
          },
          { chance: 0.15, then: [{ injury: 2 }, { log: 'I also dropped the jack on my foot.', kind: 'bad' }] },
        ],
      },
      {
        id: 'scrap',
        label: 'Scrap it, take the bus',
        conditions: [{ ownsAssetId: ['old_hatchback', 'sedan', 'pickup', 'ev', 'luxury_sedan', 'sports_car', 'supercar', 'classic_car'] }],
        effects: [
          { asset: 'lose', kind: 'car' },
          { money: 250 },
          { stat: 'happiness', delta: -4 },
          { stat: 'health', delta: 2 },
          { log: 'I sold it for scrap and bought a bus pass. I read more now. I also wait more.' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ scams
  {
    id: 'ya_scam_call',
    category: 'random',
    title: 'Very calm caller',
    text: 'A caller with an urgent message said my bank account had been "compromised" and they needed my details to "secure" it. They knew my name. They were very calm.',
    minAge: 18,
    maxAge: 29,
    weight: 2,
    cooldown: 3,
    conditions: [{ not: { sinceEvent: 'cp_scam_call', lte: 2 } }],
    choices: [
      {
        id: 'give',
        label: 'Give them the details',
        effects: [
          {
            chance: 0.9,
            then: [{ money: -1200 }, { stat: 'happiness', delta: -8 }, { stat: 'smarts', delta: 2 }, { log: 'They drained what they could in twenty minutes. The bank was sympathetic and useless. I learned.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'By some miracle it really was the bank. Please do not take this as advice.' }],
          },
        ],
      },
      {
        id: 'hangup',
        label: 'Hang up, call the bank',
        effects: [
          { stat: 'happiness', delta: 2 },
          { stat: 'smarts', delta: 1 },
          { log: 'I hung up and called the real number. Nothing was wrong. The scammer called back twice, less calm.', kind: 'good' },
        ],
      },
      {
        id: 'troll',
        label: 'Ask for their supervisor',
        effects: [
          { stat: 'happiness', delta: 5 },
          { karma: 1 },
          { log: 'I demanded a supervisor. The supervisor had the same voice, slightly lower. I hung up laughing.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'ya_rental_scam',
    category: 'random',
    title: 'Huge windows, low rent',
    text: 'An apartment ad: huge windows, low rent, great area. The "owner" is overseas and just needs a deposit wired before showing it to "serious people."',
    minAge: 18,
    maxAge: 29,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }, { noAsset: 'house' }],
    choices: [
      {
        id: 'wire',
        label: 'Wire the deposit',
        hint: '{{$1500}}',
        conditions: [{ money: { gte: 1500 } }],
        effects: [
          { money: -1500 },
          {
            random: [
              { weight: 4, effects: [{ stat: 'happiness', delta: -8 }, { log: 'The ad vanished along with the "owner" and my deposit. The photos were from a hotel brochure.', kind: 'bad' }] },
              { weight: 1, effects: [{ stat: 'happiness', delta: 8 }, { log: 'Against all odds it was real. Huge windows, low rent. I will never risk this again, probably.', kind: 'good' }] },
            ],
          },
        ],
      },
      {
        id: 'viewing',
        label: 'Insist on a viewing first',
        effects: [
          { energy: -1 },
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.8,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'They stopped replying the moment I asked to see it. What a coincidence.' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'They agreed to a viewing, but someone else got there first. At least it was real.' }],
          },
        ],
      },
      {
        id: 'pass',
        label: 'Walk away',
        effects: [{ stat: 'happiness', delta: -1 }, { stat: 'smarts', delta: 1 }, { log: 'Too good to be true usually is. I kept looking at boxes with no windows.' }],
      },
    ],
  },
  {
    id: 'ya_hot_tip',
    category: 'random',
    title: 'Rocket emojis',
    text: 'Someone I barely knew at school messaged out of nowhere about a "guaranteed" investment scheme. Screenshots of profits, a countdown timer and a great many rocket emojis.',
    minAge: 18,
    maxAge: 29,
    weight: 2,
    cooldown: 3,
    conditions: [{ year: { gte: 2013 } }],
    choices: [
      {
        id: 'allin',
        label: 'Put in {{$1000}}',
        conditions: [{ money: { gte: 1000 } }],
        effects: [
          { money: -1000 },
          {
            random: [
              { weight: 4, effects: [{ stat: 'happiness', delta: -6 }, { log: 'The "platform" stopped letting me withdraw after a week. The rockets were pointing down.', kind: 'bad' }] },
              { weight: 1, effects: [{ money: 3000 }, { stat: 'happiness', delta: 6 }, { log: 'Somehow I got out before it collapsed, with triple my money. Do not try this.', kind: 'money' }] },
            ],
          },
        ],
      },
      {
        id: 'small',
        label: 'Put in {{$100}} to see',
        effects: [
          { money: -100 },
          {
            chance: 0.3,
            then: [{ money: 250 }, { stat: 'happiness', delta: 4 }, { log: 'I made a little, got out, and felt like a genius for a day.', kind: 'money' }],
            else: [{ stat: 'smarts', delta: 1 }, { log: "The {{$100}} evaporated. Cheapest lesson I've bought." }],
          },
        ],
      },
      {
        id: 'explain',
        label: 'Explain the pyramid scheme',
        conditions: [{ stat: 'smarts', gte: 65 }],
        effects: [{ karma: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I drew a diagram of where the money really comes from. They blocked me. Two friends thanked me.', kind: 'good' }],
      },
      {
        id: 'report',
        label: 'Report and block',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: 1 }, { log: 'I reported the account. Two of my old classmates thanked me later. One did not.' }],
      },
    ],
  },

  // ------------------------------------------------------------ first serious relationship
  {
    id: 'ya_first_i_love_you',
    category: 'random',
    title: 'Three words',
    text: 'Walking home in the rain, {{person}} stopped, turned, and said "I love you" for the first time. {{They}} looked terrified. I understood why.',
    minAge: 18,
    maxAge: 29,
    weight: 2,
    once: true,
    conditions: [{ inPrison: false }, { hasLover: true }, { married: false }],
    person: { kind: ['lover'] },
    choices: [
      {
        id: 'back',
        label: 'Say it back',
        effects: [
          { love: 12 },
          { relationship: 'person', delta: 6 },
          { stat: 'happiness', delta: 8 },
          { log: 'I said it back. We stood in the rain grinning like idiots. My shoes were ruined. Worth it.', kind: 'milestone' },
        ],
      },
      {
        id: 'freeze',
        label: 'Freeze',
        effects: [{ love: -6 }, { stat: 'happiness', delta: -3 }, { log: 'I said "oh." Then "wow." Then nothing. The walk home was very quiet.' }],
      },
      {
        id: 'thanks',
        label: 'Say "thank you"',
        effects: [
          { love: -12 },
          { relationship: 'person', delta: -5 },
          { stat: 'happiness', delta: -5 },
          { log: 'I said "thank you." {{person}} laughed, then did not. I will be hearing about this for years.', kind: 'bad' },
        ],
      },
      {
        id: 'honest',
        label: 'Be honest: not yet',
        effects: [
          { karma: 2 },
          { love: -3 },
          { stat: 'happiness', delta: -1 },
          { log: "I said I wasn't there yet but wanted to be. {{person}} nodded. Honest, and it stung for both of us." },
        ],
      },
    ],
  },
  {
    id: 'ya_meet_the_parents',
    category: 'random',
    title: 'Dinner with the parents',
    text: '{{person}} wants me to meet {{their}} parents this weekend. Dinner at the family house. Apparently {{their}} dad "has questions" and {{their}} mom "just wants to see me eat."',
    minAge: 18,
    maxAge: 29,
    weight: 1.5,
    once: true,
    conditions: [{ inPrison: false }, { hasLover: true }, { married: false }],
    person: { kind: ['lover'] },
    choices: [
      {
        id: 'charm',
        label: 'Bring flowers and charm',
        hint: '{{$60}}',
        conditions: [{ notTrait: 'charming' }],
        effects: [
          { money: -60 },
          {
            chance: 0.65,
            then: [{ love: 8 }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 5 }, { log: 'I praised the roast, laughed at every joke and passed every test. {{person}} looked relieved.', kind: 'good' }],
            else: [{ love: -3 }, { stat: 'happiness', delta: -3 }, { log: "I spilled gravy on the tablecloth and called the dog by the wrong name. Recoverable, I'm told.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'natural',
        label: 'Bring flowers and charm',
        hint: '{{$60}}, charming: better odds',
        conditions: [{ trait: 'charming' }],
        effects: [
          { money: -60 },
          {
            chance: 0.9,
            then: [{ love: 10 }, { relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 6 }, { log: "{{person}}'s mom sent me home with leftovers, and {{their}} dad shook my hand twice. {{person}} glowed.", kind: 'good' }],
            else: [{ love: -3 }, { stat: 'happiness', delta: -3 }, { log: "I spilled gravy on the tablecloth and called the dog by the wrong name. Recoverable, I'm told.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'self',
        label: 'Just be myself',
        effects: [
          {
            chance: 0.5,
            then: [{ love: 6 }, { stat: 'happiness', delta: 4 }, { log: 'I was myself. {{person}}\'s mom called me "a character," which {{they}} swears is a compliment.', kind: 'good' }],
            else: [{ love: -2 }, { stat: 'happiness', delta: -2 }, { log: 'I was myself. It was a lot. {{person}}\'s dad asked about my "prospects." Twice.' }],
          },
        ],
      },
      {
        id: 'excuse',
        label: 'Fake a stomach bug',
        effects: [
          { love: -10 },
          { stat: 'happiness', delta: 1 },
          { karma: -2 },
          { log: 'I faked a stomach bug. {{person}} knew. The parents knew. The dog probably knew.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'ya_move_in_together',
    category: 'random',
    title: 'The imaginary plant',
    text: '{{person}} slid a listing across the table: a one-bedroom, split rent, "closer to everything." {{They}} has already named the imaginary plant we would buy.',
    minAge: 20,
    maxAge: 29,
    weight: 1.5,
    once: true,
    conditions: [{ inPrison: false }, { hasLover: true }, { married: false }],
    person: { kind: ['lover'] },
    choices: [
      {
        id: 'yes',
        label: 'Move in together',
        effects: [
          { love: 10 },
          { relationship: 'person', delta: 5 },
          { stat: 'happiness', delta: 6 },
          { money: -500 },
          { log: 'We moved in: a deposit, a borrowed van, one closet and endless talks about the thermostat. Happy.', kind: 'milestone' },
          { chance: 0.2, then: [{ stat: 'happiness', delta: -2 }, { log: 'Turns out {{they}} snores. Loudly. I now own earplugs.' }] },
        ],
      },
      {
        id: 'trial',
        label: 'Suggest a trial month',
        effects: [{ love: 3 }, { stat: 'happiness', delta: 2 }, { log: 'We tried a month. It mostly worked. The plant is named Gerald and is thriving.', kind: 'good' }],
      },
      {
        id: 'notyet',
        label: "Say I'm not ready",
        effects: [
          { love: -8 },
          { relationship: 'person', delta: -3 },
          { stat: 'happiness', delta: -2 },
          { karma: 1 },
          { log: 'I said I liked my own space. {{person}} said "okay" and went quiet for the rest of dinner.' },
        ],
      },
    ],
  },
  {
    id: 'ya_long_distance',
    category: 'random',
    // Already apart, not the job-offer decision (lf_partner_job_far), and never within two years of it.
    title: 'Four hours by train',
    text: '{{person}} took a six-month posting in another city, four hours away by train. Tonight is our first Friday apart, and we have to decide how this is going to work.',
    minAge: 20,
    maxAge: 29,
    weight: 1.5,
    cooldown: 5,
    conditions: [{ inPrison: false }, { hasLover: true }, { married: false }, { not: { sinceEvent: 'lf_partner_job_far', lte: 2 } }],
    person: { kind: ['lover'] },
    choices: [
      {
        id: 'support',
        label: 'Visit every other weekend',
        hint: '{{$600}}',
        effects: [
          { money: -600 },
          { energy: -1 },
          {
            chance: 0.6,
            then: [{ love: 8 }, { stat: 'happiness', delta: 3 }, { log: 'Six months of Friday trains and Sunday goodbyes. Expensive, tiring, and it held.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -8 }, { log: 'The trains got later and the weekends shorter. By month five it was a kind, awful phone call.', kind: 'bad' }, { removePerson: true }],
          },
        ],
      },
      {
        id: 'stay',
        label: 'Write long letters',
        effects: [{ love: 4 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 1 }, { log: 'We wrote every week, real letters with stamps. I have a shoebox of them now.', kind: 'good' }],
      },
      {
        id: 'follow',
        label: 'Surprise {{them}} this weekend',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          {
            chance: 0.6,
            then: [{ love: 8 }, { stat: 'happiness', delta: 5 }, { log: 'I turned up at {{their}} door unannounced. {{person}} cried, then made me dinner.', kind: 'good' }],
            else: [{ love: -3 }, { stat: 'happiness', delta: -3 }, { log: 'I surprised {{person}} on the one weekend {{they}} had to work. We had a very short dinner.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'end',
        label: 'Call it off for now',
        effects: [{ removePerson: true }, { stat: 'happiness', delta: -8 }, { karma: 1 }, { log: 'We ended it before the distance could. Sad, grown-up, and probably right.' }],
      },
    ],
  },
  {
    id: 'ya_forgot_anniversary',
    category: 'random',
    // An evening ambush, not the breakfast in ad_anniversary_forgot.
    title: 'Flowers at the door',
    text: '{{person}} met me at the door with flowers and a dinner reservation at eight. It is our anniversary, it turns out. I have a bus ticket and half a sandwich.',
    minAge: 18,
    maxAge: 29,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }, { hasLover: true }],
    person: { kind: ['lover', 'spouse'] },
    choices: [
      {
        id: 'emergency',
        label: 'Rush out for a gift',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          {
            chance: 0.7,
            then: [{ love: 3 }, { log: 'I "forgot my wallet," ran to the corner shop and came back with chocolate and a card. Transparent. Appreciated.', kind: 'good' }],
            else: [{ love: -3 }, { stat: 'happiness', delta: -2 }, { log: 'The only shop still open sold motor oil and mints. {{person}} called the mints "thoughtful." They were not.' }],
          },
        ],
      },
      {
        id: 'confess',
        label: 'Confess and apologize',
        effects: [
          { karma: 2 },
          { love: -4 },
          { stat: 'happiness', delta: -2 },
          { log: 'I confessed. {{person}} was hurt and gracious. I wrote the date in every calendar I will ever own.' },
        ],
      },
      {
        id: 'bluff',
        label: 'Claim my gift is on its way',
        effects: [
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ money: -400 }, { love: 6 }, { log: 'I had a gift rushed over the next morning, at great expense. The lie became true. {{person}} never knew.', kind: 'good' }],
            else: [{ love: -10 }, { relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -4 }, { log: 'The gift "on its way" never came, because I forgot that too. {{person}} did not forget.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ya_blind_date',
    category: 'random',
    // A setup with a chaperone, not the friend's blind date in lf_blind_date, and never within two years of it.
    title: 'A table for three',
    text: '{{person}} is sure I would hit it off with {{their}} coworker and has booked a table for three, "so it isn\'t weird." It is going to be weird.',
    minAge: 18,
    maxAge: 29,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }, { hasLover: false }, { not: { sinceEvent: 'lf_blind_date', lte: 2 } }],
    // A grown-up with coworkers of {{their}} own.
    person: { kind: ['friend', 'bestFriend', 'sibling'], minAge: 18 },
    choices: [
      {
        id: 'go',
        label: 'Go to dinner',
        hint: '{{$60}}',
        effects: [
          { money: -60 },
          {
            random: [
              {
                weight: 2,
                effects: [
                  { stat: 'happiness', delta: 6 },
                  { log: '{{person}} left before dessert, on purpose. Against every prediction, it went well.', kind: 'good' },
                  { newPerson: { kind: 'lover', relationship: 60, log: 'I started dating {{person}}, the coworker from the table for three.' } },
                ],
              },
              { weight: 2, effects: [{ stat: 'happiness', delta: -2 }, { log: '{{person}} and the coworker talked shop all night. I nodded and ate the bread.' }] },
              {
                weight: 1,
                effects: [
                  { stat: 'happiness', delta: 3 },
                  { relationship: 'person', delta: 3 },
                  { log: 'No spark, but the three of us laughed until closing. {{person}} claims a new friend counts as a win.' },
                  { newPerson: { kind: 'friend', relationship: 50, log: 'The setup became a friend instead: {{person}}.' } },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'cancel',
        label: 'Cancel last minute',
        effects: [{ relationship: 'person', delta: -4 }, { karma: -1 }, { stat: 'happiness', delta: 1 }, { log: '{{person}} had dinner with the coworker anyway and reported back in great detail. I was not missed.' }],
      },
      {
        id: 'double',
        label: 'Make it a group dinner',
        hint: '{{$80}}',
        effects: [
          { money: -80 },
          { relationship: 'person', delta: 4 },
          { stat: 'happiness', delta: 3 },
          { log: 'I brought two more friends. With five at the table the pressure vanished, and so did most of the romance.' },
          { chance: 0.3, then: [{ newPerson: { kind: 'lover', relationship: 55, log: 'The group dinner worked anyway: I started seeing {{person}}.' } }] },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ nightlife
  {
    id: 'ya_club_temptation',
    category: 'random',
    title: 'The tiny bag',
    text: 'Late night, loud club. In the bathroom line, a stranger with very friendly pupils offered me something from a tiny bag and said it would "fix everything."',
    minAge: 18,
    maxAge: 29,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'decline',
        label: 'Say no, go dance',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: 3 }, { stat: 'health', delta: -1 }, { log: 'I said no and went back to the floor. The music was enough. The stranger moved on.', kind: 'good' }],
      },
      {
        id: 'take',
        label: 'Take it',
        effects: [
          { karma: -2 },
          { addiction: 'drugs', delta: 12 },
          { stat: 'health', delta: -5 },
          { stat: 'happiness', delta: 2 },
          {
            random: [
              { weight: 3, effects: [{ log: 'A wild night, a terrible morning, and a creeping urge to do it again. That urge is the problem.', kind: 'bad' }] },
              {
                weight: 1,
                effects: [{ injury: 5 }, { stat: 'happiness', delta: -8 }, { money: -800 }, { log: 'I ended up in the hospital with a racing heart and a bill. The "fix everything" guy was long gone.', kind: 'bad' }],
              },
            ],
          },
        ],
      },
      {
        id: 'leave',
        label: 'Leave the club',
        effects: [{ stat: 'happiness', delta: -1 }, { stat: 'health', delta: 1 }, { log: 'I left, bought fries, walked home. Sometimes the best night out ends at eleven.' }],
      },
    ],
  },
];

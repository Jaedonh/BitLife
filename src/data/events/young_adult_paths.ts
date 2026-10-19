import type { EventDef } from '@/engine/events/schema';

/**
 * Young-adult paths. Ages 18-29 unless noted:
 * - neither studying nor working: a trade course pitch, an army recruiter (flavor only), library
 *   volunteering, a gap year and life in my childhood bedroom;
 * - job hunting for unemployed adults 18-64, and a first full-time job;
 * - university life for enrolled undergraduates, ending with walking at commencement;
 * - renters 20-59 (no home of my own, a job or a spouse, and { atHome: false });
 * - young parenthood with a child under five, from the parent's side.
 * Job portals, email and apps wait for their era with a { year } gate; the rest reads the same in 1995 and 2025.
 * The engine has no "lives with parents" state, so the childhood-bedroom events require that I have
 * no job, spouse, child or house, and either never had my own place (ya_first_apartment,
 * ya_move_in_together) or moved back home (ya_house_rules is only queued by that choice).
 */
export const YOUNG_ADULT_PATHS_EVENTS: EventDef[] = [
  // ------------------------------------------------- neither studying nor working
  {
    id: 'yp_trade_pitch',
    category: 'work',
    title: 'The trade course flyer',
    text: 'A man at the community center handed me a flyer: a one-year evening course in electrical and plumbing basics, then a shot at an apprenticeship. "Nobody ever regrets knowing how to fix a pipe," he said.',
    minAge: 18,
    maxAge: 29,
    weight: 2.5,
    once: true,
    conditions: [{ hasJob: false }, { enrolled: false }],
    choices: [
      {
        id: 'enroll',
        label: 'Sign up for the course',
        hint: '{{$600}}',
        effects: [
          { money: -600 },
          { stat: 'smarts', delta: 3 },
          { stat: 'happiness', delta: 2 },
          { flag: 'yp_trade_course', set: true },
          { log: 'I signed up for the evening course. Week one was mostly about which things not to touch.', kind: 'good' },
        ],
      },
      {
        id: 'trial',
        label: 'Try one free class',
        effects: [
          {
            random: [
              {
                weight: 30,
                effects: [
                  { stat: 'smarts', delta: 2 },
                  { stat: 'happiness', delta: 3 },
                  { flag: 'yp_trade_course', set: true },
                  { log: 'The instructor said I had steady hands and found me a free spot in the course. I start Monday.', kind: 'good' },
                ],
              },
              { weight: 35, effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I spent an evening learning to strip wire. My fingers ached and my head felt oddly calm.' }] },
              { weight: 35, effects: [{ stat: 'happiness', delta: -1 }, { log: 'The free class was a two-hour safety video. I now know where every exit is.' }] },
            ],
          },
        ],
      },
      {
        id: 'pass',
        label: 'Say it is not for me',
        effects: [{ stat: 'happiness', delta: 1 }, { log: "I said trades weren't for me. He said he'd said the same at my age, and left it there." }],
      },
    ],
  },
  {
    id: 'yp_trade_certificate',
    category: 'work',
    title: 'Certified',
    text: 'Ever since I finished the evening trade course, word has traveled. The certificate is on my wall, and three neighbors have asked me this month alone to "just take a quick look" at something.',
    minAge: 19,
    maxAge: 40,
    weight: 2,
    once: true,
    conditions: [{ flag: 'yp_trade_course' }],
    choices: [
      {
        id: 'charge',
        label: 'Charge a fair rate',
        effects: [
          {
            chance: 0.85,
            then: [{ money: 700 }, { stat: 'happiness', delta: 3 }, { log: 'I fixed faucets and outlets on weekends at a fair rate. My hands smell like copper now.', kind: 'money' }],
            else: [{ money: 300 }, { stat: 'happiness', delta: -2 }, { log: 'One repair went wrong and I paid for the new part myself. Lesson learned: label the wires.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'free',
        label: 'Help them for free',
        effects: [
          { money: -50 },
          { karma: 3 },
          { stat: 'happiness', delta: 2 },
          { log: 'I fixed three leaks for nothing but the cost of parts. The street now waves at me.', kind: 'good' },
          { chance: 0.5, then: [{ newPerson: { kind: 'friend', relationship: 55, minAge: 30, maxAge: 70, log: '{{person}} from down the street paid me back in casseroles and became a friend.' } }] },
        ],
      },
      {
        id: 'busy',
        label: 'Pretend to be booked',
        effects: [{ stat: 'happiness', delta: 1 }, { karma: -1 }, { log: 'I said I was booked solid. I was on the couch, certified and unbothered.' }],
      },
    ],
  },
  {
    id: 'yp_army_recruiter',
    category: 'work',
    title: "The recruiter's table",
    text: 'An army recruiter set up a folding table at the mall with a banner, a pull-up bar and free bottles of water. He spotted me from across the food court. I was not fast enough.',
    minAge: 18,
    maxAge: 24,
    weight: 1,
    once: true,
    conditions: [{ hasJob: false }, { enrolled: false }],
    choices: [
      {
        id: 'listen',
        label: 'Hear him out',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 1 }, { log: 'He talked about discipline, travel and college money. I took a brochure and said I would think.' }],
      },
      {
        id: 'pullups',
        label: 'Try the pull-up bar',
        effects: [
          { stat: 'health', delta: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I did twelve pull-ups. He wrote my name down with real respect.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I did one and a half pull-ups. He said "that\'s a start" very kindly.' }],
          },
        ],
      },
      {
        id: 'questions',
        label: 'Ask the hard questions',
        effects: [{ stat: 'smarts', delta: 2 }, { karma: 1 }, { log: 'I asked about contract length, deployments and the fine print. He answered most of it.' }],
      },
      {
        id: 'flee',
        label: 'Grab a water and go',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I took a free water and speed-walked into a shoe store. He saluted my retreat.' }],
      },
    ],
  },
  {
    id: 'yp_reading_volunteer',
    category: 'random',
    title: 'Reading partner',
    text: "With my days wide open, I volunteered for the library's adult reading program. My first partner is a retired bus driver learning to read at sixty-three. He brought two sharpened pencils and a lot of nerve.",
    minAge: 18,
    maxAge: 29,
    weight: 1,
    once: true,
    conditions: [{ hasJob: false }, { enrolled: false }],
    choices: [
      {
        id: 'year',
        label: 'Stick with it all year',
        effects: [
          { energy: -1 },
          { karma: 4 },
          { stat: 'happiness', delta: 4 },
          { stat: 'smarts', delta: 1 },
          { log: 'I showed up every Tuesday. By summer he was reading street signs out loud, just because.', kind: 'good' },
          { chance: 0.6, then: [{ newPerson: { kind: 'friend', relationship: 60, gender: 'male', minAge: 63, maxAge: 63, log: '{{person}}, my reading partner, read me a whole page in June. We are friends now.' } }] },
        ],
      },
      {
        id: 'few',
        label: 'Do a few sessions',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: 2 }, { log: 'I did a month of Tuesdays, then let it slide. He sent a thank-you card he wrote himself.' }],
      },
      {
        id: 'flyers',
        label: 'Make their flyers instead',
        effects: [{ stat: 'smarts', delta: 1 }, { karma: 1 }, { log: 'I redesigned the program flyer. Fourteen people signed up. None of them ever met me.' }],
      },
    ],
  },
  {
    id: 'yp_gap_year',
    category: 'family',
    title: 'The gap year',
    text: 'Everyone from my class has scattered to college or jobs. I told {{person}} I am taking a gap year. {{They}} asked, very calmly, what exactly would be in the gap.',
    minAge: 18,
    maxAge: 19,
    weight: 2,
    once: true,
    conditions: [{ hasJob: false }, { enrolled: false }, { hasDegree: false }, { married: false }, { hasChildren: false }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'farm',
        label: 'Work on a farm abroad',
        hint: '{{$900}} flights',
        effects: [
          { money: -900 },
          { stat: 'health', delta: 3 },
          { stat: 'happiness', delta: 6 },
          { relationship: 'person', delta: -1 },
          { log: 'I picked apples abroad for four months in exchange for room and board. I can now lift anything.', kind: 'good' },
        ],
      },
      {
        id: 'save',
        label: 'Do odd jobs and save',
        effects: [
          { money: 1500 },
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: 4 },
          { log: 'I mowed lawns and walked dogs and saved almost every cent. {{person}} was quietly impressed.', kind: 'money' },
        ],
      },
      {
        id: 'read',
        label: 'Read the whole library',
        effects: [{ stat: 'smarts', delta: 5 }, { stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -2 }, { log: '{{person}} said reading sixty books is not a job. I said it was a gap. We were both right.' }],
      },
      {
        id: 'rest',
        label: 'Rest, honestly',
        effects: [{ stat: 'happiness', delta: 4 }, { stat: 'health', delta: 1 }, { relationship: 'person', delta: -5 }, { log: 'I slept until noon for most of a year. {{person}} began leaving job ads on my pillow.' }],
      },
    ],
  },
  {
    id: 'yp_home_rent',
    category: 'family',
    title: 'Rent at home',
    text: '{{person}} slid a sheet of paper across the kitchen table. It is an invoice. I am being charged {{$150}} a month to live in my own childhood bedroom, "so you learn how the world works."',
    minAge: 18,
    maxAge: 24,
    weight: 1.5,
    once: true,
    conditions: [
      { hasJob: false },
      { enrolled: false },
      { noAsset: 'house' },
      { married: false },
      { hasChildren: false },
      { any: [{ all: [{ eventNotFired: 'ya_first_apartment' }, { eventNotFired: 'ya_move_in_together' }] }, { eventFired: 'ya_house_rules' }] },
    ],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'pay',
        label: 'Pay it every month',
        hint: '{{$1800}} a year',
        effects: [{ money: -1800 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: -2 }, { log: '{{person}} stamped every invoice PAID with real ceremony. I felt very grown up and very broke.', kind: 'money' }],
      },
      {
        id: 'chores',
        label: 'Offer chores instead',
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'health', delta: 1 }, { stat: 'happiness', delta: -1 }, { log: 'We swapped the rent for dishes, laundry and the lawn. I have never been so clean.' }],
      },
      {
        id: 'haggle',
        label: 'Negotiate the price',
        effects: [
          {
            chance: 0.5,
            then: [{ money: -900 }, { stat: 'happiness', delta: 2 }, { log: 'I got it down to {{$75}} by pointing out my broken blinds. {{person}} respected the hustle.', kind: 'good' }],
            else: [{ money: -1800 }, { relationship: 'person', delta: -3 }, { log: '{{person}} heard my case, then added a late fee for "attitude." I paid in full.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse on principle',
        effects: [{ relationship: 'person', delta: -8 }, { stat: 'happiness', delta: 1 }, { log: 'I refused to pay. {{person}} took my bedroom door off its hinges "for repairs." It has been six weeks.' }],
      },
    ],
  },
  {
    id: 'yp_home_gym',
    category: 'family',
    title: 'The rowing machine',
    text: '{{person}} is turning my bedroom into a home gym while I still sleep in it. First a yoga mat appeared. Then a rack of weights. This morning I woke up next to a rowing machine.',
    minAge: 18,
    maxAge: 26,
    weight: 1,
    once: true,
    conditions: [
      { hasJob: false },
      { enrolled: false },
      { noAsset: 'house' },
      { married: false },
      { hasChildren: false },
      { any: [{ all: [{ eventNotFired: 'ya_first_apartment' }, { eventNotFired: 'ya_move_in_together' }] }, { eventFired: 'ya_house_rules' }] },
    ],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'join',
        label: 'Join the workouts',
        effects: [{ stat: 'health', delta: 5 }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: -1 }, { log: 'I started rowing with {{person}} at six a.m. We are both fitter, and I am a little afraid of {{them}}.', kind: 'good' }],
      },
      {
        id: 'protest',
        label: 'Protest the takeover',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -2 }, { log: 'The rowing machine moved to the garage. The weights stayed. That is called compromise.' }],
            else: [{ relationship: 'person', delta: -5 }, { stat: 'happiness', delta: -2 }, { log: '{{person}} said the room is "in transition," and so, apparently, am I.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'hint',
        label: 'Take the hint',
        effects: [{ stat: 'happiness', delta: -3 }, { stat: 'smarts', delta: 1 }, { relationship: 'person', delta: 2 }, { log: 'I took the hint and started browsing apartment listings, mostly to feel something.' }],
      },
      {
        id: 'closet',
        label: 'Hang laundry on it',
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -3 }, { karma: -1 }, { log: 'The rowing machine is now my closet. {{person}} calls this sabotage.' }],
      },
    ],
  },
  {
    id: 'yp_whats_next',
    category: 'family',
    title: "So, what's next?",
    text: 'At a family dinner, my uncle asked what I am doing these days. The table went quiet. {{person}} jumped in and said I am "exploring options," which somehow made it sound worse.',
    minAge: 18,
    maxAge: 29,
    weight: 1,
    once: true,
    conditions: [{ hasJob: false }, { enrolled: false }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'plan',
        label: 'Describe my grand plan',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I described a plan I invented on the spot. It sounded so good I started to believe it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'My grand plan fell apart under one follow-up question from my uncle.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'truth',
        label: 'Tell the honest truth',
        effects: [{ relationship: 'person', delta: 3 }, { karma: 1 }, { stat: 'happiness', delta: -1 }, { log: 'I said I don\'t know yet. {{person}} squeezed my shoulder under the table.' }],
      },
      {
        id: 'deflect',
        label: 'Steer it to my cousin',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: 1 }, { karma: -1 }, { log: 'I asked my cousin about her wedding plans. The table forgot I existed. I owe her one.' }],
      },
      {
        id: 'hide',
        label: 'Excuse myself to the bathroom',
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -2 }, { log: 'I hid in the bathroom for twelve minutes and came back only for dessert.' }],
      },
    ],
  },

  // ------------------------------------------------- job hunting (18-64)
  {
    id: 'yp_application_portal',
    category: 'work',
    title: 'Create an account',
    text: 'The job application asked me to upload my résumé, then retype all of it into fourteen boxes, then take a ninety-question personality quiz. Question forty-one: would I rather be a cloud or a hammer?',
    minAge: 18,
    maxAge: 64,
    weight: 1.2,
    once: true,
    conditions: [{ hasJob: false }, { enrolled: false }, { retired: false }, { year: { gte: 2005 } }],
    choices: [
      {
        id: 'honest',
        label: 'Answer honestly',
        effects: [
          {
            random: [
              { weight: 50, effects: [{ stat: 'happiness', delta: -2 }, { log: 'I said cloud. The automated rejection arrived eleven minutes later.', kind: 'bad' }] },
              { weight: 50, effects: [{ stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 1 }, { log: 'I said hammer and meant it. A real human emailed me back. It went nowhere, but a human!', kind: 'good' }] },
            ],
          },
        ],
      },
      {
        id: 'game',
        label: 'Answer like a motivational poster',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'I answered like a motivational poster and passed the quiz. Then I never heard another word.' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'My answers contradicted each other so badly that the system flagged me as "inconsistent."', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'close',
        label: 'Close the tab',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I closed the tab. Some walls are not worth climbing.' }],
      },
      {
        id: 'local',
        label: 'Walk into a local shop',
        effects: [
          { energy: -1 },
          { stat: 'smarts', delta: 1 },
          { log: 'I handed my résumé to a hardware store owner in person. He read it on the spot. Old school.' },
        ],
      },
    ],
  },
  {
    id: 'yp_interview_chair',
    category: 'work',
    title: 'The decorative chair',
    text: 'The interview was going well until I leaned back in a chair that turned out to be decorative. I am now on the floor of a conference room, and three managers are looking down at me.',
    minAge: 18,
    maxAge: 64,
    weight: 1,
    once: true,
    conditions: [{ hasJob: false }, { enrolled: false }, { retired: false }],
    choices: [
      {
        id: 'joke',
        label: 'Make a joke',
        effects: [
          {
            chance: 0.55,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'I said I had already fallen for the company. They laughed. I left with a firm handshake.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'Nobody laughed. I finished the interview standing up, like a hostage.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'dignity',
        label: 'Rise with dignity',
        effects: [
          { stat: 'smarts', delta: 1 },
          { karma: 1 },
          { log: 'I stood, straightened my shirt and answered the next question as if nothing had happened.' },
          { chance: 0.3, then: [{ stat: 'health', delta: -2 }, { log: 'My elbow turned a remarkable shade of purple by evening.', kind: 'bad' }] },
        ],
      },
      {
        id: 'blame',
        label: 'Blame the chair',
        effects: [{ karma: -1 }, { stat: 'happiness', delta: 1 }, { log: 'I told them their chair was a safety hazard. They agreed. They did not call back.' }],
      },
    ],
  },
  {
    id: 'yp_rejection_email',
    category: 'work',
    title: 'Other candidates',
    text: 'The email arrived at 11:58 p.m. on a Sunday: "After careful consideration, we have decided to move forward with other candidates." It was the job I had already pictured myself doing, right down to the desk plant.',
    minAge: 18,
    maxAge: 64,
    weight: 1.2,
    cooldown: 24,
    conditions: [{ hasJob: false }, { enrolled: false }, { retired: false }, { year: { gte: 1998 } }],
    choices: [
      {
        id: 'feedback',
        label: 'Ask for feedback',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: 2 }, { log: 'The hiring manager actually replied with three honest tips. I taped them above my desk.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I asked for feedback and received a second, slightly different rejection.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'gracious',
        label: 'Reply graciously',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: -1 }, { log: 'I thanked them for their time and meant about half of it. Bridges intact.' }],
      },
      {
        id: 'apply',
        label: 'Apply to five more',
        effects: [{ energy: -1 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -2 }, { log: 'I sent five more applications before bed. Revenge, but productive.' }],
      },
      {
        id: 'fries',
        label: 'Mourn with fries',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'health', delta: -2 }, { money: -15 }, { log: 'I mourned the desk plant with a very large order of fries.' }],
      },
    ],
  },
  {
    id: 'yp_ghosted',
    category: 'work',
    title: 'By Friday',
    text: 'The second interview felt perfect. They said I would hear back by Friday. It is now the fourth Friday since, and my inbox holds nothing but a coupon for a mattress.',
    minAge: 18,
    maxAge: 64,
    weight: 1,
    cooldown: 24,
    conditions: [{ hasJob: false }, { enrolled: false }, { retired: false }, { year: { gte: 2000 } }],
    choices: [
      {
        id: 'email',
        label: 'Send a polite follow-up',
        effects: [
          {
            chance: 0.35,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'They wrote back: the role is "paused." At least it is not me. Probably.' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'My follow-up was opened, I suspect, and then nothing. A ghost with read receipts.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'call',
        label: 'Call the office',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 2 }, { log: "The receptionist admitted they hired the owner's nephew. Strangely, that helped." }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I left a voicemail and said "just circling back" three times. I think about it nightly.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'release',
        label: 'Let it go',
        effects: [{ stat: 'happiness', delta: -1 }, { karma: 1 }, { log: 'I let it go. Somewhere, a hiring manager thinks of me fondly and does nothing about it.' }],
      },
      {
        id: 'unsubscribe',
        label: 'Ghost them back',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I unsubscribed from their newsletter. It was the only power I had.' }],
      },
    ],
  },
  {
    id: 'yp_trial_shift',
    category: 'work',
    title: 'Unpaid trial',
    text: 'A café owner liked my application and asked me to come in Saturday for a "trial shift." Eight hours, unpaid, "to see if you\'re a fit." She handed me an apron with somebody else\'s name on it.',
    minAge: 18,
    maxAge: 64,
    weight: 1,
    once: true,
    conditions: [{ hasJob: false }, { enrolled: false }, { retired: false }],
    choices: [
      {
        id: 'work',
        label: 'Work the whole shift',
        effects: [
          { stat: 'health', delta: -2 },
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.4,
            then: [{ money: 120 }, { stat: 'happiness', delta: 3 }, { log: 'She paid me for the day after all, plus tips. No job yet, but I make a mean latte now.', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'Eight hours of free work and a "we\'ll be in touch." The name on the apron was Doreen.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'paid',
        label: 'Ask to be paid',
        effects: [
          {
            chance: 0.5,
            then: [{ money: 100 }, { stat: 'happiness', delta: 3 }, { log: 'She blinked, then agreed to pay for the day. I felt like a union of one.', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'She said plenty of people would do it for free. I believe her, which is the sad part.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'two',
        label: 'Stay two hours',
        effects: [{ stat: 'happiness', delta: 1 }, { karma: -1 }, { log: 'I worked two hours and told her I had seen enough. So had she.' }],
      },
      {
        id: 'decline',
        label: 'Turn it down',
        effects: [{ stat: 'happiness', delta: 2 }, { log: "I said I don't work for free. I spent Saturday not working, also for free." }],
      },
    ],
  },
  {
    id: 'yp_temp_agency',
    category: 'work',
    title: 'On call',
    text: 'A temp agency put me on its list. They can call any morning with a day of work: stocking shelves, filing, and once, I am told, holding a sign shaped like a hot dog on a busy corner.',
    minAge: 18,
    maxAge: 64,
    weight: 1,
    once: true,
    conditions: [{ hasJob: false }, { enrolled: false }, { retired: false }],
    choices: [
      {
        id: 'every',
        label: 'Take every call',
        effects: [{ money: 900 }, { stat: 'health', delta: -3 }, { stat: 'happiness', delta: -1 }, { log: 'I took every gig going. Warehouses, filing rooms, one hot dog. Tired, paid, well-rounded.', kind: 'money' }],
      },
      {
        id: 'desk',
        label: 'Only take desk work',
        effects: [{ money: 400 }, { stat: 'smarts', delta: 1 }, { log: "I took the quiet desk gigs. I learned three filing systems and one stranger's whole divorce.", kind: 'money' }],
      },
      {
        id: 'hotdog',
        label: 'Request the hot dog',
        effects: [{ money: 150 }, { stat: 'happiness', delta: 4 }, { stat: 'health', delta: -1 }, { log: 'I held the hot dog sign proudly all day. Children waved. I waved back with the hot dog.', kind: 'good' }],
      },
      {
        id: 'ignore',
        label: 'Let it ring',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I let the phone ring. The agency took me off the list, very politely.' }],
      },
    ],
  },
  {
    id: 'yp_referral',
    category: 'work',
    title: 'Pass it along',
    text: '{{person}} knows a hiring manager from {{their}} book club and offered to pass my résumé along. "No pressure," {{they}} added, the way people do when there is pressure.',
    minAge: 18,
    maxAge: 64,
    weight: 1,
    cooldown: 24,
    conditions: [{ hasJob: false }, { enrolled: false }, { retired: false }],
    person: { kind: ['friend', 'bestFriend'], minAge: 20, minRelationship: 40 },
    choices: [
      {
        id: 'polish',
        label: 'Polish my résumé first',
        effects: [
          { energy: -1 },
          { stat: 'smarts', delta: 2 },
          { relationship: 'person', delta: 3 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'The manager interviewed me as a favor and said I came very close. {{person}} bought me lunch.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'The manager hired from inside. {{person}} said it wasn\'t me, twice, which was suspicious.' }],
          },
        ],
      },
      {
        id: 'asis',
        label: 'Send it as it is',
        effects: [
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'The manager called my résumé "refreshingly direct." No job, but a very nice phone call.' }],
            else: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -2 }, { log: 'The manager found a typo in the word "detail." {{person}} heard about it at book club.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'pride',
        label: 'Decline out of pride',
        effects: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: 1 }, { log: "I said I'd rather get in on my own. {{person}} said that was fine, and mostly meant it." }],
      },
    ],
  },
  {
    id: 'yp_first_day',
    category: 'work',
    title: 'First week',
    text: 'First week at my first full-time job. I am officially a {{job}}. I have a name tag, a stack of forms, and a growing list of people whose names I should know by now.',
    minAge: 18,
    maxAge: 25,
    weight: 3,
    once: true,
    conditions: [{ hasJob: true }, { partTime: false }, { count: 'jobsHeld', lte: 1 }, { count: 'yearsEmployed', lte: 1 }],
    choices: [
      {
        id: 'questions',
        label: 'Ask a hundred questions',
        effects: [{ stat: 'smarts', delta: 2 }, { jobPerformance: 4 }, { stat: 'happiness', delta: -1 }, { log: 'I asked about everything. By Friday I knew where things were, and whom to avoid.', kind: 'good' }],
      },
      {
        id: 'fake',
        label: 'Fake total confidence',
        effects: [
          {
            chance: 0.5,
            then: [{ jobPerformance: 5 }, { stat: 'happiness', delta: 2 }, { log: 'I acted like I knew what I was doing until, around Thursday, I actually did.', kind: 'good' }],
            else: [{ jobPerformance: -4 }, { stat: 'happiness', delta: -3 }, { log: 'I nodded through instructions I did not understand and redid a whole day of work.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'snacks',
        label: 'Bring pastries on day two',
        hint: '{{$40}}',
        effects: [{ money: -40 }, { relationship: 'coworker', delta: 3 }, { jobPerformance: 1 }, { stat: 'happiness', delta: 2 }, { log: 'I brought pastries on day two. I am now "the pastry one." There are worse names.' }],
      },
      {
        id: 'quiet',
        label: 'Keep my head down',
        effects: [{ jobPerformance: 2 }, { stat: 'happiness', delta: -2 }, { log: 'I kept quiet and worked. By Friday, two people still thought I was a temp.' }],
      },
    ],
  },
  {
    id: 'yp_first_paycheck',
    category: 'money',
    title: 'The first paycheck',
    text: 'My first full-time paycheck arrived. Taxes, insurance and a line called "other" took a bite before I ever saw it. What is left is still the most money anyone has ever handed me at once.',
    minAge: 18,
    maxAge: 25,
    weight: 2,
    once: true,
    conditions: [{ hasJob: true }, { partTime: false }, { count: 'jobsHeld', lte: 1 }, { count: 'yearsEmployed', lte: 1 }],
    choices: [
      {
        id: 'save',
        label: 'Save every cent',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }, { log: 'I saved all of it and celebrated by looking at the balance. Twice.' }],
      },
      {
        id: 'family',
        label: 'Take my family to dinner',
        hint: '{{$250}}',
        conditions: [{ hasPerson: ['mother', 'father'] }],
        effects: [
          { money: -250 },
          { relationship: 'mother', delta: 4 },
          { relationship: 'father', delta: 4 },
          { karma: 2 },
          { stat: 'happiness', delta: 3 },
          { log: 'I took my family to dinner and grabbed the check. Nobody fought me for it, which stung a bit.', kind: 'good' },
        ],
      },
      {
        id: 'splurge',
        label: 'Buy something ridiculous',
        hint: '{{$400}}',
        effects: [{ money: -400 }, { stat: 'happiness', delta: 5 }, { log: 'I bought very expensive sneakers. They are perfect. My bank account is nervous.', kind: 'money' }],
      },
    ],
  },

  // ------------------------------------------------- university life
  {
    id: 'yp_major_doubt',
    category: 'school',
    title: 'The wrong lecture hall',
    text: 'I took a random elective just to fill my schedule, and it has become the only class I never skip. I read ahead for fun. In my actual major, I mostly read the clock.',
    minAge: 18,
    maxAge: 24,
    weight: 1.5,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['university'] }],
    choices: [
      {
        id: 'minor',
        label: 'Add it as a minor',
        effects: [{ grade: -3 }, { stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: 5 }, { log: 'I added a minor. My schedule is a disaster, but Tuesdays and Thursdays are joyful.', kind: 'good' }],
      },
      {
        id: 'switch',
        label: 'Ask about switching majors',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: -2 }, { log: 'My advisor ran the numbers: switching meant two more years and a lot more debt. I stayed put.' }],
      },
      {
        id: 'focus',
        label: 'Focus on my major',
        effects: [{ grade: 4 }, { stat: 'happiness', delta: -3 }, { log: 'I dropped the extra reading and doubled down on my major. Sensible. Slightly gray.' }],
      },
      {
        id: 'more',
        label: 'Take more electives',
        effects: [{ grade: -5 }, { stat: 'smarts', delta: 4 }, { stat: 'happiness', delta: 3 }, { log: 'I signed up for astronomy and ancient poetry too. My grades wobbled. My brain did cartwheels.' }],
      },
    ],
  },
  {
    id: 'yp_third_roommate',
    category: 'school',
    title: 'The third roommate',
    text: "My roommate's new partner has, without discussion, moved into our dorm room. There is a third toothbrush, a third pillow and a growing list of opinions about where my things should go.",
    minAge: 18,
    maxAge: 23,
    weight: 1,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['university'] }],
    choices: [
      {
        id: 'talk',
        label: 'Talk to my roommate',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'We set rules: weekends only, and nobody touches my shelf. The third toothbrush went home.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'My roommate said I was "creating a vibe." The partner now says good morning to me pointedly.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'report',
        label: 'Report it to housing',
        effects: [
          { karma: -1 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'The resident advisor "reminded everyone of the guest policy." The room got quiet, then frosty.' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'Housing said it would look into it. It is still looking. The partner bought a rug.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'rent',
        label: 'Charge the partner rent',
        effects: [
          { karma: -1 },
          {
            chance: 0.4,
            then: [{ money: 150 }, { stat: 'happiness', delta: 3 }, { log: 'The partner paid me {{$150}} "for the inconvenience" and kept the pillow. Fair.', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The partner laughed so hard at my invoice that they had to sit down. On my bed.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'library',
        label: 'Live in the library',
        effects: [{ grade: 4 }, { stat: 'happiness', delta: -3 }, { stat: 'health', delta: -1 }, { log: 'I practically moved into the library. My best grades ever, and my worst neck.' }],
      },
    ],
  },
  {
    id: 'yp_shifts_vs_midterms',
    category: 'school',
    title: 'Midterm shifts',
    text: 'Midterms are next week, and my boss at {{company}} just asked me to pick up four extra shifts because two people quit. The money would cover a month of groceries. The studying would not happen.',
    minAge: 18,
    maxAge: 24,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ enrolled: true }, { stage: ['university'] }, { hasJob: true }, { partTime: true }, { jobCategory: ['service'] }],
    choices: [
      {
        id: 'take',
        label: 'Take all four shifts',
        effects: [{ money: 400 }, { grade: -6 }, { jobPerformance: 6 }, { stat: 'happiness', delta: -2 }, { log: 'I worked every shift and studied on my breaks. My boss loved me. My grades did not.', kind: 'money' }],
      },
      {
        id: 'refuse',
        label: 'Say I have exams',
        effects: [{ grade: 4 }, { jobPerformance: -5 }, { log: 'I said I needed the week for exams. My boss said "sure" in the coldest way possible.' }],
      },
      {
        id: 'one',
        label: 'Take just one shift',
        effects: [{ money: 100 }, { grade: -1 }, { jobPerformance: 1 }, { log: 'I took one shift and studied the rest. Nobody was thrilled, which felt like fairness.' }],
      },
      {
        id: 'both',
        label: 'Study during the shifts',
        effects: [
          { money: 400 },
          {
            chance: 0.5,
            then: [{ grade: 2 }, { log: 'The shifts were slow. I read my notes between tasks and nobody noticed.', kind: 'good' }],
            else: [{ grade: -2 }, { jobPerformance: -8 }, { log: 'My boss caught me studying flashcards on the clock and was not amused.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'yp_paper_due',
    category: 'school',
    title: 'Due at nine',
    text: 'It is 3 a.m. My paper is due at nine. I have a title, a strong opening sentence and a deep, unshakable feeling. I do not have the other eleven pages.',
    minAge: 18,
    maxAge: 25,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ enrolled: true }, { stage: ['university'] }],
    choices: [
      {
        id: 'write',
        label: 'Write until sunrise',
        effects: [
          { stat: 'health', delta: -3 },
          {
            chance: 0.6,
            then: [{ grade: 5 }, { log: 'Eleven pages, fueled by cold coffee and fear. Somehow it was my best work all year.', kind: 'good' }],
            else: [{ grade: -3 }, { log: 'By page eight I was writing about my feelings about page seven. It showed.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'extension',
        label: 'Beg for an extension',
        effects: [
          {
            chance: 0.5,
            then: [{ grade: 2 }, { stat: 'happiness', delta: 3 }, { log: 'The professor gave me two days and a gentle warning. I slept like a stone.', kind: 'good' }],
            else: [{ grade: -4 }, { stat: 'happiness', delta: -2 }, { log: 'The professor replied at 8:59 with one word: "No." I turned in four pages and hope.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'nap',
        label: 'Sleep two hours first',
        effects: [
          { stat: 'health', delta: 1 },
          {
            chance: 0.5,
            then: [{ grade: 3 }, { log: 'Two hours of sleep, then the words came fast. Science, probably.', kind: 'good' }],
            else: [{ grade: -5 }, { stat: 'happiness', delta: -2 }, { log: 'My alarm and I disagreed about what "two hours" meant. I submitted it at noon.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'yp_professor_mind',
    category: 'school',
    title: 'Office hours',
    text: 'I went to office hours to argue about a grade. Forty minutes later my professor had talked me out of an opinion I had held since I was twelve, and she never once raised her voice.',
    minAge: 18,
    maxAge: 25,
    weight: 1,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['university'] }],
    choices: [
      {
        id: 'admit',
        label: 'Admit she is right',
        effects: [{ stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: -1 }, { karma: 1 }, { grade: 1 }, { log: 'I said, out loud, "I think I was wrong." It stung, then felt like putting down a heavy backpack.', kind: 'good' }],
      },
      {
        id: 'dig',
        label: 'Dig in anyway',
        effects: [{ grade: -1 }, { stat: 'happiness', delta: 3 }, { log: 'I refused to concede, on principle. Walking home, I quietly conceded to myself.' }],
      },
      {
        id: 'reading',
        label: 'Ask what to read',
        effects: [{ stat: 'smarts', delta: 4 }, { grade: 2 }, { stat: 'happiness', delta: -2 }, { energy: -1 }, { log: 'She lent me three books and told me to come back if I still disagreed. I came back twice.' }],
      },
    ],
  },
  {
    id: 'yp_textbook',
    category: 'school',
    title: 'Required reading',
    text: 'The required textbook for one class costs {{$320}} and comes with a workbook that cannot be resold. The professor wrote it. The new edition moved one chapter.',
    minAge: 18,
    maxAge: 25,
    weight: 1,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['university'] }],
    choices: [
      {
        id: 'buy',
        label: 'Buy it new',
        hint: '{{$320}}',
        effects: [{ money: -320 }, { grade: 3 }, { stat: 'happiness', delta: -2 }, { log: 'I bought it new. It smells like a bookstore and quiet resentment.', kind: 'money' }],
      },
      {
        id: 'old',
        label: 'Find an old edition',
        hint: '{{$40}}',
        effects: [
          { money: -40 },
          {
            chance: 0.7,
            then: [{ grade: 1 }, { log: 'The old edition was nearly identical. Chapter nine was simply called chapter ten.', kind: 'good' }],
            else: [{ grade: -3 }, { log: 'The old edition was missing the homework problems. All of them.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'share',
        label: 'Split one with a classmate',
        hint: '{{$160}}',
        effects: [
          { money: -160 },
          {
            chance: 0.6,
            then: [{ grade: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I split a copy with a classmate. We traded it back and forth like a custody arrangement.' }],
            else: [{ grade: -1 }, { stat: 'happiness', delta: -2 }, { log: 'We split a copy. It was always at their place whenever I needed it.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'library',
        label: 'Use the library copy',
        effects: [{ stat: 'happiness', delta: -1 }, { energy: -1 }, { log: 'The library has one copy on two-hour loan. The librarian and I are on a first-name basis.' }],
      },
    ],
  },
  {
    id: 'yp_dorm_fire_alarm',
    category: 'school',
    title: 'The 3 a.m. alarm',
    text: 'The dorm fire alarm went off at 3 a.m. for the third time this month. The whole building is standing outside in pajamas, and someone is holding a smoking toaster oven like evidence.',
    minAge: 18,
    maxAge: 22,
    weight: 1,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['university'] }],
    choices: [
      {
        id: 'blanket',
        label: 'Share my blanket',
        effects: [
          { karma: 2 },
          { stat: 'happiness', delta: 3 },
          { stat: 'health', delta: -1 },
          { log: 'I shared my blanket with whoever was shivering nearest. Strangers, briefly, became a tribe.', kind: 'good' },
          { chance: 0.5, then: [{ newPerson: { kind: 'friend', relationship: 50, minAge: 18, maxAge: 22, log: 'I talked with {{person}} from the fourth floor until the all-clear, and kept talking after.' } }] },
        ],
      },
      {
        id: 'culprit',
        label: 'Name the toaster owner',
        effects: [{ karma: -1 }, { stat: 'happiness', delta: 2 }, { log: 'I pointed out the toaster owner to the resident advisor. The fourth floor hates me a little now.' }],
      },
      {
        id: 'diner',
        label: 'Walk to the all-night diner',
        hint: '{{$12}}',
        effects: [{ money: -12 }, { stat: 'happiness', delta: 3 }, { stat: 'health', delta: -1 }, { grade: -1 }, { log: 'I had pancakes in pajamas at 3:30 a.m. and slept through my nine o\'clock. Zero regrets.' }],
      },
      {
        id: 'study',
        label: 'Study by streetlight',
        effects: [{ grade: 2 }, { stat: 'happiness', delta: -1 }, { log: 'I reviewed flashcards under a streetlight. Everyone thought I was unhinged. I aced the quiz.' }],
      },
    ],
  },
  {
    id: 'yp_commencement',
    category: 'school',
    title: 'Walking the stage',
    text: 'The university mailed my diploma in a cardboard tube, with an invitation to walk at commencement: a rented gown, a tasseled cap and three hours of other people\'s names. {{person}} has already bought a new camera.',
    minAge: 21,
    maxAge: 23,
    weight: 3,
    once: true,
    conditions: [{ hasDegree: true }, { enrolled: false }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'walk',
        label: 'Walk the stage',
        effects: [{ stat: 'happiness', delta: 6 }, { relationship: 'person', delta: 5 }, { log: 'I walked the stage and shook a hand. {{person}} screamed "{{fullName}}!" from the stands.', kind: 'milestone' }],
      },
      {
        id: 'cap',
        label: 'Decorate my cap',
        hint: '{{$20}}',
        effects: [
          { money: -20 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 10 }, { relationship: 'person', delta: 2 }, { fame: 1 }, { log: 'My glitter cap made the official photo gallery. {{person}} printed eight copies.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: 2 }, { log: 'The glitter melted in the sun and ran down my face. The photos are unforgettable.', kind: 'milestone' }],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Skip the ceremony',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: -6 }, { log: 'I skipped commencement and slept in. {{person}} framed the cardboard tube in protest.' }],
      },
    ],
  },

  // ------------------------------------------------- renting
  {
    id: 'yp_ceiling_leak',
    category: 'random',
    title: 'The bucket',
    text: 'A brown stain on my ceiling grew into a drip, and the drip into a steady plink in a bucket. I have emailed the landlord four times. He replied once, to ask whether I had tried a towel.',
    minAge: 20,
    maxAge: 59,
    weight: 1,
    once: true,
    conditions: [{ noAsset: 'house' }, { atHome: false }, { any: [{ hasJob: true }, { married: true }] }, { not: { all: [{ enrolled: true }, { stage: ['university'] }] } }, { year: { gte: 2003 } }],
    choices: [
      {
        id: 'upstairs',
        label: 'Knock on the upstairs door',
        effects: [
          {
            chance: 0.5,
            then: [
              { stat: 'happiness', delta: 3 },
              { newPerson: { kind: 'friend', relationship: 50, minAge: 20, maxAge: 70, log: '{{person}} upstairs had been keeping fish in the bathtub. The fish moved out. We are friends now.' } },
            ],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'Nobody upstairs answered. Nobody upstairs has ever answered. The plink goes on.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'photos',
        label: 'Email him a daily bucket photo',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'After nineteen bucket photos, a plumber appeared. The landlord asked me to stop writing.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'He set up a filter. My bucket photos now go straight to his spam folder.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'diy',
        label: 'Patch it myself',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          {
            chance: 0.5,
            then: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 3 }, { log: 'With a tutorial and the upstairs neighbor\'s blessing, I fixed it. I feel unstoppable.', kind: 'good' }],
            else: [{ money: -300 }, { stat: 'happiness', delta: -3 }, { log: 'I made the hole bigger. It is now a skylight with ambitions.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'bucket',
        label: 'Name the bucket',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'health', delta: -2 }, { log: 'I named the bucket Gerald and emptied him nightly. The damp is getting into my lungs.' }],
      },
    ],
  },
  {
    id: 'yp_new_management',
    category: 'money',
    title: 'New management',
    text: 'My building was sold to a company with a logo shaped like a leaf. It renamed the building "The Fernwood," swapped my door key for an app and added a {{$40}} monthly amenity fee. The amenity is a bench.',
    minAge: 20,
    maxAge: 59,
    weight: 1,
    once: true,
    conditions: [{ noAsset: 'house' }, { atHome: false }, { any: [{ hasJob: true }, { married: true }] }, { not: { all: [{ enrolled: true }, { stage: ['university'] }] } }, { year: { gte: 2012 } }],
    choices: [
      {
        id: 'pay',
        label: 'Pay it and enjoy the bench',
        hint: '{{$480}} a year',
        effects: [{ money: -480 }, { stat: 'happiness', delta: -1 }, { log: 'I paid the {{$480}} and sit on the bench every evening with tea. I am getting my money\'s worth.', kind: 'money' }],
      },
      {
        id: 'organize',
        label: 'Organize the tenants',
        effects: [
          { karma: 2 },
          { energy: -1 },
          {
            chance: 0.45,
            then: [
              { stat: 'happiness', delta: 5 },
              { log: 'Twenty tenants signed my letter. The fee was dropped. The bench stayed, free of charge.', kind: 'good' },
              { newPerson: { kind: 'friend', relationship: 55, minAge: 20, maxAge: 70, log: '{{person}} from the third floor ran the meetings with me. We are friends now.' } },
            ],
            else: [{ money: -480 }, { stat: 'happiness', delta: -4 }, { log: 'Our letter went unanswered, the fee stuck, and management now knows my name.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'key',
        label: 'Keep using my old key',
        hint: '{{$480}} a year',
        effects: [
          { money: -480 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'My old key still opens the side door. The app has sent me nine reminders. I ignore them all.' }],
            else: [{ stat: 'happiness', delta: -3 }, { stat: 'health', delta: -1 }, { log: 'The old locks died at 11 p.m. I sat on the bench until a neighbor let me in. Finally, an amenity.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'yp_thin_walls',
    category: 'random',
    title: 'Thin walls',
    text: "The walls in my building are so thin that I know my neighbor's whole life: his mother's birthday, his sourdough schedule, and that he is about to break up with someone named Dana.",
    minAge: 20,
    maxAge: 59,
    weight: 1,
    once: true,
    conditions: [{ noAsset: 'house' }, { atHome: false }, { any: [{ hasJob: true }, { married: true }] }, { not: { all: [{ enrolled: true }, { stage: ['university'] }] } }],
    choices: [
      {
        id: 'hello',
        label: 'Knock and say hello',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { newPerson: { kind: 'friend', relationship: 50, gender: 'male', minAge: 20, maxAge: 60, log: '{{person}} next door was mortified, then delightful. Now we talk through the wall on purpose.' } }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'He was mortified and now whispers everything. Somehow that is louder.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'noise',
        label: 'Buy a white noise machine',
        hint: '{{$60}}',
        effects: [{ money: -60 }, { stat: 'happiness', delta: 2 }, { stat: 'health', delta: 1 }, { log: 'My machine plays "Ocean" all night. What happened with Dana will remain a mystery.' }],
      },
      {
        id: 'listen',
        label: 'Listen in, a little',
        effects: [{ karma: -2 }, { stat: 'happiness', delta: 3 }, { log: 'I started listening on purpose. It is better than television. I am not proud of it.' }],
      },
      {
        id: 'blankets',
        label: 'Hang blankets on the wall',
        hint: '{{$40}}',
        effects: [{ money: -40 }, { stat: 'happiness', delta: 1 }, { log: 'I hung two thick blankets on the wall. My bedroom now looks like a recording studio.' }],
      },
    ],
  },
  {
    id: 'yp_building_super',
    category: 'random',
    title: 'The super',
    text: 'The building super can fix anything, in an order decided entirely by how much he likes you. My radiator has been on his list since spring. Mrs. Kowalski brings him soup; hers was fixed in an hour.',
    minAge: 20,
    maxAge: 59,
    weight: 1,
    once: true,
    // A radiator wants a climate with winters.
    conditions: [{ noAsset: 'house' }, { atHome: false }, { any: [{ hasJob: true }, { married: true }] }, { not: { all: [{ enrolled: true }, { stage: ['university'] }] } }, { climate: ['snowy', 'mild'] }],
    choices: [
      {
        id: 'soup',
        label: 'Bring him soup',
        hint: '{{$30}}',
        effects: [
          { money: -30 },
          { karma: 1 },
          {
            chance: 0.75,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'Two bowls of soup later, my radiator works and the super knows my name.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'He ate the soup and thanked me sincerely. The radiator stayed on the list.' }],
          },
        ],
      },
      {
        id: 'complain',
        label: 'Complain to the landlord',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'The landlord leaned on him, and the radiator got fixed, grudgingly and loudly.' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The super heard that I complained. My radiator moved to the very bottom of the list.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'self',
        label: 'Fix it myself',
        hint: '{{$50}}',
        effects: [
          { money: -50 },
          { stat: 'smarts', delta: 3 },
          { log: 'I bled the radiator with a key and a library book. The super came by just to look, impressed.' },
          { chance: 0.2, then: [{ injury: 1 }, { log: 'I also scalded my wrist on the valve.', kind: 'bad' }] },
        ],
      },
      {
        id: 'tip',
        label: 'Tip him generously',
        hint: '{{$100}}',
        effects: [{ money: -100 }, { stat: 'happiness', delta: 3 }, { log: 'A crisp {{$100}} got my radiator fixed that afternoon. The soup people are furious.' }],
      },
    ],
  },
  {
    id: 'yp_package_thief',
    category: 'random',
    title: 'Lobby pirate',
    text: 'Third package stolen from the lobby this month. The building camera caught a blurry figure in a hoodie who seems to know exactly when deliveries arrive. Everyone in the tenant group chat has a theory.',
    minAge: 20,
    maxAge: 59,
    weight: 1,
    cooldown: 20,
    conditions: [{ noAsset: 'house' }, { atHome: false }, { any: [{ hasJob: true }, { married: true }] }, { not: { all: [{ enrolled: true }, { stage: ['university'] }] } }, { year: { gte: 2012 } }],
    choices: [
      {
        id: 'locker',
        label: 'Use a pickup locker',
        hint: '{{$20}}',
        effects: [{ money: -20 }, { stat: 'happiness', delta: 2 }, { log: 'I ship everything to a pickup locker now. Mild inconvenience, total victory.' }],
      },
      {
        id: 'camera',
        label: 'Install a door camera',
        hint: '{{$120}}',
        effects: [
          { money: -120 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { karma: 1 }, { log: 'My camera caught a clear face. The building manager had a word, and the boxes came back.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'My camera caught nothing but a raccoon. The thefts stopped anyway, mysteriously.' }],
          },
        ],
      },
      {
        id: 'chat',
        label: 'Lead the group chat',
        effects: [
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.5,
            then: [{ karma: -2 }, { log: 'Our investigation caught nobody and wrongly accused the mail carrier, who was very hurt.', kind: 'bad' }],
            else: [{ stat: 'smarts', delta: 1 }, { log: 'I made a delivery schedule so someone is always home. The thefts dried up. I am the mayor now.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'decoy',
        label: 'Leave a decoy box',
        effects: [
          { karma: -1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I left a box of gravel with a note reading "nice try." It was taken. It was not returned.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'A kind neighbor carried my box of gravel up four flights to "help." I apologized for a week.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'yp_stuck_elevator',
    category: 'random',
    title: 'Between floors',
    text: 'The elevator in my building jerked, groaned and stopped between floors. The emergency button plays music. Pressed into the corner with me is a neighbor I have nodded at for a year and never spoken to.',
    minAge: 20,
    maxAge: 59,
    weight: 1,
    once: true,
    conditions: [{ noAsset: 'house' }, { atHome: false }, { any: [{ hasJob: true }, { married: true }] }, { not: { all: [{ enrolled: true }, { stage: ['university'] }] } }],
    choices: [
      {
        id: 'chat',
        label: 'Make conversation',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 3 }, { newPerson: { kind: 'friend', relationship: 50, minAge: 20, maxAge: 70, log: 'Forty minutes in a box with {{person}}. We came out friends with a shared fear of elevators.' } }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'We ran out of small talk by minute four. Thirty-six silent minutes followed.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'pry',
        label: 'Pry the doors open',
        effects: [
          {
            chance: 0.35,
            then: [{ injury: 3 }, { stat: 'happiness', delta: -3 }, { log: 'I pried the doors apart, climbed out and scraped my whole shin. My neighbor waited for help.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 4 }, { log: 'I pried the doors open and we climbed out onto the floor above. Technically a hero.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'call',
        label: 'Call for help and wait',
        effects: [{ stat: 'happiness', delta: -1 }, { stat: 'health', delta: 1 }, { log: 'Firefighters got us out in twenty minutes, very kindly. I took the stairs for a month.' }],
      },
      {
        id: 'sing',
        label: 'Sing along to the music',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 4 }, { newPerson: { kind: 'friend', relationship: 55, minAge: 20, maxAge: 70, log: '{{person}} joined in on the second chorus. We have been friends ever since.' } }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'My neighbor did not join in. The music looped eleven times. So did I.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'yp_invisible_roommate',
    category: 'random',
    title: 'The roommate I never see',
    text: 'I found my roommate through a listing three months ago and have seen him twice: once when he signed the lease, once at 4 a.m., silently microwaving soup. His rent is always on time. His dishes are not.',
    minAge: 20,
    maxAge: 35,
    weight: 1,
    once: true,
    conditions: [{ noAsset: 'house' }, { atHome: false }, { hasJob: true }, { married: false }, { hasChildren: false }, { eventNotFired: 'ya_move_in_together' }, { not: { all: [{ enrolled: true }, { stage: ['university'] }] } }],
    choices: [
      {
        id: 'knock',
        label: 'Knock on his door',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { newPerson: { kind: 'friend', relationship: 50, gender: 'male', minAge: 20, maxAge: 40, occupation: 'Baker', log: '{{person}} works nights at a bakery. He leaves me bread now. I do his dishes. Peace.' } }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'He opened the door an inch, said "all good?" and closed it again. All good, I guess.' }],
          },
        ],
      },
      {
        id: 'dishes',
        label: 'Just do his dishes',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: -2 }, { log: 'I did his dishes for months. He never said a word. The soup bowls kept coming.' }],
      },
      {
        id: 'stack',
        label: 'Stack them at his door',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'The stack vanished overnight and came back clean. Neither of us has mentioned it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The tower outside his door grew for a week. Then a second tower appeared outside mine.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'move',
        label: 'Find a new place',
        hint: '{{$600}}',
        effects: [{ money: -600 }, { stat: 'happiness', delta: 1 }, { stat: 'health', delta: -1 }, { log: 'I moved in with a roommate I can actually see. It cost {{$600}} and a weekend.' }],
      },
    ],
  },
  {
    id: 'yp_deposit_fight',
    category: 'money',
    title: 'The deposit',
    text: 'My lease is up and I am moving on. At the walk-through, the landlord announced he is keeping {{$900}} of my deposit for "excessive wall wear" and "general atmosphere." I have move-in photos somewhere. Probably.',
    minAge: 20,
    maxAge: 59,
    weight: 1,
    once: true,
    conditions: [{ noAsset: 'house' }, { atHome: false }, { any: [{ hasJob: true }, { married: true }] }, { not: { all: [{ enrolled: true }, { stage: ['university'] }] } }],
    choices: [
      {
        id: 'photos',
        label: 'Dispute it with photos',
        effects: [
          {
            chance: 0.55,
            then: [{ money: 900 }, { stat: 'happiness', delta: 4 }, { log: 'I found the photos and sent a firm, polite letter. The check arrived, signed angrily.', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The photos turned out to be mostly of my lunch. The deposit stayed gone.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'court',
        label: 'Take it to small claims',
        hint: '{{$75}} filing fee',
        effects: [
          { money: -75 },
          { energy: -1 },
          {
            chance: 0.65,
            then: [{ money: 900 }, { stat: 'happiness', delta: 6 }, { log: 'The judge asked him to define "general atmosphere." He could not. I won.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'The judge sided with him over a single nail hole. The filing fee was my tuition.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'review',
        label: 'Write an honest review',
        conditions: [{ year: { gte: 2005 } }],
        effects: [
          { karma: 1 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'I wrote a calm, detailed review of that landlord. Three strangers thanked me for it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'He answered my review with a long letter threatening to sue. I left it up, heart pounding.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'drop',
        label: 'Let it go',
        effects: [{ stat: 'happiness', delta: -2 }, { energy: 1 }, { log: 'I let it go. {{$900}} is the price, I suppose, of never seeing that man again.' }],
      },
    ],
  },
  {
    id: 'yp_downstairs_neighbor',
    category: 'random',
    title: 'Heavy footsteps',
    text: 'The neighbor downstairs slipped a note under my door: my footsteps sound "like a horse learning to tap dance." I mostly walk from the couch to the fridge. Apparently, I do it with conviction.',
    minAge: 20,
    maxAge: 59,
    weight: 1,
    once: true,
    conditions: [{ noAsset: 'house' }, { atHome: false }, { any: [{ hasJob: true }, { married: true }] }, { not: { all: [{ enrolled: true }, { stage: ['university'] }] } }],
    choices: [
      {
        id: 'rugs',
        label: 'Buy thick rugs',
        hint: '{{$200}}',
        effects: [{ money: -200 }, { karma: 1 }, { stat: 'happiness', delta: 1 }, { log: 'I bought two big rugs. The neighbor slipped me a thank-you note on much nicer paper.', kind: 'good' }],
      },
      {
        id: 'socks',
        label: 'Tiptoe from now on',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: -2 }, { log: 'I now tiptoe around my own apartment like a burglar who lives there.' }],
      },
      {
        id: 'invite',
        label: 'Invite them up',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { newPerson: { kind: 'friend', relationship: 50, minAge: 20, maxAge: 70, log: '{{person}} came up for tea, heard my floor creak, and laughed. We are friends now.' } }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'They came up, listened to me walk across the room, and said, "See?" I did see.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'stomp',
        label: 'Stomp back',
        effects: [
          { karma: -3 },
          { stat: 'happiness', delta: 2 },
          { chance: 0.5, then: [{ stat: 'happiness', delta: -4 }, { log: 'The building manager got involved. There were letters. I lost.', kind: 'bad' }], else: [{ log: 'I stomped with purpose for a week. The notes stopped. So did the hellos.' }] },
        ],
      },
    ],
  },

  // ------------------------------------------------- young parents (child under five)
  {
    id: 'yp_baby_night_shift',
    category: 'family',
    title: '3 a.m. again',
    text: '{{person}} has decided that 3 a.m. is the best time of day: wide awake, delighted, ready to party. I have slept in ninety-minute pieces for weeks and just tried to put the milk in the cupboard.',
    minAge: 18,
    maxAge: 29,
    weight: 2,
    cooldown: 6,
    // Not within a few years of grown_up_life's gu_baby_three_am, the same wide-awake baby (it guards against this one too).
    conditions: [{ not: { sinceEvent: 'gu_baby_three_am', lte: 3 } }],
    person: { kind: ['child'], maxAge: 1 },
    choices: [
      {
        id: 'walk',
        label: 'Walk the hallway again',
        effects: [{ stat: 'health', delta: -2 }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: -1 }, { log: 'I walked the hall with {{person}} until sunrise. We had long talks. Mine were one-sided.' }],
      },
      {
        id: 'turns',
        label: 'Take turns with {{spouse}}',
        conditions: [{ married: true }],
        effects: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: 2 }, { relationship: 'spouse', delta: 2 }, { log: '{{spouse}} and I split the nights. On my nights off I slept like someone had unplugged me.', kind: 'good' }],
      },
      {
        id: 'mom',
        label: 'Call {{mother}} for backup',
        conditions: [{ hasPerson: ['mother'] }, { hasPerson: ['mother'] }],
        effects: [{ relationship: 'mother', delta: 3 }, { stat: 'health', delta: 3 }, { stat: 'happiness', delta: 1 }, { log: '{{mother}} took the night shift. I slept nine hours. She also reorganized my whole kitchen.', kind: 'good' }],
      },
      {
        id: 'train',
        label: 'Try sleep training',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'health', delta: 3 }, { stat: 'happiness', delta: 2 }, { log: 'Three rough nights, then {{person}} slept until six. I checked on {{them}} twice anyway.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { stat: 'health', delta: -1 }, { log: 'Sleep training lasted forty minutes. I cracked first. {{person}} won.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'yp_daycare_math',
    category: 'money',
    title: 'Daycare math',
    text: 'I did the math on daycare for {{person}}. It costs about as much as a used car, every year, and there is a waitlist. The director said some parents sign up before the baby is born.',
    minAge: 18,
    maxAge: 29,
    weight: 1.5,
    cooldown: 6,
    // Not within a few years of grown_up_life's gu_daycare_bill, the same bill (it guards against this one too).
    conditions: [{ hasJob: true }, { not: { sinceEvent: 'gu_daycare_bill', lte: 4 } }],
    person: { kind: ['child'], maxAge: 3 },
    choices: [
      {
        id: 'pay',
        label: 'Pay for full-time daycare',
        hint: '{{$5000}} a year',
        effects: [{ money: -5000 }, { jobPerformance: 4 }, { stat: 'happiness', delta: -2 }, { log: 'Full-time daycare: {{$5000}} for the year. I can work in peace and cry about it on payday.', kind: 'money' }],
      },
      {
        id: 'grandma',
        label: 'Ask {{mother}} to help',
        conditions: [{ hasPerson: ['mother'] }, { hasPerson: ['mother'] }],
        effects: [
          {
            chance: 0.7,
            then: [{ relationship: 'mother', delta: 5 }, { relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: '{{mother}} took {{person}} three days a week and spoiled {{them}} completely.', kind: 'good' }],
            else: [{ relationship: 'mother', delta: -4 }, { stat: 'happiness', delta: -2 }, { log: '{{mother}} agreed, then gave me daily parenting notes. Free childcare is not free.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'hours',
        label: 'Cut my hours',
        effects: [{ money: -2000 }, { jobPerformance: -6 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 3 }, { log: 'I cut back at work. Less money, more mornings with {{person}}. My manager was tight-lipped.' }],
      },
      {
        id: 'swap',
        label: 'Swap days with a parent',
        effects: [
          {
            chance: 0.6,
            then: [{ money: -1000 }, { stat: 'happiness', delta: 2 }, { log: 'Another parent from the park swaps days with me. It is chaos, but it works.', kind: 'good' }],
            else: [{ money: -2500 }, { jobPerformance: -3 }, { stat: 'happiness', delta: -3 }, { log: 'The swap fell apart in a month, and I scrambled for sitters the rest of the year.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'yp_cereal_aisle',
    category: 'family',
    title: 'Aisle five',
    text: '{{person}} lay down in the cereal aisle and screamed because I said no to a box with a cartoon wizard on it. Shoppers are steering around us. One older woman gave me a thumbs-up, which helped.',
    minAge: 18,
    maxAge: 29,
    weight: 1.5,
    cooldown: 6,
    // Not within a few years of grown_up_life's gu_cereal_aisle, the same tantrum in the same aisle (it guards against this one too).
    conditions: [{ not: { sinceEvent: 'gu_cereal_aisle', lte: 6 } }],
    person: { kind: ['child'], minAge: 2, maxAge: 4 },
    choices: [
      {
        id: 'buy',
        label: 'Buy the wizard cereal',
        effects: [
          { money: -8 },
          { relationship: 'person', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { log: 'I bought the wizard cereal. {{person}} stopped instantly. I have taught {{them}} something terrible.' },
          { chance: 0.5, then: [{ stat: 'happiness', delta: -3 }, { log: 'A week later {{person}} tried the same move in the toy aisle. It is a technique now.', kind: 'bad' }] },
        ],
      },
      {
        id: 'wait',
        label: 'Wait it out calmly',
        effects: [{ stat: 'happiness', delta: -3 }, { karma: 1 }, { log: '{{person}} screamed for six minutes, then stood up and asked for a banana. I won, I think.' }],
      },
      {
        id: 'leave',
        label: 'Abandon the cart',
        effects: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -1 }, { log: 'I scooped up {{person}} and left a full cart in aisle five. We had toast for dinner.' }],
      },
      {
        id: 'join',
        label: 'Lie down too',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: 4 }, { log: 'I lay down next to {{person}} and fake-wailed. {{They}} was so confused that {{they}} stopped.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: '{{person}} found my fake wailing hilarious and screamed louder. Now two of us were on the floor.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'yp_playground_parents',
    category: 'family',
    title: 'The babysitter?',
    text: "At the playground, a mom with a color-coded diaper bag asked how long I have been {{person}}'s babysitter. Apparently I look too young, or far too well rested, to be anybody's parent.",
    minAge: 18,
    maxAge: 29,
    weight: 2,
    once: true,
    person: { kind: ['child'], minAge: 1, maxAge: 4 },
    choices: [
      {
        id: 'correct',
        label: 'Correct her cheerfully',
        effects: [{ stat: 'happiness', delta: 2 }, { karma: 1 }, { log: "I said I'm {{person}}'s parent. She paused, then took a sudden interest in the weather." }],
      },
      {
        id: 'play',
        label: 'Play along',
        effects: [{ stat: 'happiness', delta: 3 }, { karma: -1 }, { log: 'I said I charge {{$15}} an hour. She asked whether I do Saturdays.' }],
      },
      {
        id: 'chat',
        label: "Join the parents' coffee group",
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { newPerson: { kind: 'friend', relationship: 50, gender: 'male', minAge: 25, maxAge: 45, log: '{{person}}, a dad of twins, adopted me into the group. I get all the hand-me-downs now.' } }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'The coffee group is ninety percent nap schedules and one long argument about juice.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'yp_saturday_plans',
    category: 'friends',
    title: 'Saturday plans',
    text: 'My friends are going out Saturday for a birthday: dinner, dancing, "a late one." My Saturday was going to be laundry, a nap negotiation with {{person}}, and asleep by nine.',
    minAge: 18,
    maxAge: 29,
    weight: 1.5,
    cooldown: 6,
    conditions: [{ hasPerson: ['friend', 'bestFriend'] }],
    person: { kind: ['child'], maxAge: 4 },
    choices: [
      {
        id: 'sitter',
        label: 'Hire a sitter and go',
        hint: '{{$120}}',
        effects: [{ money: -120 }, { stat: 'happiness', delta: 6 }, { stat: 'health', delta: -1 }, { relationship: 'friend', delta: 3 }, { relationship: 'bestFriend', delta: 3 }, { log: 'I danced like a released zoo animal and was home by eleven, wrecked and happy.', kind: 'good' }],
      },
      {
        id: 'hour',
        label: 'Go for one hour',
        hint: '{{$40}}',
        effects: [{ money: -40 }, { stat: 'happiness', delta: 3 }, { relationship: 'friend', delta: 1 }, { relationship: 'bestFriend', delta: 1 }, { log: 'I stayed an hour, hugged everyone, and was home before the sitter finished her tea.' }],
      },
      {
        id: 'host',
        label: 'Invite them over instead',
        hint: '{{$60}}',
        effects: [{ money: -60 }, { stat: 'happiness', delta: 4 }, { relationship: 'friend', delta: 2 }, { relationship: 'bestFriend', delta: 2 }, { relationship: 'person', delta: 2 }, { log: 'They came to me with pizza. {{person}} was passed around like a tiny celebrity.', kind: 'good' }],
      },
      {
        id: 'home',
        label: 'Stay home',
        effects: [{ stat: 'happiness', delta: -3 }, { stat: 'health', delta: 2 }, { relationship: 'person', delta: 3 }, { relationship: 'friend', delta: -2 }, { relationship: 'bestFriend', delta: -2 }, { log: 'Laundry, bath, story, sleep. My friends told me about it for a week. I told them about the laundry.' }],
      },
    ],
  },
  {
    id: 'yp_hallway_mural',
    category: 'family',
    title: 'The mural',
    text: 'I turned my back for four minutes. In that time {{person}} found a permanent marker and drew a long, wobbly mural down the hallway wall. {{They}} says it is a picture of me. I have a lot of legs.',
    minAge: 18,
    maxAge: 29,
    weight: 1.5,
    once: true,
    // grown_up_life's gu_hallway_mural tells the same marker on the same wall: one per life (it guards against this one too).
    conditions: [{ eventNotFired: 'gu_hallway_mural' }],
    person: { kind: ['child'], minAge: 3, maxAge: 4 },
    choices: [
      {
        id: 'scrub',
        label: 'Scrub it off',
        hint: '{{$30}}',
        effects: [{ money: -30 }, { stat: 'happiness', delta: 1 }, { relationship: 'person', delta: -2 }, { log: 'I scrubbed for an hour. A faint ghost of my many legs remains, like a fossil.' }],
      },
      {
        id: 'frame',
        label: 'Frame it with tape',
        effects: [
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 4 },
          { log: 'I taped a frame around it and added a title card. {{person}} gives tours to visitors.', kind: 'good' },
          { chance: 0.5, then: [{ money: -150 }, { log: '{{person}} then drew a sequel on the living room wall. That one cost {{$150}} to paint over.', kind: 'bad' }] },
        ],
      },
      {
        id: 'paper',
        label: 'Buy a giant paper roll',
        hint: '{{$20}}',
        effects: [
          { money: -20 },
          { relationship: 'person', delta: 2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: "I bought a huge roll of paper for {{person}}'s work. The walls are safe. The floor is not.", kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: '{{person}} drew one careful circle on the paper, then went back to the wall. Art wants walls.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'yp_interview_no_sitter',
    category: 'work',
    title: 'No sitter',
    text: 'I have a job interview at ten, and the sitter just canceled. {{person}} is in pajamas, holding a toy truck, and looking at me like {{they}} knows exactly what is going on.',
    minAge: 18,
    maxAge: 29,
    weight: 1.5,
    cooldown: 6,
    conditions: [{ enrolled: false }, { retired: false }],
    person: { kind: ['child'], minAge: 2, maxAge: 4 },
    choices: [
      {
        id: 'bring',
        label: 'Bring {{them}} along',
        effects: [
          // A toddler at an interview is a day's work on its own.
          { energy: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: 2 }, { log: '{{person}} charmed the receptionist and colored quietly. The manager said I was "resourceful."', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: '{{person}} narrated the whole interview at full volume. The manager was kind. The answer was no.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'reschedule',
        label: 'Ask to reschedule',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'They rescheduled without any fuss. I showed up the next week, sitter secured.' }],
            else: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: 2 }, { log: 'They said the position was filled. {{person}} and I spent the afternoon building a block tower.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'mom',
        label: 'Call {{mother}} in a panic',
        conditions: [{ hasPerson: ['mother'] }, { hasPerson: ['mother'] }],
        effects: [
          { relationship: 'mother', delta: 3 },
          {
            chance: 0.75,
            then: [{ stat: 'happiness', delta: 3 }, { log: '{{mother}} arrived in eleven minutes, still in slippers. I made it with three to spare.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: '{{mother}} was across town. I arrived twenty minutes late, flustered, with jam on my sleeve.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'video',
        label: 'Ask for a video call',
        conditions: [{ year: { gte: 2010 } }],
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 3 }, { log: '{{person}} stayed off camera, mostly. One toy truck made a cameo. The interview went fine.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'They said they only interview in person. I hung up and stared at the truck.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'yp_unsolicited_advice',
    category: 'family',
    title: 'Unsolicited advice',
    text: 'Since {{person}} was born, everyone has advice. A stranger at the bus stop said {{they}} needs a hat. The pharmacist said {{they}} needs less hat. A magazine says I am doing everything wrong.',
    minAge: 18,
    maxAge: 29,
    weight: 1.5,
    once: true,
    person: { kind: ['child'], maxAge: 2 },
    choices: [
      {
        id: 'nod',
        label: 'Nod and ignore it',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I nodded at everyone and did what felt right. {{person}} wore a medium amount of hat.' }],
      },
      {
        id: 'books',
        label: 'Read every parenting book',
        hint: '{{$60}}',
        effects: [{ money: -60 }, { stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: -3 }, { log: 'I read seven parenting books. They all disagreed. I felt smarter and much worse.' }],
      },
      {
        id: 'mom',
        label: 'Ask {{mother}} what to do',
        conditions: [{ hasPerson: ['mother'] }, { hasPerson: ['mother'] }],
        effects: [{ relationship: 'mother', delta: 4 }, { stat: 'happiness', delta: 1 }, { log: '{{mother}} said, "You\'ll know." Annoyingly, I mostly do.', kind: 'good' }],
      },
      {
        id: 'argue',
        label: 'Argue with the internet',
        conditions: [{ year: { gte: 2005 } }],
        effects: [{ stat: 'happiness', delta: -3 }, { stat: 'health', delta: -1 }, { stat: 'smarts', delta: 2 }, { log: 'I argued about hats on a parenting forum until 2 a.m. I now know everything about hats. {{person}} slept fine.' }],
      },
    ],
  },
];

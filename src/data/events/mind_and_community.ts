import { JURY_TRIALS } from '@/data/events/justice_and_reentry';
import { HAS_A_BOSS } from '@/data/events/work_life';
import type { EventDef } from '@/engine/events/schema';

/**
 * Ages 13-90: the mind and the community. Mental health handled plainly
 * (a school counselor, therapy and a follow-up session, a panic moment on a
 * bus, burnout and the slow way back, grief for a parent or a friend, a good
 * year after hard ones), living with illness, recovery from drinking and
 * drugs, civic life (a first vote, a jury's aftermath, a school board, the
 * local news, a neighborhood meeting, a storm cleanup, faith and community
 * gatherings), disasters beyond flood, storm and wildfire (a heat wave for the
 * elderly, a snowstorm, an earthquake, a long outage), and one work moment for
 * each job category. Follow-ups (followUpOnly) are queued by the events that
 * set them up and never fire on their own.
 */
export const MIND_AND_COMMUNITY_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ mental health
  {
    id: 'mc_school_counselor',
    category: 'school',
    title: 'A note from the counselor',
    text: "A note in class asked me to stop by the counselor's office. Apparently a teacher mentioned I have seemed 'quieter than usual' lately. The office has a beanbag and a box of tissues.",
    minAge: 13,
    maxAge: 17,
    weight: 1,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['middle', 'high'] }],
    choices: [
      {
        id: 'honest',
        label: 'Tell the truth',
        effects: [
          { stat: 'happiness', delta: 5 },
          { energy: -1 },
          { log: 'I said more than I meant to. The counselor listened, made a plan and said come back anytime.', kind: 'good' },
        ],
      },
      {
        id: 'fine',
        label: 'Say everything is fine',
        effects: [{ stat: 'happiness', delta: -2 }, { log: 'I said I was fine four times. The counselor wrote something down and said the door is open.' }],
      },
      {
        id: 'one',
        label: 'Ask about just one thing',
        effects: [
          { energy: -1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { grade: 3 }, { log: 'I asked about my grades, which was easier. The counselor fixed my schedule, then asked about me.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'We only talked about my schedule. It was a start, sort of.' }],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Skip the appointment',
        effects: [
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: -4 }, { log: 'The counselor found me at lunch and walked me to the office, past everyone.', kind: 'bad' }],
            else: [{ log: 'I skipped it. Nobody came looking, and I am not sure whether that was a relief.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'mc_therapy_first',
    category: 'health',
    title: 'The first session',
    text: 'After months of meaning to, I booked a first therapy session. The waiting room has a fern, a white-noise machine, and a clock that ticks louder the longer I stare at it.',
    minAge: 20,
    maxAge: 80,
    weight: 1,
    once: true,
    conditions: [{ stat: 'happiness', lte: 60 }],
    choices: [
      {
        id: 'open',
        label: 'Be honest from the start',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          { stat: 'happiness', delta: 4 },
          { stat: 'smarts', delta: 1 },
          { energy: -1 },
          { log: "I talked for fifty minutes and cried for five. The therapist said, 'Same time next week?'", kind: 'good' },
          { queue: 'mc_therapy_followup' },
        ],
      },
      {
        id: 'small',
        label: 'Keep it to small talk',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          { stat: 'happiness', delta: 1 },
          { log: 'We discussed traffic and the weather. The therapist let me, which felt like a trick.' },
          { chance: 0.5, then: [{ queue: 'mc_therapy_followup' }] },
        ],
      },
      {
        id: 'cancel',
        label: 'Cancel at the door',
        effects: [
          { stat: 'happiness', delta: -2 },
          { log: 'I got as far as the fern, then called to say I was sick. The fern knew.' },
          { chance: 0.5, then: [{ money: -50 }, { log: 'The clinic charged me a late-cancellation fee anyway.', kind: 'money' }] },
        ],
      },
    ],
  },
  {
    id: 'mc_therapy_followup',
    category: 'health',
    title: 'Session four',
    text: 'Session four. My therapist asked a question I have spent years walking around, then simply waited, the way only therapists and cats can.',
    minAge: 20,
    maxAge: 90,
    weight: 1,
    followUpOnly: true,
    choices: [
      {
        id: 'answer',
        label: 'Answer it honestly',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          { stat: 'happiness', delta: 7 },
          { stat: 'health', delta: 2 },
          { energy: -1 },
          { log: 'I answered. It came out sideways and wet, but it came out. Something shifted.', kind: 'good' },
        ],
      },
      {
        id: 'joke',
        label: 'Make a joke instead',
        hint: '{{$150}}',
        effects: [{ money: -150 }, { stat: 'happiness', delta: 1 }, { log: 'I made a joke. My therapist smiled politely and wrote down that I make jokes.' }],
      },
      {
        id: 'homework',
        label: 'Ask for homework',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 3 },
          { energy: -1 },
          { counter: 'meditations' },
          { log: 'I left with breathing exercises and a journal. Four pages in, I am nosy about myself.' },
        ],
      },
      {
        id: 'stop',
        label: 'Stop going',
        effects: [{ stat: 'happiness', delta: -2 }, { log: 'I stopped going. I saved {{$150}} a week and kept the question, unanswered.' }],
      },
    ],
  },
  {
    id: 'mc_panic_bus',
    category: 'health',
    title: 'Between stops',
    text: 'A packed bus, stuck in traffic between stops, doors sealed, and it started again: the sprinting heart, the numb hands. I have had one of these before. This time, at least, I know what it is.',
    minAge: 17,
    maxAge: 75,
    weight: 1,
    cooldown: 8,
    conditions: [{ eventFired: 'hl_panic_attack' }],
    choices: [
      {
        id: 'ground',
        label: 'Name five things I can see',
        effects: [
          { counter: 'meditations' },
          {
            chance: 0.65,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'A red scarf, a stroller, a sign, a shoe, a cloud. By five, my lungs had come back.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I counted to five twice. It helped a little. I got off at the next stop, shaking.' }],
          },
        ],
      },
      {
        id: 'stranger',
        label: 'Tell the person next to me',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 3 }, { karma: 1 }, { log: "The woman beside me said, 'I get those too,' and talked about her garden until it passed.", kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The man beside me changed seats. It passed anyway, eventually, no thanks to him.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'off',
        label: 'Get off and walk',
        effects: [
          { stat: 'happiness', delta: -1 },
          { stat: 'health', delta: 1 },
          { log: 'I begged the driver to open the doors and walked the rest of the way home, slowly.' },
          { chance: 0.3, then: [{ illness: 'anxiety' }, { log: 'I started avoiding buses, then trains, then malls. My doctor called it a pattern and made a plan.', kind: 'bad' }] },
        ],
      },
    ],
  },
  {
    id: 'mc_good_year',
    category: 'random',
    title: 'A good year',
    text: 'I have had hard times, the kind I only got through. This year has been good, quietly, without anyone announcing it. This morning I caught myself humming while I made coffee.',
    minAge: 18,
    maxAge: 90,
    weight: 1,
    once: true,
    conditions: [{ count: 'yearsMiserable', gte: 1 }, { stat: 'happiness', gte: 65 }],
    person: { kind: ['mother', 'father', 'sibling', 'spouse', 'friend', 'bestFriend'], minRelationship: 50, minAge: 16 },
    choices: [
      {
        id: 'list',
        label: 'Write down what helped',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I made a list: sleep, walks, fewer people who drain me. I taped it inside a kitchen cabinet.' }],
      },
      {
        id: 'thank',
        label: 'Thank {{person}} for sticking around',
        effects: [
          { relationship: 'person', delta: 8 },
          { stat: 'happiness', delta: 3 },
          { energy: -1 },
          { log: "I told {{person}} {{they}} got me through it. {{They}} said, 'You did that,' and hugged me anyway.", kind: 'good' },
        ],
      },
      {
        id: 'celebrate',
        label: 'Celebrate properly',
        hint: '{{$300}}',
        effects: [{ money: -300 }, { stat: 'happiness', delta: 6 }, { log: 'I booked a good dinner for one reason: I am still here, and it is going well.', kind: 'good' }],
      },
      {
        id: 'jinx',
        label: "Don't jinx it",
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I said nothing, knocked on wood, and braced for the other shoe. It has not dropped yet.' }],
      },
    ],
  },
  {
    id: 'mc_burnout_recovery',
    category: 'health',
    title: 'Coming back',
    text: 'I still think about the year I burned out. These days I notice the small things I stopped seeing then: rain on a warm sidewalk, a song I used to love, actually being hungry at lunch.',
    minAge: 23,
    maxAge: 75,
    weight: 1.5,
    once: true,
    conditions: [{ any: [{ eventFired: 'ad_burnout' }, { eventFired: 'wk_burnout' }] }],
    choices: [
      {
        id: 'guard',
        label: 'Guard my boundaries',
        effects: [
          { stat: 'happiness', delta: 5 },
          { stat: 'health', delta: 2 },
          { jobPerformance: -2 },
          { log: 'I keep my evenings to myself and say no more often. The world has not ended.', kind: 'good' },
        ],
      },
      {
        id: 'big',
        label: 'Take on something big again',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 2 },
          { jobPerformance: 4 },
          { log: 'I signed up for something ambitious. I am watching myself for warning signs, like a hawk.' },
          { chance: 0.3, then: [{ stat: 'health', delta: -4 }, { log: 'The old tiredness crept back by autumn. I noticed it sooner this time.', kind: 'bad' }] },
        ],
      },
      {
        id: 'help',
        label: 'Help someone else through it',
        effects: [
          { karma: 4 },
          { stat: 'happiness', delta: 3 },
          { energy: -1 },
          { log: 'A friend had the look I used to have. I took them for coffee and told the truth.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'mc_student_burnout',
    category: 'school',
    title: 'Running on fumes',
    text: 'Midway through the semester I have read the same paragraph eleven times. I sleep five hours, live on vending-machine coffee, and feel guilty every minute I am not studying.',
    minAge: 18,
    maxAge: 30,
    weight: 1,
    cooldown: 3,
    conditions: [{ enrolled: true }, { stage: ['university', 'graduate'] }],
    choices: [
      {
        id: 'drop',
        label: 'Drop one class',
        effects: [
          { grade: -2 },
          { stat: 'happiness', delta: 5 },
          { stat: 'health', delta: 2 },
          { log: 'I dropped one class. The registrar sighed, my shoulders came down, and I slept.', kind: 'good' },
        ],
      },
      {
        id: 'center',
        label: 'Visit the counseling center',
        effects: [
          { stat: 'happiness', delta: 4 },
          { stat: 'smarts', delta: 1 },
          { energy: -1 },
          { log: 'The campus counselors were free and booked solid. I got in on a Thursday. It helped.', kind: 'good' },
        ],
      },
      {
        id: 'push',
        label: 'Push through to finals',
        effects: [
          { grade: 5 },
          { stat: 'health', delta: -5 },
          { stat: 'happiness', delta: -4 },
          { log: 'I pushed through. My grades held. My body sent its objections in writing.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'mc_grief_laugh',
    category: 'family',
    title: 'The same laugh',
    text: 'At a family dinner a cousin stopped mid-sentence and said I laugh exactly like {{person}} used to. The table went quiet. I had never known that about myself.',
    minAge: 13,
    maxAge: 90,
    weight: 1,
    once: true,
    person: { kind: ['mother', 'father'], alive: false },
    choices: [
      {
        id: 'stories',
        label: 'Ask for stories about {{them}}',
        effects: [
          { stat: 'happiness', delta: 4 },
          { stat: 'smarts', delta: 1 },
          { energy: -1 },
          { log: 'The stories came out one by one until midnight. I know {{person}} a little better now.', kind: 'good' },
        ],
      },
      {
        id: 'laugh',
        label: 'Laugh again, on purpose',
        effects: [
          { stat: 'happiness', delta: 3 },
          { karma: 1 },
          {
            chance: 0.7,
            then: [{ log: 'I laughed again, louder. Half the table cried. The other half laughed with me.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'Nobody laughed with me. The quiet afterward was the loudest part of the night.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'step',
        label: 'Step outside for a minute',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I stood outside in the dark for a while. It was a good thing to hear, and a lot.' }],
      },
    ],
  },
  {
    id: 'mc_grief_box',
    category: 'family',
    title: 'The box',
    text: "Since the funeral, a box of {{person}}'s things has followed me from closet to closet: letters, a watch that stopped, a recipe card in {{their}} handwriting. Tonight I finally opened it.",
    minAge: 20,
    maxAge: 90,
    weight: 1,
    once: true,
    person: { kind: ['mother', 'father'], alive: false },
    choices: [
      {
        id: 'read',
        label: 'Go through everything',
        effects: [
          {
            random: [
              { weight: 7, effects: [{ stat: 'happiness', delta: 5 }, { log: 'I read every letter. Some made me laugh. One made me sit on the floor for an hour.', kind: 'good' }] },
              { weight: 3, effects: [{ stat: 'happiness', delta: -4 }, { log: 'It was too much at once. I closed the lid at the third letter and slept badly.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'cook',
        label: 'Cook from the recipe card',
        hint: '{{$30}}',
        effects: [
          { money: -30 },
          { stat: 'happiness', delta: 5 },
          { stat: 'health', delta: 1 },
          { log: "I cooked {{their}} recipe. It was not quite right, which was exactly right.", kind: 'good' },
        ],
      },
      {
        id: 'share',
        label: 'Share it with family',
        conditions: [{ hasPerson: ['sibling'] }],
        effects: [
          { relationship: 'sibling', delta: 6 },
          { karma: 1 },
          { stat: 'happiness', delta: 2 },
          { money: -20 },
          { log: 'I mailed a few things to family. The phone rang all week with old stories.', kind: 'good' },
        ],
      },
      {
        id: 'closed',
        label: 'Keep the lid on',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I put the box back in the closet, still taped. Not yet. Maybe next time.' }],
      },
    ],
  },
  {
    id: 'mc_grief_friend',
    category: 'friends',
    title: 'On this day',
    text: 'My phone surfaced a photo from years ago: {{person}} and me squinting into the sun, holding a fish neither of us caught. The app wants to know if I would like to share this memory.',
    minAge: 18,
    maxAge: 90,
    weight: 1,
    once: true,
    conditions: [{ year: { gte: 2014 } }],
    person: { kind: ['friend', 'bestFriend'], alive: false },
    choices: [
      {
        id: 'share',
        label: 'Share it with old friends',
        effects: [
          { relationship: 'friend', delta: 2 },
          {
            chance: 0.8,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I posted it. Old friends filled the comments with every story I had forgotten.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: "I posted it. Someone commented 'who is that?' and I took it down." }],
          },
        ],
      },
      {
        id: 'call',
        label: 'Call {{their}} family',
        effects: [
          { karma: 3 },
          { stat: 'happiness', delta: 2 },
          { energy: -1 },
          { log: "I called {{person}}'s family. We talked for an hour about the fish, and everything else.", kind: 'good' },
        ],
      },
      {
        id: 'keep',
        label: 'Keep it to myself',
        effects: [
          { stat: 'happiness', delta: 3 },
          { log: 'I saved it to a folder nobody else sees and looked at it for a long time.' },
          { chance: 0.4, then: [{ stat: 'happiness', delta: -3 }, { log: 'I went back to it every night that week. It got harder, not easier.', kind: 'bad' }] },
        ],
      },
      {
        id: 'off',
        label: 'Turn the memories off',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I turned the feature off. I do not need an app to remind me. I remember fine.' }],
      },
    ],
  },

  // ------------------------------------------------------------ living with illness
  {
    id: 'mc_pill_box',
    category: 'health',
    title: 'The pill box',
    text: 'My kitchen counter now has a plastic pill box with a little lid for each day of the week. It is Thursday. Monday and Tuesday are still full, which says something about my week.',
    minAge: 20,
    maxAge: 90,
    weight: 1,
    once: true,
    conditions: [{ illnessCount: { gte: 1 } }],
    choices: [
      {
        id: 'alarm',
        label: 'Set an alarm for every dose',
        effects: [
          { stat: 'health', delta: 4 },
          { stat: 'happiness', delta: -1 },
          { log: 'Three alarms a day now. They nag me like a parent, and the box empties on schedule.', kind: 'good' },
        ],
      },
      {
        id: 'coffee',
        label: 'Keep them by the coffee',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'health', delta: 4 }, { log: 'The pills live next to the coffee maker now. I have never once forgotten coffee.', kind: 'good' }],
            else: [{ stat: 'health', delta: -2 }, { log: 'It worked until I switched to tea for a week and forgot everything.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'whenever',
        label: 'Take them when I remember',
        effects: [{ stat: 'health', delta: -4 }, { stat: 'happiness', delta: 1 }, { log: 'I take them when I remember, which is mostly when I feel worse.', kind: 'bad' }],
      },
      {
        id: 'simplify',
        label: 'Ask the doctor to simplify',
        hint: '{{$80}}',
        effects: [{ money: -80 }, { stat: 'health', delta: 3 }, { log: 'My doctor switched me to one pill a day. One. I can manage one.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'mc_pharmacy_mixup',
    category: 'health',
    title: 'Not my pills',
    text: 'Three days into the bottle the pharmacy handed me, I finally read the label properly. The pills belong to someone named Doris, and they are definitely not mine.',
    minAge: 18,
    maxAge: 90,
    weight: 1,
    once: true,
    conditions: [{ illnessCount: { gte: 1 } }],
    choices: [
      {
        id: 'call',
        label: 'Call the pharmacy now',
        effects: [
          {
            random: [
              { weight: 7, effects: [{ stat: 'health', delta: -1 }, { log: 'The pharmacist went pale over the phone, swapped them that afternoon and apologized twice.' }] },
              { weight: 3, effects: [{ stat: 'health', delta: -4 }, { log: "Three days of Doris's pills had left me dizzy. The pharmacy swapped them and sent a fruit basket.", kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'doctor',
        label: 'See my doctor first',
        hint: '{{$120}}',
        effects: [{ money: -120 }, { stat: 'health', delta: 2 }, { stat: 'smarts', delta: 1 }, { log: 'My doctor checked me over, found nothing lasting, and wrote the pharmacy a stern letter.', kind: 'good' }],
      },
      {
        id: 'complain',
        label: 'Demand compensation',
        effects: [
          { stat: 'health', delta: -1 },
          {
            chance: 0.5,
            then: [{ money: 200 }, { log: "The pharmacy's insurer sent a check and a very nervous letter.", kind: 'money' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I spent a month on hold, being transferred. I got an apology and no check.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'mc_support_group',
    category: 'health',
    title: 'Tuesday group',
    text: "A flyer at the clinic: a Tuesday evening group for people 'whose health keeps interrupting their lives'. Folding chairs, decaf, and nobody who says 'but you look fine'.",
    minAge: 30,
    maxAge: 90,
    weight: 1,
    once: true,
    conditions: [{ illnessCount: { gte: 1 } }, { count: 'illnesses', gte: 3 }],
    choices: [
      {
        id: 'go',
        label: 'Go on Tuesday',
        effects: [
          { stat: 'happiness', delta: 5 },
          { energy: -1 },
          { log: 'I said almost nothing the first week. By the third, I was the one passing the tissues.', kind: 'good' },
          { chance: 0.6, then: [{ newPerson: { kind: 'friend', relationship: 55, log: '{{person}} from the Tuesday group became the friend I text on bad days.' } }] },
        ],
      },
      {
        id: 'online',
        label: 'Join the online version',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 1 }, { stat: 'health', delta: -1 }, { log: 'I joined the online forum. Strangers awake at 3 a.m. know things my doctor does not.' }],
      },
      {
        id: 'no',
        label: 'Leave it on the fridge',
        effects: [{ log: 'I pinned the flyer to my fridge and never went. It is still there, curling at the corners.' }],
      },
    ],
  },
  {
    id: 'mc_unsolicited_advice',
    category: 'family',
    title: 'The cure',
    text: '{{person}} has read an article about what I have and now knows how to cure it: a special tea, cold showers, and a man on late-night television with remarkably white teeth. {{They}} has taken notes.',
    minAge: 18,
    maxAge: 90,
    weight: 1,
    cooldown: 10,
    conditions: [{ illnessCount: { gte: 1 } }],
    person: { kind: ['mother', 'father', 'sibling', 'spouse', 'friend', 'bestFriend', 'coworker'], minAge: 16 },
    choices: [
      {
        id: 'explain',
        label: 'Explain what my doctor said',
        effects: [
          { stat: 'smarts', delta: 1 },
          { energy: -1 },
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 4 }, { log: '{{person}} listened, asked good questions, and quietly recycled the printout.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { log: '{{They}} nodded through all of it, then sent me the link again the next day.' }],
          },
        ],
      },
      {
        id: 'tea',
        label: 'Drink the tea, keep the peace',
        effects: [{ relationship: 'person', delta: 5 }, { stat: 'health', delta: -1 }, { log: 'I drank the tea. It tasted like a lawn. {{person}} beamed the whole time.' }],
      },
      {
        id: 'boundary',
        label: 'Ask {{them}} to stop',
        effects: [
          { relationship: 'person', delta: -4 },
          { stat: 'happiness', delta: 3 },
          { log: 'I said I already have a doctor and what I need from {{them}} is company. It stung, then landed.' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ addiction and recovery
  {
    id: 'mc_drink_noticed',
    category: 'health',
    title: 'Counting',
    text: 'At dinner I saw {{person}} counting my drinks. Not out loud, just a glance at each new glass. Afterward, on the sidewalk, {{they}} asked if I was doing okay. Really okay.',
    minAge: 21,
    maxAge: 75,
    weight: 1.5,
    cooldown: 6,
    // Someone counts my drinks once drinking is a habit (as the corner store and the meeting ask), not after one office party.
    conditions: [{ addiction: 'alcohol', min: 5 }],
    person: { kind: ['friend', 'bestFriend', 'sibling', 'spouse'], minAge: 18 },
    choices: [
      {
        id: 'admit',
        label: 'Admit it has gotten bad',
        effects: [
          { addiction: 'alcohol', delta: -10 },
          { relationship: 'person', delta: 6 },
          { stat: 'happiness', delta: -2 },
          { log: 'I said it out loud for the first time. {{person}} did not flinch. {{They}} drove me home.', kind: 'good' },
          { chance: 0.6, then: [{ queue: 'mc_recovery_meeting' }] },
        ],
      },
      {
        id: 'laugh',
        label: 'Laugh it off',
        effects: [{ addiction: 'alcohol', delta: 3 }, { relationship: 'person', delta: -2 }, { log: 'I laughed and said it had been a long week. {{They}} laughed too, a beat too late.' }],
      },
      {
        id: 'snap',
        label: 'Tell {{them}} to back off',
        effects: [
          { addiction: 'alcohol', delta: 5 },
          { relationship: 'person', delta: -8 },
          { stat: 'happiness', delta: 2 },
          { log: 'I told {{them}} to mind {{their}} own business. {{They}} did, and something between us went quiet.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'mc_drink_corner_store',
    category: 'health',
    title: 'Open until eleven',
    text: 'A bad day, a quiet evening at home, and the corner store is open until eleven. I know exactly which aisle and exactly how the bag will feel in my hand. It is ten-fifteen.',
    minAge: 21,
    maxAge: 85,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ addiction: 'alcohol', min: 5 }],
    choices: [
      {
        id: 'call',
        label: 'Call someone instead',
        effects: [
          { addiction: 'alcohol', delta: -4 },
          { stat: 'happiness', delta: 2 },
          { energy: -1 },
          { log: 'I called the one person I knew would pick up. We talked about nothing until eleven-oh-one.', kind: 'good' },
        ],
      },
      {
        id: 'walk',
        label: 'Walk the other way',
        effects: [
          { addiction: 'alcohol', delta: -2 },
          { stat: 'health', delta: 2 },
          { stat: 'happiness', delta: -1 },
          { log: 'I walked a long loop with my hands in my pockets until the store lights went off.' },
        ],
      },
      {
        id: 'go',
        label: 'Go to the store',
        effects: [
          { addiction: 'alcohol', delta: 8 },
          { money: -30 },
          { stat: 'happiness', delta: 3 },
          { stat: 'health', delta: -3 },
          { log: 'I went. The evening got softer and the morning got very loud.', kind: 'bad' },
          { chance: 0.25, then: [{ stat: 'happiness', delta: -4 }, { log: 'I missed something important the next day and lied about why.', kind: 'bad' }] },
        ],
      },
    ],
  },
  {
    id: 'mc_recovery_meeting',
    category: 'health',
    title: 'The meeting',
    text: 'The meeting is in a community center basement: folding chairs, a coffee urn that has seen things, and a circle of strangers who nod like they already know how my story goes.',
    minAge: 18,
    maxAge: 85,
    weight: 1.5,
    cooldown: 5,
    conditions: [{ any: [{ addiction: 'alcohol', min: 5 }, { addiction: 'drugs' }] }],
    choices: [
      {
        id: 'share',
        label: 'Share my story',
        effects: [
          { addiction: 'alcohol', delta: -8 },
          { addiction: 'drugs', delta: -8 },
          { stat: 'happiness', delta: 3 },
          { energy: -1 },
          { log: 'I said my name and the word, and my voice cracked. Twenty people said hi back.', kind: 'good' },
          { queue: 'mc_sponsor' },
        ],
      },
      {
        id: 'listen',
        label: 'Just listen',
        effects: [
          { addiction: 'alcohol', delta: -4 },
          { addiction: 'drugs', delta: -4 },
          { stat: 'happiness', delta: -1 },
          { log: 'I sat in the back with my bag on my lap and listened. Some of it was my story too.' },
          { chance: 0.4, then: [{ queue: 'mc_sponsor' }] },
        ],
      },
      {
        id: 'leave',
        label: 'Leave at the break',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I left at the break with a cookie and a pamphlet. I read the pamphlet in the parking lot.' }],
      },
    ],
  },
  {
    id: 'mc_sponsor',
    category: 'health',
    title: 'A sponsor',
    text: 'After a few meetings, a quiet regular with twelve years sober and a terrible windbreaker offered to be my sponsor. Calls at any hour, coffee on Sundays, no excuses accepted.',
    minAge: 18,
    maxAge: 90,
    weight: 1,
    once: true,
    followUpOnly: true,
    choices: [
      {
        id: 'accept',
        label: 'Accept gratefully',
        effects: [
          { addiction: 'alcohol', delta: -10 },
          { addiction: 'drugs', delta: -10 },
          { stat: 'happiness', delta: 3 },
          { energy: -1 },
          { log: 'I said yes. Sunday coffee is now the fixed point of my week, and the 2 a.m. calls go both ways.', kind: 'good' },
          { newPerson: { kind: 'friend', relationship: 60, minAge: 40, maxAge: 75, log: 'My sponsor, {{person}}, picks up on the second ring every time.' } },
        ],
      },
      {
        id: 'alone',
        label: 'Do it on my own',
        effects: [
          { stat: 'happiness', delta: 2 },
          { log: 'I thanked them and said I would manage alone.' },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -4 }, { log: 'Some weeks I manage. Some weeks I sit outside the meeting and do not go in.', kind: 'bad' }],
            else: [{ log: 'So far, I have. One day at a time, as they say on the posters.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'number',
        label: 'Take the number, never call',
        effects: [
          { karma: -1 },
          { log: 'I took the number and never used it. The regular still nods at me, patiently.' },
          { newPerson: { kind: 'friend', relationship: 30, minAge: 40, maxAge: 75, log: '{{person}} still asks how my week was, every time. I still say fine.' } },
        ],
      },
    ],
  },
  {
    id: 'mc_drug_text',
    category: 'health',
    title: 'You around?',
    text: "A number I should have deleted lit up my phone at midnight: 'you around? got something new.' My thumb is hovering. I know exactly how this night goes if I answer.",
    minAge: 18,
    maxAge: 65,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ addiction: 'drugs' }, { inPrison: false }, { year: { gte: 2005 } }],
    choices: [
      {
        id: 'block',
        label: 'Block the number',
        effects: [
          { addiction: 'drugs', delta: -5 },
          { stat: 'happiness', delta: -2 },
          { log: 'I blocked it, deleted it, and sat on my hands until the urge got bored and left.', kind: 'good' },
        ],
      },
      {
        id: 'tell',
        label: 'Tell someone about the text',
        effects: [
          { addiction: 'drugs', delta: -7 },
          { stat: 'happiness', delta: 1 },
          { energy: -1 },
          { log: 'I forwarded it to a friend in recovery with one word: help. She called within a minute.', kind: 'good' },
        ],
      },
      {
        id: 'answer',
        label: 'Answer it',
        effects: [
          { counter: 'crimes' },
          { addiction: 'drugs', delta: 10 },
          { money: -200 },
          { stat: 'health', delta: -5 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.1,
            then: [{ arrest: true }, { log: 'The police were watching the address he sent. I spent the night in a cell, very sober.', kind: 'bad' }],
            else: [{ log: 'I answered. The night went exactly how I knew it would, and so did the week after.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'mc_drug_found',
    category: 'family',
    title: 'On the kitchen table',
    text: '{{person}} found what was in my jacket pocket and set it on the kitchen table without a word. {{They}} is sitting across from it now, waiting, and {{they}} has clearly been crying.',
    minAge: 18,
    maxAge: 65,
    weight: 1.5,
    once: true,
    conditions: [{ addiction: 'drugs' }],
    person: { kind: ['mother', 'father', 'sibling', 'spouse', 'lover'], minAge: 18, household: true },
    choices: [
      {
        id: 'truth',
        label: 'Tell the whole truth',
        effects: [
          { addiction: 'drugs', delta: -10 },
          { relationship: 'person', delta: 4 },
          { stat: 'happiness', delta: -3 },
          { log: 'I told {{them}} everything. {{person}} reached across the table and asked what I needed.', kind: 'good' },
          { chance: 0.5, then: [{ queue: 'mc_recovery_meeting' }] },
        ],
      },
      {
        id: 'treatment',
        label: 'Agree to get treatment',
        hint: '{{$3000}}',
        effects: [
          { money: -3000 },
          { addiction: 'drugs', delta: -30 },
          { relationship: 'person', delta: 8 },
          { stat: 'happiness', delta: -2 },
          { log: 'I checked into a treatment program that week. {{person}} drove me and waited in the lot.', kind: 'milestone' },
        ],
      },
      {
        id: 'lie',
        label: "Say it's a friend's",
        effects: [
          { karma: -2 },
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: -3 }, { log: '{{They}} pretended to believe me. We both know {{they}} does not.' }],
            else: [{ relationship: 'person', delta: -8 }, { log: '{{They}} did not believe me for a second. The silence lasted weeks.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'leave',
        label: 'Grab my keys and leave',
        effects: [
          { addiction: 'drugs', delta: 5 },
          { relationship: 'person', delta: -12 },
          { stat: 'happiness', delta: -4 },
          { log: 'I walked out. When I came back, {{person}} had gone to bed. We have never talked about it.', kind: 'bad' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ civic life
  {
    id: 'mc_first_vote',
    category: 'random',
    title: 'First ballot',
    text: 'My first time voting. The polling place is a school gym with folding booths, a volunteer who checked my name twice, and a sticker I am weirdly excited about.',
    minAge: 18,
    maxAge: 22,
    weight: 2,
    once: true,
    choices: [
      {
        id: 'research',
        label: 'Research every name first',
        effects: [
          { stat: 'smarts', delta: 3 },
          { stat: 'happiness', delta: 2 },
          { energy: -1 },
          { log: 'I read up on every candidate down to the water board, and voted like I meant every line.', kind: 'good' },
        ],
      },
      {
        id: 'family',
        label: 'Vote how my family does',
        effects: [
          { relationship: 'mother', delta: 2 },
          { relationship: 'father', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { log: 'I voted the way my family always has. It felt like tradition, and a little like copied homework.' },
        ],
      },
      {
        id: 'friend',
        label: 'Bring a friend along',
        conditions: [{ hasPerson: ['friend', 'bestFriend'] }],
        effects: [
          { relationship: 'friend', delta: 3 },
          { relationship: 'bestFriend', delta: 3 },
          { karma: 1 },
          { log: 'I dragged along a friend who had never voted either. We wore our stickers all day like medals.', kind: 'good' },
        ],
      },
      {
        id: 'skip',
        label: 'Skip it this time',
        effects: [{ stat: 'happiness', delta: 2 }, { karma: -2 }, { log: 'I meant to go and spent the day on the couch instead. My sticker went to someone else.' }],
      },
    ],
  },
  {
    id: 'mc_jury_aftermath',
    category: 'random',
    title: 'On the record',
    text: "A reporter called. She is writing about a trial I once sat on as a juror and wants 'a juror's perspective', on the record. I had almost stopped thinking about that deliberation room.",
    minAge: 19,
    maxAge: 90,
    weight: 1.5,
    once: true,
    // Any jury I sat on: the two deliberation rooms, and the trial where juror seven read the news (justice_and_reentry.ts).
    conditions: [{ any: [{ eventFired: 'ad_jury_verdict' }, { eventFired: 'nc_jury_verdict' }, { eventFired: 'jr_jury_note' }] }, JURY_TRIALS],
    choices: [
      {
        id: 'talk',
        label: 'Talk on the record',
        effects: [
          { fame: 3 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'I said we did our best with what we were shown. It ran as a fair, careful quote.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'They used one sentence out of context. Strangers had opinions about me for a week.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Decline politely',
        effects: [{ karma: 1 }, { log: 'I said deliberations stay in the room. She said most people say that. I hung up anyway.' }],
      },
      {
        id: 'read',
        label: 'Reread the old coverage',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: -2 }, { log: 'I read every old article about the case, twice. I made my peace with that room again, mostly.' }],
      },
    ],
  },
  {
    id: 'mc_school_board',
    category: 'family',
    title: 'The school board',
    text: "The school board wants to cut the music program at {{person}}'s school. Tonight's meeting has a sign-up sheet, three minutes per speaker, and a room full of parents clutching recorders.",
    minAge: 25,
    maxAge: 65,
    weight: 1,
    cooldown: 8,
    person: { kind: ['child'], minAge: 6, maxAge: 17 },
    choices: [
      {
        id: 'speak',
        label: 'Speak at the microphone',
        effects: [
          { energy: -1 },
          { karma: 2 },
          {
            chance: 0.45,
            then: [
              { relationship: 'person', delta: 6 },
              { stat: 'happiness', delta: 6 },
              { fame: 1 },
              { log: 'I spoke for exactly three minutes. The board kept the program. {{person}} was mortified and proud.', kind: 'good' },
            ],
            else: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: -3 }, { log: 'I spoke, they cut it anyway, and {{person}} said at least I tried. {{They}} meant it.' }],
          },
        ],
      },
      {
        id: 'organize',
        label: 'Organize the other parents',
        effects: [
          { energy: -1 },
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.55,
            then: [{ karma: 3 }, { stat: 'happiness', delta: 5 }, { log: 'Our petition had six hundred names by Friday. The cut was quietly shelved.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'Forty parents agreed with me, four showed up, and the program lost its funding.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'donate',
        label: 'Donate to the program',
        hint: '{{$500}}',
        effects: [{ money: -500 }, { karma: 2 }, { relationship: 'person', delta: 3 }, { log: 'I wrote a check to the music fund. It bought a box of recorders and a lot of goodwill.', kind: 'money' }],
      },
      {
        id: 'home',
        label: 'Stay home',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: -2 }, { log: 'I stayed home. The cut went through. {{person}} practices alone in {{their}} room now.' }],
      },
    ],
  },
  {
    id: 'mc_local_news',
    category: 'random',
    title: 'On camera',
    text: "A reporter stopped me outside the grocery store to ask what I think of the city's new parking meters. The camera light is already on, and it is pointed directly at my face.",
    minAge: 18,
    maxAge: 90,
    weight: 1,
    once: true,
    choices: [
      {
        id: 'thoughtful',
        label: 'Give a thoughtful answer',
        effects: [
          { fame: 2 },
          {
            chance: 0.7,
            then: [{ stat: 'smarts', delta: 1 }, { log: 'I made one clear point about the meters. A neighbor said I looked "very official".', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: "They aired only the part where I said 'um' for four seconds. My point was cut for time." }],
          },
        ],
      },
      {
        id: 'joke',
        label: 'Make a joke',
        effects: [
          {
            random: [
              { weight: 4, effects: [{ fame: 5 }, { stat: 'happiness', delta: 5 }, { log: 'My joke made the evening news and then the morning shows. Strangers quote it back to me.', kind: 'good' }] },
              { weight: 6, effects: [{ fame: 1 }, { stat: 'happiness', delta: -3 }, { log: 'The joke did not land. They aired it anyway, right before the weather.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'wave',
        label: 'Just wave at the camera',
        effects: [
          { fame: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I said nothing useful and waved at the lens. Everyone I know saw it and approved.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I waved like a lunatic. My family now sends the clip around on birthdays.' }],
          },
        ],
      },
      {
        id: 'walk',
        label: 'Keep walking',
        effects: [{ stat: 'happiness', delta: 1 }, { log: "I said 'no comment' like a politician and walked off. They interviewed the man behind me." }],
      },
    ],
  },
  {
    id: 'mc_meeting_chair',
    category: 'random',
    title: 'The gavel',
    text: 'Halfway through the neighborhood association meeting, the chair resigned, effective immediately, and walked out. I was sitting in the front row. Every head in the room turned slowly toward me.',
    minAge: 25,
    maxAge: 85,
    weight: 1,
    once: true,
    choices: [
      {
        id: 'take',
        label: 'Pick up the gavel',
        effects: [
          { energy: -1 },
          { karma: 2 },
          { fame: 1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'I ran the meeting in forty minutes flat. I have been the chair ever since. Send help.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'I picked up the gavel and lost control of the room over a hedge dispute.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'nominate',
        label: 'Nominate someone else',
        effects: [{ karma: -1 }, { stat: 'happiness', delta: 2 }, { log: 'I nominated the loudest man in the room. He accepted with alarming speed.' }],
      },
      {
        id: 'adjourn',
        label: 'Move to adjourn',
        effects: [
          { stat: 'happiness', delta: 3 },
          { log: 'I moved to adjourn. It passed unanimously. Local democracy, at its most efficient.' },
          { chance: 0.5, then: [{ stat: 'happiness', delta: -4 }, { log: 'The next meeting ran three hours, to make up for it. I was elected to take the minutes.', kind: 'bad' }] },
        ],
      },
    ],
  },
  {
    id: 'mc_storm_cleanup',
    category: 'random',
    title: 'After the storm',
    text: 'The morning after the storm, the whole street came out in boots. Branches everywhere, a trampoline in a tree, and one neighbor holding a chainsaw he has clearly only just met.',
    minAge: 18,
    maxAge: 85,
    weight: 1,
    // The same street, chainsaw and trampoline in a tree: at most twice in a life (CONTENT_STYLE).
    cooldown: 34,
    choices: [
      {
        id: 'haul',
        label: 'Haul branches all day',
        effects: [
          { stat: 'health', delta: 2 },
          { karma: 2 },
          { stat: 'happiness', delta: 2 },
          { energy: -1 },
          { log: 'I dragged branches until my arms quit. By dusk the street was a street again.', kind: 'good' },
          { chance: 0.5, then: [{ newPerson: { kind: 'friend', relationship: 50, log: '{{person}} from three doors down and I bonded over a very stubborn branch.' } }] },
        ],
      },
      {
        id: 'chainsaw',
        label: 'Supervise the chainsaw guy',
        effects: [
          { karma: 1 },
          {
            chance: 0.75,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I stopped him from felling his own garage. He owes me favors for life.', kind: 'good' }],
            else: [{ injury: 3 }, { log: 'A branch snapped back and caught my shoulder. He was very sorry. So was my shoulder.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'chipper',
        label: 'Rent a wood chipper',
        hint: '{{$200}}',
        effects: [{ money: -200 }, { karma: 3 }, { stat: 'happiness', delta: 3 }, { log: 'I rented a chipper for the block. For one day I was the most popular person on the street.', kind: 'good' }],
      },
      {
        id: 'inside',
        label: 'Watch with coffee',
        effects: [{ stat: 'happiness', delta: 1 }, { karma: -2 }, { log: 'I watched from the window with coffee. Someone left a pointed pile of branches by my door.' }],
      },
    ],
  },
  {
    id: 'mc_community_supper',
    category: 'random',
    title: 'Thursday supper',
    text: 'The congregation on the corner serves a free supper every Thursday to anyone who walks in. A neighbor who volunteers there asked if I could help serve, or just come and eat.',
    minAge: 18,
    maxAge: 90,
    weight: 1,
    // The same congregation and Thursday supper: at most twice in a life (CONTENT_STYLE).
    cooldown: 37,
    choices: [
      {
        id: 'serve',
        label: 'Help serve',
        effects: [
          { karma: 3 },
          { stat: 'happiness', delta: 3 },
          { energy: -1 },
          { log: 'I ladled soup for three hours and learned a lot of names. My feet hurt. Nothing else did.', kind: 'good' },
        ],
      },
      {
        id: 'eat',
        label: 'Come and eat',
        effects: [
          { stat: 'happiness', delta: 3 },
          { energy: -1 },
          { log: 'I came, ate, and stayed for dessert. Nobody asked me anything except whether I wanted seconds.' },
          { chance: 0.5, then: [{ newPerson: { kind: 'friend', relationship: 50, log: 'I shared a table with {{person}}, who talked about birds for an hour. Now we are friends.' } }] },
        ],
      },
      {
        id: 'bake',
        label: 'Drop off a tray of brownies',
        hint: '{{$40}}',
        effects: [{ money: -40 }, { karma: 2 }, { log: 'I dropped off a tray of brownies. They were gone before the soup.' }],
      },
      {
        id: 'decline',
        label: 'Politely decline',
        effects: [{ log: 'I said I was busy. The neighbor said the door is open every Thursday, no matter what.' }],
      },
    ],
  },
  {
    id: 'mc_friend_celebration',
    category: 'friends',
    title: 'When to stand',
    text: "{{person}} invited me to {{their}} family's big religious celebration. I do not know the songs, the food, or when to stand, and {{they}} says that is exactly why I should come.",
    minAge: 14,
    maxAge: 90,
    weight: 1,
    // "I do not know the songs" each time: at most twice in a life (CONTENT_STYLE).
    cooldown: 39,
    person: { kind: ['friend', 'bestFriend', 'coworker', 'classmate'] },
    choices: [
      {
        id: 'go',
        label: 'Go and follow along',
        effects: [
          { relationship: 'person', delta: 8 },
          { stat: 'happiness', delta: 4 },
          { stat: 'smarts', delta: 1 },
          { energy: -1 },
          { log: "I stood when everyone stood and ate whatever {{person}}'s aunt handed me. It was wonderful.", kind: 'good' },
        ],
      },
      {
        id: 'ask',
        label: 'Ask {{them}} to explain first',
        effects: [
          { relationship: 'person', delta: 5 },
          { stat: 'smarts', delta: 3 },
          { energy: -1 },
          { log: '{{person}} walked me through every part beforehand. I knew more than some of the cousins did.', kind: 'good' },
        ],
      },
      {
        id: 'gift',
        label: 'Bring flowers for the hosts',
        hint: '{{$50}}',
        effects: [
          { money: -50 },
          { relationship: 'person', delta: 6 },
          { karma: 2 },
          { log: 'I brought flowers for {{their}} family. They put them in the middle of the table.', kind: 'good' },
        ],
      },
      {
        id: 'excuse',
        label: 'Make an excuse',
        effects: [{ relationship: 'person', delta: -5 }, { log: '{{person}} said okay, the way people say okay when it is not.' }],
      },
    ],
  },

  // ------------------------------------------------------------ disasters
  {
    id: 'mc_cooling_center',
    category: 'elderly',
    title: 'Too hot',
    text: 'The heat wave is on its ninth day. The radio keeps saying people my age should not be alone in it, and the city has turned the library into a cooling center with cots and free water.',
    minAge: 65,
    maxAge: 95,
    weight: 1,
    // The same ninth day of heat and library cots: at most twice in a life (CONTENT_STYLE).
    cooldown: 16,
    choices: [
      {
        id: 'library',
        label: 'Spend days at the library',
        effects: [{ stat: 'health', delta: 3 }, { stat: 'smarts', delta: 1 }, { energy: -1 }, { log: "I spent the heat wave on a cot in the library's large-print section and finished four mysteries.", kind: 'good' }],
      },
      {
        id: 'home',
        label: 'Tough it out at home',
        effects: [
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.3,
            then: [{ stat: 'health', delta: -8 }, { log: 'On day eleven I got dizzy and sat on the kitchen floor. A neighbor found me and called a doctor.', kind: 'bad' }],
            else: [{ stat: 'health', delta: -2 }, { log: 'I soaked my feet in a bucket and kept the blinds shut. I made it, damply.' }],
          },
        ],
      },
      {
        id: 'ac',
        label: 'Buy an air conditioner',
        hint: '{{$400}}',
        effects: [{ money: -400 }, { stat: 'health', delta: 2 }, { stat: 'happiness', delta: 3 }, { log: 'I bought a window unit. My living room became the coolest place on the block.', kind: 'good' }],
      },
      {
        id: 'family',
        label: 'Stay with family',
        conditions: [{ hasPerson: ['child'] }],
        effects: [{ relationship: 'child', delta: 3 }, { stat: 'happiness', delta: 2 }, { log: 'I stayed with family, in the room with the good fan. We argued about the thermostat, lovingly.' }],
      },
    ],
  },
  {
    id: 'mc_snowstorm',
    category: 'random',
    title: 'Snowed in',
    text: 'The worst snowstorm in years buried {{city}} overnight. Parked cars are white humps along the curb, the buses have given up, and the street is so quiet I can hear the snow landing.',
    minAge: 18,
    maxAge: 85,
    weight: 1,
    // The worst snowstorm in years: at most twice in a life (CONTENT_STYLE).
    cooldown: 34,
    // Not the US: its cities include Miami, Phoenix and Los Angeles. A big storm once in years fits mild GB and FR.
    conditions: [{ country: ['CA', 'DE', 'GB', 'FR', 'JP'] }],
    choices: [
      {
        id: 'shovel',
        label: 'Dig out the neighbors',
        effects: [
          { stat: 'health', delta: 2 },
          { karma: 3 },
          { energy: -1 },
          {
            chance: 0.15,
            then: [{ injury: 3 }, { log: 'I dug out three paths and then my back filed a formal complaint.', kind: 'bad' }],
            else: [{ log: 'I dug out three paths and an elderly neighbor. She paid me in soup.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'snowday',
        label: 'Declare a snow day',
        effects: [{ stat: 'happiness', delta: 5 }, { jobPerformance: -2 }, { log: 'I made pancakes, ignored the phone, and watched the snow like it was a show.' }],
      },
      {
        id: 'work',
        label: 'Trek in to work',
        conditions: [{ hasJob: true }],
        effects: [
          { jobPerformance: 5 },
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.2,
            then: [{ injury: 4 }, { log: 'I slipped on the ice and limped in late. My boss was impressed and alarmed.', kind: 'bad' }],
            else: [{ log: 'I trudged in, one of three who made it. My boss will remember that.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'sled',
        label: 'Find something to sled on',
        effects: [
          { stat: 'happiness', delta: 6 },
          {
            chance: 0.15,
            then: [{ injury: 3 }, { log: 'I hit a hidden bench at the bottom of the hill. Worth it, mostly.', kind: 'bad' }],
            else: [{ stat: 'health', delta: 1 }, { log: 'I slid down the park hill on a baking tray. Years fell off me.', kind: 'good' }],
          },
        ],
      },
    ],
  },
  {
    id: 'mc_earthquake',
    category: 'random',
    title: 'The ground moved',
    text: 'At three in the morning the bed began to slide. The lamp swung, the dishes chattered in the cabinets, and a low rumble came up through the floor. Then it stopped, and every dog in {{city}} started.',
    minAge: 16,
    maxAge: 90,
    weight: 1,
    once: true,
    conditions: [{ country: ['JP', 'IT'] }],
    choices: [
      {
        id: 'cover',
        label: 'Get under the table',
        effects: [{ stat: 'smarts', delta: 1 }, { log: 'I crouched under the table until the aftershock passed. Textbook. The glasses, less so.' }],
      },
      {
        id: 'run',
        label: 'Run outside',
        effects: [
          {
            chance: 0.25,
            then: [{ injury: 4 }, { log: 'I ran outside barefoot and stepped on a broken flowerpot. The building was fine.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 2 }, { log: 'I stood in the street in my pajamas with half the block. Someone made tea. Nobody slept again.' }],
          },
        ],
      },
      {
        id: 'check',
        label: 'Check on the neighbors',
        effects: [{ karma: 3 }, { stat: 'happiness', delta: 2 }, { energy: -1 }, { log: 'I knocked on doors up and down the street. Everyone was fine, shaken, and grateful.', kind: 'good' }],
      },
      {
        id: 'scroll',
        label: 'Read the news in bed',
        effects: [{ stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 2 }, { log: 'I read updates until dawn. A moderate quake, no serious damage, and no sleep at all.' }],
      },
    ],
  },
  {
    id: 'mc_long_outage',
    category: 'random',
    title: 'Day three',
    text: "Day three without power after a fire at the substation. The fridge has given up, the library is the only place with lights, and the whole street smells faintly of everyone's barbecue.",
    minAge: 18,
    maxAge: 90,
    weight: 1,
    // The same substation fire: twice in a life at most, decades apart.
    cooldown: 37,
    choices: [
      {
        id: 'library',
        label: 'Camp out at the library',
        effects: [
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: 2 },
          { energy: -1 },
          { log: 'I spent three days at the library with half the street, sharing outlets and extension cords.', kind: 'good' },
          { chance: 0.5, then: [{ newPerson: { kind: 'friend', relationship: 50, log: '{{person}} shared a power strip with me on day two. We still meet for coffee.' } }] },
        ],
      },
      {
        id: 'generator',
        label: 'Buy a generator',
        hint: '{{$800}}',
        conditions: [{ ownsAsset: 'house' }],
        effects: [{ money: -800 }, { stat: 'happiness', delta: 3 }, { karma: -1 }, { log: "I bought a generator. It roared in the yard all night and the neighbors' looks said everything." }],
      },
      {
        id: 'stay',
        label: 'Go stay with someone',
        conditions: [{ hasPerson: ['mother', 'father', 'sibling', 'friend', 'bestFriend', 'lover'] }],
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I slept on a couch across town next to a working outlet. It felt like luxury.' }],
      },
      {
        id: 'rough',
        label: 'Rough it',
        effects: [{ stat: 'health', delta: -2 }, { stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 1 }, { log: 'Candles, cold beans and early nights. By day five I had read two books.' }],
      },
    ],
  },

  // ------------------------------------------------------------ work, one per job category
  {
    id: 'mc_work_short_staffed',
    category: 'work',
    title: 'Short-staffed',
    text: 'Half the staff called in sick on the busiest day of the year at {{company}}. The schedule on the wall is mostly crossed out, and everyone who did show up is looking at me.',
    minAge: 18,
    maxAge: 70,
    weight: 1,
    // The same busiest day of the year: at most twice in a life (CONTENT_STYLE).
    cooldown: 27,
    conditions: [{ hasJob: true }, { jobCategory: ['service'] }, { jobLevel: { lte: 2 } }],
    choices: [
      {
        id: 'lead',
        label: 'Take charge',
        effects: [
          { energy: -1 },
          {
            chance: 0.6,
            then: [{ jobPerformance: 8 }, { stat: 'happiness', delta: 3 }, { log: "I ran the day like air traffic control. By closing, people were calling me 'boss', mostly as a joke.", kind: 'good' }],
            else: [{ jobPerformance: 2 }, { stat: 'health', delta: -3 }, { log: 'I took charge and it was chaos anyway. We survived. Nobody remembers who was in charge.' }],
          },
        ],
      },
      {
        id: 'double',
        label: 'Work a double shift',
        effects: [{ money: 150 }, { stat: 'health', delta: -4 }, { jobPerformance: 4 }, { log: 'Sixteen hours on my feet. Overtime pay, and a body that filed a complaint.', kind: 'money' }],
      },
      {
        id: 'own',
        label: 'Just do my own job',
        effects: [{ jobPerformance: -2 }, { stat: 'happiness', delta: 1 }, { log: 'I did my job and nothing else. The day was terrible, but not my kind of terrible.' }],
      },
    ],
  },
  {
    id: 'mc_work_near_miss',
    category: 'work',
    title: 'An inch',
    text: 'Something slipped at work today and missed my hand by about an inch. My heart is still going. The sign at {{company}} says 41 days without an injury, and nobody else saw.',
    minAge: 18,
    maxAge: 70,
    weight: 1,
    // The same 41-days sign: at most twice in a life (CONTENT_STYLE).
    cooldown: 27,
    conditions: [{ hasJob: true }, { jobCategory: ['trade'] }, { jobLevel: { lte: 2 } }],
    choices: [
      {
        id: 'report',
        label: 'Report the near miss',
        effects: [
          { karma: 2 },
          { jobPerformance: 2 },
          { stat: 'happiness', delta: -1 },
          { log: 'I filed a report and the supervisor grumbled. They fixed the problem that week, though.', kind: 'good' },
        ],
      },
      {
        id: 'shrug',
        label: 'Shake it off',
        effects: [
          { jobPerformance: 1 },
          {
            chance: 0.3,
            then: [{ injury: 8 }, { log: 'Two weeks later it slipped again and did not miss. Eleven stitches, and the sign went back to zero.', kind: 'bad' }],
            else: [{ log: 'I shook it off and it never happened again. My hands still go cold when I remember it.' }],
          },
        ],
      },
      {
        id: 'gear',
        label: 'Buy better safety gear',
        hint: '{{$200}}',
        effects: [{ money: -200 }, { stat: 'health', delta: 1 }, { log: 'I bought proper gloves, glasses and boots myself. My coworkers mocked me, then copied me.' }],
      },
      {
        id: 'home',
        label: 'Take the rest of the day',
        effects: [{ money: -100 }, { jobPerformance: -2 }, { stat: 'happiness', delta: 2 }, { log: 'I went home early and sat in the sun for an hour. My paycheck noticed. I did not care.' }],
      },
    ],
  },
  {
    id: 'mc_work_reorg',
    category: 'work',
    title: 'The reorg',
    text: '{{company}} announced a reorganization, with a new chart full of boxes and dotted lines. My box now reports to a dotted line, and nobody can tell me who the dotted line is.',
    minAge: 20,
    maxAge: 70,
    weight: 1,
    // The same chart and dotted line: at most twice in a life (CONTENT_STYLE).
    cooldown: 26,
    // My box reports to someone, and the 'ask' choice finds my new boss: not the office manager at the top (HAS_A_BOSS).
    conditions: [{ hasJob: true }, { jobCategory: ['office'] }, { jobLevel: { lte: 2 } }, HAS_A_BOSS],
    choices: [
      {
        id: 'volunteer',
        label: 'Volunteer for the new team',
        effects: [
          {
            chance: 0.55,
            then: [{ jobPerformance: 8 }, { stat: 'happiness', delta: 3 }, { log: 'I raised my hand for the new team. Six months later I was running half of it.', kind: 'good' }],
            else: [{ jobPerformance: -2 }, { stat: 'happiness', delta: -4 }, { log: 'The new team was dissolved in the next reorg. I am back where I started, with a new mug.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'ask',
        label: 'Ask who my boss is',
        effects: [{ stat: 'smarts', delta: 1 }, { jobPerformance: 2 }, { log: 'I asked until someone answered. My new boss is lovely and also unsure who I am.' }],
      },
      {
        id: 'resume',
        label: 'Quietly update my resume',
        effects: [{ stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: 1 }, { jobPerformance: -2 }, { log: 'I updated my resume during a meeting about the reorg. It was the most productive hour of my week.' }],
      },
      {
        id: 'wait',
        label: 'Wait for the next reorg',
        effects: [{ stat: 'happiness', delta: 2 }, { jobPerformance: -1 }, { log: 'I kept my head down. There will be another chart within a year. There always is.' }],
      },
    ],
  },
  {
    id: 'mc_work_rollout',
    category: 'work',
    title: 'The rollout',
    text: 'The big rollout at {{company}} has a launch date chosen by someone who has never met a computer. It is in nine days. The work needs about thirty, and the date is already in a press release.',
    minAge: 20,
    maxAge: 70,
    weight: 1,
    // The same nine-day launch date: at most twice in a life (CONTENT_STYLE).
    cooldown: 26,
    conditions: [{ hasJob: true }, { jobCategory: ['tech'] }, { jobLevel: { lte: 3 } }],
    choices: [
      {
        id: 'crunch',
        label: 'Crunch every night',
        effects: [
          { jobPerformance: 8 },
          { stat: 'health', delta: -5 },
          { stat: 'happiness', delta: -4 },
          { energy: -1 },
          { log: 'Nine days of cold pizza and 2 a.m. fixes. It launched. I do not remember that month.' },
        ],
      },
      {
        id: 'pushback',
        label: 'Push back on the date',
        effects: [
          {
            chance: 0.45,
            then: [{ jobPerformance: 4 }, { stat: 'happiness', delta: 4 }, { log: "I showed the math to the right people. The date moved, and the press release was 'updated'.", kind: 'good' }],
            else: [{ jobPerformance: -4 }, { stat: 'happiness', delta: -2 }, { log: "I pushed back and was told to 'be a solutions person'. The date did not move.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'cut',
        label: 'Cut scope and ship',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.5,
            then: [{ jobPerformance: 3 }, { log: 'We shipped half the features on time. Customers noticed nothing. Management noticed less.' }],
            else: [{ jobPerformance: -6 }, { log: 'We cut a corner that turned out to be holding up the roof. The weekend was long.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'mc_work_free_consult',
    category: 'work',
    title: 'Free consultation',
    text: 'At a backyard barbecue, a man found out I am a {{job}} and immediately began describing a symptom in great detail, holding a hot dog, while everyone nearby went quiet to listen.',
    minAge: 20,
    maxAge: 75,
    weight: 1,
    // The same man at the same barbecue: at most twice in a life (CONTENT_STYLE).
    cooldown: 28,
    conditions: [{ hasJob: true }, { jobCategory: ['health'] }],
    choices: [
      {
        id: 'advise',
        label: 'Give careful advice',
        effects: [
          { stat: 'smarts', delta: 1 },
          { karma: 2 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'I told him to see his own doctor, kindly. He did, and sent his thanks through three cousins.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I gave cautious advice. He took it as permission to never see a doctor at all.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'book',
        label: 'Tell him to book an appointment',
        effects: [{ stat: 'happiness', delta: 1 }, { log: "I said, 'Book an appointment,' my three favorite words. He looked wounded and ate his hot dog." }],
      },
      {
        id: 'grill',
        label: 'Hide behind the grill',
        effects: [{ stat: 'happiness', delta: 2 }, { karma: -1 }, { log: 'I tended the grill all afternoon like it was my job. It was the most restful shift of my year.' }],
      },
    ],
  },
  {
    id: 'mc_work_case_home',
    category: 'work',
    title: 'Taking it home',
    text: 'A case at {{company}} has followed me home. I read the file at breakfast, replay the arguments in the shower, and last night I dreamed about the evidence binder, tab by tab.',
    minAge: 22,
    maxAge: 75,
    weight: 1,
    // The same evidence binder, tab by tab: at most twice in a life (CONTENT_STYLE).
    cooldown: 27,
    conditions: [{ hasJob: true }, { jobCategory: ['law'] }],
    choices: [
      {
        id: 'deep',
        label: 'Go all in on it',
        effects: [{ jobPerformance: 7 }, { stat: 'happiness', delta: -4 }, { stat: 'health', delta: -2 }, { log: 'I lived inside that case for a month. The outcome was right. My houseplants died.' }],
      },
      {
        id: 'rule',
        label: 'No files after eight',
        effects: [{ stat: 'happiness', delta: 4 }, { jobPerformance: -1 }, { log: 'I made a rule: no files after eight. I broke it twice. Twice is progress.', kind: 'good' }],
      },
      {
        id: 'talk',
        label: 'Talk it over with a colleague',
        effects: [
          {
            chance: 0.6,
            then: [{ jobPerformance: 4 }, { stat: 'happiness', delta: 3 }, { log: 'A colleague saw in five minutes what I had missed for a week, then bought me a coffee.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'My colleague just told me about their own worst case. It did not help, but it was company.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'mc_work_student_worry',
    category: 'work',
    title: 'Something is wrong',
    text: 'A student I see every week at {{company}} has gone quiet: same hoodie every day, no lunch, eyes on the floor. Today they lingered after everyone left, like they had something to say.',
    minAge: 20,
    maxAge: 75,
    weight: 1,
    // The same quiet student in the same hoodie: at most twice in a life (CONTENT_STYLE).
    cooldown: 28,
    conditions: [{ hasJob: true }, { jobCategory: ['education'] }],
    choices: [
      {
        id: 'ask',
        label: 'Ask gently if they are okay',
        effects: [
          { karma: 3 },
          { energy: -1 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'Trouble at home, it turned out. I listened, then walked them to someone who could help.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: "They said 'I'm fine' and left fast. The next week they said hello, which felt like something." }],
          },
        ],
      },
      {
        id: 'refer',
        label: 'Tell someone who can help',
        effects: [
          { karma: 2 },
          { jobPerformance: 1 },
          {
            chance: 0.7,
            then: [{ log: "I passed my worry to the student's counselor that afternoon. A week later the hoodie changed color.", kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'The counselor I reached was swamped and it took weeks. In the end I checked in myself.' }],
          },
        ],
      },
      {
        id: 'notmine',
        label: 'Decide it is not my place',
        effects: [{ karma: -2 }, { stat: 'happiness', delta: -2 }, { jobPerformance: 3 }, { log: 'I let them leave and finished my paperwork. I have thought about that doorway ever since.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'mc_work_creative_block',
    category: 'work',
    title: 'Blank page',
    text: 'For three weeks I have made nothing at {{company}} that I would put my name on. The deadline is fixed. My ideas are not. I have reorganized my desk twice and alphabetized my pens.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    // The same three weeks and alphabetized pens: at most twice in a life (CONTENT_STYLE).
    cooldown: 29,
    conditions: [{ hasJob: true }, { jobCategory: ['creative'] }],
    choices: [
      {
        id: 'walk',
        label: 'Walk away for a day',
        effects: [
          { stat: 'happiness', delta: 3 },
          { jobPerformance: -2 },
          {
            chance: 0.5,
            then: [{ jobPerformance: 6 }, { log: 'On a long walk the idea arrived, whole, near a bus stop. I wrote it on my hand.', kind: 'good' }],
            else: [{ log: 'I walked all day and came back with sore feet and no ideas. But calmer.' }],
          },
        ],
      },
      {
        id: 'force',
        label: 'Force it until it works',
        effects: [{ jobPerformance: 3 }, { stat: 'happiness', delta: -3 }, { log: "I forced it. The work was fine. 'Fine' is a terrible word to hear about your work." }],
      },
      {
        id: 'recycle',
        label: 'Dust off an old idea',
        effects: [
          {
            chance: 0.65,
            then: [{ jobPerformance: 4 }, { log: 'I revived an idea I rejected years ago. Everyone loved it. I feel like a fraud and a genius.', kind: 'good' }],
            else: [{ jobPerformance: -5 }, { log: 'It turned out I had rejected it years ago for a reason. The room found the reason in ten minutes.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'riff',
        label: 'Ask a colleague to riff',
        effects: [{ jobPerformance: 4 }, { stat: 'happiness', delta: 2 }, { energy: -1 }, { log: 'Ten minutes of bad ideas with a colleague shook loose a good one. We split the credit.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'mc_work_budget_cuts',
    category: 'work',
    title: 'Budget cuts',
    text: "{{company}} is having its budget cut again. We have been told to 'do more with less', which so far means fewer people, older equipment, and a printer held together with tape.",
    minAge: 18,
    maxAge: 70,
    weight: 1,
    cooldown: 6,
    // Told to do more with less: staff, not a city councilor who votes on the budget.
    conditions: [{ hasJob: true }, { jobCategory: ['public'] }, { jobLevel: { lte: 1 } }, { not: { all: [{ jobId: ['politician'] }, { jobLevel: { gte: 1 } }] } }],
    choices: [
      {
        id: 'speak',
        label: 'Speak up at the meeting',
        effects: [
          { karma: 3 },
          {
            chance: 0.4,
            then: [{ jobPerformance: 3 }, { stat: 'happiness', delta: 4 }, { log: 'I laid out what the cuts would cost the public. Someone upstairs listened, for once.', kind: 'good' }],
            else: [{ jobPerformance: -4 }, { stat: 'happiness', delta: -2 }, { log: 'I spoke up. My name was noted, and not in a good way.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'more',
        label: 'Do more with less',
        effects: [{ jobPerformance: 5 }, { stat: 'health', delta: -4 }, { stat: 'happiness', delta: -2 }, { log: 'I covered two jobs for a year. The public got the same service. I got gray hair.' }],
      },
      {
        id: 'private',
        label: 'Browse private-sector jobs',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 1 }, { jobPerformance: -3 }, { log: 'I browsed private-sector listings on my lunch break. The salaries were rude in a good way.' }],
      },
    ],
  },
  {
    id: 'mc_work_missing_money',
    category: 'work',
    title: 'It does not add up',
    text: 'A total on my screen at {{company}} does not match the report: off by exactly {{$10000}}. It is 4:55 on a Friday, and everyone around me is already packing up their bags.',
    minAge: 20,
    maxAge: 70,
    weight: 1,
    // The same {{$10000}} gap at 4:55 on a Friday: at most twice in a life (CONTENT_STYLE).
    cooldown: 26,
    conditions: [{ hasJob: true }, { jobCategory: ['finance'] }, { jobLevel: { lte: 2 } }],
    choices: [
      {
        id: 'stay',
        label: 'Stay until I find it',
        effects: [
          { stat: 'health', delta: -2 },
          { stat: 'happiness', delta: -3 },
          {
            random: [
              { weight: 6, effects: [{ jobPerformance: 4 }, { log: 'At nine I found it: a misplaced decimal. I said a bad word to an empty office.' }] },
              { weight: 4, effects: [{ jobPerformance: 8 }, { log: 'It was not a typo. I flagged it on Monday and got thanked by someone very senior.', kind: 'good' }] },
            ],
          },
        ],
      },
      {
        id: 'flag',
        label: 'Flag it to my manager',
        // A manager above me: not the branch or agency manager at the top of the ladder.
        conditions: [HAS_A_BOSS],
        effects: [
          {
            chance: 0.6,
            then: [{ jobPerformance: 3 }, { log: 'My manager traced it to a known glitch in ten minutes and thanked me for asking.', kind: 'good' }],
            else: [{ jobPerformance: -2 }, { stat: 'happiness', delta: -3 }, { log: 'It was my own mistake, from Tuesday. My manager was kind about it, which was worse.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'monday',
        label: 'Leave it for Monday',
        effects: [
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.4,
            then: [{ jobPerformance: -6 }, { log: 'By Monday it had grown into a meeting with my name on the invite.', kind: 'bad' }],
            else: [{ log: 'By Monday it had fixed itself. Nobody knows why. I will never ask.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'mc_work_inspection',
    category: 'work',
    title: 'The inspection',
    text: 'A safety inspector arrives at {{company}} next week. The binder of official procedures has not been opened since it was printed, and someone has been using it to steady a wobbly table.',
    minAge: 20,
    maxAge: 70,
    weight: 1,
    // The same binder under the same wobbly table: at most twice in a life (CONTENT_STYLE).
    cooldown: 26,
    conditions: [{ hasJob: true }, { jobCategory: ['science'] }],
    choices: [
      {
        id: 'organize',
        label: 'Get everything in order',
        effects: [
          { jobPerformance: 6 },
          { energy: -1 },
          { stat: 'happiness', delta: -2 },
          { log: 'I spent a week labeling things and found three procedures nobody had followed in years. We passed.', kind: 'good' },
        ],
      },
      {
        id: 'honest',
        label: 'Tell the inspector the truth',
        effects: [
          { karma: 3 },
          {
            chance: 0.5,
            then: [{ jobPerformance: 3 }, { log: 'The inspector thanked me for being straight and gave us a month to fix things.', kind: 'good' }],
            else: [{ jobPerformance: -4 }, { log: 'Honesty earned us a failing grade and a second visit. The whole floor has been cool toward me.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'hope',
        label: 'Hope for the best',
        effects: [
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.5,
            then: [{ jobPerformance: -5 }, { log: 'The inspector opened the binder, found the coffee ring, and wrote for a long time.', kind: 'bad' }],
            else: [{ log: 'The inspector was in a hurry and checked three things. We passed on luck alone.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'mc_work_knee',
    category: 'work',
    title: 'The knee',
    text: 'My knee has been talking to me for weeks, and at {{company}} a body that talks back is a problem. Saturday is a big day, and everyone expects me at my best.',
    minAge: 18,
    maxAge: 65,
    weight: 1,
    cooldown: 4,
    conditions: [{ hasJob: true }, { jobCategory: ['sports'] }],
    choices: [
      {
        id: 'push',
        label: 'Push through Saturday',
        effects: [
          { jobPerformance: 5 },
          {
            chance: 0.35,
            then: [{ injury: 10 }, { log: 'The knee gave out halfway through. Six weeks in a brace and a lot of sympathetic messages.', kind: 'bad' }],
            else: [{ log: 'I gritted my teeth through Saturday. The knee and I are no longer speaking.' }],
          },
        ],
      },
      {
        id: 'physio',
        label: 'See a physical therapist',
        hint: '{{$300}}',
        effects: [{ money: -300 }, { stat: 'health', delta: 4 }, { jobPerformance: 2 }, { log: 'A physical therapist bent me into odd shapes and fixed it in three sessions.', kind: 'good' }],
      },
      {
        id: 'rest',
        label: 'Sit Saturday out',
        effects: [{ jobPerformance: -4 }, { stat: 'health', delta: 3 }, { stat: 'happiness', delta: -2 }, { log: 'I sat out and watched from the side. The knee thanked me. My pride did not.' }],
      },
    ],
  },
];

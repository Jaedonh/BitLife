import type { EventDef } from '@/engine/events/schema';

/**
 * Health events for every age: sports injuries, food poisoning, a mystery
 * rash, a scare that needs tests, the dentist, insomnia, a fitness challenge with a
 * friend, a lifestyle lecture, allergies, a car crash, temptation after a
 * rough week, a wellness scam, giving blood, a near miss, a flu year, bad
 * news about a relative, and a handful of age-specific scrapes.
 * Follow-ups (followUpOnly) are queued by the events that set them up and
 * never fire on their own.
 */
export const HEALTH_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ injuries & aches
  {
    id: 'hl_sports_injury',
    category: 'health',
    title: 'Bad landing',
    text: 'I went up for a ball in a pickup game and came down on the side of my ankle. It made a sound. The sound was not good.',
    minAge: 13,
    maxAge: 45,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'play_on',
        label: 'Play through it',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I limped through the rest of the game and we won. Heroic, slightly stupid.', kind: 'good' }],
            else: [{ injury: 8 }, { stat: 'happiness', delta: -3 }, { log: 'The ankle gave out completely on the next play. Six weeks in a boot.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'ice',
        label: 'Sit out and ice it',
        effects: [{ injury: 2 }, { stat: 'happiness', delta: -2 }, { log: 'I sat on the sideline with a bag of frozen peas and watched everyone else have fun. It healed fine.' }],
      },
      {
        id: 'physio',
        label: 'See a physical therapist',
        hint: '{{$200}}',
        effects: [{ money: -200 }, { injury: 1 }, { stat: 'health', delta: 3 }, { counter: 'workouts' }, { log: 'The therapist taped me up and gave me exercises. I actually did them. The ankle is stronger now.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'hl_food_poisoning',
    category: 'health',
    title: 'Questionable shrimp',
    text: 'The seafood at the buffet tasted a little off, but it was free. Four hours later my body filed a formal complaint.',
    minAge: 13,
    maxAge: 90,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'ride',
        label: 'Ride it out',
        effects: [{ illness: 'food_poisoning' }, { stat: 'happiness', delta: -4 }, { log: 'Two days on the bathroom floor. I have never been so well acquainted with the tiles.', kind: 'bad' }],
      },
      {
        id: 'clinic',
        label: 'Go to a clinic',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          {
            chance: 0.85,
            then: [{ stat: 'happiness', delta: -1 }, { log: 'An IV, some pills and a stern pamphlet. I was fine by morning.', kind: 'good' }],
            else: [{ illness: 'food_poisoning' }, { log: 'Even the clinic could not speed it up. {{$150}} to be told to drink water.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'review',
        label: 'Post a furious review',
        effects: [
          { illness: 'food_poisoning' },
          { karma: -2 },
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.4,
            then: [{ money: 80 }, { log: 'The restaurant refunded the meal to make me go away. Still sick, slightly richer.', kind: 'money' }],
            else: [{ log: 'My review got three likes and a reply from the owner calling me a liar. I was still sick.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'hl_mystery_rash',
    category: 'health',
    title: 'The rash',
    text: 'A red, blotchy rash appeared on my arm overnight. It does not itch, it does not hurt, and it is slowly taking the shape of a country I have never visited.',
    minAge: 13,
    maxAge: 85,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'ignore',
        label: 'Ignore it',
        effects: [
          {
            chance: 0.7,
            then: [{ log: 'It faded in a week. Bodies are weird.' }],
            else: [{ stat: 'health', delta: -4 }, { stat: 'looks', delta: -2 }, { log: 'It spread to my neck and stayed for a month. People kept asking.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'derm',
        label: 'See a dermatologist',
        hint: '{{$300}}',
        effects: [
          { money: -300 },
          {
            random: [
              { weight: 6, effects: [{ stat: 'happiness', delta: -1 }, { log: 'Contact dermatitis from a new laundry detergent. {{$300}} to be told to switch detergents.' }] },
              { weight: 3, effects: [{ stat: 'health', delta: 4 }, { log: 'The dermatologist caught something early and treated it. Worth every cent.', kind: 'good' }] },
              { weight: 1, effects: [{ stat: 'happiness', delta: 2 }, { log: 'She had no idea. She took a photo for a conference. I am now a slide.' }] },
            ],
          },
        ],
      },
      {
        id: 'internet',
        label: 'Try an internet remedy',
        effects: [
          {
            random: [
              { weight: 5, effects: [{ stat: 'looks', delta: -1 }, { log: 'I rubbed it with vinegar and garlic, as a forum advised. It cleared up. Correlation, not causation.' }] },
              { weight: 3, effects: [{ stat: 'health', delta: -5 }, { stat: 'looks', delta: -3 }, { log: 'The remedy made it angrier. I now had a rash and a chemical burn.', kind: 'bad' }] },
              { weight: 2, effects: [{ stat: 'happiness', delta: 2 }, { log: 'It went away by itself and I got to feel like a wizard.' }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'hl_dentist',
    category: 'health',
    title: 'The toothache',
    text: 'A dull ache in a back tooth has become a sharp one. Cold water is now an enemy. So is warm water. So, increasingly, is chewing.',
    minAge: 13,
    maxAge: 90,
    weight: 1.5,
    cooldown: 4,
    choices: [
      {
        id: 'dentist',
        label: 'See the dentist',
        hint: '{{$250}}',
        effects: [
          { money: -250 },
          {
            random: [
              { weight: 6, effects: [{ stat: 'health', delta: 2 }, { log: 'A filling, twenty minutes, a numb lip for the afternoon. Done.', kind: 'good' }] },
              { weight: 3, effects: [{ money: -600 }, { stat: 'happiness', delta: -2 }, { log: 'Root canal. The dentist hummed the whole way through. {{$850}} total, and I still hear the humming.', kind: 'bad' }] },
              { weight: 1, effects: [{ stat: 'happiness', delta: 1 }, { log: 'Nothing wrong at all. The dentist suggested I stop grinding my teeth at my problems.' }] },
            ],
          },
        ],
      },
      {
        id: 'wait',
        label: 'Wait for it to pass',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'It passed. Teeth are mysterious.' }],
            else: [{ stat: 'health', delta: -6 }, { stat: 'happiness', delta: -5 }, { money: -900 }, { log: 'It became an abscess. Emergency extraction, a swollen face and a bill three times the size.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'other_side',
        label: 'Chew on the other side',
        effects: [{ stat: 'happiness', delta: -2 }, { stat: 'looks', delta: -1 }, { log: 'I chewed on the left for a year. My jaw is now slightly asymmetrical. The tooth still hurts.' }],
      },
    ],
  },
  {
    id: 'hl_desk_back',
    category: 'health',
    title: 'Desk back',
    text: 'My back has started making a noise when I stand up. Not a crack, more a creak, like a door in an old house. Eight hours a day at {{company}} is adding up.',
    minAge: 25,
    maxAge: 65,
    weight: 1.2,
    cooldown: 6,
    conditions: [{ hasJob: true }, { partTime: false }, { jobCategory: ['office', 'tech', 'finance', 'law', 'education', 'science', 'creative'] }],
    choices: [
      {
        id: 'standing',
        label: 'Buy a standing desk',
        hint: '{{$400}}',
        effects: [{ money: -400 }, { stat: 'health', delta: 4 }, { jobPerformance: 2 }, { log: 'I stand now. I am insufferable about it. My back has gone quiet.', kind: 'good' }],
      },
      {
        id: 'physio',
        label: 'See a physical therapist',
        hint: '{{$250}}',
        effects: [{ money: -250 }, { stat: 'health', delta: 5 }, { counter: 'workouts' }, { log: 'Stretches, a foam roller and the phrase "core engagement." It works, annoyingly.', kind: 'good' }],
      },
      {
        id: 'ignore',
        label: 'Ignore the creak',
        effects: [
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.35,
            then: [{ illness: 'back_pain' }, { stat: 'health', delta: -4 }, { log: 'The creak became a spasm. I spent a week on the floor, reading emails on a phone held above my face.', kind: 'bad' }],
            else: [{ log: 'The creak remains. We have an understanding.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'hl_senior_fall',
    category: 'health',
    title: 'A slip',
    text: 'I slipped on the bathroom floor and went down hard. I lay there for a while, taking stock, listening to the faucet drip and feeling every one of my {{age}} years.',
    minAge: 65,
    maxAge: 100,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'hospital',
        label: 'Get checked at the hospital',
        hint: '{{$1500}}',
        effects: [
          { money: -1500 },
          {
            random: [
              { weight: 6, effects: [{ injury: 4 }, { stat: 'health', delta: 2 }, { log: 'Bruised hip, nothing broken. They kept me in overnight and sent me home with a pamphlet about rugs.' }] },
              { weight: 4, effects: [{ injury: 12 }, { counter: 'surgeries' }, { stat: 'happiness', delta: -5 }, { log: 'Fractured hip. Surgery, a walker and a long, boring recovery.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'up',
        label: 'Get up and say nothing',
        effects: [
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.55,
            then: [{ injury: 3 }, { log: 'Bruised and a little shaken. I told no one. Pride is a painkiller, for a while.' }],
            else: [{ injury: 12 }, { stat: 'health', delta: -4 }, { money: -2000 }, { log: 'Something was broken after all. By the time I admitted it, the recovery was twice as long.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'rails',
        label: 'Install grab bars',
        hint: '{{$300}}',
        effects: [
          { money: -300 },
          { stat: 'happiness', delta: -1 },
          {
            chance: 0.7,
            then: [{ injury: 3 }, { stat: 'health', delta: 3 }, { log: 'Bars by the tub, a mat on the floor, a stool in the shower. Undignified. Effective.', kind: 'good' }],
            else: [{ injury: 10 }, { money: -1500 }, { stat: 'health', delta: 1 }, { log: 'I put in the bars, then learned a week later the hip was cracked. Late to the doctor, slow to heal.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'hl_appendix_pain',
    category: 'health',
    title: 'Sudden stomach pain',
    text: 'A pain started near my belly button and marched, over an afternoon, down to the right. Now I cannot stand up straight and even breathing is a negotiation.',
    minAge: 13,
    maxAge: 45,
    weight: 0.5,
    once: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'er',
        label: 'Go to the emergency room',
        hint: 'up to {{$3000}}',
        effects: [
          {
            random: [
              { weight: 7, effects: [{ money: -3000 }, { counter: 'surgeries' }, { injury: 4 }, { stat: 'happiness', delta: -3 }, { log: 'Appendicitis. They took it out that night. I have a scar, a story and {{$3000}} less.', kind: 'milestone' }] },
              { weight: 3, effects: [{ money: -600 }, { stat: 'happiness', delta: -1 }, { log: 'Gas. {{$600}} for a scan and a doctor trying very hard not to smile.' }] },
            ],
          },
        ],
      },
      {
        id: 'wait',
        label: 'Wait and see',
        effects: [
          {
            chance: 0.45,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'It passed by morning. I will never know what it was and I am choosing not to think about it.' }],
            else: [
              { chance: 0.03, then: [{ death: 'a burst appendix' }] },
              { illness: 'appendicitis' },
              { injury: 10 },
              { money: -5000 },
              { counter: 'surgeries' },
              { stat: 'happiness', delta: -6 },
              { log: 'It burst. Emergency surgery, a week in the hospital, and a far bigger bill than the one I dodged.', kind: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'call_mum',
        label: 'Ask {{mother}} what to do',
        conditions: [{ hasPerson: ['mother'] }],
        effects: [
          {
            random: [
              { weight: 6, effects: [{ money: -2500 }, { counter: 'surgeries' }, { injury: 4 }, { relationship: 'mother', delta: 4 }, { log: '{{mother}} took one look and drove me straight to the hospital. Appendicitis, out the same night.', kind: 'milestone' }] },
              { weight: 4, effects: [{ illness: 'appendicitis' }, { injury: 10 }, { money: -5000 }, { counter: 'surgeries' }, { stat: 'happiness', delta: -6 }, { log: '{{mother}} said it was something I ate. It was not. It burst two days later.', kind: 'bad' }] },
            ],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ scares & tests
  {
    id: 'hl_health_scare',
    category: 'health',
    title: 'Something on the scan',
    text: 'My doctor paused during a routine checkup, frowned at the screen, and said there was "something" she would like to look at more closely. More tests cost {{$1200}}.',
    minAge: 35,
    maxAge: 85,
    weight: 1,
    cooldown: 8,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'tests',
        label: 'Get the tests',
        hint: '{{$1200}}',
        effects: [{ money: -1200 }, { stat: 'happiness', delta: -3 }, { log: 'I spent a week waiting on results, searching the internet for nothing and everything.' }, { queue: 'hl_health_scare_results' }],
      },
      {
        id: 'skip',
        label: 'Skip them',
        effects: [
          { stat: 'happiness', delta: 2 },
          { log: "I decided not to know. The doctor's face said she would remember this." },
          { chance: 0.2, then: [{ illness: 'hypertension' }, { stat: 'health', delta: -6 }, { log: 'A year later the thing on the scan had a name. Catching it earlier would have been cheaper.', kind: 'bad' }] },
        ],
      },
      {
        id: 'second',
        label: 'Get a second opinion',
        hint: '{{$600}}',
        effects: [
          { money: -600 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'The second doctor shrugged. "Shadow on the film." I bought myself dinner with the savings.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { money: -1200 }, { log: 'The second doctor agreed with the first and sent me straight for the tests anyway.' }, { queue: 'hl_health_scare_results' }],
          },
        ],
      },
    ],
  },
  {
    id: 'hl_health_scare_results',
    category: 'health',
    title: 'The results',
    text: 'The clinic called. The receptionist used the voice that means the doctor wants to see me in person rather than say it on the phone.',
    minAge: 35,
    maxAge: 90,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'hear',
        label: 'Go in and hear it',
        effects: [
          {
            random: [
              { weight: 5, effects: [{ stat: 'happiness', delta: 8 }, { log: 'Benign. Nothing to do. I walked out to the parking lot and laughed until a stranger checked on me.', kind: 'good' }] },
              { weight: 3, effects: [{ illness: 'hypertension' }, { stat: 'happiness', delta: -4 }, { log: 'High blood pressure, caught early. Pills, less salt, a plan. Manageable.' }] },
              { weight: 1, effects: [{ illness: 'cancer' }, { stat: 'happiness', delta: -12 }, { log: 'It was cancer, found early. The doctor said the word "treatable" four times. I counted.', kind: 'bad' }] },
              { weight: 1, effects: [{ stat: 'health', delta: 3 }, { stat: 'happiness', delta: 4 }, { log: "A harmless cyst, drained on the spot. {{$1200}} well spent for a good night's sleep.", kind: 'good' }] },
            ],
          },
        ],
      },
      {
        id: 'delay',
        label: 'Put off the appointment',
        effects: [
          { stat: 'happiness', delta: -5 },
          {
            chance: 0.35,
            then: [{ illness: 'hypertension' }, { stat: 'health', delta: -5 }, { log: 'When I finally went in, it had gotten worse. Fear is not a treatment.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 4 }, { log: 'I eventually went. Benign. I had worried for nothing, at length.', kind: 'good' }],
          },
        ],
      },
    ],
  },
  {
    id: 'hl_doctor_lifestyle',
    category: 'health',
    title: 'The talk',
    text: 'My doctor took off his glasses, which is never good, and said we needed to discuss "lifestyle." Diet, exercise, stress, sleep. He had a printed list.',
    minAge: 30,
    maxAge: 85,
    weight: 1.2,
    cooldown: 6,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'overhaul',
        label: 'Overhaul everything',
        effects: [{ stat: 'health', delta: 10 }, { stat: 'happiness', delta: -4 }, { stat: 'looks', delta: 2 }, { counter: 'workouts', by: 2 }, { log: 'Vegetables, walking, no second helpings. I feel wonderful and miss cheese like a lost friend.', kind: 'good' }],
      },
      {
        id: 'moderate',
        label: 'Make small changes',
        effects: [{ stat: 'health', delta: 4 }, { log: 'I swapped the elevator for the stairs and the cookies for slightly fewer cookies. Progress.' }],
      },
      {
        id: 'ignore',
        label: 'Nod and change nothing',
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'health', delta: -3 },
          {
            chance: 0.25,
            then: [{ illness: 'hypertension' }, { log: 'A year later, the numbers were worse. He did not say "told you so." His glasses did.', kind: 'bad' }],
            else: [{ log: 'I kept the list in a drawer. The drawer and I do not discuss it.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'hl_panic_attack',
    category: 'health',
    title: 'Chest tight',
    text: 'My chest went tight in the grocery checkout line. Heart hammering, hands tingling, the ceiling too far away. For a full minute I was sure I was dying between the bread and the registers.',
    minAge: 16,
    maxAge: 70,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'er',
        label: 'Go to the hospital',
        hint: '{{$900}}',
        effects: [
          { money: -900 },
          { stat: 'smarts', delta: 1 },
          {
            random: [
              { weight: 8, effects: [{ stat: 'happiness', delta: 2 }, { log: 'All clear. "Panic attack," the doctor said, kindly. "Very common. Very horrible." Then a pamphlet.' }] },
              { weight: 2, effects: [{ illness: 'hypertension' }, { log: 'The tests found something: blood pressure through the roof. The panic was my body sending a memo.' }] },
            ],
          },
        ],
      },
      {
        id: 'breathe',
        label: 'Breathe through it',
        effects: [
          { counter: 'meditations' },
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.6,
            then: [{ stat: 'health', delta: 1 }, { log: 'I counted breaths until the registers came back into focus, paid, then sat in the car for a while.' }],
            else: [{ illness: 'anxiety' }, { log: 'It happened again the next week, and the one after. It has a name now, and I am learning to cope.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'therapy',
        label: 'Talk to someone',
        hint: '{{$150}}',
        effects: [{ money: -150 }, { stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 1 }, { log: 'A therapist explained what my body was doing and why. It did not stop, but it got smaller.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'hl_eye_test',
    category: 'health',
    title: 'Squinting',
    text: 'I have started squinting at signs, menus and faces across the room. The world has gone slightly soft at the edges, like a photo taken through a sweater.',
    minAge: 13,
    maxAge: 90,
    weight: 1,
    cooldown: 8,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'glasses',
        label: 'Get glasses',
        hint: '{{$200}}',
        effects: [
          { money: -200 },
          { stat: 'smarts', delta: 2 },
          {
            random: [
              { weight: 5, effects: [{ stat: 'looks', delta: 2 }, { log: 'The optometrist said I had "a face for frames." I chose to take that well. The world is sharp again.', kind: 'good' }] },
              { weight: 5, effects: [{ stat: 'looks', delta: -1 }, { stat: 'happiness', delta: 2 }, { log: 'Leaves have edges. Faces have expressions. I had forgotten. The glasses are ugly and I do not care.', kind: 'good' }] },
            ],
          },
        ],
      },
      {
        id: 'contacts',
        label: 'Try contact lenses',
        hint: '{{$350}}',
        effects: [
          { money: -350 },
          { stat: 'looks', delta: 2 },
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.2,
            then: [{ stat: 'health', delta: -2 }, { log: 'I slept in them once too often and spent a week with an angry red eye.', kind: 'bad' }],
            else: [{ log: 'Nobody can tell. I can see. The morning routine now involves poking my own eyes, which is fine.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'squint',
        label: 'Keep squinting',
        effects: [
          { stat: 'smarts', delta: -2 },
          { stat: 'happiness', delta: -2 },
          { grade: -3 },
          {
            chance: 0.5,
            then: [{ stat: 'looks', delta: -1 }, { log: 'A permanent crease has formed between my eyebrows. I look suspicious of everything I cannot see.' }],
            else: [{ log: 'I got by on context clues and nodding. Occasionally I waved at strangers.' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ sleep, stress & habits
  {
    id: 'hl_insomnia',
    category: 'health',
    title: 'Wide awake',
    text: 'Three in the morning again. The ceiling and I have become close. I have rearranged the furniture in my head so many times the room feels fictional.',
    minAge: 15,
    maxAge: 90,
    weight: 1.2,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'routine',
        label: 'Build a sleep routine',
        effects: [{ stat: 'health', delta: 4 }, { stat: 'happiness', delta: 3 }, { counter: 'meditations' }, { log: 'No screens after nine, same bedtime, boring book. It took a month, but sleep came back.', kind: 'good' }],
      },
      {
        id: 'caffeine',
        label: 'Power through on caffeine',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 1 }, { log: 'I ran on coffee and spite for a season. Productive, jittery, slightly unhinged.' }],
            else: [{ stat: 'health', delta: -5 }, { stat: 'happiness', delta: -4 }, { log: 'The crash came. I fell asleep standing up on a bus and my body demanded a refund.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'doctor',
        label: 'Ask a doctor',
        hint: '{{$120}}',
        effects: [
          { money: -120 },
          {
            random: [
              { weight: 6, effects: [{ stat: 'health', delta: 3 }, { stat: 'happiness', delta: 4 }, { log: 'A short course of something gentle and a stern chat about screens. It helped.', kind: 'good' }] },
              { weight: 3, effects: [{ stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: 1 }, { log: "The doctor asked about stress. I did not have a short answer. She wrote down a therapist's number." }] },
              { weight: 1, effects: [{ illness: 'anxiety' }, { log: 'Turns out the insomnia was the tip of something. It has a name now, and a plan.' }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'hl_stress_temptation',
    category: 'health',
    title: 'Rough week',
    text: 'It has been the kind of week where everything that could go wrong did, twice. {{person}} says {{they}} knows exactly what will fix it, and it is not sleep.',
    minAge: 18,
    maxAge: 80,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ inPrison: false }, { any: [{ stat: 'happiness', lte: 60 }, { hasJob: true }] }],
    person: { kind: ['friend', 'bestFriend', 'coworker', 'sibling'], minAge: 18 },
    choices: [
      {
        id: 'drinks',
        label: 'Drinks, lots of them',
        effects: [
          { addiction: 'alcohol', delta: 8 },
          { stat: 'happiness', delta: 5 },
          { stat: 'health', delta: -3 },
          { relationship: 'person', delta: 3 },
          { log: 'We closed the bar. The week felt smaller for a few hours. The morning felt enormous.' },
          { chance: 0.2, then: [{ money: -200 }, { log: 'I also, apparently, bought a round for the entire bar.', kind: 'money' }] },
        ],
      },
      {
        id: 'spree',
        label: 'Retail therapy, no limits',
        effects: [
          { stat: 'happiness', delta: 6 },
          { relationship: 'person', delta: 2 },
          {
            random: [
              { weight: 4, effects: [{ money: -250 }, { log: 'I bought a jacket, a lamp and a plant I will probably kill. The jacket is excellent.', kind: 'money' }] },
              { weight: 6, effects: [{ money: -700 }, { stat: 'happiness', delta: -4 }, { log: 'I spent {{$700}} on things I cannot explain. {{person}} spent more and wanted to go again.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'run',
        label: 'Go for a run instead',
        effects: [{ counter: 'workouts' }, { stat: 'health', delta: 4 }, { stat: 'happiness', delta: 3 }, { relationship: 'person', delta: -2 }, { log: 'I ran until the week fell off me. {{person}} called me boring. I slept like a stone.', kind: 'good' }],
      },
      {
        id: 'home',
        label: 'Just go home',
        effects: [{ stat: 'happiness', delta: -1 }, { stat: 'health', delta: 1 }, { log: 'Bath, bed, nine hours. Not glamorous. Not nothing either.' }],
      },
    ],
  },
  {
    id: 'hl_fitness_challenge',
    category: 'health',
    title: 'The fitness challenge',
    text: '{{person}} has decided we are both "getting in shape" this year and wants a challenge: most workouts by December wins. {{They}} seemed alarmingly serious.',
    minAge: 14,
    maxAge: 70,
    weight: 1.2,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend', 'sibling', 'coworker'], minAge: 13, minRelationship: 30 },
    choices: [
      {
        id: 'accept',
        label: 'Accept the challenge',
        effects: [
          { counter: 'workouts', by: 3 },
          { stat: 'health', delta: 6 },
          { relationship: 'person', delta: 6 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'I won. {{person}} demanded a rematch and complained the whole time. Worth it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: '{{person}} won by two workouts. I am fitter and slightly bitter.' }],
          },
        ],
      },
      {
        id: 'stakes',
        label: 'Split a personal trainer',
        hint: '{{$100}}',
        effects: [
          { money: -100 },
          { counter: 'workouts', by: 4 },
          { stat: 'health', delta: 8 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 5 }, { log: 'The trainer was terrifying and worth every cent. {{person}} and I both finished the year fitter.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: 2 }, { log: 'The trainer yelled a lot. {{person}} loved it. I did not, but my legs have never been stronger.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Decline politely',
        effects: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: 1 }, { log: 'I said my body was a temple and the temple was closed for renovation. {{person}} went alone.' }],
      },
    ],
  },
  {
    id: 'hl_wellness_scam',
    category: 'health',
    title: 'Cellular reset',
    text: 'An ad keeps following me around: a "cellular reset" program with crystal-infused patches, a detox tea and a founder who looks suspiciously well rested. Results guaranteed.',
    minAge: 18,
    maxAge: 90,
    weight: 1,
    cooldown: 6,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'starter',
        label: 'Buy the starter pack',
        hint: '{{$300}}',
        effects: [
          { money: -300 },
          {
            random: [
              { weight: 7, effects: [{ stat: 'happiness', delta: -3 }, { log: 'The patches did nothing. The tea did something, mostly in the bathroom. {{$300}} of nothing.', kind: 'bad' }] },
              { weight: 3, effects: [{ stat: 'happiness', delta: 3 }, { log: 'Placebo or not, I felt great for a month. Then the feeling, like the patches, wore off.' }] },
            ],
          },
        ],
      },
      {
        id: 'full',
        label: 'Go all in',
        hint: '{{$2500}}',
        effects: [
          { money: -2500 },
          { stat: 'happiness', delta: -5 },
          {
            chance: 0.3,
            then: [{ stat: 'health', delta: -5 }, { log: 'The "proprietary blend" gave me a rash and a lighter bank account. The founder has since vanished.', kind: 'bad' }],
            else: [{ log: 'Nothing happened, at a premium price. I kept the branded water bottle out of spite.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'report',
        label: 'Report the ad',
        effects: [{ karma: 3 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }, { log: 'I lost an evening to the report form and left a devastating review. The ad still follows me.', kind: 'good' }],
      },
      {
        id: 'ignore',
        label: 'Scroll past',
        effects: [{ log: 'I scrolled past. Somewhere, a crystal went unsold.' }],
      },
    ],
  },
  {
    id: 'hl_snoring',
    category: 'health',
    title: 'The snoring',
    text: '{{person}} has recorded me snoring and played it back at breakfast. It sounds like furniture being dragged across a cathedral. {{They}} has not slept properly in weeks.',
    minAge: 20,
    maxAge: 85,
    weight: 1,
    cooldown: 6,
    conditions: [{ hasLover: true }, { inPrison: false }],
    person: { kind: ['spouse', 'lover'] },
    choices: [
      {
        id: 'study',
        label: 'Book a sleep study',
        hint: '{{$600}}',
        effects: [
          { money: -600 },
          {
            random: [
              { weight: 5, effects: [{ stat: 'health', delta: 5 }, { stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 6 }, { love: 6 }, { log: 'Sleep apnea. A mask, a machine, and I wake up rested. {{person}} says I sound like a quiet robot.', kind: 'good' }] },
              { weight: 5, effects: [{ relationship: 'person', delta: 3 }, { love: 2 }, { stat: 'smarts', delta: 1 }, { log: 'Nothing medically wrong, just loud. They suggested a wedge pillow and side sleeping. It half works.' }] },
            ],
          },
        ],
      },
      {
        id: 'strips',
        label: 'Try nasal strips',
        hint: '{{$20}}',
        effects: [
          { money: -20 },
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: 4 }, { love: 3 }, { log: 'The strips helped, a bit. {{person}} got a full night and called it a miracle.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { log: 'The strips did nothing except make me look like I had lost a fight with a bandage.' }],
          },
        ],
      },
      {
        id: 'deny',
        label: 'Deny everything',
        effects: [{ relationship: 'person', delta: -6 }, { love: -6 }, { stat: 'happiness', delta: 1 }, { log: 'I said the recording was faked. {{person}} moved to the couch. I was, honestly, well rested.', kind: 'bad' }],
      },
    ],
  },

  // ------------------------------------------------------------ bugs, bites & weather
  {
    id: 'hl_allergies',
    category: 'health',
    title: 'Sneezing season',
    text: 'Something in the air hates me this year. My eyes stream, my nose runs, and I sneeze in sets of seven like a car that will not start.',
    minAge: 13,
    maxAge: 80,
    weight: 1.5,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'pills',
        label: 'Buy antihistamines',
        hint: '{{$40}}',
        effects: [{ money: -40 }, { stat: 'happiness', delta: 2 }, { log: 'One pill a morning and I was human again, if slightly drowsy.', kind: 'good' }],
      },
      {
        id: 'suffer',
        label: 'Suffer through it',
        effects: [
          { stat: 'happiness', delta: -4 },
          { stat: 'looks', delta: -1 },
          {
            chance: 0.3,
            then: [{ stat: 'health', delta: -3 }, { log: 'It went to my chest and lingered. I sounded like a kettle for a month.', kind: 'bad' }],
            else: [{ log: 'I sneezed my way to autumn. People stopped saying bless you around week three.' }],
          },
        ],
      },
      {
        id: 'test',
        label: 'Get allergy tested',
        hint: '{{$350}}',
        effects: [
          { money: -350 },
          { stat: 'smarts', delta: 1 },
          {
            random: [
              { weight: 5, effects: [{ stat: 'happiness', delta: 2 }, { stat: 'health', delta: 2 }, { log: 'Grass pollen. A plan, a nasal spray, a calendar of dread. Knowledge is power.', kind: 'good' }] },
              { weight: 2, effects: [{ stat: 'health', delta: 2 }, { log: 'Dust mites. I now wash my bedding at temperatures that could sterilize surgical tools.' }] },
              { weight: 2, effects: [{ stat: 'happiness', delta: -2 }, { stat: 'health', delta: 1 }, { log: "Cats. I am allergic to cats. The neighbor's cat, my friend for years, has been slowly killing me." }] },
              { weight: 1, effects: [{ stat: 'happiness', delta: -1 }, { log: 'Nothing. Allergic to nothing. The doctor suggested it might be "the vibe" of the season.' }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'hl_flu_year',
    category: 'health',
    title: 'The flu year',
    text: 'A nasty flu is sweeping through {{city}} this winter. Schools are half empty, the pharmacy has a line out the door, and everyone on the bus sounds like a broken accordion.',
    minAge: 13,
    maxAge: 100,
    weight: 0.7,
    cooldown: 8,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'jab',
        label: 'Get the vaccine',
        hint: '{{$40}}',
        effects: [
          { money: -40 },
          {
            chance: 0.85,
            then: [{ stat: 'health', delta: 1 }, { log: 'A sore arm for a day and then nothing, which was the point.', kind: 'good' }],
            else: [{ illness: 'flu' }, { log: 'I got it anyway, though milder, which is the kind of comfort nobody wants.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'chance',
        label: 'Take my chances',
        effects: [
          {
            chance: 0.5,
            then: [{ illness: 'flu' }, { stat: 'happiness', delta: -3 }, { log: 'It got me. A week in bed with a fever that made the wallpaper move.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 2 }, { log: 'It missed me entirely. I attribute this to garlic and spite.' }],
          },
        ],
      },
      {
        id: 'hide',
        label: 'Hide at home for a month',
        effects: [
          { stat: 'happiness', delta: -5 },
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.1,
            then: [{ illness: 'flu' }, { log: 'A delivery driver sneezed on my package. The flu got in anyway.', kind: 'bad' }],
            else: [{ log: 'I missed everything and everyone and caught nothing. A trade, of sorts.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'hl_heatwave',
    category: 'health',
    title: 'Heat wave',
    text: 'A heat wave has settled over {{city}} like a lid. The asphalt is soft, the pigeons have given up, and my pillow is warm on both sides.',
    minAge: 8,
    maxAge: 90,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'indoors',
        label: 'Hide indoors by the fan',
        effects: [{ stat: 'happiness', delta: -1 }, { stat: 'health', delta: 1 }, { log: 'I parked myself by the fan, closed the curtains and lived like a mushroom for two weeks. Survived.' }],
      },
      {
        id: 'water',
        label: 'Head for the water',
        effects: [
          { stat: 'happiness', delta: 6 },
          {
            chance: 0.4,
            then: [{ stat: 'health', delta: -3 }, { stat: 'looks', delta: -2 }, { log: 'I burned to the color of a traffic cone and peeled for a week. Great day, though.' }],
            else: [{ stat: 'looks', delta: 1 }, { log: 'A whole day in the water with everyone else in {{city}}. The best day of the summer.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'carry_on',
        label: 'Carry on as usual',
        effects: [
          {
            chance: 0.25,
            then: [{ stat: 'health', delta: -8 }, { stat: 'happiness', delta: -3 }, { log: 'Heat exhaustion. I sat down on a curb and a stranger poured water on my head. Humbling.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'I sweated through it and pretended it was fine. It was mostly fine.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'hl_kissing_disease',
    category: 'health',
    title: 'The kissing disease',
    text: '{{person}} has mono and has spent the last two weeks on the couch like a dropped scarf. We have shared drinks, forks and, obviously, kisses.',
    minAge: 14,
    maxAge: 24,
    weight: 1,
    cooldown: 5,
    conditions: [{ hasLover: true }, { inPrison: false }],
    person: { kind: ['lover', 'spouse'] },
    choices: [
      {
        id: 'nurse',
        label: 'Nurse {{them}} anyway',
        effects: [
          { relationship: 'person', delta: 8 },
          { love: 8 },
          { karma: 1 },
          {
            chance: 0.5,
            then: [{ illness: 'mono' }, { stat: 'happiness', delta: -3 }, { log: 'I got it. Six weeks of exhaustion, together, on the same couch. Romantic in a terrible way.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 3 }, { log: 'I brought soup and did not catch it. Iron constitution or dumb luck. {{person}} was grateful.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'distance',
        label: 'Keep my distance',
        effects: [
          { love: -5 },
          { relationship: 'person', delta: -3 },
          {
            chance: 0.15,
            then: [{ illness: 'mono' }, { log: 'I stayed six feet away for a month and got it anyway from a shared water bottle. Pointless.', kind: 'bad' }],
            else: [{ log: '{{person}} called me a coward, weakly, from the couch. I waved from the doorway.' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ roads
  {
    id: 'hl_car_accident',
    category: 'health',
    title: 'The crash',
    text: 'A van ran the red light and hit the side of the car I was in. The airbag went off. Everything smells like burnt powder and I cannot tell yet how badly I am hurt.',
    minAge: 16,
    maxAge: 90,
    weight: 0.8,
    cooldown: 6,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'ambulance',
        label: 'Wait for the ambulance',
        hint: '{{$800}}',
        effects: [
          { asset: 'damage', kind: 'car', amount: 40 },
          { money: -800 },
          {
            chance: 0.02,
            then: [{ death: 'a car crash' }],
            else: [{ injury: 6 }, { stat: 'happiness', delta: -5 }, { log: 'Whiplash, a cracked rib, a night in the hospital. The nurse said I was lucky. I did not feel lucky.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'walk',
        label: 'Climb out and walk it off',
        effects: [
          { asset: 'damage', kind: 'car', amount: 40 },
          {
            chance: 0.04,
            then: [{ death: 'a car crash' }],
            else: [
              {
                random: [
                  { weight: 6, effects: [{ injury: 3 }, { stat: 'happiness', delta: -3 }, { log: 'Bruised, shaken, fine. I walked home and sat in the shower for an hour.' }] },
                  { weight: 4, effects: [{ injury: 14 }, { stat: 'happiness', delta: -6 }, { money: -1500 }, { log: 'I collapsed two blocks later. Internal bruising. "Walk it off," in hindsight, is not medical advice.', kind: 'bad' }] },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'lawyer',
        label: 'Get checked, then call a lawyer',
        hint: '{{$800}} plus fees',
        effects: [
          { asset: 'damage', kind: 'car', amount: 40 },
          { money: -800 },
          {
            chance: 0.02,
            then: [{ death: 'a car crash' }],
            else: [
              { injury: 6 },
              {
                random: [
                  { weight: 5, effects: [{ money: 8000 }, { stat: 'happiness', delta: 2 }, { log: "The van's company settled. {{$8000}} for a sore neck, a year of paperwork and a very stern letter.", kind: 'money' }] },
                  { weight: 5, effects: [{ money: -1500 }, { stat: 'happiness', delta: -6 }, { log: 'Their lawyer argued I "drove into the van." We lost. I paid my lawyer anyway.', kind: 'bad' }] },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'hl_near_miss',
    category: 'health',
    title: 'Near miss',
    text: 'A truck drifted into my lane on the highway and missed me by the width of a side mirror. For three seconds everything was very clear and very quiet.',
    minAge: 16,
    maxAge: 90,
    weight: 1.2,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'breathe',
        label: 'Pull over and breathe',
        effects: [{ stat: 'happiness', delta: -2 }, { stat: 'health', delta: 1 }, { counter: 'meditations' }, { log: 'I sat on the shoulder with my hands shaking and watched the traffic not kill me.' }],
      },
      {
        id: 'chase',
        label: 'Chase them down',
        effects: [
          { karma: -3 },
          {
            random: [
              { weight: 5, effects: [{ stat: 'happiness', delta: 2 }, { log: 'I caught up at a rest stop and shouted. The driver apologized. I felt righteous and ridiculous.' }] },
              { weight: 3, effects: [{ stat: 'happiness', delta: -4 }, { injury: 4 }, { log: 'The driver was not sorry and was also quite large. Brief, undignified scuffle.', kind: 'bad' }] },
              { weight: 2, effects: [{ money: -300 }, { log: 'A police car had seen the whole thing, including my part. Speeding ticket.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'live',
        label: 'Decide to live differently',
        hint: '{{$150}}',
        effects: [{ stat: 'happiness', delta: 5 }, { karma: 1 }, { money: -150 }, { flag: 'hl_second_chance', set: true }, { log: 'I called everyone I love and sent flowers. Three seconds of clarity is more than most get.', kind: 'good' }],
      },
    ],
  },

  // ------------------------------------------------------------ other people
  {
    id: 'hl_give_blood',
    category: 'health',
    title: 'Blood drive',
    text: 'A mobile blood bank parked outside the supermarket. A nurse with a clipboard asked if I had twenty minutes and a working arm.',
    minAge: 17,
    maxAge: 70,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ stat: 'health', gte: 40 }, { inPrison: false }],
    choices: [
      {
        id: 'donate',
        label: 'Roll up a sleeve',
        effects: [
          { karma: 4 },
          { stat: 'happiness', delta: 4 },
          { stat: 'health', delta: -1 },
          {
            chance: 0.15,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'I fainted slightly on the way to the cookies. The nurse said it happens. Still counts.' }],
            else: [{ log: 'A pint out, a cookie in, and a text later saying my blood had gone to a hospital in {{city}}.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'biscuits',
        label: 'Just take the cookies',
        effects: [{ karma: -2 }, { stat: 'happiness', delta: 2 }, { log: 'I ate three cookies, said I would "come back later," and did not. The nurse knew.' }],
      },
      {
        id: 'skip',
        label: 'Keep walking',
        effects: [{ log: 'I kept walking. Needles and I have an understanding, and the understanding is distance.' }],
      },
    ],
  },
  {
    id: 'hl_child_fever',
    category: 'health',
    title: 'Fever in the night',
    text: '{{person}} woke up at two in the morning burning hot and crying. The thermometer says a number I do not like. Every website says something different.',
    minAge: 18,
    maxAge: 60,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['child'], maxAge: 10 },
    choices: [
      {
        id: 'er',
        label: 'Straight to the hospital',
        hint: '{{$500}}',
        effects: [
          { money: -500 },
          { relationship: 'person', delta: 6 },
          { stat: 'happiness', delta: -2 },
          {
            random: [
              { weight: 7, effects: [{ log: 'A virus. Fluids, rest, a sticker for {{person}} and a lecture for me about websites. Home by dawn.' }] },
              { weight: 3, effects: [{ money: -1500 }, { relationship: 'person', delta: 4 }, { log: 'An infection, caught in time. The doctor said coming in was the right call. I barely slept for days.' }] },
            ],
          },
        ],
      },
      {
        id: 'home',
        label: 'Nurse {{them}} at home',
        effects: [
          { relationship: 'person', delta: 4 },
          {
            chance: 0.75,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'Cool washcloths, cuddles and a long night. By morning the fever broke and {{person}} was hungry.', kind: 'good' }],
            else: [{ money: -1200 }, { stat: 'happiness', delta: -6 }, { relationship: 'person', delta: -2 }, { log: 'It got worse. We ended up at the hospital anyway, two days later and much more frightened.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'call',
        label: 'Call {{mother}} for advice',
        conditions: [{ hasPerson: ['mother'] }],
        effects: [
          { relationship: 'mother', delta: 3 },
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.8,
            then: [{ relationship: 'person', delta: 3 }, { log: '{{mother}} talked me through it like she had done it a hundred times. {{person}} was fine by lunch.', kind: 'good' }],
            else: [{ money: -500 }, { log: 'Even {{mother}} said to go in. We went. A virus, fluids, home by dawn.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'hl_relative_diagnosis',
    category: 'health',
    title: 'The phone call',
    text: '{{person}} called with the voice people use when they have practiced the sentence. {{They}} has been diagnosed with something serious. The doctors are "optimistic," which is a word, apparently.',
    minAge: 18,
    maxAge: 90,
    weight: 0.8,
    cooldown: 8,
    conditions: [{ inPrison: false }],
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather', 'sibling'], minAge: 30 },
    choices: [
      {
        id: 'visit',
        label: 'Drop everything and go',
        effects: [
          { relationship: 'person', delta: 10 },
          { stat: 'happiness', delta: -4 },
          { money: -200 },
          { karma: 2 },
          { log: 'I went. We sat in waiting rooms and talked about nothing, which was everything.' },
          { queue: 'hl_relative_prognosis' },
        ],
      },
      {
        id: 'calls',
        label: 'Call every week',
        effects: [
          { relationship: 'person', delta: 5 },
          { stat: 'happiness', delta: -3 },
          { log: 'I called every Sunday. {{They}} said I did not have to. I called anyway.' },
          { queue: 'hl_relative_prognosis' },
        ],
      },
      {
        id: 'avoid',
        label: 'Bury myself in work',
        effects: [
          { relationship: 'person', delta: -8 },
          { stat: 'happiness', delta: -5 },
          { karma: -2 },
          { log: 'I could not face it, so I faced a spreadsheet instead. {{person}} noticed.', kind: 'bad' },
          { queue: 'hl_relative_prognosis' },
        ],
      },
    ],
  },
  {
    id: 'hl_relative_prognosis',
    category: 'health',
    title: 'The prognosis',
    text: 'A year of appointments, scans and careful phrasing. Today the doctors finally said something definite about {{person}}.',
    minAge: 18,
    maxAge: 95,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather', 'sibling'] },
    choices: [
      {
        id: 'together',
        label: 'Go to the appointment with {{them}}',
        effects: [
          { relationship: 'person', delta: 4 },
          { money: -100 },
          {
            random: [
              { weight: 6, effects: [{ stat: 'happiness', delta: 8 }, { relationship: 'person', delta: 4 }, { log: '{{person}} is in the clear. {{They}} rang the hospital bell and cried, and so did I.', kind: 'good' }] },
              { weight: 3, effects: [{ stat: 'happiness', delta: -3 }, { log: 'It is chronic but managed. {{person}} has pills, a plan and a dark sense of humor about both.' }] },
              { weight: 1.5, effects: [{ stat: 'happiness', delta: -15 }, { log: 'The treatment stopped working. {{person}} died in spring, with everyone {{they}} loved in the room.', kind: 'bad' }, { personDies: true, cause: 'a long illness' }] },
            ],
          },
        ],
      },
      {
        id: 'wait',
        label: 'Wait for the call',
        effects: [
          {
            random: [
              { weight: 6, effects: [{ stat: 'happiness', delta: 6 }, { log: '{{person}} is in the clear. {{They}} told me on the phone, then hung up to tell the neighbors.', kind: 'good' }] },
              { weight: 3, effects: [{ stat: 'happiness', delta: -3 }, { log: 'It is chronic but managed. {{person}} sent me a photo of the pill organizer, labeled like a trophy.' }] },
              { weight: 1.5, effects: [{ stat: 'happiness', delta: -15 }, { relationship: 'person', delta: -3 }, { log: 'The treatment stopped working. {{person}} died in spring. I was not in the room. I think about that.', kind: 'bad' }, { personDies: true, cause: 'a long illness' }] },
            ],
          },
        ],
      },
    ],
  },
];

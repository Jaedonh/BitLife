import type { EventDef } from '@/engine/events/schema';

/**
 * All ages, non-denominational: birthdays, new-year resolutions, winter
 * gatherings with the whole family, gifts you hate, hosting dinner for twelve,
 * secrets at the table, costume parties, fireworks, charity drives, storms on
 * the road home, toasts that go wrong and the quiet holiday after a loss.
 * Follow-ups (followUpOnly) are queued by the events that set them up.
 */
export const HOLIDAYS_AND_TRADITIONS_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ birthdays
  {
    id: 'hd_birthday_candles',
    category: 'holiday',
    title: 'Birthday candles',
    text: 'The cake came out with {{age}} candles on it and everyone started singing slightly out of tune. I was told to close my eyes and make a wish before the wax reached the frosting.',
    minAge: 4,
    maxAge: 11,
    weight: 2,
    cooldown: 3,
    choices: [
      {
        id: 'pony',
        label: 'Wish for a pony',
        effects: [
          { stat: 'happiness', delta: 3 },
          { log: 'I wished for a pony. No pony came. I got a bicycle the next year, which is at least pony-shaped.' },
          { chance: 0.25, then: [{ money: 20 }, { log: 'An aunt slipped me {{$20}} and said not to spend it all on candy. I spent it all on candy.', kind: 'money' }] },
        ],
      },
      {
        id: 'family',
        label: 'Wish everyone is happy',
        effects: [
          { karma: 2 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'mother', delta: 2 },
          { relationship: 'father', delta: 2 },
          { relationship: 'sibling', delta: 2 },
          { log: 'I wished for everyone to be happy and kept it secret, as is the rule. Somebody got teary anyway.', kind: 'good' },
        ],
      },
      {
        id: 'nowish',
        label: 'Blow them out, no wish',
        effects: [
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: 1 },
          { log: 'I declared wishes fake and blew them out in one go. Applause for the lungs, not the lecture.' },
        ],
      },
      {
        id: 'frosting',
        label: 'Eat the frosting first',
        effects: [
          { stat: 'happiness', delta: 4 },
          { stat: 'health', delta: -1 },
          { relationship: 'mother', delta: -2 },
          { log: 'Face-first into the frosting before the song ended. Photos exist. They will be shown at my wedding.' },
        ],
      },
    ],
  },
  {
    id: 'hd_birthday_plans',
    category: 'holiday',
    title: 'Another year older',
    text: 'My birthday is this week and people keep asking what I am doing for it. I have not decided whether to make a thing of it or let it slip quietly past.',
    minAge: 16,
    maxAge: 90,
    weight: 2,
    cooldown: 2,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'party',
        label: 'Throw a big party',
        hint: '{{$250}}',
        conditions: [{ money: { gte: 250 } }],
        effects: [
          { money: -250 },
          {
            random: [
              {
                weight: 70,
                effects: [
                  { stat: 'happiness', delta: 8 },
                  { relationship: 'friend', delta: 3 },
                  { relationship: 'bestFriend', delta: 3 },
                  { log: 'Loud party, lopsided cake, three near-strangers calling me their favorite person. Worth every cent.', kind: 'good' },
                ],
              },
              {
                weight: 30,
                effects: [
                  { stat: 'happiness', delta: 2 },
                  { log: 'Half the guests canceled and the rest left early. A week of leftover cake was not the worst part.', kind: 'bad' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'dinner',
        label: 'Quiet dinner with family',
        hint: '{{$60}}',
        conditions: [{ money: { gte: 60 } }],
        effects: [
          { money: -60 },
          { stat: 'happiness', delta: 4 },
          { relationship: 'mother', delta: 3 },
          { relationship: 'father', delta: 3 },
          { relationship: 'sibling', delta: 2 },
          { relationship: 'spouse', delta: 3 },
          { log: 'A quiet dinner, the good plates, nobody on their phones for a full hour. Low-key, high quality.', kind: 'good' },
        ],
      },
      {
        id: 'treat',
        label: 'Treat yourself to something',
        hint: '{{$120}}',
        conditions: [{ money: { gte: 120 } }],
        effects: [
          { money: -120 },
          { stat: 'happiness', delta: 5 },
          { log: 'I bought myself the thing I had been eyeing for months, then wrapped it. Sad, or very efficient.', kind: 'money' },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore it entirely',
        effects: [
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: -1 },
          { log: 'I said I was busy and spent the evening with a book. Two people called and sang at me anyway.' },
        ],
      },
    ],
  },
  {
    id: 'hd_surprise_party',
    category: 'holiday',
    title: 'Surprise party',
    text: 'I opened the door to a dark room, then thirty people shouted at me at once. {{person}} had been planning a surprise party for weeks and somehow I had suspected nothing.',
    minAge: 10,
    maxAge: 85,
    weight: 1,
    cooldown: 8,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend', 'sibling', 'spouse', 'lover'], minRelationship: 40 },
    choices: [
      {
        id: 'tears',
        label: 'Burst into happy tears',
        effects: [
          { stat: 'happiness', delta: 8 },
          { relationship: 'person', delta: 8 },
          { log: '{{person}} got the hug of {{their}} life. I cried, laughed, cried again, then found the snacks.', kind: 'good' },
        ],
      },
      {
        id: 'cool',
        label: 'Play it cool',
        effects: [
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 3 },
          { log: 'I nodded like a person who gets surprise parties all the time. Inside I was a parade.' },
        ],
      },
      {
        id: 'speech',
        label: 'Make a speech',
        effects: [
          {
            random: [
              { weight: 60, effects: [{ stat: 'happiness', delta: 6 }, { relationship: 'person', delta: 5 }, { log: 'My speech for {{person}} ran long but landed. Someone filmed it. I have watched it eleven times.', kind: 'good' }] },
              { weight: 40, effects: [{ stat: 'happiness', delta: 1 }, { log: 'My speech wandered through three childhood stories before someone cut the cake to save us all.' }] },
            ],
          },
        ],
      },
      {
        id: 'knew',
        label: 'Admit you knew',
        effects: [
          { stat: 'happiness', delta: 2 },
          { karma: -1 },
          { relationship: 'person', delta: -5 },
          { log: "I admitted I had known for a week. {{person}}'s face fell a little. I should have lied.", kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'hd_forgotten_birthday',
    category: 'holiday',
    title: 'Nobody remembered',
    text: 'My birthday came and went. No calls, no cake, not even an automated message from the dentist. By the evening I had checked my phone forty times and it had checked back zero.',
    minAge: 18,
    maxAge: 90,
    weight: 0.8,
    cooldown: 6,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'sulk',
        label: 'Say nothing and sulk',
        effects: [
          { stat: 'happiness', delta: -6 },
          { log: 'I sulked in silence. When someone finally remembered, the apology was worse than the forgetting.', kind: 'bad' },
        ],
      },
      {
        id: 'hints',
        label: 'Drop heavy hints',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { relationship: 'friend', delta: 2 }, { relationship: 'sibling', delta: 2 }, { log: 'I posted "another trip around the sun" with a photo and the messages poured in, late but sincere.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'My hint got two thumbs-up reactions and nothing else. Those people are dead to me until spring.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'cake',
        label: 'Buy your own cake',
        hint: '{{$25}}',
        conditions: [{ money: { gte: 25 } }],
        effects: [
          { money: -25 },
          { stat: 'happiness', delta: 4 },
          { stat: 'health', delta: -1 },
          { log: 'I bought a cake, lit one candle and sang to myself in the kitchen. Oddly fine. Nobody gets a slice.' },
        ],
      },
      {
        id: 'call',
        label: 'Call someone and tell them',
        effects: [
          { stat: 'happiness', delta: 2 },
          { karma: 1 },
          { relationship: 'friend', delta: 3 },
          { relationship: 'bestFriend', delta: 3 },
          { relationship: 'mother', delta: 2 },
          { log: 'I called people and just said it. Awkward for a second, then guilty laughter and a late dinner.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'hd_fortieth',
    category: 'holiday',
    title: 'The big four-oh',
    text: 'I am forty today. Someone has already made a joke about it, and a cake arrived with one large candle instead of the honest number. I have decisions to make.',
    minAge: 40,
    maxAge: 40,
    weight: 3,
    once: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'party',
        label: 'Throw a proper party',
        hint: '{{$500}}',
        conditions: [{ money: { gte: 500 } }],
        effects: [
          { money: -500 },
          { stat: 'happiness', delta: 8 },
          { relationship: 'friend', delta: 4 },
          { relationship: 'bestFriend', delta: 4 },
          { relationship: 'sibling', delta: 3 },
          { relationship: 'spouse', delta: 3 },
          { log: 'A proper party: old friends, new friends, a twenty-year-old playlist and a clear-headed morning.', kind: 'good' },
        ],
      },
      {
        id: 'trip',
        label: 'Go somewhere alone',
        hint: '{{$800}}',
        conditions: [{ money: { gte: 800 } }],
        effects: [
          { money: -800 },
          { stat: 'happiness', delta: 6 },
          { stat: 'health', delta: 2 },
          { stat: 'smarts', delta: 1 },
          { counter: 'vacations' },
          { log: 'I took myself somewhere quiet with a view and thought about my life. The nice parts, mostly.', kind: 'good' },
        ],
      },
      {
        id: 'deny',
        label: 'Insist you are thirty-nine',
        effects: [
          { stat: 'happiness', delta: 2 },
          { karma: -1 },
          { log: 'I told everyone it was my second thirty-ninth. Nobody argued. It is my birthday, after all.' },
        ],
      },
      {
        id: 'crisis',
        label: 'Have a small crisis',
        effects: [
          { stat: 'happiness', delta: -4 },
          { stat: 'smarts', delta: 3 },
          {
            chance: 0.3,
            then: [{ stat: 'health', delta: 4 }, { log: 'The crisis became a running habit and a new haircut. Nobody asked for either. Both are going well.', kind: 'good' }],
            else: [{ log: 'I listed everything I had not done yet. It was long. It went in a drawer, where lists go to rest.' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ new year
  {
    id: 'hd_resolution',
    category: 'holiday',
    title: 'New year, new me',
    text: 'It is the first day of {{year}} and I am making a resolution, which I will either keep heroically or never mention again. Everyone around me is doing the same thing with the same confidence.',
    minAge: 14,
    maxAge: 90,
    weight: 2,
    cooldown: 2,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'fit',
        label: 'Get in shape',
        effects: [
          { flag: 'hd_resolution', set: 'fit' },
          { stat: 'health', delta: 2 },
          { log: 'I resolved to get fit. I bought sneakers. The sneakers are, so far, very clean.' },
          { queue: 'hd_resolution_spring' },
        ],
      },
      {
        id: 'read',
        label: 'Read more books',
        effects: [
          { flag: 'hd_resolution', set: 'read' },
          { stat: 'smarts', delta: 1 },
          { log: 'I resolved to read a book a month and started one that night. Page four was excellent.' },
          { queue: 'hd_resolution_spring' },
        ],
      },
      {
        id: 'save',
        label: 'Save some money',
        effects: [
          { flag: 'hd_resolution', set: 'save' },
          { stat: 'happiness', delta: 1 },
          { log: 'I resolved to save money and put a jar on the shelf with a label on it. The label was the easy part.' },
          { queue: 'hd_resolution_spring' },
        ],
      },
      {
        id: 'none',
        label: 'Refuse to resolve anything',
        effects: [
          { stat: 'happiness', delta: 3 },
          { log: 'I resolved to make no resolutions and kept it perfectly all year. Flawless record.' },
        ],
      },
    ],
  },
  {
    id: 'hd_resolution_spring',
    category: 'holiday',
    title: 'Spring check-in',
    text: 'Spring arrived and so did the moment every resolution dreads: the part where it stops being new. Nobody was checking on me. Only I would know.',
    minAge: 14,
    maxAge: 90,
    weight: 1,
    followUpOnly: true,
    choices: [
      {
        id: 'train',
        label: 'Keep training',
        conditions: [{ flag: 'hd_resolution', eq: 'fit' }],
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'health', delta: 6 }, { stat: 'happiness', delta: 3 }, { stat: 'looks', delta: 1 }, { counter: 'workouts', by: 3 }, { log: 'I kept going past the part where it stopped being fun and into the part where it became a habit.', kind: 'good' }],
            else: [{ stat: 'health', delta: 1 }, { log: 'I lasted until March, further than most, and then the weather happened. The sneakers remain clean.' }],
          },
        ],
      },
      {
        id: 'read',
        label: 'Keep reading',
        conditions: [{ flag: 'hd_resolution', eq: 'read' }],
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'smarts', delta: 4 }, { stat: 'happiness', delta: 2 }, { counter: 'libraryVisits', by: 2 }, { log: 'Seven books by spring. I say "as I was reading recently" a lot now. Nobody has stopped me yet.', kind: 'good' }],
            else: [{ stat: 'smarts', delta: 1 }, { log: 'Two books, one of them twice because I forgot I had read it. The pile by the bed is now furniture.' }],
          },
        ],
      },
      {
        id: 'save',
        label: 'Keep saving',
        conditions: [{ flag: 'hd_resolution', eq: 'save' }],
        effects: [
          {
            chance: 0.55,
            then: [{ money: 300 }, { stat: 'happiness', delta: 2 }, { log: 'The jar filled, then a second jar. I counted it out on the table like a cartoon villain: {{$300}}.', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'The jar did well until the first emergency, which was a very good pizza. The label is still up.' }],
          },
        ],
      },
      {
        id: 'quit',
        label: 'Quietly give up',
        effects: [
          { stat: 'happiness', delta: 1 },
          { log: 'I gave up quietly, the traditional ending. There is always next year, and the year after that.' },
        ],
      },
    ],
  },
  {
    id: 'hd_midnight_countdown',
    category: 'holiday',
    title: 'Ten, nine, eight',
    text: "New Year's Eve. The countdown is starting, the room is loud, and I have about ten seconds to decide what kind of year this is going to be.",
    minAge: 18,
    maxAge: 90,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'partner',
        label: 'Find your partner at midnight',
        conditions: [{ hasLover: true }],
        effects: [
          { stat: 'happiness', delta: 5 },
          { relationship: 'lover', delta: 4 },
          { relationship: 'spouse', delta: 4 },
          { log: 'We found each other in the crush just as the clock hit zero. Cheesy, loud, perfect.', kind: 'good' },
        ],
      },
      {
        id: 'street',
        label: 'Go to the big street party',
        hint: '{{$40}}',
        conditions: [{ money: { gte: 40 } }],
        effects: [
          { money: -40 },
          {
            random: [
              {
                weight: 70,
                effects: [
                  { stat: 'happiness', delta: 6 },
                  { log: 'Fireworks over {{city}}, strangers hugging strangers, a brass band that never stopped. I was hoarse.', kind: 'good' },
                  { chance: 0.2, then: [{ newPerson: { kind: 'friend', relationship: 50, log: 'I counted down beside a stranger called {{person}} and we were friends by one in the morning.' } }] },
                ],
              },
              { weight: 30, effects: [{ stat: 'happiness', delta: -4 }, { stat: 'health', delta: -2 }, { log: 'A full drink went down my back at 11:58. I rang in the new year under a hand dryer.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'home',
        label: 'Stay in and sleep early',
        effects: [
          { stat: 'happiness', delta: 2 },
          { stat: 'health', delta: 2 },
          { log: 'Asleep before the fireworks. I woke to a new year and no headache, which is a kind of victory.' },
        ],
      },
      {
        id: 'drink',
        label: 'Toast it, repeatedly',
        effects: [
          { addiction: 'alcohol', delta: 3 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.3,
            then: [{ stat: 'health', delta: -3 }, { stat: 'happiness', delta: -4 }, { log: 'I rang in the year loudly and met its first morning on the couch, making promises to the ceiling.', kind: 'bad' }],
            else: [{ log: 'Blurry from the third toast onward. Very happy, very loud, and a headache that lasted until lunch.' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ the family gathering
  {
    id: 'hd_winter_gathering',
    category: 'holiday',
    title: 'The whole family',
    text: 'The whole family squeezed into one house for the winter holidays: too many coats, one bathroom, and {{person}} in charge of the kitchen, shouting cheerful instructions at anyone who walked past.',
    minAge: 5,
    maxAge: 90,
    weight: 2.5,
    cooldown: 2,
    conditions: [{ inPrison: false }],
    person: { kind: ['mother', 'father', 'sibling', 'spouse', 'child'], minAge: 18 },
    choices: [
      {
        id: 'help',
        label: 'Help {{person}} cook',
        effects: [
          { relationship: 'person', delta: 6 },
          { stat: 'happiness', delta: 3 },
          { stat: 'smarts', delta: 1 },
          { log: 'I stirred and fetched on command. {{person}} called me the only useful one, loudly, to everyone.', kind: 'good' },
        ],
      },
      {
        id: 'games',
        label: 'Run the games',
        effects: [
          { stat: 'happiness', delta: 5 },
          { relationship: 'sibling', delta: 2 },
          { relationship: 'child', delta: 3 },
          {
            chance: 0.3,
            then: [{ relationship: 'sibling', delta: -4 }, { stat: 'happiness', delta: -2 }, { log: 'The board game ended in a shouting match over the rules that is still, technically, ongoing.', kind: 'bad' }],
            else: [{ log: 'I ran the games like a tiny benevolent dictator and everyone loved it, even the losers.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'phone',
        label: 'Hide on the couch',
        effects: [
          { stat: 'happiness', delta: 1 },
          { relationship: 'person', delta: -4 },
          { log: 'I spent most of the day on the couch with a screen. {{person}} noticed. {{They}} always notices.' },
        ],
      },
      {
        id: 'nap',
        label: 'Sneak off for a nap',
        effects: [
          { stat: 'health', delta: 3 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -2 },
          { log: 'I slept through the dishes, which was the plan, and the family photo, which was not.' },
        ],
      },
    ],
  },
  {
    id: 'hd_terrible_gift',
    category: 'holiday',
    title: 'An unfortunate gift',
    text: '{{person}} handed me a wrapped box with enormous pride. Inside was the single ugliest object I have ever owned. {{They}} waited, beaming, for my reaction.',
    minAge: 16,
    maxAge: 90,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'spouse', 'lover', 'friend', 'bestFriend'] },
    choices: [
      {
        id: 'fake',
        label: 'Fake delight',
        effects: [
          { relationship: 'person', delta: 5 },
          { karma: 1 },
          { stat: 'happiness', delta: -1 },
          { log: 'I said I loved it. Now it must be on display whenever {{they}} is around. The price of kindness.' },
        ],
      },
      {
        id: 'honest',
        label: 'Be gently honest',
        effects: [
          {
            random: [
              { weight: 50, effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: '{{person}} laughed and admitted {{they}} had panicked at the store. We swapped it the next day.', kind: 'good' }] },
              { weight: 50, effects: [{ relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -3 }, { log: '{{person}} went quiet. Honest, yes. Worth it, debatable.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'regift',
        label: 'Secretly re-gift it later',
        effects: [
          { karma: -3 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.3,
            then: [{ relationship: 'person', delta: -12 }, { log: 'The re-gift found its way back to {{person}} within a year. {{They}} has not forgotten.', kind: 'bad' }],
            else: [{ log: 'The thing has moved on to a new home. I feel lighter. Mostly.' }],
          },
        ],
      },
      {
        id: 'sell',
        label: 'Sell it online',
        effects: [
          { money: 40 },
          { karma: -2 },
          {
            chance: 0.25,
            then: [{ relationship: 'person', delta: -6 }, { log: '{{person}} found the listing. I claimed it was a duplicate. {{They}} did not believe me.', kind: 'bad' }],
            else: [{ log: 'Somebody paid {{$40}} for it, which proves taste is a spectrum.', kind: 'money' }],
          },
        ],
      },
    ],
  },
  {
    id: 'hd_host_dinner',
    category: 'holiday',
    title: 'Dinner for twelve',
    text: 'Somehow I agreed to host the holiday dinner this year. Twelve guests, two dietary restrictions I only learned about today, and an oven I have never fully trusted.',
    minAge: 22,
    maxAge: 85,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ inPrison: false }, { money: { gte: 400 } }],
    choices: [
      {
        id: 'full',
        label: 'Go all out',
        hint: '{{$400}}',
        effects: [
          { money: -400 },
          {
            random: [
              {
                weight: 65,
                effects: [
                  { stat: 'happiness', delta: 8 },
                  { karma: 1 },
                  { relationship: 'mother', delta: 3 },
                  { relationship: 'father', delta: 3 },
                  { relationship: 'sibling', delta: 3 },
                  { relationship: 'spouse', delta: 3 },
                  { relationship: 'friend', delta: 2 },
                  { log: 'Three courses, twelve elbows, and total silence when the main course came out. The good kind.', kind: 'good' },
                ],
              },
              { weight: 25, effects: [{ stat: 'happiness', delta: 3 }, { log: 'The oven died at four. We ate at nine, mostly sides. I will never host again, until next year.' }] },
              { weight: 10, effects: [{ illness: 'food_poisoning' }, { stat: 'happiness', delta: -5 }, { log: 'The stuffing was off. Half the table was sick by midnight, me included. Nobody has said anything.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'potluck',
        label: 'Make it a potluck',
        hint: '{{$80}}',
        effects: [
          { money: -80 },
          { stat: 'happiness', delta: 4 },
          { relationship: 'friend', delta: 2 },
          { relationship: 'sibling', delta: 2 },
          { log: 'Everyone brought a dish. We ended up with four desserts and no vegetables, and nobody complained.', kind: 'good' },
        ],
      },
      {
        id: 'dessert',
        label: 'Downgrade to dessert only',
        hint: '{{$120}}',
        effects: [
          { money: -120 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'mother', delta: -1 },
          { relationship: 'sibling', delta: -1 },
          { log: 'I quietly downgraded the invite to pie and coffee. A few grumbled, then saw the pie and forgave me.' },
        ],
      },
      {
        id: 'cancel',
        label: 'Cancel at the last minute',
        effects: [
          { karma: -4 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'mother', delta: -4 },
          { relationship: 'father', delta: -4 },
          { relationship: 'sibling', delta: -4 },
          { relationship: 'friend', delta: -3 },
          { log: 'I texted everyone a vague excuse and spent the day in silence. Peaceful. The group chat was not.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'hd_family_secret',
    category: 'holiday',
    title: 'The table goes quiet',
    text: 'Halfway through dessert {{person}} said one sentence that made the whole table go silent. A family secret, out in the open, somewhere between the pie and the coffee.',
    minAge: 12,
    maxAge: 85,
    weight: 0.8,
    once: true,
    conditions: [{ inPrison: false }],
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather', 'sibling'], minAge: 30 },
    choices: [
      {
        id: 'press',
        label: 'Demand the whole story',
        effects: [
          {
            random: [
              {
                weight: 40,
                effects: [
                  { stat: 'happiness', delta: -2 },
                  { stat: 'smarts', delta: 1 },
                  { log: 'There is a half-sibling. A real one, with a name, two towns over. {{person}} had known for years.', kind: 'milestone' },
                  { newPerson: { kind: 'sibling', relationship: 25, log: 'My new half-sibling is called {{person}}. We have the same nose and, so far, nothing else.' } },
                ],
              },
              { weight: 35, effects: [{ stat: 'happiness', delta: -3 }, { stat: 'smarts', delta: 2 }, { log: 'The business went bust twice. The "inheritance" was a comforting fiction. I felt oddly relieved.' }] },
              { weight: 25, effects: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: 1 }, { log: '{{person}} was once engaged to someone else and called it off days before the wedding. Long silence.' }] },
            ],
          },
        ],
      },
      {
        id: 'subject',
        label: 'Change the subject fast',
        effects: [
          { stat: 'happiness', delta: 1 },
          { relationship: 'person', delta: 3 },
          { log: 'I asked loudly who wanted more pie. Everyone did. The secret went back in its box, for now.' },
        ],
      },
      {
        id: 'laugh',
        label: 'Laugh it off',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'My laugh broke the tension. Everyone joined in, even {{person}}. Dinner went on with a new story.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -6 }, { stat: 'happiness', delta: -2 }, { log: 'Nobody else laughed. {{person}} left the table. I had misjudged the room by a mile.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'notes',
        label: 'Quietly take notes',
        effects: [
          { stat: 'smarts', delta: 3 },
          { karma: -2 },
          { log: 'I wrote it all down later for my future memoir. Ethically gray, journalistically sound.' },
        ],
      },
    ],
  },
  {
    id: 'hd_empty_chair',
    category: 'holiday',
    title: 'The empty chair',
    text: 'Another family holiday without {{person}}, and this year the loss feels new again. The table is set, the food is the same, and nobody has touched {{their}} chair. Everyone is being carefully, exhaustingly cheerful.',
    minAge: 8,
    maxAge: 90,
    weight: 1.5,
    once: true,
    conditions: [{ inPrison: false }],
    person: { kind: ['mother', 'father', 'sibling', 'spouse', 'child', 'bestFriend'], alive: false },
    choices: [
      {
        id: 'place',
        label: 'Set a place for {{them}}',
        effects: [
          { stat: 'happiness', delta: 3 },
          { relationship: 'mother', delta: 3 },
          { relationship: 'father', delta: 3 },
          { relationship: 'sibling', delta: 3 },
          { relationship: 'spouse', delta: 3 },
          { relationship: 'child', delta: 3 },
          { log: "We set {{person}}'s place, {{their}} favorite dish in front of it. Someone cried, someone laughed.", kind: 'good' },
        ],
      },
      {
        id: 'story',
        label: 'Tell {{their}} best story',
        effects: [
          { stat: 'happiness', delta: 4 },
          { karma: 1 },
          { relationship: 'mother', delta: 2 },
          { relationship: 'father', delta: 2 },
          { relationship: 'sibling', delta: 2 },
          { log: 'I told the ladder story. The room woke up for a minute. {{person}} would have corrected every word.', kind: 'good' },
        ],
      },
      {
        id: 'through',
        label: 'Just get through it',
        effects: [
          { stat: 'happiness', delta: -2 },
          { stat: 'health', delta: 1 },
          { log: 'I ate, nodded, cleared plates and went to bed early. Some years you just get through. That counts.' },
        ],
      },
      {
        id: 'skip',
        label: 'Skip it, stay in my room',
        effects: [
          { stat: 'happiness', delta: -5 },
          { relationship: 'mother', delta: -3 },
          { relationship: 'father', delta: -3 },
          { relationship: 'sibling', delta: -3 },
          { relationship: 'spouse', delta: -3 },
          { log: 'I stayed in my room with the lights off. I am not sure that helped anyone, including me.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'hd_estranged_sibling',
    category: 'holiday',
    title: 'An old face',
    text: '{{person}} turned up at the holiday gathering. We have not properly spoken in years, and now we are sharing a couch, a bowl of nuts and an enormous silence.',
    minAge: 18,
    maxAge: 90,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    person: { kind: ['sibling'], maxRelationship: 30, minAge: 16 },
    choices: [
      {
        id: 'hug',
        label: 'Hug it out',
        effects: [
          { relationship: 'person', delta: 15 },
          { stat: 'happiness', delta: 6 },
          { karma: 2 },
          { log: "I went first. The hug was stiff for a second and then it wasn't. We talked until the house slept.", kind: 'good' },
        ],
      },
      {
        id: 'polite',
        label: 'Keep it polite',
        effects: [
          { relationship: 'person', delta: 4 },
          { stat: 'happiness', delta: 1 },
          { log: 'We talked about the weather and the roads and the food. Not a reunion, but not a fight. A start.' },
        ],
      },
      {
        id: 'fight',
        label: 'Bring up the old fight',
        effects: [
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: 20 }, { stat: 'happiness', delta: 5 }, { log: 'We finally said it all. Tears, a raised voice, then a quiet apology from both sides. Weight lifted.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -5 }, { log: 'It went exactly like last time. {{person}} left before dessert. Same wound, fresh salt.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'leave',
        label: 'Make an excuse and leave',
        effects: [
          { relationship: 'person', delta: -3 },
          { relationship: 'mother', delta: -2 },
          { relationship: 'father', delta: -2 },
          { stat: 'happiness', delta: -2 },
          { log: 'I left early. Easier than talking. The ride home was very quiet.' },
        ],
      },
    ],
  },
  {
    id: 'hd_kids_tradition',
    category: 'holiday',
    title: 'Starting a tradition',
    text: '{{person}} asked why our family doesn\'t have a holiday "thing" like {{their}} friends do. I had no answer, so I decided we would have one, starting this year.',
    minAge: 20,
    maxAge: 60,
    weight: 1.5,
    once: true,
    conditions: [{ hasChildren: true }, { inPrison: false }],
    person: { kind: ['child'], minAge: 5, maxAge: 12 },
    choices: [
      {
        id: 'pancakes',
        label: 'Pancake breakfast in pajamas',
        effects: [
          { flag: 'hd_tradition', set: 'pancakes' },
          { relationship: 'person', delta: 6 },
          { stat: 'happiness', delta: 4 },
          { log: 'The tradition is decided: pancakes, pajamas, no exceptions. {{person}} has already drawn a poster.', kind: 'milestone' },
          { queue: 'hd_tradition_first_run' },
        ],
      },
      {
        id: 'campout',
        label: 'Living-room campout',
        effects: [
          { flag: 'hd_tradition', set: 'campout' },
          { relationship: 'person', delta: 6 },
          { stat: 'happiness', delta: 4 },
          { log: 'The tradition is decided: a blanket fort in the living room and stories until someone falls asleep.', kind: 'milestone' },
          { queue: 'hd_tradition_first_run' },
        ],
      },
      {
        id: 'letters',
        label: 'Write letters to open at 18',
        effects: [
          { flag: 'hd_tradition', set: 'letters' },
          { relationship: 'person', delta: 5 },
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 3 },
          { log: 'The tradition: a sealed letter every year, to be opened at eighteen. {{person}} wants to peek. No.', kind: 'milestone' },
          { queue: 'hd_tradition_first_run' },
        ],
      },
    ],
  },
  {
    id: 'hd_tradition_first_run',
    category: 'holiday',
    title: 'The first run',
    text: 'The first run of our brand-new family tradition arrived. {{person}} had been counting down for days. The pressure to get it right was absurd for something I invented on a whim.',
    minAge: 20,
    maxAge: 60,
    weight: 1,
    followUpOnly: true,
    person: { kind: ['child'] },
    choices: [
      {
        id: 'flip',
        label: 'Flip the pancakes',
        conditions: [{ flag: 'hd_tradition', eq: 'pancakes' }],
        effects: [
          {
            random: [
              { weight: 70, effects: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 5 }, { log: 'Pancakes in pajamas, flour everywhere, {{person}} flipping one at the ceiling. A tradition is born.', kind: 'good' }] },
              { weight: 30, effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 3 }, { log: 'The first batch burned and the smoke alarm joined in. {{person}} called it the best breakfast ever.' }] },
            ],
          },
        ],
      },
      {
        id: 'fort',
        label: 'Build the fort',
        conditions: [{ flag: 'hd_tradition', eq: 'campout' }],
        effects: [
          {
            random: [
              { weight: 70, effects: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 5 }, { log: 'We built a blanket fort around the couch and told stories until {{person}} fell asleep mid-sentence.', kind: 'good' }] },
              { weight: 30, effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 3 }, { stat: 'health', delta: -1 }, { log: 'The fort collapsed at midnight. {{person}} found this hilarious. I did not, until the morning.' }] },
            ],
          },
        ],
      },
      {
        id: 'letter',
        label: 'Write the first letter',
        conditions: [{ flag: 'hd_tradition', eq: 'letters' }],
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 4 },
          { log: 'I wrote {{person}} a letter {{they}} cannot read for years, sealed it and felt old in the best way.', kind: 'good' },
        ],
      },
      {
        id: 'lowkey',
        label: 'Keep it low-key',
        effects: [
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: 2 },
          { log: 'We kept the first one small and quiet. {{person}} seemed to think that was the whole point.' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ parties and spectacles
  {
    id: 'hd_costume_party',
    category: 'holiday',
    title: 'Costume party',
    text: 'There is a costume party this weekend and the invitation says costumes are mandatory. I have no costume, limited time and strong opinions about looking silly in public.',
    minAge: 8,
    maxAge: 70,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'homemade',
        label: 'Build one from scratch',
        effects: [
          { stat: 'smarts', delta: 2 },
          {
            random: [
              { weight: 55, effects: [{ stat: 'happiness', delta: 6 }, { log: 'My cardboard robot costume won the contest. Full suit, light-up eyes, could not sit down all night.', kind: 'good' }] },
              { weight: 45, effects: [{ stat: 'happiness', delta: 2 }, { log: 'People called my costume "ambitious." I went as a concept. Several asked what it was. So did I.' }] },
            ],
          },
        ],
      },
      {
        id: 'rent',
        label: 'Rent a proper one',
        hint: '{{$60}}',
        conditions: [{ money: { gte: 60 } }],
        effects: [
          { money: -60 },
          { stat: 'happiness', delta: 4 },
          { stat: 'looks', delta: 1 },
          { log: 'I rented a pirate outfit and was the best-dressed person there, which I pointed out more than once.', kind: 'good' },
        ],
      },
      {
        id: 'self',
        label: 'Go as "yourself"',
        effects: [
          { stat: 'happiness', delta: -1 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I wore a name tag that said "Me." Three people found it hilarious and I spent the evening with them.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'Nobody noticed my lack of costume. Nobody noticed me at all, which was the problem and the point.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'skip',
        label: "Don't go",
        effects: [
          { stat: 'happiness', delta: 1 },
          { relationship: 'friend', delta: -2 },
          { log: 'I stayed home and ate the snacks I would have brought. The photos looked fun. I was not in them.' },
        ],
      },
    ],
  },
  {
    id: 'hd_fireworks',
    category: 'holiday',
    title: 'Fireworks night',
    text: 'A box of fireworks appeared at the party, along with a lighter, a lot of confidence and nobody who had read the instructions. All eyes turned to me.',
    minAge: 16,
    maxAge: 75,
    weight: 1.2,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'light',
        label: 'Light them yourself',
        effects: [
          {
            random: [
              { weight: 72, effects: [{ stat: 'happiness', delta: 6 }, { log: 'The show was glorious. Twelve rockets, one sparkler finale, applause from the neighbors. I bowed.', kind: 'good' }] },
              { weight: 20, effects: [{ injury: 6 }, { stat: 'happiness', delta: -4 }, { log: 'One went sideways. I now have a small burn on my hand and a large lesson about fuse lengths.', kind: 'bad' }] },
              { weight: 8, effects: [{ injury: 18 }, { money: -300 }, { stat: 'happiness', delta: -8 }, { log: 'One went off too close. I spent the night in the hospital with a bandaged hand and a ringing ear.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'back',
        label: 'Watch from the back',
        effects: [
          { stat: 'happiness', delta: 3 },
          { log: 'I watched from a safe distance with the sensible people. Beautiful, loud, all ten fingers intact.' },
        ],
      },
      {
        id: 'official',
        label: 'Go to the official display',
        hint: '{{$20}}',
        conditions: [{ money: { gte: 20 } }],
        effects: [
          { money: -20 },
          { stat: 'happiness', delta: 5 },
          { log: 'The town display over {{city}} was bigger, safer and had a soundtrack. My neck hurt. Worth it.', kind: 'good' },
        ],
      },
      {
        id: 'confiscate',
        label: 'Confiscate the box',
        effects: [
          { karma: 2 },
          { stat: 'happiness', delta: -2 },
          { relationship: 'friend', delta: -3 },
          { log: 'I took the box away, which was correct and made me deeply unpopular for the rest of the evening.' },
        ],
      },
    ],
  },
  {
    id: 'hd_charity_drive',
    category: 'holiday',
    title: 'Charity drive',
    text: 'The local holiday drive is collecting food, coats and money for families having a rough year. A volunteer with a clipboard has made eye contact with me. There is no escape.',
    minAge: 10,
    maxAge: 90,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'money',
        label: 'Donate money',
        hint: '{{$100}}',
        conditions: [{ money: { gte: 100 } }],
        effects: [
          { money: -100 },
          { karma: 3 },
          { stat: 'happiness', delta: 3 },
          { log: 'I gave {{$100}} and got a sticker and a warm feeling. The warm feeling lasted longer.', kind: 'good' },
        ],
      },
      {
        id: 'volunteer',
        label: 'Volunteer a full day',
        effects: [
          { karma: 3 },
          { stat: 'happiness', delta: 4 },
          { stat: 'health', delta: -1 },
          { log: 'I carried, sorted and labeled for a full day. My back hurt. I slept like a saint.', kind: 'good' },
          { chance: 0.25, then: [{ newPerson: { kind: 'friend', relationship: 50, log: 'I sorted cans all day beside {{person}}, who is now my friend. Eight hours of cans will do that.' } }] },
        ],
      },
      {
        id: 'things',
        label: 'Donate old things',
        effects: [
          { karma: 2 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.15,
            then: [{ money: -150 }, { log: 'I gave away a bag of old clothes. The good coat was in it. Somebody in {{city}} is very warm now.', kind: 'bad' }],
            else: [{ log: 'Three bags of things I never touched went to people who will use them. My closet breathed.' }],
          },
        ],
      },
      {
        id: 'pass',
        label: 'Walk briskly past',
        effects: [
          { stat: 'happiness', delta: 1 },
          { karma: -1 },
          { log: 'I stared at my shoes and walked past the clipboard. I kept my money and a small, portable guilt.' },
        ],
      },
    ],
  },
  {
    id: 'hd_toast_gone_wrong',
    category: 'holiday',
    title: 'A toast',
    text: "Someone tapped a glass and announced that I would be giving the toast at {{person}}'s celebration. Nobody had told me. Forty faces turned in my direction and waited.",
    minAge: 18,
    maxAge: 85,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['sibling', 'friend', 'bestFriend', 'spouse', 'child', 'mother', 'father'], minRelationship: 30, minAge: 18 },
    choices: [
      {
        id: 'wing',
        label: 'Wing it',
        effects: [
          {
            random: [
              { weight: 45, effects: [{ stat: 'happiness', delta: 6 }, { relationship: 'person', delta: 6 }, { log: "Ninety seconds from the heart and a standing ovation from the kids' table. {{person}} teared up.", kind: 'good' }] },
              { weight: 35, effects: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -2 }, { log: 'I rambled through four unrelated stories to confused applause. {{person}} patted my arm.' }] },
              { weight: 20, effects: [{ stat: 'happiness', delta: -6 }, { relationship: 'person', delta: -10 }, { karma: -2 }, { log: "I mentioned {{person}}'s ex. By name. Twice. The silence had texture.", kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'short',
        label: 'Keep it to one sentence',
        effects: [
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: 3 },
          { log: 'One sentence, one glass, done. People called it the best toast ever, mostly because it was over.' },
        ],
      },
      {
        id: 'notes',
        label: 'Read from my phone',
        effects: [
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 4 },
          { log: 'I read the paragraph I had drafted on the way over, looking up at the right moments. No injuries.', kind: 'good' },
        ],
      },
      {
        id: 'decline',
        label: 'Politely decline',
        effects: [
          { stat: 'happiness', delta: -1 },
          { relationship: 'person', delta: -4 },
          { log: '"I would rather not" is a full sentence. Forty people disagreed. {{person}} forgave me, slowly.' },
        ],
      },
    ],
  },
  {
    id: 'hd_storm_travel',
    category: 'holiday',
    title: 'Storm on the road',
    text: 'I was due home for the holiday tonight, but the weather turned ugly: sleet, closed roads, warnings on every channel. The family is expecting me and the forecast disagrees.',
    minAge: 18,
    maxAge: 85,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'push',
        label: 'Push through anyway',
        effects: [
          {
            random: [
              {
                weight: 80,
                effects: [
                  { stat: 'happiness', delta: 6 },
                  { relationship: 'mother', delta: 3 },
                  { relationship: 'father', delta: 3 },
                  { relationship: 'sibling', delta: 2 },
                  { relationship: 'spouse', delta: 2 },
                  { log: 'Four hours of white knuckles, then cheers and hot food. Terrifying. Worth it. Do not tell anyone.', kind: 'good' },
                ],
              },
              { weight: 15, effects: [{ injury: 7 }, { money: -300 }, { asset: 'damage', kind: 'car', amount: 30 }, { stat: 'happiness', delta: -6 }, { log: 'I slid into a ditch. A tow truck, a bruised shoulder and a very expensive lesson about ice.', kind: 'bad' }] },
              {
                weight: 5,
                effects: [
                  {
                    chance: 0.15,
                    then: [{ log: 'I never made it home. The roads were worse than anyone had said.', kind: 'bad' }, { death: 'a car crash in a winter storm' }],
                    else: [{ injury: 15 }, { money: -800 }, { asset: 'damage', kind: 'car', amount: 60 }, { stat: 'happiness', delta: -8 }, { log: 'The crash was bad. I woke up in a hospital far from anyone, with the holiday going on without me.', kind: 'bad' }],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'motel',
        label: 'Wait it out in a motel',
        hint: '{{$120}}',
        conditions: [{ money: { gte: 120 } }],
        effects: [
          { money: -120 },
          { stat: 'happiness', delta: -1 },
          { stat: 'health', delta: 1 },
          { relationship: 'mother', delta: 1 },
          { log: 'A roadside motel, a weather report, a vending-machine dinner. I arrived a day late, alive and sad.' },
        ],
      },
      {
        id: 'train',
        label: 'Take the train instead',
        hint: '{{$90}}',
        conditions: [{ money: { gte: 90 } }],
        effects: [
          { money: -90 },
          {
            chance: 0.65,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'A slow, warm train full of people in the same boat. We shared snacks. I arrived late and cheerful.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The train sat for three hours in the middle of nowhere. I arrived after everyone had gone to bed.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'back',
        label: 'Turn back and video-call',
        effects: [
          { stat: 'happiness', delta: -4 },
          { relationship: 'mother', delta: -2 },
          { relationship: 'father', delta: -2 },
          { relationship: 'sibling', delta: -2 },
          { log: 'They passed the phone around the table. Like being there, the way a photo of a meal is like dinner.' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ gifts, work and school
  {
    id: 'hd_gift_budget',
    category: 'holiday',
    title: 'The gift list',
    text: 'The gift list is long this year and the bank balance is not. Everyone I know is insisting they do not want anything, which is the most expensive thing a person can say.',
    minAge: 16,
    maxAge: 90,
    weight: 2,
    cooldown: 2,
    conditions: [{ inPrison: false }, { money: { gte: 150 } }],
    choices: [
      {
        id: 'splurge',
        label: 'Spoil everyone',
        hint: '{{$600}}',
        conditions: [{ money: { gte: 600 } }],
        effects: [
          { money: -600 },
          { counter: 'giftsGiven', by: 5 },
          { karma: 2 },
          { stat: 'happiness', delta: 4 },
          { relationship: 'mother', delta: 4 },
          { relationship: 'father', delta: 4 },
          { relationship: 'sibling', delta: 4 },
          { relationship: 'spouse', delta: 4 },
          { relationship: 'lover', delta: 4 },
          { relationship: 'child', delta: 4 },
          { relationship: 'friend', delta: 3 },
          { relationship: 'bestFriend', delta: 3 },
          { log: 'I bought everyone what they pretended not to want. Their faces were worth the card bill. Probably.', kind: 'money' },
        ],
      },
      {
        id: 'handmade',
        label: 'Make everything by hand',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 3 },
          { counter: 'giftsGiven', by: 3 },
          {
            random: [
              { weight: 60, effects: [{ relationship: 'mother', delta: 3 }, { relationship: 'father', delta: 3 }, { relationship: 'sibling', delta: 3 }, { relationship: 'spouse', delta: 3 }, { relationship: 'friend', delta: 2 }, { log: 'Jars of jam, knitted things, a framed photo each. People were touched, or excellent actors.', kind: 'good' }] },
              { weight: 40, effects: [{ relationship: 'sibling', delta: -1 }, { relationship: 'friend', delta: -1 }, { stat: 'happiness', delta: -2 }, { log: 'The jam never set, the knitting had holes. People asked "you made this?" in a tone I am decoding.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'modest',
        label: 'Keep it modest',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          { counter: 'giftsGiven', by: 3 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'mother', delta: 2 },
          { relationship: 'father', delta: 2 },
          { relationship: 'sibling', delta: 2 },
          { relationship: 'spouse', delta: 2 },
          { relationship: 'friend', delta: 1 },
          { log: 'Small, thoughtful, affordable. Nobody wept, nobody frowned, and my bank account survived.' },
        ],
      },
      {
        id: 'none',
        label: 'Declare a no-gift year',
        effects: [
          { stat: 'happiness', delta: 1 },
          { relationship: 'mother', delta: -2 },
          { relationship: 'father', delta: -2 },
          { relationship: 'sibling', delta: -3 },
          { relationship: 'spouse', delta: -3 },
          { relationship: 'child', delta: -4 },
          { relationship: 'friend', delta: -2 },
          { log: 'I announced a no-gift year by text. Half the replies were supportive. The other half were pointed.' },
        ],
      },
    ],
  },
  {
    id: 'hd_office_party',
    category: 'holiday',
    title: 'Office party',
    text: 'The {{company}} holiday party is tonight: a rented room, a small budget, an open bar and every colleague I have ever avoided, all in one place. Attendance is "optional."',
    minAge: 18,
    maxAge: 70,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ hasJob: true }, { inPrison: false }],
    choices: [
      {
        id: 'network',
        label: 'Work the room',
        effects: [
          {
            chance: 0.6,
            then: [{ jobPerformance: 6 }, { stat: 'happiness', delta: 2 }, { log: 'Twenty minutes talking to the boss about nothing, and it somehow counted. Mysterious career points.', kind: 'good' }],
            else: [{ jobPerformance: -1 }, { stat: 'happiness', delta: -2 }, { log: 'I cornered the boss by the snacks and pitched too fast. I got the nod people give to traffic.' }],
          },
        ],
      },
      {
        id: 'dance',
        label: 'Dance like nobody is watching',
        effects: [
          { stat: 'happiness', delta: 6 },
          {
            chance: 0.3,
            then: [{ jobPerformance: -4 }, { log: 'Everybody was watching. There is a video. It has a name.', kind: 'bad' }],
            else: [{ log: 'I danced, badly and joyfully, and became briefly beloved by the whole floor.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'bar',
        label: 'Make use of the open bar',
        effects: [
          { addiction: 'alcohol', delta: 4 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.4,
            then: [{ jobPerformance: -8 }, { stat: 'happiness', delta: -5 }, { log: 'I told a senior manager what I really thought of the new logo. In detail. Monday will be a long day.', kind: 'bad' }],
            else: [{ log: 'I had a few too many and told everyone I loved them. Forgiven, mostly, by Monday.' }],
          },
        ],
      },
      {
        id: 'early',
        label: 'Show up, leave early',
        effects: [
          { stat: 'happiness', delta: 2 },
          { stat: 'health', delta: 1 },
          { log: 'One drink, three handshakes, home by nine. Nobody noticed I left. Nobody noticed I came. Ideal.' },
        ],
      },
    ],
  },
  {
    id: 'hd_holiday_shift',
    category: 'holiday',
    title: 'The holiday shift',
    text: 'My manager at {{company}} needs someone to work the big holiday. Extra pay, a quiet building, and an empty chair at the family table. The sign-up sheet is still blank.',
    minAge: 16,
    maxAge: 70,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ hasJob: true }, { inPrison: false }],
    choices: [
      {
        id: 'take',
        label: 'Take the shift',
        hint: '+{{$300}}',
        effects: [
          { money: 300 },
          { jobPerformance: 4 },
          { stat: 'happiness', delta: -3 },
          { relationship: 'mother', delta: -2 },
          { relationship: 'father', delta: -2 },
          { relationship: 'spouse', delta: -3 },
          { relationship: 'child', delta: -3 },
          { log: 'An empty building, a radio and a sad sandwich. The pay cleared. The family sent photos of the food.', kind: 'money' },
        ],
      },
      {
        id: 'half',
        label: 'Offer to do half',
        hint: '+{{$150}}',
        effects: [
          { money: 150 },
          { jobPerformance: 2 },
          { relationship: 'spouse', delta: -1 },
          { log: 'I did the morning, raced home and arrived as the main course came out. Mostly the best of both.' },
        ],
      },
      {
        id: 'give',
        label: 'Give it to a colleague',
        effects: [
          { karma: 3 },
          { stat: 'happiness', delta: 1 },
          { log: 'A colleague with a mountain of bills needed it more. I handed over the pen. They nearly hugged me.', kind: 'good' },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse',
        effects: [
          { stat: 'happiness', delta: 3 },
          { jobPerformance: -2 },
          { log: 'I said no. My manager made a face but found someone else. I ate seconds of everything.' },
        ],
      },
    ],
  },
  {
    id: 'hd_school_concert',
    category: 'holiday',
    title: 'The winter concert',
    text: "The school winter concert is tonight. My class has one song, two costumes that don't fit anyone, and a teacher who really, really wants this to go well.",
    minAge: 5,
    maxAge: 13,
    weight: 2,
    cooldown: 3,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'solo',
        label: 'Volunteer for the solo',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 7 }, { grade: 3 }, { log: 'I sang the solo and nailed it. Parents clapped, a baby cried on cue, and the teacher wept openly.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'I forgot the second verse in front of everyone and hummed it. The humming was not well received.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'triangle',
        label: 'Play the triangle with conviction',
        effects: [
          { stat: 'happiness', delta: 4 },
          { stat: 'smarts', delta: 1 },
          { grade: 1 },
          { log: 'One triangle, struck at the right moment with the intensity of a rock drummer. People noticed.', kind: 'good' },
        ],
      },
      {
        id: 'back',
        label: 'Hide in the back row',
        effects: [
          { stat: 'happiness', delta: 1 },
          { log: 'I mouthed the words from the back row and nobody noticed, which was exactly the plan.' },
        ],
      },
      {
        id: 'sick',
        label: 'Fake a stomach ache',
        effects: [
          { karma: -2 },
          { stat: 'happiness', delta: 2 },
          { grade: -2 },
          { log: 'I faked a stomach ache and watched from the parking lot. Freedom tasted like a lie and a cold snack.' },
        ],
      },
    ],
  },
  {
    id: 'hd_roast_disaster',
    category: 'holiday',
    title: 'The big roast',
    text: 'This year I am in charge of the holiday roast. It is enormous, it is raw, and the internet has given me nine contradictory cooking times.',
    minAge: 20,
    maxAge: 85,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'recipe',
        label: 'Follow the recipe exactly',
        effects: [
          {
            chance: 0.75,
            then: [{ stat: 'happiness', delta: 5 }, { stat: 'smarts', delta: 1 }, { relationship: 'mother', delta: 2 }, { relationship: 'father', delta: 2 }, { relationship: 'spouse', delta: 2 }, { log: 'Timer, thermometer, no improvising. Golden. Someone asked for the recipe. A family secret, I said.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'By the book, and dry. Everyone drowned it in gravy and said it was lovely. The gravy was lovely.' }],
          },
        ],
      },
      {
        id: 'improvise',
        label: 'Improvise with confidence',
        effects: [
          {
            random: [
              { weight: 45, effects: [{ stat: 'happiness', delta: 7 }, { stat: 'smarts', delta: 2 }, { log: 'I added things no recipe allows and made a roast people still discuss. Luck or genius? Genius.', kind: 'good' }] },
              { weight: 40, effects: [{ stat: 'happiness', delta: -3 }, { log: 'Confidence is not a cooking time. The outside was charcoal, the inside a mystery. We ate the sides.', kind: 'bad' }] },
              { weight: 15, effects: [{ illness: 'food_poisoning' }, { stat: 'happiness', delta: -5 }, { relationship: 'sibling', delta: -2 }, { relationship: 'spouse', delta: -2 }, { log: 'Undercooked. Everyone was fine until midnight, then nobody was fine. I am banned from the kitchen.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'takeout',
        label: 'Order in and plate it nicely',
        hint: '{{$90}}',
        conditions: [{ money: { gte: 90 } }],
        effects: [
          { money: -90 },
          { karma: -1 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.3,
            then: [{ relationship: 'mother', delta: -3 }, { relationship: 'sibling', delta: -3 }, { log: 'Someone found the takeout containers in the trash. The betrayal was treated like a small war.', kind: 'bad' }],
            else: [{ log: 'Nobody suspected. I accepted compliments on a roast I had merely unwrapped. A victory, technically.' }],
          },
        ],
      },
      {
        id: 'delegate',
        label: 'Hand it to someone who knows',
        effects: [
          { stat: 'happiness', delta: 1 },
          { stat: 'smarts', delta: 1 },
          { relationship: 'mother', delta: 2 },
          { relationship: 'father', delta: 2 },
          { log: 'I handed it to someone who had done this forty times and took notes. Humble, practical, perfect.' },
        ],
      },
    ],
  },
];

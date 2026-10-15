import type { EventDef } from '@/engine/events/schema';

/**
 * All ages, non-denominational: birthdays, new-year resolutions, winter
 * gatherings with the whole family, gifts you hate, hosting dinner for twelve,
 * secrets at the table, costume parties, fireworks, charity drives, storms on
 * the road home, toasts that go wrong and the quiet first holiday after a
 * loss. Follow-ups (followUpOnly) are queued by the events that set them up.
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
          { log: 'I wished for a pony with my whole heart. No pony arrived. I did get a bicycle the next year, which is at least shaped a bit like a pony.' },
          { chance: 0.25, then: [{ money: 20 }, { log: 'An aunt I barely know slipped {{$20}} into my hand and told me not to spend it all on sweets. I spent it all on sweets.', kind: 'money' }] },
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
          { log: 'I wished for everyone in the room to be happy and kept it secret, which is the rule. Somebody got teary anyway. The cake was excellent.', kind: 'good' },
        ],
      },
      {
        id: 'nowish',
        label: 'Blow them out, no wish',
        effects: [
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: 1 },
          { log: 'I announced that wishes were not scientifically supported and blew all the candles out in one go. Big applause for the lungs, less for the commentary.' },
        ],
      },
      {
        id: 'frosting',
        label: 'Eat the frosting first',
        effects: [
          { stat: 'happiness', delta: 4 },
          { stat: 'health', delta: -1 },
          { relationship: 'mother', delta: -2 },
          { log: 'I went face-first into the frosting before the song had finished. Photos exist. They will be shown at my wedding.' },
        ],
      },
    ],
  },
  {
    id: 'hd_birthday_plans',
    category: 'holiday',
    title: 'Another year older',
    text: 'My birthday is this week and people keep asking what I am doing for it. I have not decided whether to make a thing of it or let it slip quietly past.',
    minAge: 13,
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
                  { log: 'The party was loud, the cake was lopsided and three people I barely knew told me I was their favourite person. Worth every cent.', kind: 'good' },
                ],
              },
              {
                weight: 30,
                effects: [
                  { stat: 'happiness', delta: 2 },
                  { log: 'Half the guests cancelled and the other half left early. I ate leftover cake for a week, which was honestly not the worst part of the year.', kind: 'bad' },
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
          { log: 'A quiet dinner, the good plates, nobody on their phones for a full hour. Low key, high quality.', kind: 'good' },
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
          { log: 'I bought myself the thing I had been eyeing for months and wrapped it, which is either sad or extremely efficient.', kind: 'money' },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore it entirely',
        effects: [
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: -1 },
          { log: 'I told everyone I was busy and spent the evening with a book. Two people sang at me down the phone anyway.' },
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
    person: { kind: ['friend', 'bestFriend', 'sibling', 'spouse', 'lover'], minRelationship: 40 },
    choices: [
      {
        id: 'tears',
        label: 'Burst into happy tears',
        effects: [
          { stat: 'happiness', delta: 8 },
          { relationship: 'person', delta: 8 },
          { log: '{{person}} got the hug of {{their}} life. I cried, laughed, cried again, and then found the snack table.', kind: 'good' },
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
              { weight: 60, effects: [{ stat: 'happiness', delta: 6 }, { relationship: 'person', delta: 5 }, { log: 'I thanked {{person}} in a speech that ran a little long but landed. Someone filmed it. I have watched it eleven times.', kind: 'good' }] },
              { weight: 40, effects: [{ stat: 'happiness', delta: 1 }, { log: 'My speech wandered through three childhood anecdotes before someone cut the cake to save us all.' }] },
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
          { log: "I said I had seen the group chat. {{person}}'s face fell a little. I should have lied.", kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'hd_forgotten_birthday',
    category: 'holiday',
    title: 'Nobody remembered',
    text: 'My birthday came and went. No calls, no cake, not even an automated message from the dentist. By the evening I had checked my phone forty times and it had checked back zero.',
    minAge: 16,
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
          { log: 'I said nothing and went to bed early. A week later someone remembered, and the apology was almost worse than the forgetting.', kind: 'bad' },
        ],
      },
      {
        id: 'hints',
        label: 'Drop heavy hints',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { relationship: 'friend', delta: 2 }, { relationship: 'sibling', delta: 2 }, { log: 'I posted a photo captioned "another trip around the sun" and the messages came pouring in, late but sincere.', kind: 'good' }],
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
          { log: 'I bought a whole cake, lit one candle and sang to myself in the kitchen. It was oddly fine. Nobody else gets a slice.' },
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
          { log: 'I called people and just said it. Awkward for a second, then a lot of guilty laughter and a late dinner. Honesty beats sulking.', kind: 'good' },
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
          { log: 'A proper party. Old friends, new friends, a playlist from twenty years ago and a clear-headed morning because I am, apparently, wise now.', kind: 'good' },
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
          { log: 'I took myself somewhere quiet with a view and thought about my life. Some of it. The nice parts, mostly.', kind: 'good' },
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
            then: [{ stat: 'health', delta: 4 }, { log: 'The crisis turned into a running habit and a new haircut. Nobody asked for either. Both are going well.', kind: 'good' }],
            else: [{ log: 'I made a list of everything I had not done yet. It was long. I put it in a drawer. The drawer is where lists go to rest.' }],
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
    choices: [
      {
        id: 'fit',
        label: 'Get in shape',
        effects: [
          { flag: 'hd_resolution', set: 'fit' },
          { stat: 'health', delta: 2 },
          { log: 'I resolved to get fit. I bought trainers. The trainers are, so far, very clean.' },
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
            then: [{ stat: 'health', delta: 6 }, { stat: 'happiness', delta: 3 }, { stat: 'looks', delta: 1 }, { counter: 'workouts', by: 3 }, { log: 'I kept going past the part where it stopped being fun and into the part where it became a habit. Stairs are nothing to me now.', kind: 'good' }],
            else: [{ stat: 'health', delta: 1 }, { log: 'I kept going until March, which is further than most, and then the weather happened. The trainers remain clean.' }],
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
            then: [{ stat: 'smarts', delta: 4 }, { stat: 'happiness', delta: 2 }, { counter: 'libraryVisits', by: 2 }, { log: 'Seven books by spring. I started saying "as I was reading recently" in conversation and nobody has stopped me yet.', kind: 'good' }],
            else: [{ stat: 'smarts', delta: 1 }, { log: 'Two books, one of them twice because I forgot I had read it. The pile beside the bed is now a piece of furniture.' }],
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
            then: [{ money: 300 }, { stat: 'happiness', delta: 2 }, { log: 'The jar filled up. Then a second jar. I counted it out on the table like a cartoon villain: {{$300}} I would otherwise have spent on nothing.', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'The jar did well until the first emergency, which turned out to be a very good pizza. The label is still on the shelf.' }],
          },
        ],
      },
      {
        id: 'quit',
        label: 'Quietly give up',
        effects: [
          { stat: 'happiness', delta: 1 },
          { log: 'I gave up quietly, which is the traditional ending. There is always next year, and the year after that.' },
        ],
      },
    ],
  },
  {
    id: 'hd_midnight_countdown',
    category: 'holiday',
    title: 'Ten, nine, eight',
    text: "New Year's Eve. The countdown is starting, the room is loud, and I have about ten seconds to decide what kind of year this is going to be.",
    minAge: 16,
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
                  { log: 'Fireworks over {{city}}, strangers hugging strangers, a brass band that would not stop. I was hoarse by one in the morning.', kind: 'good' },
                  { chance: 0.2, then: [{ newPerson: { kind: 'friend', relationship: 50, log: 'I spent the countdown next to a stranger called {{person}} and we were somehow friends by one in the morning.' } }] },
                ],
              },
              { weight: 30, effects: [{ stat: 'happiness', delta: -4 }, { stat: 'health', delta: -2 }, { log: 'Someone spilled a full drink down my back at two minutes to midnight. I saw the new year in under a bathroom hand dryer.', kind: 'bad' }] },
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
          { log: 'I was asleep before the fireworks. Woke up to a new year and no headache, which is a kind of victory.' },
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
            then: [{ stat: 'health', delta: -3 }, { stat: 'happiness', delta: -4 }, { log: 'I rang in the new year loudly and met the first morning of it quietly, face down, promising things to the ceiling.', kind: 'bad' }],
            else: [{ log: 'The night got blurry around the third toast. I remember being very happy and very loud, and not much else.' }],
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
    text: 'The whole family squeezed into one house for the winter holiday: too many coats, one bathroom, and {{person}} in charge of the kitchen, shouting cheerful instructions at anyone who walked past.',
    minAge: 5,
    maxAge: 90,
    weight: 2.5,
    cooldown: 2,
    person: { kind: ['mother', 'father', 'sibling', 'spouse', 'child'], minAge: 10 },
    choices: [
      {
        id: 'help',
        label: 'Help {{person}} cook',
        effects: [
          { relationship: 'person', delta: 6 },
          { stat: 'happiness', delta: 3 },
          { stat: 'smarts', delta: 1 },
          { log: 'I peeled, stirred and tasted on command. {{person}} said I was the only useful one, loudly, in front of everybody.', kind: 'good' },
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
        label: 'Hide with your phone',
        effects: [
          { stat: 'happiness', delta: 1 },
          { relationship: 'person', delta: -4 },
          { log: 'I spent most of the day on the sofa scrolling. {{person}} noticed. {{They}} always notice.' },
        ],
      },
      {
        id: 'nap',
        label: 'Sneak off for a nap',
        effects: [
          { stat: 'health', delta: 3 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -2 },
          { log: 'I slept through the washing-up, which was the plan, and the family photo, which was not.' },
        ],
      },
    ],
  },
  {
    id: 'hd_terrible_gift',
    category: 'holiday',
    title: 'An unfortunate gift',
    text: '{{person}} handed me a wrapped box with enormous pride. Inside was the single ugliest object I have ever owned. {{They}} waited, beaming, for my reaction.',
    minAge: 6,
    maxAge: 90,
    weight: 2,
    cooldown: 3,
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'spouse', 'lover', 'friend', 'bestFriend'] },
    choices: [
      {
        id: 'fake',
        label: 'Fake delight',
        effects: [
          { relationship: 'person', delta: 5 },
          { karma: 1 },
          { stat: 'happiness', delta: -1 },
          { log: 'I said I loved it. I will now have to display it whenever {{they}} visit, forever. This is the price of kindness.' },
        ],
      },
      {
        id: 'honest',
        label: 'Be gently honest',
        effects: [
          {
            random: [
              { weight: 50, effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: '{{person}} laughed and admitted {{they}} had panicked in the shop. We swapped it the next day and had a good lunch.', kind: 'good' }] },
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
            then: [{ relationship: 'person', delta: -12 }, { log: 'The re-gift made its way back to {{person}} within a year. {{They}} do not forget things like this.', kind: 'bad' }],
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
                  { log: 'Three courses, a table that seated twelve if nobody moved their elbows, and total silence when the main course came out. The good kind of silence.', kind: 'good' },
                ],
              },
              { weight: 25, effects: [{ stat: 'happiness', delta: 3 }, { log: 'The oven died at four. We ate at nine, mostly sides. People were kind about it. I will never host again, until next year.' }] },
              { weight: 10, effects: [{ illness: 'food_poisoning' }, { stat: 'happiness', delta: -5 }, { log: 'Something in the stuffing was not right. Half the table was unwell by midnight, me included. Nobody has said anything. Nobody has to.', kind: 'bad' }] },
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
          { log: 'I quietly downgraded the invitation to pie and coffee. A few people grumbled, then saw the pie and forgave me.' },
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
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather', 'sibling'], minAge: 16 },
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
                  { log: 'There is a half-sibling. A real one, with a name, living two towns over. {{person}} had known for years.', kind: 'milestone' },
                  { newPerson: { kind: 'sibling', relationship: 25, log: 'My new half-sibling is called {{person}}. We have the same nose and, so far, nothing else.' } },
                ],
              },
              { weight: 35, effects: [{ stat: 'happiness', delta: -3 }, { stat: 'smarts', delta: 2 }, { log: 'The family business had gone bankrupt twice and the "inheritance" story was a comforting fiction. I felt oddly relieved.' }] },
              { weight: 25, effects: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: 1 }, { log: '{{person}} had once been engaged to someone else entirely and called it off a week before the wedding. The room took a while to recover.' }] },
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
            then: [{ stat: 'happiness', delta: 3 }, { log: 'My laugh broke the tension. Then everyone laughed, including {{person}}, and dinner carried on with a new story attached.', kind: 'good' }],
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
          { log: 'I wrote it all down later for the memoir. Ethically grey, journalistically sound.' },
        ],
      },
    ],
  },
  {
    id: 'hd_empty_chair',
    category: 'holiday',
    title: 'The empty chair',
    text: 'It is the first big holiday since we lost {{person}}. The table is set, the food is the same, and nobody has touched {{their}} chair. Everyone is being carefully, exhaustingly cheerful.',
    minAge: 8,
    maxAge: 90,
    weight: 1.5,
    once: true,
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
          { log: "We set {{person}}'s place and put {{their}} favourite dish in front of it. Someone cried, then someone laughed, and both were allowed.", kind: 'good' },
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
          { log: 'I told the story about {{person}} and the ladder. The room came back to life for a minute. {{They}} would have corrected every detail.', kind: 'good' },
        ],
      },
      {
        id: 'through',
        label: 'Just get through it',
        effects: [
          { stat: 'happiness', delta: -2 },
          { stat: 'health', delta: 1 },
          { log: 'I ate, nodded, washed up and went to bed early. Some years you just get through. That counts.' },
        ],
      },
      {
        id: 'skip',
        label: 'Skip the holiday entirely',
        effects: [
          { stat: 'happiness', delta: -5 },
          { relationship: 'mother', delta: -3 },
          { relationship: 'father', delta: -3 },
          { relationship: 'sibling', delta: -3 },
          { relationship: 'spouse', delta: -3 },
          { log: 'I stayed home with the lights off. I am not sure that helped anyone, including me.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'hd_estranged_sibling',
    category: 'holiday',
    title: 'An old face',
    text: '{{person}} turned up at the holiday gathering. We have not properly spoken in years, and now we are sharing a sofa, a bowl of nuts and an enormous silence.',
    minAge: 18,
    maxAge: 90,
    weight: 1,
    cooldown: 5,
    person: { kind: ['sibling'], maxRelationship: 30, minAge: 16 },
    choices: [
      {
        id: 'hug',
        label: 'Hug it out',
        effects: [
          { relationship: 'person', delta: 15 },
          { stat: 'happiness', delta: 6 },
          { karma: 2 },
          { log: "I went first. The hug was stiff for a second and then it wasn't. We talked until the house was asleep.", kind: 'good' },
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
            then: [{ relationship: 'person', delta: 20 }, { stat: 'happiness', delta: 5 }, { log: 'We finally said the things. There were tears, one raised voice and then a long quiet apology from both sides. The weight came off.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -5 }, { log: 'It went exactly how it went last time. {{person}} left before dessert. Same wound, fresh salt.', kind: 'bad' }],
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
          { log: 'I left early. Easier than talking. The drive home was very quiet.' },
        ],
      },
    ],
  },
  {
    id: 'hd_kids_tradition',
    category: 'holiday',
    title: 'Starting a tradition',
    text: "{{person}} asked why our family doesn't have a holiday 'thing' like {{their}} friends do. I had no answer, so I decided we would have one, starting this year.",
    minAge: 20,
    maxAge: 60,
    weight: 1.5,
    once: true,
    conditions: [{ hasChildren: true }],
    person: { kind: ['child'], minAge: 3, maxAge: 12 },
    choices: [
      {
        id: 'pancakes',
        label: 'Pancake breakfast in pyjamas',
        effects: [
          { flag: 'hd_tradition', set: 'pancakes' },
          { relationship: 'person', delta: 6 },
          { stat: 'happiness', delta: 4 },
          { log: 'The tradition is decided: pancakes, pyjamas, no exceptions. {{person}} has already drawn a poster.', kind: 'milestone' },
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
          { log: 'The tradition is decided: a blanket fort in the living room and stories until someone falls asleep. {{person}} is thrilled.', kind: 'milestone' },
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
          { log: 'The tradition is decided: a letter every year, sealed, to be opened at eighteen. {{person}} wants to know if {{they}} can peek. No.', kind: 'milestone' },
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
              { weight: 70, effects: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 5 }, { log: 'Pancakes in pyjamas, flour everywhere, {{person}} flipping one onto the ceiling. A tradition is born.', kind: 'good' }] },
              { weight: 30, effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 3 }, { log: 'The first batch burned and the smoke alarm joined in. {{person}} declared it the best breakfast ever. Kids are generous critics.' }] },
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
              { weight: 70, effects: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 5 }, { log: 'We built a blanket fort around the sofa and told stories until {{person}} fell asleep mid-sentence.', kind: 'good' }] },
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
          { log: 'I wrote {{person}} a letter {{they}} will not read for years, sealed it, and felt about a hundred years old in the best way.', kind: 'good' },
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
              { weight: 45, effects: [{ stat: 'happiness', delta: 2 }, { log: 'My costume was described as "ambitious". I went as a concept. Several people asked what it was. So did I.' }] },
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
          { log: 'I rented a full pirate outfit and was the best-dressed person at the party, which I pointed out more than once.', kind: 'good' },
        ],
      },
      {
        id: 'self',
        label: 'Go as "yourself"',
        effects: [
          { stat: 'happiness', delta: -1 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I wore a name tag that said "Me". Three people found it hilarious and I spent the evening with those three.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'Nobody noticed my lack of costume. Nobody noticed me at all, which was both the problem and the point.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'skip',
        label: "Don't go",
        effects: [
          { stat: 'happiness', delta: 1 },
          { relationship: 'friend', delta: -2 },
          { log: 'I stayed home and ate the snacks I would have brought. The photos the next day looked fun. I was not in them.' },
        ],
      },
    ],
  },
  {
    id: 'hd_fireworks',
    category: 'holiday',
    title: 'Fireworks night',
    text: 'A box of fireworks appeared at the party, along with a lighter, a lot of confidence and nobody who had read the instructions. All eyes turned to me.',
    minAge: 12,
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
              { weight: 72, effects: [{ stat: 'happiness', delta: 6 }, { log: 'The show was glorious. Twelve rockets, one sparkler finale, applause from the neighbours. I bowed.', kind: 'good' }] },
              { weight: 20, effects: [{ injury: 6 }, { stat: 'happiness', delta: -4 }, { log: 'One went sideways. I now have a small burn on my hand and a large lesson about fuse lengths.', kind: 'bad' }] },
              { weight: 8, effects: [{ injury: 18 }, { money: -300 }, { stat: 'happiness', delta: -8 }, { log: 'A firework went off far too close. I spent the night in a hospital with a bandaged hand and a ringing ear, hearing the show from a distance.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'back',
        label: 'Watch from the back',
        effects: [
          { stat: 'happiness', delta: 3 },
          { log: 'I watched from a safe distance with the sensible people and a warm drink. Beautiful, loud, and all my fingers intact.' },
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
          { log: 'The town display over {{city}} was bigger, safer and had a soundtrack. My neck hurt from looking up. Worth it.', kind: 'good' },
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
          { log: 'I carried, sorted and labelled for a full day. My back hurt. I slept like a saint.', kind: 'good' },
          { chance: 0.25, then: [{ newPerson: { kind: 'friend', relationship: 50, log: 'I spent the day sorting tins beside {{person}}, who is now, apparently, my friend. Eight hours of cans will do that.' } }] },
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
            then: [{ money: -150 }, { log: 'I gave away a bag of old clothes. The good coat was in it. Somebody in {{city}} is very warm now, and I am not.', kind: 'bad' }],
            else: [{ log: 'Three bags of things I had not touched in years went to people who will actually use them. The wardrobe breathed.' }],
          },
        ],
      },
      {
        id: 'pass',
        label: 'Walk briskly past',
        effects: [
          { stat: 'happiness', delta: 1 },
          { karma: -1 },
          { log: 'I studied my phone intently and walked past. The clipboard watched me go. I kept my money and a small, portable guilt.' },
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
    person: { kind: ['sibling', 'friend', 'bestFriend', 'spouse', 'child', 'mother', 'father'], minRelationship: 30, minAge: 12 },
    choices: [
      {
        id: 'wing',
        label: 'Wing it',
        effects: [
          {
            random: [
              { weight: 45, effects: [{ stat: 'happiness', delta: 6 }, { relationship: 'person', delta: 6 }, { log: 'I spoke from the heart for ninety seconds and got a standing ovation from the kids table. {{person}} teared up.', kind: 'good' }] },
              { weight: 35, effects: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -2 }, { log: 'I rambled through four unrelated stories and sat down to confused applause. {{person}} patted my arm.' }] },
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
          { log: 'One sentence, one raised glass, done. Several people said it was the best toast they had heard, mostly because it was over.' },
        ],
      },
      {
        id: 'notes',
        label: 'Read the notes app',
        effects: [
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 4 },
          { log: 'I read the paragraph I had secretly drafted on the drive over, looking up at the right moments. Competent, warm, no injuries.', kind: 'good' },
        ],
      },
      {
        id: 'decline',
        label: 'Politely decline',
        effects: [
          { stat: 'happiness', delta: -1 },
          { relationship: 'person', delta: -4 },
          { log: '"I would rather not" is a complete sentence, but it does not play well in a room of forty. {{person}} understood. Mostly.' },
        ],
      },
    ],
  },
  {
    id: 'hd_storm_travel',
    category: 'holiday',
    title: 'Storm on the road',
    text: 'I was due home for the holiday tonight, but the weather turned ugly: sleet, closed roads, warnings on every channel. The family is expecting me and the forecast disagrees.',
    minAge: 17,
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
                  { log: 'Four hours of white knuckles later I walked in to cheers and hot food. Terrifying. Worth it. Do not tell anyone I said that.', kind: 'good' },
                ],
              },
              { weight: 15, effects: [{ injury: 7 }, { money: -300 }, { asset: 'damage', kind: 'car', amount: 30 }, { stat: 'happiness', delta: -6 }, { log: 'I slid off the road into a ditch. A tow truck, a bruised shoulder and a very expensive lesson about ice.', kind: 'bad' }] },
              {
                weight: 5,
                effects: [
                  {
                    chance: 0.15,
                    then: [{ log: 'I never made it home. The roads were worse than anyone had said.', kind: 'bad' }, { death: 'a car crash in a winter storm' }],
                    else: [{ injury: 15 }, { money: -800 }, { asset: 'damage', kind: 'car', amount: 60 }, { stat: 'happiness', delta: -8 }, { log: 'The crash was bad. I woke up in a hospital far from anyone, with the holiday happening somewhere without me.', kind: 'bad' }],
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
          { log: 'I spent the night in a roadside motel watching the weather channel and eating a vending-machine dinner. Arrived the next morning, alive and slightly sad.' },
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
            then: [{ stat: 'happiness', delta: 4 }, { log: 'The train was slow, warm and full of people in the same boat. We shared snacks. I arrived late and in a good mood.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The train stopped for three hours in the middle of nowhere. I arrived after everyone had gone to bed.', kind: 'bad' }],
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
          { log: 'I called in from my own kitchen. They passed the phone around the table. It was almost like being there, the way a photo of a meal is almost like dinner.' },
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
          { log: 'I bought everyone exactly what they pretended not to want. The looks on their faces were worth the number on the statement. Probably.', kind: 'money' },
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
              { weight: 60, effects: [{ relationship: 'mother', delta: 3 }, { relationship: 'father', delta: 3 }, { relationship: 'sibling', delta: 3 }, { relationship: 'spouse', delta: 3 }, { relationship: 'friend', delta: 2 }, { log: 'Jars of jam, knitted things, a framed photo each. People were genuinely touched, or excellent actors.', kind: 'good' }] },
              { weight: 40, effects: [{ relationship: 'sibling', delta: -1 }, { relationship: 'friend', delta: -1 }, { stat: 'happiness', delta: -2 }, { log: 'The jam did not set. The knitting had holes. Everyone said "you made this?" in a tone I am still decoding.', kind: 'bad' }] },
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
          { log: 'Small, thoughtful, affordable. Nobody wept, nobody frowned, and the rent still got paid.' },
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
    text: "The {{company}} holiday party is tonight: a rented room, a small budget, a free bar and every colleague I have ever avoided, all in one place. Attendance is 'optional'.",
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
            then: [{ jobPerformance: 6 }, { stat: 'happiness', delta: 2 }, { log: 'I talked to the boss for twenty minutes about nothing and it somehow counted. Mysterious career points were awarded.', kind: 'good' }],
            else: [{ jobPerformance: -1 }, { stat: 'happiness', delta: -2 }, { log: 'I cornered the boss by the snack table and talked too fast about my ideas. She nodded the way people nod at traffic.' }],
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
        label: 'Make use of the free bar',
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
        label: 'Show face, leave early',
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
    text: 'My manager at {{company}} needs someone to work the big holiday. Extra pay, a quiet building, and the family table missing one chair. The sign-up sheet is still blank.',
    minAge: 16,
    maxAge: 70,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ hasJob: true }, { inPrison: false }],
    choices: [
      {
        id: 'take',
        label: 'Take the shift',
        hint: '{{$300}}',
        effects: [
          { money: 300 },
          { jobPerformance: 4 },
          { stat: 'happiness', delta: -3 },
          { relationship: 'mother', delta: -2 },
          { relationship: 'father', delta: -2 },
          { relationship: 'spouse', delta: -3 },
          { relationship: 'child', delta: -3 },
          { log: 'I worked the holiday in an empty building with a radio and a sad sandwich. The pay cleared the next week. The family sent photos of the food.', kind: 'money' },
        ],
      },
      {
        id: 'half',
        label: 'Offer to do half',
        hint: '{{$150}}',
        effects: [
          { money: 150 },
          { jobPerformance: 2 },
          { relationship: 'spouse', delta: -1 },
          { log: 'I did the morning, raced home for the afternoon and arrived as the main course came out. Mostly the best of both.' },
        ],
      },
      {
        id: 'give',
        label: 'Give it to a colleague',
        effects: [
          { karma: 3 },
          { stat: 'happiness', delta: 1 },
          { log: 'A colleague with a mountain of bills needed the money more than I did. I handed them the pen. They nearly hugged me.', kind: 'good' },
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
            then: [{ stat: 'happiness', delta: 7 }, { grade: 3 }, { log: 'I sang the solo and nailed it. Parents clapped, a baby cried at exactly the right moment, and the teacher wept openly.', kind: 'good' }],
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
          { log: 'One triangle, struck at exactly the right moment, with the intensity of a rock drummer. People talked about it afterwards.', kind: 'good' },
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
          { log: 'I invented a stomach ache and watched from the car park. Freedom tasted like a lie and a cold snack.' },
        ],
      },
    ],
  },
  {
    id: 'hd_roast_disaster',
    category: 'holiday',
    title: 'The big roast',
    text: 'I have been put in charge of the holiday roast for the first time. It is enormous, it is raw, and the internet has given me nine contradictory cooking times.',
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
            then: [{ stat: 'happiness', delta: 5 }, { stat: 'smarts', delta: 1 }, { relationship: 'mother', delta: 2 }, { relationship: 'father', delta: 2 }, { relationship: 'spouse', delta: 2 }, { log: 'Timer, thermometer, resting time, no improvising. It came out golden. Someone asked for the recipe. I said it was a family secret.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'Exactly by the book, exactly dry. Everyone drowned it in gravy and said it was lovely. The gravy was lovely.' }],
          },
        ],
      },
      {
        id: 'improvise',
        label: 'Improvise with confidence',
        effects: [
          {
            random: [
              { weight: 45, effects: [{ stat: 'happiness', delta: 7 }, { stat: 'smarts', delta: 2 }, { log: 'I added things no recipe sanctioned and produced a roast people are still talking about. Genius or luck. I am saying genius.', kind: 'good' }] },
              { weight: 40, effects: [{ stat: 'happiness', delta: -3 }, { log: 'Confidence is not a cooking time. The outside was charcoal, the inside was a mystery. We ate the sides.', kind: 'bad' }] },
              { weight: 15, effects: [{ illness: 'food_poisoning' }, { stat: 'happiness', delta: -5 }, { relationship: 'sibling', delta: -2 }, { relationship: 'spouse', delta: -2 }, { log: 'Undercooked. Everyone was fine until about midnight, and then nobody was fine. I have been banned from the kitchen.', kind: 'bad' }] },
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
            then: [{ relationship: 'mother', delta: -3 }, { relationship: 'sibling', delta: -3 }, { log: 'Someone found the containers in the bin. The betrayal was treated with the seriousness of a small war.', kind: 'bad' }],
            else: [{ log: 'Nobody suspected a thing. I accepted compliments on a roast I had merely unwrapped. A victory, technically.' }],
          },
        ],
      },
      {
        id: 'delegate',
        label: 'Hand it to someone older',
        effects: [
          { stat: 'happiness', delta: 1 },
          { stat: 'smarts', delta: 1 },
          { relationship: 'mother', delta: 2 },
          { relationship: 'father', delta: 2 },
          { log: 'I handed over to someone who has done this forty times and took notes. Humble, practical, and the roast was perfect.' },
        ],
      },
    ],
  },
];

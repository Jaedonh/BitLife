import type { EventDef } from '@/engine/events/schema';

/**
 * Love and family: partners, parents, siblings and children from age 16 on.
 * Partner events bind a lover/spouse; family events bind a child, parent or sibling.
 */
export const LOVE_AND_FAMILY_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ partners
  {
    id: 'lf_jealous_of_friend',
    category: 'romance',
    title: 'A jealous streak',
    text: "{{person}} went quiet after seeing how much I text my best friend. Later {{they}} asked, very casually, whether we were 'just friends'. The casual part was not convincing.",
    minAge: 16,
    maxAge: 70,
    weight: 1,
    cooldown: 3,
    conditions: [{ inPrison: false }, { hasPerson: ['friend', 'bestFriend'] }],
    person: { kind: ['lover', 'spouse'] },
    choices: [
      {
        id: 'reassure',
        label: 'Reassure them',
        effects: [{ love: 5 }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 2 }, { log: 'I explained, patiently, and {{they}} relaxed. Mostly.', kind: 'good' }],
      },
      {
        id: 'tease',
        label: 'Tease them about it',
        effects: [
          {
            chance: 0.5,
            then: [{ love: 3 }, { stat: 'happiness', delta: 3 }, { log: '{{They}} laughed and admitted {{they}} was being silly.', kind: 'good' }],
            else: [{ love: -8 }, { relationship: 'person', delta: -5 }, { log: '{{They}} did not find it funny. The silence lasted two days.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'cutback',
        label: 'Text my friend less',
        effects: [{ love: 6 }, { relationship: 'friend', delta: -4 }, { relationship: 'bestFriend', delta: -4 }, { stat: 'happiness', delta: -3 }, { log: 'Peace at home, at the cost of a slowly fading group chat.' }],
      },
      {
        id: 'trust',
        label: 'Tell them to trust me',
        effects: [
          {
            chance: 0.6,
            then: [{ love: 2 }, { log: '{{They}} thought about it and agreed that trust goes both ways.' }],
            else: [{ love: -6 }, { stat: 'happiness', delta: -2 }, { log: 'It turned into a fight about something else entirely.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_move_in_together',
    category: 'romance',
    title: 'Moving in together',
    text: '{{person}} has a drawer at my place, then a shelf, then a toothbrush with opinions. Tonight {{they}} asked if we should just make it official and get a place together.',
    minAge: 18,
    maxAge: 60,
    weight: 1,
    cooldown: 6,
    conditions: [{ inPrison: false }],
    person: { kind: ['lover'], minRelationship: 50 },
    choices: [
      {
        id: 'find',
        label: "Let's find a place",
        hint: '{{$1500}} deposit',
        effects: [
          { money: -1500 },
          { flag: 'lf_living_together', set: true },
          { love: 10 },
          { relationship: 'person', delta: 6 },
          { stat: 'happiness', delta: 5 },
          { log: '{{person}} and I moved in together. The boxes took a month to unpack.', kind: 'milestone' },
        ],
      },
      {
        id: 'mine',
        label: 'Move into my place',
        effects: [
          { flag: 'lf_living_together', set: true },
          { love: 6 },
          { relationship: 'person', delta: 3 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { log: '{{They}} fit right in, apart from the opinions about my furniture.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { love: -3 }, { log: "My place became 'our place' in name only. We argued about shelves for a year.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'wait',
        label: 'Not yet',
        effects: [{ love: -5 }, { stat: 'happiness', delta: 1 }, { log: '{{They}} said {{they}} understood. {{They}} took the toothbrush home, which felt pointed.' }],
      },
    ],
  },
  {
    id: 'lf_meet_their_parents',
    category: 'romance',
    title: 'Meeting the parents',
    text: "{{person}} invited me to Sunday lunch with {{their}} parents. I was warned about the father's handshake, the mother's questions, and a dog that judges people.",
    minAge: 16,
    maxAge: 60,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['lover'] },
    choices: [
      {
        id: 'charm',
        label: 'Turn on the charm',
        effects: [
          {
            chance: 0.6,
            then: [{ love: 8 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 4 }, { log: 'The parents loved me. The dog remained unconvinced.', kind: 'good' }],
            else: [{ love: -3 }, { stat: 'happiness', delta: -3 }, { log: 'I laughed at the wrong moment during grace. {{person}} says it will be fine. The mother disagrees.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'honest',
        label: 'Just be myself',
        effects: [
          { karma: 1 },
          {
            chance: 0.5,
            then: [{ love: 6 }, { relationship: 'person', delta: 4 }, { log: 'I was myself. It went fine, which was both a relief and mildly surprising.', kind: 'good' }],
            else: [{ love: 1 }, { log: 'I was myself. Nobody minded. Nobody was thrilled either.' }],
          },
        ],
      },
      {
        id: 'gift',
        label: 'Bring an expensive gift',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          {
            chance: 0.75,
            then: [{ love: 6 }, { relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 3 }, { log: "The gift landed. I was called 'thoughtful' twice before dessert.", kind: 'good' }],
            else: [{ love: -2 }, { log: 'The gift was slightly too much. The father raised an eyebrow that stayed raised.' }],
          },
        ],
      },
      {
        id: 'bail',
        label: 'Fake a stomach bug',
        effects: [{ karma: -2 }, { love: -8 }, { relationship: 'person', delta: -4 }, { log: "I bailed. {{person}} knew. {{their}} parents now call me 'the one with the stomach'.", kind: 'bad' }],
      },
    ],
  },
  {
    id: 'lf_their_proposal',
    category: 'romance',
    title: 'A question for me',
    text: 'At the end of an ordinary dinner, {{person}} got down on one knee in front of everyone. A ring, a shaking hand, and the whole restaurant watching my face.',
    minAge: 20,
    maxAge: 60,
    weight: 0.8,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    person: { kind: ['lover'], minRelationship: 60 },
    choices: [
      {
        id: 'yes',
        label: 'Say yes',
        effects: [
          { flag: 'lf_engaged', set: true },
          { love: 15 },
          { relationship: 'person', delta: 10 },
          { stat: 'happiness', delta: 10 },
          { log: "I said yes. {{person}} cried, I cried, the waiter cried a little. We're engaged.", kind: 'milestone' },
        ],
      },
      {
        id: 'time',
        label: 'Ask for more time',
        effects: [
          { love: -6 },
          { relationship: 'person', delta: -3 },
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.5,
            then: [{ log: '{{They}} said {{they}} would wait. We ate dessert in a careful silence.' }],
            else: [{ love: -10 }, { log: '{{They}} put the ring away and we did not talk about it again for a long time.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'no',
        label: 'Say no',
        effects: [
          { love: -25 },
          { relationship: 'person', delta: -15 },
          { stat: 'happiness', delta: -5 },
          {
            chance: 0.5,
            then: [{ removePerson: true }, { stat: 'happiness', delta: -6 }, { log: '{{person}} left the restaurant and, soon after, left me.', kind: 'bad' }],
            else: [{ log: 'We stayed together, but something had been said that could not be unsaid.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_cheating_suspicion',
    category: 'romance',
    title: 'A nagging suspicion',
    text: "{{person}} has been coming home late, guarding {{their}} phone, and smiling at messages {{they}} won't explain. A friend hinted that {{they}} was seen having dinner with someone I don't know.",
    minAge: 18,
    maxAge: 70,
    weight: 0.8,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    person: { kind: ['lover', 'spouse'] },
    choices: [
      {
        id: 'confront',
        label: 'Ask them directly',
        effects: [
          {
            chance: 0.35,
            then: [{ log: '{{They}} went pale, then admitted it. There is someone else.', kind: 'bad' }, { love: -25 }, { relationship: 'person', delta: -20 }, { stat: 'happiness', delta: -10 }, { queue: 'lf_cheating_confirmed' }],
            else: [{ log: 'It was a surprise {{they}} had been planning for me. I felt awful and relieved at once.', kind: 'good' }, { love: 6 }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 4 }],
          },
        ],
      },
      {
        id: 'snoop',
        label: 'Go through their phone',
        effects: [
          { karma: -4 },
          {
            chance: 0.35,
            then: [{ log: 'I found the messages. There was no innocent explanation.', kind: 'bad' }, { love: -25 }, { relationship: 'person', delta: -20 }, { stat: 'happiness', delta: -10 }, { queue: 'lf_cheating_confirmed' }],
            else: [
              {
                chance: 0.5,
                then: [{ log: "Nothing there, but {{they}} caught me looking. Now I'm the one who broke trust.", kind: 'bad' }, { love: -12 }, { relationship: 'person', delta: -10 }],
                else: [{ log: 'Nothing there. I put the phone back and felt small.' }, { stat: 'happiness', delta: -3 }],
              },
            ],
          },
        ],
      },
      {
        id: 'trust',
        label: 'Trust them and let it go',
        effects: [
          { karma: 2 },
          {
            chance: 0.35,
            then: [{ log: 'Months later the truth came out anyway, and I had missed every sign.', kind: 'bad' }, { love: -20 }, { relationship: 'person', delta: -15 }, { stat: 'happiness', delta: -8 }, { queue: 'lf_cheating_confirmed' }],
            else: [{ log: "Nothing came of it. The dinner was with {{their}} cousin.", kind: 'good' }, { love: 4 }, { stat: 'happiness', delta: 3 }],
          },
        ],
      },
      {
        id: 'investigator',
        label: 'Hire a private investigator',
        hint: '{{$1200}}',
        effects: [
          { money: -1200 },
          {
            chance: 0.35,
            then: [{ log: "The photos arrived in a brown envelope. I didn't need to open the second one.", kind: 'bad' }, { love: -25 }, { relationship: 'person', delta: -20 }, { stat: 'happiness', delta: -10 }, { queue: 'lf_cheating_confirmed' }],
            else: [{ log: "The investigator's report was two pages of {{person}} buying groceries. Expensive peace of mind." }, { stat: 'happiness', delta: 2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_cheating_confirmed',
    category: 'romance',
    title: 'The truth',
    text: "So it's true. {{person}} has been seeing someone else. {{They}} says it's over, that it meant nothing, and that {{they}} wants to fix this. I have to decide what I want.",
    minAge: 16,
    maxAge: 100,
    weight: 1,
    followUpOnly: true,
    person: { kind: ['lover', 'spouse'] },
    choices: [
      {
        id: 'leave',
        label: 'Leave them',
        effects: [
          { removePerson: true },
          { stat: 'happiness', delta: -8 },
          { log: 'I packed a bag and left. It hurt, and it was right.', kind: 'bad' },
          { chance: 0.5, then: [{ stat: 'happiness', delta: 6 }, { log: 'Six months on, I felt lighter than I had in years.', kind: 'good' }] },
        ],
      },
      {
        id: 'forgive',
        label: 'Try to forgive',
        effects: [
          { karma: 3 },
          { love: -10 },
          { relationship: 'person', delta: -5 },
          {
            chance: 0.55,
            then: [{ love: 15 }, { relationship: 'person', delta: 10 }, { stat: 'happiness', delta: 4 }, { log: "Slowly, we rebuilt. It's not the same, but it's ours.", kind: 'good' }],
            else: [{ love: -15 }, { stat: 'happiness', delta: -8 }, { log: 'I tried. The trust never came back, and neither did the easy laughter.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'therapy',
        label: 'Insist on couples therapy',
        hint: '{{$1500}}',
        effects: [
          { money: -1500 },
          { karma: 1 },
          {
            chance: 0.65,
            then: [{ love: 12 }, { relationship: 'person', delta: 12 }, { stat: 'happiness', delta: 5 }, { log: 'Therapy was awkward, expensive, and it worked.', kind: 'good' }],
            else: [{ love: -10 }, { stat: 'happiness', delta: -5 }, { log: 'Twelve sessions. The therapist eventually suggested we might be happier apart.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'revenge',
        label: 'Get even',
        effects: [
          { karma: -6 },
          { love: -20 },
          { relationship: 'person', delta: -15 },
          {
            chance: 0.5,
            then: [{ removePerson: true }, { stat: 'happiness', delta: -5 }, { log: 'I made sure {{they}} felt it. Then there was nothing left to feel.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: -8 }, { log: "Revenge was brief and left a bitter taste. We're still together, somehow.", kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_anniversary_slip',
    category: 'romance',
    title: 'Anniversary slip',
    text: 'I came home with flowers and a reservation. {{person}} looked at me, then at the calendar, then at the floor. {{They}} had forgotten our anniversary completely.',
    minAge: 20,
    maxAge: 80,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['spouse'] },
    choices: [
      {
        id: 'laugh',
        label: 'Laugh it off',
        effects: [{ karma: 2 }, { love: 5 }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 2 }, { log: 'We went to dinner anyway. {{They}} paid, out of guilt, which I allowed.', kind: 'good' }],
      },
      {
        id: 'sulk',
        label: 'Make them feel it',
        effects: [
          { karma: -2 },
          { love: -4 },
          { relationship: 'person', delta: -3 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: '{{They}} grovelled beautifully. A weekend away appeared on the calendar.' }],
            else: [{ stat: 'happiness', delta: -4 }, { love: -4 }, { log: 'The sulk lasted a week. Nobody won.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'quiz',
        label: 'Ask what the date means',
        effects: [
          {
            chance: 0.4,
            then: [{ love: 4 }, { log: "{{They}} got it on the second guess. I'll take it." }],
            else: [{ love: -6 }, { stat: 'happiness', delta: -3 }, { log: '{{They}} guessed my birthday. It is not my birthday.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_couples_therapy',
    category: 'romance',
    title: 'Couples therapy',
    text: 'We have been talking past each other for months. {{person}} suggested a couples therapist, and {{they}} already has a name and a number, which tells me how long {{they}} has been thinking about it.',
    minAge: 22,
    maxAge: 75,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    person: { kind: ['spouse'], maxRelationship: 60 },
    choices: [
      {
        id: 'go',
        label: 'Go to therapy',
        hint: '{{$1200}}',
        effects: [
          { money: -1200 },
          {
            chance: 0.65,
            then: [{ love: 14 }, { relationship: 'person', delta: 14 }, { stat: 'happiness', delta: 6 }, { log: 'Eight sessions. We learned to argue properly. It helped more than I expected.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: -2 }, { log: 'We went. We talked. Some things improved; some things we just understand better now.' }],
          },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse',
        effects: [
          { love: -8 },
          { relationship: 'person', delta: -6 },
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.3,
            then: [{ log: "{{They}} went alone. {{They}} came back with words like 'boundaries'.", kind: 'bad' }],
            else: [{ log: 'We muddled on without help. Some weeks were fine.' }],
          },
        ],
      },
      {
        id: 'trip',
        label: 'Suggest a holiday instead',
        hint: '{{$2500}}',
        effects: [
          { money: -2500 },
          { counter: 'vacations' },
          {
            chance: 0.45,
            then: [{ love: 8 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 6 }, { log: 'Sun, sleep, no phones. We remembered why we liked each other.', kind: 'good' }],
            else: [{ love: -4 }, { stat: 'happiness', delta: -3 }, { log: 'We argued on the beach, which is at least a nicer place to argue.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'book',
        label: 'Read a relationship book',
        hint: '{{$20}}',
        effects: [
          { money: -20 },
          {
            chance: 0.35,
            then: [{ love: 5 }, { relationship: 'person', delta: 5 }, { stat: 'smarts', delta: 1 }, { log: 'The book had three good ideas. We used two.' }],
            else: [{ love: -2 }, { log: 'I read it. {{They}} did not. The book now props up a table leg.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_big_fight',
    category: 'romance',
    title: 'The big one',
    text: "It started over dishes and ended over everything. {{person}} and I shouted things we didn't quite mean, and some we did. Now there's a silence so loud the neighbours can hear it.",
    minAge: 16,
    maxAge: 80,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['lover', 'spouse'] },
    choices: [
      {
        id: 'apologise',
        label: 'Apologise first',
        effects: [{ karma: 2 }, { love: 6 }, { relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 2 }, { log: 'I said sorry first. {{They}} said sorry second. The dishes stayed dirty, but we were fine.', kind: 'good' }],
      },
      {
        id: 'stand',
        label: 'Stand my ground',
        effects: [
          {
            chance: 0.4,
            then: [{ love: 3 }, { relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 4 }, { log: '{{They}} came around eventually and admitted I had a point.' }],
            else: [{ love: -10 }, { relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -4 }, { log: "We didn't speak for days. I was right, which turned out not to matter.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'night',
        label: 'Stay elsewhere tonight',
        effects: [
          { stat: 'happiness', delta: -3 },
          { love: -4 },
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 3 }, { log: 'A night apart cleared the air. We talked properly in the morning.' }],
            else: [{ love: -10 }, { log: '{{They}} took the night apart as a verdict. Things cooled after that.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'end',
        label: 'End it',
        effects: [
          { removePerson: true },
          { stat: 'happiness', delta: -10 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'It was over. Grief first, then a strange clean feeling.' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: "I ended it in anger and spent a long time wondering if I'd been wrong.", kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_surprise_trip',
    category: 'romance',
    title: 'Surprise trip',
    text: '{{person}} handed me a packed suitcase and two tickets. {{They}} has planned a whole long weekend away, and {{they}} is grinning like someone who has kept a secret for months.',
    minAge: 18,
    maxAge: 80,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['lover', 'spouse'] },
    choices: [
      {
        id: 'go',
        label: 'Go, obviously',
        effects: [
          { love: 10 },
          { relationship: 'person', delta: 8 },
          { stat: 'happiness', delta: 8 },
          { counter: 'vacations' },
          { jobPerformance: -2 },
          {
            chance: 0.15,
            then: [{ log: 'It rained the whole time. We did not care.', kind: 'good' }],
            else: [{ log: 'Four days of being somewhere else with my favourite person.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'work',
        label: "Can't, work is busy",
        conditions: [{ hasJob: true }],
        effects: [{ jobPerformance: 3 }, { love: -12 }, { relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -5 }, { log: '{{They}} unpacked the suitcase slowly. I got a lot done that weekend.', kind: 'bad' }],
      },
      {
        id: 'move',
        label: 'Ask to move it',
        effects: [
          { love: -3 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { counter: 'vacations' }, { log: 'We went the following month. It was lovely, slightly less surprising.' }],
            else: [{ love: -6 }, { log: "The booking couldn't be moved. {{They}} went with a friend instead.", kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_old_flame',
    category: 'romance',
    title: 'An old flame',
    text: "Someone I used to date messaged out of nowhere: 'Thinking of you. Coffee sometime?' I'm with {{person}} now, and happy, mostly. I read the message three times.",
    minAge: 18,
    maxAge: 70,
    weight: 0.8,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    person: { kind: ['lover', 'spouse'] },
    choices: [
      {
        id: 'delete',
        label: 'Delete the message',
        effects: [{ karma: 1 }, { love: 2 }, { stat: 'happiness', delta: -1 }, { log: 'I deleted it. Closed doors can stay closed.' }],
      },
      {
        id: 'polite',
        label: 'Reply politely, no coffee',
        effects: [
          { karma: 1 },
          {
            chance: 0.8,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'A kind reply, a kind reply back. That was all it needed to be.' }],
            else: [{ love: -5 }, { log: '{{person}} saw the reply over my shoulder. I had to explain a lot of nothing.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'secret',
        label: 'Meet for coffee secretly',
        effects: [
          { karma: -4 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.35,
            then: [{ love: -20 }, { relationship: 'person', delta: -15 }, { stat: 'happiness', delta: -8 }, { log: '{{person}} found out. It was only coffee, which is exactly what guilty people say.', kind: 'bad' }],
            else: [
              {
                chance: 0.3,
                then: [{ love: -10 }, { karma: -4 }, { log: "Coffee turned into something it shouldn't have. I carry that now.", kind: 'bad' }],
                else: [{ log: "Just coffee. We've both changed. I went home relieved." }],
              },
            ],
          },
        ],
      },
      {
        id: 'tell',
        label: 'Tell {{person}} about it',
        effects: [{ karma: 2 }, { love: 5 }, { relationship: 'person', delta: 5 }, { log: "I told {{person}}. {{They}} shrugged and said 'go if you want'. I didn't want to.", kind: 'good' }],
      },
    ],
  },
  {
    id: 'lf_partner_job_far',
    category: 'romance',
    title: 'A job far away',
    text: "{{person}} got a job offer in another city. Better money, better title, and a four-hour drive from everything we've built here. {{They}} wants to know what I think.",
    minAge: 20,
    maxAge: 60,
    weight: 0.7,
    cooldown: 6,
    conditions: [{ inPrison: false }],
    person: { kind: ['lover', 'spouse'], minRelationship: 40 },
    choices: [
      {
        id: 'quit_go',
        label: 'Quit and move with them',
        conditions: [{ hasJob: true }],
        effects: [
          { loseJob: true, reason: 'left' },
          { love: 15 },
          { relationship: 'person', delta: 10 },
          { log: 'I quit my job and we moved together. New city, new everything.', kind: 'milestone' },
          {
            chance: 0.6,
            then: [{ money: 3000 }, { stat: 'happiness', delta: 6 }, { log: "{{their}} new salary made the first months easy.", kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: "Finding my feet in the new city took longer than I'd hoped." }],
          },
        ],
      },
      {
        id: 'free_go',
        label: 'Move with them',
        conditions: [{ hasJob: false }],
        effects: [{ love: 12 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 4 }, { log: 'We moved together. I had nothing holding me here but boxes.', kind: 'milestone' }],
      },
      {
        id: 'distance',
        label: 'Try long distance',
        effects: [
          {
            chance: 0.45,
            then: [{ love: -5 }, { stat: 'happiness', delta: 2 }, { log: 'Weekends on the motorway. It held, barely, and then {{they}} came home.' }],
            else: [{ love: -20 }, { removePerson: true }, { stat: 'happiness', delta: -8 }, { log: 'Long distance did what long distance does. We ended it over a bad phone line.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'stay',
        label: 'Ask them to turn it down',
        effects: [
          {
            chance: 0.55,
            then: [{ love: -6 }, { relationship: 'person', delta: -4 }, { stat: 'happiness', delta: 3 }, { log: "{{They}} turned it down. {{They}} says {{they}} doesn't resent it. I check sometimes." }],
            else: [
              { love: -15 },
              { relationship: 'person', delta: -10 },
              {
                chance: 0.5,
                then: [{ removePerson: true }, { log: '{{They}} took the job anyway, and {{they}} went alone.', kind: 'bad' }],
                else: [{ log: '{{They}} stayed, and reminded me of it for a long time.', kind: 'bad' }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_partner_secret_debt',
    category: 'romance',
    title: 'Hidden debt',
    text: 'A final notice arrived addressed to {{person}}. {{They}} finally admitted {{they}} has been hiding thousands in credit card debt for years, paying one card with another.',
    minAge: 22,
    maxAge: 75,
    weight: 0.7,
    cooldown: 6,
    conditions: [{ inPrison: false }],
    person: { kind: ['spouse'] },
    choices: [
      {
        id: 'pay',
        label: 'Pay it off together',
        hint: '{{$6000}}',
        conditions: [{ money: { gte: 6000 } }],
        effects: [{ money: -6000 }, { love: 10 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: -2 }, { karma: 2 }, { log: 'We cleared it. Painful, but we did it as a team.', kind: 'money' }],
      },
      {
        id: 'plan',
        label: 'Make them a repayment plan',
        effects: [
          { love: -2 },
          { relationship: 'person', delta: 3 },
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.6,
            then: [{ log: 'A spreadsheet, a budget, and eighteen months of discipline. {{They}} did it.', kind: 'good' }],
            else: [{ love: -8 }, { stat: 'happiness', delta: -4 }, { log: 'The plan lasted two months. The cards came back.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'temper',
        label: 'Lose my temper',
        effects: [
          { love: -10 },
          { relationship: 'person', delta: -8 },
          { stat: 'happiness', delta: -3 },
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ log: "{{They}} cried. Then {{they}} got a second job. We don't talk about that night." }],
            else: [{ love: -8 }, { log: 'The row about money became a row about trust. That one lasted.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'separate',
        label: 'Separate our finances',
        effects: [{ love: -5 }, { relationship: 'person', delta: -2 }, { stat: 'happiness', delta: 2 }, { log: 'Separate accounts from now on. Less romance, more sleep.' }],
      },
    ],
  },
  {
    id: 'lf_partner_falls_ill',
    category: 'romance',
    title: 'Sick days',
    text: '{{person}} came down with something nasty and ended up in bed for weeks. Soup, prescriptions, worry, and a lot of daytime television. {{They}} needs me.',
    minAge: 18,
    maxAge: 85,
    weight: 0.9,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['lover', 'spouse'] },
    choices: [
      {
        id: 'nurse',
        label: 'Nurse them back to health',
        effects: [
          { love: 12 },
          { relationship: 'person', delta: 10 },
          { karma: 3 },
          { stat: 'happiness', delta: -2 },
          { jobPerformance: -3 },
          {
            chance: 0.2,
            then: [{ illness: 'flu' }, { log: 'I caught it too. We recovered side by side, miserably.', kind: 'bad' }],
            else: [{ log: '{{They}} pulled through, and {{they}} says I was unbearable about the soup.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'hire',
        label: 'Hire a home nurse',
        hint: '{{$2000}}',
        effects: [{ money: -2000 }, { love: 6 }, { relationship: 'person', delta: 4 }, { log: '{{They}} got better; I got to keep my job. The nurse got a very good review.' }],
      },
      {
        id: 'minimum',
        label: 'Do the minimum',
        effects: [{ love: -10 }, { relationship: 'person', delta: -8 }, { karma: -3 }, { stat: 'happiness', delta: 1 }, { log: 'I did what I had to and not much more. {{They}} noticed. {{They}} remembers.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'lf_in_laws_stay',
    category: 'romance',
    title: 'The in-laws',
    text: "{{person}}'s parents are coming to stay. For two weeks. They have strong views on how I load the dishwasher, raise my voice, and exist generally.",
    minAge: 22,
    maxAge: 75,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['spouse'] },
    choices: [
      {
        id: 'host',
        label: 'Host them graciously',
        effects: [{ karma: 3 }, { love: 8 }, { relationship: 'person', delta: 5 }, { stat: 'happiness', delta: -4 }, { log: 'Two weeks. I smiled through all of it. {{person}} owes me, and knows it.', kind: 'good' }],
      },
      {
        id: 'hotel',
        label: 'Book them a hotel',
        hint: '{{$1400}}',
        effects: [
          { money: -1400 },
          {
            chance: 0.6,
            then: [{ love: 4 }, { stat: 'happiness', delta: 3 }, { log: "They enjoyed the hotel breakfast more than they'd have enjoyed mine." }],
            else: [{ love: -6 }, { relationship: 'person', delta: -3 }, { log: "{{their}} mother took the hotel as an insult. It was, slightly.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'escape',
        label: 'Work late every night',
        conditions: [{ hasJob: true }],
        effects: [{ jobPerformance: 4 }, { love: -8 }, { relationship: 'person', delta: -5 }, { log: "I 'worked late' for two weeks. {{person}} faced {{their}} parents alone and will not forget it.", kind: 'bad' }],
      },
      {
        id: 'charm',
        label: 'Win them over',
        effects: [
          {
            chance: 0.5,
            then: [{ love: 10 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 5 }, { log: "By day ten {{their}} father called me 'kid' in a warm way. I'll take it.", kind: 'good' }],
            else: [{ stat: 'happiness', delta: -5 }, { love: 2 }, { log: 'I tried. {{their}} mother remained a closed door with a lovely doormat.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_money_argument',
    category: 'romance',
    title: 'Money talk',
    text: 'The account is nearly empty again and {{person}} has questions about where it went. I have questions about {{their}} questions. The kitchen has become a courtroom.',
    minAge: 20,
    maxAge: 75,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ inPrison: false }, { money: { lte: 2500 } }],
    person: { kind: ['spouse'] },
    choices: [
      {
        id: 'budget',
        label: 'Sit down and budget',
        effects: [
          { stat: 'smarts', delta: 1 },
          { love: 4 },
          { relationship: 'person', delta: 4 },
          { stat: 'happiness', delta: -1 },
          {
            chance: 0.6,
            then: [{ money: 400 }, { log: 'A budget. We stuck to it, roughly. The account breathed.', kind: 'good' }],
            else: [{ log: 'The budget was beautiful. We ignored it by Thursday.' }],
          },
        ],
      },
      {
        id: 'blame',
        label: 'Blame their spending',
        effects: [
          { karma: -2 },
          {
            chance: 0.4,
            then: [{ love: -3 }, { log: '{{They}} admitted the shoes were a lot. I admitted the gadgets were too.' }],
            else: [{ love: -10 }, { relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -4 }, { log: 'That went about as well as blame usually goes.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'extra',
        label: 'Pick up extra work',
        effects: [{ money: 800 }, { stat: 'happiness', delta: -4 }, { stat: 'health', delta: -2 }, { love: 3 }, { log: 'Extra shifts and late nights. The account recovered; my knees did not.', kind: 'money' }],
      },
      {
        id: 'deflect',
        label: 'Change the subject',
        effects: [{ love: -5 }, { relationship: 'person', delta: -3 }, { stat: 'happiness', delta: 1 }, { log: 'We talked about the weather. The account did not improve.' }],
      },
    ],
  },
  {
    id: 'lf_renew_vows',
    category: 'romance',
    title: 'Renewing vows',
    text: '{{person}} suggested we renew our vows. Nothing fancy, {{they}} said, which in my experience is the opening bid in a very fancy negotiation.',
    minAge: 45,
    maxAge: 90,
    weight: 0.5,
    once: true,
    conditions: [{ inPrison: false }],
    person: { kind: ['spouse'], minRelationship: 55 },
    choices: [
      {
        id: 'big',
        label: 'Throw a proper celebration',
        hint: '{{$8000}}',
        conditions: [{ money: { gte: 8000 } }],
        effects: [
          { money: -8000 },
          { love: 15 },
          { relationship: 'person', delta: 12 },
          { stat: 'happiness', delta: 10 },
          { relationship: 'child', delta: 5 },
          { log: 'We renewed our vows in front of everyone we love. {{person}} cried first this time.', kind: 'milestone' },
        ],
      },
      {
        id: 'small',
        label: 'Something small and quiet',
        hint: '{{$500}}',
        effects: [{ money: -500 }, { love: 10 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 6 }, { log: 'Just us and a few people under a tree. It was perfect.', kind: 'good' }],
      },
      {
        id: 'decline',
        label: 'Once was enough',
        effects: [
          { love: -6 },
          { relationship: 'person', delta: -3 },
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.5,
            then: [{ log: '{{They}} laughed and agreed. The first time was plenty.' }],
            else: [{ love: -6 }, { log: "{{They}} was quiet about it for a while. I'd misjudged how much it meant.", kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_love_note',
    category: 'romance',
    title: 'A little note',
    text: 'I found a note from {{person}} tucked into my coat pocket. Three words and a badly drawn heart. {{They}} must have written it days ago and said nothing.',
    minAge: 16,
    maxAge: 100,
    weight: 1.5,
    cooldown: 2,
    person: { kind: ['lover', 'spouse'] },
    choices: [
      {
        id: 'reply',
        label: 'Write one back',
        effects: [{ love: 5 }, { relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 3 }, { log: "I left one in {{their}} shoe. The campaign of notes has begun.", kind: 'good' }],
      },
      {
        id: 'keep',
        label: 'Keep it forever',
        effects: [{ stat: 'happiness', delta: 4 }, { love: 2 }, { log: 'The note lives in my wallet now.' }],
      },
      {
        id: 'gift',
        label: 'Surprise them with a gift',
        hint: '{{$120}}',
        effects: [{ money: -120 }, { love: 7 }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 2 }, { counter: 'giftsGiven' }, { log: 'A note deserves a reply. Mine came gift-wrapped.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'lf_baby_talk',
    category: 'romance',
    title: 'The baby talk',
    text: "{{person}} put down {{their}} fork and said the words: 'I think I'm ready for a baby.' {{They}} has been waiting for me to bring it up. I have been waiting for {{them}}.",
    minAge: 24,
    maxAge: 40,
    weight: 0.8,
    cooldown: 4,
    conditions: [{ inPrison: false }, { hasChildren: false }],
    person: { kind: ['spouse'] },
    choices: [
      {
        id: 'try',
        label: "Let's try",
        effects: [
          { love: 8 },
          { relationship: 'person', delta: 6 },
          {
            chance: 0.55,
            then: [{ stat: 'happiness', delta: 12 }, { newPerson: { kind: 'child', relationship: 80, log: '{{person}} was born. Tiny, loud, and ours.' } }],
            else: [{ stat: 'happiness', delta: -2 }, { log: "We tried all year. No luck yet, but we're not done hoping." }],
          },
        ],
      },
      {
        id: 'later',
        label: 'Not yet',
        effects: [{ love: -6 }, { relationship: 'person', delta: -3 }, { stat: 'happiness', delta: 1 }, { log: '{{They}} nodded and went quiet. The subject will come back.' }],
      },
      {
        id: 'never',
        label: "I don't want children",
        effects: [
          { love: -15 },
          { relationship: 'person', delta: -10 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.3,
            then: [{ removePerson: true }, { stat: 'happiness', delta: -10 }, { log: "It was the one thing we couldn't compromise on. We parted, kindly, eventually.", kind: 'bad' }],
            else: [{ log: "{{They}} took it hard. We're still together, and the question hangs there." }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ single life
  {
    id: 'lf_coworker_asks_out',
    category: 'romance',
    title: 'Asked out',
    text: "A coworker from {{company}} lingered by my desk after everyone left and asked, with alarming sincerity, if I'd like to get dinner sometime. Not a work dinner.",
    minAge: 18,
    maxAge: 65,
    weight: 1,
    cooldown: 3,
    conditions: [{ hasJob: true }, { hasLover: false }, { inPrison: false }],
    choices: [
      {
        id: 'yes',
        label: 'Say yes',
        effects: [
          {
            chance: 0.65,
            then: [{ stat: 'happiness', delta: 6 }, { newPerson: { kind: 'lover', relationship: 60, log: 'Dinner went well. {{person}} and I are now a thing, and the office knows.' } }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'Dinner was fine. The second one never happened. Mondays got weird.' }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Politely decline',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: 1 }, { log: 'I said no kindly. We nod in the kitchen now, which is manageable.' }],
      },
      {
        id: 'hr',
        label: 'Report it to HR',
        effects: [
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -3 }, { log: 'HR had a quiet word. It was handled. The office took sides anyway.' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: "HR said a dinner invitation isn't a crime. I looked slightly dramatic.", kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_blind_date',
    category: 'romance',
    title: 'Blind date',
    text: "A friend set me up on a blind date. All I know is a name, a restaurant, and the phrase 'you'll either love them or have a great story'.",
    minAge: 18,
    maxAge: 70,
    weight: 1.2,
    cooldown: 2,
    conditions: [{ hasLover: false }, { inPrison: false }],
    choices: [
      {
        id: 'go',
        label: 'Go',
        hint: '{{$80}}',
        effects: [
          { money: -80 },
          {
            random: [
              { weight: 45, effects: [{ stat: 'happiness', delta: 6 }, { newPerson: { kind: 'lover', relationship: 58, log: '{{person}} turned out to be lovely. Second date booked before dessert.' } }] },
              { weight: 40, effects: [{ stat: 'happiness', delta: 1 }, { log: 'A pleasant evening and no spark. We shook hands, which says it all.' }] },
              { weight: 15, effects: [{ stat: 'happiness', delta: -3 }, { log: 'Great story. They talked about their ex for ninety minutes and ordered for me.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'cancel',
        label: 'Cancel last minute',
        effects: [{ karma: -1 }, { stat: 'happiness', delta: 1 }, { log: 'I stayed in. My friend called me a coward, affectionately.' }],
      },
      {
        id: 'group',
        label: 'Make it a group thing',
        effects: [
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.3,
            then: [{ newPerson: { kind: 'friend', relationship: 55, log: 'No romance, but I made a new friend, {{person}}, who was not my date.' } }],
            else: [{ log: 'Safer in numbers. Nobody fell in love, everyone ate well.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_school_dance',
    category: 'romance',
    title: 'The school dance',
    text: 'Someone in my year asked me to the end-of-year dance, in front of their friends, holding a single supermarket rose. The whole corridor stopped to watch my face.',
    minAge: 16,
    maxAge: 18,
    weight: 1.5,
    once: true,
    conditions: [{ enrolled: true }, { hasLover: false }, { inPrison: false }],
    choices: [
      {
        id: 'yes',
        label: 'Say yes',
        effects: [
          { stat: 'happiness', delta: 5 },
          {
            chance: 0.6,
            then: [{ newPerson: { kind: 'lover', relationship: 60, log: "After the dance, {{person}} and I kept talking. Now we're together." } }],
            else: [{ stat: 'happiness', delta: 2 }, { log: 'The dance was fun. We stayed friends, which is its own kind of nice.' }],
          },
        ],
      },
      {
        id: 'no',
        label: 'Say no gently',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: -1 }, { log: 'I said no as kindly as I could. The rose went to someone else.' }],
      },
      {
        id: 'friends',
        label: 'Go with friends instead',
        effects: [{ stat: 'happiness', delta: 4 }, { relationship: 'friend', delta: 3 }, { log: 'I went with my friends. We danced badly and loudly.', kind: 'good' }],
      },
    ],
  },

  // ------------------------------------------------------------ pregnancy
  {
    id: 'lf_pregnancy_news',
    category: 'romance',
    title: 'Expecting a baby',
    text: "After weeks of wondering, it's confirmed: {{person}} and I are having a baby. {{They}} laughed, then cried, then laughed again. I did roughly the same, in a different order.",
    minAge: 20,
    maxAge: 42,
    weight: 0.8,
    cooldown: 3,
    conditions: [{ hasLover: true }, { inPrison: false }],
    person: { kind: ['lover', 'spouse'] },
    choices: [
      {
        id: 'celebrate',
        label: 'Tell everyone',
        hint: '{{$400}}',
        effects: [
          { money: -400 },
          { love: 10 },
          { relationship: 'person', delta: 8 },
          { stat: 'happiness', delta: 8 },
          { relationship: 'mother', delta: 4 },
          { relationship: 'father', delta: 4 },
          { log: 'We told everyone. The grandparents-to-be started knitting within the hour.', kind: 'good' },
          {
            random: [
              { weight: 92, effects: [{ newPerson: { kind: 'child', relationship: 80, log: '{{person}} was born. Small, loud, perfect.' } }] },
              {
                weight: 8,
                effects: [
                  { newPerson: { kind: 'child', relationship: 80, log: '{{person}} arrived first, and then the midwife said "hang on".' } },
                  { newPerson: { kind: 'child', relationship: 80, log: '{{person}} arrived four minutes later. Twins. Nobody had mentioned twins.' } },
                  { stat: 'happiness', delta: 4 },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'prepare',
        label: 'Quietly prepare',
        hint: '{{$1500}}',
        effects: [
          { money: -1500 },
          { love: 6 },
          { relationship: 'person', delta: 5 },
          { stat: 'happiness', delta: 4 },
          { stat: 'smarts', delta: 1 },
          { log: "A nursery, a car seat, and forty books I didn't finish." },
          {
            random: [
              { weight: 92, effects: [{ newPerson: { kind: 'child', relationship: 82, log: '{{person}} was born into the most prepared household in {{city}}.' } }] },
              {
                weight: 8,
                effects: [
                  { newPerson: { kind: 'child', relationship: 80, log: '{{person}} arrived first.' } },
                  { newPerson: { kind: 'child', relationship: 80, log: '{{person}} arrived minutes later. Twins. We needed a second car seat.' } },
                  { money: -300 },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'panic',
        label: 'Panic a little',
        effects: [
          { stat: 'happiness', delta: -3 },
          { love: 2 },
          { log: 'I panicked for a month. {{person}} was patient, then less patient.' },
          {
            random: [
              { weight: 92, effects: [{ newPerson: { kind: 'child', relationship: 75, log: '{{person}} was born. The panic became something more organised.' } }] },
              {
                weight: 8,
                effects: [
                  { newPerson: { kind: 'child', relationship: 75, log: '{{person}} arrived first.' } },
                  { newPerson: { kind: 'child', relationship: 75, log: 'Then {{person}}. Twins. The panic doubled, and so did everything else.' } },
                ],
              },
            ],
          },
          { stat: 'happiness', delta: 8 },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ children
  {
    id: 'lf_child_school_trouble',
    category: 'romance',
    title: 'Called to school',
    text: "The school called. {{person}} got into a fight at lunch and the other kid's parents are furious. The principal would like to see me 'at my earliest convenience', which means now.",
    minAge: 22,
    maxAge: 70,
    weight: 1.2,
    cooldown: 3,
    person: { kind: ['child'], minAge: 6, maxAge: 17 },
    choices: [
      {
        id: 'listen',
        label: 'Hear their side first',
        effects: [
          { karma: 2 },
          { relationship: 'person', delta: 6 },
          {
            chance: 0.6,
            then: [{ log: '{{They}} was sticking up for a smaller kid. I was quietly proud and said so.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { log: '{{They}} started it. We had a long talk about words versus fists.' }],
          },
        ],
      },
      {
        id: 'ground',
        label: 'Ground them',
        effects: [
          { relationship: 'person', delta: -6 },
          {
            chance: 0.5,
            then: [{ log: '{{They}} sulked for a week and then, oddly, behaved.' }],
            else: [{ relationship: 'person', delta: -4 }, { log: 'Grounding made {{them}} angrier. More calls followed.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'defend',
        label: 'Defend them to the principal',
        effects: [
          { karma: -1 },
          { relationship: 'person', delta: 8 },
          {
            chance: 0.5,
            then: [{ log: "The principal backed down. {{person}} thinks I'm a hero, which is dangerous." }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The principal was not impressed. {{person}} got suspended anyway, and I looked foolish.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'pay',
        label: 'Apologise and offer to pay',
        hint: '{{$300}}',
        effects: [{ money: -300 }, { karma: 2 }, { relationship: 'person', delta: -2 }, { log: "I paid for the other kid's glasses. {{person}} wrote an apology under protest." }],
      },
    ],
  },
  {
    id: 'lf_child_comes_out',
    category: 'romance',
    title: 'Something to tell me',
    text: '{{person}} asked to talk, and {{their}} hands were shaking. {{They}} told me {{they}} is gay, and that {{they}} has been scared to say it for years. {{They}} is watching my face.',
    minAge: 30,
    maxAge: 90,
    weight: 0.7,
    once: true,
    person: { kind: ['child'], minAge: 14 },
    choices: [
      {
        id: 'hug',
        label: 'Hug them',
        effects: [{ relationship: 'person', delta: 15 }, { stat: 'happiness', delta: 6 }, { karma: 3 }, { log: 'I hugged {{them}} and said I love {{them}}, and that nothing changes. {{They}} cried with relief.', kind: 'good' }],
      },
      {
        id: 'proud',
        label: "Tell them I'm proud",
        effects: [{ relationship: 'person', delta: 12 }, { stat: 'happiness', delta: 5 }, { karma: 3 }, { log: "I told {{them}} I was proud of {{their}} courage. {{They}} said 'that's it?'. That's it.", kind: 'good' }],
      },
      {
        id: 'support',
        label: 'Ask how I can support them',
        effects: [{ relationship: 'person', delta: 10 }, { stat: 'happiness', delta: 4 }, { karma: 4 }, { stat: 'smarts', delta: 1 }, { log: 'We talked for hours. {{They}} asked me to be patient with the grandparents. I will be.', kind: 'good' }],
      },
      {
        id: 'dinner',
        label: 'Celebrate with dinner out',
        hint: '{{$150}}',
        effects: [{ money: -150 }, { relationship: 'person', delta: 12 }, { stat: 'happiness', delta: 7 }, { karma: 2 }, { log: "Dinner at {{their}} favourite place. {{They}} ordered dessert first. Why not.", kind: 'good' }],
      },
    ],
  },
  {
    id: 'lf_teen_wants_car',
    category: 'romance',
    title: 'The car question',
    text: "{{person}} has made a presentation. Slides, a budget, and a title: 'Why I need a car'. {{They}} says all {{their}} friends have one, which is statistically unlikely.",
    minAge: 32,
    maxAge: 70,
    weight: 1,
    cooldown: 4,
    person: { kind: ['child'], minAge: 16, maxAge: 19 },
    choices: [
      {
        id: 'decent',
        label: 'Buy them a decent car',
        hint: '{{$9000}}',
        conditions: [{ money: { gte: 9000 } }],
        effects: [
          { money: -9000 },
          { relationship: 'person', delta: 15 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.15,
            then: [{ money: -800 }, { log: '{{They}} dented it within a month. Nobody hurt. The insurance letter was less forgiving.', kind: 'bad' }],
            else: [{ log: "{{They}} drove it carefully for about a week, then normally. It's fine.", kind: 'good' }],
          },
        ],
      },
      {
        id: 'banger',
        label: 'Buy an old banger',
        hint: '{{$2000}}',
        conditions: [{ money: { gte: 2000 } }],
        effects: [
          { money: -2000 },
          { relationship: 'person', delta: 8 },
          {
            chance: 0.4,
            then: [{ log: 'The old car wheezed but ran. {{They}} named it. I did not approve of the name.' }],
            else: [{ money: -300 }, { log: 'The banger died in three months. {{They}} learned about mechanics, and the bus.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'earn',
        label: 'Make them earn half',
        effects: [
          { relationship: 'person', delta: 3 },
          { stat: 'smarts', delta: 1 },
          { karma: 1 },
          {
            chance: 0.5,
            then: [{ money: -2500 }, { log: '{{They}} worked weekends and saved. We split a car. {{They}} loves it twice as much.', kind: 'good' }],
            else: [{ log: '{{They}} lost interest in work after two months. No car. Lesson learned, possibly.' }],
          },
        ],
      },
      {
        id: 'no',
        label: 'No',
        effects: [{ relationship: 'person', delta: -8 }, { stat: 'happiness', delta: 1 }, { log: 'I said no. The presentation was good though. I told {{them}} that.' }],
      },
    ],
  },
  {
    id: 'lf_child_moves_out',
    category: 'romance',
    title: 'Flying the nest',
    text: "{{person}} announced {{they}} is moving out. Boxes already, a flat already, a roommate I've never met already. The house is about to get very quiet.",
    minAge: 36,
    maxAge: 80,
    weight: 1,
    cooldown: 3,
    person: { kind: ['child'], minAge: 18, maxAge: 30 },
    choices: [
      {
        id: 'deposit',
        label: 'Help with the deposit',
        hint: '{{$1500}}',
        conditions: [{ money: { gte: 1500 } }],
        effects: [{ money: -1500 }, { relationship: 'person', delta: 10 }, { karma: 2 }, { stat: 'happiness', delta: -2 }, { log: 'I paid the deposit. {{They}} promised to visit, and does, mostly when hungry.', kind: 'good' }],
      },
      {
        id: 'bless',
        label: 'Send them off with love',
        effects: [
          { relationship: 'person', delta: 5 },
          { stat: 'happiness', delta: -3 },
          { karma: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'The quiet was strange, then nice. We talk every Sunday.' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The quiet was just quiet. I miss the noise.' }],
          },
        ],
      },
      {
        id: 'rent',
        label: 'Offer to let them stay cheaply',
        effects: [
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: 4 }, { money: 1200 }, { stat: 'happiness', delta: 2 }, { log: '{{They}} stayed, paid a bit of rent, and did {{their}} own laundry. Civilised.', kind: 'money' }],
            else: [{ relationship: 'person', delta: -4 }, { log: '{{They}} said no thanks, kindly, and left anyway. Fair enough.' }],
          },
        ],
      },
      {
        id: 'guilt',
        label: 'Guilt-trip them into staying',
        effects: [
          { karma: -3 },
          { relationship: 'person', delta: -8 },
          {
            chance: 0.5,
            then: [{ log: '{{They}} stayed, resentfully. The house is full and tense.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: '{{They}} left anyway and calls less now.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_child_talent',
    category: 'romance',
    title: 'A hidden talent',
    text: "{{person}}'s teacher pulled me aside. Apparently {{they}} has real talent for music and should get proper lessons. {{They}} has never mentioned this. {{They}} shrugs when asked.",
    minAge: 24,
    maxAge: 60,
    weight: 1,
    cooldown: 4,
    person: { kind: ['child'], minAge: 6, maxAge: 14 },
    choices: [
      {
        id: 'lessons',
        label: 'Pay for lessons',
        hint: '{{$1200}}',
        conditions: [{ money: { gte: 1200 } }],
        effects: [
          { money: -1200 },
          { relationship: 'person', delta: 8 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'Two years later {{they}} played a recital and I cried in the second row.', kind: 'good' }],
            else: [{ log: '{{They}} quit after a year. The instrument lives under the bed. Oh well.' }],
          },
        ],
      },
      {
        id: 'home',
        label: 'Encourage it at home',
        effects: [
          { relationship: 'person', delta: 5 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.3,
            then: [{ log: 'Online tutorials and patience. {{They}} got genuinely good.', kind: 'good' }],
            else: [{ log: 'Without lessons it stayed a hobby. A happy one.' }],
          },
        ],
      },
      {
        id: 'push',
        label: 'Push them hard',
        effects: [
          { relationship: 'person', delta: -6 },
          { karma: -2 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'Pressure worked, sort of. {{They}} is excellent and slightly resentful.' }],
            else: [{ relationship: 'person', delta: -5 }, { log: '{{They}} stopped playing entirely. I pushed the talent right out of {{them}}.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_child_wedding',
    category: 'romance',
    title: 'Wedding bells',
    text: '{{person}} is getting married. {{They}} told me over the phone, breathless, and then asked, slightly less breathless, whether I could help with the costs.',
    minAge: 42,
    maxAge: 95,
    weight: 0.8,
    cooldown: 4,
    person: { kind: ['child'], minAge: 22 },
    choices: [
      {
        id: 'big',
        label: 'Pay for a big wedding',
        hint: '{{$15000}}',
        conditions: [{ money: { gte: 15000 } }],
        effects: [{ money: -15000 }, { relationship: 'person', delta: 15 }, { stat: 'happiness', delta: 8 }, { karma: 2 }, { log: 'I paid for the wedding. It was enormous, beautiful, and {{person}} hugged me for a full minute.', kind: 'milestone' }],
      },
      {
        id: 'some',
        label: 'Contribute what I can',
        hint: '{{$3000}}',
        conditions: [{ money: { gte: 3000 } }],
        effects: [{ money: -3000 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 5 }, { log: "I chipped in. The wedding was lovely and {{they}} didn't need the rest.", kind: 'good' }],
      },
      {
        id: 'speech',
        label: 'Just give a speech',
        effects: [
          { relationship: 'person', delta: 3 },
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.6,
            then: [{ log: 'My speech got laughs in the right places. {{person}} says I peaked there.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: "My speech was long. {{person}}'s new in-laws checked their watches, politely." }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_grandparent_news',
    category: 'romance',
    title: 'Grandparent news',
    text: "{{person}} called with news: I'm going to be a grandparent. {{They}} sounded terrified and thrilled, which I remember exactly. I had to sit down.",
    minAge: 42,
    maxAge: 95,
    weight: 0.7,
    cooldown: 3,
    person: { kind: ['child'], minAge: 22 },
    choices: [
      {
        id: 'thrilled',
        label: 'Be thrilled',
        effects: [{ stat: 'happiness', delta: 10 }, { relationship: 'person', delta: 8 }, { log: 'A grandchild. I bought a tiny jumper the same afternoon.', kind: 'milestone' }],
      },
      {
        id: 'help',
        label: 'Offer to help with the baby',
        effects: [{ stat: 'happiness', delta: 6 }, { relationship: 'person', delta: 12 }, { karma: 2 }, { stat: 'health', delta: -2 }, { log: "I'm on babysitting duty every Thursday. I'm exhausted and delighted.", kind: 'good' }],
      },
      {
        id: 'advice',
        label: 'Offer a lot of advice',
        effects: [
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: 3 }, { log: '{{They}} took the advice and even thanked me for some of it.' }],
            else: [{ relationship: 'person', delta: -5 }, { log: '{{They}} asked me, gently, to stop. The second time was less gentle.', kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ parents and siblings
  {
    id: 'lf_sibling_loan',
    category: 'romance',
    title: 'Family loan',
    text: '{{person}} called with the voice {{they}} uses for favours. {{They}} needs {{$2000}} to cover rent and promises, hand on heart, to pay me back by spring.',
    minAge: 18,
    maxAge: 80,
    weight: 1,
    cooldown: 3,
    conditions: [{ money: { gte: 2000 } }, { inPrison: false }],
    person: { kind: ['sibling'] },
    choices: [
      {
        id: 'lend',
        label: 'Lend it',
        hint: '{{$2000}}',
        effects: [
          { money: -2000 },
          { relationship: 'person', delta: 6 },
          { karma: 2 },
          {
            chance: 0.5,
            then: [{ money: 2000 }, { log: "{{They}} paid it back by spring, with a cake. I'd forgotten about it.", kind: 'good' }],
            else: [
              {
                chance: 0.5,
                then: [{ money: 1000 }, { log: 'Half of it came back, eventually. Spring was a loose term.' }],
                else: [{ relationship: 'person', delta: -4 }, { log: "I never saw the money again. We both pretend it didn't happen.", kind: 'bad' }],
              },
            ],
          },
        ],
      },
      {
        id: 'gift',
        label: 'Give it, no strings',
        hint: '{{$2000}}',
        effects: [{ money: -2000 }, { relationship: 'person', delta: 10 }, { karma: 4 }, { stat: 'happiness', delta: 2 }, { log: 'I told {{them}} to keep it. {{They}} cried, which was not the plan.', kind: 'good' }],
      },
      {
        id: 'refuse',
        label: 'Say no',
        effects: [
          { relationship: 'person', delta: -8 },
          { karma: -1 },
          { stat: 'happiness', delta: -1 },
          {
            chance: 0.3,
            then: [{ log: "{{They}} got evicted and is sleeping on a friend's sofa. {{They}} blames me, a bit.", kind: 'bad' }],
            else: [{ log: '{{They}} found the money elsewhere. Things stayed cool for a while.' }],
          },
        ],
      },
      {
        id: 'interest',
        label: 'Lend it with interest',
        hint: '{{$2000}}',
        effects: [
          { money: -2000 },
          { karma: -2 },
          { relationship: 'person', delta: -2 },
          {
            chance: 0.6,
            then: [{ money: 2300 }, { log: "{{They}} paid back with interest and has called me 'the bank' at every family dinner since.", kind: 'money' }],
            else: [{ relationship: 'person', delta: -4 }, { log: "Neither the loan nor the interest came back. The nickname 'the bank' did.", kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_sibling_dents_car',
    category: 'romance',
    title: 'The borrowed car',
    text: "{{person}} borrowed my car 'for an hour' and brought it back with a dent the size of a dinner plate and a story involving a shopping trolley.",
    minAge: 18,
    maxAge: 80,
    weight: 0.8,
    cooldown: 4,
    conditions: [{ ownsAsset: 'car' }],
    person: { kind: ['sibling'] },
    choices: [
      {
        id: 'bill',
        label: 'Make them pay',
        effects: [
          { asset: 'damage', kind: 'car', amount: 15 },
          {
            chance: 0.6,
            then: [{ money: 600 }, { relationship: 'person', delta: -4 }, { log: '{{They}} paid up, grumbling. The dent is still there; I kept the money.', kind: 'money' }],
            else: [{ relationship: 'person', delta: -10 }, { log: "{{They}} said the trolley should pay. We're not speaking.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'forgive',
        label: 'Let it go',
        effects: [{ asset: 'damage', kind: 'car', amount: 15 }, { karma: 3 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: -2 }, { log: "A dent is a dent. {{They}} owes me one, and I'll collect eventually." }],
      },
      {
        id: 'fix',
        label: 'Fix it and say nothing',
        hint: '{{$500}}',
        effects: [{ money: -500 }, { karma: 2 }, { relationship: 'person', delta: 3 }, { log: 'I fixed it quietly. {{They}} thinks {{they}} got away with it. Let {{them}}.' }],
      },
      {
        id: 'ban',
        label: 'Ban them from my car',
        effects: [{ asset: 'damage', kind: 'car', amount: 15 }, { relationship: 'person', delta: -3 }, { stat: 'happiness', delta: 1 }, { log: 'The car is now off limits. {{They}} called me dramatic, from the bus.' }],
      },
    ],
  },
  {
    id: 'lf_family_reunion',
    category: 'romance',
    title: 'Family reunion',
    text: "{{person}} is organising a family reunion. Cousins I've never heard of, a rented hall, and a potluck table where every dish will be judged. Attendance is 'strongly expected'.",
    minAge: 20,
    maxAge: 90,
    weight: 0.8,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    person: { kind: ['sibling'] },
    choices: [
      {
        id: 'go',
        label: 'Go and bring a dish',
        hint: '{{$60}}',
        effects: [
          { money: -60 },
          { relationship: 'person', delta: 6 },
          { relationship: 'mother', delta: 3 },
          { relationship: 'father', delta: 3 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.7,
            then: [{ log: "My dish was declared 'interesting'. I saw cousins, hugged aunts, ate too much.", kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I was cornered by an uncle for an hour about drainage. Still worth it.' }],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Skip it',
        effects: [{ relationship: 'person', delta: -6 }, { stat: 'happiness', delta: 2 }, { karma: -1 }, { log: 'I stayed home. The group chat has photos and pointed captions.' }],
      },
      {
        id: 'host',
        label: 'Offer to host next year',
        hint: '{{$400}}',
        effects: [{ money: -400 }, { relationship: 'person', delta: 10 }, { karma: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I volunteered to host next year. {{person}} looked relieved. I looked worried.' }],
      },
    ],
  },
  {
    id: 'lf_mother_remarries',
    category: 'romance',
    title: "Mum's new husband",
    text: '{{person}} rang to say she is getting married again. He is a retired dentist with a boat and a laugh you can hear from the car park. She sounds happy. She wants my blessing.',
    minAge: 16,
    maxAge: 80,
    weight: 0.6,
    once: true,
    conditions: [{ noPerson: ['father'] }, { noPerson: ['stepfather'] }],
    person: { kind: ['mother'] },
    choices: [
      {
        id: 'bless',
        label: 'Give my blessing',
        effects: [
          { relationship: 'person', delta: 10 },
          { karma: 3 },
          { stat: 'happiness', delta: 3 },
          { newPerson: { kind: 'stepfather', relationship: 50, gender: 'male', minAge: 50, maxAge: 75, log: 'I welcomed {{person}} into the family, boat and all.' } },
        ],
      },
      {
        id: 'along',
        label: 'Go along with it',
        effects: [
          { relationship: 'person', delta: 3 },
          { newPerson: { kind: 'stepfather', relationship: 35, gender: 'male', minAge: 50, maxAge: 75, log: 'I went to the wedding and clapped at the right moments. {{person}} seems decent.' } },
        ],
      },
      {
        id: 'object',
        label: 'Object loudly',
        effects: [
          { relationship: 'person', delta: -15 },
          { karma: -4 },
          { stat: 'happiness', delta: -3 },
          {
            chance: 0.5,
            then: [
              { log: 'She married him anyway. I was seated at the back.', kind: 'bad' },
              { newPerson: { kind: 'stepfather', relationship: 15, gender: 'male', minAge: 50, maxAge: 75, log: '{{person}} has not forgotten what I said at the rehearsal dinner.' } },
            ],
            else: [{ stat: 'happiness', delta: -3 }, { log: "She called it off. She hasn't quite forgiven me, and I'm not sure she should.", kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_father_remarries',
    category: 'romance',
    title: "Dad's new wife",
    text: "{{person}} turned up for dinner with a woman he described as 'a friend' and then, between courses, as his fiancée. He looks younger. She looks nervous. They want to know if I'm okay with it.",
    minAge: 16,
    maxAge: 80,
    weight: 0.6,
    once: true,
    conditions: [{ noPerson: ['mother'] }, { noPerson: ['stepmother'] }],
    person: { kind: ['father'] },
    choices: [
      {
        id: 'welcome',
        label: 'Welcome her warmly',
        effects: [
          { relationship: 'person', delta: 10 },
          { karma: 3 },
          { stat: 'happiness', delta: 3 },
          { newPerson: { kind: 'stepmother', relationship: 50, gender: 'female', minAge: 45, maxAge: 72, log: '{{person}} turned out to be kind, and a far better cook than Dad.' } },
        ],
      },
      {
        id: 'polite',
        label: 'Be polite, stay distant',
        effects: [
          { relationship: 'person', delta: 2 },
          { newPerson: { kind: 'stepmother', relationship: 35, gender: 'female', minAge: 45, maxAge: 72, log: '{{person}} and I are civil. Christmas will be interesting.' } },
        ],
      },
      {
        id: 'object',
        label: 'Tell him it is too soon',
        effects: [
          { relationship: 'person', delta: -12 },
          { karma: -3 },
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.5,
            then: [
              { log: 'He married her anyway. He said grief has no schedule, and he was right.', kind: 'bad' },
              { newPerson: { kind: 'stepmother', relationship: 20, gender: 'female', minAge: 45, maxAge: 72, log: '{{person}} is polite to me in the way people are polite to a draught.' } },
            ],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'They postponed. He is lonelier for it, and I did that.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'lf_parent_health_scare',
    category: 'romance',
    title: 'A fall',
    text: '{{person}} had a fall at home and lay on the kitchen floor for an hour before a neighbour found {{them}}. {{They}} is fine, {{they}} insists, and will not be fussed over.',
    minAge: 30,
    maxAge: 80,
    weight: 0.9,
    cooldown: 4,
    person: { kind: ['mother', 'father'], minAge: 60 },
    choices: [
      {
        id: 'movein',
        label: 'Move them in with me',
        effects: [
          { relationship: 'person', delta: 12 },
          { karma: 4 },
          { stat: 'happiness', delta: -4 },
          { money: -1500 },
          { relationship: 'spouse', delta: -4 },
          { log: "{{person}} moved into the spare room. We argue about the thermostat daily. I'm glad {{they}} is here." },
        ],
      },
      {
        id: 'carer',
        label: 'Pay for home care',
        hint: '{{$3000}}',
        conditions: [{ money: { gte: 3000 } }],
        effects: [{ money: -3000 }, { relationship: 'person', delta: 8 }, { karma: 3 }, { log: '{{They}} pretends to hate the carer and has made the carer a friend.', kind: 'good' }],
      },
      {
        id: 'call',
        label: 'Check in more often',
        effects: [
          { relationship: 'person', delta: 4 },
          { karma: 1 },
          {
            chance: 0.12,
            then: [{ personDies: true, cause: 'complications after a fall' }, { stat: 'happiness', delta: -15 }, { log: '{{person}} had a second fall that winter. There was no neighbour that time.', kind: 'bad' }],
            else: [{ log: 'I call every evening now. {{They}} complains, and picks up on the first ring.' }],
          },
        ],
      },
      {
        id: 'fine',
        label: "They said they're fine",
        effects: [
          { relationship: 'person', delta: -6 },
          { karma: -3 },
          {
            chance: 0.15,
            then: [{ personDies: true, cause: 'complications after a fall' }, { stat: 'happiness', delta: -20 }, { log: '{{They}} fell again. I should have fussed.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: '{{They}} was fine, as it turned out. I carried the guilt anyway.' }],
          },
        ],
      },
    ],
  },
];

import type { EventDef } from '@/engine/events/schema';

/**
 * Ages 16+: trips and journeys. Missed flights, lost passports, hostel
 * friendships, food you regret, getting lost, scam taxis, sunrises, language
 * mix-ups, breakdowns, cruise bugs, destination weddings, upgrades, beach
 * rescues, souvenirs, border mix-ups and volunteering abroad. Follow-ups
 * (followUpOnly) are queued by the events that set them up.
 */
export const TRAVEL_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ airports
  {
    id: 'tr_missed_flight',
    category: 'random',
    title: 'Gate closed',
    text: 'I reached the gate just in time to watch my plane push back without me. The airline desk offered a choice of expensive options and one complimentary shrug.',
    minAge: 18,
    maxAge: 80,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }, { money: { gte: 400 } }],
    choices: [
      {
        id: 'rebook',
        label: 'Pay for the next flight',
        hint: '{{$350}}',
        effects: [
          { money: -350 },
          { stat: 'happiness', delta: -3 },
          { log: 'I paid for a seat on the next flight and spent four hours staring at a departures board, learning nothing.', kind: 'money' },
          { chance: 0.3, then: [{ stat: 'happiness', delta: 4 }, { log: 'The next flight was half empty and I got a whole row to myself. Small mercies.', kind: 'good' }] },
        ],
      },
      {
        id: 'standby',
        label: 'Try standby',
        effects: [
          {
            chance: 0.5,
            then: [{ money: -60 }, { stat: 'happiness', delta: 3 }, { log: 'Standby came through for the price of a sandwich. I felt like I had beaten the system, which I had not.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -6 }, { stat: 'health', delta: -2 }, { log: 'Standby did not come through. I slept on the terminal floor under a coat and a sense of injustice.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'home',
        label: 'Go home and give up',
        effects: [
          { stat: 'happiness', delta: -5 },
          {
            chance: 0.4,
            then: [{ money: 200 }, { log: 'The airline refunded part of the ticket after I wrote a politely furious email.', kind: 'money' }],
            else: [{ log: 'The trip was off. I unpacked slowly, which is the saddest way to unpack.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tr_seat_upgrade',
    category: 'random',
    title: 'Unexpected upgrade',
    text: 'At the gate, the agent frowned at her screen, frowned at me, and handed me a new boarding pass. Row two. A seat that reclines fully. Someone made a mistake and it was in my favour.',
    minAge: 18,
    maxAge: 85,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: false }, { money: { gte: 300 } }],
    choices: [
      {
        id: 'enjoy',
        label: 'Enjoy every second',
        effects: [
          { stat: 'happiness', delta: 6 },
          { stat: 'health', delta: 1 },
          { log: 'I reclined fully, ate with real cutlery, and arrived rested for the first time in my life. I will never afford this again.', kind: 'good' },
        ],
      },
      {
        id: 'give',
        label: 'Give it to the elderly couple',
        effects: [
          { karma: 3 },
          { stat: 'happiness', delta: 4 },
          { log: 'I gave the seat to a tiny old man in the next queue. His wife hugged me. I flew in row forty with my knees around my ears and a warm heart.', kind: 'good' },
        ],
      },
      {
        id: 'catch',
        label: 'Ask what the catch is',
        effects: [
          {
            random: [
              { weight: 70, effects: [{ stat: 'happiness', delta: 5 }, { stat: 'smarts', delta: 1 }, { log: 'There was no catch. The agent just liked my face, or disliked whoever was meant to get it. I did not ask twice.', kind: 'good' }] },
              { weight: 30, effects: [{ stat: 'happiness', delta: -3 }, { log: 'The catch was that it was a mistake. She took the boarding pass back. Lesson: never ask.', kind: 'bad' }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'tr_lost_luggage',
    category: 'random',
    title: 'Carousel of despair',
    text: 'The baggage carousel went round forty times and then stopped. My bag was not on it. The lost luggage desk has a long queue and a short list of promises.',
    minAge: 16,
    maxAge: 85,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }, { money: { gte: 200 } }],
    choices: [
      {
        id: 'buy',
        label: 'Buy the essentials',
        hint: '{{$200}}',
        effects: [
          { money: -200 },
          { stat: 'happiness', delta: -2 },
          { log: 'I bought underwear, a toothbrush and the only shirt in my size, which had a cartoon dolphin on it. The bag arrived four days later.' },
          { chance: 0.5, then: [{ money: 150 }, { log: 'The airline reimbursed most of the dolphin shirt.', kind: 'money' }] },
        ],
      },
      {
        id: 'wait',
        label: 'Wear the same clothes',
        effects: [
          { stat: 'happiness', delta: -5 },
          { stat: 'looks', delta: -2 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'The bag turned up at the hotel on day two, smelling faintly of a different country. I had become one with my shirt.' }],
            else: [
              { stat: 'happiness', delta: -3 },
              { log: 'The bag never came. I wore one outfit for a week and became known at the hotel as "the shirt".', kind: 'bad' },
              { money: 300 },
              { log: 'The airline paid out eventually. It did not cover the shirt reputation.', kind: 'money' },
            ],
          },
        ],
      },
      {
        id: 'claim',
        label: 'File a furious claim',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.5,
            then: [{ money: 400 }, { stat: 'happiness', delta: 3 }, { log: 'Three forms, two phone calls and one very specific email later, the airline paid for everything and then some.', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -4 }, { money: -120 }, { log: 'The claim vanished into a department that does not answer phones. I bought socks and moved on.', kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ documents and borders
  {
    id: 'tr_lost_passport',
    category: 'random',
    title: 'Passport gone',
    text: 'My passport is not in the bag. Not in the other bag. Not in the hotel safe, which I now realise I never used. I fly home in two days.',
    minAge: 18,
    maxAge: 80,
    weight: 1,
    cooldown: 8,
    conditions: [{ inPrison: false }, { money: { gte: 300 } }],
    choices: [
      {
        id: 'embassy',
        label: 'Queue at the embassy',
        hint: '{{$180}}',
        effects: [
          { money: -180 },
          { stat: 'happiness', delta: -4 },
          { stat: 'smarts', delta: 2 },
          { log: 'Two days of forms, queues and an emergency passport photo in which I look like a suspect.' },
          { chance: 0.35, then: [{ queue: 'tr_passport_returned' }] },
        ],
      },
      {
        id: 'retrace',
        label: 'Retrace every step',
        effects: [
          {
            chance: 0.45,
            then: [{ stat: 'happiness', delta: 6 }, { log: 'It was under the bed in the first hostel, exactly where I would have put it if I were a sock.', kind: 'good' }],
            else: [
              { money: -250 },
              { stat: 'happiness', delta: -7 },
              { log: 'I retraced three cities and found nothing but a day I would not get back. Then I went to the embassy anyway.', kind: 'bad' },
              { chance: 0.35, then: [{ queue: 'tr_passport_returned' }] },
            ],
          },
        ],
      },
      {
        id: 'staff',
        label: 'Ask the hotel staff',
        effects: [
          {
            chance: 0.5,
            then: [
              { karma: 1 },
              { money: -40 },
              { stat: 'happiness', delta: 5 },
              { log: 'The night porter made four phone calls and a taxi driver turned up holding my passport. I tipped him everything in my pocket.', kind: 'good' },
            ],
            else: [{ money: -180 }, { stat: 'happiness', delta: -3 }, { log: 'The staff were kind, and useless. The embassy was unkind, and useful.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tr_passport_returned',
    category: 'random',
    title: 'A padded envelope',
    text: "Months after I got home, a padded envelope arrived covered in foreign stamps. Inside: my old passport and a note that said only 'Found on bus. Safe travels.'",
    minAge: 18,
    maxAge: 90,
    weight: 1,
    followUpOnly: true,
    choices: [
      {
        id: 'write',
        label: 'Write back and say thanks',
        effects: [
          { karma: 2 },
          { stat: 'happiness', delta: 4 },
          { log: 'I wrote back to the address on the envelope. A postcard came a year later. We are now strangers who are fond of each other.', kind: 'good' },
        ],
      },
      {
        id: 'keep',
        label: 'Keep it as a souvenir',
        effects: [{ stat: 'happiness', delta: 3 }, { log: 'The expired passport lives in a drawer now. It has had a better time than I have.' }],
      },
    ],
  },
  {
    id: 'tr_border_mixup',
    category: 'random',
    title: 'The small room',
    text: 'At the border my name matched someone on a list. Not me, but a version of me with a different birthday and far more paperwork. I was shown to a small room with no clock.',
    minAge: 18,
    maxAge: 80,
    weight: 0.8,
    cooldown: 8,
    conditions: [{ inPrison: false }, { money: { gte: 200 } }],
    choices: [
      {
        id: 'calm',
        label: 'Stay calm and wait',
        effects: [
          { stat: 'happiness', delta: -5 },
          { stat: 'health', delta: -1 },
          { stat: 'smarts', delta: 1 },
          { log: 'Six hours, two interviews and a vending machine. Eventually a supervisor said "different birthday" out loud and I was free. No apology.' },
        ],
      },
      {
        id: 'call',
        label: 'Demand to call someone',
        effects: [
          {
            chance: 0.5,
            then: [{ money: -120 }, { stat: 'happiness', delta: -3 }, { log: 'The call worked. A sleepy consular officer explained me down the phone and I was out in three hours, minus a phone bill.' }],
            else: [{ stat: 'happiness', delta: -9 }, { stat: 'health', delta: -2 }, { log: 'Demanding things made the small room smaller. Eleven hours. They offered a blanket at hour nine.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'joke',
        label: 'Make a joke',
        effects: [
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'The officer laughed, which surprised us both. Paperwork went faster after that. Three hours, a handshake, and a story.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -8 }, { log: 'Nobody laughed. I was asked to repeat the joke for the record. The record was not amused. Nine hours.', kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ on the road
  {
    id: 'tr_hostel_bunkmate',
    category: 'random',
    title: 'Bunk above mine',
    text: 'The traveller in the bunk above mine has been everywhere, owns almost nothing and talks until the lights go out. The hostel kitchen has one working ring and we are sharing it.',
    minAge: 18,
    maxAge: 40,
    weight: 1.5,
    once: true,
    conditions: [{ inPrison: false }, { money: { gte: 200 } }],
    choices: [
      {
        id: 'talk',
        label: 'Stay up talking',
        effects: [
          { stat: 'health', delta: -1 },
          { stat: 'happiness', delta: 5 },
          { newPerson: { kind: 'friend', relationship: 60, log: 'I made a friend called {{person}} over instant noodles and a shared phone charger.' } },
          { log: 'We talked until four about everything and nothing. I will remember this night longer than most of the year.', kind: 'good' },
        ],
      },
      {
        id: 'swap',
        label: 'Swap numbers and sleep',
        effects: [
          { stat: 'health', delta: 1 },
          { newPerson: { kind: 'friend', relationship: 40, log: '{{person}} from the hostel and I kept in touch, loosely.' } },
          { log: 'We traded numbers and I slept. Sensible, slightly cowardly.' },
        ],
      },
      {
        id: 'sleep',
        label: 'Pretend to be asleep',
        effects: [
          { stat: 'health', delta: 2 },
          { stat: 'happiness', delta: -1 },
          { log: 'I did an impression of a sleeping person for forty minutes. It was not a good impression. They talked anyway.' },
        ],
      },
    ],
  },
  {
    id: 'tr_mystery_skewer',
    category: 'random',
    title: 'Mystery skewer',
    text: 'A street stall is selling something on a skewer. It smells incredible. The sign is in a language I cannot read and the queue is entirely locals, which is either a great sign or a dare.',
    minAge: 16,
    maxAge: 85,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'eat',
        label: 'Eat it',
        hint: '{{$5}}',
        effects: [
          { money: -5 },
          {
            random: [
              { weight: 60, effects: [{ stat: 'happiness', delta: 5 }, { log: 'It was the best thing I ate all year. I still do not know what it was and I have decided not to ask.', kind: 'good' }] },
              {
                weight: 30,
                effects: [
                  { illness: 'food_poisoning' },
                  { stat: 'health', delta: -4 },
                  { stat: 'happiness', delta: -4 },
                  { log: 'It was also the thing I regretted most all year. I spent two days very close to a bathroom.', kind: 'bad' },
                ],
              },
              { weight: 10, effects: [{ stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 1 }, { log: 'It was, I eventually learned, mostly tendon. Chewy. Educational.' }] },
            ],
          },
        ],
      },
      {
        id: 'ask',
        label: 'Ask what it is first',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.7,
            then: [{ money: -5 }, { stat: 'happiness', delta: 3 }, { log: 'The stallholder mimed an animal I could not identify, grinned, and handed me one. Delicious. Still unidentified.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'The stallholder mimed something with horns and I backed away slowly. The locals laughed, kindly.' }],
          },
        ],
      },
      {
        id: 'safe',
        label: 'Order plain rice',
        effects: [
          { money: -3 },
          { stat: 'happiness', delta: -2 },
          { stat: 'health', delta: 1 },
          { log: 'I ate plain rice beside a queue of happy people eating something better. Safe, and I knew it.' },
        ],
      },
    ],
  },
  {
    id: 'tr_hopelessly_lost',
    category: 'random',
    title: 'Hopelessly lost',
    text: 'My phone died, the streets stopped having names, and every alley opened onto another alley. The sun is going down and the same cat has watched me pass three times.',
    minAge: 16,
    maxAge: 85,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'landmark',
        label: 'Walk toward the tallest thing',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { stat: 'health', delta: 1 }, { log: 'The tallest thing was a clock tower in the main square. I found my way back by instinct and felt briefly like an explorer.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { stat: 'health', delta: -2 }, { log: 'The tallest thing was a water tower on the edge of town. I walked for two hours in the wrong direction.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'grandmother',
        label: 'Ask a passing grandmother',
        effects: [
          { karma: 1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'She took my arm, walked me six streets, and would not leave until she had seen my hotel sign with her own eyes.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'She gave me directions in a language I do not speak, with great confidence. I thanked her and got lost somewhere new.' }],
          },
        ],
      },
      {
        id: 'taxi',
        label: 'Flag down a taxi',
        hint: '{{$40}}',
        conditions: [{ money: { gte: 40 } }],
        effects: [
          { money: -40 },
          { stat: 'happiness', delta: 2 },
          { log: 'The taxi drove for ninety seconds and stopped outside my hotel. I had been one corner away for an hour.', kind: 'money' },
        ],
      },
    ],
  },
  {
    id: 'tr_scenic_taxi',
    category: 'random',
    title: 'The scenic route',
    text: 'The airport taxi toured what felt like the entire country before stopping at my hotel. The meter shows a number that would be reasonable for a small car.',
    minAge: 18,
    maxAge: 85,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }, { money: { gte: 200 } }],
    choices: [
      {
        id: 'pay',
        label: 'Pay and seethe',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          { stat: 'happiness', delta: -5 },
          { log: 'I paid, said nothing, and thought of several excellent things to say over the next three days.', kind: 'bad' },
        ],
      },
      {
        id: 'argue',
        label: 'Argue the fare',
        effects: [
          {
            chance: 0.55,
            then: [{ money: -50 }, { stat: 'happiness', delta: 3 }, { log: 'I argued, pointed at the map, and argued some more. We settled on a third. He drove off shaking his head at my ingratitude.', kind: 'good' }],
            else: [{ money: -150 }, { stat: 'happiness', delta: -7 }, { log: 'The argument summoned two of his cousins. I paid the full fare and a little bit of my dignity.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse and walk away',
        effects: [
          { karma: -2 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'I walked away. He shouted. The hotel doorman shrugged. Nothing happened, which somehow felt worse.' }],
            else: [{ money: -200 }, { stat: 'happiness', delta: -8 }, { log: 'A police officer appeared with suspicious speed and sided with the driver. The fine was more than the fare.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tr_language_mixup',
    category: 'random',
    title: 'Lost in translation',
    text: 'I ordered, I think, a coffee. The waiter nodded gravely and returned with a plate of grilled sardines and the chef, who wanted to shake my hand.',
    minAge: 16,
    maxAge: 85,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'eat',
        label: 'Eat the sardines',
        effects: [
          { money: -12 },
          { stat: 'happiness', delta: 4 },
          { karma: 1 },
          { log: 'I ate the sardines. They were superb. The chef brought a coffee at the end, unasked, as if he had known all along.', kind: 'good' },
        ],
      },
      {
        id: 'explain',
        label: 'Try to explain',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'Through mime and a napkin drawing we reached an understanding. The sardines went to the next table, who were thrilled.', kind: 'good' }],
            else: [{ money: -12 }, { stat: 'happiness', delta: -3 }, { log: 'My explanation produced a second plate of sardines. I stopped explaining.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'app',
        label: 'Use a translation app',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { log: 'The app translated my apology as a marriage proposal. The waiter declined, gently, and brought the coffee.' },
        ],
      },
    ],
  },
  {
    id: 'tr_road_trip_breakdown',
    category: 'random',
    title: 'Dead on the shoulder',
    text: 'Four hours into a road trip, the car coughed twice and died on a stretch of road with more cows than people. The nearest town is a dot on the map.',
    minAge: 18,
    maxAge: 80,
    weight: 1.2,
    cooldown: 4,
    conditions: [{ inPrison: false }, { any: [{ ownsAsset: 'car' }, { money: { gte: 1200 } }] }],
    choices: [
      {
        id: 'tow',
        label: 'Call a tow truck',
        hint: '{{$300}}',
        effects: [
          { money: -300 },
          { stat: 'happiness', delta: -4 },
          { log: 'The tow truck took ninety minutes and the driver talked about his divorce the whole way. Car fixed by Tuesday.', kind: 'money' },
        ],
      },
      {
        id: 'fix',
        label: 'Open the bonnet and improvise',
        conditions: [{ ownsAsset: 'car' }],
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 6 }, { log: 'A loose cable. I reconnected it with the confidence of someone who had seen a video once. It started. I am a mechanic now.', kind: 'good' }],
            else: [
              { asset: 'damage', kind: 'car', amount: 25 },
              { money: -450 },
              { stat: 'happiness', delta: -6 },
              { log: 'I made it worse in a way the mechanic described as "creative". The repair bill was not.', kind: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'hitch',
        label: 'Hitch a lift to town',
        effects: [
          {
            chance: 0.7,
            then: [{ money: -120 }, { karma: 1 }, { stat: 'happiness', delta: 3 }, { log: 'A farmer in a pickup gave me a lift, a sandwich and a lecture on radiator hoses. His cousin towed the car for cash and a handshake.', kind: 'good' }],
            else: [{ money: -300 }, { stat: 'happiness', delta: -5 }, { stat: 'health', delta: -3 }, { log: 'Nobody stopped for two hours. I walked to town in the dark, cursing cows, and paid for the tow truck anyway.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tr_train_stranger',
    category: 'random',
    title: 'Night train',
    text: 'An overnight train, a shared compartment, and a stranger who has decided to tell me the entire story of their life, starting from a childhood on a boat. We have nine hours.',
    minAge: 16,
    maxAge: 85,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'listen',
        label: 'Listen to all of it',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 3 },
          { stat: 'health', delta: -1 },
          { karma: 1 },
          { log: 'Nine hours. The boat, the war, the bakery, the daughter in another country. I will think about the bakery for years.', kind: 'good' },
        ],
      },
      {
        id: 'sleep',
        label: 'Sleep through it',
        effects: [
          { stat: 'health', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { karma: -1 },
          { log: 'I fell asleep around the bakery and woke at the destination. They were still talking, to a different passenger now.' },
        ],
      },
      {
        id: 'share',
        label: 'Share my own story',
        effects: [
          { energy: -1 },
          {
            chance: 0.4,
            then: [
              { stat: 'happiness', delta: 5 },
              { newPerson: { kind: 'friend', relationship: 50, log: 'The stranger on the train was {{person}}. We still write.' } },
              { log: 'We traded lives until dawn. By the station we had a plan to meet again and, against all odds, we did.', kind: 'good' },
            ],
            else: [{ stat: 'happiness', delta: 2 }, { log: 'I told my story. It was shorter than theirs and had fewer boats. We parted at the station with a nod.' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ holidays
  {
    id: 'tr_cruise_bug',
    category: 'random',
    title: 'Cruise ship bug',
    text: 'Day three of the cruise and a stomach bug is sweeping the ship. The buffet is still open, defiantly. Half the passengers are missing and the other half look worried.',
    minAge: 21,
    maxAge: 85,
    weight: 0.8,
    cooldown: 6,
    conditions: [{ inPrison: false }, { money: { gte: 3000 } }],
    choices: [
      {
        id: 'cabin',
        label: 'Hide in the cabin',
        effects: [
          { counter: 'vacations' },
          { stat: 'happiness', delta: -3 },
          {
            chance: 0.15,
            then: [{ illness: 'food_poisoning' }, { stat: 'health', delta: -3 }, { log: 'I hid, I washed my hands raw, and I still caught it, through the air vents probably. Two days of misery with a sea view.', kind: 'bad' }],
            else: [{ stat: 'health', delta: 1 }, { log: 'I spent the cruise in a cabin the size of a wardrobe, reading, and arrived home healthy and slightly pale.' }],
          },
        ],
      },
      {
        id: 'buffet',
        label: 'Eat at the buffet anyway',
        effects: [
          { counter: 'vacations' },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.65,
            then: [
              { illness: 'food_poisoning' },
              { stat: 'health', delta: -6 },
              { stat: 'happiness', delta: -8 },
              { log: 'The crab was excellent. The next thirty hours were not. I now have a complicated relationship with crab.', kind: 'bad' },
            ],
            else: [{ stat: 'happiness', delta: 4 }, { log: 'Iron stomach. I ate like a king among the fallen and felt only slightly guilty.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'refund',
        label: 'Demand compensation',
        effects: [
          { counter: 'vacations' },
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.45,
            then: [{ money: 600 }, { log: 'The cruise line issued a voucher and, after a strongly worded letter, actual money. The bug was worth it. Almost.', kind: 'money' }],
            else: [{ log: 'The cruise line sent a form letter and a fruit basket. The fruit basket was, ironically, the best meal of the week.' }],
          },
          { chance: 0.35, then: [{ illness: 'food_poisoning' }, { stat: 'health', delta: -3 }, { log: 'I also caught the bug while queuing at the complaints desk.', kind: 'bad' }] },
        ],
      },
    ],
  },
  {
    id: 'tr_rip_current',
    category: 'random',
    title: 'Rip current',
    text: 'A shout from the water. A swimmer is being dragged out past the flags, waving one arm. The lifeguard chair is empty and the whole beach has gone very quiet.',
    minAge: 16,
    maxAge: 70,
    weight: 0.8,
    once: true,
    conditions: [{ inPrison: false }, { stat: 'health', gte: 30 }],
    choices: [
      {
        id: 'swim',
        label: 'Swim out to them',
        effects: [
          {
            chance: 0.6,
            then: [
              { karma: 4 },
              { stat: 'happiness', delta: 8 },
              { stat: 'health', delta: -2 },
              { fame: 1 },
              { log: 'I reached them, told them to stop fighting the current, and we swam sideways until the sea let go. Someone filmed it. I was briefly a hero.', kind: 'good' },
            ],
            else: [
              { injury: 8 },
              { stat: 'happiness', delta: -6 },
              { log: 'The current took us both. A fishing boat pulled us out, coughing. The swimmer lived. I swallowed half the ocean.', kind: 'bad' },
              { chance: 0.1, then: [{ death: 'drowned in a rip current trying to save a stranger' }] },
            ],
          },
        ],
      },
      {
        id: 'lifeguard',
        label: 'Run for the lifeguard',
        effects: [
          { karma: 2 },
          {
            chance: 0.8,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'The lifeguard sprinted from the kiosk with a float and had them back on the sand in minutes. I held the towel. Towels matter too.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -8 }, { log: 'The lifeguard was too far. A surfer got there first, barely. I stood on the sand and shook.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'look',
        label: 'Look away',
        effects: [
          { karma: -4 },
          { stat: 'happiness', delta: -5 },
          { log: 'I told myself someone else would go. Someone did. I packed up early and did not enjoy the rest of the holiday.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'tr_souvenir_temptation',
    category: 'random',
    title: 'The perfect souvenir',
    text: 'In a market stall I found it: a hand-carved thing of real beauty that I have no room for and cannot afford. The seller has noticed my face. Negotiations have begun whether I like it or not.',
    minAge: 16,
    maxAge: 85,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }, { money: { gte: 100, lte: 2500 } }],
    choices: [
      {
        id: 'buy',
        label: 'Buy it anyway',
        hint: '{{$220}}',
        effects: [
          { money: -220 },
          { stat: 'happiness', delta: 6 },
          { log: 'I bought it. I carried it through three airports like a baby. It lives on my shelf and I regret nothing, apart from the rent.', kind: 'good' },
          { chance: 0.3, then: [{ stat: 'happiness', delta: -2 }, { log: 'Customs made me unwrap it twice. The second officer admired it, which helped.' }] },
        ],
      },
      {
        id: 'haggle',
        label: 'Haggle hard',
        effects: [
          {
            chance: 0.5,
            then: [
              { money: -90 },
              { stat: 'happiness', delta: 5 },
              { stat: 'smarts', delta: 1 },
              { log: 'Twenty minutes of theatre, two walk-aways and a cup of tea later, I paid less than half. The seller looked delighted, which worried me.', kind: 'good' },
            ],
            else: [{ karma: -1 }, { stat: 'happiness', delta: -3 }, { log: 'I lowballed so badly the seller covered the carving with a cloth and turned away. I left with nothing and a lesson.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'walk',
        label: 'Walk away',
        effects: [
          { stat: 'happiness', delta: -3 },
          { log: 'I walked away and thought about it for the rest of the trip, the flight home, and most of the following year.' },
        ],
      },
    ],
  },
  {
    id: 'tr_sabbatical',
    category: 'random',
    title: 'The long trip',
    text: 'I have savings, a job that would probably survive without me for a while, and a map with too many pins in it. The idea of six months away will not leave me alone.',
    minAge: 25,
    maxAge: 55,
    weight: 0.6,
    once: true,
    conditions: [{ inPrison: false }, { hasJob: true }, { money: { gte: 12000 } }],
    choices: [
      {
        id: 'quit',
        label: 'Quit and go',
        hint: '{{$10000}}',
        effects: [
          { money: -10000 },
          { loseJob: true, reason: 'left' },
          { stat: 'happiness', delta: 15 },
          { stat: 'health', delta: 3 },
          { stat: 'smarts', delta: 4 },
          { counter: 'vacations' },
          { log: 'Six months. Eleven countries. One backpack. I came home with no job, almost no money, and more stories than anyone wanted to hear.', kind: 'milestone' },
        ],
      },
      {
        id: 'leave',
        label: 'Ask for unpaid leave',
        effects: [
          {
            chance: 0.5,
            then: [
              { money: -8000 },
              { stat: 'happiness', delta: 12 },
              { stat: 'smarts', delta: 3 },
              { counter: 'vacations' },
              { log: 'They said yes. Four months away and a desk waiting for me, slightly dustier. Best decision I have made.', kind: 'good' },
            ],
            else: [{ stat: 'happiness', delta: -4 }, { jobPerformance: -3 }, { log: 'They said no, in a tone that suggested I should not have asked. I took a long weekend instead and stared at the map.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'stay',
        label: 'Put the map away',
        effects: [
          { stat: 'happiness', delta: -5 },
          { jobPerformance: 2 },
          { log: 'I put the map away. The savings grew. The pins stayed in a drawer, which is where dreams are stored, apparently.' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ travelling with people
  {
    id: 'tr_sunrise_ridge',
    category: 'random',
    title: 'Sunrise on the ridge',
    text: '{{person}} shook me awake at four in the morning on our trip. There is a ridge, apparently, and a sunrise, and a two-hour walk between us and both of them.',
    minAge: 16,
    maxAge: 80,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['lover', 'spouse', 'friend', 'bestFriend', 'sibling'], minRelationship: 30 },
    choices: [
      {
        id: 'go',
        label: 'Go',
        effects: [
          { energy: -1 },
          { stat: 'health', delta: 3 },
          { stat: 'happiness', delta: 6 },
          { relationship: 'person', delta: 6 },
          { log: 'We reached the ridge as the sky went from grey to gold. Neither of us said anything for ten minutes. Best ten minutes of the year.', kind: 'good' },
        ],
      },
      {
        id: 'grumble',
        label: 'Go, but complain',
        effects: [
          { stat: 'health', delta: 2 },
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 3 }, { log: 'I complained for two hours uphill and {{person}} laughed at every word. Then the sun came over the hills and I shut up completely.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { log: 'I complained for two hours uphill. {{person}} stopped answering halfway. The sunrise was still good, in a quiet sort of way.' }],
          },
        ],
      },
      {
        id: 'bed',
        label: 'Stay in bed',
        effects: [
          { stat: 'happiness', delta: 1 },
          { stat: 'health', delta: 1 },
          { relationship: 'person', delta: -5 },
          { log: '{{person}} came back glowing with a hundred photos. I had slept until nine, which was also nice, though less photogenic.' },
        ],
      },
    ],
  },
  {
    id: 'tr_destination_wedding',
    category: 'random',
    title: 'Destination wedding',
    text: '{{person}} is getting married on a beach on the other side of the world and would love me to be there. The flights alone cost more than my fridge.',
    minAge: 20,
    maxAge: 70,
    weight: 1,
    cooldown: 6,
    conditions: [{ inPrison: false }, { money: { gte: 900 } }],
    person: { kind: ['friend', 'bestFriend', 'sibling', 'coworker'], minRelationship: 40, minAge: 18 },
    choices: [
      {
        id: 'go',
        label: 'Go',
        hint: '{{$2200}}',
        conditions: [{ money: { gte: 2200 } }],
        effects: [
          { money: -2200 },
          { stat: 'happiness', delta: 8 },
          { relationship: 'person', delta: 10 },
          { counter: 'vacations' },
          { log: 'Sand in the ceremony, sunburn at the reception, a speech I did not plan to give. {{person}} cried. So did I, slightly.', kind: 'good' },
          { chance: 0.2, then: [{ newPerson: { kind: 'friend', relationship: 50, log: 'I spent the whole reception talking to {{person}}, another guest, and we stayed in touch.' } }] },
        ],
      },
      {
        id: 'budget',
        label: 'Go on the cheap',
        hint: '{{$900}}',
        effects: [
          { money: -900 },
          { relationship: 'person', delta: 8 },
          { counter: 'vacations' },
          {
            chance: 0.65,
            then: [{ stat: 'happiness', delta: 6 }, { log: 'Two layovers, a borrowed sofa and a borrowed shirt. I made the ceremony with minutes to spare. {{person}} did not care how I got there.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: 2 }, { stat: 'health', delta: -2 }, { log: 'Three layovers and a night on an airport bench. I arrived grey and slightly feverish, but I arrived. {{person}} hugged me anyway.' }],
          },
        ],
      },
      {
        id: 'plus_one',
        label: 'Go with my partner',
        hint: '{{$4000}}',
        conditions: [{ hasLover: true }, { money: { gte: 4000 } }],
        effects: [
          { money: -4000 },
          { stat: 'happiness', delta: 10 },
          { relationship: 'person', delta: 10 },
          { relationship: 'lover', delta: 6 },
          { relationship: 'spouse', delta: 6 },
          { counter: 'vacations' },
          { log: 'We went together. A week of sun, a wedding, and a hotel room we could not afford. Worth every regretted cent.', kind: 'good' },
        ],
      },
      {
        id: 'gift',
        label: 'Send a gift and regrets',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: -4 },
          { log: 'I sent a very good toaster and a very long message. {{person}} understood, mostly. The photos were hard to look at.' },
        ],
      },
    ],
  },
  {
    id: 'tr_honeymoon',
    category: 'random',
    title: 'The honeymoon',
    text: '{{person}} and I have never taken a real trip together, and the wedding money is sitting there looking like plane tickets. Everyone keeps asking where we are going.',
    minAge: 18,
    maxAge: 70,
    weight: 1.5,
    once: true,
    conditions: [{ inPrison: false }, { married: true }, { money: { gte: 900 } }],
    person: { kind: ['spouse'] },
    choices: [
      {
        id: 'splurge',
        label: 'Splurge on somewhere far',
        hint: '{{$6000}}',
        conditions: [{ money: { gte: 6000 } }],
        effects: [
          { money: -6000 },
          { stat: 'happiness', delta: 12 },
          { love: 12 },
          { relationship: 'person', delta: 8 },
          { counter: 'vacations' },
          { log: 'Two weeks somewhere with turquoise water and no phone signal. We came home broke, tanned, and genuinely married.', kind: 'good' },
        ],
      },
      {
        id: 'modest',
        label: 'A long weekend nearby',
        hint: '{{$900}}',
        effects: [
          { money: -900 },
          { stat: 'happiness', delta: 6 },
          { love: 5 },
          { relationship: 'person', delta: 4 },
          { counter: 'vacations' },
          { log: 'A cabin, a lake, a lot of board games. {{person}} said it was perfect. I think {{they}} meant it.', kind: 'good' },
        ],
      },
      {
        id: 'postpone',
        label: 'Postpone it',
        effects: [
          { stat: 'happiness', delta: -3 },
          { love: -5 },
          { relationship: 'person', delta: -3 },
          { log: 'We said next year. We said it again the year after. The wedding money became a boiler.' },
        ],
      },
    ],
  },
  {
    id: 'tr_kids_road_trip',
    category: 'random',
    title: 'Are we there yet',
    text: 'Six hours in the car with {{person}}, who has asked whether we are there yet eleven times and has just announced that {{they}} might be sick. We are not there yet.',
    minAge: 24,
    maxAge: 60,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }, { hasChildren: true }, { money: { gte: 100 } }],
    person: { kind: ['child'], minAge: 3, maxAge: 14 },
    choices: [
      {
        id: 'stop',
        label: 'Pull over for ice cream',
        hint: '{{$20}}',
        effects: [
          { money: -20 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 5 },
          { log: 'Ice cream fixed everything, as it has for centuries. We arrived late, sticky and friends.', kind: 'good' },
        ],
      },
      {
        id: 'game',
        label: 'Start a car game',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: 4 }, { log: 'We played the number plate game for two hours. {{person}} won, allegedly. I let {{them}} think so.', kind: 'good' }],
            else: [
              { stat: 'happiness', delta: -3 },
              { relationship: 'person', delta: -2 },
              { log: 'The game lasted four minutes. Then {{they}} got sick on the back seat. Everyone was quiet after that.', kind: 'bad' },
              { chance: 0.5, then: [{ asset: 'damage', kind: 'car', amount: 5 }] },
            ],
          },
        ],
      },
      {
        id: 'push',
        label: 'Push on through',
        effects: [
          { stat: 'happiness', delta: -3 },
          { stat: 'health', delta: -1 },
          { relationship: 'person', delta: -3 },
          { log: 'We did not stop. Nobody enjoyed the last two hours. We arrived forty minutes earlier and it was not worth it.' },
        ],
      },
    ],
  },
  {
    id: 'tr_family_holiday',
    category: 'random',
    title: 'Family holiday',
    text: '{{person}} has booked the family holiday: one apartment, one bathroom, a strict itinerary and a laminated schedule for the bathroom. I am expected to be enthusiastic.',
    minAge: 16,
    maxAge: 24,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather'] },
    choices: [
      {
        id: 'enthuse',
        label: 'Be genuinely enthusiastic',
        effects: [
          { counter: 'vacations' },
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 7 },
          { log: 'I followed the laminated schedule and, somewhere around day three, started to enjoy it. {{person}} noticed and glowed.', kind: 'good' },
        ],
      },
      {
        id: 'sulk',
        label: 'Sulk through it',
        effects: [
          { counter: 'vacations' },
          { stat: 'happiness', delta: -3 },
          { relationship: 'person', delta: -5 },
          { log: 'I sulked across two museums and a boat trip. {{person}} stopped asking me to smile for photos by day two.', kind: 'bad' },
        ],
      },
      {
        id: 'escape',
        label: 'Slip away for a day',
        effects: [
          { counter: 'vacations' },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 6 }, { relationship: 'person', delta: -2 }, { log: 'I explored alone for a day and had the best time of the trip. {{person}} pretended not to mind.', kind: 'good' }],
            else: [
              { stat: 'happiness', delta: -4 },
              { relationship: 'person', delta: -8 },
              { log: 'I got lost, missed dinner, and came back to find {{person}} had already called the police. Twice.', kind: 'bad' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'tr_ex_at_the_pool',
    category: 'random',
    title: 'Small world',
    text: 'Two thousand miles from home, by a hotel pool, on the sunlounger directly opposite mine: {{person}}. My ex. {{They}} saw me. There is no architecture to hide behind.',
    minAge: 20,
    maxAge: 75,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: false }, { money: { gte: 300 } }],
    person: { kind: ['ex'] },
    choices: [
      {
        id: 'wave',
        label: 'Wave and say hello',
        effects: [
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: 6 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'We had a coffee. It was fine. Really fine. We both said "you look well" and both meant it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'We had a coffee. {{They}} mentioned {{their}} new partner four times. I counted. The pool got smaller.' }],
          },
        ],
      },
      {
        id: 'hide',
        label: 'Hide behind a menu',
        effects: [
          { stat: 'happiness', delta: -2 },
          { log: 'I hid behind a laminated drinks menu for forty minutes. {{person}} left eventually. The menu and I are close now.' },
        ],
      },
      {
        id: 'leave',
        label: 'Check out early',
        hint: '{{$200}}',
        effects: [
          { money: -200 },
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I changed hotels at a cost I will not discuss. The new one had a better pool and no exes in it. Money well spent, arguably.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I changed hotels at a cost I will not discuss. The new one had a view of a car park. Some reunions are still not worth a sunlounger.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tr_work_trip',
    category: 'random',
    title: 'Conference trip',
    text: '{{company}} is sending me to a conference in another city and {{person}} is coming along. Three days of lanyards, lukewarm coffee and a hotel with a surprisingly good view.',
    minAge: 20,
    maxAge: 65,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ inPrison: false }, { hasJob: true }],
    person: { kind: ['coworker', 'friend', 'bestFriend'] },
    choices: [
      {
        id: 'talks',
        label: 'Attend every single talk',
        effects: [
          { jobPerformance: 6 },
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: -2 },
          { log: 'I attended everything, took notes, and met the boss of my boss in a lift. My manager heard. Good things followed.', kind: 'good' },
        ],
      },
      {
        id: 'skive',
        label: 'Skip the afternoon with {{person}}',
        effects: [
          { stat: 'happiness', delta: 6 },
          { relationship: 'person', delta: 6 },
          {
            chance: 0.25,
            then: [{ jobPerformance: -5 }, { log: 'We explored the old town. Someone from the office saw the photos. The photos were timestamped.', kind: 'bad' }],
            else: [{ jobPerformance: -1 }, { log: 'We explored the old town and nobody noticed. The afternoon session was about compliance anyway.' }],
          },
        ],
      },
      {
        id: 'dinner',
        label: 'Network at the dinner',
        effects: [
          { energy: -1 },
          {
            chance: 0.5,
            then: [
              { jobPerformance: 3 },
              { newPerson: { kind: 'friend', relationship: 45, log: 'I met {{person}} at the conference dinner and we kept in touch.' } },
              { log: 'I shook forty hands and remembered three names. One of them turned out to matter.', kind: 'good' },
            ],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I networked so hard I ran out of words by dessert. Nobody followed up. The dessert was good.' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ giving back
  {
    id: 'tr_volunteer_trip',
    category: 'random',
    title: 'Build a school roof',
    text: 'A friend of a friend runs a project rebuilding a village school after the floods. They need hands for two weeks. No pay, flights not included, mosquitoes very much included.',
    minAge: 18,
    maxAge: 65,
    weight: 1,
    once: true,
    conditions: [{ inPrison: false }, { money: { gte: 700 } }],
    choices: [
      {
        id: 'go',
        label: 'Go for two weeks',
        hint: '{{$700}}',
        effects: [
          { money: -700 },
          { karma: 4 },
          { stat: 'happiness', delta: 5 },
          { stat: 'health', delta: -3 },
          { stat: 'smarts', delta: 1 },
          { counter: 'vacations' },
          { log: 'Two weeks of hammering, sunburn and the best meals of my life, cooked on a fire. The roof went on. I cried a bit when we left.', kind: 'good' },
          { chance: 0.4, then: [{ newPerson: { kind: 'friend', relationship: 60, log: 'I built a roof with {{person}}, who is now a friend for life.' } }] },
          { chance: 0.15, then: [{ illness: 'flu' }, { log: 'I also brought home a fever that lasted a week.', kind: 'bad' }] },
          { chance: 0.5, then: [{ queue: 'tr_volunteer_letter' }] },
        ],
      },
      {
        id: 'donate',
        label: 'Donate instead',
        hint: '{{$250}}',
        effects: [
          { money: -250 },
          { karma: 2 },
          { stat: 'happiness', delta: 1 },
          { log: 'I sent money for timber instead of myself. Less romantic, arguably more useful. The photos of the roof were nice.' },
        ],
      },
      {
        id: 'decline',
        label: 'Politely decline',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I said I was busy. I was, a bit. I thought about the roof more than I expected to.' }],
      },
    ],
  },
  {
    id: 'tr_volunteer_letter',
    category: 'random',
    title: 'Letter from the village',
    text: 'A letter arrived from the village school. The roof held through the rains. The children drew a picture of the volunteers, and one stick figure holding a hammer is clearly me.',
    minAge: 18,
    maxAge: 90,
    weight: 1,
    followUpOnly: true,
    choices: [
      {
        id: 'books',
        label: 'Send money for books',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          { karma: 2 },
          { stat: 'happiness', delta: 3 },
          { log: 'I sent money for books. They sent back a photo of a shelf, full. A very good exchange rate.', kind: 'good' },
        ],
      },
      {
        id: 'frame',
        label: 'Frame the drawing',
        effects: [
          { stat: 'happiness', delta: 4 },
          { log: 'The drawing is on my wall. Visitors ask about it and I tell the story, slightly longer each time.', kind: 'good' },
        ],
      },
    ],
  },
];

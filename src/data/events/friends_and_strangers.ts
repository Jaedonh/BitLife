import type { EventDef } from '@/engine/events/schema';

/**
 * Ages 6+: friends and strangers. Friends in crisis, terrible bands, secrets,
 * road trips and borrowed cars; plus the strangers of {{city}}: lost tourists,
 * film crews, pigeons, wrong numbers and a dog with a collar. Follow-ups
 * (followUpOnly) are queued by the events that set them up and never fire on
 * their own.
 */
export const FRIENDS_AND_STRANGERS_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ friends
  {
    id: 'fs_three_am_call',
    category: 'friends',
    title: 'The 3 a.m. call',
    text: 'My phone lit up at 3 a.m. It was {{person}}, voice shaking, saying everything had gone wrong at once and asking if I was awake. I was now.',
    minAge: 16,
    maxAge: 90,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend'], minRelationship: 30 },
    choices: [
      {
        id: 'go',
        label: 'Go over right now',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: 10 },
          { karma: 3 },
          { log: "I sat on {{their}} kitchen floor until sunrise. Nothing was fixed, but {{they}} wasn't alone.", kind: 'good' },
          { chance: 0.3, then: [{ stat: 'health', delta: -2 }, { log: 'I was a zombie the next day and did not regret a minute of it.' }] },
        ],
      },
      {
        id: 'talk',
        label: 'Talk {{them}} through it',
        effects: [
          { relationship: 'person', delta: 5 },
          { karma: 1 },
          { stat: 'happiness', delta: -1 },
          { log: 'We talked until the birds started singing. {{They}} said thank you about forty times.', kind: 'good' },
        ],
      },
      {
        id: 'silence',
        label: 'Silence it and sleep',
        effects: [
          { karma: -3 },
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: -12 }, { log: '{{person}} never mentioned the call. {{They}} also never called again.', kind: 'bad' }],
            else: [{ relationship: 'person', delta: -4 }, { log: '{{person}} said it was fine. It was clearly not fine.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'fs_terrible_band',
    category: 'friends',
    title: 'Terrible band',
    text: '{{person}} has started a band. They play in a garage, have a name with three Zs in it, and have invited me to their first gig. I have heard the demo.',
    minAge: 14,
    maxAge: 60,
    weight: 1.5,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'cheer',
        label: 'Go and cheer loudly',
        effects: [
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: 8 },
          { energy: -1 },
          { log: 'I clapped after every song, including the one that was mostly feedback. {{person}} glowed.', kind: 'good' },
          { chance: 0.15, then: [{ fame: 1 }, { log: 'The gig became a local legend and I am in the front row of every photo.', kind: 'good' }] },
        ],
      },
      {
        id: 'honest',
        label: 'Give honest feedback',
        effects: [
          { karma: 1 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 4 }, { stat: 'smarts', delta: 1 }, { log: '{{They}} took it well and switched to drums. The drums were an improvement.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -8 }, { log: '{{They}} said I never supported {{their}} dreams. The dreams are very loud.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'excuse',
        label: 'Invent a prior engagement',
        effects: [
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.6,
            then: [{ log: 'My excuse held. I spent the evening in blissful silence.' }],
            else: [{ relationship: 'person', delta: -6 }, { log: 'A mutual friend posted a photo of me at home, on the couch, during the gig.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'fs_secret_keeper',
    category: 'friends',
    title: 'A secret to keep',
    text: '{{person}} swore me to secrecy, then told me something big enough that keeping it felt like holding a brick in my mouth. Now everyone keeps asking why I look weird.',
    minAge: 10,
    maxAge: 90,
    weight: 1.5,
    cooldown: 4,
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'keep',
        label: 'Keep it locked away',
        effects: [
          { relationship: 'person', delta: 6 },
          { karma: 2 },
          { stat: 'happiness', delta: -1 },
          { log: 'I kept the brick. {{person}} said I was the only one {{they}} trusted.', kind: 'good' },
        ],
      },
      {
        id: 'confide',
        label: 'Tell just one person',
        effects: [
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.5,
            then: [{ log: 'The one person kept it too. The chain held, barely.' }],
            else: [{ queue: 'fs_secret_got_out' }, { log: 'The one person told one person. You can see where this is going.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'broadcast',
        label: 'Tell absolutely everyone',
        effects: [
          { karma: -6 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -20 },
          { log: 'It was a great story and I told it well. {{person}} does not speak to me now.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'fs_secret_got_out',
    category: 'friends',
    title: 'Secret got out',
    text: 'The secret came back to {{person}} with my name attached. {{They}} cornered me in the hallway with a face like a slammed door.',
    minAge: 10,
    maxAge: 90,
    weight: 1,
    followUpOnly: true,
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'own',
        label: 'Own up and apologize',
        effects: [
          { relationship: 'person', delta: -10 },
          { karma: 2 },
          { log: 'I apologized properly. {{They}} needed a month, but {{they}} came back.' },
        ],
      },
      {
        id: 'deny',
        label: 'Deny everything',
        effects: [
          { karma: -3 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: -2 }, { log: '{{They}} believed me. I did not believe me.' }],
            else: [{ relationship: 'person', delta: -25 }, { log: '{{They}} had screenshots. Of course {{they}} had screenshots.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'fs_falling_out',
    category: 'friends',
    title: 'The falling out',
    text: '{{person}} and I had the kind of argument that starts about a borrowed charger and ends about everything. Now we are both waiting for the other to blink.',
    minAge: 12,
    maxAge: 90,
    weight: 1.5,
    cooldown: 5,
    person: { kind: ['friend', 'bestFriend'], minRelationship: 20 },
    choices: [
      {
        id: 'apologise',
        label: 'Apologize first',
        effects: [
          { karma: 2 },
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 4 }, { log: 'I said sorry. {{They}} said sorry. The charger was never mentioned again.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -4 }, { log: '{{They}} accepted the apology like a parking ticket. Something had changed.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'wait',
        label: 'Wait for {{them}} to blink',
        effects: [
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.5,
            then: [{ queue: 'fs_olive_branch' }, { log: 'A week passed. Then two. Then my phone buzzed.' }],
            else: [{ relationship: 'person', delta: -12 }, { log: 'Neither of us blinked. Weeks became months.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'cut',
        label: 'Cut {{them}} off for good',
        effects: [
          { stat: 'happiness', delta: -5 },
          { karma: -2 },
          { log: 'I deleted the number. It felt strong for a day and hollow for a year.', kind: 'bad' },
          { removePerson: true },
        ],
      },
    ],
  },
  {
    id: 'fs_olive_branch',
    category: 'friends',
    title: 'Olive branch',
    text: '{{person}} showed up at my door with two hot chocolates and a face that said we were absolutely not going to discuss the fight. One of them was for me.',
    minAge: 12,
    maxAge: 90,
    weight: 1,
    followUpOnly: true,
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'accept',
        label: 'Take the hot chocolate',
        effects: [
          { relationship: 'person', delta: 12 },
          { stat: 'happiness', delta: 4 },
          { log: 'We drank the hot chocolate and talked about anything else. It was enough.', kind: 'good' },
        ],
      },
      {
        id: 'discuss',
        label: 'Bring up the fight anyway',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 16 }, { log: 'We finally said the real things. The friendship got sturdier.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -8 }, { log: 'The hot chocolate went cold while we had the whole fight again.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'fs_ghost_returns',
    category: 'friends',
    title: 'The ghost returns',
    text: '{{person}} vanished from my life without a word a while back. Today a message arrived: "hey stranger, long time!" plus a smiley face, as if nothing happened.',
    minAge: 14,
    maxAge: 90,
    weight: 1.2,
    cooldown: 5,
    person: { kind: ['friend', 'bestFriend'], maxRelationship: 35 },
    choices: [
      {
        id: 'welcome',
        label: 'Welcome {{them}} back',
        effects: [
          { relationship: 'person', delta: 15 },
          { stat: 'happiness', delta: 3 },
          { karma: 1 },
          {
            chance: 0.35,
            then: [{ relationship: 'person', delta: -15 }, { log: '{{They}} was back for a month, then gone again. I should have seen it coming.', kind: 'bad' }],
            else: [{ log: '{{They}} had been through something. We picked up like no time had passed.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'cautious',
        label: 'Ask what happened first',
        effects: [
          { relationship: 'person', delta: 10 },
          { stat: 'smarts', delta: 1 },
          { log: '{{They}} gave a real answer. Not a great one, but a real one.' },
        ],
      },
      {
        id: 'ghost_back',
        label: 'Leave it on read',
        effects: [
          { karma: -2 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -10 },
          { log: 'I let the message sit there forever. Petty, but balanced.' },
        ],
      },
    ],
  },
  {
    id: 'fs_road_trip',
    category: 'friends',
    title: 'Road trip',
    text: '{{person}} turned up with a map, a playlist and a theory that the coast is only six hours away. {{They}} wants to leave tonight and split the gas.',
    minAge: 18,
    maxAge: 70,
    weight: 1.2,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend'], minRelationship: 40 },
    choices: [
      {
        id: 'go',
        label: 'Pack a bag',
        hint: '{{$300}}',
        effects: [
          { money: -300 },
          { energy: -1 },
          { relationship: 'person', delta: 8 },
          {
            random: [
              { weight: 5, effects: [{ stat: 'happiness', delta: 8 }, { log: 'The coast was nine hours away and worth every one. We sang the whole way.', kind: 'good' }] },
              {
                weight: 3,
                effects: [
                  { stat: 'happiness', delta: 4 },
                  { log: 'We broke down outside a town with one diner and made friends with the mechanic.' },
                  { chance: 0.5, then: [{ newPerson: { kind: 'friend', relationship: 50, log: '{{person}} the mechanic kept in touch after the road trip.' } }] },
                ],
              },
              { weight: 2, effects: [{ stat: 'happiness', delta: -2 }, { money: -200 }, { log: 'We got lost, argued about the map and paid for a motel that smelled of carpet.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'no',
        label: 'Say I am busy',
        effects: [
          { relationship: 'person', delta: -4 },
          { stat: 'happiness', delta: -1 },
          { log: 'I stayed home and saw the photos. The coast looked fine without me.' },
        ],
      },
      {
        id: 'day',
        label: 'Counter with a day trip',
        hint: '{{$60}}',
        effects: [
          { money: -60 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 3 },
          { log: 'We went to a lake two hours away and came home the same night. Cheap, good.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'fs_big_news',
    category: 'friends',
    title: 'Big news',
    text: '{{person}} sat me down with the face people use for big news. {{They}} has been offered a job on the other side of the country and {{they}} is taking it.',
    minAge: 18,
    maxAge: 80,
    weight: 1.2,
    cooldown: 6,
    person: { kind: ['friend', 'bestFriend'], minRelationship: 40 },
    choices: [
      {
        id: 'party',
        label: 'Throw a going-away party',
        hint: '{{$200}}',
        effects: [
          { money: -200 },
          { relationship: 'person', delta: 10 },
          { stat: 'happiness', delta: 3 },
          { karma: 1 },
          { log: 'The party ran until the neighbors complained. {{person}} cried in a good way.', kind: 'good' },
          {
            chance: 0.6,
            then: [{ log: 'We still talk every week. Distance turned out to be only distance.' }],
            else: [{ relationship: 'person', delta: -10 }, { log: 'The calls got shorter. Then they became birthday messages.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'happy',
        label: 'Be genuinely happy',
        effects: [
          { relationship: 'person', delta: 5 },
          { karma: 1 },
          {
            chance: 0.5,
            then: [{ log: '{{They}} promised to visit and actually did. Twice.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -8 }, { log: 'Life swallowed {{them}} up over there. I understood.' }],
          },
        ],
      },
      {
        id: 'sulk',
        label: 'Take it personally',
        effects: [
          { relationship: 'person', delta: -8 },
          { stat: 'happiness', delta: -4 },
          { log: 'I asked how {{they}} could leave me. The silence answered.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'fs_borrow_car',
    category: 'friends',
    title: 'Borrow the car',
    text: '{{person}} asked to borrow my car for the weekend. {{They}} said {{their}} driving had improved a lot since the thing with the mailbox. {{They}} brought up the mailbox first.',
    minAge: 18,
    maxAge: 80,
    weight: 1.2,
    cooldown: 4,
    conditions: [{ inPrison: false }, { any: [{ ownsAsset: 'car' }, { money: { gte: 3000 } }] }],
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'keys',
        label: 'Hand over the keys',
        effects: [
          { relationship: 'person', delta: 6 },
          {
            chance: 0.65,
            then: [{ log: 'It came back washed, with a full tank. I had misjudged {{them}} and the mailbox.', kind: 'good' }],
            else: [
              { asset: 'damage', kind: 'car', amount: 20 },
              { money: -400 },
              { relationship: 'person', delta: -5 },
              { log: 'It came back with a new dent and a note that said sorry in bubble letters.', kind: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'no',
        label: 'Say no, politely',
        effects: [
          { relationship: 'person', delta: -5 },
          { stat: 'happiness', delta: 1 },
          { log: '{{They}} said it was fine, took the bus, and sent me a photo of the bus.' },
        ],
      },
      {
        id: 'drive',
        label: 'Offer to drive {{them}}',
        effects: [
          { energy: -1 },
          { relationship: 'person', delta: 5 },
          { stat: 'happiness', delta: 2 },
          { log: 'I drove. We talked for three hours. Better than a dent.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'fs_couch_guest',
    category: 'friends',
    title: 'Couch guest',
    text: '{{person}} needs a place to stay for "two weeks, maybe three" while things settle. {{They}} has a suitcase and a cactus and {{they}} is already standing in my doorway.',
    minAge: 20,
    maxAge: 80,
    weight: 1.2,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'yes',
        label: 'Clear the couch',
        effects: [
          { karma: 3 },
          { relationship: 'person', delta: 8 },
          {
            random: [
              { weight: 5, effects: [{ stat: 'happiness', delta: 2 }, { money: -150 }, { log: '{{They}} stayed two weeks, cooked every night and left the cactus as a thank-you.', kind: 'good' }] },
              { weight: 4, effects: [{ stat: 'happiness', delta: -6 }, { money: -400 }, { log: 'Two weeks became four months. I learned {{their}} shower schedule by heart.', kind: 'bad' }] },
              {
                weight: 1,
                effects: [
                  { stat: 'happiness', delta: 4 },
                  { log: 'The couch became a social hub. My place has never been livelier.', kind: 'good' },
                  { newPerson: { kind: 'friend', relationship: 50, log: '{{person}} came over to visit my house guest and stayed as a friend.' } },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'no',
        label: 'Say the couch is taken',
        effects: [
          { relationship: 'person', delta: -8 },
          { karma: -2 },
          { stat: 'happiness', delta: -1 },
          { log: '{{They}} nodded and dragged the suitcase back down the stairs. I heard every step.', kind: 'bad' },
        ],
      },
      {
        id: 'help',
        label: 'Help {{them}} find a place',
        hint: '{{$200}}',
        effects: [
          { money: -200 },
          { karma: 2 },
          { relationship: 'person', delta: 4 },
          { log: 'I paid a deposit and made some calls. {{They}} moved in somewhere else by Friday.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'fs_friend_loan',
    category: 'friends',
    title: 'Friendly loan',
    text: '{{person}} asked to borrow {{$500}} "just until payday," with the look of someone who has rehearsed the sentence. Payday was not specified.',
    minAge: 16,
    maxAge: 85,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }, { money: { gte: 500 } }],
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'lend',
        label: 'Lend the money',
        hint: '{{$500}}',
        effects: [
          { money: -500 },
          { karma: 2 },
          { relationship: 'person', delta: 5 },
          { log: 'I handed it over and told myself not to think about it.', kind: 'money' },
          { chance: 0.55, then: [{ queue: 'fs_loan_repaid' }], else: [{ queue: 'fs_loan_unpaid' }] },
        ],
      },
      {
        id: 'half',
        label: 'Offer half as a gift',
        hint: '{{$250}}',
        effects: [
          { money: -250 },
          { karma: 3 },
          { relationship: 'person', delta: 4 },
          { log: 'I gave {{them}} half and said not to pay it back. Cheaper than hoping.', kind: 'money' },
        ],
      },
      {
        id: 'no',
        label: 'Say money ruins friendships',
        effects: [
          { relationship: 'person', delta: -6 },
          { stat: 'happiness', delta: -1 },
          { log: '{{They}} said {{they}} understood. {{They}} understood a little coldly.' },
        ],
      },
    ],
  },
  {
    id: 'fs_loan_repaid',
    category: 'friends',
    title: 'Loan repaid',
    text: 'Months later, {{person}} turned up with an envelope, the exact amount, and a cake with "THANK YOU" piped on it in slightly panicked icing.',
    minAge: 16,
    maxAge: 85,
    weight: 1,
    followUpOnly: true,
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'accept',
        label: 'Take the money and cake',
        effects: [
          { money: 500 },
          { relationship: 'person', delta: 4 },
          { log: 'Debt cleared, cake eaten. The friendship survived payday.', kind: 'money' },
        ],
      },
      {
        id: 'refuse',
        label: 'Keep only the cake',
        effects: [
          { karma: 4 },
          { relationship: 'person', delta: 12 },
          { stat: 'happiness', delta: 2 },
          { log: 'I told {{them}} to keep it. {{They}} hugged me for an uncomfortably long time.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'fs_loan_unpaid',
    category: 'friends',
    title: 'Loan gone quiet',
    text: 'Payday came and went. {{person}} has become very interested in {{their}} phone whenever I walk in, and the loan is never mentioned.',
    minAge: 16,
    maxAge: 85,
    weight: 1,
    followUpOnly: true,
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'letgo',
        label: 'Write it off quietly',
        effects: [
          { karma: 2 },
          { stat: 'happiness', delta: -2 },
          { log: 'I decided the money was a gift and the lesson was free.' },
        ],
      },
      {
        id: 'ask',
        label: 'Ask for it directly',
        effects: [
          {
            chance: 0.4,
            then: [{ money: 500 }, { relationship: 'person', delta: -2 }, { log: '{{They}} paid it back in installments and a lot of apologies.', kind: 'money' }],
            else: [{ relationship: 'person', delta: -12 }, { log: '{{They}} got defensive. I got nothing. We both got awkward.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'public',
        label: 'Mention it in company',
        effects: [
          { karma: -4 },
          { relationship: 'person', delta: -18 },
          {
            chance: 0.5,
            then: [{ money: 500 }, { log: 'Shamed in public, {{they}} paid the next day. We have not spoken since.', kind: 'money' }],
            else: [{ log: 'Everyone looked at their shoes. The money stayed lost, and so did a friend.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'fs_wedding_speech',
    category: 'friends',
    title: 'Wedding speech',
    text: '{{person}} is getting married and wants me to give the speech. {{They}} said "no pressure" with the eyes of someone applying enormous pressure.',
    minAge: 20,
    maxAge: 75,
    weight: 1,
    cooldown: 8,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend'], minRelationship: 50, minAge: 18 },
    choices: [
      {
        id: 'prepare',
        label: 'Write it properly',
        effects: [
          { stat: 'smarts', delta: 1 },
          { energy: -1 },
          {
            chance: 0.75,
            then: [{ relationship: 'person', delta: 10 }, { stat: 'happiness', delta: 6 }, { log: 'People laughed where they should and cried where I hoped. {{person}} hugged me twice.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: 3 }, { log: 'The jokes landed on a table of relatives who did not get them. It was fine.' }],
          },
        ],
      },
      {
        id: 'wing',
        label: 'Wing it on the day',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 8 }, { log: 'I spoke from the heart and somehow it worked. Nobody could believe it, least of all me.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -5 }, { relationship: 'person', delta: -6 }, { log: "I forgot {{their}} partner's name halfway through. Twice.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Decline gracefully',
        effects: [
          { relationship: 'person', delta: -8 },
          { stat: 'happiness', delta: 1 },
          { log: 'I said I was better in writing and sent a card. The card was fine.' },
        ],
      },
    ],
  },
  {
    id: 'fs_powder_pitch',
    category: 'friends',
    title: 'The powder pitch',
    text: '{{person}} invited me over to "catch up," which turned out to mean a slideshow about a wellness powder {{they}} now sells. {{They}} keeps saying I could be {{their}} first recruit.',
    minAge: 18,
    maxAge: 80,
    weight: 1.2,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'buy',
        label: 'Buy a starter kit',
        hint: '{{$300}}',
        effects: [
          { money: -300 },
          { relationship: 'person', delta: 5 },
          { stat: 'happiness', delta: -2 },
          { log: 'I own forty sachets of green powder now. {{person}} was thrilled. I am not.', kind: 'money' },
        ],
      },
      {
        id: 'decline',
        label: 'Politely decline',
        effects: [
          { relationship: 'person', delta: -3 },
          { log: 'I said the powder was not for me. {{They}} sent me three links anyway.' },
        ],
      },
      {
        id: 'intervene',
        label: 'Tell {{them}} it is a scheme',
        effects: [
          { karma: 2 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 8 }, { log: '{{They}} argued, went quiet, then quit a month later. We never mention the powder.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -12 }, { log: '{{They}} said I was negative energy. The slideshow continued without me.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'fs_friend_hospital',
    category: 'friends',
    title: 'Friend in the hospital',
    text: '{{person}} took a bad fall off a bike and is in the hospital for a couple of weeks, bored, bandaged and texting me pictures of the ceiling.',
    // From 13: the flowers-and-snacks option is a teen-sized spend, not pocket money.
    minAge: 13,
    maxAge: 90,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'daily',
        label: 'Visit every day',
        effects: [
          { energy: -1 },
          { relationship: 'person', delta: 10 },
          { karma: 3 },
          { stat: 'happiness', delta: -1 },
          { log: 'I learned the vending machine by heart. {{person}} says I got {{them}} through it.', kind: 'good' },
        ],
      },
      {
        id: 'flowers',
        label: 'Send flowers and snacks',
        hint: '{{$60}}',
        effects: [
          { money: -60 },
          { relationship: 'person', delta: 4 },
          { karma: 1 },
          { log: 'The nurses ate most of the snacks. {{person}} said the thought counted.' },
        ],
      },
      {
        id: 'avoid',
        label: 'Hospitals give me the creeps',
        effects: [
          { relationship: 'person', delta: -10 },
          { stat: 'happiness', delta: -3 },
          { log: 'I sent one message and felt bad every day {{they}} was in there.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'fs_copycat',
    category: 'friends',
    title: 'The copycat',
    text: '{{person}} has started dressing like me, talking like me and ordering what I order. Yesterday {{they}} told my own joke back to me and got a bigger laugh.',
    minAge: 10,
    maxAge: 50,
    weight: 1,
    cooldown: 5,
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'flattered',
        label: 'Take it as a compliment',
        effects: [
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 4 },
          { log: 'Imitation, flattery, et cetera. I upgraded the joke so {{they}} would have to catch up.', kind: 'good' },
        ],
      },
      {
        id: 'confront',
        label: 'Ask {{them}} to stop',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: -3 }, { log: '{{They}} was mortified and switched jackets. Things went back to normal.' }],
            else: [{ relationship: 'person', delta: -10 }, { log: '{{They}} said I did not own a haircut. Technically correct.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'outdo',
        label: 'Reinvent my whole look',
        effects: [
          { stat: 'happiness', delta: -2 },
          { stat: 'looks', delta: 2 },
          { log: 'I reinvented my whole look to escape {{them}}. {{They}} copied the new one within a week.' },
        ],
      },
    ],
  },
  {
    id: 'fs_blanket_fort',
    category: 'friends',
    title: 'Blanket fort',
    text: '{{person}} and I built a blanket fort in the living room with a tunnel, a flag and a strict no-grown-ups policy. It is honestly our best work.',
    minAge: 6,
    maxAge: 11,
    weight: 2,
    cooldown: 3,
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'nation',
        label: 'Declare it a nation',
        effects: [
          { stat: 'happiness', delta: 4 },
          { stat: 'smarts', delta: 1 },
          { relationship: 'person', delta: 4 },
          { log: 'We wrote a constitution on a napkin. Article one: snacks are free.', kind: 'good' },
        ],
      },
      {
        id: 'invite',
        label: 'Invite the whole street',
        effects: [
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 2 },
          { log: 'Half the street fit inside. The flag got a second flag.', kind: 'good' },
          { chance: 0.5, then: [{ newPerson: { kind: 'friend', relationship: 55, log: '{{person}} from down the street joined the fort and stayed a friend.' } }] },
          { chance: 0.3, then: [{ log: 'The fort collapsed under the weight of democracy. We rebuilt it better.' }] },
        ],
      },
      {
        id: 'charge',
        label: 'Charge admission',
        effects: [
          { money: 5 },
          { karma: -1 },
          { relationship: 'person', delta: -2 },
          { log: 'I charged coins at the tunnel. {{person}} said that was not what the fort was for.', kind: 'money' },
        ],
      },
    ],
  },
  {
    id: 'fs_doorbell_dare',
    category: 'friends',
    title: 'Doorbell dare',
    text: '{{person}} dared me to ring the doorbell at the corner house and run. {{They}} said everyone does it. Nobody we know has ever actually done it.',
    minAge: 8,
    maxAge: 15,
    weight: 1.5,
    cooldown: 3,
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'do',
        label: 'Do it',
        effects: [
          { relationship: 'person', delta: 5 },
          {
            chance: 0.65,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I rang it and ran faster than I knew I could. Legend status achieved.', kind: 'good' }],
            else: [{ karma: -2 }, { stat: 'happiness', delta: -3 }, { relationship: 'mother', delta: -2 }, { log: 'The man in the corner house opened the door before I reached the sidewalk. He walked me home.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse the dare',
        effects: [
          { karma: 1 },
          { relationship: 'person', delta: -3 },
          { log: '{{person}} called me chicken for a week. The doorbell stayed unrung.' },
        ],
      },
      {
        id: 'reverse',
        label: 'Dare {{them}} back',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 3 }, { log: '{{They}} did it and got chased by a very small dog. Best day ever.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { log: '{{They}} refused too. We stood on the corner, both chickens, bonded by it.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'fs_sleepover',
    category: 'friends',
    title: 'The sleepover',
    text: "Sleepover at {{person}}'s house. Lights off, flashlights on, and {{they}} has promised a ghost story so scary that {{their}} cousin once had to go home.",
    minAge: 6,
    maxAge: 13,
    weight: 2,
    cooldown: 3,
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'stayup',
        label: 'Stay up all night',
        effects: [
          { stat: 'happiness', delta: 4 },
          { stat: 'health', delta: -1 },
          { relationship: 'person', delta: 4 },
          { log: 'We talked until it got light. I have never been so tired or so happy.', kind: 'good' },
        ],
      },
      {
        id: 'home',
        label: 'Call home at midnight',
        effects: [
          { stat: 'happiness', delta: -2 },
          { stat: 'health', delta: 1 },
          { relationship: 'person', delta: -3 },
          { log: 'I got picked up at midnight in my pajamas. {{person}} was nice about it. Too nice.', kind: 'bad' },
        ],
      },
      {
        id: 'scariest',
        label: 'Tell the scariest story',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 5 }, { stat: 'smarts', delta: 1 }, { log: 'My story won. {{person}} slept with the flashlight on and respected me forever.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -1 }, { log: "I scared {{them}} so badly {{their}} parents came in. The sleepover ended early.", kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'fs_corner_office',
    category: 'friends',
    title: 'Corner office',
    text: '{{person}} got a huge promotion and a corner office with a plant in it. {{They}} told me over dinner, and then {{they}} paid for dinner, which somehow made it worse.',
    minAge: 22,
    maxAge: 65,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend'], minAge: 20 },
    choices: [
      {
        id: 'celebrate',
        label: 'Celebrate {{them}} properly',
        effects: [
          { karma: 2 },
          { relationship: 'person', delta: 6 },
          { stat: 'happiness', delta: -1 },
          { log: 'I toasted {{their}} plant and meant most of it.', kind: 'good' },
        ],
      },
      {
        id: 'advice',
        label: 'Ask how {{they}} did it',
        effects: [
          { stat: 'smarts', delta: 2 },
          { relationship: 'person', delta: 3 },
          {
            chance: 0.5,
            then: [{ jobPerformance: 6 }, { log: '{{They}} gave me real advice. I wrote it down and actually used it.', kind: 'good' }],
            else: [{ log: 'The advice was "be yourself," which is hard to act on.' }],
          },
        ],
      },
      {
        id: 'seethe',
        label: 'Seethe quietly',
        effects: [
          { stat: 'happiness', delta: -4 },
          { relationship: 'person', delta: -4 },
          { karma: -1 },
          { log: 'I said congratulations with my teeth. {{They}} noticed the teeth.', kind: 'bad' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ strangers
  {
    id: 'fs_lost_tourist',
    category: 'friends',
    title: 'Lost tourist',
    text: 'A tourist stopped me in {{city}} holding a map upside down and asking, with great confidence, for a street that does not exist. They had been walking for two hours.',
    // From 14: walking a stranger across the city (and lunch with them) is not a ten-year-old's call.
    minAge: 14,
    maxAge: 90,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'walk',
        label: 'Walk them there myself',
        effects: [
          { karma: 2 },
          { energy: -1 },
          { stat: 'happiness', delta: 2 },
          { log: 'We found the street. It did exist, under a different name, in the other direction.', kind: 'good' },
          { chance: 0.3, then: [{ money: 20 }, { log: 'They insisted on buying me lunch. The lunch was excellent.', kind: 'money' }] },
          { chance: 0.2, then: [{ newPerson: { kind: 'friend', relationship: 45, log: '{{person}}, the lost tourist, turned out to be great company. We stayed in touch.' } }] },
        ],
      },
      {
        id: 'point',
        label: 'Point vaguely and leave',
        effects: [{ karma: -1 }, { log: 'I pointed at a hill. I hope the hill helped.' }],
      },
      {
        id: 'wrong',
        label: 'Send them the wrong way',
        effects: [
          { karma: -4 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -3 }, { log: 'I saw them again at sunset, still walking. I felt it in my stomach.', kind: 'bad' }],
            else: [{ log: 'I never saw them again. The city is large and I am small.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'fs_film_crew',
    category: 'friends',
    title: 'Film crew',
    text: 'A film crew has taken over three streets of {{city}}. There are cables everywhere, a man with a megaphone, and a sign saying they need extras who can "walk naturally."',
    // From 14: working as a paid extra or complaining to a producer is a teen-or-older move.
    minAge: 14,
    maxAge: 90,
    weight: 1,
    cooldown: 6,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'extra',
        label: 'Sign up as an extra',
        effects: [
          { money: 150 },
          { fame: 1 },
          { energy: -1 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I walked naturally forty times. My elbow is in a real film.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'They cut my scene. My elbow was not natural enough.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'watch',
        label: 'Watch from behind the barrier',
        effects: [
          { stat: 'happiness', delta: 2 },
          { log: 'I watched the same door open and close for an hour. Oddly hypnotic.' },
          { chance: 0.2, then: [{ newPerson: { kind: 'friend', relationship: 50, log: 'I met {{person}} behind the barrier. We bonded over the man with the megaphone.' } }] },
        ],
      },
      {
        id: 'complain',
        label: 'Complain about the noise',
        effects: [
          {
            chance: 0.5,
            then: [{ money: 100 }, { stat: 'happiness', delta: 2 }, { log: 'The producer paid me for the inconvenience. I will be inconvenienced any time.', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -3 }, { karma: -1 }, { log: 'The man with the megaphone used it on me. The whole street heard.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'fs_coffee_paid',
    category: 'friends',
    title: 'Coffee on them',
    text: 'I reached the counter and the barista waved me off: the stranger ahead of me had paid for my coffee and left without looking back. I stood there holding a cup and a feeling.',
    minAge: 16,
    maxAge: 90,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'forward',
        label: 'Pay for the next person',
        hint: '{{$5}}',
        effects: [
          { money: -5 },
          { karma: 3 },
          { stat: 'happiness', delta: 3 },
          { log: 'I paid for the next order. It was a large one. The feeling held.', kind: 'good' },
        ],
      },
      {
        id: 'keep',
        label: 'Enjoy a free coffee',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'Free coffee. Zero notes. A perfect transaction.' }],
      },
      {
        id: 'chase',
        label: 'Run after them to say thanks',
        effects: [
          { energy: -1 },
          {
            chance: 0.35,
            then: [{ stat: 'happiness', delta: 4 }, { newPerson: { kind: 'friend', relationship: 50, log: 'I caught up with {{person}}, who paid for my coffee, and we became friends.' } }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'I lost them at the crosswalk. Somewhere out there is a stranger I owe.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'fs_mystery_package',
    category: 'friends',
    title: 'Mystery package',
    text: 'A package arrived with my name on it that I did not order. No note, no return address, just a box that is heavier than it looks and smells faintly of cinnamon.',
    // From 16: one outcome is a subscription bill in my name.
    minAge: 16,
    maxAge: 90,
    weight: 1.2,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'open',
        label: 'Open it',
        effects: [
          {
            random: [
              { weight: 4, effects: [{ stat: 'happiness', delta: 4 }, { log: 'Two hundred identical left socks. No explanation. I am set for life, on one side.' }] },
              { weight: 3, effects: [{ money: 150 }, { stat: 'happiness', delta: 3 }, { log: 'A beautiful antique clock, addressed correctly. Someone out there likes me.', kind: 'money' }] },
              { weight: 2, effects: [{ stat: 'happiness', delta: -2 }, { money: -80 }, { log: 'A bill for a cinnamon subscription I never started. Canceling cost more than keeping it.', kind: 'bad' }] },
              { weight: 1, effects: [{ stat: 'happiness', delta: 6 }, { stat: 'smarts', delta: 2 }, { log: 'A box of books, each with margin notes from a reader I will never meet.', kind: 'good' }] },
            ],
          },
        ],
      },
      {
        id: 'return',
        label: 'Return to sender',
        effects: [{ karma: 1 }, { log: 'I sent it back unopened. I still think about the cinnamon.' }],
      },
      {
        id: 'porch',
        label: 'Leave it on the doorstep',
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'It sat there for a week, then it was gone. Case closed, I suppose.' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'A neighbor took it in and now talks about my "cinnamon situation."', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'fs_hedge_war',
    category: 'friends',
    title: 'The hedge war',
    text: 'My neighbor has decided the hedge between us is theirs, mine, and a crime, depending on the day. Today a note appeared on my door with a diagram.',
    minAge: 20,
    maxAge: 90,
    weight: 1.2,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'escalate',
        label: 'Reply with a bigger diagram',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'My diagram had a legend and a scale. They surrendered the hedge.', kind: 'good' }],
            else: [{ money: -300 }, { karma: -2 }, { stat: 'happiness', delta: -3 }, { log: 'A surveyor got involved. The hedge is officially theirs and I paid for the survey.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'cake',
        label: 'Bring over a cake',
        hint: '{{$20}}',
        effects: [
          { karma: 2 },
          { money: -20 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { newPerson: { kind: 'friend', relationship: 50, log: 'The cake worked. My neighbor {{person}} is now a friend who co-owns a hedge.' } }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'They took the cake and kept the diagram. Progress, of a kind.' }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Let the hedge grow',
        effects: [{ stat: 'happiness', delta: -2 }, { log: 'The hedge is now twelve feet tall. Neither of us can see the other. Peace.' }],
      },
    ],
  },
  {
    id: 'fs_pigeon_situation',
    category: 'friends',
    title: 'Pigeon situation',
    text: 'A pigeon has moved into my room. It arrived through the window, inspected the furniture, and sat on the lamp as if it owned the place.',
    minAge: 6,
    maxAge: 90,
    weight: 1.2,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'adopt',
        label: 'Adopt the pigeon',
        effects: [
          { newPerson: { kind: 'pet', species: 'pigeon', relationship: 60, log: '{{person}} the pigeon is officially part of the household.' } },
          { stat: 'happiness', delta: 4 },
          { stat: 'health', delta: -1 },
          { karma: 1 },
          { log: 'I named it. It still sits on the lamp, but now it is my lamp pigeon.', kind: 'good' },
        ],
      },
      {
        id: 'shoo',
        label: 'Shoo it out the window',
        effects: [
          {
            chance: 0.6,
            then: [{ log: 'It left with a look of deep disappointment. The lamp feels empty.' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'It came back with two friends. The lamp is now a committee.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'coexist',
        label: 'Ignore it and coexist',
        effects: [
          { stat: 'happiness', delta: 2 },
          { stat: 'health', delta: -1 },
          { log: 'We have an understanding. It gets the lamp, I get everything else, mostly.' },
        ],
      },
    ],
  },
  {
    id: 'fs_viral_moment',
    category: 'friends',
    title: 'Fifteen minutes',
    text: 'A clip of me tripping over a curb, recovering with a bow, and then tripping again has been shown on the {{city}} evening news. Strangers are doing the bow at me.',
    minAge: 13,
    maxAge: 90,
    weight: 1,
    cooldown: 8,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'lean',
        label: 'Lean into it',
        effects: [
          { fame: 4 },
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -3 }, { log: 'The bow became a meme. The meme became my whole personality for a year.', kind: 'bad' }],
            else: [{ log: 'I did the bow at the supermarket and got a round of applause.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'hide',
        label: 'Lie low until it passes',
        effects: [{ stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 2 }, { log: 'I wore a hat and stayed in with books for a month. Someone did the bow at the hat.' }],
      },
      {
        id: 'interviews',
        label: 'Do the local interviews',
        effects: [
          { money: 200 },
          { fame: 3 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'The interview went well. I am now "the bow person," which I accept.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'I tripped on the way into the studio. On camera. It got a second segment.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'fs_lookalike',
    category: 'friends',
    title: 'The lookalike',
    text: 'The man at the next table looked exactly like a famous singer, and by the time the second waiter asked for a photo, he had stopped correcting people. He winked at me.',
    // Adults only: a strange man winking at me and an evening in his "entourage".
    minAge: 18,
    maxAge: 90,
    weight: 1,
    cooldown: 6,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'entourage',
        label: 'Join his entourage',
        effects: [
          { stat: 'happiness', delta: 5 },
          { karma: -1 },
          { money: 40 },
          { log: 'I was "security" for an evening. We ate for free and signed four napkins.', kind: 'good' },
          { chance: 0.3, then: [{ stat: 'happiness', delta: -4 }, { money: -40 }, { log: 'The manager worked it out at dessert. The bill arrived and security was let go.', kind: 'bad' }] },
        ],
      },
      {
        id: 'selfie',
        label: 'Ask for a photo anyway',
        effects: [{ stat: 'happiness', delta: 3 }, { log: "The photo is on my wall. I tell people he's the real one. He might be." }],
      },
      {
        id: 'expose',
        label: 'Tell the waiter the truth',
        effects: [
          { karma: 2 },
          { stat: 'happiness', delta: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'The waiter laughed. The lookalike bought me dessert for honesty.', kind: 'good' }],
            else: [{ log: 'The whole restaurant deflated. I had killed a nice evening with facts.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'fs_flat_tyre',
    category: 'friends',
    title: 'Flat tire',
    text: 'On the road out of {{city}} I passed a car on the shoulder with a flat tire and a driver staring at the jack as if it had insulted them.',
    minAge: 18,
    maxAge: 85,
    weight: 1.2,
    cooldown: 3,
    // I am driving: a car, or enough money that I plausibly have one (the sampler never buys cars).
    conditions: [{ inPrison: false }, { any: [{ ownsAsset: 'car' }, { money: { gte: 3000 } }] }],
    choices: [
      {
        id: 'help',
        label: 'Stop and help',
        effects: [
          { karma: 3 },
          { energy: -1 },
          {
            random: [
              { weight: 5, effects: [{ stat: 'happiness', delta: 3 }, { log: 'We changed it together. They waved until I was out of sight.', kind: 'good' }] },
              { weight: 2, effects: [{ money: 50 }, { log: 'They pressed some cash into my hand and would not take no.', kind: 'money' }] },
              { weight: 2, effects: [{ stat: 'happiness', delta: 3 }, { newPerson: { kind: 'friend', relationship: 50, log: '{{person}} with the flat tire turned out to live nearby. We are friends now.' } }] },
              { weight: 1, effects: [{ stat: 'happiness', delta: -1 }, { log: 'Grease up to my elbows, then the jack slipped. Nobody was hurt but my shirt.' }] },
            ],
          },
        ],
      },
      {
        id: 'call',
        label: 'Call roadside assistance for them',
        effects: [{ karma: 1 }, { log: 'I made a call from my window and drove on. Civic, if a little distant.' }],
      },
      {
        id: 'pass',
        label: 'Drive on',
        effects: [{ karma: -2 }, { stat: 'happiness', delta: -1 }, { log: 'I had places to be. I thought about the jack all evening.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'fs_wrong_number',
    category: 'friends',
    title: 'Wrong number',
    text: 'A text arrived from a number I did not know: "Don\'t forget the lemons, Nana\'s counting on you." I do not know Nana. I have no lemons.',
    minAge: 13,
    maxAge: 90,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'reply',
        label: 'Explain the mix-up',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { newPerson: { kind: 'friend', relationship: 50, log: 'The wrong number was {{person}}. We kept texting. Nana got her lemons.' } }],
            else: [{ log: 'They apologized and vanished. I hope the lemons arrived.' }],
          },
        ],
      },
      {
        id: 'pun',
        label: 'Reply with a lemon pun',
        effects: [
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.45,
            then: [{ newPerson: { kind: 'friend', relationship: 55, log: '{{person}} replied with a worse pun. We have been friends ever since.' } }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'They did not get the pun. Or they got it and chose silence.' }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore it',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I deleted it. Somewhere, Nana waits.' }],
      },
    ],
  },
  {
    id: 'fs_lost_dog',
    category: 'friends',
    title: 'Dog with a collar',
    text: 'A dog with a collar and no owner followed me home from the park, sat on my step and looked at me like I was late. The tag has a phone number.',
    minAge: 8,
    maxAge: 90,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'call',
        label: 'Call the number',
        effects: [
          { karma: 3 },
          { stat: 'happiness', delta: 2 },
          {
            random: [
              { weight: 5, effects: [{ money: 50 }, { log: 'The owner arrived in tears and pressed a reward on me. The dog did not look back.', kind: 'money' }] },
              { weight: 3, effects: [{ newPerson: { kind: 'friend', relationship: 50, log: "The dog's owner, {{person}}, kept inviting me on walks. Now we are friends." } }] },
              { weight: 2, effects: [{ log: 'No answer, so I left a message. They came the next morning, grateful and sleepless.' }] },
            ],
          },
        ],
      },
      {
        id: 'keep',
        label: 'Keep the dog',
        effects: [
          { karma: -6 },
          { newPerson: { kind: 'pet', species: 'dog', relationship: 65, log: '{{person}} the dog decided to stay, collar and all.' } },
          { stat: 'happiness', delta: 5 },
          {
            chance: 0.3,
            then: [{ karma: -3 }, { stat: 'happiness', delta: -4 }, { log: 'The owner spotted the dog in my yard. We argued. The whole street knows.', kind: 'bad' }],
            else: [{ log: 'Nobody came looking. I took the tag off and told myself a story about it.' }],
          },
        ],
      },
      {
        id: 'walk',
        label: 'Pretend not to notice',
        effects: [{ karma: -2 }, { stat: 'happiness', delta: -2 }, { log: 'I closed the door. The dog sat there until dark. I did not sleep well.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'fs_street_musician',
    category: 'friends',
    title: 'Street musician',
    text: 'A street musician outside the station in {{city}} was playing something so good that the whole crowd had stopped pretending to be in a hurry. Their case held three coins.',
    // From 14: old enough to be at the station alone, commuting.
    minAge: 14,
    maxAge: 90,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'coins',
        label: 'Drop some money in',
        hint: '{{$5}}',
        effects: [
          { money: -5 },
          { karma: 1 },
          { stat: 'happiness', delta: 2 },
          { log: 'I added a bill to the three coins. They nodded without missing a beat.', kind: 'good' },
        ],
      },
      {
        id: 'stay',
        label: 'Stay for the whole set',
        effects: [
          { stat: 'happiness', delta: 4 },
          { energy: -1 },
          { log: 'I missed my train and did not mind. Some songs are worth being late for.' },
          { chance: 0.2, then: [{ newPerson: { kind: 'friend', relationship: 50, log: 'The musician, {{person}}, and I got talking after the set. Now we are friends.' } }] },
        ],
      },
      {
        id: 'request',
        label: 'Request a song',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'They knew it. The whole crowd sang the chorus. Best commute of my life.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'They played it slowly, sadly and in the wrong key. I had asked for that.' }],
          },
        ],
      },
      {
        id: 'heckle',
        label: 'Heckle',
        effects: [
          { karma: -3 },
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -4 }, { log: 'They heckled back with a song about me. The crowd took their side.', kind: 'bad' }],
            else: [{ log: 'Nobody laughed. I left before the next song.' }],
          },
        ],
      },
    ],
  },
];

import type { EventDef } from '@/engine/events/schema';

/**
 * Ages 60+: retirement parties, grandchildren, downsizing, scam calls, a fall,
 * memory lapses, mentoring, memoirs, bucket lists, old flames, hearing aids,
 * surprise birthdays, being asked for advice, outliving friends, late-life
 * romance and community awards. Gentle, funny, bittersweet. Follow-ups
 * (followUpOnly) are queued by the events that set them up.
 */
export const LATER_LIFE_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ retirement
  {
    id: 'll_retirement_party',
    category: 'elderly',
    title: 'The retirement party',
    text: 'My coworkers threw me a retirement party. There was a cake with my face printed on it, a speech by someone who got my name slightly wrong, and a card signed by people I had never met.',
    minAge: 60,
    maxAge: 72,
    weight: 2,
    once: true,
    conditions: [{ inPrison: false }, { retired: true }],
    choices: [
      {
        id: 'speech',
        label: 'Give a speech',
        effects: [
          { energy: -1 },
          {
            chance: 0.6,
            then: [{ log: 'I spoke for six minutes about forty years and made the accounts department cry. In a good way.', kind: 'good' }, { stat: 'happiness', delta: 8 }, { fame: 1 }],
            else: [{ log: 'I lost my thread halfway through and ended on a stapler story. People clapped out of kindness.' }, { stat: 'happiness', delta: 3 }],
          },
        ],
      },
      {
        id: 'cake',
        label: 'Keep it short, eat cake',
        effects: [{ stat: 'happiness', delta: 4 }, { log: 'I said thank you, ate my own face, and went home before anyone could make me dance.', kind: 'good' }],
      },
      {
        id: 'pub',
        label: 'Take everyone out after',
        hint: '{{$250}}',
        effects: [
          { money: -250 },
          { stat: 'happiness', delta: 6 },
          { karma: 1 },
          { log: 'The afterparty cost me the bill and a little of my hearing. Worth it.', kind: 'money' },
          { chance: 0.5, then: [{ newPerson: { kind: 'friend', relationship: 55, log: 'I ended up talking all night with {{person}} from the other floor. We plan to keep that up.' } }] },
        ],
      },
    ],
  },
  {
    id: 'll_still_working',
    category: 'elderly',
    title: 'Enjoying your retirement?',
    text: 'The new hire at {{company}} asked, very kindly, when I was planning to enjoy my retirement. I was in the middle of enjoying my sandwich.',
    minAge: 60,
    maxAge: 75,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }, { hasJob: true }, { retired: false }],
    choices: [
      {
        id: 'stay',
        label: 'Retire when the checks stop',
        effects: [{ jobPerformance: 3 }, { stat: 'happiness', delta: 2 }, { log: 'I told them I would retire when the checks stopped. They laughed. I did not.', kind: 'good' }],
      },
      {
        id: 'lunch',
        label: 'Take them to lunch',
        hint: '{{$40}}',
        effects: [{ money: -40 }, { karma: 2 }, { stat: 'happiness', delta: 3 }, { relationship: 'coworker', delta: 4 }, { log: 'I bought the new hire lunch and told them which printer bites. They looked at me like a wizard.', kind: 'good' }],
      },
      {
        id: 'plan',
        label: 'Quietly plan an exit',
        effects: [{ flag: 'll_planning_retirement', set: true }, { stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: 1 }, { log: 'I went home and did some sums on the back of an envelope. The envelope was encouraging.' }],
      },
    ],
  },
  {
    id: 'll_pension_letter',
    category: 'elderly',
    title: 'A brown envelope',
    text: 'A letter from the pension office arrived with the word RECALCULATION in capitals. Nothing good has ever been written in capital letters by a pension office.',
    minAge: 62,
    maxAge: 95,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }, { any: [{ retired: true }, { hasJob: false }] }],
    choices: [
      {
        id: 'open',
        label: 'Open it now',
        effects: [
          {
            random: [
              { weight: 50, effects: [{ money: 1500 }, { stat: 'happiness', delta: 5 }, { log: 'They had underpaid me for years. {{$1500}} in back pay landed, with no apology but a nice stamp.', kind: 'money' }] },
              { weight: 35, effects: [{ money: -800 }, { stat: 'happiness', delta: -4 }, { log: 'They had been overpaying me and wanted {{$800}} back, "at my earliest convenience".', kind: 'bad' }] },
              { weight: 15, effects: [{ log: 'The recalculation changed my pension by a sum too small to buy a stamp. Three pages to say so.' }] },
            ],
          },
        ],
      },
      {
        id: 'call',
        label: 'Call them about it first',
        effects: [
          { stat: 'happiness', delta: -2 },
          { stat: 'smarts', delta: 1 },
          { log: 'I spent fifty minutes on hold listening to a flute.' },
          {
            random: [
              { weight: 60, effects: [{ money: 1500 }, { stat: 'happiness', delta: 6 }, { log: 'Having a human on the line helped. Back pay of {{$1500}} and an actual apology.', kind: 'money' }] },
              { weight: 25, effects: [{ money: -500 }, { log: 'They still wanted money back, but I talked them down to {{$500}}.', kind: 'bad' }] },
              { weight: 15, effects: [{ log: 'The person on the phone could not find my file. The letter, it seems, was sent to the wrong me.' }] },
            ],
          },
        ],
      },
      {
        id: 'drawer',
        label: 'Put it in the drawer',
        effects: [
          { stat: 'happiness', delta: 1 },
          { chance: 0.5, then: [{ money: -1200 }, { stat: 'happiness', delta: -4 }, { log: 'Ignoring it added a late fee. The drawer had cost me {{$1200}}.', kind: 'bad' }], else: [{ log: 'The drawer swallowed it and nothing happened. The drawer is my favorite financial advisor.' }] },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ grandchildren
  {
    id: 'll_grandchild_born',
    category: 'elderly',
    title: 'A grandchild',
    text: '{{person}} called in the middle of the night to say a baby is on the way. I sat on the stairs in the dark for a while, grinning at nothing.',
    minAge: 60,
    maxAge: 90,
    weight: 2,
    cooldown: 4,
    conditions: [{ inPrison: false }, { hasChildren: true }],
    person: { kind: ['child'], minAge: 18, maxAge: 45 },
    choices: [
      {
        id: 'knit',
        label: 'Start knitting immediately',
        effects: [{ flag: 'grandparent', set: true }, { stat: 'happiness', delta: 7 }, { relationship: 'person', delta: 5 }, { log: 'I knitted a hat that would fit a melon. {{person}} said the baby would grow into it.', kind: 'milestone' }],
      },
      {
        id: 'money',
        label: 'Offer to help with costs',
        hint: '{{$2000}}',
        effects: [{ flag: 'grandparent', set: true }, { money: -2000 }, { relationship: 'person', delta: 10 }, { karma: 2 }, { stat: 'happiness', delta: 5 }, { log: 'I sent {{$2000}} for the crib and car seat. {{person}} cried and blamed the hour.', kind: 'milestone' }],
      },
      {
        id: 'name',
        label: 'Ask about the name',
        effects: [
          { flag: 'grandparent', set: true },
          { stat: 'happiness', delta: 4 },
          { chance: 0.5, then: [{ relationship: 'person', delta: 3 }, { log: 'They are naming the baby after me. I pretended to be casual about it for nearly a full second.', kind: 'milestone' }], else: [{ relationship: 'person', delta: -3 }, { log: 'I asked if they were sure about the name. {{person}} was very sure. We moved on.', kind: 'milestone' }] },
        ],
      },
    ],
  },
  {
    id: 'll_grandkid_weekend',
    category: 'elderly',
    title: 'Grandparent duty',
    text: '{{person}} dropped the grandchildren off for the weekend with a list of rules longer than my will. Rule four is "no sugar". Rule nine is "do not let them watch the news".',
    minAge: 60,
    maxAge: 90,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }, { hasChildren: true }],
    person: { kind: ['child'], minAge: 20 },
    choices: [
      {
        id: 'rules',
        label: 'Follow the list',
        effects: [{ energy: -1 }, { stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 5 }, { log: 'I followed every rule. The children came back bored, well rested and on time, like library books.', kind: 'good' }],
      },
      {
        id: 'icecream',
        label: 'Ice cream for dinner',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 7 },
          { chance: 0.5, then: [{ relationship: 'person', delta: -5 }, { log: 'The children told {{person}} everything before they were out of the car. I am on probation.', kind: 'bad' }], else: [{ relationship: 'person', delta: 2 }, { log: 'The children kept our secret. I have never been prouder of anyone.', kind: 'good' }] },
        ],
      },
      {
        id: 'cards',
        label: 'Teach them card games',
        effects: [
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: 4 },
          { chance: 0.4, then: [{ stat: 'happiness', delta: -1 }, { log: 'I taught them Go Fish. By Sunday they were beating me every hand and showing no mercy.' }], else: [{ log: 'I taught them Go Fish. The youngest cheats beautifully. There is hope for this family.', kind: 'good' }] },
        ],
      },
    ],
  },
  {
    id: 'll_grandkid_tech',
    category: 'elderly',
    title: 'The phone talks now',
    text: 'One of the grandchildren set up my phone "properly". It now talks to me, suggests things I did not ask for, and knows where I am at all times.',
    minAge: 60,
    maxAge: 95,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }, { hasChildren: true }],
    choices: [
      {
        id: 'embrace',
        label: 'Embrace the future',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 3 },
          { chance: 0.3, then: [{ money: -80 }, { log: 'I embraced the future and it charged me {{$80}} for a subscription to something called a bundle.', kind: 'money' }], else: [{ log: 'I can now video-call the grandchildren and see mostly the ceiling. It is wonderful.', kind: 'good' }] },
        ],
      },
      {
        id: 'off',
        label: 'Ask them to turn it off',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'child', delta: -1 }, { log: 'I asked for it to be a phone again. The grandchildren gave me the look I once gave my grandparents.' }],
      },
      {
        id: 'daily',
        label: 'Learn one thing a day',
        effects: [{ energy: -1 }, { stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: 2 }, { relationship: 'child', delta: 2 }, { log: 'Monday: photos. Tuesday: maps. Wednesday: I messaged the wrong group and learned about apologies.', kind: 'good' }],
      },
    ],
  },

  // ------------------------------------------------------------ home and body
  {
    id: 'll_downsizing',
    category: 'elderly',
    title: 'Too many stairs',
    text: 'The place I live has too many stairs and too many empty rooms. I keep one of them ready for visitors who come less often than I would like.',
    minAge: 62,
    maxAge: 90,
    weight: 1.5,
    once: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'smaller',
        label: 'Move somewhere smaller',
        effects: [
          { money: 4000 },
          { stat: 'happiness', delta: -3 },
          { stat: 'health', delta: 2 },
          { log: 'I moved: smaller place, no stairs, a parking-lot view. Lower bills, fewer memories per square foot.', kind: 'money' },
          { chance: 0.4, then: [{ stat: 'happiness', delta: 6 }, { log: 'The new neighbors turned out to be loud, kind and always cooking. I have been adopted.', kind: 'good' }] },
        ],
      },
      {
        id: 'lodger',
        label: 'Rent out a spare room',
        effects: [
          { money: 2400 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 4 }, { newPerson: { kind: 'friend', relationship: 50, minAge: 20, maxAge: 35, log: 'My tenant, {{person}}, pays on time and cooks on Sundays. The house is noisy again.' } }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'The tenant kept odd hours, odder friends and a drum kit. The rent nearly covered the earplugs.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'kids',
        label: 'Move closer to the kids',
        hint: '{{$4000}}',
        conditions: [{ hasChildren: true }],
        effects: [{ money: -4000 }, { relationship: 'child', delta: 8 }, { stat: 'happiness', delta: 5 }, { log: 'I moved within walking distance of the children. They say it is lovely. They also now lock the door.', kind: 'good' }],
      },
      {
        id: 'stay',
        label: 'Stay put',
        effects: [
          { stat: 'happiness', delta: 3 },
          { chance: 0.25, then: [{ injury: 4 }, { log: 'I stayed, and the stairs eventually won a round. Nothing broken but my dignity.', kind: 'bad' }], else: [{ log: 'I stayed. The house and I have an understanding. We creak together.' }] },
        ],
      },
    ],
  },
  {
    id: 'll_the_fall',
    category: 'elderly',
    title: 'The fall',
    text: 'I reached for the top shelf, the stool wobbled, and the kitchen floor came up to meet me. I lay there for a minute working out which parts still answered.',
    minAge: 63,
    maxAge: 95,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['child', 'spouse', 'friend', 'bestFriend', 'sibling'] },
    choices: [
      {
        id: 'hospital',
        label: 'Get checked at the hospital',
        hint: '{{$600}}',
        effects: [
          { money: -600 },
          {
            chance: 0.65,
            then: [{ injury: 2 }, { stat: 'health', delta: 2 }, { log: 'Bruises, a sprained wrist and a lecture about stools. I was home by dinnertime.', kind: 'info' }],
            else: [{ injury: 6 }, { money: -400 }, { log: 'A cracked wrist and six weeks in a cast. The cast is signed by three nurses and an orderly.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'walk',
        label: 'Walk it off',
        effects: [
          {
            chance: 0.5,
            then: [{ injury: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I walked it off. Mostly. The bruise went through every color of the rainbow.' }],
            else: [{ injury: 10 }, { illness: 'back_pain' }, { stat: 'happiness', delta: -4 }, { log: 'I walked it off straight into chronic back pain. The stool has been thrown out, too late.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'call',
        label: 'Call {{person}}',
        effects: [
          { relationship: 'person', delta: 6 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.7,
            then: [{ injury: 3 }, { log: '{{person}} came running, made tea, and quietly moved everything I use to the bottom shelf.', kind: 'good' }],
            else: [{ injury: 6 }, { money: -600 }, { log: '{{person}} took one look at my wrist and drove me to the hospital. Sprained, wrapped and scolded.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'rails',
        label: 'Fit grab rails everywhere',
        hint: '{{$400}}',
        effects: [{ money: -400 }, { injury: 3 }, { stat: 'health', delta: 3 }, { log: 'I fitted rails in the bathroom, the hall and, for reasons I forget, the shed. I feel like a ship.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'll_memory_lapse',
    category: 'elderly',
    title: 'Why am I here',
    text: 'I walked into the kitchen with great purpose and no idea why. It happened three times before lunch. The kitchen has stopped asking.',
    minAge: 64,
    maxAge: 95,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'lists',
        label: 'Start writing lists',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 1 }, { log: 'I write everything down now. The list says "write list". I am in a loop and at peace with it.', kind: 'good' }],
      },
      {
        id: 'doctor',
        label: 'See a doctor',
        hint: '{{$300}}',
        effects: [
          { money: -300 },
          {
            random: [
              { weight: 85, effects: [{ stat: 'happiness', delta: 4 }, { log: 'The doctor said it was normal and asked me three questions I answered perfectly, thank you.', kind: 'good' }] },
              { weight: 15, effects: [{ illness: 'dementia' }, { stat: 'happiness', delta: -6 }, { log: 'The doctor used the word "early" a lot and gave me pamphlets. We will keep an eye on it together.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'laugh',
        label: 'Laugh it off',
        effects: [
          { stat: 'happiness', delta: 2 },
          { chance: 0.3, then: [{ money: -150 }, { stat: 'health', delta: -2 }, { log: 'I laughed it off until I left a pan on the stove. New pan, new smoke alarm, new rule.', kind: 'bad' }], else: [{ log: 'I laughed it off. Everyone forgets things, I told the cat. We do not have a cat.' }] },
        ],
      },
    ],
  },
  {
    id: 'll_hearing_aid',
    category: 'elderly',
    title: 'Everyone mumbles',
    text: 'Everyone has started mumbling, the television is apparently "deafening", and this week I confidently answered three questions nobody asked.',
    minAge: 62,
    maxAge: 95,
    weight: 1.5,
    once: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'fit',
        label: 'Get fitted for hearing aids',
        hint: '{{$2500}}',
        effects: [{ money: -2500 }, { stat: 'health', delta: 2 }, { stat: 'happiness', delta: 6 }, { log: 'The world came back in, loud and full of birds and a fridge that has apparently always hummed.', kind: 'good' }],
      },
      {
        id: 'tv',
        label: 'Turn the TV up',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'spouse', delta: -3 }, { relationship: 'child', delta: -1 }, { log: 'I turned the television up. The neighbors now follow the same shows, like it or not.' }],
      },
      {
        id: 'deny',
        label: 'Insist everyone else mumbles',
        effects: [
          { stat: 'happiness', delta: 2 },
          { chance: 0.5, then: [{ illness: 'hearing_loss' }, { log: 'I held the line until a doctor confirmed it. I am, officially, the problem.', kind: 'bad' }], else: [{ log: 'I held the line. Some people genuinely do mumble, and I will die on this quiet hill.' }] },
        ],
      },
    ],
  },
  {
    id: 'll_checkup',
    category: 'elderly',
    title: 'For your age',
    text: 'The doctor did my annual once-over and used the phrase "for your age" four times in one sentence. I felt both complimented and quietly filed under "old".',
    minAge: 60,
    maxAge: 95,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'all',
        label: 'Follow every instruction',
        hint: '{{$150}}',
        effects: [{ money: -150 }, { stat: 'health', delta: 5 }, { stat: 'happiness', delta: -1 }, { log: 'Less salt, more walking, a pill with breakfast. I feel better and slightly less like myself.', kind: 'good' }],
      },
      {
        id: 'some',
        label: 'Follow the easy ones',
        effects: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I took up the walking and ignored the salt. Compromise is the secret of a long life, probably.' }],
      },
      {
        id: 'second',
        label: 'Get a second opinion',
        hint: '{{$200}}',
        effects: [
          { money: -200 },
          { chance: 0.25, then: [{ illness: 'hypertension' }, { stat: 'happiness', delta: -3 }, { log: 'The second doctor found the blood pressure the first had only hinted at. I now own a cuff.', kind: 'bad' }], else: [{ stat: 'happiness', delta: 3 }, { log: 'The second doctor said I was fine, full stop, no "for your age". I am keeping that one.', kind: 'good' }] },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ money and strangers
  {
    id: 'll_scam_call',
    category: 'elderly',
    title: 'A very polite caller',
    text: 'A very polite young man called to say my bank account had been compromised, and he could fix it right away if I just read him the numbers on my card.',
    minAge: 60,
    maxAge: 95,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'hangup',
        label: 'Hang up',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I hung up and felt smug for the whole afternoon. The smugness was free.', kind: 'good' }],
      },
      {
        id: 'stall',
        label: 'Keep him talking for an hour',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 5 },
          { chance: 0.15, then: [{ money: -300 }, { log: 'I wasted fifty minutes of his life, then got cocky and confirmed one number too many. {{$300}} gone.', kind: 'bad' }], else: [{ log: 'I described my garden to him for an hour. He hung up on me. A small victory for retirees everywhere.', kind: 'good' }] },
        ],
      },
      {
        id: 'bank',
        label: 'Call the bank to check',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: -1 },
          { chance: 0.2, then: [{ money: 150 }, { log: 'A scam, but while I had the bank on the line they found a shady charge and refunded {{$150}}.', kind: 'money' }], else: [{ log: 'The bank confirmed it was a scam and thanked me for calling. Forty minutes on hold, one good deed.' }] },
        ],
      },
    ],
  },
  {
    id: 'll_will',
    category: 'elderly',
    title: 'Where there is a will',
    text: 'A lawyer\'s ad on the bus made me realize I have never written a will. I own a surprising amount of stuff, most of it in boxes labeled "misc".',
    minAge: 60,
    maxAge: 95,
    weight: 1,
    once: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'kids',
        label: 'Leave it to the kids',
        hint: '{{$300}}',
        conditions: [{ hasChildren: true }],
        effects: [{ money: -300 }, { relationship: 'child', delta: 6 }, { karma: 2 }, { stat: 'happiness', delta: 3 }, { log: 'I split everything between the children and left the "misc" boxes to whoever opens them first.', kind: 'good' }],
      },
      {
        id: 'charity',
        label: 'Leave it to charity',
        hint: '{{$300}}',
        effects: [{ money: -300 }, { karma: 5 }, { stat: 'happiness', delta: 3 }, { relationship: 'child', delta: -5 }, { log: 'I left the lot to the animal shelter. Somewhere a future dog is going to be very comfortable.', kind: 'good' }],
      },
      {
        id: 'later',
        label: 'Put it off',
        effects: [
          { stat: 'happiness', delta: 1 },
          { chance: 0.3, then: [{ stat: 'happiness', delta: -3 }, { log: 'I put it off and then lay awake at three in the morning dividing up the spoons.', kind: 'bad' }], else: [{ log: 'I put it off. The boxes marked "misc" can be somebody else\'s mystery.' }] },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ passing it on
  {
    id: 'll_mentor',
    category: 'elderly',
    title: 'Teach me',
    text: 'A young person from down the street asked if I would teach them what I know. I was not entirely sure what that was, but I said yes before I could think about it.',
    minAge: 60,
    maxAge: 90,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'wing',
        label: 'Take them under my wing',
        effects: [
          { energy: -1 },
          { karma: 3 },
          { stat: 'happiness', delta: 6 },
          { newPerson: { kind: 'friend', relationship: 55, minAge: 17, maxAge: 24, log: '{{person}} comes over every Tuesday now. Last week: how to boil an egg, and why to keep receipts.' } },
        ],
      },
      {
        id: 'book',
        label: 'Give them a book',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: 2 }, { log: 'I gave them the book that changed my life at their age. They asked if there was a video.' }],
      },
      {
        id: 'charge',
        label: 'Charge for lessons',
        hint: '+{{$400}}',
        effects: [
          { money: 400 },
          { karma: -1 },
          { chance: 0.5, then: [{ stat: 'happiness', delta: -2 }, { log: 'They paid for four lessons and stopped coming. I kept the money and lost the Tuesdays.', kind: 'money' }], else: [{ stat: 'happiness', delta: 3 }, { log: 'They paid, learned, and told me I was worth every penny. I was, too.', kind: 'money' }] },
        ],
      },
    ],
  },
  {
    id: 'll_life_advice',
    category: 'elderly',
    title: 'The secret',
    text: '{{person}} sat me down and asked, quite seriously, what the secret to a good life was. I had been hoping somebody would eventually ask.',
    minAge: 60,
    maxAge: 95,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['child', 'friend', 'bestFriend', 'sibling', 'coworker'], maxAge: 55 },
    choices: [
      {
        id: 'truth',
        label: "Admit I'm still working it out",
        effects: [{ karma: 2 }, { relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 3 }, { log: 'I told {{person}} I was still working it out and that was the whole trick. {{They}} seemed relieved.', kind: 'good' }],
      },
      {
        id: 'interest',
        label: 'Say "compound interest"',
        effects: [{ stat: 'smarts', delta: 1 }, { relationship: 'person', delta: 2 }, { log: 'I said "compound interest" and refused to elaborate. {{person}} wrote it down.' }],
      },
      {
        id: 'wise',
        label: 'Invent something wise',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: -2 }, { log: 'I made up something about rivers and stones. {{person}} wrote it down. I felt like a fraud.' }],
            else: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 3 }, { log: '{{person}} saw straight through the river-and-stones business and we both laughed until dinner.', kind: 'good' }],
          },
        ],
      },
    ],
  },
  {
    id: 'll_memoirs',
    category: 'elderly',
    title: 'Chapter one',
    text: 'I bought a notebook and wrote "Chapter One" at the top of the first page. Then I stared at it for an hour, wondering which of the embarrassing bits to leave in.',
    minAge: 60,
    maxAge: 95,
    weight: 1,
    once: true,
    choices: [
      {
        id: 'warts',
        label: 'Write it all, warts included',
        effects: [
          { energy: -1 },
          { stat: 'smarts', delta: 3 },
          { stat: 'happiness', delta: 4 },
          { relationship: 'sibling', delta: -4 },
          { chance: 0.15, then: [{ money: 3000 }, { fame: 4 }, { log: 'A small publisher took it. {{$3000}} and a launch in a bookstore with eleven chairs, all full.', kind: 'milestone' }], else: [{ log: 'I wrote the whole truth and printed six copies. Several relatives now avoid eye contact at dinner.', kind: 'good' }] },
        ],
      },
      {
        id: 'nice',
        label: 'Write the nice version',
        effects: [{ energy: -1 }, { stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { relationship: 'sibling', delta: 3 }, { relationship: 'child', delta: 3 }, { log: 'I wrote the version where everyone comes out well. The family loves it. Historians would not.', kind: 'good' }],
      },
      {
        id: 'quit',
        label: 'Give up at chapter one',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'The notebook became a grocery list. Chapter One: eggs, milk, a better attitude.' }],
      },
    ],
  },

  // ------------------------------------------------------------ bucket list
  {
    id: 'll_bucket_list',
    category: 'elderly',
    title: 'The envelope list',
    text: 'I wrote a bucket list on the back of an envelope. Item one: see the northern lights. Item seven: learn to whistle properly. Item twelve is just the word "cheese".',
    minAge: 60,
    maxAge: 90,
    weight: 1.5,
    once: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'trip',
        label: 'Book the big trip',
        hint: '{{$6000}}',
        conditions: [{ money: { gte: 6000 } }],
        effects: [{ money: -6000 }, { stat: 'happiness', delta: 3 }, { log: 'I booked it before I could talk myself out of it. The travel agent called me "brave". Worrying.', kind: 'money' }, { queue: 'll_bucket_trip' }],
      },
      {
        id: 'whistle',
        label: 'Start with the whistling',
        effects: [
          { stat: 'happiness', delta: 3 },
          { chance: 0.5, then: [{ stat: 'smarts', delta: 1 }, { log: 'After a month of practice I can whistle a full tune. The neighbor\'s dog has lodged a complaint.', kind: 'good' }], else: [{ log: 'I cannot whistle. I have made my peace with it and crossed out item seven very firmly.' }] },
        ],
      },
      {
        id: 'someday',
        label: 'File it under someday',
        effects: [{ stat: 'happiness', delta: -2 }, { log: 'I put the envelope in the drawer with the other somedays. It is getting crowded in there.' }],
      },
    ],
  },
  {
    id: 'll_bucket_trip',
    category: 'elderly',
    title: 'The big trip',
    text: 'The big trip. Thermal socks, a camera I do not understand, and a sky that owed me a show. Item one, at last.',
    minAge: 60,
    maxAge: 95,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'soak',
        label: 'Soak it all in',
        effects: [
          { counter: 'vacations' },
          {
            random: [
              { weight: 60, effects: [{ stat: 'happiness', delta: 15 }, { stat: 'health', delta: 2 }, { log: 'The sky delivered: green, pink, silence. I crossed off item one with a shaking hand.', kind: 'milestone' }] },
              { weight: 25, effects: [{ stat: 'happiness', delta: 4 }, { money: -300 }, { log: 'Cloud every night, lost luggage coming home. I saw a reindeer, which should have been on the list.' }] },
              { weight: 15, effects: [{ injury: 4 }, { stat: 'happiness', delta: 6 }, { log: 'I saw the lights, slipped on the ice mid-cheer, and flew home with a twisted ankle and no regrets.', kind: 'good' }] },
            ],
          },
        ],
      },
      {
        id: 'postcards',
        label: 'Send postcards to everyone',
        hint: '{{$60}}',
        effects: [
          { counter: 'vacations' },
          { money: -60 },
          { relationship: 'friend', delta: 3 },
          { relationship: 'child', delta: 3 },
          { relationship: 'sibling', delta: 3 },
          { stat: 'happiness', delta: 10 },
          { log: 'I sent postcards to everyone I have ever met. Most arrived after I did, which is how postcards work.', kind: 'milestone' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ hearts
  {
    id: 'll_old_flame',
    category: 'elderly',
    title: 'An old name',
    text: 'A message arrived from {{personFull}}. We had not spoken in years. {{They}} wanted to know if I would like to get coffee, "no agenda", which is itself an agenda.',
    minAge: 60,
    maxAge: 90,
    weight: 1,
    once: true,
    conditions: [{ inPrison: false }],
    person: { kind: ['ex'] },
    choices: [
      {
        id: 'meet',
        label: 'Meet for coffee',
        effects: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 2 }, { log: 'I said yes to coffee and then changed my shirt four times, which told me something.' }, { queue: 'll_old_flame_coffee' }],
      },
      {
        id: 'decline',
        label: 'Reply kindly, decline',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: 1 }, { relationship: 'person', delta: 2 }, { log: 'I wrote back warmly and said no. Some doors are nicer as doors.', kind: 'good' }],
      },
      {
        id: 'ignore',
        label: 'Leave it unanswered',
        effects: [
          { chance: 0.4, then: [{ stat: 'happiness', delta: -3 }, { log: 'I did not reply, then thought about not replying for a month. Cheaper than coffee, somehow pricier.', kind: 'bad' }], else: [{ log: 'I left it. The message sits there, unanswered, like most of the big questions.' }] },
        ],
      },
    ],
  },
  {
    id: 'll_old_flame_coffee',
    category: 'elderly',
    title: 'Coffee with {{person}}',
    text: 'Coffee with {{person}} turned into three hours, two refills and one very long pause. {{They}} looked older and exactly the same. I expect I did too.',
    minAge: 60,
    maxAge: 95,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    person: { kind: ['ex'] },
    choices: [
      {
        id: 'rekindle',
        label: 'See where it goes',
        conditions: [{ hasLover: false }],
        effects: [
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 20 }, { stat: 'happiness', delta: 10 }, { log: '{{person}} and I are taking it slowly. At our age that means Thursday dinners and a lot of looking.', kind: 'milestone' }],
            else: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: -4 }, { log: 'We tried. It turned out we had broken up for reasons, and the reasons had aged well.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'friends',
        label: 'Keep it as friendship',
        effects: [{ relationship: 'person', delta: 10 }, { stat: 'happiness', delta: 4 }, { karma: 1 }, { log: '{{person}} and I are friends now, properly. It is the best version of us, and it only took this long.', kind: 'good' }],
      },
      {
        id: 'closure',
        label: 'Say what I never said',
        effects: [
          { karma: 1 },
          { chance: 0.5, then: [{ relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 5 }, { log: 'I finally said it. {{person}} said {{they}} had known all along. We both felt lighter leaving.', kind: 'good' }], else: [{ relationship: 'person', delta: -6 }, { stat: 'happiness', delta: -2 }, { log: 'I said it. {{person}} went quiet, paid for the coffee, and left. Closure, of a kind.' }] },
        ],
      },
    ],
  },
  {
    id: 'll_late_romance',
    category: 'elderly',
    title: 'A saved seat',
    text: 'There is someone at the community center who laughs at my jokes and saves me a seat. I had assumed that part of life was over. The seat suggests otherwise.',
    minAge: 60,
    maxAge: 90,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }, { hasLover: false }],
    choices: [
      {
        id: 'ask',
        label: 'Ask them to dinner',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 8 }, { newPerson: { kind: 'lover', relationship: 60, log: '{{person}} said yes. We split a dessert and talked until the staff stacked the chairs around us.' } }],
            else: [{ stat: 'happiness', delta: -3 }, { newPerson: { kind: 'friend', relationship: 50, log: '{{person}} was flattered, and married. We still share the crossword, its own kind of romance.' } }],
          },
        ],
      },
      {
        id: 'friend',
        label: 'Keep it as friendship',
        effects: [{ stat: 'happiness', delta: 3 }, { newPerson: { kind: 'friend', relationship: 58, log: '{{person}} and I are now the loudest table at the community center. Nobody minds.' } }],
      },
      {
        id: 'nothing',
        label: 'Keep sitting, say nothing',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I kept sitting in the saved seat and said nothing. Some things are nicer as possibilities.' }],
      },
    ],
  },
  {
    id: 'll_anniversary',
    category: 'elderly',
    title: 'Still married',
    text: '{{person}} and I have been married so long that we finish each other\'s complaints. Our anniversary is this week, and {{they}} has started dropping hints the size of furniture.',
    minAge: 60,
    maxAge: 95,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }, { married: true }],
    person: { kind: ['spouse'] },
    choices: [
      {
        id: 'honeymoon',
        label: 'Plan a second honeymoon',
        hint: '{{$3000}}',
        effects: [{ money: -3000 }, { love: 12 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 8 }, { counter: 'vacations' }, { log: 'We went back to where we honeymooned. The hotel was gone, the beach was not, and neither were we.', kind: 'milestone' }],
      },
      {
        id: 'dinner',
        label: 'Dinner at the usual place',
        hint: '{{$80}}',
        effects: [{ money: -80 }, { love: 5 }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 4 }, { log: 'We had the usual table and the usual argument about who ordered better. {{person}} did.', kind: 'good' }],
      },
      {
        id: 'forget',
        label: 'Forget it entirely',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 2 }, { love: 2 }, { log: 'I forgot. So did {{person}}. We found out a week later and laughed until someone had to sit down.', kind: 'good' }],
            else: [{ love: -10 }, { relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -5 }, { log: 'I forgot. {{person}} had not. The hints, it turned out, were not hints.', kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ friends and family
  {
    id: 'll_surprise_birthday',
    category: 'elderly',
    title: 'Surprise',
    text: 'I opened the front door and forty people shouted SURPRISE. {{person}} had organized the whole thing. I nearly dropped the milk and did drop my dignity.',
    minAge: 60,
    maxAge: 95,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    person: { kind: ['child', 'friend', 'bestFriend', 'sibling', 'spouse'] },
    choices: [
      {
        id: 'hug',
        label: 'Hug everyone',
        effects: [{ energy: -1 }, { stat: 'happiness', delta: 9 }, { relationship: 'person', delta: 8 }, { log: 'I hugged all forty of them, some twice. {{person}} got three. My face hurt from smiling by nine.', kind: 'milestone' }],
      },
      {
        id: 'knew',
        label: 'Pretend I knew all along',
        effects: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: -2 }, { log: 'I said I had known for weeks. {{person}} knew I was lying because I was still holding the milk.' }],
      },
      {
        id: 'bill',
        label: 'Ask who is paying',
        effects: [
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -3 },
          { chance: 0.5, then: [{ money: -400 }, { log: 'I asked who was paying. {{person}} said my card. It was my card. The cake was very good.', kind: 'money' }], else: [{ log: '{{person}} had covered everything. I felt touched, and also faintly suspicious of the catering.' }] },
        ],
      },
    ],
  },
  {
    id: 'll_sibling_reunion',
    category: 'elderly',
    title: 'Halfway',
    text: '{{person}} and I have not properly talked in years. {{They}} suggested we meet halfway, at the café where our parents used to take us when we were small and furious.',
    minAge: 60,
    maxAge: 95,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['sibling'], maxRelationship: 50 },
    choices: [
      {
        id: 'peace',
        label: 'Go and make peace',
        effects: [
          { karma: 2 },
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 18 }, { stat: 'happiness', delta: 7 }, { log: 'Four hours in, neither of us could remember what the fight was about. Coffee and pie all around.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -3 }, { log: 'We argued about who got the clock. Some things do not change, including the clock.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'light',
        label: 'Go but keep it light',
        effects: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 2 }, { log: 'We stuck to the weather and the grandchildren. It was nice. The clock did not come up.' }],
      },
      {
        id: 'decline',
        label: 'Decline',
        effects: [{ karma: -1 }, { stat: 'happiness', delta: -1 }, { log: 'I said I was busy. {{person}} knew I was not. We are both very good at this.' }],
      },
    ],
  },
  {
    id: 'll_outlive_friend',
    category: 'elderly',
    title: 'Thursday',
    text: '{{person}} died this week. We had known each other for longer than either of us cared to count. The funeral is on Thursday, and I have nothing black that still fits.',
    minAge: 62,
    maxAge: 95,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend'], minAge: 55 },
    choices: [
      {
        id: 'eulogy',
        label: 'Give the eulogy',
        effects: [{ personDies: true, cause: 'natural causes' }, { energy: -1 }, { stat: 'happiness', delta: -6 }, { karma: 3 }, { log: 'I spoke about {{person}} for four minutes and cried for three. The family said it was perfect.', kind: 'milestone' }],
      },
      {
        id: 'back',
        label: 'Sit at the back',
        effects: [{ personDies: true, cause: 'natural causes' }, { stat: 'happiness', delta: -8 }, { log: 'I sat at the back and left before the sandwiches. {{person}} would have stayed for the sandwiches.' }],
      },
      {
        id: 'skip',
        label: 'I cannot face it',
        effects: [
          { personDies: true, cause: 'natural causes' },
          { stat: 'happiness', delta: -10 },
          { chance: 0.5, then: [{ karma: -1 }, { log: 'I did not go. Nobody judged me for it. I managed that part myself.', kind: 'bad' }], else: [{ stat: 'happiness', delta: 3 }, { log: 'I did not go. I sat in the garden with a cup of tea and talked to {{person}} for an hour instead.' }] },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ community
  {
    id: 'll_community_award',
    category: 'elderly',
    title: 'Services to the community',
    text: 'The city council wrote to say I am being given an award for "services to the community". I am not entirely sure which services, but I will be wearing a tie.',
    minAge: 60,
    maxAge: 95,
    weight: 0.7,
    once: true,
    conditions: [{ inPrison: false }, { karma: { gte: 55 } }],
    choices: [
      {
        id: 'speech',
        label: 'Accept with a speech',
        effects: [{ energy: -1 }, { stat: 'happiness', delta: 8 }, { fame: 3 }, { karma: 1 }, { log: 'I gave a speech about neighbors. The mayor shook my hand and said my name three different ways.', kind: 'milestone' }],
      },
      {
        id: 'quiet',
        label: 'Accept quietly',
        effects: [{ stat: 'happiness', delta: 5 }, { fame: 1 }, { log: 'I accepted quietly and hung the plaque in the guest bathroom, where every visitor will see it.', kind: 'good' }],
      },
      {
        id: 'nominate',
        label: 'Suggest someone more deserving',
        effects: [
          { karma: 4 },
          { stat: 'happiness', delta: 2 },
          { chance: 0.5, then: [{ newPerson: { kind: 'friend', relationship: 60, log: '{{person}}, who got the award instead, came by with a pie to say thanks. We are friends now.' } }], else: [{ log: 'I nominated the man who runs the litter patrol and the council agreed. He deserved it, annoyingly.' }] },
        ],
      },
    ],
  },
  {
    id: 'll_allotment',
    category: 'elderly',
    title: 'The plot',
    text: 'I took over a plot in the community garden behind the rec center. The soil is clay, the shed leans, and the pigeons are organized.',
    minAge: 60,
    maxAge: 90,
    weight: 1.5,
    once: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'veg',
        label: 'Grow vegetables',
        effects: [
          { stat: 'health', delta: 3 },
          { stat: 'happiness', delta: 3 },
          { chance: 0.35, then: [{ money: 120 }, { log: 'I grew more zucchini than one person can morally keep and sold the surplus for {{$120}}.', kind: 'money' }], else: [{ log: 'I grew vegetables. The pigeons ate the good ones and left me the honest, lumpy ones.', kind: 'good' }] },
        ],
      },
      {
        id: 'dahlias',
        label: 'Grow prize dahlias',
        effects: [
          { stat: 'happiness', delta: 2 },
          { chance: 0.3, then: [{ fame: 2 }, { stat: 'happiness', delta: 7 }, { log: 'My dahlias won first prize at the county fair. A rival accused me of buying them. I did not. Mostly.', kind: 'good' }], else: [{ log: 'The dahlias came third out of four. The judge said "plucky", which is not a horticultural term.' }] },
        ],
      },
      {
        id: 'wild',
        label: 'Let it go wild',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: 2 }, { log: 'I let the plot go wild. The bees moved in, then the butterflies, then a letter from the committee.' }],
      },
    ],
  },
];

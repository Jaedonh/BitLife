import type { EventDef } from '@/engine/events/schema';

/**
 * Ages 18+: the financial weather of an adult life. Audits, surprise bills,
 * a found wallet, friends who need a loan, a cousin with a crypto tip, a
 * distant inheritance, identity theft, side gigs, raise gossip, rent hikes,
 * car trouble, wedding gifts, scam emails, charity, a bank error in your
 * favor and a year-end bonus, plus rich and poor variants (an investment
 * pitch for the flush, an empty fridge for the broke).
 * Follow-ups (followUpOnly) are queued by the events that set them up and
 * never fire on their own.
 */
export const MONEY_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ the taxman & bills
  {
    id: 'mn_tax_audit',
    category: 'money',
    title: 'Tax audit',
    text: 'A thick envelope from the tax agency arrived. I am being audited. The letter uses the word "discrepancies" three times and does not use the word "sorry" once.',
    minAge: 20,
    maxAge: 80,
    weight: 0.8,
    cooldown: 8,
    conditions: [{ inPrison: false }, { any: [{ hasJob: true }, { money: { gte: 20000 } }] }],
    choices: [
      {
        id: 'accountant',
        label: 'Hire an accountant',
        hint: '{{$800}}',
        effects: [
          { money: -800 },
          {
            chance: 0.85,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'She found a missing form, filed it, and the auditor lost interest. Expensive, but pleasantly boring.', kind: 'info' }],
            else: [{ money: -2500 }, { stat: 'happiness', delta: -3 }, { log: 'Even with help, they found an old mistake. I paid the difference and a fine on top of her fee.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'myself',
        label: 'Handle it myself',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 1 }, { log: 'A weekend of shoeboxes and receipts, and I came out clean. The auditor seemed almost disappointed.', kind: 'good' }],
            else: [{ money: -3500 }, { stat: 'happiness', delta: -5 }, { log: 'I missed something. The penalty was bigger than the accountant would have cost.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore the letter',
        effects: [
          { karma: -2 },
          {
            chance: 0.3,
            then: [{ log: 'I ignored it. Nothing happened. Yet.', kind: 'info' }],
            else: [{ money: -6000 }, { stat: 'happiness', delta: -8 }, { log: 'They did not go away. The penalties for ignoring them were worse than the audit itself.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'mn_surprise_bill',
    category: 'money',
    title: 'Surprise bill',
    text: 'A bill arrived for {{$900}} from a clinic visit I barely remember. The itemized list includes a "facility fee," which I can only assume is the price of the chairs.',
    minAge: 18,
    maxAge: 85,
    weight: 2,
    cooldown: 15,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'pay',
        label: 'Pay it',
        hint: '{{$900}}',
        effects: [{ money: -900 }, { stat: 'happiness', delta: -3 }, { log: 'I paid it. The chairs had better be comfortable.', kind: 'money' }],
      },
      {
        id: 'dispute',
        label: 'Dispute the charges',
        effects: [
          { energy: -1 },
          {
            chance: 0.45,
            then: [{ money: -300 }, { stat: 'happiness', delta: 3 }, { log: 'After three phone calls and one hold-music playlist, they knocked it down to {{$300}}.', kind: 'good' }],
            else: [{ money: -900 }, { stat: 'happiness', delta: -4 }, { log: 'Four hours on hold to be told the facility fee is "standard." I paid in full.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Lose it in a drawer',
        effects: [
          { karma: -1 },
          {
            chance: 0.4,
            then: [{ log: 'The bill vanished into whichever drawer bills go to die. I heard nothing more.', kind: 'info' }],
            else: [{ money: -1400 }, { stat: 'happiness', delta: -6 }, { log: 'It went to collections. The {{$900}} became {{$1400}} and the phone calls began.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'mn_debt_collector',
    category: 'money',
    title: 'A voice on the phone',
    text: 'A man called about an "outstanding balance" of {{$640}} from a gym I may or may not have joined years ago. He was very polite and very sure of himself.',
    minAge: 20,
    maxAge: 85,
    weight: 1,
    cooldown: 8,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'pay',
        label: 'Pay to make it stop',
        hint: '{{$640}}',
        effects: [{ money: -640 }, { stat: 'happiness', delta: -3 }, { log: 'I paid. The calls stopped. I still do not remember the gym.', kind: 'money' }],
      },
      {
        id: 'proof',
        label: 'Demand proof in writing',
        effects: [
          { stat: 'smarts', delta: 2 },
          { energy: -1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'The paperwork never came. A scam, or they lost the file. Either way, {{$640}} stayed mine.', kind: 'good' }],
            else: [{ money: -640 }, { stat: 'happiness', delta: -2 }, { log: 'The paperwork arrived, with my signature on it. I had joined the gym. I had gone once.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'block',
        label: 'Hang up on them',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ log: 'They never called again. The gym, if it existed, moved on.', kind: 'info' }],
            else: [{ money: -900 }, { stat: 'happiness', delta: -6 }, { log: 'The debt was real and grew teeth. By the time it caught up with me it was {{$900}}.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'mn_parking_fine',
    category: 'money',
    title: 'The ticket',
    text: 'I came back to the car to find a parking ticket for {{$90}} tucked under the wiper. The sign explaining the rules was behind a tree, as is tradition.',
    minAge: 18,
    maxAge: 85,
    weight: 1.5,
    cooldown: 6,
    conditions: [{ inPrison: false }, { ownsAssetId: ['old_hatchback', 'sedan', 'pickup', 'ev', 'luxury_sedan', 'sports_car', 'supercar', 'classic_car'] }],
    choices: [
      {
        id: 'pay',
        label: 'Pay it',
        hint: '{{$90}}',
        effects: [{ money: -90 }, { stat: 'happiness', delta: -2 }, { log: 'I paid it the same day. Boring, cheap, done.', kind: 'money' }],
      },
      {
        id: 'appeal',
        label: 'Appeal with photos of the tree',
        effects: [
          { energy: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 5 }, { stat: 'smarts', delta: 1 }, { log: 'My photo essay on the tree won the appeal. I have never felt more alive.', kind: 'good' }],
            else: [{ money: -90 }, { stat: 'happiness', delta: -3 }, { log: 'The city admired the photos and rejected the appeal. The tree stays. So does the fine.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore it',
        effects: [
          { karma: -1 },
          {
            chance: 0.35,
            then: [{ log: 'It never escalated. Somewhere, a database forgot me.', kind: 'info' }],
            else: [{ money: -220 }, { stat: 'happiness', delta: -5 }, { log: 'It doubled, then a letter arrived in red ink. {{$220}} and a mild sense of persecution.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'mn_rent_increase',
    category: 'money',
    title: 'Rent increase',
    text: 'My landlord slipped a note under the door: rent is going up by {{$180}} a month. The note was handwritten, which somehow made it worse.',
    minAge: 18,
    maxAge: 85,
    weight: 1.5,
    cooldown: 10,
    conditions: [{ inPrison: false }, { atHome: false }, { noAsset: 'house' }],
    choices: [
      {
        id: 'pay',
        label: 'Pay the increase',
        hint: '{{$2160}} a year',
        effects: [{ money: -2160 }, { stat: 'happiness', delta: -5 }, { log: 'I paid. Over the year it came to {{$2160}}. The faucet still drips.', kind: 'money' }],
      },
      {
        id: 'negotiate',
        label: 'Negotiate',
        effects: [
          { energy: -1 },
          {
            chance: 0.5,
            then: [{ money: -1000 }, { stat: 'happiness', delta: 2 }, { log: 'I pointed out the dripping faucet and the missing tiles. We settled on half the increase.', kind: 'good' }],
            else: [{ money: -2160 }, { stat: 'happiness', delta: -3 }, { log: 'The landlord listened politely and raised it anyway. The tiles remain missing.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'move',
        label: 'Move somewhere cheaper',
        hint: '{{$900}} moving costs',
        effects: [
          { money: -900 },
          { stat: 'happiness', delta: -4 },
          { stat: 'health', delta: -2 },
          { log: 'I moved. It cost {{$900}} and a weekend, but the new place is cheaper and the faucet does not drip.', kind: 'info' },
          { chance: 0.3, then: [{ stat: 'happiness', delta: 8 }, { log: 'The new neighborhood turned out to be lovely. Best decision I made all year.', kind: 'good' }] },
        ],
      },
    ],
  },
  {
    id: 'mn_car_repair',
    category: 'money',
    title: 'Car trouble',
    text: 'The car made a noise like a bag of spoons and stopped. The mechanic sucked air through his teeth, which is the universal sound of {{$1300}}.',
    minAge: 18,
    maxAge: 80,
    weight: 1.5,
    cooldown: 8,
    // Not within two years of young_adult's ya_car_breakdown, the other dead car.
    conditions: [{ inPrison: false }, { ownsAssetId: ['old_hatchback', 'sedan', 'pickup', 'ev', 'luxury_sedan', 'sports_car', 'supercar', 'classic_car'] }, { not: { sinceEvent: 'ya_car_breakdown', lte: 2 } }],
    choices: [
      {
        id: 'full',
        label: 'Pay for the proper fix',
        hint: '{{$1300}}',
        effects: [{ money: -1300 }, { stat: 'happiness', delta: -3 }, { log: 'I paid for the proper fix. It runs like new, or at least like it did before the spoons.', kind: 'money' }],
      },
      {
        id: 'patch',
        label: 'Get the cheap patch',
        hint: '{{$350}}',
        effects: [
          { money: -350 },
          {
            chance: 0.5,
            then: [{ log: 'The patch held. The mechanic seemed surprised. So was I.', kind: 'good' }],
            else: [{ money: -1600 }, { stat: 'happiness', delta: -6 }, { asset: 'damage', kind: 'car', amount: 30 }, { log: 'The patch lasted eleven days. The second repair cost more than the first would have.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'bus',
        label: 'Take the bus for a while',
        effects: [{ stat: 'happiness', delta: -4 }, { stat: 'health', delta: 2 }, { jobPerformance: -2 }, { log: 'I left it in the driveway and took the bus. I was late twice and read three books.', kind: 'info' }],
      },
    ],
  },

  // ------------------------------------------------------------ windfalls & temptations
  {
    id: 'mn_lucky_find',
    category: 'money',
    title: 'Lucky find',
    text: 'I found a wallet on the bus seat next to me. Inside: {{$260}} in cash, a bus pass, and a photo of a very old cat in a sweater.',
    minAge: 18,
    maxAge: 85,
    weight: 1,
    once: true,
    // One found wallet per life: kd_found_wallet, cp_found_wallet and nc_found_wallet are the same scene.
    conditions: [{ inPrison: false }, { eventNotFired: 'kd_found_wallet' }, { eventNotFired: 'cp_found_wallet' }, { eventNotFired: 'nc_found_wallet' }],
    choices: [
      {
        id: 'return',
        label: 'Track down the owner',
        effects: [
          { karma: 3 },
          { stat: 'happiness', delta: 3 },
          { energy: -1 },
          {
            chance: 0.4,
            then: [{ money: 50 }, { log: "The owner cried a little and insisted I take {{$50}}. The cat, I learned, is called Pickles.", kind: 'good' }],
            else: [{ log: 'The owner shook my hand for a full minute. No reward, but I slept well.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'keep',
        label: 'Keep the cash',
        effects: [
          { money: 260 },
          { karma: -4 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.15,
            then: [{ stat: 'happiness', delta: -6 }, { log: 'I kept it. The face on the bus pass lives two doors from me. Awkward does not begin to cover it.', kind: 'bad' }],
            else: [{ log: "I kept the cash and dropped the wallet in a mailbox. Finder's fee, I told myself.", kind: 'money' }],
          },
        ],
      },
      {
        id: 'driver',
        label: 'Hand it to the driver',
        effects: [{ karma: 1 }, { log: "I gave it to the driver, who put it in a drawer marked LOST. I hope the cat's person finds it.", kind: 'info' }],
      },
    ],
  },
  {
    id: 'mn_bank_error',
    category: 'money',
    title: 'Bank error',
    text: 'I checked my balance and found an extra {{$3500}} that was never mine. The bank has not noticed. The bank, I suspect, is busy.',
    minAge: 18,
    maxAge: 85,
    weight: 0.8,
    // The same windfall to the cent reads as a glitch the second time: once in a life.
    once: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'report',
        label: 'Report it',
        effects: [
          { karma: 4 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.3,
            then: [{ money: 100 }, { log: 'I called it in. The clerk was so surprised she sent a {{$100}} thank-you. Honesty sometimes pays.', kind: 'good' }],
            else: [{ log: 'I reported it. The money vanished the next day, along with a small weight on my conscience.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'quiet',
        label: 'Say nothing',
        effects: [
          { money: 3500 },
          { karma: -4 },
          {
            chance: 0.55,
            then: [{ money: -3500 }, { stat: 'happiness', delta: -5 }, { log: 'Three months later the bank found it and clawed it back, plus a stern letter. Easy come, easy go.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 5 }, { log: 'Nobody ever asked. I bought a very nice chair and named it after the bank.', kind: 'money' }],
          },
        ],
      },
      {
        id: 'spend',
        label: 'Spend it fast',
        effects: [
          { money: 3500 },
          { karma: -6 },
          { stat: 'happiness', delta: 8 },
          {
            chance: 0.6,
            then: [{ money: -4000 }, { stat: 'happiness', delta: -10 }, { log: 'The bank found it after I had spent it. Repaying money you no longer have is its own kind of misery.', kind: 'bad' }],
            else: [{ log: 'I spent it before anyone could ask. Nobody asked. I have no regrets, only a kayak.', kind: 'money' }],
          },
        ],
      },
    ],
  },
  {
    // Id is legacy (saves reference it); the content is a joke gift voucher, not a scratch card, to keep the game free of simulated gambling.
    id: 'mn_scratch_card',
    category: 'money',
    title: 'The joke gift',
    text: 'As a joke birthday present, {{person}} gave me a {{$40}} gift card for a store that sells only novelty socks. "Don\'t spend it all at once," {{they}} said. It expires next month.',
    minAge: 18,
    maxAge: 85,
    weight: 0.8,
    cooldown: 8,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend', 'sibling', 'lover', 'spouse', 'mother', 'father', 'child'], minAge: 16 },
    choices: [
      {
        id: 'scratch',
        label: 'Go spend it',
        hint: '{{$20}} bus fare',
        effects: [
          { money: -20 },
          {
            random: [
              { weight: 6, effects: [{ stat: 'happiness', delta: 3 }, { stat: 'looks', delta: 1 }, { log: 'I now own socks with lobsters on them. People comment. I let them.', kind: 'good' }] },
              { weight: 3, effects: [{ stat: 'happiness', delta: -2 }, { log: 'The store had closed down. I stood outside holding a gift card for nothing, then took the bus home.', kind: 'bad' }] },
              { weight: 1, effects: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 2 }, { log: 'The owner was so thrilled to see a customer that he threw in a second pair. Lobsters and toast.', kind: 'good' }] },
            ],
          },
        ],
      },
      {
        id: 'giveback',
        label: 'Regift it to {{person}}',
        effects: [
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 3 }, { log: 'Returned on {{their}} birthday, rewrapped. {{They}} laughed for a full minute. A tradition was born.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -1 }, { log: '{{They}} did not laugh. Apparently the socks were "a whole thing." I did not ask.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'keep',
        label: 'Keep it in my wallet',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I never spent it. It lives in my wallet as a small possibility, worth more than {{$40}}.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'mn_scam_email',
    category: 'money',
    title: 'Too good to be true',
    text: 'An email from a "prince" says I have inherited {{$8000000}} and need only send {{$150}} in processing fees. It is addressed to "Dear Beloved."',
    minAge: 18,
    maxAge: 85,
    weight: 2,
    // "Dear Beloved" a third time reads as a loop: twice in a life at most.
    cooldown: 34,
    conditions: [{ inPrison: false }, { year: { gte: 2000 } }],
    choices: [
      {
        id: 'delete',
        label: 'Delete it',
        effects: [{ stat: 'smarts', delta: 1 }, { log: 'Deleted. Dear Beloved will have to find someone else.', kind: 'info' }],
      },
      {
        id: 'pay',
        label: 'Send the fee',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          {
            chance: 0.9,
            then: [{ money: -600 }, { stat: 'happiness', delta: -5 }, { log: 'The {{$150}} unlocked a "second fee," then a third. I lost {{$750}} before the prince went quiet.', kind: 'bad' }],
            else: [{ money: 150 }, { log: 'I sent it, felt foolish at once, and my bank reversed it before it cleared. Lesson learned, cheaply.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'troll',
        label: "Waste the prince's time",
        effects: [
          { stat: 'smarts', delta: 1 },
          { energy: -1 },
          {
            random: [
              { weight: 7, effects: [{ stat: 'happiness', delta: 4 }, { log: 'I kept the prince talking for three weeks about my fictional llama farm. The llamas are thriving.', kind: 'good' }] },
              { weight: 3, effects: [{ stat: 'happiness', delta: -2 }, { log: 'The prince got bored, then angry, and signed me up for every newsletter on earth. Inbox: ruined.', kind: 'bad' }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'mn_identity_theft',
    category: 'money',
    title: 'Identity theft',
    text: 'My bank called about a purchase in a city I have never visited: {{$2400}} of patio furniture. Someone out there is living my life, and they have a patio.',
    minAge: 18,
    maxAge: 85,
    weight: 0.8,
    cooldown: 6,
    conditions: [{ inPrison: false }, { money: { gte: 300 } }],
    choices: [
      {
        id: 'freeze',
        label: 'Freeze everything',
        effects: [
          { stat: 'happiness', delta: -4 },
          {
            chance: 0.8,
            then: [{ log: 'Two weeks of phone calls and a new card. The bank refunded all of it. The patio remains a mystery.', kind: 'good' }],
            else: [{ money: -600 }, { log: 'The bank refunded most of it, but one charge slipped through. Someone is enjoying a new bench on me.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'specialist',
        label: 'Hire a fraud specialist',
        hint: '{{$400}}',
        effects: [{ money: -400 }, { stat: 'happiness', delta: -1 }, { stat: 'smarts', delta: 1 }, { log: 'The specialist untangled it in days. The bank now calls about every purchase, its own punishment.', kind: 'good' }],
      },
      {
        id: 'later',
        label: 'Deal with it later',
        effects: [
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.3,
            then: [{ log: 'The bank caught the rest automatically. I did nothing and it worked out, which is a terrible lesson.', kind: 'info' }],
            else: [{ money: -2400 }, { stat: 'happiness', delta: -8 }, { log: 'By the time I called, they had opened two more accounts. A year to untangle, and {{$2400}} gone.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'mn_crypto_tip',
    category: 'money',
    title: 'A hot tip',
    text: 'My cousin messaged at midnight about a coin that is "guaranteed to ten-x by spring." The coin has a cartoon dog on it. My cousin has never been right about anything.',
    minAge: 18,
    maxAge: 75,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: false }, { money: { gte: 1000 } }, { year: { gte: 2014 } }],
    choices: [
      {
        id: 'small',
        label: 'Put in a little',
        hint: '{{$500}}',
        effects: [
          { money: -500 },
          {
            random: [
              { weight: 35, effects: [{ money: 1500 }, { stat: 'happiness', delta: 6 }, { log: 'The dog coin tripled. My cousin is insufferable now, and I helped.', kind: 'money' }] },
              { weight: 45, effects: [{ money: 150 }, { log: 'It drifted sideways for months. I cashed out {{$150}} and some mild embarrassment.', kind: 'info' }] },
              { weight: 20, effects: [{ stat: 'happiness', delta: -4 }, { log: "The coin's creator vanished along with the money. The dog, as far as anyone knows, is fine.", kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'big',
        label: 'Go big',
        hint: '{{$5000}}',
        conditions: [{ money: { gte: 8000 } }],
        effects: [
          { money: -5000 },
          {
            random: [
              { weight: 20, effects: [{ money: 18000 }, { stat: 'happiness', delta: 12 }, { log: 'Ten-x. Actual ten-x. I screenshotted the balance before I believed it.', kind: 'money' }] },
              { weight: 45, effects: [{ money: 2000 }, { log: 'It wobbled, I panicked, I sold. Got {{$2000}} back and a new respect for index funds.', kind: 'info' }] },
              { weight: 35, effects: [{ stat: 'happiness', delta: -10 }, { log: 'It went to zero in a weekend. My cousin has stopped replying.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'mute',
        label: 'Mute the cousin',
        effects: [{ stat: 'happiness', delta: 2 }, { log: "I muted the chat. Six months later I could not remember the coin's name, which felt like winning.", kind: 'info' }],
      },
    ],
  },
  {
    id: 'mn_distant_inheritance',
    category: 'money',
    title: 'An unexpected will',
    text: 'A lawyer called about a great-aunt I met twice. She left me {{$40000}} and a cabinet of porcelain owls, on the condition that I "do something sensible with it."',
    minAge: 25,
    maxAge: 85,
    weight: 0.3,
    once: true,
    // Not within ten years of adult_life's ad_surprise_inheritance, the other will from a relative I barely knew, nor within
    // a few years of pet_events' pt_inherit_parrot, the will with a parrot in it (both guard against this one too).
    conditions: [{ inPrison: false }, { not: { sinceEvent: 'ad_surprise_inheritance', lte: 10 } }, { not: { sinceEvent: 'pt_inherit_parrot', lte: 3 } }],
    choices: [
      {
        id: 'accept',
        label: 'Accept quietly',
        effects: [{ money: 40000 }, { stat: 'happiness', delta: 8 }, { log: 'I accepted. The owls now watch me from a shelf. I am doing something sensible, mostly.', kind: 'milestone' }],
      },
      {
        id: 'donate',
        label: 'Give a share away',
        effects: [{ money: 30000 }, { karma: 5 }, { stat: 'happiness', delta: 6 }, { log: 'I kept {{$30000}} and gave {{$10000}} to the hospice that cared for her. The owls approved, I think.', kind: 'good' }],
      },
      {
        id: 'wake',
        label: 'Throw her a proper wake',
        effects: [{ money: 34000 }, { stat: 'happiness', delta: 10 }, { karma: 1 }, { log: 'I spent {{$6000}} on a wake for a woman nobody remembered well. By the end, everyone did, fondly.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'mn_bistro_pitch',
    category: 'money',
    title: 'An investment pitch',
    text: 'A friend of a friend wants {{$25000}} to open a bistro. He has a business plan, a chef, and the confidence of a man who has never run a restaurant.',
    minAge: 25,
    maxAge: 75,
    weight: 0.7,
    cooldown: 6,
    conditions: [{ inPrison: false }, { money: { gte: 60000 } }],
    choices: [
      {
        id: 'full',
        label: 'Invest the full amount',
        hint: '{{$25000}}',
        effects: [
          { money: -25000 },
          {
            random: [
              { weight: 25, effects: [{ money: 60000 }, { stat: 'happiness', delta: 10 }, { log: 'Against all odds the bistro was a hit. My share came back double and I never pay for dessert.', kind: 'money' }] },
              { weight: 35, effects: [{ money: 20000 }, { log: 'It limped along for two years and he bought me out at a small loss. I got a lot of free bread.', kind: 'info' }] },
              { weight: 40, effects: [{ stat: 'happiness', delta: -8 }, { log: 'It closed in eight months. The chef quit, the landlord sued, and my {{$25000}} became a party story.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'small',
        label: 'Invest a smaller stake',
        hint: '{{$5000}}',
        effects: [
          { money: -5000 },
          {
            random: [
              { weight: 25, effects: [{ money: 12000 }, { stat: 'happiness', delta: 5 }, { log: 'Small stake, nice return. The bistro thrived and my {{$5000}} came back as {{$12000}}.', kind: 'money' }] },
              { weight: 35, effects: [{ money: 4000 }, { log: 'It broke even, roughly. I got most of my money back and a lifetime ten percent discount.', kind: 'info' }] },
              { weight: 40, effects: [{ stat: 'happiness', delta: -3 }, { log: 'It folded. I lost {{$5000}} and gained a mild distrust of business plans with mood boards.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'pass',
        label: 'Pass',
        effects: [
          { stat: 'happiness', delta: 1 },
          { log: 'I passed. The bistro opened without me. I ate there once; the soup was fine.', kind: 'info' },
          { chance: 0.25, then: [{ stat: 'happiness', delta: -4 }, { log: 'It became the hottest table in {{city}}. I think about that soup more than I should.', kind: 'info' }] },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ work & earning
  {
    id: 'mn_bonus',
    category: 'money',
    title: 'Year-end bonus',
    text: '{{company}} handed out year-end bonuses and mine was {{$2000}}. My boss shook my hand and said, "Don\'t spend it all in one place," which is advice nobody has ever taken.',
    minAge: 18,
    maxAge: 70,
    weight: 1.2,
    cooldown: 2,
    conditions: [{ inPrison: false }, { hasJob: true }, { partTime: false }],
    choices: [
      {
        id: 'save',
        label: 'Save it',
        effects: [{ money: 2000 }, { stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 1 }, { log: 'I put it straight into savings and felt extremely mature for about a week.', kind: 'money' }],
      },
      {
        id: 'splurge',
        label: 'Spend it all in one place',
        effects: [{ money: 400 }, { stat: 'happiness', delta: 10 }, { log: 'I spent most of it in one place. The place was a weekend away, and it was worth it.', kind: 'good' }],
      },
      {
        id: 'team',
        label: 'Take the team out',
        effects: [{ money: 1400 }, { stat: 'happiness', delta: 5 }, { karma: 2 }, { jobPerformance: 3 }, { log: 'I took the team out for dinner. {{$600}} well spent; people remember who bought the dessert.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'mn_raise_tip',
    category: 'money',
    title: 'Insider advice',
    // A one-time bonus, not a raise: no card effect changes the salary on the Work screen.
    text: '{{person}} told me the bonus pool at {{company}} gets split up next week, and that people who ask early get "rounded up." {{They}} said this in a whisper, so it must be true.',
    minAge: 20,
    maxAge: 65,
    weight: 1,
    cooldown: 3,
    conditions: [{ inPrison: false }, { hasJob: true }, { partTime: false }],
    person: { kind: ['coworker'], minAge: 18, minRelationship: 40 },
    choices: [
      {
        id: 'ask',
        label: 'Ask first thing Monday',
        effects: [
          { relationship: 'person', delta: 3 },
          {
            chance: 0.55,
            then: [{ money: 1500 }, { stat: 'happiness', delta: 6 }, { jobPerformance: 2 }, { log: 'I asked. My boss blinked, checked a spreadsheet, and found me a {{$1500}} bonus. {{person}} was right.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I asked. My boss said, "Let\'s circle back," which in office terms means no.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'prepare',
        label: 'Prepare a case first',
        effects: [
          { relationship: 'person', delta: 3 },
          { stat: 'smarts', delta: 2 },
          { energy: -1 },
          {
            chance: 0.7,
            then: [{ money: 1200 }, { stat: 'happiness', delta: 5 }, { log: 'I brought numbers. Numbers worked: a {{$1200}} bonus, properly argued.', kind: 'good' }],
            else: [{ log: 'I presented my case beautifully. The bonus pool had already been spent on a new coffee machine.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'nothing',
        label: 'Do nothing',
        effects: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -1 }, { log: 'I never asked. Someone else got rounded up and I got the same coffee machine as everyone else.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'mn_side_gig',
    category: 'money',
    title: 'A side gig',
    text: "A neighbor's cousin runs a weekend delivery crew and needs an extra pair of hands. The pay is decent, the hours are brutal and the van smells of onions.",
    minAge: 18,
    maxAge: 70,
    weight: 1.2,
    cooldown: 6,
    conditions: [{ inPrison: false }, { hasJob: true }, { hustle: false }],
    choices: [
      {
        id: 'take',
        label: 'Take the weekends',
        effects: [{ money: 2600 }, { stat: 'health', delta: -4 }, { stat: 'happiness', delta: -3 }, { jobPerformance: -3 }, { log: 'Six months of weekends in the onion van. {{$2600}} richer, very tired, and I can now park anything.', kind: 'money' }],
      },
      {
        id: 'trial',
        label: 'Do a trial month',
        effects: [{ money: 500 }, { stat: 'health', delta: -1 }, { log: 'One month was plenty. I pocketed {{$500}} and a firm wish never to see a loading dock again.', kind: 'money' }],
      },
      {
        id: 'decline',
        label: 'Keep my weekends',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I kept my weekends. Rest is also a form of income, I told myself, unconvincingly.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'mn_mlm_pitch',
    category: 'money',
    title: 'Wellness oils',
    text: '{{person}} invited me to coffee and then unveiled a presentation about "wellness oils." There is a starter kit. There is a "downline." There is no coffee.',
    minAge: 18,
    maxAge: 70,
    weight: 1.2,
    cooldown: 4,
    // A friend roping me into something: not within a few years of adult_life's ad_friend_mlm (the charity walk) or
    // friends_and_strangers' fs_powder_pitch (the end of another pitch), which both guard against this one too.
    conditions: [{ inPrison: false }, { money: { gte: 200 } }, { not: { sinceEvent: 'ad_friend_mlm', lte: 3 } }, { not: { sinceEvent: 'fs_powder_pitch', lte: 2 } }],
    person: { kind: ['friend', 'bestFriend', 'coworker', 'sibling'], minAge: 18, minRelationship: 25 },
    choices: [
      {
        id: 'buy',
        label: 'Buy the starter kit',
        hint: '{{$400}}',
        effects: [
          { money: -400 },
          { relationship: 'person', delta: 6 },
          { karma: -1 },
          {
            random: [
              { weight: 15, effects: [{ money: 600 }, { log: 'Astonishingly, I sold enough oil to come out {{$200}} ahead. Two friends no longer answer my calls.', kind: 'money' }] },
              { weight: 85, effects: [{ stat: 'happiness', delta: -5 }, { log: 'I own {{$400}} of oil and a downline I cannot leave. {{person}} calls me a "rising star." Untrue.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Decline kindly',
        effects: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: 1 }, { log: 'I said it was not for me. {{person}} said {{they}} would "check in next quarter." {{They}} will.', kind: 'info' }],
      },
      {
        id: 'intervene',
        label: 'Talk {{them}} out of it',
        effects: [
          { karma: 3 },
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 4 }, { log: 'I showed {{person}} the math. {{They}} stared, then returned the kit. We got actual coffee.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -10 }, { stat: 'happiness', delta: -3 }, { log: '{{They}} said I was "blocking {{their}} abundance." We have not spoken since. The oils continue.', kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ people & money
  {
    id: 'mn_friend_loan',
    category: 'money',
    title: 'A loan request',
    text: '{{person}} called with the voice people use before asking for money. {{They}} needs {{$1200}} to cover rent and swears {{they}} will pay it back next month.',
    minAge: 18,
    maxAge: 80,
    weight: 1.5,
    cooldown: 10,
    // Not within a few years of love_and_family's lf_sibling_loan, the same rent money asked by a sibling (it guards against this one too).
    conditions: [{ inPrison: false }, { money: { gte: 500 } }, { not: { sinceEvent: 'lf_sibling_loan', lte: 3 } }],
    // Asked and sent by phone, so a friend left behind by a move abroad can ask too (the follow-up binds them the same way).
    person: { kind: ['friend', 'bestFriend'], minAge: 18, minRelationship: 30, farAway: 'any' },
    choices: [
      {
        id: 'lend',
        label: 'Lend it',
        hint: '{{$1200}}',
        effects: [
          { money: -1200 },
          { relationship: 'person', delta: 6 },
          { karma: 2 },
          { log: 'I sent the money. {{person}} called me a lifesaver and promised to repay me by the end of the month.', kind: 'money' },
          { queue: 'mn_friend_loan_followup' },
        ],
      },
      {
        id: 'gift',
        label: 'Make it a gift',
        hint: '{{$1200}}',
        effects: [{ money: -1200 }, { relationship: 'person', delta: 10 }, { karma: 4 }, { stat: 'happiness', delta: 2 }, { log: 'I told {{them}} not to pay it back. {{They}} went quiet, then said thank you about nine times.', kind: 'good' }],
      },
      {
        id: 'half',
        label: 'Offer half',
        hint: '{{$600}}',
        effects: [{ money: -600 }, { relationship: 'person', delta: 2 }, { karma: 1 }, { log: 'I sent {{$600}} and some free budgeting advice. {{person}} took the money and left the advice.', kind: 'money' }],
      },
      {
        id: 'decline',
        label: 'Say no',
        effects: [{ relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -2 }, { log: 'I said I could not. {{person}} said that was fine. It was not fine, but we will both pretend.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'mn_friend_loan_followup',
    category: 'money',
    title: 'The repayment',
    text: 'It has been a few months since I lent {{person}} the money. {{They}} has gone quiet about it, but not quiet about {{their}} new headphones.',
    minAge: 18,
    maxAge: 80,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend'], farAway: 'any' },
    choices: [
      {
        id: 'ask',
        label: 'Ask for it back',
        effects: [
          {
            chance: 0.55,
            then: [{ money: 1200 }, { relationship: 'person', delta: -2 }, { log: '{{person}} paid me back in full, slightly sheepishly. The headphones, apparently, were a gift.', kind: 'good' }],
            else: [{ money: 200 }, { relationship: 'person', delta: -10 }, { stat: 'happiness', delta: -4 }, { log: '{{They}} got defensive and sent me {{$200}} "for now." The rest, I suspect, lives in the headphones.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'letgo',
        label: 'Let it go',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: -3 }, { relationship: 'person', delta: 4 }, { log: 'I decided the friendship was worth more than {{$1200}}. {{person}} never mentioned it. That stung.', kind: 'info' }],
      },
      {
        id: 'text',
        label: 'Send a passive-aggressive text',
        conditions: [{ year: { gte: 2010 } }],
        effects: [
          { relationship: 'person', delta: -6 },
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.4,
            then: [{ money: 1200 }, { log: 'The photo of my empty fridge did the trick. The money arrived at 2 a.m. with no message.', kind: 'money' }],
            else: [{ log: '{{person}} left me on read. Still no money, now also no reply.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'mn_wedding_gift',
    category: 'money',
    title: 'Wedding gift',
    text: '{{person}} is getting married, and the registry has a "suggested contribution" of {{$300}} per guest. The word "suggested" is doing a lot of heavy lifting.',
    minAge: 20,
    maxAge: 80,
    weight: 1.2,
    cooldown: 6,
    conditions: [{ inPrison: false }, { money: { gte: 100 } }],
    person: { kind: ['friend', 'bestFriend', 'sibling', 'coworker'], minAge: 20, minRelationship: 30 },
    choices: [
      {
        id: 'generous',
        label: 'Give generously',
        hint: '{{$500}}',
        effects: [{ money: -500 }, { relationship: 'person', delta: 10 }, { karma: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I gave {{$500}}. {{person}} hugged me at the reception and said it would go toward the honeymoon.', kind: 'good' }],
      },
      {
        id: 'suggested',
        label: 'Give the suggested amount',
        hint: '{{$300}}',
        effects: [{ money: -300 }, { relationship: 'person', delta: 4 }, { log: 'I gave what was asked. Exactly what was asked. We are both adults.', kind: 'money' }],
      },
      {
        id: 'handmade',
        label: 'Make something instead',
        hint: '{{$40}}',
        effects: [
          { money: -40 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 4 }, { log: 'I made a photo album of us over the years. {{person}} cried. It cost {{$40}} and a weekend.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -5 }, { stat: 'happiness', delta: -3 }, { log: 'The album was a hit with {{person}}, less so with {{their}} spouse, who asked about the envelope.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Send my regrets',
        effects: [{ relationship: 'person', delta: -10 }, { stat: 'happiness', delta: -2 }, { log: 'I sent my regrets and a card. The card did not contain money. {{person}} noticed.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'mn_charity_ask',
    category: 'money',
    title: 'The donation call',
    text: "A volunteer stopped me outside the grocery store, collecting for a children's hospice. She had a clipboard, a kind face, and clearly all afternoon.",
    minAge: 18,
    maxAge: 85,
    weight: 1.5,
    cooldown: 8,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'small',
        label: 'Give what is in my pocket',
        hint: '{{$20}}',
        effects: [{ money: -20 }, { karma: 1 }, { stat: 'happiness', delta: 2 }, { log: 'I gave what I had on me. She gave me a sticker. We were both pleased.', kind: 'info' }],
      },
      {
        id: 'medium',
        label: 'Give properly',
        hint: '{{$200}}',
        conditions: [{ money: { gte: 2000 } }],
        effects: [{ money: -200 }, { karma: 3 }, { stat: 'happiness', delta: 4 }, { log: 'I gave {{$200}}. She did a little gasp. I floated home.', kind: 'good' }],
      },
      {
        id: 'bed',
        label: 'Fund a whole ward bed',
        hint: '{{$5000}}',
        conditions: [{ money: { gte: 50000 } }],
        effects: [{ money: -5000 }, { karma: 6 }, { stat: 'happiness', delta: 8 }, { fame: 1 }, { log: 'I funded a bed. There is a small brass plaque with my name on it now. I visit it sometimes.', kind: 'milestone' }],
      },
      {
        id: 'walk',
        label: 'Keep walking',
        effects: [{ stat: 'happiness', delta: -1 }, { karma: -1 }, { log: 'I did the thing where you study your shoes until you are past. She did not judge me. I did.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'mn_broke_week',
    category: 'money',
    title: 'Nine days to payday',
    text: 'There is {{$12}} in my account and nothing coming in for nine days. The fridge holds mustard, half a lemon and a sense of foreboding.',
    minAge: 18,
    maxAge: 70,
    weight: 2,
    cooldown: 2,
    conditions: [{ inPrison: false }, { money: { lte: 300 } }],
    person: { kind: ['mother', 'father', 'sibling'], minRelationship: 30 },
    choices: [
      {
        id: 'ask',
        label: 'Ask {{person}} for help',
        effects: [
          {
            chance: 0.7,
            then: [{ money: 400 }, { relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 2 }, { log: '{{person}} sent {{$400}} and a lecture, in that order. I took both.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -4 }, { log: '{{person}} said {{they}} was stretched too. We both pretended that was the end of the conversation.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'sell',
        label: 'Sell some belongings',
        effects: [{ money: 180 }, { stat: 'happiness', delta: -3 }, { log: 'I sold the console, a guitar I never learned and a lamp I liked. {{$180}} and a bare shelf.', kind: 'money' }],
      },
      {
        id: 'stretch',
        label: 'Stretch it',
        effects: [{ stat: 'health', delta: -3 }, { stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 1 }, { log: 'Nine days of rice, lentils and the lemon. I learned eleven ways to cook lentils and hate them all.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'mn_spouse_spending',
    category: 'money',
    title: 'The statement',
    text: 'A statement arrived for a credit card in {{person}}\'s name, one I did not know existed: {{$3800}} over six months, mostly at a store that sells "artisan garden features."',
    minAge: 22,
    maxAge: 80,
    weight: 1.2,
    // A card "I did not know existed" is found once; the heron is a one-time purchase.
    once: true,
    conditions: [{ inPrison: false }, { married: true }],
    person: { kind: ['spouse'] },
    choices: [
      {
        id: 'together',
        label: 'Pay it off together',
        hint: '{{$3800}}',
        effects: [{ money: -3800 }, { relationship: 'person', delta: 6 }, { love: 4 }, { stat: 'happiness', delta: -3 }, { log: 'We paid it off together and agreed on a budget. The garden now has a stone heron.', kind: 'money' }],
      },
      {
        id: 'talk',
        label: 'Have the conversation',
        effects: [
          {
            random: [
              { weight: 55, effects: [{ money: -1900 }, { relationship: 'person', delta: 4 }, { love: 2 }, { log: '{{They}} apologized, we split it, and the heron stayed. Honestly, the heron is growing on me.', kind: 'good' }] },
              { weight: 45, effects: [{ relationship: 'person', delta: -10 }, { love: -8 }, { stat: 'happiness', delta: -6 }, { log: 'It turned into a fight about everything from the heron to my mother. The card is still open.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'theirs',
        label: 'Let {{them}} handle it',
        effects: [
          { relationship: 'person', delta: -3 },
          { stat: 'happiness', delta: -1 },
          {
            chance: 0.5,
            then: [{ log: '{{person}} paid it off from {{their}} own account over a year. We do not discuss the heron.', kind: 'info' }],
            else: [{ money: -2000 }, { relationship: 'person', delta: -4 }, { log: '{{They}} could not clear it alone and eventually I quietly paid half. The heron stares at me.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'mn_child_allowance',
    category: 'money',
    title: 'The allowance negotiation',
    text: '{{person}} presented a slideshow arguing for a raise in {{their}} allowance. Slide four was titled "Inflation." Slide five was a picture of a puppy, which I believe was unrelated.',
    minAge: 25,
    maxAge: 70,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ inPrison: false }, { hasChildren: true }],
    person: { kind: ['child'], minAge: 7, maxAge: 17 },
    choices: [
      {
        id: 'grant',
        label: 'Grant the raise',
        hint: '{{$300}} a year',
        effects: [{ money: -300 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 3 }, { log: 'I gave in. {{$300}} over the year, and {{person}} now negotiates everything, including bedtime.', kind: 'good' }],
      },
      {
        id: 'chores',
        label: 'Tie it to chores',
        hint: '{{$150}} a year',
        effects: [{ money: -150 }, { relationship: 'person', delta: 3 }, { karma: 1 }, { log: 'Raise granted, chores attached. The trash went out on time for a month, and then we renegotiated.', kind: 'info' }],
      },
      {
        id: 'counter',
        label: 'Counter with my own slideshow',
        effects: [{ relationship: 'person', delta: -5 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 1 }, { log: 'I presented my own slideshow on household costs. {{person}} called it "propaganda" and left.', kind: 'info' }],
      },
    ],
  },
];

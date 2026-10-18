import type { EventDef } from '@/engine/events/schema';

/**
 * Crime and prison. Temptations on the outside use category 'crime'; life on
 * the inside uses category 'prison' and is gated on `inPrison: true`.
 * Everything is abstract: no gore, no gambling, no instructions.
 *
 * Flags shared across the prison events:
 *   cp_prison_infraction   (count) write-ups; hide the "clean record" parole option
 *   cp_prison_good_conduct (count) good behavior noted in the file
 *   cp_parole_recommended  (bool)  the board recommended early release
 *   cp_appeal_filed        (bool)  the character filed an appeal from the library
 */
export const CRIME_AND_PRISON_EVENTS: EventDef[] = [
  // ───────────────────────────────── temptations & trouble ─────────────────────────────────
  {
    id: 'cp_lookout',
    category: 'crime',
    title: 'The lookout',
    text: '{{person}} wanted to grab a few things from the corner store without paying and asked me to stand outside and whistle if anyone came. {{They}} made it sound like a favor.',
    minAge: 12,
    maxAge: 19,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'keep_watch',
        label: 'Keep watch',
        effects: [
          { karma: -3 },
          { counter: 'crimes' },
          {
            chance: 0.65,
            then: [{ money: 40 }, { relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 2 }, { log: '{{person}} came out grinning and split the haul. I spent the week looking over my shoulder.', kind: 'bad' }],
            else: [{ arrest: true }, { money: -150 }, { stat: 'happiness', delta: -8 }, { relationship: 'person', delta: -4 }, { log: 'The clerk had seen everything. We were both marched to the police station. It is on my record.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse',
        effects: [
          { karma: 2 },
          { stat: 'happiness', delta: 1 },
          { relationship: 'person', delta: -3 },
          {
            chance: 0.3,
            then: [{ relationship: 'person', delta: -3 }, { log: '{{person}} got caught without me and did not speak to me for a month. Not my fault. Still.', kind: 'info' }],
            else: [{ log: 'I said no. {{person}} called me boring and did it anyway. I went home and was boring in peace.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'talk_out',
        label: 'Talk {{them}} out of it',
        effects: [
          {
            chance: 0.5,
            then: [{ karma: 3 }, { relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 2 }, { log: 'It took twenty minutes, but {{person}} shrugged and we got ice cream instead.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -3 }, { log: '{{person}} rolled {{their}} eyes and went in anyway. I walked home feeling preachy.', kind: 'info' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_found_wallet',
    category: 'crime',
    title: 'The wallet',
    text: "A wallet was lying on the sidewalk by the bus stop. Cash, cards, a photo of two kids and a driver's license with an address ten minutes away.",
    minAge: 12,
    maxAge: 85,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'keep',
        label: 'Keep the cash',
        effects: [
          { karma: -4 },
          {
            random: [
              { weight: 5, effects: [{ money: 120 }, { stat: 'happiness', delta: 2 }, { log: 'I pocketed the cash and dropped the rest in a mailbox. Nobody ever knew.', kind: 'money' }] },
              { weight: 3, effects: [{ money: 30 }, { log: 'Mostly receipts and loyalty cards. I felt grubby for very little money.', kind: 'info' }] },
              { weight: 2, effects: [{ stat: 'happiness', delta: -5 }, { log: 'The owner had watched me pick it up and followed me. I handed it back, red-faced, in a crowd.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'return_it',
        label: 'Return it to the address',
        effects: [
          { karma: 3 },
          {
            random: [
              { weight: 5, effects: [{ money: 60 }, { stat: 'happiness', delta: 4 }, { log: 'The owner nearly cried and pressed {{$60}} into my hand. I tried to refuse. I did not try hard.', kind: 'good' }] },
              { weight: 3.5, effects: [{ stat: 'happiness', delta: 2 }, { log: 'The owner said thanks through a half-open door. That was it. Still felt right.', kind: 'good' }] },
              { weight: 1.5, effects: [{ stat: 'happiness', delta: -3 }, { log: 'The owner counted the cash in front of me and asked, flatly, if that was all of it. It was.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'police',
        label: 'Hand it to the police',
        effects: [
          { karma: 2 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.25,
            then: [{ money: 40 }, { log: 'A thank-you card and {{$40}} arrived a month later via the station.', kind: 'good' }],
            else: [{ log: 'The desk officer logged it without looking up. Somewhere, someone got their wallet back.', kind: 'info' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_dodgy_job',
    category: 'crime',
    title: 'No questions asked',
    text: "A man I half know offered me {{$600}} to drive a van across town tonight and leave it in a parking lot. He said the job was simple, as long as I didn't open the back.",
    minAge: 17,
    maxAge: 60,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'drive',
        label: 'Drive the van',
        hint: '{{$600}} cash',
        effects: [
          { karma: -4 },
          { counter: 'crimes' },
          {
            random: [
              { weight: 6, effects: [{ money: 600 }, { stat: 'happiness', delta: 3 }, { log: 'I drove slowly, parked, walked away. An envelope was in my mailbox the next morning.', kind: 'money' }] },
              { weight: 2.5, effects: [{ arrest: true }, { money: -400 }, { stat: 'happiness', delta: -8 }, { log: 'I got pulled over with a van full of things that were not mine. Fined, and now I have a record.', kind: 'bad' }] },
              { weight: 1.5, effects: [{ prison: 2 }, { stat: 'happiness', delta: -15 }, { log: 'The van was a lot worse than I guessed. Two years for transporting stolen goods.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Decline politely',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: 1 }, { log: 'I said I had plans. He shrugged and asked someone else. I slept fine.', kind: 'info' }],
      },
      {
        id: 'ask',
        label: "Ask what's in the back",
        effects: [
          {
            chance: 0.5,
            then: [{ karma: 1 }, { log: 'He laughed, said never mind, and walked off. I think I failed a test I did not want to pass.', kind: 'info' }],
            else: [{ karma: -2 }, { stat: 'happiness', delta: -3 }, { log: 'He stopped smiling and told me to forget we had spoken. I have been forgetting it ever since.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_cheap_phone',
    category: 'crime',
    title: 'Too good a price',
    text: 'A guy at the market was selling the newest phone for {{$120}}, still in the box, no receipt, no eye contact. He had a bag full of them.',
    minAge: 14,
    maxAge: 75,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }, { money: { gte: 120 } }],
    choices: [
      {
        id: 'buy',
        label: 'Buy it',
        hint: '{{$120}}',
        effects: [
          { money: -120 },
          { karma: -2 },
          {
            random: [
              { weight: 6, effects: [{ stat: 'happiness', delta: 5 }, { log: 'It works perfectly. I try not to think about whose it was.', kind: 'good' }] },
              { weight: 2.5, effects: [{ stat: 'happiness', delta: -4 }, { log: 'It was blocked by the network two days later. I now own a very thin, expensive paperweight.', kind: 'bad' }] },
              { weight: 1.5, effects: [{ arrest: true }, { stat: 'happiness', delta: -7 }, { log: 'The phone was traced. The police took it back and cited me for receiving stolen property.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'walk',
        label: 'Walk away',
        effects: [{ karma: 1 }, { log: 'I kept walking. My old phone is fine. It is fine.', kind: 'info' }],
      },
      {
        id: 'report',
        label: 'Report the seller',
        effects: [
          { karma: 3 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'Two officers strolled over ten minutes later. The bag of phones went with them.', kind: 'good' }],
            else: [
              { stat: 'happiness', delta: -3 },
              { newPerson: { kind: 'enemy', relationship: 10, minAge: 18, maxAge: 45, log: 'The seller, {{person}}, saw me with the officers and took a long look at my face.' } },
              { log: 'The officers found nothing. I came away with no phone and a new enemy.', kind: 'bad' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_witness_crime',
    category: 'crime',
    title: 'The break-in',
    text: 'Walking home late, I saw two people forcing the side door of the pharmacy on the corner. One of them looked straight at me, then went back to work.',
    minAge: 14,
    maxAge: 85,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'call',
        label: 'Call the police',
        effects: [
          { karma: 3 },
          {
            chance: 0.6,
            then: [
              { stat: 'happiness', delta: 3 },
              { log: 'A patrol car arrived while they were still inside. The officer took my name.', kind: 'good' },
              { chance: 0.5, then: [{ queue: 'cp_witness_summons' }] },
            ],
            else: [{ log: 'By the time anyone came, the door was swinging and the shelves were bare. They took a statement.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'shout',
        label: 'Shout and make noise',
        effects: [
          { karma: 2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'I yelled like a car alarm. They bolted, dropping half of what they had grabbed.', kind: 'good' }],
            else: [{ injury: 6 }, { money: -80 }, { stat: 'happiness', delta: -5 }, { log: 'One of them came at me. I ended up on the sidewalk with a sore jaw and no phone.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'keep_walking',
        label: 'Keep walking',
        effects: [{ karma: -3 }, { stat: 'happiness', delta: 1 }, { log: 'I got home warm and on time. Not my pharmacy, not my problem, I told myself for about a week.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'cp_witness_summons',
    category: 'crime',
    title: 'The summons',
    text: "Months later, a letter arrived: I am a witness in the pharmacy break-in case and expected in court next week. The accused's cousin lives three blocks away.",
    minAge: 14,
    maxAge: 85,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'testify',
        label: 'Tell the truth',
        effects: [
          { karma: 4 },
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.75,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I said what I saw, slowly, with my hands shaking. The judge thanked me. That was that.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'I testified. A week later someone scratched a rude word into my front door. Probably unrelated.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'forget',
        label: 'Suddenly remember nothing',
        effects: [
          { karma: -4 },
          {
            chance: 0.8,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'It was dark, I said. I could not be sure. The case fell apart and I went home early.', kind: 'info' }],
            else: [{ money: -400 }, { stat: 'happiness', delta: -6 }, { log: "The prosecutor read my original statement back to me. Fined for wasting the court's time.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Ignore the letter',
        effects: [
          { karma: -2 },
          {
            chance: 0.6,
            then: [{ log: 'Nobody followed up. The letter is still on the fridge under a magnet.', kind: 'info' }],
            else: [{ arrest: true }, { money: -300 }, { stat: 'happiness', delta: -6 }, { log: 'Two officers walked me to court in the morning. Contempt, a fine, and a very long day.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_police_stop',
    category: 'crime',
    title: 'Blue lights',
    text: 'A police car pulled up beside me and two officers got out. Apparently I matched a description. They wanted my name, my bag, and a good reason for being on this street.',
    minAge: 15,
    maxAge: 80,
    weight: 1,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'calm',
        label: 'Stay calm and cooperate',
        effects: [
          { karma: 1 },
          {
            chance: 0.85,
            then: [{ stat: 'happiness', delta: -1 }, { log: 'They checked my name, apologized for the bother, and drove off. My hands shook for an hour.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'They searched my bag on the hood of the car in front of everyone and found nothing. No apology.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'mouth',
        label: 'Tell them what I think',
        effects: [
          { karma: -1 },
          {
            random: [
              { weight: 4, effects: [{ stat: 'happiness', delta: 3 }, { log: 'I said a few choice things. The older officer laughed and told me to get home safe.', kind: 'info' }] },
              { weight: 4, effects: [{ money: -200 }, { stat: 'happiness', delta: -5 }, { log: 'Fined on the spot for something they called disorderly conduct. Worth it, nearly.', kind: 'bad' }] },
              { weight: 2, effects: [{ arrest: true }, { stat: 'happiness', delta: -8 }, { log: 'I spent the night in a cell for talking back. It is on my record now, in small print.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'rights',
        label: "Ask if I'm free to go",
        effects: [
          {
            chance: 0.55,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'They looked at each other, said yes, and let me walk. Knowing the words helped.', kind: 'good' }],
            else: [
              { stat: 'happiness', delta: -3 },
              {
                chance: 0.3,
                then: [{ money: -100 }, { log: 'That made them curious. Twenty minutes of questions and a ticket for something I had never heard of.', kind: 'bad' }],
                else: [{ log: 'That only made them more curious. Twenty minutes of questions on a cold sidewalk.', kind: 'info' }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_falsely_accused',
    category: 'crime',
    title: 'Wrong person',
    text: 'Money went missing from the register at the store where I was buying milk. The manager locked the door and pointed at me. I had never touched the counter.',
    minAge: 14,
    maxAge: 80,
    weight: 0.8,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'cooperate',
        label: 'Wait calmly for the police',
        effects: [
          {
            chance: 0.75,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'The cameras cleared me in ten minutes. The manager did not apologize. I buy my milk elsewhere now.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -6 }, { log: "The camera was pointed at the ceiling. I was charged on the manager's word alone.", kind: 'bad' }, { queue: 'cp_false_charge_court' }],
          },
        ],
      },
      {
        id: 'lawyer',
        label: 'Call a lawyer',
        hint: '{{$1200}}',
        conditions: [{ money: { gte: 1200 } }],
        effects: [
          { money: -1200 },
          {
            chance: 0.92,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'My lawyer asked three questions and the manager went pale. No charge. An expensive morning.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'Even with a lawyer, they charged me. The manager was very sure. The manager was very wrong.', kind: 'bad' }, { queue: 'cp_false_charge_court' }],
          },
        ],
      },
      {
        id: 'temper',
        label: 'Lose my temper',
        effects: [
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: "I shouted until a customer admitted she had seen the manager's own son at the register.", kind: 'good' }],
            else: [{ stat: 'happiness', delta: -6 }, { log: 'Shouting made me look guilty. The police arrived to find me red-faced and the manager smug.', kind: 'bad' }, { queue: 'cp_false_charge_court' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_false_charge_court',
    category: 'crime',
    title: 'Day in court',
    text: 'The theft charge got a court date. The prosecutor offered a deal: admit it, pay a fine, no prison. Or fight it, with a camera that saw nothing and a manager who saw everything.',
    minAge: 14,
    maxAge: 80,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'plea',
        label: 'Take the deal',
        hint: '{{$500}} fine, a record',
        effects: [{ arrest: true }, { money: -500 }, { stat: 'happiness', delta: -8 }, { karma: -1 }, { log: 'I admitted to something I did not do because it was cheaper. It is on my record now.', kind: 'bad' }],
      },
      {
        id: 'fight',
        label: 'Fight it',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 10 }, { karma: 2 }, { log: 'Not guilty. The manager looked at his shoes. I walked out into daylight and bought milk.', kind: 'good' }],
            else: [{ prison: 1 }, { stat: 'happiness', delta: -15 }, { log: 'Guilty, on the word of a man with a locked door. One year. I still did not do it.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_neighbour_fence',
    category: 'crime',
    title: 'Half price, no box',
    text: "My neighbor's garage is full of televisions, bikes and power tools, none of it in boxes. He offered me anything I liked, cheap, as long as I didn't mention it to anyone.",
    minAge: 18,
    maxAge: 80,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'buy',
        label: 'Buy a television',
        hint: '{{$150}}',
        conditions: [{ money: { gte: 150 } }],
        effects: [
          { money: -150 },
          { karma: -3 },
          {
            chance: 0.8,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'A huge television for the price of a small one. I do not ask who watched it first.', kind: 'good' }],
            else: [{ arrest: true }, { stat: 'happiness', delta: -8 }, { log: 'The garage was raided a month later and my name was in his notebook. A citation, no TV, and shame.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'help',
        label: 'Help him move stock',
        hint: 'Paid in cash',
        effects: [
          { karma: -4 },
          { counter: 'crimes' },
          {
            chance: 0.75,
            then: [{ money: 300 }, { log: 'Two nights of lifting boxes into unmarked vans, paid in cash. My back and my conscience both ache.', kind: 'money' }],
            else: [{ arrest: true }, { money: -300 }, { stat: 'happiness', delta: -8 }, { log: 'The van was stopped with me in the passenger seat. Fined and recorded as an accessory.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'report',
        label: 'Report him',
        effects: [
          { karma: 3 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'The garage was emptied by police one gray morning. He moved out. The street got quieter.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'Nothing happened to him, but somehow the whole street knew who had called. Nobody waves now.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Mind my own business',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I said no thanks and kept my curtains closed. Some neighbors you simply nod at.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'cp_scam_call',
    category: 'crime',
    title: 'The script',
    text: 'A scam caller tried the fake tax-agency routine on me. It was so clumsy I could have done it better. I realized that was a dangerous thought, and that I had a phone.',
    minAge: 18,
    maxAge: 80,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'run_it',
        label: 'Run the scam myself',
        effects: [
          { karma: -8 },
          { counter: 'crimes' },
          {
            random: [
              { weight: 5, effects: [{ money: 1500 }, { stat: 'happiness', delta: -2 }, { log: 'Three frightened strangers paid a "tax debt" into my account. I could not look at my bank app.', kind: 'money' }] },
              { weight: 3, effects: [{ money: -40 }, { stat: 'happiness', delta: -3 }, { log: 'Everyone hung up on me. One man laughed. I quit after an afternoon, out of pocket for the calls.', kind: 'info' }] },
              { weight: 2, effects: [{ prison: 2 }, { stat: 'happiness', delta: -15 }, { log: 'One of my "customers" was a retired fraud investigator. Two years for fraud.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'waste',
        label: 'Waste their time',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: 4 }, { log: 'I kept them on the line for forty minutes pretending to look for my card. Public service.', kind: 'good' }],
      },
      {
        id: 'report',
        label: 'Report the number',
        effects: [
          { karma: 2 },
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'The fraud line thanked me and later wrote to say the number had been shut down. Small win.', kind: 'good' }],
            else: [{ log: 'I reported it. A recorded voice thanked me. Probably it mattered.', kind: 'info' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_fake_id',
    category: 'crime',
    title: 'Laminated lies',
    text: "A kid a grade above me sells fake IDs out of a lunchbox. {{$80}} gets me a card that says I'm twenty-two. The photo would be me, squinting.",
    minAge: 15,
    maxAge: 19,
    weight: 1,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['high'] }, { inPrison: false }, { money: { gte: 80 } }],
    choices: [
      {
        id: 'buy',
        label: 'Buy one',
        hint: '{{$80}}',
        effects: [
          { money: -80 },
          { karma: -2 },
          {
            random: [
              { weight: 5, effects: [{ stat: 'happiness', delta: 5 }, { log: 'It worked at exactly one venue. I felt dangerous. The music inside was not worth {{$80}}.', kind: 'info' }] },
              { weight: 3, effects: [{ stat: 'happiness', delta: -4 }, { log: 'The bouncer snapped it in half and told me to go home. That was {{$80}} of my savings.', kind: 'bad' }] },
              { weight: 2, effects: [{ arrest: true }, { stat: 'happiness', delta: -7 }, { relationship: 'mother', delta: -5 }, { relationship: 'father', delta: -5 }, { log: 'The police were doing a sweep. Fake ID, a citation, and a phone call home I will never forget.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'no',
        label: 'Stick with my real age',
        effects: [{ karma: 1 }, { log: 'I kept my {{$80}} and my real birthday. Twenty-two will arrive on its own schedule.', kind: 'info' }],
      },
      {
        id: 'tip',
        label: 'Tip off a teacher',
        effects: [
          { karma: 2 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'The lunchbox vanished, and so did the kid, for two weeks. Nobody found out it was me.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'Somebody saw me go into the teachers\' lounge. The word "snitch" followed me to the end of the year.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_pickpocketed',
    category: 'crime',
    title: 'Light fingers',
    text: 'The train was packed. Someone bumped me, apologized, and got off at the next stop. My wallet got off with them. I saw them on the platform, not hurrying.',
    minAge: 14,
    maxAge: 85,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }, { money: { gte: 60 } }],
    choices: [
      {
        id: 'chase',
        label: 'Jump off and chase them',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'I caught up at the stairs and they dropped the wallet and ran. Everything still inside.', kind: 'good' }],
            else: [
              { money: -90 },
              {
                chance: 0.4,
                then: [{ injury: 4 }, { log: 'I lost them, and my footing, on the stairs. Wallet gone, knee bruised.', kind: 'bad' }],
                else: [{ log: 'They vanished into the crowd like they had done it a hundred times. They probably had.', kind: 'bad' }],
              },
            ],
          },
        ],
      },
      {
        id: 'report',
        label: 'Report it',
        effects: [
          { money: -90 },
          { karma: 1 },
          {
            chance: 0.2,
            then: [{ money: 90 }, { log: 'Someone turned it in a week later, cash and all. There are good people on the trains too.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I filled out a form and got a reference number. The reference number has not reimbursed me.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'let_go',
        label: 'Let it go',
        effects: [{ money: -90 }, { stat: 'happiness', delta: -2 }, { karma: 1 }, { log: 'I canceled my cards and decided whoever took it needed it more. I did not fully believe that.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'cp_old_cellmate_offer',
    category: 'crime',
    title: 'An old acquaintance',
    text: "Someone I met when I was in trouble with the law came by with a plan: one night's work, a warehouse with a broken alarm, and a share worth more than I earn in a year.",
    minAge: 20,
    maxAge: 65,
    weight: 0.8,
    cooldown: 5,
    conditions: [{ criminalRecord: true }, { inPrison: false }],
    choices: [
      {
        id: 'in',
        label: "I'm in",
        effects: [
          { karma: -8 },
          { counter: 'crimes' },
          {
            random: [
              { weight: 4, effects: [{ money: 12000 }, { stat: 'happiness', delta: 6 }, { log: 'The alarm really was broken. My share was {{$12000}} in a gym bag. I did not sleep for a week.', kind: 'money' }] },
              { weight: 3, effects: [{ stat: 'happiness', delta: -4 }, { chance: 0.3, then: [{ injury: 6 }] }, { log: 'The alarm was not broken. We ran. Nobody got anything but a fright and a long walk home.', kind: 'bad' }] },
              { weight: 3, effects: [{ prison: 4 }, { stat: 'happiness', delta: -20 }, { log: 'The warehouse had a silent alarm and a patient security guard. Four years for burglary.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'out',
        label: "Say I'm done with that",
        effects: [
          { karma: 3 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.7,
            then: [{ log: 'They shrugged and said fair enough. Walking away felt like the hardest thing I had ever done.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'They called me soft and said they would remember it. I locked the door twice that night.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'warn',
        label: 'Warn the warehouse anonymously',
        effects: [
          { karma: 4 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'The alarm got fixed the next day. My old acquaintance never figured out why. I never told.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -6 }, { asset: 'damage', kind: 'house', amount: 10 }, { log: 'They figured out it was me. A brick came through my window with no note. The note was implied.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_record_found_out',
    category: 'crime',
    title: 'The background check',
    text: 'HR at {{company}} ran a late background check and found my record. My manager asked me into a small room with a box of tissues on the table and asked if it was true.',
    minAge: 18,
    maxAge: 70,
    weight: 0.8,
    cooldown: 6,
    conditions: [{ criminalRecord: true }, { hasJob: true }, { inPrison: false }],
    choices: [
      {
        id: 'honest',
        label: 'Tell the whole story',
        effects: [
          { karma: 2 },
          {
            chance: 0.7,
            then: [{ jobPerformance: -3 }, { stat: 'happiness', delta: 2 }, { log: 'My manager listened, nodded, and said everyone has a past. I kept my job and my dignity.', kind: 'good' }],
            else: [{ loseJob: true, reason: 'fired' }, { stat: 'happiness', delta: -10 }, { log: 'They thanked me for my honesty and let me go the same afternoon. Policy, apparently.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'deny',
        label: "Say it's a mistake",
        effects: [
          { karma: -3 },
          {
            chance: 0.5,
            then: [{ jobPerformance: 2 }, { stat: 'happiness', delta: 3 }, { log: 'HR shrugged and blamed the database. My file is clean again, officially. Nobody mentions it.', kind: 'info' }],
            else: [{ loseJob: true, reason: 'fired' }, { stat: 'happiness', delta: -12 }, { log: 'They had the paperwork. Lying about it was the part they could not forgive.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'quit',
        label: 'Resign before they decide',
        effects: [{ loseJob: true, reason: 'left' }, { stat: 'happiness', delta: -4 }, { log: 'I resigned on the spot rather than be pushed. It felt like control. It also felt like unemployment.', kind: 'info' }],
      },
    ],
  },

  // ───────────────────────────────── inside ─────────────────────────────────
  {
    id: 'cp_prison_cellmate',
    category: 'prison',
    title: 'New cellmate',
    text: 'My new cellmate arrived with a trash bag of belongings and strong opinions about the top bunk. By lights out they had used my soap, read my letters and started snoring.',
    minAge: 16,
    maxAge: 90,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'confront',
        label: 'Set some ground rules',
        effects: [
          {
            chance: 0.55,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'We talked it out. Turns out they were as nervous as me. The snoring stayed. We manage.', kind: 'good' }],
            else: [{ injury: 4 }, { stat: 'happiness', delta: -4 }, { flag: 'cp_prison_infraction', inc: 1 }, { log: 'It became a shoving match. The guards wrote us both up. The soap is still an issue.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'trade',
        label: 'Buy peace with commissary',
        hint: '{{$40}}',
        conditions: [{ money: { gte: 40 } }],
        effects: [{ money: -40 }, { stat: 'happiness', delta: 2 }, { log: 'A few packets of noodles bought me the bottom bunk and my own soap. Diplomacy.', kind: 'info' }],
      },
      {
        id: 'transfer',
        label: 'Ask for a cell move',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'The request went through. New cell, quiet cellmate, a window the size of a postcard. Luxury.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'Denied. And now my cellmate knows I asked. The snoring got louder, somehow on purpose.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_prison_fight',
    category: 'prison',
    title: 'Chow hall trouble',
    text: 'In the chow hall, someone with a reputation knocked my tray out of my hands and waited to see what I would do. Everyone else became very interested in their food.',
    minAge: 16,
    maxAge: 90,
    weight: 2,
    cooldown: 2,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'fight',
        label: 'Fight back',
        effects: [
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ injury: 3 }, { stat: 'happiness', delta: 4 }, { flag: 'cp_prison_infraction', inc: 1 }, { log: 'I held my own. A few bruises, a write-up, and nobody touches my tray now.', kind: 'info' }],
            else: [{ injury: 9 }, { stat: 'happiness', delta: -6 }, { flag: 'cp_prison_infraction', inc: 1 }, { log: 'I lost, badly, and spent two days in the infirmary and a week in segregation.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'walk',
        label: 'Pick up the tray and sit',
        effects: [
          { karma: 1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'I picked up my tray and sat down. Boring is a survival strategy in here.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -6 }, { log: 'Walking away marked me as easy. My tray gets knocked over most days now.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'guard',
        label: 'Signal a guard',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 1 }, { flag: 'cp_prison_good_conduct', inc: 1 }, { log: 'A guard stepped in before it started. It went in my file as "de-escalated." I will take it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -7 }, { log: 'The guard looked away. Now I am the one who went to the guards, which is worse than losing.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_prison_visitor',
    category: 'prison',
    title: 'Visiting hours',
    text: '{{person}} came to see me. An hour at a bolted-down table, a vending machine between us, and a guard counting the minutes. {{They}} looked older than I remembered.',
    minAge: 16,
    maxAge: 90,
    weight: 2,
    cooldown: 2,
    conditions: [{ inPrison: true }],
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'spouse', 'lover', 'child', 'friend', 'bestFriend'], minAge: 16 },
    choices: [
      {
        id: 'open',
        label: 'Be honest about it',
        effects: [
          {
            chance: 0.75,
            then: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 6 }, { log: 'I told {{person}} the truth: that it is hard and I am sorry. {{They}} held my hand across the table.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: -3 }, { log: 'Honesty landed hard. {{person}} cried for most of the hour. I wished I had lied a little.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'brave',
        label: 'Put on a brave face',
        effects: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 3 }, { log: 'I joked about the food and said I was fine. {{person}} pretended to believe me. We both did well.', kind: 'info' }],
      },
      {
        id: 'money',
        label: 'Ask {{them}} for money',
        effects: [
          {
            chance: 0.6,
            then: [{ money: 100 }, { relationship: 'person', delta: -2 }, { stat: 'happiness', delta: 3 }, { log: '{{person}} put {{$100}} on my commissary account and said not to make a habit of it.', kind: 'money' }],
            else: [{ relationship: 'person', delta: -6 }, { stat: 'happiness', delta: -3 }, { log: '{{person}} looked hurt, said {{they}} had nothing spare, and left ten minutes early.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_parole_hearing',
    category: 'prison',
    title: 'Parole board',
    text: 'Three people in gray suits read my file in silence, then asked me why I should be let out early. The clock on the wall was loud. I had five minutes.',
    minAge: 18,
    maxAge: 90,
    weight: 1,
    cooldown: 3,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'remorse',
        label: 'Show remorse',
        effects: [
          { karma: 2 },
          {
            chance: 0.3,
            then: [{ flag: 'cp_parole_recommended', set: true }, { stat: 'happiness', delta: 12 }, { log: 'They recommended early release. I walked back to my cell lighter than I had felt in years.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'They thanked me for my candor and denied parole. Next review in a year. The clock kept going.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'record',
        label: 'Point to my clean record',
        conditions: [{ not: { flag: 'cp_prison_infraction', exists: true } }],
        effects: [
          {
            chance: 0.45,
            then: [{ flag: 'cp_parole_recommended', set: true }, { stat: 'happiness', delta: 12 }, { log: 'Not one write-up. They recommended early release. Good behavior, it turns out, is a currency.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'They liked my record but not my answers. Denied. Keep it up, they said, as if I had a choice.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'blame',
        label: 'Blame the system',
        effects: [
          { karma: -2 },
          {
            chance: 0.05,
            then: [{ flag: 'cp_parole_recommended', set: true }, { stat: 'happiness', delta: 12 }, { log: 'Astonishingly, one of them agreed with me. Parole recommended. I did not argue.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: 3 }, { flag: 'cp_prison_infraction', inc: 1 }, { log: 'I said my piece. It felt wonderful for five minutes and went straight in my file. No regrets.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_prison_library',
    category: 'prison',
    title: 'The library cart',
    text: 'The prison library is a cart with a squeaky wheel that comes around on Thursdays. This week it had law books, three thrillers with the endings torn out and a dictionary.',
    minAge: 16,
    maxAge: 90,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'law',
        label: 'Study the law books',
        effects: [
          { stat: 'smarts', delta: 3 },
          { counter: 'libraryVisits' },
          {
            chance: 0.2,
            then: [{ stat: 'happiness', delta: 6 }, { flag: 'cp_appeal_filed', set: true }, { log: 'I found a procedural error in my own case and filed an appeal in pencil. The clerk was impressed.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'I now know more about sentencing guidelines than my own lawyer did. Cold comfort, but comfort.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'thrillers',
        label: 'Read the thrillers',
        effects: [{ stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 1 }, { counter: 'libraryVisits' }, { log: 'Three thrillers, no endings. I wrote my own. In mine, everyone gets out.', kind: 'good' }],
      },
      {
        id: 'volunteer',
        label: 'Volunteer to push the cart',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 1 }, { karma: 1 }, { flag: 'cp_prison_good_conduct', inc: 1 }, { counter: 'libraryVisits' }, { log: 'I am now the library. The wheel still squeaks, but people say thanks, which is rare in here.', kind: 'good' }],
      },
      {
        id: 'weights',
        label: 'Lift weights instead',
        effects: [{ stat: 'health', delta: 3 }, { stat: 'happiness', delta: 1 }, { log: 'Books are for Thursdays. I did push-ups until my arms stopped arguing.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'cp_prison_riot',
    category: 'prison',
    title: 'Wing lockdown',
    text: "It started over the food and spread to the whole wing. Alarms, smoke, shouting, cell doors that should have been locked and weren't. The guards pulled back and waited.",
    minAge: 18,
    maxAge: 90,
    weight: 0.5,
    cooldown: 4,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'hide',
        label: 'Stay in my cell',
        effects: [
          {
            chance: 0.85,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'I pulled the mattress against the door and waited six hours. Boring saved my skin, probably.', kind: 'info' }],
            else: [{ injury: 5 }, { stat: 'happiness', delta: -5 }, { log: 'Someone kicked the door in looking for a rival and took it out on me instead.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'join',
        label: 'Join the riot',
        effects: [
          { karma: -5 },
          { flag: 'cp_prison_infraction', inc: 2 },
          {
            chance: 0.04,
            then: [{ log: 'I was in the thick of it when the wing went dark. I did not come out.', kind: 'bad' }, { death: 'injuries sustained in a prison riot' }],
            else: [
              {
                random: [
                  { weight: 5, effects: [{ injury: 10 }, { stat: 'happiness', delta: -4 }, { log: 'Hours of chaos. I came out of it with cracked ribs and a reputation I never wanted.', kind: 'bad' }] },
                  { weight: 5, effects: [{ injury: 3 }, { stat: 'happiness', delta: 4 }, { log: 'For one night the place belonged to us. The morning after, it very much did not.', kind: 'bad' }] },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'protect',
        label: 'Shield my cellmate',
        effects: [
          { karma: 4 },
          { flag: 'cp_prison_good_conduct', inc: 1 },
          {
            chance: 0.5,
            then: [
              { stat: 'happiness', delta: 4 },
              { newPerson: { kind: 'friend', relationship: 55, minAge: 18, maxAge: 60, log: 'My cellmate {{person}} and I are friends now. Riot-tested.' } },
              { log: 'We barricaded the cell together and talked until dawn.', kind: 'good' },
            ],
            else: [{ injury: 9 }, { stat: 'happiness', delta: -1 }, { log: 'I took a few hits meant for my cellmate. The infirmary nurse called me an idiot, kindly.', kind: 'info' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_prison_bribe_guard',
    category: 'prison',
    title: 'A helpful guard',
    text: 'One of the guards lingered at my door and mentioned, quietly, that certain things could be brought in for certain prices. A phone, better food, a blind eye. Cash only.',
    minAge: 18,
    maxAge: 90,
    weight: 0.8,
    cooldown: 3,
    conditions: [{ inPrison: true }, { money: { gte: 100 } }],
    choices: [
      {
        id: 'phone',
        label: 'Pay for a phone',
        hint: '{{$300}}',
        conditions: [{ money: { gte: 300 } }],
        effects: [
          { money: -300 },
          { karma: -2 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 8 }, { relationship: 'spouse', delta: 3 }, { relationship: 'lover', delta: 3 }, { relationship: 'child', delta: 2 }, { log: 'A cheap phone under the mattress. Hearing voices from home at night changed everything.', kind: 'good' }],
            else: [{ flag: 'cp_prison_infraction', inc: 1 }, { stat: 'happiness', delta: -6 }, { log: 'A cell search found it within a week. Confiscated, written up, and the guard denied everything.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'food',
        label: 'Pay for better food',
        hint: '{{$100}}',
        effects: [
          { money: -100 },
          { karma: -1 },
          {
            chance: 0.85,
            then: [{ stat: 'happiness', delta: 4 }, { stat: 'health', delta: 2 }, { log: 'Real fruit. Bread that was baked this week. I nearly cried over an orange.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I paid. Nothing arrived. There is no complaints department for this sort of thing.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'refuse',
        label: 'Say no thanks',
        effects: [
          { karma: 1 },
          {
            chance: 0.7,
            then: [{ log: 'He shrugged and moved on to the next cell. We nod at each other now, nothing more.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: "Apparently saying no was rude. My cell gets searched more often than anyone else's now.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'report',
        label: 'Report him',
        effects: [
          { karma: 3 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { flag: 'cp_prison_good_conduct', inc: 1 }, { log: 'He was moved to another wing within a month. The warden sent a note that said "Noted."', kind: 'good' }],
            else: [{ injury: 4 }, { stat: 'happiness', delta: -8 }, { log: 'Nothing happened to him. Plenty happened to me. Guards talk, and so do the people they talk to.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_prison_transfer',
    category: 'prison',
    title: 'Cell transfer',
    text: "They moved me to a different wing with an hour's notice. New cell, new faces, new rules nobody explains. The person in the next cell introduced themselves through the wall.",
    minAge: 16,
    maxAge: 90,
    weight: 0.8,
    cooldown: 3,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'low',
        label: 'Keep my head down',
        effects: [{ stat: 'happiness', delta: -2 }, { flag: 'cp_prison_good_conduct', inc: 1 }, { log: 'I learned the new rules by watching, said little, and gave nobody a reason to notice me.', kind: 'info' }],
      },
      {
        id: 'allies',
        label: 'Make friends fast',
        effects: [
          {
            chance: 0.6,
            then: [
              { stat: 'happiness', delta: 5 },
              { newPerson: { kind: 'friend', relationship: 50, minAge: 18, maxAge: 60, log: 'I made a friend on the new wing: {{person}}, who knows where everything is.' } },
              { log: 'Talking through the wall turned into a real friendship. Even in here, that is possible.', kind: 'good' },
            ],
            else: [{ money: -50 }, { stat: 'happiness', delta: -4 }, { log: 'I trusted the wrong person and lost my commissary money by the end of the week.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'stay',
        label: 'Ask to be moved back',
        effects: [
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'Someone in an office took pity and reversed the move. Back to the devil I knew.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { flag: 'cp_prison_infraction', inc: 1 }, { log: 'Request denied, and flagged as "uncooperative." I did not know that was possible.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cp_prison_work_detail',
    category: 'prison',
    title: 'Work detail',
    text: 'Work assignments went up on the board. Kitchen, laundry or the workshop. The pay is a joke, but the days are long and the walls are closer when you have nothing to do.',
    minAge: 16,
    maxAge: 90,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'kitchen',
        label: 'Sign up for the kitchen',
        effects: [
          { money: 60 },
          { stat: 'health', delta: 2 },
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.2,
            then: [{ flag: 'cp_prison_good_conduct', inc: 1 }, { log: 'Extra portions, warm hands, and the cook put a good word in my file. Not a bad year.', kind: 'good' }],
            else: [{ log: 'A year of peeling. I ate better than everyone and smelled permanently of onions.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'workshop',
        label: 'Join the workshop crew',
        effects: [
          { money: 90 },
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.12,
            then: [{ injury: 5 }, { log: 'I learned to weld and then learned why the gloves matter. Burned hand, lesson kept.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 2 }, { log: 'I learned to weld. Somebody out there owns a very sturdy bench made by a very bored person.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'laundry',
        label: 'Take the laundry shift',
        effects: [{ money: 50 }, { stat: 'happiness', delta: 4 }, { log: 'Hot, loud, and nobody bothers you in the laundry. I folded my way through the year.', kind: 'info' }],
      },
      {
        id: 'refuse',
        label: 'Refuse to work',
        effects: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: -2 }, { flag: 'cp_prison_infraction', inc: 1 }, { log: 'I refused on principle. The principle cost me privileges and went in my file. I did rest, though.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'cp_prison_letter_home',
    category: 'prison',
    title: 'Mail call',
    text: 'Mail call. A letter from {{person}}, three pages, the handwriting getting smaller toward the end. News about home, a question about when I will be out, and no mention of why I am here.',
    minAge: 16,
    maxAge: 90,
    weight: 2,
    cooldown: 2,
    conditions: [{ inPrison: true }],
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'spouse', 'lover', 'child', 'friend', 'bestFriend'], minAge: 8 },
    choices: [
      {
        id: 'honest',
        label: 'Write back honestly',
        effects: [
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 4 }, { log: 'I wrote four pages back and told {{person}} everything. The pencil wore down to nothing.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 1 }, { stat: 'happiness', delta: -3 }, { log: 'Honesty landed hard. {{person}} did not write again for months. I reread the old letter instead.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'fine',
        label: 'Say everything is fine',
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 1 }, { karma: -1 }, { log: 'I wrote that the food was fine, the people were fine, I was fine. {{person}} will know.', kind: 'info' }],
      },
      {
        id: 'visit',
        label: 'Ask {{them}} to visit',
        effects: [
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 6 }, { log: '{{person}} came the next month with news, cookies and a hug that lasted the whole hour.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -4 }, { log: '{{person}} wrote back that it was too far, too much, too soon. All three were true.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
];

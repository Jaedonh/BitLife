import type { EventDef } from '@/engine/events/schema';

/**
 * Working-life events: bosses, coworkers, clients, ethics, and the long slow
 * negotiation between a paycheck and a life. Every event requires a job.
 */
export const WORK_LIFE_EVENTS: EventDef[] = [
  // ───────────────────────────────── bosses & ethics ─────────────────────────────────
  {
    id: 'wk_boss_asks_lie',
    category: 'work',
    title: 'A small lie',
    text: 'My boss at {{company}} pulled me aside and asked me to tell a client their order was already on its way. It was not. Nobody had even started it.',
    minAge: 18,
    maxAge: 70,
    weight: 1,
    cooldown: 4,
    conditions: [{ hasJob: true }, { partTime: false }],
    choices: [
      {
        id: 'lie',
        label: 'Tell the client',
        effects: [
          { karma: -4 },
          {
            chance: 0.7,
            then: [{ jobPerformance: 5 }, { log: 'The client bought it. My boss called me a team player, which did not feel like a compliment.', kind: 'info' }],
            else: [
              { jobPerformance: -12 },
              { log: 'The client found out and called the owner. My name was on the email.', kind: 'bad' },
              { chance: 0.7, then: [], else: [{ loseJob: true, reason: 'fired' }, { log: 'I was let go for lying to a client. The boss who told me to is still there.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse politely',
        effects: [
          { karma: 3 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'My boss grumbled and found another way. I think I earned a sliver of respect.', kind: 'good' }],
            else: [{ jobPerformance: -6 }, { log: 'My boss has been cold to me since. My next review is going to be interesting.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'stall',
        label: 'Stall the client instead',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ jobPerformance: 2 }, { log: 'I "had trouble finding the tracking number" for three days. Nobody lied. Technically.', kind: 'info' }],
            else: [{ jobPerformance: -5 }, { stat: 'happiness', delta: -3 }, { log: 'The client saw through my stalling and escalated. Everyone was annoyed at me.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wk_costly_mistake',
    category: 'work',
    title: 'The expensive mistake',
    text: 'I made a mistake at work that will cost {{company}} real money. Nobody has noticed yet. I have about a day before the numbers stop adding up.',
    minAge: 17,
    maxAge: 70,
    weight: 1,
    cooldown: 4,
    conditions: [{ hasJob: true }, { partTime: false }],
    choices: [
      {
        id: 'own',
        label: 'Own up immediately',
        effects: [
          { karma: 3 },
          {
            chance: 0.65,
            then: [{ jobPerformance: -4 }, { stat: 'happiness', delta: 2 }, { log: 'My boss was annoyed but said honesty is why she keeps me around. The company ate the loss.', kind: 'good' }],
            else: [{ jobPerformance: -10 }, { money: -500 }, { log: 'My boss docked part of the loss from my pay. Fair, if painful.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'hide',
        label: 'Quietly cover it up',
        effects: [
          { karma: -4 },
          {
            chance: 0.55,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'I patched it before anyone noticed. My pulse returned to normal a week later.', kind: 'info' }],
            else: [
              { jobPerformance: -15 },
              {
                chance: 0.65,
                then: [{ log: 'An audit found it. The cover-up turned a mistake into a warning on my file.', kind: 'bad' }],
                else: [{ loseJob: true, reason: 'fired' }, { log: 'An audit found the mistake and the cover-up. The cover-up is what got me fired.', kind: 'bad' }],
              },
            ],
          },
        ],
      },
      {
        id: 'blame',
        label: 'Blame the vendor',
        effects: [
          { karma: -6 },
          {
            chance: 0.5,
            then: [{ jobPerformance: 1 }, { stat: 'happiness', delta: -3 }, { log: 'The vendor took the heat. I did not sleep well.', kind: 'info' }],
            else: [{ jobPerformance: -12 }, { relationship: 'coworker', delta: -5 }, { log: 'The vendor had receipts. Everyone now knows exactly what I did.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wk_expense_report',
    category: 'work',
    title: 'The expense report',
    text: 'I was filling out my expense report after a work trip. A few spare receipts from the drawer would turn {{$200}} into {{$900}}, and nobody checks these. Probably.',
    minAge: 20,
    maxAge: 70,
    weight: 1,
    cooldown: 4,
    conditions: [{ hasJob: true }, { partTime: false }],
    choices: [
      {
        id: 'pad',
        label: 'Pad it a little',
        effects: [
          { karma: -5 },
          {
            chance: 0.75,
            then: [{ money: 700 }, { log: 'The report sailed through. I bought myself something nice and called it a bonus.', kind: 'money' }],
            else: [
              { jobPerformance: -15 },
              {
                chance: 0.65,
                then: [{ money: -200 }, { log: 'Finance flagged three receipts. I "found the error" and apologized. My name is now on a list.', kind: 'bad' }],
                else: [{ loseJob: true, reason: 'fired' }, { log: 'Finance pulled my receipts. I was fired for expense fraud.', kind: 'bad' }],
              },
            ],
          },
        ],
      },
      {
        id: 'big',
        label: 'Pad it a lot',
        effects: [
          { karma: -8 },
          {
            chance: 0.5,
            then: [{ money: 2500 }, { log: 'A hotel I never stayed at paid for a vacation I did take. I know what I am.', kind: 'money' }],
            else: [
              { loseJob: true, reason: 'fired' },
              { log: 'The hotel did not exist. Neither does my job now.', kind: 'bad' },
              { chance: 0.75, then: [], else: [{ arrest: true }, { log: 'The company pressed charges. I was arrested for fraud.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'honest',
        label: 'Submit it honestly',
        effects: [{ karma: 2 }, { money: 200 }, { log: 'I claimed {{$200}} and received {{$200}}. The system works, occasionally.', kind: 'info' }],
      },
      {
        id: 'under',
        label: 'Skip the small receipts',
        effects: [{ karma: 1 }, { money: 120 }, { stat: 'happiness', delta: 1 }, { log: 'I could not be bothered with the taxi receipts. The company came out ahead and I came out early.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'wk_shred_documents',
    category: 'work',
    title: 'The shredder',
    text: 'A partner at {{company}} asked me to "tidy up" a box of files before the auditors arrived. Tidying up, in this case, meant the shredder in the basement.',
    minAge: 20,
    maxAge: 70,
    weight: 0.8,
    cooldown: 6,
    conditions: [{ hasJob: true }, { jobCategory: ['law', 'finance', 'office'] }],
    choices: [
      {
        id: 'shred',
        label: 'Shred them',
        effects: [
          { karma: -6 },
          {
            chance: 0.75,
            then: [{ jobPerformance: 5 }, { money: 1000 }, { log: 'I shredded. The auditors found nothing. A "discretionary bonus" appeared in my paycheck.', kind: 'money' }],
            else: [
              { loseJob: true, reason: 'fired' },
              {
                chance: 0.5,
                then: [{ log: 'The auditors found the gaps. I was the one holding the shredder.', kind: 'bad' }],
                else: [{ arrest: true }, { log: 'The auditors had copies. I was fired and arrested for destroying evidence.', kind: 'bad' }, { chance: 0.5, then: [], else: [{ prison: 1 }] }],
              },
            ],
          },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse',
        effects: [
          { karma: 3 },
          {
            chance: 0.4,
            then: [{ jobPerformance: 2 }, { log: 'The partner backed down. We never spoke of it. I still have the box.', kind: 'info' }],
            else: [{ jobPerformance: -5 }, { log: 'The partner found someone else to do it. I was taken off the account.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'copy',
        label: 'Copy them first, then refuse',
        effects: [{ karma: 4 }, { flag: 'wk_has_copies', set: true }, { jobPerformance: -4 }, { stat: 'happiness', delta: -2 }, { log: 'I copied everything, then refused. If this goes wrong, I am ready.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'wk_whistleblower',
    category: 'work',
    title: 'What I found',
    text: 'I found documents at {{company}} proving the business has been quietly breaking the law and hurting people to do it. The wrong people know I have seen them, and I know they know.',
    minAge: 24,
    maxAge: 65,
    weight: 0.3,
    once: true,
    conditions: [{ hasJob: true }, { partTime: false }],
    choices: [
      {
        id: 'blow',
        label: 'Blow the whistle',
        effects: [{ karma: 8 }, { fame: 4 }, { flag: 'wk_whistle', set: 'public' }, { queue: 'wk_whistle_fallout' }, { log: 'I handed the documents to a regulator and a journalist. There is no un-ringing that bell.', kind: 'milestone' }],
      },
      {
        id: 'anon',
        label: 'Leak them anonymously',
        effects: [{ karma: 5 }, { flag: 'wk_whistle', set: 'anon' }, { queue: 'wk_whistle_fallout' }, { log: 'I sent the files anonymously, deleted everything, and tried to look normal.', kind: 'info' }],
      },
      {
        id: 'quiet',
        label: 'Stay quiet',
        effects: [{ karma: -6 }, { stat: 'happiness', delta: -6 }, { flag: 'wk_whistle', set: 'quiet' }, { log: 'I put the documents back and said nothing. I still think about the people.', kind: 'bad' }],
      },
      {
        id: 'quit',
        label: 'Quit on the spot',
        effects: [{ loseJob: true, reason: 'left' }, { karma: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I walked out. No fuss, no documents, no job. My conscience got clearer and my rent did not.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'wk_whistle_fallout',
    category: 'work',
    title: 'The fallout',
    text: 'The investigation into {{company}} made the news. Lawyers appeared. Executives "stepped back to spend time with family." Then the question came around to who had talked.',
    minAge: 24,
    maxAge: 70,
    weight: 1,
    followUpOnly: true,
    conditions: [{ hasJob: true }],
    choices: [
      {
        id: 'public',
        label: 'Stand by my name',
        conditions: [{ flag: 'wk_whistle', eq: 'public' }],
        effects: [
          {
            random: [
              { weight: 5, effects: [{ money: 20000 }, { fame: 6 }, { stat: 'happiness', delta: 5 }, { log: 'The company settled. The regulator awarded me a share, and my name is in a case study.', kind: 'good' }] },
              { weight: 5, effects: [{ loseJob: true, reason: 'fired' }, { money: 5000 }, { stat: 'happiness', delta: -8 }, { log: 'They fired me for "breach of confidence." A lawsuit paid out later, but the job was gone.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'anon',
        label: 'Keep my head down',
        conditions: [{ flag: 'wk_whistle', eq: 'anon' }],
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 4 }, { jobPerformance: 2 }, { log: 'Nobody ever figured out who sent the files. The new management is almost pleasant.', kind: 'good' }],
            else: [{ loseJob: true, reason: 'fired' }, { stat: 'happiness', delta: -8 }, { log: 'The IT logs gave me away. I was walked out of the building with a box and a story.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'watch',
        label: 'Watch from a distance',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I watched the executives on the news and felt something close to satisfaction.', kind: 'info' }],
      },
    ],
  },

  // ───────────────────────────────── coworkers ─────────────────────────────────
  {
    id: 'wk_new_hire',
    category: 'work',
    title: 'The new hire',
    text: 'A new hire started at {{company}} today, standing by the coffee maker with the lost look of someone who has been given a badge but no instructions.',
    minAge: 16,
    maxAge: 70,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ hasJob: true }],
    choices: [
      {
        id: 'help',
        label: 'Show them the ropes',
        effects: [
          { newPerson: { kind: 'coworker', relationship: 70, log: 'I showed {{person}} around. {{They}} bought me a coffee by Friday.' } },
          { karma: 2 },
          { energy: -1 },
          { stat: 'happiness', delta: 2 },
        ],
      },
      {
        id: 'ignore',
        label: 'Let them figure it out',
        effects: [{ newPerson: { kind: 'coworker', relationship: 40, log: '{{person}} found the printer eventually. We nod at each other now.' } }, { log: 'I was busy. The new hire survived.', kind: 'info' }],
      },
      {
        id: 'haze',
        label: 'Send them for a left-handed stapler',
        effects: [
          { karma: -2 },
          { stat: 'happiness', delta: 2 },
          { newPerson: { kind: 'coworker', relationship: 30, log: '{{person}} took forty minutes to figure it out. {{They}} did not find it funny.' } },
          { chance: 0.7, then: [], else: [{ jobPerformance: -2 }, { log: 'My manager heard about the stapler. "Grow up" was the whole conversation.', kind: 'bad' }] },
        ],
      },
    ],
  },
  {
    id: 'wk_credit_thief',
    category: 'work',
    title: 'Stolen credit',
    text: 'I spent two weeks on a proposal. In the meeting, {{person}} presented it as {{their}} own idea while I sat there holding the stapler I used to bind it.',
    minAge: 17,
    maxAge: 70,
    weight: 1.2,
    cooldown: 4,
    conditions: [{ hasJob: true }, { partTime: false }],
    person: { kind: ['coworker', 'friend', 'bestFriend'] },
    choices: [
      {
        id: 'confront',
        label: 'Confront {{person}} privately',
        effects: [
          {
            chance: 0.55,
            then: [{ relationship: 'person', delta: -4 }, { jobPerformance: 4 }, { log: '{{person}} apologized and corrected it with the boss the next day. Awkward, but fixed.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -12 }, { stat: 'happiness', delta: -4 }, { log: '{{person}} told me I was being dramatic. We no longer share lunch.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'boss',
        label: 'Tell the boss',
        effects: [
          { relationship: 'person', delta: -10 },
          {
            chance: 0.5,
            then: [{ jobPerformance: 6 }, { log: 'The boss checked the file history. My name was on every draft. Credit restored.', kind: 'good' }],
            else: [{ jobPerformance: -3 }, { stat: 'happiness', delta: -5 }, { log: 'The boss said it did not matter who had the idea. It mattered to me.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'letgo',
        label: 'Let it go',
        effects: [{ stat: 'happiness', delta: -3 }, { karma: 1 }, { log: 'I let it slide. The stapler and I know the truth.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'wk_harassment_witness',
    category: 'work',
    title: 'What I saw',
    text: 'I watched a senior manager corner {{person}} by the printers and make remarks that made {{them}} shrink, then laugh when {{they}} tried to leave. {{person}} saw me watching.',
    minAge: 18,
    maxAge: 70,
    weight: 0.8,
    cooldown: 6,
    conditions: [{ hasJob: true }],
    person: { kind: ['coworker', 'friend', 'bestFriend'], minAge: 18 },
    choices: [
      {
        id: 'report',
        label: 'Report it',
        effects: [
          { karma: 4 },
          { relationship: 'person', delta: 10 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'An investigation followed. The manager was moved, then gone. {{person}} thanked me without words.', kind: 'good' }],
            else: [{ jobPerformance: -6 }, { stat: 'happiness', delta: -3 }, { log: 'They "looked into it." The manager stayed. My shift schedule got mysteriously worse.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'support',
        label: 'Check on {{person}}',
        effects: [{ karma: 2 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 1 }, { log: '{{person}} said {{they}} was fine, then said {{they}} was not. We talked for an hour.', kind: 'good' }],
      },
      {
        id: 'nothing',
        label: 'Say nothing',
        effects: [{ karma: -4 }, { relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -5 }, { log: 'I said nothing. {{person}} stopped meeting my eye. I understood why.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'wk_birthday_collection',
    category: 'work',
    title: 'The collection envelope',
    text: "An envelope is going around work for {{person}}'s birthday. It reached me with a list of names and amounts, and a pen that does not work.",
    minAge: 16,
    maxAge: 70,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ hasJob: true }],
    person: { kind: ['coworker', 'friend', 'bestFriend'] },
    choices: [
      {
        id: 'chip',
        label: 'Chip in',
        effects: [{ money: -30 }, { relationship: 'person', delta: 4 }, { karma: 1 }, { log: 'I put in my share. The card had a cartoon cat on it. {{person}} loved the cat.', kind: 'good' }],
      },
      {
        id: 'big',
        label: 'Chip in generously',
        effects: [{ money: -100 }, { relationship: 'person', delta: 8 }, { relationship: 'coworker', delta: 2 }, { karma: 2 }, { log: 'I put in more than anyone. {{person}} noticed. So did the envelope-holder, who now expects it.', kind: 'good' }],
      },
      {
        id: 'pass',
        label: 'Pass it along',
        effects: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: 1 }, { log: 'My name was conspicuously absent from the envelope. {{person}} said nothing. {{They}} noticed.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'wk_fish_microwave',
    category: 'work',
    title: 'The fish',
    text: 'Every single day at noon, {{person}} microwaves fish. The smell has colonized the entire floor. Someone started leaving passive-aggressive notes. Today, the notes got a reply.',
    minAge: 16,
    maxAge: 70,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ hasJob: true }],
    person: { kind: ['coworker', 'friend', 'bestFriend'] },
    choices: [
      {
        id: 'talk',
        label: 'Talk to {{person}} directly',
        effects: [
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 3 }, { relationship: 'coworker', delta: 4 }, { stat: 'happiness', delta: 3 }, { log: '{{person}} had no idea. {{They}} switched to soup and the floor can breathe again.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -6 }, { log: '{{person}} said {{they}} would microwave whatever {{they}} liked. The notes escalated.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'note',
        label: 'Leave a note',
        effects: [{ karma: -1 }, { relationship: 'person', delta: -3 }, { stat: 'happiness', delta: 1 }, { log: 'I added my own note. It was witty. It changed nothing.', kind: 'info' }],
      },
      {
        id: 'eat',
        label: 'Eat lunch outside',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'health', delta: 1 }, { money: -40 }, { log: 'I started eating in the park. Fresh air, pigeons, and a small hole in my budget.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'wk_cover_sick_coworker',
    category: 'work',
    title: 'Covering again',
    text: '{{person}} called in sick again and asked if I would cover. It is the third time this month. I have started to recognize the cough.',
    minAge: 16,
    maxAge: 70,
    weight: 2,
    cooldown: 2,
    conditions: [{ hasJob: true }],
    person: { kind: ['coworker', 'friend', 'bestFriend'] },
    choices: [
      {
        id: 'cover',
        label: 'Cover the shift',
        effects: [{ money: 150 }, { relationship: 'person', delta: 6 }, { karma: 2 }, { energy: -1 }, { stat: 'happiness', delta: -2 }, { log: 'I covered. {{person}} owes me, and I have started keeping a tally.', kind: 'good' }],
      },
      {
        id: 'refuse',
        label: 'Say no this time',
        effects: [{ relationship: 'person', delta: -5 }, { stat: 'happiness', delta: 2 }, { log: 'I said no. {{person}} found someone else, eventually. The cough got better.', kind: 'info' }],
      },
      {
        id: 'tell_boss',
        label: 'Mention it to the boss',
        effects: [{ relationship: 'person', delta: -12 }, { karma: -3 }, { jobPerformance: 2 }, { log: 'I let the boss know. {{person}} got a warning and a long memory.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'wk_wrongful_blame',
    category: 'work',
    title: 'Not my fault',
    text: 'A delivery went out wrong and my boss blamed me in front of everyone. I was not even working that day. {{person}}, who was, stood right there saying nothing.',
    minAge: 16,
    maxAge: 70,
    weight: 1,
    cooldown: 4,
    conditions: [{ hasJob: true }],
    person: { kind: ['coworker', 'friend', 'bestFriend'] },
    choices: [
      {
        id: 'proof',
        label: 'Show the roster',
        effects: [
          {
            chance: 0.75,
            then: [{ jobPerformance: 3 }, { stat: 'happiness', delta: 3 }, { relationship: 'person', delta: -6 }, { log: 'The roster cleared me. My boss apologized in a mumble. {{person}} got the talking-to instead.', kind: 'good' }],
            else: [{ jobPerformance: -2 }, { stat: 'happiness', delta: -3 }, { log: 'My boss said it did not matter who was on shift: "We are all responsible." Only I got yelled at.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'take',
        label: 'Take the blame',
        effects: [{ jobPerformance: -6 }, { karma: 3 }, { relationship: 'person', delta: 10 }, { stat: 'happiness', delta: -3 }, { log: 'I took it. {{person}} owes me a very large favor and {{they}} knows it.', kind: 'info' }],
      },
      {
        id: 'call_out',
        label: 'Call {{person}} out',
        effects: [
          { relationship: 'person', delta: -12 },
          { karma: -2 },
          {
            chance: 0.6,
            then: [{ jobPerformance: 2 }, { log: 'I said it was {{person}}. It was. {{They}} will not forget that I said so.', kind: 'info' }],
            else: [{ jobPerformance: -4 }, { relationship: 'coworker', delta: -4 }, { log: 'My boss did not care who it was, and now everyone thinks I throw people under the bus.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wk_mentor_offer',
    category: 'work',
    title: 'A mentor',
    text: '{{person}}, who has been at this longer than anyone can remember, offered to mentor me. "Nobody did it for me," {{they}} said, "and look how I turned out."',
    minAge: 18,
    maxAge: 40,
    weight: 1,
    once: true,
    conditions: [{ hasJob: true }],
    person: { kind: ['coworker', 'friend', 'bestFriend'], minAge: 38 },
    choices: [
      {
        id: 'accept',
        label: 'Accept gratefully',
        effects: [{ relationship: 'person', delta: 10 }, { stat: 'smarts', delta: 4 }, { jobPerformance: 6 }, { energy: -1 }, { log: '{{person}} taught me things nobody writes down. I got better, fast.', kind: 'good' }],
      },
      {
        id: 'decline',
        label: 'Decline politely',
        effects: [{ relationship: 'person', delta: -4 }, { log: 'I said I was fine on my own. {{person}} shrugged and went back to being brilliant without me.', kind: 'info' }],
      },
      {
        id: 'lunch',
        label: 'Just do the occasional lunch',
        effects: [{ relationship: 'person', delta: 4 }, { stat: 'smarts', delta: 1 }, { jobPerformance: 2 }, { log: 'We do lunch once a month. {{They}} tells stories; I take notes.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'wk_retiring_colleague',
    category: 'work',
    title: 'The retirement party',
    text: 'After decades at {{company}}, {{person}} is retiring. There is a cake, a card the size of a door, and a speech from a manager who had to check {{their}} last name.',
    minAge: 20,
    maxAge: 70,
    weight: 0.8,
    cooldown: 5,
    conditions: [{ hasJob: true }],
    person: { kind: ['coworker', 'friend', 'bestFriend'], minAge: 55 },
    choices: [
      {
        id: 'speech',
        label: 'Give a proper speech',
        effects: [{ relationship: 'person', delta: 10 }, { stat: 'happiness', delta: 4 }, { relationship: 'coworker', delta: 3 }, { log: 'I told the story of {{person}} and the fire alarm. The room roared. {{They}} hugged me.', kind: 'good' }],
      },
      {
        id: 'gift',
        label: 'Buy a thoughtful gift',
        effects: [{ money: -120 }, { relationship: 'person', delta: 8 }, { karma: 2 }, { log: 'I found a gift {{they}} actually wanted. {{They}} teared up, then pretended {{they}} had not.', kind: 'good' }],
      },
      {
        id: 'cake',
        label: 'Just eat the cake',
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -2 }, { log: 'I ate the cake and signed the door-sized card. It was good cake.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'wk_workplace_flirt',
    category: 'work',
    title: 'Something at work',
    text: 'Someone from another department keeps finding reasons to walk past my desk. Today they asked if I wanted dinner after work, then blushed at their own question.',
    minAge: 18,
    maxAge: 60,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }, { hasJob: true }, { partTime: false }, { hasLover: false }],
    choices: [
      {
        id: 'date',
        label: 'Say yes',
        effects: [
          {
            chance: 0.6,
            then: [{ newPerson: { kind: 'lover', relationship: 65, log: 'Dinner became a second dinner. I am now dating {{personFull}}, which HR will have thoughts about.' } }, { stat: 'happiness', delta: 8 }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'Dinner was fine. The second one never happened. Walking past my desk got awkward for both of us.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Keep it professional',
        effects: [{ stat: 'happiness', delta: -1 }, { karma: 1 }, { log: 'I said I do not date coworkers. They nodded and found a new route to the kitchen.', kind: 'info' }],
      },
      {
        id: 'friend',
        label: 'Suggest a group lunch',
        effects: [{ newPerson: { kind: 'coworker', relationship: 60, log: 'We settled on friendship. {{person}} is now my lunch ally.' } }, { stat: 'happiness', delta: 3 }],
      },
    ],
  },

  // ───────────────────────────────── the daily grind ─────────────────────────────────
  {
    id: 'wk_overtime_vs_family',
    category: 'work',
    title: 'Late again',
    text: 'The team needed someone to stay late for the third night in a row. At home, dinner was going cold and my phone kept lighting up with one word: "Where?"',
    minAge: 20,
    maxAge: 70,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ hasJob: true }, { partTime: false }, { any: [{ married: true }, { hasChildren: true }] }],
    choices: [
      {
        id: 'stay',
        label: 'Stay late',
        effects: [
          { money: 300 },
          { jobPerformance: 6 },
          { relationship: 'spouse', delta: -5 },
          { relationship: 'child', delta: -4 },
          { stat: 'happiness', delta: -2 },
          { log: 'I stayed. The work got done. The leftovers were in the fridge with a note that just said my name.', kind: 'info' },
        ],
      },
      {
        id: 'home',
        label: 'Go home',
        effects: [{ jobPerformance: -5 }, { stat: 'happiness', delta: 4 }, { relationship: 'spouse', delta: 4 }, { relationship: 'child', delta: 4 }, { log: 'I went home. My boss noticed. So did my family.', kind: 'good' }],
      },
      {
        id: 'deal',
        label: 'Negotiate a trade',
        effects: [
          {
            chance: 0.5,
            then: [{ jobPerformance: 3 }, { stat: 'happiness', delta: 2 }, { log: 'I offered to come in early instead. My boss took the deal and I made it home for dessert.', kind: 'good' }],
            else: [{ jobPerformance: -3 }, { relationship: 'spouse', delta: 2 }, { log: 'My boss did not want a trade. I went home anyway and felt the look on my way out.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wk_cover_weekend',
    category: 'work',
    title: 'Weekend cover',
    text: 'My boss asked if I could cover a weekend shift at the last minute. Everyone else had "plans," a word that was doing a lot of work.',
    minAge: 16,
    maxAge: 70,
    weight: 2,
    cooldown: 2,
    conditions: [{ hasJob: true }],
    choices: [
      {
        id: 'yes',
        label: 'Take the shift',
        effects: [{ money: 250 }, { jobPerformance: 4 }, { stat: 'happiness', delta: -3 }, { energy: -1 }, { log: 'I worked the weekend. Time and a half, and my boss owes me one.', kind: 'money' }],
      },
      {
        id: 'no',
        label: 'Say no',
        effects: [{ stat: 'happiness', delta: 2 }, { jobPerformance: -2 }, { log: 'I said no. My boss said "no worries" in a tone that meant worries.', kind: 'info' }],
      },
      {
        id: 'trade',
        label: 'Ask for a weekday off instead',
        effects: [
          {
            chance: 0.6,
            then: [{ money: 250 }, { jobPerformance: 2 }, { stat: 'happiness', delta: 2 }, { log: 'Deal. I worked Saturday and spent Tuesday asleep.', kind: 'good' }],
            else: [{ jobPerformance: -1 }, { log: 'No trade available. I declined, politely, and heard about it on Monday.', kind: 'info' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wk_client_scream',
    category: 'work',
    title: 'The screamer',
    text: 'A customer got right in my face and screamed at me about something I had no control over. The whole room went quiet and watched to see what I would do.',
    minAge: 16,
    maxAge: 70,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ hasJob: true }],
    choices: [
      {
        id: 'calm',
        label: 'Stay calm and listen',
        effects: [
          { karma: 2 },
          {
            chance: 0.6,
            then: [{ jobPerformance: 5 }, { stat: 'happiness', delta: 2 }, { log: 'I let them run out of steam, fixed what I could, and got a grudging thank-you. My manager noticed.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'They kept shouting until security walked them out. I was calm the whole time and shaking afterward.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'snap',
        label: 'Snap back',
        effects: [
          { stat: 'happiness', delta: 3 },
          { karma: -3 },
          {
            chance: 0.5,
            then: [{ log: 'The room applauded. My manager did not, but let it slide.', kind: 'info' }],
            else: [{ jobPerformance: -10 }, { log: 'The customer filed a complaint. I got a written warning.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'walk',
        label: 'Walk away',
        effects: [
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.5,
            then: [{ log: 'I handed it to my manager and took five minutes in the back. Nobody blamed me.', kind: 'info' }],
            else: [{ jobPerformance: -4 }, { log: 'My manager said walking away was not an option. Noted.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wk_customer_tip',
    category: 'work',
    title: 'A big tip',
    text: 'A customer in a very good mood pressed a folded bill into my hand on the way out. It was far more than they had spent. {{company}} has a tip-sharing policy. In theory.',
    minAge: 15,
    maxAge: 70,
    weight: 2,
    cooldown: 2,
    conditions: [{ hasJob: true }, { jobCategory: ['service'] }],
    choices: [
      {
        id: 'keep',
        label: 'Keep it',
        effects: [
          { money: 150 },
          { karma: -1 },
          {
            chance: 0.75,
            then: [{ log: 'I pocketed it. Nobody asked.', kind: 'money' }],
            else: [{ relationship: 'coworker', delta: -5 }, { log: 'Someone saw. The tip jar got a lot quieter when I walked past.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'share',
        label: 'Share with the team',
        effects: [{ money: 40 }, { karma: 3 }, { relationship: 'coworker', delta: 6 }, { stat: 'happiness', delta: 2 }, { log: 'I split it. The newest person on the team looked at me like I had grown wings.', kind: 'good' }],
      },
      {
        id: 'give_back',
        label: 'Give it back',
        effects: [
          { karma: 2 },
          {
            chance: 0.5,
            then: [{ money: 60 }, { log: 'They would not take it all back and made me keep half. Honesty paid, just less.', kind: 'good' }],
            else: [{ log: 'They thanked me and left. My manager said I was an idiot, warmly.', kind: 'info' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wk_salary_overheard',
    category: 'work',
    title: 'Overheard pay',
    text: 'I overheard two coworkers comparing salaries in the elevator. One of them does my job, started after me, and earns noticeably more. The elevator ride became very long.',
    minAge: 20,
    maxAge: 70,
    weight: 1,
    cooldown: 5,
    conditions: [{ hasJob: true }, { partTime: false }],
    choices: [
      {
        id: 'raise',
        label: 'Ask for a raise',
        effects: [
          {
            chance: 0.45,
            then: [{ money: 2500 }, { stat: 'happiness', delta: 6 }, { jobPerformance: 2 }, { log: 'I made my case. My boss "found room in the budget" within a week.', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -5 }, { jobPerformance: -2 }, { log: 'My boss said pay is confidential and I should not have been listening. I was in an elevator.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'stew',
        label: 'Stew about it',
        effects: [{ stat: 'happiness', delta: -6 }, { jobPerformance: -3 }, { log: 'I did my job at exactly the level I am paid for. It turns out that is lower than before.', kind: 'bad' }],
      },
      {
        id: 'ask_them',
        label: 'Ask the coworker for advice',
        effects: [
          { relationship: 'coworker', delta: 4 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.5,
            then: [{ jobPerformance: 3 }, { log: 'They told me exactly how they negotiated. I took notes.', kind: 'good' }],
            else: [{ log: 'They got cagey. Fair enough; I was eavesdropping.', kind: 'info' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wk_performance_review',
    category: 'work',
    title: 'Annual review',
    text: 'My annual review at {{company}} landed on the calendar with a cheerful icon. My boss had a folder, a pen, and the expression of someone about to deliver "feedback."',
    minAge: 18,
    maxAge: 70,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ hasJob: true }, { partTime: false }],
    choices: [
      {
        id: 'listen',
        label: 'Listen and take notes',
        effects: [
          {
            random: [
              { weight: 5, effects: [{ jobPerformance: 5 }, { stat: 'happiness', delta: 3 }, { log: 'The review was better than I feared. "Reliable" came up a lot. I will take reliable.', kind: 'good' }] },
              { weight: 3, effects: [{ jobPerformance: 2 }, { log: 'Mixed. Praise, then "areas for growth," then praise again. A feedback sandwich.', kind: 'info' }] },
              { weight: 2, effects: [{ jobPerformance: -4 }, { stat: 'happiness', delta: -4 }, { log: 'It was not good. There is now a "development plan" with my name on it.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'ask_raise',
        label: 'Push for a raise',
        effects: [
          {
            chance: 0.4,
            then: [{ money: 2000 }, { jobPerformance: 3 }, { stat: 'happiness', delta: 5 }, { log: 'I made my case with numbers. The raise came through.', kind: 'money' }],
            else: [{ jobPerformance: -3 }, { stat: 'happiness', delta: -3 }, { log: 'I asked. The answer was a long sentence that ended in "next cycle."', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'argue',
        label: 'Argue every point',
        effects: [
          { karma: -1 },
          {
            chance: 0.3,
            then: [{ jobPerformance: 4 }, { log: 'I pushed back and, surprisingly, won two points. My boss revised the rating.', kind: 'good' }],
            else: [{ jobPerformance: -8 }, { relationship: 'coworker', delta: -2 }, { stat: 'happiness', delta: -3 }, { log: 'I argued. My boss listened, then wrote "defensive" in the folder.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wk_employee_award',
    category: 'work',
    title: 'Employee of the month',
    text: '{{company}} named me employee of the month. There is a certificate, a parking space I cannot use, and a small ceremony by the vending machine.',
    minAge: 16,
    maxAge: 70,
    weight: 0.8,
    cooldown: 4,
    conditions: [{ hasJob: true }],
    choices: [
      {
        id: 'accept',
        label: 'Accept graciously',
        effects: [{ stat: 'happiness', delta: 5 }, { jobPerformance: 4 }, { money: 100 }, { log: 'I accepted the certificate and the gift card. The parking space remains ceremonial.', kind: 'good' }],
      },
      {
        id: 'team',
        label: 'Credit the team',
        effects: [{ stat: 'happiness', delta: 3 }, { jobPerformance: 3 }, { relationship: 'coworker', delta: 6 }, { karma: 2 }, { money: 100 }, { log: 'I thanked the team. They cheered. Someone cried, probably about something else.', kind: 'good' }],
      },
      {
        id: 'speech',
        label: 'Give a speech',
        effects: [
          { money: 100 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 6 }, { fame: 1 }, { jobPerformance: 4 }, { log: 'The speech landed. Two jokes, one sincere line, and a round of applause.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { jobPerformance: 2 }, { log: 'The speech went long. The vending machine hummed through it. Someone checked their watch.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wk_stock_theft',
    category: 'work',
    title: 'Missing supplies',
    text: 'Things keep disappearing from the supply room at {{company}}, so management called a meeting. Everyone looked at the floor, except the one person who looked at me.',
    minAge: 16,
    maxAge: 70,
    weight: 0.8,
    cooldown: 5,
    conditions: [{ hasJob: true }],
    choices: [
      {
        id: 'investigate',
        label: 'Quietly investigate',
        effects: [
          {
            chance: 0.5,
            then: [{ jobPerformance: 6 }, { karma: 2 }, { relationship: 'coworker', delta: -2 }, { log: 'I spotted the pattern on the shift roster and told management. The thief was gone by Friday.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { relationship: 'coworker', delta: -4 }, { log: 'I asked too many questions. Now I am the one people whisper about.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'cameras',
        label: 'Suggest cameras',
        effects: [{ jobPerformance: 2 }, { relationship: 'coworker', delta: -3 }, { log: 'Cameras went up. The thefts stopped. So did the jokes in the break room.', kind: 'info' }],
      },
      {
        id: 'head_down',
        label: 'Keep my head down',
        effects: [
          {
            chance: 0.85,
            then: [{ log: 'I kept my head down. The thief was caught a month later. Not me.', kind: 'info' }],
            else: [{ jobPerformance: -10 }, { stat: 'happiness', delta: -6 }, { log: 'I was blamed for it anyway. I was innocent. The write-up did not care.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wk_drug_test',
    category: 'work',
    title: 'Random drug test',
    text: '{{company}} announced random drug testing, effective immediately, starting with my department. A nurse with a clipboard was already setting up in the small meeting room.',
    minAge: 18,
    maxAge: 70,
    weight: 0.6,
    cooldown: 3,
    conditions: [{ hasJob: true }, { partTime: false }],
    choices: [
      {
        id: 'take_clean',
        label: 'Take the test',
        conditions: [{ noAddiction: 'drugs' }],
        effects: [{ stat: 'happiness', delta: 1 }, { jobPerformance: 1 }, { log: 'Clean. The nurse looked almost disappointed.', kind: 'info' }],
      },
      {
        id: 'take_risky',
        label: 'Take the test',
        conditions: [{ addiction: 'drugs' }],
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'Somehow I passed. I took it as a warning, briefly.', kind: 'info' }],
            else: [{ loseJob: true, reason: 'fired' }, { stat: 'happiness', delta: -8 }, { log: 'The test came back positive. I was fired on the spot.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'delay',
        label: 'Ask for a delay',
        conditions: [{ addiction: 'drugs' }],
        effects: [
          {
            chance: 0.5,
            then: [{ addiction: 'drugs', delta: -3 }, { log: 'I got a week, and spent it sweating. Then I passed.', kind: 'info' }],
            else: [{ jobPerformance: -5 }, { stat: 'happiness', delta: -5 }, { log: 'No delays. I failed and got a final warning instead of a pink slip.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse on principle',
        effects: [
          { karma: 1 },
          {
            chance: 0.5,
            then: [{ jobPerformance: -8 }, { log: 'Refusal was noted as a "concern." My file is getting thick.', kind: 'bad' }],
            else: [{ loseJob: true, reason: 'fired' }, { log: 'Refusal was treated as a failure. I was let go.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wk_burnout',
    category: 'work',
    title: 'Running on empty',
    text: 'I have been waking up tired, working tired, and going home tired. Work at {{company}} used to feel like a job. Now it feels like weather. Something has to change.',
    minAge: 22,
    maxAge: 70,
    weight: 0.8,
    cooldown: 5,
    conditions: [{ hasJob: true }, { partTime: false }, { any: [{ stat: 'happiness', lte: 50 }, { stat: 'health', lte: 55 }] }],
    choices: [
      {
        id: 'leave',
        label: 'Take unpaid leave',
        effects: [{ money: -1500 }, { stat: 'health', delta: 8 }, { stat: 'happiness', delta: 8 }, { jobPerformance: -3 }, { log: 'I took a month off. Slept. Walked. Remembered what my kitchen looked like in daylight.', kind: 'good' }],
      },
      {
        id: 'push',
        label: 'Push through',
        effects: [
          { jobPerformance: 3 },
          { stat: 'health', delta: -5 },
          { stat: 'happiness', delta: -4 },
          {
            chance: 0.7,
            then: [{ log: 'I pushed through. Nothing broke, apparently.', kind: 'info' }],
            else: [{ illness: 'anxiety' }, { log: 'I pushed through until my body pushed back. The doctor called it anxiety and gave me a pamphlet.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'talk',
        label: 'Talk to my manager',
        effects: [
          {
            chance: 0.55,
            then: [{ jobPerformance: 2 }, { stat: 'happiness', delta: 5 }, { stat: 'health', delta: 3 }, { log: 'My manager moved some deadlines and told me to go home at five. It helped.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'My manager said everyone is tired. That was the whole meeting.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'quit',
        label: 'Quit',
        effects: [{ loseJob: true, reason: 'left' }, { stat: 'happiness', delta: 6 }, { stat: 'health', delta: 3 }, { log: 'I quit. The relief lasted exactly until the rent reminder.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'wk_night_shift',
    category: 'work',
    title: 'Night shift',
    text: '{{company}} is short on the night shift and offered me a permanent move: more money, fewer people, and a body clock that would never forgive me.',
    minAge: 18,
    maxAge: 60,
    weight: 0.8,
    cooldown: 5,
    conditions: [{ hasJob: true }, { partTime: false }, { jobCategory: ['service', 'trade', 'public', 'health', 'tech'] }],
    choices: [
      {
        id: 'take',
        label: 'Take the night shift',
        effects: [{ money: 3000 }, { jobPerformance: 3 }, { stat: 'health', delta: -5 }, { stat: 'happiness', delta: -3 }, { relationship: 'spouse', delta: -4 }, { log: 'I moved to nights. The pay is better. The sunlight is theoretical.', kind: 'money' }],
      },
      {
        id: 'decline',
        label: 'Stay on days',
        effects: [{ jobPerformance: -1 }, { log: 'I stayed on days. Someone else took the money and the eye bags.', kind: 'info' }],
      },
      {
        id: 'trial',
        label: 'Try it for a month',
        effects: [
          {
            chance: 0.5,
            then: [{ money: 1000 }, { stat: 'health', delta: -2 }, { log: 'A month of nights was enough. I came back to days with a bonus and a new respect for owls.', kind: 'info' }],
            else: [{ money: 800 }, { stat: 'health', delta: -4 }, { stat: 'happiness', delta: -4 }, { log: 'The trial month became three. I am still "temporarily" on nights.', kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ───────────────────────────────── company culture ─────────────────────────────────
  {
    id: 'wk_office_party',
    category: 'work',
    title: 'The holiday party',
    text: '{{company}} threw its annual party. There was a gift swap, a speech nobody listened to, and an open bar that several coworkers treated as a dare.',
    minAge: 18,
    maxAge: 70,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ hasJob: true }],
    choices: [
      {
        id: 'mingle',
        label: 'Work the room',
        effects: [
          { relationship: 'coworker', delta: 5 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.3,
            then: [{ jobPerformance: 3 }, { log: 'I made a good impression on a director who remembered my name a week later.', kind: 'good' }],
            else: [{ log: 'I made small talk until my face hurt. Pleasant enough.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'drink',
        label: 'Hit the open bar',
        effects: [
          { addiction: 'alcohol', delta: 3 },
          {
            random: [
              { weight: 5, effects: [{ stat: 'happiness', delta: 5 }, { log: 'I had a great time and only regret the dancing.', kind: 'good' }] },
              { weight: 3, effects: [{ stat: 'happiness', delta: -4 }, { jobPerformance: -5 }, { log: 'I told my boss what I really think of the schedule. He remembered. I did not.', kind: 'bad' }] },
              { weight: 2, effects: [{ stat: 'health', delta: -3 }, { log: 'I woke up with a headache and a toaster from the gift swap. I do not remember swapping for it.', kind: 'info' }] },
            ],
          },
        ],
      },
      {
        id: 'early',
        label: 'Show face, leave early',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I stayed for the speech, grabbed a cookie, and was in bed by nine.', kind: 'info' }],
      },
      {
        id: 'skip',
        label: 'Skip it',
        effects: [{ relationship: 'coworker', delta: -2 }, { stat: 'happiness', delta: 2 }, { log: 'I skipped it. Monday was full of stories I was not in.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'wk_company_retreat',
    category: 'work',
    title: 'The retreat',
    text: '{{company}} sent us on a two-day retreat with trust falls, a ropes course, and a facilitator who kept saying "synergy" like it was a person he knew.',
    minAge: 20,
    maxAge: 70,
    weight: 0.8,
    cooldown: 5,
    conditions: [{ hasJob: true }, { partTime: false }],
    choices: [
      {
        id: 'allin',
        label: 'Go all in',
        effects: [
          { relationship: 'coworker', delta: 6 },
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.25,
            then: [{ jobPerformance: 5 }, { log: 'My enthusiasm got noticed. I am now, apparently, "leadership material."', kind: 'good' }],
            else: [{ log: 'I fell backward into the arms of accounting. We are closer now.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'ropes',
        label: 'Attempt the ropes course',
        effects: [
          {
            chance: 0.75,
            then: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: 5 }, { log: 'I conquered the ropes course and felt invincible until dinner.', kind: 'good' }],
            else: [{ injury: 5 }, { log: 'I slipped on the ropes course. The facilitator said it was a metaphor. My ankle disagreed.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'hide',
        label: 'Hide in the cabin',
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'coworker', delta: -3 }, { log: 'I read a book by the lake while the others built a raft. The raft sank.', kind: 'info' }],
      },
      {
        id: 'sick',
        label: 'Call in sick',
        effects: [{ karma: -2 }, { jobPerformance: -3 }, { stat: 'happiness', delta: 3 }, { log: 'I invented a cold and spent two days at home. Worth it.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'wk_coffee_rota',
    category: 'work',
    title: 'The coffee schedule',
    text: 'A laminated coffee schedule appeared in the kitchen at {{company}} with my name on it twice. Nobody admits to making it. Someone has already laminated a rebuttal.',
    minAge: 18,
    maxAge: 70,
    weight: 1,
    cooldown: 3,
    conditions: [{ hasJob: true }, { jobCategory: ['office', 'tech', 'finance', 'law', 'education', 'science', 'creative'] }],
    choices: [
      {
        id: 'comply',
        label: 'Make the coffee',
        effects: [{ relationship: 'coworker', delta: 4 }, { karma: 1 }, { stat: 'happiness', delta: 1 }, { log: 'I made the coffee. It was fine. The schedule gained a gold star next to my name.', kind: 'good' }],
      },
      {
        id: 'rebel',
        label: 'Tear it down',
        effects: [
          { relationship: 'coworker', delta: -3 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.6,
            then: [{ log: 'The schedule disappeared and so did the issue. Office legend says it was me.', kind: 'info' }],
            else: [{ jobPerformance: -2 }, { log: 'The schedule maker was my manager. We have a new schedule. I am on it three times.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'better',
        label: 'Buy a real coffee machine',
        effects: [{ money: -300 }, { relationship: 'coworker', delta: 8 }, { stat: 'happiness', delta: 3 }, { log: 'I bought a real espresso machine for the kitchen. I am now beloved and slightly poorer.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'wk_union_drive',
    category: 'work',
    title: 'The union drive',
    text: 'A few coworkers have been quietly handing out union cards in the break room. Management has started holding "informal chats" about how we are all one big family.',
    minAge: 18,
    maxAge: 65,
    weight: 0.6,
    once: true,
    conditions: [{ hasJob: true }, { partTime: false }],
    choices: [
      {
        id: 'sign',
        label: 'Sign the card',
        effects: [{ flag: 'wk_union_signed', set: true }, { karma: 2 }, { queue: 'wk_union_vote' }, { log: 'I signed. My hands were not entirely steady.', kind: 'info' }],
      },
      {
        id: 'organise',
        label: 'Help organize',
        effects: [{ flag: 'wk_union_organiser', set: true }, { karma: 4 }, { relationship: 'coworker', delta: 6 }, { jobPerformance: -4 }, { queue: 'wk_union_vote' }, { log: 'I started passing out cards myself. Management now knows my name for a new reason.', kind: 'info' }],
      },
      {
        id: 'out',
        label: 'Stay out of it',
        effects: [{ queue: 'wk_union_vote' }, { log: 'I kept my head down and my card unsigned.', kind: 'info' }],
      },
      {
        id: 'tell',
        label: 'Tell management',
        effects: [{ flag: 'wk_union_told', set: true }, { karma: -8 }, { jobPerformance: 6 }, { relationship: 'coworker', delta: -15 }, { queue: 'wk_union_vote' }, { log: 'I told my manager who was organizing. She thanked me. The break room went silent when I walked in.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'wk_union_vote',
    category: 'work',
    title: 'The vote',
    text: 'The union vote came and went. Ballots were counted in a back office while we pretended to work. Then the result was pinned to the bulletin board.',
    minAge: 18,
    maxAge: 70,
    weight: 1,
    followUpOnly: true,
    conditions: [{ hasJob: true }],
    choices: [
      {
        id: 'board',
        label: 'Check the bulletin board',
        effects: [
          {
            chance: 0.5,
            then: [{ money: 1500 }, { stat: 'happiness', delta: 4 }, { log: 'The union won. A year later: a contract, a raise, and a boss who says "per the agreement" a lot.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The union lost by a handful of votes. Management put a cake in the break room. Nobody ate it.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'organisers',
        label: 'Wait with the organizers',
        conditions: [{ flag: 'wk_union_organiser', eq: true }],
        effects: [
          {
            chance: 0.5,
            then: [{ money: 1500 }, { stat: 'happiness', delta: 6 }, { fame: 1 }, { log: 'The union won, and they could not touch me. I got the raise and a target on my back.', kind: 'good' }],
            else: [
              {
                chance: 0.6,
                then: [{ jobPerformance: -10 }, { log: 'The union lost. My next review mysteriously found "attitude problems."', kind: 'bad' }],
                else: [{ loseJob: true, reason: 'fired' }, { stat: 'happiness', delta: -8 }, { log: 'The union lost and three organizers were let go "for restructuring." I was one of them.', kind: 'bad' }],
              },
            ],
          },
        ],
      },
      {
        id: 'snitch',
        label: 'Keep a low profile',
        conditions: [{ flag: 'wk_union_told', eq: true }],
        effects: [
          {
            chance: 0.5,
            then: [{ money: 200 }, { jobPerformance: 3 }, { log: 'The union lost. My manager gave me a gift card and a slightly better shift.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -5 }, { relationship: 'coworker', delta: -5 }, { log: 'The union won anyway. Someone wrote my name on the break-room whiteboard with no comment.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wk_layoff_rumour',
    category: 'work',
    title: 'Layoff rumors',
    text: 'There is a rumor going around {{company}} that layoffs are coming. Someone saw a spreadsheet. Someone else saw consultants. Nobody has seen a memo.',
    minAge: 20,
    maxAge: 70,
    weight: 1,
    cooldown: 8,
    conditions: [{ hasJob: true }, { partTime: false }],
    choices: [
      {
        id: 'resume',
        label: 'Quietly update my résumé',
        effects: [{ flag: 'wk_resume_ready', set: true }, { stat: 'happiness', delta: -2 }, { queue: 'wk_layoff_news' }, { log: 'I updated my résumé and told nobody. The spreadsheet, if it exists, can do its worst.', kind: 'info' }],
      },
      {
        id: 'harder',
        label: 'Work visibly harder',
        effects: [{ jobPerformance: 6 }, { stat: 'health', delta: -2 }, { queue: 'wk_layoff_news' }, { log: 'I came in early and left late and made sure the right people saw both.', kind: 'info' }],
      },
      {
        id: 'ask',
        label: 'Ask the boss directly',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'My boss said my role was safe. She looked tired when she said it.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'My boss said she could not discuss it. That was an answer.', kind: 'bad' }],
          },
          { queue: 'wk_layoff_news' },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore the rumors',
        effects: [{ stat: 'happiness', delta: 1 }, { queue: 'wk_layoff_news' }, { log: 'Rumors are rumors. I kept doing my job.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'wk_layoff_news',
    category: 'work',
    title: 'The memo',
    text: 'The memo finally arrived: {{company}} is laying people off. Meetings were booked in fifteen-minute slots, and everyone watched the calendar like it was a weather radar.',
    minAge: 20,
    maxAge: 70,
    weight: 1,
    followUpOnly: true,
    conditions: [{ hasJob: true }],
    choices: [
      {
        id: 'wait',
        label: 'Wait for my slot',
        effects: [
          {
            random: [
              { weight: 6, effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'coworker', delta: 3 }, { log: 'My name was not on the list. I went to lunch with the other survivors and felt guilty and relieved.', kind: 'good' }] },
              { weight: 4, effects: [{ loseJob: true, reason: 'left' }, { money: 2500 }, { stat: 'happiness', delta: -10 }, { log: 'My slot came. I was laid off with a severance check and a cardboard box.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'lined',
        label: 'Lean on my polished résumé',
        conditions: [{ flag: 'wk_resume_ready', eq: true }],
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'My name was not on the list, and I now have a résumé that sparkles. Win-win.', kind: 'good' }],
            else: [{ loseJob: true, reason: 'left' }, { money: 3000 }, { stat: 'happiness', delta: -4 }, { log: 'I was laid off, but my résumé was already out there. Severance plus a head start.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'volunteer',
        label: 'Volunteer for the package',
        effects: [{ loseJob: true, reason: 'left' }, { money: 6000 }, { stat: 'happiness', delta: 2 }, { log: 'I volunteered for the buyout. Bigger package, cleaner exit, and a summer off.', kind: 'money' }],
      },
    ],
  },

  // ───────────────────────────────── career moves ─────────────────────────────────
  {
    id: 'wk_promotion_relocation',
    category: 'work',
    title: 'Promotion, with a catch',
    text: '{{company}} offered me a promotion. The catch: the role is in another city, starting next month. The pay bump is real. So is the distance from everyone I know.',
    minAge: 24,
    maxAge: 58,
    weight: 0.6,
    once: true,
    conditions: [{ hasJob: true }, { partTime: false }],
    choices: [
      {
        id: 'take',
        label: 'Take it and move',
        effects: [
          { money: 8000 },
          { jobPerformance: 10 },
          { counter: 'promotions' },
          { stat: 'happiness', delta: 4 },
          { relationship: 'spouse', delta: -8 },
          { relationship: 'child', delta: -6 },
          { relationship: 'friend', delta: -8 },
          { relationship: 'bestFriend', delta: -6 },
          { relationship: 'mother', delta: -3 },
          { relationship: 'father', delta: -3 },
          { log: 'I took the promotion and the moving van. New title, new apartment, a lot of video calls.', kind: 'milestone' },
        ],
      },
      {
        id: 'decline',
        label: 'Decline, stay put',
        effects: [{ jobPerformance: -3 }, { stat: 'happiness', delta: -3 }, { karma: 1 }, { relationship: 'spouse', delta: 3 }, { log: 'I turned it down. The one who took it sends photos of her office view. I have my people.', kind: 'info' }],
      },
      {
        id: 'remote',
        label: 'Ask to do it remotely',
        effects: [
          {
            chance: 0.35,
            then: [{ money: 3000 }, { jobPerformance: 8 }, { counter: 'promotions' }, { stat: 'happiness', delta: 6 }, { log: 'They said yes. I got the title, the raise, and my own kitchen.', kind: 'good' }],
            else: [{ jobPerformance: -2 }, { stat: 'happiness', delta: -2 }, { log: 'They said the role had to be in person. It went to someone else.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wk_counter_offer',
    category: 'work',
    title: 'The rival offer',
    text: 'A competitor of {{company}} called me out of the blue. They have been watching my work and want to make an offer. They mentioned a signing bonus. They mentioned it twice.',
    minAge: 22,
    maxAge: 62,
    weight: 0.7,
    cooldown: 8,
    conditions: [{ hasJob: true }, { partTime: false }],
    choices: [
      {
        id: 'take',
        label: 'Take the rival offer',
        effects: [
          { loseJob: true, reason: 'left' },
          { flag: 'wk_jumped_ship', set: true },
          {
            chance: 0.8,
            then: [{ money: 5000 }, { stat: 'happiness', delta: 4 }, { log: 'I gave notice and banked the signing bonus. Now I just need to start somewhere new.', kind: 'money' }],
            else: [{ money: 1500 }, { stat: 'happiness', delta: -5 }, { log: 'The rival "restructured" before my start date. I had already quit. A small bonus, no desk.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'leverage',
        label: 'Use it as leverage',
        effects: [
          {
            chance: 0.5,
            then: [{ money: 3000 }, { jobPerformance: 5 }, { stat: 'happiness', delta: 5 }, { log: 'My boss matched it with a retention bonus. It pays to be wanted.', kind: 'money' }],
            else: [{ jobPerformance: -8 }, { stat: 'happiness', delta: -3 }, { log: 'My boss said, "Take it, then." I did not. Now we both know I bluffed.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'stay',
        label: 'Stay loyal',
        effects: [{ stat: 'happiness', delta: 2 }, { karma: 1 }, { relationship: 'coworker', delta: 3 }, { log: 'I said no. The recruiter sounded surprised. My team did not need to know.', kind: 'info' }],
      },
    ],
  },

  // ───────────────────────────────── job-specific ─────────────────────────────────
  {
    id: 'wk_safety_shortcut',
    category: 'work',
    title: 'The shortcut',
    text: 'The job needs doing up high. The safe way takes an hour, a proper ladder and a spotter. The quick way takes ten minutes, a stack of crates and a little faith. My supervisor is watching the clock.',
    minAge: 16,
    maxAge: 70,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ hasJob: true }, { jobCategory: ['trade', 'service', 'public', 'sports', 'science'] }],
    choices: [
      {
        id: 'quick',
        label: 'Do it the quick way',
        effects: [
          { jobPerformance: 4 },
          {
            chance: 0.75,
            then: [{ log: 'Ten minutes, done, no harm. My supervisor nodded.', kind: 'info' }],
            else: [{ injury: 12 }, { stat: 'happiness', delta: -5 }, { log: 'I fell. Not far, but far enough. Three weeks of pain for ten minutes saved.', kind: 'bad' }, { chance: 0.8, then: [], else: [{ illness: 'back_pain' }] }],
          },
        ],
      },
      {
        id: 'safe',
        label: 'Do it by the book',
        effects: [{ jobPerformance: -2 }, { karma: 1 }, { stat: 'health', delta: 1 }, { log: 'An hour, a ladder and a spotter later, it was done. My supervisor sighed. My spine thanked me.', kind: 'good' }],
      },
      {
        id: 'report',
        label: 'Report the pressure',
        effects: [
          { karma: 3 },
          {
            chance: 0.5,
            then: [{ jobPerformance: 3 }, { log: 'The safety officer agreed with me. The supervisor got a talk, and the crates got thrown out.', kind: 'good' }],
            else: [{ jobPerformance: -6 }, { relationship: 'coworker', delta: -3 }, { log: 'Nothing changed, except now I am the person who reports things.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wk_tech_outage',
    category: 'work',
    title: 'Everything is down',
    text: 'At two in the morning my phone lit up: the system {{company}} runs on had crashed, and the group chat was eleven people typing "who deployed?"',
    minAge: 18,
    maxAge: 70,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ hasJob: true }, { jobCategory: ['tech'] }],
    choices: [
      {
        id: 'fix',
        label: 'Get up and fix it',
        effects: [
          { stat: 'health', delta: -2 },
          {
            chance: 0.65,
            then: [{ jobPerformance: 8 }, { stat: 'happiness', delta: 3 }, { money: 300 }, { log: 'I found the bad config at 3:40 a.m. The chat sent a lot of heart emojis.', kind: 'good' }],
            else: [{ jobPerformance: 2 }, { stat: 'health', delta: -3 }, { log: 'I was up until dawn and it was not even my fault. Someone else found it.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'sleep',
        label: 'Sleep through it',
        effects: [{ stat: 'happiness', delta: 2 }, { jobPerformance: -5 }, { log: 'Phone face down, back to sleep. By morning it was fixed. My name came up twice, neither time kindly.', kind: 'bad' }],
      },
      {
        id: 'blame',
        label: 'Ask who deployed',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'coworker', delta: -4 }, { karma: -2 }, { log: 'It was the new guy. I said so. He has not spoken to me since.', kind: 'info' }],
            else: [{ jobPerformance: -3 }, { stat: 'happiness', delta: -4 }, { log: 'It was me. I had deployed on Friday. I went very quiet in the chat.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wk_patient_gift',
    category: 'work',
    title: 'A grateful family',
    text: 'The family of someone I looked after came back with an envelope and said they wanted to thank me properly. Inside was {{$500}}. The policy on gifts is one line long: no.',
    minAge: 18,
    maxAge: 70,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ hasJob: true }, { jobCategory: ['health'] }],
    choices: [
      {
        id: 'accept',
        label: 'Accept it quietly',
        effects: [
          { money: 500 },
          { karma: -2 },
          {
            chance: 0.8,
            then: [{ log: 'I accepted. They cried, I nearly did, and nobody mentioned the policy.', kind: 'money' }],
            else: [{ jobPerformance: -10 }, { log: 'A colleague saw the envelope. I was reported and given a formal warning.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Decline, suggest a donation',
        effects: [{ karma: 3 }, { stat: 'happiness', delta: 4 }, { jobPerformance: 3 }, { log: 'They donated it to the ward instead. The new chairs are, in a sense, mine.', kind: 'good' }],
      },
      {
        id: 'card',
        label: 'Take only the card',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: 3 }, { log: 'I kept the card and gave back the money. The card is on my fridge.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'wk_hero_call',
    category: 'work',
    title: 'The call',
    text: 'Driving home from a shift, I came across a crash: a car on fire with someone still inside. Help was minutes away. The smoke was not waiting for anyone.',
    minAge: 18,
    maxAge: 60,
    weight: 0.8,
    cooldown: 4,
    conditions: [{ hasJob: true }, { jobCategory: ['public'] }],
    choices: [
      {
        id: 'go',
        label: 'Go in',
        effects: [
          {
            chance: 0.95,
            then: [
              {
                random: [
                  { weight: 6, effects: [{ injury: 4 }, { fame: 4 }, { karma: 6 }, { stat: 'happiness', delta: 8 }, { log: 'I got them out. There was a photo in the paper and a burn on my forearm I will not explain twice.', kind: 'milestone' }] },
                  { weight: 4, effects: [{ injury: 12 }, { karma: 4 }, { stat: 'happiness', delta: 3 }, { log: 'I got them out, barely. Three weeks of recovery and a commendation I could not hold properly.', kind: 'bad' }] },
                ],
              },
            ],
            else: [{ death: 'died pulling a stranger from a burning car' }],
          },
        ],
      },
      {
        id: 'outside',
        label: 'Help from outside',
        effects: [
          { injury: 2 },
          { karma: 3 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I broke the window and kept them talking until the crew got there. Enough.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'I kept them talking. It was not enough. I went home and sat in the car for an hour.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'wait',
        label: 'Wait for help',
        effects: [
          { karma: -1 },
          { stat: 'happiness', delta: -5 },
          {
            chance: 0.6,
            then: [{ log: 'Help arrived in time. The driver made it. I still see the smoke.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -8 }, { log: 'Help arrived too late. I did everything by the book. The book does not help at night.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wk_trade_cash_job',
    category: 'work',
    title: 'Under the table',
    text: 'A customer asked if I would come back on Saturday and do the same job privately: cash only, no company, no paperwork. {{company}} has a rule about that. So does the government.',
    minAge: 18,
    maxAge: 70,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ hasJob: true }, { jobCategory: ['trade'] }],
    choices: [
      {
        id: 'take',
        label: 'Take the cash job',
        effects: [
          { money: 600 },
          { karma: -2 },
          {
            chance: 0.8,
            then: [{ log: 'Saturday, done, paid in cash. Nobody asked.', kind: 'money' }],
            else: [{ jobPerformance: -10 }, { log: 'Word got back to work. My boss called it "moonlighting with my clients." I kept the job, barely.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Decline',
        effects: [{ karma: 1 }, { jobPerformance: 1 }, { log: 'I said no and gave them the office number. The office took a cut, as offices do.', kind: 'info' }],
      },
      {
        id: 'refer',
        label: 'Refer a buddy',
        effects: [{ karma: 2 }, { relationship: 'friend', delta: 4 }, { money: 50 }, { log: 'I passed it to a buddy who needed it. He bought me lunch. The lunch was my cut.', kind: 'good' }],
      },
    ],
  },
];

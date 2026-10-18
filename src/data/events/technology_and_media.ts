import type { EventDef } from '@/engine/events/schema';

/**
 * Ages 10+: phones, apps and life online. Going viral by accident, group chat
 * civil wars, phishing texts, a smart speaker with opinions about rice, data
 * breaches, catfish, streamer "emergencies", reply-all disasters, deepfakes,
 * lost phones, and the people on the other side of the screen. No brand names.
 * Follow-ups (followUpOnly) are queued by the events that set them up.
 *
 * Pronoun placeholders render as he/she, so lines that use {{they}} / {{They}}
 * stick to past-tense or modal verbs ("{{They}} made", "{{they}} refused").
 */
export const TECHNOLOGY_AND_MEDIA_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ going viral
  {
    id: 'tm_viral_post',
    category: 'random',
    title: 'Accidentally viral',
    text: 'Someone filmed me slipping on a wet step in {{city}} and recovering with a deep, dignified bow. Two million views overnight. Strangers are now bowing at me in the supermarket.',
    minAge: 13,
    maxAge: 70,
    weight: 1,
    once: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'lean',
        label: 'Lean into it',
        effects: [
          { fame: 8 },
          { energy: -1 },
          {
            chance: 0.6,
            then: [{ log: 'I posted a follow-up bow. Then a bow tutorial. For one glorious month I was the Bow of {{city}}.', kind: 'good' }, { stat: 'happiness', delta: 6 }, { fame: 4 }],
            else: [{ log: 'The internet moved on in four days. I had already ordered business cards.', kind: 'bad' }, { stat: 'happiness', delta: -3 }, { money: -60 }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore it',
        effects: [{ fame: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I let it pass. By spring nobody remembered, including me. The step, however, is still slippery.' }],
      },
      {
        id: 'takedown',
        label: 'Ask for a takedown',
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'The poster took it down and apologized. The bow now lives only in memory, where it was even better.', kind: 'good' }, { stat: 'happiness', delta: 3 }],
            else: [{ log: 'Asking made it worse. There is now a remix with a brass section.', kind: 'bad' }, { fame: 5 }, { stat: 'happiness', delta: -5 }],
          },
        ],
      },
    ],
  },
  {
    id: 'tm_deepfake_rumour',
    category: 'random',
    title: "That isn't me",
    text: 'A video is going around in which I appear to say something awful about {{city}}. I never said it. The mouth is slightly wrong and one hand has six fingers, but millions have shared it.',
    minAge: 16,
    maxAge: 90,
    weight: 1,
    cooldown: 5,
    conditions: [{ fame: { gte: 15 } }, { inPrison: false }],
    choices: [
      {
        id: 'statement',
        label: 'Post a calm statement',
        effects: [
          {
            chance: 0.6,
            then: [{ log: 'The statement spread nearly as far as the fake. Most people believed me. The six fingers helped.', kind: 'good' }, { fame: 3 }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'The denial got a tenth of the views. Some people will always believe the first version they saw.', kind: 'bad' }, { fame: -6 }, { stat: 'happiness', delta: -6 }],
          },
        ],
      },
      {
        id: 'lawyer',
        label: 'Hire a lawyer',
        hint: '{{$8000}}',
        conditions: [{ money: { gte: 8000 } }],
        effects: [
          { money: -8000 },
          {
            chance: 0.55,
            then: [{ log: 'The platform removed it and the creator issued a retraction. Expensive, but clean.', kind: 'good' }, { fame: 2 }, { stat: 'happiness', delta: 4 }, { karma: 1 }],
            else: [{ log: 'The creator was in another country and the platform shrugged. The bill, at least, was real.', kind: 'bad' }, { stat: 'happiness', delta: -5 }],
          },
        ],
      },
      {
        id: 'silence',
        label: 'Say nothing',
        effects: [
          {
            chance: 0.4,
            then: [{ log: 'I said nothing. It burned out in a week, as these things sometimes do.' }, { stat: 'happiness', delta: -1 }],
            else: [{ log: 'Silence looked like guilt. Invitations dried up for a season and nobody said why.', kind: 'bad' }, { fame: -10 }, { stat: 'happiness', delta: -6 }],
          },
        ],
      },
    ],
  },
  {
    id: 'tm_free_products',
    category: 'random',
    title: 'Free stuff, one catch',
    text: 'A company that makes foot cream has offered to send me free products in exchange for a glowing post. I have never had a problem with my feet. They are offering quite a lot of cream.',
    minAge: 16,
    maxAge: 60,
    weight: 1,
    cooldown: 5,
    conditions: [{ any: [{ fame: { gte: 5 } }, { stat: 'looks', gte: 65 }] }, { inPrison: false }],
    choices: [
      {
        id: 'honest',
        label: 'Post an honest review',
        effects: [
          { karma: 2 },
          { fame: 2 },
          {
            chance: 0.5,
            then: [{ log: 'I called it "fine." People trusted that more than "life-changing." The company sent more cream.', kind: 'good' }, { stat: 'happiness', delta: 3 }],
            else: [{ log: 'The company was wounded by "fine" and dropped me. I have enough cream for a decade.' }, { stat: 'happiness', delta: 1 }],
          },
        ],
      },
      {
        id: 'gush',
        label: 'Gush for the money',
        hint: '+{{$400}}',
        effects: [
          { money: 400 },
          { karma: -3 },
          { fame: 3 },
          {
            chance: 0.3,
            then: [{ log: 'Followers noticed I had never once mentioned feet before. The comments were merciless.', kind: 'bad' }, { fame: -5 }, { stat: 'happiness', delta: -3 }],
            else: [{ log: 'I earned {{$400}} for pretending to love foot cream. Commerce is strange and I am in it.', kind: 'money' }],
          },
        ],
      },
      { id: 'decline', label: 'Decline politely', effects: [{ stat: 'happiness', delta: 1 }, { log: 'I declined. I remain unsponsored and my feet remain unremarkable.' }] },
    ],
  },

  // ------------------------------------------------------------ friends, family, feeds
  {
    id: 'tm_group_chat_drama',
    category: 'random',
    title: 'Group chat meltdown',
    text: 'Our group chat has split into two factions over a plan {{person}} made without asking anyone. Forty messages in ten minutes. Someone has deployed a crying emoji as a weapon.',
    minAge: 11,
    maxAge: 35,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'side',
        label: 'Back {{person}}',
        effects: [
          { relationship: 'person', delta: 6 },
          {
            chance: 0.5,
            then: [{ log: '{{person}} was grateful and the others came around by the weekend.', kind: 'good' }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'Taking sides cost me the rest of the chat for a month. {{person}} and I had a very quiet corner.', kind: 'bad' }, { stat: 'happiness', delta: -4 }],
          },
        ],
      },
      {
        id: 'peace',
        label: 'Play peacemaker',
        effects: [
          { karma: 2 },
          { energy: -1 },
          {
            chance: 0.6,
            then: [{ log: 'I proposed a compromise and the chat calmed down. For one evening I was a diplomat.', kind: 'good' }, { stat: 'happiness', delta: 4 }, { relationship: 'person', delta: 2 }],
            else: [{ log: 'Both sides turned on me. The peacemaker always gets it.', kind: 'bad' }, { stat: 'happiness', delta: -3 }, { relationship: 'person', delta: -2 }],
          },
        ],
      },
      {
        id: 'mute',
        label: 'Mute the chat',
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -3 }, { log: 'I muted it and had the quietest evening of the year. I also missed one birthday plan entirely.' }],
      },
    ],
  },
  {
    id: 'tm_sibling_video',
    category: 'random',
    title: 'Childhood footage',
    text: '{{person}} dug out a video of me at age six, performing an original song about soup, and posted it to the whole family and most of {{their}} followers. The soup song has verses.',
    minAge: 12,
    maxAge: 50,
    weight: 1.2,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    person: { kind: ['sibling'], minAge: 13 },
    choices: [
      {
        id: 'embrace',
        label: 'Embrace the soup song',
        effects: [
          { relationship: 'person', delta: 3 },
          {
            chance: 0.7,
            then: [{ log: 'I reposted it with the lyrics as captions. The soup song now has a fanbase of eleven people.', kind: 'good' }, { stat: 'happiness', delta: 5 }, { fame: 1 }],
            else: [{ log: 'I reposted it. By Monday someone was singing the soup song at me across a hallway. Every morning.', kind: 'bad' }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'remove',
        label: 'Demand it come down',
        effects: [
          { relationship: 'person', delta: -3 },
          {
            chance: 0.6,
            then: [{ log: '{{person}} took it down, grumbling that art should be free.' }, { stat: 'happiness', delta: 3 }],
            else: [{ log: '{{person}} refused on principle. The principle is comedy.', kind: 'bad' }, { stat: 'happiness', delta: -4 }, { relationship: 'person', delta: -2 }],
          },
        ],
      },
      {
        id: 'revenge',
        label: 'Post one of {{them}}',
        effects: [{ karma: -2 }, { stat: 'happiness', delta: 5 }, { relationship: 'person', delta: -6 }, { log: 'I posted the video of {{person}} crying at a parade clown. We are at war, and the war is popular.' }],
      },
    ],
  },
  {
    id: 'tm_ex_post',
    category: 'random',
    title: 'The algorithm knows',
    text: 'My feed showed me {{person}}\'s engagement post at 1am. Three hundred likes, a ring the size of a grape, and the caption "finally found the one." The algorithm is cruel.',
    minAge: 18,
    maxAge: 70,
    weight: 1.2,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    person: { kind: ['ex'], minAge: 20 },
    choices: [
      {
        id: 'like',
        label: 'Like the post',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: -2 }, { relationship: 'person', delta: 4 }, { log: 'I liked it. One small, adult click. {{person}} sent a heart back. We are fine, apparently.' }],
      },
      {
        id: 'block',
        label: 'Block {{them}}',
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -8 }, { log: 'I blocked {{person}}. The feed went back to showing me fridge organization. Peace.' }],
      },
      {
        id: 'scroll',
        label: 'Scroll {{their}} whole profile',
        effects: [{ stat: 'happiness', delta: -6 }, { stat: 'health', delta: -1 }, { log: "I went four years deep into {{person}}'s photos. I learned nothing new and slept at four.", kind: 'bad' }],
      },
    ],
  },
  {
    id: 'tm_partner_phone',
    category: 'random',
    title: 'Phone at the table',
    text: '{{person}} put down {{their}} fork and said I had been scrolling through the entire dinner. I had. There was a very good thread about a raccoon.',
    minAge: 18,
    maxAge: 80,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['lover', 'spouse'] },
    choices: [
      {
        id: 'basket',
        label: 'Propose a phone basket',
        effects: [{ love: 6 }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: -1 }, { log: 'Our phones go in a basket at dinner now. We talk. I miss the raccoon a little, but only a little.', kind: 'good' }],
      },
      {
        id: 'raccoon',
        label: 'Explain about the raccoon',
        effects: [
          {
            chance: 0.4,
            then: [{ log: '{{person}} looked at the raccoon. {{They}} agreed it was a good raccoon. Dinner continued.', kind: 'good' }, { stat: 'happiness', delta: 4 }, { love: 2 }],
            else: [{ log: '{{person}} did not want to see the raccoon. Dinner ended early and coldly.', kind: 'bad' }, { love: -6 }, { relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'dismiss',
        label: 'Call it an overreaction',
        effects: [{ love: -8 }, { relationship: 'person', delta: -6 }, { stat: 'happiness', delta: -2 }, { karma: -2 }, { log: 'That went badly. The raccoon thread, I now accept, was not worth it.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'tm_child_social',
    category: 'random',
    title: 'The account request',
    text: '{{person}} has asked for a social media account because "literally everyone" has one. {{They}} made a slideshow. Slide four is titled "Trust."',
    minAge: 24,
    maxAge: 65,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ hasChildren: true }, { inPrison: false }],
    person: { kind: ['child'], minAge: 8, maxAge: 15 },
    choices: [
      {
        id: 'yes',
        label: 'Say yes',
        effects: [
          { relationship: 'person', delta: 8 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.35,
            then: [{ log: 'Within a month there was a drama with a classmate and I was reading messages I did not understand.', kind: 'bad' }, { stat: 'happiness', delta: -4 }, { relationship: 'person', delta: -2 }],
            else: [{ log: '{{person}} mostly posts pictures of the dog. The slideshow was accurate.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'rules',
        label: 'Yes, with rules',
        effects: [{ relationship: 'person', delta: 4 }, { karma: 1 }, { stat: 'happiness', delta: 1 }, { log: "Private account, I follow {{them}}, no phone after nine. {{They}} accepted with a negotiator's sigh." }],
      },
      {
        id: 'no',
        label: 'Not yet',
        effects: [
          { relationship: 'person', delta: -6 },
          { karma: 1 },
          {
            chance: 0.5,
            then: [{ log: '{{person}} sulked for a week and then made an account anyway under a name I did not know.', kind: 'bad' }, { stat: 'happiness', delta: -3 }],
            else: [{ log: '{{person}} grumbled and went back to the dog. The slideshow was saved for next year.' }, { stat: 'happiness', delta: 2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'tm_parent_tech_help',
    category: 'random',
    title: 'The printer again',
    text: '{{person}} called because the phone "has gone small." Also the printer is blinking, the television wants a password, and someone sent {{them}} a photo that will not open. I am tech support now.',
    minAge: 25,
    maxAge: 65,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather'], minAge: 55 },
    choices: [
      {
        id: 'visit',
        label: 'Go over and fix it all',
        effects: [{ energy: -2 }, { karma: 3 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 2 }, { log: 'Two hours, four fixes, one cup of tea. {{person}} called me a genius. The phone had been zoomed in.', kind: 'good' }],
      },
      {
        id: 'remote',
        label: 'Talk {{them}} through it',
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'Forty minutes of "the blue one, no, the OTHER blue one" and it was fixed. {{person}} sounded proud.', kind: 'good' }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 1 }, { karma: 1 }],
            else: [{ log: '{{person}} pressed something and now the printer speaks another language. We are both tired.', kind: 'bad' }, { relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'link',
        label: 'Send a tutorial link',
        effects: [{ relationship: 'person', delta: -5 }, { stat: 'happiness', delta: 2 }, { log: 'I sent a link. {{person}} replied "thanks" three days later, then "how do I open links."' }],
      },
    ],
  },
  {
    id: 'tm_screen_time_intervention',
    category: 'random',
    title: 'Phone confiscated',
    text: '{{person}} saw my screen time report and went pale. Nine hours a day, mostly videos of people organizing fridges. {{They}} held out a hand and said the phone goes in a drawer until my grades improve.',
    minAge: 10,
    maxAge: 17,
    weight: 2,
    cooldown: 3,
    conditions: [{ enrolled: true }, { inPrison: false }],
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather'] },
    choices: [
      {
        id: 'handover',
        label: 'Hand it over',
        effects: [{ stat: 'happiness', delta: -5 }, { grade: 6 }, { relationship: 'person', delta: 4 }, { log: 'I handed over the phone. The first two days were agony. By week three I had read a book by accident.' }],
      },
      {
        id: 'negotiate',
        label: 'Negotiate a limit',
        effects: [
          {
            chance: 0.6,
            then: [{ log: 'We agreed on two hours a day and no phone at dinner. Everyone felt very mature.', kind: 'good' }, { grade: 3 }, { stat: 'happiness', delta: 1 }, { relationship: 'person', delta: 2 }],
            else: [{ log: '{{person}} was not in a negotiating mood. Phone gone.', kind: 'bad' }, { stat: 'happiness', delta: -4 }, { grade: 4 }],
          },
        ],
      },
      {
        id: 'sneak',
        label: 'Sneak it back at night',
        effects: [
          { karma: -3 },
          {
            chance: 0.5,
            then: [{ log: 'I took it from the kitchen drawer every night. My grades did not improve. Neither did my sleep.' }, { stat: 'happiness', delta: 2 }, { stat: 'health', delta: -2 }, { grade: -3 }],
            else: [{ log: '{{person}} caught me at 1am, lit by fridge videos. The phone now sleeps in {{their}} room.', kind: 'bad' }, { relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -6 }, { grade: 2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'tm_chain_message',
    category: 'random',
    title: 'Forward this or else',
    text: 'A message says that if I do not forward it to ten people by midnight, a ghost will visit and also my crush will find out. The ghost seems the lesser concern.',
    minAge: 10,
    maxAge: 16,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'forward',
        label: 'Forward it to ten people',
        effects: [
          { stat: 'happiness', delta: 2 },
          { karma: -1 },
          {
            chance: 0.3,
            then: [{ log: 'Three people forwarded it straight back to me. The chain has formed a loop. Nobody is safe.' }, { stat: 'happiness', delta: -1 }],
            else: [{ log: 'I forwarded it. Nothing happened, which the message would say proves it worked.' }],
          },
        ],
      },
      {
        id: 'delete',
        label: 'Delete it',
        effects: [{ stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: 1 }, { log: 'I deleted it. Midnight came and went. No ghost. My crush remains uninformed, by me or by spirits.' }],
      },
      {
        id: 'debunk',
        label: 'Reply with a fact-check',
        effects: [{ stat: 'smarts', delta: 3 }, { karma: 1 }, { stat: 'happiness', delta: -1 }, { log: 'I explained how chain messages work. The sender replied "ok nerd." I am, in fairness, a nerd.' }],
      },
    ],
  },

  // ------------------------------------------------------------ scams and security
  {
    id: 'tm_phishing_text',
    category: 'random',
    title: 'Suspicious text',
    text: 'A text says a package is waiting for me and I must pay a small redelivery fee at a link made of random letters. I have not ordered anything. The package sounds lovely, though.',
    minAge: 16,
    maxAge: 100,
    weight: 2,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'pay',
        label: 'Pay the fee',
        hint: '{{$3}}',
        effects: [
          { money: -3 },
          {
            chance: 0.6,
            then: [{ log: 'Within a week my card had bought three televisions in a country I have never visited.', kind: 'bad' }, { money: -900 }, { stat: 'happiness', delta: -5 }],
            else: [{ log: 'Nothing happened. No package either. I feel cheated twice.' }, { stat: 'happiness', delta: -1 }],
          },
        ],
      },
      {
        id: 'report',
        label: 'Report and delete',
        effects: [{ stat: 'smarts', delta: 1 }, { karma: 1 }, { log: "I reported the number. Somewhere, a scammer's spreadsheet lost a row.", kind: 'good' }],
      },
      {
        id: 'troll',
        label: 'Reply with nonsense',
        effects: [
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.3,
            then: [{ log: 'The scammer replied "ok" and stopped. I consider this a victory for the arts.', kind: 'good' }],
            else: [{ log: 'They kept texting for a month. Somehow I had started a correspondence.' }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'tm_data_breach',
    category: 'random',
    title: 'Data breach notice',
    text: 'An email says a service I signed up for years ago has been breached. My password, my address and apparently my favorite color are now on a forum somewhere.',
    minAge: 16,
    maxAge: 100,
    weight: 1.5,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'passwords',
        label: 'Change every password',
        effects: [{ energy: -1 }, { stat: 'smarts', delta: 2 }, { log: 'A weekend of new passwords and two-factor codes. I am now unbreakable and slightly unbearable.', kind: 'good' }],
      },
      {
        id: 'ignore',
        label: 'Ignore it',
        effects: [
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.3,
            then: [{ log: 'Months later, someone logged into my shopping account and sent themselves a gift basket on my card.', kind: 'bad' }, { money: -400 }, { stat: 'happiness', delta: -3 }],
            else: [{ log: 'Nothing happened. My favorite color remains a secret shared only with a forum.' }],
          },
        ],
      },
      {
        id: 'lawsuit',
        label: 'Join the class action',
        effects: [{ log: 'I filled out a form for the class action. The lawyers said to expect news in due course.' }, { queue: 'tm_data_breach_settlement' }],
      },
    ],
  },
  {
    id: 'tm_data_breach_settlement',
    category: 'random',
    title: 'Settlement check',
    text: 'The class action over the data breach has settled. My share arrived today in an envelope that cost more to mail than the check inside. Or so I assume, before opening it.',
    minAge: 16,
    maxAge: 100,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'cash',
        label: 'Cash it',
        effects: [
          {
            random: [
              { weight: 6, effects: [{ money: 12 }, { log: 'The settlement was {{$12}}. I framed the check instead of cashing it. Then I cashed it.', kind: 'money' }] },
              { weight: 3, effects: [{ money: 180 }, { log: 'The settlement came to {{$180}}. A modest reward for a modest leak.', kind: 'money' }, { stat: 'happiness', delta: 2 }] },
              { weight: 1, effects: [{ money: 2500 }, { log: 'Somehow my claim was approved at the top tier: {{$2500}}. The lawyers kept considerably more.', kind: 'money' }, { stat: 'happiness', delta: 5 }] },
            ],
          },
        ],
      },
      {
        id: 'donate',
        label: 'Donate it to a privacy charity',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I signed the check over to a digital rights group without looking at the amount. A lawyer sighed.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'tm_catfish_match',
    category: 'random',
    title: 'Suspiciously perfect match',
    text: 'I matched with someone stunning, funny and apparently a surgeon who travels constantly. They have been "about to visit" for three months and now need a small loan for the flight.',
    minAge: 18,
    maxAge: 60,
    weight: 1.2,
    cooldown: 4,
    conditions: [{ hasLover: false }, { inPrison: false }],
    choices: [
      {
        id: 'send',
        label: 'Send the money',
        hint: '{{$600}}',
        conditions: [{ money: { gte: 600 } }],
        effects: [
          { money: -600 },
          {
            chance: 0.08,
            then: [
              { log: 'Against every law of the internet, they turned up. We had coffee. It was fine. Weird, but fine.', kind: 'good' },
              { newPerson: { kind: 'lover', relationship: 55, log: '{{person}} and I started seeing each other. The flight money was never mentioned again.' } },
            ],
            else: [{ log: "The account vanished when the money cleared. The surgeon was a dentist's photo from another country.", kind: 'bad' }, { stat: 'happiness', delta: -8 }],
          },
        ],
      },
      {
        id: 'video',
        label: 'Demand a video call',
        effects: [
          {
            chance: 0.2,
            then: [
              { log: 'They actually called. Grainy, nervous, real. We talked for two hours.', kind: 'good' },
              { stat: 'happiness', delta: 4 },
              { newPerson: { kind: 'lover', relationship: 50, log: '{{person}} turned out to be real. Not a surgeon, but real.' } },
            ],
            else: [{ log: 'They said their camera was broken, then their phone, then their hands. I unmatched.' }, { stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 2 }],
          },
        ],
      },
      {
        id: 'block',
        label: 'Block and report',
        effects: [{ stat: 'smarts', delta: 1 }, { karma: 1 }, { stat: 'happiness', delta: 1 }, { log: 'I reported the profile. The app thanked me with a notification about my "perfect match." Pass.' }],
      },
    ],
  },
  {
    id: 'tm_streamer_scam',
    category: 'random',
    title: 'Streamer emergency',
    text: 'A streamer I watch every night is in tears on camera: their account was hacked, their savings are gone, and loyal viewers can help by sending {{$40}} to a "recovery fund."',
    minAge: 12,
    maxAge: 45,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'send',
        label: 'Chip in to the fund',
        hint: '{{$40}}',
        conditions: [{ money: { gte: 40 } }],
        effects: [
          { money: -40 },
          {
            chance: 0.15,
            then: [{ log: 'It was real, and they thanked donors by name on stream. I heard mine. I glowed.', kind: 'good' }, { stat: 'happiness', delta: 5 }, { karma: 1 }],
            else: [{ log: 'The "recovery fund" recovered a new car for the streamer. The crying was good acting.', kind: 'bad' }, { stat: 'happiness', delta: -5 }],
          },
        ],
      },
      {
        id: 'ask',
        label: 'Ask questions in chat',
        effects: [
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.5,
            then: [{ log: 'The mods timed me out for "negativity." I took that as an answer.' }, { stat: 'happiness', delta: -1 }],
            else: [{ log: 'Others started asking too. The stream ended early. Some mysteries solve themselves.', kind: 'good' }, { karma: 2 }],
          },
        ],
      },
      {
        id: 'report',
        label: 'Report the stream',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I reported it and uninstalled the app for a month. I slept better and missed nothing.' }],
      },
    ],
  },
  {
    id: 'tm_account_lockout',
    category: 'random',
    title: 'Locked out',
    text: 'I changed my phone number and now my main account wants a code sent to the old one. The recovery form asks what date I joined. It was, I think, a Tuesday.',
    minAge: 16,
    maxAge: 80,
    weight: 1.2,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'service',
        label: 'Pay a recovery service',
        hint: '{{$120}}',
        conditions: [{ money: { gte: 120 } }],
        effects: [
          { money: -120 },
          {
            chance: 0.35,
            then: [{ log: 'A patient person in a chat window got me back in within a day. Money well spent.', kind: 'good' }, { stat: 'happiness', delta: 3 }],
            else: [{ log: 'The service took the money and sent a form letter. I was still locked out, and poorer.', kind: 'bad' }, { stat: 'happiness', delta: -4 }],
          },
        ],
      },
      {
        id: 'wait',
        label: 'Wait out the thirty days',
        effects: [
          { stat: 'happiness', delta: -3 },
          { energy: -1 },
          {
            chance: 0.8,
            then: [{ log: 'Thirty days later a code arrived. Years of photos were waiting for me. Fine.', kind: 'good' }, { stat: 'happiness', delta: 4 }],
            else: [{ log: 'After thirty days the form said "unable to verify." Years of photos, gone.', kind: 'bad' }, { stat: 'happiness', delta: -8 }],
          },
        ],
      },
      {
        id: 'fresh',
        label: 'Start a new account',
        effects: [{ stat: 'happiness', delta: 1 }, { fame: -3 }, { log: 'I started over with zero followers and no embarrassing history. There was something clean about it.' }],
      },
    ],
  },
  {
    id: 'tm_forgotten_subscription',
    category: 'random',
    title: 'The forgotten subscription',
    text: 'I have apparently been paying monthly for a meditation app since I opened it once, four years ago, to breathe for ninety seconds. That breath has cost me {{$480}}.',
    minAge: 20,
    maxAge: 90,
    weight: 1.5,
    cooldown: 6,
    conditions: [{ inPrison: false }],
    choices: [
      { id: 'cancel', label: 'Cancel it', effects: [{ stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 1 }, { log: 'I canceled it. The app sent a sad notification. I did not breathe for it.' }] },
      {
        id: 'refund',
        label: 'Demand a refund',
        effects: [
          {
            chance: 0.35,
            then: [{ log: 'Support refunded six months out of pity. I thanked them with deep, calm breathing.', kind: 'money' }, { money: 60 }, { stat: 'happiness', delta: 3 }],
            else: [{ log: 'Support explained, calmly, that "did not use it" is not a refund category.' }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
      {
        id: 'use',
        label: 'Actually use it this time',
        hint: '{{$120}} a year',
        conditions: [{ money: { gte: 120 } }],
        effects: [{ money: -120 }, { stat: 'health', delta: 3 }, { stat: 'happiness', delta: 1 }, { log: 'I kept it and actually meditated most mornings this year. Cheaper than buying more apps.' }],
      },
    ],
  },

  // ------------------------------------------------------------ devices behaving badly
  {
    id: 'tm_smart_speaker_rice',
    category: 'random',
    title: 'Ninety pounds of rice',
    text: 'My smart speaker misheard the television and ordered ninety pounds of rice. It arrived this morning in four sacks. The delivery driver asked if I was opening a restaurant.',
    minAge: 20,
    maxAge: 100,
    weight: 1,
    once: true,
    conditions: [{ money: { gte: 300 } }, { inPrison: false }],
    choices: [
      {
        id: 'keep',
        label: 'Keep the rice',
        hint: '{{$90}}',
        effects: [{ money: -90 }, { stat: 'happiness', delta: 2 }, { stat: 'health', delta: 1 }, { stat: 'smarts', delta: 1 }, { log: 'I kept it. I ate rice for eleven months. I became very, very good at rice.' }],
      },
      {
        id: 'return',
        label: 'Fight the return process',
        effects: [
          {
            chance: 0.55,
            then: [{ log: 'After three phone calls and one sack dragged to a depot, I got my money back.', kind: 'good' }, { stat: 'happiness', delta: -1 }],
            else: [{ log: 'Returns did not cover "misheard the television." The rice stayed, and so did the charge.', kind: 'bad' }, { money: -90 }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'donate',
        label: 'Donate it to a food bank',
        hint: '{{$90}}',
        effects: [{ money: -90 }, { karma: 4 }, { stat: 'happiness', delta: 3 }, { log: 'The food bank took every sack. The volunteer said I was their rice person now.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'tm_lost_phone',
    category: 'random',
    title: 'Lost phone',
    text: 'My phone is gone. I have checked every pocket twice, including the pockets of a coat I was not wearing. The last place I remember having it is the back seat of a taxi.',
    minAge: 13,
    maxAge: 90,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'track',
        label: 'Track it down',
        effects: [
          { energy: -1 },
          {
            chance: 0.5,
            then: [{ log: 'The tracker led me to a taxi depot. A bored dispatcher handed it over, half charged, no questions.', kind: 'good' }, { stat: 'happiness', delta: 4 }],
            else: [
              { log: 'The tracker showed it crossing the city, then it went dark. Goodbye, phone. Hello, replacement bill.', kind: 'bad' },
              { money: -500 },
              { stat: 'happiness', delta: -4 },
              { chance: 0.3, then: [{ queue: 'tm_lost_phone_returned' }] },
            ],
          },
        ],
      },
      {
        id: 'replace',
        label: 'Buy a new one',
        hint: '{{$700}}',
        conditions: [{ money: { gte: 700 } }],
        effects: [{ money: -700 }, { stat: 'happiness', delta: 2 }, { log: 'I bought a newer, shinier phone and spent a week re-entering passwords I had forgotten I had.', kind: 'money' }],
      },
      {
        id: 'without',
        label: 'Go without for a while',
        effects: [{ stat: 'happiness', delta: -3 }, { stat: 'health', delta: 2 }, { stat: 'smarts', delta: 2 }, { money: -150 }, { log: 'A month without a phone. I read, I noticed trees, I missed every plan. Then I bought a cheap one.' }],
      },
    ],
  },
  {
    id: 'tm_lost_phone_returned',
    category: 'random',
    title: 'A stranger calls',
    text: 'A stranger messaged my new number from my old phone. They found it wedged under a taxi seat and want to return it. They have been, they add, very careful not to look at anything.',
    minAge: 13,
    maxAge: 90,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'reward',
        label: 'Reward them',
        hint: '{{$50}}',
        conditions: [{ money: { gte: 50 } }],
        effects: [{ money: -50 }, { karma: 2 }, { stat: 'happiness', delta: 4 }, { log: 'I gave them {{$50}} and my thanks. Now I have two phones and one restored faith in people.', kind: 'good' }],
      },
      {
        id: 'thanks',
        label: 'Just say thank you',
        effects: [{ stat: 'happiness', delta: 3 }, { log: 'They refused any reward anyway. We shook hands outside a cafe like spies exchanging a package.' }],
      },
      {
        id: 'suspicious',
        label: "Assume it's a trap",
        effects: [{ stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 1 }, { log: 'I told them to keep it. Maybe it was a scam. Maybe I now have a slightly sadder life.' }],
      },
    ],
  },
  {
    id: 'tm_internet_outage',
    category: 'random',
    title: 'No signal',
    text: 'The internet went down across the whole street on Friday evening, and the provider\'s estimate is "Monday, possibly." Neighbors are standing on the sidewalk holding their phones up to the sky.',
    minAge: 13,
    maxAge: 90,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'outside',
        label: 'Go outside',
        effects: [
          { energy: -1 },
          { stat: 'health', delta: 3 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.4,
            then: [
              { log: 'I went outside. The whole street was out there, blinking at the sky like moles.', kind: 'good' },
              { newPerson: { kind: 'friend', relationship: 50, log: '{{person}} from three doors down and I talked on the sidewalk for an hour. We are friends now.' } },
            ],
            else: [{ log: 'I walked, read, and noticed the park has a pond. It has had a pond for years.' }],
          },
        ],
      },
      {
        id: 'provider',
        label: 'Call the provider',
        effects: [
          { stat: 'happiness', delta: -4 },
          { energy: -1 },
          {
            chance: 0.3,
            then: [{ log: 'After two hours on hold a kind technician pushed a button and everything came back. I wept a little.', kind: 'good' }, { stat: 'happiness', delta: 6 }],
            else: [{ log: 'Two hours of hold music, one disconnection, and the estimate changed to "Tuesday, possibly."', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'hotspot',
        label: 'Drain my phone data',
        hint: '{{$30}}',
        conditions: [{ money: { gte: 30 } }],
        effects: [{ money: -30 }, { stat: 'happiness', delta: 2 }, { log: 'I ran everything off my phone and streamed in low resolution like a pioneer. The bill was unkind.' }],
      },
    ],
  },
  {
    id: 'tm_game_addiction',
    category: 'random',
    title: 'Just one more level',
    text: 'A new game came out and it is perfect. There is a crafting system, a storyline, and a timer that says I have played for thirty-one hours this week. It is Wednesday.',
    minAge: 12,
    maxAge: 60,
    weight: 2,
    cooldown: 4,
    conditions: [{ any: [{ enrolled: true }, { hasJob: true }] }, { inPrison: false }],
    choices: [
      {
        id: 'binge',
        label: 'Play all weekend',
        effects: [{ stat: 'happiness', delta: 8 }, { stat: 'health', delta: -3 }, { grade: -5 }, { jobPerformance: -5 }, { log: 'I finished the game in one magnificent weekend. Everything else in my life is now slightly behind.' }],
      },
      {
        id: 'timer',
        label: 'Set a one-hour timer',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'An hour a day. I kept to it most days. The game lasted all year, which was nice in its own way.' }],
      },
      {
        id: 'uninstall',
        label: 'Uninstall it',
        effects: [{ stat: 'happiness', delta: -4 }, { grade: 3 }, { jobPerformance: 3 }, { log: 'I uninstalled it before it took me. I think about the crafting system more than I should.' }],
      },
    ],
  },
  {
    id: 'tm_online_argument',
    category: 'random',
    title: 'Someone is wrong online',
    text: 'A stranger online has confidently posted something wrong about {{city}}, and I am the only person awake who knows it. It is eleven at night. My thumbs are ready.',
    minAge: 13,
    maxAge: 90,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'allnight',
        label: 'Argue until dawn',
        effects: [
          { stat: 'health', delta: -3 },
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.35,
            then: [{ log: 'At 4am they typed "fine, you\'re right." I have never felt so alive, or so tired.', kind: 'good' }, { stat: 'happiness', delta: 6 }],
            else: [{ log: 'At 4am they called me a nerd and logged off. I had to be up in three hours.', kind: 'bad' }, { stat: 'happiness', delta: -5 }],
          },
        ],
      },
      {
        id: 'one_reply',
        label: 'One perfect reply, then bed',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'I wrote one paragraph with sources and went to sleep. Whatever happened next, I slept through it.' }],
      },
      {
        id: 'close',
        label: 'Close the app',
        effects: [{ stat: 'happiness', delta: 1 }, { karma: 1 }, { stat: 'health', delta: 1 }, { log: 'I closed the app and went to bed. They are still wrong. I am well rested. Both are fine.' }],
      },
    ],
  },

  // ------------------------------------------------------------ at work
  {
    id: 'tm_old_photo_at_work',
    category: 'random',
    title: 'The photo resurfaces',
    text: "Someone at {{company}} found a photo of me at seventeen, dressed as a giant shrimp at a costume party. It is now the work chat's wallpaper.",
    minAge: 20,
    maxAge: 65,
    weight: 1,
    once: true,
    conditions: [{ hasJob: true }],
    choices: [
      {
        id: 'laugh',
        label: 'Laugh it off',
        effects: [{ stat: 'happiness', delta: 3 }, { jobPerformance: 2 }, { log: 'I changed my profile picture to the shrimp. The office declared me a legend.', kind: 'good' }],
      },
      {
        id: 'remove',
        label: 'Demand it be removed',
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'HR had it taken down. The office now whispers "shrimp" when I walk past.' }, { stat: 'happiness', delta: -2 }, { jobPerformance: -1 }],
            else: [{ log: 'Demanding made it funnier. Someone printed it. It is on the fridge.', kind: 'bad' }, { stat: 'happiness', delta: -5 }],
          },
        ],
      },
      {
        id: 'worse',
        label: 'Post a worse one',
        effects: [
          { stat: 'happiness', delta: 5 },
          {
            chance: 0.7,
            then: [{ log: "I posted the next year's photo: me as a filing cabinet. The office now calls me a hero.", kind: 'good' }, { jobPerformance: 1 }],
            else: [{ log: 'The boss saw the filing cabinet photo and did not find it professional.', kind: 'bad' }, { jobPerformance: -4 }],
          },
        ],
      },
    ],
  },
  {
    id: 'tm_password_sticky_note',
    category: 'random',
    title: 'The sticky note',
    text: 'My manager\'s password is written on a sticky note on their monitor: "password1." The entire payroll system sits behind it.',
    minAge: 18,
    maxAge: 65,
    weight: 1,
    cooldown: 6,
    conditions: [{ hasJob: true }],
    choices: [
      {
        id: 'tell',
        label: 'Tell them quietly',
        effects: [
          { karma: 2 },
          {
            chance: 0.7,
            then: [{ log: 'They thanked me, went red and changed it to "password2." Progress.', kind: 'good' }, { jobPerformance: 3 }],
            else: [{ log: 'They were embarrassed and brusque with me for a week.' }, { jobPerformance: -1 }, { stat: 'happiness', delta: -1 }],
          },
        ],
      },
      {
        id: 'peek',
        label: 'Peek at the salary spreadsheet',
        effects: [
          { karma: -5 },
          {
            chance: 0.75,
            then: [{ log: 'I learned what everyone earns. Some people earn more than me for less. I cannot unknow this.' }, { stat: 'happiness', delta: -4 }, { stat: 'smarts', delta: 1 }],
            else: [{ log: 'The login was logged. Security traced it to my desk. I was marched out with a cardboard box.', kind: 'bad' }, { loseJob: true, reason: 'fired' }, { stat: 'happiness', delta: -10 }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Not my circus',
        effects: [
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.25,
            then: [{ log: 'Months later the company got hacked. The note was still there. I said nothing then, either.', kind: 'bad' }, { stat: 'happiness', delta: -2 }],
            else: [{ log: 'I left it alone. Nothing happened. The note slowly faded in the sun.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tm_reply_all',
    category: 'random',
    title: 'Reply all',
    text: 'I meant to send a joke about the quarterly meeting to one friend at {{company}}. I hit reply all. Everyone in the building, including the person the joke was about, now has it.',
    minAge: 18,
    maxAge: 65,
    weight: 1.2,
    cooldown: 5,
    conditions: [{ hasJob: true }],
    choices: [
      {
        id: 'recall',
        label: 'Try to recall it',
        effects: [
          {
            chance: 0.3,
            then: [{ log: 'Recall worked on most inboxes. The rest were polite enough to pretend.', kind: 'good' }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'Recall sent a second email announcing I wanted the first one back. Now everyone has read both.', kind: 'bad' }, { jobPerformance: -4 }, { stat: 'happiness', delta: -5 }],
          },
        ],
      },
      {
        id: 'own',
        label: 'Own it and apologize',
        effects: [
          { karma: 2 },
          {
            chance: 0.65,
            then: [{ log: 'I sent a short, honest apology. The subject of the joke replied "honestly, fair." Crisis over.', kind: 'good' }, { jobPerformance: -1 }, { stat: 'happiness', delta: 1 }],
            else: [{ log: 'The apology was accepted in the way that means it was not.' }, { jobPerformance: -3 }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'blame',
        label: 'Blame a hacked account',
        effects: [
          { karma: -4 },
          {
            chance: 0.4,
            then: [{ log: 'IT "investigated" and found nothing, which they reported as inconclusive. I got away with it.' }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'IT found the email was sent from my desk, at my login, during my lunch break. Everyone knows.', kind: 'bad' }, { jobPerformance: -8 }, { stat: 'happiness', delta: -6 }],
          },
        ],
      },
    ],
  },
  {
    id: 'tm_video_call_mishap',
    category: 'random',
    title: 'Camera on',
    text: 'I joined the big call at {{company}} with my camera on by mistake. I was in a bathrobe, eating cereal out of a measuring cup, and the boss was mid-sentence.',
    minAge: 18,
    maxAge: 65,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ hasJob: true }],
    choices: [
      {
        id: 'own',
        label: 'Own it with a joke',
        effects: [
          {
            chance: 0.65,
            then: [{ log: 'I said "portion control" and kept chewing. The call laughed. The boss used it in their next slide.', kind: 'good' }, { stat: 'happiness', delta: 4 }, { jobPerformance: 2 }],
            else: [{ log: 'Nobody laughed. The silence lasted exactly one spoonful.', kind: 'bad' }, { stat: 'happiness', delta: -4 }, { jobPerformance: -2 }],
          },
        ],
      },
      {
        id: 'blame',
        label: 'Blame the connection',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ log: 'I "dropped" and rejoined fully dressed. The incident was never mentioned, which is somehow worse.' }, { stat: 'happiness', delta: -1 }],
            else: [{ log: 'Someone had already taken a screenshot. The measuring cup is now a company meme.', kind: 'bad' }, { stat: 'happiness', delta: -3 }, { fame: 1 }],
          },
        ],
      },
      {
        id: 'leave',
        label: 'Leave the meeting entirely',
        effects: [{ jobPerformance: -3 }, { stat: 'happiness', delta: 1 }, { log: 'I left the call, got dressed and did not return. The minutes list me as "present, briefly."' }],
      },
    ],
  },
];

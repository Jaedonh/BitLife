import type { Condition, EventDef } from '@/engine/events/schema';

/**
 * Ages 6-12, told by the kid: kid health (the parents pay and decide, the kid
 * tells, hides or is brave), pocket money, learning itself, looking after a
 * pet, the neighborhood, presents and parties, trips seen from the back seat,
 * tablets and kids' games, growing up wealthy or poor, and living with one
 * parent or a new stepparent. Parents are bound through `person` so they read
 * as Mom and Dad. A minor never pays: any cost here falls on the parents.
 * Follow-ups (followUpOnly) are queued by the events that set them up.
 */
const PARENTS: EventDef['person'] = { kind: ['mother', 'father', 'stepmother', 'stepfather'] };
const HAS_PARENT: Condition = { hasPerson: ['mother', 'father', 'stepmother', 'stepfather'] };

export const KID_LIFE_EVENTS: EventDef[] = [
  // ------------------------------------------------------------------ health
  {
    id: 'kl_toothache',
    category: 'health',
    title: 'The back tooth',
    text: 'A back tooth has started to throb every time I eat something sweet, which is most of the things I eat. Last night it woke me up. It is clearly trying to tell me something.',
    minAge: 6,
    maxAge: 12,
    weight: 1.2,
    cooldown: 4,
    person: PARENTS,
    choices: [
      {
        id: 'tell',
        label: 'Tell {{person}}',
        hint: 'Family pays {{$150}}',
        effects: [
          { money: -150 },
          { stat: 'health', delta: 3 },
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: 2 },
          { log: 'One cavity, one filling, one numb lip all afternoon, and a long talk about gummy bears.' },
        ],
      },
      {
        id: 'chew',
        label: 'Chew on the other side',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'It was a baby tooth on its way out. A week later it wiggled free and took the ache along.', kind: 'good' }],
            else: [
              { money: -400 },
              { stat: 'health', delta: -3 },
              { stat: 'happiness', delta: -3 },
              { relationship: 'person', delta: -2 },
              { log: 'I hid it for a month. By the time {{person}} found out, one filling had become three.', kind: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'candy',
        label: 'Swear off candy forever',
        effects: [
          { stat: 'happiness', delta: -3 },
          {
            chance: 0.5,
            then: [{ stat: 'health', delta: 3 }, { log: 'No candy for a month. The ache faded. I think I scared it. I felt like a saint.', kind: 'good' }],
            else: [{ money: -150 }, { stat: 'health', delta: 2 }, { log: 'Eleven days without candy and the tooth still hurt. A filling, and no candy, for nothing.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'kl_blurry_board',
    category: 'health',
    title: 'The blurry board',
    text: 'From the back row, the words on the board have gone soft and fuzzy, like they were written on a cloud. Everyone else seems to read them fine. I have been copying from the kid next to me.',
    minAge: 7,
    maxAge: 12,
    weight: 1,
    once: true,
    conditions: [{ enrolled: true }],
    person: PARENTS,
    choices: [
      {
        id: 'tell',
        label: 'Tell {{person}}',
        hint: 'Family pays {{$200}}',
        effects: [
          { money: -200 },
          { stat: 'smarts', delta: 2 },
          { grade: 4 },
          { relationship: 'person', delta: 2 },
          { flag: 'wearsGlasses' },
          { log: 'An eye test, a lot of tiny letters, and a pair of glasses. The board has edges again.', kind: 'good' },
          { queue: 'kl_new_glasses' },
        ],
      },
      {
        id: 'front',
        label: 'Move to the front row',
        effects: [
          { grade: 1 },
          {
            chance: 0.5,
            then: [
              { money: -200 },
              { flag: 'wearsGlasses' },
              { log: 'My teacher saw me squinting even in the front row and called home. Glasses it is.' },
              { queue: 'kl_new_glasses' },
            ],
            else: [{ stat: 'health', delta: -1 }, { log: 'From the front row I can almost read the board. Almost, and a lot of headaches.' }],
          },
        ],
      },
      {
        id: 'copy',
        label: 'Keep copying my deskmate',
        effects: [{ karma: -1 }, { grade: -4 }, { stat: 'happiness', delta: -1 }, { log: "I copied my deskmate's notes all term. The handwriting was bad, and so were my grades.", kind: 'bad' }],
      },
    ],
  },
  {
    id: 'kl_new_glasses',
    category: 'health',
    title: 'New glasses',
    text: 'The new glasses sit on my nose like they own the place. Tomorrow is the first day everyone at school will see them, and I have practiced three different faces in the mirror.',
    minAge: 7,
    maxAge: 12,
    weight: 1,
    followUpOnly: true,
    conditions: [{ enrolled: true }],
    person: PARENTS,
    choices: [
      {
        id: 'proud',
        label: 'Wear them like a scientist',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'I pushed them up my nose like a scientist all day. Two kids asked to try them on.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'A kid called me "Four Eyes" at recess. I told him that is twice as many as he has.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'pocket',
        label: 'Keep them in my pocket',
        effects: [
          { grade: -2 },
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.3,
            then: [{ money: -100 }, { log: 'I sat on them in week two. {{person}} paid for a second pair and a very sturdy case.', kind: 'bad' }],
            else: [{ log: 'The glasses lived in my pocket and came out only when the teacher looked my way.' }],
          },
        ],
      },
      {
        id: 'board',
        label: 'Wear them only for the board',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.25,
            then: [{ money: -100 }, { log: 'Glasses on for the board, off for recess. A system, until I left them on the swings.', kind: 'bad' }],
            else: [{ log: 'Glasses on for the board, off for recess. A system. Nobody noticed, which was the point.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'kl_party_allergy',
    category: 'health',
    title: 'Puffy lips',
    text: 'At a birthday party, halfway through a slice of cake, my lips started to tingle and puff up like a cartoon. The other kids are still eating. Nobody has noticed yet.',
    minAge: 6,
    maxAge: 12,
    weight: 0.8,
    once: true,
    person: PARENTS,
    choices: [
      {
        id: 'tell',
        label: 'Tell the grown-up in charge',
        hint: 'Family pays {{$150}}',
        effects: [
          { money: -150 },
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: 2 },
          { flag: 'foodAllergy' },
          { log: 'The host phoned {{person}}. A doctor, a blood test, and the word "nuts". Now I read labels.' },
        ],
      },
      {
        id: 'wait',
        label: 'Sit still and wait',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -1 }, { log: 'I sat very still in the bathroom for an hour until it faded. I ate no more cake.' }],
            else: [
              { stat: 'health', delta: -6 },
              { money: -800 },
              { stat: 'happiness', delta: -5 },
              { relationship: 'person', delta: 3 },
              { flag: 'foodAllergy' },
              { log: 'My throat got tight. An ambulance, a scary hour, and {{person}} holding my hand.', kind: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'hide',
        label: 'Keep eating and act normal',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'The puffiness went down on its own. I won the sack race and decided not to think about it.' }],
            else: [
              { stat: 'health', delta: -8 },
              { money: -1000 },
              { stat: 'happiness', delta: -6 },
              { relationship: 'person', delta: -2 },
              { flag: 'foodAllergy' },
              { log: 'I kept eating. Bad plan. The party ended for me in an ambulance, and {{person}} aged a year.', kind: 'bad' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'kl_flu_bell',
    category: 'health',
    title: 'The sick bell',
    text: 'Day two of the flu. A fever, a mountain of tissues, and a little bell {{person}} left by my bed with strict instructions: ring it only if it is important.',
    minAge: 6,
    maxAge: 12,
    weight: 1.2,
    cooldown: 4,
    person: PARENTS,
    choices: [
      {
        id: 'ring',
        label: 'Ring it for everything',
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'health', delta: 1 },
          { relationship: 'person', delta: -3 },
          { log: 'Juice, a blanket, a different juice. By evening {{person}} had quietly hidden the bell.' },
        ],
      },
      {
        id: 'rest',
        label: 'Sleep it off',
        effects: [{ stat: 'health', delta: 4 }, { stat: 'happiness', delta: -1 }, { log: 'I slept for most of three days and woke up sweaty, starving and cured.', kind: 'good' }],
      },
      {
        id: 'cartoons',
        label: 'Watch cartoons all day',
        effects: [{ stat: 'happiness', delta: 4 }, { stat: 'health', delta: -1 }, { log: 'The fever and the cartoons blurred together. Lovely, but it took a week to shake.' }],
      },
    ],
  },
  {
    id: 'kl_sprained_ankle',
    category: 'health',
    title: 'Twisted ankle',
    text: 'I came down wrong at soccer practice and my ankle made a sound ankles should not make. It is already the size of an orange, and the big game is on Saturday.',
    minAge: 8,
    maxAge: 12,
    weight: 1,
    cooldown: 4,
    person: PARENTS,
    choices: [
      {
        id: 'tell',
        label: 'Tell the coach and sit out',
        hint: 'Family pays {{$100}}',
        effects: [
          { money: -100 },
          { stat: 'health', delta: 2 },
          { stat: 'happiness', delta: -4 },
          { log: 'An X-ray, a sprain, and two weeks on the bench handing out orange slices. It healed right.' },
        ],
      },
      {
        id: 'brave',
        label: 'Be brave and keep playing',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { stat: 'health', delta: -2 }, { log: 'I limped through practice and played on Saturday. It held, mostly. I felt like a legend.', kind: 'good' }],
            else: [
              { injury: 6 },
              { money: -500 },
              { stat: 'happiness', delta: -5 },
              { relationship: 'person', delta: -1 },
              { log: 'I kept playing and turned a sprain into a crack in the bone. Six weeks in a boot.', kind: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'hide',
        label: 'Hide it from {{person}}',
        effects: [
          { karma: -1 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 2 }, { stat: 'health', delta: -1 }, { log: 'I iced it in secret with a bag of frozen peas. By Saturday it worked. Nobody knew.' }],
            else: [
              { money: -100 },
              { stat: 'happiness', delta: -4 },
              { relationship: 'person', delta: -3 },
              { log: '{{person}} caught me hopping up the stairs. Busted, X-rayed and benched for two weeks.', kind: 'bad' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'kl_appendicitis',
    category: 'health',
    title: 'The right side',
    text: 'My stomach started hurting after breakfast. By lunch the hurt had moved into one hot spot low on my right side, and every step makes it worse. {{person}} is in the next room.',
    minAge: 6,
    maxAge: 12,
    weight: 0.4,
    once: true,
    person: PARENTS,
    choices: [
      {
        id: 'tell',
        label: 'Tell {{person}} right away',
        effects: [
          { relationship: 'person', delta: 3 },
          {
            chance: 0.3,
            then: [
              { money: -300 },
              { stat: 'happiness', delta: -2 },
              { log: 'Four hours in the ER, one blood test, and the verdict: a stomach bug. Home by dinner.' },
            ],
            else: [
              { money: -2500 },
              { counter: 'surgeries' },
              { injury: 4 },
              { stat: 'happiness', delta: -3 },
              { log: 'Straight to the hospital. Appendicitis, out that same night. A scar and three days of ice pops.', kind: 'milestone' },
            ],
          },
        ],
      },
      {
        id: 'brave',
        label: 'Be brave and lie down',
        effects: [
          {
            chance: 0.3,
            then: [{ stat: 'health', delta: -1 }, { log: 'It was a stomach bug. By dinner I was fine and a little disappointed about the scar.' }],
            else: [
              { money: -4000 },
              { counter: 'surgeries' },
              { injury: 8 },
              { stat: 'happiness', delta: -5 },
              { relationship: 'person', delta: 2 },
              { log: 'By bedtime I was crying. Emergency surgery, and a doctor who said we were just in time.', kind: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'hide',
        label: 'Hide it and go play',
        effects: [
          {
            chance: 0.25,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'I played through it and it faded. A stomach bug. I got lucky and I know it.' }],
            else: [
              { money: -6000 },
              { counter: 'surgeries' },
              { injury: 12 },
              { stat: 'happiness', delta: -8 },
              { relationship: 'person', delta: -2 },
              { log: 'I hid it until I could not stand. It burst. A week in the hospital and a very scared {{person}}.', kind: 'bad' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'kl_head_lice',
    category: 'health',
    title: 'The note home',
    text: 'A note came home from school: someone in my class has head lice. {{person}} read it out loud, then looked at me. I have been scratching my head all afternoon, but I think that is just thinking.',
    minAge: 6,
    maxAge: 10,
    weight: 1,
    once: true,
    conditions: [{ enrolled: true }],
    person: PARENTS,
    choices: [
      {
        id: 'admit',
        label: 'Admit to the itching',
        effects: [
          { stat: 'happiness', delta: -2 },
          { stat: 'health', delta: 1 },
          { relationship: 'person', delta: 2 },
          { log: 'Lice. {{person}} spent the evening combing through my hair with a tiny comb, like a jeweler.' },
        ],
      },
      {
        id: 'deny',
        label: "Insist I'm fine",
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: -2 }, { log: 'A week later the whole family was itching, and everybody knew exactly whose fault it was.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'I really was fine. The itching was nerves, and nerves do not need a tiny comb.' }],
          },
        ],
      },
      {
        id: 'buzz',
        label: 'Ask for a buzz cut',
        effects: [{ stat: 'looks', delta: -2 }, { stat: 'happiness', delta: 2 }, { log: 'I asked for a buzz cut, just in case. My head is cold, lice-free and very aerodynamic.' }],
      },
    ],
  },

  // ----------------------------------------------------------- pocket money
  {
    id: 'kl_first_piggy_bank',
    category: 'money',
    title: 'My own piggy bank',
    text: 'For my birthday I got my very own piggy bank: pink, heavy and smiling, with a coin hole on top and no way out except a hammer. {{person}} dropped in the first coin for luck.',
    minAge: 6,
    maxAge: 8,
    weight: 1.2,
    once: true,
    person: PARENTS,
    choices: [
      {
        id: 'feed',
        label: 'Feed it every coin I find',
        effects: [{ money: 40 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }, { log: 'Every coin I found went in. By the end of the year the pig held {{$40}} and could not be lifted.', kind: 'money' }],
      },
      {
        id: 'shake',
        label: 'Shake coins out for candy',
        effects: [{ money: 15 }, { stat: 'happiness', delta: 3 }, { log: 'I learned to shake coins back out the top. The pig ended the year light: {{$15}}.', kind: 'money' }],
      },
      {
        id: 'smash',
        label: 'Smash it on day one',
        effects: [
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: -2 },
          { log: 'I smashed the pig on day one for one coin and a gumball. {{person}} swept up the pig in silence.' },
        ],
      },
    ],
  },
  {
    id: 'kl_window_scooter',
    category: 'money',
    title: 'The scooter in the window',
    text: 'There is a silver scooter in the toy store window that costs {{$120}}. {{person}} made me an offer: if I save half, {{they}} will pay the rest. Half is {{$60}}. I have done the math twice.',
    minAge: 8,
    maxAge: 12,
    weight: 1,
    once: true,
    person: PARENTS,
    choices: [
      {
        id: 'save',
        label: 'Save every penny',
        effects: [
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.65,
            then: [
              { money: -60 },
              { stat: 'happiness', delta: 6 },
              { stat: 'smarts', delta: 2 },
              { relationship: 'person', delta: 2 },
              { log: 'Six months of birthday money and chores. The scooter goes faster because I earned it.', kind: 'good' },
            ],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I got halfway, then spent it all on a slime kit in one weak moment. No scooter.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'birthday',
        label: 'Ask for it for my birthday',
        effects: [
          {
            chance: 0.5,
            then: [{ money: -120 }, { stat: 'happiness', delta: 4 }, { log: 'My birthday was seven months away. On the day, there it was, with a bow on the handlebars.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { stat: 'smarts', delta: 1 }, { log: 'My birthday brought socks, a book and a speech about saving. No scooter.' }],
          },
        ],
      },
      {
        id: 'argue',
        label: 'Argue it is educational',
        effects: [
          {
            chance: 0.3,
            then: [{ money: -100 }, { stat: 'happiness', delta: 5 }, { relationship: 'person', delta: -1 }, { log: '{{person}} laughed so hard at "educational" that {{they}} paid for most of it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: '{{person}} did not buy the argument, or the scooter.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'kl_birthday_money',
    category: 'money',
    title: 'Money in a card',
    text: "A card from my aunt arrived with {{$40}} inside and a note in curly writing: 'Spend it on something you will remember.' The toy store is a ten-minute walk away. The jar on my shelf is closer.",
    minAge: 6,
    maxAge: 12,
    weight: 1.2,
    cooldown: 3,
    choices: [
      {
        id: 'spend',
        label: 'Spend it all today',
        effects: [{ stat: 'happiness', delta: 5 }, { log: 'I spent all {{$40}} in one glorious afternoon. I remember the candy. I forget the rest.', kind: 'good' }],
      },
      {
        id: 'save',
        label: 'Put it all in the jar',
        effects: [{ money: 40 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }, { log: 'All {{$40}} went in the jar. My aunt would call it sensible. I call it boring.', kind: 'money' }],
      },
      {
        id: 'split',
        label: 'Spend half, save half',
        effects: [{ money: 20 }, { stat: 'happiness', delta: 2 }, { log: 'Half on a kite, half in the jar. The kite broke within a week. The jar is still going.', kind: 'money' }],
      },
    ],
  },
  {
    id: 'kl_pocket_hole',
    category: 'money',
    title: 'The hole in my pocket',
    text: '{{person}} gave me {{$20}} for the school book fair and I put it in my pocket. Now my pocket has a hole in it, and the money has gone wherever money goes.',
    minAge: 6,
    maxAge: 11,
    weight: 1,
    cooldown: 4,
    conditions: [{ enrolled: true }],
    person: PARENTS,
    choices: [
      {
        id: 'tell',
        label: 'Tell {{person}} the truth',
        effects: [
          {
            chance: 0.6,
            then: [{ money: -20 }, { relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: '{{person}} sighed, sewed up the pocket and gave me another {{$20}}. I bought a book about octopuses.', kind: 'good' }],
            else: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -1 }, { log: '{{person}} said it was a lesson, not a refund. I walked around the fair with empty hands.' }],
          },
        ],
      },
      {
        id: 'retrace',
        label: 'Retrace my steps',
        effects: [
          {
            chance: 0.35,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I found it in the gym, folded under a bench. The best detective work of my career.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 1 }, { log: 'I searched every hallway twice. The money stayed lost. I check my pockets now.' }],
          },
        ],
      },
      {
        id: 'read',
        label: 'Read the display copies',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: -2 }, { log: 'I bought nothing and read two whole display copies before they packed the tables away.' }],
      },
    ],
  },
  {
    id: 'kl_sock_mountain',
    category: 'money',
    title: 'The sock mountain',
    text: 'The laundry basket has become a mountain of unmatched socks. {{person}} offered me a deal: a little money for every pair I match. There are hundreds. Some are clearly not from this family.',
    minAge: 6,
    maxAge: 10,
    weight: 1,
    once: true,
    person: PARENTS,
    choices: [
      {
        id: 'match',
        label: 'Match every last pair',
        effects: [
          { money: 15 },
          { stat: 'happiness', delta: -2 },
          { stat: 'smarts', delta: 1 },
          { relationship: 'person', delta: 2 },
          { log: 'Two hours, ninety pairs, {{$15}}. I am now the household expert on socks.', kind: 'money' },
        ],
      },
      {
        id: 'easy',
        label: 'Match only the easy ones',
        effects: [{ money: 8 }, { stat: 'happiness', delta: 1 }, { log: 'I matched the plain white ones and left the mysteries. {{$8}}, and my dignity intact.', kind: 'money' }],
      },
      {
        id: 'hide',
        label: 'Hide the odd ones',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ money: 15 }, { stat: 'happiness', delta: 1 }, { log: 'The leftover socks went under the couch and I got paid in full. The couch knows.', kind: 'money' }],
            else: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -2 }, { log: '{{person}} found forty socks under the couch. No pay, and a ruined reputation.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'kl_rock_business',
    category: 'money',
    title: 'Pet rocks',
    text: 'I have started a business: painting faces on rocks from the park and selling them door to door as pets that never need feeding. I have twelve rocks, a price list and a wagon.',
    minAge: 7,
    maxAge: 12,
    weight: 1,
    once: true,
    conditions: [HAS_PARENT],
    choices: [
      {
        id: 'door',
        label: 'Sell door to door',
        effects: [
          {
            random: [
              { weight: 1, effects: [{ money: 18 }, { stat: 'happiness', delta: 3 }, { log: 'Nine rocks sold for {{$18}}. One lady bought two so hers would not get lonely.', kind: 'money' }] },
              { weight: 1, effects: [{ stat: 'happiness', delta: -3 }, { log: 'Everyone said "no thank you" through the screen door. I named the rocks and kept them.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'family',
        label: 'Sell to family only',
        effects: [{ money: 6 }, { stat: 'happiness', delta: 1 }, { log: 'My family bought three rocks out of pity and duty. Small market, loyal customers.', kind: 'money' }],
      },
      {
        id: 'slime',
        label: 'Expand into slime',
        effects: [
          {
            random: [
              { weight: 2, effects: [{ money: 25 }, { stat: 'happiness', delta: 4 }, { log: 'The slime sold out on our street for {{$25}}. I was a tycoon until it got in a toddler\'s hair.', kind: 'money' }] },
              { weight: 3, effects: [{ money: -80 }, { stat: 'happiness', delta: -3 }, { log: 'The slime got into the carpet. The cleaning cost more than I will ever earn.', kind: 'bad' }] },
            ],
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------- learning
  {
    id: 'kl_reading_group',
    category: 'school',
    title: 'The reading group',
    text: 'Everyone else in my reading group has moved on to books with chapters. I am still on the one about the dog who sits on things. The letters keep wiggling when I look away.',
    minAge: 6,
    maxAge: 7,
    weight: 1.5,
    once: true,
    conditions: [{ enrolled: true }],
    person: PARENTS,
    choices: [
      {
        id: 'practice',
        label: 'Read with {{person}} every night',
        effects: [
          { stat: 'smarts', delta: 4 },
          { grade: 3 },
          { relationship: 'person', delta: 4 },
          { stat: 'happiness', delta: -1 },
          { log: 'One page every night with {{person}}. By spring the dog book was far beneath me.', kind: 'good' },
        ],
      },
      {
        id: 'memorize',
        label: 'Memorize the dog book',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -3 }, { grade: -2 }, { log: 'The teacher handed me a different book. My performance fell apart on page one.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: -1 }, { log: 'I recited the dog book perfectly. Nobody suspected a thing. I still could not read.' }],
          },
        ],
      },
      {
        id: 'teacher',
        label: 'Ask my teacher for help',
        effects: [
          { stat: 'smarts', delta: 3 },
          { grade: 2 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'My teacher sat with me at lunch twice a week. One day the letters just held still.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The extra lessons were during recess. I learned to read and missed every game of tag.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'kl_pizza_fractions',
    category: 'school',
    title: 'Pizza fractions',
    text: "Fractions. Every week they get harder and I understand them less. Tonight's worksheet has a pizza cut into pieces that do not add up to a pizza, and I am starting to take it personally.",
    minAge: 8,
    maxAge: 12,
    weight: 1.2,
    once: true,
    conditions: [{ enrolled: true }],
    person: PARENTS,
    choices: [
      {
        id: 'ask',
        label: 'Ask {{person}} for help',
        effects: [
          {
            random: [
              { weight: 1, effects: [{ stat: 'smarts', delta: 3 }, { grade: 3 }, { relationship: 'person', delta: 3 }, { log: '{{person}} cut a real pizza into eighths at dinner. It clicked. Then we ate the homework.', kind: 'good' }] },
              { weight: 1, effects: [{ stat: 'smarts', delta: 1 }, { relationship: 'person', delta: 1 }, { log: '{{person}} stared at the worksheet for a long time and said they teach it differently now.' }] },
            ],
          },
        ],
      },
      {
        id: 'tutor',
        label: 'Ask for a tutor',
        hint: 'Family pays {{$300}}',
        effects: [{ money: -300 }, { grade: 6 }, { stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: -2 }, { log: 'A tutor came every Tuesday with a bag of plastic pie slices. My grade climbed all term.', kind: 'good' }],
      },
      {
        id: 'doodle',
        label: 'Doodle on the pizza instead',
        effects: [{ stat: 'happiness', delta: 2 }, { grade: -4 }, { log: 'I gave the pizza pepperoni, a face and a name. The teacher gave it a red circle.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'kl_favorite_teacher',
    category: 'school',
    title: 'Ms. Ferreira',
    text: "My teacher this year, Ms. Ferreira, keeps a tank of snails on her desk, does all the voices when she reads to us, and wrote 'This is a real idea' on my story. I would walk through fire for her.",
    minAge: 7,
    maxAge: 12,
    weight: 1,
    once: true,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'work',
        label: 'Work harder than ever',
        effects: [{ grade: 6 }, { stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: -1 }, { log: 'I rewrote every story three times. Ms. Ferreira called one "ready for a library". I glowed.', kind: 'good' }],
      },
      {
        id: 'snails',
        label: 'Volunteer to feed the snails',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { karma: 1 }, { log: 'I became Snail Monitor. It is the most important job I have ever had.', kind: 'good' }],
      },
      {
        id: 'coast',
        label: 'Coast on her good opinion',
        effects: [{ stat: 'happiness', delta: 4 }, { grade: -3 }, { log: 'She liked me, so I coasted. A lovely year, right up to her report card note: "I expected more".' }],
      },
    ],
  },
  {
    id: 'kl_library_card',
    category: 'school',
    title: 'My own library card',
    text: '{{person}} took me to the library to get my very own card, with my name printed on it. The librarian said I can borrow up to ten books at a time. Ten. At a time.',
    minAge: 6,
    maxAge: 9,
    weight: 1,
    once: true,
    person: PARENTS,
    choices: [
      {
        id: 'ten',
        label: 'Take out all ten',
        effects: [
          { stat: 'smarts', delta: 3 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: -1 }, { log: 'Ten books weigh more than I do. {{person}} carried eight of them home and has opinions.' }],
            else: [{ log: 'I read eight of the ten. The other two were about trucks, and I have limits.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'one',
        label: 'Pick one perfect book',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I spent an hour choosing one book about volcanoes. Then I read it six times.', kind: 'good' }],
      },
      {
        id: 'comics',
        label: 'Only comics, all ten',
        effects: [{ stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 1 }, { log: 'Ten comic books. The librarian said reading is reading. She is my favorite grown-up now.' }],
      },
    ],
  },
  {
    id: 'kl_one_more_chapter',
    category: 'school',
    title: 'One more chapter',
    text: 'It is past midnight and I am reading under the blanket with a flashlight. Three chapters left. The hero is hanging off a cliff by one hand, and I can hear {{person}} in the hallway.',
    minAge: 8,
    maxAge: 12,
    weight: 1.2,
    cooldown: 3,
    person: PARENTS,
    choices: [
      {
        id: 'finish',
        label: 'Finish it tonight',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: 3 }, { stat: 'health', delta: -2 }, { log: 'I finished at two in the morning, cried at the ending and was a zombie at breakfast.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -3 }, { log: '{{person}} took the flashlight and the book. The hero is still hanging off that cliff.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'off',
        label: 'Switch off the flashlight',
        effects: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: -2 }, { relationship: 'person', delta: 2 }, { log: 'I left the hero on the cliff and went to sleep. I dreamed about falling all night.' }],
      },
      {
        id: 'peek',
        label: 'Read the last page first',
        effects: [{ stat: 'health', delta: 1 }, { stat: 'happiness', delta: 1 }, { log: 'I read the last page. The hero lived. I slept soundly and felt like a cheat.' }],
      },
    ],
  },
  {
    id: 'kl_conference_night',
    category: 'school',
    title: 'Parent-teacher night',
    text: 'Parent-teacher night. {{person}} is inside the classroom with my teacher, and I am in the hallway on a plastic chair, trying to read lips through the little window in the door.',
    minAge: 7,
    maxAge: 12,
    weight: 1,
    cooldown: 3,
    conditions: [{ enrolled: true }],
    person: PARENTS,
    choices: [
      {
        id: 'confess',
        label: 'Confess before {{they}} comes out',
        effects: [
          { karma: 1 },
          { relationship: 'person', delta: 2 },
          { stat: 'happiness', delta: -2 },
          { log: 'I confessed about the missing worksheets before the door opened. {{person}} blinked and thanked me.' },
        ],
      },
      {
        id: 'wait_good',
        label: 'Wait for the verdict',
        conditions: [{ grade: { gte: 55 } }],
        effects: [
          {
            chance: 0.8,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: 2 }, { log: 'Apparently I am "a joy to have in class". {{person}} bought me ice cream on the way home.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'Good grades, but "talks constantly". {{person}} said both parts were true.' }],
          },
        ],
      },
      {
        id: 'wait_bad',
        label: 'Wait for the verdict',
        conditions: [{ grade: { lt: 55 } }],
        effects: [
          {
            chance: 0.8,
            then: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -3 }, { grade: 3 }, { log: '{{person}} came out with a folder of my unfinished work. We did it together, all month.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 3 }, { log: 'My teacher said I am trying hard, which is generous. {{person}} looked relieved.' }],
          },
        ],
      },
      {
        id: 'listen',
        label: 'Press my ear to the door',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 1 }, { log: 'I heard the words "very bright" and "talks too much". Both fair.' }],
            else: [{ relationship: 'person', delta: -1 }, { stat: 'happiness', delta: -2 }, { log: 'The door opened while my ear was on it. I fell into the classroom. Everyone saw.', kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------- pets
  {
    id: 'kl_pet_job',
    category: 'family',
    title: 'My pet, my job',
    text: 'Taking care of {{person}} after school is officially my job now. It was my idea, back when I thought it would be all cuddles. The feeding part is fine. The cleaning-up part was not in the brochure.',
    minAge: 7,
    maxAge: 12,
    weight: 1.2,
    once: true,
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'daily',
        label: 'Do it every single day',
        effects: [{ relationship: 'person', delta: 6 }, { karma: 2 }, { stat: 'happiness', delta: -1 }, { log: 'Food, water, cleanup and a cuddle, every day after school. {{person}} waits for me now.', kind: 'good' }],
      },
      {
        id: 'fun',
        label: 'Do only the fun parts',
        effects: [
          { relationship: 'person', delta: 3 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'mother', delta: -1 },
          { relationship: 'father', delta: -1 },
          { log: 'I do the feeding and the cuddles. The cleanup keeps ending up with the grown-ups, somehow.' },
        ],
      },
      {
        id: 'forget',
        label: 'Do it when I remember',
        effects: [
          { relationship: 'person', delta: -4 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'mother', delta: -2 },
          { relationship: 'father', delta: -2 },
          { log: 'I forgot twice in one week. The grown-ups took over, with a speech each time.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'kl_pet_sick',
    category: 'family',
    title: 'Not eating',
    text: '{{person}} has stopped eating and just lies in a corner, breathing fast. In the kitchen the grown-up voices are low, and the word "vet" keeps coming up, next to the word "expensive".',
    minAge: 6,
    maxAge: 12,
    weight: 0.8,
    once: true,
    conditions: [HAS_PARENT],
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'savings',
        label: 'Offer my savings for the vet',
        hint: 'Family pays {{$400}}',
        conditions: [{ money: { gte: 1 } }],
        effects: [
          { karma: 2 },
          { relationship: 'mother', delta: 2 },
          { relationship: 'father', delta: 2 },
          { money: -400, payer: 'family' },
          {
            chance: 0.85,
            then: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 4 }, { log: 'I put my savings on the table. Nobody took it, but we went to the vet. {{person}} pulled through.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'The vet did everything there was to do. {{person}} died that night, with me right there.', kind: 'death' }, { personDies: true, cause: 'a sudden illness' }, { queue: 'kl_pet_grief' }],
          },
        ],
      },
      {
        id: 'sit',
        label: 'Sit with {{them}} all night',
        effects: [
          { relationship: 'person', delta: 6 },
          { stat: 'health', delta: -1 },
          {
            chance: 0.55,
            then: [{ stat: 'happiness', delta: 3 }, { log: '{{person}} drank a little water at dawn, then a little more. By the weekend {{they}} was fine.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'I stayed up with {{person}} all night. {{They}} died just before morning, with me right there.', kind: 'death' }, { personDies: true, cause: 'a sudden illness' }, { queue: 'kl_pet_grief' }],
          },
        ],
      },
      {
        id: 'grownups',
        label: 'Leave it to the grown-ups',
        effects: [
          {
            random: [
              { weight: 4, effects: [{ money: -400 }, { stat: 'happiness', delta: 2 }, { log: 'They took {{person}} to the vet. An infection, some pills, and {{they}} was home by Friday.', kind: 'good' }] },
              { weight: 4, effects: [{ stat: 'happiness', delta: 1 }, { log: 'The grown-ups decided to wait a day. {{person}} ate breakfast. Everyone pretended not to cry.' }] },
              { weight: 2, effects: [{ money: -400 }, { stat: 'happiness', delta: -5 }, { log: 'The vet could not save {{person}}. Nobody told me until it was over, and that hurt too.', kind: 'death' }, { personDies: true, cause: 'a sudden illness' }, { queue: 'kl_pet_grief' }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'kl_pet_grief',
    category: 'family',
    title: 'The empty spot',
    text: 'The house is too quiet without {{person}}. The food bowl is still in the kitchen, and nobody has been brave enough to move it. I keep listening for {{them}} when I come home.',
    minAge: 6,
    maxAge: 12,
    weight: 1,
    followUpOnly: true,
    person: { kind: ['pet'], alive: false },
    choices: [
      {
        id: 'ceremony',
        label: 'Hold a goodbye ceremony',
        effects: [{ stat: 'happiness', delta: 3 }, { karma: 1 }, { log: 'We said goodbye properly: a drawing, a candle and everyone telling a story about {{person}}.' }],
      },
      {
        id: 'box',
        label: 'Make a memory box',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 1 }, { log: "{{person}}'s favorite toy, a photo and a drawing went in a shoebox. I open it when I need to." }],
      },
      {
        id: 'new',
        label: 'Ask for a new pet now',
        effects: [
          {
            chance: 0.35,
            then: [
              { stat: 'happiness', delta: 3 },
              { newPerson: { kind: 'pet', species: 'hamster', relationship: 55, log: 'A hamster called {{person}} came home. Not a replacement. A new friend with a very small face.' } },
            ],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The answer was "not yet". It was the right answer, and I hated it.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'kl_pet_trick',
    category: 'family',
    title: 'The trick',
    text: '{{person}} is going to learn a trick. I have a bag of treats, a lot of patience and a library book about training that was clearly written for a different animal.',
    minAge: 6,
    maxAge: 12,
    weight: 1.2,
    cooldown: 4,
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'highfive',
        label: 'Go for a high five',
        effects: [
          {
            chance: 0.35,
            then: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 4 }, { log: 'Three weeks and a hundred treats later, {{person}} did one. I have never been prouder.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 2 }, { log: '{{person}} ate a hundred treats and learned only that I hand out treats.' }],
          },
        ],
      },
      {
        id: 'come',
        label: 'Teach {{them}} to come when called',
        effects: [
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 4 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 2 }, { log: '{{person}} now comes when called, at least when I am holding the treat bag.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 1 }, { log: '{{person}} looked right at me every time I called and stayed exactly where {{they}} was.' }],
          },
        ],
      },
      {
        id: 'cute',
        label: 'Settle for looking cute',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: 2 }, { log: 'I declared that sitting there looking cute is the trick. {{person}} has mastered it.' }],
      },
    ],
  },
  {
    id: 'kl_pet_homework',
    category: 'school',
    title: 'The homework incident',
    text: 'I left my homework on the floor for one minute and {{person}} got to it first. What is left would not cover a sandwich. My teacher has heard this excuse before, from everyone.',
    minAge: 7,
    maxAge: 12,
    weight: 1,
    once: true,
    conditions: [{ enrolled: true }],
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'evidence',
        label: 'Bring the evidence in a bag',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I brought the shreds in a sandwich bag. My teacher laughed so hard I got an extra day.', kind: 'good' }],
            else: [{ grade: -2 }, { stat: 'happiness', delta: -2 }, { log: 'My teacher studied the bag and said "nice try". A zero, and a speech about excuses.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'redo',
        label: 'Redo it all at breakfast',
        effects: [{ grade: 1 }, { stat: 'health', delta: -1 }, { stat: 'happiness', delta: -2 }, { log: 'I redid it over cereal with {{person}} watching. It came out better the second time.' }],
      },
      {
        id: 'forgot',
        label: 'Just say I forgot it',
        effects: [{ grade: -1 }, { karma: -1 }, { stat: 'happiness', delta: 1 }, { log: 'Nobody would believe the truth, so I said I forgot it. A late mark, but a dignified one.' }],
      },
    ],
  },

  // ----------------------------------------------------------- neighborhood
  {
    id: 'kl_box_of_balls',
    category: 'random',
    title: 'The box of balls',
    text: 'The grumpy man next door is moving away. This morning he left a cardboard box at the curb, full of every ball that ever flew over his fence, with a sign on it: YOURS, PROBABLY.',
    minAge: 7,
    maxAge: 12,
    weight: 1,
    once: true,
    choices: [
      {
        id: 'claim',
        label: 'Claim the whole box',
        effects: [{ stat: 'happiness', delta: 4 }, { karma: -1 }, { log: 'I dragged the whole box home. Forty-one balls. Some are older than me. All of them are mine now.' }],
      },
      {
        id: 'return',
        label: 'Return them door to door',
        effects: [
          { karma: 3 },
          { stat: 'happiness', delta: 2 },
          { log: 'I spent Saturday returning balls door to door. Half the kids on the street know my name now.', kind: 'good' },
          { chance: 0.5, then: [{ newPerson: { kind: 'friend', minAge: 6, maxAge: 12, relationship: 55, log: 'One of the balls belonged to {{person}}, who lives four houses down. We play every day now.' } }] },
        ],
      },
      {
        id: 'goodbye',
        label: 'Knock and say goodbye',
        effects: [{ karma: 2 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 1 }, { log: 'He said he only kept them because he could never throw. Then he showed me. He was right.' }],
      },
    ],
  },
  {
    id: 'kl_witch_house',
    category: 'random',
    title: 'The house at the end',
    text: 'The house at the end of our street has a sagging porch, a dead garden and curtains that twitch when nobody is home. Every kid knows a witch lives there. Tonight the other kids dared me to knock.',
    minAge: 7,
    maxAge: 12,
    weight: 1,
    once: true,
    choices: [
      {
        id: 'knock',
        label: 'Knock on the door',
        effects: [
          {
            random: [
              { weight: 3, effects: [{ stat: 'happiness', delta: 5 }, { karma: 1 }, { log: 'A tiny old woman gave me a cookie and asked me to help find her glasses. They were on her head.', kind: 'good' }] },
              { weight: 2, effects: [{ stat: 'happiness', delta: -3 }, { log: 'Nobody answered, but the curtain twitched. I ran so fast I left a shoe on the porch.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'peek',
        label: 'Peek through the window',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'Inside: three cats and an old TV playing game shows. Very disappointing, for a witch.' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'A face appeared in the window. I screamed. It was my own reflection. I am telling nobody.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'excuse',
        label: 'Say I have homework',
        effects: [{ stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 1 }, { log: 'I said I had homework, went home and, out of guilt, did some. The witch remains unconfirmed.' }],
      },
    ],
  },
  {
    id: 'kl_new_kid_next_door',
    category: 'friends',
    title: 'The moving truck',
    text: 'A moving truck pulled up next door this morning. Out climbed a kid about my age, wearing a cape and carrying a fishbowl with enormous care. There are no fish in the fishbowl.',
    minAge: 7,
    maxAge: 11,
    weight: 1.2,
    once: true,
    choices: [
      {
        id: 'hi',
        label: 'Go over and say hi',
        effects: [
          {
            chance: 0.75,
            then: [
              { stat: 'happiness', delta: 4 },
              { newPerson: { kind: 'friend', minAge: 7, maxAge: 11, relationship: 60, log: 'The new kid, {{person}}, explained the fishbowl: it is for a fish {{they}} hasn\'t met yet.' } },
            ],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I said hi. The new kid said "I am busy being sad about moving" and went inside. Fair.' }],
          },
        ],
      },
      {
        id: 'spy',
        label: 'Spy from my window first',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { newPerson: { kind: 'friend', minAge: 7, maxAge: 11, relationship: 55, log: '{{person}} waved at my window on day six. Busted. We have been friends ever since.' } }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'By the time I worked up the nerve, the new kid had made friends with everyone else.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'race',
        label: 'Challenge the new kid to race',
        effects: [
          {
            random: [
              { weight: 1, effects: [{ stat: 'happiness', delta: 3 }, { newPerson: { kind: 'friend', minAge: 7, maxAge: 11, relationship: 60, log: 'I won the race. {{person}} demanded a rematch every day for a month. Friends, basically.' } }] },
              { weight: 1, effects: [{ stat: 'happiness', delta: -1 }, { stat: 'health', delta: 1 }, { newPerson: { kind: 'friend', minAge: 7, maxAge: 11, relationship: 50, log: '{{person}} beat me by a mile, cape flapping. We have been racing ever since.' } }] },
            ],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------ presents and parties
  {
    id: 'kl_macaroni_present',
    category: 'holiday',
    title: 'The homemade present',
    text: "{{person}}'s birthday is tomorrow. I have a glue stick, half a bag of dry macaroni and a strong feeling that store-bought presents are for people with no imagination.",
    minAge: 6,
    maxAge: 10,
    weight: 1.2,
    once: true,
    person: PARENTS,
    choices: [
      {
        id: 'portrait',
        label: 'Make a macaroni portrait',
        effects: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 2 }, { log: 'A macaroni portrait of {{person}}. It looks like a potato with hair. It is on the fridge.', kind: 'good' }],
      },
      {
        id: 'coupons',
        label: 'Write a coupon book',
        effects: [{ relationship: 'person', delta: 4 }, { karma: 2 }, { log: 'Ten coupons: free hugs, one tidy room, one day of no arguing. {{person}} used that one first.', kind: 'good' }],
      },
      {
        id: 'slippers',
        label: 'Wrap something of {{their}} own',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 3 }, { log: 'I wrapped {{person}}\'s own slippers. {{They}} laughed for a full minute and put them on.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { log: 'I wrapped {{person}}\'s own slippers. "Oh. My slippers," {{they}} said, in a flat voice.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'kl_reindeer_sweater',
    category: 'holiday',
    title: 'The reindeer sweater',
    text: 'My great-aunt knitted me a sweater with a reindeer on it. It is two sizes too big, the reindeer looks frightened, and she is sitting right across the room, waiting for me to put it on.',
    minAge: 6,
    maxAge: 12,
    weight: 1.2,
    once: true,
    person: PARENTS,
    choices: [
      {
        id: 'wear',
        label: 'Put it on and beam',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: -2 }, { relationship: 'person', delta: 2 }, { log: 'I wore it all day. The reindeer and I suffered together. My great-aunt cried happy tears.', kind: 'good' }],
      },
      {
        id: 'polite',
        label: 'Call it very interesting',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 1 }, { log: '"It is very... interesting," I said. She beamed. {{person}} gave me a look that said "nice save".' }],
      },
      {
        id: 'receipt',
        label: 'Ask where the receipt is',
        effects: [
          { karma: -2 },
          {
            chance: 0.3,
            then: [{ money: 20 }, { stat: 'happiness', delta: 3 }, { log: 'My great-aunt laughed until she coughed, took the sweater back and gave me {{$20}} instead.', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -1 }, { relationship: 'person', delta: -3 }, { log: 'I asked about the receipt. The room went cold. The reindeer looked even more frightened.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'kl_party_nobody_came',
    category: 'holiday',
    title: 'Two forty',
    text: 'The invitations said two o\'clock. It is two forty. The balloons are drooping, the juice is warm, and the only ones at my birthday party are me, {{person}} and a bowl of chips.',
    minAge: 6,
    maxAge: 12,
    weight: 1,
    once: true,
    conditions: [{ enrolled: true }],
    person: PARENTS,
    choices: [
      {
        id: 'cake',
        label: 'Start the cake anyway',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'We cut the cake at two forty-five. At three the whole class arrived. There was half a cake.' }],
      },
      {
        id: 'window',
        label: 'Wait by the window',
        effects: [
          {
            chance: 0.8,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'At three the doorbell rang and did not stop. Half the invitations said three. Great party.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'Four kids came, all late, all sorry. Small party, big cake, more for me.' }],
          },
        ],
      },
      {
        id: 'call',
        label: 'Call everyone on the list',
        effects: [
          { stat: 'smarts', delta: 1 },
          { relationship: 'person', delta: 2 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { log: '{{person}} and I phoned around. Everyone was "just leaving". They all came, eventually.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'Half the numbers on the list were wrong. The other half had forgotten. Six kids came at four.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'kl_full_size_bars',
    category: 'holiday',
    title: 'Full-size bars',
    text: 'Halloween, and the news has spread up and down the street: the house on the corner is giving out full-size chocolate bars. My costume is a ghost made from a sheet with slightly uneven eyeholes.',
    minAge: 6,
    maxAge: 11,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ country: ['US', 'CA', 'GB', 'AU'] }],
    choices: [
      {
        id: 'twice',
        label: 'Go back as another ghost',
        effects: [
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I went back with the sheet on inside out. Two full-size bars. Pure genius.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The corner house lady said "nice to see you again" and gave me a box of raisins. Fair.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'trade',
        label: 'Trade my candy wisely',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I traded every lollipop for chocolate at two for one. The playground calls me the banker.' }],
      },
      {
        id: 'feast',
        label: 'Eat it all tonight',
        effects: [{ stat: 'happiness', delta: 4 }, { stat: 'health', delta: -3 }, { log: 'I ate the whole bag in one night. I saw colors. I regret nothing except my stomach.' }],
      },
    ],
  },

  // ------------------------------------------------------- the back seat
  {
    id: 'kl_back_seat_border',
    category: 'family',
    title: 'The back seat border',
    text: "Hour four of the family road trip. There is an invisible line down the middle of the back seat, and {{person}}'s elbow has been on my side of it for eleven minutes.",
    minAge: 6,
    maxAge: 12,
    weight: 1.2,
    cooldown: 3,
    conditions: [HAS_PARENT],
    person: { kind: ['sibling'], minAge: 4, maxAge: 17 },
    choices: [
      {
        id: 'defend',
        label: 'Defend the border',
        effects: [
          {
            random: [
              { weight: 1, effects: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: 2 }, { log: 'The elbow war spread to feet. From the front seat came the words "do not make me pull over".' }] },
              { weight: 1, effects: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -3 }, { log: 'I shoved the elbow back. {{person}} screamed like I had broken it. I lost my window seat.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'treaty',
        label: 'Negotiate a treaty',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 1 }, { log: '{{person}} gets the armrest, I get the window and the snack bag. The treaty held all the way there.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -1 }, { stat: 'happiness', delta: -2 }, { log: '{{person}} signed the treaty, took the armrest, and broke it at the first gas station.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'sleep',
        label: 'Fall asleep on {{them}}',
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'health', delta: 1 }, { log: "I fell asleep on {{person}}'s shoulder and drooled. {{They}} let me. We never talk about it." }],
      },
    ],
  },
  {
    id: 'kl_first_flight',
    category: 'random',
    title: 'First flight',
    text: 'My first time on a plane. My seat has a tiny window, a tray table and a card showing people calmly sliding down an inflatable slide. {{person}} is gripping the armrest harder than I am.',
    minAge: 6,
    maxAge: 12,
    weight: 0.8,
    once: true,
    person: PARENTS,
    choices: [
      {
        id: 'window',
        label: 'Glue my face to the window',
        effects: [
          {
            chance: 0.75,
            then: [{ stat: 'happiness', delta: 5 }, { stat: 'smarts', delta: 1 }, { log: 'From above, clouds look like a floor you could walk on. I did not blink for two hours.', kind: 'good' }],
            else: [{ stat: 'health', delta: -1 }, { stat: 'happiness', delta: -2 }, { log: 'I stared down at the tiny world until my stomach turned. The little paper bag came in handy.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'button',
        label: 'Press the call button',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 6 }, { log: 'A flight attendant came, laughed, and gave me a pair of plastic pilot wings. Worth it.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -1 }, { log: 'I pressed it five times. {{person}} held my hand for the rest of the flight, firmly.' }],
          },
        ],
      },
      {
        id: 'ask',
        label: 'Ask how planes stay up',
        effects: [{ stat: 'smarts', delta: 2 }, { relationship: 'person', delta: 2 }, { log: '{{person}} explained, badly, then admitted {{they}} has no idea. We held hands for takeoff.' }],
      },
    ],
  },
  {
    id: 'kl_theme_park_lost',
    category: 'childhood',
    title: 'Lost at the theme park',
    text: 'At the theme park I turned around by the spinning teacups and my whole family had been replaced by strangers in matching hats. The crowd is enormous and everyone in it is taller than me.',
    minAge: 6,
    maxAge: 10,
    weight: 1,
    once: true,
    person: PARENTS,
    choices: [
      {
        id: 'worker',
        label: 'Find a worker in uniform',
        effects: [
          { stat: 'smarts', delta: 2 },
          { relationship: 'person', delta: 2 },
          { stat: 'happiness', delta: -1 },
          { log: 'I found a park worker, like {{person}} taught me. My name echoed over every speaker. It worked.' },
        ],
      },
      {
        id: 'stay',
        label: 'Stay by the teacups',
        effects: [
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'I stayed put. Twenty minutes later {{person}} came running and hugged me hard enough to hurt.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I waited an hour by the teacups before they found me. The teacups never stopped spinning.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'ride',
        label: 'Go on a ride while waiting',
        effects: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: -4 }, { log: 'I rode the carousel four times while they searched. {{person}} found me on a horse, waving.' }],
      },
    ],
  },

  // ------------------------------------------------- tablets, calls, games
  {
    id: 'kl_tablet_timer',
    category: 'childhood',
    title: 'The timer',
    text: '{{person}} set a timer on the tablet: when it beeps, the tablet goes in the drawer. The timer says four minutes. My game says this level takes eleven.',
    minAge: 6,
    maxAge: 9,
    weight: 1.2,
    cooldown: 3,
    person: PARENTS,
    choices: [
      {
        id: 'handover',
        label: 'Hand it over at the beep',
        effects: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: -2 }, { log: 'I handed it over on the first beep. {{person}} felt my forehead for a fever.' }],
      },
      {
        id: 'beg',
        label: 'Beg for one more level',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 2 }, { log: '{{person}} gave me five more minutes. I needed eleven. I lost the level anyway.' }],
            else: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -2 }, { log: '"One more level" turned into "no tablet tomorrow". Bad negotiation.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'reset',
        label: 'Secretly reset the timer',
        effects: [
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I reset it three times before anyone noticed. I beat the level and felt like a master thief.' }],
            else: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -3 }, { log: '{{person}} noticed the timer going backward. The tablet lived in the drawer for a week.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'kl_forty_hats',
    category: 'money',
    title: 'Forty hats',
    text: 'My game sells gems, and gems buy hats for my character. I only meant to buy one hat. The tablet remembered the card. My character now owns forty hats, and a bill for {{$180}} arrives on Friday.',
    minAge: 7,
    maxAge: 11,
    weight: 1,
    once: true,
    person: PARENTS,
    choices: [
      {
        id: 'confess',
        label: 'Confess before Friday',
        hint: 'Family pays {{$180}}',
        effects: [
          { money: -180 },
          { karma: 2 },
          { relationship: 'person', delta: -1 },
          { stat: 'happiness', delta: -2 },
          { log: 'I confessed before the bill came. {{person}} took a deep breath and set up a password.' },
        ],
      },
      {
        id: 'undo',
        label: 'Secretly try to undo it',
        effects: [
          { karma: -1 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I found a refund button. Thirty-nine hats vanished. Nobody ever needed to know.', kind: 'good' }],
            else: [{ money: -180 }, { relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -2 }, { log: 'I pressed buttons until I had bought a forty-first hat. Then I confessed everything.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'chores',
        label: 'Offer to work it off',
        hint: 'Family pays {{$180}}',
        effects: [
          { money: -180 },
          { relationship: 'person', delta: 2 },
          { stat: 'happiness', delta: -3 },
          { log: '{{person}} accepted my offer to work off the hats in chores. I will be done around age thirty.' },
        ],
      },
    ],
  },
  {
    id: 'kl_eyebrow_call',
    category: 'family',
    title: 'The video call',
    text: 'My great-uncle is on a video call with us. He holds the phone so close that all we can see is one eyebrow and part of a ceiling fan. He has been talking for ten minutes. We think he is happy.',
    minAge: 6,
    maxAge: 12,
    weight: 1.2,
    cooldown: 3,
    conditions: [HAS_PARENT],
    choices: [
      {
        id: 'teach',
        label: 'Teach him to flip the camera',
        effects: [
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'Twenty minutes of "no, the other little button", and then his whole face appeared. We all cheered.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'He flipped it. Now we can see the ceiling fan in full detail. Progress.' }],
          },
        ],
      },
      {
        id: 'show',
        label: 'Put on a show for him',
        effects: [{ stat: 'happiness', delta: 3 }, { karma: 1 }, { log: 'I did my whole dance routine for the eyebrow. It said it was the best thing it had ever seen.', kind: 'good' }],
      },
      {
        id: 'talk',
        label: 'Talk to the eyebrow',
        effects: [{ stat: 'happiness', delta: 1 }, { karma: 1 }, { stat: 'smarts', delta: 1 }, { log: 'I told the eyebrow all about school. It listened better than most faces do.' }],
      },
    ],
  },
  {
    id: 'kl_game_night',
    category: 'family',
    title: 'Game night',
    text: 'Family game night. {{person}} has won the property board game nine times in a row, and tonight I finally saw why: a small stack of extra play money tucked under {{their}} side of the board.',
    minAge: 6,
    maxAge: 12,
    weight: 1,
    once: true,
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather', 'sibling'], minAge: 8 },
    choices: [
      {
        id: 'expose',
        label: 'Expose the cheating',
        effects: [
          {
            random: [
              { weight: 1, effects: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: -2 }, { log: 'I lifted the board. Play money everywhere. {{person}} was stripped of all nine titles.', kind: 'good' }] },
              { weight: 1, effects: [{ stat: 'happiness', delta: -1 }, { relationship: 'person', delta: -1 }, { log: '{{person}} called it "the bank\'s emergency fund". Somehow the game just went on.' }] },
            ],
          },
        ],
      },
      {
        id: 'cheat',
        label: 'Cheat right back',
        effects: [
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I slipped a few bills under my side too, and won. We both know. Neither of us will say.' }],
            else: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -3 }, { log: 'I got caught on my very first try. {{person}}, somehow, still got away with it.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'fair',
        label: 'Win it fair and square',
        effects: [
          { karma: 1 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: 6 }, { stat: 'smarts', delta: 2 }, { log: 'I beat a cheater, honestly. It is the greatest victory of my life so far.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { stat: 'smarts', delta: 1 }, { log: 'I lost, honestly. {{person}} won a tenth time. Someday.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'kl_game_chat',
    category: 'childhood',
    title: 'Game chat',
    text: "Someone in my game's chat has been really nice to me all week. Today they said they are my age and asked which school I go to, and whether I'm home alone after school.",
    minAge: 8,
    maxAge: 12,
    weight: 1,
    once: true,
    person: PARENTS,
    choices: [
      {
        id: 'show',
        label: 'Show {{person}} the chat',
        effects: [
          { relationship: 'person', delta: 3 },
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: -1 },
          { log: '{{person}} read it, went quiet and reported the account. We had a long talk. Right call.', kind: 'good' },
        ],
      },
      {
        id: 'block',
        label: 'Block them myself',
        effects: [{ stat: 'smarts', delta: 2 }, { karma: 1 }, { log: 'I blocked them without answering. My stomach felt funny for a day. Then it did not.' }],
      },
      {
        id: 'answer',
        label: 'Answer the questions',
        effects: [
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -3 }, { log: '{{person}} saw the chat over my shoulder. The account was reported and my game got paused.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: -4 }, { stat: 'smarts', delta: 2 }, { log: 'The questions got weirder. I got scared and told {{person}} everything. Account reported.', kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------- wealthy and poor
  {
    id: 'kl_booked_week',
    category: 'childhood',
    title: 'Every afternoon booked',
    text: 'My week: violin on Monday, fencing on Tuesday, Mandarin on Wednesday, junior chess on Thursday, and on Friday a tutor to go over everything I forgot since Monday. I have not seen a playground since spring.',
    minAge: 7,
    maxAge: 12,
    weight: 1,
    once: true,
    conditions: [{ flag: 'wealthyFamily' }],
    person: PARENTS,
    choices: [
      {
        id: 'drop',
        label: 'Beg to drop one',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: 1 }, { log: '{{person}} let me drop fencing. Tuesdays are now for lying on the grass. I am thriving.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -2 }, { log: '{{person}} said I would thank {{them}} later. I am still waiting to feel thankful.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'all',
        label: 'Keep it all going',
        effects: [{ stat: 'smarts', delta: 5 }, { stat: 'happiness', delta: -4 }, { stat: 'health', delta: -1 }, { log: 'I kept everything. I can now say "I am tired" four ways, including on the violin.' }],
      },
      {
        id: 'cough',
        label: 'Fake a cold on Tuesday',
        effects: [
          { karma: -1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I coughed artistically and spent Tuesday on the couch. My best fencing lesson ever.' }],
            else: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -2 }, { log: 'My cold cleared up the second fencing was canceled. {{person}} noticed.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'kl_live_in_a_hotel',
    category: 'friends',
    title: 'Do you live in a hotel?',
    text: 'A girl from my class came over for the first time. She stood in our front hall, looked up at the chandelier, and asked very quietly whether we live in a hotel.',
    minAge: 7,
    maxAge: 12,
    weight: 1,
    once: true,
    conditions: [{ flag: 'wealthyFamily' }, { enrolled: true }],
    choices: [
      {
        id: 'laugh',
        label: 'Laugh it off',
        effects: [
          { stat: 'happiness', delta: 1 },
          { newPerson: { kind: 'friend', gender: 'female', minAge: 7, maxAge: 12, relationship: 50, log: 'I laughed it off. {{person}} said her whole apartment would fit in our hall. Then we played.' } },
        ],
      },
      {
        id: 'tour',
        label: 'Give her the grand tour',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { newPerson: { kind: 'friend', gender: 'female', minAge: 7, maxAge: 12, relationship: 55, log: 'The tour took an hour and {{person}} loved the pool most. We are friends now, the normal kind.' } }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'By Monday the whole class knew about the pool. Some kids are nice to me now, for the pool.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'humble',
        label: "Say it's not my money",
        effects: [{ karma: 2 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }, { log: 'I said it is not my money, I just live here. She looked at me like I was forty years old.' }],
      },
    ],
  },
  {
    id: 'kl_hole_in_shoe',
    category: 'family',
    title: 'The hole in my shoe',
    text: 'There is a hole in the toe of my left shoe, and when it rains my sock drinks the puddle. {{person}} is at the kitchen table with the bills and asked, without looking up, if my shoes are still okay.',
    minAge: 6,
    maxAge: 12,
    weight: 1.2,
    once: true,
    conditions: [{ flag: 'poorFamily' }],
    person: PARENTS,
    choices: [
      {
        id: 'fine',
        label: "Say they're fine",
        effects: [{ karma: 2 }, { stat: 'health', delta: -2 }, { relationship: 'person', delta: 1 }, { log: 'I said they were fine and walked around puddles for two months, until there was money.' }],
      },
      {
        id: 'show',
        label: 'Show {{them}} the hole',
        hint: 'Family pays {{$40}}',
        effects: [
          { money: -40 },
          { relationship: 'person', delta: 2 },
          { stat: 'happiness', delta: 2 },
          { log: '{{person}} sighed, then smiled. We found shoes at the thrift store that fit almost perfectly.', kind: 'good' },
        ],
      },
      {
        id: 'tape',
        label: 'Fix it with tape',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'looks', delta: -1 }, { stat: 'happiness', delta: 1 }, { log: 'Two layers of tape and a bread bag inside. Waterproof, mostly. A kid called them robot shoes.' }],
      },
    ],
  },
  {
    id: 'kl_no_present_money',
    category: 'friends',
    title: 'The invitation',
    text: '{{person}} invited me to {{their}} birthday party. Everyone will bring a present. I know without asking that there is no money for one this month, so I have not asked.',
    minAge: 6,
    maxAge: 12,
    weight: 1,
    once: true,
    conditions: [{ flag: 'poorFamily' }],
    person: { kind: ['friend', 'bestFriend'], maxAge: 14 },
    choices: [
      {
        id: 'comic',
        label: 'Draw {{them}} a comic',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 2 }, { log: 'I drew {{person}} a comic where {{they}} saves the world. It was the present {{they}} liked best.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: -3 }, { log: 'A kid asked loudly where my real present was. {{person}} kept the comic anyway.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'toy',
        label: 'Give {{them}} my favorite toy',
        effects: [{ relationship: 'person', delta: 4 }, { karma: 2 }, { stat: 'happiness', delta: -3 }, { log: 'I wrapped my best toy in newspaper. {{person}} loved it. I miss it a little every day.' }],
      },
      {
        id: 'skip',
        label: 'Make an excuse and stay home',
        effects: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 1 }, { log: 'I said I was busy. I built a cardboard city all afternoon and tried not to imagine the cake.', kind: 'bad' }],
      },
    ],
  },

  // ---------------------------------------------- one parent, new stepparent
  {
    id: 'kl_thursday_dinners',
    category: 'family',
    title: 'Thursday dinners',
    text: "{{person}} is raising me on {{their}} own, and on Thursdays {{they}} doesn't get home until late. So on Thursdays I am in charge of dinner. So far, dinner has meant toast, in a variety of styles.",
    minAge: 9,
    maxAge: 12,
    weight: 1.2,
    once: true,
    conditions: [{ any: [{ noPerson: ['mother'] }, { noPerson: ['father'] }] }, { noPerson: ['stepmother', 'stepfather'] }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'cook',
        label: 'Learn to cook something real',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'smarts', delta: 2 }, { stat: 'health', delta: 2 }, { relationship: 'person', delta: 5 }, { log: 'I learned pasta from a library book. {{person}} came home to a hot dinner and had to sit down.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I tried pasta and set off the smoke alarm. A neighbor came over. We had toast.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'toast',
        label: 'Perfect the toast',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'health', delta: -1 }, { log: 'Cinnamon toast, cheese toast, toast with a face. I am an artist of one ingredient.' }],
      },
      {
        id: 'wait',
        label: 'Wait up to eat together',
        effects: [{ relationship: 'person', delta: 4 }, { stat: 'health', delta: -1 }, { stat: 'happiness', delta: 1 }, { log: 'On Thursdays I wait up so we can eat together at nine. Late, but it is our time.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'kl_mom_getting_married',
    category: 'family',
    title: 'Big news at dinner',
    text: 'For a year {{person}} has been going out on Friday nights with a man {{they}} met in the line at the bakery. Tonight {{they}} bought my favorite ice cream, which is how I knew it was serious: they are getting married.',
    minAge: 6,
    maxAge: 10,
    weight: 1.5,
    once: true,
    conditions: [{ noPerson: ['father'] }, { noPerson: ['stepfather'] }],
    person: { kind: ['mother'], maxAge: 55 },
    choices: [
      {
        id: 'happy',
        label: 'Be happy for {{them}}',
        effects: [
          { relationship: 'person', delta: 4 },
          { stat: 'happiness', delta: 3 },
          { newPerson: { kind: 'stepfather', gender: 'male', minAge: 25, maxAge: 60, relationship: 60, log: '{{mother}} married {{person}} in the spring. He makes pancakes on Sundays. I could get used to this.' } },
        ],
      },
      {
        id: 'name',
        label: 'Ask what I call him',
        effects: [
          { stat: 'smarts', delta: 1 },
          { relationship: 'person', delta: 1 },
          { newPerson: { kind: 'stepfather', gender: 'male', minAge: 25, maxAge: 60, relationship: 45, log: '{{mother}} married {{person}}. He said I can call him by his name, so I do, carefully.' } },
        ],
      },
      {
        id: 'refuse',
        label: 'Beg {{them}} not to',
        effects: [
          { relationship: 'person', delta: -4 },
          {
            chance: 0.25,
            then: [{ stat: 'happiness', delta: 2 }, { log: '{{person}} called the wedding off. {{They}} said it was not because of me. It was a little because of me.' }],
            else: [
              { stat: 'happiness', delta: -3 },
              { newPerson: { kind: 'stepfather', gender: 'male', minAge: 25, maxAge: 60, relationship: 20, log: 'I sulked through the whole wedding. {{person}} moved in anyway, with a fish tank and patience.' } },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'kl_fridge_rules',
    category: 'family',
    title: 'The fridge list',
    text: "{{person}} has put a list of house rules on the fridge. Most of them are fine. Rule four is about my shoes, rule seven is about my music, and rule nine just says 'We'll see.'",
    minAge: 7,
    maxAge: 12,
    weight: 1.5,
    once: true,
    person: { kind: ['stepfather', 'stepmother'] },
    choices: [
      {
        id: 'follow',
        label: 'Follow the list',
        effects: [{ relationship: 'person', delta: 4 }, { karma: 1 }, { stat: 'happiness', delta: -2 }, { log: 'I followed the list, even rule four. {{person}} noticed, and quietly crossed out rule nine.', kind: 'good' }],
      },
      {
        id: 'add',
        label: 'Add my own rules',
        effects: [
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 3 }, { log: 'I added rule ten: "Pancakes on Sundays." {{person}} laughed and signed it.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { log: 'I added a rule about {{their}} snoring. {{person}} did not find it as funny as I did.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore rule four',
        effects: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: 2 }, { log: 'My shoes stay where they land. {{person}} sighs every time. A cold war, but a quiet one.' }],
      },
    ],
  },
  {
    id: 'kl_step_pickup',
    category: 'family',
    title: 'Who is that?',
    text: 'For the first time, {{person}} picked me up from school instead of my usual ride. Three kids asked who {{they}} was before I even reached the gate, and {{they}} was waving with both arms.',
    minAge: 7,
    maxAge: 12,
    weight: 1.2,
    once: true,
    conditions: [{ enrolled: true }],
    person: { kind: ['stepfather', 'stepmother'] },
    choices: [
      {
        id: 'introduce',
        label: 'Introduce {{them}} properly',
        effects: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 1 }, { log: 'I said "This is {{person}}. {{They}} is family." Out loud, for the first time. It felt okay.', kind: 'good' }],
      },
      {
        id: 'driver',
        label: 'Say {{they}} is just my ride',
        effects: [{ karma: -1 }, { relationship: 'person', delta: -3 }, { log: 'I told the kids {{person}} was just my ride. {{They}} heard, and was quiet the whole way home.', kind: 'bad' }],
      },
      {
        id: 'run',
        label: 'Hide in the car',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'I dove into the back seat. {{person}} laughed and said {{they}} was embarrassing on purpose.' }],
            else: [{ relationship: 'person', delta: -1 }, { stat: 'happiness', delta: -1 }, { log: 'I hid in the car. {{person}} asked if {{they}} had done something wrong. Not really.' }],
          },
        ],
      },
    ],
  },
];

import type { EventDef } from '@/engine/events/schema';

/**
 * Ages 12-17, told by the teen: money of my own (allowance, saving up, lunch
 * money, a scam message), informal work paid through events (babysitting,
 * lawns, dogs, a summer at the snack stand), part-time job life, the early
 * teens (a locker, a growth spurt, a first phone, the grade group chat),
 * life online, birthdays 12-15, a family New Year's, first romance at 16-17,
 * teen pet owners, days out of school, and learning to drive with an aunt.
 *
 * Minors never pay an event cost themselves (effects.ts sends it to their
 * parents), so teen money here is earned through the event: a choice that
 * earns and spends inside the story adds only what is left over.
 *
 * Teens here are born 1975-2010, so phone and online cards carry a { year } gate
 * (texting from 2000, smartphones, apps and posting from 2010) and the rest are
 * written so they read the same in 1990 and in 2025.
 */
export const TEEN_LIFE_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ early teens
  {
    id: 'tl_first_phone',
    category: 'family',
    title: 'The phone contract',
    text: '{{person}} handed me my first phone today: a hand-me-down with a cracked corner and a contract written on notebook paper. Rule four is underlined twice. Rule four is "no phones at dinner."',
    minAge: 13,
    maxAge: 14,
    weight: 2,
    once: true,
    // A smartphone with apps (from 2010), and not after any card that already put a phone in my hand.
    conditions: [
      { year: { gte: 2010 } },
      { eventNotFired: 'tm_screen_time_intervention' },
      { eventNotFired: 'tm_lost_phone' },
      { eventNotFired: 'tm_chain_message' },
      { eventNotFired: 'tm_group_chat_drama' },
      { eventNotFired: 'sl_hallway_fight' },
      { eventNotFired: 'tl_grade_group_chat' },
      { eventNotFired: 'tl_scam_dm' },
      { eventNotFired: 'tl_app_permissions' },
      { eventNotFired: 'tl_regretted_post' },
      { eventNotFired: 'tl_mean_comments' },
      { eventNotFired: 'tl_wrong_chat' },
    ],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'sign',
        label: 'Sign the contract',
        effects: [
          { relationship: 'person', delta: 4 },
          { stat: 'happiness', delta: 1 },
          { log: 'I signed every rule, rule four included. {{person}} put the contract on the fridge.', kind: 'milestone' },
        ],
      },
      {
        id: 'negotiate',
        label: 'Negotiate the terms',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 3 }, { log: 'I got the phone curfew moved to ten. {{person}} called me a future lawyer, not kindly.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -1 }, { log: 'I argued about rule four for an hour. Rule four now has a rule five.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'download',
        label: 'Download everything at once',
        effects: [
          { stat: 'happiness', delta: 5 },
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -4 }, { log: 'On day three I used it at dinner. The phone spent a week in a kitchen drawer.', kind: 'bad' }],
            else: [{ stat: 'smarts', delta: -1 }, { log: 'Forty apps by midnight. The phone is now mostly notifications, and so am I.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tl_locker_combo',
    category: 'school',
    title: 'Right, left, right',
    text: 'This year I have a locker with a combination lock. Right twice to the first number, left past the second, right to the third. I have opened it once, by accident, and the bell rings in two minutes.',
    minAge: 13,
    maxAge: 14,
    weight: 2,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['middle', 'high'] }],
    choices: [
      {
        id: 'hand',
        label: 'Write it on my hand',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'The numbers on my palm lasted until gym class, when they washed off with my dignity.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 2 }, { log: 'The ink got me through September. By October my fingers knew it on their own.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'spin',
        label: 'Keep spinning until it opens',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 1 }, { log: 'Fourth try, it clicked open as the bell rang. I felt like a safecracker.', kind: 'good' }],
            else: [{ grade: -1 }, { stat: 'happiness', delta: -3 }, { log: 'Eleven tries. I was late, bookless and briefly famous for kicking a locker.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'custodian',
        label: 'Ask the custodian',
        effects: [
          { karma: 1 },
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: -1 },
          { log: 'The custodian opened it in two seconds and showed me the trick. I was still late.' },
        ],
      },
      {
        id: 'unlocked',
        label: 'Never lock it again',
        effects: [
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -4 }, { log: 'Someone borrowed my calculator from the open locker and returned a banana.', kind: 'bad' }],
            else: [{ log: 'I never locked it once. Nobody wanted my gym shorts, which is fair.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tl_growth_spurt',
    category: 'family',
    title: 'Four inches',
    text: 'I grew four inches over the summer. My jeans stop above my ankles, my sleeves end at my wrists, and my feet now enter rooms before I do. {{person}} noticed when I hit my head on the kitchen light.',
    minAge: 13,
    maxAge: 15,
    weight: 1.5,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'shop',
        label: 'Ask for new clothes',
        hint: 'Family pays {{$150}}',
        effects: [
          { money: -150 },
          { stat: 'looks', delta: 2 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -1 },
          { log: '{{person}} sighed and took me shopping. The new jeans fit for almost eight months.' },
        ],
      },
      {
        id: 'proud',
        label: 'Wear the short jeans proudly',
        effects: [
          { stat: 'looks', delta: -2 },
          { stat: 'happiness', delta: 2 },
          { log: 'I wore the short jeans all year and called it a look. Two kids copied it.' },
        ],
      },
      {
        id: 'cousin',
        label: "Take a cousin's hand-me-downs",
        effects: [
          { relationship: 'person', delta: 2 },
          { stat: 'happiness', delta: -1 },
          { log: "A cousin's hand-me-downs arrived in a trash bag. They fit. They are also very orange." },
        ],
      },
      {
        id: 'eat',
        label: 'Eat everything in the house',
        effects: [
          { stat: 'health', delta: 2 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: -2 },
          { log: 'Four sandwiches every afternoon. {{person}} started hiding the good cereal.' },
        ],
      },
    ],
  },
  {
    id: 'tl_health_class',
    category: 'school',
    title: 'The video',
    text: 'The health teacher wheeled in a TV cart, dimmed the lights and announced a video about "the changes our bodies are going through." Thirty people stopped breathing at once. Nobody wants to be the first to make a sound.',
    minAge: 13,
    maxAge: 14,
    weight: 1.5,
    once: true,
    conditions: [{ enrolled: true }],
    choices: [
      {
        id: 'notes',
        label: 'Take notes seriously',
        effects: [
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: -3 }, { log: 'Someone saw my notebook and read the word "armpits" aloud at lunch.', kind: 'bad' }],
            else: [{ log: 'I took careful notes. Later, privately, I was glad I had. Deodorant is real.' }],
          },
        ],
      },
      {
        id: 'joke',
        label: 'Whisper a joke',
        effects: [
          {
            chance: 0.55,
            then: [{ stat: 'happiness', delta: 4 }, { karma: -1 }, { log: 'One whispered joke and the whole row cracked. The teacher had clearly expected it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { grade: -1 }, { log: 'My joke landed in total silence. The teacher paused the video to look at me.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'sink',
        label: 'Sink very low in my seat',
        effects: [{ stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: -1 }, { log: 'I slid so low I was nearly under the desk. I learned nothing and survived everything.' }],
      },
    ],
  },
  {
    id: 'tl_grade_group_chat',
    category: 'friends',
    title: 'Four hundred messages',
    text: 'Someone added my whole grade to one group chat. By morning it had four hundred messages, two arguments, a poll about the cafeteria and the same frog sticker sent ninety times.',
    minAge: 13,
    maxAge: 14,
    weight: 2,
    once: true,
    conditions: [{ enrolled: true }, { year: { gte: 2010 } }],
    choices: [
      {
        id: 'mute',
        label: 'Mute it forever',
        effects: [
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -3 }, { log: 'Muted. I missed the one message moving the field trip, and showed up alone on the wrong day.', kind: 'bad' }],
            else: [{ stat: 'smarts', delta: 1 }, { log: 'Muted. My phone is quiet, I am at peace, and I know nothing about anything.' }],
          },
        ],
      },
      {
        id: 'frog',
        label: 'Send the frog',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'My frog was number ninety-one. It got thirty laughing faces, a personal best.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'My frog arrived just after frogs were banned. I was removed from the chat.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'moderate',
        label: 'Make myself the moderator',
        effects: [
          { energy: -1 },
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.5,
            then: [{ karma: 1 }, { stat: 'happiness', delta: 3 }, { log: 'I pinned the important stuff and deleted ninety frogs. People thanked me, mostly.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'Being in charge made me the enemy. There is now a second chat about me being in charge.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'leave',
        label: 'Leave the chat',
        effects: [
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -2 }, { log: '"{{name}} left" popped up for everyone, and three people asked if I was okay.' }],
            else: [{ log: 'I left quietly. Nobody noticed, which stung a little and helped a lot.' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ money
  {
    id: 'tl_allowance_raise',
    category: 'money',
    title: 'The raise',
    text: 'I have done the math, and I deserve a bigger allowance, or an allowance at all, depending on how you count. I asked {{person}} for a meeting. {{They}} agreed, smiling the way people smile at puppies.',
    minAge: 13,
    maxAge: 15,
    weight: 1.5,
    cooldown: 3,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'budget',
        label: 'Show my monthly budget',
        effects: [
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.6,
            then: [{ money: 200 }, { relationship: 'person', delta: 2 }, { log: 'My budget had a line called "emergencies." {{person}} funded that line and nothing else.', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: '{{person}} read my budget and asked why snacks were "essential." No raise.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'chores',
        label: 'Offer to do more chores',
        effects: [
          { money: 120 },
          { energy: -1 },
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: 3 },
          { log: 'I took on the dishes and the trash. The raise came through. So did the dishes, nightly.', kind: 'money' },
        ],
      },
      {
        id: 'compare',
        label: 'Mention what my friends get',
        effects: [
          {
            chance: 0.3,
            then: [{ money: 250 }, { log: 'Comparing allowances somehow worked. {{person}} said {{they}} did not want me left out.', kind: 'money' }],
            else: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -2 }, { log: "{{person}} said my friends' parents were welcome to adopt me. Meeting over.", kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tl_saving_up',
    category: 'money',
    title: 'The guitar in the window',
    text: 'A secondhand electric guitar has hung in the music shop window all winter, priced at {{$350}}. I visit it most afternoons, like a relative. The owner has started waving.',
    minAge: 13,
    maxAge: 17,
    weight: 1,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'earn',
        label: 'Earn it with odd jobs',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 6 },
          { stat: 'smarts', delta: 1 },
          { log: 'Four months of raking, babysitting and saying yes. I paid for the guitar in full.', kind: 'good' },
        ],
      },
      {
        id: 'ask',
        label: 'Ask {{person}} to buy it',
        hint: 'Family pays {{$350}}',
        effects: [
          { money: -350 },
          { relationship: 'person', delta: -3 },
          { stat: 'happiness', delta: 5 },
          { log: '{{person}} bought it as an early birthday present and mentioned it at every dinner.' },
        ],
      },
      {
        id: 'bank',
        label: 'Earn it, then keep the money',
        effects: [
          { money: 350 },
          { energy: -1 },
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: -3 },
          { log: 'I earned every dollar, then could not spend it. {{$350}} saved. The guitar sold.', kind: 'money' },
        ],
      },
    ],
  },
  {
    id: 'tl_lunch_money',
    category: 'friends',
    title: 'Just until tomorrow',
    text: '{{person}} forgot {{their}} lunch money again and asked to borrow mine "just until tomorrow." That is what {{they}} said last time. Last time, tomorrow never came.',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ enrolled: true }],
    // Someone who eats in my cafeteria, not a little kid or a grown-up friend.
    person: { kind: ['friend', 'bestFriend'], minAge: 12, maxAge: 18 },
    choices: [
      {
        id: 'lend',
        label: 'Lend it anyway',
        effects: [
          { stat: 'health', delta: -1 },
          { relationship: 'person', delta: 5 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: 2 }, { log: '{{person}} paid me back the next day, plus a candy bar as interest.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'Tomorrow never came, again. I skipped lunch. I now think of it as my {{person}} tax.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'split',
        label: 'Split my lunch instead',
        effects: [
          { relationship: 'person', delta: 2 },
          { karma: 2 },
          { stat: 'health', delta: -1 },
          { stat: 'happiness', delta: -1 },
          { log: 'We split my sandwich down the middle. Nobody owes anybody anything, which is nice.', kind: 'good' },
        ],
      },
      {
        id: 'remind',
        label: 'Bring up last time',
        effects: [
          {
            chance: 0.5,
            then: [{ money: 10 }, { stat: 'smarts', delta: 1 }, { log: '{{person}} went red and paid back the old debt in coins. Fair is fair.', kind: 'money' }],
            else: [{ relationship: 'person', delta: -5 }, { log: '{{person}} said I was keeping score. I was. We ate apart that day.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'no',
        label: 'Say no',
        effects: [
          { relationship: 'person', delta: -3 },
          { karma: -1 },
          { stat: 'health', delta: 1 },
          { log: 'I ate my lunch. {{person}} ate a ketchup packet. I felt bad all through math.' },
        ],
      },
    ],
  },
  {
    id: 'tl_scam_dm',
    category: 'money',
    title: 'Easy money',
    text: 'A message from an account with no followers: "Earn {{$500}} a week from your phone! No experience needed! Just pay the {{$25}} starter fee and send your login." The profile picture is a sports car parked in front of a different sports car.',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ year: { gte: 2010 } }],
    choices: [
      {
        id: 'block',
        label: 'Block and report',
        effects: [{ stat: 'smarts', delta: 1 }, { karma: 1 }, { log: 'Blocked and reported. The same account had already messaged half the people I know.' }],
      },
      {
        id: 'warn',
        label: 'Warn everyone I know',
        effects: [
          { karma: 2 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 3 }, { relationship: 'friend', delta: 2 }, { log: 'Two people I know had been about to reply. I am the hero of a very small story.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I posted a warning. Someone replied that I was obviously the scammer.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'waste',
        label: "Waste the scammer's time",
        effects: [
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -5 }, { stat: 'smarts', delta: 2 }, { log: 'I clicked their "verification" link mid-prank. They got my account. I got a hard lesson.', kind: 'bad' }],
            else: [{ log: 'I asked forty questions about the starter fee. They blocked me first, which counts as winning.', kind: 'good' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ informal work
  {
    id: 'tl_babysitting_gig',
    category: 'money',
    title: 'The twins',
    text: 'The family across the street asked me to watch their twins on Friday night: {{$40}}, all the frozen pizza I can eat, and a list of rules that ends with "they will try to negotiate."',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 2,
    choices: [
      {
        id: 'bedtime',
        label: 'Board games, then bedtime',
        effects: [
          { money: 40 },
          { karma: 1 },
          { flag: 'tl_babysitter' },
          {
            chance: 0.5,
            then: [{ money: 160 }, { log: 'Board games, baths, bed by eight. They booked me every Friday until summer.', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'Bedtime took three hours and four glasses of water. I earned every cent of that {{$40}}.', kind: 'money' }],
          },
        ],
      },
      {
        id: 'late',
        label: 'Let them stay up',
        effects: [
          { money: 40 },
          { stat: 'happiness', delta: 3 },
          { flag: 'tl_babysitter' },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -3 }, { log: 'The twins told on me at breakfast. I was not asked back.', kind: 'bad' }],
            else: [{ log: 'Two movies and all the pizza. The twins told their parents I was the best. I was.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'friend',
        label: 'Bring a friend along',
        conditions: [{ hasPerson: ['friend', 'bestFriend'] }],
        effects: [
          { money: 20 },
          { stat: 'happiness', delta: 4 },
          { relationship: 'friend', delta: 2 },
          { flag: 'tl_babysitter' },
          {
            chance: 0.35,
            then: [{ stat: 'happiness', delta: -3 }, { log: 'The parents came home early and found two babysitters. Nobody said anything. Nobody called again.', kind: 'bad' }],
            else: [{ log: 'My friend and I split the money evenly and the pizza unevenly. The twins loved having two of us.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Say I am busy',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I said I was busy Friday. I was busy doing nothing, which I am very good at.' }],
      },
    ],
  },
  {
    id: 'tl_babysit_lockout',
    category: 'random',
    title: 'Locked out',
    text: "I stepped onto the back porch to take out the trash, and the four-year-old I'm babysitting locked the door behind me. She is waving through the glass, holding a cookie she is not allowed to have.",
    minAge: 13,
    maxAge: 17,
    weight: 1,
    once: true,
    // Only for a teen who actually took a babysitting job in tl_babysitting_gig.
    conditions: [{ flag: 'tl_babysitter' }],
    choices: [
      {
        id: 'negotiate',
        label: 'Negotiate through the glass',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I offered a second cookie for the door. She took the deal. A born negotiator.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'She countered with "no" and walked off. I climbed in through the laundry window.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'call',
        label: 'Call her parents',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: -3 }, { log: 'Her parents left dinner early. They were very nice about it and have not called since.' }],
      },
      {
        id: 'window',
        label: 'Climb in a window',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'I came in through the laundry window and landed in a basket of towels. She applauded.', kind: 'good' }],
            else: [{ injury: 2 }, { stat: 'happiness', delta: -2 }, { log: 'The laundry window was smaller than it looked. I got in, with a scraped shin.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'wait',
        label: 'Wait her out',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'smarts', delta: 1 }, { log: 'Ten minutes later she got bored and opened it herself. Patience is a parenting skill.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'She fell asleep on the kitchen floor, cookie in hand. I sat outside until her parents got home.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tl_lawn_route',
    category: 'money',
    title: 'The lawn route',
    text: 'Three houses on my street pay me to mow their lawns every Saturday this summer. The mower belongs to the man at the end of the block. It is older than I am and starts on the ninth pull.',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 3,
    choices: [
      {
        id: 'more',
        label: 'Take on more lawns',
        effects: [
          { money: 400 },
          { energy: -1 },
          { stat: 'health', delta: 2 },
          {
            chance: 0.25,
            then: [{ injury: 2 }, { log: 'Eight lawns a week made me {{$400}}. I also sprained an ankle on a garden gnome.', kind: 'bad' }],
            else: [{ log: 'Eight lawns a week by July. {{$400}} and a tan line shaped like a sock.', kind: 'money' }],
          },
        ],
      },
      {
        id: 'three',
        label: 'Keep it to three',
        effects: [{ money: 180 }, { stat: 'happiness', delta: 2 }, { log: 'Three lawns, {{$180}}, and every Saturday afternoon to myself.', kind: 'money' }],
      },
      {
        id: 'raise',
        label: 'Raise my prices',
        effects: [
          {
            chance: 0.5,
            then: [{ money: 250 }, { stat: 'smarts', delta: 1 }, { log: 'I raised my price and nobody blinked. {{$250}} for the same three lawns.', kind: 'money' }],
            else: [{ money: 90 }, { stat: 'happiness', delta: -2 }, { log: 'Two neighbors found a cheaper kid. I kept one lawn and made {{$90}}.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tl_dog_walking',
    category: 'money',
    title: 'Four leashes',
    text: "I walk four of the neighbors' dogs every afternoon, paid by the week. Today, halfway around the park, all four of them saw the same squirrel at the same time.",
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 3,
    choices: [
      {
        id: 'hold',
        label: 'Hold on with everything',
        effects: [
          { money: 120 },
          {
            chance: 0.6,
            then: [{ stat: 'health', delta: 1 }, { stat: 'happiness', delta: 3 }, { log: 'I dug in my heels and held all four. The squirrel escaped. My arms are longer now.', kind: 'good' }],
            else: [{ injury: 2 }, { log: 'They dragged me across the grass on my stomach. Nobody let go, including me.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'letgo',
        label: 'Let go of the big one',
        effects: [
          { karma: -2 },
          {
            chance: 0.6,
            then: [{ money: 120 }, { stat: 'happiness', delta: 1 }, { log: 'The big one came back on his own, muddy and proud. I did not mention it to his owners.' }],
            else: [{ money: 90 }, { stat: 'happiness', delta: -4 }, { log: 'The big one ran home and barked at his own door until his owners came out. I lost a client.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'sit',
        label: 'Shout "Sit!"',
        effects: [
          { money: 120 },
          {
            chance: 0.35,
            then: [{ stat: 'happiness', delta: 5 }, { stat: 'smarts', delta: 1 }, { log: 'I shouted "Sit!" and, by some miracle, all four sat. A man on a bench clapped.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I shouted "Sit!" The dogs ignored me. A man on a bench sat down.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tl_snack_stand_job',
    category: 'money',
    title: 'The snack stand',
    text: 'The snack stand at the public pool is hiring for the summer. The pay is low, the fryer is ancient and the uniform includes a visor. Everyone who works there smells faintly of popcorn until September.',
    minAge: 14,
    maxAge: 17,
    weight: 1.5,
    once: true,
    conditions: [{ hasJob: false }],
    choices: [
      {
        id: 'take',
        label: 'Take the job',
        effects: [
          { energy: -1 },
          { stat: 'health', delta: -1 },
          { log: 'By Wednesday I could fill a slushie without looking. By Friday I had a tan line shaped like a visor.' },
          { chance: 0.4, then: [{ newPerson: { kind: 'friend', minAge: 14, maxAge: 18, relationship: 55, log: '{{person}}, who works the register next to mine, became a friend over our shared fear of the fryer.' } }] },
          { queue: 'tl_snack_stand_paycheck' },
        ],
      },
      {
        id: 'icecream',
        label: 'Ask for the ice cream window',
        effects: [
          { energy: -1 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'They gave me the ice cream window. No fryer, and my scooping arm is getting strong.', kind: 'good' }],
            else: [{ stat: 'health', delta: -1 }, { log: "The ice cream window went to the manager's nephew. I got the fryer.", kind: 'bad' }],
          },
          { queue: 'tl_snack_stand_paycheck' },
        ],
      },
      {
        id: 'free',
        label: 'Keep my summer free',
        effects: [{ stat: 'happiness', delta: 4 }, { log: 'I spent the summer at the pool on the other side of the snack stand. The view is better.' }],
      },
    ],
  },
  {
    id: 'tl_snack_stand_paycheck',
    category: 'money',
    title: 'First paycheck',
    text: 'My first paycheck from the snack stand came in an envelope with my name spelled almost right. Two weeks of work, {{$240}}, minus a line called "withholding" that nobody had mentioned.',
    minAge: 14,
    maxAge: 17,
    weight: 1,
    followUpOnly: true,
    choices: [
      {
        id: 'save',
        label: 'Save every paycheck',
        effects: [
          { money: 900 },
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: -1 },
          { flag: 'tl_first_paycheck' },
          { log: 'I saved every paycheck. By September I had {{$900}} and a deep respect for fryers.', kind: 'money' },
        ],
      },
      {
        id: 'spend',
        label: 'Spend as I go',
        effects: [
          { money: 250 },
          { stat: 'happiness', delta: 5 },
          { flag: 'tl_first_paycheck' },
          { log: 'Movies, snacks, a jacket. By September I had {{$250}} left and a great summer.', kind: 'money' },
        ],
      },
      {
        id: 'ask',
        label: 'Ask what withholding is',
        effects: [
          { money: 600 },
          { stat: 'smarts', delta: 3 },
          { flag: 'tl_first_paycheck' },
          { log: 'My manager explained taxes on a napkin. I saved most of it: {{$600}} by September.', kind: 'money' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ part-time job
  {
    id: 'tl_first_paycheck_job',
    category: 'work',
    title: 'Eleven lines',
    text: 'My first real paycheck from {{company}} arrived today. I had calculated the number in my head all week. The real number is smaller, and the stub has eleven lines I do not understand.',
    minAge: 14,
    maxAge: 17,
    weight: 2,
    once: true,
    conditions: [{ hasJob: true }, { partTime: true }, { flag: 'tl_first_paycheck', exists: false }],
    choices: [
      {
        id: 'account',
        label: 'Open a savings account',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { flag: 'tl_first_paycheck' },
          { log: 'I opened my first savings account. The teller shook my hand like I had bought a house.', kind: 'milestone' },
        ],
      },
      {
        id: 'read',
        label: 'Read every line',
        effects: [
          { stat: 'smarts', delta: 3 },
          { flag: 'tl_first_paycheck' },
          {
            chance: 0.3,
            then: [{ money: 60 }, { log: 'Line nine was wrong: two missing shifts. I got {{$60}} back and a reputation.', kind: 'money' }],
            else: [{ log: 'I read all eleven lines. I now understand four of them, which is four more than before.' }],
          },
        ],
      },
      {
        id: 'frame',
        label: 'Tape it to my wall',
        effects: [{ stat: 'happiness', delta: 4 }, { flag: 'tl_first_paycheck' }, { log: 'I taped the stub to my bedroom wall. Visitors are required to look at it.', kind: 'milestone' }],
      },
    ],
  },
  {
    id: 'tl_rude_customer',
    category: 'work',
    title: 'An actual adult',
    // Every teen part-time job (counter, daycare, pool, tutoring, deliveries) has customers and a manager,
    // but not all of them have a counter or a "back", so the text names neither.
    text: 'A grown man yelled at me at work today about something I had no control over, then demanded to speak to "an actual adult." I am {{age}}, and right now I am the closest thing available.',
    minAge: 14,
    maxAge: 17,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ hasJob: true }, { partTime: true }],
    choices: [
      {
        id: 'calm',
        label: 'Stay calm and polite',
        effects: [
          { jobPerformance: 4 },
          { karma: 1 },
          { stat: 'happiness', delta: -2 },
          { log: 'I said "I understand" nine times until he left. My manager said I handled it like a pro.', kind: 'good' },
        ],
      },
      {
        id: 'fetch',
        label: 'Call my manager',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'My manager repeated exactly what I had said. He accepted it from someone older.' }],
            else: [{ jobPerformance: -1 }, { stat: 'happiness', delta: -2 }, { log: 'My manager would not get involved. I said they were "in a meeting." The meeting was a sandwich.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'firm',
        label: 'Stand my ground',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 1 }, { log: 'I calmly explained the policy until he ran out of arguments. I felt seven feet tall.', kind: 'good' }],
            else: [{ jobPerformance: -4 }, { stat: 'happiness', delta: -3 }, { log: 'He complained about my "attitude." My manager sided with him, then apologized to me later.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tl_grades_vs_shifts',
    category: 'family',
    title: 'Hours and grades',
    text: '{{person}} found my last test at the bottom of my bag, under my work shirt. {{They}} put both on the kitchen table, side by side, and said we needed to talk about my hours.',
    minAge: 14,
    maxAge: 17,
    weight: 2,
    cooldown: 3,
    conditions: [{ hasJob: true }, { partTime: true }, { enrolled: true }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'cut',
        label: 'Cut my hours',
        effects: [
          { grade: 5 },
          { jobPerformance: -4 },
          { stat: 'happiness', delta: -1 },
          { relationship: 'person', delta: 3 },
          { log: 'I dropped to weekends only. My grades came back, my paycheck shrank, and {{person}} beamed.' },
        ],
      },
      {
        id: 'keep',
        label: 'Keep every shift',
        effects: [
          { grade: -4 },
          { jobPerformance: 3 },
          { relationship: 'person', delta: -3 },
          { stat: 'happiness', delta: 1 },
          { log: '{{person}} said it was my call, in the voice that means it was the wrong one.', kind: 'bad' },
        ],
      },
      {
        id: 'breaks',
        label: 'Study on my breaks',
        effects: [
          { energy: -1 },
          { grade: 3 },
          { jobPerformance: -1 },
          { stat: 'happiness', delta: -2 },
          { log: 'Flashcards in the break room. My coworkers quiz me now. Grades up, sleep down.' },
        ],
      },
    ],
  },
  {
    id: 'tl_quit_job',
    category: 'work',
    title: 'Back to school',
    text: 'School starts again next week, and {{company}} has put me down for four shifts a week. My manager says the whole team is counting on me. I have a week to decide whether they still can.',
    minAge: 14,
    maxAge: 17,
    weight: 1.5,
    once: true,
    conditions: [{ hasJob: true }, { partTime: true }, { enrolled: true }],
    choices: [
      {
        id: 'notice',
        label: "Give two weeks' notice",
        effects: [
          { karma: 2 },
          { grade: 2 },
          { stat: 'happiness', delta: 2 },
          { log: 'I gave notice and worked my last two weeks properly. My manager promised a good reference.' },
          { loseJob: true, reason: 'left' },
        ],
      },
      {
        id: 'weekends',
        label: 'Ask for fewer shifts',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 2 }, { grade: 1 }, { log: 'My manager grumbled and cut me to two shifts. Less money, more sleep.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'My manager said four shifts or nothing. I picked nothing, politely.', kind: 'bad' }, { loseJob: true, reason: 'left' }],
          },
        ],
      },
      {
        id: 'speech',
        label: 'Quit with a speech',
        effects: [
          { stat: 'happiness', delta: 5 },
          { karma: -2 },
          { log: 'I quit at the end of a shift with a short speech. It felt amazing for about an hour.' },
          { loseJob: true, reason: 'left' },
        ],
      },
      {
        id: 'all',
        label: 'Keep all four shifts',
        effects: [
          { grade: -5 },
          { energy: -1 },
          { jobPerformance: 5 },
          { log: 'I kept all four shifts. My manager loves me. My chemistry teacher forgot my name.' },
        ],
      },
    ],
  },
  {
    id: 'tl_classmates_at_work',
    category: 'work',
    title: 'The work shirt',
    text: 'Half my grade found out where I work. Today they all turned up at once, mid-shift, to see me in my work shirt. They are pointing. One of them is already taking a photo.',
    minAge: 14,
    maxAge: 17,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ hasJob: true }, { partTime: true }, { enrolled: true }],
    choices: [
      {
        id: 'stranger',
        label: 'Treat them like strangers',
        effects: [{ jobPerformance: 2 }, { stat: 'happiness', delta: -2 }, { log: 'I treated them with the blank politeness of a stranger. They loved it, sarcastically.' }],
      },
      {
        id: 'hide',
        label: 'Hide until they leave',
        effects: [{ jobPerformance: -2 }, { stat: 'happiness', delta: 1 }, { log: 'I hid until they left. A coworker covered for me and now owns me.' }],
      },
      {
        id: 'pose',
        label: 'Pose for the photo',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I struck a pose. The photo made the yearbook, which is more than my school picture ever did.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I struck a pose. It went around school with a caption I will not repeat.', kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ online
  {
    id: 'tl_app_permissions',
    category: 'random',
    title: 'Which sandwich am I?',
    text: 'A quiz app promises to tell me which sandwich I am. First it would like my contacts, my photos, my location, my microphone and, for some reason, the name of my first pet.',
    minAge: 13,
    maxAge: 17,
    weight: 1,
    cooldown: 4,
    conditions: [{ year: { gte: 2010 } }],
    choices: [
      {
        id: 'allow',
        label: 'Allow everything',
        effects: [
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -4 }, { log: 'I am a grilled cheese. The app then invited every contact I have, including my dentist.', kind: 'bad' }],
            else: [{ log: 'I am a grilled cheese. Since then, the ads on my phone know things about me.' }],
          },
        ],
      },
      {
        id: 'deny',
        label: 'Deny every permission',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }, { log: 'Without permissions the app would not tell me. I will never know which sandwich I am.' }],
      },
      {
        id: 'terms',
        label: 'Read the terms first',
        effects: [{ stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: -2 }, { log: 'Paragraph forty said they could sell my "sandwich profile." I deleted the app.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'tl_regretted_post',
    category: 'friends',
    title: 'Posted at 1 a.m.',
    text: 'At one in the morning I posted a long, dramatic message about "people who know what they did." Nobody did anything. By breakfast it had forty comments, all asking who.',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ year: { gte: 2010 } }],
    choices: [
      {
        id: 'delete',
        label: 'Delete it and say nothing',
        effects: [
          { stat: 'happiness', delta: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -3 }, { log: 'I deleted it, but three people had screenshots. It came up at lunch for a week.', kind: 'bad' }],
            else: [{ log: 'I deleted it before lunch. By Friday everyone had something new to talk about.' }],
          },
        ],
      },
      {
        id: 'lyrics',
        label: 'Say it was song lyrics',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'I said it was song lyrics. Someone asked which song. I invented a band.' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I said it was song lyrics. Someone searched for them. No such song exists.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'joke',
        label: 'Own it with a joke',
        effects: [
          {
            chance: 0.65,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I posted "update: I was tired." It got more likes than the original.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'My joke made it worse. Now people think I am hiding something. I was just tired.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'offline',
        label: 'Log off for a week',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 1 }, { relationship: 'friend', delta: -1 }, { log: 'I deleted the app for a week and read a whole book. It was weirdly great.' }],
      },
    ],
  },
  {
    id: 'tl_online_bully',
    category: 'friends',
    title: 'The anonymous account',
    text: "An anonymous account has been posting edited photos of {{person}} with cruel captions, and half the school follows it. {{person}} hasn't mentioned it once, which is how I know {{they}} has seen it.",
    minAge: 13,
    maxAge: 17,
    weight: 1,
    cooldown: 4,
    conditions: [{ enrolled: true }, { year: { gte: 2010 } }],
    // A friend at my school ("half the school follows it").
    person: { kind: ['friend', 'bestFriend'], minAge: 12, maxAge: 18 },
    choices: [
      {
        id: 'report',
        label: 'Report it and tell a teacher',
        effects: [
          { karma: 4 },
          {
            chance: 0.65,
            then: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 2 }, { log: 'The school had the account taken down in two days. {{person}} found out it was me and hugged me.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: -1 }, { log: 'The account went quiet, then came back under a new name. I reported that one too.' }],
          },
        ],
      },
      {
        id: 'private',
        label: 'Check on {{them}} privately',
        effects: [{ relationship: 'person', delta: 8 }, { karma: 2 }, { log: 'I told {{person}} the account was garbage and I was around. {{They}} wrote back for an hour.', kind: 'good' }],
      },
      {
        id: 'defend',
        label: 'Defend {{them}} in the comments',
        effects: [
          { karma: 2 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 2 }, { log: 'I called the account pathetic. Twenty people agreed, and the post came down.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: -4 }, { log: 'The account turned on me next. It hurt, but {{person}} and I faced it together.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'scroll',
        label: 'Keep scrolling',
        effects: [{ karma: -2 }, { stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -3 }, { log: 'I kept scrolling. Every time I saw {{person}} at school, I felt it.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'tl_mean_comments',
    category: 'family',
    title: 'No profile picture',
    text: "Someone with no profile picture has commented on every post I've made this month. Nothing I could call a threat. Just steady, careful meanness, always within the hour.",
    minAge: 13,
    maxAge: 17,
    weight: 1,
    cooldown: 4,
    conditions: [{ year: { gte: 2010 } }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'tell',
        label: 'Show {{person}} the comments',
        effects: [
          { relationship: 'person', delta: 5 },
          { stat: 'happiness', delta: 1 },
          { stat: 'smarts', delta: 1 },
          { fame: -1 },
          { log: '{{person}} did not panic. We reported, blocked and locked my account down. Then pancakes.', kind: 'good' },
        ],
      },
      {
        id: 'block',
        label: 'Block and report',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'A new account showed up a week later. I blocked that one faster.' }],
            else: [{ stat: 'happiness', delta: 2 }, { log: 'Blocked and reported. The comments stopped. Quiet is a good feeling.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'reply',
        label: 'Reply to them',
        effects: [
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'I replied once, calmly. They never commented again.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'I replied. They replied faster. I spent a weekend arguing with nobody.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'break',
        label: 'Take a break from posting',
        effects: [{ stat: 'happiness', delta: 3 }, { fame: -1 }, { log: 'I stopped posting for a month. The comments had nowhere to go. I liked myself more after.' }],
      },
    ],
  },
  {
    id: 'tl_online_friend',
    category: 'friends',
    title: 'Teammate from far away',
    text: 'For months the same player has been on my team in an online game almost every night. We talk strategy, then school, then everything. Today they asked if we could be friends outside the game.',
    minAge: 13,
    maxAge: 16,
    weight: 1,
    once: true,
    conditions: [{ year: { gte: 2003 } }],
    choices: [
      {
        id: 'friends',
        label: 'Be friends, carefully',
        effects: [
          { stat: 'happiness', delta: 3 },
          { energy: -1 },
          { newPerson: { kind: 'friend', minAge: 13, maxAge: 17, relationship: 60, log: '{{person}} lives across the country and became one of my closest friends. We have never met.' } },
        ],
      },
      {
        id: 'game',
        label: 'Keep it in the game',
        effects: [{ stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: 2 }, { log: 'I said I would rather keep it in the game. They understood. We still win a lot together.' }],
      },
      {
        id: 'overshare',
        label: 'Tell them everything',
        effects: [
          {
            chance: 0.5,
            then: [
              { stat: 'happiness', delta: 6 },
              { newPerson: { kind: 'friend', minAge: 13, maxAge: 17, relationship: 75, log: '{{person}} turned out to be exactly who {{they}} said: a teenager who also hates the swamp level.' } },
            ],
            else: [{ stat: 'happiness', delta: -4 }, { stat: 'smarts', delta: 2 }, { log: 'They asked for my school and my address. I blocked them and told an adult. Right call.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tl_squad_night',
    category: 'friends',
    title: 'The leaderboard',
    text: '{{person}} and I are one win away from the top of the weekend leaderboard. It is one in the morning. I have a test at eight. {{person}} has typed "last one, I swear" four times.',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ enrolled: true }, { year: { gte: 2005 } }],
    person: { kind: ['friend', 'bestFriend'], minAge: 11 },
    choices: [
      {
        id: 'play',
        label: 'Play the last one',
        effects: [
          { stat: 'health', delta: -1 },
          {
            chance: 0.45,
            then: [{ stat: 'happiness', delta: 6 }, { relationship: 'person', delta: 4 }, { grade: -2 }, { log: 'We won. Top of the leaderboard for six glorious hours. I took the test half asleep.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: 2 }, { grade: -3 }, { log: 'We lost that match and the next three. I took the test on two hours of sleep.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'sleep',
        label: 'Log off and sleep',
        effects: [{ grade: 1 }, { stat: 'health', delta: 1 }, { relationship: 'person', delta: -3 }, { log: '{{person}} played on without me and lost. I am told this was my fault.' }],
      },
      {
        id: 'rematch',
        label: 'Promise a rematch tomorrow',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 2 }, { grade: 1 }, { relationship: 'person', delta: 1 }, { log: 'We played the rematch after school and won. I passed the test, too.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { log: 'By the next day someone else had the top spot. {{person}} reminds me of this daily.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tl_viral_school',
    category: 'school',
    title: 'Background character',
    text: 'The school posted a video of the principal announcing the end of pizza Fridays. In the background, by accident, is me, visibly grieving. It has two hundred thousand views.',
    minAge: 13,
    maxAge: 17,
    weight: 1,
    once: true,
    conditions: [{ enrolled: true }, { year: { gte: 2010 } }],
    choices: [
      {
        id: 'lean',
        label: 'Lean into it',
        effects: [
          { fame: 2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'I wore black to school all week. A local news site called me "the face of pizza grief."', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'I wore black all week. Nobody got it. Somebody asked if my goldfish had died.' }],
          },
        ],
      },
      {
        id: 'petition',
        label: 'Start a petition',
        effects: [
          { karma: 2 },
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 6 }, { log: 'I used my moment to start a petition. Pizza Fridays returned. I am a minor legend.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The petition got nine hundred signatures and one reply: "budget reasons."', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'down',
        label: 'Ask them to take it down',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'The school took it down. It lives on in screenshots, as all things do.' }],
      },
      {
        id: 'ignore',
        label: 'Say nothing at all',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I said nothing. In a week the internet found someone else to grieve with.' }],
      },
    ],
  },
  {
    id: 'tl_wrong_chat',
    category: 'family',
    title: 'Wrong chat',
    text: 'I meant to send a friend a long complaint about {{person}} and the dishwasher rules. I sent it to the family group chat instead. A minute later, the little word "Read" appeared under it.',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 5,
    conditions: [{ hasPerson: ['friend', 'bestFriend'] }, { year: { gte: 2010 } }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'apologize',
        label: 'Apologize in person',
        effects: [
          { relationship: 'person', delta: 3 },
          { karma: 1 },
          { stat: 'happiness', delta: -2 },
          { log: 'I apologized in the kitchen. {{person}} said I had made some fair points, then handed me a sponge.' },
        ],
      },
      {
        id: 'hacked',
        label: 'Claim I was hacked',
        effects: [
          { karma: -2 },
          {
            chance: 0.25,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'I said I had been hacked. {{person}} believed me and changed the family passwords.' }],
            else: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -2 }, { log: '{{person}} asked why a hacker would know about the spoon drawer.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'compliment',
        label: 'Send a follow-up compliment',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I sent "...which is why you are the best parent ever." {{person}} replied with a laughing face.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { log: 'The compliment fooled nobody. The whole family saw it. It will come up at every holiday.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'dishes',
        label: 'Do the dishes silently',
        effects: [{ relationship: 'person', delta: 2 }, { energy: -1 }, { log: 'I said nothing and did the dishes for a week. Neither of us mentioned it. That is love, I think.' }],
      },
    ],
  },

  // ------------------------------------------------------------ birthdays
  {
    id: 'tl_birthday_12',
    category: 'childhood',
    title: 'Roller rink party',
    text: 'My twelfth birthday party is at the roller rink. {{person}} booked the party room and the cake. Half my class can skate. I am not in that half.',
    minAge: 12,
    maxAge: 12,
    weight: 2,
    once: true,
    conditions: [{ enrolled: true }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'skate',
        label: 'Skate anyway',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 5 }, { stat: 'health', delta: 1 }, { log: 'I fell nine times and got up nine times. By the cake I could almost turn.', kind: 'good' }],
            else: [{ injury: 2 }, { stat: 'happiness', delta: -2 }, { log: 'I fell during the birthday song and opened my presents holding an ice pack.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'wall',
        label: 'Hold on to the wall',
        effects: [{ stat: 'happiness', delta: 1 }, { stat: 'health', delta: 1 }, { log: 'I spent my own party clinging to the wall. Zero falls. Friends visited me there like an exhibit.' }],
      },
      {
        id: 'snacks',
        label: 'Run things from the snack bar',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'health', delta: -1 }, { log: 'I hosted from the snack bar. Everyone came to me eventually. Pizza is a strategy.' }],
      },
      {
        id: 'parent',
        label: 'Make {{person}} skate too',
        effects: [
          { relationship: 'person', delta: 4 },
          {
            random: [
              { weight: 50, effects: [{ stat: 'happiness', delta: 4 }, { log: 'I got {{person}} into skates. {{They}} was better than everyone. I had no idea.', kind: 'good' }] },
              { weight: 50, effects: [{ stat: 'happiness', delta: -2 }, { log: '{{person}} skated backward past my friends, singing. I have never been so embarrassed.', kind: 'bad' }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'tl_birthday_13',
    category: 'family',
    title: 'Officially thirteen',
    text: 'I am thirteen. Officially a teenager. {{person}} asked what I wanted to do for my birthday, then added "within reason" before I could open my mouth.',
    minAge: 13,
    maxAge: 13,
    weight: 2,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'party',
        label: 'Throw a big party',
        hint: 'Family pays {{$200}}',
        effects: [
          { money: -200 },
          { stat: 'happiness', delta: 6 },
          { relationship: 'person', delta: -1 },
          { log: 'Twenty kids, one karaoke machine, one noise complaint. {{person}} said "never again," smiling.', kind: 'good' },
        ],
      },
      {
        id: 'sleepover',
        label: 'Just my closest friends',
        conditions: [{ hasPerson: ['friend', 'bestFriend'] }],
        effects: [{ stat: 'happiness', delta: 4 }, { relationship: 'friend', delta: 3 }, { relationship: 'bestFriend', delta: 3 }, { log: 'A sleepover, my closest friends and pancakes at midnight. Thirteen started well.', kind: 'good' }],
      },
      {
        id: 'dinner',
        label: 'Dinner out with family',
        hint: 'Family pays {{$80}}',
        effects: [
          { money: -80 },
          { relationship: 'person', delta: 4 },
          { stat: 'happiness', delta: 2 },
          { log: 'The waiters sang to me. I died of embarrassment and secretly loved it.' },
        ],
      },
      {
        id: 'cash',
        label: 'Ask for cash instead',
        effects: [{ money: 100 }, { relationship: 'person', delta: -2 }, { stat: 'smarts', delta: 1 }, { log: '{{person}} handed me {{$100}} and said it was very grown-up of me, and slightly sad.', kind: 'money' }],
      },
    ],
  },
  {
    id: 'tl_birthday_14',
    category: 'friends',
    title: 'The locker',
    text: 'On my fourteenth birthday I found my locker covered in sticky notes, streamers and one balloon that had already given up. {{person}} was standing nearby, pretending to read a poster.',
    minAge: 14,
    maxAge: 14,
    weight: 2,
    once: true,
    conditions: [{ enrolled: true }],
    // A friend at my school, near my age.
    person: { kind: ['friend', 'bestFriend'], minAge: 13, maxAge: 16 },
    choices: [
      {
        id: 'hug',
        label: 'Hug {{them}} in the hallway',
        effects: [
          { relationship: 'person', delta: 6 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'I hugged {{person}} in front of everyone. Someone took a picture. It is in the yearbook now.' }],
            else: [{ log: 'I hugged {{person}} in front of everyone. {{They}} said it was no big deal, glowing.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'read',
        label: 'Read every sticky note',
        effects: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 3 }, { log: 'Two hundred sticky notes, mostly inside jokes. I kept every one in a shoebox.', kind: 'good' }],
      },
      {
        id: 'cool',
        label: 'Act cool about it',
        effects: [{ stat: 'looks', delta: 1 }, { relationship: 'person', delta: -2 }, { stat: 'happiness', delta: 1 }, { log: 'I said "cute" and walked to class. Later I went back and saved the balloon.' }],
      },
    ],
  },
  {
    id: 'tl_birthday_15',
    category: 'money',
    title: "My great-aunt's twenty",
    text: "My great-aunt's birthday card arrived on time, as it has every year of my life. Inside: a poem she wrote herself and {{$20}}, the same {{$20}} she has sent since I turned five.",
    minAge: 15,
    maxAge: 15,
    weight: 2,
    once: true,
    choices: [
      {
        id: 'letter',
        label: 'Write her a real letter',
        effects: [
          { money: 20 },
          { karma: 3 },
          { energy: -1 },
          {
            chance: 0.5,
            then: [{ money: 30 }, { log: 'She wrote back four pages and enclosed {{$30}} "for stamps." I have a pen pal now.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: 2 }, { log: 'She phoned to read my letter back to me, twice, with feeling.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'text',
        label: 'Text her a thank-you',
        conditions: [{ year: { gte: 2000 } }],
        effects: [{ money: 20 }, { stat: 'happiness', delta: 1 }, { log: 'I texted thanks with a heart. She replied "WHO IS THIS." She does not save numbers.' }],
      },
      {
        id: 'inflation',
        label: 'Mention inflation, gently',
        effects: [
          { money: 20 },
          { karma: -2 },
          {
            chance: 0.4,
            then: [{ money: 50 }, { log: 'She sent {{$50}} more with a note: "Cheeky. Good."', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'Next year she sent a poem about greedy children. It rhymed "inflation" with "ingratitude." Almost.', kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ holidays
  {
    id: 'tl_nye_family',
    category: 'holiday',
    title: 'Midnight at home',
    text: "New Year's Eve at home. {{person}} poured sparkling grape juice into the good glasses, there is a board game on the table and a countdown on TV. My friends are all somewhere louder.",
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 3,
    // "My friends are all somewhere louder": I have some.
    conditions: [{ hasPerson: ['friend', 'bestFriend'] }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'countdown',
        label: 'Stay for the countdown',
        effects: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 3 }, { relationship: 'friend', delta: -1 }, { log: 'We counted down from ten in the living room. {{person}} got a little teary at midnight. So did I.', kind: 'good' }],
      },
      {
        id: 'game',
        label: 'Win the board game',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: 1 }, { log: 'I won the board game at 11:58. Nobody has been gracious about it since.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 3 }, { log: '{{person}} destroyed me at the board game and gloated straight through midnight.' }],
          },
        ],
      },
      {
        id: 'call',
        label: 'Call my friends at midnight',
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'friend', delta: 3 }, { relationship: 'person', delta: -3 }, { log: 'I spent midnight on the phone in the hallway with my friends. {{person}} counted down without me.' }],
      },
      {
        id: 'asleep',
        label: 'Fall asleep at 11:40',
        effects: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I fell asleep on the couch at 11:40. {{person}} put a party hat on me and took a photo.' }],
      },
    ],
  },
  {
    id: 'tl_sparklers',
    category: 'holiday',
    title: 'Sparklers',
    text: '{{person}} came home with a box of sparklers for the holiday and read the safety instructions aloud, twice. We are on the front steps at dusk. Mine is lit and spitting little stars.',
    minAge: 13,
    maxAge: 15,
    weight: 1.5,
    cooldown: 3,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'name',
        label: 'Write my name in the air',
        effects: [{ stat: 'happiness', delta: 4 }, { log: 'I wrote my whole name in the air before it fizzled. Long names are hard. Worth it.', kind: 'good' }],
      },
      {
        id: 'duel',
        label: 'Challenge {{them}} to a duel',
        effects: [
          {
            chance: 0.8,
            then: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 5 }, { log: '{{person}} and I dueled with sparklers like knights. {{They}} won by being taller.', kind: 'good' }],
            else: [{ injury: 1 }, { stat: 'happiness', delta: -2 }, { relationship: 'person', delta: 1 }, { log: 'A spark landed on my wrist. Tiny burn, big drama, a bag of frozen peas.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'careful',
        label: 'Hold it at arm\'s length',
        effects: [{ stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: 1 }, { relationship: 'person', delta: 2 }, { log: 'I held mine at arm\'s length, exactly like the box said. Safe and slightly boring.' }],
      },
      {
        id: 'two',
        label: 'Light two at once',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'Two at once looked amazing in the photos. I was extremely cool for nine seconds.', kind: 'good' }],
            else: [{ injury: 1 }, { relationship: 'person', delta: -2 }, { log: 'Two was too many. I dropped one on the doormat. {{person}} stamped it out, unimpressed.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tl_ugly_sweater',
    category: 'holiday',
    title: 'The sweater',
    text: '{{person}} knitted me a holiday sweater: a reindeer with a pom-pom nose, one sleeve longer than the other. The same week, school announced an ugly sweater contest. I have a powerful entry and a moral problem.',
    minAge: 13,
    maxAge: 17,
    weight: 1,
    once: true,
    conditions: [{ enrolled: true }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'enter',
        label: 'Enter it in the contest',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: -3 }, { log: 'I won the ugly sweater contest. {{person}} saw the photo in the school newsletter.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: -3 }, { log: '{{person}} heard about the contest anyway, and that I came second.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'sincere',
        label: 'Wear it sincerely',
        effects: [{ relationship: 'person', delta: 5 }, { stat: 'looks', delta: -2 }, { stat: 'happiness', delta: 1 }, { log: 'I wore it all week like it was normal. {{person}} has started on a matching hat.', kind: 'good' }],
      },
      {
        id: 'tell',
        label: 'Tell {{them}} about the contest',
        effects: [
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 4 }, { log: '{{person}} laughed for a full minute, then added more pom-poms. We won.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { log: '{{person}} said "I see" and put the knitting needles away for a year.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'hide',
        label: 'Hide it in the closet',
        effects: [{ relationship: 'person', delta: -1 }, { stat: 'happiness', delta: -1 }, { log: 'The sweater lives at the back of my closet. I visit it sometimes, out of guilt.' }],
      },
    ],
  },

  // ------------------------------------------------------------ romance (16-17)
  {
    id: 'tl_ask_out',
    category: 'romance',
    title: 'Lab partner',
    text: "My chemistry lab partner laughs at my jokes, even the ones that aren't jokes. Today they lent me a pencil and didn't ask for it back. I have decided this means something.",
    minAge: 16,
    maxAge: 17,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ enrolled: true }, { hasLover: false }],
    choices: [
      {
        id: 'person',
        label: 'Ask them out in person',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 6 }, { newPerson: { kind: 'lover', minAge: 16, maxAge: 17, relationship: 60, log: 'My lab partner, {{person}}, said yes before I finished the question. We are going out.' } }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'They said they liked me "as a lab partner." We still aced the titration.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'text',
        label: 'Pass a note in class',
        effects: [
          {
            chance: 0.35,
            then: [{ stat: 'happiness', delta: 4 }, { newPerson: { kind: 'lover', minAge: 16, maxAge: 17, relationship: 55, log: '{{person}} passed the note back with YES and eleven exclamation points. We are going out.' } }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'The note came back with "haha you\'re funny" written under my question. Ouch.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'friend',
        label: 'Have a friend ask',
        conditions: [{ hasPerson: ['friend', 'bestFriend'] }],
        effects: [
          {
            chance: 0.45,
            then: [{ stat: 'happiness', delta: 4 }, { newPerson: { kind: 'lover', minAge: 16, maxAge: 17, relationship: 50, log: 'My friend asked for me, and {{person}} said yes. We are going out, slightly by proxy.' } }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'My friend asked for me, loudly, in the cafeteria. The answer was no, also loudly.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'pencil',
        label: 'Keep the pencil, say nothing',
        effects: [{ stat: 'happiness', delta: -1 }, { stat: 'smarts', delta: 1 }, { log: 'I said nothing and kept the pencil. It is a very nice pencil.' }],
      },
    ],
  },
  {
    id: 'tl_first_date',
    category: 'romance',
    title: 'Two milkshakes',
    text: 'First date with {{person}}: two milkshakes at the diner, a booth by the window and a conversation that keeps stalling on the weather. {{They}} just knocked over the ketchup. My move.',
    minAge: 16,
    maxAge: 17,
    weight: 2,
    once: true,
    person: { kind: ['lover'] },
    choices: [
      {
        id: 'mustard',
        label: 'Knock over the mustard',
        effects: [
          {
            chance: 0.75,
            then: [{ love: 6 }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 4 }, { log: 'I knocked over the mustard on purpose. {{person}} laughed so hard the whole diner looked.', kind: 'good' }],
            else: [{ love: -2 }, { stat: 'happiness', delta: -2 }, { log: 'I knocked over the mustard. {{person}} thought I was making fun of {{them}}. Long silence.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'question',
        label: 'Ask a real question',
        effects: [
          {
            chance: 0.7,
            then: [{ love: 5 }, { stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'I asked what {{they}} wants to be. We talked until the diner closed. No more weather.', kind: 'good' }],
            else: [{ love: 1 }, { stat: 'happiness', delta: -1 }, { log: 'My real question was too real. We talked about the weather for twenty more minutes.' }],
          },
        ],
      },
      {
        id: 'cool',
        label: 'Play it extremely cool',
        effects: [
          {
            chance: 0.5,
            then: [{ love: 3 }, { stat: 'looks', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: '{{person}} found my cool silence mysterious. I got lucky.', kind: 'good' }],
            else: [{ love: -4 }, { stat: 'happiness', delta: -2 }, { log: 'I played it so cool that {{person}} asked if I was having a bad time.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tl_porch_light',
    category: 'romance',
    title: 'The light by the door',
    text: '{{person}} walked me home, and we have been saying goodnight at the front door for twenty minutes. The light over the door just flicked off and on. Then again. {{father}} is inside, sending a message.',
    minAge: 16,
    maxAge: 17,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ hasPerson: ['father'] }],
    person: { kind: ['lover'] },
    choices: [
      {
        id: 'goodnight',
        label: 'Say one last goodnight',
        effects: [{ love: 4 }, { stat: 'happiness', delta: 3 }, { relationship: 'father', delta: -1 }, { log: 'One last goodnight. The light flicked a third time. {{person}} waved at it, which was bold.', kind: 'good' }],
      },
      {
        id: 'flick',
        label: 'Flick the light back',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'father', delta: 2 }, { love: 2 }, { log: 'I flicked the light back. {{father}} laughed through the door. We settled on five more minutes.', kind: 'good' }],
            else: [{ relationship: 'father', delta: -3 }, { love: -1 }, { log: 'I flicked it back. {{father}} opened the door in a robe and said goodnight to {{person}} personally.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'inside',
        label: 'Go in right away',
        effects: [{ relationship: 'father', delta: 2 }, { love: -2 }, { log: '{{father}} was "just reading" when I came in. The book was upside down.' }],
      },
    ],
  },
  {
    id: 'tl_breakup',
    category: 'romance',
    title: 'By the vending machines',
    text: "{{person}} asked to talk by the vending machines after school. {{They}} said it's been great, really, but {{they}} thinks we're better as friends. Behind {{them}}, a bag of chips is stuck in the machine.",
    minAge: 16,
    maxAge: 17,
    weight: 1,
    cooldown: 2,
    conditions: [{ enrolled: true }],
    person: { kind: ['lover'] },
    choices: [
      {
        id: 'friends',
        label: 'Agree to stay friends',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: -4 }, { log: 'We hugged and agreed to stay friends. Weirdly, we actually managed it.' }, { removePerson: true }],
      },
      {
        id: 'chance',
        label: 'Ask for another chance',
        effects: [
          {
            chance: 0.3,
            then: [{ love: 5 }, { relationship: 'person', delta: 3 }, { log: '{{person}} thought about it all weekend and said yes. We are trying again.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -7 }, { log: '{{person}} said no, kindly. I walked home the long way.', kind: 'bad' }, { removePerson: true }],
          },
        ],
      },
      {
        id: 'chips',
        label: 'Free the stuck chips',
        effects: [{ stat: 'happiness', delta: -3 }, { stat: 'looks', delta: 1 }, { log: 'I shook the machine until the chips dropped and handed them to {{person}}. A dignified ending.' }, { removePerson: true }],
      },
      {
        id: 'songs',
        label: 'Go home and play sad songs',
        effects: [{ stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 1 }, { relationship: 'mother', delta: -1 }, { relationship: 'father', delta: -1 }, { log: 'I played the same sad song forty times. It helped. My whole household learned the words.' }, { removePerson: true }],
      },
    ],
  },

  // ------------------------------------------------------------ pets
  {
    id: 'tl_pet_vet',
    category: 'family',
    title: 'My pet, my bill',
    // Pets here are cats, dogs, rabbits, hamsters, parrots and pigeons, so no species-specific care.
    text: '{{person}} has an infection and needs medicine and a follow-up visit. The estimate is {{$350}}. When we got {{them}}, I promised to pay for anything {{they}} needed. Nobody at home has forgotten.',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 4,
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'work',
        label: 'Work it off at the clinic',
        effects: [
          { energy: -1 },
          { karma: 2 },
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: -1 },
          { relationship: 'person', delta: 3 },
          { log: 'The vet let me clean kennels every Saturday until the bill was paid. I smell like a kennel now.' },
        ],
      },
      {
        id: 'family',
        label: 'Ask the family for a loan',
        hint: 'Family pays {{$350}}',
        conditions: [{ hasPerson: ['mother', 'father', 'stepmother', 'stepfather'] }],
        effects: [
          { money: -350 },
          { stat: 'happiness', delta: -2 },
          { relationship: 'mother', delta: -2 },
          { relationship: 'father', delta: -2 },
          { relationship: 'stepmother', delta: -2 },
          { relationship: 'stepfather', delta: -2 },
          { log: 'The family covered the bill. I now owe them every chore until spring. {{person}} is fine.' },
        ],
      },
      {
        id: 'skip',
        label: 'Skip the follow-up visit',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ log: '{{person}} got the medicine but not the follow-up, and recovered anyway. I got lucky.' }],
            else: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -3 }, { log: '{{person}} got the medicine but not the follow-up. {{They}} recovered slowly, and gave me looks.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tl_pet_alarm',
    category: 'family',
    title: '5:40 a.m.',
    text: '{{person}} has decided that breakfast is at 5:40 a.m. and that I am the one who serves it. Every morning at 5:40 exactly, {{they}} makes a racket until I get up.',
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    cooldown: 3,
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'serve',
        label: 'Get up and serve breakfast',
        effects: [{ relationship: 'person', delta: 4 }, { stat: 'health', delta: -1 }, { log: 'I serve breakfast at 5:40 and go back to bed. This is my life now. {{person}} seems pleased.' }],
      },
      {
        id: 'hide',
        label: 'Hide under the pillow',
        effects: [
          { relationship: 'person', delta: -2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'I hid. {{person}} got louder. The whole house got up, and blamed me.', kind: 'bad' }],
            else: [{ stat: 'health', delta: 1 }, { log: 'I hid under the pillow until {{person}} gave up. A small victory. I will pay for it later.' }],
          },
        ],
      },
      {
        id: 'retrain',
        label: 'Move breakfast later, slowly',
        effects: [
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'Ten minutes later each week. By spring, breakfast was at seven. I am a genius.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -1 }, { stat: 'happiness', delta: -2 }, { log: 'I tried moving breakfast later. {{person}} moved the racket earlier, in protest.', kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ out of school
  {
    id: 'tl_weekday_errand',
    category: 'random',
    title: 'No school today?',
    text: 'Tuesday, eleven in the morning, and I am the only person under forty in the grocery store. The cashier looks at me, at the clock, and back at me. "No school today?"',
    minAge: 13,
    maxAge: 17,
    weight: 2,
    cooldown: 3,
    conditions: [{ enrolled: false }],
    choices: [
      {
        id: 'done',
        label: "Say I'm done with school",
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'I said I was done with school. She said "oh, honey" in a tone I still think about.' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'I said I was done with school. She shrugged, said her son was too, and gave me a coupon.' }],
          },
        ],
      },
      {
        id: 'dentist',
        label: 'Claim a dentist appointment',
        effects: [{ karma: -1 }, { stat: 'happiness', delta: 1 }, { log: 'I said I had a dentist appointment. She asked which dentist. I named a street.' }],
      },
      {
        id: 'hiring',
        label: "Ask if they're hiring",
        conditions: [{ hasJob: false }],
        effects: [
          {
            chance: 0.5,
            then: [{ money: 80 }, { energy: -1 }, { log: 'They needed someone to unload a truck on Saturday. {{$80}} in cash and very sore arms.', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'She handed me an application that wanted three references. I have a cousin.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tl_library_days',
    category: 'random',
    title: 'Days with no bell',
    text: 'Without a school schedule, my days have no shape. The public library opens at nine, has every newspaper in town and a big chair by the window, and nobody there asks why I am not somewhere else.',
    minAge: 13,
    maxAge: 17,
    weight: 2,
    cooldown: 3,
    // Days with no shape: no school and no job either.
    conditions: [{ enrolled: false }, { hasJob: false }],
    choices: [
      {
        id: 'teach',
        label: 'Teach myself something',
        effects: [{ stat: 'smarts', delta: 4 }, { energy: -1 }, { log: 'I picked a subject and did one chapter a day. By the end of the month I knew a lot.', kind: 'good' }],
      },
      {
        id: 'classes',
        label: 'Look up evening classes',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { flag: 'tl_evening_class' },
          { log: 'I found a free evening class at the community center and signed up. Tuesdays, seven to nine.' },
        ],
      },
      {
        id: 'nap',
        label: 'Nap in the big chair',
        effects: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: -1 }, { log: 'I napped in the big chair most afternoons. Once, the librarian put a blanket on me.' }],
      },
      {
        id: 'help',
        label: 'Help the librarian',
        effects: [
          { karma: 3 },
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.3,
            then: [{ money: 100 }, { log: 'I shelved books for fun. In spring the librarian found a small budget and paid me {{$100}}.', kind: 'money' }],
            else: [{ stat: 'smarts', delta: 1 }, { log: 'I spent the month shelving returns. The librarian taught me the whole system.', kind: 'good' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tl_useful_at_home',
    category: 'family',
    title: 'Under this roof',
    text: '{{person}} has a new rule: anyone under this roof who is not in school is going to be useful. {{They}} said it at breakfast while looking straight at me and buttering toast.',
    minAge: 13,
    maxAge: 17,
    weight: 2,
    cooldown: 3,
    // Not in school and not working, or the rule would not be aimed at me.
    conditions: [{ enrolled: false }, { hasJob: false }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'chores',
        label: 'Take over the chores',
        effects: [
          { relationship: 'person', delta: 5 },
          { stat: 'happiness', delta: -2 },
          { energy: -1 },
          { log: 'Laundry, dishes, groceries. {{person}} says I am the best roommate {{they}} has ever had.', kind: 'good' },
        ],
      },
      {
        id: 'shop',
        label: "Help at a family friend's store",
        effects: [
          { money: 300 },
          { energy: -1 },
          { stat: 'smarts', delta: 1 },
          { log: 'A family friend hired me for her hardware store counter. {{$300}} and a vast knowledge of screws.', kind: 'money' },
        ],
      },
      {
        id: 'sleep',
        label: 'Sleep in anyway',
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: -5 }, { log: 'I slept until noon. {{person}} hid the TV remote in the vacuum cleaner and told me where.', kind: 'bad' }],
      },
    ],
  },

  // ------------------------------------------------------------ driving
  // The permit test is for every teen. Passing it queues the aunt's lessons, which only open when both
  // parents (and any step-parents) are gone: teens with parents learn in tn_learning_to_drive instead.
  {
    id: 'tl_permit_test',
    category: 'school',
    title: 'The permit test',
    text: "The written permit test: forty questions about road signs, stopping distances and what to do when a deer appears. Thirty-two right and I'm allowed behind a wheel, with a licensed adult beside me.",
    minAge: 16,
    maxAge: 17,
    weight: 1.5,
    once: true,
    conditions: [{ flag: 'tn_license', exists: false }, { eventNotFired: 'tn_learning_to_drive' }],
    choices: [
      {
        id: 'study',
        label: 'Study the handbook all week',
        effects: [
          { energy: -1 },
          {
            chance: 0.85,
            then: [{ flag: 'tl_permit' }, { stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 3 }, { log: 'Thirty-eight out of forty. I will know the stopping distance of a truck in the rain forever.', kind: 'milestone' }, { queue: 'tl_aunt_driving' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'Thirty-one. One question short, and it was the deer one.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'cards',
        label: 'Cram with flashcards on the bus',
        effects: [
          {
            chance: 0.65,
            then: [{ flag: 'tl_permit' }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 3 }, { log: 'Thirty-three. Barely, but a permit is a permit. I laminated it, emotionally.', kind: 'milestone' }, { queue: 'tl_aunt_driving' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The flashcards fell out of order on the bus and so did my brain. I failed by three.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'wing',
        label: 'Wing it',
        effects: [
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.4,
            then: [{ flag: 'tl_permit' }, { stat: 'happiness', delta: 4 }, { log: 'I guessed my way to thirty-two exactly. I am a menace with a permit.', kind: 'milestone' }, { queue: 'tl_aunt_driving' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'I failed, confidently. Apparently a flashing red light does not mean "go faster."', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tl_aunt_driving',
    category: 'family',
    title: "My aunt's minivan",
    text: 'My aunt has driven the same rattling minivan since before I was born. Since I moved in with her, she has decided I am learning to drive in it, starting Sunday in the empty lot behind the supermarket.',
    minAge: 16,
    maxAge: 17,
    weight: 1,
    followUpOnly: true,
    conditions: [{ noPerson: ['mother', 'father', 'stepmother', 'stepfather'] }, { flag: 'tn_license', exists: false }],
    choices: [
      {
        id: 'slow',
        label: 'Take it slow',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 2 },
          { log: 'Ten miles an hour, both hands on the wheel. My aunt called me a natural, very kindly.' },
          { queue: 'tl_aunt_driving_test' },
        ],
      },
      {
        id: 'stories',
        label: 'Ask her about the old days',
        effects: [
          { stat: 'happiness', delta: 3 },
          { karma: 1 },
          { log: 'Between laps she told me stories about the family when she was my age. Some happened in this van.', kind: 'good' },
          { queue: 'tl_aunt_driving_test' },
        ],
      },
      {
        id: 'fast',
        label: 'Show her what I can do',
        effects: [
          {
            random: [
              { weight: 60, effects: [{ stat: 'happiness', delta: 6 }, { log: 'I took the corner a little fast. My aunt whooped. She is not the aunt I expected.', kind: 'good' }, { queue: 'tl_aunt_driving_test' }] },
              { weight: 40, effects: [{ stat: 'happiness', delta: -4 }, { log: 'I hit a shopping cart corral. The van has a new dent among the old ones. Lessons paused.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'wait',
        label: 'Wait until I feel ready',
        effects: [{ stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: 1 }, { log: 'I said I was not ready. My aunt said that was smart and drove us home, singing.' }],
      },
    ],
  },
  {
    id: 'tl_aunt_driving_test',
    category: 'family',
    title: 'Test day',
    text: 'Months of Sundays later, test day. My aunt ironed a shirt for the occasion and honked twice to wish me luck as I pulled out with the examiner. The examiner did not find this funny.',
    minAge: 16,
    maxAge: 17,
    weight: 1,
    followUpOnly: true,
    conditions: [{ noPerson: ['mother', 'father', 'stepmother', 'stepfather'] }],
    choices: [
      {
        id: 'taught',
        label: 'Drive the way she taught me',
        effects: [
          {
            chance: 0.6,
            then: [{ flag: 'tn_license', set: true }, { stat: 'happiness', delta: 8 }, { log: 'I passed. My aunt hugged the examiner, who had not agreed to that.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'I failed on the reverse park. My aunt insists the cones moved. We go again next month.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'slow',
        label: 'Take every turn slowly',
        effects: [
          {
            chance: 0.7,
            then: [{ flag: 'tn_license', set: true }, { stat: 'happiness', delta: 4 }, { log: 'I passed with the slowest drive in history. The examiner aged a little. My aunt cried.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'Too slow merging onto the highway. Failed. My aunt bought us both ice cream anyway.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'postpone',
        label: 'Postpone the test',
        effects: [{ stat: 'happiness', delta: -1 }, { stat: 'smarts', delta: 1 }, { log: 'I rescheduled. My aunt said there was no rush. She said it twice, so maybe a little rush.' }],
      },
    ],
  },
];

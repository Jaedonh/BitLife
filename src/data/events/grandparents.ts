import type { EventDef } from '@/engine/events/schema';

/**
 * Ages 2-45, grandparents from the grandchild's side: a toddler after a pair of
 * glasses, a candy drawer, too much food, a sleepover, a garden row, a school
 * play, folded bills pressed into a hand, the old albums, an interview for
 * school, the 80th and 90th birthdays, a lesson in video calls, graduation,
 * a recipe with a missing step, meeting a partner (or a spouse who becomes the
 * favorite), a baby meeting a great-grandparent, and the harder years: hearing
 * aids, the car keys, a phone scam, assisted living, memory loss, caregiving,
 * the will, a hospital stay that can end in a death, the funeral and a keepsake.
 * Scenario cards for a big family, a single parent, a farm and a prodigy, and
 * cards for detention, prison and life after release.
 *
 * Every card binds a grandparent (kind 'grandparent', so {{person}} renders
 * "Grandma Rosa"), filtered by gender where the text says "she" or "he", and
 * kept to plausible ages (50+, with a cap where the card needs them spry).
 * gp_meets_baby binds the player's baby instead and needs a living grandparent.
 * Follow-ups (followUpOnly): gp_good_day (from gp_forgot_my_name) and
 * gp_funeral (from the death branches of gp_hospital_stay).
 *
 * Pronoun placeholders render as he/she, so {{they}} takes singular verbs.
 */

/** Real cars: the 'car' asset kind also covers the bicycle and the scooter. */
const REAL_CARS = ['old_hatchback', 'sedan', 'pickup', 'ev', 'luxury_sedan', 'sports_car', 'supercar', 'classic_car'];

export const GRANDPARENTS_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ little ones (2-7)
  {
    id: 'gp_glasses_grab',
    category: 'childhood',
    title: 'The glasses',
    text: '{{person}} has bent down close to say hello, and {{their}} glasses are right there. They are shiny, they fold, and they come off a face. I have never wanted anything more.',
    minAge: 2,
    maxAge: 4,
    weight: 1.2,
    once: true,
    person: { kind: ['grandparent'], minAge: 50 },
    choices: [
      {
        id: 'grab',
        label: 'Grab the glasses',
        effects: [
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 2 },
          {
            chance: 0.5,
            then: [{ log: 'I grabbed the glasses and ran. {{person}} followed me by sound alone, laughing.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'I grabbed the glasses and bent one arm. {{person}} still wears them, a little crooked.' }],
          },
        ],
      },
      {
        id: 'wear',
        label: 'Put them on myself',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }, { log: 'I put the glasses on. The whole world went soft and huge. I sat down hard and cried.' }],
      },
      {
        id: 'hand',
        label: 'Hand them back',
        effects: [{ karma: 1 }, { relationship: 'person', delta: 4 }, { log: 'I gave the glasses back, very gently, upside down. {{person}} told everyone I was a genius.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'gp_candy_drawer',
    category: 'childhood',
    title: 'The squeaky drawer',
    text: "{{person}} keeps a drawer of candy in her kitchen that is supposed to be a secret. Everybody knows about it. The drawer squeaks, and she can hear it from anywhere in the house.",
    minAge: 3,
    maxAge: 7,
    weight: 1.2,
    // Finding the secret drawer is a discovery: it happens once, not again a few years on word for word.
    once: true,
    person: { kind: ['grandparent'], gender: 'female', minAge: 50 },
    choices: [
      {
        id: 'sneak',
        label: 'Sneak to the drawer',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { stat: 'health', delta: -1 }, { log: 'I opened the drawer one squeak at a time and got two caramels. A master thief.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 1 }, { log: '"I heard that," {{person}} called from the garden. Caught. She let me keep one.' }],
          },
        ],
      },
      {
        id: 'ask',
        label: 'Ask her nicely',
        effects: [{ karma: 1 }, { relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 1 }, { log: '{{person}} said asking nicely is worth exactly one candy. I got exactly one.' }],
      },
      {
        id: 'butter',
        label: 'Rub butter on the squeak',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -1 }, { log: 'I buttered the drawer so it would stop squeaking. It worked. The kitchen smelled odd for a week.' }],
      },
    ],
  },
  {
    id: 'gp_second_helping',
    category: 'family',
    title: 'A second helping',
    text: "At {{person}}'s house there is always too much food. She watches every forkful I take, and the moment my plate is empty she fills it again before I can say a word.",
    minAge: 4,
    maxAge: 12,
    weight: 1.5,
    cooldown: 3,
    person: { kind: ['grandparent'], gender: 'female', minAge: 50, maxAge: 92 },
    choices: [
      {
        id: 'eat',
        label: 'Eat until I pop',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'health', delta: -2 }, { relationship: 'person', delta: 5 }, { log: 'Three plates. I had to lie on the carpet afterward. {{person}} has never been prouder.', kind: 'good' }],
      },
      {
        id: 'napkin',
        label: 'Hide food in my napkin',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'Two meatballs went into my napkin, then my pocket. Nobody knew. My pocket knew.' }],
            else: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -2 }, { log: '{{person}} found the napkin. She was not angry. She was hurt, which was worse.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'help',
        label: 'Ask to help her cook',
        effects: [{ energy: -1 }, { stat: 'smarts', delta: 2 }, { relationship: 'person', delta: 6 }, { log: 'I stirred and tasted and tasted again. {{person}} says I have good hands for dough.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'gp_sleepover',
    category: 'family',
    title: "A night at {{person}}'s",
    text: "I'm sleeping over at {{person}}'s house. He lets me have cereal for dinner and stay up past nine, and he snores so loudly that the windows hum along.",
    minAge: 5,
    maxAge: 11,
    weight: 1.5,
    cooldown: 3,
    person: { kind: ['grandparent'], gender: 'male', minAge: 50, maxAge: 90 },
    choices: [
      {
        id: 'movie',
        label: 'Stay up for the late movie',
        effects: [{ stat: 'happiness', delta: 4 }, { stat: 'health', delta: -1 }, { relationship: 'person', delta: 4 }, { log: 'We watched an old movie past eleven. {{person}} fell asleep first and denied it.', kind: 'good' }],
      },
      {
        id: 'explore',
        label: 'Explore the creaky house',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'I found a box of old medals. {{person}} told me about every one of them at breakfast.' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'Every board in the hall creaked at once. I ran back to bed and waited for the snoring.' }],
          },
        ],
      },
      {
        id: 'call',
        label: 'Ask to call home',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'health', delta: 1 }, { relationship: 'person', delta: -2 }, { log: 'I called home at ten, homesick, then slept like a log. {{person}} pretended not to mind.' }],
      },
    ],
  },
  // ------------------------------------------------------------ starting scenarios
  {
    id: 'gp_every_name',
    category: 'family',
    title: 'Every name but mine',
    text: "{{person}} called me by every one of my siblings' names before getting to mine, then gave up and called me \"you, the one with the face.\" With this many of us, I can't blame {{them}}.",
    minAge: 4,
    maxAge: 14,
    weight: 1.5,
    once: true,
    conditions: [{ flag: 'scenario:big_family' }, { hasPerson: ['sibling'] }],
    person: { kind: ['grandparent'], minAge: 50 },
    choices: [
      {
        id: 'answer',
        label: 'Answer to all of them',
        effects: [{ stat: 'happiness', delta: 2 }, { karma: -1 }, { relationship: 'person', delta: 3 }, { log: 'I answered to every name. By evening I had been thanked for three chores I never did.' }],
      },
      {
        id: 'tag',
        label: 'Wear a name tag',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 4 }, { log: 'I wore a name tag to lunch. {{person}} read it out loud every time {{they}} spoke to me.' }],
      },
      {
        id: 'sulk',
        label: 'Sulk about it',
        effects: [{ stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 5 }, { log: 'I sulked. {{person}} noticed, took me aside and gave me a cookie nobody else got.' }],
      },
    ],
  },
  {
    id: 'gp_school_pickup',
    category: 'family',
    title: 'The school pickup',
    text: "It's just {{parents}} raising me, so {{person}} picks me up from school most days, with a snack in one pocket and a hundred questions about my day in the other.",
    minAge: 6,
    maxAge: 12,
    weight: 1.5,
    once: true,
    // {{parents}} must render the one parent ("Mom" or "Dad"): no step-parent has joined the home.
    conditions: [
      { flag: 'scenario:single_parent' },
      { enrolled: true },
      { any: [{ hasPerson: ['mother'] }, { hasPerson: ['father'] }] },
      { noPerson: ['stepmother', 'stepfather'] },
    ],
    person: { kind: ['grandparent'], minAge: 50, maxAge: 85 },
    choices: [
      {
        id: 'tell',
        label: 'Tell {{them}} everything',
        effects: [{ stat: 'happiness', delta: 2 }, { karma: -1 }, { relationship: 'person', delta: 5 }, { log: 'I told {{person}} my whole day, including the parts that did not happen. {{They}} listened.' }],
      },
      {
        id: 'homework',
        label: 'Do homework at {{their}} table',
        effects: [{ grade: 3 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 2 }, { log: "I did my homework at {{person}}'s kitchen table. {{They}} checked the math and got it wrong." }],
      },
      {
        id: 'alone',
        label: 'Ask to walk home alone',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'health', delta: 2 }, { relationship: 'person', delta: -3 }, { log: 'I asked to walk home by myself. {{person}} said yes, then followed half a block behind.' }],
      },
    ],
  },
  {
    id: 'gp_farm_morning',
    category: 'family',
    title: 'Before sunrise',
    text: '{{person}} came over before sunrise to help with the animals and shook me awake on the way past. {{They}} says a farm does not care that it is Saturday, and {{they}} has said so every Saturday of my life.',
    minAge: 6,
    maxAge: 14,
    weight: 1.5,
    cooldown: 3,
    // Still on the farm, with a grandparent nearby: once the family moves to another city (a card's relocate effect),
    // the grandparents stay behind and live far away, so nobody is bound for a visit at sunrise.
    conditions: [{ flag: 'farm' }],
    person: { kind: ['grandparent'], minAge: 50, maxAge: 85 },
    choices: [
      {
        id: 'boots',
        label: 'Pull on my boots',
        effects: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 5 }, { log: 'I fed the animals beside {{person}} in the dark. The cows were rude. {{They}} was proud.' }],
      },
      {
        id: 'stories',
        label: 'Ask about the old days',
        effects: [{ stat: 'smarts', delta: 2 }, { relationship: 'person', delta: 3 }, { log: '{{person}} told drought-year stories through every chore. I learned more than I carried.' }],
      },
      {
        id: 'sleep',
        label: 'Pretend to be asleep',
        effects: [{ stat: 'health', delta: 1 }, { stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -3 }, { log: 'I snored on purpose. {{person}} did the chores alone and mentioned it at every meal.' }],
      },
    ],
  },
  {
    id: 'gp_biggest_fan',
    category: 'family',
    title: 'My biggest fan',
    text: "{{person}} tells everyone at the grocery store that I'm a genius. The cashier knows my test scores. So does the man stacking melons, and a stranger who only came in for milk.",
    minAge: 6,
    maxAge: 14,
    weight: 1.5,
    once: true,
    // Test scores mean school has started (the school age differs by country).
    conditions: [{ flag: 'prodigy' }, { enrolled: true }],
    person: { kind: ['grandparent'], minAge: 50 },
    choices: [
      {
        id: 'smile',
        label: 'Smile and wave',
        effects: [{ stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 4 }, { fame: 1 }, { log: 'I smiled at the melon man. He asked me a math question. I got it right. {{person}} cried.' }],
      },
      {
        id: 'stop',
        label: 'Ask {{them}} to stop',
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: -2 }, { log: 'I asked {{person}} to stop bragging. {{They}} agreed, then told the pharmacist instead.' }],
      },
      {
        id: 'prove',
        label: 'Add up the cart out loud',
        effects: [
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I added up the whole cart before the register did. The cashier gave me a sticker.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I added up the cart and got it wrong by a lot. {{person}} said the register was broken.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  // ------------------------------------------------------------ childhood (6-15)
  {
    id: 'gp_garden_row',
    category: 'family',
    title: 'My own row',
    text: '{{person}} gave me my own row in {{their}} vegetable garden and a packet of seeds. {{They}} says that if I look after it all summer, it will look after me.',
    minAge: 6,
    maxAge: 12,
    weight: 1.2,
    once: true,
    person: { kind: ['grandparent'], minAge: 50, maxAge: 90 },
    choices: [
      {
        id: 'water',
        label: 'Water it every day',
        effects: [{ energy: -1 }, { stat: 'health', delta: 2 }, { relationship: 'person', delta: 5 }, { log: 'I watered my row every single day and grew eleven carrots. I named the biggest one Gerald.', kind: 'good' }],
      },
      {
        id: 'worms',
        label: 'Dig for worms instead',
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: -1 }, { log: 'I found forty worms and no vegetables. {{person}} said worms are also a harvest.' }],
      },
      {
        id: 'candy',
        label: 'Plant a gummy bear',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 2 }, { log: 'I planted a gummy bear to grow more. Nothing came up. {{person}} has not stopped laughing.' }],
      },
    ],
  },
  {
    id: 'gp_school_play',
    category: 'school',
    title: 'Front row',
    text: "I'm Third Sheep in the school play. One line, and it is mostly \"baa.\" {{person}} has told the whole neighborhood and plans to sit in the front row with a camera the size of a lunchbox.",
    minAge: 6,
    maxAge: 11,
    weight: 1.2,
    once: true,
    conditions: [{ enrolled: true }, { stage: ['primary'] }],
    person: { kind: ['grandparent'], minAge: 50, maxAge: 95 },
    choices: [
      {
        id: 'baa',
        label: 'Baa with real feeling',
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 3 }, { log: 'I baaed with my whole heart. {{person}} gave Third Sheep a standing ovation.', kind: 'good' }],
      },
      {
        id: 'twice',
        label: 'Say my line twice',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { fame: 1 }, { log: 'I said my line, then said it again louder. The crowd laughed. {{person}} laughed loudest.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: "My second try landed on someone else's line. The teacher sighed into a clipboard.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'wave',
        label: 'Wave at {{person}}',
        effects: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 1 }, { grade: -1 }, { log: 'I waved at {{person}} in the middle of the barn scene. {{They}} waved back with both hands.' }],
      },
    ],
  },
  {
    id: 'gp_folded_bill',
    category: 'family',
    title: "Don't tell anyone",
    text: 'When nobody was looking, {{person}} pressed a folded bill into my hand and closed my fingers around it. "Don\'t tell anyone," {{they}} whispered. "And don\'t spend it on anything sensible."',
    minAge: 6,
    maxAge: 15,
    weight: 1.5,
    cooldown: 4,
    person: { kind: ['grandparent'], minAge: 50 },
    choices: [
      {
        id: 'pocket',
        label: 'Pocket it quietly',
        effects: [{ money: 40 }, { stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 2 }, { log: 'I pocketed {{$40}} and said nothing. {{person}} winked at me all through dinner.', kind: 'money' }],
      },
      {
        id: 'back',
        label: 'Try to give it back',
        effects: [
          { karma: 2 },
          { relationship: 'person', delta: 3 },
          {
            chance: 0.6,
            then: [{ money: 40 }, { log: 'I tried to give it back. By dessert the {{$40}} was back in my pocket.', kind: 'money' }],
            else: [{ log: '{{person}} took the money back, looked at me a long moment and said I was raised right.' }],
          },
        ],
      },
      {
        id: 'spend',
        label: 'Spend it on something silly',
        effects: [{ stat: 'happiness', delta: 5 }, { stat: 'health', delta: -1 }, { log: 'I spent it all on sour candy and a rubber snake. Nothing sensible. {{person}} approved.' }],
      },
    ],
  },
  {
    id: 'gp_holiday_dinner',
    category: 'holiday',
    title: 'The same every year',
    text: '{{person}} hosts the same holiday dinner every year: the same seats, the same tablecloth, and the same story about the year the oven caught fire. I could tell it myself by now.',
    minAge: 6,
    maxAge: 16,
    weight: 1.2,
    cooldown: 4,
    // Hosting means still at home: not after the assisted-living card (it may have bound another grandparent).
    conditions: [{ eventNotFired: 'gp_assisted_living' }],
    person: { kind: ['grandparent'], minAge: 55, maxAge: 92 },
    choices: [
      {
        id: 'story',
        label: 'Tell the oven story myself',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: 4 }, { log: 'I told the oven story before {{person}} could. {{They}} corrected only six details.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -2 }, { log: 'I got the ending of the oven story wrong. {{person}} retold the whole thing to fix it.' }],
          },
        ],
      },
      {
        id: 'seat',
        label: 'Sit in my usual seat',
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 2 }, { log: 'Same seat, same tablecloth, same story. I would not change one thing.' }],
      },
      {
        id: 'new',
        label: 'Suggest a new tradition',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            random: [
              { weight: 50, effects: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 3 }, { log: 'I suggested charades after dinner. {{person}} said no, then played until midnight.', kind: 'good' }] },
              { weight: 50, effects: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -1 }, { log: 'I suggested changing the menu. The table went silent. We are not changing the menu.' }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'gp_old_albums',
    category: 'family',
    title: 'The old albums',
    text: '{{person}} got out the old photo albums. It turns out {{they}} was young once, with big hair, a borrowed motorcycle and a look on {{their}} face I was not prepared for.',
    minAge: 8,
    maxAge: 17,
    weight: 1.2,
    once: true,
    person: { kind: ['grandparent'], minAge: 55 },
    choices: [
      {
        id: 'ask',
        label: 'Ask about the motorcycle',
        effects: [{ energy: -1 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 5 }, { log: '{{person}} told me about the motorcycle, the summer and its owner. Mostly about its owner.' }],
      },
      {
        id: 'hair',
        label: 'Copy the hairstyle',
        effects: [{ stat: 'looks', delta: -2 }, { stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 3 }, { log: 'I copied the photo hair with a lot of spray. {{person}} said close, but not that close.' }],
      },
      {
        id: 'flip',
        label: 'Flip through quickly',
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -3 }, { log: 'I flipped through fast and went back to my own things. {{person}} closed the album slowly.' }],
      },
    ],
  },
  {
    id: 'gp_interview_project',
    category: 'school',
    title: 'The interview',
    text: 'For a school project I have to interview someone who was born a long time ago. {{person}} agreed at once, then talked for three hours before I had asked a single question.',
    minAge: 9,
    maxAge: 14,
    weight: 1.2,
    once: true,
    conditions: [{ enrolled: true }],
    person: { kind: ['grandparent'], minAge: 55 },
    choices: [
      {
        id: 'record',
        label: 'Write down every word',
        effects: [{ energy: -1 }, { grade: 4 }, { stat: 'smarts', delta: 2 }, { relationship: 'person', delta: 5 }, { log: 'I filled a whole notebook and got a top grade. {{person}} wants a copy for the fridge.', kind: 'good' }],
      },
      {
        id: 'drama',
        label: 'Add some drama',
        effects: [
          {
            chance: 0.5,
            then: [{ grade: 4 }, { stat: 'happiness', delta: 2 }, { log: 'I added a shipwreck. The teacher loved it. {{person}} said that was nearly how it happened.' }],
            else: [{ grade: -3 }, { karma: -1 }, { log: 'I added a shipwreck. The teacher called {{person}} to check. There was no shipwreck.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'hard',
        label: 'Ask about the hard years',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 7 }, { grade: 2 }, { log: '{{person}} told me about the hard years, slowly. I left some of it out. It was just for me.' }],
      },
    ],
  },
  // ------------------------------------------------------------ birthdays
  {
    id: 'gp_eighty_candles',
    category: 'family',
    title: 'Eighty candles',
    text: "{{person}} turned eighty this year. The cake has so many candles that somebody is standing by with a glass of water, just in case, and I'm allowed to help blow them out.",
    minAge: 3,
    maxAge: 12,
    weight: 2,
    once: true,
    person: { kind: ['grandparent'], minAge: 80, maxAge: 80 },
    choices: [
      {
        id: 'blow',
        label: 'Blow as hard as I can',
        effects: [
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 3 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'I blew so hard I spat on the cake. Everyone had a slice anyway. {{person}} had two.' }],
            else: [{ log: 'I blew out half the candles in one go. {{person}} said I had the lungs of a trumpet player.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'card',
        label: 'Draw {{them}} a card',
        effects: [{ energy: -1 }, { karma: 1 }, { relationship: 'person', delta: 5 }, { log: 'I drew {{person}} with eighty candles and a crown. It went on the fridge, front and center.' }],
      },
      {
        id: 'ask',
        label: 'Ask what eighty feels like',
        effects: [{ stat: 'smarts', delta: 2 }, { relationship: 'person', delta: 2 }, { log: '"Like seventy-nine, but louder," {{person}} said. I still think about that.' }],
      },
    ],
  },
  {
    id: 'gp_eightieth_party',
    category: 'family',
    title: 'Eighty',
    text: '{{person}} turned eighty, and the family rented a room with folding chairs and balloons shaped like an eight and a zero. {{They}} asked for no fuss. Nobody believed {{them}}.',
    minAge: 13,
    maxAge: 45,
    weight: 2,
    once: true,
    person: { kind: ['grandparent'], minAge: 80, maxAge: 80 },
    choices: [
      {
        id: 'toast',
        label: 'Give a toast',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: 6 }, { log: 'I gave a short toast and the room went quiet in the good way. {{person}} squeezed my hand.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: 2 }, { log: 'My toast wandered into a story nobody wanted told. {{person}} laughed loudest.' }],
          },
        ],
      },
      {
        id: 'slides',
        label: 'Make a photo slideshow',
        effects: [{ energy: -1 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 2 }, { log: 'I made a slideshow of eighty years. {{person}} watched it twice and named everyone in it.', kind: 'good' }],
      },
      {
        id: 'gift',
        label: 'Bring a nice scarf',
        hint: '{{$60}}',
        effects: [{ money: -60 }, { relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 1 }, { log: 'I brought a scarf in {{their}} favorite color. {{person}} wore it all night, indoors.' }],
      },
    ],
  },
  {
    id: 'gp_ninety',
    category: 'family',
    title: 'Ninety',
    text: '{{person}} turned ninety and says the secret is minding {{their}} own business, a walk every morning, and a spoonful of something every night that {{they}} refuses to name.',
    minAge: 8,
    maxAge: 45,
    weight: 2,
    once: true,
    person: { kind: ['grandparent'], minAge: 90, maxAge: 90 },
    choices: [
      {
        id: 'secret',
        label: 'Ask what the spoonful is',
        effects: [
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: 3 },
          {
            chance: 0.5,
            then: [{ stat: 'health', delta: 1 }, { log: 'It is honey with lemon. {{person}} made me swear not to tell. I have told everyone.' }],
            else: [{ log: '{{person}} tapped {{their}} nose and changed the subject. I will never know. That is the point.' }],
          },
        ],
      },
      {
        id: 'party',
        label: 'Help plan a surprise party',
        hint: '{{$200}}',
        effects: [
          { money: -200 },
          { energy: -1 },
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 5 }, { log: 'Thirty people jumped out. {{person}} looked around and said, "About time."', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -2 }, { log: 'Thirty people jumped out and {{person}} nearly dropped {{their}} tea. Surprises are for the young.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'quiet',
        label: 'Spend a quiet day together',
        effects: [{ energy: -1 }, { relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 2 }, { log: 'We sat in the sun and did a crossword, badly. Ninety looks good on {{person}}.' }],
      },
    ],
  },
  {
    id: 'gp_birthday_song',
    category: 'family',
    title: 'Seven in the morning',
    text: "{{person}} called on my birthday at seven in the morning to sing me the whole song, every verse, including one I'm fairly sure {{they}} made up on the spot.",
    minAge: 12,
    maxAge: 45,
    weight: 1,
    cooldown: 5,
    // A phone call: a grandparent left behind in the old country calls too.
    person: { kind: ['grandparent'], minAge: 55, farAway: 'any' },
    choices: [
      {
        id: 'sing',
        label: 'Sing along',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'health', delta: -1 }, { relationship: 'person', delta: 4 }, { log: 'We sang the made-up verse together, badly, at seven in the morning. Best present I got.', kind: 'good' }],
      },
      {
        id: 'voicemail',
        label: 'Let it ring',
        effects: [{ stat: 'health', delta: 1 }, { stat: 'happiness', delta: 1 }, { relationship: 'person', delta: -2 }, { log: 'I slept through it. {{person}} sang all four minutes as a message. I have kept it.' }],
      },
      {
        id: 'later',
        label: "Say I'll call back later",
        effects: [
          { stat: 'health', delta: 1 },
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 1 }, { log: 'I called back at lunch. {{person}} sang the whole thing again. I let {{them}}.' }],
            else: [{ relationship: 'person', delta: -4 }, { log: "I forgot to call back. {{person}} said it was fine, in the voice that means it isn't." }],
          },
        ],
      },
    ],
  },
  // ------------------------------------------------------------ teens (12-19)
  {
    id: 'gp_video_lesson',
    category: 'family',
    title: 'Can you see me?',
    text: '{{person}} got a new phone and wants to video-call me, which means I am teaching {{them}} how. So far {{they}} has hung up on me twice and taken eleven photos of {{their}} own ear.',
    minAge: 12,
    maxAge: 30,
    weight: 1.2,
    once: true,
    // Video calls on a phone.
    conditions: [{ year: { gte: 2012 } }],
    // A video call reaches a grandparent in the old country just as well.
    person: { kind: ['grandparent'], minAge: 60, farAway: 'any' },
    choices: [
      {
        id: 'teach',
        label: 'Teach {{them}} step by step',
        effects: [
          { energy: -1 },
          { relationship: 'person', delta: 6 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'It worked. {{person}} now video-calls me every morning to show me {{their}} toast.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'An hour in, {{person}} had set the phone to another language. We are both learning it.' }],
          },
        ],
      },
      {
        id: 'card',
        label: 'Write the steps on a card',
        effects: [{ stat: 'smarts', delta: 1 }, { relationship: 'person', delta: 3 }, { log: 'I sent {{person}} five steps on a card. {{They}} laminated it and still calls me on speaker.' }],
      },
      {
        id: 'old',
        label: 'Just call the old way',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: -2 }, { log: 'I told {{person}} a regular call is fine. {{They}} sounded let down. I could hear a face fall.' }],
      },
    ],
  },
  {
    id: 'gp_visit_at_work',
    category: 'work',
    title: 'A visitor at work',
    text: "{{person}} came to see me at {{company}} and told every single person in the place that I'm {{their}} grandchild. {{They}} has been here forty minutes. My manager has stopped pretending not to watch.",
    minAge: 15,
    maxAge: 17,
    weight: 1.2,
    once: true,
    // A teen job with a counter, a shift and a manager (not babysitting, tutoring or deliveries).
    conditions: [{ jobId: ['pt_cashier', 'pt_lifeguard', 'pt_barista'] }],
    person: { kind: ['grandparent'], minAge: 55 },
    choices: [
      {
        id: 'introduce',
        label: 'Introduce {{them}} to everyone',
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 5 }, { jobPerformance: -2 }, { log: 'I introduced {{person}} to my whole shift. {{They}} learned more names than I know.', kind: 'good' }],
      },
      {
        id: 'work',
        label: 'Keep working and wave',
        effects: [{ jobPerformance: 3 }, { relationship: 'person', delta: -1 }, { log: 'I kept working and waved now and then. {{person}} left a note: "Very professional."' }],
      },
      {
        id: 'break',
        label: 'Take my break with {{them}}',
        effects: [{ energy: -1 }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 2 }, { log: 'I spent my whole break with {{person}}. {{They}} split a sandwich with me and reviewed the decor.' }],
      },
    ],
  },
  {
    id: 'gp_graduation_seat',
    category: 'school',
    title: 'A seat for graduation',
    text: '{{person}} bought a new outfit for my graduation and has asked three times what time to arrive. The answer is still two in the afternoon. {{They}} plans to be there by noon.',
    minAge: 17,
    maxAge: 17,
    weight: 2,
    once: true,
    // The final year of high school where it ends at 18 (not Brazil at 17 or Italy at 19), well on track to pass (30).
    conditions: [{ enrolled: true }, { stage: ['high'] }, { notCountry: ['BR', 'IT'] }, { grade: { gte: 45 } }],
    person: { kind: ['grandparent'], minAge: 55 },
    choices: [
      {
        id: 'seat',
        label: 'Save {{them}} the best seat',
        effects: [{ energy: -1 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 3 }, { log: 'I got there early to save {{person}} an aisle seat. {{They}} was already sitting in it.', kind: 'good' }],
      },
      {
        id: 'wave',
        label: 'Promise to wave from the stage',
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 3 }, { log: 'I promised to wave from the stage. {{person}} has been practicing waving back.' }],
      },
      {
        id: 'photo',
        label: 'Agree to one photo',
        effects: [{ stat: 'happiness', delta: -1 }, { stat: 'looks', delta: 1 }, { relationship: 'person', delta: 4 }, { log: '{{person}} wanted one photo of us in my cap and gown. Just one, {{they}} said. {{They}} took forty.' }],
      },
    ],
  },
  {
    id: 'gp_dance_floor',
    category: 'family',
    title: 'One more dance',
    text: "At a family wedding, {{person}} pulled me onto the dance floor and announced to the whole room that we would now show everyone how it's done.",
    minAge: 10,
    maxAge: 30,
    weight: 1,
    cooldown: 5,
    person: { kind: ['grandparent'], minAge: 55, maxAge: 90 },
    choices: [
      {
        id: 'dance',
        label: 'Dance like nobody is watching',
        effects: [
          { energy: -1 },
          { relationship: 'person', delta: 5 },
          {
            chance: 0.25,
            then: [{ stat: 'health', delta: -2 }, { stat: 'happiness', delta: 1 }, { log: 'We danced three songs straight. I got a stitch and had to sit down. {{person}} did not.' }],
            else: [{ stat: 'happiness', delta: 4 }, { log: 'We danced until the band took a break. Everyone clapped, mostly for {{person}}.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'lead',
        label: 'Let {{them}} lead',
        effects: [{ relationship: 'person', delta: 4 }, { stat: 'smarts', delta: 1 }, { log: '{{person}} led and I followed. I learned a dance from before I was born, one step at a time.' }],
      },
      {
        id: 'buffet',
        label: 'Escape to the buffet',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'health', delta: -1 }, { relationship: 'person', delta: -3 }, { log: 'I fled to the buffet for three desserts. {{person}} found a new dance partner in seconds.' }],
      },
    ],
  },
  {
    id: 'gp_full_volume',
    category: 'family',
    title: 'At full volume',
    text: "{{person}} won't wear {{their}} hearing aid because {{they}} says it whistles, so every visit happens at full volume. The neighbors now know all of my news, including some I hadn't told anyone.",
    minAge: 14,
    maxAge: 45,
    weight: 1,
    once: true,
    person: { kind: ['grandparent'], minAge: 75 },
    choices: [
      {
        id: 'shout',
        label: 'Shout along cheerfully',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'health', delta: -1 }, { relationship: 'person', delta: 3 }, { log: 'I shouted my whole year at {{person}}. My throat hurt. {{They}} heard every word.' }],
      },
      {
        id: 'notes',
        label: 'Bring a notepad',
        effects: [{ stat: 'smarts', delta: 1 }, { relationship: 'person', delta: 2 }, { log: 'We passed notes back and forth all afternoon. {{person}} corrected my spelling.' }],
      },
      {
        id: 'convince',
        label: 'Talk {{them}} into wearing it',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 3 }, { log: '{{person}} put the hearing aid in and heard birds for the first time in years. {{They}} went quiet.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { log: '{{person}} said {{they}} hears what {{they}} needs to hear. Then {{they}} asked me to speak up.' }],
          },
        ],
      },
    ],
  },
  // ------------------------------------------------------------ grown grandchild (16-45)
  {
    id: 'gp_the_usual',
    category: 'family',
    title: 'And then the usual',
    text: '{{person}} finally wrote down the famous family recipe for me, on a card in careful capitals. Step six just says "and then the usual." {{They}} won\'t explain what the usual is.',
    minAge: 16,
    maxAge: 40,
    weight: 1,
    once: true,
    person: { kind: ['grandparent'], minAge: 65 },
    choices: [
      {
        id: 'cook',
        label: 'Cook it beside {{them}}',
        effects: [{ energy: -1 }, { relationship: 'person', delta: 6 }, { stat: 'smarts', delta: 1 }, { flag: 'gp_family_recipe', set: true }, { log: 'I watched {{person}} do "the usual." It is a pinch of three things and a look. I have it now.', kind: 'good' }],
      },
      {
        id: 'guess',
        label: 'Guess what the usual is',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'I got the usual on my third try. {{person}} tasted it, nodded once, and that was everything.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { money: -30 }, { log: 'I guessed wrong three times and threw out three pots. The usual is not cinnamon.' }],
          },
        ],
      },
      {
        id: 'frame',
        label: 'Frame the card',
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 2 }, { log: 'I framed the card. I have never cooked from it. It is still the best thing I own.' }],
      },
    ],
  },
  {
    id: 'gp_meets_my_date',
    category: 'romance',
    title: 'Meeting the family',
    text: "I brought the person I'm seeing to lunch at {{person}}'s. Within ten minutes {{they}} had asked about their plans, their family and their intentions, and given them the good chair.",
    minAge: 16,
    maxAge: 40,
    weight: 1.2,
    cooldown: 6,
    conditions: [{ hasLover: true }, { married: false }],
    person: { kind: ['grandparent'], minAge: 60 },
    choices: [
      {
        id: 'questions',
        label: 'Let {{them}} ask away',
        effects: [
          { relationship: 'person', delta: 4 },
          {
            chance: 0.65,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'lover', delta: 3 }, { log: '{{person}} took me aside after lunch and said, "That one is a keeper." I grinned all week.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { relationship: 'lover', delta: -3 }, { log: '{{person}} asked one question too many about money. The ride home was very quiet.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'rescue',
        label: 'Rescue my date early',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'lover', delta: 3 }, { relationship: 'person', delta: -2 }, { log: 'I said we had somewhere to be and we fled before dessert. {{person}} sent us off with pie.' }],
      },
      {
        id: 'photos',
        label: 'Allow the baby photos',
        effects: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: 6 }, { relationship: 'lover', delta: 2 }, { log: '{{person}} brought out my baby photos, bath ones included. My date has never been happier.' }],
      },
    ],
  },
  {
    id: 'gp_any_news',
    category: 'romance',
    title: 'Any news?',
    text: "Every visit, {{person}} asks when I'm getting married, and every visit I say I don't know. Today {{they}} brought a list of nice single grandchildren of {{their}} friends, with phone numbers.",
    minAge: 22,
    maxAge: 40,
    weight: 1,
    cooldown: 5,
    // Never married: a divorced or widowed grandchild would not be asked "when" like this, nor one mourning a partner.
    conditions: [{ hasLover: false }, { count: 'marriages', eq: 0 }, { flag: 'grieving', exists: false }],
    person: { kind: ['grandparent'], minAge: 65 },
    choices: [
      {
        id: 'call',
        label: 'Call a number on the list',
        effects: [
          { energy: -1 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 5 }, { newPerson: { kind: 'lover', log: 'I called a number from the list and met {{person}}. I will never hear the end of it.' } }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I called a number from the list. The date was polite and short. We agreed to blame our families.' }],
          },
        ],
      },
      {
        id: 'happy',
        label: "Say I'm happy as I am",
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -1 }, { log: 'I told {{person}} I like my life as it is. {{They}} said "good" and slipped the list into my bag.' }],
      },
      {
        id: 'promise',
        label: 'Promise to bring someone',
        effects: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: -2 }, { log: 'I promised to bring someone next time. Now I need someone, or a very good excuse.' }],
      },
    ],
  },
  {
    id: 'gp_new_favorite',
    category: 'family',
    title: 'The new favorite',
    text: "{{person}} has decided that {{spouse}} is now {{their}} favorite grandchild. {{spouse}} gets the first phone call, the biggest slice and the good chair. I get asked how {{spouse}} is doing.",
    minAge: 20,
    maxAge: 45,
    weight: 1,
    once: true,
    conditions: [{ married: true }],
    person: { kind: ['grandparent'], minAge: 60 },
    choices: [
      {
        id: 'laugh',
        label: 'Laugh it off',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'spouse', delta: 3 }, { log: 'I laughed it off. {{spouse}} now signs cards to {{person}} "from your favorite."' }],
      },
      {
        id: 'compete',
        label: 'Win back my place',
        hint: '{{$50}}',
        effects: [{ energy: -1 }, { money: -50 }, { relationship: 'person', delta: 6 }, { log: 'I brought flowers, fixed a shelf and stayed for two crosswords. I am back in second place.' }],
      },
      {
        id: 'complain',
        label: 'Complain to {{spouse}}',
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'spouse', delta: -2 }, { log: 'I complained to {{spouse}}, who said, "Can you blame {{them}}?" I could, a little.' }],
      },
    ],
  },
  {
    id: 'gp_meets_baby',
    category: 'family',
    title: 'The oldest and the youngest',
    text: 'Today I put baby {{person}} into the arms of one of my grandparents. The oldest hands in the family were holding the newest ones, and for a minute nobody in the room said anything.',
    minAge: 18,
    maxAge: 45,
    weight: 2,
    once: true,
    // The baby is bound; the great-grandparent is whichever of my grandparents is still alive (no second binding).
    conditions: [{ hasPerson: ['grandparent'] }],
    person: { kind: ['child'], maxAge: 1 },
    choices: [
      {
        id: 'photo',
        label: 'Take the photo',
        effects: [{ stat: 'happiness', delta: 4 }, { relationship: 'grandparent', delta: 3 }, { log: "I took the photo: {{person}} asleep on {{their}} great-grandparent's shoulder. Everyone wants one.", kind: 'good' }],
      },
      {
        id: 'ask',
        label: 'Ask about me as a baby',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 2 }, { relationship: 'grandparent', delta: 4 }, { log: 'I asked what I was like as a baby. Loud, apparently, and bald, and adored.' }],
      },
      {
        id: 'hover',
        label: 'Hover nervously nearby',
        effects: [{ stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 2 }, { relationship: 'grandparent', delta: -2 }, { log: 'I hovered with my arms out the whole time. I was reminded that these hands once held me.' }],
      },
    ],
  },
  {
    id: 'gp_somebody_has_to',
    category: 'family',
    title: 'Somebody has to',
    text: "{{person}} can't manage the stairs or the shopping on {{their}} own anymore, and somebody in the family has to step up. Everyone keeps looking at me, the one without kids.",
    minAge: 18,
    maxAge: 30,
    weight: 1.2,
    once: true,
    // Never had children; weekly care means living nearby (no family move abroad); still in their own home.
    conditions: [
      { hasChildren: false },
      { count: 'children', eq: 0 },
      { married: false },
      { flag: 'immigrant', exists: false },
      { eventNotFired: 'gp_assisted_living' },
    ],
    person: { kind: ['grandparent'], minAge: 78 },
    choices: [
      {
        id: 'move',
        label: 'Move into {{their}} spare room',
        // Not while sharing a home with a partner.
        conditions: [{ any: [{ hasLover: false }, { not: { flag: 'lf_living_together' } }] }],
        effects: [{ relationship: 'person', delta: 12 }, { karma: 4 }, { stat: 'happiness', delta: -3 }, { stat: 'health', delta: -2 }, { flag: 'gp_live_in_caregiver', set: true }, { log: "I moved into {{person}}'s spare room. We argue about the TV volume and share the crossword.", kind: 'milestone' }],
      },
      {
        id: 'weekends',
        label: 'Help out every weekend',
        effects: [{ energy: -1 }, { relationship: 'person', delta: 6 }, { karma: 2 }, { stat: 'happiness', delta: -1 }, { log: 'I do the shopping and the stairs every Saturday. {{person}} saves a week of stories for me.' }],
      },
      {
        id: 'aide',
        label: 'Chip in for a home aide',
        hint: '{{$3000}}',
        conditions: [{ money: { gte: 3000 } }],
        effects: [{ money: -3000 }, { relationship: 'person', delta: 3 }, { karma: 1 }, { log: 'I paid toward an aide three mornings a week. {{person}} has already taught the aide {{their}} soup.', kind: 'money' }],
      },
      {
        id: 'no',
        label: "Say I can't take it on",
        effects: [{ stat: 'happiness', delta: 2 }, { karma: -2 }, { relationship: 'person', delta: -6 }, { log: 'I said I could not take it on. It was true. It still felt like walking out of a room.' }],
      },
    ],
  },
  {
    id: 'gp_hometown_trip',
    category: 'family',
    title: 'One more look',
    text: '{{person}} wants to see the town {{they}} grew up in one more time. It is four hours away, {{they}} no longer travels that far alone, and {{they}} has asked me to take {{them}}.',
    minAge: 18,
    maxAge: 35,
    weight: 1,
    once: true,
    person: { kind: ['grandparent'], minAge: 70, maxAge: 95 },
    choices: [
      {
        id: 'drive',
        label: 'Drive {{them}} there',
        hint: '{{$120}} in gas',
        conditions: [{ ownsAssetId: REAL_CARS }],
        effects: [{ energy: -2 }, { money: -120 }, { relationship: 'person', delta: 10 }, { stat: 'happiness', delta: 5 }, { log: '{{person}} showed me the school, the river and a bench carved with initials. No explanation.', kind: 'good' }],
      },
      {
        id: 'train',
        label: 'Take the train together',
        hint: '{{$300}}',
        effects: [{ energy: -1 }, { money: -300 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'We took the train. {{person}} narrated every field we passed. Half of them had changed.' }],
      },
      {
        id: 'later',
        label: 'Promise to go next year',
        effects: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -1 }, { log: 'I promised next year. {{person}} said "we\'ll see," in the way that means please don\'t wait.' }],
      },
    ],
  },
  {
    id: 'gp_two_coats',
    category: 'money',
    title: 'Two coats indoors',
    text: "{{person}}'s heating broke in the middle of winter, and rather than ask anyone for help, {{they}} has been wearing two coats indoors for a week. I only found out by accident.",
    minAge: 22,
    maxAge: 45,
    weight: 1,
    once: true,
    // A winter that needs home heating, in a home of their own (not after the assisted-living card).
    conditions: [{ climate: ['snowy', 'mild'] }, { eventNotFired: 'gp_assisted_living' }],
    person: { kind: ['grandparent'], minAge: 70 },
    choices: [
      {
        id: 'pay',
        label: 'Pay for the repair',
        hint: '{{$1500}}',
        conditions: [{ money: { gte: 1500 } }],
        effects: [{ money: -1500 }, { relationship: 'person', delta: 8 }, { karma: 3 }, { log: 'I paid for the repair. {{person}} argued for an hour, then admitted the house felt lovely.', kind: 'money' }],
      },
      {
        id: 'fix',
        label: 'Try to fix it myself',
        hint: '{{$150}} in parts',
        effects: [
          { energy: -1 },
          { money: -150 },
          {
            chance: 0.5,
            then: [{ stat: 'smarts', delta: 2 }, { relationship: 'person', delta: 6 }, { log: 'One old manual and a bruised knuckle later, the heat came on. {{person}} told the whole street.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { money: -900 }, { log: 'I made it worse. A repairman came anyway and charged extra for whatever I had done.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'heaters',
        label: 'Bring space heaters',
        hint: '{{$120}}',
        effects: [{ money: -120 }, { relationship: 'person', delta: 3 }, { log: 'I brought space heaters and a talk about asking for help. {{person}} kept the heaters.' }],
      },
    ],
  },
  {
    id: 'gp_scam_call',
    category: 'money',
    title: "It wasn't me",
    text: "{{person}} called in a panic. Someone on the phone had claimed to be me, in trouble and needing money sent right away, and {{they}} had already been to the bank.",
    minAge: 18,
    maxAge: 45,
    weight: 1,
    once: true,
    // All by phone and the bank, so it reaches a grandparent who lives far away too.
    person: { kind: ['grandparent'], minAge: 70, farAway: 'any' },
    choices: [
      {
        id: 'bank',
        label: 'Call the bank together',
        effects: [
          { energy: -1 },
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 3 }, { log: 'We stopped the transfer in time. {{person}} now hangs up on everyone, including me.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { relationship: 'person', delta: 3 }, { log: 'The money was already gone. {{person}} kept saying {{they}} should have known my voice.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'cover',
        label: 'Cover what {{they}} lost',
        hint: '{{$800}}',
        conditions: [{ money: { gte: 800 } }],
        effects: [{ money: -800 }, { karma: 3 }, { relationship: 'person', delta: 5 }, { log: 'I covered the loss and told {{person}} the bank refunded it. {{They}} believes me. Mostly.', kind: 'money' }],
      },
      {
        id: 'code',
        label: 'Set up a family code word',
        effects: [{ stat: 'smarts', delta: 1 }, { relationship: 'person', delta: 3 }, { log: 'We picked a code word for real emergencies. {{person}} uses it to ask whether I have eaten.' }],
      },
    ],
  },
  {
    id: 'gp_car_keys',
    category: 'family',
    title: 'The car keys',
    text: "{{person}} has parked on the neighbor's lawn twice this month, and somebody has to talk to {{them}} about giving up the car keys. Apparently that somebody is me.",
    minAge: 20,
    maxAge: 45,
    weight: 1,
    once: true,
    person: { kind: ['grandparent'], minAge: 82, maxAge: 100 },
    choices: [
      {
        id: 'talk',
        label: 'Have the hard talk',
        effects: [
          {
            chance: 0.5,
            then: [{ karma: 2 }, { relationship: 'person', delta: -2 }, { log: '{{person}} gave me the keys and sulked for an hour. Then {{they}} asked for a ride to lunch.' }],
            else: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: -8 }, { log: '{{person}} said {{they}} was driving before I was born, and hung up. We are not speaking.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'drive',
        label: 'Offer to drive {{them}} instead',
        conditions: [{ ownsAssetId: REAL_CARS }],
        effects: [{ energy: -1 }, { relationship: 'person', delta: 5 }, { stat: 'happiness', delta: -1 }, { log: 'Now I drive {{person}} to the doctor, the store and, every Thursday, a very long lunch.' }],
      },
      {
        id: 'wait',
        label: 'Leave it for now',
        effects: [
          { karma: -1 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -4 }, { log: '{{person}} drove through a hedge last week. Nobody was hurt. The hedge is gone. We talked.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'I let it go. {{person}} drives only to the store and back, very slowly. For now.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gp_who_gets_what',
    category: 'family',
    title: 'Who gets what',
    text: 'Over tea, {{person}} took out a notepad and asked me, quite cheerfully, what I would like to have when {{they}} is gone. {{They}} has already put labels on the sideboard.',
    minAge: 25,
    maxAge: 45,
    weight: 1,
    once: true,
    // The labeled sideboard is at home, not in an assisted-living room.
    conditions: [{ eventNotFired: 'gp_assisted_living' }],
    person: { kind: ['grandparent'], minAge: 80 },
    choices: [
      {
        id: 'clock',
        label: 'Ask for the old clock',
        effects: [
          { relationship: 'person', delta: 3 },
          { flag: 'gp_promised_clock', set: true },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -2 }, { log: 'I asked for the clock. So, it turns out, did two other relatives. {{person}} is enjoying this.' }],
            else: [{ stat: 'happiness', delta: 2 }, { log: '{{person}} put my name on tape under the clock. It ticked, as if it agreed.' }],
          },
        ],
      },
      {
        id: 'time',
        label: 'Say I just want more time',
        effects: [{ karma: 2 }, { relationship: 'person', delta: 5 }, { log: "I said I only wanted more Tuesdays. {{person}} said that wasn't on the list, but would try." }],
      },
      {
        id: 'subject',
        label: 'Change the subject',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: -2 }, { log: 'I talked about the weather instead. {{person}} let me, and put the notepad away for now.' }],
      },
    ],
  },
  // ------------------------------------------------------------ the harder years
  {
    id: 'gp_assisted_living',
    category: 'family',
    title: 'The new place',
    text: '{{person}} is moving into assisted living: a fish tank in the lobby, a schedule taped to every door. {{They}} says it is fine. {{They}} has said "fine" eleven times since breakfast.',
    minAge: 12,
    maxAge: 45,
    weight: 1,
    once: true,
    person: { kind: ['grandparent'], minAge: 78 },
    choices: [
      {
        id: 'pack',
        label: 'Help pack up the house',
        effects: [{ energy: -1 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: -2 }, { log: 'I helped pack fifty years into thirty boxes. {{person}} had a story for nearly every one.' }],
      },
      {
        id: 'room',
        label: 'Make the room feel like home',
        hint: '{{$80}}',
        effects: [{ money: -80 }, { relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 1 }, { log: "I hung {{person}}'s pictures and brought the good blanket. {{They}} said it was almost right." }],
      },
      {
        id: 'argue',
        label: 'Argue {{they}} should stay home',
        effects: [
          {
            chance: 0.3,
            then: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 2 }, { log: 'The family listened. {{person}} stays home for now, with a helper and a rail on the stairs.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: -3 }, { log: 'I lost the argument. {{person}} squeezed my hand and said {{they}} was glad someone tried.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gp_whose_child',
    category: 'family',
    title: 'Whose child',
    text: "{{person}} looked at me for a long moment, then called me by somebody else's name. Later {{they}} asked me, very politely, whose child I was. The doctors call it memory loss.",
    minAge: 10,
    maxAge: 45,
    weight: 1,
    once: true,
    person: { kind: ['grandparent'], minAge: 75 },
    choices: [
      {
        id: 'answer',
        label: 'Answer to the other name',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: -2 }, { relationship: 'person', delta: 3 }, { log: 'I answered to the other name all day. {{person}} told me stories about "us" I never knew.' }],
      },
      {
        id: 'remind',
        label: 'Gently say who I am',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 4 }, { log: 'I told {{person}} my name. It came back, and {{they}} laughed at the mix-up.' }],
            else: [{ stat: 'happiness', delta: -4 }, { relationship: 'person', delta: 2 }, { log: 'I told {{person}} my name. {{They}} nodded kindly, as you do with strangers. I held {{their}} hand.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'album',
        label: 'Bring out the photo album',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: -1 },
          { relationship: 'person', delta: 4 },
          { log: 'We went through the album together. {{person}} knew every face from fifty years ago.' },
          { chance: 0.5, then: [{ queue: 'gp_good_day' }] },
        ],
      },
    ],
  },
  {
    id: 'gp_good_day',
    category: 'family',
    title: 'A good day',
    text: "A few days later {{person}} called me by my name, first try, and asked about my life as if nothing had ever slipped. Good days still come. I've learned to grab them.",
    minAge: 10,
    maxAge: 45,
    weight: 1,
    followUpOnly: true,
    person: { kind: ['grandparent'], minAge: 75 },
    choices: [
      {
        id: 'tell',
        label: 'Tell {{them}} everything',
        effects: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: 6 }, { log: 'I told {{person}} everything, fast, while it lasted. {{They}} kept up with every word.', kind: 'good' }],
      },
      {
        id: 'question',
        label: 'Ask my saved-up question',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 5 }, { log: 'I asked {{person}} the question I had saved for years. {{They}} answered. I wrote it down.' }],
      },
      {
        id: 'record',
        label: 'Record {{them}} singing',
        effects: [{ stat: 'happiness', delta: 6 }, { relationship: 'person', delta: 2 }, { log: 'I recorded {{person}} singing a song from {{their}} childhood. I play it sometimes. It helps.' }],
      },
    ],
  },
  {
    id: 'gp_hospital_stay',
    category: 'health',
    title: 'The chair by the bed',
    text: '{{person}} is in the hospital with pneumonia. The doctors use careful words like "comfortable" and "we\'ll see," and the family is taking turns in the chair beside the bed.',
    minAge: 8,
    maxAge: 45,
    weight: 1,
    once: true,
    person: { kind: ['grandparent'], minAge: 70 },
    choices: [
      {
        id: 'sit',
        label: 'Take my turn every day',
        effects: [
          { energy: -1 },
          { relationship: 'person', delta: 8 },
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.15,
            then: [
              { log: 'I was in the chair when {{person}} died, quietly, in the afternoon. I am glad it was me.', kind: 'bad' },
              { stat: 'happiness', delta: -8 },
              { personDies: true, cause: 'pneumonia' },
              { queue: 'gp_funeral' },
            ],
            else: [{ stat: 'happiness', delta: 4 }, { log: 'I sat with {{person}} every day for two weeks. {{They}} came home thinner, grumpier and alive.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'card',
        label: 'Bring a homemade card',
        effects: [
          { karma: 1 },
          { relationship: 'person', delta: 4 },
          {
            chance: 0.15,
            then: [
              { log: '{{person}} died the night after I brought the card. The nurse said {{they}} kept it close.', kind: 'bad' },
              { stat: 'happiness', delta: -8 },
              { personDies: true, cause: 'pneumonia' },
              { queue: 'gp_funeral' },
            ],
            else: [{ stat: 'happiness', delta: 3 }, { log: 'My card stood on the hospital tray for two weeks, then came home with {{person}}.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'away',
        label: 'Stay away from the hospital',
        effects: [
          { stat: 'happiness', delta: 1 },
          { relationship: 'person', delta: -4 },
          {
            chance: 0.15,
            then: [
              { log: '{{person}} died before I found the nerve to visit. I will carry that for a while.', kind: 'bad' },
              { stat: 'happiness', delta: -10 },
              { karma: -1 },
              { personDies: true, cause: 'pneumonia' },
              { queue: 'gp_funeral' },
            ],
            else: [{ log: 'I could not face the hospital. {{person}} came home anyway and never once mentioned it.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gp_funeral',
    category: 'family',
    title: 'Saying goodbye',
    text: "{{person}}'s funeral is today. The family asked if I want to say a few words, and on a table at the back there is a box of {{their}} things for the family to choose from.",
    minAge: 8,
    maxAge: 45,
    weight: 1,
    followUpOnly: true,
    person: { kind: ['grandparent'], alive: false },
    choices: [
      {
        id: 'words',
        label: 'Say a few words',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 3 }, { karma: 2 }, { log: 'I told the story everyone knew about {{person}}. People laughed and cried at the same time.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { karma: 1 }, { log: 'I got two sentences in before my voice went. Somebody squeezed my shoulder. It was enough.' }],
          },
        ],
      },
      {
        id: 'keepsake',
        label: 'Choose first from the box',
        effects: [{ stat: 'happiness', delta: 3 }, { karma: -1 }, { flag: 'gp_keepsake', set: true }, { log: "I took {{person}}'s watch before anyone else could. It still runs four minutes slow." }],
      },
      {
        id: 'back',
        label: 'Stand quietly at the back',
        effects: [{ stat: 'happiness', delta: -1 }, { karma: 1 }, { log: 'I stood at the back and let the others choose first. I said goodbye to {{person}} in my head.' }],
      },
    ],
  },
  {
    id: 'gp_reading_glasses',
    category: 'family',
    title: 'In a box of old things',
    text: "A box of family things came my way, and inside, folded and waiting, were {{person}}'s reading glasses. I put them on. The whole world went soft around the edges.",
    minAge: 12,
    maxAge: 45,
    weight: 1,
    once: true,
    person: { kind: ['grandparent'], alive: false },
    choices: [
      {
        id: 'shelf',
        label: 'Keep them on my shelf',
        effects: [{ stat: 'happiness', delta: 2 }, { log: "{{person}}'s glasses live on my shelf now, folded, keeping an eye on the room." }],
      },
      {
        id: 'ask',
        label: 'Ask the family about {{them}}',
        effects: [{ energy: -1 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 3 }, { log: 'I asked around about {{person}} and heard three stories I never knew. One involved a goat.' }],
      },
      {
        id: 'donate',
        label: 'Donate them',
        effects: [{ karma: 3 }, { stat: 'happiness', delta: -1 }, { log: 'I gave the glasses to an eye clinic. Somewhere, someone sees the world the way {{person}} did.' }],
      },
    ],
  },
  // ------------------------------------------------------------ inside and after
  {
    id: 'gp_detention_visit',
    category: 'prison',
    title: 'Sunday best',
    text: "{{person}} came to visit me in detention, in {{their}} Sunday best, and spent the whole hour telling me about the neighbors' dog. {{They}} didn't once ask why I'm here.",
    minAge: 10,
    maxAge: 17,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ inPrison: true }, { juvenile: true }],
    person: { kind: ['grandparent'], minAge: 50 },
    choices: [
      {
        id: 'thank',
        label: 'Thank {{them}} for coming',
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 5 }, { log: 'I thanked {{person}} for coming. {{They}} said {{they}} would be back next month, same outfit.' }],
      },
      {
        id: 'sorry',
        label: "Say I'm sorry",
        effects: [{ karma: 2 }, { stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 4 }, { log: 'I told {{person}} I was sorry. {{They}} said "I know," and went back to the dog.' }],
      },
      {
        id: 'homework',
        label: 'Ask for help with schoolwork',
        // School carries on in detention for a student who was enrolled.
        conditions: [{ enrolled: true }],
        effects: [{ grade: 3 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 3 }, { log: '{{person}} spent the visiting hour quizzing me on spelling words. The guard learned them too.' }],
      },
      {
        id: 'cool',
        label: "Act like I don't care",
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: -5 }, { log: 'I acted bored the whole hour. {{person}} left a bag of cookies with the guard anyway.' }],
      },
    ],
  },
  {
    id: 'gp_prison_letters',
    category: 'prison',
    title: 'Letters from outside',
    text: 'Every week a letter comes from {{person}} in careful handwriting: the weather, the neighbors, what {{they}} had for dinner. At the bottom, every time: "I am not giving up on you."',
    minAge: 18,
    maxAge: 45,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: true }],
    person: { kind: ['grandparent'], minAge: 60 },
    choices: [
      {
        id: 'write',
        label: 'Write back every week',
        effects: [{ energy: -1 }, { stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 1 }, { relationship: 'person', delta: 6 }, { log: 'I wrote back every week. By spring we were arguing about the neighbors like old times.', kind: 'good' }],
      },
      {
        id: 'keep',
        label: 'Keep them under my bunk',
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -2 }, { log: 'I read every letter twice and kept them under my bunk. I never wrote back. I meant to.' }],
      },
      {
        id: 'visit',
        label: 'Ask {{them}} to visit',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 5 }, { log: "{{person}} came on visiting day with the neighbors' news in person. The guards liked {{them}}.", kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The trip was too much for {{person}} now. {{They}} sent an extra-long letter instead.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gp_same_chair',
    category: 'family',
    title: 'Same chair',
    text: 'Ever since I got out, {{person}} has set a place for me at Sunday dinner, in the same chair as always. Nobody at that table mentions where I was. {{They}} made sure of it.',
    minAge: 18,
    maxAge: 45,
    weight: 1.5,
    once: true,
    // `released` is set at every release and never cleared, so the text holds however long ago it was.
    conditions: [{ flag: 'released' }, { inPrison: false }],
    person: { kind: ['grandparent'], minAge: 60 },
    choices: [
      {
        id: 'show',
        label: 'Show up every Sunday',
        effects: [{ energy: -1 }, { stat: 'happiness', delta: 4 }, { relationship: 'person', delta: 6 }, { karma: 1 }, { log: 'I go every Sunday. {{person}} passes me the potatoes first, which in our family means a lot.', kind: 'good' }],
      },
      {
        id: 'truth',
        label: 'Tell {{them}} what it was like',
        effects: [{ stat: 'happiness', delta: -1 }, { stat: 'smarts', delta: 1 }, { relationship: 'person', delta: 5 }, { log: 'I told {{person}} about inside, the parts I could. {{They}} listened and refilled my plate.' }],
      },
      {
        id: 'distance',
        label: 'Keep my distance for now',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: -4 }, { log: 'I said I needed time. {{person}} said the chair would keep, and left a plate on my doorstep.' }],
      },
    ],
  },
];

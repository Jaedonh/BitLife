import type { EventDef } from '@/engine/events/schema';

/**
 * Ages 0-5: baby and toddler life. Choices are things a small child can
 * actually do (cry, hide, share, bite, hug). Parents and siblings are bound
 * through person selectors so the events read as personal.
 */
export const EARLY_CHILDHOOD_EVENTS: EventDef[] = [
  // ---------------------------------------------------------------- babies
  {
    id: 'ec_first_word',
    category: 'childhood',
    title: 'First word',
    text: 'I said my first real word today. {{mother}} dropped a spoon and shouted for the whole house to come and listen. Now they all want me to do it again.',
    minAge: 1,
    maxAge: 2,
    weight: 3,
    once: true,
    conditions: [{ hasPerson: ['father'] }, { hasPerson: ['mother'] }],
    choices: [
      {
        id: 'mama',
        label: 'Say "Mama"',
        effects: [
          { relationship: 'mother', delta: 4 },
          { stat: 'happiness', delta: 2 },
          { log: 'My first word was "Mama". {{mother}} cried. In a good way.', kind: 'milestone' },
        ],
      },
      {
        id: 'dada',
        label: 'Say "Dada"',
        conditions: [{ hasPerson: ['father'] }],
        effects: [
          { relationship: 'father', delta: 4 },
          { relationship: 'mother', delta: -1 },
          { stat: 'happiness', delta: 2 },
          { log: '"Dada." {{father}} did a victory lap of the kitchen. {{mother}} pretended not to mind.', kind: 'milestone' },
        ],
      },
      {
        id: 'no',
        label: 'Say "No"',
        effects: [
          { stat: 'smarts', delta: 2 },
          { relationship: 'mother', delta: -1 },
          { relationship: 'father', delta: -1 },
          { stat: 'happiness', delta: 1 },
          { log: 'My first word was "No". It set the tone for the next seventeen years.', kind: 'milestone' },
        ],
      },
      {
        id: 'surprise',
        label: 'Say something nobody expected',
        effects: [
          {
            random: [
              { weight: 50, effects: [{ stat: 'happiness', delta: 4 }, { log: 'I said "cookie", clear as a bell. I was immediately given a cookie. Lesson learned.', kind: 'good' }] },
              { weight: 50, effects: [{ stat: 'happiness', delta: 1 }, { karma: -1 }, { relationship: 'mother', delta: -2 }, { log: 'I repeated the word {{mother}} used when she dropped the spoon. The room went very quiet.', kind: 'bad' }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ec_crib_escape',
    category: 'childhood',
    title: 'The great escape',
    text: 'At three in the morning I figured out how to climb over the bars of my crib. The whole dark house is suddenly mine.',
    minAge: 1,
    maxAge: 2,
    weight: 2,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'explore',
        label: 'Go exploring',
        effects: [
          {
            random: [
              { weight: 50, effects: [{ stat: 'happiness', delta: 4 }, { stat: 'health', delta: -1 }, { log: 'I found the cookie jar and ate until I fell asleep under the table.', kind: 'good' }] },
              { weight: 30, effects: [{ stat: 'health', delta: -2 }, { stat: 'happiness', delta: -1 }, { relationship: 'person', delta: -1 }, { log: 'I ate part of a houseplant. The doctor said it was fine. {{person}} did not.', kind: 'bad' }] },
              { weight: 20, effects: [{ injury: 2 }, { stat: 'happiness', delta: -2 }, { log: 'I slipped on the way down and bumped my head. There was a lot of crying, mostly mine.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'back',
        label: 'Climb back in',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'A wise baby knows when to quit. I went back to sleep feeling very clever.' }],
      },
      {
        id: 'shout',
        label: 'Wail until someone comes',
        effects: [
          { relationship: 'person', delta: 2 },
          { stat: 'happiness', delta: 2 },
          { stat: 'health', delta: 1 },
          { log: '{{person}} shuffled in, sighed, and rocked me back to sleep. The service was excellent.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'ec_bath_time',
    category: 'childhood',
    title: 'Bath time',
    text: 'Bath time. The water is warm, the duck is yellow, and {{person}} has the look that means my hair is getting washed whether I like it or not.',
    minAge: 1,
    maxAge: 4,
    weight: 2,
    cooldown: 2,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'splash',
        label: 'Splash everything',
        effects: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: -2 }, { karma: -1 }, { log: '{{person}} ended up wetter than I did. I regret nothing.' }],
      },
      {
        id: 'allow',
        label: 'Let {{them}} wash it',
        effects: [{ stat: 'health', delta: 2 }, { relationship: 'person', delta: 3 }, { stat: 'happiness', delta: -1 }, { log: 'Soap in my eyes, but {{person}} sang the whole time. A fair trade.', kind: 'good' }],
      },
      {
        id: 'toys',
        label: 'Fill the tub with toys',
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.3,
            then: [{ relationship: 'person', delta: -2 }, { log: '{{person}} stepped on a plastic boat getting me out. Nobody was hurt. Nobody was pleased.', kind: 'bad' }],
            else: [{ log: 'With a full fleet in the water, the hair wash was over before I noticed.', kind: 'good' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ec_doctor_shots',
    category: 'childhood',
    title: 'The needle',
    text: 'At the clinic the doctor produced a needle. {{mother}} said it would be just a little pinch. I looked at the needle. I looked at her. Lies.',
    minAge: 1,
    maxAge: 5,
    weight: 2,
    cooldown: 2,
    conditions: [{ hasPerson: ['mother'] }],
    choices: [
      {
        id: 'scream',
        label: 'Scream the whole clinic down',
        effects: [{ stat: 'happiness', delta: -2 }, { stat: 'health', delta: 4 }, { relationship: 'mother', delta: 2 }, { log: 'I screamed before, during and long after. I got the shot, a sticker for volume and a cuddle.' }],
      },
      {
        id: 'brave',
        label: 'Be brave',
        effects: [
          { stat: 'health', delta: 4 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'One pinch, one sticker, no tears. The nurse said I was the bravest patient all day.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I was brave right up to the count of two. Then I screamed anyway. No sticker.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'bite',
        label: 'Bite the doctor',
        effects: [
          { karma: -3 },
          { stat: 'health', delta: 4 },
          { stat: 'happiness', delta: -1 },
          { relationship: 'mother', delta: -3 },
          { log: 'I bit the doctor. I still got the shot. We are not welcome at that clinic anymore.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'ec_itchy_spots',
    category: 'childhood',
    title: 'Itchy spots',
    text: 'I woke up covered in little pink spots and they all itch at once. {{mother}} took one look and said the word "chickenpox" like it was a swear word.',
    minAge: 1,
    maxAge: 5,
    weight: 1,
    once: true,
    conditions: [{ hasPerson: ['mother'] }],
    choices: [
      {
        id: 'scratch',
        label: 'Scratch everything',
        effects: [{ illness: 'chickenpox' }, { stat: 'looks', delta: -2 }, { stat: 'happiness', delta: 1 }, { log: 'I scratched until {{mother}} put socks on my hands. A few of the spots left little marks.', kind: 'bad' }],
      },
      {
        id: 'bath',
        label: 'Suffer the oatmeal baths',
        effects: [{ illness: 'chickenpox' }, { stat: 'happiness', delta: -2 }, { stat: 'health', delta: 1 }, { log: 'Oatmeal baths, pink lotion and no scratching. Boring, but my skin thanked me later.' }],
      },
      {
        id: 'share',
        label: 'Cuddle up to my sibling',
        conditions: [{ hasPerson: ['sibling'] }],
        effects: [
          { illness: 'chickenpox' },
          { karma: -2 },
          { relationship: 'sibling', delta: -3 },
          { stat: 'happiness', delta: 2 },
          { log: 'Misery loves company. A week later my sibling had spots too, and we itched together.' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------- toddlers
  {
    id: 'ec_potty_training',
    category: 'childhood',
    title: 'Potty training',
    text: '{{mother}} has introduced me to a small plastic throne and explained, with great seriousness, what it is for. There are stickers involved.',
    minAge: 2,
    maxAge: 3,
    weight: 3,
    once: true,
    conditions: [{ hasPerson: ['mother'] }],
    choices: [
      {
        id: 'master',
        label: 'Master it',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'mother', delta: 3 }, { log: 'I nailed it inside a week. I have a sticker chart to prove it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { relationship: 'mother', delta: -1 }, { log: 'There were accidents. Many accidents. Some of them in the car.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse on principle',
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'mother', delta: -3 }, { karma: -1 }, { log: 'I held out for months. It was glorious. {{mother}} aged visibly.' }],
      },
      {
        id: 'bribe',
        label: 'Only perform for stickers',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I learned that everything is a negotiation. I ended up with a great many stickers.' }],
      },
    ],
  },
  {
    id: 'ec_tantrum_shop',
    category: 'childhood',
    title: 'Candy aisle meltdown',
    text: 'In the middle of the grocery store, {{person}} said no to the candy. The word hit me like a wave. Now everyone in the aisle is looking at me.',
    minAge: 2,
    maxAge: 4,
    weight: 2,
    cooldown: 2,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'scream',
        label: 'Scream on the floor',
        effects: [
          { karma: -1 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: -2 }, { log: '{{person}} caved just to make it stop. Candy acquired. A dangerous lesson.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: -3 }, { log: '{{person}} carried me out under one arm like a rolled-up rug. No candy.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'sulk',
        label: 'Sulk in silence',
        effects: [{ stat: 'happiness', delta: -2 }, { karma: 1 }, { stat: 'smarts', delta: 2 }, { relationship: 'person', delta: 2 }, { log: 'I sulked all the way home. {{person}} said I handled it like a grown-up. It felt like a loss.' }],
      },
      {
        id: 'hug',
        label: 'Hug {{them}} and move on',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: 4 }, { karma: 1 }, { log: "I hugged {{person}}'s leg and let it go. {{They}} looked suspicious, then relieved.", kind: 'good' }],
      },
    ],
  },
  {
    id: 'ec_daycare_first_day',
    category: 'childhood',
    title: 'First day at daycare',
    text: 'My first day at daycare. A room full of strangers my size, a strong smell of crayons, and {{mother}} walking toward the door without me.',
    minAge: 2,
    maxAge: 4,
    weight: 2,
    once: true,
    conditions: [{ hasPerson: ['mother'] }],
    choices: [
      {
        id: 'cling',
        label: 'Cling and cry',
        effects: [{ stat: 'happiness', delta: -3 }, { relationship: 'mother', delta: 2 }, { log: "I held on to {{mother}}'s leg for twenty minutes. She stayed. The staff gave her a look.", kind: 'bad' }],
      },
      {
        id: 'brave',
        label: 'March in bravely',
        effects: [
          {
            chance: 0.6,
            then: [
              { newPerson: { kind: 'friend', minAge: 2, maxAge: 5, relationship: 60, log: 'I made a friend at daycare: {{person}}. We shared a tub of blocks.' } },
              { stat: 'happiness', delta: 4 },
              { log: 'By snack time I had a friend and a block tower. Daycare is fine, actually.', kind: 'good' },
            ],
            else: [{ injury: 1 }, { stat: 'happiness', delta: -2 }, { log: 'Another kid bit me within the hour. Daycare is a jungle.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'hide',
        label: 'Hide under the table',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 1 }, { log: 'I spent the day under a table, observing. I learned a great deal about ankles.' }],
      },
    ],
  },
  {
    id: 'ec_lost_in_shop',
    category: 'childhood',
    title: 'Lost in the store',
    text: "I let go of {{person}}'s hand for one second to look at a shiny thing, and when I turned around {{they}} had vanished. The store is suddenly enormous.",
    minAge: 2,
    maxAge: 5,
    weight: 1.5,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'wail',
        label: 'Wail',
        effects: [
          {
            chance: 0.8,
            then: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: 2 }, { log: 'A store clerk found {{person}} in about two minutes. Crisis over. The tears were mostly for show.' }],
            else: [{ stat: 'happiness', delta: -4 }, { relationship: 'person', delta: 4 }, { log: 'It took twenty minutes. When {{person}} found me, {{they}} cried harder than I did.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'stay',
        label: 'Stay by the shiny thing',
        effects: [
          { stat: 'smarts', delta: 3 },
          { stat: 'happiness', delta: -1 },
          { relationship: 'person', delta: 3 },
          { log: '{{person}} found me right by the shiny thing. {{They}} called me clever. I agreed.', kind: 'good' },
        ],
      },
      {
        id: 'explore',
        label: 'Go exploring',
        effects: [
          {
            random: [
              { weight: 60, effects: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: -4 }, { log: 'I found the toy aisle. Best ten minutes of my life. Then {{person}} found me and it got less fun.' }] },
              { weight: 40, effects: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: -2 }, { log: 'I ended up in the stockroom. A guard carried me back like a package. {{person}} had gone gray.', kind: 'bad' }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ec_picky_eater',
    category: 'childhood',
    title: 'Something green',
    text: '{{person}} put something green on my plate and called it dinner. It is touching the potatoes. Everything it touches is now ruined.',
    minAge: 2,
    maxAge: 5,
    weight: 2,
    cooldown: 2,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'eat',
        label: 'Eat it',
        effects: [{ stat: 'health', delta: 3 }, { stat: 'happiness', delta: -2 }, { relationship: 'person', delta: 2 }, { log: 'I ate the green thing with my eyes shut. {{person}} was so pleased it was almost worth it.', kind: 'good' }],
      },
      {
        id: 'floor',
        label: 'Feed it to the floor',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'Nobody noticed. The floor has eaten better than I have this week.' }],
            else: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: -2 }, { log: 'Busted. No dessert, and {{person}} gave a speech about waste.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'deal',
        label: 'Bargain for dessert',
        effects: [
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { stat: 'health', delta: 1 }, { log: 'Three bites for one cookie, agreed entirely by pointing. {{person}} blinked first.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: '{{person}} does not negotiate with toddlers. I sat there until the green thing went cold.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ec_closet_monster',
    category: 'childhood',
    title: 'Closet monster',
    text: 'There is a monster in my closet. I can hear it breathing. It is dark and lumpy and it has been watching me since the light went off.',
    minAge: 3,
    maxAge: 5,
    weight: 2,
    cooldown: 2,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'call',
        label: 'Yell for {{person}}',
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: '{{person}} came in, opened the closet and introduced me to a coat. The coat and I are fine now.', kind: 'good' }],
      },
      {
        id: 'face',
        label: 'Face it alone',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I marched over and poked it. It was a coat. I am the bravest person in this house.', kind: 'good' }],
            else: [{ stat: 'health', delta: -2 }, { stat: 'happiness', delta: -3 }, { log: 'I could not do it. I lay rigid until dawn. The coat won.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'under',
        label: 'Sleep under the bed',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'health', delta: -1 }, { stat: 'happiness', delta: 1 }, { log: 'Monsters cannot bend down. Everyone knows that. I slept on the floor and woke up stiff but alive.' }],
      },
    ],
  },
  {
    id: 'ec_scary_dog',
    category: 'childhood',
    title: 'Big dog',
    text: 'A dog the size of a couch trotted up on the sidewalk and barked right in my face. It has a lot of teeth. I am still working on mine.',
    minAge: 2,
    maxAge: 5,
    weight: 2,
    cooldown: 3,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'freeze',
        label: 'Freeze and cry',
        effects: [{ stat: 'happiness', delta: -3 }, { log: 'I stood rooted to the spot and wailed. The owner apologized forty times and dragged the dog away.', kind: 'bad' }],
      },
      {
        id: 'run',
        label: 'Run',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: -1 }, { relationship: 'person', delta: 1 }, { log: "I ran straight into {{person}}'s legs and stayed there. Safe harbor." }],
            else: [{ injury: 2 }, { stat: 'happiness', delta: -3 }, { log: 'I tripped on the curb and scraped both knees. The dog looked concerned.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'pat',
        label: 'Pet it',
        effects: [
          {
            chance: 0.65,
            then: [{ stat: 'happiness', delta: 5 }, { karma: 1 }, { log: 'It licked my entire face. We are friends now. The owner said I was very brave.', kind: 'good' }],
            else: [{ injury: 2 }, { stat: 'happiness', delta: -4 }, { log: 'It nipped my hand. Not hard, but hard enough. I have opinions about dogs now.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ec_puddle',
    category: 'childhood',
    title: 'The puddle',
    text: 'It rained all morning and now the backyard is one enormous puddle. {{person}} is standing right beside it in clean clothes, not paying attention.',
    minAge: 2,
    maxAge: 5,
    weight: 2,
    cooldown: 2,
    person: { kind: ['mother', 'father', 'sibling'], minAge: 4 },
    choices: [
      {
        id: 'jump',
        label: 'Jump in it',
        effects: [
          { stat: 'happiness', delta: 5 },
          {
            chance: 0.3,
            then: [{ illness: 'cold' }, { log: 'I jumped, I splashed, I caught a cold. The puddle was still worth it.' }],
            else: [{ log: 'I jumped in with both feet. Muddy to the ears and gloriously happy.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'drag',
        label: 'Drag {{person}} in too',
        effects: [
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 4 }, { log: '{{person}} shrieked, then jumped in after me. We were both in trouble, together.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -4 }, { log: "{{person}}'s shoes were ruined and so was {{their}} mood. I was sent inside.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'watch',
        label: 'Watch from the window',
        effects: [{ stat: 'happiness', delta: 1 }, { stat: 'health', delta: 1 }, { log: 'I watched the puddle from inside, warm and dry and slightly bored.' }],
      },
    ],
  },

  // ---------------------------------------------------------------- family
  {
    id: 'ec_baby_sibling',
    category: 'childhood',
    title: 'New baby',
    text: "{{person}}'s tummy got bigger and bigger, and then one day she came home from the hospital carrying a tiny, red, shouting person. Apparently it lives here now.",
    minAge: 3,
    maxAge: 5,
    weight: 1.2,
    once: true,
    person: { kind: ['mother'], maxAge: 44 },
    choices: [
      {
        id: 'hug',
        label: 'Hug the baby',
        effects: [
          { newPerson: { kind: 'sibling', minAge: 0, maxAge: 0, relationship: 65, log: '{{mother}} came home from the hospital with a new baby: my little sibling, {{person}}.' } },
          { relationship: 'person', delta: 3 },
          { stat: 'happiness', delta: 3 },
          { karma: 1 },
          { log: 'I hugged the baby very gently. {{person}} took about a hundred photos.', kind: 'good' },
          { queue: 'ec_baby_sibling_night' },
        ],
      },
      {
        id: 'return',
        label: 'Ask to send it back',
        effects: [
          { newPerson: { kind: 'sibling', minAge: 0, maxAge: 0, relationship: 45, log: '{{mother}} came home from the hospital with a new baby: my little sibling, {{person}}.' } },
          { stat: 'happiness', delta: 2 },
          { stat: 'smarts', delta: 2 },
          { karma: -1 },
          { relationship: 'person', delta: -2 },
          { log: "I asked whether the hospital took returns. {{person}} laughed, and then didn't.", kind: 'bad' },
          { queue: 'ec_baby_sibling_night' },
        ],
      },
      {
        id: 'poke',
        label: 'Poke it',
        effects: [
          { newPerson: { kind: 'sibling', minAge: 0, maxAge: 0, relationship: 50, log: '{{mother}} came home from the hospital with a new baby: my little sibling, {{person}}.' } },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'sibling', delta: 3 }, { log: 'The baby grabbed my finger and would not let go. Fine. It can stay.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -3 }, { log: 'The baby screamed like a kettle. {{person}} moved me to a different room.', kind: 'bad' }],
          },
          { queue: 'ec_baby_sibling_night' },
        ],
      },
    ],
  },
  {
    id: 'ec_baby_sibling_night',
    category: 'childhood',
    title: 'The baby cries',
    text: 'The baby cries all night, every night. {{person}} walks the hallway with it for hours, and the walls in this house are thin.',
    minAge: 3,
    maxAge: 6,
    weight: 1,
    followUpOnly: true,
    person: { kind: ['mother'] },
    choices: [
      {
        id: 'cry',
        label: 'Cry along with it',
        effects: [{ stat: 'happiness', delta: -2 }, { stat: 'health', delta: -1 }, { relationship: 'person', delta: 3 }, { log: 'Two of us crying and {{person}} close to it. We all ended up in the big bed. Nobody slept.', kind: 'bad' }],
      },
      {
        id: 'sleep',
        label: 'Sleep through it somehow',
        effects: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I discovered I can sleep through anything. A skill for life.' }],
      },
      {
        id: 'sing',
        label: 'Sing to my little sibling',
        effects: [
          { relationship: 'sibling', delta: 4 },
          { relationship: 'person', delta: 2 },
          { karma: 2 },
          { stat: 'happiness', delta: 1 },
          { stat: 'health', delta: -1 },
          { log: 'I sang the only song I know, badly. The baby stopped crying to listen. {{person}} nearly wept.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'ec_sibling_tower',
    category: 'childhood',
    title: 'Tower trouble',
    text: 'I spent all morning stacking blocks into the tallest tower of my life. {{person}} walked past, kicked it over, and laughed all the way down the hall.',
    minAge: 2,
    maxAge: 5,
    weight: 2,
    cooldown: 2,
    person: { kind: ['sibling'], minAge: 2, maxAge: 12 },
    conditions: [{ hasPerson: ['mother'] }],
    choices: [
      {
        id: 'bite',
        label: 'Bite {{them}}',
        effects: [
          { karma: -3 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: -6 }, { stat: 'happiness', delta: -3 }, { log: 'I bit {{person}} on the arm. {{They}} howled and I got the longest time-out of my life.', kind: 'bad' }],
            else: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: 4 }, { log: '{{person}} yelped and left my towers alone after that. Justice, toddler style.' }],
          },
        ],
      },
      {
        id: 'tell',
        label: 'Cry for {{mother}}',
        conditions: [{ hasPerson: ['mother'] }],
        effects: [
          { relationship: 'person', delta: -2 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 3 }, { relationship: 'mother', delta: 1 }, { log: '{{mother}} made {{person}} help me rebuild it. {{They}} sulked the whole time.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: '{{mother}} told us to work it out ourselves. {{person}} grinned.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'rebuild',
        label: 'Build it taller',
        effects: [
          { stat: 'smarts', delta: 3 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: 2 },
          { log: 'I built it taller. {{person}} got bored of kicking and started helping. It touched the lamp.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'ec_sibling_fort',
    category: 'childhood',
    title: 'Blanket kingdom',
    text: '{{person}} has built a fort out of every blanket in the house and declared it {{their}} kingdom. There is a sign on the door. It says NO BABIES.',
    minAge: 3,
    maxAge: 5,
    weight: 1.5,
    cooldown: 3,
    person: { kind: ['sibling'], minAge: 5, maxAge: 13 },
    conditions: [{ hasPerson: ['mother'] }],
    choices: [
      {
        id: 'sneak',
        label: 'Sneak in anyway',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 4 }, { log: 'I was captured, tried, and then knighted. We ruled the fort together until dinner.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -2 }, { log: 'I was thrown out through the back wall. The wall was a towel, so it was not dramatic.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'rival',
        label: 'Build a rival fort',
        effects: [{ stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -1 }, { log: 'My fort was smaller, but it had a working drawbridge. {{person}} pretended not to be impressed.' }],
      },
      {
        id: 'tell',
        label: 'Tell {{mother}}',
        conditions: [{ hasPerson: ['mother'] }],
        effects: [{ karma: -1 }, { relationship: 'person', delta: -4 }, { relationship: 'mother', delta: 1 }, { stat: 'happiness', delta: 3 }, { log: 'The kingdom was dissolved by royal decree at bath time. {{person}} blamed me. Correctly.' }],
      },
    ],
  },
  {
    id: 'ec_only_child',
    category: 'childhood',
    title: 'Only child',
    text: 'Every kid at the park seems to have a brother or sister to fight with. I have a very patient teddy bear and the undivided attention of my parents.',
    minAge: 3,
    maxAge: 5,
    weight: 1,
    once: true,
    conditions: [{ hasPerson: ['mother'] }, { noPerson: ['sibling'] }],
    choices: [
      {
        id: 'teddy',
        label: 'Fight with the teddy instead',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'The teddy lost. The teddy always loses. That is the beauty of the teddy.', kind: 'good' }],
      },
      {
        id: 'ask',
        label: 'Ask {{mother}} for a sibling',
        conditions: [{ hasPerson: ['mother'] }],
        effects: [
          { stat: 'happiness', delta: 1 },
          {
            random: [
              { weight: 50, effects: [{ relationship: 'mother', delta: -1 }, { log: '{{mother}} laughed so hard she had to sit down. I took that as a no.' }] },
              { weight: 50, effects: [{ relationship: 'mother', delta: 3 }, { log: '{{mother}} went very quiet and gave me a long hug. I did not ask again.' }] },
            ],
          },
        ],
      },
      {
        id: 'enjoy',
        label: 'Enjoy the peace',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'health', delta: 1 }, { log: 'Nobody steals my toys and nobody bites me. Being an only child has its upsides.' }],
      },
    ],
  },
  {
    id: 'ec_parents_arguing',
    category: 'childhood',
    title: 'Loud voices',
    text: '{{mother}} and {{father}} were shouting at each other in the kitchen tonight. I could not follow the words, only the tone, and I did not like the tone at all.',
    minAge: 2,
    maxAge: 5,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ hasPerson: ['mother'] }, { hasPerson: ['father'] }],
    choices: [
      {
        id: 'hide',
        label: 'Hide under the bed',
        effects: [{ stat: 'happiness', delta: -3 }, { stat: 'smarts', delta: 1 }, { log: 'I stayed under the bed until it went quiet. The quiet was not much better.', kind: 'bad' }],
      },
      {
        id: 'cry',
        label: 'Cry very loudly',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: -1 }, { relationship: 'mother', delta: 2 }, { relationship: 'father', delta: 2 }, { log: 'They both stopped and came running. For a while, the fuss was about me instead.' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'It got louder. Then a door slammed. I cried myself to sleep.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'toy',
        label: 'Offer them my favorite toy',
        effects: [
          { karma: 2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { relationship: 'mother', delta: 3 }, { relationship: 'father', delta: 3 }, { log: 'I handed {{father}} my bear. He laughed, {{mother}} laughed, and that was the end of it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'They barely noticed the bear. I took it back and went to my room.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ec_no_father',
    category: 'childhood',
    title: "Where's your dad?",
    text: 'A kid at the park asked me where my dad was. I realized I did not have an answer ready, and the kid was still standing there waiting for one.',
    minAge: 3,
    maxAge: 5,
    weight: 1,
    once: true,
    conditions: [{ noPerson: ['father'] }, { hasPerson: ['mother'] }],
    choices: [
      {
        id: 'ask',
        label: 'Ask {{mother}} that night',
        effects: [{ relationship: 'mother', delta: 3 }, { stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: -2 }, { log: '{{mother}} told me the truth, the short version. It was a quiet evening after that.' }],
      },
      {
        id: 'story',
        label: 'Make up a story',
        effects: [{ stat: 'smarts', delta: 1 }, { karma: -1 }, { stat: 'happiness', delta: 2 }, { log: 'I said he was an astronaut. The kid was very impressed. So, briefly, was I.' }],
      },
      {
        id: 'shrug',
        label: 'Shrug',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I shrugged and went back to the sandbox. Some questions can wait.' }],
      },
    ],
  },
  {
    id: 'ec_grandma_visit',
    category: 'childhood',
    title: "Grandma's visit",
    text: 'Grandma has come to stay for a whole week. She smells like peppermints, calls me by the wrong name sometimes, and allows seconds of absolutely everything.',
    minAge: 2,
    maxAge: 5,
    weight: 2,
    cooldown: 2,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'bake',
        label: 'Help her bake',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 3 }, { stat: 'health', delta: -1 }, { log: 'We made cookies. I ate most of the dough. Grandma said that was the proper way.', kind: 'good' }],
      },
      {
        id: 'show',
        label: 'Put on a show for her',
        effects: [
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.7,
            then: [{ money: 20 }, { stat: 'happiness', delta: 1 }, { log: 'I sang all three songs I know. Grandma slipped me {{$20}} and said not to tell {{person}}.', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'Grandma fell asleep halfway through my second song. Tough crowd.' }],
          },
        ],
      },
      {
        id: 'hide',
        label: 'Hide from the kisses',
        effects: [{ stat: 'happiness', delta: 3 }, { karma: -1 }, { relationship: 'person', delta: -1 }, { log: 'I hid behind the couch whenever she puckered up. {{person}} called it rude. Grandma found it funny.' }],
      },
    ],
  },
  {
    id: 'ec_grandpa_story',
    category: 'childhood',
    title: "Grandpa's tale",
    text: 'Grandpa sat me on his knee and told me about the time he wrestled a goose, won, and was given a medal by the mayor. {{mother}} rolled her eyes.',
    minAge: 3,
    maxAge: 5,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ hasPerson: ['mother'] }],
    choices: [
      {
        id: 'believe',
        label: 'Believe every word',
        effects: [{ stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: -1 }, { log: 'I now know a great deal about goose wrestling, none of it true. Worth it.', kind: 'good' }],
      },
      {
        id: 'question',
        label: 'Ask too many questions',
        effects: [{ stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: 1 }, { log: 'By question four the goose was a swan and the medal a handshake. I had learned about evidence.' }],
      },
      {
        id: 'sleep',
        label: 'Fall asleep halfway',
        effects: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I dozed off somewhere around the goose. Grandpa kept going. He did not need an audience.' }],
      },
    ],
  },
  {
    id: 'ec_nanny',
    category: 'childhood',
    title: 'The nanny',
    text: 'My parents have hired a nanny. She arrived with a suitcase, a schedule and a whistle. The whistle has already been used twice. It is nine in the morning.',
    minAge: 2,
    maxAge: 5,
    weight: 1.5,
    once: true,
    conditions: [{ flag: 'wealthyFamily' }],
    choices: [
      {
        id: 'follow',
        label: 'Follow the schedule',
        effects: [{ stat: 'smarts', delta: 4 }, { stat: 'happiness', delta: -2 }, { log: 'Flashcards at ten, French at eleven, nap at twelve. I am very well educated and slightly miserable.' }],
      },
      {
        id: 'rebel',
        label: 'Rebel',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: -1 }, { karma: -1 }, { log: 'I hid the whistle in the fish tank. The nanny found it, dried it, and blew it. Respect.' }],
      },
      {
        id: 'charm',
        label: 'Charm her',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 2 }, { relationship: 'mother', delta: 1 }, { log: 'I pointed at her shoes and said "pretty". By Friday the schedule had a lot more cake in it.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'ec_hand_me_downs',
    category: 'childhood',
    title: 'Hand-me-downs',
    text: 'All my clothes used to belong to somebody else. My winter coat has a name sewn into the collar, and it is not my name. The grown-ups keep saying money is tight.',
    minAge: 3,
    maxAge: 5,
    weight: 1.5,
    once: true,
    conditions: [{ hasPerson: ['mother'] }, { flag: 'poorFamily' }],
    choices: [
      {
        id: 'proud',
        label: 'Wear it proudly',
        effects: [{ stat: 'happiness', delta: 2 }, { karma: 2 }, { log: 'The coat is warm and that is what coats are for. I decided not to care about the name.' }],
      },
      {
        id: 'complain',
        label: 'Complain to {{mother}}',
        conditions: [{ hasPerson: ['mother'] }],
        effects: [{ relationship: 'mother', delta: -3 }, { stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 2 }, { log: 'I whined about the coat. {{mother}} went very quiet. I understood later what that quiet meant.', kind: 'bad' }],
      },
      {
        id: 'cape',
        label: 'Pretend it is a cape',
        effects: [{ stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 1 }, { log: 'The coat is a cape and the name is my secret identity. Problem solved.', kind: 'good' }],
      },
    ],
  },

  // ------------------------------------------------------- pets and friends
  {
    id: 'ec_puppy',
    category: 'childhood',
    title: 'A puppy',
    text: 'A cardboard box arrived in the kitchen and the box was wriggling. Inside was a puppy with enormous paws and a tail that would not stop. It is, apparently, ours.',
    minAge: 2,
    maxAge: 5,
    weight: 1,
    once: true,
    conditions: [{ noPerson: ['pet'] }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'sensible',
        label: 'Name it something sensible',
        effects: [
          { newPerson: { kind: 'pet', species: 'dog', relationship: 70, log: 'We got a puppy. I named {{them}} {{person}}.' } },
          { stat: 'happiness', delta: 5 },
          { stat: 'smarts', delta: 1 },
          { log: 'I picked a sensible name. Everyone agreed it suited the dog.', kind: 'good' },
          { queue: 'ec_puppy_night' },
        ],
      },
      {
        id: 'silly',
        label: 'Call it Spaghetti',
        effects: [
          { newPerson: { kind: 'pet', species: 'dog', relationship: 75, log: 'We got a puppy. Officially {{they}} is called {{person}}. Unofficially, Spaghetti.' } },
          { stat: 'happiness', delta: 7 },
          { relationship: 'person', delta: -1 },
          { log: 'I shouted "Spaghetti!" and the puppy came running. {{person}} refuses to shout it at the park.', kind: 'good' },
          { queue: 'ec_puppy_night' },
        ],
      },
      {
        id: 'scared',
        label: 'Hide behind {{person}}',
        effects: [
          { newPerson: { kind: 'pet', species: 'dog', relationship: 35, log: 'We got a puppy called {{person}}. I was not consulted.' } },
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: 2 },
          { log: 'The puppy stayed anyway. So did I, mostly behind {{person}}. We would have to work it out.' },
          { queue: 'ec_puppy_night' },
        ],
      },
    ],
  },
  {
    id: 'ec_puppy_night',
    category: 'childhood',
    title: "Puppy's first night",
    text: 'The puppy is in a crate in the kitchen and it is whimpering like the loneliest creature on earth. I can hear it from my bed.',
    minAge: 2,
    maxAge: 6,
    weight: 1,
    followUpOnly: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'sneak',
        label: 'Sneak it into bed',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 5 }, { relationship: 'pet', delta: 8 }, { log: 'Warm, snoring puppy under the blanket. Best night of my life so far.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { relationship: 'pet', delta: 4 }, { relationship: 'person', delta: -2 }, { log: 'The puppy had an accident on my pillow. {{person}} found us both at dawn.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'ears',
        label: 'Cover my ears and sleep',
        effects: [{ stat: 'health', delta: 1 }, { log: 'I pulled the pillow over my head. By morning the puppy had given up, and so had I.' }],
      },
      {
        id: 'cry',
        label: 'Cry along with it',
        effects: [{ stat: 'happiness', delta: -2 }, { relationship: 'pet', delta: 3 }, { relationship: 'person', delta: 1 }, { log: 'We whimpered in harmony until {{person}} came and sat with both of us.' }],
      },
    ],
  },
  {
    id: 'ec_first_friend',
    category: 'childhood',
    title: 'First friend',
    text: 'A kid in the sandbox handed me a bucket, looked me in the eye and said we are friends now. Apparently that is how it works. Nobody told me.',
    minAge: 3,
    maxAge: 5,
    weight: 2,
    once: true,
    conditions: [{ hasPerson: ['mother'] }, { noPerson: ['friend', 'bestFriend'] }],
    choices: [
      {
        id: 'accept',
        label: 'Accept the bucket',
        effects: [
          { newPerson: { kind: 'friend', minAge: 3, maxAge: 6, relationship: 65, log: 'I made my first friend, {{person}}, over a bucket in the sandbox.' } },
          { stat: 'happiness', delta: 5 },
          { log: 'We built a castle, flooded it, and rebuilt it. Friendship is easy when you are little.', kind: 'good' },
        ],
      },
      {
        id: 'demand',
        label: 'Demand the shovel too',
        effects: [
          { karma: -2 },
          {
            chance: 0.5,
            then: [
              { newPerson: { kind: 'friend', minAge: 3, maxAge: 6, relationship: 50, log: 'After a scuffle over a shovel, {{person}} and I decided to be friends anyway.' } },
              { stat: 'happiness', delta: 3 },
              { stat: 'smarts', delta: 2 },
              { log: 'We fought over the shovel, cried, then shared it. A friendship forged in sand.' },
            ],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The kid took the bucket and left. I had a shovel and nobody to dig with.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'shy',
        label: 'Run to {{mother}}',
        conditions: [{ hasPerson: ['mother'] }],
        effects: [{ stat: 'happiness', delta: -1 }, { relationship: 'mother', delta: 2 }, { log: "I handed the bucket back and hid in {{mother}}'s coat. Not today. Maybe tomorrow." }],
      },
    ],
  },
  {
    id: 'ec_imaginary_friend',
    category: 'childhood',
    title: 'Captain Noodle',
    text: 'I have a new best friend. His name is Captain Noodle, he is seven feet tall, and nobody else can see him. He has strong opinions about dinner.',
    minAge: 3,
    maxAge: 5,
    weight: 1.5,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'place',
        label: 'Set him a place at dinner',
        effects: [
          { stat: 'happiness', delta: 4 },
          { stat: 'smarts', delta: 2 },
          { relationship: 'person', delta: -1 },
          { log: 'Every night {{person}} had to set the Captain a plate. He never ate a bite. Nobody minded.', kind: 'good' },
        ],
      },
      {
        id: 'blame',
        label: 'Blame him for the lamp',
        effects: [
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'It worked. Captain Noodle took the fall for me. A true friend.' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The Captain was tried in his absence and I served his time-out. Justice is strange.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'goodbye',
        label: 'Say goodbye to him',
        effects: [{ stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 3 }, { log: 'I told the Captain I did not need him anymore. He saluted and walked through the wall.' }],
      },
    ],
  },

  // ------------------------------------------------------------- the rest
  {
    id: 'ec_birthday_party',
    category: 'childhood',
    title: 'Birthday party',
    text: 'It is my birthday. There is cake, there are balloons, and there is a clown who is slightly too tall and keeps looking at the door.',
    minAge: 3,
    maxAge: 5,
    weight: 2,
    cooldown: 2,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'wish',
        label: 'Blow out the candles',
        effects: [
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.3,
            then: [{ money: 50 }, { log: "I wished for treasure. Grandma's card had {{$50}} in it. Wishes work.", kind: 'money' }],
            else: [{ log: 'I wished for a pony. No pony arrived, but the cake was excellent.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'smash',
        label: 'Smash the cake with both hands',
        effects: [
          { stat: 'happiness', delta: 6 },
          { stat: 'looks', delta: -1 },
          { karma: -1 },
          { relationship: 'person', delta: -2 },
          { log: 'Cake everywhere. The photos are legendary. {{person}} is still finding frosting.' },
        ],
      },
      {
        id: 'clown',
        label: 'Hide from the clown',
        effects: [{ stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 1 }, { log: 'I spent my own party behind the couch. The clown left early. I call that a win.' }],
      },
    ],
  },
  {
    id: 'ec_early_reader',
    category: 'childhood',
    title: 'Cereal box',
    text: 'I read the back of the cereal box out loud at breakfast, all the way down to the small print. {{mother}} put the milk down very, very slowly.',
    minAge: 3,
    maxAge: 5,
    weight: 1.5,
    once: true,
    conditions: [{ stat: 'smarts', gte: 55 }, { hasPerson: ['mother'] }],
    choices: [
      {
        id: 'read',
        label: 'Read everything, always',
        effects: [{ stat: 'smarts', delta: 5 }, { stat: 'happiness', delta: 1 }, { log: "Road signs, cereal boxes, {{mother}}'s mail. Nothing in the house was safe from being read aloud.", kind: 'good' }],
      },
      {
        id: 'fluke',
        label: 'Pretend it was a fluke',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I did not want flashcards. I went back to pretending letters were squiggles.' }],
      },
      {
        id: 'show',
        label: 'Perform for every visitor',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 3 }, { karma: -1 }, { log: 'I read to the mail carrier, the neighbor and a very patient plumber. Insufferable, and delighted.' }],
      },
    ],
  },
  {
    id: 'ec_loud_noises',
    category: 'childhood',
    title: 'Fireworks',
    text: 'Fireworks went off down the street tonight without warning. Every bang felt like it was aimed at me, and the gaps between them were somehow worse.',
    minAge: 2,
    maxAge: 5,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ trait: 'anxious' }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'hide',
        label: 'Hide under the blankets',
        effects: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: 2 }, { log: 'I shook under the blanket until it was over. {{person}} sat on the end of the bed the whole time.', kind: 'bad' }],
      },
      {
        id: 'watch',
        label: 'Make myself watch',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'By the end I was counting the colors instead of the bangs. A small victory.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'I lasted four bangs, then screamed. Nobody blamed me.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'music',
        label: 'Ask for loud music',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: '{{person}} turned the radio up and we danced over the bangs. I learned a useful trick that night.' }],
      },
    ],
  },
];

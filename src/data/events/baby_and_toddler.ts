import type { EventDef } from '@/engine/events/schema';

/**
 * Ages 0-5, told by the baby or toddler: the first bath, the first night home,
 * visitors, smiles, hiccups, a terrible lullaby, teething, first foods, first
 * shoes, the "no" and "why" phases, preschool drop-off and friendships, being
 * the big sibling of a new baby, a single-parent home, a new stepdad, colds,
 * ear infections and checkups. Choices are things a small child can do (cry,
 * grab, giggle, hide, refuse the spoon); parents pay for everything.
 *
 * The engine opens no event while the player is 0 (the first age-up makes them
 * 1), so the newborn cards carry minAge 0 and maxAge 1 and read as the first year.
 */
export const BABY_AND_TODDLER_EVENTS: EventDef[] = [
  // --------------------------------------------------------------- newborn
  {
    id: 'bt_first_bath',
    category: 'childhood',
    title: 'First bath',
    text: 'My first real bath, in a plastic tub in the kitchen sink. {{person}} is holding me like a bomb that might go off, and the water is one degree too wet.',
    minAge: 0,
    maxAge: 0,
    weight: 1,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'scream',
        label: 'Scream like a kettle',
        effects: [
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: 3 },
          { log: 'I screamed from the first drop to the last. Then {{person}} rolled me up in a towel like a burrito.' },
        ],
      },
      {
        id: 'kick',
        label: 'Kick like a frog',
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'health', delta: 1 },
          { log: 'I kicked like a frog the whole bath and went nowhere. {{person}} said I was a natural swimmer.' },
        ],
      },
      {
        id: 'float',
        label: 'Go floppy and blissful',
        effects: [
          { stat: 'health', delta: 1 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 2 }, { log: 'I went limp with joy and nearly fell asleep in the sink. {{person}} took forty photos.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { relationship: 'person', delta: -1 }, { log: 'I relaxed so completely that I peed in the tub. {{person}} had to start over.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'bt_first_night_home',
    category: 'childhood',
    title: 'Still breathing',
    text: 'My first night home. The crib is enormous, the room is dark, and every few minutes {{person}} leans over to check that I am still breathing. I am. Loudly.',
    minAge: 0,
    maxAge: 0,
    weight: 1,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'hourly',
        label: 'Wake up every two hours',
        effects: [
          { stat: 'health', delta: 3 },
          { relationship: 'person', delta: -1 },
          { log: 'I demanded milk at eleven, one, three and five. By morning {{person}} had forgotten how doors work.' },
        ],
      },
      {
        id: 'sleep',
        label: 'Sleep straight through',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I slept six hours straight. {{person}} panicked twice and woke me up to check.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I slept for twenty minutes, which I considered a full night. Nobody agreed.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'chest',
        label: 'Only sleep on {{person}}',
        effects: [
          { relationship: 'person', delta: 4 },
          { stat: 'happiness', delta: 2 },
          { stat: 'health', delta: -1 },
          { log: "The crib was rejected. I slept on {{person}}'s chest all night and {{they}} did not dare move.", kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'bt_passed_around',
    category: 'childhood',
    title: 'Pass the baby',
    text: 'Everyone came over to meet me, and I have been passed from arm to arm like a warm loaf: an aunt in strong perfume, a neighbor with cold hands, a cousin who is not allowed.',
    minAge: 0,
    maxAge: 0,
    weight: 1,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'smile',
        label: 'Smile at everyone',
        effects: [
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.3,
            then: [{ illness: 'cold' }, { log: 'I smiled at every visitor. Two of them had colds. Now so do I.', kind: 'bad' }],
            else: [{ stat: 'looks', delta: 1 }, { log: 'I smiled at every visitor. Each of them said I looked like a different relative.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'spit',
        label: 'Spit up on the perfume',
        effects: [
          { stat: 'happiness', delta: 2 },
          { karma: -1 },
          { relationship: 'person', delta: 1 },
          { log: 'I spat up on the aunt in the perfume. I was handed back to {{person}} very quickly.' },
        ],
      },
      {
        id: 'cousin',
        label: 'Reach for the cousin',
        effects: [
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: -2 },
          { log: 'I reached for the cousin and the cousin was allowed, briefly. I was fine. The cousin was terrified.' },
        ],
      },
      {
        id: 'wail',
        label: 'Wail until returned',
        effects: [
          { stat: 'happiness', delta: -1 },
          { relationship: 'person', delta: 3 },
          { log: 'I wailed until I was back with {{person}}. The visitors left early. {{person}} did not mind at all.' },
        ],
      },
    ],
  },
  {
    id: 'bt_finger_grab',
    category: 'family',
    title: 'The grip',
    text: '{{person}} held out one finger to see what I would do. I grabbed it. Now my grip is famous, and {{they}} tells everyone it is the strongest in the family.',
    minAge: 0,
    maxAge: 0,
    weight: 1,
    once: true,
    person: { kind: ['father'] },
    choices: [
      {
        id: 'hold',
        label: 'Never let go',
        effects: [
          { relationship: 'person', delta: 5 },
          { stat: 'happiness', delta: 1 },
          { log: 'I held on through dinner, a phone call and a nap. {{person}} ate one-handed and did not complain.', kind: 'good' },
        ],
      },
      {
        id: 'mouth',
        label: 'Pull it into my mouth',
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'health', delta: -1 },
          { relationship: 'person', delta: 1 },
          { log: 'I pulled the finger straight into my mouth. {{person}} had not washed it. We both learned something.' },
        ],
      },
      {
        id: 'nose',
        label: 'Grab {{their}} nose instead',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -1 },
          { log: 'I let go of the finger and went for the nose. {{person}} made a noise like a squeaky toy.' },
        ],
      },
    ],
  },
  {
    id: 'bt_first_smile',
    category: 'childhood',
    title: 'First smile',
    text: 'I did my first real smile today. {{person}} says it was gas. It was not gas. {{parents}} saw it and pulled silly faces at me for an hour, hoping for another.',
    minAge: 0,
    maxAge: 0,
    weight: 1,
    once: true,
    // The skeptic is a real grandparent (the newborn card can be the very first screen, next to the birth line that
    // names them); the parents who saw the smile are {{parents}}.
    conditions: [{ hasPerson: ['mother', 'father'] }],
    person: { kind: ['grandparent'] },
    choices: [
      {
        id: 'again',
        label: 'Smile again',
        effects: [
          { relationship: 'mother', delta: 4 },
          { relationship: 'father', delta: 4 },
          { stat: 'happiness', delta: 2 },
          { log: 'I smiled again. {{parents}} told the whole street. {{person}} still says gas.', kind: 'milestone' },
        ],
      },
      {
        id: 'stranger',
        label: 'Save it for a stranger',
        effects: [
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'mother', delta: -2 },
          { relationship: 'father', delta: -2 },
          { log: 'I held out all day, then beamed at the mail carrier. {{parents}} took it personally.' },
        ],
      },
      {
        id: 'gas',
        label: 'Actually have gas',
        effects: [
          { stat: 'health', delta: 2 },
          { stat: 'happiness', delta: -1 },
          { relationship: 'person', delta: 2 },
          { log: 'The next one really was gas. I felt much better. {{person}} was unbearable about it.' },
        ],
      },
    ],
  },
  {
    id: 'bt_hiccups',
    category: 'childhood',
    title: 'Hiccups',
    text: 'I have the hiccups. Every single one shakes my whole body and surprises me completely, as if I have never had one before. {{person}} says this is normal. Nothing about this feels normal.',
    minAge: 0,
    maxAge: 1,
    weight: 1,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'cry',
        label: 'Cry about it',
        effects: [
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: 3 },
          { log: '{{person}} rocked me and patted my back until the hiccups gave up. They took their time.' },
        ],
      },
      {
        id: 'laugh',
        label: 'Find it hilarious',
        effects: [
          { stat: 'happiness', delta: 4 },
          { stat: 'health', delta: -1 },
          { log: 'I laughed at every hiccup, which caused more hiccups, which were also funny. A perfect system.', kind: 'good' },
        ],
      },
      {
        id: 'sleep',
        label: 'Hiccup myself to sleep',
        effects: [
          { stat: 'health', delta: 2 },
          { log: 'I fell asleep mid-hiccup and hiccuped twice more in my dreams.' },
        ],
      },
    ],
  },
  {
    id: 'bt_bad_lullaby',
    category: 'childhood',
    title: 'The lullaby',
    text: '{{person}} only knows the first line of one lullaby. The rest is humming, a verse about a sheep named Gerald, and words {{they}} is clearly making up on the spot.',
    minAge: 0,
    maxAge: 1,
    weight: 1,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'sleep',
        label: 'Fall asleep anyway',
        effects: [
          { stat: 'health', delta: 2 },
          { relationship: 'person', delta: 2 },
          { log: 'Gerald the sheep got me every time. {{person}} kept singing it for years, with new verses.', kind: 'good' },
        ],
      },
      {
        id: 'coo',
        label: 'Coo along',
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'smarts', delta: 1 },
          { stat: 'health', delta: -1 },
          { log: 'I joined in. We did a duet about Gerald until well past my bedtime.', kind: 'good' },
        ],
      },
      {
        id: 'stare',
        label: 'Stare in silent judgment',
        effects: [
          { stat: 'smarts', delta: 2 },
          { relationship: 'person', delta: -1 },
          { log: '{{person}} sang six verses while I stared without blinking. {{They}} lost confidence around verse four.' },
        ],
      },
      {
        id: 'drown',
        label: 'Cry louder than the song',
        effects: [
          { stat: 'happiness', delta: 2 },
          { stat: 'health', delta: 1 },
          { relationship: 'person', delta: -2 },
          { log: 'I cried over the chorus until {{person}} gave up and put the radio on. The radio worked.' },
        ],
      },
    ],
  },
  {
    id: 'bt_car_seat',
    category: 'childhood',
    title: 'The car seat',
    text: 'It took {{person}} twenty minutes and the instruction booklet to strap me into the car seat. Five buckles, two straps, one padded headrest. I have been fastened.',
    minAge: 0,
    maxAge: 0,
    weight: 1,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'scream',
        label: 'Scream until we move',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'health', delta: 1 }, { log: 'I screamed until the engine started, then fell asleep before the end of the street.' }],
            else: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -1 }, { log: 'I screamed the whole trip. {{person}} sang along to drown me out. Nobody won.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'plank',
        label: 'Go stiff as a plank',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { relationship: 'person', delta: -2 },
          { log: 'I went stiff as a board and the buckles would not meet. {{person}} said words I would learn later.' },
        ],
      },
      {
        id: 'sleep',
        label: 'Fall asleep instantly',
        effects: [
          { stat: 'health', delta: 2 },
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 2 }, { log: 'I was asleep before the last buckle clicked. {{person}} drove around the block twice to keep it that way.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I fell asleep at once and woke up the second the engine stopped, furious about it.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'bt_dog_was_here_first',
    category: 'childhood',
    title: 'The family dog',
    text: 'The family dog came over to inspect me. A cold, wet nose sniffed me from my toes to the top of my head, then stopped very close to my face to think about it.',
    minAge: 0,
    maxAge: 0,
    weight: 1,
    once: true,
    conditions: [{ noPerson: ['pet'] }],
    choices: [
      {
        id: 'ear',
        label: 'Grab an ear',
        effects: [
          { newPerson: { kind: 'pet', species: 'dog', relationship: 55, log: 'Our dog, {{person}}, gave me a thorough sniff and decided I could stay.' } },
          { stat: 'happiness', delta: 3 },
          { log: 'I grabbed an ear and held on. The dog sighed the long sigh of someone with years of this ahead.' },
        ],
      },
      {
        id: 'sneeze',
        label: 'Sneeze on it',
        effects: [
          { newPerson: { kind: 'pet', species: 'dog', relationship: 65, log: 'Our dog, {{person}}, gave me a thorough sniff and decided I could stay.' } },
          { stat: 'happiness', delta: 2 },
          { stat: 'smarts', delta: 1 },
          { log: 'I sneezed right on its nose. The dog sneezed back. We understood each other.', kind: 'good' },
        ],
      },
      {
        id: 'cry',
        label: 'Cry at the nose',
        effects: [
          { newPerson: { kind: 'pet', species: 'dog', relationship: 75, log: 'Our dog, {{person}}, gave me a thorough sniff and decided I could stay.' } },
          { stat: 'happiness', delta: -2 },
          { log: 'I cried at the nose. The dog lay down beside my crib and stayed there all night, on guard.' },
        ],
      },
      {
        id: 'giggle',
        label: 'Giggle',
        effects: [
          { newPerson: { kind: 'pet', species: 'dog', relationship: 70, log: 'Our dog, {{person}}, gave me a thorough sniff and decided I could stay.' } },
          { stat: 'happiness', delta: 4 },
          { stat: 'health', delta: -1 },
          { log: 'I giggled and got my face licked. A grown-up shrieked. The dog and I found that dramatic.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'bt_sibling_meets_me',
    category: 'family',
    title: 'Meet the baby',
    text: '{{person}} was lifted up to get a good look at me. {{They}} had been told to be gentle, to use an indoor voice and not to poke. {{They}} looked like someone about to poke.',
    minAge: 0,
    maxAge: 0,
    weight: 1,
    once: true,
    person: { kind: ['sibling'], minAge: 3, maxAge: 6 },
    choices: [
      {
        id: 'hair',
        label: 'Grab {{their}} hair',
        effects: [
          { relationship: 'person', delta: -2 },
          { stat: 'happiness', delta: 3 },
          { log: "I grabbed a fistful of {{person}}'s hair. {{They}} yelled. I had never been so happy." },
        ],
      },
      {
        id: 'finger',
        label: 'Hold {{their}} finger',
        effects: [
          { relationship: 'person', delta: 5 },
          { stat: 'happiness', delta: 1 },
          { log: '{{person}} gave me a finger and I squeezed it. {{They}} told everyone I liked {{them}} best.', kind: 'good' },
        ],
      },
      {
        id: 'scream',
        label: 'Scream in {{their}} face',
        effects: [
          { relationship: 'person', delta: -3 },
          { stat: 'health', delta: 1 },
          { stat: 'happiness', delta: 2 },
          { log: '{{person}} got screamed at from very close range and asked if the baby could go back now.' },
        ],
      },
    ],
  },
  {
    id: 'bt_first_cold',
    category: 'health',
    title: 'First cold',
    text: 'My first cold. My nose runs day and night, and {{person}} has bought a little rubber bulb that sucks the snot right out of it. I have never been so insulted.',
    minAge: 0,
    maxAge: 1,
    weight: 1,
    once: true,
    conditions: [{ count: 'illnesses', lte: 0 }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'fight',
        label: 'Fight the snot bulb',
        effects: [
          { illness: 'cold' },
          { stat: 'happiness', delta: 1 },
          { stat: 'health', delta: -2 },
          { log: 'I fought the bulb like a wildcat and won. My nose stayed blocked for another week.' },
        ],
      },
      {
        id: 'sneeze',
        label: 'Sneeze on {{person}}',
        effects: [
          { illness: 'cold' },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -2 },
          { log: '{{person}} caught it from me two days later. We shared a box of tissues and a bad mood.' },
        ],
      },
      {
        id: 'upright',
        label: 'Sleep upright on {{them}}',
        effects: [
          { illness: 'cold' },
          { stat: 'health', delta: 2 },
          { relationship: 'person', delta: 3 },
          { stat: 'happiness', delta: -1 },
          { log: 'I could only breathe sitting up, so I slept on {{person}} for three nights. {{They}} slept for none.' },
        ],
      },
    ],
  },
  {
    id: 'bt_tummy_time',
    category: 'childhood',
    title: 'Tummy time',
    text: 'Twice a day {{person}} lays me face down on a blanket and calls it "tummy time", as if it were a treat. My head is enormous. It weighs about as much as the rest of me.',
    minAge: 0,
    maxAge: 0,
    weight: 1,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'lift',
        label: 'Lift my head like a champion',
        effects: [
          { stat: 'health', delta: 3 },
          { stat: 'happiness', delta: -1 },
          { log: 'I lifted my head and held it up for three whole seconds. {{person}} applauded. My neck did not.', kind: 'good' },
        ],
      },
      {
        id: 'faceplant',
        label: 'Faceplant and wail',
        effects: [
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: 2 },
          { log: 'I put my face in the blanket and wailed into it until {{person}} picked me up. Victory, sort of.' },
        ],
      },
      {
        id: 'roll',
        label: 'Try to roll over',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 3 }, { log: 'I rolled onto my back by accident and looked so shocked that {{person}} cried laughing.', kind: 'milestone' }],
            else: [{ stat: 'health', delta: 1 }, { stat: 'happiness', delta: -1 }, { log: 'I rocked like a turtle on its shell for ten minutes and went nowhere.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'bt_peekaboo',
    category: 'childhood',
    title: 'Peekaboo',
    text: '{{person}} covered {{their}} face with both hands and vanished completely. Gone. Then {{they}} came back. Then {{they}} vanished again. This is the greatest magic trick ever performed.',
    minAge: 0,
    maxAge: 1,
    weight: 1,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'laugh',
        label: 'Laugh until I hiccup',
        effects: [
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: 2 },
          { stat: 'health', delta: -1 },
          { log: 'I laughed so hard I got the hiccups. {{person}} did it forty more times anyway.', kind: 'good' },
        ],
      },
      {
        id: 'panic',
        label: 'Panic every time',
        effects: [
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: 4 },
          { log: 'Every time {{person}} vanished I panicked. Every time {{they}} came back I forgave {{them}}.' },
        ],
      },
      {
        id: 'pull',
        label: 'Pull the hands away',
        effects: [
          { stat: 'smarts', delta: 3 },
          { stat: 'happiness', delta: 1 },
          { relationship: 'person', delta: -1 },
          { log: 'I pulled the hands away and found {{person}} right there. I had solved it. The magic was gone.' },
        ],
      },
    ],
  },
  {
    id: 'bt_crawling',
    category: 'childhood',
    title: 'On the move',
    text: 'I have worked out how to crawl. Mostly backward, so far, which means I end up under the couch a lot, but it counts. The whole floor is mine now.',
    minAge: 0,
    maxAge: 1,
    weight: 1,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'to_parent',
        label: 'Crawl to {{person}}',
        effects: [
          { relationship: 'person', delta: 4 },
          { stat: 'happiness', delta: 2 },
          { log: 'I crawled across the whole rug to {{person}}. {{They}} told everyone we know, twice.', kind: 'milestone' },
        ],
      },
      {
        id: 'shoes',
        label: 'Crawl to the shoe pile',
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'smarts', delta: 1 },
          { stat: 'health', delta: -1 },
          { log: 'I crawled straight to the shoe pile and tasted every shoe. I have notes.' },
        ],
      },
      {
        id: 'couch',
        label: 'Reverse under the couch',
        effects: [
          { stat: 'smarts', delta: 2 },
          { relationship: 'person', delta: -1 },
          { log: 'Under the couch: a sock, a cracker and the remote. Then I got stuck. {{person}} moved the couch.' },
        ],
      },
      {
        id: 'pet',
        label: 'Chase our pet',
        conditions: [{ hasPerson: ['pet'] }],
        effects: [
          { relationship: 'pet', delta: 3 },
          { stat: 'happiness', delta: 3 },
          { stat: 'health', delta: 1 },
          { log: 'I chased our pet across the kitchen at about a foot a minute. It let me think I was winning.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'bt_first_holidays',
    category: 'holiday',
    title: 'The holidays',
    text: 'My first holiday season. Everyone came, everyone sang, and everyone handed me a present wrapped in shiny, crackly paper. I am told the presents are the point. I am not convinced.',
    minAge: 0,
    maxAge: 1,
    weight: 1,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'paper',
        label: 'Eat the wrapping paper',
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'health', delta: -1 },
          { log: 'I ate a strip of the shiny paper. {{person}} fished the rest out of my mouth. Delicious, still.' },
        ],
      },
      {
        id: 'box',
        label: 'Play with the box',
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'smarts', delta: 2 },
          { relationship: 'person', delta: -1 },
          { log: 'The present was an expensive toy. I played with the box it came in for a week. {{person}} sighed.' },
        ],
      },
      {
        id: 'nap',
        label: 'Sleep through it all',
        effects: [
          { stat: 'health', delta: 2 },
          { relationship: 'person', delta: 1 },
          { log: 'I slept through the whole thing in a nest of wrapping paper. Everyone said I was very good. I was asleep.' },
        ],
      },
    ],
  },
  {
    id: 'bt_first_flight',
    category: 'random',
    title: 'First flight',
    text: "My first plane ride, on {{person}}'s lap. Two hundred strangers are pretending not to look at me, and something is happening inside my ears that nobody warned me about.",
    minAge: 0,
    maxAge: 2,
    weight: 1,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'scream',
        label: 'Scream about my ears',
        effects: [
          { stat: 'happiness', delta: -3 },
          { stat: 'health', delta: 1 },
          { relationship: 'person', delta: 1 },
          { log: 'I screamed from takeoff to landing. A man in row twelve applauded when we touched down.', kind: 'bad' },
        ],
      },
      {
        id: 'charm',
        label: 'Charm the row behind',
        effects: [
          { stat: 'happiness', delta: 3 },
          { karma: 1 },
          { relationship: 'person', delta: -1 },
          { log: "Three hours of peekaboo over the seat with the row behind. They adored me. {{person}}'s arms did not.", kind: 'good' },
        ],
      },
      {
        id: 'sleep',
        label: 'Sleep the whole way',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'health', delta: 2 }, { relationship: 'person', delta: 2 }, { log: 'I fell asleep before takeoff and woke up in a different city. Flying is easy.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I slept for ten minutes, woke up somewhere above the clouds and made up for lost time.', kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------- age one
  {
    id: 'bt_teething',
    category: 'childhood',
    title: 'Teething',
    text: 'A new tooth is coming through and it is now my whole personality. I drool on everything, I chew on everything, and I am furious about all of it.',
    minAge: 1,
    maxAge: 2,
    weight: 2,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'chew',
        label: 'Chew on everything',
        effects: [
          { stat: 'happiness', delta: 2 },
          { stat: 'health', delta: -1 },
          { relationship: 'person', delta: -1 },
          { log: 'I chewed a remote, a shoe and the corner of the coffee table. The table still has the marks.' },
        ],
      },
      {
        id: 'bite',
        label: 'Bite {{person}}',
        effects: [
          { stat: 'happiness', delta: 2 },
          { karma: -1 },
          { relationship: 'person', delta: -2 },
          { log: "I tested the new tooth on {{person}}'s shoulder. It works. {{They}} confirmed this loudly.", kind: 'bad' },
        ],
      },
      {
        id: 'ring',
        label: 'Gnaw the frozen ring',
        effects: [
          { stat: 'health', delta: 2 },
          { stat: 'happiness', delta: -1 },
          { log: 'The frozen teething ring was cold and boring and it worked. I hated how well it worked.' },
        ],
      },
      {
        id: 'night',
        label: 'Scream all night',
        effects: [
          { stat: 'happiness', delta: -1 },
          { relationship: 'person', delta: 2 },
          { stat: 'health', delta: -1 },
          { log: 'I screamed every night for a week. {{person}} walked me up and down the hall until dawn.' },
        ],
      },
    ],
  },
  {
    id: 'bt_first_birthday',
    category: 'childhood',
    title: 'First birthday',
    text: 'My first birthday. Someone put a small cake in front of me with one candle on it, and then every adult I know stood around it holding up a camera and singing at me.',
    minAge: 1,
    maxAge: 1,
    weight: 2,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'face',
        label: 'Go in face-first',
        effects: [
          { stat: 'happiness', delta: 5 },
          { stat: 'health', delta: -1 },
          { relationship: 'person', delta: 1 },
          { log: 'I went in face-first. The photo lives on the fridge, in an album and in every slideshow since.', kind: 'milestone' },
        ],
      },
      {
        id: 'poke',
        label: 'Poke it with one finger',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { log: 'I poked the frosting once, studied my finger and pushed the cake away. I had standards.' },
        ],
      },
      {
        id: 'cry',
        label: 'Cry at the singing',
        effects: [
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: 2 },
          { log: 'The singing frightened me. I cried through the whole song and was comforted with cake, which helped.' },
        ],
      },
      {
        id: 'feed',
        label: 'Feed some to {{person}}',
        effects: [
          { relationship: 'person', delta: 4 },
          { karma: 1 },
          { stat: 'looks', delta: -1 },
          { log: "I shoved a fistful at {{person}}'s mouth. {{They}} ate it. Beautiful, and frosting in both our hair.", kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'bt_airplane_spoon',
    category: 'childhood',
    title: 'Here comes the airplane',
    text: '{{person}} is flying a spoonful of mashed carrots toward my face, making engine noises and circling for a landing. The runway is closed.',
    minAge: 1,
    maxAge: 2,
    weight: 2,
    cooldown: 3,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'vault',
        label: 'Shut my mouth tight',
        effects: [
          { stat: 'happiness', delta: 1 },
          { stat: 'health', delta: -1 },
          { relationship: 'person', delta: -1 },
          { log: 'I kept my mouth shut like a vault. The airplane circled for ten minutes and crashed into my chin.' },
        ],
      },
      {
        id: 'grab',
        label: 'Grab the spoon myself',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -1 },
          { log: 'I took the spoon and fed myself. A third of the carrots reached my mouth. The rest reached the wall.' },
        ],
      },
      {
        id: 'land',
        label: 'Let the airplane land',
        effects: [
          { stat: 'health', delta: 2 },
          { relationship: 'person', delta: 2 },
          { stat: 'happiness', delta: -1 },
          { log: 'I let it land. Carrots are terrible. {{person}} was so proud {{they}} did the engine noise again.', kind: 'good' },
        ],
      },
      {
        id: 'raspberry',
        label: 'Blow a raspberry',
        effects: [
          { stat: 'happiness', delta: 3 },
          { karma: -1 },
          { relationship: 'person', delta: -2 },
          { log: 'I blew a raspberry at the exact moment of landing. {{person}} wore the carrots for the rest of the day.' },
        ],
      },
    ],
  },
  {
    id: 'bt_high_chair',
    category: 'childhood',
    title: 'Gravity',
    text: 'I dropped my cup off the high chair. {{person}} picked it up. I dropped it again. {{They}} picked it up again. I am running an important experiment.',
    minAge: 1,
    maxAge: 2,
    weight: 2,
    cooldown: 3,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'again',
        label: 'Drop it again',
        effects: [
          { stat: 'smarts', delta: 2 },
          { relationship: 'person', delta: -2 },
          { log: 'I dropped it thirty-one times. Gravity worked every time. {{person}} stopped helping at about twenty.' },
        ],
      },
      {
        id: 'bowl',
        label: 'Drop the bowl too',
        effects: [
          { stat: 'happiness', delta: 4 },
          { karma: -1 },
          { relationship: 'person', delta: -3 },
          { log: 'I upgraded to the bowl of oatmeal. The experiment ended abruptly, and so did breakfast.', kind: 'bad' },
        ],
      },
      {
        id: 'pet',
        label: 'Drop food for our pet',
        conditions: [{ hasPerson: ['pet'] }],
        effects: [
          { relationship: 'pet', delta: 4 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -1 },
          { log: 'I started dropping food for our pet instead. It waited under my chair at every meal after that.' },
        ],
      },
      {
        id: 'hand',
        label: 'Hand it over nicely',
        effects: [
          { karma: 1 },
          { relationship: 'person', delta: 3 },
          { stat: 'happiness', delta: -1 },
          { log: 'I handed {{person}} the cup instead of dropping it. {{They}} looked at me like I had grown up overnight.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'bt_first_haircut',
    category: 'childhood',
    title: 'First haircut',
    text: '{{person}} took me for my first haircut. I am on a booster seat in a giant chair, wearing a cape, and a stranger is coming at my head with scissors and a buzzing thing.',
    minAge: 1,
    maxAge: 2,
    weight: 1.5,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'siren',
        label: 'Scream like a siren',
        effects: [
          { money: -20 },
          { stat: 'happiness', delta: -3 },
          { stat: 'looks', delta: -1 },
          { relationship: 'person', delta: 3 },
          { log: "I screamed on {{person}}'s lap the whole time. The cut came out lopsided. {{They}} called it character." },
        ],
      },
      {
        id: 'still',
        label: 'Sit still for a lollipop',
        effects: [
          { money: -20 },
          { stat: 'looks', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { stat: 'health', delta: -1 },
          { log: '{{person}} paid {{$20}}, I got a lollipop, and a curl went home in an envelope. {{They}} cried a bit.', kind: 'good' },
        ],
      },
      {
        id: 'buzz',
        label: 'Grab the buzzing thing',
        effects: [
          { money: -20 },
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: 2 },
          { stat: 'looks', delta: -2 },
          { log: 'I grabbed for the clippers and got a surprise bald patch over one ear. It grew back. Eventually.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'bt_first_shoes',
    category: 'childhood',
    title: 'First shoes',
    text: 'I have my first real shoes. They are stiff, they have laces, and my feet feel like they belong to someone else. {{person}} keeps saying how grown-up I look.',
    minAge: 1,
    maxAge: 2,
    weight: 1.5,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'stomp',
        label: 'Stomp around everywhere',
        effects: [
          { money: -35 },
          { stat: 'happiness', delta: 3 },
          { stat: 'health', delta: 1 },
          { relationship: 'person', delta: -1 },
          { log: 'I stomped up and down the hall until bedtime. Everyone in the house heard every single step.' },
        ],
      },
      {
        id: 'hide',
        label: 'Pull them off and hide them',
        effects: [
          { money: -35 },
          { stat: 'happiness', delta: 2 },
          { stat: 'smarts', delta: 1 },
          { relationship: 'person', delta: -2 },
          { log: 'I pulled the shoes off and hid one in a kitchen drawer. {{person}} found it three months later.' },
        ],
      },
      {
        id: 'careful',
        label: 'Walk like a cat in boots',
        effects: [
          { money: -35 },
          { stat: 'happiness', delta: 1 },
          { relationship: 'person', delta: 2 },
          { log: '{{person}} paid {{$35}} to watch me lift each foot high like a cat in boots, and filmed every step.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'bt_doggy',
    category: 'childhood',
    title: 'Doggy',
    text: "I have learned a new word and it covers everything: \"doggy\". The neighbor's dog is doggy. A cat on the fence is doggy. The fuzzy slippers by the door are doggy. I am very sure of myself.",
    minAge: 1,
    maxAge: 3,
    weight: 1.5,
    once: true,
    // After ec_first_word, so that card's "my first real word" never comes after this one.
    conditions: [{ eventFired: 'ec_first_word' }],
    choices: [
      {
        id: 'pet',
        label: 'Call our pet doggy',
        conditions: [{ hasPerson: ['pet'] }],
        effects: [
          { relationship: 'pet', delta: 4 },
          { stat: 'happiness', delta: 2 },
          { log: 'I called our pet "doggy" every time it walked past. It accepted the title with dignity.', kind: 'good' },
        ],
      },
      {
        id: 'everything',
        label: 'Say it about everything',
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'smarts', delta: 1 },
          { log: 'The vacuum, the moon and a man with a beard were all "doggy". I said it with total confidence.' },
        ],
      },
      {
        id: 'cat',
        label: 'Learn the word "cat"',
        effects: [
          { stat: 'smarts', delta: 3 },
          { stat: 'happiness', delta: -1 },
          { log: 'Someone taught me "cat". Now everything is a cat. Progress, of a kind.' },
        ],
      },
      {
        id: 'bark',
        label: 'Bark at people instead',
        effects: [
          { stat: 'happiness', delta: 3 },
          { karma: -1 },
          { log: 'I gave up on words and started barking at strangers. The bus driver barked back.' },
        ],
      },
    ],
  },
  {
    id: 'bt_video_call',
    category: 'family',
    title: '{{person}} on the tablet',
    text: "There is a tablet in front of my face, and {{person}}'s face is inside it, very close, shouting hello. She is much smaller than usual, and she is mostly nose.",
    minAge: 1,
    maxAge: 3,
    weight: 1.5,
    once: true,
    // A video call on a tablet: the tablet years, with a real, living grandmother on the other end.
    conditions: [{ year: { gte: 2010 } }],
    person: { kind: ['grandparent'], gender: 'female' },
    choices: [
      {
        id: 'lick',
        label: 'Lick the screen',
        effects: [
          { stat: 'happiness', delta: 2 },
          { stat: 'health', delta: -1 },
          { relationship: 'person', delta: 2 },
          { log: 'I licked {{person}}. The tablet tasted like fingerprints. She called it the nicest kiss in years.', kind: 'good' },
        ],
      },
      {
        id: 'red',
        label: 'Press the red button',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { relationship: 'person', delta: -1 },
          { log: 'I pressed the red button and {{person}} vanished. She called back. I did it again. I am powerful.' },
        ],
      },
      {
        id: 'foot',
        label: 'Show her my foot',
        effects: [
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: 1 },
          { stat: 'smarts', delta: -1 },
          { log: 'I held my foot up to the camera for the entire call. {{person}} said it was a very good foot.' },
        ],
      },
    ],
  },
  {
    id: 'bt_toilet_paper',
    category: 'childhood',
    title: 'The roll',
    text: 'I found the loose end of the toilet paper and pulled. It kept coming. I pulled more. It is still coming. It might go on forever, and I intend to find out.',
    minAge: 1,
    maxAge: 3,
    weight: 1.5,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'all',
        label: 'Unroll the whole thing',
        effects: [
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: -2 },
          { log: 'I unrolled all of it down the hall and into the kitchen. {{person}} found me sitting in a soft white drift of it.' },
        ],
      },
      {
        id: 'mummy',
        label: 'Wrap myself up in it',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 1 }, { log: 'I wrapped myself up like a mummy and shuffled out to {{person}}, who laughed too hard to be mad.', kind: 'good' }],
            else: [{ injury: 1 }, { stat: 'happiness', delta: -2 }, { log: 'I wrapped myself up, tripped over my own tail and bonked my head on the tub.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'flush',
        label: 'Feed it to the toilet',
        effects: [
          { karma: -1 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.5,
            then: [{ money: -120 }, { relationship: 'person', delta: -3 }, { log: 'The toilet ate the roll and stopped working. {{person}} paid a plumber {{$120}} and stared at me.', kind: 'bad' }],
            else: [{ stat: 'smarts', delta: 1 }, { log: 'The toilet ate the whole roll and asked for more. I was never left alone in there again.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'bt_pots_and_pans',
    category: 'childhood',
    title: 'The drum kit',
    text: 'I opened the low kitchen cupboard and it was full of pots, pans and lids. Somebody in this family has been hiding a drum kit from me.',
    minAge: 1,
    maxAge: 2,
    weight: 1.5,
    cooldown: 3,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'bang',
        label: 'Bang on every pot',
        effects: [
          { stat: 'happiness', delta: 4 },
          { stat: 'smarts', delta: 1 },
          { relationship: 'person', delta: -2 },
          { log: 'I played the pots for an hour. {{person}} said I had rhythm, through gritted teeth.' },
        ],
      },
      {
        id: 'hat',
        label: 'Wear a pot as a hat',
        effects: [
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: 1 }, { log: 'The pot got stuck for one dark minute. {{person}} wiggled it off. I put it straight back on.', kind: 'bad' }],
            else: [{ stat: 'looks', delta: 1 }, { log: 'I wore a saucepan as a helmet for the rest of the afternoon. It suited me.' }],
          },
        ],
      },
      {
        id: 'help',
        label: 'Hand {{person}} the lids',
        effects: [
          { relationship: 'person', delta: 3 },
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: -1 },
          { log: 'I handed {{person}} lids while {{they}} cooked. Most were the wrong size. {{They}} said thank you anyway.', kind: 'good' },
        ],
      },
    ],
  },

  // ---------------------------------------------------- toddler and preschool
  {
    id: 'bt_auto_flush',
    category: 'childhood',
    title: 'The roaring toilet',
    text: 'In a restaurant bathroom, the toilet flushed all by itself while I was still sitting on it. It roared like a lion. Nobody touched anything. It just decided.',
    minAge: 3,
    maxAge: 5,
    weight: 1.5,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'never',
        label: 'Swear off public toilets',
        effects: [
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -2 },
          { stat: 'smarts', delta: 1 },
          { log: 'I refused every public toilet for months. {{person}} learned where every bush in town was.', kind: 'bad' },
        ],
      },
      {
        id: 'brave',
        label: 'Cover my ears, be brave',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'The next one roared too, but I had my hands over my ears. I am not afraid of toilets. Mostly.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I was brave until the next roar, then ran out of the stall with my pants around my ankles.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'sensor',
        label: 'Make {{them}} block the sensor',
        effects: [
          { relationship: 'person', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { log: '{{person}} now holds a hand over the little red eye every time. {{They}} does it without being asked.' },
        ],
      },
    ],
  },
  {
    id: 'bt_back_on_the_shelf',
    category: 'childhood',
    title: 'Back on the shelf',
    text: '{{person}} let me hold a stuffed giraffe the whole way around the store. I named it. I sang to it. Now we are at the checkout, and {{they}} says it has to go back on the shelf.',
    minAge: 2,
    maxAge: 4,
    weight: 1.5,
    cooldown: 3,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'howl',
        label: 'Hug it and howl',
        effects: [
          { karma: -1 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: -3 }, { log: 'I howled until a stranger in line paid for it. {{person}} wanted the floor to swallow {{them}}.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: -2 }, { log: '{{person}} peeled my fingers off the giraffe one at a time. I howled all the way to the car.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'shirt',
        label: 'Hide it under my shirt',
        effects: [
          { karma: -2 },
          {
            chance: 0.6,
            then: [{ money: -12 }, { stat: 'happiness', delta: 4 }, { relationship: 'person', delta: -1 }, { log: '{{person}} found it at bath time and went back to pay {{$12}}. I kept the giraffe and got a lecture.' }],
            else: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -1 }, { log: "Its head stuck out of my collar. {{person}} marched me back to apologize to the cashier.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'goodbye',
        label: 'Kiss it goodbye',
        effects: [
          { karma: 2 },
          { stat: 'happiness', delta: -2 },
          { relationship: 'person', delta: 3 },
          { log: 'I kissed the giraffe goodbye and put it back myself. {{person}} told the cashier I was very brave.', kind: 'good' },
        ],
      },
      {
        id: 'forever',
        label: 'Promise to be good forever',
        effects: [
          {
            chance: 0.4,
            then: [{ money: -12 }, { stat: 'happiness', delta: 3 }, { log: '{{person}} bought the giraffe for {{$12}}. "Forever" lasted until the parking lot.', kind: 'good' }],
            else: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }, { log: '{{person}} said nice try. Forever was not on sale today.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'bt_no_phase',
    category: 'childhood',
    title: 'No',
    text: 'I have started saying "no" to everything, including things I want. Bath? No. Cookie? No. Do I want to go to the park? Absolutely not. Wait.',
    minAge: 2,
    maxAge: 3,
    weight: 2,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'all',
        label: 'Say no to everything',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -3 },
          { log: 'I said no to the park, the cookies and the bounce house. It felt incredible. Then it did not.' },
        ],
      },
      {
        id: 'yes',
        label: 'Try "yes" just once',
        effects: [
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 2 },
          { stat: 'smarts', delta: -1 },
          { log: 'I said yes to a cookie as an experiment. It went so well I said yes twice more that year.', kind: 'good' },
        ],
      },
      {
        id: 'nod',
        label: 'Say no while nodding yes',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { log: 'I said "no" and nodded yes. {{person}} went with the nod. I got the cookie and kept my reputation.' },
        ],
      },
    ],
  },
  {
    id: 'bt_clothes_rack',
    category: 'childhood',
    title: 'Inside the rack',
    text: 'I crawled into the middle of a round clothes rack in a big store. It is a secret room with walls made of shirts. Out there I can hear {{person}} calling my name, and it is getting louder.',
    minAge: 2,
    maxAge: 5,
    weight: 1.5,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'roar',
        label: 'Jump out and roar',
        effects: [
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: -2 },
          { karma: -1 },
          { log: 'I burst out roaring at a stranger, who screamed. {{person}} found me. Only one of us laughed.' },
        ],
      },
      {
        id: 'quiet',
        label: 'Stay very, very quiet',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'smarts', delta: 1 }, { relationship: 'person', delta: -3 }, { log: 'I stayed put until my full name came over the store speakers. It sounded very official. I came out.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: '{{person}} found me in a minute by my sneakers sticking out under the shirts. I was so sure.' }],
          },
        ],
      },
      {
        id: 'out',
        label: 'Come out when {{they}} sounds scared',
        effects: [
          { karma: 2 },
          { relationship: 'person', delta: 3 },
          { stat: 'happiness', delta: -1 },
          { log: "When {{person}}'s voice cracked, I came out. {{They}} hugged me so hard one of my shoes fell off.", kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'bt_goodbye_window',
    category: 'childhood',
    title: 'The goodbye window',
    text: 'Preschool drop-off has rules: two hugs, one kiss, and a wave through the window on the way out. Today {{person}} forgot the wave and just walked away down the street.',
    minAge: 3,
    maxAge: 5,
    weight: 1.5,
    cooldown: 3,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'wail',
        label: 'Wail at the window',
        effects: [
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 3 }, { log: '{{person}} heard me from the corner and came back to do the wave properly. Twice.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'I wailed at the empty window until a teacher distracted me with the class goldfish.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'wave',
        label: 'Wave at the empty window',
        effects: [
          { karma: 1 },
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: -1 },
          { log: 'I waved at the empty window as if {{person}} were still there. A teacher waved back. It helped a little.' },
        ],
      },
      {
        id: 'scold',
        label: 'Explain the rules at pickup',
        effects: [
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -1 },
          { stat: 'smarts', delta: 1 },
          { log: 'At pickup I explained the rules again, slowly. {{person}} apologized and never missed a wave again.' },
        ],
      },
    ],
  },
  {
    id: 'bt_good_swing',
    category: 'friends',
    title: 'The good swing',
    text: 'The playground has one good swing, and a kid in a dinosaur hat has been on it since before I got here. There is a line. I am the line.',
    minAge: 3,
    maxAge: 5,
    weight: 1.5,
    once: true,
    choices: [
      {
        id: 'wait',
        label: 'Wait my turn',
        effects: [
          { karma: 2 },
          {
            chance: 0.5,
            then: [
              { newPerson: { kind: 'friend', minAge: 3, maxAge: 6, relationship: 60, log: 'The kid in the dinosaur hat, {{person}}, finally got off the swing and pushed me on it. Friends.' } },
              { stat: 'happiness', delta: 3 },
              { log: 'Waiting paid off. I got the swing and a friend who pushes very high.', kind: 'good' },
            ],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I waited until it was time to go home. The dinosaur never got off.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'grownup',
        label: 'Tell a grown-up',
        effects: [
          { stat: 'happiness', delta: 2 },
          { stat: 'smarts', delta: 1 },
          { karma: -1 },
          { log: 'I reported the swing situation. Turns were introduced. The dinosaur kid glared at me all afternoon.' },
        ],
      },
      {
        id: 'dig',
        label: 'Go dig in the sand',
        effects: [
          { stat: 'happiness', delta: 1 },
          { stat: 'smarts', delta: 1 },
          { stat: 'health', delta: 1 },
          { log: 'I gave up on the swing and dug a hole so deep that three kids came to help. Swings are overrated.' },
        ],
      },
    ],
  },
  {
    id: 'bt_first_playdate',
    category: 'friends',
    title: 'First playdate',
    text: "{{person}} took me to a playdate at a preschool friend's house. Everything there is slightly wrong: different juice, a different smell, a huge fluffy dog and a grown-up who does voices.",
    minAge: 3,
    maxAge: 5,
    weight: 1.5,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'play',
        label: 'Play like old pals',
        effects: [
          { newPerson: { kind: 'friend', minAge: 3, maxAge: 5, relationship: 65, log: 'My playdate friend {{person}} and I built a fort from every cushion in the house.' } },
          { stat: 'happiness', delta: 4 },
          { relationship: 'person', delta: -1 },
          { log: 'We declared war on the fluffy dog and lost. {{person}} had to peel me off the couch to leave.', kind: 'good' },
        ],
      },
      {
        id: 'snacks',
        label: 'Eat all their snacks',
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'health', delta: -1 },
          { karma: -1 },
          { log: 'I skipped the toys and worked through their snack cupboard. {{person}} apologized on the way out.' },
        ],
      },
      {
        id: 'lap',
        label: 'Stay glued to {{person}}',
        effects: [
          { relationship: 'person', delta: 3 },
          { stat: 'happiness', delta: -2 },
          { stat: 'smarts', delta: 1 },
          { log: "I spent the whole playdate on {{person}}'s lap, watching. I learned a lot about that dog. Next time." },
        ],
      },
    ],
  },
  {
    id: 'bt_show_and_tell',
    category: 'childhood',
    title: 'Show and tell',
    text: 'It is my turn for show and tell at preschool. Twelve kids are sitting cross-legged on the rug, staring up at me, and the teacher says I can share anything I like.',
    minAge: 3,
    maxAge: 5,
    weight: 1.5,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'rock',
        label: 'Show them my rock',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 2 },
          { karma: -1 },
          { log: 'My rock is called Steve. I talked about Steve for ten minutes. Nobody else got a turn.' },
        ],
      },
      {
        id: 'secret',
        label: 'Share a family secret',
        effects: [
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: -3 },
          { log: 'I told the class that {{person}} sings in the shower and cries at cartoons. The teacher told {{them}}.' },
        ],
      },
      {
        id: 'freeze',
        label: 'Freeze and stare',
        effects: [
          { stat: 'happiness', delta: -2 },
          { stat: 'smarts', delta: 2 },
          { log: 'I stood in front of the class and said nothing for a very long time. Then I sat down. Bold.', kind: 'bad' },
        ],
      },
      {
        id: 'pet',
        label: 'Talk about our pet',
        conditions: [{ hasPerson: ['pet'] }],
        effects: [
          { relationship: 'pet', delta: 2 },
          { stat: 'happiness', delta: 3 },
          { karma: -1 },
          { log: 'I told the class all about our pet, including several things that are not true. They were riveted.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'bt_nap_time',
    category: 'childhood',
    title: 'Nap time',
    text: 'Nap time at preschool. Twenty kids on twenty little mats, the lights are off, the teacher is whispering, and I have never been less tired in my whole life.',
    minAge: 3,
    maxAge: 5,
    weight: 1.5,
    once: true,
    choices: [
      {
        id: 'tiles',
        label: 'Count the ceiling tiles',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: -1 },
          { log: 'I counted the ceiling tiles. There are forty-one. I checked twice. Then nap time was over.' },
        ],
      },
      {
        id: 'whisper',
        label: 'Whisper to the next mat',
        effects: [
          {
            chance: 0.5,
            then: [
              { newPerson: { kind: 'friend', minAge: 3, maxAge: 6, relationship: 60, log: 'The kid on the next mat, {{person}}, whispered back. We have been friends ever since.' } },
              { stat: 'happiness', delta: 3 },
              { log: 'We whispered about worms for the entire nap. Best nap I never had.', kind: 'good' },
            ],
            else: [{ stat: 'happiness', delta: -2 }, { karma: -1 }, { log: 'I got moved to the mat right next to the teacher. Her mat, her rules. Nobody whispered.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'fake',
        label: 'Pretend to be asleep',
        effects: [
          { stat: 'health', delta: 3 },
          { stat: 'happiness', delta: -1 },
          { log: 'I shut my eyes to fake it and woke up at pickup with a mat pattern on my cheek, furious.' },
        ],
      },
      {
        id: 'toys',
        label: 'Sneak to the toy corner',
        effects: [
          { karma: -1 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I crawled to the toy corner on my belly and had the whole dollhouse to myself.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I got halfway to the toy corner before the teacher said my name in her nap-time voice.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'bt_purple_crayon',
    category: 'friends',
    title: 'The last purple crayon',
    text: 'There is one purple crayon left in the bucket and I have it. A kid across the table needs it for a purple cow, and is looking at me like I have stolen the cow.',
    minAge: 3,
    maxAge: 5,
    weight: 1.5,
    once: true,
    choices: [
      {
        id: 'share',
        label: 'Share it',
        effects: [
          { karma: 2 },
          {
            chance: 0.6,
            then: [
              { newPerson: { kind: 'friend', minAge: 3, maxAge: 6, relationship: 60, log: 'We took turns with the purple crayon, and the cow kid, {{person}}, became my friend.' } },
              { stat: 'happiness', delta: 3 },
              { log: 'Half a purple cow is mine. I drew its legs.', kind: 'good' },
            ],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'We shared the crayon. The kid took the cow home without a word. I felt good anyway.' }],
          },
        ],
      },
      {
        id: 'snap',
        label: 'Snap it in half',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { karma: -1 },
          { log: 'I snapped it in half and handed over the smaller piece. Fair, I thought. The teacher disagreed.' },
        ],
      },
      {
        id: 'sock',
        label: 'Hide it in my sock',
        effects: [
          { karma: -2 },
          { stat: 'happiness', delta: 2 },
          { stat: 'looks', delta: -1 },
          { log: 'The crayon melted a little in my sock. My sock is purple now. So is my foot.' },
        ],
      },
    ],
  },
  {
    id: 'bt_dress_myself',
    category: 'childhood',
    title: 'I dressed myself',
    text: 'I dressed myself today with no help at all: rain boots, pajama bottoms, swim goggles and a superhero cape. It is sunny out. {{person}} is staring at me and choosing {{their}} words.',
    minAge: 3,
    maxAge: 5,
    weight: 1.5,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'wear',
        label: 'Wear it out proudly',
        effects: [
          { stat: 'happiness', delta: 4 },
          { stat: 'looks', delta: -1 },
          { stat: 'health', delta: -1 },
          { log: 'I wore the whole outfit to the store and got very hot. Two strangers loved the cape. I was right.', kind: 'good' },
        ],
      },
      {
        id: 'one',
        label: 'Let {{them}} change one thing',
        effects: [
          { relationship: 'person', delta: 3 },
          { stat: 'happiness', delta: -1 },
          { stat: 'smarts', delta: 1 },
          { log: '{{person}} swapped the boots for sandals. Everything else stayed. The cape was not up for discussion.' },
        ],
      },
      {
        id: 'more',
        label: 'Add sunglasses and a tutu',
        effects: [
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: -1 },
          { stat: 'looks', delta: 1 },
          { log: 'I went back and added sunglasses and a tutu. {{person}} took a photo for the record and gave up.' },
        ],
      },
    ],
  },
  {
    id: 'bt_why_phase',
    category: 'childhood',
    title: 'Why?',
    text: 'I have discovered the word "why", and every answer {{person}} gives me comes with a free "why" attached. We started with why grass is green. We are now on why anything exists.',
    minAge: 3,
    maxAge: 5,
    weight: 2,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'keep',
        label: 'Keep asking why',
        effects: [
          { stat: 'smarts', delta: 4 },
          { relationship: 'person', delta: -2 },
          { log: 'I asked why fifty-two times in a row. {{person}} reached "because of the universe" and lay down.' },
        ],
      },
      {
        id: 'because',
        label: 'Accept "because I said so"',
        effects: [
          { relationship: 'person', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { stat: 'smarts', delta: -1 },
          { log: '{{person}} said "because I said so", so I went to play. Some mysteries can wait.' },
        ],
      },
      {
        id: 'own',
        label: 'Answer my own whys',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 2 },
          { log: 'I started answering my own whys. Grass is green because it likes green. Science was never the same.' },
        ],
      },
    ],
  },
  {
    id: 'bt_bedtime_stall',
    category: 'childhood',
    title: 'One more thing',
    text: '{{person}} has turned off the light and is almost out the door. This is the moment. I need water, the hall light on, one more story, and to know where the moon goes in the daytime.',
    minAge: 2,
    maxAge: 5,
    weight: 2,
    cooldown: 2,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'water',
        label: 'Ask for water',
        effects: [
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -2 },
          { stat: 'health', delta: -1 },
          { log: 'I asked for water four times and drank none of it. {{person}} brought it every time, slower each trip.' },
        ],
      },
      {
        id: 'moon',
        label: 'Ask where the moon goes',
        effects: [
          { stat: 'smarts', delta: 3 },
          { relationship: 'person', delta: 2 },
          { stat: 'health', delta: -1 },
          { log: '{{person}} sat back down and explained the moon. I fell asleep somewhere around the sun.', kind: 'good' },
        ],
      },
      {
        id: 'sleep',
        label: 'Actually go to sleep',
        effects: [
          { stat: 'health', delta: 3 },
          { stat: 'happiness', delta: -1 },
          { log: 'I let {{person}} go. {{They}} stood outside the door for a while, waiting for the catch. There was no catch.' },
        ],
      },
      {
        id: 'sneak',
        label: 'Sneak out after {{them}}',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I watched half a cooking show from behind the couch before anyone noticed. A great night.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -1 }, { log: '{{person}} spotted me in the hallway within a minute. Back to bed, no story, door shut.', kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------- health
  {
    id: 'bt_ear_infection',
    category: 'health',
    title: 'Ear infection',
    text: 'My ear hurts from the inside, so I pulled on it all day and cried at nothing. {{person}} took me to the doctor, who looked in with a tiny flashlight and said "ah".',
    minAge: 1,
    maxAge: 4,
    weight: 1.5,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'medicine',
        label: 'Take the pink medicine',
        effects: [
          { money: -25 },
          { stat: 'health', delta: 2 },
          { stat: 'happiness', delta: -1 },
          { log: '{{person}} paid {{$25}} for pink medicine that tasted like bubblegum and chalk. My ear was fine by Friday.' },
        ],
      },
      {
        id: 'spit',
        label: 'Spit it back out',
        effects: [
          { money: -25 },
          { illness: 'ear_infection' },
          { stat: 'happiness', delta: 1 },
          { stat: 'health', delta: -2 },
          { log: 'I spat the pink medicine at the wall every time. The infection stayed far longer than it needed to.', kind: 'bad' },
        ],
      },
      {
        id: 'yogurt',
        label: 'Only take it in yogurt',
        effects: [
          { money: -25 },
          { stat: 'health', delta: 1 },
          { stat: 'smarts', delta: 1 },
          { relationship: 'person', delta: -1 },
          { log: '{{person}} hid the medicine in yogurt for ten days. I knew. I let {{them}} think I did not.' },
        ],
      },
    ],
  },
  {
    id: 'bt_checkup',
    category: 'health',
    title: 'The checkup',
    text: 'Checkup day. The doctor tapped my knee with a tiny hammer and my leg kicked all by itself. Now she wants to look down my throat with a stick.',
    minAge: 2,
    maxAge: 5,
    weight: 1.5,
    cooldown: 3,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'ahh',
        label: 'Say "ahh" nicely',
        effects: [
          { stat: 'health', delta: 3 },
          { relationship: 'person', delta: 1 },
          { stat: 'happiness', delta: -1 },
          { log: 'I said "ahh" like a professional. The doctor said I was growing beautifully. {{person}} beamed.', kind: 'good' },
        ],
      },
      {
        id: 'kick',
        label: 'Kick the doctor on purpose',
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'health', delta: 2 },
          { karma: -2 },
          { relationship: 'person', delta: -1 },
          { log: 'I worked out the hammer trick and kicked the doctor on purpose. She said my reflexes were excellent.' },
        ],
      },
      {
        id: 'hide',
        label: 'Hide behind {{person}}',
        effects: [
          { stat: 'health', delta: 1 },
          { relationship: 'person', delta: 2 },
          { stat: 'happiness', delta: -1 },
          { log: "I spent the checkup behind {{person}}'s legs. The doctor examined whatever she could reach." },
        ],
      },
    ],
  },

  // ---------------------------------------------------------- big sibling
  {
    id: 'bt_and_how_are_you',
    category: 'family',
    title: 'And how are you?',
    text: 'Every visitor brings a present for {{person}}, coos at the baby for ten minutes, and then turns to me and says "And how are YOU?" like they almost forgot I live here too.',
    minAge: 3,
    maxAge: 8,
    weight: 2,
    once: true,
    person: { kind: ['sibling'], maxAge: 1 },
    choices: [
      {
        id: 'baby',
        label: 'Act like a baby too',
        effects: [
          { stat: 'happiness', delta: 2 },
          { stat: 'smarts', delta: -1 },
          { log: 'I crawled around the living room and asked for a bottle. Everyone laughed. I was not joking.' },
        ],
      },
      {
        id: 'cartwheel',
        label: 'Do my best cartwheel',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { stat: 'health', delta: 1 }, { log: 'I did a cartwheel in the living room and got real applause. The baby slept through my moment.', kind: 'good' }],
            else: [{ injury: 1 }, { stat: 'happiness', delta: -2 }, { log: 'I attempted a cartwheel and kicked a lamp. Everyone looked at me then.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'guide',
        label: 'Introduce the baby myself',
        effects: [
          { relationship: 'person', delta: 4 },
          { karma: 1 },
          { stat: 'happiness', delta: -1 },
          { log: 'I started introducing {{person}} myself, like a tour guide. Visitors called me a wonderful big sibling.', kind: 'good' },
        ],
      },
      {
        id: 'presents',
        label: "Open the baby's presents",
        effects: [
          { karma: -1 },
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: -1 },
          { log: "I opened all of {{person}}'s presents to help. One was a rattle. I kept the rattle." },
        ],
      },
    ],
  },
  {
    id: 'bt_big_helper',
    category: 'family',
    title: 'Big helper',
    text: 'I have been promoted to big helper. My jobs are fetching diapers, guarding the baby, and telling a grown-up when {{person}} makes the face. {{They}} is making the face right now.',
    minAge: 3,
    maxAge: 8,
    weight: 2,
    // "Promoted" happens once; the same baby would otherwise promote me again two years later.
    once: true,
    person: { kind: ['sibling'], maxAge: 2 },
    choices: [
      {
        id: 'fetch',
        label: 'Fetch a diaper, fast',
        effects: [
          { relationship: 'person', delta: 3 },
          { karma: 2 },
          { stat: 'happiness', delta: -1 },
          { log: 'I ran for a diaper and came back with two. I am the best helper in the history of helpers.', kind: 'good' },
        ],
      },
      {
        id: 'guard',
        label: 'Guard the baby closely',
        effects: [
          { relationship: 'person', delta: 2 },
          { stat: 'smarts', delta: 1 },
          { log: 'I sat beside {{person}} and guarded {{them}} from nothing at all for an hour. I take my job seriously.' },
        ],
      },
      {
        id: 'flee',
        label: 'Run from the smell',
        effects: [
          { stat: 'happiness', delta: 2 },
          { karma: -1 },
          { relationship: 'person', delta: -1 },
          { log: 'I yelled "THE FACE!" and ran to my room. A grown-up handled it. I call that delegating.' },
        ],
      },
    ],
  },
  {
    id: 'bt_little_wrecker',
    category: 'family',
    title: 'The little wrecker',
    text: '{{person}} can walk now, which means {{they}} can reach my things. Today {{they}} ate a crayon, tore my best drawing in half and put my favorite toy in the toilet.',
    minAge: 3,
    maxAge: 8,
    weight: 2,
    // "Can walk now" is news once.
    once: true,
    person: { kind: ['sibling'], minAge: 1, maxAge: 3 },
    choices: [
      {
        id: 'scream',
        label: 'Scream for a grown-up',
        effects: [
          { relationship: 'person', delta: -2 },
          { stat: 'happiness', delta: 1 },
          { log: 'I screamed until a grown-up came. {{person}} was moved to the playpen and seemed thrilled about it.' },
        ],
      },
      {
        id: 'shelf',
        label: 'Move everything up high',
        effects: [
          { stat: 'smarts', delta: 3 },
          { stat: 'happiness', delta: -1 },
          { log: 'I moved all my treasures to the top shelf. Now I cannot reach them either, but they are safe.' },
        ],
      },
      {
        id: 'teach',
        label: 'Teach {{them}} to draw',
        effects: [
          { relationship: 'person', delta: 4 },
          { karma: 2 },
          { stat: 'happiness', delta: -1 },
          { log: 'I gave {{person}} a crayon of {{their}} own to draw with. {{They}} ate that one too, but more politely.', kind: 'good' },
        ],
      },
      {
        id: 'pacifier',
        label: 'Hide {{their}} pacifier',
        effects: [
          { karma: -2 },
          { relationship: 'person', delta: -3 },
          { stat: 'happiness', delta: 2 },
          { log: "I hid {{person}}'s pacifier behind the couch. {{They}} cried for an hour. I felt powerful, then guilty.", kind: 'bad' },
        ],
      },
    ],
  },

  // -------------------------------------------------------- single parent
  {
    id: 'bt_team_of_two',
    category: 'family',
    title: 'Two hands, four bags',
    text: 'There is only one grown-up at our place, so {{person}} does the work of two. {{They}} carries the groceries, the laundry, the mail and usually me, all at once, and still has a hand free for the keys.',
    minAge: 3,
    maxAge: 5,
    weight: 1.5,
    once: true,
    // A single parent of either kind: no other parent or step-parent alive in the household.
    conditions: [
      {
        any: [
          { all: [{ noPerson: ['father'] }, { noPerson: ['stepfather'] }, { noPerson: ['stepmother'] }] },
          { all: [{ noPerson: ['mother'] }, { noPerson: ['stepmother'] }, { noPerson: ['stepfather'] }] },
        ],
      },
    ],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'bread',
        label: 'Carry the bread',
        effects: [
          { relationship: 'person', delta: 3 },
          { karma: 1 },
          { log: 'I carried the bread all the way in. It was flatter by the end. {{person}} called it the best help ever.', kind: 'good' },
        ],
      },
      {
        id: 'hip',
        label: 'Ride in on {{their}} hip',
        effects: [
          { stat: 'happiness', delta: 3 },
          { relationship: 'person', delta: 1 },
          { stat: 'health', delta: -1 },
          { log: "I rode in on {{person}}'s hip like royalty, holding nothing but the keys. {{They}} let me unlock the door." },
        ],
      },
      {
        id: 'race',
        label: 'Race {{them}} to the door',
        effects: [
          { stat: 'health', delta: 2 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: -1 },
          { log: 'I raced {{person}} to the door and won by a mile. {{They}} was carrying four bags, but a win is a win.' },
        ],
      },
    ],
  },
  {
    id: 'bt_mom_gets_married',
    category: 'family',
    title: 'The wedding',
    text: '{{person}} is marrying the man who fixed our sink last spring and then kept coming back for Sunday dinner. I have been given an important job: carrying the rings down the aisle on a little pillow.',
    minAge: 3,
    maxAge: 5,
    weight: 1,
    once: true,
    conditions: [{ noPerson: ['father'] }, { noPerson: ['stepfather'] }],
    person: { kind: ['mother'], maxAge: 55 },
    choices: [
      {
        id: 'rings',
        label: 'Carry the rings perfectly',
        effects: [
          { newPerson: { kind: 'stepfather', gender: 'male', relationship: 60, log: '{{mother}} married {{person}}, and now I have a stepdad who makes pancakes shaped like letters.' } },
          { relationship: 'person', delta: 2 },
          { stat: 'happiness', delta: 3 },
          { log: 'I walked the whole aisle without dropping a single ring. Everyone clapped. I bowed twice.', kind: 'milestone' },
        ],
      },
      {
        id: 'ask',
        label: 'Ask if he is my dad',
        effects: [
          { newPerson: { kind: 'stepfather', gender: 'male', relationship: 65, log: '{{mother}} married {{person}}, and now I have a stepdad who makes pancakes shaped like letters.' } },
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { log: 'Mid-vows I asked, loudly, if he was my dad now. He knelt down and said he would be whatever I liked.', kind: 'milestone' },
        ],
      },
      {
        id: 'hide',
        label: 'Hide under the cake table',
        effects: [
          { newPerson: { kind: 'stepfather', gender: 'male', relationship: 75, log: '{{mother}} married {{person}}, and now I have a stepdad who makes pancakes shaped like letters.' } },
          { relationship: 'person', delta: -2 },
          { stat: 'happiness', delta: 2 },
          { stat: 'health', delta: -1 },
          { log: 'I spent the wedding under the cake table. My new stepdad found me there and brought a second slice.' },
        ],
      },
      {
        id: 'run',
        label: 'Run off with the rings',
        effects: [
          { newPerson: { kind: 'stepfather', gender: 'male', relationship: 50, log: '{{mother}} married {{person}}, and now I have a stepdad who makes pancakes shaped like letters.' } },
          { karma: -2 },
          { relationship: 'person', delta: -3 },
          { stat: 'happiness', delta: 4 },
          { log: 'I ran off with the rings and the whole wedding chased me for ten minutes. The photos are wonderful.' },
        ],
      },
    ],
  },
];

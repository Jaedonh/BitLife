import type { EventDef } from '@/engine/events/schema';

/**
 * General childhood (ages 1-12): home, the street, small adventures and the
 * occasional serious moment. School-specific events live in kid_years.ts and
 * school_life.ts; babies and toddlers in early_childhood.ts.
 */
export const CHILDHOOD_EVENTS: EventDef[] = [
  {
    id: 'first_steps',
    category: 'childhood',
    title: 'First steps',
    text: 'I took my first wobbly steps across the living room today. {{mother}} screamed with joy and dropped the phone. Everyone is looking at me. The pressure is enormous.',
    minAge: 1,
    maxAge: 1,
    weight: 3,
    once: true,
    conditions: [{ hasPerson: ['mother'] }],
    choices: [
      {
        id: 'ok',
        label: 'Keep walking',
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'mother', delta: 3 }, { log: 'I walked. Badly, wobbling like a jelly, but I walked. {{mother}} screamed with joy.', kind: 'milestone' }],
      },
      {
        id: 'biscuit',
        label: 'Aim for the biscuit tin',
        effects: [{ stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 1 }, { relationship: 'mother', delta: 1 }, { log: 'I walked straight to the biscuit tin and pointed. Walking, it turns out, has a purpose.', kind: 'milestone' }],
      },
    ],
  },
  {
    id: 'broke_vase',
    category: 'childhood',
    title: 'Uh oh',
    text: 'I knocked over a vase while playing. {{person}} walked in just as it shattered, which was excellent timing for the vase and terrible timing for me.',
    minAge: 3,
    maxAge: 8,
    weight: 2,
    cooldown: 3,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'confess',
        label: 'Confess',
        effects: [{ karma: 2 }, { relationship: 'person', delta: 2 }, { stat: 'happiness', delta: -1 }, { log: '{{person}} appreciated my honesty, even if {{they}} sighed a lot. No pudding, though.' }],
      },
      {
        id: 'blame',
        label: 'Blame the cat',
        effects: [
          { karma: -3 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'The lie worked. I felt a little bad, and a little brilliant.' }],
            else: [{ relationship: 'person', delta: -6 }, { log: "We don't even have a cat. {{person}} was not amused.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'hide',
        label: 'Hide the pieces',
        effects: [
          { karma: -1 },
          {
            chance: 0.6,
            then: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I swept the pieces behind the sofa. Nobody has noticed the vase is gone. Yet.' }],
            else: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -2 }, { log: 'The pieces turned up a week later. {{person}} was very calm about it, which was worse.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'playground_bully',
    category: 'childhood',
    title: 'Playground trouble',
    text: 'A bigger kid shoved me off the slide and laughed about it. Now he is standing at the top of the slide, waiting to see what I will do about it.',
    minAge: 5,
    maxAge: 11,
    weight: 2,
    cooldown: 3,
    choices: [
      {
        id: 'tell',
        label: 'Tell a grown-up',
        effects: [
          {
            chance: 0.7,
            then: [{ log: 'A grown-up stepped in. The bully left me alone after that.', kind: 'good' }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'The grown-up shrugged. The bully called me a snitch.', kind: 'bad' }, { stat: 'happiness', delta: -4 }],
          },
        ],
      },
      {
        id: 'fight',
        label: 'Shove back',
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'I stood my ground and he backed off. I felt ten feet tall.', kind: 'good' }, { stat: 'happiness', delta: 4 }],
            else: [{ log: 'I lost the scuffle and scraped my knee.', kind: 'bad' }, { injury: 3 }, { stat: 'happiness', delta: -3 }],
          },
          { karma: -1 },
        ],
      },
      {
        id: 'walk',
        label: 'Walk away',
        effects: [{ stat: 'happiness', delta: -2 }, { karma: 1 }, { stat: 'smarts', delta: 1 }, { log: 'I walked away. Some days that is the braver choice.' }],
      },
    ],
  },

  // -------------------------------------------------------------- at home
  {
    id: 'ch_scissors',
    category: 'childhood',
    title: 'The scissors',
    text: 'I found the kitchen scissors and a mirror at the same time. My fringe is in my eyes and nobody is around. This feels like destiny.',
    minAge: 3,
    maxAge: 7,
    weight: 2,
    cooldown: 3,
    choices: [
      {
        id: 'cut',
        label: 'Cut my own fringe',
        effects: [
          { stat: 'looks', delta: -4 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.5,
            then: [{ relationship: 'mother', delta: -2 }, { log: 'I cut one side to the scalp. {{mother}} made a noise I had never heard before.', kind: 'bad' }],
            else: [{ log: 'It was crooked, but I liked it. {{mother}} took a photo for my eighteenth birthday.' }],
          },
        ],
      },
      {
        id: 'doll',
        label: 'Give the doll a trim',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 1 }, { log: 'The doll got a bob. The doll did not complain. I learned my craft on a willing client.' }],
      },
      {
        id: 'back',
        label: 'Put them back',
        effects: [{ karma: 1 }, { stat: 'smarts', delta: 1 }, { log: 'I put the scissors back. I got a real haircut the next week. Less exciting, more even.' }],
      },
    ],
  },
  {
    id: 'ch_biscuit_tin',
    category: 'childhood',
    title: 'The biscuit tin',
    text: 'Everyone is asleep and the biscuit tin is on the counter with the lid loose. I can reach it if I stand on the small stool. I have checked.',
    minAge: 3,
    maxAge: 9,
    weight: 2,
    cooldown: 2,
    choices: [
      {
        id: 'one',
        label: 'Take one',
        effects: [
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.8,
            then: [{ log: 'One biscuit, lid back on, stool back in place. The perfect crime.' }],
            else: [{ relationship: 'mother', delta: -2 }, { log: 'There were crumbs on my pillow in the morning. {{mother}} did not need a detective.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'lot',
        label: 'Take the lot',
        effects: [
          { stat: 'happiness', delta: 4 },
          { stat: 'health', delta: -2 },
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ log: 'I ate the whole tin and lay on the floor like a python. Nobody believed a mouse did it.' }],
            else: [{ relationship: 'mother', delta: -3 }, { log: 'An empty tin is hard to explain. I was banned from biscuits for a month.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'no',
        label: 'Go back to bed',
        effects: [{ karma: 1 }, { stat: 'health', delta: 1 }, { log: 'I climbed back into bed and dreamed about biscuits instead. A moral victory, mostly.' }],
      },
    ],
  },
  {
    id: 'ch_bedtime_story',
    category: 'childhood',
    title: 'Chapter three',
    text: '{{person}} was reading me the book about the dragon and fell asleep in the middle of chapter three. The dragon was about to do something. {{They}} is snoring.',
    minAge: 3,
    maxAge: 7,
    weight: 2,
    cooldown: 2,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'read',
        label: 'Finish it myself',
        effects: [{ stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: 2 }, { log: 'I worked out the rest from the pictures and the big words. The dragon was fine. I was proud.' }],
      },
      {
        id: 'wake',
        label: 'Poke {{them}} awake',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 2 }, { log: '{{person}} woke, read two pages, and dozed off again. We took turns like that to the end.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { relationship: 'person', delta: -2 }, { log: '{{person}} woke up cross and turned the light off. The dragon remains in peril.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'sneak',
        label: 'Sneak off to play',
        effects: [
          { stat: 'happiness', delta: 3 },
          { stat: 'health', delta: -1 },
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ log: 'I played with my cars in the dark for an hour. Nobody knew. The dragon can wait.' }],
            else: [{ relationship: 'person', delta: -2 }, { log: 'I was found at midnight under the table with a torch. Bedtime moved an hour earlier.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ch_hide_and_seek',
    category: 'childhood',
    title: 'Hide and seek',
    text: 'Hide and seek, and I have found the perfect spot: the cupboard under the stairs, behind the hoover. It has been a very long time. Nobody is counting any more.',
    minAge: 3,
    maxAge: 8,
    weight: 2,
    cooldown: 3,
    choices: [
      {
        id: 'stay',
        label: 'Stay hidden',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 1 }, { log: 'I was found at dinner time, asleep on the hoover. I had won, technically, and I said so.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { relationship: 'mother', delta: -2 }, { log: 'The whole street was looking for me. {{mother}} had rung two neighbours. I was not a hero.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'jump',
        label: 'Jump out and shout',
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'mother', delta: -1 }, { log: 'I burst out shouting and made {{mother}} drop a plate. She laughed after. A little after.' }],
      },
      {
        id: 'dinner',
        label: 'Come out for dinner',
        effects: [{ stat: 'health', delta: 1 }, { stat: 'happiness', delta: 1 }, { karma: 1 }, { log: 'I came out when I smelled dinner. Nobody had noticed I was gone. I decided to be fine with that.' }],
      },
    ],
  },
  {
    id: 'ch_long_drive',
    category: 'childhood',
    title: 'Are we there yet?',
    text: 'Six hours in the back of the car. {{person}} is driving, the radio is playing music nobody my age should hear, and I have asked the question eleven times.',
    minAge: 3,
    maxAge: 10,
    weight: 2,
    cooldown: 2,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'ask',
        label: 'Ask a twelfth time',
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: -3 }, { karma: -1 }, { log: 'I asked. {{person}} pulled over. We sat in silence by the road for a full minute. Worth it.' }],
      },
      {
        id: 'sleep',
        label: 'Fall asleep',
        effects: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I slept through four of the six hours and woke up somewhere new. Excellent travelling.' }],
      },
      {
        id: 'games',
        label: 'Play I spy with {{them}}',
        effects: [{ stat: 'smarts', delta: 2 }, { relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'We played I spy for two hours. Everything was "road" or "sky". {{person}} never gave up.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'ch_lost_teddy',
    category: 'childhood',
    title: 'Bear on the bus',
    text: 'We got off the bus and my bear did not. I watched him through the back window, sitting in his seat, getting smaller. He did not even wave.',
    minAge: 3,
    maxAge: 7,
    weight: 1.5,
    once: true,
    conditions: [{ hasPerson: ['mother'] }],
    choices: [
      {
        id: 'chase',
        label: 'Cry until we chase it',
        effects: [
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 5 }, { relationship: 'mother', delta: 2 }, { log: 'The driver had him up front by the wheel. I have never been so pleased to see anyone.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The bus was long gone. Somewhere out there, a bear is riding the number 12 forever.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'new',
        label: 'Accept a new bear',
        effects: [{ stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: 1 }, { log: 'The new bear is fine. He is not the same bear. We have an understanding.' }],
      },
      {
        id: 'funeral',
        label: 'Hold a small funeral',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 2 }, { karma: 1 }, { log: 'We buried a sock in his honour. {{mother}} said a few words. It helped more than I expected.' }],
      },
    ],
  },
  {
    id: 'ch_found_coin',
    category: 'childhood',
    title: 'A coin',
    text: 'There is a coin on the pavement, shining up at me like it has been waiting all day. Nobody is looking. {{mother}} is three steps ahead, talking.',
    minAge: 4,
    maxAge: 9,
    weight: 2,
    cooldown: 3,
    conditions: [{ hasPerson: ['mother'] }],
    choices: [
      {
        id: 'keep',
        label: 'Pocket it',
        effects: [{ money: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I pocketed it. {{$2}} richer and nobody the wiser. My first income.', kind: 'money' }],
      },
      {
        id: 'give',
        label: 'Hand it to {{mother}}',
        effects: [{ relationship: 'mother', delta: 2 }, { karma: 1 }, { log: 'I gave it to {{mother}}. She said finders keepers and gave it back. I had been tested, I think.' }],
      },
      {
        id: 'charity',
        label: 'Drop it in the charity box',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I dropped it in the charity box outside the shop. It made a very satisfying clunk.', kind: 'good' }],
      },
    ],
  },

  // ---------------------------------------------------------- out and about
  {
    id: 'ch_bike_lesson',
    category: 'childhood',
    title: 'Two wheels',
    text: 'The stabilisers came off my bike today. {{person}} is jogging behind me holding the saddle and promising, slightly out of breath, not to let go.',
    minAge: 4,
    maxAge: 8,
    weight: 2,
    once: true,
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'pedal',
        label: 'Pedal like mad',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 2 }, { log: 'I looked back and {{person}} was twenty metres behind me, cheering. I was riding a bike.', kind: 'good' }],
            else: [{ injury: 2 }, { stat: 'happiness', delta: -2 }, { log: 'I wobbled, panicked and met the hedge. {{person}} picked me out of it and we tried again.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'slow',
        label: 'Go slowly',
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 2 }, { log: 'Up and down the path a dozen times, slowly. By dinner I could do it alone.' }],
      },
      {
        id: 'quit',
        label: 'Demand the stabilisers back',
        effects: [{ stat: 'happiness', delta: 1 }, { stat: 'health', delta: 1 }, { relationship: 'person', delta: -2 }, { log: 'I asked for the stabilisers back. {{person}} put them on and said next year would be fine.' }],
      },
    ],
  },
  {
    id: 'ch_climb_tree',
    category: 'childhood',
    title: 'The big tree',
    text: 'There is a tree at the end of the street that every kid says is unclimbable. Today the lowest branch looks closer than it did last summer.',
    minAge: 5,
    maxAge: 11,
    weight: 2,
    cooldown: 3,
    choices: [
      {
        id: 'top',
        label: 'Climb to the top',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 6 }, { stat: 'health', delta: 1 }, { log: 'I made it to the top and could see the whole street. Nobody has ever been higher.', kind: 'good' }],
            else: [{ injury: 4 }, { stat: 'happiness', delta: -3 }, { log: 'A branch gave way halfway up. I came down fast and landed on my arm.', kind: 'bad' }, { queue: 'ch_cast_signatures' }],
          },
        ],
      },
      {
        id: 'half',
        label: 'Stop at the first fork',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'I sat in the first fork and swung my legs. High enough to feel brave, low enough to jump.' }],
      },
      {
        id: 'ground',
        label: 'Stay on the ground',
        effects: [{ stat: 'happiness', delta: -1 }, { stat: 'smarts', delta: 1 }, { stat: 'health', delta: 1 }, { log: 'I watched from the ground and gave advice. Nobody took it. Nobody fell either.' }],
      },
    ],
  },
  {
    id: 'ch_cast_signatures',
    category: 'childhood',
    title: 'The cast',
    text: 'My arm is in a cast for six weeks. It itches, it is heavy, and every person I have ever met wants to write something on it.',
    minAge: 5,
    maxAge: 12,
    weight: 1,
    followUpOnly: true,
    choices: [
      {
        id: 'everyone',
        label: 'Let everyone sign it',
        effects: [{ stat: 'happiness', delta: 4 }, { log: 'By the end of the week the cast was solid ink. The doctor had to hunt for a gap to write the date.', kind: 'good' }],
      },
      {
        id: 'clean',
        label: 'Keep it clean',
        effects: [{ stat: 'health', delta: 1 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }, { log: 'I kept it spotless. The doctor said it was the tidiest cast he had cut off all year.' }],
      },
      {
        id: 'draw',
        label: 'Draw on it myself',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 2 }, { log: 'I covered it in dragons. Several people asked who the artist was. I said it was me, loudly.' }],
      },
    ],
  },
  {
    id: 'ch_deep_end',
    category: 'childhood',
    title: 'The deep end',
    text: 'Swimming lessons. The shallow end is warm and friendly. The deep end is dark blue and has a sign with a number on it that is bigger than me.',
    minAge: 4,
    maxAge: 9,
    weight: 2,
    once: true,
    choices: [
      {
        id: 'jump',
        label: 'Jump in the deep end',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 5 }, { stat: 'health', delta: 2 }, { log: 'I jumped, sank, kicked and came up grinning. The instructor said I was a natural, eventually.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { stat: 'health', delta: -1 }, { log: 'I jumped, swallowed half the pool and was fished out with a pole. I stayed shallow after that.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'shallow',
        label: 'Stay in the shallows',
        effects: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I splashed in the shallows and learned to float. The deep end can wait until I am taller.' }],
      },
      {
        id: 'refuse',
        label: 'Refuse to get in',
        effects: [{ stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 1 }, { log: 'I sat on the side in my towel and watched. I know a lot about swimming now, in theory.' }],
      },
    ],
  },
  {
    id: 'ch_ball_over_fence',
    category: 'childhood',
    title: 'Over the fence',
    text: 'My ball went over the fence into the garden of the neighbour who shouts at pigeons. It is sitting on his lawn, in full view, next to his prize roses.',
    minAge: 5,
    maxAge: 11,
    weight: 2,
    cooldown: 3,
    choices: [
      {
        id: 'knock',
        label: 'Knock and ask nicely',
        effects: [
          { karma: 1 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'He grumbled, fetched the ball, and gave me a sweet from a jar older than me. Not so bad.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'He said the ball was his now. Rules of the garden. I did not know those were the rules.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'climb',
        label: 'Climb over and grab it',
        effects: [
          { karma: -1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'Over, grab, back, in under ten seconds. I was a ghost. The roses were unharmed, mostly.' }],
            else: [{ stat: 'happiness', delta: -4 }, { relationship: 'mother', delta: -2 }, { injury: 1 }, { log: 'I landed in the roses. He marched me home by the collar and gave {{mother}} a speech.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'leave',
        label: 'Abandon the ball',
        effects: [{ stat: 'happiness', delta: -2 }, { stat: 'smarts', delta: 1 }, { log: 'I let the ball go. It is his now, like the three before it. He must have quite a collection.' }],
      },
    ],
  },
  {
    id: 'ch_snow_day',
    category: 'childhood',
    title: 'Snow day',
    text: 'It snowed in the night, properly, the kind that swallows the garden fence. {{person}} is already outside, rolling something enormous across the lawn.',
    minAge: 3,
    maxAge: 10,
    weight: 1.5,
    cooldown: 3,
    person: { kind: ['sibling', 'friend', 'bestFriend'] },
    choices: [
      {
        id: 'fight',
        label: 'Start a snowball fight',
        effects: [
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 3 }, { log: 'Snowballs flew for an hour. {{person}} got one down my neck. I got one in {{their}} ear. Even.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { stat: 'health', delta: -1 }, { log: 'My snowball had a stone in it. I did not know. {{person}} did not care that I did not know.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'snowman',
        label: 'Help build the snowman',
        effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 3 }, { log: 'Our snowman had a carrot, a scarf and a very worried expression. We were proud of him.', kind: 'good' }],
      },
      {
        id: 'inside',
        label: 'Stay in with cocoa',
        effects: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: 1 }, { relationship: 'person', delta: -1 }, { log: 'I watched from the window with cocoa. {{person}} came in blue and jealous of my cocoa.' }],
      },
    ],
  },
  {
    id: 'ch_kite',
    category: 'childhood',
    title: 'The kite',
    text: 'A proper windy day, and {{person}} has dug an old kite out of the cupboard. It has a tail made of rags and a tangle of string that looks like a problem.',
    minAge: 4,
    maxAge: 10,
    weight: 1.5,
    cooldown: 3,
    person: { kind: ['mother', 'father', 'sibling'] },
    choices: [
      {
        id: 'all',
        label: 'Let out all the string',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 2 }, { log: 'The kite went so high it was a dot. {{person}} and I stood with our necks bent, grinning.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The string snapped. The kite is in a tree three streets away. We watched it for a while.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'careful',
        label: 'Keep it low and steady',
        effects: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 2 }, { stat: 'smarts', delta: 1 }, { log: 'Low and steady, no tangles, home for tea. {{person}} said I had the touch.' }],
      },
      {
        id: 'hand',
        label: 'Let {{them}} fly it',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: 3 }, { log: 'I handed {{person}} the reel and sat down. {{They}} got it up on the third try and whooped.' }],
      },
    ],
  },
  {
    id: 'ch_balloon',
    category: 'childhood',
    title: 'The balloon',
    text: 'I was given a red balloon at the fair and let go of the string for one second to scratch my nose. It is now very high up and getting higher.',
    minAge: 3,
    maxAge: 7,
    weight: 2,
    cooldown: 3,
    choices: [
      {
        id: 'cry',
        label: 'Cry',
        effects: [
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { relationship: 'mother', delta: 1 }, { log: 'A new balloon appeared within a minute. Crying is a skill and I am good at it.' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'No new balloon. I cried all the way to the car. The balloon had the better day.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'wave',
        label: 'Wave it goodbye',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'smarts', delta: 2 }, { log: 'I waved. It went over the big wheel and into the sun. I decided that was where it wanted to be.', kind: 'good' }],
      },
      {
        id: 'another',
        label: 'Demand another',
        effects: [
          { karma: -1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I demanded a replacement with such authority that one was produced. Power.' }],
            else: [{ stat: 'happiness', delta: -3 }, { relationship: 'mother', delta: -2 }, { log: 'The answer was no, followed by a lecture about letting go. I did not enjoy the lecture.', kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------- people and health
  {
    id: 'ch_playdate_toy',
    category: 'childhood',
    title: 'My truck',
    text: '{{person}} walked in and went straight for my truck. My truck. The red one. {{They}} is holding it with both hands and looking at me very innocently.',
    minAge: 3,
    maxAge: 7,
    weight: 2,
    cooldown: 2,
    person: { kind: ['sibling', 'friend', 'bestFriend'] },
    choices: [
      {
        id: 'share',
        label: 'Share it',
        effects: [{ karma: 1 }, { relationship: 'person', delta: 3 }, { stat: 'happiness', delta: -1 }, { log: 'I let {{person}} have the truck. It came back with a scratch. We are still friends. Mostly.' }],
      },
      {
        id: 'grab',
        label: 'Grab it back',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -3 }, { log: 'I got the truck. {{person}} got a tantrum. Nobody played with anything for an hour.' }],
            else: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -2 }, { relationship: 'mother', delta: -1 }, { log: 'Tug of war. The truck lost a wheel. {{mother}} took it away from both of us.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'trade',
        label: 'Offer a trade',
        effects: [{ stat: 'smarts', delta: 2 }, { relationship: 'person', delta: 1 }, { stat: 'happiness', delta: 1 }, { log: 'I offered the blue car. {{person}} took the deal. The blue car was the better car. Nobody knows.' }],
      },
    ],
  },
  {
    id: 'ch_dentist',
    category: 'childhood',
    title: 'Open wide',
    text: 'My first trip to the dentist. The chair goes up and down, the light is very bright, and a stranger in a mask wants to count my teeth with a small metal hook.',
    minAge: 3,
    maxAge: 8,
    weight: 2,
    cooldown: 3,
    choices: [
      {
        id: 'open',
        label: 'Open wide',
        effects: [{ stat: 'health', delta: 3 }, { stat: 'happiness', delta: 1 }, { log: 'I opened wide and got through it. Twenty teeth, no holes, one sticker shaped like a tooth.', kind: 'good' }],
      },
      {
        id: 'clamp',
        label: 'Clamp my mouth shut',
        effects: [{ stat: 'happiness', delta: 2 }, { stat: 'health', delta: -2 }, { relationship: 'mother', delta: -1 }, { log: 'I kept my mouth shut for twenty minutes. The dentist gave up. {{mother}} rebooked. I will be back.' }],
      },
      {
        id: 'deal',
        label: 'Negotiate for two stickers',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'health', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'Two stickers and a look in the mirror first. The dentist admired my technique. We shook on it.' }],
      },
    ],
  },
  {
    id: 'ch_fake_sick',
    category: 'childhood',
    title: 'A scratchy throat',
    text: 'I woke up with a scratchy throat on the morning of the spelling test. It is barely anything. {{mother}} is standing in the doorway holding the thermometer.',
    minAge: 6,
    maxAge: 11,
    weight: 2,
    cooldown: 2,
    conditions: [{ enrolled: true }, { hasPerson: ['mother'] }],
    choices: [
      {
        id: 'cough',
        label: 'Cough dramatically',
        effects: [
          { karma: -1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { grade: -2 }, { log: 'A day on the sofa with cartoons and soup. The spelling test will wait. Worth every cough.' }],
            else: [{ stat: 'happiness', delta: -3 }, { relationship: 'mother', delta: -3 }, { log: 'The thermometer said normal and {{mother}} said "school". The coughing stopped very quickly.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'go',
        label: 'Go to school anyway',
        effects: [{ grade: 3 }, { stat: 'happiness', delta: -1 }, { karma: 1 }, { log: 'I went in and took the test with a croak. I spelled "necessary" right. Probably.' }],
      },
      {
        id: 'half',
        label: 'Ask for a half day',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 1 }, { relationship: 'mother', delta: 1 }, { grade: -1 }, { log: 'I negotiated a half day. Test in the morning, sofa in the afternoon. Diplomacy.' }],
      },
    ],
  },
  {
    id: 'ch_grandma_passing',
    category: 'childhood',
    title: 'A quiet morning',
    text: '{{mother}} answered the phone, sat down slowly, and stayed sitting. Grandma died in the night. It was peaceful and not a surprise, the grown-ups keep saying.',
    minAge: 4,
    maxAge: 12,
    weight: 0.6,
    once: true,
    conditions: [{ hasPerson: ['mother'] }],
    choices: [
      {
        id: 'ask',
        label: 'Ask what happens now',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: -2 }, { relationship: 'mother', delta: 2 }, { log: 'I asked a lot of questions. {{mother}} answered every one, even the hard ones, and held my hand.' }],
      },
      {
        id: 'card',
        label: 'Make a card for her',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: -1 }, { relationship: 'mother', delta: 2 }, { log: 'I drew Grandma in her garden under a very large sun. It went in with her. {{mother}} cried.' }],
      },
      {
        id: 'quiet',
        label: 'Stay very quiet',
        effects: [{ stat: 'happiness', delta: -3 }, { relationship: 'mother', delta: 3 }, { log: 'I did not know what to say, so I said nothing and sat close. Sometimes that is enough.' }],
      },
    ],
  },
];

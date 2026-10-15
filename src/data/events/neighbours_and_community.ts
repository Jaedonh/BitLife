import type { EventDef } from '@/engine/events/schema';

/**
 * Ages 10+: neighbours, the street and the town of {{city}}. Noise, floods,
 * petitions, potholes, festivals, jury duty and the occasional act of
 * heroism. Follow-ups (followUpOnly) are queued by the events that set them
 * up and never fire on their own.
 */
export const NEIGHBOURS_AND_COMMUNITY_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ neighbours
  {
    id: 'nc_noisy_neighbour',
    category: 'random',
    title: 'Noisy neighbour',
    text: 'The people next door have discovered bass. Every night at eleven the walls hum, the glasses rattle, and my pillow starts vibrating like it has somewhere to be.',
    minAge: 14,
    maxAge: 90,
    weight: 2,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'ask',
        label: 'Knock and ask nicely',
        effects: [
          { karma: 1 },
          {
            chance: 0.6,
            then: [{ log: 'They apologised, turned it down and offered me a slice of cake. Civilisation works.', kind: 'good' }, { stat: 'happiness', delta: 3 }],
            else: [{ log: 'They nodded, closed the door, and turned it up. I think it was a message.', kind: 'bad' }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'report',
        label: 'Report it to the council',
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'A warning letter arrived at their door. The bass stopped. The dirty looks did not.', kind: 'good' }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'The council sent a leaflet about community mediation. The bass continued, now with a sense of irony.', kind: 'bad' }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
      {
        id: 'join',
        label: 'Go and join the party',
        effects: [
          { stat: 'happiness', delta: 5 },
          { energy: -1 },
          { log: 'If you cannot beat them, dance in their kitchen. The bass is better from the inside.', kind: 'good' },
          { chance: 0.4, then: [{ newPerson: { kind: 'friend', relationship: 55, log: 'I met {{person}} by the speakers and we became friends.' } }] },
          { chance: 0.25, then: [{ stat: 'health', delta: -2 }, { log: 'I got home at 3am with a headache and a new favourite song.' }] },
        ],
      },
      {
        id: 'retaliate',
        label: 'Blast music back louder',
        effects: [
          { karma: -3 },
          {
            random: [
              { weight: 5, effects: [{ log: 'An arms race began. By Friday the whole street hated both of us.', kind: 'bad' }, { stat: 'happiness', delta: -4 }, { chance: 0.5, then: [{ newPerson: { kind: 'enemy', relationship: 10, log: 'My neighbour {{person}} is now officially my enemy.' } }] }] },
              { weight: 3, effects: [{ log: 'They got the message and turned it down. We have never spoken since.' }, { stat: 'happiness', delta: 2 }] },
              { weight: 2, effects: [{ log: 'The police visited me, not them. I received a noise warning and a lecture.', kind: 'bad' }, { stat: 'happiness', delta: -3 }, { money: -100 }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'nc_lost_dog_poster',
    category: 'random',
    title: 'Lost dog poster',
    text: 'A poster on the lamppost outside: LOST DOG, answers to Biscuit, reward offered. The photo shows a small brown creature with the eyes of a tiny philosopher.',
    minAge: 10,
    maxAge: 85,
    weight: 2,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'search',
        label: 'Search the neighbourhood',
        effects: [
          { stat: 'health', delta: 1 },
          {
            random: [
              { weight: 4, effects: [{ log: 'I found Biscuit under a hedge two streets away. The owner cried and pressed {{$80}} into my hand.', kind: 'money' }, { money: 80 }, { stat: 'happiness', delta: 5 }, { karma: 3 }] },
              { weight: 2, effects: [{ log: 'I found Biscuit, but the number on the poster was dead and the house was empty. Biscuit lives with me now.', kind: 'milestone' }, { newPerson: { kind: 'pet', species: 'dog', relationship: 70, log: 'I renamed Biscuit {{person}}, which Biscuit tolerated.' } }, { stat: 'happiness', delta: 6 }, { money: -60 }] },
              { weight: 4, effects: [{ log: 'I walked for three hours, met four other dogs, none of them Biscuit.' }, { stat: 'happiness', delta: -1 }] },
            ],
          },
        ],
      },
      {
        id: 'share',
        label: 'Share the poster around',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I photographed the poster and sent it to everyone I knew. Biscuit was home by the weekend, apparently.', kind: 'good' }],
      },
      {
        id: 'walk',
        label: 'Keep walking',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'Not my dog, not my problem. I thought about those eyes all evening though.' }],
      },
    ],
  },
  {
    id: 'nc_block_party',
    category: 'random',
    title: 'Block party',
    text: 'The street closed itself off for a block party: folding tables, a questionable sound system and a man grilling with the confidence of a surgeon. I brought {{person}} along.',
    minAge: 12,
    maxAge: 90,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend', 'sibling', 'lover', 'spouse'] },
    choices: [
      {
        id: 'dish',
        label: 'Bring a homemade dish',
        hint: 'Costs {{$40}}',
        effects: [
          { money: -40 },
          {
            chance: 0.7,
            then: [{ log: 'My dish vanished in minutes. Three neighbours asked for the recipe. I do not have a recipe.', kind: 'good' }, { stat: 'happiness', delta: 4 }, { karma: 1 }],
            else: [{ log: 'My dish sat untouched beside the potato salad. {{person}} ate some out of loyalty.', kind: 'bad' }, { stat: 'happiness', delta: -2 }, { relationship: 'person', delta: 2 }],
          },
        ],
      },
      {
        id: 'mic',
        label: 'Take over the microphone',
        effects: [
          {
            random: [
              { weight: 5, effects: [{ log: 'I led the street in a sing-along. {{person}} filmed the whole thing and will never delete it.', kind: 'good' }, { stat: 'happiness', delta: 5 }, { fame: 1 }] },
              { weight: 5, effects: [{ log: 'I forgot the words halfway through. A toddler booed. {{person}} pretended not to know me.', kind: 'bad' }, { stat: 'happiness', delta: -3 }, { relationship: 'person', delta: -3 }] },
            ],
          },
        ],
      },
      {
        id: 'cleanup',
        label: 'Help with the clean-up',
        effects: [
          { karma: 3 },
          { stat: 'health', delta: -1 },
          { stat: 'happiness', delta: 2 },
          { relationship: 'person', delta: 3 },
          { log: '{{person}} and I stayed till the last table was folded. The grill man gave us the leftover sausages, which felt like a knighthood.', kind: 'good' },
          { chance: 0.15, then: [{ illness: 'food_poisoning' }, { log: 'The sausages had been out for six hours. I learned this the hard way.', kind: 'bad' }] },
        ],
      },
      {
        id: 'leave',
        label: 'Leave after ten minutes',
        effects: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: 1 }, { log: '{{person}} wanted to stay. I did not. {{They}} stayed anyway, and had a better evening than me.' }],
      },
    ],
  },
  {
    id: 'nc_petition',
    category: 'random',
    title: 'Petition at the door',
    text: 'A neighbour with a clipboard wants my signature to stop the council turning the old bowling green into flats. She is very sincere and slightly out of breath.',
    minAge: 16,
    maxAge: 90,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'sign',
        label: 'Sign it',
        effects: [
          { karma: 1 },
          { stat: 'happiness', delta: 1 },
          { log: 'I signed. She thanked me like I had donated a kidney.' },
          { chance: 0.3, then: [{ log: 'Months later the plan was shelved. I like to think my signature tipped it.', kind: 'good' }, { stat: 'happiness', delta: 2 }] },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse politely',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }, { log: 'I said the town needs housing. She blinked, wrote something down, and moved on. I am now on a list.' }],
      },
      {
        id: 'canvass',
        label: 'Offer to canvass with her',
        effects: [
          { karma: 3 },
          { energy: -1 },
          { stat: 'health', delta: 1 },
          {
            chance: 0.5,
            then: [{ log: 'Three evenings of door-knocking and we had four hundred names.', kind: 'good' }, { stat: 'happiness', delta: 3 }, { newPerson: { kind: 'friend', relationship: 60, log: 'Somewhere around door two hundred, {{person}} and I became friends.' } }],
            else: [{ log: 'I knocked on forty doors. Twenty-eight pretended not to be in.' }, { stat: 'happiness', delta: -1 }],
          },
        ],
      },
      {
        id: 'fake',
        label: 'Sign a fake name',
        effects: [
          { karma: -2 },
          {
            chance: 0.3,
            then: [{ log: "She spotted 'Lord Flibbertigibbet' and gave me a look I will carry to my grave.", kind: 'bad' }, { stat: 'happiness', delta: -3 }],
            else: [{ log: 'I signed as Lord Flibbertigibbet. His lordship is now a registered local objector.' }, { stat: 'happiness', delta: 2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'nc_neighbour_moving',
    category: 'random',
    title: 'Moving day',
    text: 'The neighbour two doors down is moving out and the van is already late. He stands among boxes, looking at me the way a drowning man looks at a lifeguard.',
    minAge: 14,
    maxAge: 85,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'allday',
        label: 'Help all day',
        effects: [
          { karma: 4 },
          { stat: 'health', delta: -2 },
          { stat: 'happiness', delta: 2 },
          {
            random: [
              { weight: 5, effects: [{ log: 'Seven hours, one sofa, one staircase that fought back. He bought me dinner and shook my hand like it meant something.', kind: 'good' }] },
              { weight: 3, effects: [{ log: 'He left me {{$60}} and a box of things he could not fit. The box contained a fondue set.', kind: 'money' }, { money: 60 }] },
              { weight: 2, effects: [{ log: 'I lifted the wardrobe wrong and spent the evening lying very still on the floor.', kind: 'bad' }, { injury: 3 }] },
            ],
          },
        ],
      },
      {
        id: 'hour',
        label: 'Help for an hour',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I carried boxes for an hour and then remembered an appointment that did not exist.' }],
      },
      {
        id: 'busy',
        label: "Pretend I'm busy",
        effects: [{ karma: -2 }, { stat: 'happiness', delta: -2 }, { log: 'I watched from behind the curtain. He carried the sofa alone. It took him forty minutes.' }],
      },
      {
        id: 'keepbox',
        label: 'Help and keep a box',
        effects: [
          { karma: -5 },
          { money: 80 },
          { counter: 'crimes' },
          {
            chance: 0.3,
            then: [{ log: 'He noticed the missing box and came back for it. The street now knows.', kind: 'bad' }, { stat: 'happiness', delta: -4 }, { money: -80 }],
            else: [{ log: 'The box was mostly cables, one decent speaker, and guilt.' }, { stat: 'happiness', delta: -1 }],
          },
        ],
      },
    ],
  },
  {
    id: 'nc_elderly_neighbour',
    category: 'random',
    title: 'Four shopping bags',
    text: 'The old man next door was struggling up his path with four shopping bags and the dignity of someone who would rather fall than ask. One bag was already losing oranges.',
    minAge: 10,
    maxAge: 70,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'carry',
        label: 'Carry the bags',
        effects: [
          { karma: 2 },
          { stat: 'happiness', delta: 2 },
          {
            random: [
              { weight: 6, effects: [{ log: 'I carried the bags. He told me about the street in 1960, when it was apparently all fields and better.' }, { stat: 'smarts', delta: 1 }] },
              { weight: 3, effects: [{ log: 'He pressed {{$10}} into my hand and would not take it back. He also gave me an orange.', kind: 'money' }, { money: 10 }] },
              { weight: 1, effects: [{ log: 'He invited me in and I left two hours later knowing more about naval history than I will ever need.' }, { stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 1 }] },
            ],
          },
        ],
      },
      {
        id: 'weekly',
        label: 'Start checking in every week',
        effects: [
          { karma: 4 },
          { energy: -1 },
          { stat: 'happiness', delta: 3 },
          { stat: 'smarts', delta: 1 },
          { flag: 'nc_old_neighbour_friend', set: true },
          { log: "Every Thursday after that: his bags, his kettle, his stories. He started calling me 'the good one'.", kind: 'good' },
        ],
      },
      {
        id: 'phone',
        label: 'Pretend to be on the phone',
        effects: [{ karma: -2 }, { stat: 'happiness', delta: -1 }, { log: "I said 'uh huh, uh huh' into a silent phone and walked past. The oranges rolled into the road." }],
      },
    ],
  },
  {
    id: 'nc_neighbour_will',
    category: 'random',
    title: "A lawyer's letter",
    text: "A solicitor's letter: the elderly neighbour from years back has died and left me something in the will. 'In recognition of kindness shown,' it says, before getting to the numbers.",
    minAge: 25,
    maxAge: 95,
    weight: 0.3,
    once: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'accept',
        label: 'Accept gratefully',
        effects: [
          { stat: 'happiness', delta: 5 },
          {
            random: [
              { weight: 6, effects: [{ money: 2500 }, { log: 'He left me {{$2500}} and his collection of naval history books. I read one.', kind: 'money' }] },
              { weight: 3, effects: [{ money: 40000 }, { log: 'He left me {{$40000}}. His own family had not visited in a decade. I visited his grave instead.', kind: 'money' }] },
              { weight: 1, effects: [{ money: 300000 }, { log: 'He left me nearly everything: {{$300000}}. His family are contesting it. The solicitor says it will hold.', kind: 'milestone' }] },
            ],
          },
        ],
      },
      {
        id: 'family',
        label: 'Pass it to his family',
        effects: [{ karma: 6 }, { stat: 'happiness', delta: 3 }, { log: 'I signed it over to his estranged family. They never thanked me. He would have, which is the point.', kind: 'good' }],
      },
      {
        id: 'more',
        label: 'Ask the solicitor for more',
        effects: [
          { karma: -4 },
          {
            chance: 0.3,
            then: [{ money: 6000 }, { log: 'There was a second fund. It was, technically, mine. I took it and felt slightly ill.', kind: 'money' }],
            else: [{ money: 2500 }, { log: 'The solicitor looked at me over his glasses for a long time. There was nothing more, and I had made it weird.', kind: 'bad' }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'eulogy',
        label: 'Speak at the funeral',
        conditions: [{ flag: 'nc_old_neighbour_friend', exists: true }],
        effects: [{ money: 2500 }, { karma: 3 }, { fame: 1 }, { stat: 'happiness', delta: 4 }, { log: 'I spoke at the funeral about Thursdays and oranges. Then I accepted the {{$2500}} he left me, and kept the kettle.', kind: 'milestone' }],
      },
    ],
  },

  // ------------------------------------------------------------ the street
  {
    id: 'nc_flooded_street',
    category: 'random',
    title: 'Flooded street',
    text: 'After a night of rain the bottom of my street became a lake. Two cars sat stranded in it, a wheelie bin drifted past, and a duck looked extremely pleased.',
    minAge: 12,
    maxAge: 90,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'wade',
        label: 'Wade through it',
        effects: [
          {
            random: [
              { weight: 6, effects: [{ log: 'Knee-deep, freezing, and something soft touched my ankle. I made it. My shoes did not.' }, { money: -40 }, { stat: 'happiness', delta: -2 }] },
              { weight: 3, effects: [{ log: 'I slipped on something invisible and went under. Dignity: gone. Phone: also gone.', kind: 'bad' }, { injury: 3 }, { money: -200 }] },
              { weight: 1, effects: [{ log: 'I waded across like an explorer and someone applauded from a window.', kind: 'good' }, { stat: 'happiness', delta: 3 }] },
            ],
          },
          { chance: 0.2, then: [{ illness: 'cold' }] },
        ],
      },
      {
        id: 'push',
        label: 'Help push the stranded cars',
        effects: [
          { karma: 3 },
          { stat: 'health', delta: -1 },
          {
            chance: 0.5,
            then: [{ log: 'We got both cars out. One driver handed me {{$50}} and a very wet handshake.', kind: 'money' }, { money: 50 }, { stat: 'happiness', delta: 3 }],
            else: [{ log: 'We pushed for an hour. The car did not move. Neither did the duck.' }, { stat: 'happiness', delta: -1 }],
          },
          { chance: 0.15, then: [{ injury: 2 }, { log: 'I wrenched my back on the second car.', kind: 'bad' }] },
        ],
      },
      {
        id: 'drive',
        label: 'Drive through it',
        conditions: [{ ownsAsset: 'car' }],
        effects: [
          {
            random: [
              { weight: 6, effects: [{ log: 'The car coughed, spluttered and made it. The engine has never sounded the same.' }, { asset: 'damage', kind: 'car', amount: 20 }] },
              { weight: 4, effects: [{ log: 'The car died mid-lake. I was towed out in front of everyone, including the duck.', kind: 'bad' }, { asset: 'damage', kind: 'car', amount: 40 }, { money: -300 }, { stat: 'happiness', delta: -5 }] },
            ],
          },
        ],
      },
      {
        id: 'wait',
        label: 'Wait for it to drain',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I stayed home and watched the duck. The water went down by evening. Slow day, dry socks.' }],
      },
    ],
  },
  {
    id: 'nc_power_cut',
    category: 'random',
    title: 'Power cut',
    text: 'The whole street went dark at eight. No lights, no screens, no hum from the fridge. {{person}} found a torch and we stood in the kitchen wondering what people did in 1850.',
    minAge: 10,
    maxAge: 90,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'spouse', 'lover', 'child', 'friend'] },
    choices: [
      {
        id: 'stories',
        label: 'Tell stories by candlelight',
        effects: [{ stat: 'happiness', delta: 4 }, { relationship: 'person', delta: 5 }, { stat: 'smarts', delta: 1 }, { log: '{{person}} told me things {{they}} had never mentioned before. The dark is good for that.', kind: 'good' }],
      },
      {
        id: 'elderly',
        label: 'Check on the old folks',
        effects: [
          { karma: 3 },
          { stat: 'happiness', delta: 2 },
          { log: 'I knocked on the older neighbours and sat with one until the lights came back. She fed me biscuits in the dark.', kind: 'good' },
          { chance: 0.3, then: [{ money: 30 }, { log: 'She insisted I take {{$30}} for my trouble.', kind: 'money' }] },
        ],
      },
      {
        id: 'feast',
        label: 'Eat everything before it spoils',
        effects: [
          { stat: 'happiness', delta: 3 },
          {
            random: [
              { weight: 7, effects: [{ log: 'Ice cream, then the cheese, then the mystery leftovers. A feast by torchlight with {{person}}.', kind: 'good' }, { relationship: 'person', delta: 2 }] },
              { weight: 3, effects: [{ log: 'The mystery leftovers were a mistake.', kind: 'bad' }, { illness: 'food_poisoning' }] },
            ],
          },
        ],
      },
      {
        id: 'complain',
        label: 'Sit in the dark complaining',
        effects: [{ stat: 'happiness', delta: -2 }, { relationship: 'person', delta: -2 }, { log: 'I narrated my grievances to {{person}} for two hours. The lights came back. {{They}} looked relieved for the wrong reasons.' }],
      },
    ],
  },
  {
    id: 'nc_pothole_feud',
    category: 'random',
    title: 'The pothole',
    text: "There is a pothole at the end of my road deep enough to have its own weather. The council has ignored three reports. Yesterday it ate a cyclist's front wheel.",
    minAge: 18,
    maxAge: 90,
    weight: 1.2,
    cooldown: 6,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'report',
        label: 'Report it relentlessly',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.5,
            then: [{ log: 'Report number eleven did the trick. A crew arrived, filled it, and left a smaller pothole beside it.', kind: 'good' }, { stat: 'happiness', delta: 3 }, { queue: 'nc_council_reply' }],
            else: [{ log: 'Eleven reports. Eleven automated replies thanking me for my feedback.', kind: 'bad' }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'diy',
        label: 'Fill it yourself at night',
        effects: [
          { karma: 2 },
          {
            random: [
              { weight: 6, effects: [{ log: 'Two bags of cold-mix later, the hole was gone. Neighbours left thank-you notes on my door.', kind: 'good' }, { stat: 'happiness', delta: 5 }, { fame: 1 }, { money: -40 }] },
              { weight: 3, effects: [{ log: "A patrol car found me mid-shovel. 'Unauthorised highway works', apparently. I was let off with a fine.", kind: 'bad' }, { money: -250 }, { stat: 'happiness', delta: -3 }] },
              { weight: 1, effects: [{ log: "I was arrested, briefly, for doing the council's job. The charge was dropped. The record was not.", kind: 'bad' }, { arrest: true }, { money: -250 }, { stat: 'happiness', delta: -5 }] },
            ],
          },
        ],
      },
      {
        id: 'flower',
        label: 'Plant a flower in it',
        effects: [
          {
            chance: 0.4,
            then: [{ log: 'A photo of my pothole daffodil went round the whole of {{city}}. The council filled it within a week, out of shame.', kind: 'good' }, { fame: 3 }, { stat: 'happiness', delta: 5 }],
            else: [{ log: 'The daffodil lasted two days before a van flattened it. The pothole remains.' }, { stat: 'happiness', delta: -1 }],
          },
        ],
      },
      {
        id: 'accept',
        label: 'Accept the pothole',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I have made peace with the pothole. I walk around it. We nod.' }],
      },
    ],
  },
  {
    id: 'nc_council_reply',
    category: 'random',
    title: 'Letter from the council',
    text: 'A letter arrived from {{city}} council: a formal apology for the delay in repairing my pothole, and a form inviting me to claim for any damage it caused.',
    minAge: 18,
    maxAge: 95,
    weight: 1,
    followUpOnly: true,
    choices: [
      {
        id: 'claim',
        label: 'Claim for damages',
        effects: [
          {
            chance: 0.5,
            then: [{ money: 300 }, { log: 'They paid out {{$300}} for a tyre I may or may not have ruined.', kind: 'money' }],
            else: [{ log: 'Claim rejected. Insufficient evidence of tyre.', kind: 'bad' }, { stat: 'happiness', delta: -1 }],
          },
        ],
      },
      {
        id: 'honest',
        label: 'Say no damage done',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I wrote back saying no damage, thanks for fixing it. Someone at the council probably framed it.', kind: 'good' }],
      },
      {
        id: 'frame',
        label: 'Frame the apology',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'The apology hangs in my hallway. Guests are confused. I am not.' }],
      },
    ],
  },
  {
    id: 'nc_street_cleanup',
    category: 'random',
    title: 'Litter pick',
    text: 'Hi-vis vests, long grabbers and bin bags: the annual {{city}} litter pick is on Saturday. Last year they found a shopping trolley, a wedding dress and a single roller skate.',
    minAge: 10,
    maxAge: 90,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'join',
        label: 'Join in',
        effects: [
          { karma: 2 },
          { stat: 'health', delta: 1 },
          { stat: 'happiness', delta: 2 },
          {
            random: [
              { weight: 5, effects: [{ log: 'Three bags of rubbish and a pleasant ache. The canal path looks like a canal path again.', kind: 'good' }] },
              { weight: 3, effects: [{ log: 'I found a {{$20}} note under a bush. Nobody claimed it. The litter pick pays.', kind: 'money' }, { money: 20 }] },
              { weight: 2, effects: [{ log: 'I found the other roller skate. The organiser wept.', kind: 'good' }, { stat: 'happiness', delta: 3 }] },
            ],
          },
        ],
      },
      {
        id: 'organise',
        label: 'Organise your own stretch',
        effects: [
          { karma: 4 },
          { energy: -1 },
          {
            chance: 0.6,
            then: [{ log: 'Nine neighbours turned up with gloves and strong opinions about dog owners. We cleared the whole street.', kind: 'good' }, { stat: 'happiness', delta: 5 }, { chance: 0.5, then: [{ newPerson: { kind: 'friend', relationship: 55, log: 'A neighbour called {{person}} stuck around to chat afterwards. New friend.' } }] }],
            else: [{ log: 'I organised, printed flyers and stood alone at the meeting point with forty bin bags.', kind: 'bad' }, { stat: 'happiness', delta: -4 }],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Not this year',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I waved at the hi-vis people from the bus. They waved their grabbers back.' }],
      },
    ],
  },
  {
    id: 'nc_found_wallet',
    category: 'random',
    title: 'A wallet',
    text: 'A wallet lay on the pavement outside the chemist: cards, a library ticket, a photo of two kids and, folded behind them, more cash than I expected.',
    minAge: 10,
    maxAge: 90,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'return',
        label: 'Track down the owner',
        effects: [
          { karma: 3 },
          {
            random: [
              { weight: 6, effects: [{ log: 'The library ticket led me to her. She gave me {{$40}} and a hug I did not ask for and did not mind.', kind: 'money' }, { money: 40 }, { stat: 'happiness', delta: 4 }] },
              { weight: 4, effects: [{ log: "I found the owner. He checked every card, counted the cash in front of me, and said 'right'. No thanks. Still worth it." }, { stat: 'happiness', delta: 1 }] },
            ],
          },
        ],
      },
      {
        id: 'police',
        label: 'Hand it to the police',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: 1 }, { log: "I dropped it at the police counter and signed a form. The desk officer called me 'a dying breed'.", kind: 'good' }],
      },
      {
        id: 'keep',
        label: 'Keep the cash',
        effects: [
          { money: 140 },
          { karma: -6 },
          { counter: 'crimes' },
          {
            chance: 0.15,
            then: [{ log: 'The chemist had a camera. The owner had a temper. I handed the money back in front of a queue.', kind: 'bad' }, { money: -140 }, { stat: 'happiness', delta: -6 }],
            else: [{ log: 'I pocketed {{$140}} and dropped the wallet in a postbox. The photo of the kids stayed with me longer than the money.' }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'nc_free_piano',
    category: 'random',
    title: 'Free piano',
    text: 'An upright piano appeared on the kerb three doors down with a sign: FREE TO GOOD HOME. It is enormous, slightly out of tune, and calling to me.',
    minAge: 14,
    maxAge: 80,
    weight: 0.8,
    cooldown: 6,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'haul',
        label: 'Haul it home',
        effects: [
          {
            random: [
              { weight: 5, effects: [{ log: 'Four neighbours, two planks, one near-death experience on the step. It lives in my hallway. I can play three notes.', kind: 'good' }, { stat: 'happiness', delta: 6 }, { stat: 'smarts', delta: 2 }, { stat: 'health', delta: -3 }] },
              { weight: 3, effects: [{ log: 'We dropped it. A piano makes a surprising noise when it dies. So did my foot.', kind: 'bad' }, { injury: 4 }, { stat: 'happiness', delta: -3 }] },
              { weight: 2, effects: [{ log: 'Halfway home the owner ran out: wrong piano. This one was his. The free one was the keyboard beside it.', kind: 'bad' }, { stat: 'happiness', delta: -2 }] },
            ],
          },
        ],
      },
      {
        id: 'sell',
        label: 'Sell it online',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ log: 'A music teacher paid {{$250}} and brought her own movers. The best deal I have ever done with something I did not own.', kind: 'money' }, { money: 250 }],
            else: [{ log: 'Nobody wanted it. Not even for free. Not even with the sign.' }, { stat: 'happiness', delta: -1 }],
          },
        ],
      },
      {
        id: 'leave',
        label: 'Let it be',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'It sat there a week, then disappeared. I like to think it found a good home.' }],
      },
    ],
  },
  {
    id: 'nc_doorstep_scam',
    category: 'random',
    title: 'Man about the roof',
    text: "A man in a clean van knocked to say he had noticed, from the road, that my roof tiles were 'about to go'. He could fix it today for cash, half up front.",
    minAge: 18,
    maxAge: 95,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'deposit',
        label: 'Pay the deposit',
        hint: 'Costs {{$400}}',
        conditions: [{ money: { gte: 400 } }],
        effects: [
          { money: -400 },
          {
            random: [
              { weight: 6, effects: [{ log: 'He took the deposit, climbed a ladder, moved one tile, and never came back. The van had no plates.', kind: 'bad' }, { stat: 'happiness', delta: -6 }] },
              { weight: 4, effects: [{ log: 'Against all odds he did the work and did it well. I still do not know his name.', kind: 'good' }, { stat: 'happiness', delta: 2 }] },
            ],
          },
        ],
      },
      {
        id: 'refuse',
        label: 'Send him away',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 1 }, { log: 'I said no thanks. He looked up at my roof, shook his head sadly, and drove to the next house.' }],
      },
      {
        id: 'report',
        label: 'Report the van',
        effects: [
          { karma: 3 },
          {
            chance: 0.4,
            then: [{ log: 'Police had been after that van for weeks. Three pensioners got their money back. I got a thank-you call.', kind: 'good' }, { stat: 'happiness', delta: 5 }, { fame: 1 }],
            else: [{ log: 'I reported the plate. The plate belonged to a hairdresser in another county.' }, { stat: 'happiness', delta: 1 }],
          },
        ],
      },
      {
        id: 'quote',
        label: 'Get a real quote first',
        effects: [
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.3,
            then: [{ log: 'A proper roofer found two cracked tiles. It cost {{$250}} and came with a receipt.', kind: 'money' }, { money: -250 }],
            else: [{ log: 'The proper roofer laughed. There was nothing wrong with the roof.', kind: 'good' }, { stat: 'happiness', delta: 2 }],
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------- the community
  {
    id: 'nc_community_garden',
    category: 'random',
    title: 'Community garden',
    text: 'A patch of waste ground behind the bus depot has become a community garden. Plots are available. Someone has already grown a marrow the size of a small child.',
    minAge: 14,
    maxAge: 90,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'plot',
        label: 'Take a plot',
        hint: 'Costs {{$60}}',
        conditions: [{ money: { gte: 60 } }],
        effects: [
          { money: -60 },
          { stat: 'health', delta: 2 },
          {
            random: [
              { weight: 5, effects: [{ log: 'By late summer I had tomatoes, beans, and a mild sunburn. I gave half of it away.', kind: 'good' }, { stat: 'happiness', delta: 5 }, { karma: 1 }] },
              { weight: 3, effects: [{ log: 'Slugs. Slugs ate everything. I now have strong opinions about slugs.', kind: 'bad' }, { stat: 'happiness', delta: -2 }] },
              { weight: 2, effects: [{ log: 'Someone stole my entire pumpkin the night before the harvest. The marrow man denies everything.', kind: 'bad' }, { stat: 'happiness', delta: -3 }] },
            ],
          },
        ],
      },
      {
        id: 'volunteer',
        label: 'Volunteer on the shared beds',
        effects: [
          { karma: 2 },
          { stat: 'health', delta: 1 },
          { stat: 'happiness', delta: 2 },
          { log: 'I weeded on Saturdays and learned the names of plants and people. Both are useful.', kind: 'good' },
          { chance: 0.3, then: [{ newPerson: { kind: 'friend', relationship: 55, log: 'I made a friend, {{person}}, over a shared wheelbarrow.' } }] },
        ],
      },
      {
        id: 'no',
        label: 'Not a gardener',
        effects: [{ log: 'I admired the marrow from a distance and went home.' }],
      },
    ],
  },
  {
    id: 'nc_street_festival',
    category: 'random',
    title: 'Street festival',
    text: '{{city}} held its annual street festival: food stalls, a brass band that knew four songs, face painting for children and, inexplicably, a competitive vegetable weigh-in.',
    minAge: 10,
    maxAge: 90,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'eat',
        label: 'Eat your way down the street',
        hint: 'Costs {{$50}}',
        effects: [
          { money: -50 },
          { stat: 'happiness', delta: 5 },
          { log: 'I ate from every stall. I regret nothing except the last one.', kind: 'good' },
          { chance: 0.1, then: [{ illness: 'food_poisoning' }, { log: 'The last one was a mistake, it turned out.', kind: 'bad' }] },
        ],
      },
      {
        id: 'talent',
        label: 'Enter the talent contest',
        effects: [
          {
            random: [
              { weight: 3, effects: [{ log: 'I won. The prize was {{$150}} and a sash. I wore the sash home.', kind: 'milestone' }, { money: 150 }, { stat: 'happiness', delta: 6 }, { fame: 2 }] },
              { weight: 4, effects: [{ log: 'I came third, behind a dog and a ventriloquist. The crowd was kind.' }, { stat: 'happiness', delta: 2 }] },
              { weight: 3, effects: [{ log: 'The microphone cut out mid-act. Then it came back, mid-mistake.', kind: 'bad' }, { stat: 'happiness', delta: -3 }] },
            ],
          },
        ],
      },
      {
        id: 'stall',
        label: 'Volunteer on a stall',
        effects: [{ karma: 2 }, { money: 40 }, { stat: 'happiness', delta: 1 }, { log: 'Six hours selling lemonade for the youth club. They paid me {{$40}} and all the lemonade I could carry.', kind: 'money' }],
      },
      {
        id: 'avoid',
        label: 'Avoid the crowds',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I watched the brass band from my window. Four songs. All day.' }],
      },
    ],
  },
  {
    id: 'nc_yard_sale',
    category: 'random',
    title: 'Yard sale',
    text: 'I dragged a lifetime of clutter onto the front lawn and stuck prices on it. {{person}} came to help, which mostly meant {{they}} sat in a deckchair offering commentary.',
    minAge: 12,
    maxAge: 90,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['mother', 'father', 'sibling', 'friend', 'bestFriend', 'spouse'] },
    choices: [
      {
        id: 'cheap',
        label: 'Price everything to go',
        effects: [
          { stat: 'happiness', delta: 2 },
          {
            random: [
              { weight: 5, effects: [{ money: 120 }, { log: 'Everything went. A woman bought my broken lamp for {{$5}} and seemed delighted.', kind: 'money' }] },
              { weight: 5, effects: [{ money: 60 }, { log: 'Half of it went. The rest went back in the garage, where it will wait for next year.', kind: 'money' }] },
            ],
          },
        ],
      },
      {
        id: 'haggle',
        label: 'Haggle like a market trader',
        effects: [
          {
            random: [
              { weight: 4, effects: [{ money: 200 }, { log: 'I squeezed every penny. {{person}} said I was frightening. I made {{$200}}.', kind: 'money' }] },
              { weight: 4, effects: [{ money: 50 }, { log: 'People walked off rather than argue. {{person}} bought a mug out of pity.' }, { stat: 'happiness', delta: -1 }] },
              { weight: 2, effects: [{ money: 10 }, { log: 'A man haggled me down to {{$10}} for a bicycle. I am not sure what happened.', kind: 'bad' }, { stat: 'happiness', delta: -3 }] },
            ],
          },
        ],
      },
      {
        id: 'charity',
        label: 'Give it all to charity',
        effects: [{ karma: 4 }, { stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 2 }, { log: 'At noon I gave the lot to the charity van. {{person}} approved. The lawn looked huge.', kind: 'good' }],
      },
      {
        id: 'theirs',
        label: "Sell {{person}}'s things too",
        effects: [{ money: 90 }, { karma: -4 }, { relationship: 'person', delta: -10 }, { log: '{{person}} noticed {{their}} jacket on a stranger halfway down the street. It did not go well.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'nc_town_hall',
    category: 'random',
    title: 'Town hall meeting',
    text: '{{person}} dragged me to a town hall meeting about a proposed multi-storey car park on the site of the old market. Forty folding chairs, one microphone, and a lot of feeling.',
    minAge: 16,
    maxAge: 90,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['mother', 'father', 'spouse', 'friend', 'bestFriend', 'sibling'] },
    choices: [
      {
        id: 'against',
        label: 'Speak against the car park',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            random: [
              { weight: 5, effects: [{ log: 'My speech got applause. The plan was sent back for review. {{person}} looked almost proud.', kind: 'good' }, { stat: 'happiness', delta: 5 }, { karma: 1 }, { relationship: 'person', delta: 4 }, { fame: 1 }] },
              { weight: 3, effects: [{ log: 'I rambled. A man in a fleece corrected my facts. The car park was approved anyway.', kind: 'bad' }, { stat: 'happiness', delta: -3 }] },
              { weight: 2, effects: [{ log: "A councillor took my name. Then she took my number. I am now on a residents' committee." }, { stat: 'happiness', delta: 2 }, { energy: -1 }] },
            ],
          },
        ],
      },
      {
        id: 'for',
        label: 'Speak for the car park',
        effects: [
          {
            random: [
              { weight: 5, effects: [{ log: 'I pointed out that nobody can park anywhere. Half the room hissed. The other half nodded quietly.' }, { stat: 'happiness', delta: 1 }, { relationship: 'person', delta: -3 }] },
              { weight: 5, effects: [{ log: 'The car park passed. {{person}} did not speak to me on the walk home.', kind: 'bad' }, { relationship: 'person', delta: -6 }, { stat: 'happiness', delta: 2 }] },
            ],
          },
        ],
      },
      {
        id: 'heckle',
        label: 'Heckle from the back',
        effects: [
          { karma: -3 },
          {
            chance: 0.5,
            then: [{ log: 'I got a laugh, then a warning, then escorted out. {{person}} stayed and pretended not to know me.', kind: 'bad' }, { stat: 'happiness', delta: 2 }, { relationship: 'person', delta: -5 }],
            else: [{ log: 'My heckle landed. The room laughed with me. For once.', kind: 'good' }, { stat: 'happiness', delta: 4 }],
          },
        ],
      },
      {
        id: 'doze',
        label: 'Doze off',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: -2 }, { log: 'I slept through two hours of parking policy and woke up during the vote. I voted for something.' }],
      },
    ],
  },
  {
    id: 'nc_neighbourhood_watch',
    category: 'random',
    title: 'Neighbourhood watch',
    text: 'A retired man with a lanyard asked me to join the neighbourhood watch after a string of shed break-ins. There is a rota, a group chat and, he hinted, a torch.',
    minAge: 18,
    maxAge: 85,
    weight: 1,
    cooldown: 6,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'join',
        label: 'Join the rota',
        effects: [
          { karma: 2 },
          { energy: -1 },
          {
            random: [
              { weight: 4, effects: [{ log: 'Three months of dusk patrols. Then one evening I spotted a man climbing into a shed and called it in. He was arrested. I got a certificate.', kind: 'good' }, { stat: 'happiness', delta: 5 }, { fame: 2 }, { stat: 'smarts', delta: 1 }] },
              { weight: 4, effects: [{ log: 'Months of walking the street at dusk. Nothing happened, which is sort of the point.' }, { stat: 'happiness', delta: 1 }] },
              { weight: 2, effects: [{ log: 'I reported a suspicious figure who turned out to be the lanyard man, patrolling. He has not forgiven me.', kind: 'bad' }, { stat: 'happiness', delta: -3 }] },
            ],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Decline',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I said no. The lanyard man wrote something in a notebook. My evenings remain my own.' }],
      },
      {
        id: 'snoop',
        label: 'Join and snoop',
        effects: [
          { karma: -3 },
          {
            chance: 0.4,
            then: [{ log: 'I learned a great deal about my neighbours. Then they learned that I had been learning it.', kind: 'bad' }, { stat: 'happiness', delta: -4 }, { newPerson: { kind: 'enemy', relationship: 15, log: 'The neighbour at number fourteen, {{person}}, has decided I am the enemy.' } }],
            else: [{ log: "Knowing everyone's business turned out to be mostly knowing about bins." }, { stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: 1 }],
          },
        ],
      },
      {
        id: 'confront',
        label: 'Confront the thief yourself',
        effects: [
          {
            random: [
              { weight: 4, effects: [{ log: 'I caught him in the act and sat on him until the police came. The street threw me a barbecue.', kind: 'milestone' }, { stat: 'happiness', delta: 6 }, { fame: 2 }, { karma: 2 }, { injury: 2 }] },
              { weight: 5, effects: [{ log: 'I tackled a man in a hoodie. He was a plumber, collecting his own tools. He was gracious. I was not.', kind: 'bad' }, { stat: 'happiness', delta: -5 }, { karma: -3 }] },
              { weight: 1, effects: [{ log: 'The man in the hoodie was a plumber, and he was not gracious. Assault. One year.', kind: 'bad' }, { prison: 1 }, { stat: 'happiness', delta: -10 }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'nc_new_cafe',
    category: 'random',
    title: 'The new café',
    text: 'A café opened where the old shoe repair shop used to be. Mismatched chairs, a dog asleep by the door, and coffee that costs slightly more than it should.',
    minAge: 16,
    maxAge: 90,
    weight: 1,
    once: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'regular',
        label: 'Become a regular',
        hint: 'Costs {{$200}} a year',
        conditions: [{ money: { gte: 200 } }],
        effects: [
          { money: -200 },
          { stat: 'happiness', delta: 5 },
          { flag: 'nc_cafe_regular', set: true },
          { log: 'They know my order now. The dog knows my shoes. This is my place.', kind: 'good' },
          { chance: 0.4, then: [{ newPerson: { kind: 'friend', relationship: 60, log: 'The person at the next table, {{person}}, became a friend over the crossword.' } }] },
        ],
      },
      {
        id: 'once',
        label: 'Try it once',
        effects: [{ money: -6 }, { stat: 'happiness', delta: 1 }, { log: 'Good coffee. Overpriced. Nice dog. I went back twice a year, like a tourist.' }],
      },
      {
        id: 'resent',
        label: 'Resent it on principle',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -2 }, { log: 'I decided the café was the beginning of the end for the neighbourhood and told everyone who would listen. Then I ordered a flat white.' }],
      },
    ],
  },
  {
    id: 'nc_rumour',
    category: 'random',
    title: 'A rumour',
    text: '{{person}} pulled me aside: there is a rumour going round {{city}} about me. The details are vague, the tone is unkind, and apparently everybody has heard it but me.',
    minAge: 12,
    maxAge: 90,
    weight: 1.2,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend', 'sibling', 'coworker', 'classmate'] },
    choices: [
      {
        id: 'laugh',
        label: 'Laugh it off',
        effects: [
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.4,
            then: [{ log: 'By next month the rumour had moved on to someone else. {{person}} never did tell me what it was.', kind: 'good' }],
            else: [{ log: 'I laughed. Then I heard it from a third person, with new details. The laugh got harder.', kind: 'bad' }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'source',
        label: 'Track down the source',
        effects: [
          {
            random: [
              { weight: 5, effects: [{ log: 'It started with a neighbour who misheard something at a barbecue. We cleared it up over a very awkward cup of tea.', kind: 'good' }, { stat: 'happiness', delta: 3 }, { karma: 1 }] },
              { weight: 3, effects: [{ log: 'I found the source and said things I regret. We are enemies now, properly.', kind: 'bad' }, { karma: -3 }, { stat: 'happiness', delta: -2 }, { newPerson: { kind: 'enemy', relationship: 5, log: '{{person}} started the rumour, and is now my enemy.' } }] },
              { weight: 2, effects: [{ log: 'I never found it. Rumours do not have an address.' }, { stat: 'happiness', delta: -2 }] },
            ],
          },
        ],
      },
      {
        id: 'defend',
        label: 'Ask {{person}} to set it straight',
        effects: [
          { relationship: 'person', delta: 3 },
          {
            chance: 0.6,
            then: [{ log: '{{person}} went to bat for me. By the end of the week the story had changed to something flattering.', kind: 'good' }, { stat: 'happiness', delta: 4 }],
            else: [{ log: '{{person}} tried, but {{they}} are not a convincing person. The rumour grew a sequel.', kind: 'bad' }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'better',
        label: 'Start a better rumour',
        effects: [
          { karma: -2 },
          {
            random: [
              { weight: 5, effects: [{ log: 'I let slip that I once wrestled a swan. It spread faster than the first one. Nobody mentions the first one now.', kind: 'good' }, { stat: 'happiness', delta: 4 }, { fame: 1 }] },
              { weight: 5, effects: [{ log: 'Now there are two rumours about me and people have started combining them.', kind: 'bad' }, { stat: 'happiness', delta: -4 }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'nc_friend_moving_away',
    category: 'random',
    title: 'Moving away',
    text: "{{person}} told me {{they}} are moving away from {{city}}, far enough that 'popping round' stops being a thing. {{They}} said it brightly, the way people say things that are not bright.",
    minAge: 12,
    maxAge: 90,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend'], minRelationship: 30 },
    choices: [
      {
        id: 'sendoff',
        label: 'Throw a send-off',
        hint: 'Costs {{$120}}',
        conditions: [{ money: { gte: 120 } }],
        effects: [{ money: -120 }, { relationship: 'person', delta: 10 }, { stat: 'happiness', delta: 3 }, { log: 'Everyone came. {{person}} cried at the speeches, then at the cake, then at the taxi. Worth every penny.', kind: 'good' }],
      },
      {
        id: 'visit',
        label: 'Promise to visit',
        effects: [
          { relationship: 'person', delta: 2 },
          {
            chance: 0.5,
            then: [{ log: 'I visited twice that first year. Then once. We still message on birthdays.' }, { stat: 'happiness', delta: 1 }],
            else: [{ log: 'I meant to visit. Life kept happening. {{person}} understood, which was worse.', kind: 'bad' }, { stat: 'happiness', delta: -3 }, { relationship: 'person', delta: -8 }],
          },
        ],
      },
      {
        id: 'pack',
        label: 'Help pack the van',
        effects: [{ karma: 2 }, { stat: 'health', delta: -1 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 2 }, { log: 'I carried {{their}} boxes and did not complain once about the books. Friends do that.', kind: 'good' }],
      },
      {
        id: 'fade',
        label: 'Let it fade',
        effects: [{ stat: 'happiness', delta: -5 }, { log: '{{person}} moved. We drifted. One day I realised I did not have {{their}} new number.', kind: 'bad' }, { removePerson: true }],
      },
    ],
  },

  // ------------------------------------------------------- big moments
  {
    id: 'nc_local_hero',
    category: 'random',
    title: 'Runaway pram',
    text: 'Outside the shops a pram rolled away from a distracted parent, picking up speed toward the road. For a second nobody moved. Then it was clearly my second.',
    minAge: 12,
    maxAge: 80,
    weight: 0.6,
    cooldown: 6,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'sprint',
        label: 'Sprint and grab it',
        effects: [
          {
            random: [
              { weight: 7, effects: [{ log: 'I caught the handle a metre from the kerb. The parent sobbed. A stranger called me a hero, which I accepted.', kind: 'milestone' }, { stat: 'happiness', delta: 8 }, { karma: 4 }, { fame: 3 }] },
              { weight: 3, effects: [{ log: 'I caught it, but tripped and went down hard on the pavement. The baby was fine. My elbow was not.', kind: 'good' }, { injury: 5 }, { karma: 4 }, { stat: 'happiness', delta: 3 }] },
            ],
          },
        ],
      },
      {
        id: 'shout',
        label: 'Shout a warning',
        effects: [
          { karma: 1 },
          {
            chance: 0.6,
            then: [{ log: 'A man closer than me lunged and caught it. I like to think my shout helped.', kind: 'good' }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'My shout startled the parent into action, just in time. Nobody thanked me, which is fine.' }, { stat: 'happiness', delta: 1 }],
          },
        ],
      },
      {
        id: 'freeze',
        label: 'Freeze',
        effects: [{ stat: 'happiness', delta: -4 }, { log: 'I froze. Someone else did the saving. I thought about it for weeks.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'nc_stranger_collapses',
    category: 'random',
    title: 'Stranger collapses',
    text: 'A man ahead of me on the pavement stopped, put a hand on a wall, and went down. Shoppers stepped around him like he was a puddle.',
    minAge: 12,
    maxAge: 90,
    weight: 0.8,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'help',
        label: 'Rush over and help',
        effects: [
          { karma: 4 },
          {
            random: [
              { weight: 6, effects: [{ log: 'I kept him talking, kept his head up, and flagged down help. The paramedics said I probably saved his life.', kind: 'milestone' }, { stat: 'happiness', delta: 8 }, { fame: 2 }, { queue: 'nc_collapse_thanks' }] },
              { weight: 3, effects: [{ log: 'I did everything I could. It was not enough. The paramedics were kind about it.', kind: 'bad' }, { stat: 'happiness', delta: -8 }] },
              { weight: 1, effects: [{ log: 'He had simply fainted. He woke up, apologised, and asked if I had seen his hat.' }, { stat: 'happiness', delta: 2 }] },
            ],
          },
        ],
      },
      {
        id: 'call',
        label: 'Call for help, keep distance',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: -1 }, { log: 'I called an ambulance and waited across the road until it came. Someone else held his hand.' }],
      },
      {
        id: 'walk',
        label: 'Walk around him',
        effects: [{ karma: -5 }, { stat: 'happiness', delta: -4 }, { log: 'I stepped around him like everyone else. I have no idea what happened to him. I think about it.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'nc_collapse_thanks',
    category: 'random',
    title: 'Doorstep visitors',
    text: 'The man who collapsed found my address. He stood on my doorstep with his wife, a bunch of flowers and an envelope, looking healthier and very embarrassed.',
    minAge: 12,
    maxAge: 95,
    weight: 1,
    followUpOnly: true,
    choices: [
      {
        id: 'envelope',
        label: 'Accept the envelope',
        effects: [{ money: 300 }, { stat: 'happiness', delta: 3 }, { log: 'The envelope held {{$300}} and a note I have kept.', kind: 'money' }],
      },
      {
        id: 'flowers',
        label: 'Flowers are plenty',
        effects: [{ karma: 3 }, { stat: 'happiness', delta: 4 }, { log: 'I kept the flowers and sent the envelope back. They hugged me. Twice.', kind: 'good' }],
      },
      {
        id: 'tea',
        label: 'Invite them in for tea',
        effects: [{ stat: 'happiness', delta: 5 }, { karma: 1 }, { log: 'Tea became dinner, and dinner became a standing invitation.', kind: 'good' }, { newPerson: { kind: 'friend', gender: 'male', minAge: 35, maxAge: 75, relationship: 65, log: 'The man I saved, {{person}}, is now a friend.' } }],
      },
    ],
  },
  {
    id: 'nc_jury_duty',
    category: 'random',
    title: 'Jury duty',
    text: "A brown envelope: I have been summoned for jury service at {{city}} district court. Two weeks of my life, {{$30}} a day, and the legal system's finest plastic chairs.",
    minAge: 18,
    maxAge: 75,
    weight: 0.8,
    cooldown: 10,
    conditions: [{ inPrison: false }, { criminalRecord: false }],
    choices: [
      {
        id: 'serve',
        label: 'Serve',
        effects: [{ money: 300 }, { stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: -2 }, { log: 'Two weeks of evidence, sandwiches and a juror who wanted to talk about his boat.' }, { queue: 'nc_jury_verdict' }],
      },
      {
        id: 'excuse',
        label: 'Ask to be excused',
        effects: [
          {
            chance: 0.5,
            then: [{ log: 'I claimed essential commitments. The court agreed, suspiciously quickly.' }, { stat: 'happiness', delta: 1 }],
            else: [{ log: 'Excuse rejected. I served anyway, with a worse attitude.', kind: 'bad' }, { money: 300 }, { stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: -4 }, { queue: 'nc_jury_verdict' }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore the summons',
        effects: [
          { karma: -2 },
          {
            chance: 0.6,
            then: [{ log: 'A second letter arrived, in capitals, with a fine of {{$500}}.', kind: 'bad' }, { money: -500 }, { stat: 'happiness', delta: -3 }],
            else: [{ log: 'Nothing happened. Somewhere, a file about me gathers dust.' }, { stat: 'happiness', delta: 1 }],
          },
        ],
      },
    ],
  },
  {
    id: 'nc_jury_verdict',
    category: 'random',
    title: 'The deliberation',
    text: 'Deliberations. A burglary case, a nervous defendant, a witness who kept changing her story. Eleven jurors want to go home. I am less sure than they are.',
    minAge: 18,
    maxAge: 95,
    weight: 1,
    followUpOnly: true,
    choices: [
      {
        id: 'majority',
        label: 'Vote with the majority',
        effects: [
          {
            random: [
              { weight: 6, effects: [{ log: 'We convicted in an hour. Later the paper reported he had done it twice before. Fine.' }, { stat: 'happiness', delta: 1 }] },
              { weight: 4, effects: [{ log: 'We convicted. Months later it was overturned. I had been the one doubt in the room, and I had folded.', kind: 'bad' }, { stat: 'happiness', delta: -5 }, { karma: -2 }] },
            ],
          },
        ],
      },
      {
        id: 'holdout',
        label: 'Hold out for a proper discussion',
        effects: [
          { stat: 'smarts', delta: 2 },
          { karma: 3 },
          {
            random: [
              { weight: 5, effects: [{ log: 'Two more days. Eleven glares. We acquitted, carefully, and I believe we got it right.', kind: 'good' }, { stat: 'happiness', delta: 4 }] },
              { weight: 5, effects: [{ log: 'Two more days. The evidence held up under proper scrutiny and we convicted, together. The boat man thanked me.', kind: 'good' }, { stat: 'happiness', delta: 3 }] },
            ],
          },
        ],
      },
      {
        id: 'guess',
        label: 'Just pick one',
        effects: [{ karma: -3 }, { stat: 'happiness', delta: -1 }, { log: 'I guessed. The system did not notice. I did.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'nc_storm_warning',
    category: 'random',
    title: 'Storm warning',
    text: 'The forecast turned red: the biggest storm in a decade heading straight for {{city}}. The shops sold out of bread and batteries, in that order.',
    minAge: 12,
    maxAge: 95,
    weight: 0.8,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'prepare',
        label: 'Board up and stock up',
        hint: 'Costs {{$100}}',
        effects: [
          { money: -100 },
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.7,
            then: [{ log: 'The storm howled all night. The boards held. I made soup and felt like a sea captain.', kind: 'good' }, { stat: 'happiness', delta: 3 }],
            else: [{ log: 'The storm skipped us entirely. I own a lot of plywood now.' }, { stat: 'happiness', delta: -1 }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore the fuss',
        effects: [
          {
            random: [
              { weight: 5, effects: [{ log: 'It was a lot of wind. I slept through it.' }, { stat: 'happiness', delta: 1 }] },
              { weight: 3, effects: [{ log: "A branch came through the window at 3am. Glass everywhere. Insurance was unimpressed by 'I ignored the warnings'.", kind: 'bad' }, { money: -400 }, { asset: 'damage', kind: 'house', amount: 20 }, { stat: 'happiness', delta: -5 }] },
              { weight: 2, effects: [{ log: 'The roof lost a dozen tiles and the fence lost everything.', kind: 'bad' }, { asset: 'damage', kind: 'house', amount: 30 }, { money: -600 }, { stat: 'happiness', delta: -4 }] },
            ],
          },
        ],
      },
      {
        id: 'party',
        label: 'Host a storm party',
        effects: [
          { stat: 'happiness', delta: 5 },
          { money: -60 },
          {
            chance: 0.4,
            then: [{ log: 'Mid-party the power went. We finished the evening by candlelight, singing. The fridge did not survive.' }, { money: -80 }],
            else: [{ log: 'Six friends, one storm, a lot of noise on both sides of the glass. Perfect.', kind: 'good' }],
          },
          { chance: 0.3, then: [{ newPerson: { kind: 'friend', relationship: 50, log: 'Someone brought {{person}}, who is now my friend too.' } }] },
        ],
      },
      {
        id: 'cafe',
        label: 'Shelter at my café',
        conditions: [{ flag: 'nc_cafe_regular', exists: true }],
        effects: [{ stat: 'happiness', delta: 4 }, { money: -15 }, { log: 'The café stayed open through the storm for regulars. Candles, cake, the dog under the table. My place.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'nc_wildfire_evacuation',
    category: 'random',
    title: 'Evacuation order',
    text: 'Sirens, then a text alert: wildfire approaching {{city}}, leave now. The sky over the hills had gone the colour of a bruise and the air tasted of smoke.',
    minAge: 16,
    maxAge: 95,
    weight: 0.3,
    cooldown: 10,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'leave',
        label: 'Leave immediately',
        effects: [
          { stat: 'happiness', delta: -6 },
          { stat: 'health', delta: -2 },
          { log: 'I grabbed documents, photos and the wrong shoes and joined the queue of cars. Three days in a sports hall.' },
          {
            chance: 0.4,
            then: [{ log: 'When we were let back, the fire had reached the garden. Repairs will take months.', kind: 'bad' }, { asset: 'damage', kind: 'house', amount: 30 }, { money: -800 }],
            else: [{ log: 'The wind changed. Our street was spared. I cried in the car park.', kind: 'good' }, { stat: 'happiness', delta: 4 }],
          },
        ],
      },
      {
        id: 'stay',
        label: 'Stay and defend home',
        effects: [
          {
            chance: 0.1,
            then: [{ log: 'I stayed with a garden hose. The fire did not care.', kind: 'bad' }, { death: 'died in a wildfire' }],
            else: [
              {
                random: [
                  { weight: 5, effects: [{ log: 'I wet the roof all night and the flames stopped at the fence. I have never been so tired or so lucky.', kind: 'milestone' }, { stat: 'happiness', delta: 5 }, { stat: 'health', delta: -8 }, { asset: 'damage', kind: 'house', amount: 10 }] },
                  { weight: 5, effects: [{ log: 'The firefighters carried me out, more or less. The house survived, barely.', kind: 'bad' }, { stat: 'health', delta: -5 }, { stat: 'happiness', delta: -4 }, { asset: 'damage', kind: 'house', amount: 25 }] },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'neighbours',
        label: 'Help neighbours evacuate first',
        effects: [
          { karma: 5 },
          { stat: 'health', delta: -4 },
          { stat: 'happiness', delta: -2 },
          {
            chance: 0.2,
            then: [{ injury: 4 }, { log: 'I got the old couple at number nine out with minutes to spare and a burn on my arm.', kind: 'good' }],
            else: [{ log: 'I drove the old couple at number nine out with minutes to spare. Their cat rode on my lap.', kind: 'good' }],
          },
          { chance: 0.5, then: [{ log: 'Our own place took the worst of it. I would do it again.', kind: 'bad' }, { asset: 'damage', kind: 'house', amount: 35 }, { money: -800 }] },
        ],
      },
    ],
  },
];

import { ASSETS } from '@/data/assets';
import type { Condition, EventDef } from '@/engine/events/schema';

/**
 * Ages 30-59: mortgages, neighbors, homeowners' associations, midlife
 * purchases, reunions, aging parents, the school run, jury duty, a surprise
 * inheritance, godparenting, hobbies that become obsessions, a renovation
 * gone wrong, a local election, a house fire, a long-lost sibling and burnout.
 * Cards about a house, a yard or a homeowners' association need a home of my own.
 * Follow-ups (followUpOnly) are queued by the events that set them up and
 * never fire on their own.
 */
/** Houses with a front door and a yard of their own (not a studio, condo or penthouse). */
const HOUSE_WITH_YARD = ['townhouse', 'suburban', 'farmhouse', 'beach_house', 'mansion'];
/**
 * Living in a house with a yard, not just owning one. I live in my primary house (the first one bought, or the next
 * once it is sold, never rented out) and may rent out another, but conditions only see what I own: so every house I
 * own must have a yard, and then the one I live in does too.
 */
const LIVES_IN_HOUSE_WITH_YARD: Condition[] = [
  { ownsAssetId: HOUSE_WITH_YARD },
  { not: { ownsAssetId: ASSETS.filter((a) => a.kind === 'house' && !HOUSE_WITH_YARD.includes(a.id)).map((a) => a.id) } },
];
/**
 * Countries where a summons puts ordinary people on a twelve-person jury that can hang (the verdict card's 'eleven to
 * one'): not India, Mexico or Nigeria, which have no lay juries, nor the mixed lay-judge courts of Germany or Japan.
 */
const JURY_TRIAL_COUNTRIES = ['US', 'GB', 'CA', 'AU'];

export const ADULT_LIFE_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ home & money
  {
    id: 'ad_mortgage_cosign',
    category: 'random',
    title: 'Co-sign request',
    text: '{{person}} asked me to co-sign {{their}} mortgage. The bank wants a second name on the paperwork, and apparently mine is the most respectable one {{they}} could find.',
    minAge: 30,
    maxAge: 59,
    weight: 1,
    cooldown: 6,
    conditions: [{ inPrison: false }, { any: [{ hasJob: true }, { money: { gte: 20000 } }] }],
    // Asked of someone they trust: not a friend or sibling who has stopped speaking to me.
    person: { kind: ['sibling', 'friend', 'bestFriend', 'child'], minAge: 21, minRelationship: 40 },
    choices: [
      {
        id: 'cosign',
        label: 'Sign the papers',
        effects: [
          { relationship: 'person', delta: 10 },
          { karma: 2 },
          { log: 'I signed. {{person}} got the keys and cried in the bank parking lot.', kind: 'good' },
          {
            chance: 0.25,
            then: [{ money: -12000 }, { relationship: 'person', delta: -8 }, { log: 'Two years later {{they}} missed payments and the bank came to me. Kindness is expensive.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Politely decline',
        effects: [{ relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -2 }, { log: 'I said no. {{person}} said {{they}} understood, in the voice people use when they do not.' }],
      },
      {
        id: 'gift',
        label: 'Offer a small gift instead',
        hint: '{{$2000}}',
        effects: [{ money: -2000 }, { relationship: 'person', delta: 4 }, { karma: 1 }, { log: 'I gave {{them}} {{$2000}} toward the down payment instead. No signatures, no risk, slightly less love.', kind: 'money' }],
      },
    ],
  },
  {
    id: 'ad_hoa_door',
    category: 'random',
    title: 'The door letter',
    text: "The homeowners' association sent a formal notice: my front door is 'an unapproved shade of blue'. There is a hearing. There is a schedule of fines. There is a man with a clipboard.",
    minAge: 30,
    maxAge: 59,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: false }, ...LIVES_IN_HOUSE_WITH_YARD],
    choices: [
      {
        id: 'repaint',
        label: 'Repaint it beige',
        hint: '{{$150}}',
        effects: [{ money: -150 }, { stat: 'happiness', delta: -3 }, { log: 'I repainted it beige. The house and I both feel a little less alive.' }],
      },
      {
        id: 'fight',
        label: 'Fight it at the hearing',
        effects: [
          {
            chance: 0.45,
            then: [{ stat: 'happiness', delta: 8 }, { karma: 1 }, { log: 'I brought color charts and precedent. The committee folded. The door stays blue.', kind: 'good' }],
            else: [{ money: -600 }, { stat: 'happiness', delta: -4 }, { log: 'They fined me and made me repaint anyway. The man with the clipboard smiled.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'bluer',
        label: 'Paint it even bluer',
        effects: [
          { karma: -2 },
          { stat: 'happiness', delta: 5 },
          { money: -80 },
          {
            chance: 0.6,
            then: [{ money: -900 }, { log: 'The fines came monthly. Worth it, mostly.', kind: 'bad' }],
            else: [{ log: 'The association gave up. I am a legend in the cul-de-sac.', kind: 'good' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ad_neighbour_fence',
    category: 'random',
    title: 'Fence line',
    text: 'My neighbor built a new fence and, by my measurement, it eats eighteen inches of my yard. By their measurement, I need a new tape measure.',
    minAge: 30,
    maxAge: 59,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: false }, ...LIVES_IN_HOUSE_WITH_YARD],
    choices: [
      {
        id: 'survey',
        label: 'Hire a surveyor',
        hint: '{{$500}}',
        effects: [
          { money: -500 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'The survey proved me right. The fence moved, slowly and sulkily.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'The survey proved them right. I paid {{$500}} to be wrong.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'talk',
        label: 'Talk it out over coffee',
        effects: [
          {
            chance: 0.65,
            then: [{ stat: 'happiness', delta: 3 }, { karma: 2 }, { log: 'We split the difference and shared a pot of coffee. Civilization, in a small way.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The coffee was fine. The fence did not move.' }],
          },
        ],
      },
      {
        id: 'let',
        label: 'Let it go',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: -2 }, { log: 'I let the fence stand. Every time I mow, I think about those eighteen inches.' }],
      },
      {
        id: 'hedge',
        label: 'Plant a towering hedge',
        hint: '{{$300}}',
        effects: [
          { money: -300 },
          { karma: -3 },
          { stat: 'happiness', delta: 3 },
          { log: 'I planted a hedge that will block their sun by spring. Petty, but it photosynthesizes.' },
          { chance: 0.3, then: [{ stat: 'happiness', delta: -4 }, { log: 'They reported it to the city. The paperwork war has begun.', kind: 'bad' }] },
        ],
      },
    ],
  },
  {
    id: 'ad_neighbour_noise',
    category: 'random',
    title: 'Next-door drums',
    text: 'The teenager next door has discovered the drums. The enthusiasm is loud. The talent, so far, is not.',
    minAge: 30,
    maxAge: 59,
    weight: 1.5,
    cooldown: 4,
    // Not within a few years of neighbours_and_community's nc_noisy_neighbour, the other noise through the wall.
    conditions: [{ inPrison: false }, { not: { sinceEvent: 'nc_noisy_neighbour', lte: 3 } }],
    choices: [
      {
        id: 'ask',
        label: 'Ask them nicely',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'They were mortified and bought the kid a practice pad. Peace, with occasional cymbal.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'They nodded politely. The drums continued.' }],
          },
        ],
      },
      {
        id: 'headphones',
        label: 'Buy noise-canceling headphones',
        hint: '{{$250}}',
        effects: [{ money: -250 }, { stat: 'happiness', delta: 3 }, { log: 'The headphones work. I now hear nothing at all, including the doorbell.' }],
      },
      {
        id: 'report',
        label: 'File a noise complaint',
        effects: [
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'The city sent a letter and the drumming stopped. So did the neighborly waves.' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'Nothing happened, except that now they know it was me.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'teach',
        label: 'Offer to teach rhythm',
        effects: [
          { energy: -1 },
          { stat: 'smarts', delta: 1 },
          { karma: 2 },
          { stat: 'happiness', delta: 2 },
          { log: 'I showed the kid a basic beat. The noise is now at least in time.', kind: 'good' },
          { chance: 0.5, then: [{ newPerson: { kind: 'friend', relationship: 45, log: "The teenager's parent, {{person}}, became a friend out of sheer gratitude." } }] },
        ],
      },
    ],
  },
  {
    id: 'ad_new_neighbours',
    category: 'random',
    title: 'New neighbors',
    text: 'A moving truck has been parked outside the house next door all day. Boxes, a piano and a very nervous dog have gone in. People will follow.',
    minAge: 30,
    maxAge: 59,
    weight: 1.5,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'welcome',
        label: 'Bring over a casserole',
        hint: '{{$30}}',
        effects: [
          { money: -30 },
          { karma: 2 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'They loved the casserole and asked for the recipe. There is no recipe.', kind: 'good' }, { newPerson: { kind: 'friend', relationship: 55, log: '{{person}} from next door turned out to be excellent company.' } }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'They were vegan, allergic, or both. We waved awkwardly for years.' }],
          },
        ],
      },
      {
        id: 'wait',
        label: 'Wait and see',
        effects: [{ log: 'I waited. They waited. We now nod at each other over the trash cans.' }],
      },
      {
        id: 'window',
        label: 'Watch from the window',
        effects: [
          { stat: 'happiness', delta: 1 },
          { stat: 'smarts', delta: 1 },
          { log: 'I learned they own a piano, a kayak and a disconcerting number of lamps.' },
          { chance: 0.3, then: [{ stat: 'happiness', delta: -2 }, { log: 'They saw me. Nosy-neighbor status: achieved.', kind: 'bad' }] },
        ],
      },
    ],
  },
  {
    id: 'ad_neighbour_cat',
    category: 'random',
    title: 'The cat decides',
    text: "A neighbor's cat has started sleeping on my doormat, then my couch, then my bed. It has a collar and a different name at home. It has chosen me.",
    minAge: 30,
    maxAge: 59,
    weight: 1,
    once: true,
    conditions: [{ inPrison: false }, { noPerson: ['pet'] }],
    choices: [
      {
        id: 'keep',
        label: 'Let it stay',
        effects: [
          { stat: 'happiness', delta: 5 },
          { karma: -2 },
          { log: 'I stopped carrying it home. It has two houses now and one favorite.', kind: 'good' },
          { newPerson: { kind: 'pet', species: 'cat', relationship: 70, log: 'The cat, now known as {{person}}, lives here. Officially, it is still my neighbor\'s.' } },
        ],
      },
      {
        id: 'return',
        label: 'Return it every time',
        effects: [
          { energy: -1 },
          { karma: 3 },
          { stat: 'happiness', delta: -1 },
          { log: 'I carried it home eleven times. The neighbor and I are friends now, mostly out of exhaustion.' },
          { chance: 0.5, then: [{ newPerson: { kind: 'friend', relationship: 50, log: 'Cat diplomacy made {{person}} a friend.' } }] },
        ],
      },
      {
        id: 'shut',
        label: 'Keep the windows shut',
        effects: [{ stat: 'happiness', delta: -2 }, { log: 'I closed the windows. The cat sits outside, staring. I feel judged.' }],
      },
    ],
  },
  {
    id: 'ad_renovation_disaster',
    category: 'random',
    title: 'Kitchen, deconstructed',
    text: "I hired a contractor to redo the kitchen. He took a deposit, removed the sink, discovered 'a situation' behind the wall, and has not answered his phone in nine days.",
    minAge: 30,
    maxAge: 59,
    weight: 1,
    cooldown: 8,
    conditions: [{ inPrison: false }, { ownsAsset: 'house' }, { money: { gte: 4000 } }],
    choices: [
      {
        id: 'another',
        label: 'Hire someone else',
        hint: '{{$6000}}',
        effects: [
          { money: -6000 },
          { stat: 'happiness', delta: -3 },
          { asset: 'damage', kind: 'house', amount: 10 },
          { log: 'A second contractor finished it, sighing at every wall. I have a sink again.' },
          { chance: 0.4, then: [{ stat: 'happiness', delta: 6 }, { log: 'Honestly, the new kitchen is lovely.', kind: 'good' }] },
        ],
      },
      {
        id: 'diy',
        label: 'Finish it myself',
        hint: '{{$1500}}',
        effects: [
          { money: -1500 },
          { stat: 'smarts', delta: 3 },
          { energy: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 6 }, { log: 'Three weekends, a borrowed toolbox and a lot of swearing. It works, and I did it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -5 }, { injury: 4 }, { asset: 'damage', kind: 'house', amount: 20 }, { log: 'I flooded the downstairs and learned which breaker the whole house is on.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'chase',
        label: 'Track the contractor down',
        effects: [
          {
            chance: 0.45,
            then: [{ money: -1000 }, { stat: 'happiness', delta: 2 }, { log: 'I found him at another job. He came back, sheepish, and finished at a discount.' }],
            else: [{ money: -3000 }, { stat: 'happiness', delta: -6 }, { log: "He skipped town with my deposit and everybody else's. I washed dishes in the bathtub for a month.", kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ad_house_fire',
    category: 'random',
    title: 'Smoke alarm',
    text: 'I woke at 3 a.m. to the smoke alarm and a smell like burnt toast, except the kitchen was glowing orange. Fire moves faster than anyone tells you.',
    minAge: 30,
    maxAge: 59,
    weight: 0.3,
    once: true,
    conditions: [{ inPrison: false }, { ownsAsset: 'house' }],
    choices: [
      {
        id: 'out',
        label: 'Get everyone out',
        effects: [
          { karma: 2 },
          { asset: 'damage', kind: 'house', amount: 40 },
          {
            random: [
              { weight: 6, effects: [{ money: -8000 }, { stat: 'happiness', delta: -8 }, { log: 'We got out. The kitchen is gone and the house smells of smoke, but everyone is here.', kind: 'bad' }] },
              { weight: 3, effects: [{ money: -25000 }, { stat: 'happiness', delta: -12 }, { injury: 5 }, { log: "We got out, barely. Half the house is a shell. The insurer is 'reviewing'.", kind: 'bad' }] },
              { weight: 1, effects: [{ money: -2000 }, { stat: 'happiness', delta: -3 }, { log: 'The fire crew arrived fast. A ruined kitchen and a very long night, nothing worse.' }] },
            ],
          },
        ],
      },
      {
        id: 'fight',
        label: 'Fight it with the extinguisher',
        effects: [
          {
            chance: 0.5,
            then: [{ money: -1500 }, { stat: 'happiness', delta: -2 }, { asset: 'damage', kind: 'house', amount: 10 }, { log: 'I got it out. Blackened wall, ruined toaster, hero of the hour.', kind: 'good' }],
            else: [
              { injury: 12 },
              { money: -15000 },
              { asset: 'damage', kind: 'house', amount: 40 },
              { stat: 'happiness', delta: -10 },
              { log: 'It did not go out. I did, through the window, with no eyebrows.', kind: 'bad' },
              { chance: 0.08, then: [{ death: 'a house fire' }] },
            ],
          },
        ],
      },
      {
        id: 'grab',
        label: 'Grab the valuables first',
        effects: [
          { karma: -1 },
          {
            chance: 0.6,
            then: [{ money: -4000 }, { asset: 'damage', kind: 'house', amount: 30 }, { stat: 'happiness', delta: -6 }, { log: 'I saved the documents and the laptop. The kitchen did not make it.' }],
            else: [
              { injury: 15 },
              { money: -20000 },
              { asset: 'damage', kind: 'house', amount: 45 },
              { stat: 'happiness', delta: -12 },
              { log: 'I went back for a laptop and nearly did not come out. Never again.', kind: 'bad' },
              { chance: 0.12, then: [{ death: 'a house fire' }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ad_surprise_inheritance',
    category: 'random',
    title: 'A lawyer calls',
    text: 'An estate lawyer called about a relative I have never heard of, who died in a town I have never visited and left a will with my name in it.',
    minAge: 30,
    maxAge: 59,
    weight: 0.3,
    once: true,
    // Not within ten years of money_events' mn_distant_inheritance, the other will from a relative I barely knew.
    conditions: [{ not: { sinceEvent: 'mn_distant_inheritance', lte: 10 } }],
    choices: [
      {
        id: 'accept',
        label: 'Accept the inheritance',
        effects: [
          {
            random: [
              { weight: 5, effects: [{ money: 4000 }, { stat: 'happiness', delta: 5 }, { log: 'A modest sum and a box of photographs of strangers. I framed one anyway.', kind: 'money' }] },
              { weight: 3, effects: [{ money: 45000 }, { stat: 'happiness', delta: 12 }, { log: 'A cottage was sold, the proceeds split, and my share was life-adjusting.', kind: 'money' }] },
              { weight: 1, effects: [{ money: 300000 }, { stat: 'happiness', delta: 20 }, { log: 'I got everything: a house, savings, a nearly new car. I never met them. I will not forget them.', kind: 'milestone' }] },
            ],
          },
        ],
      },
      {
        id: 'contest',
        label: 'Hire my own lawyer for more',
        hint: '{{$3000}}',
        effects: [
          { money: -3000 },
          { karma: -3 },
          {
            chance: 0.3,
            then: [{ money: 60000 }, { log: 'The lawyer found a second account. Greed, rewarded, slightly.', kind: 'money' }],
            else: [{ money: 3000 }, { stat: 'happiness', delta: -4 }, { log: 'My lawyer found nothing extra and billed me for the search. After fees, my share came to zero.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'donate',
        label: 'Decline and donate',
        effects: [{ karma: 6 }, { stat: 'happiness', delta: 4 }, { log: 'I signed it over to a charity in their town. The estate lawyer said that had never happened before.', kind: 'good' }],
      },
    ],
  },

  // ------------------------------------------------------------ midlife
  {
    id: 'ad_midlife_crisis',
    category: 'random',
    title: 'Something must change',
    text: 'I looked in the mirror this morning and did not recognize the tired person squinting back. Something has to change, and it has to be dramatic and probably expensive.',
    minAge: 38,
    maxAge: 55,
    weight: 1.5,
    once: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'bike',
        label: 'Motorcycle lessons and leather',
        hint: '{{$4000}}',
        effects: [
          { money: -4000 },
          { stat: 'happiness', delta: 8 },
          { stat: 'looks', delta: 3 },
          {
            chance: 0.15,
            then: [{ injury: 10 }, { log: 'I dropped the bike at a stop sign. Pride and collarbone both bruised.', kind: 'bad' }],
            else: [{ log: 'I ride now. Slowly, in daylight, but I ride.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'marathon',
        label: 'Train for a marathon',
        hint: '{{$300}}',
        effects: [
          { money: -300 },
          { stat: 'health', delta: 8 },
          { stat: 'happiness', delta: 4 },
          { stat: 'looks', delta: 2 },
          { energy: -1 },
          { log: 'I ran a marathon. Four hours of pain, one medal, a week of taking the stairs sideways.', kind: 'good' },
          { chance: 0.25, then: [{ injury: 3 }, { log: 'Training also gave me shin splints that outlasted the medal.', kind: 'bad' }] },
        ],
      },
      {
        id: 'trip',
        label: 'Book a solo trip',
        hint: '{{$2500}}',
        effects: [{ money: -2500 }, { stat: 'happiness', delta: 7 }, { stat: 'smarts', delta: 2 }, { counter: 'vacations' }, { log: 'I went somewhere with no signal and came back with opinions about the sea.' }],
      },
      {
        id: 'sit',
        label: 'Sit with the feeling',
        effects: [{ stat: 'happiness', delta: -4 }, { stat: 'smarts', delta: 1 }, { karma: 1 }, { log: 'I sat with it. It sat with me. We are getting along, slowly.' }],
      },
    ],
  },
  {
    id: 'ad_cover_band',
    category: 'random',
    title: 'Garage band',
    text: 'Three people my age want to start a cover band and need a fourth. Rehearsals are Tuesdays in a garage. Nobody can sing. That has not stopped them.',
    minAge: 32,
    maxAge: 59,
    weight: 1,
    once: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'join',
        label: 'Join the band',
        hint: '{{$600}}',
        effects: [
          { money: -600 },
          { stat: 'happiness', delta: 6 },
          { energy: -1 },
          { log: 'Tuesdays in a garage, murdering the classics. I have never been happier at a wrong note.', kind: 'good' },
          { newPerson: { kind: 'friend', relationship: 50, log: '{{person}} on bass became a real friend between the wrong notes.' } },
          { chance: 0.3, then: [{ fame: 3 }, { money: 400 }, { log: 'We played a wedding and got paid. Nobody asked us back, but we got paid.', kind: 'good' }] },
        ],
      },
      {
        id: 'manage',
        label: 'Offer to manage them',
        effects: [
          { energy: -1 },
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.4,
            then: [{ money: 900 }, { log: 'I booked them three birthday parties and took ten percent. Entrepreneurship.', kind: 'money' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: "The first gig was canceled when the drummer's van broke down. Management is mostly phone calls." }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Keep my dignity',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I declined. On Tuesdays, I hear the garage from down the street and feel wistful.' }],
      },
    ],
  },
  {
    id: 'ad_hobby_obsession',
    category: 'random',
    title: 'A new hobby',
    text: 'I took up a hobby to relax. Six weeks later I own specialized gear, follow forum arguments, and have strong opinions about things I had never heard of two months ago.',
    minAge: 30,
    maxAge: 59,
    weight: 1.2,
    once: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'allin',
        label: 'Go all in',
        hint: '{{$2500}}',
        effects: [
          { money: -2500 },
          { stat: 'happiness', delta: 8 },
          { stat: 'smarts', delta: 3 },
          { energy: -1 },
          { log: 'I have a dedicated room now. It has a label maker in it.', kind: 'good' },
          { chance: 0.3, then: [{ relationship: 'spouse', delta: -5 }, { log: "The people I live with have started calling it 'the other relationship'." }] },
          { queue: 'ad_hobby_contest' },
        ],
      },
      {
        id: 'casual',
        label: 'Keep it casual',
        hint: '{{$300}}',
        effects: [{ money: -300 }, { stat: 'happiness', delta: 4 }, { log: 'I kept it to weekends. Just the one shelf of equipment.' }],
      },
      {
        id: 'sell',
        label: 'Turn it into a side gig',
        effects: [
          {
            chance: 0.4,
            then: [{ money: 1800 }, { stat: 'happiness', delta: 4 }, { log: 'I sold the results online. A stranger paid real money for something I made for fun.', kind: 'money' }],
            else: [{ money: -600 }, { stat: 'happiness', delta: -3 }, { log: 'The market for my particular craft is, it turns out, me.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ad_hobby_contest',
    category: 'random',
    title: 'The regional finals',
    text: 'The regional championship for my hobby is this weekend. Entry is open. The forum says the judges are harsh and the trophy is enormous.',
    minAge: 30,
    maxAge: 80,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'enter',
        label: 'Enter',
        hint: '{{$80}}',
        effects: [
          { money: -80 },
          {
            chance: 0.35,
            then: [{ stat: 'happiness', delta: 10 }, { fame: 2 }, { money: 500 }, { log: 'I placed. The trophy is as enormous as promised and lives on top of the fridge.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { stat: 'smarts', delta: 2 }, { log: 'I did not place. I learned exactly what the judges want and resent them for it.' }],
          },
        ],
      },
      {
        id: 'spectate',
        label: 'Just watch',
        effects: [{ energy: -1 }, { stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'I watched, took notes, and judged the judges silently.' }],
      },
      {
        id: 'skip',
        label: 'Skip it',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I stayed home and quietly outperformed everyone in my head.' }],
      },
    ],
  },
  {
    id: 'ad_reading_glasses',
    category: 'random',
    title: 'Blurry menus',
    text: 'Menus have become blurrier. So have labels, texts and, in bad light, faces. I have been holding my phone at arm\'s length and pretending that is a choice.',
    minAge: 40,
    maxAge: 59,
    weight: 1.2,
    once: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'glasses',
        label: 'Get an eye exam',
        hint: '{{$250}}',
        effects: [
          { money: -250 },
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.5,
            then: [{ stat: 'looks', delta: 2 }, { log: 'Reading glasses. I look distinguished and can read again.', kind: 'good' }],
            else: [{ stat: 'looks', delta: -1 }, { log: 'Reading glasses. I look like a retired librarian and can read again.' }],
          },
        ],
      },
      {
        id: 'contacts',
        label: 'Contacts and vanity',
        hint: '{{$500}}',
        effects: [{ money: -500 }, { stat: 'looks', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'Contacts. Nobody knows. My fingers hate mornings.' }],
      },
      {
        id: 'squint',
        label: 'Squint harder',
        effects: [{ stat: 'happiness', delta: -3 }, { stat: 'smarts', delta: -1 }, { log: 'I ordered the wrong dish twice and signed something I could not read. Fine.' }],
      },
    ],
  },
  {
    id: 'ad_fortieth',
    category: 'random',
    title: 'Turning forty',
    text: "I turned forty. People keep saying it is 'the new thirty', which is not how numbers work. There is a cake, a card about being over the hill, and a feeling.",
    minAge: 40,
    maxAge: 40,
    weight: 3,
    once: true,
    // Not both forties (holidays_and_traditions' hd_fortieth) in one year.
    conditions: [{ inPrison: false }, { eventNotFired: 'hd_fortieth' }],
    choices: [
      {
        id: 'party',
        label: 'Throw a big party',
        hint: '{{$1200}}',
        effects: [
          { money: -1200 },
          { stat: 'happiness', delta: 8 },
          { relationship: 'friend', delta: 4 },
          { relationship: 'spouse', delta: 3 },
          { log: 'Forty people for forty years. The playlist started in my teens and nobody complained.', kind: 'good' },
        ],
      },
      {
        id: 'dinner',
        label: 'Dinner with the people I love',
        hint: '{{$200}}',
        effects: [
          { money: -200 },
          { stat: 'happiness', delta: 5 },
          { relationship: 'spouse', delta: 4 },
          { relationship: 'child', delta: 3 },
          { relationship: 'friend', delta: 2 },
          { log: 'A small table, a good meal, no speeches. Exactly right.', kind: 'good' },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore it entirely',
        effects: [{ stat: 'happiness', delta: -1 }, { stat: 'health', delta: 2 }, { log: 'I ate leftovers, went to bed early and told nobody. Forty happened anyway.' }],
      },
      {
        id: 'list',
        label: 'Plan the next decade',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 3 }, { log: "I wrote a list. Item one was 'stop writing lists'. Progress." }],
      },
    ],
  },

  // ------------------------------------------------------------ people from the past
  {
    id: 'ad_school_reunion',
    category: 'random',
    title: 'Class reunion',
    text: 'An invitation arrived for my high school reunion. A hotel ballroom, a buffet, name tags, and everyone pretending they have not looked each other up online.',
    minAge: 35,
    maxAge: 59,
    weight: 1,
    cooldown: 10,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'go',
        label: 'Go and be honest',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I told the truth about my life. It landed better than the lies around me.', kind: 'good' }, { newPerson: { kind: 'friend', relationship: 55, log: 'I reconnected with {{person}}, who I had forgotten I liked.' } }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'Everyone peaked somewhere. We mostly compared mortgages.' }],
          },
        ],
      },
      {
        id: 'flame',
        label: 'Find the old flame',
        // Not while I mourn a partner (the grief window, GAME_DESIGN §10).
        conditions: [{ hasLover: false }, { flag: 'grieving', exists: false }],
        effects: [
          { energy: -1 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 8 }, { log: 'I found the old flame by the buffet. The years vanished in a sentence.', kind: 'good' }, { newPerson: { kind: 'lover', relationship: 60, log: 'The old spark with {{person}} was still there. We left the buffet early.' } }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'The old flame is married, happy, and has a boat. I ate three pigs in a blanket in silence.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'brag',
        label: 'Embellish my life story',
        effects: [
          { energy: -1 },
          { karma: -2 },
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.35,
            then: [{ stat: 'happiness', delta: -6 }, { log: 'Someone fact-checked me by dessert. The ballroom went quiet.', kind: 'bad' }],
            else: [{ log: 'I was briefly the most interesting person at table four.' }],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Skip it',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I stayed home. The reunion photos online looked exactly like I expected.' }],
      },
    ],
  },
  {
    id: 'ad_bully_apology',
    category: 'random',
    title: 'A message from school',
    text: 'Someone who made my school years miserable has messaged out of nowhere. They are in a program, they say, and step nine is making amends. They would like to talk.',
    minAge: 30,
    maxAge: 59,
    weight: 0.8,
    once: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'forgive',
        label: 'Accept the apology',
        effects: [
          { energy: -1 },
          { karma: 4 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'I accepted. It did not undo anything, but something in my chest unclenched.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'We talked for an hour. It opened more than it closed, and I slept badly for a week.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Leave it unread',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I left it unread. Their recovery is theirs; my peace is mine.' }],
      },
      {
        id: 'telloff',
        label: 'Say what I always wanted to',
        effects: [
          { karma: -2 },
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -3 }, { log: 'It felt good for an hour, then just sad.' }],
            else: [{ log: 'I said it all. They listened. Then we both logged off, lighter.', kind: 'good' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ad_long_lost_sibling',
    category: 'random',
    title: 'Stranger with my nose',
    text: 'A DNA test, a genealogy site and a very polite email: someone claims to be my half-sibling. They have my nose in their photo. They want to meet.',
    minAge: 30,
    maxAge: 59,
    weight: 0.5,
    once: true,
    // Mail-order DNA tests and genealogy sites.
    conditions: [{ inPrison: false }, { year: { gte: 2012 } }],
    choices: [
      {
        id: 'meet',
        label: 'Meet them',
        effects: [
          {
            random: [
              {
                weight: 7,
                effects: [
                  { stat: 'happiness', delta: 8 },
                  { log: 'We met in a cafe halfway between us and talked for five hours.', kind: 'good' },
                  { newPerson: { kind: 'sibling', relationship: 45, log: '{{person}} is, undeniably, family. We have the same laugh and the same bad knee.' } },
                  { queue: 'ad_lost_sibling_favor' },
                ],
              },
              {
                weight: 3,
                effects: [
                  { stat: 'happiness', delta: -4 },
                  { log: 'We met. It was awkward and I do not think either of us wants a sequel.' },
                  { newPerson: { kind: 'sibling', relationship: 20, log: '{{person}} is technically my sibling. We exchange cards.' } },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'test',
        label: 'Ask for a second test',
        hint: '{{$200}}',
        effects: [
          { money: -200 },
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.75,
            then: [
              { stat: 'happiness', delta: 6 },
              { log: 'The second test agreed with the first. I have a sibling.', kind: 'good' },
              { newPerson: { kind: 'sibling', relationship: 40, log: 'The test agreed. {{person}} and I are related, and both a little relieved I double-checked.' } },
              { queue: 'ad_lost_sibling_favor' },
            ],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The second test disagreed. Someone, somewhere, has my nose and is not related to me.' }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Leave it unanswered',
        effects: [{ stat: 'happiness', delta: -2 }, { karma: -1 }, { log: 'I did not reply. Some doors are easier left shut, and I think about this one anyway.' }],
      },
    ],
  },
  {
    id: 'ad_lost_sibling_favor',
    category: 'random',
    title: 'The favor',
    text: "A few weeks after we met, my newfound sibling asked to borrow {{$4000}} for 'a short-term thing'. It was said casually. It did not feel casual.",
    minAge: 30,
    maxAge: 80,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'lend',
        label: 'Lend it',
        hint: '{{$4000}}',
        effects: [
          { money: -4000 },
          {
            chance: 0.45,
            then: [{ money: 4000 }, { stat: 'happiness', delta: 5 }, { karma: 1 }, { log: 'They paid it back to the day, with a thank-you card. Family, confirmed.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -6 }, { log: 'The short-term thing became permanent. So, I think, did the distance.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'small',
        label: 'Offer a smaller amount',
        hint: '{{$800}}',
        effects: [{ money: -800 }, { karma: 1 }, { stat: 'happiness', delta: 1 }, { log: 'I gave {{$800}} as a gift, no strings. They took it graciously, I think.', kind: 'money' }],
      },
      {
        id: 'refuse',
        label: 'Say no',
        effects: [{ stat: 'happiness', delta: -3 }, { log: 'I said no. We still talk, but there is a pause before every reply now.' }],
      },
    ],
  },
  {
    id: 'ad_sibling_feud',
    category: 'random',
    title: 'Side by side',
    // A cool bond (the selector cannot see when we last talked, so the text names a feud, not a silence).
    text: '{{person}} and I have been feuding for so long that nobody remembers how it started, us included. A cousin is getting married and has seated us side by side. The cousin swears it was an accident.',
    minAge: 30,
    maxAge: 59,
    weight: 1,
    cooldown: 6,
    // Not within a few years of holidays_and_traditions' hd_estranged_sibling, the same silence at a family gathering.
    conditions: [{ inPrison: false }, { not: { sinceEvent: 'hd_estranged_sibling', lte: 3 } }],
    person: { kind: ['sibling'], maxRelationship: 40 },
    choices: [
      {
        id: 'talk',
        label: 'Clear the air',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 15 }, { stat: 'happiness', delta: 6 }, { karma: 3 }, { log: 'By the speeches we were laughing. A whole feud over nothing, like most of them.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -6 }, { stat: 'happiness', delta: -5 }, { log: 'We lasted until the appetizers. The old argument has not aged.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'polite',
        label: 'Be polite, nothing more',
        effects: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 1 }, { log: 'We discussed the weather and the fish course. Nobody shouted. Progress, technically.' }],
      },
      {
        id: 'swap',
        label: 'Swap seats',
        effects: [{ karma: -2 }, { relationship: 'person', delta: -6 }, { stat: 'happiness', delta: 2 }, { log: 'I swapped with a confused uncle and had a lovely evening. {{person}} noticed. Everyone noticed.' }],
      },
    ],
  },
  {
    // Not another sales pitch (money_events' mn_mlm_pitch is the starter-kit one): a friend signs me up for something.
    id: 'ad_friend_mlm',
    category: 'random',
    title: 'Twenty miles',
    text: "{{person}} signed us both up for a twenty-mile charity walk and told the organizers I am 'basically a hiker'. The walk is in three weeks. I own one pair of sneakers and zero hiking socks.",
    minAge: 30,
    maxAge: 59,
    weight: 1,
    once: true,
    // A friend signing me up for something: not within a few years of money_events' wellness-oil pitch or
    // friends_and_strangers' garage of powder (both guard against this one too).
    conditions: [{ inPrison: false }, { not: { sinceEvent: 'mn_mlm_pitch', lte: 3 } }, { not: { sinceEvent: 'fs_powder_pitch', lte: 2 } }],
    person: { kind: ['friend', 'bestFriend', 'sibling'], minRelationship: 30 },
    choices: [
      {
        id: 'train',
        label: 'Train for it properly',
        effects: [
          { energy: -1 },
          { stat: 'health', delta: 4 },
          { karma: 2 },
          { relationship: 'person', delta: 5 },
          {
            chance: 0.8,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'Three weeks of evening walks, then twenty miles with {{person}}. Money raised, blisters earned.', kind: 'good' }],
            else: [{ injury: 3 }, { log: 'I twisted an ankle in training and cheered {{person}} over the line from a folding chair.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'sponsor',
        label: 'Sponsor {{them}} instead',
        hint: '{{$100}}',
        effects: [{ money: -100 }, { karma: 2 }, { relationship: 'person', delta: -2 }, { log: 'I sponsored {{person}} and stayed home. {{They}} sent photos of the finish line and {{their}} feet.' }],
      },
      {
        id: 'untrained',
        label: 'Walk it with no training',
        effects: [
          { karma: 1 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 5 }, { log: 'I walked twenty miles on pride alone. {{person}} and I crossed the line together, limping.', kind: 'good' }],
            else: [{ injury: 4 }, { relationship: 'person', delta: 2 }, { stat: 'happiness', delta: -2 }, { log: "Mile twelve took my knees. I finished in the support van, eating the volunteers' oranges.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'excuse',
        label: 'Find a good excuse',
        effects: [{ karma: -1 }, { relationship: 'person', delta: -5 }, { stat: 'happiness', delta: 2 }, { log: 'I found a family commitment that weekend. {{person}} walked with a stranger and mentions it often.' }],
      },
    ],
  },
  {
    id: 'ad_godparent',
    category: 'random',
    title: 'Godparent request',
    text: '{{person}} just had a baby and asked me to be the godparent. There is a ceremony, a small speech, and an implied promise to show up for birthdays forever.',
    minAge: 30,
    maxAge: 59,
    weight: 1,
    cooldown: 6,
    conditions: [{ inPrison: false }],
    // Godparent is asked of someone close, never of a friend or sibling who stopped speaking to me.
    person: { kind: ['friend', 'bestFriend', 'sibling'], maxAge: 45, minRelationship: 40 },
    choices: [
      {
        id: 'yes',
        label: 'Say yes, gladly',
        hint: '{{$200}}',
        effects: [{ money: -200 }, { relationship: 'person', delta: 10 }, { karma: 3 }, { stat: 'happiness', delta: 4 }, { log: 'I said yes. I cried at the ceremony. The baby slept through it.', kind: 'good' }],
      },
      {
        id: 'overdo',
        label: 'Say yes and overdo it',
        hint: '{{$1500}}',
        effects: [
          { money: -1500 },
          { relationship: 'person', delta: 14 },
          { karma: 2 },
          { stat: 'happiness', delta: 5 },
          { log: 'I bought a savings bond, a tiny suit and a cake the size of a tire. {{person}} was overwhelmed.' },
        ],
      },
      {
        id: 'no',
        label: 'Decline gracefully',
        effects: [{ relationship: 'person', delta: -8 }, { stat: 'happiness', delta: -2 }, { log: 'I said I was honored but not the right person. {{person}} said that was fine, slowly.' }],
      },
    ],
  },

  // ------------------------------------------------------------ parents
  {
    id: 'ad_parent_care',
    category: 'random',
    title: 'A fall at home',
    text: '{{person}} had a fall at home and lay on the kitchen floor for an hour before a neighbor heard. {{They}} insists it was nothing. The doctor disagrees.',
    minAge: 30,
    maxAge: 59,
    weight: 1.2,
    cooldown: 8,
    // Not within a few years of love_and_family's lf_parent_health_scare, which also offers to move the parent in.
    conditions: [{ inPrison: false }, { not: { sinceEvent: 'lf_parent_health_scare', lte: 5 } }],
    person: { kind: ['mother', 'father'], minAge: 65 },
    choices: [
      {
        id: 'movein',
        label: 'Move {{them}} in with me',
        hint: '{{$2500}}',
        effects: [
          { money: -2500 },
          { relationship: 'person', delta: 15 },
          { karma: 4 },
          { stat: 'happiness', delta: -3 },
          { log: '{{person}} moved in with me. We argue about the thermostat, and I would not change a thing.' },
          { queue: 'ad_parent_care_worsens' },
        ],
      },
      {
        id: 'carer',
        label: 'Hire a home caregiver',
        hint: '{{$6000}}',
        effects: [
          { money: -6000 },
          { relationship: 'person', delta: 8 },
          { karma: 2 },
          { log: "A caregiver visits twice a day. {{person}} calls her 'the inspector' but likes her." },
          { queue: 'ad_parent_care_worsens' },
        ],
      },
      {
        id: 'sibling',
        label: 'Leave it to my sibling',
        conditions: [{ hasPerson: ['sibling'] }],
        effects: [
          { relationship: 'sibling', delta: -8 },
          { relationship: 'person', delta: -6 },
          { karma: -3 },
          { stat: 'happiness', delta: 2 },
          { log: 'My sibling took it on, and reminds me of that at every holiday.', kind: 'bad' },
        ],
      },
      {
        id: 'nothing',
        label: 'Hope it was nothing',
        effects: [
          { relationship: 'person', delta: -12 },
          { karma: -4 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: -8 }, { log: '{{person}} fell again. This time I got the call from the hospital.', kind: 'bad' }, { queue: 'ad_parent_care_worsens' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: '{{They}} managed, somehow, as {{they}} always has.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ad_parent_care_worsens',
    category: 'random',
    title: 'Not alone anymore',
    text: "{{person}}'s doctor was blunt: {{they}} needs more care than {{they}} is getting now. The options are expensive, exhausting, or both, and {{person}} wants a say in all of them.",
    minAge: 30,
    maxAge: 80,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'home',
        label: 'Take on the care myself',
        hint: '{{$4000}}',
        effects: [
          { money: -4000 },
          { stat: 'happiness', delta: -4 },
          { stat: 'health', delta: -2 },
          { relationship: 'person', delta: 15 },
          { karma: 5 },
          { log: "I became {{person}}'s caregiver. Some days are hard. Most days I am glad.", kind: 'milestone' },
        ],
      },
      {
        id: 'carehome',
        label: 'Find a good nursing home',
        hint: '{{$18000}}',
        effects: [
          { money: -18000 },
          { relationship: 'person', delta: 4 },
          { karma: 1 },
          { stat: 'happiness', delta: -2 },
          { log: 'The nursing home has a garden and Tuesday trivia. {{person}} dominates trivia.' },
        ],
      },
      {
        id: 'share',
        label: 'Split it with family',
        conditions: [{ hasPerson: ['sibling'] }],
        effects: [
          {
            chance: 0.5,
            then: [{ money: -7000 }, { relationship: 'sibling', delta: 5 }, { relationship: 'person', delta: 6 }, { log: 'My sibling and I split costs and visits. We are closer for it.', kind: 'good' }],
            else: [{ money: -11000 }, { relationship: 'sibling', delta: -10 }, { relationship: 'person', delta: 4 }, { log: "My sibling 'could not right now'. I paid, and I remember.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'state',
        label: 'Let the system handle it',
        effects: [
          { karma: -6 },
          { relationship: 'person', delta: -20 },
          { stat: 'happiness', delta: -5 },
          { log: 'Social services found {{them}} a place. {{person}} did not say anything. {{They}} did not have to.', kind: 'bad' },
        ],
      },
    ],
  },
  {
    id: 'ad_parent_tech_support',
    category: 'random',
    title: 'The thermostat is thinking',
    text: "{{person}} called for the fourth time this week. The new thermostat is 'thinking for itself', the remote has 'gone dead', and somehow I am the expert.",
    minAge: 30,
    maxAge: 59,
    weight: 1.5,
    cooldown: 5,
    conditions: [{ inPrison: false }, { not: { sinceEvent: 'tm_parent_tech_help', lte: 5 } }],
    person: { kind: ['mother', 'father'] },
    choices: [
      {
        id: 'drive',
        label: 'Go over and fix it',
        effects: [{ energy: -1 }, { relationship: 'person', delta: 6 }, { karma: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I unplugged it and plugged it back in. {{person}} called me a genius and fed me.', kind: 'good' }],
      },
      {
        id: 'phone',
        label: 'Talk {{them}} through it',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 3 }, { log: 'Forty minutes and one near-miss with the factory reset, but we got there.' }],
            else: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -3 }, { log: "After an hour {{they}} said 'never mind' in a tone that meant the opposite.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'tablet',
        label: 'Buy {{them}} something simpler',
        hint: '{{$300}}',
        effects: [{ money: -300 }, { relationship: 'person', delta: 5 }, { log: 'I bought a device with three buttons. {{They}} has already found a fourth problem.' }],
      },
    ],
  },

  // ------------------------------------------------------------ children
  {
    id: 'ad_school_run',
    category: 'random',
    title: 'The school run',
    text: 'Every morning is the same: {{person}} cannot find one shoe, the front door sticks, and the school gate closes at exactly the moment we arrive.',
    minAge: 30,
    maxAge: 59,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['child'], minAge: 5, maxAge: 16 },
    choices: [
      {
        id: 'carpool',
        label: 'Set up a carpool',
        effects: [
          { money: -100 },
          { stat: 'happiness', delta: 3 },
          { log: 'Three families, one schedule, fewer mornings in the car for everyone.' },
          { chance: 0.6, then: [{ newPerson: { kind: 'friend', relationship: 50, log: 'Another parent, {{person}}, and I now split mornings and gossip.' } }] },
        ],
      },
      {
        id: 'drive',
        label: 'Make it our time',
        effects: [{ relationship: 'person', delta: 6 }, { energy: -1 }, { stat: 'happiness', delta: 2 }, { log: 'We talk on the way. About shoes, mostly, but also about everything.', kind: 'good' }],
      },
      {
        id: 'bus',
        label: 'Put {{them}} on the bus',
        effects: [
          { relationship: 'person', delta: -3 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.15,
            then: [{ relationship: 'person', delta: -4 }, { log: '{{person}} got off at the wrong stop and spent an hour at a gas station. The school called.', kind: 'bad' }],
            else: [{ log: '{{person}} loves the bus. I love the quiet. Everyone wins slightly.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ad_parent_teacher_night',
    category: 'random',
    title: 'Tiny chairs',
    text: "Parent-teacher night for {{person}}. Tiny chairs, long lines, and a teacher who starts every sentence with 'so' in a way that makes me nervous.",
    minAge: 30,
    maxAge: 59,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['child'], minAge: 6, maxAge: 17 },
    choices: [
      {
        id: 'listen',
        label: 'Listen carefully',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            random: [
              { weight: 5, effects: [{ relationship: 'person', delta: 4 }, { log: "Apparently {{person}} is 'a joy'. I took the credit.", kind: 'good' }] },
              { weight: 3, effects: [{ stat: 'happiness', delta: -3 }, { relationship: 'person', delta: 2 }, { log: "There were 'concerns'. We talked about them in the car, gently." }] },
              { weight: 2, effects: [{ stat: 'happiness', delta: -5 }, { log: "{{person}} has not handed in homework in a month. The 'so' was warranted.", kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'defend',
        label: 'Defend {{person}} on everything',
        effects: [
          { relationship: 'person', delta: 6 },
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ log: '{{They}} appreciated the loyalty. The teacher appreciated nothing.' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I defended something that was, it turned out, indefensible.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Skip it',
        effects: [{ relationship: 'person', delta: -5 }, { stat: 'happiness', delta: 1 }, { log: 'I skipped it. {{person}} noticed.' }],
      },
    ],
  },

  // ------------------------------------------------------------ spouse
  {
    id: 'ad_anniversary_forgot',
    category: 'random',
    title: 'Forgotten anniversary',
    text: '{{person}} came down for breakfast wearing something nice and a hopeful expression. It is our anniversary. I have remembered this just now, and I have nothing.',
    minAge: 30,
    maxAge: 59,
    weight: 1,
    cooldown: 4,
    // Not within two years of young_adult's ya_forgot_anniversary, the same forgotten date (it guards against this one too).
    conditions: [{ inPrison: false }, { not: { sinceEvent: 'ya_forgot_anniversary', lte: 2 } }, { not: { sinceEvent: 'lf_anniversary_slip', lte: 2 } }],
    person: { kind: ['spouse'] },
    choices: [
      {
        id: 'confess',
        label: 'Confess and grovel',
        effects: [
          { love: -4 },
          { relationship: 'person', delta: -3 },
          { karma: 1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 2 }, { log: '{{They}} laughed, mostly. We ordered takeout and watched something old.' }],
            else: [{ love: -6 }, { log: 'The laugh was not a real laugh. The couch and I got reacquainted.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'scramble',
        label: 'Scramble a surprise',
        hint: '{{$400}}',
        effects: [
          { money: -400 },
          {
            chance: 0.65,
            then: [{ love: 8 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 4 }, { log: 'A booked table, flowers from the gas station, and {{they}} never knew. Or pretended not to.', kind: 'good' }],
            else: [{ love: -5 }, { stat: 'happiness', delta: -3 }, { log: '{{They}} saw the receipt timestamp. Busted at dessert.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'weekend',
        label: 'Claim I planned a weekend away',
        hint: '{{$1800}}',
        effects: [
          { money: -1800 },
          { love: 10 },
          { relationship: 'person', delta: 8 },
          { stat: 'happiness', delta: 5 },
          { karma: -1 },
          { log: 'A weekend away, booked by phone from the bathroom. It was, in the end, wonderful.', kind: 'good' },
        ],
      },
    ],
  },
  {
    id: 'ad_spouse_bakery',
    category: 'random',
    title: 'The bakery dream',
    text: '{{person}} announced over dinner that {{they}} wants to quit {{their}} job and open a bakery. {{They}} has a business plan, a name, and a look I have not seen in years.',
    minAge: 30,
    maxAge: 59,
    weight: 0.8,
    once: true,
    conditions: [{ inPrison: false }, { money: { gte: 8000 } }],
    person: { kind: ['spouse'] },
    choices: [
      {
        id: 'back',
        label: 'Back {{them}} completely',
        hint: '{{$10000}}',
        conditions: [{ money: { gte: 10000 } }],
        effects: [
          { money: -10000 },
          { love: 12 },
          { relationship: 'person', delta: 10 },
          {
            chance: 0.45,
            then: [{ money: 18000 }, { stat: 'happiness', delta: 10 }, { log: 'The bakery works. Lines out the door on Saturdays and flour in every part of our lives.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'The bakery closed within two years. {{They}} says it was worth it. I say nothing.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'small',
        label: 'Suggest starting small',
        hint: '{{$2500}}',
        effects: [
          { money: -2500 },
          { stat: 'smarts', delta: 2 },
          { love: 3 },
          {
            chance: 0.6,
            then: [{ money: 4000 }, { stat: 'happiness', delta: 4 }, { log: 'Market stalls first, then a tiny shop. Slow, sensible, and {{they}} is happy.', kind: 'good' }],
            else: [{ love: -3 }, { log: 'The stall limped. {{They}} suspects I never believed. {{They}} is a little right.' }],
          },
        ],
      },
      {
        id: 'no',
        label: 'Talk {{them}} out of it',
        effects: [
          { love: -10 },
          { relationship: 'person', delta: -8 },
          { stat: 'happiness', delta: -2 },
          { log: '{{They}} stayed in the job. {{They}} does not mention the bakery. I notice the silence.', kind: 'bad' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ civic life
  {
    id: 'ad_jury_duty',
    category: 'random',
    title: 'Jury summons',
    text: 'A jury summons arrived. Civic duty, a daily sandwich allowance, and a chance to sit in a wooden box judging strangers. Everyone who depends on me is unimpressed.',
    minAge: 30,
    maxAge: 59,
    weight: 1,
    cooldown: 6,
    // Not within a few years of neighbours_and_community's nc_jury_duty, the other summons.
    conditions: [{ inPrison: false }, { criminalRecord: false }, { country: JURY_TRIAL_COUNTRIES }, { not: { sinceEvent: 'nc_jury_duty', lte: 6 } }],
    choices: [
      {
        id: 'serve',
        label: 'Serve',
        effects: [
          { karma: 2 },
          { stat: 'smarts', delta: 2 },
          { money: -300 },
          { log: 'I served. The sandwiches were adequate; the responsibility was not.' },
          { queue: 'ad_jury_verdict' },
        ],
      },
      {
        id: 'excuse',
        label: 'Ask to be excused',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 2 }, { log: "They let me go. A doctor's note and a sad face work wonders." }],
            else: [{ karma: -1 }, { money: -300 }, { log: 'Denied. I served anyway, now with a reputation as a dodger.' }, { queue: 'ad_jury_verdict' }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore the summons',
        effects: [
          { karma: -3 },
          {
            chance: 0.5,
            then: [{ money: -700 }, { log: 'A fine arrived, bigger than the lost wages would have been.', kind: 'bad' }],
            else: [{ log: 'Nothing happened. I spent the week faintly nervous.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ad_jury_verdict',
    category: 'random',
    title: 'The deliberation room',
    text: 'The trial ran three weeks. In the deliberation room the vote is eleven to one, and every head has turned toward the one. The one is me.',
    minAge: 30,
    maxAge: 80,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }, { country: JURY_TRIAL_COUNTRIES }],
    choices: [
      {
        id: 'conscience',
        label: 'Vote my conscience',
        effects: [{ energy: -1 }, { karma: 4 }, { stat: 'happiness', delta: 3 }, { log: 'I held out, argued, and in the end we got it right. I think. I hope.', kind: 'good' }],
      },
      {
        id: 'along',
        label: 'Go along with the room',
        effects: [{ karma: -3 }, { stat: 'happiness', delta: -2 }, { log: 'I went along. We were home by six. I still think about it.' }],
      },
      {
        id: 'holdout',
        label: 'Hold out alone',
        effects: [
          {
            chance: 0.4,
            then: [{ karma: 4 }, { stat: 'happiness', delta: 6 }, { fame: 2 }, { log: 'By day three they came around. One juror sent me a card afterward.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -6 }, { stat: 'health', delta: -2 }, { log: 'Hung jury. Three weeks for nothing and a lifelong dislike of fluorescent lights.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ad_local_election',
    category: 'random',
    title: 'Run for city council',
    text: 'A seat opened on the city council and three separate people have suggested I run. One of them was joking. The other two were worryingly serious.',
    minAge: 30,
    maxAge: 59,
    weight: 0.8,
    once: true,
    conditions: [{ inPrison: false }, { criminalRecord: false }],
    choices: [
      {
        id: 'run',
        label: 'Run for the seat',
        hint: '{{$1500}}',
        effects: [
          { money: -1500 },
          { energy: -1 },
          { fame: 2 },
          { log: 'I ran. I knocked on four hundred doors and now know every dog in the district.' },
          { queue: 'ad_election_night' },
        ],
      },
      {
        id: 'volunteer',
        label: 'Volunteer for someone else',
        effects: [
          { energy: -1 },
          { karma: 2 },
          { stat: 'happiness', delta: 2 },
          { log: 'I handed out flyers for a candidate I mostly agreed with. My shoes did not survive it.' },
          { chance: 0.5, then: [{ newPerson: { kind: 'friend', relationship: 50, log: 'Handing out flyers with {{person}} in the rain made us friends.' } }] },
        ],
      },
      {
        id: 'no',
        label: 'Politics is not for me',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I declined. The seat went to a man who wants to ban skateboards.' }],
      },
    ],
  },
  {
    id: 'ad_election_night',
    category: 'random',
    title: 'Election night',
    text: 'Election night. The count is in the community hall under bad lighting. My opponent has brought supporters; I have brought a thermos and a nervous stomach.',
    minAge: 30,
    maxAge: 80,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'watch',
        label: 'Watch every ballot',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 12 }, { fame: 6 }, { karma: 2 }, { flag: 'ad_councillor', set: true }, { log: 'I won by a handful of votes. I am, apparently, a council member now.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: -8 }, { fame: 1 }, { log: 'I lost. Narrowly, graciously, and with a thermos.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'home',
        label: 'Wait at home',
        effects: [
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 8 }, { fame: 5 }, { flag: 'ad_councillor', set: true }, { log: 'The phone rang at midnight. I won, in my slippers.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I lost. I was asleep, which helped.' }],
          },
        ],
      },
      {
        id: 'party',
        label: 'Throw a party regardless',
        hint: '{{$600}}',
        effects: [
          { money: -600 },
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 8 }, { fame: 6 }, { flag: 'ad_councillor', set: true }, { log: 'Won, and the party became a victory party. Someone sang.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'Lost, and the party became a consolation party. Someone still sang.' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ work & commute
  {
    id: 'ad_burnout',
    category: 'random',
    title: 'The parking lot',
    text: 'I have been tired for a year. Not sleepy, tired. I sat in the parking lot at {{company}} this morning for twenty minutes, unable to go in.',
    minAge: 30,
    maxAge: 59,
    weight: 1.2,
    cooldown: 5,
    conditions: [{ hasJob: true }, { inPrison: false }, { not: { sinceEvent: 'wk_burnout', lte: 5 } }],
    choices: [
      {
        id: 'push',
        label: 'Push through',
        effects: [
          { jobPerformance: 5 },
          { stat: 'health', delta: -6 },
          { stat: 'happiness', delta: -6 },
          {
            chance: 0.2,
            then: [{ illness: 'depression' }, { log: 'Pushing through pushed me somewhere darker. I have started seeing a therapist about it.', kind: 'bad' }],
            else: [{ log: 'I pushed through. Nothing broke, exactly, but nothing healed.' }],
          },
        ],
      },
      {
        id: 'leave',
        label: 'Take unpaid leave',
        hint: '{{$2000}}',
        effects: [{ money: -2000 }, { jobPerformance: -4 }, { stat: 'health', delta: 5 }, { stat: 'happiness', delta: 7 }, { log: 'A month off. I slept, walked, and remembered that I am a person.', kind: 'good' }],
      },
      {
        id: 'talk',
        label: 'Talk to my manager',
        effects: [
          {
            chance: 0.5,
            then: [{ jobPerformance: 2 }, { stat: 'happiness', delta: 5 }, { log: 'My manager listened and moved two projects off my desk. I nearly hugged them.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { jobPerformance: -2 }, { log: 'My manager said we are all tired, in a tone that closed the subject.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'quit',
        label: 'Quit',
        effects: [{ loseJob: true, reason: 'left' }, { stat: 'happiness', delta: 8 }, { stat: 'health', delta: 3 }, { log: 'I walked out of {{company}} at lunch and did not go back. The silence was enormous.', kind: 'milestone' }],
      },
    ],
  },
  {
    id: 'ad_commute_bridge',
    category: 'random',
    title: 'Bridge closed',
    text: "They closed the bridge on my commute for 'eighteen months of essential repairs'. The detour adds forty minutes each way and passes a very tempting bakery.",
    minAge: 30,
    maxAge: 59,
    weight: 1,
    cooldown: 6,
    conditions: [{ hasJob: true }, { inPrison: false }],
    choices: [
      {
        id: 'cycle',
        label: 'Cycle the long way',
        effects: [
          { stat: 'health', delta: 5 },
          { stat: 'happiness', delta: 2 },
          { stat: 'looks', delta: 1 },
          { energy: -1 },
          {
            chance: 0.1,
            then: [{ injury: 5 }, { log: 'A pothole threw me. The bakery staff helped me up.', kind: 'bad' }],
            else: [{ log: 'I am fitter than I have been in a decade. The bakery and I have an understanding.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'drive',
        label: 'Take the long detour',
        effects: [{ stat: 'happiness', delta: -4 }, { money: -600 }, { stat: 'health', delta: -1 }, { log: 'Forty minutes each way, in traffic. I now know every song the radio station owns.' }],
      },
      {
        id: 'remote',
        label: 'Ask to work from home',
        conditions: [{ year: { gte: 2012 } }],
        effects: [
          {
            chance: 0.45,
            then: [{ stat: 'happiness', delta: 6 }, { jobPerformance: 2 }, { log: 'Approved. I now commute from bed to desk and wear pants only on video calls.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { jobPerformance: -1 }, { log: "Denied, with a speech about 'culture'." }],
          },
        ],
      },
      {
        id: 'bakery',
        label: 'Embrace the bakery',
        effects: [{ stat: 'happiness', delta: 5 }, { stat: 'health', delta: -3 }, { stat: 'looks', delta: -2 }, { money: -400 }, { log: 'The detour has pastries. I have accepted this. My pants have not.' }],
      },
    ],
  },
];

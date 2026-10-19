import { ASSETS } from '@/data/assets';
import type { Condition, EventDef } from '@/engine/events/schema';

/** The real cars (not the bicycle or scooter, which also count as kind 'car'). */
const REAL_CAR = ['old_hatchback', 'sedan', 'pickup', 'ev', 'luxury_sedan', 'sports_car', 'supercar', 'classic_car'];

/** Homes with rooms to spare and a table for the whole family (not a studio, condo or penthouse). */
const BIG_HOME = ['townhouse', 'suburban', 'farmhouse', 'beach_house', 'mansion'];
/**
 * Living in a big home, not just owning one. I live in my primary house (the first one bought, or the next once it
 * is sold, never rented out) and may rent out another, but conditions only see what I own: so every house I own
 * must be a big one, and then the one I live in is too.
 */
const LIVES_IN_BIG_HOME: Condition[] = [
  { ownsAssetId: BIG_HOME },
  { not: { ownsAssetId: ASSETS.filter((a) => a.kind === 'house' && !BIG_HOME.includes(a.id)).map((a) => a.id) } },
];

/**
 * Widowhood cards grieve the one marriage of the life: one wedding and no spouse now, so the late spouse they bind
 * is the person I married and nobody since (never a first husband after a second wedding, or a second widowhood).
 */
const WIDOWED: Condition[] = [{ married: false }, { count: 'marriages', eq: 1 }];
/**
 * The first months of widowhood (two cups set out, the closet untouched, the stew from the card): within the grief
 * window, the year of the loss and the next (GAME_DESIGN §10), never decades later. Weighted up, as a short window.
 */
const NEWLY_WIDOWED: Condition[] = [...WIDOWED, { flag: 'grieving' }];

/**
 * Ages 60-110, told by the older person: old friends retiring, dying and moving
 * into care, the first empty Monday of retirement, proof-of-life forms, scams
 * aimed at seniors, widowhood, assisted living, planning what to leave, video
 * calls and the family chat, hosting the holiday as the eldest, a retirees'
 * cruise, hearing aids, a new hip, glasses on my head, 90+ and 100th-birthday
 * moments, old records and grown children with kids of their own.
 * Grandchildren are people in the engine: a card about one binds them
 * (`person: { kind: ['grandchild'] }`, with an age that fits the scene), or binds a child
 * who has some (`kids: { gte: 1 }`), so no card talks about grandchildren who do not exist.
 */
export const GOLDEN_YEARS_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ old friends
  {
    id: 'gy_friend_retires',
    category: 'friends',
    title: 'Welcome to the club',
    text: '{{person}} is finally retiring, and since I have been retired the longest of anyone {{they}} knows, I have been asked to say a few words about what comes next. I have many words. Most are about naps.',
    minAge: 63,
    maxAge: 80,
    weight: 1.2,
    cooldown: 6,
    conditions: [{ retired: true }, { hasJob: false }],
    // A friend who asks me to speak is one still on good terms with me.
    person: { kind: ['friend', 'bestFriend'], minAge: 58, maxAge: 75, minRelationship: 30 },
    choices: [
      {
        id: 'honest',
        label: 'Tell the honest truth',
        effects: [
          { relationship: 'person', delta: 5 },
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I said year one is a long weekend and year two is a hunt for a purpose. {{person}} took notes.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { log: 'I mentioned the long afternoons. {{person}} looked worried through the rest of the cake.' }],
          },
        ],
      },
      {
        id: 'rosy',
        label: 'Make it sound like paradise',
        effects: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 4 }, { karma: -1 }, { log: 'I described retirement as one long vacation. {{person}} left glowing. I left out Tuesdays.' }],
      },
      {
        id: 'hammock',
        label: 'Give {{them}} a hammock',
        hint: '{{$150}}',
        effects: [{ money: -150 }, { relationship: 'person', delta: 8 }, { log: 'I gave {{person}} a hammock and a card that said: practice. {{They}} lay in it at the party.', kind: 'good' }],
      },
      {
        id: 'walk',
        label: 'Recruit {{them}} for my walks',
        effects: [{ energy: -1 }, { relationship: 'person', delta: 5 }, { stat: 'health', delta: 2 }, { log: '{{person}} joined my Wednesday walking group. We complain about our knees as a team now.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'gy_friend_funeral_wishes',
    category: 'friends',
    title: 'Instructions',
    text: '{{person}} died last week and left written instructions for the funeral: nobody in black, a brass band, and me telling the story about the canoe. I promised years ago. I had hoped {{they}} would forget.',
    minAge: 62,
    maxAge: 105,
    weight: 0.8,
    cooldown: 6,
    // Written into the funeral plans: a friend still close to me.
    person: { kind: ['friend', 'bestFriend'], minAge: 60, minRelationship: 30 },
    choices: [
      {
        id: 'canoe',
        label: 'Tell the whole canoe story',
        effects: [
          { personDies: true, cause: 'natural causes' },
          { energy: -1 },
          { stat: 'happiness', delta: -4 },
          { karma: 2 },
          {
            chance: 0.7,
            then: [{ log: 'I told the whole canoe story. The room laughed until it cried. {{person}} would have loved it.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I got to the part with the goose and could not go on. An old friend finished it for me.' }],
          },
        ],
      },
      {
        id: 'clean',
        label: 'Tell a cleaned-up version',
        effects: [{ personDies: true, cause: 'natural causes' }, { stat: 'happiness', delta: -5 }, { karma: 1 }, { log: 'I told a version fit for a church hall. Two old friends in the back row shook their heads.' }],
      },
      {
        id: 'band',
        label: 'Pay for the brass band',
        hint: '{{$600}}',
        effects: [{ personDies: true, cause: 'natural causes' }, { money: -600 }, { stat: 'happiness', delta: -2 }, { karma: 3 }, { log: 'I paid for the brass band. It played {{their}} favorite song badly, exactly as requested.', kind: 'good' }],
      },
      {
        id: 'black',
        label: 'Wear black anyway',
        effects: [{ personDies: true, cause: 'natural causes' }, { stat: 'happiness', delta: -3 }, { karma: -2 }, { log: 'I wore black. Everyone else wore yellow. {{person}} got the last laugh, as usual.' }],
      },
    ],
  },
  {
    id: 'gy_fifty_year_reunion',
    category: 'friends',
    title: 'Fifty years on',
    text: 'An invitation came for my fifty-year school reunion. Half the names on the list have a small star beside them, and a footnote explains the star gently. The other half want to know if I still have my hair.',
    minAge: 66,
    maxAge: 70,
    weight: 1.5,
    once: true,
    choices: [
      {
        id: 'go',
        label: 'Go, name tag and all',
        effects: [
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 2 }, { newPerson: { kind: 'friend', relationship: 55, minAge: 64, maxAge: 72, log: '{{person}} from my old class sat with me. We picked up mid-sentence after fifty years.' } }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'We spent the evening comparing blood pressure. Mine won, narrowly. It was not a good evening.' }],
          },
        ],
      },
      {
        id: 'toast',
        label: 'Read out the starred names',
        effects: [{ energy: -1 }, { karma: 3 }, { stat: 'happiness', delta: 2 }, { log: 'I read the starred names one by one. The room went quiet, then stood up together.', kind: 'milestone' }],
      },
      {
        id: 'slides',
        label: 'Make the slideshow',
        hint: '{{$100}}',
        effects: [
          { money: -100 },
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.3,
            then: [{ log: 'The projector showed my photos upside down for ten minutes. It was the highlight of the night.' }],
            else: [{ fame: 1 }, { log: 'My slideshow of our terrible haircuts got a standing ovation. A slow one, but standing.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Stay home',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I stayed home with the yearbook. Everyone in it is still seventeen, which helped.' }],
      },
    ],
  },
  {
    id: 'gy_assisted_living_visit',
    category: 'friends',
    title: 'Lemon cleaner and gravy',
    text: '{{person}} has moved into assisted living on the edge of town. The hallways smell of lemon cleaner and gravy. {{They}} says the food is fine, the staff are kind and the chair yoga is brutal.',
    minAge: 65,
    maxAge: 100,
    weight: 1,
    cooldown: 5,
    conditions: [{ not: { flag: 'gy_assisted_living' } }],
    person: { kind: ['friend', 'bestFriend'], minAge: 72 },
    choices: [
      {
        id: 'weekly',
        label: 'Visit every week',
        effects: [{ energy: -1 }, { relationship: 'person', delta: 10 }, { karma: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I visit on Thursdays. We do the crossword in pen, which {{person}} calls living dangerously.', kind: 'good' }],
      },
      {
        id: 'pastry',
        label: 'Smuggle in real pastries',
        hint: '{{$20}}',
        effects: [
          { money: -20 },
          { relationship: 'person', delta: 6 },
          {
            chance: 0.25,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'A nurse caught me with the eclairs. I am on a list now. {{person}} is very proud of me.' }],
            else: [{ stat: 'happiness', delta: 3 }, { log: 'I smuggled eclairs past the front desk. {{person}} ate two and hid one for later.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'lunch',
        label: 'Break {{them}} out for lunch',
        hint: '{{$40}}',
        effects: [
          { money: -40 },
          { energy: -1 },
          { relationship: 'person', delta: 8 },
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.2,
            then: [{ injury: 2 }, { log: 'Lunch was perfect until we both tripped on the restaurant step. Two bruises, one great day.', kind: 'bad' }],
            else: [{ log: 'We had lunch at the old diner and stayed until they started mopping. {{person}} glowed.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'cards',
        label: 'Send cards instead',
        effects: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -2 }, { karma: -1 }, { log: 'I visited once and found it harder than I expected. I send cards now. {{person}} keeps them all.' }],
      },
    ],
  },
  {
    id: 'gy_friend_grandkid_photos',
    category: 'friends',
    title: 'Four hundred photos',
    text: '{{person}} is showing me photos of {{their}} grandchildren on {{their}} phone. We are four hundred photos in. The third grandchild, I have been told twice now, is the clever one.',
    minAge: 60,
    maxAge: 95,
    weight: 1.2,
    cooldown: 5,
    person: { kind: ['friend', 'bestFriend'], minAge: 55 },
    choices: [
      {
        id: 'admire',
        label: 'Admire every single one',
        effects: [{ relationship: 'person', delta: 6 }, { karma: 1 }, { stat: 'happiness', delta: -1 }, { log: 'I admired all four hundred. I could now pick the clever one out of a lineup.' }],
      },
      {
        id: 'mine',
        label: 'Get out my own photos',
        conditions: [{ hasChildren: true }],
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 3 }, { log: 'I fought back with photos of my own family. It became a duel. We both enjoyed it enormously.' }],
      },
      {
        id: 'ask',
        label: 'Ask about the clever one',
        effects: [
          { relationship: 'person', delta: 4 },
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'The clever one builds robots. I know more about robots now than I planned to, and I liked it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'Asking about the clever one unlocked a second phone. There were more photos.' }],
          },
        ],
      },
      {
        id: 'escape',
        label: 'Invent a dentist appointment',
        effects: [
          { karma: -2 },
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.3,
            then: [{ relationship: 'person', delta: -6 }, { log: '{{person}} spotted me in the coffee shop across the road ten minutes later. We do not discuss it.', kind: 'bad' }],
            else: [{ log: 'I escaped at photo two hundred and six. My teeth, I said, could not wait.' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ retirement
  {
    id: 'gy_first_monday',
    category: 'elderly',
    title: 'Monday',
    text: 'Retirement has a Monday problem. I still wake at six out of habit, shower, get dressed and make coffee, and then I stand in the hallway holding my keys with nowhere at all to go.',
    minAge: 60,
    maxAge: 75,
    // A short window, so weighted like later_life's retirement party.
    weight: 5,
    once: true,
    // The first Mondays of retirement: within two years of retiring (the next birthday sees 1), not a decade on.
    conditions: [{ sinceRetired: true, lte: 2 }],
    choices: [
      {
        id: 'schedule',
        label: 'Make a strict schedule',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: 'Walk at eight, crossword at ten, lunch at noon sharp. I am my own boss now, and a strict one.' }],
      },
      {
        id: 'bed',
        label: 'Go back to bed',
        effects: [
          { stat: 'happiness', delta: 4 },
          { stat: 'health', delta: 1 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: -5 }, { log: 'I went back to bed every Monday until March. By then the weeks had started to blur.', kind: 'bad' }],
            else: [{ log: 'I went back to bed at six-fifteen. Best decision I have made in forty years of Mondays.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'walk',
        label: 'Walk until something happens',
        effects: [
          { energy: -1 },
          { stat: 'health', delta: 2 },
          {
            chance: 0.5,
            then: [{ newPerson: { kind: 'friend', relationship: 45, minAge: 58, maxAge: 75, log: 'On a Monday walk I met {{person}}, also retired, also walking nowhere in particular.' } }],
            else: [{ log: 'I walked six miles and found a bakery I never had time for. Monday has a bakery now.' }],
          },
        ],
      },
      {
        id: 'call',
        label: 'Call my old workplace',
        effects: [
          { relationship: 'coworker', delta: 3 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'An old coworker was thrilled to hear from me for four whole minutes, until a meeting started.' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I called to check how things were going. Things were going fine without me, which stung.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gy_proof_of_life',
    category: 'money',
    title: 'Proof of life',
    text: 'The pension office sent a form asking me to confirm that I am still alive. It must be signed by a witness of good standing who has known me for two years. I have been asked stranger things, but not by mail.',
    minAge: 72,
    maxAge: 110,
    weight: 1,
    cooldown: 8,
    conditions: [{ retired: true }, { hasJob: false }],
    choices: [
      {
        id: 'pharmacist',
        label: 'Ask the pharmacist to sign',
        effects: [{ energy: -1 }, { stat: 'happiness', delta: 2 }, { log: "The pharmacist signed it and wrote 'definitely alive' in the margin. The office accepted it." }],
      },
      {
        id: 'complain',
        label: 'Call and complain',
        effects: [
          { energy: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 1 }, { log: 'I argued that complaining proves I am alive. The clerk agreed and waived the form.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'Forty minutes on hold to learn the form is mandatory. I signed it, slightly older.' }],
          },
        ],
      },
      {
        id: 'photo',
        label: "Send a photo with today's paper",
        effects: [
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.5,
            then: [{ log: 'I posed with the morning paper like a hostage. They accepted it and pinned it up, I hear.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: "They rejected the photo as 'nonstandard'. I did the form anyway, and now they know my face." }],
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore it',
        effects: [
          {
            chance: 0.6,
            then: [{ money: -1500 }, { stat: 'happiness', delta: -5 }, { log: 'They paused my pension until I proved I existed. Two months and {{$1500}} later, I do.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 4 }, { log: 'Nobody followed up. The pension kept coming. I remain alive by default.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gy_downsizing_boxes',
    category: 'family',
    title: 'Flat boxes',
    text: "{{person}} has started saying the word 'clutter' at me the way doctors say 'cholesterol'. Today {{they}} arrived with a stack of flat cardboard boxes, ready to fold, which felt pointed.",
    minAge: 65,
    maxAge: 95,
    weight: 1,
    once: true,
    conditions: [{ not: { flag: 'gy_assisted_living' } }, { not: { flag: 'gy_lives_with_kids' } }],
    person: { kind: ['child'], minAge: 30 },
    choices: [
      {
        id: 'fill',
        label: 'Fill the boxes together',
        effects: [
          { energy: -1 },
          { relationship: 'person', delta: 8 },
          { stat: 'happiness', delta: -2 },
          { log: '{{person}} and I filled eleven boxes. {{They}} found my old report cards and read them aloud.' },
          { chance: 0.5, then: [{ money: 400 }, { log: 'The good stuff sold online for {{$400}}. The rest went to people who seemed glad of it.', kind: 'money' }] },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse on principle',
        effects: [{ relationship: 'person', delta: -5 }, { stat: 'happiness', delta: 3 }, { log: 'I used the boxes to store more things. {{person}} has noticed. We are at an impasse.' }],
      },
      {
        id: 'pro',
        label: 'Hire a professional declutterer',
        hint: '{{$600}}',
        effects: [{ money: -600 }, { relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 2 }, { log: 'A cheerful woman held up each thing and asked if it brought me joy. Most of it brought dust.' }],
      },
      {
        id: 'daily',
        label: 'Give away one thing a day',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 1 }, { log: 'I give away one thing a day. At this rate I will be clear by my two-hundredth birthday.' }],
      },
    ],
  },
  {
    id: 'gy_library_reader',
    category: 'elderly',
    title: 'The Saturday rug',
    text: 'The library asked for volunteers to read to children on Saturday mornings. Twelve kids on a rug, one picture book about a bear who loses his hat, and the toughest audience I have ever faced.',
    minAge: 60,
    maxAge: 90,
    weight: 1,
    once: true,
    conditions: [{ retired: true }, { criminalRecord: false }],
    choices: [
      {
        id: 'voices',
        label: 'Do all the voices',
        effects: [
          { energy: -1 },
          { karma: 2 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 6 }, { log: 'I did a bear voice, a rabbit voice and a very angry turtle. The rug demanded an encore.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'My bear voice made the smallest one cry. The librarian suggested a calmer bear.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'plain',
        label: 'Read it straight',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: 2 }, { log: "I read it plainly and well. One girl told me I was 'fine'. I will take fine." }],
      },
      {
        id: 'regular',
        label: 'Sign up for every Saturday',
        effects: [{ energy: -1 }, { karma: 4 }, { stat: 'happiness', delta: 5 }, { stat: 'health', delta: -2 }, { log: 'I became the Saturday reader. The children know my name and share every cold they get.', kind: 'good' }],
      },
      {
        id: 'shelve',
        label: 'Shelve books instead',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 1 }, { karma: 1 }, { log: 'I took the shelving shift. Quiet, alphabetical, and nobody asked me to be a bear.' }],
      },
    ],
  },
  {
    id: 'gy_community_class',
    category: 'elderly',
    title: 'Still life with pear',
    text: "I signed up for a watercolor class at the community center. Our teacher is twenty-four and calls everyone 'my friend'. My first painting was supposed to be a pear. It looks like a worried potato.",
    minAge: 60,
    maxAge: 95,
    weight: 1.2,
    once: true,
    conditions: [{ retired: true }],
    choices: [
      {
        id: 'keep',
        label: 'Keep painting',
        hint: '{{$80}}',
        effects: [
          { money: -80 },
          { stat: 'happiness', delta: 5 },
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.3,
            then: [{ money: 150 }, { fame: 1 }, { log: 'By the last class a pear of mine sold at the center art fair for {{$150}}. The buyer was my teacher.', kind: 'good' }],
            else: [{ log: 'My pears improved week by week. By the last class they were recognizably fruit.' }],
          },
        ],
      },
      {
        id: 'wood',
        label: 'Switch to woodworking',
        hint: '{{$120}}',
        effects: [
          { money: -120 },
          { stat: 'smarts', delta: 3 },
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.2,
            then: [{ injury: 3 }, { log: 'I made a birdhouse and a small cut on my thumb. The birds approve of one of these.', kind: 'bad' }],
            else: [{ log: 'I built a stool. It wobbles, but it holds you up if you believe in it.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'gossip',
        label: 'Come for the gossip',
        hint: '{{$80}}',
        effects: [
          { money: -80 },
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.6,
            then: [{ newPerson: { kind: 'friend', relationship: 50, minAge: 60, maxAge: 85, log: '{{person}} at the next easel paints even worse than I do. We get along wonderfully.' } }],
            else: [{ log: 'I came for the gossip and stayed for the gossip. The pear remains unpainted.' }],
          },
        ],
      },
      {
        id: 'quit',
        label: 'Quit after one class',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I have decided I am not a painter. The potato-pear is on the fridge anyway.' }],
      },
    ],
  },
  {
    id: 'gy_seasonal_job',
    category: 'work',
    title: 'Help wanted',
    text: 'The garden center down the road put a sign in the window: seasonal help wanted, no experience needed, must love plants. I love plants. I also love sitting down.',
    minAge: 60,
    maxAge: 80,
    weight: 1,
    cooldown: 5,
    conditions: [{ retired: true }, { hasJob: false }],
    choices: [
      {
        id: 'take',
        label: 'Take the job for spring',
        effects: [
          { money: 1800 },
          { energy: -1 },
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.25,
            then: [{ injury: 3 }, { log: 'I earned {{$1800}} over spring and lifted one bag of soil too many. My back filed a complaint.', kind: 'bad' }],
            else: [{ stat: 'health', delta: 2 }, { log: 'I earned {{$1800}} watering, advising and naming the cacti. It barely felt like work.', kind: 'money' }],
          },
        ],
      },
      {
        id: 'register',
        label: 'Only work the register',
        effects: [{ money: 900 }, { energy: -1 }, { stat: 'happiness', delta: 2 }, { log: 'I worked the register two days a week for {{$900}} and sat down the entire time. Perfect.', kind: 'money' }],
      },
      {
        id: 'buy',
        label: 'Buy plants instead',
        hint: '{{$120}}',
        effects: [{ money: -120 }, { stat: 'happiness', delta: 4 }, { log: 'I did not apply, but I left with three ferns and a lemon tree. The garden center wins either way.' }],
      },
      {
        id: 'no',
        label: 'Stay retired',
        effects: [{ stat: 'happiness', delta: 1 }, { stat: 'health', delta: 1 }, { log: 'I walked past the sign every day for a month. Retirement held.' }],
      },
    ],
  },
  {
    id: 'gy_unretired',
    category: 'work',
    title: 'Back again',
    text: 'Retirement lasted until I had alphabetized the spice rack twice. Now I work as a {{job}} at {{company}}, and the young ones treat me like a museum exhibit with opinions.',
    minAge: 61,
    maxAge: 85,
    weight: 1.5,
    once: true,
    conditions: [{ retired: true }, { hasJob: true }],
    choices: [
      {
        id: 'stories',
        label: 'Tell war stories at lunch',
        effects: [{ relationship: 'coworker', delta: 4 }, { stat: 'happiness', delta: 3 }, { jobPerformance: -1 }, { log: 'I told stories from my first job, back when we did it all by hand. Lunch runs long now, by request.' }],
      },
      {
        id: 'outwork',
        label: 'Outwork every one of them',
        effects: [{ jobPerformance: 6 }, { stat: 'health', delta: -3 }, { stat: 'happiness', delta: 2 }, { log: 'I arrive first and leave last. The young ones are rattled. So are my knees.' }],
      },
      {
        id: 'teach',
        label: 'Teach them the old tricks',
        effects: [{ jobPerformance: 3 }, { karma: 2 }, { stat: 'smarts', delta: 1 }, { log: "I showed them how we managed before there was an app for it. They call it 'the old way', kindly.", kind: 'good' }],
      },
      {
        id: 'three',
        label: 'Leave every day at three',
        effects: [{ jobPerformance: -4 }, { stat: 'happiness', delta: 5 }, { log: 'I leave at three sharp. Nobody says a word. Being the oldest person here is a superpower.' }],
      },
    ],
  },

  // ------------------------------------------------------------ scams
  {
    id: 'gy_grandkid_scam_call',
    category: 'money',
    title: "It's me",
    text: "The phone rang at seven in the morning. A crackly young voice said, 'It's me, your favorite grandkid,' then something about an accident abroad and bail money needed today. And please, please don't tell the family.",
    minAge: 65,
    maxAge: 100,
    weight: 1.2,
    cooldown: 6,
    person: { kind: ['child'], minAge: 38, kids: { gte: 1 } },
    choices: [
      {
        id: 'hang',
        label: 'Hang up',
        effects: [
          { stat: 'happiness', delta: 1 },
          {
            chance: 0.3,
            then: [{ stat: 'happiness', delta: -3 }, { log: 'I hung up, then worried all day that it had been real. It was not. The worry was.' }],
            else: [{ log: 'I hung up. Nobody in my family is awake at seven, let alone abroad.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'check',
        label: 'Call {{person}} to check',
        effects: [{ energy: -1 }, { relationship: 'person', delta: 4 }, { log: '{{person}} confirmed the whole family was home and asleep. Then {{they}} stayed on to chat.', kind: 'good' }],
      },
      {
        id: 'quiz',
        label: 'Ask what we eat at holidays',
        effects: [
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.8,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I asked what we have for dessert every holiday. The line went dead. It is pie. It is always pie.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: "The voice guessed 'pie'. I panicked and called the family. Everyone was safe and very sleepy." }],
          },
        ],
      },
      {
        id: 'pay',
        label: 'Wire the bail money',
        hint: '{{$2500}}',
        effects: [
          { money: -2500 },
          {
            chance: 0.25,
            then: [{ money: 2500 }, { stat: 'happiness', delta: -2 }, { log: 'My bank flagged the transfer as a scam and stopped it. I have never loved a bank before.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -8 }, { log: 'The {{$2500}} was gone within the hour. There was no accident and no grandkid. Just a voice.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gy_tech_popup',
    category: 'money',
    title: 'VIRUS DETECTED',
    text: "A window filled my computer screen with a siren noise and red letters: VIRUS DETECTED, CALL THIS NUMBER NOW. The man who answered was very calm and wanted remote access to 'clean it up'.",
    minAge: 62,
    maxAge: 105,
    weight: 1.2,
    cooldown: 8,
    conditions: [{ not: { jobCategory: ['tech'] } }],
    choices: [
      {
        id: 'plug',
        label: 'Pull the plug out',
        effects: [
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.3,
            then: [{ money: -200 }, { log: 'I yanked the cord. The pop-up died, and so did the power supply. A new one cost {{$200}}.', kind: 'bad' }],
            else: [{ log: 'I yanked the cord and the siren stopped. When I turned it back on, the computer was fine.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'kids',
        label: 'Call family for help',
        conditions: [{ hasChildren: true }],
        effects: [{ energy: -1 }, { relationship: 'child', delta: 3 }, { stat: 'happiness', delta: -1 }, { log: 'Family tech support closed the pop-up in two seconds, then explained it for twenty. A fair trade.' }],
      },
      {
        id: 'bluff',
        label: 'Mention my nephew the detective',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.75,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I said my nephew is a police detective. He hung up first. I do not have a nephew.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I mentioned my nephew the detective. He laughed and called back nine more times that day.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'pay',
        label: 'Let him fix it',
        hint: '{{$300}}',
        effects: [
          { money: -300 },
          {
            chance: 0.6,
            then: [{ money: -1500 }, { stat: 'happiness', delta: -8 }, { log: "He fixed nothing and helped himself to {{$1500}} from my bank. The bank is 'looking into it'.", kind: 'bad' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'I paid {{$300}} for him to clean a computer that was never sick. At least he left.', kind: 'bad' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ widowhood
  {
    id: 'gy_widow_two_cups',
    category: 'family',
    title: 'Two cups',
    text: 'Some mornings I still set out two cups before I remember that {{person}} is gone. My home makes all the same noises; there is just nobody left to blame them on.',
    minAge: 60,
    maxAge: 105,
    weight: 3,
    once: true,
    conditions: [...NEWLY_WIDOWED, { hasLover: false }, { not: { flag: 'gy_lives_with_kids' } }],
    person: { kind: ['spouse'], alive: false },
    choices: [
      {
        id: 'group',
        label: 'Join a grief group',
        effects: [
          { energy: -1 },
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.6,
            then: [{ newPerson: { kind: 'friend', relationship: 50, log: '{{person}} from the grief group lost a husband of fifty years. We meet for soup on Fridays.' } }],
            else: [{ log: 'The group met in the library on Mondays, over bad coffee. It helped more than I expected.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'cups',
        label: 'Keep setting out both cups',
        effects: [{ stat: 'happiness', delta: 2 }, { log: "I drink from mine and sometimes from {{person}}'s. {{They}} would have called me sentimental." }],
      },
      {
        id: 'kids',
        label: 'Let family visit more',
        conditions: [{ hasChildren: true }],
        effects: [{ relationship: 'child', delta: 5 }, { stat: 'happiness', delta: 5 }, { energy: -1 }, { log: 'Family comes by on Sundays now. They bring food and leave with my leftovers.', kind: 'good' }],
      },
      {
        id: 'busy',
        label: 'Fill every hour',
        effects: [{ energy: -1 }, { karma: 2 }, { stat: 'happiness', delta: 1 }, { stat: 'health', delta: -2 }, { log: 'I filled every hour with errands and committees. The evenings were still long.' }],
      },
    ],
  },
  {
    id: 'gy_widow_closet',
    category: 'family',
    title: 'The hall closet',
    text: "{{person}}'s jackets are still in the hall closet, buttoned the way {{they}} left them. Friends keep asking, gently, what I plan to do with them. I plan to keep opening the closet.",
    minAge: 60,
    maxAge: 105,
    weight: 3,
    once: true,
    // The same closet as gu_widowed_closet, for a widow who did not get that card.
    conditions: [...NEWLY_WIDOWED, { hasLover: false }, { eventNotFired: 'gu_widowed_closet' }, { not: { flag: 'gy_assisted_living' } }, { not: { flag: 'gy_lives_with_kids' } }],
    person: { kind: ['spouse'], alive: false },
    choices: [
      {
        id: 'donate',
        label: 'Donate them to the shelter',
        effects: [{ karma: 4 }, { stat: 'happiness', delta: -2 }, { log: "I gave the jackets to the shelter. Somewhere a stranger is wearing {{person}}'s good one.", kind: 'good' }],
      },
      {
        id: 'one',
        label: 'Keep one, give the rest',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I kept the blue one with the torn pocket. The rest went to people who needed them more.' }],
      },
      {
        id: 'kids',
        label: 'Let family choose first',
        conditions: [{ hasChildren: true }],
        effects: [{ relationship: 'child', delta: 4 }, { log: "My family chose first. {{person}}'s old hat has a new head under it now. It looks exactly right." }],
      },
      {
        id: 'leave',
        label: 'Leave the closet alone',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I left everything where it hangs. Some doors do not need opening by anyone else.' }],
      },
    ],
  },
  {
    id: 'gy_widow_recipe',
    category: 'family',
    title: 'From the card',
    text: "{{person}} always did the cooking. Tonight I tried to make {{their}} famous stew from a recipe card in {{their}} handwriting. The card says 'some' four times and 'you know' once.",
    minAge: 60,
    maxAge: 100,
    weight: 3,
    once: true,
    conditions: [...NEWLY_WIDOWED, { hasLover: false }, { not: { flag: 'gy_assisted_living' } }],
    person: { kind: ['spouse'], alive: false },
    choices: [
      {
        id: 'exact',
        label: 'Follow the card exactly',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 6 }, { log: 'It tasted almost right. I ate it standing at the stove, the way {{person}} used to.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: "It tasted nothing like {{person}}'s. 'Some' is doing a lot of work on that card." }],
          },
        ],
      },
      {
        id: 'class',
        label: 'Take a cooking class',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          { stat: 'smarts', delta: 2 },
          { stat: 'health', delta: 2 },
          {
            chance: 0.5,
            then: [{ newPerson: { kind: 'friend', relationship: 50, log: '{{person}} from the cooking class burns everything too. We have become a team.' } }],
            else: [{ stat: 'happiness', delta: 2 }, { log: 'Six weeks of classes. I can make four dishes now, and none of them come from a can.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'neighbors',
        label: 'Invite the neighbors to help',
        effects: [{ energy: -1 }, { stat: 'happiness', delta: 4 }, { karma: 1 }, { log: 'The neighbors came with bread and opinions. The stew was a group effort, and nearly good.', kind: 'good' }],
      },
      {
        id: 'takeout',
        label: 'Order takeout instead',
        hint: '{{$30}}',
        effects: [{ money: -30 }, { stat: 'happiness', delta: 2 }, { stat: 'health', delta: -1 }, { log: 'I ordered takeout and put the card back in the drawer for another night.' }],
      },
    ],
  },
  {
    id: 'gy_widow_dinner_invite',
    category: 'romance',
    title: 'Dinner, properly',
    text: "Someone from my walking group asked me to dinner, properly, with a time and a place. I said I would think about it, then went home and explained the whole thing to {{person}}'s photo.",
    minAge: 62,
    maxAge: 95,
    weight: 0.8,
    once: true,
    // A date: not in the first two years after the loss (the grief window, GAME_DESIGN §10).
    conditions: [...WIDOWED, { hasLover: false }, { flag: 'grieving', exists: false }, { eventNotFired: 'gu_widowed_dinner_invite' }],
    person: { kind: ['spouse'], alive: false },
    choices: [
      {
        id: 'go',
        label: 'Go to dinner',
        effects: [
          { stat: 'happiness', delta: 4 },
          {
            chance: 0.5,
            then: [{ newPerson: { kind: 'lover', relationship: 55, log: 'Dinner with {{person}} lasted four hours. I laughed in a way I had not in years.' } }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'A lovely dinner and a polite goodbye. It was not the start of anything, and that was fine.' }],
          },
        ],
      },
      {
        id: 'friends',
        label: 'Go, but as friends',
        effects: [{ stat: 'happiness', delta: 3 }, { newPerson: { kind: 'friend', relationship: 50, log: '{{person}} and I agreed on friendship over dessert. We split the bill and the cake.' } }],
      },
      {
        id: 'no',
        label: 'Politely decline',
        effects: [{ stat: 'happiness', delta: -1 }, { karma: 1 }, { log: "I said no, kindly. I am not ready, and maybe I won't be. {{person}}'s photo did not argue." }],
      },
    ],
  },

  // ------------------------------------------------------------ assisted living
  {
    id: 'gy_assisted_living_tour',
    category: 'elderly',
    title: 'Just to look',
    text: "My doctor slid a brochure across the desk: assisted living, a garden, a library and 'a vibrant social calendar'. I toured it. A woman named Doris has already offered to show me the ropes.",
    minAge: 78,
    maxAge: 105,
    weight: 1.2,
    once: true,
    conditions: [{ married: false }],
    choices: [
      {
        id: 'move',
        label: 'Move in',
        hint: '{{$6000}}',
        effects: [
          { money: -6000 },
          { flag: 'gy_assisted_living', set: true },
          { stat: 'health', delta: 3 },
          { stat: 'happiness', delta: 2 },
          { log: 'I moved in. My room looks out on the garden and has a cord to pull if I fall. Doris approves.', kind: 'milestone' },
          { queue: 'gy_al_table_six' },
        ],
      },
      {
        id: 'later',
        label: 'Not yet',
        effects: [
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.3,
            then: [{ injury: 4 }, { log: 'I went home to my own stairs. The stairs and I had a disagreement in February.', kind: 'bad' }],
            else: [{ log: 'I stuck the brochure on the fridge, next to the takeout menus. Not yet. Maybe.' }],
          },
        ],
      },
      {
        id: 'help',
        label: 'Hire help at home',
        hint: '{{$3000}}',
        effects: [{ money: -3000 }, { stat: 'health', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'An aide comes three mornings a week. She is efficient, cheerful and terrible at checkers.' }],
      },
      {
        id: 'kids',
        label: 'Move in with family',
        conditions: [{ hasChildren: true }],
        effects: [
          { flag: 'gy_lives_with_kids', set: true },
          {
            random: [
              { weight: 6, effects: [{ relationship: 'child', delta: 6 }, { stat: 'happiness', delta: 4 }, { log: "I moved into the spare room at my kid's place. Dinners are loud and wonderful.", kind: 'good' }] },
              { weight: 4, effects: [{ relationship: 'child', delta: -6 }, { stat: 'happiness', delta: -3 }, { log: 'I moved in with my kid. Within a month we both knew. We love each other more at a distance.', kind: 'bad' }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'gy_al_table_six',
    category: 'elderly',
    title: 'Table six',
    text: 'My first dinner at the residence: assigned seats, and table six has politics. Doris and Frank have not spoken since a disagreement about the thermostat that started years before I arrived.',
    minAge: 75,
    maxAge: 110,
    weight: 1,
    followUpOnly: true,
    conditions: [{ flag: 'gy_assisted_living' }],
    choices: [
      {
        id: 'neutral',
        label: 'Stay strictly neutral',
        effects: [{ stat: 'happiness', delta: 1 }, { stat: 'smarts', delta: 1 }, { log: 'I discuss only the weather with both of them. A neutral country, with mashed potatoes.' }, { queue: 'gy_al_talent_night' }],
      },
      {
        id: 'doris',
        label: 'Side with Doris',
        effects: [{ stat: 'happiness', delta: 3 }, { karma: -1 }, { log: 'I sided with Doris. Frank now passes me the salt with tremendous coldness.' }, { queue: 'gy_al_talent_night' }],
      },
      {
        id: 'summit',
        label: 'Call a thermostat summit',
        effects: [
          {
            chance: 0.4,
            then: [{ karma: 3 }, { stat: 'happiness', delta: 6 }, { fame: 1 }, { log: 'I brokered a deal: 71 degrees, weekdays only. Table six is at peace. I am a statesman.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The summit ended with Frank taking the thermostat cover to his room. Hostilities continue.', kind: 'bad' }],
          },
          { queue: 'gy_al_talent_night' },
        ],
      },
      {
        id: 'move',
        label: 'Ask to change tables',
        effects: [
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.5,
            then: [{ newPerson: { kind: 'friend', relationship: 50, minAge: 75, maxAge: 100, log: '{{person}} at table two plays checkers and tells terrible jokes. I moved, and I am happier.' } }],
            else: [{ log: 'Table two has politics too. It is politics all the way down, apparently.' }],
          },
          { queue: 'gy_al_talent_night' },
        ],
      },
    ],
  },
  {
    id: 'gy_al_talent_night',
    category: 'elderly',
    title: 'The spoon champion',
    text: "My first Friday at the residence is talent night. Last year's winner played the spoons and has acted like a celebrity ever since. The sign-up sheet is by the elevator, and Doris is watching it.",
    minAge: 75,
    maxAge: 110,
    weight: 1,
    followUpOnly: true,
    conditions: [{ flag: 'gy_assisted_living' }],
    choices: [
      {
        id: 'sing',
        label: 'Sing a song from my youth',
        effects: [
          { energy: -1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 7 }, { fame: 1 }, { log: 'I sang a song from my teens. Half the room sang along, including the spoon man.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I forgot the second verse and hummed it. The judges, generous to a fault, gave me third.' }],
          },
        ],
      },
      {
        id: 'jokes',
        label: 'Do ten minutes of jokes',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 6 }, { log: 'I did ten minutes on hip replacements. A nurse laughed so hard she had to sit down.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'My jokes met polite silence and the faint whistle of a hearing aid.' }],
          },
        ],
      },
      {
        id: 'spoons',
        label: 'Challenge the spoon champion',
        effects: [
          { energy: -1 },
          {
            chance: 0.35,
            then: [{ stat: 'happiness', delta: 8 }, { fame: 2 }, { log: 'I learned the spoons in a week and beat the champion. He has demanded a rematch.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The spoon champion defended his title. I have blisters and a new respect for cutlery.' }],
          },
        ],
      },
      {
        id: 'sound',
        label: 'Run the sound instead',
        effects: [{ karma: 1 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 2 }, { log: 'I ran the sound system, which is one speaker and a cord. No mistakes. Well, one.' }],
      },
    ],
  },

  // ------------------------------------------------------------ what to leave
  {
    id: 'gy_heirloom_stickers',
    category: 'family',
    title: 'Little stickers',
    text: 'I have started putting small stickers with names on the backs of things. The clock goes to {{person}}. The good dishes are spoken for. The ugly vase is a problem: nobody will admit to wanting it.',
    minAge: 68,
    maxAge: 105,
    weight: 1,
    once: true,
    person: { kind: ['child'], minAge: 25 },
    choices: [
      {
        id: 'together',
        label: 'Let the family pick together',
        effects: [
          { relationship: 'child', delta: 4 },
          {
            chance: 0.3,
            then: [{ relationship: 'child', delta: -6 }, { log: 'Picking day went fine until the gravy boat. Some wounds take a generation to heal.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 4 }, { log: 'We went room by room with tea and stories. Everyone got something. Even the vase.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'secret',
        label: 'Decide it all myself',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'I stickered everything myself, in secret. It will be a surprise, and I will miss the fallout.' }],
      },
      {
        id: 'now',
        label: 'Give things away now',
        effects: [{ relationship: 'child', delta: -2 }, { relationship: 'person', delta: 8 }, { karma: 2 }, { stat: 'happiness', delta: 3 }, { log: 'I gave {{person}} the clock now, so I could watch {{them}} wind it. Better than any sticker.', kind: 'good' }],
      },
      {
        id: 'sell',
        label: 'Sell the silver and travel',
        effects: [{ money: 2500 }, { stat: 'happiness', delta: 4 }, { relationship: 'child', delta: -4 }, { log: 'I sold the silver for {{$2500}} and booked a trip. My heirs will inherit a postcard.', kind: 'money' }],
      },
    ],
  },
  {
    id: 'gy_funeral_plan',
    category: 'elderly',
    title: 'The binders',
    text: 'I sat down with a funeral director to plan my own send-off. He had a binder of coffins, a binder of music and the calm face of a man nothing can surprise. I intended to try.',
    minAge: 70,
    maxAge: 105,
    weight: 1,
    once: true,
    choices: [
      {
        id: 'prepay',
        label: 'Plan and prepay everything',
        hint: '{{$4000}}',
        effects: [{ money: -4000 }, { stat: 'happiness', delta: 3 }, { karma: 1 }, { relationship: 'child', delta: 4 }, { log: 'Everything is chosen and paid for, down to the music. Nobody will have to guess.', kind: 'good' }],
      },
      {
        id: 'party',
        label: 'Ask for a party instead',
        hint: '{{$1500}}',
        effects: [{ money: -1500 }, { stat: 'happiness', delta: 5 }, { log: 'I booked a party for afterward: a band, good cake, and a two-minute limit on speeches.', kind: 'good' }],
      },
      {
        id: 'science',
        label: 'Donate my body to science',
        effects: [{ karma: 4 }, { stat: 'happiness', delta: 1 }, { log: "I left my body to the medical school. The director said they are 'always grateful'. I like grateful." }],
      },
      {
        id: 'questions',
        label: 'Ask all my strange questions',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.4,
            then: [{ money: -500 }, { log: 'Somewhere between my questions I agreed to a {{$500}} urn. He is better at this than I am.', kind: 'bad' }],
            else: [{ log: 'I asked to be buried with my good reading glasses, just in case. He wrote it down without blinking.' }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ phones
  {
    id: 'gy_video_call',
    category: 'random',
    title: 'On mute',
    text: "I video-called {{person}} on my new phone. It lasted twenty minutes, and I was on mute for all of it. {{They}} watched me act out my news and guessed 'gallbladder'. It was about the garden.",
    minAge: 65,
    maxAge: 100,
    weight: 1.2,
    once: true,
    conditions: [{ not: { jobCategory: ['tech'] } }],
    // A call works at any distance, so a friend left in the old country can be on the other end.
    // Twenty minutes of watching me mime: someone still glad to hear from me, not one who stopped speaking to me.
    person: { kind: ['child', 'sibling', 'friend', 'bestFriend'], minAge: 18, farAway: 'any', minRelationship: 30 },
    choices: [
      {
        id: 'practice',
        label: 'Practice until I get it',
        effects: [{ energy: -1 }, { stat: 'smarts', delta: 2 }, { relationship: 'person', delta: 4 }, { log: 'By the end of the month I had found the mute button and my good side. {{person}} approves of both.' }],
      },
      {
        id: 'daily',
        label: 'Call {{them}} every single day',
        effects: [
          { relationship: 'person', delta: 3 },
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: -6 }, { log: "I called {{person}} daily, sometimes twice. {{They}} has started 'losing signal' at dinner.", kind: 'bad' }],
            else: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 3 }, { log: 'We talk face to face every evening now, with sound. Best part of my day.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'plain',
        label: 'Go back to normal calls',
        effects: [{ stat: 'happiness', delta: 1 }, { relationship: 'person', delta: -1 }, { log: 'I went back to plain phone calls. I know what my face is doing, and nobody else has to.' }],
      },
      {
        id: 'button',
        label: 'Press the button with the face',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 5 }, { relationship: 'person', delta: 2 }, { log: 'I pressed something and became a cat for the whole call. I could not undo it. We laughed for ages.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I pressed something and the call vanished. It took a week and a neighbor to get it back.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gy_family_group_chat',
    category: 'family',
    title: 'The family chat',
    text: "I have been added to the family group chat. So far I have replied 'OK' to a baby announcement, a recipe and a photo of someone's injured toe. I have also sent a picture of my thumb, twice.",
    minAge: 62,
    maxAge: 100,
    weight: 1.2,
    once: true,
    conditions: [{ hasChildren: true }],
    choices: [
      {
        id: 'pictures',
        label: 'Learn the little pictures',
        effects: [
          { stat: 'smarts', delta: 2 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.35,
            then: [{ relationship: 'child', delta: -2 }, { log: 'I replied to a broken leg with a laughing face. I am told it was not the crying one.', kind: 'bad' }],
            else: [{ relationship: 'child', delta: 3 }, { log: 'I learned the little pictures. My thumbs-up is now the most beloved message in the family.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'mute',
        label: 'Mute it',
        effects: [{ stat: 'happiness', delta: 4 }, { relationship: 'child', delta: -2 }, { log: 'I muted the chat. Three weeks later I learned I had missed my own birthday dinner plans.' }],
      },
      {
        id: 'voice',
        label: 'Send long voice messages',
        effects: [{ energy: -1 }, { relationship: 'child', delta: 2 }, { stat: 'happiness', delta: 3 }, { log: "I send voice messages now, nine minutes each, starting with 'Hello, it's me.' They know." }],
      },
      {
        id: 'call',
        label: 'Phone everyone instead',
        effects: [{ energy: -1 }, { relationship: 'child', delta: 4 }, { log: 'I phoned each of them to answer the chat in person. They were touched, and a little alarmed.' }],
      },
    ],
  },

  // ------------------------------------------------------------ the eldest
  {
    id: 'gy_holiday_elder',
    category: 'holiday',
    title: 'Head of the table',
    text: "The family's holiday dinner is at my place again. I am the head of the family now, and I own the only table that seats fourteen. {{person}} wants to 'help', which means quietly taking over my kitchen.",
    minAge: 62,
    maxAge: 95,
    weight: 1.2,
    cooldown: 4,
    // The table that seats fourteen is in a big home I live in, not one I rent out.
    conditions: [{ noPerson: ['mother', 'father', 'stepmother', 'stepfather'] }, ...LIVES_IN_BIG_HOME, { not: { flag: 'gy_assisted_living' } }, { not: { flag: 'gy_lives_with_kids' } }],
    person: { kind: ['child'], minAge: 30 },
    choices: [
      {
        id: 'let',
        label: 'Let {{them}} take over',
        effects: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 2 }, { log: 'I sat in the good chair while {{person}} cooked. The gravy was different. I said it was better.' }],
      },
      {
        id: 'mine',
        label: 'Do it my way',
        hint: '{{$300}}',
        effects: [{ money: -300 }, { energy: -1 }, { stat: 'happiness', delta: 5 }, { relationship: 'person', delta: -2 }, { log: 'I cooked everything my way, as always. {{person}} washed up and muttered about brining.' }],
      },
      {
        id: 'pass',
        label: 'Hand over the tradition',
        effects: [{ relationship: 'person', delta: 10 }, { karma: 3 }, { stat: 'happiness', delta: -2 }, { log: 'I gave {{person}} the old roasting pan and the recipes. Next year it is at {{their}} place.', kind: 'milestone' }],
      },
      {
        id: 'secret',
        label: 'Guard the secret ingredient',
        effects: [{ stat: 'happiness', delta: 3 }, { karma: -1 }, { relationship: 'person', delta: -1 }, { log: 'I made the stuffing behind a closed door. The secret ingredient stays with me, for now.' }],
      },
    ],
  },
  {
    id: 'gy_retiree_cruise',
    category: 'elderly',
    title: 'All aboard',
    text: "Someone at the senior center is organizing a retirees' cruise: seven nights, three buffets a day, a ballroom, and a ship full of people comparing knee replacements. The brochure is very glossy.",
    minAge: 62,
    maxAge: 90,
    weight: 1,
    cooldown: 6,
    conditions: [{ retired: true }, { money: { gte: 3000 } }],
    choices: [
      {
        id: 'book',
        label: 'Book a cabin',
        hint: '{{$2500}}',
        effects: [
          { money: -2500 },
          { counter: 'vacations' },
          { stat: 'happiness', delta: 6 },
          {
            random: [
              { weight: 4, effects: [{ newPerson: { kind: 'friend', relationship: 55, minAge: 60, maxAge: 85, log: 'I shared a dinner table all week with {{person}}. We have already booked next year.' } }] },
              { weight: 4, effects: [{ log: 'Seven days of sea air, ballroom dancing and shrimp. I came home tanned and two pounds heavier.', kind: 'good' }] },
              { weight: 2, effects: [{ stat: 'health', delta: -2 }, { stat: 'happiness', delta: -3 }, { log: 'I was seasick for four of the seven nights. The ship doctor and I are on first-name terms.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'balcony',
        label: 'Splurge on a balcony',
        hint: '{{$5000}}',
        conditions: [{ money: { gte: 5000 } }],
        effects: [{ money: -5000 }, { counter: 'vacations' }, { stat: 'happiness', delta: 10 }, { log: 'A balcony, a sunrise every morning and breakfast in a robe. I have peaked, at sea.', kind: 'good' }],
      },
      {
        id: 'river',
        label: 'Take a river cruise instead',
        hint: '{{$1200}}',
        effects: [{ money: -1200 }, { counter: 'vacations' }, { stat: 'happiness', delta: 4 }, { stat: 'smarts', delta: 2 }, { log: 'A river cruise: castles, cathedrals and little towns with early bakeries. No waves at all.' }],
      },
      {
        id: 'stay',
        label: 'Keep the brochure',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I pinned the brochure to the fridge. Some trips are best taken from a comfortable chair.' }],
      },
    ],
  },

  // ------------------------------------------------------------ health
  {
    id: 'gy_hearing_aid_gift',
    category: 'health',
    title: 'A small box',
    text: "{{person}} gave me hearing aids for my birthday. They are tiny, beige and cost a small fortune. I did not ask for them. Apparently I have been asking 'what?' quite a lot.",
    minAge: 68,
    maxAge: 100,
    weight: 1,
    once: true,
    conditions: [{ eventNotFired: 'll_hearing_aid' }],
    // A birthday present this thoughtful comes from a child still on good terms with me.
    person: { kind: ['child'], minAge: 30, minRelationship: 30 },
    choices: [
      {
        id: 'wear',
        label: 'Wear them every day',
        effects: [
          { flag: 'gy_hearing_aids', set: true },
          { relationship: 'person', delta: 5 },
          { stat: 'health', delta: 2 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 5 }, { log: "I put them in and heard {{person}} whisper 'finally'. I heard it perfectly, which was the point.", kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'Every crunch, cough and car alarm came roaring back at once. Some days I miss the quiet.' }],
          },
          { queue: 'gy_hearing_aid_switch' },
        ],
      },
      {
        id: 'dinners',
        label: 'Only wear them for dinners',
        effects: [{ flag: 'gy_hearing_aids', set: true }, { relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I wear them for family dinners only. The rest of the world can mumble without me.' }, { queue: 'gy_hearing_aid_switch' }],
      },
      {
        id: 'drawer',
        label: 'Put them in a drawer',
        effects: [{ relationship: 'person', delta: -6 }, { stat: 'happiness', delta: 2 }, { log: "They live in a drawer now. {{person}} asks about them on every call. I say 'What?'", kind: 'bad' }],
      },
      {
        id: 'return',
        label: 'Return them for the refund',
        effects: [{ money: 2000 }, { relationship: 'person', delta: -10 }, { karma: -2 }, { log: 'I returned them and kept the {{$2000}}. {{person}} found out. I heard every word of that.', kind: 'bad' }],
      },
    ],
  },
  {
    id: 'gy_hearing_aid_switch',
    category: 'health',
    title: 'The off switch',
    text: "My new hearing aids have a tiny switch, and I have discovered that a neighbor's forty-minute story about gutters can be shortened considerably with it. Nobody seems to have noticed. Yet.",
    minAge: 68,
    maxAge: 105,
    weight: 1,
    followUpOnly: true,
    conditions: [{ flag: 'gy_hearing_aids' }],
    choices: [
      {
        id: 'sparing',
        label: 'Use it sparingly',
        effects: [{ stat: 'happiness', delta: 3 }, { log: 'I switch off only for gutters, politics and the weather. I nod at the right moments.' }],
      },
      {
        id: 'always',
        label: 'Use it whenever I like',
        effects: [
          { stat: 'happiness', delta: 5 },
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ relationship: 'friend', delta: -4 }, { log: "A friend asked me 'are you even listening?' and I nodded. That went badly.", kind: 'bad' }],
            else: [{ log: 'I live in blissful, selective silence. My reputation as a listener has never been better.' }],
          },
        ],
      },
      {
        id: 'confess',
        label: 'Confess to the neighbor',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I confessed. The neighbor laughed and admitted he switches his off during my stories.', kind: 'good' }],
      },
      {
        id: 'never',
        label: 'Leave them on always',
        effects: [{ karma: 1 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -1 }, { log: 'I left them on. I now know a great deal about gutters, and I am a better person, apparently.' }],
      },
    ],
  },
  {
    id: 'gy_name_roulette',
    category: 'family',
    title: 'Every name but one',
    text: 'I called {{person}} by every name in the family, and the name of a dog we had decades ago, before I landed on the right one. {{They}} waited patiently, like someone who has been through this before.',
    minAge: 65,
    maxAge: 105,
    weight: 1.2,
    cooldown: 6,
    // An ordinary mix-up a doctor may call common: not once dementia has been diagnosed.
    conditions: [{ not: { hasIllness: ['dementia'] } }],
    person: { kind: ['child'], minAge: 20 },
    choices: [
      {
        id: 'laugh',
        label: 'Laugh about it',
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 3 }, { log: "We both laughed. {{person}} says {{they}} will answer to the dog's name from now on, if needed." }],
      },
      {
        id: 'sweetheart',
        label: "Call everyone 'sweetheart' now",
        effects: [{ karma: 1 }, { stat: 'happiness', delta: 3 }, { log: "Everyone is 'sweetheart' now. The plumber was surprised, but he took it well." }],
      },
      {
        id: 'doctor',
        label: 'Mention it to my doctor',
        hint: '{{$150}}',
        effects: [
          { money: -150 },
          {
            random: [
              { weight: 88, effects: [{ stat: 'happiness', delta: 3 }, { stat: 'health', delta: 2 }, { log: 'The doctor said mixing up names is very common, then called me by the wrong name.', kind: 'good' }] },
              { weight: 12, effects: [{ illness: 'dementia' }, { stat: 'happiness', delta: -6 }, { log: 'The tests showed real changes. The doctor was kind and clear, and sent me home with a plan.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'purpose',
        label: 'Insist it was on purpose',
        effects: [{ karma: -1 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 2 }, { log: 'I insisted I was testing {{them}}. {{They}} pretended to believe me, which was kind.' }],
      },
    ],
  },
  {
    id: 'gy_new_hip',
    category: 'health',
    title: 'Bone on bone',
    text: "The surgeon held my X-ray up to the light and said, quite cheerfully, that my hip was 'bone on bone'. A new one would take an afternoon to fit and three months to forgive.",
    minAge: 65,
    maxAge: 95,
    weight: 1,
    once: true,
    choices: [
      {
        id: 'surgery',
        label: 'Get the new hip',
        hint: '{{$3000}}',
        effects: [
          { money: -3000 },
          { counter: 'surgeries' },
          {
            random: [
              { weight: 8, effects: [{ stat: 'health', delta: 8 }, { stat: 'happiness', delta: 6 }, { log: 'Six weeks with a walker, then I walked to the mailbox without wincing. Titanium suits me.', kind: 'good' }] },
              { weight: 2, effects: [{ injury: 5 }, { stat: 'health', delta: 3 }, { stat: 'happiness', delta: -4 }, { log: 'The recovery was slow and stubborn, like me. The hip works now, mostly, on dry days.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'therapy',
        label: 'Try physical therapy first',
        hint: '{{$600}}',
        effects: [{ money: -600 }, { energy: -1 }, { stat: 'health', delta: 3 }, { stat: 'happiness', delta: -1 }, { log: 'Twice a week a cheerful therapist bends my leg into shapes it resents. It helps, a bit.' }],
      },
      {
        id: 'cane',
        label: 'Get a really good cane',
        hint: '{{$60}}',
        effects: [{ money: -60 }, { stat: 'health', delta: -2 }, { stat: 'happiness', delta: 1 }, { log: 'I bought a cane with a carved duck for a handle. The hip still hurts. The duck is magnificent.' }],
      },
      {
        id: 'ignore',
        label: 'Walk it off',
        effects: [
          {
            random: [
              { weight: 4, effects: [{ stat: 'health', delta: -1 }, { stat: 'happiness', delta: 2 }, { log: 'The hip and I reached an understanding: it aches when it rains, and I stay in when it rains.' }] },
              { weight: 4, effects: [{ stat: 'health', delta: -5 }, { stat: 'happiness', delta: -2 }, { log: 'I limp now, with great dignity, and refuse to discuss it.' }] },
              { weight: 2, effects: [{ injury: 6 }, { stat: 'happiness', delta: -4 }, { log: 'I walked it off until a fall in the parking lot settled the argument for me.', kind: 'bad' }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'gy_glasses_on_head',
    category: 'random',
    title: 'The search',
    text: 'I spent twenty minutes hunting for my reading glasses: drawers, every pocket, the fridge. {{person}} watched the entire search before mentioning that they were on top of my head.',
    minAge: 60,
    maxAge: 105,
    weight: 1.2,
    cooldown: 6,
    person: { kind: ['spouse', 'child', 'friend', 'bestFriend', 'sibling'] },
    choices: [
      {
        id: 'laugh',
        label: 'Laugh at myself',
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 2 }, { log: 'I laughed until I needed the glasses to wipe my eyes. Which were, conveniently, right there.' }],
      },
      {
        id: 'pairs',
        label: 'Buy five more pairs',
        hint: '{{$50}}',
        effects: [{ money: -50 }, { stat: 'happiness', delta: 3 }, { log: 'There is a pair in every room now. I still cannot find any of them, but I am statistically close.' }],
      },
      {
        id: 'chain',
        label: 'Get a chain for them',
        hint: '{{$15}}',
        effects: [{ money: -15 }, { stat: 'looks', delta: -1 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 2 }, { log: 'The glasses hang on a chain now. I look like a librarian in a film, and I never lose them.' }],
      },
      {
        id: 'blame',
        label: 'Blame {{person}} for watching',
        effects: [{ relationship: 'person', delta: -3 }, { karma: -1 }, { stat: 'happiness', delta: 3 }, { log: '{{person}} should have said something sooner, I said. {{They}} said watching was more fun.' }],
      },
    ],
  },

  // ------------------------------------------------------------ ninety and up
  {
    id: 'gy_oldest_at_party',
    category: 'elderly',
    title: 'The oldest one here',
    text: 'At the street party, the organizer handed me the microphone and announced I was the oldest person there. Everyone clapped as if I had done it on purpose. A child asked me what dinosaurs were like.',
    minAge: 90,
    maxAge: 110,
    weight: 1.5,
    cooldown: 5,
    choices: [
      {
        id: 'speech',
        label: 'Give a short speech',
        effects: [{ energy: -1 }, { fame: 1 }, { stat: 'happiness', delta: 4 }, { log: 'I said the secret is to keep moving and avoid ladders. Several people wrote it down, wrongly.' }],
      },
      {
        id: 'dinosaurs',
        label: 'Describe the dinosaurs',
        effects: [{ karma: -1 }, { stat: 'happiness', delta: 5 }, { log: 'I told the child the dinosaurs were polite but terrible at parking. The child believed every word.' }],
      },
      {
        id: 'dance',
        label: 'Ask someone to dance',
        effects: [
          { stat: 'happiness', delta: 6 },
          {
            chance: 0.2,
            then: [{ injury: 3 }, { log: 'I danced one song beautifully and pulled something on the dip. Worth it.', kind: 'bad' }],
            else: [{ log: 'I danced a slow one in the middle of the street. Everyone watched, and I let them.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'cake',
        label: 'Sit down and accept cake',
        effects: [{ stat: 'happiness', delta: 3 }, { stat: 'health', delta: -1 }, { log: 'I sat in the shade and received cake like a visiting dignitary. The oldest gets the corner piece.' }],
      },
    ],
  },
  {
    id: 'gy_outlived_doctor',
    category: 'health',
    title: 'A new doctor',
    text: 'My doctor of thirty years retired, and then passed away last spring. His replacement read my file, looked up at me, looked back at the file, and asked if I would mind being written up in a journal.',
    minAge: 92,
    maxAge: 110,
    weight: 1.5,
    once: true,
    choices: [
      {
        id: 'journal',
        label: 'Agree to be studied',
        effects: [{ energy: -1 }, { fame: 3 }, { stat: 'happiness', delta: 3 }, { log: "Six appointments later I am 'Patient F' in a journal. I have told everyone, which ruins the point." }],
      },
      {
        id: 'secret',
        label: 'Reveal the secret',
        effects: [{ karma: -1 }, { stat: 'happiness', delta: 4 }, { log: 'I said the secret was a spoonful of jam every morning. A study on jam may follow.' }],
      },
      {
        id: 'decline',
        label: 'Decline politely',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I declined. My body has been studied enough, mostly by me, mostly in the mirror.' }],
      },
      {
        id: 'advice',
        label: 'Give the young doctor advice',
        effects: [{ karma: 2 }, { stat: 'smarts', delta: 1 }, { log: 'I told the doctor to sleep more and worry less. He laughed, then went quiet, then thanked me.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'gy_last_of_class',
    category: 'elderly',
    title: 'The last one',
    text: 'My old school wrote to say that, as far as they can tell, I am the last living member of my class. They would like a photo for the newsletter, and they asked, very gently, for it soon.',
    minAge: 95,
    maxAge: 110,
    weight: 2,
    once: true,
    choices: [
      {
        id: 'photo',
        label: 'Send a good photo',
        effects: [{ fame: 1 }, { stat: 'happiness', delta: 3 }, { log: "I sent a photo in my good sweater. The newsletter called me 'a link to our past'. I am a link." }],
      },
      {
        id: 'visit',
        label: 'Visit the school',
        effects: [{ energy: -1 }, { fame: 2 }, { karma: 1 }, { stat: 'happiness', delta: 6 }, { log: 'I visited my old classroom. The children asked if there were cars back then. I said some.', kind: 'good' }],
      },
      {
        id: 'letter',
        label: 'Write to the students',
        effects: [{ karma: 3 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 3 }, { log: 'I wrote the students a letter: be kind, eat breakfast, call home. It is on a bulletin board now.', kind: 'good' }],
      },
      {
        id: 'quiet',
        label: 'Keep it to myself',
        effects: [{ stat: 'happiness', delta: 4 }, { log: 'I put the letter away and said every name in my class out loud, one by one. It took a while.' }],
      },
    ],
  },
  {
    id: 'gy_mayor_letter',
    category: 'elderly',
    title: 'One hundred',
    text: "A letter came from the mayor's office congratulating me on turning one hundred. It is signed, almost by hand, and invites me to City Hall for a photograph with the mayor and a ceremonial cake.",
    minAge: 100,
    maxAge: 100,
    weight: 5,
    once: true,
    choices: [
      {
        id: 'go',
        label: 'Go to City Hall',
        effects: [{ energy: -1 }, { fame: 4 }, { stat: 'happiness', delta: 6 }, { log: 'The mayor and I posed with a cake shaped like a one and two zeros. I ate the first zero.', kind: 'milestone' }],
      },
      {
        id: 'summon',
        label: 'Make the mayor come to me',
        effects: [
          { fame: 3 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 6 }, { log: 'The mayor came to my living room with a photographer and the cake. A hundred years buys leverage.', kind: 'milestone' }],
            else: [{ stat: 'happiness', delta: 3 }, { log: 'The mayor sent a deputy and a smaller cake. I accepted both graciously.', kind: 'milestone' }],
          },
        ],
      },
      {
        id: 'potholes',
        label: 'Reply about the potholes',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: 3 }, { log: 'I thanked the mayor and enclosed a list of potholes. Three were fixed by spring. Age has power.', kind: 'milestone' }],
      },
      {
        id: 'frame',
        label: 'Frame it quietly',
        effects: [{ stat: 'happiness', delta: 4 }, { log: 'I framed the letter and hung it by the door, where the mail carrier can see it every day.', kind: 'milestone' }],
      },
    ],
  },

  // ------------------------------------------------------------ an old record
  {
    id: 'gy_record_grandkid_questions',
    category: 'family',
    title: 'Secret handshakes',
    text: '{{person}} heard about my criminal record from a cousin and came straight to me with questions. Was I in a gang? Did I have a nickname? Do I still know any secret handshakes?',
    minAge: 60,
    maxAge: 100,
    weight: 1.2,
    once: true,
    conditions: [{ criminalRecord: true }],
    person: { kind: ['grandchild'], minAge: 7, maxAge: 16 },
    choices: [
      {
        id: 'truth',
        label: 'Tell the plain truth',
        effects: [{ karma: 3 }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: -1 }, { log: 'I told {{person}} the plain truth: bad choices, real consequences, no secret handshakes.', kind: 'good' }],
      },
      {
        id: 'tale',
        label: 'Spin a wild tale',
        effects: [{ karma: -2 }, { stat: 'happiness', delta: 4 }, { relationship: 'person', delta: 3 }, { relationship: 'child', delta: -4 }, { log: 'I described a getaway with a laundry cart and a goose. {{person}} loved it. The parents did not.' }],
      },
      {
        id: 'lesson',
        label: 'Make it a life lesson',
        effects: [
          { energy: -1 },
          { karma: 2 },
          { stat: 'smarts', delta: 1 },
          { relationship: 'person', delta: 2 },
          {
            chance: 0.5,
            then: [{ log: 'I made it a lesson about choices. {{person}} fell asleep halfway through. Lessons are like that.' }],
            else: [{ stat: 'happiness', delta: 3 }, { log: 'I made it a lesson about choices. A month later {{person}} repeated it back to me, word for word.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'dodge',
        label: 'Change the subject',
        effects: [{ relationship: 'person', delta: -1 }, { stat: 'happiness', delta: 1 }, { log: 'I changed the subject to ice cream. It worked, but the question is only resting.' }],
      },
    ],
  },
  {
    id: 'gy_record_old_associate',
    category: 'crime',
    title: 'By the coffee urn',
    text: 'A man from my bad old days turned up at the senior center with a walker and a church group. He remembers everything I ever did, in detail, and he likes to reminisce loudly by the coffee urn.',
    minAge: 65,
    maxAge: 95,
    weight: 1,
    once: true,
    conditions: [{ criminalRecord: true }, { inPrison: false }],
    choices: [
      {
        id: 'corner',
        label: 'Reminisce quietly in a corner',
        effects: [
          {
            random: [
              { weight: 5, effects: [{ stat: 'happiness', delta: 3 }, { newPerson: { kind: 'friend', relationship: 45, minAge: 60, maxAge: 95, gender: 'male', log: '{{person}}, my old partner in trouble, is my checkers partner now. Fewer lawyers, same jokes.' } }] },
              { weight: 3, effects: [{ stat: 'happiness', delta: 3 }, { log: 'We swapped stories in the corner. Mine have shrunk with age. His have grown.' }] },
              { weight: 2, effects: [{ stat: 'happiness', delta: -3 }, { log: 'The church group overheard the part about the warehouse. They pray for me now, loudly.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'deny',
        label: 'Pretend not to know him',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'I said he had me mixed up with someone else. He took the hint. Nobody at the urn suspected a thing.' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I said he had me confused with someone else. He winked, loudly. Everyone at the urn noticed.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'church',
        label: 'Join his church group',
        effects: [{ energy: -1 }, { karma: 4 }, { stat: 'happiness', delta: 2 }, { log: 'I joined his group. We visit the sick on Tuesdays. Old sins, new habits.', kind: 'good' }],
      },
      {
        id: 'job',
        label: "Hear out his 'one last job'",
        effects: [
          { karma: -4 },
          {
            chance: 0.4,
            then: [{ arrest: true }, { money: -2000 }, { stat: 'happiness', delta: -10 }, { log: 'The last job was a sting. At my age the handcuffs came with a chair, and a {{$2000}} fine.', kind: 'bad' }],
            else: [{ money: 1500 }, { counter: 'crimes' }, { stat: 'happiness', delta: 2 }, { log: 'Two old-timers in cardigans, and we pulled it off. I felt alive, then terrified for a month.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gy_record_youth_talk',
    category: 'crime',
    title: 'From someone real',
    text: 'A youth worker at the community center asked me to talk to a group of teenagers about my time in prison. She says they need to hear it from someone real. Half of them are already on their phones.',
    minAge: 60,
    maxAge: 95,
    weight: 1,
    once: true,
    conditions: [{ criminalRecord: true }, { count: 'yearsInPrison', gte: 1 }],
    choices: [
      {
        id: 'straight',
        label: 'Tell it straight',
        effects: [
          { energy: -1 },
          { karma: 5 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.5,
            then: [{ log: 'One boy stayed behind to ask how I stayed out. We talked for an hour. I hope it took.', kind: 'good' }],
            else: [{ log: 'They listened politely and filed out. I will never know if it landed, and that is the job.' }],
          },
        ],
      },
      {
        id: 'scare',
        label: 'Try to scare them',
        effects: [
          { karma: 2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'I described the food inside in detail. One girl went pale. Mission accomplished, I think.' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I tried to frighten them and they laughed at my old slang. Respect needs new words.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'monthly',
        label: 'Come back every month',
        effects: [{ energy: -2 }, { karma: 6 }, { stat: 'happiness', delta: 4 }, { stat: 'health', delta: -1 }, { log: "I go back every month now. The kids call me 'the old-timer'. I have been called worse.", kind: 'good' }],
      },
      {
        id: 'decline',
        label: 'Decline',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I said no. Some stories I would rather not tell twice, even to help.' }],
      },
    ],
  },

  // ------------------------------------------------------------ grown children, grandkids
  {
    id: 'gy_living_history',
    category: 'family',
    title: 'Living history',
    text: "{{person}} is doing a school project called Living History, and I am the history. There is a list of questions and a recorder. Question one: 'What was it like before electricity?'",
    minAge: 60,
    maxAge: 95,
    weight: 1.2,
    once: true,
    person: { kind: ['grandchild'], minAge: 8, maxAge: 14 },
    choices: [
      {
        id: 'honest',
        label: 'Answer every question honestly',
        effects: [{ energy: -1 }, { relationship: 'person', delta: 3 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 4 }, { log: 'I told the truth, including that we had electricity. The project got an A. I take full credit.', kind: 'good' }],
      },
      {
        id: 'bear',
        label: 'Make it more exciting',
        effects: [
          { karma: -1 },
          { stat: 'happiness', delta: 5 },
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: -2 }, { log: 'My story about wrestling a bear at recess got the project marked down. Worth it.' }],
            else: [{ log: 'I added a bear. The teacher loved the bear. The grade was excellent.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'photos',
        label: 'Bring out the old photos',
        effects: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 3 }, { log: 'We went through boxes of old photos. {{person}} laughed at my hair for twenty minutes straight.' }],
      },
      {
        id: 'current',
        label: "Insist I'm not history yet",
        effects: [{ relationship: 'person', delta: -1 }, { stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 3 }, { log: 'I said I am not history, I am current events. {{person}} used that as the title.' }],
      },
    ],
  },
  {
    id: 'gy_grandkid_driving',
    category: 'family',
    title: 'Practice hours',
    text: '{{person}} needs practice hours before the driving test, and I am the only adult in the family brave or foolish enough to sit in the passenger seat. The car is mine. So is the risk.',
    minAge: 60,
    maxAge: 90,
    weight: 1,
    once: true,
    conditions: [{ ownsAssetId: REAL_CAR }, { not: { flag: 'gy_stopped_driving' } }],
    // Old enough to be near a driving test almost everywhere (16-18 by country).
    person: { kind: ['grandchild'], minAge: 17, maxAge: 19 },
    choices: [
      {
        id: 'calm',
        label: 'Stay calm and teach',
        effects: [
          { energy: -1 },
          { relationship: 'person', delta: 6 },
          { karma: 2 },
          {
            chance: 0.2,
            then: [{ money: -400 }, { log: 'We hit the recycling bins once. A {{$400}} bumper later, {{person}} passed anyway.' }],
            else: [{ stat: 'happiness', delta: 4 }, { log: 'Twelve lessons, two gray hairs, one pass. {{person}} hugged me in the test center lot.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'highway',
        label: 'Go straight to the highway',
        effects: [
          { relationship: 'person', delta: 8 },
          {
            chance: 0.3,
            then: [{ money: -800 }, { stat: 'happiness', delta: -5 }, { log: 'The highway lesson ended in a scrape with a guardrail. Everyone is fine except the bumper.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: 5 }, { log: 'We merged, passed a truck and lived. {{person}} drives better than I do now.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'lot',
        label: 'Empty parking lots only',
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'We drove slow circles in the mall lot every Sunday. Safe, and deeply boring for both of us.' }],
      },
      {
        id: 'no',
        label: 'Say my nerves cannot',
        effects: [{ relationship: 'person', delta: -3 }, { stat: 'health', delta: 1 }, { log: 'I said my nerves could not take it. {{person}} learned with an instructor and a calmer car.' }],
      },
    ],
  },
  {
    id: 'gy_great_grandchild',
    category: 'family',
    title: 'Great',
    text: "{{person}} called with news: a baby is on the way, which makes me a great-grandparent. I said 'great' four times in a row before I realized it was the actual word.",
    minAge: 72,
    maxAge: 105,
    weight: 1,
    once: true,
    person: { kind: ['grandchild'], minAge: 20 },
    choices: [
      {
        id: 'knit',
        label: 'Make something for the baby',
        hint: '{{$40}}',
        effects: [{ money: -40 }, { energy: -1 }, { relationship: 'person', delta: 4 }, { karma: 1 }, { stat: 'happiness', delta: 5 }, { log: 'I knitted a blanket with a great deal of character. It will be loved anyway, I am told.', kind: 'good' }],
      },
      {
        id: 'fund',
        label: 'Start a savings fund',
        hint: '{{$1000}}',
        effects: [{ money: -1000 }, { relationship: 'person', delta: 6 }, { karma: 2 }, { log: 'I opened a savings account for the baby. By the time it grows up, it may buy a sandwich.' }],
      },
      {
        id: 'visit',
        label: 'Plan a visit',
        hint: '{{$300}}',
        effects: [{ money: -300 }, { energy: -1 }, { relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 7 }, { log: 'When the baby came, I held it for an hour and would not give it back. Four generations, one photo.', kind: 'milestone' }],
      },
      {
        id: 'old',
        label: 'Sit with feeling ancient',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -2 }, { log: 'Great-grandparent. I sat down with that for a while. Then I got up and bought a tiny hat.' }],
      },
    ],
  },
  {
    id: 'gy_car_keys',
    category: 'family',
    title: 'The keys',
    text: '{{person}} sat me down at the kitchen table with a cup of tea and a speech. It is about my driving, the mailbox I clipped last month, and whether it might be time to hand over the keys.',
    minAge: 82,
    maxAge: 105,
    weight: 1.2,
    once: true,
    conditions: [{ ownsAssetId: REAL_CAR }],
    person: { kind: ['child'], minAge: 40 },
    choices: [
      {
        id: 'hand',
        label: 'Hand over the keys',
        effects: [{ flag: 'gy_stopped_driving', set: true }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: -6 }, { log: 'I put the keys on the table. {{person}} cried a little. I did not, until later.' }],
      },
      {
        id: 'test',
        label: 'Agree to a driving test',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 6 }, { log: 'I passed the senior driving test with one wide turn. {{person}} has dropped the subject.', kind: 'good' }],
            else: [{ flag: 'gy_stopped_driving', set: true }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: -5 }, { log: 'I failed on a left turn I have made ten thousand times. The keys live in a drawer now.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'daylight',
        label: 'Offer to drive only by day',
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: -1 }, { log: 'We agreed: daylight only, no highways, no rush hour. I am a part-time driver now.' }],
      },
      {
        id: 'refuse',
        label: 'Refuse flatly',
        effects: [
          { relationship: 'person', delta: -8 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.2,
            then: [{ flag: 'gy_stopped_driving', set: true }, { injury: 6 }, { money: -1500 }, { log: 'Two months later I backed into a parked van. Nobody else was hurt. I handed over the keys myself.', kind: 'bad' }],
            else: [{ log: 'I refused. {{person}} now inspects my bumper for new scratches at every visit.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'gy_still_a_kid',
    category: 'family',
    title: 'Wear a hat',
    text: '{{person}} called to remind me to wear a hat, eat something green and not drive after dark. I am {{age}} years old. Apparently that has never been the point.',
    minAge: 60,
    maxAge: 78,
    weight: 1.5,
    cooldown: 5,
    person: { kind: ['mother', 'father'], minAge: 80 },
    choices: [
      {
        id: 'promise',
        label: 'Promise to wear the hat',
        effects: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 2 }, { log: 'I promised. I did not wear the hat. {{person}} knew, the way {{they}} always knows.' }],
      },
      {
        id: 'remind',
        label: 'Remind {{them}} how old I am',
        effects: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: 3 }, { log: 'I said I was {{age}}. {{person}} said that is exactly the age people catch their death.' }],
      },
      {
        id: 'visit',
        label: 'Go visit {{them}}',
        effects: [{ energy: -1 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 4 }, { log: '{{person}} fed me until I could not move. I wore the hat, and {{they}} noticed.', kind: 'good' }],
      },
      {
        id: 'soup',
        label: 'Ask for the soup recipe',
        effects: [{ relationship: 'person', delta: 5 }, { stat: 'smarts', delta: 1 }, { log: '{{person}} gave me the soup recipe, all of it except one secret step. Still.' }],
      },
    ],
  },
];

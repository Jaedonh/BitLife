import type { Condition, PersonSelector } from '@/engine/events/schema';

/**
 * One-line, no-choice journal text (src/engine/systems/flavor.ts picks one a year). {{placeholders}} supported.
 * A generic line has only an age range and fills a quiet year. A situational line adds `conditions` (the event DSL)
 * and/or a `person` to bind for {{person}}/{{they}}...; it is only written while that situation held all year, is
 * three times as likely as a generic line, and can also join a year that already has other lines.
 */
export interface FlavorLine {
  minAge: number;
  maxAge: number;
  text: string;
  conditions?: Condition[];
  person?: PersonSelector;
  /** Says the year was uneventful; only written in a year with no other journal lines and no event card. */
  quiet?: boolean;
}

/** Shared situations for the situational lines below. */
const IN_PRISON: Condition[] = [{ inPrison: true }];
const AT_UNIVERSITY: Condition[] = [{ enrolled: true }, { stage: ['university'] }];
const IN_GRAD_SCHOOL: Condition[] = [{ enrolled: true }, { stage: ['graduate'] }];
const RETIRED: Condition[] = [{ retired: true }, { hasJob: false }, { enrolled: false }];
const OUT_OF_WORK: Condition[] = [{ hasJob: false }, { enrolled: false }, { retired: false }];
/** Out of work and looking: not someone whose side hustle has become a living (level 3+). */
const JOB_HUNTING: Condition[] = [...OUT_OF_WORK, { any: [{ hustle: false }, { hustleLevel: { lte: 2 } }] }];
const UNDERWATER: Condition[] = [{ netWorth: { lt: 0 } }];
const HUSTLE_STALLED: Condition[] = [{ hustleLevel: { eq: 0 } }];
const SINGLE_PARENT: Condition[] = [{ married: false }, { hasLover: false }];
const GRANDPARENT: Condition[] = [{ flag: 'grandparent' }];
const SPOUSE: PersonSelector = { kind: ['spouse'] };
const PET: PersonSelector = { kind: ['pet'] };

export const FLAVOR: readonly FlavorLine[] = [
  { minAge: 0, maxAge: 1, text: 'I discovered my own feet and found them hilarious.' },
  { minAge: 0, maxAge: 1, text: 'I slept, ate, and cried on a schedule only I understood.' },
  { minAge: 1, maxAge: 2, text: 'I said my first word. Nobody agrees on what it was.' },
  { minAge: 1, maxAge: 3, text: 'I drew on the wall. It was a masterpiece. It was painted over.' },
  { minAge: 2, maxAge: 4, text: 'I refused to eat anything green for most of the year.' },
  { minAge: 2, maxAge: 5, text: 'I had an imaginary friend who was, frankly, a bad influence.' },
  { minAge: 4, maxAge: 7, text: 'I learned to ride a bike and immediately rode it into a hedge.' },
  { minAge: 5, maxAge: 8, text: 'I lost a tooth and negotiated hard with the tooth fairy.' },
  { minAge: 5, maxAge: 9, text: 'I built a fort in the living room and declared independence.' },
  { minAge: 6, maxAge: 10, text: 'I won a participation certificate and treated it like a Nobel Prize.' },
  { minAge: 6, maxAge: 11, text: 'I became briefly obsessed with dinosaurs.' },
  { minAge: 7, maxAge: 12, text: 'I was picked last for a team. I remember it more than I should.' },
  { minAge: 8, maxAge: 12, text: 'I learned a magic trick and performed it for anyone who would sit still.' },
  { minAge: 9, maxAge: 13, text: 'I had a growth spurt and none of my clothes fit.' },
  { minAge: 10, maxAge: 14, text: 'I discovered music that my parents hated. This was the point.' },
  { minAge: 11, maxAge: 15, text: 'I got a terrible haircut and wore a hat for a month.' },
  { minAge: 12, maxAge: 16, text: 'I had my first real crush and handled it with zero grace.' },
  { minAge: 13, maxAge: 17, text: 'I slammed a door so hard the frame came loose.' },
  { minAge: 13, maxAge: 18, text: 'I stayed up all night and felt invincible until noon.' },
  { minAge: 14, maxAge: 18, text: 'I started a band that never played a single show.' },
  { minAge: 16, maxAge: 19, text: 'I learned to drive. The car survived.' },
  { minAge: 16, maxAge: 22, text: 'I reinvented my entire personality over one summer.' },
  { minAge: 17, maxAge: 24, text: 'I ate instant noodles for dinner more nights than I\'d admit.' },
  { minAge: 18, maxAge: 25, text: 'I made a five-year plan and lost it within a week.' },
  { minAge: 18, maxAge: 30, text: 'I moved the same couch up three flights of stairs for a friend.' },
  { minAge: 20, maxAge: 30, text: 'I went to a wedding and cried more than the couple.' },
  { minAge: 20, maxAge: 35, text: 'I tried a new hobby, bought all the gear, and quit in a month.' },
  { minAge: 26, maxAge: 40, text: 'I found a gray hair and spent the evening thinking about mortality.' },
  { minAge: 24, maxAge: 45, text: 'I finally fixed the thing in the kitchen that had been broken for years.' },
  { minAge: 25, maxAge: 40, text: 'I ran into an old classmate and pretended to remember their name.' },
  { minAge: 25, maxAge: 50, text: 'I spent an entire weekend assembling furniture and had three screws left over.' },
  { minAge: 28, maxAge: 50, text: 'I threw out my back reaching for something unimportant.' },
  { minAge: 30, maxAge: 55, text: 'I discovered I now enjoy gardening. This was unexpected.' },
  { minAge: 30, maxAge: 60, text: 'I had a great year. Nothing happened, which was the point.', quiet: true },
  { minAge: 35, maxAge: 60, text: 'I became the person who complains about the music being too loud.' },
  { minAge: 35, maxAge: 65, text: 'I went to a reunion. Everyone had changed except me, obviously.' },
  { minAge: 40, maxAge: 65, text: 'I started wearing reading glasses and losing them twice a day.' },
  { minAge: 40, maxAge: 70, text: 'I organized the garage. It was my greatest achievement of the year.', quiet: true },
  { minAge: 45, maxAge: 75, text: 'I told a story at dinner that everyone had heard before. They let me finish.' },
  { minAge: 50, maxAge: 80, text: 'I took up walking in the mornings and judging other people\'s lawns.' },
  { minAge: 55, maxAge: 85, text: 'I fell asleep in front of the TV and woke up with strong opinions.' },
  { minAge: 60, maxAge: 90, text: 'I learned to use a new phone, mostly.' },
  { minAge: 60, maxAge: 95, text: 'I spent the year telling younger people how things used to cost less.', quiet: true },
  { minAge: 65, maxAge: 100, text: 'I found a photo of myself at twenty and barely recognized that person.' },
  { minAge: 70, maxAge: 110, text: 'I outlived my doctor\'s predictions and made sure they knew it.' },
  { minAge: 75, maxAge: 120, text: 'I was asked for my secret to a long life. I said, "Spite."' },
  { minAge: 80, maxAge: 120, text: 'I had cake. Nobody could stop me.' },
  { minAge: 4, maxAge: 120, text: 'It rained a lot this year, or maybe I just remember the rain.', quiet: true },
  { minAge: 5, maxAge: 120, text: 'I had a dream so vivid I spent the morning confused.' },
  { minAge: 10, maxAge: 120, text: 'I got into an argument with a stranger about something that didn\'t matter.' },
  { minAge: 12, maxAge: 120, text: 'I lost my keys and found them somewhere absurd.' },
  { minAge: 16, maxAge: 120, text: 'I meant to call someone back. I still haven\'t.' },
  // ------------------------------------------------------------ situational: prison (adult)
  { minAge: 18, maxAge: 120, conditions: IN_PRISON, text: 'I learned which guard hums when the day is going well. It is the most useful thing I know now.' },
  { minAge: 18, maxAge: 120, conditions: IN_PRISON, text: 'I read every book in the prison library, including the one about knots. Twice.' },
  { minAge: 18, maxAge: 120, conditions: IN_PRISON, text: 'I wrote letters I never sent. Paper was free in here, and time was the one thing I had plenty of.' },
  { minAge: 18, maxAge: 120, conditions: IN_PRISON, text: "My cellmate snored in a steady rhythm. By spring I couldn't fall asleep without it." },
  { minAge: 18, maxAge: 120, conditions: IN_PRISON, text: 'I got good at chess in the yard. Nobody on my block will play me anymore.' },
  { minAge: 18, maxAge: 120, conditions: IN_PRISON, text: 'The food in here has exactly one flavor. I call it Tuesday.' },
  { minAge: 18, maxAge: 120, conditions: IN_PRISON, text: 'I started a tomato patch by the yard fence. The tomatoes and I both did our time.' },
  { minAge: 18, maxAge: 120, conditions: IN_PRISON, text: 'I marked the days on my wall in neat little rows. It is a very organized wall now.' },
  // ------------------------------------------------------------ situational: locked up as a minor (juvenile detention)
  { minAge: 12, maxAge: 17, conditions: IN_PRISON, text: 'Lights out at nine. I was {{age}} and had a bedtime again.' },
  { minAge: 12, maxAge: 17, conditions: IN_PRISON, text: 'I did my homework at a bolted-down desk. My grades went up, which felt unfair to everyone.' },
  { minAge: 12, maxAge: 17, conditions: IN_PRISON, text: 'A counselor asked what I wanted to be when I got out. I said, "Out." She wrote it down.' },
  { minAge: 12, maxAge: 17, conditions: IN_PRISON, text: "I missed my own bed, my own snacks and, to my surprise, my family's terrible jokes." },
  { minAge: 12, maxAge: 17, conditions: IN_PRISON, text: 'Everyone in my unit swore they were innocent. I started believing about half of them.' },
  // ------------------------------------------------------------ situational: university
  { minAge: 17, maxAge: 70, conditions: AT_UNIVERSITY, text: 'I learned to cook three meals. All of them were pasta.' },
  { minAge: 17, maxAge: 70, conditions: AT_UNIVERSITY, text: 'My roommate and I fought a silent war over the dishes. The dishes won.' },
  { minAge: 17, maxAge: 70, conditions: AT_UNIVERSITY, text: 'I signed up for a class at eight in the morning. I attended it in spirit.' },
  { minAge: 17, maxAge: 70, conditions: AT_UNIVERSITY, text: 'I joined a club for the free pizza and stayed for the free pizza.' },
  { minAge: 17, maxAge: 70, conditions: AT_UNIVERSITY, text: 'I paid a small fortune for a textbook and opened it twice.' },
  { minAge: 17, maxAge: 70, conditions: AT_UNIVERSITY, text: 'I handed in an essay four minutes before the deadline and called it time management.' },
  { minAge: 17, maxAge: 70, conditions: AT_UNIVERSITY, text: 'I spent a whole night arguing about the meaning of life. We settled nothing and had cereal.' },
  // ------------------------------------------------------------ situational: graduate school
  { minAge: 21, maxAge: 80, conditions: IN_GRAD_SCHOOL, text: 'I explained my work to my family at dinner. They nodded the way people nod at weather reports.' },
  { minAge: 21, maxAge: 80, conditions: IN_GRAD_SCHOOL, text: 'I studied in the library so late that the night guard started saving me a seat.' },
  { minAge: 21, maxAge: 80, conditions: IN_GRAD_SCHOOL, text: 'My study group turned into a support group by the third week. We still studied, sometimes.' },
  { minAge: 21, maxAge: 80, conditions: IN_GRAD_SCHOOL, text: 'Relatives kept asking when I would be finished with school. So did I.' },
  { minAge: 21, maxAge: 80, conditions: IN_GRAD_SCHOOL, text: 'I lived on coffee, cold pizza and the hope that all of this would be worth it.' },
  // ------------------------------------------------------------ situational: retirement
  { minAge: 65, maxAge: 120, conditions: RETIRED, text: "Retirement suits me. I haven't set an alarm in years, and I still wake up at six." },
  { minAge: 65, maxAge: 120, conditions: RETIRED, text: 'I joined a walking group. We walk for ten minutes and talk for two hours.' },
  { minAge: 65, maxAge: 120, conditions: RETIRED, text: 'I finally had time for all my hobbies and found out I only had one.' },
  { minAge: 65, maxAge: 120, conditions: RETIRED, text: 'Without work, the days of the week lost their names. I tell them apart by the trash pickup.' },
  { minAge: 65, maxAge: 120, conditions: RETIRED, text: 'My old coworkers took me to lunch. I talked about my garden for an hour and regret nothing.' },
  { minAge: 65, maxAge: 120, conditions: RETIRED, text: 'I volunteered at the library and reorganized a shelf nobody asked me to touch.' },
  // ------------------------------------------------------------ situational: a long marriage
  { minAge: 20, maxAge: 120, person: SPOUSE, conditions: [{ yearsMarried: { eq: 10 } }], text: 'Ten years married to {{person}}. We had the same dinner we had on our first date.' },
  { minAge: 20, maxAge: 120, person: SPOUSE, conditions: [{ yearsMarried: { eq: 10 } }], text: '{{person}} and I reached ten years of marriage. We still disagree about the dishwasher.' },
  { minAge: 20, maxAge: 120, person: SPOUSE, conditions: [{ yearsMarried: { eq: 25 } }], text: 'Twenty-five years with {{person}}. They call it silver. We just call it us.' },
  { minAge: 20, maxAge: 120, person: SPOUSE, conditions: [{ yearsMarried: { eq: 25 } }], text: 'Our silver anniversary. {{person}} gave a toast, and I cried at the part about the car.' },
  { minAge: 20, maxAge: 120, person: SPOUSE, conditions: [{ yearsMarried: { eq: 40 } }], text: 'Forty years married. {{person}} still laughs at my jokes, or is very good at pretending.' },
  { minAge: 20, maxAge: 120, person: SPOUSE, conditions: [{ yearsMarried: { eq: 40 } }], text: '{{person}} and I spent our fortieth anniversary doing what we always do on Sundays. Perfect.' },
  { minAge: 20, maxAge: 120, person: SPOUSE, conditions: [{ yearsMarried: { gte: 15 } }], text: '{{person}} finished my sentences all year. Usually wrong, always with confidence.' },
  { minAge: 20, maxAge: 120, person: SPOUSE, conditions: [{ yearsMarried: { gte: 30 } }], text: '{{person}} and I can now have an entire argument without saying a word.' },
  // ------------------------------------------------------------ situational: pets
  { minAge: 6, maxAge: 120, person: PET, text: '{{person}} slept in my spot all year and showed no remorse.' },
  { minAge: 6, maxAge: 120, person: PET, text: 'I told {{person}} about my day most evenings. {{They}} is an excellent listener.' },
  { minAge: 10, maxAge: 120, person: PET, text: '{{person}} has a schedule, and I live on it.' },
  { minAge: 6, maxAge: 120, person: PET, text: "Every time I came home, {{person}} acted like I'd been gone for years." },
  { minAge: 18, maxAge: 120, person: PET, text: "I spent more on {{person}}'s food this year than on my own. I regret nothing." },
  { minAge: 6, maxAge: 120, person: PET, text: "{{person}} got into something {{they}} shouldn't have. Again. I wasn't even surprised." },
  // ------------------------------------------------------------ situational: living with a chronic illness
  { minAge: 35, maxAge: 120, conditions: [{ hasIllness: ['arthritis'] }], text: 'My knees started forecasting rain better than the weather report.' },
  { minAge: 35, maxAge: 120, conditions: [{ hasIllness: ['arthritis'] }], text: 'Arthritis turned every jar lid into a negotiation. I lost most of them.' },
  { minAge: 25, maxAge: 120, conditions: [{ hasIllness: ['back_pain'] }], text: 'My back and I made a deal: no heavy lifting, no twisting, no sudden enthusiasm.' },
  { minAge: 10, maxAge: 120, conditions: [{ hasIllness: ['diabetes'] }], text: 'I learned the sugar content of everything I love. I love slightly fewer things now.' },
  { minAge: 30, maxAge: 120, conditions: [{ hasIllness: ['hypertension'] }], text: 'I checked my blood pressure every morning. The cuff is the most honest thing I own.' },
  { minAge: 5, maxAge: 120, conditions: [{ hasIllness: ['asthma'] }], text: 'I kept an inhaler in every coat, bag and drawer I own, just in case.' },
  { minAge: 8, maxAge: 120, conditions: [{ hasIllness: ['migraines'] }], text: 'I learned to feel a migraine coming an hour early and cancel my plans with dignity.' },
  { minAge: 12, maxAge: 120, conditions: [{ hasIllness: ['depression'] }], text: 'Some days were heavy. I got through them one small thing at a time.' },
  { minAge: 10, maxAge: 120, conditions: [{ hasIllness: ['anxiety'] }], text: 'I made a list of everything I worry about, then worried I had left something off.' },
  { minAge: 40, maxAge: 120, conditions: [{ hasIllness: ['hearing_loss'] }], text: 'I said "pardon?" so often this year that people started saying it back to me.' },
  { minAge: 35, maxAge: 120, conditions: [{ hasIllness: ['heart_disease'] }], text: 'My cardiologist and I are on a first-name basis. I wish we had met some other way.' },
  { minAge: 12, maxAge: 120, conditions: [{ hasIllness: ['cancer'] }], text: 'I learned the names of every nurse on my ward, and the names of their kids.' },
  { minAge: 50, maxAge: 120, conditions: [{ hasIllness: ['dementia'] }], text: 'Some days the names come easily. On those days I write everything down.' },
  { minAge: 45, maxAge: 120, conditions: [{ hasIllness: ['osteoporosis'] }], text: 'My doctor told me to avoid falling. I have added it to my list of goals.' },
  // ------------------------------------------------------------ situational: an addiction getting worse (30+ is where it starts to grow)
  { minAge: 18, maxAge: 120, conditions: [{ addiction: 'alcohol', min: 30 }], text: "I promised myself I'd cut back on drinking after the holidays. Then after my birthday." },
  { minAge: 18, maxAge: 120, conditions: [{ addiction: 'alcohol', min: 30 }], text: 'I started hiding bottles from myself. I always found them.' },
  { minAge: 18, maxAge: 120, conditions: [{ addiction: 'drugs', min: 30 }], text: "The habit cost me more every month: money, friends and whole weekends I can't remember." },
  { minAge: 18, maxAge: 120, conditions: [{ addiction: 'drugs', min: 30 }], text: "I missed a friend's birthday because of the habit. I said I was sick. In a way, I was." },
  // ------------------------------------------------------------ situational: a side hustle going nowhere (level 0 earns nothing)
  { minAge: 14, maxAge: 120, conditions: HUSTLE_STALLED, text: "My side hustle earned exactly nothing this year. I'm calling it a soft launch." },
  { minAge: 14, maxAge: 120, conditions: HUSTLE_STALLED, text: "I spent more on my side hustle than it made. I'm calling it an investment." },
  { minAge: 14, maxAge: 120, conditions: HUSTLE_STALLED, text: "I checked my side hustle's numbers every morning. They did not move." },
  { minAge: 14, maxAge: 120, conditions: HUSTLE_STALLED, text: 'Someone left my side hustle a one-star review. The whole review was one word: "No."' },
  // ------------------------------------------------------------ situational: out of work, in debt
  { minAge: 22, maxAge: 64, conditions: JOB_HUNTING, text: 'I refreshed the job listings so often the website started to look tired of me.' },
  { minAge: 22, maxAge: 64, conditions: JOB_HUNTING, text: 'I got very good at job interviews, in the sense that I went to a lot of them.' },
  { minAge: 18, maxAge: 120, conditions: UNDERWATER, text: 'I opened a letter from the bank, read the first line and put it in a drawer.' },
  { minAge: 18, maxAge: 120, conditions: UNDERWATER, text: "I made a budget. It was mostly a list of things I couldn't afford." },
  { minAge: 18, maxAge: 120, conditions: UNDERWATER, text: 'I owed more than I owned. I did the math twice, hoping it would come out different.' },
  { minAge: 22, maxAge: 64, conditions: [...OUT_OF_WORK, ...UNDERWATER], text: 'My savings ran out before the month did. Again.' },
  { minAge: 22, maxAge: 64, conditions: [...OUT_OF_WORK, ...UNDERWATER], text: 'I learned twelve ways to cook rice and one way to let an unknown number go to voicemail.' },
  // ------------------------------------------------------------ situational: a single parent of young children
  { minAge: 18, maxAge: 120, conditions: SINGLE_PARENT, person: { kind: ['child'], maxAge: 9 }, text: 'I raised {{person}} on my own. Bedtime stories came at the end of long days, but they came.' },
  { minAge: 18, maxAge: 120, conditions: SINGLE_PARENT, person: { kind: ['child'], maxAge: 9 }, text: '{{person}} and I had breakfast for dinner more than once. {{They}} thinks it is a tradition.' },
  { minAge: 18, maxAge: 120, conditions: SINGLE_PARENT, person: { kind: ['child'], maxAge: 3 }, text: 'I learned to do everything one-handed, because the other hand was holding {{person}}.' },
  { minAge: 18, maxAge: 120, conditions: SINGLE_PARENT, person: { kind: ['child'], maxAge: 9 }, text: 'Doing it alone was hard. {{person}} drew me as a superhero anyway.' },
  // ------------------------------------------------------------ situational: a grandparent
  { minAge: 40, maxAge: 120, conditions: GRANDPARENT, text: 'I kept a drawer of candy for the grandchildren and pretended not to know about it.' },
  { minAge: 40, maxAge: 120, conditions: GRANDPARENT, text: 'I showed photos of my grandchildren to anyone who stood still long enough.' },
  { minAge: 40, maxAge: 120, conditions: GRANDPARENT, text: 'Being a grandparent is all the fun and none of the bedtimes. I recommend it.' },
  { minAge: 40, maxAge: 120, conditions: GRANDPARENT, text: 'The grandchildren taught me a dance. I did it badly on purpose, and they loved it.' },
  { minAge: 40, maxAge: 120, conditions: GRANDPARENT, text: 'I spoiled the grandchildren rotten. My own children called it hypocritical. Correctly.' },
  // ------------------------------------------------------------ situational: ninety and over
  { minAge: 90, maxAge: 120, conditions: [{ stat: 'health', gte: 60 }], text: 'My doctor asked for my secret. I said I eat dessert first, which is true.' },
  { minAge: 90, maxAge: 120, conditions: [{ stat: 'happiness', gte: 65 }], text: 'I am in my nineties and cheerful about it. Some people find this suspicious.' },
  { minAge: 90, maxAge: 120, person: { kind: ['spouse'], minAge: 80 }, text: '{{person}} and I sat together most evenings and argued about which of us is older.' },
  { minAge: 90, maxAge: 120, conditions: [{ noPerson: ['spouse', 'lover'] }], text: 'I live alone now. I talk to the radio, and some days it agrees with me.' },
  { minAge: 90, maxAge: 120, conditions: [{ hasChildren: true }], text: 'My children are getting old. I find this harder to believe than anything else.' },
  { minAge: 90, maxAge: 120, conditions: [{ stat: 'smarts', gte: 60 }], text: 'I still did the crossword every morning, in pen, out of pure confidence.' },
];

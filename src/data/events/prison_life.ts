import type { EventDef } from '@/engine/events/schema';

/**
 * Prison life and re-entry. Inside: every event carries { inPrison: true } (prison is its own world),
 * category 'prison', ages 18+. Letters and visits bind a living relative through the person selector so
 * nobody dead or missing writes. Outside: re-entry events need { criminalRecord: true } and
 * { inPrison: false }, plus { count: 'yearsInPrison', gte: 1 } whenever the text says I served time.
 * Plain and humane, never glamorous: no gore, no gambling, alcohol only as a temptation with a cost.
 *
 * Flags shared with crime_and_prison.ts (the parole board reads them):
 *   cp_prison_infraction   (count) write-ups
 *   cp_prison_good_conduct (count) good behavior noted in the file
 * Flags set here:
 *   pl_mentor              (bool)  joined the reentry mentor program
 *   pl_record_petition     (bool)  filed a petition to seal the record (flavor; records are never cleared)
 */
export const PRISON_LIFE_EVENTS: EventDef[] = [
  // ───────────────────────────────── inside: cellmates & the block ─────────────────────────────────
  {
    id: 'pl_new_kid',
    category: 'prison',
    title: 'The new kid',
    text: 'My new cellmate is nineteen, first time inside, and has not stopped pacing since the door shut. I have done enough time to remember doing exactly the same thing.',
    minAge: 25,
    maxAge: 110,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: true }, { count: 'yearsInPrison', gte: 2 }],
    choices: [
      {
        id: 'ropes_m',
        conditions: [{ gender: 'male' }],
        label: 'Show the kid the ropes',
        effects: [
          { karma: 3 },
          {
            chance: 0.7,
            then: [
              { stat: 'happiness', delta: 4 },
              { log: 'I explained the count, the chow line and which guards to leave alone. It helped us both.', kind: 'good' },
              { newPerson: { kind: 'friend', relationship: 50, minAge: 19, maxAge: 20, gender: 'male', log: 'The new kid, {{person}}, stopped pacing by the second week. We split the crossword now.' } },
            ],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I explained everything twice. The kid ignored all of it and got our cell searched twice.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'ropes_f',
        conditions: [{ gender: 'female' }],
        label: 'Show the kid the ropes',
        effects: [
          { karma: 3 },
          {
            chance: 0.7,
            then: [
              { stat: 'happiness', delta: 4 },
              { log: 'I explained the count, the chow line and which guards to leave alone. It helped us both.', kind: 'good' },
              { newPerson: { kind: 'friend', relationship: 50, minAge: 19, maxAge: 20, gender: 'female', log: 'The new kid, {{person}}, stopped pacing by the second week. We split the crossword now.' } },
            ],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'I explained everything twice. The kid ignored all of it and got our cell searched twice.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'space',
        label: 'Give the kid space',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I said three rules out loud and let the silence teach the rest. It worked, slowly.', kind: 'info' }],
      },
      {
        id: 'rent',
        label: 'Charge rent in commissary',
        effects: [
          { karma: -4 },
          {
            chance: 0.7,
            then: [{ money: 30 }, { stat: 'happiness', delta: 1 }, { log: 'The kid paid me in noodles and stamps for months. I had become the person I used to hate.', kind: 'bad' }],
            else: [{ stat: 'happiness', delta: -4 }, { flag: 'cp_prison_infraction', inc: 1 }, { log: 'The kid told a guard. I lost my phone time and got written up for extortion.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pl_yard_standoff',
    category: 'prison',
    title: 'By the weight pile',
    text: 'Two crews were squaring off by the weight pile, and a quiet newcomer from my tier was standing right in the middle of it, looking straight at me.',
    minAge: 18,
    maxAge: 110,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'walk',
        label: 'Walk away',
        effects: [
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: -1 }, { log: 'I walked to the far fence and studied the clouds. In here, boring keeps you in one piece.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -5 }, { karma: -1 }, { log: 'I walked away. The newcomer got hurt and did not look at me again for the rest of the year.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'back_m',
        conditions: [{ gender: 'male' }],
        label: 'Back the newcomer up',
        effects: [
          { karma: 2 },
          {
            chance: 0.5,
            then: [
              { stat: 'happiness', delta: 3 },
              { log: 'We stood shoulder to shoulder. Both crews decided it was not worth it today.', kind: 'good' },
              { newPerson: { kind: 'friend', relationship: 55, minAge: 18, maxAge: 30, gender: 'male', log: 'The newcomer from my tier, {{person}}, has had my back ever since.' } },
            ],
            else: [
              {
                random: [
                  { weight: 8, effects: [{ injury: 6 }, { flag: 'cp_prison_infraction', inc: 1 }, { stat: 'happiness', delta: -4 }, { log: 'Fists, whistles, a face full of dirt. I came out of it with a split lip and a write-up.', kind: 'bad' }] },
                  { weight: 2, effects: [{ injury: 6 }, { prison: 1 }, { stat: 'happiness', delta: -10 }, { log: 'The fight was written up as an assault with my name on it. A year added to my sentence.', kind: 'bad' }] },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'back_f',
        conditions: [{ gender: 'female' }],
        label: 'Back the newcomer up',
        effects: [
          { karma: 2 },
          {
            chance: 0.5,
            then: [
              { stat: 'happiness', delta: 3 },
              { log: 'We stood shoulder to shoulder. Both crews decided it was not worth it today.', kind: 'good' },
              { newPerson: { kind: 'friend', relationship: 55, minAge: 18, maxAge: 30, gender: 'female', log: 'The newcomer from my tier, {{person}}, has had my back ever since.' } },
            ],
            else: [
              {
                random: [
                  { weight: 8, effects: [{ injury: 6 }, { flag: 'cp_prison_infraction', inc: 1 }, { stat: 'happiness', delta: -4 }, { log: 'Fists, whistles, a face full of dirt. I came out of it with a split lip and a write-up.', kind: 'bad' }] },
                  { weight: 2, effects: [{ injury: 6 }, { prison: 1 }, { stat: 'happiness', delta: -10 }, { log: 'The fight was written up as an assault with my name on it. A year added to my sentence.', kind: 'bad' }] },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'guard',
        label: 'Tell a guard quietly',
        effects: [
          {
            chance: 0.6,
            then: [{ flag: 'cp_prison_good_conduct', inc: 1 }, { stat: 'happiness', delta: 1 }, { log: 'A guard wandered over at exactly the right moment. Nobody knows why. I know why.', kind: 'good' }],
            else: [{ injury: 3 }, { stat: 'happiness', delta: -6 }, { log: 'Word got around that I talk to guards. Someone made sure I knew it, in the shower line.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pl_package',
    category: 'prison',
    title: 'Just a week',
    text: 'Someone on my tier wanted a small package kept under my mattress for a week. No questions, paid in commissary, and the package was not getting any less suspicious.',
    minAge: 18,
    maxAge: 110,
    weight: 1,
    cooldown: 3,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'hide',
        label: 'Hide it',
        effects: [
          { karma: -3 },
          {
            random: [
              { weight: 6, effects: [{ money: 60 }, { stat: 'happiness', delta: 2 }, { log: 'The week passed and the package left. {{$60}} in commissary landed in my account, no note.', kind: 'money' }] },
              { weight: 3, effects: [{ flag: 'cp_prison_infraction', inc: 1 }, { stat: 'happiness', delta: -6 }, { log: 'A cell search found it on day four. My name went on the write-up, not theirs.', kind: 'bad' }] },
              { weight: 1, effects: [{ prison: 1 }, { stat: 'happiness', delta: -12 }, { log: 'The package was worse than I had guessed. A new charge, and a year on my sentence.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'no',
        label: 'Say no',
        effects: [
          {
            chance: 0.75,
            then: [{ log: 'I said no. They shrugged and went looking for a mattress with fewer opinions.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'They took the no personally. My cell flooded "by accident" twice that month.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'tell',
        label: 'Tip off a guard',
        effects: [
          { flag: 'cp_prison_good_conduct', inc: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'The package was gone by dinner and nobody knew why. I plan to keep it that way.', kind: 'good' }],
            else: [{ injury: 5 }, { stat: 'happiness', delta: -6 }, { log: 'Somebody knew why. A week in the infirmary, then a month of watching my back.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pl_brew',
    category: 'prison',
    title: 'Behind the dryers',
    text: 'Someone on my block makes a sour homemade brew from kitchen scraps and hides it behind the dryers. It smells like a bad decision. A cup costs two soups.',
    minAge: 21,
    maxAge: 110,
    weight: 0.8,
    cooldown: 4,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'try',
        label: 'Try a cup',
        effects: [
          { karma: -1 },
          { addiction: 'alcohol', delta: 4 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 1 }, { stat: 'health', delta: -3 }, { log: 'It tasted like a trash can with a grudge. Warm for an hour, sick for two days.', kind: 'bad' }],
            else: [
              { flag: 'cp_prison_infraction', inc: 1 },
              { illness: 'food_poisoning' },
              { stat: 'happiness', delta: -5 },
              { log: 'A surprise count caught me swaying. A write-up, then a miserable night in the infirmary.', kind: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'craving',
        label: 'Sit out the craving',
        // A craving is a habit that has taken hold (as mind_and_community's drinking cards ask), not one toast that is fading.
        conditions: [{ addiction: 'alcohol', min: 5 }],
        effects: [{ addiction: 'alcohol', delta: -5 }, { stat: 'happiness', delta: -3 }, { stat: 'health', delta: 2 }, { log: 'I wanted it badly and sat on my hands until count. One more day without. It counts.', kind: 'good' }],
      },
      {
        id: 'pass',
        label: 'Pass',
        effects: [{ karma: 1 }, { log: 'I passed. The smell alone was a warning label.', kind: 'info' }],
      },
      {
        id: 'report',
        label: 'Report the stash',
        effects: [
          { flag: 'cp_prison_good_conduct', inc: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 1 }, { log: 'The bags vanished, and so did the smell. Nobody thanked me, which is how I knew it worked.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'Everyone on the block knew who had complained. Breakfast was very quiet for a month.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pl_lockdown',
    category: 'prison',
    title: 'Four days in',
    text: 'The whole facility went on lockdown for reasons nobody explained. Four days in the cell: meals pushed through the door, no yard, no showers and a cellmate who hums.',
    minAge: 18,
    maxAge: 110,
    weight: 1,
    cooldown: 3,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'letters',
        label: 'Write letters',
        effects: [
          { relationship: 'mother', delta: 2 },
          { relationship: 'father', delta: 2 },
          { relationship: 'sibling', delta: 2 },
          { relationship: 'spouse', delta: 2 },
          { relationship: 'child', delta: 2 },
          { relationship: 'lover', delta: 2 },
          { relationship: 'bestFriend', delta: 2 },
          { stat: 'happiness', delta: 1 },
          { log: 'I wrote eleven letters in four days. Everyone I know got a very detailed weather report.', kind: 'good' },
        ],
      },
      {
        id: 'workout',
        label: 'Work out in the cell',
        effects: [{ stat: 'health', delta: 3 }, { stat: 'happiness', delta: 1 }, { energy: -1 }, { log: 'Push-ups, sit-ups and lunges in a space the size of a parking spot. Sore, but sane.', kind: 'info' }],
      },
      {
        id: 'hum',
        label: 'Teach the hummer a song',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'By day three we were harmonizing. The guards asked us to stop. We did not stop.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'My cellmate learned the new song and hummed it for the next eight months.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'sleep',
        label: 'Sleep through it',
        effects: [{ stat: 'health', delta: 2 }, { stat: 'happiness', delta: -1 }, { energy: 1 }, { log: 'I slept most of four days away and came out rested. It is a skill I am not proud of.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'pl_birthday_cake',
    category: 'prison',
    title: 'Contraband cake',
    text: 'I turned {{age}} on a Tuesday. My cellmate built a cake out of crushed cookies and coffee creamer and stuck a single match in the top, which is very much against the rules.',
    minAge: 18,
    maxAge: 110,
    weight: 0.8,
    cooldown: 5,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'wish',
        label: 'Make a wish and blow',
        effects: [
          { stat: 'happiness', delta: 5 },
          {
            chance: 0.25,
            then: [{ flag: 'cp_prison_infraction', inc: 1 }, { stat: 'happiness', delta: -3 }, { log: 'A guard smelled the match. The cake was confiscated, probably eaten. My wish still stands.', kind: 'bad' }],
            else: [{ log: 'I made a wish and blew out the match. The cake was terrible. I ate every crumb.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'share',
        label: 'Share it with the tier',
        effects: [
          { karma: 2 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.25,
            then: [{ flag: 'cp_prison_infraction', inc: 1 }, { log: 'Twelve people got one bite each and sang down the tier. The singing brought a guard. Worth it.', kind: 'info' }],
            else: [{ log: 'Twelve people got one bite each and sang off-key down the tier. Best birthday in years.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'dark',
        label: 'Skip the match',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I hid the match and ate the cake in the dark. Low risk, low ceremony, still cake.', kind: 'info' }],
      },
    ],
  },

  // ───────────────────────────────── inside: letters & visits ─────────────────────────────────
  {
    id: 'pl_letter_mother',
    category: 'prison',
    title: 'Two pages and a line',
    text: '{{person}} wrote again: two pages about the neighbors, the weather and the price of eggs, then one line squeezed in at the bottom. "I still set your place on Sundays."',
    minAge: 18,
    maxAge: 110,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ inPrison: true }],
    person: { kind: ['mother'], minRelationship: 25 },
    choices: [
      {
        id: 'everything',
        label: 'Write back about everything',
        effects: [
          {
            chance: 0.65,
            then: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 3 }, { log: 'I wrote back about the bad nights too. {{person}} answered within a week, three pages this time.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: -3 }, { log: '{{person}} called the prison chaplain, worried sick. I had said more than a letter can carry.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'light',
        label: 'Keep it light',
        effects: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 1 }, { log: 'I wrote a page about the food and the weather in here. {{person}} wrote back the same. It helps.', kind: 'info' }],
      },
      {
        id: 'place',
        label: 'Tell {{them}} to stop setting it',
        effects: [
          { karma: 1 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 3 }, { log: '{{person}} gave my Sunday chair to the neighbor kid and sent a photo. It felt like permission.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -2 }, { log: '{{person}} did not answer for a month. Then: "It is your place." The plate stays.', kind: 'info' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pl_letter_father',
    category: 'prison',
    title: 'Four lines',
    text: '{{person}} has never been a letter writer. This one was four lines long, and the last line was crossed out so hard the pen went through the paper.',
    minAge: 18,
    maxAge: 110,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: true }],
    person: { kind: ['father'], minRelationship: 15 },
    choices: [
      {
        id: 'four',
        label: 'Write four lines back',
        effects: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 2 }, { log: 'I wrote four lines back. {{person}} wrote five the next time. We are working up to a page.', kind: 'good' }],
      },
      {
        id: 'light',
        label: 'Hold it up to the light',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 5 }, { log: 'Against the light it read: "I should have been around more." I read it until lights out.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'Against the light it said nothing I could read. I have guessed at it every night since.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'six',
        label: 'Write six pages back',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 7 }, { stat: 'happiness', delta: 4 }, { log: '{{person}} never answered the six pages. {{They}} showed up on visiting day, which is an answer.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: -2 }, { log: 'Six pages went out. Four lines came back, all about the weather. That is how {{person}} says hello.', kind: 'info' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pl_crayon_drawing',
    category: 'prison',
    title: 'A drawing in the mail',
    text: '{{person}} mailed me a crayon drawing from {{their}} youngest: the whole family in front of a house, a big yellow sun, and me off in the corner behind a row of very careful gray lines.',
    minAge: 18,
    maxAge: 70,
    weight: 1.2,
    cooldown: 3,
    conditions: [{ inPrison: true }],
    person: { kind: ['sibling'], minAge: 24, maxAge: 45, minRelationship: 20 },
    choices: [
      {
        id: 'draw',
        label: 'Draw something back',
        effects: [
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 3 }, { log: 'I drew a dog back, badly. Word came from {{person}} that it looked like a potato. Fair.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: -2 }, { log: 'My dog drawing came back with corrections in purple crayon. The artist has standards.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'outside',
        label: 'Ask to be drawn outside',
        effects: [
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 5 }, { log: 'The next drawing put me on the grass with everyone else. It is taped above my bunk.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -1 }, { stat: 'happiness', delta: -3 }, { log: '{{person}} wrote that the artist only draws true things. I could not argue with that.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'call',
        label: 'Call to say thanks',
        hint: '{{$20}} of phone time',
        conditions: [{ money: { gte: 20 } }],
        effects: [{ money: -20 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 5 }, { log: 'I spent {{$20}} of phone time thanking the artist, who asked if prison has a playground.', kind: 'good' }],
      },
      {
        id: 'silent',
        label: 'Tape it up, say nothing',
        effects: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: 3 }, { log: 'I taped it above my bunk and looked at it every night. I never wrote back. I kept meaning to.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'pl_sibling_wedding',
    category: 'prison',
    title: 'An invitation anyway',
    text: '{{person}} is getting married this summer and sent me an invitation anyway, with a sticky note on the front: "I know you can\'t come. I wanted you to have one."',
    minAge: 18,
    maxAge: 80,
    weight: 0.6,
    once: true,
    conditions: [{ inPrison: true }],
    person: { kind: ['sibling'], minAge: 20, maxAge: 70 },
    choices: [
      {
        id: 'toast',
        label: 'Write a toast to be read',
        effects: [
          { energy: -1 },
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 7 }, { stat: 'happiness', delta: 4 }, { log: '{{person}} said my toast made half the room cry and the other half laugh. I was there, a little.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: -1 }, { log: 'My toast arrived a week after the wedding. {{person}} framed it anyway.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'gift',
        label: 'Send a gift',
        hint: '{{$50}}',
        conditions: [{ money: { gte: 50 } }],
        effects: [{ money: -50 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 3 }, { log: 'A friend on the outside bought a toaster with my {{$50}}. Practical, boring, and from me.', kind: 'good' }],
      },
      {
        id: 'photos',
        label: 'Ask for the photos',
        effects: [
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 3 }, { log: 'The photos came a month later. One has an empty chair in the back. I decided it is mine.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 1 }, { stat: 'happiness', delta: -4 }, { log: 'Everyone in the photos looked happy without me, which is what I wanted, and also not.', kind: 'info' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pl_anniversary_letter',
    category: 'prison',
    title: 'The anniversary letter',
    text: 'Our anniversary came around with me on the wrong side of a wall. {{person}} wrote that {{they}} still buys my favorite cereal every week, out of habit, and then has to eat it.',
    minAge: 18,
    maxAge: 110,
    weight: 1,
    cooldown: 3,
    conditions: [{ inPrison: true }],
    person: { kind: ['spouse', 'lover'], minRelationship: 30 },
    choices: [
      {
        id: 'poem',
        label: 'Write {{them}} a poem',
        effects: [
          {
            chance: 0.6,
            then: [{ love: 6 }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 3 }, { log: 'I wrote a poem on lined paper that rhymed "wall" with "fall" twice. {{person}} kept it.', kind: 'good' }],
            else: [{ love: 2 }, { stat: 'happiness', delta: -1 }, { log: '{{person}} wrote back that the poem was terrible and that {{they}} reads it every night.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'wait',
        label: 'Tell {{them}} not to wait',
        effects: [
          { karma: 2 },
          {
            chance: 0.5,
            then: [{ love: 5 }, { relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 2 }, { log: 'I told {{person}} not to wait for me. {{They}} wrote back one word, underlined: "No."', kind: 'good' }],
            else: [{ love: -12 }, { relationship: 'person', delta: -6 }, { stat: 'happiness', delta: -8 }, { log: 'I told {{person}} not to wait. {{They}} took me at my word. The letters slowed, then stopped.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'flowers',
        label: 'Send flowers through a friend',
        hint: '{{$60}}',
        conditions: [{ money: { gte: 60 } }],
        effects: [{ money: -60 }, { love: 5 }, { relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 2 }, { log: 'A friend delivered flowers with my note. {{person}} sent a photo of them next to my cereal.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'pl_visit_photo',
    category: 'prison',
    title: 'The painted beach',
    text: 'One wall of the visiting room is painted like a beach at sunset. For a little commissary money, a guard will take your photo in front of it. {{person}} wanted one before the hour ran out.',
    minAge: 18,
    maxAge: 110,
    weight: 1,
    cooldown: 3,
    conditions: [{ inPrison: true }],
    person: { kind: ['mother', 'father', 'sibling', 'spouse', 'child', 'bestFriend'], minAge: 6, minRelationship: 30 },
    choices: [
      {
        id: 'pose',
        label: 'Pose by the fake beach',
        hint: '{{$5}}',
        conditions: [{ money: { gte: 5 } }],
        effects: [
          { money: -5 },
          {
            chance: 0.8,
            then: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 4 }, { log: '{{person}} and I squinted into a painted sunset. That photo is the best thing I own.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The camera jammed, the line was long, and the photo ate twenty minutes of our hour.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'tourists',
        label: 'Pose like tourists',
        hint: '{{$5}}',
        conditions: [{ money: { gte: 5 } }],
        effects: [
          { money: -5 },
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 6 }, { log: 'Arms out, finger sunglasses, big fake smiles. The guard laughed. So did {{person}}, finally.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -2 }, { stat: 'happiness', delta: -3 }, { flag: 'cp_prison_infraction', inc: 1 }, { log: 'The guard called it horseplay and ended the visit ten minutes early. No photo, no hour.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Skip it and just talk',
        effects: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 1 }, { log: 'I did not want a picture of me in here. We talked the whole hour, facing the painted beach.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'pl_no_visitors',
    category: 'prison',
    title: 'Names over the speaker',
    text: 'Visiting day. Names called over the speaker, chairs scraping, the vending machine humming in the next room. I listened for mine all morning. It was not called.',
    minAge: 18,
    maxAge: 110,
    weight: 0.8,
    cooldown: 4,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'bunk',
        label: 'Lie on my bunk',
        effects: [{ stat: 'happiness', delta: -3 }, { stat: 'health', delta: 2 }, { log: 'I lay on my bunk and listened to the visits through the wall. A very long day.', kind: 'bad' }],
      },
      {
        id: 'shift',
        label: 'Pick up an extra shift',
        effects: [{ money: 10 }, { stat: 'happiness', delta: -1 }, { energy: -1 }, { flag: 'cp_prison_good_conduct', inc: 1 }, { log: 'I mopped the long corridor during visiting hours. Busy hands, quiet head. Mostly.', kind: 'info' }],
      },
      {
        id: 'write',
        label: 'Write the letters myself',
        effects: [
          {
            chance: 0.6,
            then: [
              { relationship: 'mother', delta: 2 },
              { relationship: 'father', delta: 2 },
              { relationship: 'sibling', delta: 2 },
              { relationship: 'friend', delta: 2 },
              { stat: 'happiness', delta: 4 },
              { log: 'I stopped waiting and wrote four letters instead. Two came back within a month.', kind: 'good' },
            ],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I wrote four letters. Nobody wrote back that month. Paper is cheap. Waiting is not.', kind: 'info' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pl_holiday_tray',
    category: 'prison',
    title: 'Holiday tray',
    text: 'For the holiday, the kitchen served turkey loaf, instant potatoes and one real slice of pie per person. The pie made more people smile than anything else all year.',
    minAge: 18,
    maxAge: 110,
    weight: 1,
    cooldown: 3,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'give',
        label: 'Give my pie away',
        effects: [{ karma: 3 }, { stat: 'happiness', delta: 2 }, { log: 'I gave my slice to someone who had arrived that week. Best pie I never ate.', kind: 'good' }],
      },
      {
        id: 'stamps',
        label: 'Trade it for stamps',
        effects: [
          { relationship: 'mother', delta: 2 },
          { relationship: 'father', delta: 2 },
          { relationship: 'sibling', delta: 2 },
          { stat: 'happiness', delta: -1 },
          { log: 'I traded my pie for stamps and wrote to everyone I could think of. Letters last longer than pie.', kind: 'info' },
        ],
      },
      {
        id: 'slow',
        label: 'Eat it very slowly',
        effects: [{ stat: 'happiness', delta: 4 }, { log: 'I ate it in forty small bites. For forty bites, I was not anywhere in particular.', kind: 'good' }],
      },
      {
        id: 'call',
        label: 'Call home',
        hint: '{{$15}}',
        conditions: [{ money: { gte: 15 } }, { hasPerson: ['mother', 'father', 'sibling', 'spouse', 'child'] }],
        effects: [
          { money: -15 },
          { relationship: 'mother', delta: 3 },
          { relationship: 'father', delta: 3 },
          { relationship: 'spouse', delta: 3 },
          { relationship: 'child', delta: 3 },
          { relationship: 'sibling', delta: 2 },
          { stat: 'happiness', delta: 5 },
          { log: 'Fifteen minutes on the phone, and the whole table at home said my name at once.', kind: 'good' },
        ],
      },
    ],
  },

  // ───────────────────────────────── inside: work & school ─────────────────────────────────
  {
    id: 'pl_kitchen_line',
    category: 'prison',
    title: 'Running the line',
    text: 'The kitchen supervisor watched me rescue a pot of burnt rice and asked if I wanted to run the serving line. More hours, more pay, and more people angry when the food is bad.',
    minAge: 18,
    maxAge: 80,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'run',
        label: 'Run the line',
        effects: [
          { money: 80 },
          { flag: 'cp_prison_good_conduct', inc: 1 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 3 }, { stat: 'smarts', delta: 1 }, { log: 'I ran the line all year. Nobody loved the food, but everybody got it hot and on time.', kind: 'good' }],
            else: [{ injury: 3 }, { stat: 'happiness', delta: -4 }, { log: 'Every complaint in the building came to my window, plus a steam burn up one arm.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'dishes',
        label: 'Stay in the dish room',
        effects: [{ money: 40 }, { stat: 'happiness', delta: 2 }, { log: "I stayed with the dishes. Hot water, my own thoughts and nobody's opinion about the gravy.", kind: 'info' }],
      },
      {
        id: 'bread',
        label: 'Slip extra bread to the block',
        effects: [
          { karma: 1 },
          {
            chance: 0.6,
            then: [{ money: 60 }, { stat: 'happiness', delta: 5 }, { log: 'Extra bread went out in my sleeves every night. The block ate better. I slept better.', kind: 'good' }],
            else: [{ money: 15 }, { flag: 'cp_prison_infraction', inc: 1 }, { stat: 'happiness', delta: -5 }, { log: 'A guard found six rolls up my sleeves. I lost the kitchen job and my good standing with it.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pl_laundry_pocket',
    category: 'prison',
    title: 'Something in the pocket',
    text: "Folding uniforms in the laundry, I found folded cash in the pocket of a guard's shirt, still warm from the dryer. In here, cash is contraband. Nobody else had seen it.",
    minAge: 18,
    maxAge: 90,
    weight: 0.8,
    cooldown: 5,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'hand',
        label: 'Hand it to the guard',
        effects: [
          { karma: 2 },
          { flag: 'cp_prison_good_conduct', inc: 1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'The guard looked surprised, then said thanks and meant it. I get the good dryer now.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The guard took it without a word. The laundry crew looked at me sideways all week.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'keep',
        label: 'Keep it in my sock',
        effects: [
          { karma: -2 },
          {
            chance: 0.3,
            then: [{ flag: 'cp_prison_infraction', inc: 1 }, { stat: 'happiness', delta: -5 }, { log: 'A pat-down found the cash in my sock. Contraband, a write-up, and no more laundry.', kind: 'bad' }],
            else: [{ money: 20 }, { stat: 'happiness', delta: 1 }, { log: 'Cash in a sock is a strange kind of comfort. I spent it slowly, one favor at a time.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'back',
        label: 'Fold it back in',
        effects: [{ karma: 1 }, { log: 'I folded it back into the pocket and the shirt over it. Not my money, not my problem.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'pl_library_clerk',
    category: 'prison',
    title: 'The library clerk',
    text: 'I got the library clerk job. Mostly it is people asking for books we do not have, and one quiet regular from my block who checks out the same picture book every single week.',
    minAge: 18,
    maxAge: 110,
    weight: 1,
    cooldown: 5,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'help',
        label: 'Offer to help with reading',
        effects: [
          { karma: 3 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 6 }, { flag: 'cp_prison_good_conduct', inc: 1 }, { log: 'My regular was learning to read it to a daughter over the phone. By spring, the whole book.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'My regular said no thanks and stopped coming in. Some pride is holding up the whole wall.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'list',
        label: 'Start a request list',
        effects: [
          { stat: 'smarts', delta: 1 },
          { karma: 2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 5 }, { counter: 'libraryVisits' }, { log: 'A book charity answered my request list with two boxes. The new thrillers have endings.', kind: 'good' }],
            else: [{ log: 'The request list went to an office and stayed there. I alphabetized the dictionary.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'read',
        label: 'Read on the clock',
        effects: [{ stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: 2 }, { counter: 'libraryVisits' }, { log: 'I read in the back room between checkouts. Best job in the building, and nobody knows it.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'pl_fire_crew',
    category: 'prison',
    title: 'The fire crew',
    text: 'A sign-up sheet went up for the wildfire crew: a season in a camp outside the walls, real boots, brutal work on the fire line, and a little pay.',
    minAge: 18,
    maxAge: 50,
    weight: 0.7,
    cooldown: 4,
    conditions: [{ inPrison: true }, { stat: 'health', gte: 50 }],
    choices: [
      {
        id: 'sign',
        label: 'Sign up',
        effects: [
          { money: 150 },
          { karma: 2 },
          { flag: 'cp_prison_good_conduct', inc: 1 },
          {
            chance: 0.8,
            then: [{ stat: 'happiness', delta: 7 }, { stat: 'health', delta: 3 }, { log: 'I spent the season cutting fire line on a mountain. Sky everywhere. I had forgotten how big it is.', kind: 'good' }],
            else: [{ injury: 8 }, { stat: 'happiness', delta: 2 }, { log: 'A falling branch caught my shoulder on the fire line. Still worth it for the sky, mostly.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'train',
        label: 'Train for next season',
        effects: [{ stat: 'health', delta: 3 }, { stat: 'happiness', delta: -1 }, { energy: -1 }, { log: 'I did push-ups in my cell all year to make next season. My cellmate counts out loud.', kind: 'info' }],
      },
      {
        id: 'stay',
        label: 'Stay inside the walls',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I stayed in the shade with a book. The crew came back sunburned, with stories I never heard.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'pl_college_class',
    category: 'prison',
    title: 'Tuesday nights',
    text: 'A community college sends a professor in on Tuesday nights. Twelve seats, forty applications, and one essay question: what do you want to understand?',
    minAge: 18,
    maxAge: 75,
    weight: 0.8,
    cooldown: 4,
    conditions: [{ inPrison: true }, { hasDegree: false }],
    choices: [
      {
        id: 'essay',
        label: 'Write the essay',
        effects: [
          { energy: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'smarts', delta: 6 }, { stat: 'happiness', delta: 6 }, { flag: 'cp_prison_good_conduct', inc: 1 }, { log: 'I got a seat. Tuesdays are the best night of my week. I have opinions about philosophers now.', kind: 'good' }],
            else: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: -3 }, { log: 'No seat this year. The professor wrote "keep thinking" on my essay. I am.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'notes',
        label: "Borrow a student's notes",
        effects: [{ stat: 'smarts', delta: 3 }, { log: "I borrowed a student's notes every week. Half an education, secondhand, still counts.", kind: 'info' }],
      },
      {
        id: 'pass',
        label: 'Not for me',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'School and I parted ways a while back. I wished the Tuesday crowd well and watched TV.', kind: 'info' }],
      },
    ],
  },

  // ───────────────────────────────── inside: the long days ─────────────────────────────────
  {
    id: 'pl_counselor',
    category: 'prison',
    title: "The counselor's office",
    text: "The counselor's office has two chairs, a box of tissues and a plant that is somehow alive. The counselor asked what I wanted to work on, then waited through a very long silence.",
    minAge: 18,
    maxAge: 110,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'temper',
        label: 'Talk about my temper',
        effects: [
          { karma: 2 },
          { flag: 'cp_prison_good_conduct', inc: 1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'We talked about my temper every week. I still have one. Now it has an off switch, mostly.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'I talked for an hour and left feeling worse. The counselor said that is normal at first.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'home',
        label: 'Talk about home',
        effects: [
          { relationship: 'mother', delta: 2 },
          { relationship: 'father', delta: 2 },
          { stat: 'happiness', delta: 3 },
          { log: 'I talked about home for an hour. That night I wrote a letter I had put off for years.', kind: 'good' },
        ],
      },
      {
        id: 'fine',
        label: "Say I'm fine",
        effects: [{ stat: 'happiness', delta: -1 }, { energy: 1 }, { log: 'I said I was fine and got the rest of the hour back. The plant and I both knew better.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'pl_apology_letter',
    category: 'prison',
    title: 'The letter I owe',
    text: 'The counselor told me about a program where you write to the person you harmed. The letter goes through an office, and that person decides whether to read it, or ever answer.',
    minAge: 18,
    maxAge: 110,
    weight: 0.6,
    once: true,
    // Only for someone who actually committed a crime: a wrongly convicted player harmed nobody.
    conditions: [{ inPrison: true }, { count: 'crimes', gte: 1 }],
    choices: [
      {
        id: 'write',
        label: 'Write the letter',
        effects: [
          { karma: 5 },
          { energy: -1 },
          {
            chance: 0.35,
            then: [{ stat: 'happiness', delta: 8 }, { log: 'Months later, a reply came through the office. Two lines. I read them every day.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The letter went out. No reply came. The counselor said that was their right. It is.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'tear',
        label: 'Write it, then tear it up',
        effects: [{ karma: 1 }, { stat: 'happiness', delta: 1 }, { energy: -1 }, { log: 'I wrote it four times and tore it up four times. The fifth one I kept, for me.', kind: 'info' }],
      },
      {
        id: 'not_ready',
        label: "Say I'm not ready",
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I told the counselor I was not ready. The counselor said the program would wait.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'pl_talent_show',
    category: 'prison',
    title: 'Showtime in the gym',
    text: "The rec office announced a talent show in the gym. Last year's winner juggled oranges from the kitchen. There is a sign-up sheet and a microphone that mostly works.",
    minAge: 18,
    maxAge: 110,
    weight: 0.8,
    cooldown: 4,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'sing',
        label: 'Sing a song from home',
        effects: [
          {
            random: [
              { weight: 4, effects: [{ stat: 'happiness', delta: 8 }, { log: 'I sang an old song from home. The gym went quiet, then loud. People nodded at me for weeks.', kind: 'good' }] },
              { weight: 4, effects: [{ stat: 'happiness', delta: -3 }, { log: 'My voice cracked on the high note in front of three hundred people. They were kinder than I feared.', kind: 'bad' }] },
              { weight: 2, effects: [{ stat: 'happiness', delta: 4 }, { log: 'I came second to someone who whistled through their teeth for six straight minutes.', kind: 'good' }] },
            ],
          },
        ],
      },
      {
        id: 'standup',
        label: 'Do ten minutes on the food',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 7 }, { log: 'Ten minutes on the food. The cooks laughed hardest. My portions grew.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'Nobody laughed except the cooks, who were laughing at me. My portions shrank.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'sound',
        label: 'Run the sound',
        effects: [{ stat: 'smarts', delta: 1 }, { stat: 'happiness', delta: 2 }, { energy: -1 }, { flag: 'cp_prison_good_conduct', inc: 1 }, { log: 'I kept the one microphone working all night. Nobody clapped for me, and that was fine.', kind: 'good' }],
      },
      {
        id: 'watch',
        label: 'Cheer from the bleachers',
        effects: [{ stat: 'happiness', delta: 3 }, { karma: 1 }, { log: 'I cheered for strangers from the bleachers. Best night of the year, by a mile.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'pl_old_timer',
    category: 'prison',
    title: 'The old-timer',
    text: 'An old-timer who has been inside since before I was born sat down next to me in the yard, said I was doing my time all wrong, and then waited for me to ask.',
    minAge: 18,
    maxAge: 40,
    weight: 0.8,
    once: true,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'ask_m',
        conditions: [{ gender: 'male' }],
        label: 'Ask how to do it right',
        effects: [
          { stat: 'smarts', delta: 2 },
          { energy: -1 },
          { stat: 'happiness', delta: 3 },
          { log: 'Do the time, do not let the time do you. I wrote it on the wall above my bunk.', kind: 'good' },
          { newPerson: { kind: 'friend', relationship: 55, minAge: 62, maxAge: 85, gender: 'male', log: '{{person}}, the old-timer, became a friend. One day, one task, one letter at a time, {{they}} says.' } },
        ],
      },
      {
        id: 'ask_f',
        conditions: [{ gender: 'female' }],
        label: 'Ask how to do it right',
        effects: [
          { stat: 'smarts', delta: 2 },
          { energy: -1 },
          { stat: 'happiness', delta: 3 },
          { log: 'Do the time, do not let the time do you. I wrote it on the wall above my bunk.', kind: 'good' },
          { newPerson: { kind: 'friend', relationship: 55, minAge: 62, maxAge: 85, gender: 'female', log: '{{person}}, the old-timer, became a friend. One day, one task, one letter at a time, {{they}} says.' } },
        ],
      },
      {
        id: 'fine',
        label: "Say I'm doing fine",
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'I said I was fine. The old-timer laughed, called that rule one of doing it wrong, and let me be.', kind: 'info' }],
      },
      {
        id: 'why',
        label: 'Ask what put them here',
        effects: [
          {
            chance: 0.5,
            then: [{ stat: 'smarts', delta: 3 }, { stat: 'happiness', delta: 2 }, { log: 'The old-timer told me, plainly. I stopped complaining about my own sentence after that.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The old-timer stood up without a word and never sat next to me again.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pl_margin_notes',
    category: 'prison',
    title: 'Pass it on',
    text: 'Someone left a battered paperback under my mattress, half the cover gone and every margin full of notes in three different handwritings. The last note said: pass it on.',
    minAge: 18,
    maxAge: 110,
    weight: 0.8,
    once: true,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'read',
        label: 'Read it slowly',
        effects: [{ stat: 'smarts', delta: 4 }, { stat: 'happiness', delta: 2 }, { karma: 1 }, { counter: 'libraryVisits' }, { log: 'I read it twice, added my own notes, and passed it on. I think about it most days.', kind: 'good' }],
      },
      {
        id: 'club',
        label: 'Start a book club',
        effects: [
          { stat: 'smarts', delta: 2 },
          { energy: -1 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 5 }, { flag: 'cp_prison_good_conduct', inc: 1 }, { log: 'Six of us argued about it on Sundays in the dayroom. Best arguments I have had in years.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The book club was me and someone who mostly wanted the chair by the window.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'trade',
        label: 'Trade it for coffee',
        effects: [{ stat: 'happiness', delta: 3 }, { log: 'I traded it for a jar of instant coffee, unread. Good mornings for a month. I still wonder.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'pl_puppy_program',
    category: 'prison',
    title: 'A very small puppy',
    text: 'A new program lets people inside raise service puppies for a year, then hand them on to someone who needs them. There is a waiting list and a very small puppy.',
    minAge: 18,
    maxAge: 110,
    weight: 0.6,
    once: true,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'apply',
        label: 'Apply for the program',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 10 }, { karma: 3 }, { flag: 'cp_prison_good_conduct', inc: 1 }, { log: 'For a year, a puppy named Juniper slept by my bunk. Giving her up was my best and worst day.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'Waiting list. I walked past the puppy room every day and waved through the glass.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'kennels',
        label: 'Volunteer to clean kennels',
        effects: [{ stat: 'happiness', delta: 4 }, { stat: 'health', delta: 1 }, { karma: 1 }, { energy: -1 }, { log: 'I scooped kennels every morning and got licked for it. In here, that is a fair wage.', kind: 'good' }],
      },
      {
        id: 'pass',
        label: 'Not for me',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'Dogs are for people who are going home soon. I told myself that, and it nearly worked.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'pl_old_school',
    category: 'prison',
    title: 'Old School',
    text: 'At my age the top bunk is a mountain, and every cold night settles into my knees. The young ones on the block call me Old School, mostly with respect.',
    minAge: 60,
    maxAge: 110,
    weight: 1.2,
    cooldown: 4,
    conditions: [{ inPrison: true }],
    choices: [
      {
        id: 'bunk',
        label: 'Request a bottom bunk',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'health', delta: 3 }, { stat: 'happiness', delta: 3 }, { log: 'A doctor signed off on a bottom bunk. The young ones carried my things down. Old School, indeed.', kind: 'good' }],
            else: [{ stat: 'health', delta: -2 }, { stat: 'happiness', delta: -3 }, { log: 'Denied: no medical need, apparently. My knees have filed their own appeal.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'chess',
        label: 'Teach the young ones chess',
        effects: [{ stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 5 }, { karma: 2 }, { energy: -1 }, { log: 'I set up a board in the dayroom. The young ones lose to me daily and keep coming back.', kind: 'good' }],
      },
      {
        id: 'myself',
        label: 'Keep to myself',
        effects: [{ stat: 'health', delta: 1 }, { stat: 'happiness', delta: -2 }, { log: 'I keep to my bunk, my books and my knees. The noise of the block passes over me like weather.', kind: 'info' }],
      },
    ],
  },

  // ───────────────────────────────── re-entry ─────────────────────────────────
  {
    id: 'pl_the_box',
    category: 'work',
    title: 'The little box',
    text: 'Every job application I filled out this month had the same little box: "Do you have a criminal record?" It is a very small box for such a long answer.',
    minAge: 18,
    maxAge: 64,
    weight: 1,
    cooldown: 4,
    conditions: [{ criminalRecord: true }, { inPrison: false }, { hasJob: false }, { retired: false }, { enrolled: false }],
    choices: [
      {
        id: 'honest',
        label: 'Check the box honestly',
        effects: [
          { karma: 2 },
          {
            chance: 0.4,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'One manager called to say she valued the honesty and would keep my file. That is progress.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -5 }, { log: 'I checked the box fourteen times and heard fourteen silences. The box is good at its job.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'blank',
        label: 'Leave it blank',
        effects: [
          { karma: -2 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'I left it blank and got two interviews. I spent both waiting for a question that never came.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -6 }, { log: "The background check filled in the blank for me. The interviewer's smile switched off.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'day_labor',
        label: 'Take day labor for cash',
        effects: [{ money: 400 }, { stat: 'health', delta: -2 }, { stat: 'happiness', delta: -1 }, { log: 'A moving crew paid cash by the day, no forms. Sore back, honest money, no box.', kind: 'money' }],
      },
    ],
  },
  {
    id: 'pl_second_chance',
    category: 'work',
    title: 'Why I got hired',
    text: 'My manager at {{company}} finally told me why I got hired despite my record: years ago, somebody gave her brother a second chance, and he never wasted it.',
    minAge: 18,
    maxAge: 70,
    weight: 0.8,
    once: true,
    // Low job levels only: an owner or a director has nobody above them to explain the hire.
    conditions: [{ criminalRecord: true }, { inPrison: false }, { count: 'yearsInPrison', gte: 1 }, { hasJob: true }, { jobLevel: { lte: 1 } }, { not: { jobCategory: ['crime'] } }],
    choices: [
      {
        id: 'promise',
        label: 'Promise not to waste mine',
        effects: [{ jobPerformance: 6 }, { stat: 'happiness', delta: 3 }, { energy: -1 }, { log: 'I came in early all year. Not to prove anything. Well, maybe a little.', kind: 'good' }],
      },
      {
        id: 'hire',
        label: 'Offer to help hire the next',
        effects: [
          { karma: 3 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { jobPerformance: 2 }, { log: 'I sat in on interviews. I knew the right questions, because I used to give the wrong answers.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'My manager said maybe someday. I keep a list of good questions in my locker anyway.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'thanks',
        label: 'Just say thank you',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I said thank you and meant it. My manager waved it off and handed me the schedule.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'pl_rental_check',
    category: 'money',
    title: 'The rental application',
    text: 'The apartment was perfect: good light, a short walk to the bus, and a landlord who seemed to like me right up until the background check came back.',
    minAge: 18,
    maxAge: 90,
    weight: 0.8,
    cooldown: 6,
    conditions: [{ criminalRecord: true }, { inPrison: false }, { noAsset: 'house' }],
    choices: [
      {
        id: 'explain',
        label: 'Explain it in person',
        effects: [
          { energy: -1 },
          {
            chance: 0.45,
            then: [{ stat: 'happiness', delta: 6 }, { log: 'The landlord heard the whole story and handed me the keys. Some people just need to hear it.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -4 }, { log: 'The landlord listened politely and rented it to someone else by Friday.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'deposit',
        label: 'Offer a double deposit',
        hint: '{{$1500}}',
        conditions: [{ money: { gte: 1500 } }],
        effects: [
          { money: -1500 },
          {
            chance: 0.8,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'A double deposit got me the lease. Apparently my past costs {{$1500}}, refundable.', kind: 'good' }],
            else: [{ money: 1500 }, { stat: 'happiness', delta: -3 }, { log: 'Even double the deposit was not enough. The landlord handed my check back, embarrassed.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'keep_looking',
        label: 'Keep looking',
        effects: [{ stat: 'happiness', delta: -3 }, { log: 'Third-floor walk-up, no light, a landlord who never asked. Home, more or less.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'pl_seal_record',
    category: 'crime',
    title: 'Eleven pages',
    text: 'A legal aid clinic at the library said I might be able to petition to seal my record someday. The form is eleven pages long and the waiting period is measured in years.',
    minAge: 21,
    maxAge: 85,
    weight: 0.6,
    once: true,
    conditions: [{ criminalRecord: true }, { inPrison: false }],
    choices: [
      {
        id: 'file',
        label: 'Fill out all eleven pages',
        hint: '{{$100}} filing fee',
        conditions: [{ money: { gte: 100 } }],
        effects: [{ money: -100 }, { stat: 'smarts', delta: 2 }, { stat: 'happiness', delta: 3 }, { flag: 'pl_record_petition', set: true }, { log: 'I filled in all eleven pages and filed them. Now I wait, which I am good at.', kind: 'good' }],
      },
      {
        id: 'lawyer',
        label: 'Ask a lawyer first',
        hint: '{{$600}}',
        conditions: [{ money: { gte: 600 } }],
        effects: [
          { money: -600 },
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 5 }, { log: 'The lawyer said my odds are decent, in a few years. Decent is the best word I have heard lately.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'The lawyer said mine is the kind of record that stays. {{$600}} to learn the word "ineligible."', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'drawer',
        label: 'Put it in a drawer',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I put the pamphlet in a drawer. Some days the past is too heavy to fill out.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'pl_old_corner',
    category: 'crime',
    title: 'The old corner',
    text: 'The old crowd still hangs out on the same corner, and every time I walk past, someone calls my name like I never left. Tonight they had a cooler and a spare chair.',
    minAge: 18,
    maxAge: 60,
    weight: 1,
    cooldown: 4,
    conditions: [{ criminalRecord: true }, { inPrison: false }, { count: 'yearsInPrison', gte: 1 }],
    choices: [
      {
        id: 'long_way',
        label: 'Take the long way home',
        effects: [{ karma: 2 }, { stat: 'happiness', delta: -2 }, { log: 'I walked the long way, four extra blocks. They are the best four blocks of my day.', kind: 'good' }],
      },
      {
        id: 'hello',
        label: 'Stop and say hello',
        effects: [
          {
            chance: 0.65,
            then: [{ stat: 'happiness', delta: 3 }, { log: 'I stayed ten minutes, laughed at the old stories, and left before any new ones started.', kind: 'info' }],
            else: [
              {
                random: [
                  { weight: 7, effects: [{ stat: 'happiness', delta: -4 }, { log: 'Ten minutes became three hours. Nothing happened, but I woke up feeling like I had lost ground.', kind: 'bad' }] },
                  { weight: 3, effects: [{ arrest: true }, { money: -300 }, { stat: 'happiness', delta: -8 }, { log: 'A patrol car rolled up while I was there. Wrong corner, wrong company, a fine and a fresh arrest.', kind: 'bad' }] },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'lunch',
        label: 'Invite one of them to lunch',
        effects: [
          {
            chance: 0.5,
            then: [
              { stat: 'happiness', delta: 4 },
              { newPerson: { kind: 'friend', relationship: 45, minAge: 18, log: '{{person}} from the old corner is trying to stay out of trouble too. We get lunch far from it.' } },
            ],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'They laughed and asked when I got so serious. Around the time I got out, I said.', kind: 'info' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pl_mentor',
    category: 'random',
    title: 'Tuesday coffee',
    text: 'A reentry program pairs people who have done time with mentors who did it first. Mine would be a retired electrician who served six years long ago and never misses Tuesday coffee.',
    minAge: 18,
    maxAge: 70,
    weight: 1,
    once: true,
    conditions: [{ criminalRecord: true }, { inPrison: false }, { count: 'yearsInPrison', gte: 1 }],
    choices: [
      {
        id: 'sign_up',
        label: 'Sign up',
        effects: [
          { flag: 'pl_mentor', set: true },
          { stat: 'smarts', delta: 1 },
          { stat: 'happiness', delta: 4 },
          { energy: -1 },
          { newPerson: { kind: 'friend', relationship: 55, minAge: 58, maxAge: 85, log: 'My mentor, {{person}}, meets me every Tuesday and asks the hard questions first.' } },
        ],
      },
      {
        id: 'one_coffee',
        label: 'Go to one coffee',
        effects: [
          {
            chance: 0.5,
            then: [
              { flag: 'pl_mentor', set: true },
              { stat: 'happiness', delta: 3 },
              { newPerson: { kind: 'friend', relationship: 45, minAge: 58, maxAge: 85, log: 'One coffee with {{person}} became a standing Tuesday. I did not plan on that.' } },
            ],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'One coffee was plenty. Too many questions. I kept the phone number, though.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'not_yet',
        label: 'Not yet',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I put the flyer on the fridge. It is still there, looking at me.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'pl_lunch_friend',
    category: 'friends',
    title: 'Lunch with {{person}}',
    text: '{{person}} took me to lunch and spent the whole meal asking about my plans instead of my past. It was the first time in a long while someone talked to me like I had a future.',
    minAge: 18,
    maxAge: 90,
    weight: 1,
    once: true,
    conditions: [{ criminalRecord: true }, { inPrison: false }, { count: 'yearsInPrison', gte: 1 }],
    person: { kind: ['friend', 'bestFriend'], minAge: 18, minRelationship: 50 },
    choices: [
      {
        id: 'check',
        label: 'Pick up the check',
        hint: '{{$40}}',
        conditions: [{ money: { gte: 40 } }],
        effects: [{ money: -40 }, { relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 3 }, { log: 'I paid for lunch. It felt like more than a sandwich, and {{person}} knew it.', kind: 'good' }],
      },
      {
        id: 'plans',
        label: 'Tell {{them}} my plans',
        effects: [
          { stat: 'smarts', delta: 2 },
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 5 }, { log: 'I told {{person}} everything I wanted to do. Out loud, it all sounded possible.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: -2 }, { log: 'My plans sounded thin out loud. {{person}} nodded anyway and offered to help with the first one.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'why',
        label: 'Ask why {{they}} bothers',
        effects: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 1 }, { log: '{{person}} shrugged and said friends are not a reward for good behavior. I had to look away.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'pl_one_table',
    category: 'family',
    title: 'One table',
    text: '{{person}} got the whole family around one table for the first time since I went away. Same chipped plates, same chair, and everyone working very hard to talk about anything else.',
    minAge: 18,
    maxAge: 90,
    weight: 1.5,
    once: true,
    conditions: [{ criminalRecord: true }, { inPrison: false }, { count: 'yearsInPrison', gte: 2 }],
    person: { kind: ['mother', 'father'], minRelationship: 20 },
    choices: [
      {
        id: 'say_it',
        label: 'Say it out loud',
        effects: [
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 6 }, { log: 'I said I was sorry, plainly. {{person}} said, "Finally," and we talked until midnight.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -5 }, { log: 'I brought it up. The room went cold, someone left early, and dessert happened in silence.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'safe',
        label: 'Stick to safe topics',
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: "Weather, sports and a cousin's new dog. Nobody mentioned it. It was nice, carefully.", kind: 'info' }],
      },
      {
        id: 'dishes',
        label: 'Do the dishes after',
        effects: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 2 }, { energy: -1 }, { log: 'I washed every chipped plate while {{person}} dried. Neither of us needed to say much.', kind: 'good' }],
      },
    ],
  },
  {
    id: 'pl_meet_parents',
    category: 'romance',
    title: 'Sunday lunch',
    text: '{{person}} wants me to meet {{their}} parents over Sunday lunch. They know nothing about my record, and {{person}} asked me, very gently, to keep it that way for the first visit.',
    // From 30, after young_adult's ya_meet_the_parents (18-29), and not within a few years of love_and_family's
    // lf_meet_their_parents, so one life does not meet the parents twice in a decade.
    minAge: 30,
    maxAge: 55,
    weight: 1,
    once: true,
    conditions: [{ criminalRecord: true }, { inPrison: false }, { married: false }, { not: { sinceEvent: 'lf_meet_their_parents', lte: 5 } }],
    person: { kind: ['lover'], minAge: 25, maxAge: 50 },
    choices: [
      {
        id: 'keep_quiet',
        label: 'Keep it to myself',
        effects: [
          { karma: -1 },
          {
            chance: 0.7,
            then: [{ love: 3 }, { stat: 'happiness', delta: 1 }, { log: 'Lunch went well. {{their}} father liked my handshake. The secret sat at the table all afternoon.', kind: 'info' }],
            else: [{ love: -6 }, { relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -5 }, { log: 'A cousin at the table recognized my name from an old news story. Lunch ended before dessert.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'tell_them',
        label: 'Tell them myself, kindly',
        effects: [
          { karma: 2 },
          {
            chance: 0.5,
            then: [{ love: 6 }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 5 }, { log: '{{their}} parents went quiet, then asked fair questions. {{person}} held my hand under the table.', kind: 'good' }],
            else: [{ love: -5 }, { stat: 'happiness', delta: -6 }, { log: 'The parents thanked me for my honesty and did not invite me back. {{person}} walked me out anyway.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'ask_why',
        label: 'Ask {{them}} why it matters',
        effects: [
          {
            chance: 0.6,
            then: [{ love: 4 }, { relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 2 }, { log: '{{person}} wanted them to meet me first and my record second. That I could live with.', kind: 'good' }],
            else: [{ love: -5 }, { relationship: 'person', delta: -3 }, { stat: 'happiness', delta: -3 }, { log: 'The talk turned into a real fight. We went to the lunch anyway, both a little sore.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pl_kid_asks',
    category: 'family',
    title: 'On a long walk',
    text: '{{person}} asked me about prison on a long walk today. Really asked, for the first time: why I went, what it was like, and whether I was scared.',
    minAge: 18,
    maxAge: 90,
    weight: 1,
    once: true,
    conditions: [{ criminalRecord: true }, { inPrison: false }, { count: 'yearsInPrison', gte: 1 }],
    person: { kind: ['child', 'sibling'], minAge: 9 },
    choices: [
      {
        id: 'truth',
        label: 'Tell the plain truth',
        effects: [
          { karma: 2 },
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 6 }, { stat: 'happiness', delta: 3 }, { log: 'I told {{person}} the plain truth. {{They}} asked good questions, and I answered every one.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -4 }, { stat: 'happiness', delta: -4 }, { log: 'The truth was more than {{person}} wanted. {{They}} went quiet for a week.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'long_ago',
        label: 'Say it was long ago',
        effects: [{ relationship: 'person', delta: -1 }, { log: 'I said it was a long time ago and changed the subject. {{person}} let me, this time.', kind: 'info' }],
      },
      {
        id: 'scared',
        label: 'Admit I was scared',
        effects: [
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 3 }, { log: '"Every day," I said. {{person}} took my arm for the rest of the walk.', kind: 'good' }],
            else: [{ relationship: 'person', delta: 1 }, { stat: 'happiness', delta: -2 }, { log: '{{person}} did not know what to do with that. Neither did I. We walked home quietly.', kind: 'info' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pl_youth_center',
    category: 'random',
    title: 'Folding chairs',
    text: 'A youth center asked me to talk to a room of teenagers about my years inside. Twenty kids on folding chairs, and at least three who looked exactly like I used to.',
    minAge: 25,
    maxAge: 90,
    weight: 0.6,
    cooldown: 6,
    conditions: [{ criminalRecord: true }, { inPrison: false }, { count: 'yearsInPrison', gte: 2 }],
    choices: [
      {
        id: 'straight',
        label: 'Tell it straight',
        effects: [
          { karma: 4 },
          { energy: -1 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 6 }, { log: 'One kid hung back afterward to ask how I stayed out. I am still answering that one.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -3 }, { log: 'Telling it straight dragged up more than I expected. I did not sleep that night.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'scary',
        label: 'Make it a scary story',
        effects: [
          { karma: 2 },
          { energy: -1 },
          {
            chance: 0.7,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'I laid it on thick. The youth worker called it effective. I felt like a haunted house.', kind: 'info' }],
            else: [{ stat: 'happiness', delta: -1 }, { log: 'I tried to scare them. A kid in the back laughed. I used to be that kid.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Decline the invitation',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I said no. Talking about it out loud still feels like walking back in.', kind: 'info' }],
      },
    ],
  },
  {
    id: 'pl_cereal_aisle',
    category: 'random',
    title: 'Cereal aisle',
    text: 'In the cereal aisle at the grocery store, I came face to face with one of the officers from my old cell block. In jeans. Holding a coupon. We both froze.',
    minAge: 18,
    maxAge: 90,
    weight: 0.5,
    once: true,
    conditions: [{ criminalRecord: true }, { inPrison: false }, { count: 'yearsInPrison', gte: 1 }],
    choices: [
      {
        id: 'hello',
        label: 'Say hello',
        effects: [
          {
            chance: 0.6,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'The officer said, "Good to see you out here." We talked cereal for two minutes. Strange. Nice.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The officer nodded once and steered the cart away fast. Fair enough. I would have, too.', kind: 'info' }],
          },
        ],
      },
      {
        id: 'oatmeal',
        label: 'Study the oatmeal',
        effects: [{ stat: 'happiness', delta: -1 }, { log: 'I studied the oatmeal for a full minute until the cart squeaked away. Freedom is awkward.', kind: 'info' }],
      },
      {
        id: 'thank',
        label: 'Thank them for something',
        effects: [
          { karma: 2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 4 }, { log: 'I thanked the officer for the night I got to call home late. They had forgotten. I had not.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The officer did not remember me at all. I had been a number. I said thanks anyway.', kind: 'info' }],
          },
        ],
      },
    ],
  },
];

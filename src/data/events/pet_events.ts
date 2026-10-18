import type { EventDef } from '@/engine/events/schema';

/**
 * Pets, ages 6+ (owner events mostly 13+): getting one, keeping one, losing one.
 *
 * The no-pet events (stray cat, a friend's dog, the class hamster, the shelter,
 * an inherited parrot, a sibling's rabbit) create pets with `newPerson`. The pet
 * events are bound to a living pet via `person: { kind: ['pet'] }` (or a dead one
 * for grief) and move that bond with `relationship: 'person'`. Follow-ups queued
 * from adoption are not bound to the new pet, so they use `relationship: 'pet'`.
 */
export const PET_EVENTS: EventDef[] = [
  // ------------------------------------------------------------ getting a pet
  {
    id: 'pt_stray_cat_rain',
    category: 'family',
    title: 'The rainy stray',
    text: 'It rained all evening and a soaked tabby cat followed me the whole way home, then sat on the front step staring at the door as if I were the one who was late. No collar. Very loud.',
    minAge: 6,
    maxAge: 75,
    weight: 1,
    once: true,
    conditions: [{ noPerson: ['pet'] }, { inPrison: false }],
    choices: [
      {
        id: 'let_in',
        label: 'Let it in',
        effects: [
          { newPerson: { kind: 'pet', species: 'cat', relationship: 65, log: 'The cat walked in, inspected every room and chose my bed. I named {{them}} {{person}}.' } },
          { stat: 'happiness', delta: 6 },
          { karma: 2 },
          { log: 'Food, a bowl, a box of sand. Nobody in the house admitted to wanting a cat. Everyone fed it.', kind: 'good' },
        ],
      },
      {
        id: 'find_owner',
        label: 'Look for its owner',
        effects: [
          { karma: 3 },
          {
            chance: 0.5,
            then: [{ log: 'A woman three streets over cried when I handed the cat back. I got a tin of cookies for my trouble.', kind: 'good' }, { stat: 'happiness', delta: 3 }],
            else: [
              { log: 'No one claimed the cat. After a week of posters, the cat claimed us.', kind: 'milestone' },
              { newPerson: { kind: 'pet', species: 'cat', relationship: 60, log: 'So {{person}} stayed, on {{their}} own terms.' } },
              { stat: 'happiness', delta: 4 },
            ],
          },
        ],
      },
      {
        id: 'shoo',
        label: 'Shoo it away',
        effects: [{ karma: -2 }, { stat: 'happiness', delta: -2 }, { log: 'I clapped my hands. It left, slowly, like it was doing me a favor.' }],
      },
    ],
  },
  {
    id: 'pt_friends_dog_rehome',
    category: 'family',
    title: 'Dog needs a home',
    text: '{{person}} is moving abroad, and the new place does not allow dogs. {{They}} asked me to take {{their}} dog, with the face of someone who has already asked everyone else.',
    minAge: 14,
    maxAge: 70,
    weight: 1,
    once: true,
    conditions: [{ noPerson: ['pet'] }, { inPrison: false }],
    person: { kind: ['friend', 'bestFriend'] },
    choices: [
      {
        id: 'take',
        label: 'Take the dog',
        effects: [
          { newPerson: { kind: 'pet', species: 'dog', relationship: 55, log: '{{person}} arrived with a leash, a bed and a list of rules. {{They}} ignored the rules by Tuesday.' } },
          { relationship: 'person', delta: 10 },
          { karma: 3 },
          { stat: 'happiness', delta: 5 },
          { log: '{{person}} hugged me at the airport and then hugged the dog for much longer.', kind: 'good' },
          { queue: 'pt_first_night_home' },
        ],
      },
      {
        id: 'help',
        label: 'Help find another home',
        effects: [
          { karma: 2 },
          { relationship: 'person', delta: 3 },
          {
            chance: 0.7,
            then: [{ log: 'We found a retired couple with a big yard. The dog chose them within four minutes.', kind: 'good' }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'Nobody suitable turned up. {{person}} left in tears and the dog went to a shelter.', kind: 'bad' }, { stat: 'happiness', delta: -4 }],
          },
        ],
      },
      {
        id: 'decline',
        label: 'Say no',
        effects: [{ relationship: 'person', delta: -6 }, { stat: 'happiness', delta: -2 }, { log: '{{person}} said {{they}} understood. {{They}} did not text for a while.' }],
      },
    ],
  },
  {
    id: 'pt_classroom_hamster',
    category: 'family',
    title: 'The class hamster',
    text: 'Our class hamster needs a place to stay over the school break, and my name came out of the hat. The cage is enormous. The hamster is called Professor.',
    minAge: 6,
    maxAge: 11,
    weight: 1.2,
    once: true,
    conditions: [{ enrolled: true }, { noPerson: ['pet'] }],
    choices: [
      {
        id: 'careful',
        label: 'Look after it carefully',
        effects: [
          { stat: 'smarts', delta: 2 },
          { grade: 2 },
          {
            chance: 0.8,
            then: [{ log: 'Professor survived the break, fatter and, I think, fond of me. The teacher was visibly relieved.', kind: 'good' }, { stat: 'happiness', delta: 4 }, { karma: 1 }],
            else: [{ log: 'Professor escaped behind the fridge for three days. We got him back. Nobody at school needs to know.', kind: 'bad' }, { stat: 'happiness', delta: -3 }],
          },
        ],
      },
      {
        id: 'palace',
        label: 'Build it a palace',
        effects: [
          { stat: 'smarts', delta: 3 },
          { stat: 'happiness', delta: 5 },
          {
            chance: 0.3,
            then: [
              { log: 'The teacher was so impressed she offered me Professor for good. I said yes before she finished.', kind: 'milestone' },
              { newPerson: { kind: 'pet', species: 'hamster', relationship: 70, log: 'Professor, officially renamed {{person}}, moved in for good.' } },
            ],
            else: [{ log: 'Three stories of cardboard tubes. Professor used one. I was still proud.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'excuse',
        label: "Say I'm allergic",
        effects: [{ karma: -2 }, { grade: -1 }, { stat: 'happiness', delta: -1 }, { log: 'Professor went to a classmate who did not pretend to be allergic. The teacher gave me a look.' }],
      },
    ],
  },
  {
    id: 'pt_shelter_open_day',
    category: 'family',
    title: 'Shelter open house',
    text: 'The animal shelter in {{city}} has thrown its doors open: too many animals, not enough people. A volunteer handed me a flyer and a very direct stare.',
    minAge: 18,
    maxAge: 70,
    weight: 0.8,
    cooldown: 6,
    conditions: [{ noPerson: ['pet'] }, { money: { gte: 100 } }, { inPrison: false }],
    choices: [
      {
        id: 'dog',
        label: 'Adopt a dog',
        hint: 'Adoption fee {{$120}}',
        conditions: [{ money: { gte: 120 } }],
        effects: [
          { money: -120 },
          { newPerson: { kind: 'pet', species: 'dog', relationship: 60, log: 'A dog with one ear up and one ear down came home with me. {{person}}, from now on.' } },
          { stat: 'happiness', delta: 7 },
          { karma: 3 },
          { log: 'The volunteer cried a little. I pretended not to notice and walked the dog home very carefully.', kind: 'good' },
          { queue: 'pt_first_night_home' },
        ],
      },
      {
        id: 'cat',
        label: 'Adopt a cat',
        hint: 'Adoption fee {{$80}}',
        effects: [
          { money: -80 },
          { newPerson: { kind: 'pet', species: 'cat', relationship: 60, log: 'A cat who had been there eleven months looked at me once. {{person}} came home in a cardboard box.' } },
          { stat: 'happiness', delta: 6 },
          { karma: 3 },
          { log: 'Eleven months in a pen and within an hour the cat owned the place.', kind: 'good' },
          { queue: 'pt_first_night_home' },
        ],
      },
      {
        id: 'rabbit',
        label: 'Adopt the overlooked rabbit',
        hint: 'Adoption fee {{$30}}',
        effects: [
          { money: -30 },
          { newPerson: { kind: 'pet', species: 'rabbit', relationship: 55, log: 'Nobody else had looked at the rabbit all day. {{person}} came home with me and a bag of hay.' } },
          { stat: 'happiness', delta: 4 },
          { karma: 4 },
          { log: 'A rabbit is quieter than a dog and more judgmental than a cat. I did not know that.', kind: 'good' },
        ],
      },
      {
        id: 'donate',
        label: 'Just donate',
        hint: '{{$50}}',
        effects: [{ money: -50 }, { karma: 2 }, { stat: 'happiness', delta: 1 }, { log: 'I put money in the donation jar and left before anything with eyes could change my mind.' }],
      },
    ],
  },
  {
    id: 'pt_inherit_parrot',
    category: 'family',
    title: 'The will',
    text: 'A great-aunt I met twice has died and, for reasons known only to her, left me her parrot. It arrived by courier in a cage with a blanket over it, muttering.',
    minAge: 16,
    maxAge: 75,
    weight: 0.5,
    once: true,
    conditions: [{ noPerson: ['pet'] }, { inPrison: false }],
    choices: [
      {
        id: 'keep',
        label: 'Keep the parrot',
        effects: [
          { newPerson: { kind: 'pet', species: 'parrot', relationship: 45, log: 'The parrot is called {{person}} and looks at me the way my great-aunt did. I feel judged by a bird.' } },
          { stat: 'happiness', delta: 3 },
          { flag: 'pt_parrot', set: true },
          { log: 'The cage went in the corner of the living room. The muttering did not stop.' },
          { queue: 'pt_parrot_rude_word' },
        ],
      },
      {
        id: 'sanctuary',
        label: 'Send it to a sanctuary',
        effects: [{ karma: 2 }, { money: -60 }, { stat: 'happiness', delta: 1 }, { log: 'A bird sanctuary two hours away took the parrot. The courier charged me for the return trip.' }],
      },
      {
        id: 'sell',
        label: 'Sell it',
        effects: [{ money: 300 }, { karma: -3 }, { log: 'A man in a van paid cash for a parrot that, as he drove off, began shouting at him.', kind: 'money' }],
      },
    ],
  },
  {
    id: 'pt_parrot_rude_word',
    category: 'family',
    title: 'A new word',
    text: 'The parrot has learned a word. Not a nice word. It says it clearly, confidently, and only when there are guests, and it said it twice to a visiting aunt.',
    minAge: 16,
    maxAge: 85,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'laugh',
        label: 'Laugh every time',
        effects: [{ stat: 'happiness', delta: 4 }, { karma: -1 }, { relationship: 'pet', delta: 4 }, { log: 'I laughed. The parrot, encouraged, learned two more.' }],
      },
      {
        id: 'retrain',
        label: 'Teach it a nicer word',
        effects: [
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.5,
            then: [{ log: "After three weeks of repetition it now says 'lovely' with exactly the same venom.", kind: 'good' }, { stat: 'happiness', delta: 2 }],
            else: [{ log: 'It now says both words, in a sentence.', kind: 'bad' }, { stat: 'happiness', delta: -1 }],
          },
        ],
      },
      {
        id: 'cover',
        label: 'Cover the cage for guests',
        effects: [{ relationship: 'pet', delta: -4 }, { stat: 'happiness', delta: -1 }, { log: 'Under the blanket the parrot sulked, then said the word anyway, muffled.' }],
      },
    ],
  },
  {
    id: 'pt_sibling_rabbit',
    category: 'family',
    title: 'The abandoned rabbit',
    text: '{{person}} has left for college and {{their}} rabbit has not. It sits in the hutch looking betrayed. Nobody else in the house will claim it.',
    minAge: 8,
    maxAge: 17,
    weight: 0.8,
    once: true,
    conditions: [{ noPerson: ['pet'] }, { inPrison: false }],
    person: { kind: ['sibling'], minAge: 17, maxAge: 24 },
    choices: [
      {
        id: 'adopt',
        label: 'Adopt the rabbit',
        effects: [
          { newPerson: { kind: 'pet', species: 'rabbit', relationship: 60, log: 'The rabbit is mine now. {{person}} and I have an understanding about carrots.' } },
          { stat: 'happiness', delta: 4 },
          { karma: 2 },
          { relationship: 'person', delta: 3 },
          { log: '{{person}} sent a thumbs-up from the dorms and has not mentioned the rabbit since.', kind: 'good' },
        ],
      },
      {
        id: 'nag',
        label: 'Make {{person}} come get it',
        effects: [
          { relationship: 'person', delta: -5 },
          {
            chance: 0.6,
            then: [{ log: '{{person}} drove back grumbling and took the rabbit. It did not look grateful either.' }, { stat: 'happiness', delta: 1 }],
            else: [{ log: '{{person}} said {{they}} would deal with it and did not. I fed it anyway.', kind: 'bad' }, { stat: 'happiness', delta: -2 }, { karma: 1 }],
          },
        ],
      },
      {
        id: 'rehome',
        label: "Give it to a neighbor's kid",
        effects: [{ karma: 2 }, { stat: 'happiness', delta: 1 }, { log: 'A small child next door now owns a rabbit and will not stop thanking me.' }],
      },
    ],
  },
  {
    id: 'pt_first_night_home',
    category: 'family',
    title: 'First night home',
    text: 'The new arrival has spent the first evening inspecting every corner of the house and is now wide awake at two in the morning, which means I am too.',
    minAge: 4,
    maxAge: 85,
    weight: 1,
    followUpOnly: true,
    conditions: [{ inPrison: false }],
    choices: [
      {
        id: 'sofa',
        label: 'Sleep on the sofa with it',
        effects: [{ relationship: 'pet', delta: 8 }, { stat: 'happiness', delta: 3 }, { stat: 'health', delta: -1 }, { log: 'We fell asleep on the sofa together. My neck did not forgive me for days.', kind: 'good' }],
      },
      {
        id: 'shut',
        label: 'Shut the door and sleep',
        effects: [{ relationship: 'pet', delta: -2 }, { stat: 'health', delta: 1 }, { log: 'Scratching at the door until three. Then silence. Then, at six, enthusiasm.' }],
      },
      {
        id: 'tour',
        label: 'Give it a midnight tour',
        effects: [{ relationship: 'pet', delta: 5 }, { stat: 'happiness', delta: 2 }, { log: 'I showed it every room, including where the vacuum cleaner lives. Mistake. Lifelong enemy made.' }],
      },
    ],
  },
  {
    id: 'pt_pet_sitting_gig',
    category: 'family',
    title: 'The pet-sitting job',
    text: "{{person}} is going away for two weeks and asked me to look after {{their}} dog. There is money in it, and a long list of instructions about the dog's feelings.",
    minAge: 13,
    maxAge: 70,
    weight: 1,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['friend', 'bestFriend', 'sibling', 'coworker'], minAge: 18 },
    choices: [
      {
        id: 'accept',
        label: 'Take the job',
        hint: 'Pays {{$150}}',
        effects: [
          { money: 150 },
          { relationship: 'person', delta: 4 },
          {
            chance: 0.75,
            then: [{ log: 'Two weeks of walks and one chewed slipper. {{person}} came home to a happy dog and paid me in full.', kind: 'money' }, { stat: 'happiness', delta: 3 }, { stat: 'health', delta: 2 }],
            else: [{ log: 'The dog ate the TV remote and I replaced it from my own pocket. {{person}} still paid, awkwardly.', kind: 'bad' }, { money: -40 }, { stat: 'happiness', delta: -2 }],
          },
        ],
      },
      {
        id: 'overcharge',
        label: 'Name a steep price',
        effects: [
          {
            chance: 0.5,
            then: [{ money: 300 }, { karma: -2 }, { log: '{{person}} paid double without blinking. I felt rich and a little greedy.', kind: 'money' }],
            else: [{ relationship: 'person', delta: -5 }, { log: '{{person}} laughed and found a kid down the street who would do it for candy.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'free',
        label: 'Do it for free',
        effects: [{ karma: 3 }, { relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 2 }, { log: 'I did it for nothing. {{person}} brought me back a fridge magnet and a lifetime of favors.', kind: 'good' }],
      },
      {
        id: 'decline',
        label: 'Decline',
        effects: [{ relationship: 'person', delta: -2 }, { log: 'I said no. {{person}} found someone else and the dog, I am told, moved on quickly.' }],
      },
    ],
  },

  // ------------------------------------------------------------- having a pet
  {
    id: 'pt_vet_bill',
    category: 'family',
    title: 'The vet bill',
    text: '{{person}} has stopped eating and lies by the door looking at nothing. The vet frowned, ran tests, and slid a bill across the desk: {{$600}}.',
    minAge: 13,
    maxAge: 85,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'pay',
        label: 'Pay it',
        hint: '{{$600}}',
        conditions: [{ money: { gte: 600 } }],
        effects: [
          { money: -600, payer: 'self' },
          {
            chance: 0.85,
            then: [{ relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 4 }, { log: 'Two nights at the vet and a bag of pills, and {{person}} was back to stealing socks.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -12 }, { log: 'The treatment did not work. We said goodbye to {{person}} in a small quiet room.', kind: 'bad' }, { personDies: true, cause: 'illness' }],
          },
        ],
      },
      {
        id: 'cheaper',
        label: 'Ask for the cheap option',
        hint: '{{$180}}',
        conditions: [{ money: { gte: 180 } }],
        effects: [
          { money: -180, payer: 'self' },
          {
            chance: 0.55,
            then: [{ relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 2 }, { log: 'The basic treatment did the trick, slowly. {{person}} forgave the vet before I did.', kind: 'good' }],
            else: [
              {
                chance: 0.5,
                then: [{ stat: 'happiness', delta: -12 }, { log: 'It was not enough. {{person}} slipped away a week later, at home, on the good blanket.', kind: 'bad' }, { personDies: true, cause: 'illness' }],
                else: [{ money: -400, payer: 'self' }, { stat: 'happiness', delta: -5 }, { log: 'It got worse and I paid for the full treatment anyway. {{person}} pulled through.', kind: 'bad' }],
              },
            ],
          },
        ],
      },
      {
        id: 'parents',
        label: 'Ask my parents to pay',
        conditions: [{ hasPerson: ['mother', 'father'] }],
        effects: [
          { relationship: 'mother', delta: -2 },
          { relationship: 'father', delta: -2 },
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 3 }, { log: 'My parents paid, with a lecture attached. {{person}} recovered. So did I, eventually.', kind: 'good' }],
            else: [
              { log: 'They said no, kindly. I paid for the cheap treatment myself.' },
              { money: -180 },
              {
                chance: 0.6,
                then: [{ relationship: 'person', delta: 3 }, { log: '{{person}} got better on the budget plan and never knew the difference.', kind: 'good' }],
                else: [{ stat: 'happiness', delta: -12 }, { log: 'The cheap treatment was not enough. We lost {{person}} that spring.', kind: 'bad' }, { personDies: true, cause: 'illness' }],
              },
            ],
          },
        ],
      },
      {
        id: 'nature',
        label: 'Let nature decide',
        effects: [
          { karma: -3 },
          {
            chance: 0.4,
            then: [{ relationship: 'person', delta: 2 }, { log: 'Against all advice, {{person}} got better on {{their}} own. I do not recommend my method.' }],
            else: [{ stat: 'happiness', delta: -14 }, { log: '{{person}} did not get better. I think about the bill a lot.', kind: 'bad' }, { personDies: true, cause: 'illness' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pt_ate_something',
    category: 'family',
    title: 'Something inedible',
    text: '{{person}} has eaten an entire sock, part of a candle and, judging by the wrapper, a bar of chocolate. {{They}} seems fine. {{They}} seems too fine.',
    minAge: 13,
    maxAge: 85,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'vet',
        label: 'Emergency vet',
        hint: '{{$400}}',
        conditions: [{ money: { gte: 400 } }],
        effects: [
          { money: -400, payer: 'self' },
          {
            chance: 0.95,
            then: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 2 }, { log: 'They got everything out. The vet held up the sock like a trophy.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -12 }, { log: 'The chocolate had done too much damage. We lost {{person}} that night.', kind: 'bad' }, { personDies: true, cause: 'an accident' }],
          },
        ],
      },
      {
        id: 'helpline',
        label: 'Call the pet poison hotline',
        hint: '{{$30}}',
        effects: [
          { money: -30 },
          { stat: 'smarts', delta: 1 },
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 2 }, { log: 'A calm voice told me what to watch for. By morning the sock had reappeared, unharmed, on the rug.', kind: 'good' }],
            else: [
              {
                chance: 0.8,
                then: [{ money: -400 }, { stat: 'happiness', delta: -2 }, { log: 'The calm voice said, "Vet. Now." It was the right call. {{person}} is fine and I am poorer.', kind: 'bad' }],
                else: [{ stat: 'happiness', delta: -12 }, { log: 'The calm voice said, "Vet. Now." We went, but the chocolate had a head start. We lost {{person}}.', kind: 'bad' }, { personDies: true, cause: 'an accident' }],
              },
            ],
          },
        ],
      },
      {
        id: 'wait',
        label: 'Wait and see',
        effects: [
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: -1 }, { log: 'Everything came out eventually, in the yard, in an order I will not describe.' }],
            else: [
              {
                chance: 0.75,
                then: [{ money: -700 }, { stat: 'happiness', delta: -4 }, { log: 'By midnight {{person}} was in trouble and the emergency vet charged accordingly. {{They}} lived.', kind: 'bad' }],
                else: [{ stat: 'happiness', delta: -14 }, { karma: -2 }, { log: 'I waited too long. {{person}} died in the night. I will not forgive myself quickly.', kind: 'bad' }, { personDies: true, cause: 'an accident' }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'pt_ran_away',
    category: 'family',
    title: 'Gone missing',
    text: 'The gate was open, or the window was, and {{person}} is gone. I have walked every street in {{city}} twice, calling {{their}} name in a voice I did not recognize.',
    minAge: 13,
    maxAge: 85,
    weight: 1.2,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'search',
        label: 'Search all night',
        effects: [
          { stat: 'health', delta: -2 },
          {
            chance: 0.6,
            then: [{ relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 6 }, { log: 'At four in the morning I found {{person}} under a parked van, filthy and delighted to see me.', kind: 'good' }],
            else: [{ log: 'I searched until dawn. {{person}} never came home. I still leave the gate open sometimes.', kind: 'bad' }, { removePerson: true }, { stat: 'happiness', delta: -12 }],
          },
        ],
      },
      {
        id: 'posters',
        label: 'Posters and a reward',
        hint: '{{$80}}',
        effects: [
          { money: -80 },
          {
            chance: 0.75,
            then: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 5 }, { log: 'A kid called three days later. {{person}} had been living like royalty two streets away.', kind: 'good' }],
            else: [{ log: 'The posters went soft in the rain. Nobody called about {{person}}.', kind: 'bad' }, { removePerson: true }, { stat: 'happiness', delta: -12 }],
          },
        ],
      },
      {
        id: 'wait',
        label: 'Leave the door open',
        effects: [
          {
            chance: 0.45,
            then: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 4 }, { log: '{{person}} strolled in two days later as though nothing had happened and demanded dinner.', kind: 'good' }],
            else: [{ log: 'The door stayed open for a month. {{person}} did not come back through it.', kind: 'bad' }, { removePerson: true }, { stat: 'happiness', delta: -10 }],
          },
        ],
      },
    ],
  },
  {
    id: 'pt_local_show',
    category: 'family',
    title: 'The pet show',
    text: '{{city}} is holding its annual pet show in the park: ribbons, a snack tent, and a judge with a clipboard. {{person}} has, to my knowledge, never been judged.',
    minAge: 13,
    maxAge: 80,
    weight: 0.8,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'enter',
        label: 'Enter {{person}}',
        hint: 'Entry {{$25}}',
        effects: [
          { money: -25 },
          {
            random: [
              { weight: 2, effects: [{ money: 150 }, { fame: 1 }, { stat: 'happiness', delta: 8 }, { relationship: 'person', delta: 6 }, { log: '{{person}} won. First place, a ribbon the size of a dinner plate and a gift card. I cried a bit.', kind: 'milestone' }] },
              { weight: 4, effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'person', delta: 3 }, { log: "{{person}} got a ribbon for 'Most Enthusiastic,' which the judge handed over with a straight face.", kind: 'good' }] },
              { weight: 2, effects: [{ stat: 'happiness', delta: -2 }, { log: '{{person}} disgraced us in front of the judge in a way that cleared the snack tent.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'train',
        label: 'Train for weeks first',
        hint: 'Classes {{$90}}',
        conditions: [{ money: { gte: 90 } }],
        effects: [
          { money: -90, payer: 'self' },
          { stat: 'health', delta: 1 },
          { relationship: 'person', delta: 5 },
          {
            random: [
              { weight: 4, effects: [{ money: 150 }, { fame: 1 }, { stat: 'happiness', delta: 9 }, { log: 'All those weeks paid off. {{person}} sat, stayed, and won. The judge asked who trained {{them}}.', kind: 'milestone' }] },
              { weight: 3, effects: [{ stat: 'happiness', delta: 3 }, { log: 'Second place. {{person}} ate the ribbon. We were both happy.', kind: 'good' }] },
              { weight: 1, effects: [{ stat: 'happiness', delta: -3 }, { log: 'On the day, {{person}} forgot everything and sat on the judge. Lessons wasted.', kind: 'bad' }] },
            ],
          },
        ],
      },
      {
        id: 'skip',
        label: 'Skip it',
        effects: [{ relationship: 'person', delta: 2 }, { stat: 'happiness', delta: 1 }, { log: 'We stayed home. {{person}} slept on my feet and was, in my private judging, first.' }],
      },
    ],
  },
  {
    id: 'pt_getting_old',
    category: 'family',
    title: 'Gray whiskers',
    text: '{{person}} is old now. The stairs take planning, the zoomies are a memory, and {{they}} sleeps most of the day in the one patch of sun. {{They}} still knows my step.',
    minAge: 10,
    maxAge: 90,
    weight: 1.5,
    cooldown: 2,
    conditions: [{ inPrison: false }],
    person: { kind: ['pet'], minAge: 10 },
    choices: [
      {
        id: 'cherish',
        label: 'Make every day good',
        effects: [
          { relationship: 'person', delta: 6 },
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.3,
            then: [{ log: 'One morning {{person}} did not wake up, warm and asleep in the sun. It was a good last year.', kind: 'bad' }, { personDies: true, cause: 'old age' }, { stat: 'happiness', delta: -10 }],
            else: [{ log: 'Slow mornings, soft food, the best spot on the sofa. Another year with {{person}}, and a good one.', kind: 'good' }],
          },
        ],
      },
      {
        id: 'senior_care',
        label: 'Pay for senior care',
        hint: '{{$300}}',
        conditions: [{ money: { gte: 300 } }],
        effects: [
          { money: -300, payer: 'self' },
          { relationship: 'person', delta: 4 },
          {
            chance: 0.15,
            then: [{ log: 'Even with the best care, {{person}} slipped away quietly this year. The vet said we did everything.', kind: 'bad' }, { personDies: true, cause: 'old age' }, { stat: 'happiness', delta: -10 }],
            else: [{ log: 'Joint supplements, a heated bed, a vet who knows {{them}} by name. {{person}} is creaky but content.', kind: 'good' }, { stat: 'happiness', delta: 2 }],
          },
        ],
      },
      {
        id: 'course',
        label: 'Let nature take its course',
        effects: [
          {
            chance: 0.4,
            then: [{ log: '{{person}} died this year, old and tired, with {{their}} head on my foot.', kind: 'bad' }, { personDies: true, cause: 'old age' }, { stat: 'happiness', delta: -9 }],
            else: [{ log: '{{person}} kept going, stubborn as ever. Old age has not been told about {{them}} yet.' }, { relationship: 'person', delta: 1 }],
          },
        ],
      },
    ],
  },
  {
    id: 'pt_furniture',
    category: 'family',
    title: 'The sofa',
    text: 'I came home to find the sofa gutted like a fish and {{person}} sitting in the stuffing, radiating innocence. There is foam in rooms the sofa has never been in.',
    minAge: 13,
    maxAge: 85,
    weight: 1.5,
    cooldown: 3,
    conditions: [{ inPrison: false }],
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'replace',
        label: 'Replace the sofa',
        hint: '{{$350}}',
        conditions: [{ money: { gte: 350 } }],
        effects: [{ money: -350, payer: 'self' }, { stat: 'happiness', delta: 1 }, { log: 'New sofa. {{person}} tested it within the hour and, for now, approves of it structurally.', kind: 'money' }],
      },
      {
        id: 'live',
        label: 'Live with it',
        effects: [{ asset: 'damage', kind: 'house', amount: 8 }, { stat: 'happiness', delta: -4 }, { log: 'A blanket over the hole. Guests pretend not to notice. {{person}} sleeps in the crater.' }],
      },
      {
        id: 'scold',
        label: 'Scold {{them}}',
        effects: [
          { relationship: 'person', delta: -6 },
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ log: 'A stern talk. {{person}} looked devastated for a full minute and never touched the sofa again.' }],
            else: [{ asset: 'damage', kind: 'house', amount: 8 }, { stat: 'happiness', delta: -3 }, { log: '{{person}} listened, blinked, and shredded the armchair the next day.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pt_noise_complaint',
    category: 'family',
    title: 'The note',
    text: "A note under my door, in capital letters, about the racket {{person}} makes whenever I go out. The neighbor has underlined 'EVERY DAY' twice and signed it 'Regards.'",
    minAge: 18,
    maxAge: 85,
    weight: 1.2,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'apologise',
        label: 'Apologize with cake',
        hint: '{{$25}}',
        conditions: [{ money: { gte: 25 } }],
        effects: [{ money: -25 }, { karma: 2 }, { stat: 'happiness', delta: 1 }, { log: 'Cake and an apology. The neighbor thawed and called {{person}} "kind of sweet, actually."', kind: 'good' }],
      },
      {
        id: 'ignore',
        label: 'Ignore it',
        effects: [
          { karma: -1 },
          {
            chance: 0.5,
            then: [{ money: -150 }, { stat: 'happiness', delta: -4 }, { log: 'The city got involved: a fine, a warning, and a neighbor who now waves with one finger.', kind: 'bad' }],
            else: [{ log: 'No more notes. Either {{person}} got quieter or the neighbor moved. I did not ask.' }],
          },
        ],
      },
      {
        id: 'trainer',
        label: 'Hire a trainer',
        hint: '{{$120}}',
        conditions: [{ money: { gte: 120 } }],
        effects: [
          { money: -120 },
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 2 }, { log: 'Three sessions and a puzzle feeder. {{person}} now spends my absences on puzzles, not howling.', kind: 'good' }],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'The trainer left shaking her head. {{person}} howled her out the door.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pt_allergy',
    category: 'family',
    title: 'The sneezing',
    text: 'I have been sneezing for a month and the doctor has an opinion: it is {{person}}. Hair, dander, the works. {{They}} sat on my lap through the whole phone call.',
    minAge: 13,
    maxAge: 80,
    weight: 0.7,
    once: true,
    conditions: [{ inPrison: false }],
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'meds',
        label: 'Antihistamines and hope',
        hint: '{{$60}}',
        effects: [
          { money: -60 },
          {
            chance: 0.65,
            then: [{ stat: 'health', delta: 1 }, { stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 3 }, { log: 'One pill a day and a lot of vacuuming. {{person}} stays. My nose can cope.', kind: 'good' }],
            else: [{ stat: 'health', delta: -3 }, { stat: 'happiness', delta: -2 }, { log: 'The pills took the edge off and no more. {{person}} and I sneeze through it together.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'rehome',
        label: 'Rehome {{person}}',
        effects: [{ log: 'A friend with a big yard took {{person}}. I get photos. I cannot look at them yet.', kind: 'bad' }, { removePerson: true }, { stat: 'happiness', delta: -10 }, { stat: 'health', delta: 4 }],
      },
      {
        id: 'tough',
        label: 'Tough it out',
        effects: [{ stat: 'health', delta: -4 }, { stat: 'happiness', delta: 2 }, { relationship: 'person', delta: 5 }, { log: 'I chose {{person}} over breathing properly. No regrets. Some tissues.' }],
      },
    ],
  },
  {
    id: 'pt_landlord',
    category: 'family',
    title: 'No pets allowed',
    text: "My landlord did an inspection and met {{person}}, who was not mentioned in the lease. He has given me a week to 'resolve the situation' and keeps saying the word 'deposit.'",
    minAge: 18,
    maxAge: 70,
    weight: 0.8,
    once: true,
    conditions: [{ noAsset: 'house' }, { inPrison: false }],
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'deposit',
        label: 'Pay a pet deposit',
        hint: '{{$500}}',
        conditions: [{ money: { gte: 500 } }],
        effects: [{ money: -500 }, { stat: 'happiness', delta: 1 }, { log: 'Money changed hands and {{person}} became, officially, a tenant.', kind: 'money' }],
      },
      {
        id: 'hide',
        label: 'Hide {{them}} better',
        effects: [
          { karma: -1 },
          {
            chance: 0.6,
            then: [{ log: 'Inspections now involve {{person}} in the car and me sweating. It works. Mostly.' }],
            else: [{ money: -800 }, { stat: 'happiness', delta: -8 }, { log: 'He found the food bowl. We were out by the end of the month. Moving costs are not small.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'rehome',
        label: 'Rehome {{person}}',
        effects: [{ log: 'My cousin took {{person}}. I visit. {{They}} greets me like a stranger who smells familiar.', kind: 'bad' }, { removePerson: true }, { stat: 'happiness', delta: -9 }, { karma: -1 }],
      },
    ],
  },
  {
    id: 'pt_bed_dispute',
    category: 'family',
    title: 'Three in a bed',
    text: '{{person}} sleeps on the bed. My partner would like {{person}} not to sleep on the bed. Both parties have made their position clear, one of them by lying on my pillow.',
    minAge: 18,
    maxAge: 80,
    weight: 1,
    cooldown: 5,
    conditions: [{ hasLover: true }, { inPrison: false }],
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'pet',
        label: 'Side with {{person}}',
        effects: [{ relationship: 'person', delta: 6 }, { relationship: 'lover', delta: -5 }, { relationship: 'spouse', delta: -5 }, { stat: 'happiness', delta: 2 }, { log: '{{person}} kept the bed. My partner kept score.' }],
      },
      {
        id: 'partner',
        label: 'Side with my partner',
        effects: [{ relationship: 'person', delta: -5 }, { relationship: 'lover', delta: 5 }, { relationship: 'spouse', delta: 5 }, { stat: 'happiness', delta: -2 }, { log: '{{person}} was banished to the hall and lay against the door all night, sighing with intent.' }],
      },
      {
        id: 'bed',
        label: 'Buy a luxury pet bed',
        hint: '{{$80}}',
        effects: [
          { money: -80 },
          { stat: 'happiness', delta: 2 },
          {
            chance: 0.5,
            then: [{ relationship: 'person', delta: 3 }, { relationship: 'lover', delta: 3 }, { relationship: 'spouse', delta: 3 }, { log: 'The new bed is a hit. Everyone sleeps. Peace in our time.', kind: 'good' }],
            else: [{ log: 'The new bed is used by nobody. {{person}} sleeps on top of us both. The bed was {{$80}}.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pt_bring_to_work',
    category: 'family',
    title: 'Pets at work',
    text: '{{company}} has announced a bring-your-pet-to-work day. It was decided by a committee that has clearly never met {{person}}, who is already excited and does not know why.',
    minAge: 18,
    maxAge: 70,
    weight: 0.8,
    cooldown: 4,
    conditions: [{ hasJob: true }, { inPrison: false }],
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'bring',
        label: 'Bring {{person}}',
        effects: [
          {
            chance: 0.6,
            then: [{ jobPerformance: 4 }, { stat: 'happiness', delta: 6 }, { relationship: 'person', delta: 4 }, { log: '{{person}} was the most popular coworker in the building by lunch. The boss wants {{them}} back.', kind: 'good' }],
            else: [{ jobPerformance: -5 }, { stat: 'happiness', delta: -3 }, { log: "{{person}} ate the director's sandwich and then, somehow, part of a presentation. We were sent home.", kind: 'bad' }],
          },
        ],
      },
      {
        id: 'home',
        label: 'Leave {{them}} at home',
        effects: [{ stat: 'happiness', delta: -1 }, { relationship: 'person', delta: -1 }, { log: "I spent the day admiring other people's pets and feeling disloyal." }],
      },
      {
        id: 'photo',
        label: 'Bring a framed photo',
        effects: [{ stat: 'happiness', delta: 2 }, { log: 'I put a framed photo of {{person}} on my desk. It won "best behaved" in the office vote.' }],
      },
    ],
  },
  {
    id: 'pt_park_regulars',
    category: 'family',
    title: 'The park regulars',
    text: 'Every morning at the same time, {{person}} and I do a lap of the park, and I keep meeting the same people: the man with three greyhounds, the woman who knows every pet by name and no human by theirs.',
    minAge: 14,
    maxAge: 75,
    weight: 1,
    cooldown: 4,
    conditions: [{ inPrison: false }],
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'chat',
        label: 'Stop and chat',
        effects: [
          { relationship: 'person', delta: 2 },
          {
            chance: 0.6,
            then: [
              { newPerson: { kind: 'friend', relationship: 50, log: 'The greyhound man turned out to be called {{person}}. We are, somehow, friends now.' } },
              { stat: 'happiness', delta: 4 },
              { log: 'Mornings have a purpose now. {{person}} is suspicious of the greyhounds but tolerates the man.', kind: 'good' },
            ],
            else: [{ stat: 'happiness', delta: 1 }, { log: 'Small talk about the weather and flea medicine. Nobody exchanged names. That seems to be the rule.' }],
          },
        ],
      },
      {
        id: 'headphones',
        label: 'Keep my headphones in',
        effects: [{ relationship: 'person', delta: 3 }, { stat: 'happiness', delta: 1 }, { log: 'Just me, {{person}} and a podcast. The greyhound man nods. I nod. This is enough.' }],
      },
      {
        id: 'picnic',
        label: 'Organize a park picnic',
        hint: '{{$40}}',
        effects: [
          { money: -40 },
          { karma: 2 },
          {
            chance: 0.5,
            then: [
              { newPerson: { kind: 'friend', relationship: 55, log: 'The picnic produced one real friend, {{person}}, and about forty pigs in a blanket.' } },
              { stat: 'happiness', delta: 5 },
              { log: 'Eleven dogs, one cat on a leash, no incidents worth a lawsuit. A success by any measure.', kind: 'good' },
            ],
            else: [{ stat: 'happiness', delta: -2 }, { log: 'It rained. Four people came. {{person}} ate most of the snacks, which was arguably the plan.', kind: 'bad' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pt_lonely_pet',
    category: 'family',
    title: 'Waiting at the window',
    text: 'The neighbors tell me {{person}} sits at the window all day, every day, until I come home. I did not know that. Now I cannot stop thinking about it.',
    minAge: 16,
    maxAge: 80,
    weight: 0.8,
    once: true,
    conditions: [{ inPrison: false }],
    person: { kind: ['pet'], minRelationship: 55 },
    choices: [
      {
        id: 'home',
        label: 'Spend more time at home',
        effects: [{ relationship: 'person', delta: 8 }, { stat: 'happiness', delta: 4 }, { energy: -1 }, { log: 'I rearranged my weeks around {{person}}. The window is now mostly for weather.', kind: 'good' }],
      },
      {
        id: 'companion',
        label: 'Get {{them}} a companion',
        hint: '{{$120}}',
        conditions: [{ money: { gte: 120 } }],
        effects: [
          { money: -120, payer: 'self' },
          {
            random: [
              { weight: 1, effects: [{ newPerson: { kind: 'pet', species: 'cat', relationship: 55, log: 'A second pet: {{person}}, a cat with no fear of anything.' } }] },
              { weight: 1, effects: [{ newPerson: { kind: 'pet', species: 'dog', relationship: 55, log: 'A second pet: {{person}}, a dog who thinks everyone is already a friend.' } }] },
            ],
          },
          {
            chance: 0.7,
            then: [{ relationship: 'person', delta: 5 }, { stat: 'happiness', delta: 6 }, { log: 'After a week of cautious sniffing they became a unit. The window is unattended.', kind: 'good' }],
            else: [{ relationship: 'person', delta: -3 }, { stat: 'happiness', delta: 1 }, { log: 'They tolerate each other at best. Now two faces wait at the window.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'camera',
        label: 'Install a pet camera',
        hint: '{{$60}}',
        effects: [{ money: -60 }, { stat: 'happiness', delta: -1 }, { stat: 'smarts', delta: 1 }, { log: 'I now watch {{person}} wait for me from my desk. It has made nothing better and everything clearer.' }],
      },
    ],
  },
  {
    id: 'pt_holiday_roast',
    category: 'family',
    title: 'The roast',
    text: 'The whole family came for dinner. The roast rested on the counter for exactly as long as it took {{person}} to get it onto the floor and halfway through it.',
    minAge: 18,
    maxAge: 85,
    weight: 0.8,
    cooldown: 5,
    conditions: [{ inPrison: false }],
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'takeaway',
        label: 'Laugh and order takeout',
        hint: '{{$70}}',
        effects: [{ money: -70 }, { stat: 'happiness', delta: 4 }, { relationship: 'person', delta: 2 }, { log: 'Takeout for nine. The story improved with every telling. {{person}} slept through dessert.', kind: 'good' }],
      },
      {
        id: 'serve',
        label: "Serve what's left",
        effects: [
          { karma: -2 },
          {
            chance: 0.5,
            then: [{ stat: 'happiness', delta: 2 }, { log: 'I trimmed the edges and said nothing. Nobody noticed. {{person}} and I share a secret now.' }],
            else: [{ illness: 'food_poisoning' }, { stat: 'happiness', delta: -5 }, { log: 'Someone noticed a tooth mark. Then everyone noticed. Then I got sick, which felt fair.', kind: 'bad' }],
          },
        ],
      },
      {
        id: 'banish',
        label: 'Banish {{person}} outside',
        effects: [{ relationship: 'person', delta: -5 }, { stat: 'happiness', delta: -2 }, { log: '{{person}} spent dinner at the back door, watching us eat salad, radiating remorse and beef.' }],
      },
    ],
  },
  {
    id: 'pt_kid_and_pet',
    category: 'family',
    title: 'Best friends',
    text: 'My kid and {{person}} have become inseparable. They share a bed, a cookie and, I suspect, a secret language. Today my kid tried to sign {{person}} up for school.',
    minAge: 25,
    maxAge: 50,
    weight: 1,
    cooldown: 5,
    conditions: [{ hasChildren: true }, { inPrison: false }],
    person: { kind: ['pet'] },
    choices: [
      {
        id: 'encourage',
        label: 'Encourage it',
        effects: [{ relationship: 'child', delta: 4 }, { relationship: 'person', delta: 4 }, { stat: 'happiness', delta: 5 }, { log: 'I let them be. A child who loves an animal is a child learning something I cannot teach.', kind: 'good' }],
      },
      {
        id: 'rules',
        label: 'Set some rules',
        effects: [{ relationship: 'child', delta: -2 }, { stat: 'health', delta: 1 }, { log: 'No pets in the bathtub, no sharing cookies. The rules lasted two weeks.' }],
      },
      {
        id: 'photos',
        label: 'Take a thousand photos',
        effects: [
          { stat: 'happiness', delta: 3 },
          {
            chance: 0.3,
            then: [{ fame: 1 }, { money: 100 }, { log: 'One photo went viral. A magazine paid for it. Now my kid wants an agent.', kind: 'money' }],
            else: [{ log: 'A thousand photos, four of them in focus. Those four are on every wall in the house.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'pt_old_toy',
    category: 'family',
    title: 'Under the sofa',
    text: "Moving the sofa, I found {{person}}'s old toy, chewed flat and still faintly smelling of {{them}}. I sat on the floor for a while and did not move the sofa back.",
    minAge: 8,
    maxAge: 90,
    weight: 0.7,
    once: true,
    conditions: [{ inPrison: false }],
    person: { kind: ['pet'], alive: false },
    choices: [
      {
        id: 'keep',
        label: 'Keep it',
        effects: [{ stat: 'happiness', delta: 1 }, { log: 'It lives in a drawer now. I know exactly which drawer.' }],
      },
      {
        id: 'shelter',
        label: 'Visit the shelter',
        conditions: [{ noPerson: ['pet'] }],
        effects: [
          { karma: 1 },
          {
            chance: 0.6,
            then: [
              {
                random: [
                  { weight: 1, effects: [{ newPerson: { kind: 'pet', species: 'cat', relationship: 55, log: 'I did not mean to come home with {{person}}. {{They}} had other plans.' } }] },
                  { weight: 1, effects: [{ newPerson: { kind: 'pet', species: 'dog', relationship: 55, log: 'I did not mean to come home with {{person}}. {{They}} had other plans.' } }] },
                ],
              },
              { stat: 'happiness', delta: 6 },
              { log: 'Not a replacement. Nothing is. But the house has footsteps in it again.', kind: 'milestone' },
            ],
            else: [{ stat: 'happiness', delta: 2 }, { log: 'I walked the kennels and petted everyone and went home alone. Not yet. But soon, maybe.' }],
          },
        ],
      },
      {
        id: 'bin',
        label: 'Throw it away',
        effects: [{ stat: 'happiness', delta: -3 }, { log: 'I put it in the trash, then took it out, then put it back. Three times.' }],
      },
    ],
  },
];

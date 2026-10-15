import type { EventDef } from '@/engine/events/schema';

export const CHILDHOOD_EVENTS: EventDef[] = [
  {
    id: 'first_steps',
    category: 'childhood',
    title: 'First steps',
    text: 'I took my first wobbly steps across the living room today. {{mother}} screamed with joy.',
    minAge: 1,
    maxAge: 1,
    weight: 3,
    once: true,
    choices: [{ id: 'ok', label: 'Keep walking', effects: [{ stat: 'happiness', delta: 3 }, { relationship: 'mother', delta: 3 }] }],
  },
  {
    id: 'broke_vase',
    category: 'childhood',
    title: 'Uh oh',
    text: 'I knocked over a vase while playing. {{person}} walked in just as it shattered.',
    minAge: 3,
    maxAge: 8,
    weight: 2,
    cooldown: 3,
    person: { kind: ['mother', 'father'] },
    choices: [
      { id: 'confess', label: 'Confess', effects: [{ karma: 2 }, { relationship: 'person', delta: 2 }, { log: '{{person}} appreciated my honesty, even if {{they}} sighed a lot.' }] },
      { id: 'blame', label: 'Blame the cat', effects: [{ karma: -3 }, { chance: 0.5, then: [{ log: 'The lie worked. I felt a little bad.' }, { stat: 'happiness', delta: -1 }], else: [{ log: "We don't even have a cat. {{person}} was not amused.", kind: 'bad' }, { relationship: 'person', delta: -6 }] }] },
    ],
  },
  {
    id: 'playground_bully',
    category: 'childhood',
    title: 'Playground trouble',
    text: 'A bigger kid shoved me off the slide and laughed.',
    minAge: 5,
    maxAge: 11,
    weight: 2,
    cooldown: 3,
    choices: [
      { id: 'tell', label: 'Tell a teacher', effects: [{ chance: 0.7, then: [{ log: 'The teacher stepped in. The bully left me alone after that.', kind: 'good' }, { stat: 'happiness', delta: 2 }], else: [{ log: 'The teacher shrugged. The bully called me a snitch.', kind: 'bad' }, { stat: 'happiness', delta: -4 }] }] },
      { id: 'fight', label: 'Shove back', effects: [{ chance: 0.5, then: [{ log: 'I stood my ground and they backed off. I felt ten feet tall.', kind: 'good' }, { stat: 'happiness', delta: 4 }], else: [{ log: 'I lost the scuffle and scraped my knee.', kind: 'bad' }, { injury: 3 }, { stat: 'happiness', delta: -3 }] }, { karma: -1 }] },
      { id: 'walk', label: 'Walk away', effects: [{ stat: 'happiness', delta: -2 }, { karma: 1 }, { log: 'I walked away. Some days that is the braver choice.' }] },
    ],
  },
];

import { ILLNESSES } from '@/data/illnesses';
import { majorProse } from '@/data/majors';
import { renderText } from '../events/text';
import { createLife } from '../systems/character';
import { yearlyHealth } from '../systems/health';
import { Rng } from '../rng';
import type { Job } from '../types';
import { article, deathPhrase, joinList, lowerTitle, roleWithArticle, sentence, withArticle } from '../util';

describe('prose helpers', () => {
  it('picks a or an by sound, including acronyms', () => {
    expect(withArticle('engineer')).toBe('an engineer');
    expect(withArticle('nurse')).toBe('a nurse');
    expect(withArticle('EMT')).toBe('an EMT');
    expect(withArticle('HR assistant')).toBe('an HR assistant');
    expect(withArticle('UX lead')).toBe('a UX lead');
    expect(article('university')).toBe('a');
    expect(article('honest mistake')).toBe('an');
  });

  it('lower-cases job titles but keeps acronyms', () => {
    expect(lowerTitle('Apprentice Electrician')).toBe('apprentice electrician');
    expect(lowerTitle('VP of Sales')).toBe('VP of sales');
    expect(lowerTitle('EMT')).toBe('EMT');
    expect(roleWithArticle('IT Specialist')).toBe('an IT specialist');
    expect(roleWithArticle('Mayor')).toBe('mayor');
    expect(roleWithArticle('Member of Parliament')).toBe('a member of Parliament');
  });

  it('writes majors in lower case, except proper nouns', () => {
    expect(majorProse('computer_science')).toBe('computer science');
    expect(majorProse('english')).toBe('English');
  });

  it('joins lists and ends sentences cleanly', () => {
    expect(joinList(['a'])).toBe('a');
    expect(joinList(['a', 'b'])).toBe('a and b');
    expect(joinList(['a', 'b', 'c'])).toBe('a, b, and c');
    expect(sentence('I was hired at Crescent Ltd.')).toBe('I was hired at Crescent Ltd.');
    expect(sentence('I was hired at Apex Group')).toBe('I was hired at Apex Group.');
  });

  it('phrases a death by its cause', () => {
    expect(deathPhrase('cancer')).toBe('died of cancer');
    expect(deathPhrase('a heart attack')).toBe('died of a heart attack');
    expect(deathPhrase('a car accident')).toBe('died in a car accident');
    expect(deathPhrase('a car crash on prom night')).toBe('died in a car crash on prom night');
    expect(deathPhrase('a house fire')).toBe('died in a house fire');
    expect(deathPhrase('died in a wildfire')).toBe('died in a wildfire');
    expect(deathPhrase('drowned in a rip current trying to save a stranger')).toBe('drowned in a rip current trying to save a stranger');
    expect(deathPhrase('injuries sustained in a prison riot')).toBe('died of injuries sustained in a prison riot');
    expect(deathPhrase('a long illness')).toBe('died after a long illness');
  });
});

describe('rendered text', () => {
  it('capitalizes a lower-case fallback that opens a sentence', () => {
    const s = { ...createLife({}, 5), people: {} };
    expect(renderText('{{mother}} sighed. I said no. {{mother}} laughed, and so did {{mother}}.', s)).toBe('My mother sighed. I said no. My mother laughed, and so did my mother.');
  });

  it('does not double the article of an employer that carries its own', () => {
    const s = createLife({}, 5);
    const job: Job = { defId: 'military', title: 'Private', company: 'the Army', salary: 1, level: 0, performance: 50, yearsHeld: 0, yearsAtLevel: 0, category: 'public', partTime: false, askedThisYear: false, workedHarderThisYear: false };
    const army = { ...s, career: { ...s.career, job } };
    expect(renderText('The {{company}} holiday party. {{company}} sent a card.', army)).toBe('The Army holiday party. The Army sent a card.');
    expect(renderText('Being a {{job}} is hard.', army)).toBe('Being a private is hard.');
  });
});

describe('illness age bands', () => {
  it('never diagnoses a toddler with an adult or teenage illness', () => {
    const grownUp = new Set(ILLNESSES.filter((i) => (i.minAge ?? 0) > 3).map((i) => i.id));
    for (let seed = 1; seed <= 400; seed++) {
      let s = createLife({}, seed);
      s = { ...s, character: { ...s.character, age: 2, stats: { ...s.character.stats, health: 10 } } };
      const next = yearlyHealth(s, new Rng(seed));
      for (const ill of next.health.illnesses) expect(grownUp.has(ill.defId)).toBe(false);
    }
  });
});

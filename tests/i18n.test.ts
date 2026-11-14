import { describe, expect, it } from 'vitest';
import { DICT, pickLang, t } from '../src/i18n';

const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();

describe('i18n', () => {
  it('has the same keys in all three languages', () => {
    const en = Object.keys(DICT.en).sort();
    expect(Object.keys(DICT.it).sort()).toEqual(en);
    expect(Object.keys(DICT.uk).sort()).toEqual(en);
  });

  it('has the same placeholders', () => {
    for (const k of Object.keys(DICT.en) as (keyof typeof DICT.en)[]) {
      expect(holes(DICT.it[k]), k).toEqual(holes(DICT.en[k]));
      expect(holes(DICT.uk[k]), k).toEqual(holes(DICT.en[k]));
    }
  });

  it('picks the language from the browser unless one was chosen', () => {
    expect(pickLang('it-IT', null)).toBe('it');
    expect(pickLang('uk-UA', null)).toBe('uk');
    expect(pickLang('ru-RU', null)).toBe('uk');
    expect(pickLang('de-DE', null)).toBe('en');
    expect(pickLang('it-IT', 'en')).toBe('en');
    expect(pickLang('it-IT', 'xx')).toBe('it');
  });

  it('fills placeholders', () => {
    expect(t('en', 'stamp.cleared', { level: 'II' })).toContain('II');
  });
});

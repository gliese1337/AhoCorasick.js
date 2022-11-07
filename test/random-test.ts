import 'mocha';
import { expect } from 'chai';
import { AhoCorasick } from '../src';

describe("Random tests", () => {
  const chars = "qwertyuiop[]asdfghjkl;'zxcvbnm,./1234567890-=\\`~!@#$%^&*()_+|QWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>?";
  for (let i = 1; i <= 5; i++) {
    const haystack = Array.from({length:200}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
    const needles: string[] = [];
    const nindices: { start: number; end: number; }[] = [];
    for (let j = 0; j < 10; j++) {
      const start = Math.floor(Math.random()*200);
      const end = Math.ceil(Math.random()*(200-start)) + start;
      needles.push(haystack.slice(start, end));
      nindices.push({ start, end });
    }
  
    it(`Find ${needles} in "${haystack}"`, () => {
      const ac = AhoCorasick.build(needles);
      const results = [...ac.search(haystack)];
      const strings = results.map(({ start, end }) => haystack.slice(start, end));
      for (const { start, end } of nindices) {
        expect(results.some(r => r.start === start && r.end === end)).to.be.true;
      }
      const nset = new Set(needles);
      for (const s of strings) {
        expect(nset.has(s)).to.be.true;
      }
    });
  }
});
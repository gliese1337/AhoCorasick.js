import 'mocha';
import { expect } from 'chai';
import { AhoCorasick, Indexable } from '../src';

describe("Random string tests", () => {
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
  
    it(`(${i}) Find ${needles} in "${haystack}"`, () => {
      const ac = AhoCorasick.build(needles);
      const results = [...ac.search(haystack)];
      for (const { start, end } of nindices) {
        expect(results.some(r => r.start === start && r.end === end)).to.be.true;
      }
    });
  }
});

describe("Random char array tests", () => {
  const chars = "qwertyuiop[]asdfghjkl;'zxcvbnm,./1234567890-=\\`~!@#$%^&*()_+|QWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>?";
  for (let i = 1; i <= 5; i++) {
    const haystack = Array.from({length:200}, () => chars[Math.floor(Math.random()*chars.length)]);
    const needles: string[][] = [];
    const nindices: { start: number; end: number; }[] = [];
    for (let j = 0; j < 10; j++) {
      const start = Math.floor(Math.random()*200);
      const end = Math.ceil(Math.random()*(200-start)) + start;
      needles.push(haystack.slice(start, end));
      nindices.push({ start, end });
    }
  
    it(`(${i}) Find ${needles} in "${haystack}"`, () => {
      const ac = AhoCorasick.build(needles);
      const results = [...ac.search(haystack)];
      for (const { start, end } of nindices) {
        expect(results.some(r => r.start === start && r.end === end)).to.be.true;
      }
    });
  }
});

describe("Random number tests", () => {
  for (let i = 1; i <= 5; i++) {
    const haystack = new Uint8Array(Array.from({length:100}, () => Math.floor(Math.random()*256)));
    const needles: Indexable<number>[] = [];
    const nindices: { start: number; end: number; }[] = [];
    for (let j = 0; j < 10; j++) {
      const start = Math.floor(Math.random()*100);
      const end = Math.ceil(Math.random()*(100-start)) + start;
      needles.push(haystack.slice(start, end));
      nindices.push({ start, end });
    }
  
    it(`(${i}) Find ${needles.join(";")} in "${haystack}"`, () => {
      const ac = AhoCorasick.build(needles);
      const results = [...ac.search(haystack)];
      for (const { start, end } of nindices) {
        expect(results.some(r => r.start === start && r.end === end)).to.be.true;
      }
    });
  }
});
import 'mocha';
import { expect } from 'chai';
import { AhoCorasick } from '../src';

describe("Bruno tests", () => {
  // from https://github.com/BrunoRB/ahocorasick/blob/master/test/basic.js
  const testcases = [{
    needles: ['hero', 'heroic'],
    haystack: 'hero',
    indices: [{start:0,end:4,index:0}],
    strings: ['hero'],
  },{
    needles: ['hero', 'heroic', 'heroism'],
    haystack: 'the hero performed a heroic act of heroism',
    indices: [
      {end:8,start:4,index:0},{end:25,start:21,index:0},
      {end:27,start:21,index:1},{end:39,start:35,index:0},{end:42,start:35,index:2},
    ],
    strings: ['hero','hero','heroic','hero','heroism'],
  },{
    needles: ['keyword1', 'keyword2', 'etc'],
    haystack: 'should find keyword1 at position 12 and keyword2 at position 40.',
    indices: [{end:20,start:12,index:0},{end:48,start:40,index:1}],
    strings: ['keyword1','keyword2'],
  },{
    needles: ['he', 'she', 'his', 'hers'],
    haystack: 'she was expecting his visit',
    indices: [{end:3,start:0,index:1},{end:3,start:1,index:0},{end:21,start:18,index:2}],
    strings: ['she','he','his'],
  },{
    needles: ['çp?', 'éâà'],
    haystack: 'éâàqwfwéâéeqfwéâàqef àéçp?ẃ wqqryht cp?',
    indices: [{start:0,end:3,index:1},{start:14,end:17,index:1},{start:23,end:26,index:0}],
    strings: ['éâà', 'éâà', 'çp?'],
  },{
    needles: ['**', '666', 'his', 'n', '\\', '\n'],
    haystack: '\n & 666 ==! \n',
    indices: [{start:0,end:1,index:5},{start:4,end:7,index:1},{start:12,end:13,index:5}],
    strings: ["\n","666","\n"],
  },{
    needles: ['Федеральной', 'ной', 'idea'],
    haystack: '! Федеральной I have no idea what this means.',
    indices: [{start:2,end:13,index:0},{start:10,end:13,index:1},{start:24,end:28,index:2}],
    strings: ['Федеральной', 'ной', 'idea'],
  },{
    needles: ['bla', '😁', '😀', '😀😁😀'],
    haystack: 'Bla 😁 bla 😀 1 😀 - 😀😁😀-',
    indices: [
      {end:6,start:4,index:1},{end:10,start:7,index:0},
      {end:13,start:11,index:2},{end:18,start:16,index:2},{end:23,start:21,index:2},
      {end:25,start:23,index:1},{end:27,start:21,index:3},{end:27,start:25,index:2},
    ],
    strings: ['😁','bla','😀','😀','😀','😁','😀😁😀','😀'],
  },{
    needles: ['bla', '😁', '😀', '°□°', 'w', '┻━┻'],
    haystack: "-  (╯°□°）╯︵ ┻━┻ ",
    indices: [{start:5,end:8,index:3},{start:12,end:15,index:5}],
    strings: ['°□°','┻━┻'],
  },{
    needles: ['.com.au','.com'],
    haystack: 'www.yahoo.com',
    indices: [{start:9,end:13,index:1}],
    strings: ['.com'],
  }];

  for (const { needles, haystack, indices, strings } of testcases) {
    it(`Find ${needles} in "${haystack}"`, () => {
      const ac = AhoCorasick.build(needles);
      const results = [...ac.search(haystack)];
      expect(results).eqls(indices);
      expect(results.map(({ start, end }) => haystack.slice(start, end))).eqls(strings);
    });
  }
});

describe("Node tests", () => {
  // from https://github.com/luicfer/node-AhoCorasick/blob/master/test/AhoCorasick.js
  it(`Find { '123', '321' } in "12321"`, () => {
    const ac = AhoCorasick.build(['123','321']);
    const results = [...ac.search('12321')];
    expect(results).eqls([{start:0,end:3,index:0},{start:2,end:5,index:1}]);
  });
});


describe("Lazy tests", () => {
  // from https://github.com/theLAZYmd/aho-corasick/blob/master/tests/tests.js
  const testcases = [{
    needles: ['a','ab','bab','bc','bca','c','caa'],
    haystack: 'abccab',
    indices: [
      {start:0,end:1,index:0},{start:0,end:2,index:1},
      {start:1,end:3,index:3},{start:2,end:3,index:5},
      {start:3,end:4,index:5},{start:4,end:5,index:0},{start:4,end:6,index:1},
    ],
    strings: ['a','ab','bc','c','c','a','ab'],
  },{
    needles: ['b','c','aa','d','b'],
    haystack: 'caaab',
    indices: [
      {start:0,end:1,index:1},{start:1,end:3,index:2},
      {start:2,end:4,index:2},{start:4,end:5,index:4},
    ],
    strings: ['c','aa','aa','b'],
  },{
    needles: ['a','b','c','aa','d','b'],
    haystack: 'caaab',
    indices: [
      {start:0,end:1,index:2},{start:1,end:2,index:0},
      {start:1,end:3,index:3},{start:2,end:3,index:0},
      {start:2,end:4,index:3},{start:3,end:4,index:0},{start:4,end:5,index:5},
    ],
    strings: ['c','a','aa','a','aa','a','b'],
  }];

  for (const { needles, haystack, indices, strings } of testcases) {
    it(`Find ${needles} in "${haystack}"`, () => {
      const ac = AhoCorasick.build(needles);
      const results = [...ac.search(haystack)];
      expect(results).eqls(indices);
      expect(results.map(({ start, end }) => haystack.slice(start, end))).eqls(strings);
    });
  }
});
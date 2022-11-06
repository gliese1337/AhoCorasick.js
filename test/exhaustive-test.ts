import 'mocha';
import { expect } from 'chai';
import { buildGoto, buildFail, AhoCorasick, compressFail } from '../src';

describe("Aho-Corasick String Matching Tests", () => {
  //const haystack = "the brownish fox quickly jumped over the lazily lounging dog"
  it(`Build machine for {he, she, his, hers}`, () => {
    const goto: { [key: string]: number; }[] = [];
    const fail: number[] = [];
    const output: { [key: number]: number[] } = {};
    buildGoto(["he","she","his","hers"], goto, output);
    buildFail(goto, fail, output);
    compressFail(goto, fail);
    expect(fail).eqls([0,0,0,0,1,2,0,3,0,3]);
    expect(output).eqls({ '2':[2], '5':[3,2], '7':[3], '9':[4] });
    expect(goto).eqls([
      { h: 1, s: 3 },
      { e: 2, i: 6, h: 1, s: 3 },
      { r: 8, h: 1, s: 3 },
      { h: 4, s: 3 },
      { e: 5, i: 6, h: 1, s: 3 },
      { r: 8, h: 1, s: 3 },
      { s: 7, h: 1 },
      { h: 4, s: 3 },
      { s: 9, h: 1 },
      { h: 4, s: 3 }
    ]);
  });

  it(`Find { she, he, hers } is "ushers"`, () => {
    const ac = AhoCorasick.build(["he","she","his","hers"]);
    const results = [...ac.search("ushers")];
    expect(results).eqls([{ start: 1, end: 4 }, { start: 2, end: 4 }, { start: 2, end: 6 }]);
  });
});

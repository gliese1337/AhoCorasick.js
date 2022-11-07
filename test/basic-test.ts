import 'mocha';
import { expect } from 'chai';
import { AhoCorasick } from '../src';

describe("Paper-derived tests", () => {
  /*it(`Build machine for {he, she, his, hers}`, () => {
    const goto: { [key: string]: number; }[] = [];
    const output: { [key: number]: [number,number][] } = {};
    buildAutomaton(["he","she","his","hers"], goto, output);
    expect(output).eqls({ '2':[[2,0]], '5':[[3,1],[2,0]], '7':[[3,2]], '9':[[4,3]] });
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
  });*/

  it(`Find { she, he, hers } is "ushers"`, () => {
    const ac = AhoCorasick.build(["he","she","his","hers"]);
    const results = [...ac.search("ushers")];
    expect(results).eqls([{start:1,end:4,index:1},{start:2,end:4,index:0},{start:2,end:6,index:3}]);
  });

  it(`Should work with any input order`, () => {
    const orders = [
      ["he","she","his","hers"],
      ["she","his","he","hers"],
      ["his","he","she","hers"],
      ["his","she","he","hers"],
      ["she","he","his","hers"],
      ["he","his","she","hers"],
      ["he","she","hers","his"],
      ["she","his","hers","he"],
      ["his","he","hers","she"],
      ["his","she","hers","he"],
      ["she","he","hers","his"],
      ["he","his","hers","she"],
      ["he","hers","she","his"],
      ["she","hers","his","he"],
      ["his","hers","he","she"],
      ["his","hers","she","he"],
      ["she","hers","he","his"],
      ["he","hers","his","she"],
      ["hers","he","she","his"],
      ["hers","she","his","he"],
      ["hers","his","he","she"],
      ["hers","his","she","he"],
      ["hers","she","he","his"],
      ["hers","he","his","she"],
    ];
    for (const needles of orders) {
      const ac = AhoCorasick.build(needles);
      const results = [...ac.search("ushers")];
      results.forEach(r => delete (r as any).index);
      expect(results).eqls([{ start: 1, end: 4 }, { start: 2, end: 4 }, { start: 2, end: 6 }]);
    }
  });

  it(`Should work after deserialization`, () => {
    const ac1 = AhoCorasick.build(["he","she","his","hers"]);
    const json = JSON.stringify(ac1);
    const ac2 = AhoCorasick.load(json);
    const results = [...ac2.search("ushers")];
    expect(results).eqls([{start:1,end:4,index:1},{start:2,end:4,index:0},{start:2,end:6,index:3}]);
  });

  it(`Should work with compiled automaton`, () => {
    const ac = AhoCorasick.build(["he","she","his","hers"]);
    const g = ac.compile();
    const results = [...g("ushers")];
    expect(results).eqls([{start:1,end:4,index:1},{start:2,end:4,index:0},{start:2,end:6,index:3}]);
  });

  it(`Should re-use memory`, () => {
    const ac = AhoCorasick.build(["he","she","his","hers"]);
    const iter = ac.search("ushers", true);
    const results = [iter.next().value];
    expect(results[0]).eqls({start:1,end:4,index:1});
    results.push(iter.next().value);
    expect(results[1]).eqls({start:2,end:4,index:0});
    results.push(iter.next().value);
    expect(results[2]).eqls({start:2,end:6,index:3});
    expect(results[0]).eqls(results[1]);
    expect(results[0]).eqls(results[2]);
  });

  it(`Should re-use memory with compiled automaton`, () => {
    const ac = AhoCorasick.build(["he","she","his","hers"]);
    const iter = ac.compile(true)("ushers");
    const results = [iter.next().value];
    expect(results[0]).eqls({start:1,end:4,index:1});
    results.push(iter.next().value);
    expect(results[1]).eqls({start:2,end:4,index:0});
    results.push(iter.next().value);
    expect(results[2]).eqls({start:2,end:6,index:3});
    expect(results[0]).eqls(results[1]);
    expect(results[0]).eqls(results[2]);
  });
});
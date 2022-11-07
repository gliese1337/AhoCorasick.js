export interface ACMatch {
  start: number;
  end: number;
  index: number;
}
export interface ACAutomaton {
  goto: { [key: string]: number; }[];
  output: { [key: number]: [number, number][] };
}

export enum ACMode {
  ITERATE,
  MREUSE,
  FINDALL,
}

function buildAutomaton(
  needles: string[],
  goto: { [key: string]: number; }[],
  output: { [key: number]: [number,number][] },
) {

  /*
    Build the base trie and partial output function.
    Aho-Corasick Algorithm 2
  */

  let newstate = 0;
  goto[0] = {};
  let i = 0;
  for (const k of needles) {
    let state = 0;
    let j = 0;
    for(;;j++) {
      const nstate = goto[state]?.[k[j]];
      if (nstate === undefined) { break; }
      state = nstate;
    }
    const l = k.length;
    for (; j < l; j++) {
      newstate++;
      goto[state][k[j]] = newstate;
      state = newstate;
      goto[state] = {};
    }
    output[state] = [[l, i++]];
  }

  /*
    Calculate failure links so we can use them
    to calculate the complete output function.
    Aho-Corasick Algorithms 3 & 4
  */

  // for each state reachable from the root,
  // add it to the queue and set its fail
  // transition to the root.
  const fail = new Array(goto.length).fill(0);
  // Compute failure links for states of
  // depth d + 1 from states of depth d.
  const queue = Object.values(goto[0]);
  for (let i = 0; i < queue.length; i++) {
    // while queue is not empty,
    // let r be the next state in queue
    const r = queue[i];
    const delta = goto[r];
    // for each `a` leading to a state `s` from `r`
    for (const [a, s] of Object.entries(delta)) {
      queue.push(s); // queue <- queue + s
      let f = 0;
      setf: {
        let state = fail[r];
        while (!goto[state].hasOwnProperty(a)) {
          if (state === 0) { break setf; }
          state = fail[state];
        }
        f = goto[state][a];
      }
      fail[s] = f;
      const outf = output[f];
      if (outf) {
        if (!output[s]) { output[s] = [...outf]; }
        else { output[s].push(...outf); }
      }
    }
    
    /*
      Once we have computed outputs for the next level,
      we can short-circuit failure links for this level.
    */
    for (const [a, s] of Object.entries(goto[fail[r]])) {
      if (!delta.hasOwnProperty(a)) { delta[a] = s; }
    }
  }
}

/* Three variations on Aho-Corasick Algorithm 1 */

function * search_iter(
  haystack: string,
  goto: { [key: string]: number; }[],
  output: { [key: number]: [number, number][] },
): Generator<ACMatch> {
  let state = 0;
  const len = haystack.length;
  for (let k = 0; k < len; k++) {
    state = goto[state][haystack[k]] ?? 0;
    const o = output[state];
    if (o) {
      for (const [l, i] of o) {
        yield { start: k - l + 1, end: k + 1, index: i };
      }
    }
  }
}

function * search_reuse(
  haystack: string,
  goto: { [key: string]: number; }[],
  output: { [key: number]: [number, number][] },
): Generator<ACMatch> {
  let state = 0;
  const len = haystack.length;
  const out: ACMatch = { start: 0, end: 0, index: 0 };
  for (let k = 0; k < len; k++) {
    state = goto[state][haystack[k]] ?? 0;
    const o = output[state];
    if (o) {
      for (const [l, i] of o) {
        out.start = k - l + 1;
        out.end = k + 1;
        out.index = i;
        yield out;
      }
    }
  }
}

function search_findall(
  haystack: string,
  goto: { [key: string]: number; }[],
  output: { [key: number]: [number, number][] },
): ACMatch[] {
  let state = 0;
  const len = haystack.length;
  const out: ACMatch[] = [];
  for (let k = 0; k < len; k++) {
    state = goto[state][haystack[k]] ?? 0;
    const o = output[state];
    if (o) {
      for (const [l, i] of o) {
        out.push({ start: k - l + 1, end: k + 1, index: i });
      }
    }
  }
  return out;
}

const GeneratorConstructor = function* () {}.constructor as new (arg: string, body: string) => (haystack: string) => Generator<ACMatch>;

function compile(
  mode: ACMode,
  goto: { [key: string]: number; }[],
  output: { [key: number]: [number, number][] },
): ((haystack: string) => Generator<ACMatch>) | ((haystack: string) => ACMatch[]) {
  const body = `
  let state = 0;
  const len = haystack.length;
  ${
    mode === ACMode.MREUSE ? 'const out = {};' :
    mode === ACMode.FINDALL ? 'const out = [];' : ''
  }
  for (let k = 0; k < len; k++) {
    switch(state) {
      ${goto.map((transitions,state) => `
      case ${state}:
      switch(haystack[k]) {
      ${Object.entries(transitions).map(([a,s]) => `
        case ${a === '"' ? `'"'` : '"'+a+'"'}:
          state = ${s};
          ${output[s] ? output[s].map(([l,i]) =>
            mode === ACMode.MREUSE ? `out.start = k - ${l - 1}; out.end = k + 1; out.index = ${i}; yield out;` :
            mode === ACMode.ITERATE ? `yield { start: k - ${l - 1}, end: k + 1, index: ${i} };` :
            `out.push({ start: k - ${l - 1}, end: k + 1, index: ${i} });`
          ).join('\n') : ''}
          continue;`
      ).join('\n')}
      }`).join('\n')}
        
      default:
        state = 0;
        continue;
    }
  }
  ${ mode === ACMode.FINDALL ? 'return out;' : '' }`;
  return new (mode === ACMode.FINDALL ? Function : GeneratorConstructor)("haystack", body) as any;
}

export class AhoCorasick {

  private constructor(
    private goto: { [key: string]: number; }[],
    private output: { [key: number]: [number, number][] },
  ) {}

  public static build(needles: string[]) {
    const ac = new AhoCorasick([], {});
    buildAutomaton(needles, ac.goto, ac.output);
    return ac;
  }

  public static load(a: ACAutomaton | string) {
    if (typeof a === 'string') { a = JSON.parse(a) as ACAutomaton; }
    return new AhoCorasick(a.goto, a.output);
  }

  public static compile(needles: string[]): (haystack: string) => Generator<ACMatch>
  public static compile(needles: string[], mode: ACMode.ITERATE | ACMode.MREUSE): (haystack: string) => Generator<ACMatch>
  public static compile(needles: string[], mode: ACMode.FINDALL): (haystack: string) => ACMatch[]
  public static compile(needles: string[], mode = ACMode.ITERATE): ((haystack: string) => Generator<ACMatch>) | ((haystack: string) => ACMatch[]) {
    const goto: { [key: string]: number; }[] = [];
    const output = {};
    buildAutomaton(needles, goto, output);
    return compile(mode, goto, output);
  }

  public search(haystack: string): Generator<ACMatch>;
  public search(haystack: string, mode: ACMode.ITERATE | ACMode.MREUSE): Generator<ACMatch>;
  public search(haystack: string, mode: ACMode.FINDALL): ACMatch[];
  public search(haystack: string, mode = ACMode.ITERATE): Generator<ACMatch> | ACMatch[] {
    switch(mode) {
      default:
      case ACMode.ITERATE: return search_iter(haystack, this.goto, this.output);
      case ACMode.MREUSE: return search_reuse(haystack, this.goto, this.output);
      case ACMode.FINDALL: return search_findall(haystack, this.goto, this.output);
    }
  }

  public test(haystack: string): boolean {
    return !this.search(haystack).next().done;
  }

  public compile(): (haystack: string) => Generator<ACMatch>
  public compile(mode: ACMode.ITERATE | ACMode.MREUSE): (haystack: string) => Generator<ACMatch>
  public compile(mode: ACMode.FINDALL): (haystack: string) => ACMatch[]
  public compile(mode = ACMode.ITERATE): ((haystack: string) => Generator<ACMatch>) | ((haystack: string) => ACMatch[]) {
    return compile(mode, this.goto, this.output);
  }
}
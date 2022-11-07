export interface ACMatch {
  start: number;
  end: number;
  index: number;
}
export interface ACAutomaton {
  goto: { [key: string]: number; }[];
  output: { [key: number]: [number, number][] };
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

const GeneratorConstructor = function* () {}.constructor as new (arg: string, body: string) => (haystack: string) => Generator<ACMatch>;

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

  public * search(haystack: string, reuse = false): Generator<ACMatch> {
    // Aho-Corasick Algorithm 1
    const { goto, output } = this;
    let state = 0;
    const len = haystack.length;
    if (reuse) {
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
    } else {
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
  }

  public test(haystack: string): boolean {
    return !this.search(haystack).next().done;
  }

  public compile(reuse=false): (haystack: string) => Generator<ACMatch> {
    const body = `
    let state = 0;
    const len = haystack.length;
    ${ reuse ? 'const out = {};' : ''}
    for (let k = 0; k < len; k++) {
      switch(state) {
        ${this.goto.map((transitions,state) => `
        case ${state}:
        switch(haystack[k]) {
        ${Object.entries(transitions).map(([a,s]) => `
          case ${a === '"' ? `'"'` : '"'+a+'"'}:
            state = ${s};
            ${this.output[s] ? this.output[s].map(([l,i]) =>
              reuse ?
                `out.start = k - ${l - 1}; out.end = k + 1; out.index = ${i}; yield out;` :
                `yield { start: k - ${l - 1}, end: k + 1, index: ${i} };`
            ).join('\n') : ''}
            continue;`
        ).join('\n')}
        }`).join('\n')}
          
        default:
          state = 0;
          continue;
      }
    }`;
    return new GeneratorConstructor("haystack", body);
  }
}
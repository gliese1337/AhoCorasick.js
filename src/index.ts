interface ACMatch {
  start: number;
  end: number;
}

interface ACAutomaton {
  goto: { [key: string]: number; }[];
  fail: number[];
  output: { [key: number]: number[] };
}

export function buildGoto(
  needles: string[],
  goto: { [key: string]: number; }[],
  output: { [key: number]: number[] },
) {
  let newstate = 0;
  goto[0] = {};
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
    output[state] = [l];
  }
}

export function buildFail(
  goto: { [key: string]: number; }[],
  fail: number[],
  output: { [key: number]: number[] },
) {

  // for each state reachable from the root,
  // add it to the queue and set its fail
  // transition to the root.
  const queue: number[] = Object.values(goto[0]);
  for (const s of queue) { fail[s] = 0; }
  fail[0] = 0;
  // Compute failure links for states of
  // depth d + 1 from states of depth d.
  for (let i = 0; i < queue.length; i++) {
    // while queue is not empty,
    // let r be the next state in queue
    const r = queue[i];
    // for each `a` leading to a state `s` from `r`
    for (const [a, s] of Object.entries(goto[r])) {
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
  }
}

export function compressFail(
  goto: { [key: string]: number; }[],
  fail: number[],
) {
  // collect level-1 states
  const queue = Object.values(goto[0]);
  for (let i = 0; i < queue.length; i++) {
    const r = queue[i];
    const delta = goto[r];
    
    // collect level d + 1 states
    queue.push(...Object.values(delta));

    // short-circuit failure links for this level
    for (const [a, s] of Object.entries(goto[fail[r]])) {
      if (!delta.hasOwnProperty(a)) { delta[a] = s; }
    }
  }
}

export class AhoCorasick {

  private constructor(
    private goto: { [key: string]: number; }[],
    private fail: number[],
    private output: { [key: number]: number[] },
  ) {}

  public static build(needles: string[]) {
    const ac = new AhoCorasick([], [], {});
    buildGoto(needles, ac.goto, ac.output);
    buildFail(ac.goto, ac.fail, ac.output);
    compressFail(ac.goto, ac.fail);
    return ac;
  }
  
  public toJSON(): ACAutomaton {
    return {
      goto: this.goto,
      fail: this.fail,
      output: this.output,
    };
  }

  public static load(a: ACAutomaton | string) {
    if (typeof a === 'string') { a = JSON.parse(a) as ACAutomaton; }
    return new AhoCorasick(a.goto, a.fail, a.output);
  }

  public * search(haystack: string): Generator<ACMatch> {
    const { goto, output } = this;
    let state = 0;
    const len = haystack.length;
    for (let i = 0; i < len; i++) {
      state = goto[state][haystack[i]] ?? 0;
      const o = output[state];
      if (o) {
        for (const l of o) {
          yield { start: i - l + 1, end: i + 1 };
        }
      }
    }
  }

  public test(haystack: string): boolean {
    return !this.search(haystack).next().done;
  }
}
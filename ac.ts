interface ACMatch {
  start: number;
  length: number;
}

interface JSONNode {
  go: { [key: string]: number };
  fail: number;
  out: string[];
  index: number;
}

class ACNode {
  public go: { [key: string]: ACNode } = {};
  public fail: ACNode = null as any;

	constructor(public out: string[], public index: number) {}

	public * search(s: string, skip = false): Generator<{ index: number; matches: ACMatch[]; }> {
		let i = 0;
		const mapout = (value: string) => {
			const start = i - length + 1;
			return { start, length };
		}

		let q: ACNode = this;
		const e = s.length;

		for (; i < e; i++){
			const c = s[i];
			while(!q.go.hasOwnProperty(c) && q !== this){
				q = q.fail;
			}
			q = q.go[c] || this;
			if (!(skip && q.out.length === 0)) {
				yield { index: i, matches: q.out.map(mapout) };
			}
		}		
	}

	public test(s: string) {
		const { value, done } = this.search(s, true).next();
		return !done || !!value;
	};
	
	public findall(s: string) {
		return [...this.search(s, true)];
	}
	
	public findallstart(s: string) {
		const startgroups = new Map();
		for (const { matches } of this.search(s, true)) {
			for (const match of matches) {
				if (startgroups.has(match.start)){
					startgroups.get(match.start).push(match);
				} else {
					startgroups.set(match.start, [match]);
				}
			}
		}
		
		return [...startgroups.entries()]
			.sort((a, b) => a[0] - b[0])
			.map(([ , v ]) => v);
	};

	public toJSON() { 
		const queue: ACNode[] = [this];
		const output: JSONNode[] = [];

		while (queue.length > 0) {
			const r = queue.shift()!;
			const ngo = {};

			for (const k of Object.keys(r.go)) {
				ngo[k] = r.go[k].index;
				queue.push(r.go[k]);
			}

			output.push({
				go: ngo,
				fail: r.fail.index,
				out: r.out,
				index: r.index
			});
		}
		
		return { nodes: output };
	}
}

export function buildTable(needles: string[]) {
  const root = new ACNode([], 0);
  root.fail = root;

  //Phase 1: build a trie
  let idx = 0;
  for (const needle of needles) {
    let q = root;
    for (const c of needle) {
      if(!q.go.hasOwnProperty(c)){
        q.go[c] = new ACNode([], idx++);
      }
      q = q.go[c];
    }

    q.out.push(needle);
  }

  //Phase 2: add failure links

  // Set failure links for depth-1 states to root
  const queue = Object.values(root.go);
  queue.forEach((r) => { r.fail = root; });

  // Compute states of depth d+1 from states of depth d
  while (queue.length > 0) {
    const r = queue.shift()!;
    for (const k of Object.keys(r.go)) {
      const s = r.go[k];
      queue.push(s);
    
      let state = r.fail;
      while(!state.go.hasOwnProperty(k) && state !== root){
        state = state.fail;
      }

      s.fail = state.go[k] || root;
      s.out.push(...s.fail.out);
    }
  }

  return root;
}

export function readTable(json: { nodes: JSONNode[]; }) {

  //Transform generic JSON objects into ACNodes
  const { nodes: jsnodes } = json;
  const acnodes = new Array<ACNode>(jsnodes.length);
  for (const n of jsnodes) {
    acnodes[n.index] = new ACNode(n.out, n.index);
  }

  //Hook them all up properly
  for (const jn of jsnodes) {
    const acn = acnodes[jn.index];
    acn.fail = acnodes[jn.fail];
    for (const k of Object.keys(jn.go)) {
      acn.go[k] = acnodes[jn.go[k]];
    }
  }

  return acnodes[0];
}
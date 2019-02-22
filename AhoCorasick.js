const AhoCorasick = (function() {
	"use strict";

	function ACNode (out, i) {
		this.go = {};
		this.fail = null;
		this.out = out;
		this.index = i;
	}

	ACNode.prototype.search = function * (s, skip = false) {
		let i = 0;
		const mapout = ({ length, value }) => {
			const start = i-length+1;

			return {
				start, length, value,
				key: s.substr(start,length),
			};
		}

		const q = this;
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
	};

	ACNode.prototype.test = function(s) {
		const { value, done } = this.search(s, true).next();
		return !done || !!value;
	};
	
	ACNode.prototype.findall = function(s) {
		return [...this.search(s, true)];
	};
	
	ACNode.prototype.findallstart = function(s) {
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

	ACNode.prototype.toJSON = function() { 
		const queue = [this];
		const output = [];

		while (queue.length > 0) {
			const r = queue.shift();
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

		output.sort((a,b) => a.index - b.index);
		
		for (const n of output) {
			delete n.index;
		}
		
		return { nodes: output };
	};

	function buildTable(keys) {
		const root = new ACNode([],0);
		root.fail = root;

		//Phase 1: build a trie
		let idx = 0;
		for (const key of keys) {
			const { key: str, value } = (typeof key === "object") ? key : { key };

			let q = root;
			for (const c of str) {
				if(!q.go.hasOwnProperty(c)){
					q.go[c] = new ACNode([],idx++);
				}
				q = q.go[c];
			}

			q.out.push({len: str.length, value});
		});

		//Phase 2: add failure links

		// Set failure links for depth-1 states to root
		const queue = Object.keys(root.go).map((c) => root.go[c]);
		queue.forEach((r) => { r.fail = root; });

		// Compute states of depth d+1 from states of depth d
		while (queue.length > 0) {
			r = queue.shift();
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

	function readTable(json) {

		//Transform generic JSON objects into ACNodes
		const nodes = json.nodes.map((n,i) => [ n, new ACNode(n.out, i) ]);

		//Hook them all up properly
		for (const [ jn, acn ] of nodes) {
			acn.fail = nodes[jn.fail];
			for (const k of Object.keys(jn.go)) {
				acn.go[k] = nodes[jn.go[k]];
			}
		}

		return nodes[0][1];
	}

	return {
		readTable, buildTable
	};
}());

if(module) {
	module.exports = AhoCorasick;
}
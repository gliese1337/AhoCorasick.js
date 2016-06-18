var AhoCorasick = (function(){
	"use strict";

	function ACNode(out, i){
		this.go = {};
		this.fail = null;
		this.out = out;
		this.index = i;
	}

	function ACIterator(q,s){
		var v, i = 0,
			e = s.length - 1,
			root = q;

		function mapout(o){
			var len = o.len,
				start = i-len+1;

			return {
				start: start,
				len: len,
				key: s.substr(start,len),
				value: o.value
			};
		}

		this.next = function(){
			if(i > e){
				return {value: void 0, done: true};
			}

			var c = s[i];

			while(!q.go.hasOwnProperty(c) && q !== root){
				q = q.fail;
			}

			q = q.go[c] || root;
			v = q.out.map(mapout);

			return {
				value: v,
				done: (++i) > e
			};
		};
	}

	ACNode.prototype.search = function(s){
		return new ACIterator(this,s);
	};

	ACNode.prototype.findall = function(s){
		var i, c, q = this,
			e = s.length,
			out = [];

		function mapout(o){
			var len = o.len,
				start = i-len+1;

			return {
				start: start,
				len: len,
				key: s.substr(start,len),
				value: o.value
			};
		}

		for(i = 0; i < e; i++){
			c = s[i];
			while(!q.go.hasOwnProperty(c) && q !== this){
				q = q.fail;
			}
			q = q.go[c] || this;
			[].push.apply(out,q.out.map(mapout));
		}
		return out;
	};

	ACNode.prototype.toJSON = function(){
		var r, ngo,
			queue = [this],
			output = [];

		function updateQueue(a){
			ngo[a] = r.go[a].index;
			queue.push(r.go[a]);
		}

		while(queue.length > 0){
			r = queue.shift();
			ngo = {};

			Object.keys(r.go).forEach(updateQueue);

			output.push({
				go: ngo,
				fail: r.fail.index,
				out: r.out,
				index: r.index
			});
		}

		return {
			nodes: output.sort(function(a,b){
				return a.index < b.index?-1:1;
			})
		};
	};

	function BuildACTable(keys){
		var q, queue, r,
			idx = 0,
			root = new ACNode([],0);

		root.fail = root;

		//Phase 1: build a trie
		keys.forEach(function(key){
			var i, c, e, str, val;

			if(typeof key === "object"){
				str = key.key;
				val = key.value;
			}else{
				str = key+"";
			}

			q = root;
			e = str.length;

			for(i = 0; i < e; i++){
				c = str[i];
				if(!q.go.hasOwnProperty(c)){
					q.go[c] = new ACNode([],++idx);
				}
				q = q.go[c];
			}

			q.out.push({len: e, value: val});
		});

		//Phase 2: add failure links

		// Set failure links for depth-1 states to root
		queue = Object.keys(root.go).map(function(c){ return root.go[c]; });
		queue.forEach(function(r){ r.fail = root; });

		// Compute states of depth d+1 from states of depth d

		function updateQueue(a){
			var state, s = r.go[a];
			queue.push(s);
			state = r.fail;
			while(!state.go.hasOwnProperty(a) && state !== root){
				state = state.fail;
			}
			s.fail = state.go[a] || root;
			[].push.apply(s.out, s.fail.out);
		}

		while(queue.length > 0){
			r = queue.shift();
			Object.keys(r.go).forEach(updateQueue);
		}

		return root;
	}

	function ReadACTable(json){

		//Transform generic JSON objects into ACNodes
		var nodes = json.nodes.map(function(n,i){
			return new ACNode(n.out,i);
		});

		//Hook them all up properly
		json.nodes.forEach(function(n,i){
			var acn = nodes[i];
			acn.fail = nodes[n.fail];
			Object.keys(n).forEach(function(k){
				acn.go[k] = nodes[n.go[k]];
			});
		});

		return nodes[0];
	}

	return {
		readTable: ReadACTable,
		buildTable: BuildACTable
	};
}());
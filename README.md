Aho-Corasick.js
======

This is a JavaScript implementation of the Aho-Corasick String Matching algorithm invented by Alfred V. Aho and Margaret J. Corasick and described in [Efficient String Matching: An Aid to Bibliographic Search](http://cr.yp.to/bib/1975/aho.pdf).

Aho-Corasick is designed to simultaneously match multiple search strings (or "needles") in a single pass over the target text (or "haystack"). This is done in two stages: First, the needles are pre-processed to construct an automaton which can be re-used to efficiently search for the same set of needles in multiple haystacks. Second, the automaton is run on a specific haystack. This package allows constructing automata as JS objects, or compiling automata into native generator functions, as well as serializing and reloading pre-constructed automata for later use.

For efficiency, this library does not store the needles once an automaton is constructed, and does not perform any copying operations on the haystack strings. Results are returned in the form of `ACMatch` objects:

```ts
export interface ACMatch {
    start: number;
    end: number;
    index: number;
}
```

in which the [`start`,`end`) specifies the range of indices in the haystack in which a match was found, and `index` specifies which needle was matched in terms of its index in the input array used when the automaton was constructed, providing two potential methods for retrieving the actual matched string if that is needed.

API
----

The primary export is the `AhoCorasick` class, which has a private constructor but exposes three static builder methods:

* `static build(needles: string[]): AhoCorasick` - Takes in an array of needles to build a new automaton.
* `static load(a: ACAutomaton | string): AhoCorasick` - Takes in a JS object conforming to the `ACAutomaton` interface, or a JSON string which will deserialize to such, and reconstitutes an `AhoCorasick` instance from it.
* `static compile(needles: string[], mode = ACMode.ITERATE): (haystack: string) => (Generator<ACMatch> | ACMatch[])` - Takes in an array of needles and an option search mode and returns a compiled JS `Function` or `GeneratorFunction` which implements the automaton.

The `ACAutomaton` interface is as follows:

```ts
export interface ACAutomaton {
    // an array of objects which map input characters to new states
    goto: {
        [key: string]: number;
    }[];
    // an object which maps machine states to outputs for those states,
    // where each potential output is a pair of a needle length and needle index
    output: {
        [key: number]: [number, number][];
    };
}
```

Calling `JSON.stringify` on an `AhoCorasick` instance will produce a serialized JSON object conforming to this interface. Thus, an `AhoCorasick` instance `ac` can be copied by `AhoCorasick.load(JSON.stringify(ac))`.

Note that `AhoCorasick.compile` *does not* construct an `AhoCorasick` instance and wrap it in a closure; it generates JavaScript code which directly implements the automaton and compiles it with `new Function`. Running this compiled function is considerably more efficient than interpreting an automaton represented as an `AhoCorasick` instance in memory.

The `mode` argument (which also appears on instance methods) has an `ACMode` enum type (also exported by this library), which can be `ACMode.ITERATE`, `ACMode.MREUSE`, or `ACMode.FINDALL`.

* `ACMode.ITERATE` is the default, and produces a generator function which yields each match in a haystack.
* `ACMode.MREUSE` also produces a generator function, but yields the same `ACMatch` object with mutated fields for every match, which reduces memory allocation.
* `ACMode.FINDALL` produces a function which returns an array of all matches in order. This has higher latency to the first result than using the generator modes, and cannot share memory for `ACMatch` objects, but avoids the total time and memory overhead of using the `Iterator` protocol.

`AhoCorasick` instance methods are as follows:

* `search(haystack: string, mode = ACMode.ITERATE): Generator<ACMatch> | ACMatch[]` Executes the automaton to find matches in a haystack.
* `test(haystack: string): boolean` Determines whether or not a haystack contains any matches, without actually returning them.
* `compile(mode = ACMode.ITERATE): (haystack: string) => Generator<ACMatch> | ACMatch[]` Compiles the automaton into a native JS `Function` or `GeneratorFunction`. 

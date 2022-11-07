Aho-Corasick.js
======

This is a JavaScript implementation of the Aho-Corasick String Matching algorithm invented by Alfred V. Aho and Margaret J. Corasick and described in [Efficient String Matching: An Aid to Bibliographic Search](http://cr.yp.to/bib/1975/aho.pdf).

Aho-Corasick is designed to simultaneously match multiple search strings (or "needles") in a single pass over the target text (or "haystack"). This is done in two stages: First, the needles are pre-processed to construct an automaton which can be re-used to efficiently search for the same set of needles in multiple haystacks. Second, the automaton is run on a specific haystack. This package allows constructing automata as JS objects, or compiling automata into native generator functions.

For efficiency, this library does not store the needles once an automaton is constructed, and does not perform any copying operations on the haystak strings. Results are returned in the form of `ACMatch` objects:

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

The primary export is the `AhoCorasick` class, which has a private constructor but exposes two static builder methods:

* `static build(needles: string[]): AhoCorasick` - Takes in an array of needles to build a new automaton.
* `static load(a: ACAutomaton | string): AhoCorasick` - Takes in a JS object conforming to the `ACAutomaton` interface, or a JSON string which will deserialize to such, and reconstitutes an `AhoCorasick` instance from it.

The `ACAutomaton` interface is as follows:

```ts
interface ACAutomaton {
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

`AhoCorasick` instance methods are as follows:

* `search(haystack: string, reuse = false): Generator<ACMatch>` Takes a haystack and returns a `Generator` that iterates over all matches. If `reuse` is set to `true`, it will yield the same `ACMatch` object with mutated fields for every match per haystack, which saves on memory allocation.
* `findall(haystack: string): ACMatch[]` Takes a haystack and returns an array containing all matches. This has higher latency to the first result than using `search`, and cannot share memory for `ACMatch` objects, but avoids the total time and memory overhead of using the `Iterator` protocol.
* `test(haystack: string): boolean` Determines whether or not a haystack contains any matches, without actually returning them.
* `compile(reuse = false): (haystack: string) => Generator<ACMatch>` Compiles the automaton into a native JS `GeneratorFunction`. If `reuse` is set to `true`, the generator will yield the same `ACMatch` object for every match per haystack, which saves on memory allocation. 
* `compile_findall(): (haystack: string) => ACMatch[]` Compiles the automaton into a native JS `Function` object which will return an array of all matches for a given haystack. This has higher latency to the first result than using `compile`, and cannot share memory for `ACMatch` objects, but avoids the total time and memory overhead of using the `Iterator` protocol.
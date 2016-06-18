Aho-Corasick.js
======

This is a JavaScript implementation of the Aho-Corasick String Matching algorithm invented by Alfred V. Aho and Margaret J. Corasick and described in [Efficient String Matching: An Aid to Bibliographic Search](http://cr.yp.to/bib/1975/aho.pdf).

Aho-Corasick is designed to simultaneously match multiple search strings (or "needles") in a single pass over the target text (or "haystack"). This is done in two passes: First, an automaton is constructed which can be re-used to efficiently search for the same set of needles in multiple haystacks. Second, the automaton is run on a specific haystack.

This implementation allows for finding all matches in a given haystack at once, or iterating over each position in the haystack one at a time and returning the matches that end at the current position. Unlike some other implementations, in either case *all* matches are returned- not just the longest or earliest ones.

Methods are also provided for serializing an automaton to JSON and loading from JSON, so that reconstructing an automaton from the original set of needles can be avoided if the same set is going to be used over and over again in different runs of a program.

This implementation also allows pairing needles with auxiliary values that are retrieved whenever a needle is matched. This provides a slight memory and time efficiency improvement over matching a string and then doing a map lookup afterwards. This is particularly useful for, e.g., natural language processing applications, where you may want to associate grammatical or lexicographical information with matched strings.

API
----

* `AhoCorasick.readTable(json)` Loads a previosuly serialized automaton / lookup table object from serialized JSON.
* `AhoCorasick.buildTable(needles)` Constructs a new automaton / lookup table from a list of strings to search for. This can be either a simple array of strings, or an array of `{key: ..., value: ...}` objects, where the `key`s are the search needles and the `value`s are arbitrary objects that will be returned when the associated needle is matched.

Both of these static methods return ACNode objects.

* `ACNode.search(haystack)` Given a haystack string to search, returns an iterator (object with a `.next()` method) which produces the list of matches at each position in the haystack string.
* `ACNode.findall(haystack)` Returns a single list of all matches in a given haystack string at once.

Both oof these methods return lists of result objects of the form `{start: Int, len: Int, key: String, value: Object}`, where `key` is the needles that was matched and `value` is the associated data, if any.

* `ACNode.toJSON()` Returns a flattened version of the search automaton which contains no circular references for use by `JSON.serialize()`.
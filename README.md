Aho-Corasick.js
======

This is a JavaScript implementation of the Aho-Corasick String Matching algorithm invented by Alfred V. Aho and Margaret J. Corasick and described in [Efficient String Matching: An Aid to Bibliographic Search](http://cr.yp.to/bib/1975/aho.pdf).

Aho-Corasick is designed to simultaneously match multiple search strings (or "needles") in a single pass over the target text (or "haystack"). This is done in two stages: First, the needles are pre-processed to construct an automaton which can be re-used to efficiently search for the same set of needles in multiple haystacks. Second, the automaton is run on a specific haystack.

This implementation allows for finding all matches in a given haystack at once, or iterating over each position in the haystack one at a time and returning the matches that end at the current position. Unlike some other implementations, in either case *all* matches are returned--not just the longest or earliest ones.

This implementation also allows pairing needles with auxiliary values that are retrieved whenever a needle is matched. This provides a slight memory and time efficiency improvement over matching a string and then doing a map lookup afterwards. This is particularly useful for, e.g., natural language processing applications, where you may want to associate grammatical or lexicographical information with matched strings.

API
----

* `AhoCorasick.buildTable(needles)` Constructs a new automaton / lookup table from a list of strings to search for. This can be either a simple array of strings, or an array of `{key: ..., value: ...}` objects, where the `key`s are the search needles and the `value`s are arbitrary objects that will be returned when the associated needle is matched.

* `AhoCorasick.readTable(json)` Loads a previosuly serialized automaton / lookup table object from serialized JSON.

Both of these methods return ACNode objects.

* `ACNode.search(haystack, skip = false)` Given a haystack string to search, returns an iterator which produces the list of matches at each position in the haystack string. By default, this will yield a value for every position in the string, with an empty list at positions where no matches terminate. To iterate over only matching positions, pass in `true` for the `skip` parameter.

* `ACNode.test(haystack)` Efficiently determines whether a haystack string contains any matches, without finding all matches.

* `ACNode.findall(haystack)` Returns a single list of all matches in a given haystack string at once.

* `ACNode.findallstart(haystack)` Returns a list of all matches in a given haystack, regrouped according to their stating rather than ending positions.

* `ACNode.toJSON()` Returns a flattened version of the search automaton which contains no circular references for use by `JSON.serialize()`.

The `search`, `findall`, and `findallstart` methods all return results in objects of the form `{start: Int, length: Int, key: String, value: Object}`, where `key` is the needle that was matched and `value` is the associated data, if any.


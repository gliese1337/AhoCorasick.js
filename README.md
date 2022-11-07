Aho-Corasick.js
======

This is a JavaScript implementation of the Aho-Corasick String Matching algorithm invented by Alfred V. Aho and Margaret J. Corasick and described in [Efficient String Matching: An Aid to Bibliographic Search](http://cr.yp.to/bib/1975/aho.pdf).

Aho-Corasick is designed to simultaneously match multiple search strings (or "needles") in a single pass over the target text (or "haystack"). This is done in two stages: First, the needles are pre-processed to construct an automaton which can be re-used to efficiently search for the same set of needles in multiple haystacks. Second, the automaton is run on a specific haystack.


API
----


## Synopsis
> "You do with Mogwai what your society has done with all of nature's gifts! You do not understand! You are not ready. Perhaps someday, you may be ready. Until then, Mogwai will be waiting."
- [Mr. Wing](http://gremlins.wikia.com/wiki/Mr._Wing)

A graph traversal enabled Entity Component System.

This is highly experimental, I would not use this if I where you!

## Code Example
Fetching rooms with walls that have windows and resolving relational dependencies:
```javascript
const W = new World();
createGraphWithRoomsWallsAndWindows(W);
W.fetch((t: M.VertexTraverser) => t
  // rooms with windows
  .hasLabel("window").in().hasLabel("wall").in("has"))
  // subfetching starts from each vertex and applies the traverser.
  .subFetch("walls", (t: M.VertexTraverser) => t
    .out("has").hasLabel("wall"))
  .subFetch("windows", (t: M.VertexTraverser) => t
    .out("has").hasLabel("wall")
    .out("has").hasLabel("window"), "dimensions")
  .collect();
```
Graph traversal that creates co-author edges for vertex v1:
```javascript
G = new Graph();
createGraphWithAuthorsAndAthorship(G);
G.V(v1).as("v1")
  .let("notA", (t) => t.not())
  .let("co-authors", (t) => t.out("author-of").in("author-of") )
  .and("co-authors", "notA").as("co-authors-of-v1")
  .edgeBuilder().from("co-authors-of-v1").to("v1").label("co-author").build();
```
Refer to the tests for actual usages and for many examples on graph traversal and creation.

## Motivation

Entity component systems are great for typical access patterns of simulation tasks (like computer games). But we often encounter relational dependencies in our data. So Mogwai tries to implement a ECS on a graph datastructure and enables resolving and filtering relations by graph traversals.

Mogwai is heavily inspired by [tinkerpop](http://tinkerpop.apache.org/)'s Gremlin graph traversal language. Note however, that Mogwai is not intended to be a graph data base or tinkerpop 3.0 compliant.

## Installation

checkout the project and
```
npm install && npm test
```

## API Reference



## Tests

```
npm install && npm test
```

## License

MIT.

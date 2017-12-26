import { Graph } from "./Graph";

describe("Graph", () => {
  it("adds vertices", () => {
    const G = new Graph();
    G.addVertex();
    G.addVertex();
    expect(G.V().toList().length).toBe(2);
    expect(G.E().toList().length).toBe(0);
  });

  it("adds edges", () => {
    const G = new Graph();
    const v1 = G.addVertex();
    const v2 = G.addVertex();
    const e = G.addEdge(v1, v2);
    expect(G.V().toList()).toEqual([0,1]);
    expect(G.E().toList()).toEqual([0]);

    expect(G.V(0).toList()).toEqual([0]);
    expect(G.V(2).toList()).toEqual([]);
    
    expect(G.E(0).toList()).toEqual([0]);
    expect(G.E(1).toList()).toEqual([]);
  });
});

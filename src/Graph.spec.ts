import { Graph } from "./Graph";
import { VectorStorage } from ".";

describe("Graph", () => {
    it("adds vertices", () => {
        const G = new Graph();
        G.addVertex();
        G.addVertex();
        expect(G.V().toList()).toHaveLength(2);
        expect(G.E().toList()).toHaveLength(0);
    });

    it("adds edges", () => {
        const G = new Graph();
        const v1 = G.addVertex();
        const v2 = G.addVertex();
        G.addEdge(v1, v2);
        expect(G.V().toList()).toEqual([0, 1]);
        expect(G.E().toList()).toEqual([0]);

        expect(G.V([0]).toList()).toEqual([0]);
        expect(G.V([2]).toList()).toEqual([]);

        expect(G.E([0]).toList()).toEqual([0]);
        expect(G.E([1]).toList()).toEqual([]);
    });

    it("removes vertices", () => {
        const G = new Graph();
        const v1 = G.addVertex();
        const v2 = G.addVertex();
        const v3 = G.addVertex();

        G.removeVertex(v2)
        G.removeVertex(v1)

        expect(G.V().toList()).toEqual([v3]);
    });

    it("removes edges", () => {
        const G = new Graph();
        const e1 = G.addEdge(G.addVertex(), G.addVertex());
        const e2 = G.addEdge(G.addVertex(), G.addVertex());
        const e3 = G.addEdge(G.addVertex(), G.addVertex());

        G.removeEdge(e2)
        G.removeEdge(e1)

        expect(G.E().toList()).toEqual([e3]);
    });

    it("removes edges of vertices", () => {
        const G = new Graph();
        const v1 = G.addVertex();
        const v2 = G.addVertex();
        const v3 = G.addVertex();
        const e1 = G.addEdge(v1, v2);
        const e2 = G.addEdge(v2, v3);
        const e3 = G.addEdge(v1, v3);

        G.removeVertex(v2)

        expect(G.E().toList()).toEqual([e3]);
        expect(G.vertexLabels.get("in")!.get(v1)).toEqual(new Set())
        expect(G.vertexLabels.get("out")!.get(v1)).toEqual(new Set([e3]))
        expect(G.vertexLabels.get("in")!.get(v3)).toEqual(new Set([e3]))
        expect(G.vertexLabels.get("out")!.get(v3)).toEqual(new Set([]))
    });

    it("removes labels of vertices", () => {
        const G = new Graph();
        const v = G.addVertex();
        G.registerVertexLabel("label", new VectorStorage())
        G.addVertexLabel(v, "label", {})

        G.removeVertex(v)

        expect(G.vertexLabels.get("label")!.get(v)).toBeUndefined();
    });

    it("removes labels of edges", () => {
        const G = new Graph();
        const e = G.addEdge(G.addVertex(), G.addVertex());
        G.registerEdgeLabel("label", new VectorStorage())
        G.addEdgeLabel(e, "label", {})

        G.removeEdge(e)

        expect(G.edgeLabels.get("label")!.get(e)).toBeUndefined();
    });
});

import { Graph } from "./Graph";
import { VectorStorage } from "./Storage"
import { VertexTraverser } from "./Traverser"

describe("Traverser", () => {
    it("traverses vertices via edges", () => {
        const G = new Graph();
        const v1 = G.addVertex();
        const v2 = G.addVertex();
        const v3 = G.addVertex();
        const e1 = G.addEdge(v1, v2);
        G.addEdge(v2, v3);

        expect(G.V([v1]).out().toList().length).toBe(1);
        expect(G.V([v1]).out().first()).toBe(v2);

        expect(G.V([v1]).outE().first()).toBe(e1);

        expect(G.V([v2]).in().first()).toBe(v1);
        expect(G.V([v2]).inE().first()).toBe(e1);
        expect(G.V([v2]).both().toList().length).toBe(2);
        expect(G.V([v2]).bothE().toList().length).toBe(2);

        expect(G.V().out().out().first()).toBe(v3);
        expect(G.V().out().out().out().none()).toBeTruthy();
        expect(G.V().out().out().in().out().first()).toBe(v3);
        expect(G.V().both().toList().length).toBe(3);
        expect(G.V().bothE().toList().length).toBe(2);

        expect(G.E().in().toList().length).toBe(2);
        expect(G.E().out().toList().length).toBe(2);
        expect(G.E().both().toList().length).toBe(3);
    });

    it("traverses by filtering by labels", () => {
        const G = new Graph();
        G.registerVertexLabel("person");
        G.registerVertexLabel("language");
        G.registerEdgeLabel("knows");
        G.registerEdgeLabel("hates");

        const v1 = G.addVertex();
        G.addVertexLabel(v1, "person");
        const v2 = G.addVertex();
        G.addVertexLabel(v2, "person");

        const v3 = G.addVertex();
        G.addVertexLabel(v3, "language");

        const e1 = G.addEdge(v1, v2);
        const e2 = G.addEdge(v1, v3);
        G.addEdgeLabel(e1, "knows");
        G.addEdgeLabel(e1, "hates");
        G.addEdgeLabel(e2, "hates");

        // there is one person
        expect(G.V().hasLabel("person").some()).toBeTruthy();
        // there is not a person that is a language
        expect(G.V().hasLabel("person").hasLabel("language").none()).toBeTruthy();
        // there is not a vertex that is knows
        expect(G.V().hasLabel("knows").toList().length).toBe(0);
        // but an edge
        expect(G.E().hasLabel("knows").toList().length).toBe(1);
        // and no edge is a person
        expect(G.E().hasLabel("person").toList().length).toBe(0);
        // traversing "hates" edges in both directions 
        expect(G.V().both("hates").toList().length).toBe(3);
        // stepping into "hates" edges in both directions 
        expect(G.V().bothE("hates").toList().length).toBe(2);
    });

    it("can query for labels and values", () => {
        const G = new Graph();
        G.registerVertexLabel("person", new VectorStorage());
        G.registerVertexLabel("language", new VectorStorage());
        G.registerEdgeLabel("knows");
        G.registerEdgeLabel("hates", new VectorStorage());

        const v1 = G.addVertex();
        G.addVertexLabel(v1, "person", { name: "fred" });
        const v2 = G.addVertex();
        G.addVertexLabel(v2, "person", { name: "pablo" });

        const v3 = G.addVertex();
        G.addVertexLabel(v3, "language", { name: "c++" });

        const e1 = G.addEdge(v1, v2);
        const e2 = G.addEdge(v1, v3);
        G.addEdgeLabel(e1, "knows");
        G.addEdgeLabel(e1, "hates", { type: "a bit" });
        G.addEdgeLabel(e2, "hates", { type: "a lot" });

        // fred knows and hates things
        expect(G.V([v1]).outE().labels()).toEqual(["knows", "hates", "hates"]);
        // fred hates languages and people
        expect(G.V([v1]).out("hates").labels()).toEqual(["person", "language"]);
        // the language he hates is c++
        expect(G.V([v1]).out("hates").values("language").map((v: { name: string }) => v.name).toArray()).toEqual(["c++"]);
        // while he also hates pablo
        expect(G.V([v1]).out("hates").values().map((v: { name: string }) => v.name).toArray()).toEqual(["pablo", "c++"]);
        // also one thing is known and hated.
        expect(G.E().hasLabel("knows").hasLabel("hates").toList().length).toBe(1);
        // also there is a lot and a bit of hate.
        expect(G.E().values().map((v: { type: string }) => v.type).toArray()).toEqual(["a bit", "a lot"]);
        // also there is a lot and a bit of hate.
        expect(G.E().values("hates").map((v: { type: string }) => v.type).toArray()).toEqual(["a bit", "a lot"]);
        // at least he knows him
        expect(G.V([v1])
            .let("a", (t) => t.out("hates"))
            .let("b", (t) => t.out("knows"))
            .and("a", "b").values().map((v: { name: string }) => v.name).toArray()).toEqual(["pablo"]);
        // pablo is the only hated person
        expect(G.V()
            .let("a", (t) => t.out("hates"))
            .let("b", (t) => t.hasLabel("person"))
            .and("a", "b").values().map((v: { name: string }) => v.name).toArray()).toEqual(["pablo"]);
        // and fred the only hater
        expect(G.V()
            .let("a", (t) => t.in("hates"))
            .let("b", (t) => t.hasLabel("person"))
            .and("a", "b").values().map((v: { name: string }) => v.name).toArray()).toEqual(["fred"]);
    });

    it("captures and selects intermediate results", () => {
        const G = new Graph();
        const v1 = G.addVertex();
        const v2 = G.addVertex();
        const v3 = G.addVertex();
        G.addEdge(v1, v2);
        G.addEdge(v2, v3);

        expect(G.V().select("a")).toEqual({ a: { data: [], type: "unknown" } });
        expect(G.V([v1]).as("a").outE().as("b").out().as("c").select("a", "b", "c"))
            .toEqual({
                a: { data: [0], type: "vertex_indices" },
                b: { data: [0], type: "edge_indices" },
                c: { data: [1], type: "vertex_indices" }
            });
        const traversal = G.V().as("a")
            .outE().as("b").out().as("c")
            .outE().as("d").out().as("e")
            .outE().as("f").out().as("g");
        expect(traversal.select("a", "b", "c", "d", "e", "f", "g"))
            .toEqual({
                a: { data: [0, 1, 2], type: "vertex_indices" },
                b: { data: [0, 1], type: "edge_indices" },
                c: { data: [1, 2], type: "vertex_indices" },
                d: { data: [1], type: "edge_indices" },
                e: { data: [2], type: "vertex_indices" },
                f: { data: [], type: "edge_indices" },
                g: { data: [], type: "vertex_indices" }
            });
        expect(G.V()
            .let("a", (t) => t.in())
            .let("b", (t) => t.out().out().inE())
            .select("a", "b"))
            .toEqual({
                a: { data: [0, 1], type: "vertex_indices" },
                b: { data: [1], type: "edge_indices" },
            });
    });

    it("builds edges from queries", () => {
        const G = new Graph();
        const v1 = G.addVertex();
        const v2 = G.addVertex();
        const v3 = G.addVertex();
        const v4 = G.addVertex();
        const e1 = G.addEdge(v1, v2);
        const e2 = G.addEdge(v3, v2);

        G.V([v4]).as("a").V(v2).as("b").edgeBuilder().from("a").to("b").build();
        const e3 = G.e - 1; // i know this is hacky

        G.registerEdgeLabel("d");
        G.registerEdgeLabel("contributer");
        G.addEdgeLabel(e1, "d");
        G.addEdgeLabel(e2, "d");
        G.addEdgeLabel(e3, "d");
        G.V([v1]).as("a")
            .let("notA", (t) => t.not())
            .let("contributers", (t) => t.out("d").in("d"))
            .and("contributers", "notA").as("c")
            .edgeBuilder().from("c").to("a").label("contributer").build();
        expect(G.e).toBe(5);
        expect(G.E().hasLabel("contributer").toList().length).toBe(2);
    });

    it("matches on values", () => {
        const G = new Graph();
        const v1 = G.addVertex();
        const v2 = G.addVertex();
        const v3 = G.addVertex();
        const e1 = G.addEdge(v1, v2);
        const e2 = G.addEdge(v2, v3);
        G.registerVertexLabel("d", new VectorStorage());
        G.registerEdgeLabel("e", new VectorStorage())
        G.addVertexLabel(v1, "d", { a: 10 });
        G.addVertexLabel(v2, "d", { a: 20 });
        G.addEdgeLabel(e1, "e", { a: 10 });
        G.addEdgeLabel(e2, "e", { a: 20 });
        expect(G.V().matchesValue<{ a: number }>("d", (d) => d && d.a > 10).toList()).toEqual([v2]);
        expect(G.V().outE().matchesValue<{ a: number }>("e", (e) => e && e.a > 10).toList()).toEqual([e2])
        expect(G.V().matchesDegree((inDegree, outDegree) => inDegree > outDegree).toList()).toEqual([v3])
    });
});

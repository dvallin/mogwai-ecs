import { World } from "./World";
import { VectorStorage } from "./Storage";
import { VertexTraverser } from "./Traverser";

let W: World;
describe("Fetcher", () => {
  beforeAll(() => {
    W = new World();
    W.registerComponent("room");
    W.registerComponent("dimensions", new VectorStorage());
    W.registerComponent("wall");
    W.registerComponent("direction");
    W.registerComponent("window");
    W.registerRelation("has");
    W.registerComponent("dataComponent", new VectorStorage());
    W.registerRelation("dataRelation", new VectorStorage());

    const window = W.entity()
      .with("window")
      .with("dimensions", { w: 10, h: 10 })
      .close();
    const wall1 = W.entity()
      .with("wall")
      .with("direction", { d: "south" })
      .rel(e => e.with("has").to(window).close())
      .close();
    const wall2 = W.entity()
      .with("wall")
      .with("direction", { d: "north" })
      .close();
    const wall3 = W.entity()
      .with("wall")
      .with("direction", { d: "south" })
      .close();

    W.entity()
      .with("room")
      .with("dimensions", { w: 10, h: 10 })
      .rel(e => e.with("has").to(wall1).close())
      .rel(e => e.with("has").to(wall2).close())
      .close();

    W.entity()
      .with("room")
      .with("dimensions", { w: 10, h: 10 })
      .rel((e) => e.with("has").to(wall3).close())
      .close();
    W.entity().with("room").with("dimensions", { w: 20, h: 20 }).close();
    W.entity().with("room").close();
  });

  it("filters relational data", () => {
    // rooms with windows (not optimized)
    const rooms = W.fetch().on((t: VertexTraverser) => t
      .hasLabel("room", "dimensions")
      .out("has").hasLabel("wall")
      .out("has").hasLabel("window")
      .in("has").in("has")
    ).collect();
    expect(rooms.length).toEqual(1);
    expect(rooms[0].entity).toEqual(4);

    // rooms with windows (optimized) or without walls
    const rooms2 = W.fetch().on((t: VertexTraverser) => t
      .let("a", t => t.hasLabel("window").in().hasLabel("wall").in("has"))
      .let("b", t => t.hasLabel("wall").in().not().hasLabel("room"))
      .or("a", "b")
    ).collect();
    expect(rooms2.length).toEqual(3);
    expect(rooms2[0].entity).toEqual(4);
    expect(rooms2[1].entity).toEqual(6);
    expect(rooms2[2].entity).toEqual(7);

    // window-less walls of room 0
    const rooms3 = W.fetch(4).on((t: VertexTraverser) => t
      .out("has").hasLabel("wall").as("walls-of-0")
      .let("no-window-walls", t => t.V().hasLabel("window").in("has").not())
      .and("no-window-walls", "walls-of-0")
    );
    expect(rooms3.collect().length).toEqual(1);
    expect(rooms3.first().entity).toEqual(2);
  });

  it("fetches related entities", () => {
    const rooms = W.fetch().on((t: VertexTraverser) => t
      // rooms with windows
      .hasLabel("window").in().hasLabel("wall").in("has"))
      // subfetching starts from each vertex and applies the traverser.
      .subFetch("walls", (t: VertexTraverser) => t
        .out("has").hasLabel("wall"))
      .subFetch("windows", (t: VertexTraverser) => t
        .out("has").hasLabel("wall")
        .out("has").hasLabel("window"), "dimensions")
      .collect();
    expect(rooms.length).toEqual(1);
    expect(rooms[0].entity).toEqual(4);
    expect(rooms[0].walls.length).toEqual(2);
    expect(rooms[0].walls[0].entity).toEqual(1);
    expect(rooms[0].walls[1].entity).toEqual(2);
    expect(rooms[0].windows.length).toEqual(1);
    expect(rooms[0].windows[0].entity).toEqual(0);
    expect(rooms[0].windows[0].dimensions).toEqual({ w: 10, h: 10 });
  });

  it("updates edge and vertex labels", () => {
    const v = W.entity(0).with("dataComponent", { data: false }).close();
    const r = W.relation().from(0).to(1)
      .with("dataRelation", { data: false })
      .close();

    expect(W.fetch(v)
      .withComponents("dataComponent")
      .collect()[0])
      .toEqual({ entity: v, dataComponent: { data: false } });

    W.entity(v).update<{ data: boolean }>("dataComponent", (d) => d.data = true).close();

    expect(W.fetch(v)
      .withComponents("dataComponent")
      .collect()[0])
      .toEqual({ entity: v, dataComponent: { data: true } });

    expect(W.fetch(0)
      .relationsFetch("data", f => f.outE("dataRelation"), "dataRelation")
      .collect()[0].data[0])
      .toEqual({ relation: r, dataRelation: { data: false } });

    W.relation(r).update<{ data: boolean }>("dataRelation", (d) => d.data = true).close();
    expect(W.fetch(0)
      .relationsFetch("data", f => f.outE("dataRelation"), "dataRelation")
      .stream().first().data[0])
      .toEqual({ relation: r, dataRelation: { data: true } });
  });
});

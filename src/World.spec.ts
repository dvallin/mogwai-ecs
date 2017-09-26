import { World } from "./World";
import { VectorStorage } from "./Storage";
import { VertexTraverser  } from "./Traverser";

let W: World;
describe("World", () => {
  beforeAll(() => {
    W = new World();
    W.registerComponent("room");
    W.registerComponent("dimensions", new VectorStorage())
    W.registerComponent("wall");
    W.registerComponent("direction");
    W.registerComponent("window");
    W.registerRelation("has");

    W.entity()
     .with("room")
     .with("dimensions", {w: 10, h: 10})
     .rel("has", W.entity()
                  .with("wall")
                  .with("direction", "south")
                  .rel("has", W.entity()
                                .with("window")
                                .with("dimensions", {w: 10, h: 10})
                                .build())
                  .build())
      .rel("has", W.entity()
                   .with("wall")
                   .with("direction", "north")
                   .build())
      .build();
    W.entity()
     .with("room")
     .with("dimensions", {w: 10, h: 10})
     .rel("has", W.entity()
                  .with("wall")
                  .with("direction", "south")
                  .build())
      .build();
    W.entity().with("room").with("dimensions", {w: 20, h: 20}).build();
    W.entity().with("room").build();
  });

  it("fetches entities by component", () => {
    const rooms = W.fetch(t => t.hasLabel("room")).collect();
    expect(rooms.entities).toEqual([0, 4, 6, 7])
  })

  it("fetches entities by components with data", () => {
    const rooms = W.fetch(t => t.hasLabel("room", "dimensions"))
      .collect("room", "dimensions");
    expect(rooms.entities).toEqual([0, 4, 6]);
    expect(rooms.components[0].room).toEqual(null);
    expect(rooms.components[0].dimensions).toEqual({w: 10, h: 10});
    expect(rooms.components[1].room).toEqual(null);
    expect(rooms.components[1].dimensions).toEqual({w: 10, h: 10});
    expect(rooms.components[2].room).toEqual(null);
    expect(rooms.components[2].dimensions).toEqual({w: 20, h: 20});
  })

  it("filters relational data", () => {
    // rooms with windows (not optimized)
    const rooms = W.fetch((t: M.VertexTraverser) => t
      .hasLabel("room", "dimensions")
      .out("has").hasLabel("wall")
      .out("has").hasLabel("window")
      .in("has").in("has")
    ).collect();
    expect(rooms.entities).toEqual([0]);

    // rooms with windows (optimized) or without walls
    const rooms2 = W.fetch((t: M.VertexTraverser) => t
      .let("a", t => t.hasLabel("window").in().hasLabel("wall").in("has"))
      .let("b", t => t.hasLabel("wall").in().not().hasLabel("room"))
      .or("a", "b")
    ).collect();
    expect(rooms2.entities).toEqual([0, 6, 7]);

    // window-less walls of room 0
    const rooms2 = W.fetchOn(0, (t: M.VertexTraverser) => t
      .out("has").hasLabel("wall").as("walls-of-0")
      .let("no-window-walls", t => t.V().hasLabel("window").in("has").not())
      .and("no-window-walls", "walls-of-0")
    ).collect();
    expect(rooms2.entities).toEqual([3]);
  });

  it("fetches related entities", () => {
    const rooms = W.fetch((t: M.VertexTraverser) => t
      // rooms with windows
      .hasLabel("window").in().hasLabel("wall").in("has"))
      // subfetching starts from each vertex and applies the traverser.
      .subFetch("walls", (t: M.VertexTraverser) => t
        .out("has").hasLabel("wall"))
      .subFetch("windows", (t: M.VertexTraverser) => t
        .out("has").hasLabel("wall")
        .out("has").hasLabel("window"), "dimensions")
      .collect();
    expect(rooms.entities).toEqual([0]);
    expect(rooms.walls.entities).toEqual([1,3]);
    expect(rooms.windows.entities).toEqual([2]);
    expect(rooms.windows.components[0].dimensions).toEqual({w: 10, h: 10});
  });
});

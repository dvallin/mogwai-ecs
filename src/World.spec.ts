import { World, System } from "./World";
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
    expect(rooms.length).toEqual(4);
    expect(rooms[0].entity).toEqual(0);
    expect(rooms[1].entity).toEqual(4);
    expect(rooms[2].entity).toEqual(6);
    expect(rooms[3].entity).toEqual(7);
  })

  it("fetches entities by components with data", () => {
    const rooms = W.fetch(t => t.hasLabel("room", "dimensions"))
      .withComponents("room", "dimensions")
      .collect();
    expect(rooms.length).toEqual(3);
    expect(rooms[0].entity).toEqual(0);
    expect(rooms[1].entity).toEqual(4);
    expect(rooms[2].entity).toEqual(6);
    expect(rooms[0].room).toEqual(null);
    expect(rooms[1].room).toEqual(null);
    expect(rooms[2].room).toEqual(null);
    expect(rooms[0].dimensions).toEqual({w: 10, h: 10});
    expect(rooms[1].dimensions).toEqual({w: 10, h: 10});
    expect(rooms[2].dimensions).toEqual({w: 20, h: 20});
  })

  it("filters relational data", () => {
    // rooms with windows (not optimized)
    const rooms = W.fetch((t: M.VertexTraverser) => t
      .hasLabel("room", "dimensions")
      .out("has").hasLabel("wall")
      .out("has").hasLabel("window")
      .in("has").in("has")
    ).collect();
    expect(rooms.length).toEqual(1);
    expect(rooms[0].entity).toEqual(0);

    // rooms with windows (optimized) or without walls
    const rooms2 = W.fetch((t: M.VertexTraverser) => t
      .let("a", t => t.hasLabel("window").in().hasLabel("wall").in("has"))
      .let("b", t => t.hasLabel("wall").in().not().hasLabel("room"))
      .or("a", "b")
    ).collect();
    expect(rooms2.length).toEqual(3);
    expect(rooms2[0].entity).toEqual(0);
    expect(rooms2[1].entity).toEqual(6);
    expect(rooms2[2].entity).toEqual(7);

    // window-less walls of room 0
    const rooms3 = W.fetchOn(0, (t: M.VertexTraverser) => t
      .out("has").hasLabel("wall").as("walls-of-0")
      .let("no-window-walls", t => t.V().hasLabel("window").in("has").not())
      .and("no-window-walls", "walls-of-0")
    ).collect();
    expect(rooms3.length).toEqual(1);
    expect(rooms3[0].entity).toEqual(3);
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
    expect(rooms.length).toEqual(1);
    expect(rooms[0].entity).toEqual(0);
    expect(rooms[0].walls.length).toEqual(2);
    expect(rooms[0].walls[0].entity).toEqual(1);
    expect(rooms[0].walls[1].entity).toEqual(3);
    expect(rooms[0].windows.length).toEqual(1);
    expect(rooms[0].windows[0].entity).toEqual(2);
    expect(rooms[0].windows[0].dimensions).toEqual({w: 10, h: 10});
  });

  it("executes systems", () => {
    const execute = jest.fn();
    W.registerSystem("system1", {execute});
    W.run();
    expect(execute).toHaveBeenCalledWith(W);
  });
});

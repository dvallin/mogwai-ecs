import { World, System } from "./World";
import { VectorStorage } from "./Storage";
import { VertexTraverser  } from "./Traverser";

describe("World", () => {
  it("registers and executes systems", () => {
    const W = new World();
    const execute = jest.fn();
    W.registerSystem("system1", {execute});
    W.run();
    expect(execute).toHaveBeenCalledWith(W);
  });
});

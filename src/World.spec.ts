import { World } from "./World";

describe("World", () => {
  it("registers and executes systems", () => {
    const W = new World();
    const execute = jest.fn();
    W.registerSystem("system1", { execute });
    W.run();
    expect(execute).toHaveBeenCalledWith(W);
  });
});

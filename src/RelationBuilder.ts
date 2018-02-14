import { World } from "./World"

export class RelationBuilder {
  world: World;
  v0: number;
  v1: number;
  e: number | undefined;
  updates: Array<[string, (d: any) => void]>;
  components: Array<[string, any]>;

  constructor(world: World) {
    this.world = world;
    this.components = [];
    this.updates = [];
  }

  relation(e?: number) {
    this.e = e;
    return this;
  }

  from(v: number) {
    this.v0 = v;
    return this;
  }

  to(v: number) {
    this.v1 = v;
    return this;
  }

  with<T extends object>(relation: string, data?: T) {
    this.components.push([relation, data]);
    return this;
  }

  update<T extends object>(relation: string, updater: (d: T) => void) {
    this.updates.push([relation, updater]);
    return this;
  }

  close(): number {
    const e = this.e || this.world.graph.addEdge(this.v0, this.v1);
    this.components.forEach(([relation, data]) => {
      this.world.graph.addEdgeLabel(e, relation, data);
    });
    this.updates.forEach(([relation, updater]) =>
      updater(this.world.graph.getEdge(e, relation)[relation])
    );
    return e;
  };
}
import {World} from "./World"

export class RelationBuilder {
    world: World;
    v0: number;
    v1: number;
    e: number;
    updates: Array<[string, (d: object) => void]>;
    components: Array<[string, object]>;
  
    constructor(world: World) {
      this.world = world;
      this.components = [];
      this.updates = [];
    }
  
    relation(e: number) {
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
  
    with<T extends object>(relation: string, data: T = undefined) {
      this.components.push([relation, data]);
      return this;
    }
  
    update<T extends object>(relation: string, updater: (d: T) => void) {
      this.updates.push([relation, updater]);
      return this;
    }
  
    close(): number {
      if(this.e == undefined) {
        this.e = this.world.graph.addEdge(this.v0, this.v1);
      }
      this.components.forEach(([relation, data]) => {
        this.world.graph.addEdgeLabel(this.e, relation, data);
      });
      this.updates.forEach(([relation, updater]) =>
        updater(this.world.graph.getEdge(this.e, relation)[relation])
      );
      return this.e;
    };
  }
import { Graph } from "./Graph"
import { Storage, NullStorage, VectorStorage } from "./Storage";
import { VertexTraverser, EdgeTraverser } from "./Traverser";
import { Fetcher } from "./Fetcher"
import { EntityBuilder } from "./EntityBuilder"
import { RelationBuilder } from "./RelationBuilder"

export interface System {
  execute: (world: World) => void;
}

export class World {
  graph: Graph;
  systems: Map<string, System>;

  constructor() {
    this.graph = new Graph();
    this.systems = new Map();
  }

  registerComponent(name: string, storage: Storage = new NullStorage()) {
    this.graph.registerVertexLabel(name, storage);
  }

  registerRelation(name: string, storage: Storage = new NullStorage()) {
    this.graph.registerEdgeLabel(name, storage);
  }

  registerSystem(name: string, system: System) {
    this.systems.set(name, system);
  }

  run() {
    this.systems.forEach(system => system.execute(this));
  }

  entity(v: number = undefined): EntityBuilder {
    return new EntityBuilder(this).entity(v);
  }

  relation(r: number = undefined): RelationBuilder {
    return new RelationBuilder(this).relation(r);
  }

  fetch(v: number = undefined): Fetcher {
    return new Fetcher(this.graph, v);
  }
};


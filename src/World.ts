import { Graph } from "./Graph"
import { Storage, NullStorage, VectorStorage } from "./Storage";
import { VertexTraverser  } from "./Traverser";


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

  registerRelation(name: string) {
    this.graph.registerEdgeLabel(name);
  }

  registerSystem(name: string, system: System) {
    this.systems.set(name, system);
  }

  run() {
    this.systems.forEach(system => system.execute(this));
  }

  entity(): EntityBuilder {
    return new EntityBuilder(this);
  }

  traverse(v: number): VertexTraverser {
    return this.graph.V(v);
  }

  fetch(f: (t: VertexTraverser) => VertexTraverser): Fetcher {
    return new Fetcher(this.graph, undefined).fetch(f);
  }

  fetchOn(v: number, f: (t: VertexTraverser) => VertexTraverser): Fetcher {
    return new Fetcher(this.graph, v).fetch(f);
  }
};

export class EntityBuilder {
  world: World;
  entity: number;

  constructor(world: World) {
    this.world = world;
    this.entity = this.world.graph.addVertex();
  }

  with(component: string, data: object) {
    this.world.graph.addVertexLabel(this.entity, component, data);
    return this;
  }

  rel(relation: string, other: number) {
    const e = this.world.graph.addEdge(this.entity, other);
    this.world.graph.addEdgeLabel(e, relation, undefined);
    return this;
  }

  invRel(relation: string, other: number) {
    const e = this.world.graph.addEdge(other, this.entity);
    this.world.graph.addEdgeLabel(e, relation, undefined);
    return this;
  }

  build(): number {
    return this.entity;
  }
}

export class Fetcher {
  graph: Graph;
  traverser: VertexTraverser;
  components: Array<string>;
  sub: Array<[string, (t: VertexTraverser) => VertexTraverser, Array<string>]>

  constructor(graph: Graph, v: number) {
    this.traverser = graph.V(v);
    this.graph = graph;
    this.sub = [];
    this.components = [];
  }

  fetch(f: (t: VertexTraverser) => VertexTraverser): Fetcher {
    this.traverser = f(this.traverser);
    return this;
  }

  subFetch(name: string, f: (t: VertexTraverser) => VertexTraverser, ...components: Array<string>) {
    this.sub.push([name, f, components]);
    return this;
  }

  withComponents(...components: Array<string>): Fetcher {
    this.components = components;
    return this;
  }

  stream() {
    return this.traverser.stream()
      .map(entity => {
        const subcomponents = {};
        this.sub.forEach(s => {
          subcomponents[s[0]] = new Fetcher(this.graph, entity)
            .fetch(s[1])
            .withComponents(...s[2])
            .collect();
        });
        return {
          entity,
          ...this.graph.getVertex(entity, ...this.components),
          ...subcomponents
        };
      });
  }

  collect() {
    return this.stream().toArray();
  }
}

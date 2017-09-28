import { Graph } from "./Graph"
import { Storage, NullStorage, VectorStorage } from "./Storage";
import { VertexTraverser, EdgeTraverser } from "./Traverser";


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

  entity(v: number): EntityBuilder {
    return new EntityBuilder(this).entity(v);
  }

  relation(r: number): RelationBuilder {
    return new RelationBuilder(this).relation(r);
  }

  traverse(v: number): VertexTraverser {
    return this.graph.V(v);
  }

  fetch(f: (t: VertexTraverser) => VertexTraverser): Fetcher {
    const fetcher = new Fetcher(this.graph, undefined);
    if(f) {
      fetcher.fetch(f);
    }
    return fetcher;
  }

  fetchOn(v: number, f: (t: VertexTraverser) => VertexTraverser): Fetcher {
    const fetcher = new Fetcher(this.graph, v);
    if(f) {
      fetcher.fetch(f);
    }
    return fetcher;
  }
};

export class EntityBuilder {
  world: World;
  components: Array<[string, object]>;
  updates: Array<[string, (d: object) => void]>;
  relations: Array<(b: RelationBuilder) => void>;
  v: number;

  constructor(world: World) {
    this.world = world;
    this.components = [];
    this.relations = [];
    this.updates = [];
  }

  entity(v: number) {
    this.v = v;
    return this;
  }

  with(component: string, data: object) {
    this.components.push([component, data]);
    return this;
  }

  update(component: string, updater: (d: object) => void) {
    this.updates.push([component, updater]);
    return this;
  }

  rel(e: (b: RelationBuilder) => void): EntityBuilder {
    this.relations.push(e);
    return this;
  }

  close(): number {
    if(this.v == undefined) {
      this.v = this.world.graph.addVertex();
    }
    this.components.forEach(([component, data]) =>
      this.world.graph.addVertexLabel(this.v, component, data)
    );
    this.updates.forEach(([component, updater]) => {
      updater(this.world.graph.getVertex(this.v, component)[component])
    });
    this.relations.forEach(e =>
        e(new RelationBuilder(this.world).from(this.v))
    );
    return this.v;
  }
}

export class RelationBuilder {
  world: World;
  v0: number;
  v1: number;
  e: number;
  inv: boolean;
  updates: Array<[string, (d: object) => void]>;
  components: Array<[string, object]>;

  constructor(world: World) {
    this.world = world;
    this.inv = false;
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

  inverse() {
    this.inv = true;
    return this;
  }

  with(relation: string, data: object) {
    this.components.push([relation, data]);
    return this;
  }

  update(relation: string, updater: (d: object) => void) {
    this.updates.push([relation, updater]);
    return this;
  }

  close(): number {
    if(this.inv) {
      [this.v0, this.v1] = [this.v1, this.v0];
    }
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

export class Fetcher {
  graph: Graph;
  traverser: VertexTraverser;
  components: Array<string>;
  sub: Array<[string, (t: VertexTraverser) => VertexTraverser, Array<string>]>
  relations: Array<[string, (t: VertexTraverser) => EdgeTraverser, Array<string>]>

  constructor(graph: Graph, v: number) {
    this.traverser = graph.V(v);
    this.graph = graph;
    this.sub = [];
    this.relations = [];
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

  relationsFetch(name: string, f: (t: VertexTraverser) => EdgeTraverser, ...components: Array<string>) {
    this.relations.push([name, f, components]);
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
        const fetchedRelations = {}
        this.relations.forEach(r => {
          fetchedRelations[r[0]] = r[1](this.graph.V(entity))
              .stream()
              .map(relation => {
                return {
                  relation,
                  ...this.graph.getEdge(relation, ...r[2]),
                }
              })
              .toArray();

        })
        return {
          entity,
          ...this.graph.getVertex(entity, ...this.components),
          ...subcomponents,
          ...fetchedRelations
        };
      });
  }

  collect() {
    return this.stream().toArray();
  }
}

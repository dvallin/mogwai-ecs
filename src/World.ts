import { Graph } from "./Graph"
import { Storage, NullStorage, VectorStorage } from "./Storage";
import { VertexTraverser  } from "./Traverser";

function getIn(x, ks) {
  for (let i = 0, n = ks.length; x != null && i < n; i++) {
    const c = x[ks[i]];
    if(c) {
      x = c;
    } else {
      x[ks[i]] = {};
      x = x[ks[i]];
    }
  }
  return x;
}

export class World {
  graph: Graph;

  constructor() {
    this.graph = new Graph();
  }

  registerComponent(name: string, storage: Storage = new NullStorage()) {
    this.graph.registerVertexLabel(name, storage);
  }

  registerRelation(name: string) {
    this.graph.registerEdgeLabel(name);
  }

  entity(): EntityBuilder {
    return new EntityBuilder(this);
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

  build(): number {
    return this.entity;
  }
}

export class Fetcher {
  graph: Graph;
  traverser: VertexTraverser;
  sub: Array<[string, (t: VertexTraverser) => VertexTraverser, Array<string>]>

  constructor(graph: Graph, v: number) {
    this.traverser = graph.V(v);
    this.graph = graph;
    this.sub = [];
  }

  fetch(f: (t: VertexTraverser) => VertexTraverser): Fetcher {
    this.traverser = f(this.traverser);
    return this;
  }

  subFetch(name: string, f: (t: VertexTraverser) => VertexTraverser, ...components: Array<string>) {
    this.sub.push([name, f, components]);
    return this;
  }

  collect(...components: Array<string>) {
    const c = this.traverser.toList();
    let result = { components: [] };
    result["entities"] = c;
    c.forEach(v => {
      result.components.push(this.graph.getVertex(v, ...components));
    });
    c.forEach(v => this.sub.forEach(s =>
        result[s[0]] = new Fetcher(this.graph, v).fetch(s[1]).collect(...s[2])
    ));
    return result;
  }
}

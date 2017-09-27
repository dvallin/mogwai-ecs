import { StorageMap } from "./Storage";
import { Graph } from "./Graph";
import * as B from "hibitset-js";
import * as L from "lazy.js";

const iterate = (mask) => {
  const Lazy = L.strict();
  const iter = B.createIterator(mask);
  return Lazy
    .generate(() => iter.next())
    .takeWhile(a => !a.done)
    .map(a => a.value);
}

const serialize = (mask) => {
  const result = [];
  B.iterate(mask, v => result.push(v));
  return result;
}

export abstract class Traverser {
  graph: Graph;
  mask: B.HierarchicalBitset;
  vertexSnapshots: Map<string, B.HierarchicalBitset>;
  edgeSnapshots: Map<string, B.HierarchicalBitset>;

  constructor(graph: Graph, mask: B.HierarchicalBitset,
      vertexSnapshots: Map<string, B.HierarchicalBitset>,
      edgeSnapshots: Map<string, B.HierarchicalBitset>) {
    this.graph = graph;
    this.mask = mask;
    this.vertexSnapshots = vertexSnapshots;
    this.edgeSnapshots = edgeSnapshots;
  }

  toList(): Array<number> {
    return serialize(this.mask);
  }

  stream() {
    return iterate(this.mask);
  }

  abstract isEdge(): boolean;
  abstract isVertex(): boolean;

  some(): boolean {
    return !B.createIterator(this.mask).next().done;
  }

  none(): boolean {
    return !this.some();
  }

  first(): number {
    return B.createIterator(this.mask).next().value;
  }

  select(...labels: Array<string>): object {
    const result = {};
    labels.forEach(label => {
      let data;
      let type;
      if(this.vertexSnapshots.has(label)) {
        type = "vertex_indices";
        data = serialize(this.vertexSnapshots.get(label));
      } else if (this.edgeSnapshots.has(label)) {
        type = "edge_indices";
        data = serialize(this.edgeSnapshots.get(label));
      } else {
        type = "unknown";
      }
      result[label] = { data, type };
    });
    return result;
  }

  V(v: number): VertexTraverser {
    if (v !== undefined) {
      const mask = new B.BitSet(this.graph.v);
      mask.add(v);
      return new VertexTraverser(this.graph, mask, new Map(), new Map());
    } else {
      return new VertexTraverser(this.graph, B.one(this.graph.v), new Map(), new Map());
    }
  }

  E(e: number): EdgeTraverser {
    if (e !== undefined) {
      const mask = new B.BitSet(this.graph.e);
      mask.add(e);
      return new EdgeTraverser(this.graph, mask, new Map(), new Map());
    } else {
      return new EdgeTraverser(this.graph, B.one(this.graph.e), new Map(), new Map());
    }
  }

  selectVertexSnapshot(label: string): VertexTraverser {
    return new VertexTraverser(this.graph, this.vertexSnapshots.get(label),
      this.vertexSnapshots, this.edgeSnapshots);
  }

  selectEdgeSnapshot(label: string): EdgeTraverser {
    return new EdgeTraverser(this.graph, this.edgeSnapshots.get(label),
      this.vertexSnapshots, this.edgeSnapshots);
  }
}

export class VertexTraverser extends Traverser {
  isEdge() {
    return false;
  }
  isVertex() {
    return true;
  }

  hasLabel(...labels: Array<string>): VertexTraverser {
    if(labels.length == 0) {
      return this;
    }

    const masks = [];
    labels.forEach(label => {
        const storage = this.graph.vertexLabels.get(label) || { mask: B.zero() };
        masks.push(storage.mask);
    });
    return new VertexTraverser(this.graph, B.and(this.mask, B.and(...masks)),
      this.vertexSnapshots, this.edgeSnapshots);
  }

  out(...labels: Array<string>): VertexTraverser {
    return this.outE(...labels).step("out");
  }

  outE(...labels: Array<string>): EdgeTraverser {
    return new EdgeTraverser(this.graph, this.traverse("out"),
      this.vertexSnapshots, this.edgeSnapshots)
      .hasLabel(...labels);
  }

  in(...labels: Array<string>): VertexTraverser {
    return this.inE(...labels).step("in");
  }

  inE(...labels: Array<string>): EdgeTraverser {
    return new EdgeTraverser(this.graph, this.traverse("in"),
      this.vertexSnapshots, this.edgeSnapshots)
      .hasLabel(...labels);
  }

  both(...labels: Array<string>): VertexTraverser {
    this.let("$1", (self) => self.in(...labels));
    this.let("$2", (self) => self.out(...labels));
    return this.or("$1", "$2");
  }

  bothE(...labels: Array<string>): EdgeTraverser {
    return new EdgeTraverser(this.graph, this.traverse("in", "out"),
      this.vertexSnapshots, this.edgeSnapshots);
  }

  or(...snapshots: Array<string>): VertexTraverser {
    const masks = [];
    snapshots.forEach(snapshot => masks.push(this.vertexSnapshots.get(snapshot)));
    return new VertexTraverser(this.graph, B.or(...masks),
      this.vertexSnapshots, this.edgeSnapshots);
  }

  and(...snapshots: Array<string>): VertexTraverser {
    const masks = [];
    snapshots.forEach(snapshot => masks.push(this.vertexSnapshots.get(snapshot)));
    return new VertexTraverser(this.graph, B.and(...masks),
      this.vertexSnapshots, this.edgeSnapshots);
  }

  not(): VertexTraverser {
    return new VertexTraverser(this.graph, B.not(this.mask),
      this.vertexSnapshots, this.edgeSnapshots);
  }

  traverse(...labels: Array<string>): B.BitSet {
    const mask = new B.BitSet(this.mask.size());
    labels.forEach(label => {
      const traversable = this.graph.vertexLabels.get(label);
      B.iterate(B.and(this.mask, traversable.mask),
        (e) => (<Set<number>> traversable.get(e)).forEach(target => mask.add(target))
      );
    });
    return mask;
  }

  values(...labels: Array<string>): Array<object> {
    const data: Array<object> = [];
    B.iterate(this.mask, (v) => {
      if(labels.length > 0) {
        labels.forEach(label => {
          const value = this.graph.vertexLabels.get(label).get(v);
          if(value) {
              data.push(value);
          }
        });
      } else {
        this.graph.vertexLabels.forEach((label, key) => {
          if(key !== "in" && key !== "out") {
            const value = label.get(v);
            if(value) {
              data.push(value)
            }
          }
        });
      }
    });
    return data;
  }

  labels(): Array<string> {
    const data: Array<string> = [];
    B.iterate(this.mask, (v) => {
      this.graph.vertexLabels.forEach((value, key) => {
        if(key !== "in" && key !== "out" && value.mask.contains(v)) {
          data.push(key);
        }
      });
    });
    return data;
  }

  as(label: string): VertexTraverser {
    this.vertexSnapshots.set(label, this.mask);
    return this;
  }

  let(label: string, mapper: (t: VertexTraverser) => Traverser): VertexTraverser {
    const other = mapper(this);
    if(other.isEdge()) {
      this.edgeSnapshots.set(label, other.mask);
    } else {
      this.vertexSnapshots.set(label, other.mask);
    }
    return this;
  }

  edgeBuilder() : EdgeBuilder<VertexTraverser> {
    return new EdgeBuilder(this);
  }
}

export class EdgeTraverser extends Traverser {
  isEdge() {
    return true;
  }
  isVertex() {
    return false;
  }

  hasLabel(...labels: Array<string>): EdgeTraverser {
    if(labels.length == 0) {
      return this;
    }

    const masks = [];
    labels.forEach(label => {
        const storage = this.graph.edgeLabels.get(label) || { mask: B.zero() };
        masks.push(storage.mask);
    });
    return new EdgeTraverser(this.graph, B.and(this.mask, B.or(...masks)),
      this.vertexSnapshots, this.edgeSnapshots);
  }

  in(): VertexTraverser {
     return this.step("in");
  }

  out(): VertexTraverser {
     return this.step("out");
  }

  both(): VertexTraverser {
     return this.step("out");
  }

  step(direction: string): VertexTraverser {
    const vertices = this.graph.edgeLabels.get("->");
    const mask = new B.BitSet(this.mask.size());
    B.iterate(this.mask, (e) => {
      const v = vertices.get(e);
      let targets;
      switch(direction) {
        case "in": targets = [v[0]]; break;
        case "out": targets = [v[1]]; break;
        case "both": targets = v; break;
      }
      targets.forEach(target => mask.add(target));
    });
    return new VertexTraverser(this.graph, mask, this.vertexSnapshots, this.edgeSnapshots);
  }

  labels(): Array<string> {
    const data: Array<string> = [];
    B.iterate(this.mask, (e) => {
      this.graph.edgeLabels.forEach((value, key) => {
        if(key !== "->" && value.mask.contains(e)) {
          data.push(key);
        }
      });
    });
    return data;
  }

  as(label: string): EdgeTraverser {
    this.edgeSnapshots.set(label, this.mask);
    return this;
  }

  edgeBuilder() : EdgeBuilder<EdgeTraverser> {
    return new EdgeBuilder(this);
  }
}

export class EdgeBuilder<T extends Traverser> {
  context: T;
  e: [B.HierarchicalBitset, B.HierarchicalBitset];
  l: string;

  constructor(context: T) {
    this.context = context;
    this.e = [0, 0];
    this.l = undefined;
  }

  from(snapshot: string) {
    this.e[0] = this.context.vertexSnapshots.get(snapshot);
    return this;
  }

  to(snapshot: string) {
    this.e[1] = this.context.vertexSnapshots.get(snapshot);
    return this;
  }

  label(l: string) {
    this.l = l;
    return this;
  }

  build(): T {
    const self = this;
    B.iterate(this.e[0], (v0) => {
      B.iterate(this.e[1], (v1) => {
        const e = this.context.graph.addEdge(v0, v1);
        if(this.l) {
          this.context.graph.addEdgeLabel(e, this.l, undefined);
        }
      });
    });
    return this.context;
  }
}

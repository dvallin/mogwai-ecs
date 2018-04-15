import { Graph, Vertex } from "./Graph"
import { Storage } from "./Storage"

import * as B from "hibitset-js/lib";
import LazyJS, { strict } from "lazy.js";
import { HierarchicalBitset } from "hibitset-js/lib";

const iterate = (mask: B.HierarchicalBitset) => {
  const iter = B.createIterator(mask);
  return strict()
    .generate(() => iter.next())
    .takeWhile((a: any) => !a.done)
    .map((a: any) => a.value);
}

const serialize = (mask: B.HierarchicalBitset) => {
  const result: number[] = [];
  B.iterate(mask, (v: number) => result.push(v));
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

  some(): boolean {
    return !B.createIterator(this.mask).next().done;
  }

  none(): boolean {
    return !this.some();
  }

  first(): number | undefined {
    return B.createIterator(this.mask).next().value;
  }

  select(...labels: Array<string>): { [label: string]: { type: string, data: number[] } } {
    const result: { [label: string]: { type: string, data: number[] } } = {};
    labels.forEach(label => {
      let data: number[];
      let type: string;
      if (this.vertexSnapshots.has(label)) {
        type = "vertex_indices";
        data = serialize(this.vertexSnapshots.get(label) as HierarchicalBitset);
      } else if (this.edgeSnapshots.has(label)) {
        type = "edge_indices";
        data = serialize(this.edgeSnapshots.get(label) as HierarchicalBitset);
      } else {
        type = "unknown";
        data = []
      }
      result[label] = { data, type };
    });
    return result;
  }

  V(v?: number): VertexTraverser {
    return this.graph.V(v, this.vertexSnapshots, this.edgeSnapshots)
  }
}

export class VertexTraverser extends Traverser {
  hasLabel(...labels: Array<string>): VertexTraverser {
    const masks: B.HierarchicalBitset[] = [];
    labels.forEach(label => {
      const storage = this.graph.vertexLabels.get(label) || { mask: B.zero(0) };
      masks.push(storage.mask);
    });
    return new VertexTraverser(this.graph, B.and(this.mask, B.and(...masks)),
      this.vertexSnapshots, this.edgeSnapshots);
  }

  ofPartition<T extends object>(key: string, representant: T): VertexTraverser {
    const values = this.graph.vertexLabels.get(key)
    const mask = new B.BitSet(this.mask.size());
    if (values !== undefined) {
      const partition: number[] | undefined = values.getPartition(representant)
      if (partition !== undefined) {
        partition.forEach((v: number) => mask.add(v))
      }
    }
    return new VertexTraverser(this.graph, mask, this.vertexSnapshots, this.edgeSnapshots);
  }

  partition<T extends object>(key: string): VertexTraverser {
    const values = this.graph.vertexLabels.get(key)
    const mask = new B.BitSet(this.mask.size());
    if (values !== undefined) {
      B.iterate(this.mask, (v: number) => {
        const representant = values.get(v) as T
        if (representant !== undefined && representant !== null) {
          const partition: number[] | undefined = values.getPartition(representant)
          if (partition !== undefined) {
            partition.forEach((v: number) => mask.add(v))
          }
        }
      });
    }
    return new VertexTraverser(this.graph, mask, this.vertexSnapshots, this.edgeSnapshots);
  }

  matchesValue<T extends object>(key: string, matcher: (value: T) => boolean): VertexTraverser {
    const values = this.graph.vertexLabels.get(key);
    const mask = new B.BitSet(this.mask.size());
    if (values !== undefined) {
      B.iterate(this.mask, (v: number) => {
        const value = values.get(v) as T
        if (value !== undefined && value !== null && matcher(value)) {
          mask.add(v);
        }
      });
    }
    return new VertexTraverser(this.graph, mask, this.vertexSnapshots, this.edgeSnapshots);
  }

  matchesDegree(matcher: (inDegree: number, outDegree: number) => boolean): VertexTraverser {
    const ins = this.graph.vertexLabels.get("in");
    const outs = this.graph.vertexLabels.get("out");
    const mask = new B.BitSet(this.mask.size());
    if (ins !== undefined && outs !== undefined) {
      B.iterate(this.mask, (v: number) => {
        const inRelations = ins.get(v) as Set<number>
        const outRelations = outs.get(v) as Set<number>
        if (inRelations && outRelations && matcher(inRelations.size, outRelations.size)) {
          mask.add(v);
        }
      });
    }
    return new VertexTraverser(this.graph, mask, this.vertexSnapshots, this.edgeSnapshots);
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
      this.vertexSnapshots, this.edgeSnapshots)
      .hasLabel(...labels);
  }

  or(...snapshots: Array<string>): VertexTraverser {
    const masks: B.HierarchicalBitset[] = [];
    snapshots.forEach(snapshot => masks.push(this.vertexSnapshots.get(snapshot) as HierarchicalBitset));
    return new VertexTraverser(this.graph, B.or(...masks),
      this.vertexSnapshots, this.edgeSnapshots);
  }

  and(...snapshots: Array<string>): VertexTraverser {
    const masks: B.HierarchicalBitset[] = [];
    snapshots.forEach(snapshot => masks.push(this.vertexSnapshots.get(snapshot) as HierarchicalBitset));
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
      if (traversable !== undefined) {
        B.iterate(B.and(this.mask, traversable.mask),
          (e: number) => (<Set<number>>traversable.get(e)).forEach(target => mask.add(target))
        );
      }
    });
    return mask;
  }

  values(...labels: Array<string>): LazyJS.Sequence<any> {
    if (labels.length == 0) {
      this.graph.vertexLabels.forEach(({ }, key) => {
        if (key !== "in" && key !== "out") {
          labels.push(key)
        }
      })
    }
    return iterate(this.mask)
      .map((v: number) => {
        return strict()(labels)
          .map((label: string) => this.graph.vertexLabels.get(label))
          .map((storage: Storage<any> | undefined) => storage && storage.get(v))
          .filter((value: any) => value !== null && value !== undefined)
      })
      .flatten()
  }

  labels(): Array<string> {
    const data: Array<string> = [];
    B.iterate(this.mask, (v: number) => {
      this.graph.vertexLabels.forEach((value, key) => {
        if (key !== "in" && key !== "out" && value.mask.contains(v)) {
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
    if (other instanceof EdgeTraverser) {
      this.edgeSnapshots.set(label, other.mask);
    } else {
      this.vertexSnapshots.set(label, other.mask);
    }
    return this;
  }

  from(label: string): VertexTraverser {
    const mask = this.vertexSnapshots.get(label);
    if (mask !== undefined) {
      this.mask = mask
    }
    return this;
  }

  edgeBuilder(): EdgeBuilder {
    return new EdgeBuilder(this);
  }
}

export class EdgeTraverser extends Traverser {
  hasLabel(...labels: Array<string>): EdgeTraverser {
    if (labels.length == 0) {
      return this;
    }

    const masks: B.HierarchicalBitset[] = [];
    labels.forEach(label => {
      const storage = this.graph.edgeLabels.get(label) || { mask: B.zero(0) };
      masks.push(storage.mask);
    });
    return new EdgeTraverser(this.graph, B.and(this.mask, B.or(...masks)),
      this.vertexSnapshots, this.edgeSnapshots);
  }

  matchesValue<T extends object>(key: string, matcher: (value: T) => boolean): EdgeTraverser {
    const values = this.graph.edgeLabels.get(key);
    const mask = new B.BitSet(this.mask.size());
    if (values) {
      B.iterate(this.mask, (e: number) => {
        if (matcher(values.get(e) as T)) {
          mask.add(e);
        }
      });
    }
    return new EdgeTraverser(this.graph, mask, this.vertexSnapshots, this.edgeSnapshots);
  }

  in(): VertexTraverser {
    return this.step("in");
  }

  out(): VertexTraverser {
    return this.step("out");
  }

  both(): VertexTraverser {
    return this.step("both");
  }

  step(direction: string): VertexTraverser {
    const vertices = this.graph.edgeLabels.get("->");
    const mask = new B.BitSet(this.mask.size());
    if (vertices) {
      B.iterate(this.mask, (e: number) => {
        const v = vertices.get(e) as number[];
        let targets = v;
        switch (direction) {
          case "in": targets = [v[0]]; break;
          case "out": targets = [v[1]]; break;
        }
        targets.forEach(target => mask.add(target));
      });
    }
    return new VertexTraverser(this.graph, mask, this.vertexSnapshots, this.edgeSnapshots);
  }

  labels(): Array<string> {
    const data: Array<string> = [];
    B.iterate(this.mask, (e: number) => {
      this.graph.edgeLabels.forEach((value, key) => {
        if (key !== "->" && value.mask.contains(e)) {
          data.push(key);
        }
      });
    });
    return data;
  }

  values(...labels: Array<string>): LazyJS.Sequence<any> {
    if (labels.length == 0) {
      this.graph.edgeLabels.forEach(({ }, key) => {
        if (key !== "->") {
          labels.push(key)
        }
      })
    }
    return iterate(this.mask)
      .map((e: number) => {
        return strict()(labels)
          .map((label: string) => this.graph.edgeLabels.get(label))
          .map((storage: Storage<any> | undefined) => storage && storage.get(e))
          .filter((value: object) => value !== null && value !== undefined)
      })
      .flatten()
  }

  as(label: string): EdgeTraverser {
    this.edgeSnapshots.set(label, this.mask);
    return this;
  }

  from(label: string): EdgeTraverser {
    const mask = this.edgeSnapshots.get(label);
    if (mask !== undefined) {
      this.mask = mask
    }
    return this;
  }
}

export class EdgeBuilder {
  context: VertexTraverser;
  e: [B.HierarchicalBitset, B.HierarchicalBitset];
  l: string | undefined;

  constructor(context: VertexTraverser) {
    this.context = context;
    this.e = [B.zero(0), B.zero(0)];
    this.l = undefined;
  }

  from(snapshot: string) {
    this.e[0] = this.context.vertexSnapshots.get(snapshot) as HierarchicalBitset;
    return this;
  }

  to(snapshot: string) {
    this.e[1] = this.context.vertexSnapshots.get(snapshot) as HierarchicalBitset;
    return this;
  }

  label(l: string) {
    this.l = l;
    return this;
  }

  build(): VertexTraverser {
    B.iterate(this.e[0], (v0: number) => {
      B.iterate(this.e[1], (v1: number) => {
        const e = this.context.graph.addEdge(v0, v1);
        if (this.l) {
          this.context.graph.addEdgeLabel(e, this.l, undefined);
        }
      });
    });
    return this.context;
  }
}

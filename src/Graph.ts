import { BitSet, HierarchicalBitset, createIterator, one, zero, not, and } from "hibitset-js/lib";
import { Storage, StorageMap, NullStorage, VectorStorage } from "./Storage";
import { VertexTraverser, EdgeTraverser } from "./Traverser";

export type Vertex = number;
export type Edge = number;

export class Graph {
  v: number;
  e: number;
  openV: BitSet;
  openE: BitSet
  vertexLabels: StorageMap;
  edgeLabels: StorageMap;

  constructor() {
    this.v = 0;
    this.e = 0;
    this.openE = new BitSet(0)
    this.openV = new BitSet(0)
    this.vertexLabels = new Map();
    this.edgeLabels = new Map();
    this.registerVertexLabel("out", new VectorStorage());
    this.registerVertexLabel("in", new VectorStorage());
    this.registerEdgeLabel("->", new VectorStorage());
  }

  registerVertexLabel<T>(name: string, storage: Storage<T> = new NullStorage<T>()) {
    this.vertexLabels.set(name, storage);
  }

  registerEdgeLabel<T>(name: string, storage: Storage<T> = new NullStorage<T>()) {
    this.edgeLabels.set(name, storage);
  }

  private setVertexLabel<T>(label: string, vertex: number, value: T | undefined) {
    this.vertexLabels.get(label)!.set(vertex, value);
  }
  private setEdgeLabel<T>(label: string, edge: number, value: T | undefined) {
    this.edgeLabels.get(label)!.set(edge, value)
  }

  addVertex(): Vertex {
    let v
    const { value, done } = createIterator(this.openE).next()
    if (!done && value != undefined) {
      this.openE.remove(value)
      v = value
    } else {
      v = this.v++
    }
    this.setVertexLabel("out", v, new Set())
    this.setVertexLabel("in", v, new Set())
    return v
  }

  addEdge(v0: Vertex, v1: Vertex): Edge {
    let e
    const { value, done } = createIterator(this.openE).next()
    if (!done && value != undefined) {
      this.openE.remove(value)
      e = value
    } else {
      e = this.e++
    }
    this.appendValue<Edge>(v0, "out", e);
    this.appendValue<Edge>(v1, "in", e);
    this.addEdgeLabel<[Vertex, Vertex]>(e, "->", [v0, v1]);
    return e;
  }

  removeVertex(v: Vertex) {
    this.openV.add(v)
    const ins = this.vertexLabels.get("in")
    const outs = this.vertexLabels.get("out")
    if (ins !== undefined && outs !== undefined) {
      ins.get(v).forEach((e: Edge) => this.removeEdge(e))
      outs.get(v).forEach((e: Edge) => this.removeEdge(e))
    }
    this.vertexLabels.forEach(label => label.remove(v))
  }

  removeEdge(e: Edge) {
    this.openE.add(e)
    const [from, to] = this.edgeLabels.get("->")!.get(e)
    this.removeValue<Edge>(from, "out", e);
    this.removeValue<Edge>(to, "in", e);
    this.edgeLabels.forEach(label => label.remove(e))
  }

  addVertexLabel<T extends object>(v: number, name: string, value?: T) {
    this.setVertexLabel(name, v, value)
  }

  addEdgeLabel<T extends object>(e: number, name: string, value?: T) {
    this.setEdgeLabel(name, e, value)
  }

  removeVertexLabel<T>(label: string, vertex: number) {
    this.vertexLabels.get(label)!.remove(vertex)
  }

  removeEdgeLabel<T>(label: string, edge: number) {
    this.edgeLabels.get(label)!.remove(edge)
  }

  appendValue<T>(v: number, name: string, value: T) {
    const storage: Storage<Set<T>> | undefined = this.vertexLabels.get(name)
    if (storage != undefined) {
      const container = storage.get(v) || new Set<T>();
      container.add(value);
      this.setVertexLabel(name, v, container)
    }
  }

  removeValue<T>(v: number, name: string, value: T) {
    const storage: Storage<Set<T>> | undefined = this.vertexLabels.get(name)
    if (storage != undefined) {
      const container = storage.get(v) || new Set<T>();
      container.delete(value);
      this.setVertexLabel(name, v, container)
    }
  }

  getVertex(v: number, ...labels: Array<string>): { [key: string]: object } {
    const result: { [key: string]: object } = {};
    labels.forEach(label => {
      const storage: Storage<any> | undefined = this.vertexLabels.get(label)
      if (storage !== undefined) {
        result[label] = storage.get(v)
      }
    });
    return result;
  }

  getEdge(e: number, ...labels: Array<string>): { [key: string]: object } {
    const result: { [key: string]: object } = {};
    labels.forEach(label => {
      const storage: Storage<any> | undefined = this.edgeLabels.get(label)
      if (storage !== undefined) {
        result[label] = storage.get(e)
      }
    });
    return result;
  }

  V(v?: number,
    vertexSnapshots: Map<string, HierarchicalBitset> = new Map(),
    edgeSnapshots: Map<string, HierarchicalBitset> = new Map()): VertexTraverser {
    if (v !== undefined) {
      const mask = new BitSet(v + 1);
      if (v < this.v) {
        mask.add(v);
      }
      return new VertexTraverser(this, and(mask, not(this.openV)), vertexSnapshots, edgeSnapshots);
    } else {
      return new VertexTraverser(this, and(one(this.v), not(this.openV)), vertexSnapshots, edgeSnapshots);
    }
  }

  E(e?: number): EdgeTraverser {
    if (e !== undefined) {
      const mask = new BitSet(e + 1);
      if (e < this.e) {
        mask.add(e);
      }
      return new EdgeTraverser(this, and(mask, not(this.openE)), new Map(), new Map());
    } else {
      return new EdgeTraverser(this, and(one(this.e), not(this.openE)), new Map(), new Map());
    }
  }
};

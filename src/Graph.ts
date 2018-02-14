import { BitSet, HierarchicalBitset, one } from "hibitset-js";
import { Storage, StorageMap, NullStorage, VectorStorage } from "./Storage";
import { VertexTraverser, EdgeTraverser } from "./Traverser";

export type Vertex = number;
export type Edge = number;

export class Graph {
  v: number;
  e: number;
  vertexLabels: StorageMap;
  edgeLabels: StorageMap;

  constructor() {
    this.v = 0;
    this.e = 0;
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
    const storage: Storage<T> | undefined = this.vertexLabels.get(label);
    if (storage !== undefined) {
      storage.set(vertex, value);
    }
  }
  private setEdgeLabel<T>(label: string, edge: number, value: T | undefined) {
    const storage: Storage<T> | undefined = this.edgeLabels.get(label);
    if (storage !== undefined) {
      storage.set(edge, value);
    }
  }

  addVertex(): Vertex {
    this.setVertexLabel("out", this.v, new Set())
    this.setVertexLabel("in", this.v, new Set())
    return this.v++;
  }

  addEdge(v0: Vertex, v1: Vertex): Edge {
    this.appendValue<Edge>(v0, "out", this.e);
    this.appendValue<Edge>(v1, "in", this.e);
    this.addEdgeLabel<[Vertex, Vertex]>(this.e, "->", [v0, v1]);
    return this.e++;
  }

  addVertexLabel<T extends object>(v: number, name: string, value?: T) {
    this.setVertexLabel(name, v, value)
  }

  addEdgeLabel<T extends object>(e: number, name: string, value?: T) {
    this.setEdgeLabel(name, e, value)
  }

  appendValue<T>(v: number, name: string, value: T) {
    const storage: Storage<Set<T>> | undefined = this.vertexLabels.get(name)
    if (storage != undefined) {
      const container = storage.get(v) || new Set<T>();
      container.add(value);
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
      return new VertexTraverser(this, mask, vertexSnapshots, edgeSnapshots);
    } else {
      return new VertexTraverser(this, one(this.v), vertexSnapshots, edgeSnapshots);
    }
  }

  E(e?: number): EdgeTraverser {
    if (e !== undefined) {
      const mask = new BitSet(e + 1);
      if (e < this.e) {
        mask.add(e);
      }
      return new EdgeTraverser(this, mask, new Map(), new Map());
    } else {
      return new EdgeTraverser(this, one(this.e), new Map(), new Map());
    }
  }
};

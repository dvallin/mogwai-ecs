import { BitSet, HierarchicalBitset, one, and } from "hibitset-js";
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

  registerVertexLabel<T extends object>(name: string, storage: Storage = new NullStorage()) {
    this.vertexLabels.set(name, storage);
  }

  registerEdgeLabel<T extends object>(name: string, storage: Storage = new NullStorage()) {
    this.edgeLabels.set(name, storage);
  }

  addVertex(): Vertex {
    return this.v++;
  }

  addEdge(v0: Vertex, v1: Vertex): Edge {
    this.appendValue(v0, "out", this.e);
    this.appendValue(v1, "in", this.e);
    this.addEdgeLabel(this.e, "->", [v0, v1]);
    return this.e++;
  }

  addVertexLabel<T extends object>(v: number, name: string, value: T = undefined) {
    this.vertexLabels.get(name).set(v, value);
  }

  addEdgeLabel<T extends object>(e: number, name: string, value: T = undefined) {
    this.edgeLabels.get(name).set(e, value);
  }

  appendValue<T>(v: number, name: string, value: T) {
    const container = <Set<T>>this.vertexLabels.get(name).get(v) || new Set();
    container.add(value);
    this.vertexLabels.get(name).set(v, container);
  }

  getVertex(v: number, ...labels: Array<string>): object {
    const result = [];
    labels.forEach(label => {
      result[label] = this.vertexLabels.get(label).get(v);
    });
    return result;
  }

  getEdge(e: number, ...labels: Array<string>): object {
    const result = [];
    labels.forEach(label => {
      result[label] = this.edgeLabels.get(label).get(e);
    });
    return result;
  }

  V(v: number = undefined,
    vertexSnapshots: Map<string, HierarchicalBitset> = new Map(),
    edgeSnapshots: Map<string, HierarchicalBitset> = new Map()): VertexTraverser {
    if (v !== undefined) {
      const mask = new BitSet(v+1);
      if(v < this.v) {
        mask.add(v);
      }
      return new VertexTraverser(this, mask, vertexSnapshots, edgeSnapshots);
    } else {
      return new VertexTraverser(this, one(this.v), vertexSnapshots, edgeSnapshots);
    }
  }

  E(e: number = undefined): EdgeTraverser {
    if (e !== undefined) {
      const mask = new BitSet(e+1);
      if(e < this.e) {
        mask.add(e);
      }
      return new EdgeTraverser(this, mask, new Map(), new Map());
    } else {
      return new EdgeTraverser(this, one(this.e), new Map(), new Map());
    }
  }
};

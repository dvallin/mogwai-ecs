import { BitSet, one } from "hibitset-js";
import { Storage, StorageMap, NullStorage, VectorStorage } from "./Storage";
import { VertexTraverser, EdgeTraverser } from "./Traverser";

export type Vertex = number;
export type Edge = number;

export class Graph {
  v: number;
  e: number;
  vertexLabels: StorageMap;
  edgeLabels: StorageMap;

  constructor(v: number = 0, e: number = 0) {
    this.v = v;
    this.e = e;
    this.vertexLabels = new Map();
    this.edgeLabels = new Map();
    this.registerVertexLabel("out", new VectorStorage());
    this.registerVertexLabel("in", new VectorStorage());
    this.registerEdgeLabel("->", new VectorStorage());
  }

  registerVertexLabel(name: string, storage: Storage = new NullStorage()) {
    this.vertexLabels.set(name, storage);
  }

  registerEdgeLabel(name: string, storage: Storage = new NullStorage()) {
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

  addVertexLabel(v: number, name: string, value: object) {
    this.vertexLabels.get(name).set(v, value);
  }

  addEdgeLabel(e: number, name: string, value: object) {
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


  V(v: number): VertexTraverser {
    if (v !== undefined) {
      const mask = new BitSet(v+1);
      mask.add(v);
      return new VertexTraverser(this, mask, new Map(), new Map());
    } else {
      return new VertexTraverser(this, one(this.v), new Map(), new Map());
    }
  }

  E(e: number): EdgeTraverser {
    if (e !== undefined) {
      const mask = new BitSet(e+1);
      mask.add(e);
      return new EdgeTraverser(this, mask, new Map(), new Map());
    } else {
      return new EdgeTraverser(this, one(this.e), new Map(), new Map());
    }
  }
};

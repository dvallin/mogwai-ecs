
import { Graph } from "./Graph"
import { VertexTraverser, EdgeTraverser } from "./Traverser";
import LazyJS from "lazy.js";

export class Fetcher {
  graph: Graph;
  traverser: VertexTraverser;
  components: Array<string>;
  sub: Array<[string, (t: VertexTraverser) => VertexTraverser, Array<string>]>
  relations: Array<[string, (t: VertexTraverser) => EdgeTraverser, Array<string>]>

  constructor(graph: Graph, v?: number) {
    this.traverser = graph.V(v);
    this.graph = graph;
    this.sub = [];
    this.relations = [];
    this.components = [];
  }

  on(f: (t: VertexTraverser) => VertexTraverser): Fetcher {
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

  stream(): LazyJS.Sequence<any> {
    return this.traverser.stream()
      .map((entity: any) => {
        const subcomponents: { [component: string]: any } = {}
        this.sub.forEach(s => {
          subcomponents[s[0]] = new Fetcher(this.graph, entity)
            .on(s[1])
            .withComponents(...s[2])
            .collect();
        });
        const fetchedRelations: { [component: string]: any } = {}
        this.relations.forEach(r => {
          fetchedRelations[r[0]] = r[1](this.graph.V(entity))
            .stream()
            .map((relation: number) => {
              const edge = this.graph.getEdge(relation, "->", ...r[2])
              const edgeRelation = edge["->"] as number[]
              delete edge["->"]
              const other = edgeRelation[0] === entity ? edgeRelation[1] : edgeRelation[0]
              return {
                relation,
                other,
                ...edge,
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

  first() {
    return this.stream().first(1).toArray()[0]
  }
}
import { World } from "./World"
import { Vertex, Edge } from "./Graph"

export class RelationBuilder {
  world: World
  v0: Vertex | undefined
  v1: Vertex | undefined
  e: Edge | undefined
  updates: Array<[string, (d: any) => void]>
  addComponents: Array<[string, any]>
  removeComponents: Array<string>

  constructor(world: World) {
    this.world = world
    this.addComponents = []
    this.removeComponents = []
    this.updates = []
  }

  relation(e?: Edge) {
    this.e = e;
    return this;
  }

  from(v: Vertex) {
    this.v0 = v;
    return this;
  }

  to(v: Vertex) {
    this.v1 = v;
    return this;
  }

  with<T extends object>(relation: string, data?: T) {
    this.addComponents.push([relation, data]);
    return this;
  }

  withOut<T extends object>(relation: string) {
    this.removeComponents.push(relation);
    return this;
  }

  update<T extends object>(relation: string, updater: (d: T) => void) {
    this.updates.push([relation, updater]);
    return this;
  }

  delete(): void {
    if (this.e === undefined) {
      throw Error("missing edge id")
    }
    this.world.graph.removeEdge(this.e)
  }

  close(): number {

    let e: number
    if (this.e === undefined) {
      if (this.v0 === undefined) {
        throw Error('must specify a start for a relation')
      }
      if (this.v1 === undefined) {
        throw Error('must specify an end for a relation')
      }
      e = this.world.graph.addEdge(this.v0, this.v1)
    } else {
      e = this.e
    }

    this.addComponents.forEach(([relation, data]) => {
      this.world.graph.addEdgeLabel(e, relation, data);
    });
    this.removeComponents.forEach((relation) => {
      this.world.graph.removeEdgeLabel(e, relation);
    });
    this.updates.forEach(([relation, updater]) =>
      updater(this.world.graph.getEdge(e, relation)[relation])
    );
    return e;
  };
}

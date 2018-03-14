import { World } from "./World"
import { RelationBuilder } from "./RelationBuilder"
import { Vertex } from "./Graph"

export class EntityBuilder {
  world: World;
  addComponents: Array<[string, any]>;
  removeComponents: Array<string>;
  updates: Array<[string, (d: any) => void]>;
  relations: Array<(b: RelationBuilder) => void>;
  v: Vertex | undefined;

  constructor(world: World) {
    this.world = world;
    this.addComponents = [];
    this.removeComponents = [];
    this.relations = [];
    this.updates = [];
  }

  entity(v?: Vertex) {
    this.v = v;
    return this;
  }

  with<T>(component: string, data?: T) {
    this.addComponents.push([component, data]);
    return this;
  }

  withOut<T>(component: string) {
    this.removeComponents.push(component);
    return this;
  }

  update<T>(component: string, updater: (d: T) => void) {
    this.updates.push([component, updater]);
    return this;
  }

  rel(e: (b: RelationBuilder) => void): EntityBuilder {
    this.relations.push(e);
    return this;
  }

  delete(): void {
    if (this.v === undefined) {
      throw Error("missing vertex id")
    }
    this.world.graph.removeVertex(this.v)
  }

  close(): number {
    let v: number
    if (this.v === undefined) {
      v = this.world.graph.addVertex()
    } else {
      v = this.v
    }

    this.addComponents.forEach(([component, data]) =>
      this.world.graph.addVertexLabel(v, component, data)
    );
    this.removeComponents.forEach((component) =>
      this.world.graph.removeVertexLabel(v, component)
    );
    this.updates.forEach(([component, updater]) => {
      updater(this.world.graph.getVertex(v, component)[component])
    });
    this.relations.forEach(e =>
      e(new RelationBuilder(this.world).from(v))
    );
    return v;
  }
}

import { World } from "./World"
import { RelationBuilder } from "./RelationBuilder"

export class EntityBuilder {
  world: World;
  components: Array<[string, any]>;
  updates: Array<[string, (d: any) => void]>;
  relations: Array<(b: RelationBuilder) => void>;
  v: number | undefined;

  constructor(world: World) {
    this.world = world;
    this.components = [];
    this.relations = [];
    this.updates = [];
  }

  entity(v?: number) {
    this.v = v;
    return this;
  }

  with<T>(component: string, data?: T) {
    this.components.push([component, data]);
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

  close(): number {

    let v: number
    if (this.v === undefined) {
      v = this.world.graph.addVertex()
    } else {
      v = this.v
    }

    this.components.forEach(([component, data]) =>
      this.world.graph.addVertexLabel(v, component, data)
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
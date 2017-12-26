import {World} from "./World"
import {RelationBuilder} from "./RelationBuilder"

export class EntityBuilder {
    world: World;
    components: Array<[string, object]>;
    updates: Array<[string, (d: object) => void]>;
    relations: Array<(b: RelationBuilder) => void>;
    v: number;
  
    constructor(world: World) {
      this.world = world;
      this.components = [];
      this.relations = [];
      this.updates = [];
    }
  
    entity(v: number) {
      this.v = v;
      return this;
    }
  
    with<T extends object>(component: string, data: T = undefined) {
      this.components.push([component, data]);
      return this;
    }
  
    update<T extends object>(component: string, updater: (d: T) => void) {
      this.updates.push([component, updater]);
      return this;
    }
  
    rel(e: (b: RelationBuilder) => void): EntityBuilder {
      this.relations.push(e);
      return this;
    }
  
    close(): number {
      if(this.v == undefined) {
        this.v = this.world.graph.addVertex();
      }
      this.components.forEach(([component, data]) =>
        this.world.graph.addVertexLabel(this.v, component, data)
      );
      this.updates.forEach(([component, updater]) => {
        updater(this.world.graph.getVertex(this.v, component)[component])
      });
      this.relations.forEach(e =>
          e(new RelationBuilder(this.world).from(this.v))
      );
      return this.v;
    }
  }
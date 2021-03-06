import { Graph } from "./Graph"
import { Storage, NullStorage } from "./Storage";
import { Fetcher } from "./Fetcher"
import { EntityBuilder } from "./EntityBuilder"
import { RelationBuilder } from "./RelationBuilder"

export interface System {
    execute: (world: World) => void;
}

export class World {
    graph: Graph;
    systems: Map<string, System>;

    constructor() {
        this.graph = new Graph();
        this.systems = new Map();
    }

    registerComponent<T>(name: string, storage: Storage<T> = new NullStorage<T>()) {
        this.graph.registerVertexLabel(name, storage);
    }

    registerRelation<T>(name: string, storage: Storage<T> = new NullStorage<T>()) {
        this.graph.registerEdgeLabel(name, storage);
    }

    registerSystem(name: string, system: System) {
        this.systems.set(name, system);
    }

    run() {
        this.systems.forEach(system => system.execute(this));
    }

    entity(v?: number): EntityBuilder {
        return new EntityBuilder(this).entity(v);
    }

    relation(r?: number): RelationBuilder {
        return new RelationBuilder(this).relation(r);
    }

    fetch(...v: number[]): Fetcher {
        return new Fetcher(this.graph, v);
    }
};


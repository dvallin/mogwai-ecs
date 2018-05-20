import { BitSet } from "hibitset-js/lib";

export interface Storage<T> {
    mask: BitSet;
    set: (index: number, value: T | undefined) => boolean;
    get: (index: number) => T | null | undefined;
    remove: (index: number) => boolean;
    getPartition: (value: T) => number[]
};

export type StorageMap = Map<string, Storage<any>>;

export class NullStorage<T> implements Storage<T> {
    public mask: BitSet;

    constructor() {
        this.mask = new BitSet();
    }

    resize(index: number) {
        if (this.mask.size() < index) {
            this.mask.grow(index);
        }
    }

    set(index: number, { }: T | undefined): boolean {
        this.resize(index + 1);
        return this.mask.add(index);
    }

    get(index: number): T | null | undefined {
        return this.mask.contains(index) ? null : undefined;
    }

    remove(index: number): boolean {
        return this.mask.remove(index);
    }

    getPartition(): number[] {
        return []
    }
}

export class VectorStorage<T extends object> implements Storage<T> {
    public mask: BitSet;
    private data: Array<T | undefined>;

    constructor() {
        this.mask = new BitSet();
        this.data = [];
    }

    resize(index: number) {
        while (this.data.length < index) {
            this.data.push(undefined)
        }
        if (this.mask.size() < index) {
            this.mask.grow(index);
        }
    }

    set(index: number, value: T | undefined): boolean {
        this.resize(index + 1);
        this.data[index] = value;
        return this.mask.add(index);
    }

    get(index: number): T | undefined {
        return this.data[index];
    }

    remove(index: number): boolean {
        this.data[index] = undefined;
        return this.mask.remove(index);
    }

    getPartition(): number[] {
        return []
    }
};

export class MapStorage<T extends object> implements Storage<T> {
    public mask: BitSet;
    private data: Map<number, T | undefined>;

    constructor() {
        this.mask = new BitSet();
        this.data = new Map();
    }

    resize(index: number) {
        if (this.mask.size() < index) {
            this.mask.grow(index);
        }
    }

    set(index: number, value: T | undefined): boolean {
        this.resize(index + 1);
        this.data.set(index, value)
        return this.mask.add(index);
    }

    get(index: number): T | undefined {
        return this.data.get(index);
    }

    remove(index: number): boolean {
        this.data.delete(index)
        return this.mask.remove(index);
    }

    getPartition(): number[] {
        return []
    }
}
export class Boxed<T> {
    private v: T
    public constructor(
        value: T,
        public changeCallback: (oldValue: T, newValue: T) => void = () => { return }
    ) {
        this.v = value
    }

    public get value(): T {
        return this.v
    }

    public set value(value: T) {
        this.changeCallback(this.v, value)
        this.v = value
    }
}

export class PartitionedStorage<T extends object> implements Storage<Boxed<T>> {
    private partitions: { [index: string]: number[] }

    public get mask(): BitSet {
        return this.storage.mask
    }

    constructor(
        private storage: Storage<Boxed<T>>,
        public partitioner: (value: T) => string
    ) {
        this.partitions = {}
    }

    update(index: number, oldValue: T | undefined, newValue: T | undefined): void {
        if (oldValue !== undefined) {
            const oldPartitionIndex: string = this.partitioner(oldValue)
            const oldPartition: number[] | undefined = this.partitions[oldPartitionIndex]
            if (oldPartition !== undefined) {
                const i = oldPartition.findIndex(p => p === index)
                if (i >= 0) {
                    oldPartition[i] = oldPartition[oldPartition.length - 1]
                    oldPartition.pop()
                }
            }
        }
        if (newValue !== undefined) {
            const newPartitionIndex: string = this.partitioner(newValue)
            const newPartition: number[] | undefined = this.partitions[newPartitionIndex]
            if (newPartition === undefined) {
                this.partitions[newPartitionIndex] = [index]
            } else {
                newPartition.push(index)
            }
        }
    }

    set(index: number, value: Boxed<T> | undefined): boolean {
        if (value !== undefined) {
            const ownValue = new Boxed(value.value, (o, v) => {
                value.changeCallback(o, v)
                this.update(index, o, v)
            })
            const oldValue = this.storage.get(index)
            this.update(index,
                oldValue !== undefined && oldValue !== null ? oldValue.value : undefined,
                value !== undefined && value !== null ? value.value : undefined
            )
            return this.storage.set(index, ownValue)
        } else {
            return this.storage.set(index, undefined)
        }
    }

    get(index: number): Boxed<T> | null | undefined {
        return this.storage.get(index)
    }

    getPartition(value: Boxed<T>): number[] {
        const index = this.partitioner(value.value)
        return this.partitions[index]
    }

    getPartitionByIndex(index: string): number[] {
        return this.partitions[index]
    }

    remove(index: number): boolean {
        const oldValue = this.get(index)
        if (oldValue !== undefined && oldValue !== null) {
            this.update(index, oldValue.value, undefined)
        }
        return this.storage.remove(index)
    }
}

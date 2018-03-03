import { BitSet } from "hibitset-js/lib";

export interface Storage<T> {
  mask: BitSet;
  set: (index: number, value: T | undefined) => boolean;
  get: (index: number) => T | undefined;
  remove: (index: number) => boolean;
};
export type StorageMap = Map<string, Storage<any>>;

export class NullStorage<T> implements Storage<T> {
  mask: BitSet;

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

  get({ }: number): T | undefined {
    return undefined;
  }

  remove(index: number): boolean {
    return this.mask.remove(index);
  }
}

export class VectorStorage<T extends object> implements Storage<T> {
  mask: BitSet;
  data: Array<T | undefined>;

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
};

export class MapStorage<T extends object> implements Storage<T> {
  mask: BitSet;
  data: Map<number, T | undefined>;

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
}

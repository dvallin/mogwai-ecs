import { BitSet } from "hibitset-js";

export interface Storage {
  mask: BitSet;
  set: (index: number, value: object) => boolean;
  get: (index: number) => object;
  remove: (index: number) => boolean;
};
export type StorageMap = Map<string, Storage>;

export class NullStorage<T extends Object> implements Storage {
  mask: BitSet;

  constructor() {
    this.mask = new BitSet();
  }

  resize(index: number) {
    if(this.mask.size() < index) {
      this.mask.grow(index);
    }
  }

  set(index: number, value: T): boolean {
    this.resize(index+1);
    return this.mask.add(index);
  }

  get(index: number): T {
    return undefined;
  }

  remove(index: number): boolean {
    return this.mask.remove(index);
  }
}

export class VectorStorage<T extends object> implements Storage {
  mask: BitSet;
  data: Array<T>;

  constructor () {
    this.mask = new BitSet();
    this.data = [];
  }

  resize(index: number) {
    while(this.data.length < index) {
      this.data.push(undefined);
    }
    if(this.mask.size() < index) {
      this.mask.grow(index);
    }
  }

  set(index: number, value: T): boolean {
    this.resize(index+1);
    this.data[index] = value;
    return this.mask.add(index);
  }

  get(index: number): T {
    return this.data[index];
  }

  remove(index: number): boolean {
    this.data[index] = undefined;
    return this.mask.remove(index);
  }
};

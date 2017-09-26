import { BitSet } from "hibitset-js";

export interface Storage {
  mask: BitSet;
  set: (index: number, value: object) => boolean;
  get: (index: number) => object;
  remove: (index: number) => boolean;
};
export type StorageMap = Map<string, Storage>;

export class NullStorage implements Storage {
  mask: BitSet;

  constructor() {
    this.mask = new BitSet();
  }

  resize(index: number) {
    if(this.mask.size() < index) {
      this.mask.grow(index);
    }
  }

  set(index: number, value: object): boolean {
    this.resize(index+1);
    return this.mask.add(index);
  }

  get(index: number): object {
    return null;
  }

  remove(index: number): boolean {
    return this.remove(index);
  }
}

export class VectorStorage implements Storage {
  mask: BitSet;
  data: Array<object>;

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

  set(index: number, value: object): boolean {
    this.resize(index+1);
    this.data[index] = value;
    return this.mask.add(index);
  }

  get(index: number): object {
    return this.data[index];
  }

  remove(index: number): boolean {
    this.data[index] = undefined;
    return this.remove(index);
  }
};

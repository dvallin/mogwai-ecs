import { VectorStorage, NullStorage, Boxed, PartitionedStorage, MapStorage } from "./Storage"

describe("VectorStorage", () => {
    it("sets gets and deletes value", () => {
        const s = new VectorStorage<{ d: string }>()
        s.set(1, { d: "hello" })
        s.set(0, { d: "hello" })
        expect(s.get(0)).toEqual({ d: "hello" })
        expect(s.get(1)).toEqual({ d: "hello" })
        s.remove(0)
        s.remove(0)
        expect(s.get(0)).toBeUndefined()
        expect(s.get(1)).toEqual({ d: "hello" })
    })
})

describe("NullStorage", () => {
    it("sets gets and deletes values", () => {
        const s = new NullStorage()
        s.set(1, undefined)
        s.set(0, undefined)
        expect(s.get(0)).toBeNull()
        expect(s.get(1)).toBeNull()
        s.remove(0)
        s.remove(0)
        expect(s.get(0)).toBeUndefined()
        expect(s.get(1)).toBeNull()
    })
})

describe("PartitionedStorage", () => {
    it("sets gets and deletes values", () => {
        const s = new PartitionedStorage(new MapStorage<Boxed<{ d: string }>>(), (b) => b.d.length.toString())
        s.set(0, new Boxed({ d: "ab" }))
        s.set(1, new Boxed({ d: "cd" }))
        s.set(2, new Boxed({ d: "abc" }))
        expect(s.get(0)!.value).toEqual({ d: "ab" })
        expect(s.get(1)!.value).toEqual({ d: "cd" })
        expect(s.get(2)!.value).toEqual({ d: "abc" })
        expect(s.getPartition(new Boxed({ d: "rt" }))).toEqual([0, 1])
        s.remove(0)
        s.remove(0)
        expect(s.getPartition(new Boxed({ d: "rt" }))).toEqual([1])
    })
})

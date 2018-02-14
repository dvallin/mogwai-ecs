import { VectorStorage, NullStorage } from "./Storage";

describe("VectorStorage", () => {
    it("sets gets and deletes value", () => {
        const s = new VectorStorage<{d: string}>()
        s.set(1, {d: "hello"})
        s.set(0, {d: "hello"})
        expect(s.get(0)).toEqual({d: "hello"})
        expect(s.get(1)).toEqual({d: "hello"})
        s.remove(0)
        s.remove(0)
        expect(s.get(0)).toBeUndefined()
        expect(s.get(1)).toEqual({d: "hello"})
    })
})

describe("NullStorage", () => {
    it("sets gets and deletes values", () => {
        const s = new NullStorage<{d: string}>()
        s.set(1, {d: "hello"})
        s.set(0, {d: "hello"})
        expect(s.get(0)).toBeUndefined()
        expect(s.get(1)).toBeUndefined()
        s.remove(0)
        s.remove(0)
        expect(s.get(0)).toBeUndefined()
        expect(s.get(1)).toBeUndefined()
    })
})
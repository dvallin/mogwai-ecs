import { Graph, Edge } from "./Graph"
import { VectorStorage } from "."
import { Search } from "./Search"

describe("Search", () => {

    let search: Search
    let e01: Edge
    let e10: Edge
    let e02: Edge
    let e31: Edge
    let e13: Edge
    let e23: Edge
    let e24: Edge
    beforeAll(() => {
        const G = new Graph()
        search = new Search(G)

        const vertices = [G.addVertex(), G.addVertex(), G.addVertex(), G.addVertex(), G.addVertex(), G.addVertex()]
        e01 = G.addEdge(vertices[0], vertices[1])
        e10 = G.addEdge(vertices[1], vertices[0])
        e02 = G.addEdge(vertices[0], vertices[2])
        e13 = G.addEdge(vertices[1], vertices[3])
        e23 = G.addEdge(vertices[2], vertices[3])
        e31 = G.addEdge(vertices[3], vertices[1])
        e24 = G.addEdge(vertices[2], vertices[4])
    })

    it("calculates reachability", () => {
        expect(search.isReachable(0, 0)).toBeTruthy()
        expect(search.isReachable(0, 4)).toBeTruthy()
        expect(search.isReachable(0, 5)).toBeFalsy()
    })

    it("calculates paths", () => {
        expect(search.findPath(0, 0)).toEqual([0])
        expect(search.findPath(0, 2)).toEqual([0, 2])
        expect(search.findPath(0, 4)).toEqual([0, 2, 4])
        expect(search.findPath(0, 5)).toEqual([])
    })

    it("allows for custom neighborhoods", () => {
        expect(search.isReachable(0, 4, (n) => [n + 1])).toBeTruthy()
        expect(search.findPath(0, 4, (n) => [n + 1])).toEqual([0, 1, 2, 3, 4])
    })

    it("informs about layers", () => {
        const callback = jest.fn()
        search.isReachable(0, 4, search.defaultChildrenFunction, (layer) => callback([...layer]))
        expect(callback).toHaveBeenCalledTimes(2)
        expect(callback).toHaveBeenCalledWith([1, 2])
        expect(callback).toHaveBeenCalledWith([3, 4])
    })

    it("calculates all paths", () => {
        expect(search.paths(0, 0)).toEqual([[]])
        expect(search.paths(0, 4)).toEqual([[e02, e24]])
        expect(search.paths(0, 3)).toEqual([[e01, e13], [e02, e23]])
        expect(search.paths(1, 3)).toEqual([[e10, e02, e23], [e13]])
        expect(search.paths(0, 5)).toEqual([])
    })
})

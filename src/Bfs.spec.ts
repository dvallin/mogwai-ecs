import { Graph } from "./Graph"
import { VectorStorage } from "."
import { Bfs } from "./Bfs"

describe("Bfs", () => {

    let bfs: Bfs
    beforeAll(() => {
        const G = new Graph()
        bfs = new Bfs(G)

        const vertices = [G.addVertex(), G.addVertex(), G.addVertex(), G.addVertex(), G.addVertex(), G.addVertex()]
        G.addEdge(vertices[0], vertices[1])
        G.addEdge(vertices[1], vertices[0])
        G.addEdge(vertices[0], vertices[2])
        G.addEdge(vertices[1], vertices[3])
        G.addEdge(vertices[2], vertices[3])
        G.addEdge(vertices[3], vertices[1])
        G.addEdge(vertices[2], vertices[4])
    })

    it("calculates reachability", () => {
        expect(bfs.isReachable(0, 0)).toBeTruthy()
        expect(bfs.isReachable(0, 4)).toBeTruthy()
        expect(bfs.isReachable(0, 5)).toBeFalsy()
    })

    it("calculates paths", () => {
        expect(bfs.findPath(0, 0)).toEqual([0])
        expect(bfs.findPath(0, 2)).toEqual([0, 2])
        expect(bfs.findPath(0, 4)).toEqual([0, 2, 4])
        expect(bfs.findPath(0, 5)).toEqual([])
    })

    it("allows for custom neighborhoods", () => {
        expect(bfs.isReachable(0, 4, (n) => [n + 1])).toBeTruthy()
        expect(bfs.findPath(0, 4, (n) => [n + 1])).toEqual([0, 1, 2, 3, 4])
    })

    it("informs about layers", () => {
        const callback = jest.fn()
        bfs.isReachable(0, 4, bfs.defaultChildrenFunction, (layer) => callback([...layer]))
        expect(callback).toHaveBeenCalledTimes(2)
        expect(callback).toHaveBeenCalledWith([1, 2])
        expect(callback).toHaveBeenCalledWith([3, 4])
    })
})

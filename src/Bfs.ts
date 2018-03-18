import { Graph, Vertex } from "."
import { BitSet } from "hibitset-js/lib"

export function search(from: Vertex, to: Vertex,
    children: (node: number) => number[],
    discover: (parent: number, child: number) => void,
    newLayer: (layer: number[]) => void
): boolean {
    const visited = new BitSet(0)
    visited.add(from)

    let currentLayer = [from]
    let nextLayer: number[] = []
    let found = false
    while (currentLayer.length > 0) {
        const parent = currentLayer.pop()!
        if (parent === to) {
            found = true
            break
        }
        for (const child of children(parent)) {
            if (!visited.add(child)) {
                discover(parent, child)
                nextLayer.push(child)
            }
        }
        if (currentLayer.length === 0) {
            [currentLayer, nextLayer] = [nextLayer, currentLayer]
            newLayer(currentLayer)
        }
    }
    return found
}

export class Bfs {
    public constructor(private g: Graph) { }

    get defaultChildrenFunction(): (node: number) => number[] {
        return (node: number) => this.g.V(node).out().toList()
    }

    public isReachable(from: Vertex, to: Vertex,
        children: (node: number) => number[] = this.defaultChildrenFunction,
        finishedLayer: (layer: number[]) => void = () => { }
    ): boolean {
        return search(from, to, children, () => { }, finishedLayer)
    }

    public findPath(from: Vertex, to: Vertex,
        children: (node: number) => number[] = this.defaultChildrenFunction,
        discover: (parent: number, child: number) => void = () => { },
        finishedLayer: (layer: number[]) => void = () => { }
    ): number[] {
        const path: number[] = []
        const parentsLinks: Map<number, number> = new Map()
        const found = search(from, to, children,
            (parent: number, child: number) => {
                parentsLinks.set(child, parent)
                discover(parent, child)
            },
            finishedLayer
        )
        if (found) {
            let current = to
            path.push(current)
            while (current !== from) {
                current = parentsLinks.get(current)!
                path.push(current)
            }
        }
        return path.reverse()
    }
}

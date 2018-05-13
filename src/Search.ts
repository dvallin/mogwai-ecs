import { Graph, Vertex, Edge, Fetcher } from "."
import { BitSet } from "hibitset-js/lib"

export function allPaths(from: Vertex, to: Vertex,
    traverse: (node: Vertex) => { relation: Edge, other: Vertex }[],
): Edge[][] {
    const visited = new BitSet(0)
    const paths: Edge[][] = []
    const currentPath: Edge[] = []

    function visit(currentNode: number): void {
        if (currentNode === to) {
            paths.push([...currentPath])
        } else {
            visited.add(currentNode)
            traverse(currentNode).forEach(relation => {
                if (!visited.contains(relation.other)) {
                    currentPath.push(relation.relation)
                    visit(relation.other)
                    currentPath.pop()
                }
            })
            visited.remove(currentNode)
        }
    }
    visit(from)
    return paths;
}

export function bfs(from: Vertex, done: (v: Vertex) => boolean,
    children: (node: number) => number[],
    discover: (parent: number, child: number) => void,
    newLayer: (layer: number[]) => void
): boolean {
    const visited = new BitSet(0)
    visited.add(from)

    let currentLayer = [from]
    let nextLayer: number[] = []
    let isDone = false
    while (currentLayer.length > 0) {
        const currentNode = currentLayer.pop()!
        if (done(currentNode)) {
            isDone = true
            break
        }
        for (const child of children(currentNode)) {
            if (!visited.add(child)) {
                discover(currentNode, child)
                nextLayer.push(child)
            }
        }
        if (currentLayer.length === 0) {
            [currentLayer, nextLayer] = [nextLayer, currentLayer]
            newLayer(currentLayer)
        }
    }
    return isDone
}

export class Search {
    public constructor(private g: Graph) { }

    get defaultChildrenFunction(): (node: Vertex) => Vertex[] {
        return (node: number) => this.g.V([node]).out().toList()
    }

    get defaultTraverseFunction(): (node: Vertex) => { relation: Edge, other: Vertex }[] {
        return (node: number) => {
            return new Fetcher(this.g, [node])
                .relationsFetch("outE", f => f.outE())
                .first()
                .outE
        }
    }

    public isReachable(from: Vertex, to: Vertex,
        children: (node: number) => number[] = this.defaultChildrenFunction,
        finishedLayer: (layer: number[]) => void = () => { }
    ): boolean {
        return bfs(from, v => v === to, children, () => { }, finishedLayer)
    }

    public paths(from: Vertex, to: Vertex,
        traverse: (node: number) => { relation: Edge, other: Vertex }[] = this.defaultTraverseFunction
    ): Edge[][] {
        return allPaths(from, to, traverse)
    }

    public findPath(from: Vertex, to: Vertex,
        children: (node: Vertex) => Vertex[] = this.defaultChildrenFunction,
        discover: (parent: Vertex, child: Vertex) => void = () => { },
        finishedLayer: (layer: Vertex[]) => void = () => { }
    ): Vertex[] {
        const path: number[] = []
        const parentsLinks: Map<number, number> = new Map()
        const found = bfs(from, v => v === to, children,
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

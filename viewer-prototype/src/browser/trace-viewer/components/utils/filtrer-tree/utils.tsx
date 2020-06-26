import { Entry } from 'tsp-typescript-client/lib/models/entry';
import { TreeNode } from './tree-node';

const entryToTreeNode = (entry: Entry) => ({
        id: entry.id,
        parentId: entry.parentId,
        name: entry.labels[0],
        expanded: true,
        isRoot: false,
        children: []
    } as TreeNode);

export const listToTree = (list: Entry[]): TreeNode[] => {
    const rootNodes: TreeNode[] = [];
    const lookup: { [key: string]: TreeNode } = {};
    list.forEach(entry => {
        lookup[entry.id] = entryToTreeNode(entry);
    });
    Object.keys(lookup).forEach(id => {
        const entry = lookup[id];
        if (entry.parentId === -1) {
            entry.isRoot = true;
            rootNodes.push(entry);
        } else if (entry.parentId in lookup) {
            const p = lookup[entry.parentId];
            p.children.push(entry);
        }
    });
    return rootNodes;
}

export const getAllVisibleEntriesId = (entries: Entry[],collapsedNodes: number[]) => {
    const nodes = listToTree(entries);
    let visibleIds: number[] = [];
    let currentNode: TreeNode;
    while (nodes.length) {
        currentNode = nodes.pop()!;
        visibleIds.push(currentNode.id);
        if (currentNode.children && currentNode.children.length && !collapsedNodes.includes(currentNode.id)) {
            currentNode.children.forEach((child: TreeNode) => {
                nodes.push(child);
            })
        }
    }
    return visibleIds
}
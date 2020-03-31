import classNames from 'classnames';
import { Node, NodeId } from 'react-virtualized-tree';
import { Entry } from 'tsp-typescript-client/lib/models/entry';
import { isUndefined } from 'util';
import React = require('react');

/**
 * Convert the tree from the tsp server to a tree react-virtualized-tree can use to render
 * 
 * @param tree Default tree entry from the tsp server
 * @param defaultState Default state of the nodes
 */
export const treeEntryToNodeTree = (tree: Entry[], defaultState?: { [stateKey: string]: any }) => {
    let nodes: Node[] = [];
    let rootIds: NodeId[] = [];
    //Create a list of node without children
    tree.forEach(entry => {
        if (entry.parentId === -1) {
            rootIds.push(entry.id);
        }
        nodes.push({
            id: entry.id,
            name: entry.labels[0],
            state: defaultState,
        });
    });
    //Add the childrens
    nodes.forEach((node) => {
        let childs: Node[] = [];
        //Assign children to every node
        tree.forEach(childrenEntry => {
            if (childrenEntry.parentId === node.id) {
                let childrenNode = nodes.find(({ id }) => id === childrenEntry.id)
                if (!isUndefined(childrenNode)) {
                    childs.push(childrenNode);
                }
            }
        });
        node.children = childs;
    });
    //Only return root element
    const isRoot = ({ id }: Node) => rootIds.includes(id);
    const rootNodes = nodes.filter(isRoot)
    if (rootNodes.length === 1) {
        return rootNodes[0].children as Node[];
    }
    else if (rootNodes.length) {
        return rootNodes;
    }
    return nodes; //If there is no root element
}

const isExpanded = (node: Node) => node.state ? node.state.expanded : false;

export const getExpandedTree = (nodes: Node[]) => {
    // filter the nodes to only the expanded ones
    return nodes.map(node => {
        // if expanded get children then recall this function
        let newNode = Object.assign({}, node); // Deep copy
        if (isExpanded(newNode)) {
            if (newNode.children) {
                newNode.children = getExpandedTree(newNode.children);
            }
        } else {
            newNode.children = [];
        }
        return newNode;
    });
}

export const getFlatTree = (nodes: Node[]) => {
    let flatTree: Node[] = [];
    nodes.forEach((node) => {
        flatTree.push(node);
        if(node.children){
            flatTree.push(...getFlatTree(node.children));
        }
    });
    return flatTree;
}

export const SELECT = 3;

export const Selection = ({ node, children, onChange, onClick }: any) => {
    const { state: { selected } } = node;
    const className = classNames({
        'fa fa-check-square': selected,
        'fa fa-square': !selected,
    });
    const updateChildrens = () => {
        onChange({
            node: {
                ...node,
                state: {
                    ...(node.state || {}),
                    selected: !selected,
                },
            },
            type: SELECT,
        },
        )
        onClick(node.id)
    }

    return (
        <span>
            <i
                className={className}
                onClick={updateChildrens}
            />
            {children}
        </span>
    );
};
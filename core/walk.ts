import type { Node } from "acorn"
import { WalkOptions, Functional } from './type'


export function walk(node: Node, { enter, leave }: WalkOptions) {
  visit(node, null, enter, leave)
}


function visit(node: Node, parent: null | Node, enter: Functional, leave: Functional) {
  if (enter) {
    enter(node, parent)
  }
  // 遍历子节点
  const childKeys = Object.keys(node).filter(key => typeof node[key] === 'object')
  childKeys.forEach(key => {
    const value = node[key]
    if (Array.isArray(value)) {
      value.forEach((childNode) => visit(childNode, node, enter, leave))
    } else if (value && value.type) {
      visit(node[key], node, enter, leave)
    }
  })
  // 执行离开
  if (leave) {
    leave(node, parent)
  }
}

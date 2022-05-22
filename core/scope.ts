type Options = {
  name?: string,
  parent?: Scope
  params?: string[]
}
export class Scope {
  name: string
  parent: null | Scope
  params: string[]
  constructor(options: Options = {}) {
    this.name = options.name
    this.parent = options.parent
    this.params = options.params || []
  }
  add(name) {
    this.params.push(name)
  }
  findDefiningScope(name) {
    if (this.params.includes(name)) {
      return this
    }
    if (this.parent) {
      return this.parent.findDefiningScope(name)
    }

    return null
  }
}


// let globalThis = new Scope({
//   name: 'globalThis',
//   parent: null,
// })
// globalThis.add('name')
// let aScoped = new Scope({
//   name: 'aScoped',
//   parent: globalThis,
// })
// let findXX = aScoped.findDefiningScope('xx')
// let findName = aScoped.findDefiningScope('name')
// console.log(findXX, findName)

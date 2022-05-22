import MagicString from "magic-string"
const { parse } = require('acorn')
import { analyze } from "./analyze"

function ownProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

export class Module {
  code: any
  path: string
  bundle: any
  ast: any
  imports: any
  exports: any
  definitions: any
  constructor({ code, path, bundle }) {
    this.code = new MagicString(code, { filename: path })
    this.path = path
    this.bundle = bundle
    this.ast = parse(code, { ecmaVersion: 'latest', sourceType: "module" })
    this.analyze()
  }
  analyze() {
    this.imports = {}
    this.exports = {}
    this.ast.body.forEach(statement => {
      if (statement.type === 'ImportDeclaration') {
        let source = statement.source.value
        let specifiers = statement.specifiers
        specifiers.forEach(specifier => {
          const name = specifier.imported.name
          const localName = specifier.local.name
          this.imports[localName] = {
            name, localName, source
          }
        })
      } else if (statement.type === 'ExportNamedDeclaration') {
        const { declaration } = statement
        if (declaration.type === 'VariableDeclaration') {
          const { name } = declaration.declarations[0].id
          this.exports[name] = { statement, localName: name, expression: declaration }
        } else if (declaration.type === 'FunctionDeclaration') {
          const name = declaration.id.name
          this.exports[name] = { statement, localName: name, expression: declaration }
        }
      }
    })
    analyze(this.ast, this.code, this)
    this.definitions = {} // 存放所有的全局变量的定义语句 
    this.ast.body.forEach(statement => {
      Object.keys(statement._defines).forEach(name => {
        this.definitions[name] = statement
      })
    })
  }
  expandAllStatements() {
    // 展开模块读取对应引入的变量的定义语句，并拷贝到当前模块中
    let allStatements = []
    this.ast.body.forEach(statement => {
      if (statement.type === 'ImportDeclaration') { // 因为将外部依赖已经引入 import 导入语句就不需要了
        return
      }
      let statements = this.expandStatement(statement)
      allStatements.push(...statements)
    })
    return allStatements
  }
  expandStatement(statement) {
    const result = []
    // tree-shaking 核心
    const dependencies = Object.keys(statement._dependsOn) // 拿到外部依赖
    dependencies.forEach(name => {
      // 找到定义外部依赖的申明节点
      // console.log(this, name)
      const definition = this.define(name)
      result.push(...definition)
    })
    if (!statement._included) {
      statement._included = true
      result.push(statement)
    }
    return result
  }
  define(name) {
    if (ownProperty(this.imports, name)) {
      // import导入的变量和定义的变量名称一致
      // imports : {name:"age",localName:"age",source:"./msg"}
      const importData = this.imports[name]
      // 获取msg模块
      const module = this.bundle.fetchModule(importData.source, this.path)

      // 找对应外部依赖module的export导出内容 exports是在new Module analyze收集export的内容
      const exportData = module.exports[importData.name]
      // 调用外部依赖msg中的define方法查找本地变量名,返回定义改变量的语句,递归为了防止改变量是外部依赖依赖另一个外部的变量
      return module.define(exportData.localName)
    } else {
      // 当前本地变量中的全局变量并且 _included是false,并未被引入过
      let statement = this.definitions[name]
      if (statement && !statement._included) {
        return this.expandStatement(statement)
      } else {
        return []
      }
    }
  }
}

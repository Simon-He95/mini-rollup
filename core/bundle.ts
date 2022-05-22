const MagicString = require('magic-string')
import fs from 'fs'
import { Module } from "./module"
import path from 'path'


export class Bundle {
  entryPath: string
  modules: Record<any, any>
  statements: any
  constructor(options) {
    this.entryPath = options.entry.replace(/\.js$/, '') + '.js'
    this.modules = {}
  }
  build(outputFileName) {
    let entryModule = this.fetchModule(this.entryPath)
    this.statements = entryModule.expandAllStatements()
    const { code } = this.generate()
    fs.writeFileSync(outputFileName, code, 'utf-8')
  }
  fetchModule(importee, importer?: string) {
    let route
    if (!importer) { // 如果没有模块导入
      route = importee
    } else {
      if (path.isAbsolute(importee)) {
        route = importee
      } else if (importee[0] === '.') {
        route = path.resolve(path.dirname(importer), importee.replace(/.js$/, '') + '.js')
      }
    }
    if (route) {
      const code = fs.readFileSync(route, 'utf-8')
      const module = new Module({ code, path: route, bundle: this })
      return module
    }
  }
  generate() {
    let magicString = new MagicString.Bundle()
    this.statements.forEach(statement => {
      const source = statement._source.clone()
      if (statement.type === 'ExportNamedDeclaration') {
        source.remove(statement.start, statement.declaration.start)
      }
      magicString.addSource({
        content: source,
        separator: '\n'
      })
    })
    return {
      code: magicString.toString()
    }
  }
}

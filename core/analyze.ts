import { Scope } from './scope'
import { walk } from './walk'

export function analyze(ast, magicString, module) {
  let scope = new Scope()
  ast.body.forEach(statement => {
    // 给作用域添加变量
    function addToScope(declaration) {
      const name = declaration.id.name
      scope.add(name)
      if (!scope.parent) {
        statement._defines[name] = true  // 添加到全局作用域
      }
    }
    console.log('222', statement, magicString)
    Object.defineProperties(statement, {
      _defines: { value: {} }, // 存放当前模块定义所有全局变量
      _dependsOn: { value: {} }, // 当前模块没有定义但使用到的外部变量
      _included: { value: false, writable: true }, // 是否已经引入不需要重复打包
      _source: { value: magicString.snip(statement.start, statement.end) }
    })
    // 构建作用域链
    walk(statement, {
      enter(node) {
        let newScope
        switch (node.type) {
          case 'FunctionDeclaration':
            const params = node.params.map(param => param.name)
            if (node.type === 'FunctionDeclaration')
              addToScope(node)
            newScope = new Scope({ parent: scope, params })
            break
          case 'VariableDeclaration': // 并不会生成一个新的作用域
            node.declarations.forEach(addToScope)
            break
        }
        if (newScope) { // 当前节点申明了新的作用域
          Object.defineProperty(node, '_scope', { value: newScope })
          // 存在函数嵌套可能，所以需要把作用域指向新作用域
          scope = newScope
        }
      },
      leave(node) {
        if (node._scope) {
          // 如果离开的是一个作用域节点，需要把当前作用域指向父作用域
          scope = scope.parent
        }
      }
    })
  })

  ast._scope = scope
  // 找出外部依赖
  ast.body.forEach(statement => {
    walk(statement, {
      enter(node) {
        if (node._scope) {
          scope = node._scope
        }
        if (scope && node.type === 'Identifier') {
          // 当前作用域递归往上找这个变量
          const definingScope = scope.findDefiningScope(node.name)
          // 如果找不到从外部依赖去找
          if (!definingScope) {
            // 这是一个外部依赖的变量
            statement._dependsOn[node.name] = true
          }
        }
      },
      leave(node) {
        if (node._scope) {
          scope = node.parent
        }
      }
    })
  })

}

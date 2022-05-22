# Mini Rollup

## 思路分析
- 根据entry主入口处理绝对路径,获取文件code,并解析成ast
- 遍历ast收集所有的import和export(存放的是变量和code)
- 如果在当前模块域中找不到对应变量的申明,会从import中寻找对应变量的定义,找到根据from的source读取外部依赖文件,解析他的export
- 解析时会当前文件code中截取对应模块的code放到_source上,解析找到对应变量的定义收集起来,完成tree-shaking
- 结合entry的code拼接成最终的bundlerCode

## tree shaking 原理
- 从入口模块查找所有使用的变量
- 找变量的依赖，是从哪里定义的，把定义语句打包进当前模块
- 无关代码就被排除了

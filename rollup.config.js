export default {
  input: './src/main.js',
  output: {
    file: './dist/bundle.js',
    format: 'cjs', // amd iife es6 umd cjs
    name: 'bundleName' // 如果是iife 或者 umd 就需要设置name挂载到window 
  }
}

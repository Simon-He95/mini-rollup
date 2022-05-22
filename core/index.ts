import { Bundle } from './bundle'
import config from '../rollup.config'
const { input, output } = config

function rollup(entry, outputFileName) {
  const bundle = new Bundle({ entry })
  bundle.build(outputFileName)
}

rollup(input, output.file)

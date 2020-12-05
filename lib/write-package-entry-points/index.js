import {promisify} from 'util'
import {promises as fs} from 'fs'
import path from 'path'
import enhancedResolve from 'enhanced-resolve'
import * as moduleLexer from 'cjs-module-lexer'

const resolve = promisify(
  enhancedResolve.create({
    mainFields: ['browser', 'module', 'main']
  })
)

let lexerInitialized = false
async function getExports(modulePath) {
  if (!lexerInitialized) {
    await moduleLexer.init()
    lexerInitialized = true
  }

  try {
    const exports = []
    const paths = []
    paths.push(await resolve(process.cwd(), modulePath))
    while (paths.length > 0) {
      const currentPath = paths.pop()
      const results = moduleLexer.parse(await fs.readFile(currentPath, 'utf8'))
      exports.push(...results.exports)
      for (const reexport of results.reexports) {
        paths.push(await resolve(path.dirname(currentPath), reexport))
      }
    }
    return `export { ${exports.join(', ')} } from '${modulePath}'`
  } catch (e) {
    return `export * from '${modulePath}'`
  }
}

export default async function(modulePaths, outDir) {
  await Promise.all(modulePaths.map(async modulePath => {
    await fs.mkdir(
      path.join(outDir, path.dirname(modulePath)),
      {recursive: true}
    )
    await fs.writeFile(
      `${outDir}/${modulePath}.js`,
      await getExports(modulePath)
    )
  }))

  return modulePaths.map(modulePath => `${outDir}/${modulePath}.js`)
}

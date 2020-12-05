import packageName from 'package-name-regex'
import esbuild from 'esbuild'
import babel from '@babel/core'
import getStream from 'get-stream'
import {scanDependencies, writePackageEntryPoints} from '../../lib/index.js'

export default async function(app) {
  const dependencies = await scanDependencies(`./apps/${app}/index.js`)
  const entryPoints = await writePackageEntryPoints(
    dependencies,
    `./apps/${app}/npm/.entries`
  )
  await esbuild.build({
    entryPoints,
    define: {
      'process.env.NODE_ENV': '"development"'
    },
    format: 'esm',
    sourcemap: 'inline',
    bundle: true,
    splitting: true,
    outdir: `./apps/${app}/npm/`
  })

  return (next) => async (request) => {
    const response = await next(request)

    if (response.status === 304) {
      return response
    } else if (request.url.startsWith('/npm/')) {
      return {
        ...response,
        headers: {
          ...response.headers,
          'cache-control': 'max-age=604800'
        }
      }
    } else if (request.url.endsWith('.js')) {
      const code = await getStream(response.body)

      const result = await babel.transformAsync(code, {
        sourceMaps: 'inline',
        plugins: [
          ['babel-plugin-module-resolver', {
            alias: {
              [packageName.toString().slice(1, -1)]: ([name]) =>
                `/npm/${name}.js`
            },
            loglevel: 'silent'
          }]
        ]
      })

      return {
        ...response,
        headers: {
          ...response.headers,
          'content-length': Buffer.from(result.code).length
        },
        body: result.code
      }
    } else {
      return response
    }
  }
}

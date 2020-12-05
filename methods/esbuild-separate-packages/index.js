import esbuild from 'esbuild'
import packageName from 'package-name-regex'
import {scanDependencies, writePackageEntryPoints} from '../../lib/index.js'

export default async function(app) {
  const dependencies = await scanDependencies(`./apps/${app}/index.js`)
  const entryPoints = await writePackageEntryPoints(
    dependencies,
    `./apps/${app}/npm/.entries`
  )

  const service = await esbuild.startService()
  process.on('exit', () => {
    service.stop()
  })

  await service.build({
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

  const plugin = {
    name: 'rewrite-imports',
    setup(build) {
      build.onResolve({filter: packageName}, args => ({
        path: `/npm/${args.path}.js`,
        external: true
      }))
    }
  }

  return (next) => async (request) => {
    if (request.url.startsWith('/npm/')) {
      const response = await next(request)
      if (response.status === 304) {
        return response
      } else {
        return {
          ...response,
          headers: {
            ...response.headers,
            'cache-control': 'max-age=604800'
          }
        }
      }
    } else if (request.url.endsWith('.js')) {
      const result = await service.build({
        entryPoints: [`./apps/${app}${request.url}`],
        define: {
          'process.env.NODE_ENV': '"development"'
        },
        format: 'esm',
        sourcemap: 'inline',
        bundle: true,
        write: false,
        plugins: [plugin]
      })

      return {
        status: 200,
        headers: {
          'content-type': 'application/javascript',
          'cache-control': 'no-store'
        },
        body: Buffer.from(result.outputFiles[0].contents)
      }
    } else {
      return next(request)
    }
  }
}

import esbuild from 'esbuild'

export default async function(appName) {
  const result = await esbuild.build({
    entryPoints: [`./apps/${appName}/index.js`],
    define: {
      'process.env.NODE_ENV': '"development"'
    },
    sourcemap: 'inline',
    bundle: true,
    write: false
  })

  const contents = Buffer.from(result.outputFiles[0].contents)
  const buildTime = new Date()

  return (next) => (request) => {
    if (request.url === '/index.js') {
      if (
        'if-modified-since' in request.headers
        && buildTime.getTime() <= Date.parse(request.headers['if-modified-since']) < buildTime
      ) {
        return {status: 304}
      } else {
        return {
          status: 200,
          headers: {
            'Content-Type': 'text/javascript',
            'Cache-Control': 'no-cache',
            'Last-Modified': buildTime.toUTCString()
          },
          body: contents
        }
      }
    } else {
      return next(request)
    }
  }
}

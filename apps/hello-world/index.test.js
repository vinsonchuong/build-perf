import test from 'ava'
import {startServer, stopServer, compose} from 'passing-notes'
import serveStatic from 'passing-notes-static'
import esbuild from 'esbuild'
import {openBrowser, closeBrowser, openTab, findElement} from 'puppet-strings'

test('a React app', async (t) => {
  const server = await startServer({port: 10001}, compose(
    (next) => async (request) => {
      if (request.url === '/index.js') {
        const {outputFiles: [{contents}]} = await esbuild.build({
          entryPoints: ['./apps/hello-world/index.js'],
          define: {
            'process.env.NODE_ENV': '"development"'
          },
          sourcemap: 'inline',
          bundle: true,
          write: false
        })
        return {
          status: 200,
          headers: {
            'Content-Type': 'text/javascript'
          },
          body: Buffer.from(contents)
        }
      } else {
        return next(request)
      }
    },
    serveStatic('./apps/hello-world/'),
    () => () => ({status: 404})
  ))
  t.teardown(async () => {
    await stopServer(server)
  })

  const browser = await openBrowser('chromium')
  t.teardown(async (t) => {
    await closeBrowser(browser)
  })

  const tab = await openTab(browser, 'http://localhost:10001/')
  await findElement(tab, '#app-container', 'Hello World!')
  t.pass()
})

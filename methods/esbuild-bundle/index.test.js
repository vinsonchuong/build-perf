import test from 'ava'
import {startServer, stopServer, compose} from 'passing-notes'
import serveStatic from 'passing-notes-static'
import {openBrowser, closeBrowser, openTab, navigate, findElement} from 'puppet-strings'
import {measure, getPageLoadTime} from '../../lib/index.js'
import build from './index.js'

test('bundling with esbuild', async (t) => {
  const [middleware, buildTime] = await measure(async () => {
    return await build('hello-world')
  })

  const server = await startServer({port: 10001}, compose(
    middleware,
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
  const firstLoadTime = await getPageLoadTime(tab)

  await navigate(tab, 'http://localhost:10001/')
  await findElement(tab, '#app-container', 'Hello World!')
  const secondLoadTime = await getPageLoadTime(tab)

  t.log(`Build: ${buildTime.toFixed(6)}ms`)
  t.log(`First Contentful Paint: ${firstLoadTime.toFixed(6)}ms`)
  t.log(`Cached First Contentful Paint: ${secondLoadTime.toFixed(6)}ms`)
  t.pass()
})

import {performance} from 'perf_hooks'

export default async function(fn) {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  return [result, end - start]
}

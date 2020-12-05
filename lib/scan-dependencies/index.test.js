import test from 'ava'
import scanDependencies from './index.js'

test('finding dependencies', async (t) => {
  t.deepEqual(
    await scanDependencies('./apps/hello-world/index.js'),
    ['react', 'react-dom']
  )

  t.deepEqual(
    await scanDependencies('./apps/big-dependency/index.js'),
    ['react', 'react-dom', 'react-three-fiber']
  )
})

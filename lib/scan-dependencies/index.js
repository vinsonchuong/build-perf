import * as acorn from 'acorn'
import * as walk from 'acorn-walk'
import path from 'path'
import {promises as fs} from 'fs'
import packageNameRegex from 'package-name-regex'

export default async function scanDependencies(entryPoint) {
  const code = await fs.readFile(entryPoint, 'utf8')
  const ast = acorn.parse(code, {ecmaVersion: 'latest', sourceType: 'module'})

  const externalDependencies = new Set()
  const internalDependencies = new Set()

  function addDependency(dependency) {
    if (dependency.match(packageNameRegex)) {
      externalDependencies.add(dependency)
    } else {
      internalDependencies.add(dependency)
    }
  }

  walk.simple(ast, {
    ImportDeclaration(node) {
      addDependency(node.source.value)
    },

    ImportExpression(node) {
      if (node.source.type === 'Literal') {
        addDependency(node.source.value)
      }
    },

    ExportNamedDeclaration(node) {
      addDependency(node.source.value)
    },

    ExportAllDeclaration(node) {
      addDependency(node.source.value)
    }
  })

  for (const file of internalDependencies) {
    const absolutePath = path.resolve(path.dirname(entryPoint), file)
    const moreExternalDependencies = await scanDependencies(absolutePath)

    for (const dependency of moreExternalDependencies) {
      externalDependencies.add(dependency)
    }
  }

  return Array.from(externalDependencies)
}

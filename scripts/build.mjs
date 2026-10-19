#!/usr/bin/env node
/**
 * Build dsh-find-anywhere without a compiler toolchain.
 *
 * The Host half and the Client bundle are hand-authored ES modules, so this
 * script only validates the Client entry (syntax + ModuleLoader contract) and
 * copies both files into lib/.  Keeping src/ and lib/ byte-identical makes the
 * injector's freshness check trustworthy and lets a checkout work offline.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'src')
const lib = join(root, 'lib')

const client = readFileSync(join(src, 'client', 'index.js'), 'utf8')
const host = readFileSync(join(src, 'index.js'), 'utf8')

if (!client.includes('__ModuleLoader__')) {
  throw new Error('src/client/index.js is not a ModuleLoader bundle')
}
if (!/inject\s*=\s*\[[^\]]*['"]slots['"]/.test(client)) {
  throw new Error("src/client/index.js must export inject with 'slots'")
}
if (!/register\(\{[\s\S]*?name:\s*['"][a-z][a-z0-9.]*['"]/.test(client)) {
  throw new Error('src/client/index.js must register a named slot occupant')
}

// Parse only; do not execute browser code in Node.
new Function(client)

mkdirSync(lib, { recursive: true })
writeFileSync(join(lib, 'client.js'), client, 'utf8')
copyFileSync(join(src, 'index.js'), join(lib, 'index.js'))
console.log('built lib/index.js and lib/client.js from src/')

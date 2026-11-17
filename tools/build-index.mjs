// Builds src/data/structures.json from the GLB JSON chunks (no Draco decoding needed):
// one entry per named mesh node with its system, side, material and world-space bounding box.
// Run: node tools/build-index.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'

const SYSTEMS = ['skeletal', 'muscular', 'joints', 'cardiovascular', 'nervous', 'visceral', 'lymphatic']
const out = []

for (const system of SYSTEMS) {
  const buf = readFileSync(new URL(`../public/models/${system}.glb`, import.meta.url))
  const len = buf.readUInt32LE(12)
  const gltf = JSON.parse(buf.subarray(20, 20 + len).toString('utf8'))
  const local = (n) => {
    if (n.matrix) return new Matrix4().fromArray(n.matrix)
    const t = new Vector3(...(n.translation ?? [0, 0, 0]))
    const r = new Quaternion(...(n.rotation ?? [0, 0, 0, 1]))
    const s = new Vector3(...(n.scale ?? [1, 1, 1]))
    return new Matrix4().compose(t, r, s)
  }
  const visit = (idx, parent) => {
    const node = gltf.nodes[idx]
    const world = parent.clone().multiply(local(node))
    if (node.mesh !== undefined && node.name) {
      const box = new Box3()
      let material = null
      for (const p of gltf.meshes[node.mesh].primitives) {
        const a = gltf.accessors[p.attributes.POSITION]
        box.union(new Box3(new Vector3(...a.min), new Vector3(...a.max)).applyMatrix4(world))
        if (material === null && p.material !== undefined) material = gltf.materials[p.material]?.name ?? null
      }
      const name = node.extras?.za_name ?? node.name
      const m = /^(.*)\.(l|r)$/i.exec(name)
      out.push({
        id: `${system}:${name}`,
        name,
        base: (m ? m[1] : name).replace(/\.+$/, ''),
        side: m ? (m[2].toLowerCase() === 'l' ? 'left' : 'right') : null,
        system,
        material,
        min: box.min.toArray().map((v) => +v.toFixed(4)),
        max: box.max.toArray().map((v) => +v.toFixed(4)),
      })
    }
    for (const c of node.children ?? []) visit(c, world)
  }
  for (const root of gltf.scenes[gltf.scene ?? 0].nodes) visit(root, new Matrix4())
}

mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true })
writeFileSync(new URL('../src/data/structures.json', import.meta.url), JSON.stringify(out))
const by = Object.fromEntries(SYSTEMS.map((s) => [s, out.filter((o) => o.system === s).length]))
console.log(`indexed ${out.length} structures`, by)

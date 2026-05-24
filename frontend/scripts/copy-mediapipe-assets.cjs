const fs = require('fs')
const path = require('path')

const sourceDir = path.dirname(require.resolve('@mediapipe/face_mesh/package.json'))
const targetDir = path.join(__dirname, '..', 'public', 'mediapipe')

const files = [
  'face_mesh.binarypb',
  'face_mesh_solution_packed_assets.data',
  'face_mesh_solution_packed_assets_loader.js',
  'face_mesh_solution_simd_wasm_bin.js',
  'face_mesh_solution_simd_wasm_bin.wasm',
  'face_mesh_solution_wasm_bin.js',
  'face_mesh_solution_wasm_bin.wasm',
]

fs.mkdirSync(targetDir, { recursive: true })

for (const file of files) {
  fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file))
}

console.log(`Copied ${files.length} MediaPipe assets to ${path.relative(process.cwd(), targetDir)}`)

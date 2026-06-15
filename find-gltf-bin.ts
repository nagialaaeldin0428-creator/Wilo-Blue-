import fs from 'fs';

function findGLTFBinaryExtension() {
  const content = fs.readFileSync('node_modules/three/examples/jsm/loaders/GLTFLoader.js', 'utf8');
  const lines = content.split('\n');
  console.log("=== Finding GLTFBinaryExtension inside GLTFLoader.js ===");
  lines.forEach((line, idx) => {
    if (line.includes('class GLTFBinaryExtension') || line.includes('function GLTFBinaryExtension')) {
      console.log(`${idx + 1}: ${line}`);
      for (let i = idx; i < idx + 40; i++) {
        console.log(`  ${i + 1}: ${lines[i]}`);
      }
    }
  });
}

findGLTFBinaryExtension();

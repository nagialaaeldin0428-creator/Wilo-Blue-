const fs = require('fs');

try {
  const buffer = fs.readFileSync('public/wilo_intro_boat.glb');
  
  // Read first chunk (JSON)
  const chunkLength = buffer.readUInt32LE(12);
  const chunkType = buffer.readUInt32LE(16);
  
  if (chunkType !== 0x4E4F534A) {
    console.error('First chunk is not JSON');
    process.exit(1);
  }
  
  const jsonBuffer = buffer.slice(20, 20 + chunkLength);
  const gltf = JSON.parse(jsonBuffer.toString('utf-8'));
  
  const nodes = gltf.nodes || [];
  
  function printNode(nodeIdx, indent = '') {
    const node = nodes[nodeIdx];
    if (!node) return;
    
    let info = `${indent}- Node ${nodeIdx}: "${node.name || 'unnamed'}"`;
    if (node.mesh !== undefined) {
      info += ` (Mesh: ${node.mesh})`;
    }
    if (node.translation) {
      info += ` [Pos: ${node.translation.map(n => n.toFixed(2)).join(',')}]`;
    }
    console.log(info);
    
    if (node.children) {
      node.children.forEach(childIdx => {
        printNode(childIdx, indent + '  ');
      });
    }
  }
  
  const scenes = gltf.scenes || [];
  scenes.forEach((scene, i) => {
    console.log(`Scene ${i}: "${scene.name || 'unnamed'}"`);
    if (scene.nodes) {
      scene.nodes.forEach(nodeIdx => {
        printNode(nodeIdx, '  ');
      });
    }
  });
  
} catch (e) {
  console.error('Error parsing GLB:', e);
}

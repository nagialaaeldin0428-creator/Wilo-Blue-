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
  
  const accessors = gltf.accessors || [];
  const meshes = gltf.meshes || [];
  const nodes = gltf.nodes || [];
  
  console.log('Meshes in GLB:');
  meshes.forEach((mesh, index) => {
    console.log(`\nMesh ${index}: "${mesh.name || 'unnamed'}"`);
    mesh.primitives.forEach((prim, pIndex) => {
      const materialIdx = prim.material;
      const material = gltf.materials ? gltf.materials[materialIdx] : null;
      const matName = material ? material.name : 'none';
      
      let boundingBoxInfo = '';
      if (prim.attributes && prim.attributes.POSITION !== undefined) {
        const accessorIdx = prim.attributes.POSITION;
        const acc = accessors[accessorIdx];
        if (acc && acc.min && acc.max) {
          boundingBoxInfo = `Min: [${acc.min.map(n => n.toFixed(3)).join(',')}], Max: [${acc.max.map(n => n.toFixed(3)).join(',')}]`;
        }
      }
      console.log(`  - Primitive ${pIndex}: Material index ${materialIdx} ("${matName}"), Bounding Box: ${boundingBoxInfo}`);
    });
  });
  
} catch (e) {
  console.error('Error parsing GLB:', e);
}

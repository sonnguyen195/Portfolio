# Ultra-Level 3D Scene Optimization Guide

Game-engine style optimizations for the lab portfolio scene.

## Implemented

### Phase 2: BVH Raycast Acceleration
- **three-mesh-bvh** extends `BufferGeometry` and `Mesh` for accelerated raycasting
- Applied to all meshes in Lab.glb after load
- Raycasting now targets only interactive objects (screens + sections) instead of full scene

### Phase 3: Frustum Culling
- `ensureFrustumCulling()` enables culling on all meshes except background/sky
- Three.js enables frustum culling by default; explicit for excluded names

### Phase 5: GPU Render Scale Adaptation
- **PerformanceMonitor** + **AdaptiveDpr** from drei
- When FPS drops below 50–60, DPR scales down automatically
- `pixelated` mode for crisp fallback at low resolution

### Phase 8: Postprocessing Limitation
- Bloom + Vignette only (Noise removed)
- `resolutionScale={0.65}`, Bloom `height={300}`

### Phase 9: Memory Cleanup
- `disposeSceneBVH()` on unmount (BVH trees only; geometry/materials cached by useGLTF)

## Requires Build-Time or GLB Changes

### Phase 1: Geometry Instancing
Repeated meshes (pipes, racks, panels) must be identified in the GLB. Options:
- Export repeated parts as separate GLBs and use `<Instances>` from drei
- Use gltf-transform to analyze and merge repeated geometry
- Blender: use Array modifier + export as instanced

### Phase 4: LOD System
Requires multiple model versions:
- `Lab-high.glb` (full detail)
- `Lab-med.glb` (simplified)
- `Lab-low.glb` (proxy/billboard)

Use `THREE.LOD` and switch based on camera distance.

### Phase 6: Scene Partitioning
Zone-based loading:
- Define zones: reactor, server, console, door, table
- Load zones progressively when camera approaches
- Requires splitting Lab.glb into zone-specific GLBs or runtime grouping by bounds

### Phase 7: Static Object Merging
Merge non-interactive meshes into fewer draw calls:
- Use `BufferGeometryUtils.mergeBufferGeometries()` or similar
- Requires identifying static vs interactive at export time
- gltf-transform `merge` or Blender join + export

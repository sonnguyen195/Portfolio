# GLB Model Optimization

To reduce load time and GPU memory, optimize your GLB before deployment.

## Prerequisites

```bash
npm install -D @gltf-transform/cli
```

## Commands

### 1. DRACO compression (geometry)

```bash
npx gltf-transform compress public/models/Lab.glb public/models/Lab-optimized.glb --compression draco
```

Then update `LAB_MODEL_PATH` in `LabModel.tsx` to `/models/Lab-optimized.glb`.

### 2. Resize textures (max 2048px)

```bash
npx gltf-transform resize public/models/Lab.glb public/models/Lab-resized.glb 2048 2048
```

### 3. Full optimization (DRACO + texture resize + mesh optimization)

```bash
npx gltf-transform optimize public/models/Lab.glb public/models/Lab-optimized.glb \
  --compress draco \
  --texture-size 2048
```

Replace `Lab.glb` with `Lab-optimized.glb` in your code after running.

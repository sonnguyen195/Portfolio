# Demo Modules Architecture

Isolated cinematic demo modules for SOC and GuardianX. **Do NOT modify the Ironman Lab scene.**

## Structure

```
src/demos/
├── index.ts              # Lazy load exports
├── soc/
│   ├── index.tsx         # Entry
│   ├── SocDemo.tsx       # Root component
│   ├── scene/            # Isolated 3D scene
│   ├── components/       # UI components
│   ├── animations/       # Animation sequences
│   ├── hooks/            # State hooks
│   └── data/             # Mock data
└── guardianx/
    ├── index.tsx
    ├── GuardianXDemo.tsx
    ├── scene/
    ├── components/
    ├── animations/
    ├── hooks/
    └── data/
```

## Usage

```tsx
import { Suspense } from 'react'
import { SocDemoLazy, GuardianXDemoLazy } from './demos'

// Lazy load
<Suspense fallback={<div>Loading...</div>}>
  <SocDemoLazy onExit={() => {}} />
</Suspense>
```

## Integration

- Demos mount in their own container, not inside LabScene
- Each demo has its own Canvas/scene — no shared Lab scene modification
- Demos are lazily loaded via `React.lazy()`

## Demo Flows

### SOC
1. Cyber Attack Detected → Incident Creation
2. Incident Triage → Stage Progression → Close
3. Threat Mitigation → IP Blocking

### GuardianX
1. Survey Mission Creation → Approval → Activation
2. Drone Deployment → In-Transit → Arrival
3. Surveillance Profile Execution → Flight → Video Analysis

/**
 * Recursively renders the lab scene. Panel hiển thị cố định giữa màn hình (FocusedObjectPanel).
 */
import { memo, useMemo, useRef, useLayoutEffect } from 'react'
import * as THREE from 'three'
import { useLabSceneOptional } from './LabSceneContext'

function ObjectRenderer({ object }: { object: THREE.Object3D }) {
  const isWrapper =
    (object as THREE.Object3D & { userData?: { isInteractiveWrapper?: boolean } }).userData
      ?.isInteractiveWrapper === true

  if (isWrapper) {
    return (
      <primitive object={object}>
        {(object as THREE.Object3D).children.map((child) => (
          <ObjectRenderer key={child.uuid} object={child} />
        ))}
      </primitive>
    )
  }

  return (
    <primitive object={object}>
      {(object as THREE.Object3D).children.map((child) => (
        <ObjectRenderer key={child.uuid} object={child} />
      ))}
    </primitive>
  )
}

function SceneWithPanelsInner({ scene }: { scene: THREE.Object3D }) {
  const ctx = useLabSceneOptional()
  const groupRef = useRef<THREE.Group>(null)
  const children = useMemo(() => [...scene.children], [scene])

  useLayoutEffect(() => {
    if (!ctx || !groupRef.current) return
    ctx.sceneRef.current = groupRef.current
    return () => {
      ctx.sceneRef.current = null
    }
  }, [ctx])

  return (
    <group ref={groupRef}>
      {children.map((child) => (
        <ObjectRenderer key={child.uuid} object={child} />
      ))}
    </group>
  )
}

export const SceneWithPanels = memo(SceneWithPanelsInner)

import { memo, useMemo } from 'react'
import { Line } from '@react-three/drei'
import { useLabScene } from './LabSceneContext'
import { getFloorLineForHover } from './interactionMap'

const ORIGIN: [number, number, number] = [0, 0.02, 0.2]
const CYAN = '#00e5ff'

function NavigationPathInner() {
  const { hoveredObjectId } = useLabScene()
  const floorEnd = getFloorLineForHover(hoveredObjectId)

  const points = useMemo((): [number, number, number][] => {
    if (!floorEnd) return []
    const end: [number, number, number] = [floorEnd[0], 0.02, floorEnd[2]]
    return [ORIGIN, end]
  }, [floorEnd])

  if (points.length < 2) return null

  return (
    <Line
      points={points}
      color={CYAN}
      lineWidth={1.2}
    />
  )
}

export const NavigationPath = memo(NavigationPathInner)

import { useEffect, useState } from 'react'

export type DeviceSize = 'mobile' | 'tablet' | 'desktop'

function detect(): DeviceSize {
  if (typeof window === 'undefined') return 'desktop'
  const w = window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1100) return 'tablet'
  return 'desktop'
}

export function useDeviceSize(): DeviceSize {
  const [size, setSize] = useState<DeviceSize>(detect())
  useEffect(() => {
    const onResize = () => setSize(detect())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

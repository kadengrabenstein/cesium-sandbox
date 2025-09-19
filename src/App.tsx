import { useEffect, useRef } from 'react'
import './App.css'
import { Viewer } from 'cesium'
import { enableZoomBox } from './zoomBox'

export default function App() {

  const cesiumContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cesiumContainerRef.current) return

const viewer = new Viewer(cesiumContainerRef.current, {});
viewer.scene.requestRenderMode = true;

const zoomBox = enableZoomBox(viewer);

    // Clean up on unmount
    return () => {
      zoomBox.destroy()
      viewer.destroy()
    }
  }, [])

  return <div ref={cesiumContainerRef} style={{ width: "100vw", height: "100vh" }} />
}

import { Suspense, lazy, Component, ReactNode } from 'react'

const Spline = lazy(() => import('@splinetool/react-spline'))

// Silent error boundary — if Spline fails to load, render nothing
class SplineErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  // Ne rien rendre si l'URL n'est pas configurée
  if (!scene || scene === 'YOUR_SCENE_URL' || !scene.startsWith('http')) return null

  return (
    <SplineErrorBoundary>
      <Suspense fallback={null}>
        <Spline scene={scene} className={className} />
      </Suspense>
    </SplineErrorBoundary>
  )
}

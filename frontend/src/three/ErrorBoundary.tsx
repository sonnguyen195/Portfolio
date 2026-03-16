import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode; fallback?: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn('Scene model load error:', error?.message, info?.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) return this.props.fallback ?? null
    return this.props.children
  }
}

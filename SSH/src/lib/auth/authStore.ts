import { User } from '@/types'
interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
}
// Simple state management without external dependencies
class AuthStateManager {
  private state: AuthState = {
    user: null,
    loading: true,
    initialized: false,
  }
  private listeners: Set<() => void> = new Set()
  getState(): AuthState {
    return { ...this.state }
  }
  setState(updates: Partial<AuthState>) {
    this.state = { ...this.state, ...updates }
    this.notifyListeners()
  }
  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  private notifyListeners() {
    this.listeners.forEach((listener) => listener())
  }
  // Auth actions
  setUser(user: User | null) {
    this.setState({ user })
  }
  setLoading(loading: boolean) {
    this.setState({ loading })
  }
  setInitialized(initialized: boolean) {
    this.setState({ initialized })
  }
  clearAuth() {
    this.setState({ user: null, loading: false })
  }
}
export const authStore = new AuthStateManager()

import { createContext, useContext, JSX } from 'solid-js'
import { createToaster } from '@ark-ui/solid/toast'

const ToasterContext = createContext<ReturnType<typeof createToaster>>()

export function ToasterProvider(props: { children: JSX.Element }) {
  const toaster = createToaster({
    placement: 'bottom-end',
    overlap: true,
    gap: 24,
  })

  return <ToasterContext.Provider value={toaster}>{props.children}</ToasterContext.Provider>
}

export function useToaster() {
  const context = useContext(ToasterContext)
  if (!context) {
    throw new Error('useToaster must be used within a ToasterProvider')
  }
  return context
}

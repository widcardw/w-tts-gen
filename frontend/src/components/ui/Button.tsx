import { Component, JSXElement, mergeProps } from 'solid-js'
import clsx from 'clsx'

const VariantClasses = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'bg-transparent hover:bg-primary hover:bg-opacity-10 hover:text-primary-foreground',
}

const SizeClasses = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3 text-xs',
  lg: 'h-11 px-8',
  icon: 'size-10',
}

const Button: Component<{
  disabled?: boolean
  variant?: 'default' | 'secondary' | 'destructive' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  onClick?: (args: unknown) => unknown
  children?: JSXElement
}> = (props) => {
  const p = mergeProps(
    {
      variant: 'default',
      onClick: () => {},
      children: '',
      disabled: false,
      size: 'default',
    },
    props,
  )
  const commonClass =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0'

  return (
    <button
      disabled={p.disabled}
      class={clsx(commonClass, VariantClasses[p.variant], SizeClasses[p.size], 'font-sans')}
      onClick={p.onClick}
    >
      {p.children}
    </button>
  )
}

export { Button }

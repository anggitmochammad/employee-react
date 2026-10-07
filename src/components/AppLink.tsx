import type { AnchorHTMLAttributes, MouseEvent } from 'react'

export type NavigateHandler = (event: MouseEvent<HTMLAnchorElement>, to: string) => void

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string
  onNavigate: NavigateHandler
}

export function AppLink({ to, onNavigate, ...props }: AppLinkProps) {
  return <a href={to} onClick={(event) => onNavigate(event, to)} {...props} />
}

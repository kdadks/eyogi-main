import { Link as RouterLink, LinkProps } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
interface ScrollLinkProps extends Omit<LinkProps, 'to'> {
  to: string
  children: React.ReactNode
}
export default function ScrollLink({ to, children, onClick, ...props }: ScrollLinkProps) {
  const navigate = useNavigate()
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    // First scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    // Then navigate
    navigate(to)
    // Force scroll to top after navigation with multiple methods
    setTimeout(() => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }, 0)
    // Call original onClick if provided
    if (onClick) {
      onClick(e)
    }
  }
  return (
    <RouterLink to={to} onClick={handleClick} {...props}>
      {children}
    </RouterLink>
  )
}

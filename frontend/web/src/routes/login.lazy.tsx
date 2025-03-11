import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/auth')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/auth"!</div>
}

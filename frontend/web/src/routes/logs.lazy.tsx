import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/logs')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/logs"!</div>
}

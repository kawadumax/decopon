import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/profiles')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/profiles"!</div>
}

import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/tags')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/tags"!</div>
}

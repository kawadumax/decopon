import { createLazyFileRoute } from '@tanstack/react-router';
import Welcome from '@/pages/Welcome';

export const Route = createLazyFileRoute('/')({
	component: () => <Welcome auth={"aaa"}/>,
});

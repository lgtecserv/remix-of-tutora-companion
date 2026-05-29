import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/cursos')({
  beforeLoad: () => {
    throw redirect({
      to: '/',
      hash: 'cursos',
    });
  },
});

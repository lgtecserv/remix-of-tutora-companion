import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/como-funciona')({
  beforeLoad: () => {
    throw redirect({
      to: '/',
      hash: 'como-funciona',
    });
  },
});

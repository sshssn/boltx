import dynamic from 'next/dynamic';

const ResetPasswordClient = dynamic(() => import('./ResetPasswordClient'), {
  ssr: false,
});

export default function Page() {
  return <ResetPasswordClient />;
}

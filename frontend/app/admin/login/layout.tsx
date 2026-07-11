import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login',
  description: 'Log in to the LiPy administrator panel.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

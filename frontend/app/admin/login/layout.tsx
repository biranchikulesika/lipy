import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login - LiPy',
  description: 'Log in to LiPy Admin to manage OCR configurations, check dataset metrics, and supervise evaluations.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

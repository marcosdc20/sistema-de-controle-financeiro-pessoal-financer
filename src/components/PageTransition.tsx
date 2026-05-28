import { ReactNode } from 'react';

export default function PageTransition({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

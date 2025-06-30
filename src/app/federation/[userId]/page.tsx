
import { getPassport } from '@/services/passport-service';
import { federationConfig } from '@/config';
import { notFound } from 'next/navigation';
import { AmbassadorClientPage } from './client-page';
import { Logo } from '@/components/logo';

interface PublicFederationPageProps {
  params: {
    userId: string;
  };
}

// Revalidate this page on-demand or every so often to get fresh data
export const revalidate = 60; // Revalidate every 60 seconds

export default async function PublicFederationPage({ params }: PublicFederationPageProps) {
  const { userId } = params;
  const passport = await getPassport(userId);

  if (!passport) {
    notFound();
  }

  return (
    <>
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between p-4">
                <Logo />
            </div>
        </header>
        <AmbassadorClientPage
            userId={userId}
            passport={passport}
            federationName={federationConfig.federationName}
        />
    </>
  );
}

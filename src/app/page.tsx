'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, FileText } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { useAuth } from '@/contexts/auth-context';
import { UserProfileButton } from '@/components/user-profile-button';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="flex flex-col items-center p-6 text-center bg-card rounded-xl shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
    <div className="p-4 bg-primary/10 rounded-full mb-4">{icon}</div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
          </Link>

          <nav className="flex items-center space-x-2">
            {user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <UserProfileButton />
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="py-20 md:py-28">
          <div className="container text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl font-headline">
                Streamline Your Business Documents
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                From purchase orders to payment vouchers, DocuPro is your all-in-one tool to create, manage, and track essential business paperwork effortlessly.
              </p>
              <div className="mt-10 flex justify-center gap-x-4">
                <Button size="lg" asChild>
                  <Link href={user ? '/dashboard' : '/signup'}>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-20 bg-secondary/30">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
                Features Built for Efficiency
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to professionalize your document workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: 'Purchase Orders',
                  description:
                    'Generate professional POs with automated numbering, tax calculations, and signatory selections.',
                },
                {
                  title: 'Payment Vouchers',
                  description:
                    'Create detailed payment vouchers with amount-to-words conversion and bank details.',
                },
                {
                  title: 'Sales Invoices',
                  description:
                    'Issue client invoices with VAT calculations and clear payment instructions.',
                },
                {
                  title: 'Payment Receipts',
                  description:
                    'Manage and track client payments with automated receipt generation.',
                },
                {
                  title: 'Vendor Invoices',
                  description:
                    'Onboard vendors and generate invoices from customizable templates.',
                },
                {
                  title: 'Centralized Profile',
                  description:
                    'Manage company info, bank accounts, and signatories in one place for consistency.',
                },
              ].map((f) => (
                <FeatureCard
                  key={f.title}
                  icon={<FileText className="h-8 w-8 text-primary" />}
                  title={f.title}
                  description={f.description}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} DocuPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

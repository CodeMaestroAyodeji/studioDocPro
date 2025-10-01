
'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, FileText } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { useAuth } from '@/contexts/auth-context';
import { UserProfileButton } from '@/components/user-profile-button';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="flex flex-col items-center p-6 text-center bg-card rounded-lg shadow-md transition-shadow hover:shadow-lg">
    <div className="p-4 bg-primary/10 rounded-full mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);


export default function LandingPage() {
    const { user } = useAuth();
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Logo />
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center">
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
                        <Link href="/signup">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32">
          <div className="container text-center">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl font-headline">
                    Streamline Your Business Documents
                </h1>
                <p className="mt-6 text-lg leading-8 text-muted-foreground">
                    From purchase orders to payment vouchers, DocuPro is the all-in-one solution to create, manage, and track your essential business paperwork with professional polish and unparalleled ease.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                    <Button size="lg" asChild>
                        <Link href={user ? "/dashboard" : "/signup"}>
                        Get Started for Free
                        <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
            <div className="mt-16 flow-root sm:mt-24">
              <div className="relative -m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                <Image
                  src="https://picsum.photos/seed/dashboard/1200/600"
                  alt="App screenshot"
                  width={2432}
                  height={1442}
                  className="rounded-md shadow-2xl ring-1 ring-gray-900/10"
                  data-ai-hint="app dashboard"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-secondary">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Features Built for Efficiency</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to professionalize your document workflow.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
              <FeatureCard 
                icon={<FileText className="h-8 w-8 text-primary" />}
                title="Purchase Orders"
                description="Generate professional POs with automated numbering, tax calculations, and signatory selections."
              />
              <FeatureCard 
                icon={<FileText className="h-8 w-8 text-primary" />}
                title="Payment Vouchers"
                description="Create detailed payment vouchers with automatic amount-to-words conversion and bank details."
              />
              <FeatureCard 
                icon={<FileText className="h-8 w-8 text-primary" />}
                title="Sales Invoices"
                description="Issue client invoices with VAT calculations, custom notes, and clear payment instructions."
              />
               <FeatureCard 
                icon={<FileText className="h-8 w-8 text-primary" />}
                title="Payment Receipts"
                description="Generate and manage payment receipts for tracking client payments against invoices."
              />
               <FeatureCard 
                icon={<FileText className="h-8 w-8 text-primary" />}
                title="Vendor Invoices"
                description="Onboard vendors and generate professional invoices on their behalf from multiple templates."
              />
              <FeatureCard 
                icon={<FileText className="h-8 w-8 text-primary" />}
                title="Centralized Profile"
                description="Manage your company info, bank accounts, and signatories in one place for consistency."
              />
            </div>
          </div>
        </section>
      </main>

       {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} DocuPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

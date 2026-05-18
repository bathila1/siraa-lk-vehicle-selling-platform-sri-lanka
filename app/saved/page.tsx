import type { Metadata } from 'next';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { SavedListClient } from '@/components/vehicle/SavedListClient';

export const metadata: Metadata = { title: 'Saved Vehicles' };

export default function SavedPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <SavedListClient />
      </main>
      <Footer />
    </>
  );
}
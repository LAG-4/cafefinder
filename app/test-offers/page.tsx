'use client';

import { OffersTab } from '@/components/offers/OffersTab';

export default function TestOffersPage() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">🎁 Test Offers Feature</h1>
      <p className="text-gray-600 mb-6">Testing the offers aggregation for Hard Rock Cafe</p>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <OffersTab slug="hard-rock-cafe" />
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function OffersAdminPage() {
  const [placeSlug, setPlaceSlug] = useState('');
  const [zomatoUrl, setZomatoUrl] = useState('');
  const [testResult, setTestResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testOffers = async () => {
    if (!placeSlug) {
      setTestResult('Please enter a place slug');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/offers/${placeSlug}`);
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addMapping = async () => {
    if (!placeSlug || !zomatoUrl) {
      setTestResult('Please enter both place slug and Zomato URL');
      return;
    }

    // For now, just show what the mapping would look like
    const mapping = {
      placeSlug,
      platform: 'zomato',
      url: zomatoUrl,
      lastVerifiedAt: new Date().toISOString().split('T')[0],
      confidence: 1.0
    };

    setTestResult(`Add this to mappings.json:\n${JSON.stringify(mapping, null, 2)}`);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🎁 Offers Admin Tool</h1>
      
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Existing Offers</h2>
          <div className="space-y-3">
            <Input
              placeholder="Enter place slug (e.g., hard-rock-cafe)"
              value={placeSlug}
              onChange={(e) => setPlaceSlug(e.target.value)}
            />
            <Button onClick={testOffers} disabled={isLoading}>
              {isLoading ? 'Testing...' : 'Test Offers'}
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Mapping</h2>
          <div className="space-y-3">
            <Input
              placeholder="Place slug (e.g., social)"
              value={placeSlug}
              onChange={(e) => setPlaceSlug(e.target.value)}
            />
            <Input
              placeholder="Zomato URL (e.g., https://www.zomato.com/hyderabad/restaurant-name/info)"
              value={zomatoUrl}
              onChange={(e) => setZomatoUrl(e.target.value)}
            />
            <Button onClick={addMapping}>
              Generate Mapping JSON
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>How to find Zomato URLs:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to Zomato.com and search for the restaurant</li>
              <li>Copy the URL from the restaurant page</li>
              <li>Add &quot;/info&quot; at the end for better offer detection</li>
            </ol>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Current Restaurant Slugs</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Available restaurants (use these slugs):</strong></p>
            <ul className="list-disc list-inside text-xs">
              <li>hard-rock-cafe</li>
              <li>social</li>
              <li>one8-commune-virat-kohli</li>
              <li>mob-ministry-of-beer</li>
              <li>aqua</li>
              <li>starbucks-coffee</li>
              <li>paradise</li>
              <li>mcdonalds</li>
              <li>kfc</li>
            </ul>
          </div>
        </div>

        {testResult && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="text-sm overflow-x-auto whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
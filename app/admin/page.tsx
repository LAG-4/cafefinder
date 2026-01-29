'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  RefreshCw, 
  Settings, 
  BarChart3,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

// Dynamically import AdminProtected with SSR disabled to avoid build-time Convex issues
const AdminProtected = dynamic(() => import('@/components/AdminProtected'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading admin area...</div>
});

export default function AdminPage() {
  return (
    <AdminProtected 
      title="Admin Dashboard" 
      description="Manage your restaurant offers and scraping system"
    >

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Offers Management */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              All Offers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              View and manage all scraped offers from restaurants
            </p>
            <Link href="/admin/offers">
              <Button className="w-full">
                View All Offers
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Scraping Controls */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="w-5 h-5 mr-2" />
              Scraping Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Manually trigger scraping or view scraping status
            </p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  fetch('/api/scraping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'scrape-batch', batchSize: 5 })
                  }).then(r => r.json()).then(data => {
                    alert(data.message || 'Scraping started');
                  });
                }}
              >
                Run Batch Scraping
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  fetch('/api/scraping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'initialize' })
                  }).then(r => r.json()).then(data => {
                    alert(data.message || 'Initialization completed');
                  });
                }}
              >
                Initialize Scraping
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Quick access to common administrative tasks
            </p>
            <div className="space-y-2">
              <Link href="/admin/offers">
                <Button variant="outline" className="w-full">
                  View Offers Dashboard
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open('/api/offers', '_blank')}
              >
                View API Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Scraping System</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Automatically scrapes Zomato offers every hour</li>
                <li>• Uses restaurant URLs from the CSV file</li>
                <li>• Detects bank offers, pre-booking deals, and more</li>
                <li>• Tracks offer expiry and status</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Manual Commands</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code>npm run scraper:init</code> - Initialize from CSV</li>
                <li>• <code>npm run scraper:batch</code> - Run one-time batch</li>
                <li>• <code>npm run scraper:start</code> - Start continuous scraping</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminProtected>
  );
}
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin - Cafefinder',
  description: 'Admin dashboard for managing offers and data',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Cafefinder Admin
              </h1>
              <p className="text-sm text-gray-600">
                Manage your restaurant offers and data
              </p>
            </div>
            <nav className="flex items-center space-x-4">
              <a 
                href="/" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Site
              </a>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
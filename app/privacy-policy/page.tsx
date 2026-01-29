export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl mb-8">
        Privacy Policy
      </h1>
      
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">1. Introduction</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Welcome to CafeHopper (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We respect your privacy and are committed to protecting your personal data. 
            This privacy policy allows you to know what information we collect, how we use it, and your rights regarding your personal data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">2. Information We Collect</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            We may collect the following types of information:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>
              <strong>Usage Data:</strong> Information about how you use our website, such as finding cafes, filtering options, and time spent on pages.
            </li>
            <li>
              <strong>Device Information:</strong> Information about the device you use to access our service, such as IP address, browser type, and operating system.
            </li>
            <li>
              <strong>Cookies:</strong> We use cookies to enhance your browsing experience and analyze site traffic.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">3. How We Use Your Information</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            We use the collected information to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>Provide and maintain our service</li>
            <li>Improve and personalize your experience</li>
            <li>Analyze usage patterns to improve our features</li>
            <li>Prevent fraud and ensure security</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">4. Sharing of Information</h2>
          <p className="text-gray-600 dark:text-gray-300">
            We do not sell your personal information. We may share your information with trusted third-party service providers (such as analytics or hosting providers) solely to help us operate our business using the data collected.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">5. Contact Us</h2>
          <p className="text-gray-600 dark:text-gray-300">
            If you have any questions about this Privacy Policy, please contact us.
          </p>
        </section>
      </div>
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-xl font-bold text-primary-600">ToolHub</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="btn btn-secondary">
              Login
            </Link>
            <Link href="/register" className="btn btn-primary">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="py-16 bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl font-extrabold text-secondary-900 mb-4">
                Powerful Tools for Your Workflow
              </h1>
              <p className="text-lg text-secondary-600 mb-8">
                Access our suite of specialized tools designed to streamline your work process and
                boost productivity. Create an account to get started today.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/register" className="btn btn-primary text-center">
                  Get Started
                </Link>
                <Link href="/about" className="btn btn-secondary text-center">
                  Learn More
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-lg h-64 md:h-80">
                {/* Placeholder for hero image */}
                <div className="absolute inset-0 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-24 h-24 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">Our Tools</h2>
            <p className="text-lg text-secondary-600 max-w-3xl mx-auto">
              We offer a variety of powerful tools to help you accomplish your tasks efficiently and effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card">
              <div className="p-6">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Data Analyzer</h3>
                <p className="text-secondary-600 mb-4">
                  Analyze and visualize your data with powerful charts and graphs.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card">
              <div className="p-6">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Text Processor</h3>
                <p className="text-secondary-600 mb-4">
                  Process and transform text content with advanced text tools.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card">
              <div className="p-6">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Image Editor</h3>
                <p className="text-secondary-600 mb-4">
                  Edit and optimize your images with our powerful image tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-3xl mx-auto">
            Create an account today and start using our powerful tools to enhance your workflow.
          </p>
          <Link href="/register" className="btn bg-white text-primary-600 hover:bg-primary-50">
            Sign Up Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-800 text-secondary-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">ToolHub</h3>
              <p className="text-sm">
                Providing powerful tools for your workflow.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li>Email: info@toolhub.example.com</li>
                <li>Phone: (555) 123-4567</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-secondary-700 mt-8 pt-8 text-sm text-center">
            <p>&copy; {new Date().getFullYear()} ToolHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
"use client";
import React from "react";
import { ArrowLeft } from "lucide-react";

interface TermsProps {
  setCurrentView: (view: string) => void;
}

export default function Terms({ setCurrentView }: TermsProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Back Button */}
      <div className="flex items-center p-4 bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-md">
        <button
          onClick={() => setCurrentView("home")}
          className="p-2 rounded hover:bg-green-800 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="ml-4 text-2xl md:text-3xl font-bold">Terms & Conditions</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl w-full">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
            Terms and Conditions for Doop Platform
          </h2>

          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h3>
              <p className="text-gray-700">
                By accessing and using the Doop platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2. Description of Service</h3>
              <p className="text-gray-700">
                Doop is a service marketplace platform that connects service providers with customers. Users can post services, browse available services, leave reviews, and communicate with service providers.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3. User Accounts</h3>
              <p className="text-gray-700 mb-2">
                To use certain features of the platform, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Provide accurate and complete information during registration</li>
                <li>Maintain the security of your password and account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Be responsible for all activities that occur under your account</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4. User Conduct</h3>
              <p className="text-gray-700 mb-2">
                You agree not to use the platform to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Post false, misleading, or fraudulent service listings</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Upload harmful or malicious content</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to gain unauthorized access to our systems</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">5. Service Listings and Content</h3>
              <p className="text-gray-700">
                Service providers are responsible for the accuracy and legality of their listings. All content uploaded to the platform must comply with our content guidelines. We reserve the right to remove any content that violates these terms.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6. Reviews and Ratings</h3>
              <p className="text-gray-700">
                Users may leave reviews and ratings for services. Reviews must be honest and based on actual experiences. We reserve the right to remove reviews that are abusive, spam, or violate our policies.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">7. Intellectual Property</h3>
              <p className="text-gray-700">
                The Doop platform and its original content, features, and functionality are owned by us and are protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">8. Privacy</h3>
              <p className="text-gray-700">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the platform, to understand our practices.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">9. Disclaimers</h3>
              <p className="text-gray-700">
                The platform is provided on an "as is" and "as available" basis. We do not guarantee that the platform will be uninterrupted, error-free, or secure. We are not responsible for the quality, safety, or legality of services provided by users.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">10. Limitation of Liability</h3>
              <p className="text-gray-700">
                In no event shall we be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the platform.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">11. Termination</h3>
              <p className="text-gray-700">
                We may terminate or suspend your account and access to the platform immediately, without prior notice, for any reason, including breach of these terms.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">12. Changes to Terms</h3>
              <p className="text-gray-700">
                We reserve the right to modify these terms at any time. We will notify users of significant changes via email or platform notifications.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">13. Governing Law</h3>
              <p className="text-gray-700">
                These terms shall be governed by and construed in accordance with applicable laws. Any disputes shall be resolved through binding arbitration.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">14. Contact Information</h3>
              <p className="text-gray-700">
                If you have any questions about these Terms and Conditions, please contact us through the platform's contact form or support channels.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import React from "react";
import { ArrowLeft } from "lucide-react";

interface PrivacyProps {
  setCurrentView: (view: string) => void;
}

export default function Privacy({ setCurrentView }: PrivacyProps) {
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
        <h1 className="ml-4 text-2xl md:text-3xl font-bold">Privacy Policy</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl w-full">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
            Privacy Policy for Doop Platform
          </h2>

          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">1. Introduction</h3>
              <p className="text-gray-700">
                At Doop, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service marketplace platform.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2. Information We Collect</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800">Personal Information:</h4>
                  <ul className="list-disc list-inside text-gray-700 ml-4">
                    <li>Name, email address, phone number</li>
                    <li>Profile information and preferences</li>
                    <li>Payment information (processed securely by third-party providers)</li>
                    <li>Identification documents for verification purposes</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Service-Related Information:</h4>
                  <ul className="list-disc list-inside text-gray-700 ml-4">
                    <li>Service listings, descriptions, and media content</li>
                    <li>Reviews and ratings</li>
                    <li>Communication records between users</li>
                    <li>Location information for service matching</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Usage Data:</h4>
                  <ul className="list-disc list-inside text-gray-700 ml-4">
                    <li>Device information and browser data</li>
                    <li>IP address and location data</li>
                    <li>Platform usage patterns and preferences</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3. How We Use Your Information</h3>
              <p className="text-gray-700 mb-2">We use collected information to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Provide and maintain our service marketplace platform</li>
                <li>Facilitate connections between service providers and customers</li>
                <li>Process transactions and payments</li>
                <li>Verify user identities and prevent fraud</li>
                <li>Send important notifications and updates</li>
                <li>Improve our services and develop new features</li>
                <li>Provide customer support and resolve disputes</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4. Information Sharing and Disclosure</h3>
              <p className="text-gray-700 mb-2">We may share your information in the following circumstances:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>With other users as necessary for service transactions</li>
                <li>With service providers who assist our operations</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer or merger</li>
                <li>With your explicit consent</li>
              </ul>
              <p className="text-gray-700 mt-2">
                We do not sell your personal information to third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">5. Data Security</h3>
              <p className="text-gray-700">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6. Your Rights and Choices</h3>
              <p className="text-gray-700 mb-2">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Access and review your personal information</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Delete your account and associated data</li>
                <li>Object to or restrict certain data processing</li>
                <li>Data portability for your information</li>
                <li>Withdraw consent where applicable</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">7. Cookies and Tracking Technologies</h3>
              <p className="text-gray-700">
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, and provide personalized content. You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">8. Third-Party Services</h3>
              <p className="text-gray-700">
                Our platform may contain links to third-party websites or integrate with third-party services. We are not responsible for the privacy practices of these external parties. Please review their privacy policies before providing any information.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">9. Children's Privacy</h3>
              <p className="text-gray-700">
                Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will take steps to delete the information.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">10. International Data Transfers</h3>
              <p className="text-gray-700">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data during such transfers.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">11. Changes to This Privacy Policy</h3>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our platform and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">12. Contact Us</h3>
              <p className="text-gray-700">
                If you have any questions about this Privacy Policy or our data practices, please contact us through the platform's contact form, email, or support channels. We will respond to your inquiries promptly.
              </p>
            </section>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Last Updated:</strong> February 5, 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
  

      {/* Main Content */}
      <section className="flex items-center justify-center flex-grow h-screen">
        <h1 className="text-4xl font-bold text-gray-800">Welcome</h1>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

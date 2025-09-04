import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-6 bg-gradient-to-r from-blue-100 to-purple-100">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Find Trusted <span className="text-purple-600">Plumbers</span>,{" "}
          <span className="text-blue-600">Technicians</span> & More
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Everyday services made simple. Book reliable experts near you.
        </p>
        <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:opacity-90">
          Get Started
        </button>
      </section>

      {/* Services Section */}
      <section className="max-w-6xl mx-auto py-16 px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold text-blue-600">Plumbing</h3>
          <p className="text-gray-600 mt-2">
            Fix leaks, install pipes, and get plumbing emergencies resolved.
          </p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold text-purple-600">Electrical</h3>
          <p className="text-gray-600 mt-2">
            Reliable electricians for wiring, lighting, and repairs.
          </p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold text-blue-600">Carpentry</h3>
          <p className="text-gray-600 mt-2">
            Skilled carpenters for furniture, doors, and woodwork.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-6 text-center">
        <p>© 2025 ServiceFinder. All rights reserved.</p>
      </footer>
    </div>
  );
}

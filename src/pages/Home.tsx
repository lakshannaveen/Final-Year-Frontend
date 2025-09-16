"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

interface HomeProps {
  setCurrentView: (view: string) => void;
}

export default function Home({ setCurrentView }: HomeProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar only in Home */}
      <Navbar currentView="home" setCurrentView={setCurrentView} />

      {/* Main Content */}
      <section className="flex items-center justify-center flex-grow">
        <h1 className="text-4xl font-bold text-gray-800">Welcome</h1>
      </section>
      
      {/* Footer only in Home */}
      <Footer setCurrentView={setCurrentView} />
    </div>
  );
}
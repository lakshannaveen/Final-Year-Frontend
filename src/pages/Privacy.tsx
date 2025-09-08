// Example: Privacy.tsx
"use client";

interface PrivacyProps {
  setCurrentView: (view: string) => void;
}

export default function Privacy({ setCurrentView }: PrivacyProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Privacy Policy</h1>
        <p className="text-gray-600">Your privacy policy content here...</p>
        
        {/* Example navigation button */}
        <button 
          onClick={() => setCurrentView("home")} 
          className="mt-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
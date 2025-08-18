import DashboardLayout from '../../components/DashboardLayout';

export default function SettingsPage() {
  return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <div className="text-sm text-gray-500">
            Chemical Engineering - Faculty
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Published Books</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Book cards would go here */}
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-lg mb-2">Advanced Chemical Processes</h3>
              <p className="text-gray-600 text-sm mb-2">Published: 2024</p>
              <p className="text-gray-700">Comprehensive guide to modern chemical engineering processes.</p>
            </div>
            {/* Add more book cards as needed */}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Book Chapters</h2>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-medium">Chapter in "Industrial Chemistry"</h3>
              <p className="text-gray-600 text-sm">Publisher: Springer, 2023</p>
            </div>
            {/* Add more chapters as needed */}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">In Progress</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="font-medium">Sustainable Chemical Engineering</h3>
                <p className="text-gray-600 text-sm">Expected completion: 2026</p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Writing
              </span>
            </div>
            {/* Add more in-progress items as needed */}
          </div>
        </div>
      </div>
  );
}
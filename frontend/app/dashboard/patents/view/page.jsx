// miniproject2\frontend\app\dashboard\patents\view\page.jsx
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../../lib/auth';
import Link from 'next/link';

export default function ViewPatents() {
  const { user, token } = useAuth();
  const [patents, setPatents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPatents = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/patents`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch patents');
        }
        
        const data = await response.json();
        setPatents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      fetchPatents();
    }
  }, [user, token]);

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="bg-pink-300 p-4 text-center mb-4">
        <h2 className="text-xl font-bold text-teal-700">VIEW PATENT DOCUMENTS</h2>
      </div>
      
      <div className="mb-4">
        <Link 
          href="/dashboard/patents" 
          className="px-4 py-2 bg-gray-300 text-red-600 font-bold border border-teal-700 rounded hover:bg-gray-400"
        >
          Upload New Patent
        </Link>
      </div>

      {patents.length === 0 ? (
        <div className="text-center p-4">No patents found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">Title</th>
                <th className="py-2 px-4 border">File Number</th>
                <th className="py-2 px-4 border">Date</th>
                <th className="py-2 px-4 border">Status</th>
                <th className="py-2 px-4 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {patents.map((patent) => (
                <tr key={patent._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">{patent.title}</td>
                  <td className="py-2 px-4 border">{patent.fnum}</td>
                  <td className="py-2 px-4 border">{new Date(patent.date1).toLocaleDateString()}</td>
                  <td className="py-2 px-4 border">{patent.status1}</td>
                  <td className="py-2 px-4 border">
                    <a 
                      href={`${process.env.NEXT_PUBLIC_API_URL}/patents/file/${patent.path}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Document
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
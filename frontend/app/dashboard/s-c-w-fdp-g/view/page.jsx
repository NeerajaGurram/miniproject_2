// miniproject2\frontend\app\dashboard\seminars\view\page.jsx
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../../lib/auth';
import DashboardLayout from '../../../../components/DashboardLayout';
import Link from 'next/link';

export default function ViewSeminars() {
  const { user, token } = useAuth();
  const [seminars, setSeminars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSeminars = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/s-c-w-fdp-g`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch seminars');
        }
        
        const data = await response.json();
        setSeminars(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      fetchSeminars();
    }
  }, [user, token]);

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="bg-pink-300 p-4 text-center mb-4">
        <h2 className="text-xl font-bold text-teal-700">VIEW SEMINAR DOCUMENTS</h2>
      </div>
      
      <div className="mb-4">
        <Link 
          href="/dashboard/s-c-w-fdp-g" 
          className="px-4 py-2 bg-gray-300 text-red-600 font-bold border border-teal-700 rounded hover:bg-gray-400"
        >
          Upload New Seminar
        </Link>
      </div>

      {seminars.length === 0 ? (
        <div className="text-center p-4">No seminars found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">Title</th>
                <th className="py-2 px-4 border">Type Of Event</th>
                <th className="py-2 px-4 border">Organized/Participated</th>
                <th className="py-2 px-4 border">Type of place</th>
                <th className="py-2 px-4 border">Host</th>
                <th className="py-2 px-4 border">Sponsoring Agency</th>
                <th className="py-2 px-4 border">Description of Event</th>
                <th className="py-2 px-4 border">Starting date</th>
                <th className="py-2 px-4 border">Ending date</th>
                <th className="py-2 px-4 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {seminars.map((seminar) => (
                <tr key={seminar._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">{seminar.empId}</td>  
                  <td className="py-2 px-4 border">{seminar.title}</td>
                  <td className="py-2 px-4 border">{seminar.type1}</td>
                  <td className="py-2 px-4 border">{seminar.type2}</td>
                  <td className="py-2 px-4 border">{seminar.type3}</td>
                  <td className="py-2 px-4 border">{seminar.host}</td>
                  <td className="py-2 px-4 border">{seminar.agency}</td>
                  <td className="py-2 px-4 border">{seminar.comment}</td>
                  <td className="py-2 px-4 border">{new Date(seminar.date1).toLocaleDateString()}</td>
                  <td className="py-2 px-4 border">{new Date(seminar.date2).toLocaleDateString()}</td>
                  <td className="py-2 px-4 border">
                    <a 
                      href={`${process.env.NEXT_PUBLIC_API_URL}/s-c-w-fdp-g/file/${seminar.path}`} 
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
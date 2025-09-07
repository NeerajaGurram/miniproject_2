'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth';
import toast from 'react-hot-toast';

export default function PerformancePage() {
  return (
    
    <div className="p-4 max-w-7xl mx-auto">
      <div className="bg-gradient-brand p-6 text-center mb-6 rounded-lg">
        <h2 className="text-2xl font-bold text-white">View Performance</h2>
      </div>
      <div className='bg-gray-50 p-6 rounded-lg m-2'>
        <h2 className="text-2xl font-bold text-brand-primary">Faculty Score</h2>
        <p className="mt-2 text-gray-700">This section is under development. Please check back later for updates.</p>
        <p className='text-gray-700'>0</p>
      </div>
      <div className='bg-gray-50 p-6 rounded-lg m-2'>
        <h2 className="text-2xl font-bold text-brand-primary">Department Score</h2>
        <p className="mt-2 text-gray-700">This section is under development. Please check back later for updates.</p>
        <p className='text-gray-700'>0</p>
      </div>
      <div className='bg-gray-50 p-6 rounded-lg m-2'>
        <h2 className="text-2xl font-bold text-brand-primary">University Score</h2>
        <p className="mt-2 text-gray-700">This section is under development. Please check back later for updates.</p>
        <p className='text-gray-700'>0</p>
      </div>
    </div>
  );
}
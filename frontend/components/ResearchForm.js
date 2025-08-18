'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../lib/auth';
import { researchAPI, uploadAPI } from '../lib/api';
import { 
  BookOpen, 
  GraduationCap, 
  FileText, 
  Award, 
  Patent, 
  Users, 
  Building, 
  DollarSign,
  Upload,
  X,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const researchTypes = [
  { value: 'seminar', label: 'Seminar', icon: BookOpen },
  { value: 'phd', label: 'PhD Research', icon: GraduationCap },
  { value: 'journal', label: 'Journal Publication', icon: FileText },
  { value: 'book', label: 'Book', icon: BookOpen },
  { value: 'award', label: 'Award', icon: Award },
  { value: 'patent', label: 'Patent', icon: Patent },
  { value: 'visit', label: 'Visit', icon: Users },
  { value: 'consultancy', label: 'Consultancy', icon: Building },
  { value: 'infrastructure', label: 'Infrastructure', icon: Building },
  { value: 'grant', label: 'Grant', icon: DollarSign }
];

const typeSpecificFields = {
  seminar: [
    { name: 'topic', label: 'Topic', type: 'text', required: true },
    { name: 'venue', label: 'Venue', type: 'text', required: true },
    { name: 'organizer', label: 'Organizer', type: 'text' },
    { name: 'participants', label: 'Number of Participants', type: 'number' }
  ],
  phd: [
    { name: 'studentName', label: 'Student Name', type: 'text', required: true },
    { name: 'supervisor', label: 'Supervisor', type: 'text', required: true },
    { name: 'topic', label: 'Research Topic', type: 'text', required: true },
    { name: 'status', label: 'Status', type: 'select', options: ['Ongoing', 'Completed', 'Submitted'] }
  ],
  journal: [
    { name: 'journalName', label: 'Journal Name', type: 'text', required: true },
    { name: 'impactFactor', label: 'Impact Factor', type: 'number' },
    { name: 'doi', label: 'DOI', type: 'text' },
    { name: 'coAuthors', label: 'Co-Authors', type: 'text' }
  ],
  book: [
    { name: 'publisher', label: 'Publisher', type: 'text', required: true },
    { name: 'isbn', label: 'ISBN', type: 'text' },
    { name: 'edition', label: 'Edition', type: 'text' },
    { name: 'coAuthors', label: 'Co-Authors', type: 'text' }
  ],
  award: [
    { name: 'awardName', label: 'Award Name', type: 'text', required: true },
    { name: 'organization', label: 'Awarding Organization', type: 'text', required: true },
    { name: 'category', label: 'Category', type: 'text' },
    { name: 'amount', label: 'Award Amount', type: 'number' }
  ],
  patent: [
    { name: 'patentNumber', label: 'Patent Number', type: 'text', required: true },
    { name: 'status', label: 'Status', type: 'select', options: ['Filed', 'Published', 'Granted'] },
    { name: 'filingDate', label: 'Filing Date', type: 'date' },
    { name: 'coInventors', label: 'Co-Inventors', type: 'text' }
  ],
  visit: [
    { name: 'institution', label: 'Institution', type: 'text', required: true },
    { name: 'purpose', label: 'Purpose', type: 'text', required: true },
    { name: 'duration', label: 'Duration (days)', type: 'number' },
    { name: 'funding', label: 'Funding Source', type: 'text' }
  ],
  consultancy: [
    { name: 'client', label: 'Client', type: 'text', required: true },
    { name: 'projectTitle', label: 'Project Title', type: 'text', required: true },
    { name: 'amount', label: 'Amount', type: 'number' },
    { name: 'duration', label: 'Duration (months)', type: 'number' }
  ],
  infrastructure: [
    { name: 'facilityName', label: 'Facility Name', type: 'text', required: true },
    { name: 'cost', label: 'Cost', type: 'number' },
    { name: 'fundingSource', label: 'Funding Source', type: 'text' },
    { name: 'status', label: 'Status', type: 'select', options: ['Planned', 'Under Construction', 'Completed'] }
  ],
  grant: [
    { name: 'grantTitle', label: 'Grant Title', type: 'text', required: true },
    { name: 'fundingAgency', label: 'Funding Agency', type: 'text', required: true },
    { name: 'amount', label: 'Amount', type: 'number' },
    { name: 'duration', label: 'Duration (years)', type: 'number' }
  ]
};

export default function ResearchForm() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm();

  const watchedType = watch('type');

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    setUploading(true);

    try {
      const uploadPromises = files.map(file => 
        uploadAPI.uploadSingle(file, 'research')
      );

      const responses = await Promise.all(uploadPromises);
      const newFiles = responses.map(response => ({
        filename: response.data.filename,
        originalName: response.data.originalName,
        size: response.data.size,
        url: response.data.url
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      // Prepare research data
      const researchData = {
        ...data,
        facultyId: user._id,
        attachments: uploadedFiles,
        status: 'pending'
      };

      // Add type-specific details
      if (data.type && typeSpecificFields[data.type]) {
        const details = {};
        typeSpecificFields[data.type].forEach(field => {
          if (data[field.name]) {
            details[field.name] = data[field.name];
          }
        });
        researchData.details = details;
      }

      const response = await researchAPI.create(researchData);
      
      toast.success('Research entry added successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to add research entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Add New Research</h2>
        <p className="text-sm text-gray-600 mt-1">
          Fill in the details below to add a new research entry
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Research Type *
            </label>
            <select
              {...register('type', { required: 'Research type is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">Select Research Type</option>
              {researchTypes.map(type => {
                const Icon = type.icon;
                return (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                );
              })}
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              {...register('date', { required: 'Date is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            {...register('title', { required: 'Title is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter research title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter detailed description"
          />
        </div>

        {/* Type-specific Fields */}
        {watchedType && typeSpecificFields[watchedType] && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {researchTypes.find(t => t.value === watchedType)?.label} Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {typeSpecificFields[watchedType].map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label} {field.required && '*'}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      {...register(field.name, field.required ? { required: `${field.label} is required` } : {})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select {field.label}</option>
                      {field.options.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      {...register(field.name, field.required ? { required: `${field.label} is required` } : {})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  )}
                  {errors[field.name] && (
                    <p className="mt-1 text-sm text-red-600">{errors[field.name].message}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Upload */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Upload files
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  PDF, DOC, DOCX, JPG, PNG up to 10MB each
                </span>
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="sr-only"
                disabled={uploading}
              />
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Adding...' : 'Add Research'}
          </button>
        </div>
      </form>
    </div>
  );
} 
import React, { useState } from 'react';
import api from '../lib/api';
import Swal from 'sweetalert2';

export default function SendBulkSMS() {
  const [file, setFile] = useState<File | null>(null);
  const [campaignName, setCampaignName] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return Swal.fire('Error', 'Please select a file', 'warning');
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('campaignName', campaignName);
    formData.append('messageTemplate', messageTemplate);

    try {
      await api.post('/sms/bulk', formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
      });
      Swal.fire('Success', 'Bulk messages added to queue', 'success');
      setFile(null);
      setCampaignName('');
      setMessageTemplate('');
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Send Bulk SMS</h1>
       <div className="bg-white shadow sm:rounded-lg dark:bg-gray-800">
         <div className="px-4 py-5 sm:p-6">
           <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Campaign Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3 border"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Contacts (.csv or .xlsx)</label>
                <div className="mt-1">
                  <input
                    type="file"
                    required
                    accept=".csv, .xlsx"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-300"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Must contain a column named "phone", "Phone", "dest_addr" or "contact".
                  Can also contain a "message" column if template is empty.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                   Message Template (Optional if file has 'message' column)
                </label>
                <div className="mt-1">
                  <textarea
                    rows={4}
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3 border"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Upload & Queue'}
              </button>
           </form>
         </div>
       </div>
    </div>
  );
}

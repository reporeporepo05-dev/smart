import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../lib/api';

export default function InstallationWizard() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    systemName: 'Smart Beem SMS',
    timezone: 'Africa/Dar_es_Salaam',
    username: 'admin',
    password: '',
    bongoKey: '',
    bongoSecret: '',
    senderId: 'INFO',
    logoBase64: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/setup', formData);
      Swal.fire('Success', 'Installation complete! Please login.', 'success');
      navigate('/login');
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoBase64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Installation Wizard
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Setup your Database & Beem API Credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 dark:bg-gray-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">System Name</label>
                <div className="mt-1">
                  <input required type="text" value={formData.systemName} onChange={e => setFormData({...formData, systemName: e.target.value})} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Timezone</label>
                <div className="mt-1">
                  <input required type="text" value={formData.timezone} onChange={e => setFormData({...formData, timezone: e.target.value})} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admin Username</label>
                <div className="mt-1">
                  <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admin Password</label>
                <div className="mt-1">
                  <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Beem API Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">BONGO_LIVE_KEY</label>
                  <div className="mt-1">
                    <input required type="text" value={formData.bongoKey} onChange={e => setFormData({...formData, bongoKey: e.target.value})} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">BONGO_LIVE_SECRET</label>
                  <div className="mt-1">
                    <input required type="text" value={formData.bongoSecret} onChange={e => setFormData({...formData, bongoSecret: e.target.value})} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SENDER_ID</label>
                  <div className="mt-1">
                    <input required type="text" value={formData.senderId} onChange={e => setFormData({...formData, senderId: e.target.value})} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">System Logo</label>
              <div className="mt-1">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-300" />
              </div>
            </div>

            <div>
              <button disabled={loading} type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                {loading ? 'Installing...' : 'Install System'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

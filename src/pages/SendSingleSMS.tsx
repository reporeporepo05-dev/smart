import React, { useState } from 'react';
import api from '../lib/api';
import Swal from 'sweetalert2';

export default function SendSingleSMS() {
  const [destAddr, setDestAddr] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateCost = (msg: string) => Math.ceil(msg.length / 160) || 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/sms/single', { destAddr, message });
      Swal.fire('Success', 'Message added to queue', 'success');
      setDestAddr('');
      setMessage('');
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Send Single SMS</h1>
      <div className="bg-white shadow sm:rounded-lg dark:bg-gray-800">
        <div className="px-4 py-5 sm:p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Destination Phone Number (e.g. 255700000000)
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  id="phone"
                  value={destAddr}
                  onChange={(e) => setDestAddr(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3 border"
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between">
                <span>Message</span>
                <span className="text-gray-500">
                  {message.length} chars | Cost: {calculateCost(message)} SMS
                </span>
              </label>
              <div className="mt-1">
                <textarea
                  id="message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3 border"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !destAddr || !message}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Sending to Queue...' : 'Queue SMS'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

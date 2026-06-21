import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import clsx from 'clsx';
import { RefreshCw } from 'lucide-react';

export default function History() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/messages');
      setMessages(res.data);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status.toUpperCase()) {
       case 'QUEUED': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
       case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
       case 'DELIVERED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
       case 'FAILED':
       case 'UNDELIVERED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
       default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Message History</h1>
         <button onClick={fetchHistory} disabled={loading} className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
           <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
           <span>Refresh</span>
         </button>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md dark:bg-gray-800">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {messages.map((msg, idx) => (
            <li key={idx}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-600 truncate dark:text-blue-400">{msg.dest_addr}</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={clsx("px-2 inline-flex text-xs leading-5 font-semibold rounded-full", getStatusColor(msg.status))}>
                      {msg.status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500 dark:text-gray-400 truncate max-w-lg">
                      {msg.message}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6 dark:text-gray-400">
                    <p>
                      Cost: {msg.cost} • {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {messages.length === 0 && !loading && (
             <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No messages found.</div>
          )}
        </ul>
      </div>
    </div>
  );
}

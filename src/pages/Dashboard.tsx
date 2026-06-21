import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useStore } from '../lib/store';
import { MessageSquare, CheckCircle, XCircle, Clock, Send, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
       const res = await api.get('/dashboard');
       setStats(res.data);
    } catch (e: any) {
       if (e.response?.status === 401) {
           navigate('/login');
       }
    }
  };

  const statCards = [
    { name: 'Balance', stat: stats?.balance || 0, icon: <Coins className="w-6 h-6 text-yellow-500" /> },
    { name: 'Total Campaigns', stat: stats?.campaigns || 0, icon: <MessageSquare className="w-6 h-6 text-blue-500" /> },
    { name: 'Queued', stat: stats?.queued || 0, icon: <Clock className="w-6 h-6 text-gray-500" /> },
    { name: 'Sent To Beem', stat: stats?.pending || 0, icon: <Send className="w-6 h-6 text-indigo-500" /> },
    { name: 'Delivered', stat: stats?.delivered || 0, icon: <CheckCircle className="w-6 h-6 text-green-500" /> },
    { name: 'Failed / Undelivered', stat: (stats?.failed || 0) + (stats?.undelivered || 0), icon: <XCircle className="w-6 h-6 text-red-500" /> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard Overview</h1>
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((item) => (
          <div key={item.name} className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden dark:bg-gray-800">
            <dt>
              <div className="absolute bg-gray-50 rounded-md p-3 dark:bg-gray-700">
                {item.icon}
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate dark:text-gray-400">{item.name}</p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{item.stat}</p>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

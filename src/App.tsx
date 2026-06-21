/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import InstallationWizard from './pages/InstallationWizard';
import SendSingleSMS from './pages/SendSingleSMS';
import SendBulkSMS from './pages/SendBulkSMS';
import History from './pages/History';
import { useStore } from './lib/store';
import api from './lib/api';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    api.get('/check-setup').then((res) => {
      setIsSetup(res.data.isSetup);
      setCheckingSetup(false);
    }).catch(() => {
      setCheckingSetup(false);
    });
  }, []);

  if (checkingSetup) {
    return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {!isSetup && <Route path="*" element={<Navigate to="/install" replace />} />}
        
        <Route path="/install" element={isSetup ? <Navigate to="/login" replace /> : <InstallationWizard />} />
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="send-single" element={<SendSingleSMS />} />
          <Route path="send-bulk" element={<SendBulkSMS />} />
          <Route path="history" element={<History />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

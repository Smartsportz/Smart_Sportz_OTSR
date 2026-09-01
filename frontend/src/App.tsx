import React from "react";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminTournaments from './pages/AdminTournaments';
import CreateTournament from './pages/CreateTournament';
import AdminOperators from './pages/AdminOperators';
import AdminPayments from './pages/AdminPayments';
import TeamsPage from './pages/TeamsPage';
import OperatorDashboard from './pages/OperatorDashboard';
import RegistrationFlow from './pages/RegistrationFlow';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles: string[] }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/login" replace />} />
              
              {/* Admin Routes */}
              <Route path="admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="admin/tournaments" element={<ProtectedRoute roles={['admin']}><AdminTournaments /></ProtectedRoute>} />
              <Route path="admin/tournaments/new" element={<ProtectedRoute roles={['admin']}><CreateTournament /></ProtectedRoute>} />
              <Route path="admin/operators" element={<ProtectedRoute roles={['admin']}><AdminOperators /></ProtectedRoute>} />
              <Route path="admin/teams" element={<ProtectedRoute roles={['admin', 'operator']}><TeamsPage /></ProtectedRoute>} />
              <Route path="admin/payments" element={<ProtectedRoute roles={['admin']}><AdminPayments /></ProtectedRoute>} />

              {/* Operator Routes */}
              <Route path="operator" element={<ProtectedRoute roles={['operator', 'admin']}><OperatorDashboard /></ProtectedRoute>} />
              <Route path="operator/register/:id" element={<ProtectedRoute roles={['operator', 'admin']}><RegistrationFlow /></ProtectedRoute>} />
              <Route path="teams" element={<ProtectedRoute roles={['operator', 'admin']}><TeamsPage /></ProtectedRoute>} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}



import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { CreateWorkflow } from './pages/CreateWorkflow';
import { WorkflowDetail } from './pages/WorkflowDetail';
import { Templates } from './pages/Templates';
import { Settings } from './pages/Settings';
import { KnowledgeSearchPage } from './pages/KnowledgeSearchPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30s cache
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="search" element={<KnowledgeSearchPage />} />
            <Route path="workflows/new" element={<CreateWorkflow />} />
            <Route path="workflows/:id" element={<WorkflowDetail />} />
            <Route path="templates" element={<Templates />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

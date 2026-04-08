import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RoleLandingPage from './RoleLandingPage.tsx';
import App from './App.tsx';
import EntryPage from './EntryPage.tsx';
import WorkshopEntryPage from './WorkshopEntryPage.tsx';
import WorkspaceLobby from './WorkspaceLobby.tsx';
import WorkspacePage from './WorkspacePage.tsx';
import AdminRoutes from './admin/AdminRoutes.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/entry" element={<EntryPage />} />
        <Route path="/entry/workshop" element={<WorkshopEntryPage />} />
        <Route path="/ws/:workshopId/:groupId/work" element={<WorkspacePage />} />
        <Route path="/ws/:workshopId/:groupId" element={<WorkspaceLobby />} />
        <Route path="/tools" element={<App startOnToolbox />} />
        <Route path="/" element={<RoleLandingPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);

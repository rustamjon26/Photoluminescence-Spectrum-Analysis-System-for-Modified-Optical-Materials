import Dashboard from './pages/Dashboard';
import ImportPage from './pages/ImportPage';
import PreprocessPage from './pages/PreprocessPage';
import AnalysisPage from './pages/AnalysisPage';
import ComparePage from './pages/ComparePage';
import ReportsPage from './pages/ReportsPage';
import ExperimentPage from './pages/ExperimentPage';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Dashboard',
    path: '/',
    element: <Dashboard />
  },
  {
    name: 'Import Data',
    path: '/import',
    element: <ImportPage />
  },
  {
    name: 'Experiment',
    path: '/experiment/:experimentId',
    element: <ExperimentPage />
  },
  {
    name: 'Preprocess',
    path: '/preprocess/:sampleId',
    element: <PreprocessPage />
  },
  {
    name: 'Analysis',
    path: '/analysis/:sampleId',
    element: <AnalysisPage />
  },
  {
    name: 'Compare',
    path: '/compare/:sampleId',
    element: <ComparePage />
  },
  {
    name: 'Reports',
    path: '/reports',
    element: <ReportsPage />
  }
];

export default routes;

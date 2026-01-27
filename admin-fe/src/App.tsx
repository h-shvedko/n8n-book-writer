import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { VectorDBOverview } from './components/VectorDBOverview';
import { WorkflowMonitor } from './components/WorkflowMonitor';
import { SyllabusEditor } from './components/SyllabusEditor';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/monitor" replace />} />
        <Route path="/monitor" element={<WorkflowMonitor />} />
        <Route path="/vectordb" element={<VectorDBOverview />} />
        <Route path="/ingestion" element={<Navigate to="/vectordb" replace />} />
        <Route path="/syllabus" element={<SyllabusEditor />} />
      </Routes>
    </Layout>
  );
}

export default App;

import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { VectorDBOverview } from './components/VectorDBOverview';
import { WorkflowMonitor } from './components/WorkflowMonitor';
import { SyllabusEditor } from './components/SyllabusEditor';
import { BooksPage } from './components/BooksPage';
import { BookDetail } from './components/BookDetail';
import { JobsPage } from './components/JobsPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/monitor" replace />} />
        <Route path="/monitor" element={<WorkflowMonitor />} />
        <Route path="/vectordb" element={<VectorDBOverview />} />
        <Route path="/ingestion" element={<Navigate to="/vectordb" replace />} />
        <Route path="/syllabus" element={<SyllabusEditor />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/jobs" element={<JobsPage />} />
      </Routes>
    </Layout>
  );
}

export default App;

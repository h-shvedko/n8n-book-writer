import { useState } from 'react';
import { Layout } from './components/Layout';
import { KnowledgeIngestion } from './components/KnowledgeIngestion';
import { WorkflowMonitor } from './components/WorkflowMonitor';
import { SyllabusEditor } from './components/SyllabusEditor';

type TabType = 'ingestion' | 'monitor' | 'syllabus';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('monitor');

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'ingestion' && <KnowledgeIngestion />}
      {activeTab === 'monitor' && <WorkflowMonitor />}
      {activeTab === 'syllabus' && <SyllabusEditor />}
    </Layout>
  );
}

export default App;

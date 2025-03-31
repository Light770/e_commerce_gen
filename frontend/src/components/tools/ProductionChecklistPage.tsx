import React from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import to avoid SSR issues with the checklist component
const ChecklistTool = dynamic(() => import('@/components/tools/ChecklistTool'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  ),
});

const ProductionChecklistPage: React.FC = () => {
  return <ChecklistTool />;
};

export default ProductionChecklistPage;
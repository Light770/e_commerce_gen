import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ToolCardProps {
  id: number;
  name: string;
  description: string;
  icon: string;
  isPremium: boolean;
  access: {
    hasAccess: boolean;
    reason: string | null;
    remainingUses: number | "unlimited";
  };
}

const ToolCard: React.FC<ToolCardProps> = ({ 
  id, 
  name, 
  description, 
  icon, 
  isPremium, 
  access 
}) => {
  const router = useRouter();

  const handleClick = () => {
    // Only navigate to the tool if the user has access
    if (access.hasAccess) {
      if (name === 'Production Checklist') {
        router.push('/tools/production-checklist');
      } else {
        router.push(`/tools/${id}`);
      }
    } else {
      // If no access, direct them to the pricing page
      router.push('/pricing');
    }
  };

  const renderIcon = () => {
    switch (icon) {
      case 'chart-bar':
        return (
          <svg
            className="h-6 w-6 text-primary-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
      case 'file-text':
        return (
          <svg
            className="h-6 w-6 text-primary-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case 'image':
        return (
          <svg
            className="h-6 w-6 text-primary-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="h-6 w-6 text-primary-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
        );
    }
  };

  return (
    <div
      className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer ${
        !access.hasAccess ? 'opacity-75' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
            {renderIcon()}
          </div>
          <div className="ml-4">
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-secondary-900">{name}</h3>
              {isPremium && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  Premium
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-secondary-500 line-clamp-3">{description}</p>
            
            {/* Usage information */}
            <div className="mt-3">
              {access.hasAccess ? (
                <div className="text-xs text-green-600 font-medium flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {access.remainingUses === "unlimited" 
                    ? "Unlimited access" 
                    : `${access.remainingUses} uses remaining`}
                </div>
              ) : (
                <div className="text-xs text-red-600 font-medium flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {access.reason || "Requires subscription"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          access.hasAccess 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {access.hasAccess ? 'Available' : 'Upgrade Required'}
        </span>
      </div>
    </div>
  );
};

export default ToolCard;
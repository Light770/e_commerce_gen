'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { apiService } from '@/services/apiService';

// Define checklist section type
interface ChecklistItem {
  id: string;
  text: string;
  details?: string[];
  checked: boolean;
}

interface ChecklistSection {
  title: string;
  icon: string;
  items: ChecklistItem[];
}

export default function ProductionChecklistPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [checklistData, setChecklistData] = useState<ChecklistSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [savedStatus, setSavedStatus] = useState("Saved");
  const [toolId, setToolId] = useState<number | null>(null);
  const [usageId, setUsageId] = useState<number | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      const findChecklistTool = async () => {
        try {
          const response = await apiService.get('/tools');
          const checklistTool = response.data.find((tool: any) => tool.name === 'Production Checklist');
          if (checklistTool) {
            setToolId(checklistTool.id);
            
            // Try to load existing progress
            try {
              const progressResponse = await apiService.get(`/tools/${checklistTool.id}/saved-progress`);
              if (progressResponse.data && progressResponse.data.form_data && progressResponse.data.form_data.checklist) {
                setChecklistData(progressResponse.data.form_data.checklist);
                
                // Calculate progress
                const loadedData = progressResponse.data.form_data.checklist;
                let total = 0;
                let completed = 0;
                loadedData.forEach((section: any) => {
                  total += section.items.length;
                  completed += section.items.filter((item: any) => item.checked).length;
                });
                setProgress({ total, completed });
                
                // Initialize expanded sections
                const initExpandedSections: Record<string, boolean> = {};
                loadedData.forEach((section: any, idx: number) => {
                  initExpandedSections[section.title] = idx === 0; // Only expand first section by default
                });
                setExpandedSections(initExpandedSections);
              } else {
                // Use default data
                const initialChecklist = getChecklistData();
                setChecklistData(initialChecklist);
                
                // Calculate total items
                let total = 0;
                let completed = 0;
                initialChecklist.forEach(section => {
                  total += section.items.length;
                  completed += section.items.filter(item => item.checked).length;
                });
                
                setProgress({ total, completed });
              }
            } catch (error) {
              console.log('No saved progress found, using default data');
              // Use default data
              const initialChecklist = getChecklistData();
              setChecklistData(initialChecklist);
              
              // Calculate total items
              let total = 0;
              let completed = 0;
              initialChecklist.forEach(section => {
                total += section.items.length;
                completed += section.items.filter(item => item.checked).length;
              });
              
              setProgress({ total, completed });
            }
            
            // Initialize expanded sections
            const initExpandedSections: Record<string, boolean> = {};
            checklistData.forEach((section, idx) => {
              initExpandedSections[section.title] = idx === 0; // Only expand first section by default
            });
            setExpandedSections(initExpandedSections);
          } else {
            // Fallback to default data
            const initialChecklist = getChecklistData();
            setChecklistData(initialChecklist);
            
            // Calculate total items
            let total = 0;
            let completed = 0;
            initialChecklist.forEach(section => {
              total += section.items.length;
              completed += section.items.filter(item => item.checked).length;
            });
            
            setProgress({ total, completed });
            
            // Initialize expanded sections
            const initExpandedSections: Record<string, boolean> = {};
            initialChecklist.forEach((section, idx) => {
              initExpandedSections[section.title] = idx === 0; // Only expand first section by default
            });
            setExpandedSections(initExpandedSections);
          }
        } catch (error) {
          console.error('Error finding checklist tool:', error);
          // Fallback to default data
          const initialChecklist = getChecklistData();
          setChecklistData(initialChecklist);
          
          // Calculate total items
          let total = 0;
          let completed = 0;
          initialChecklist.forEach(section => {
            total += section.items.length;
            completed += section.items.filter(item => item.checked).length;
          });
          
          setProgress({ total, completed });
          
          // Initialize expanded sections
          const initExpandedSections: Record<string, boolean> = {};
          initialChecklist.forEach((section, index) => {
            initExpandedSections[section.title] = index === 0; // Only expand first section by default
          });
          setExpandedSections(initExpandedSections);
        } finally {
          setIsLoading(false);
        }
      };
      
      findChecklistTool();
    }
  }, [isAuthenticated]);
  
  // Cleanup effect for the save timeout
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections({
      ...expandedSections,
      [sectionTitle]: !expandedSections[sectionTitle]
    });
  };

  const toggleItemDetails = (itemId: string) => {
    setExpandedItems({
      ...expandedItems,
      [itemId]: !expandedItems[itemId]
    });
  };

  const saveChecklistProgress = async () => {
    try {
      setSavedStatus("Saving...");
      console.log("Saving checklist data:", checklistData);
      const response = await apiService.post('/tools/production-checklist/save', checklistData);
      setUsageId(response.data.id);
      setSavedStatus("Saved");
      toast.success("Progress saved successfully");
    } catch (error) {
      console.error('Error saving checklist:', error);
      setSavedStatus("Save failed");
      toast.error("Failed to save progress: " + (error.response?.data?.detail || "Unknown error"));
    }
  };
  
  const completeChecklist = async () => {
    try {
      setSavedStatus("Completing...");
      console.log("Completing checklist with data:", checklistData);
      const response = await apiService.post('/tools/production-checklist/complete', checklistData);
      setSavedStatus("Completed");
      toast.success("Checklist marked as complete!");
      return response.data;
    } catch (error) {
      console.error('Error completing checklist:', error);
      setSavedStatus("Completion failed");
      toast.error("Failed to mark checklist as complete: " + (error.response?.data?.detail || "Unknown error"));
      return null;
    }
  };
  
  const toggleChecklistItem = (sectionIndex: number, itemIndex: number) => {
    try {
      const newChecklistData = [...checklistData];
      const item = newChecklistData[sectionIndex].items[itemIndex];
      item.checked = !item.checked;
      
      setChecklistData(newChecklistData);
      
      // Update progress
      const completed = newChecklistData.reduce(
        (count, section) => count + section.items.filter(item => item.checked).length,
        0
      );
      const total = newChecklistData.reduce(
        (count, section) => count + section.items.length,
        0
      );
      
      setProgress({ completed, total });
      
      // Save to backend with debounce
      setSavedStatus("Saving...");
      // Use a debounce to avoid too many API calls
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveChecklistProgress();
      }, 1000);
    } catch (error) {
      console.error("Error toggling checklist item:", error);
      toast.error("Failed to update item");
    }
  };

  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.round((progress.completed / progress.total) * 100);
  };

  const exportChecklist = async () => {
    // Create a formatted text for export
    let exportText = "# Production Readiness Checklist\n\n";
    
    checklistData.forEach(section => {
      exportText += `## ${section.title}\n\n`;
      
      section.items.forEach(item => {
        exportText += `- [${item.checked ? 'x' : ' '}] ${item.text}\n`;
        
        if (item.details && item.details.length > 0) {
          item.details.forEach(detail => {
            exportText += `  - ${detail}\n`;
          });
        }
        
        exportText += '\n';
      });
    });
    
    // Create a download link
    const blob = new Blob([exportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'production-readiness-checklist.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Mark as complete if all items are checked
    if (progress.completed === progress.total) {
      await completeChecklist();
    }
    
    toast.success("Checklist exported successfully!");
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-secondary-900">Production Readiness Checklist</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-secondary-500">{savedStatus}</div>
              <button
                onClick={saveChecklistProgress}
                className="inline-flex items-center px-4 py-2 border border-secondary-300 text-sm font-medium rounded-md shadow-sm text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
              >
                Save Progress
              </button>
              <button
                onClick={exportChecklist}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Export Checklist
              </button>
              {progress.completed === progress.total && (
                <button
                  onClick={completeChecklist}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Mark as Complete
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-4">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-secondary-900">Your Progress</h2>
                <div className="mt-2 flex items-center">
                  <div className="w-full bg-secondary-200 rounded-full h-4">
                    <div 
                      className="bg-primary-600 h-4 rounded-full transition-all duration-500 ease-in-out" 
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                  <div className="ml-4 text-sm font-medium text-secondary-700">
                    {progress.completed} of {progress.total} ({getProgressPercentage()}%)
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {checklistData.map((section, sectionIndex) => (
                    <div key={section.title} className="border border-secondary-200 rounded-md overflow-hidden">
                      <div 
                        className="bg-secondary-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                        onClick={() => toggleSection(section.title)}
                      >
                        <div className="flex items-center">
                          <span className="mr-3 text-primary-600">{renderIcon(section.icon)}</span>
                          <h3 className="text-lg font-medium text-secondary-900">{section.title}</h3>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2 text-sm text-secondary-500">
                            {section.items.filter(item => item.checked).length}/{section.items.length}
                          </span>
                          <svg 
                            className={`h-5 w-5 text-secondary-500 transition-transform ${expandedSections[section.title] ? 'transform rotate-180' : ''}`}
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      
                      {expandedSections[section.title] && (
                        <div className="px-4 py-3 bg-white border-t border-secondary-200">
                          <ul className="space-y-4">
                            {section.items.map((item, itemIndex) => (
                              <li key={item.id} className="relative">
                                <div className="flex items-start">
                                  <div className="flex items-center h-5">
                                    <input
                                      id={item.id}
                                      name={item.id}
                                      type="checkbox"
                                      checked={item.checked}
                                      onChange={() => toggleChecklistItem(sectionIndex, itemIndex)}
                                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-secondary-300 rounded"
                                    />
                                  </div>
                                  <div className="ml-3 flex-grow">
                                    <label 
                                      htmlFor={item.id} 
                                      className={`text-sm font-medium ${item.checked ? 'text-secondary-500 line-through' : 'text-secondary-700'}`}
                                    >
                                      {item.text}
                                    </label>
                                    
                                    {item.details && item.details.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => toggleItemDetails(item.id)}
                                        className="ml-2 text-primary-600 text-xs"
                                      >
                                        {expandedItems[item.id] ? 'Hide details' : 'Show details'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                
                                {item.details && item.details.length > 0 && expandedItems[item.id] && (
                                  <div className="mt-2 ml-7 text-sm text-secondary-500 border-l-2 border-secondary-200 pl-3">
                                    <ul className="list-disc list-inside space-y-1">
                                      {item.details.map((detail, detailIndex) => (
                                        <li key={`${item.id}-detail-${detailIndex}`}>{detail}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Helper function to render section icons
const renderIcon = (iconName: string) => {
  switch (iconName) {
    case 'lock':
      return (
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    case 'server':
      return (
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      );
    case 'globe':
      return (
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'database':
      return (
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      );
    case 'refresh':
      return (
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    case 'search':
      return (
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      );
    case 'chart':
      return (
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'cog':
      return (
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'brain':
      return (
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    default:
      return (
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
  }
};

// Checklist data function
function getChecklistData(): ChecklistSection[] {
  return [
    {
      title: "Security",
      icon: "lock",
      items: [
        {
          id: "sec-1",
          text: "Secrets Management",
          details: [
            "Replace all default credentials in .env (SECRET_KEY, MYSQL_ROOT_PASSWORD, ADMIN_PASSWORD)",
            "Generate new strong production secrets using a secure generator (min 32 chars for SECRET_KEY)",
            "Implement a secrets rotation policy and schedule",
            "Consider using a vault solution (HashiCorp Vault, AWS Secrets Manager) for production"
          ],
          checked: false
        },
        {
          id: "sec-2",
          text: "CORS Configuration",
          details: [
            "Update CORS_ORIGINS in config.py to only include specific production domains",
            "Fix the CORS configuration in main.py to use the environment variable",
            "Test CORS with production domains to ensure proper functioning"
          ],
          checked: false
        },
        {
          id: "sec-3",
          text: "Authentication & Authorization",
          details: [
            "Verify JWT signing algorithm (HS256 is used - consider more secure alternatives like RS256)",
            "Audit token lifetimes (ACCESS_TOKEN_EXPIRE_MINUTES=30, REFRESH_TOKEN_EXPIRE_DAYS=7)",
            "Test token refresh mechanism under various scenarios",
            "Add JTI (JWT ID) claims to tokens for revocation capabilities",
            "Implement a token blacklist for immediate logout enforcement",
            "Test all role-based access control paths, especially admin routes"
          ],
          checked: false
        },
        {
          id: "sec-4",
          text: "API Protection",
          details: [
            "Review rate limiting configuration (RATE_LIMIT_PER_MINUTE=60, RATE_LIMIT_AUTH_PER_MINUTE=5)",
            "Add IP-based rate limiting for sensitive endpoints",
            "Test rate limiting under load to verify effectiveness",
            "Add request validation with Pydantic models for all endpoints",
            "Implement API key mechanism for system-to-system communication"
          ],
          checked: false
        },
        {
          id: "sec-5",
          text: "Secure Communication",
          details: [
            "Configure SSL/TLS for all connections",
            "Enforce HTTPS via redirect or HSTS headers",
            "Set secure and httpOnly flags on cookies",
            "Add Content-Security-Policy headers",
            "Configure proper SSL certificate monitoring and renewal"
          ],
          checked: false
        },
        {
          id: "sec-6",
          text: "Vulnerability Protection",
          details: [
            "Run dependency security scan (npm audit, safety, Snyk)",
            "Perform static code analysis for security issues",
            "Conduct a penetration test or security audit",
            "Implement a web application firewall",
            "Add protection against common attacks (XSS, CSRF, SQL Injection)"
          ],
          checked: false
        }
      ]
    },
    {
      title: "Backend",
      icon: "server",
      items: [
        {
          id: "be-1",
          text: "Performance Configuration",
          details: [
            "Uncomment Gunicorn settings in Dockerfile for production",
            "Configure worker count based on available CPU (workers = 2*CPU cores + 1)",
            "Set worker timeout to appropriate value (30-60 seconds recommended)",
            "Configure Uvicorn worker class (uvicorn.workers.UvicornWorker)",
            "Test Gunicorn configuration under load"
          ],
          checked: false
        },
        {
          id: "be-2",
          text: "Database Connection",
          details: [
            "Update DATABASE_URL for production environment",
            "Configure connection pool size based on expected load (default is fine for small apps)",
            "Set pool_recycle to match database server settings (currently 3600s)",
            "Test connection stability under load and after network interruptions",
            "Create database user with minimum necessary permissions"
          ],
          checked: false
        },
        {
          id: "be-3",
          text: "API Endpoints",
          details: [
            "Verify all endpoints return appropriate status codes and error messages",
            "Test error handling in all API routes",
            "Add comprehensive request validation",
            "Document API responses for frontend team",
            "Test all pagination implementations with large datasets"
          ],
          checked: false
        },
        {
          id: "be-4",
          text: "Background Processing",
          details: [
            "Add a task queue for resource-intensive operations (e.g., Celery or RQ)",
            "Implement worker processes for async tasks",
            "Configure task retries and error handling",
            "Add monitoring for background tasks",
            "Test task queue performance and reliability"
          ],
          checked: false
        },
        {
          id: "be-5",
          text: "External Services",
          details: [
            "Configure and test email service (SMTP settings) for production",
            "Implement fallback mechanisms for external service failures",
            "Add circuit breakers for external dependencies",
            "Create health checks for external services",
            "Document service dependencies and fallback procedures"
          ],
          checked: false
        }
      ]
    },
    {
      title: "Frontend",
      icon: "globe",
      items: [
        {
          id: "fe-1",
          text: "Build Configuration",
          details: [
            "Uncomment production build commands in frontend Dockerfile",
            "Configure proper NODE_ENV for production",
            "Set NEXT_PUBLIC_API_URL to production endpoint",
            "Test production build functionality",
            "Verify build artifacts size and composition"
          ],
          checked: false
        },
        {
          id: "fe-2",
          text: "Asset Optimization",
          details: [
            "Enable image optimization in next.config.js",
            "Configure proper caching headers for static assets",
            "Implement lazy loading for images and components",
            "Use code splitting for larger components",
            "Verify bundle sizes with source maps"
          ],
          checked: false
        },
        {
          id: "fe-3",
          text: "Authentication Flows",
          details: [
            "Test login with valid and invalid credentials",
            "Verify token refresh works correctly",
            "Test password reset flow end-to-end",
            "Verify email verification process",
            "Test account creation and validation",
            "Check 'remember me' functionality"
          ],
          checked: false
        },
        {
          id: "fe-4",
          text: "User Experience",
          details: [
            "Test all forms for proper validation feedback",
            "Verify loading states and transitions",
            "Check accessibility (ARIA attributes, keyboard navigation, contrast)",
            "Test UI on various browsers (Chrome, Firefox, Safari, Edge)",
            "Verify responsive design on mobile, tablet, and desktop",
            "Add appropriate error pages (404, 500)"
          ],
          checked: false
        },
        {
          id: "fe-5",
          text: "Performance Optimization",
          details: [
            "Implement proper data fetching strategies (SWR is used correctly)",
            "Add appropriate caching for API responses",
            "Optimize component rendering (memoization where needed)",
            "Test with slow network conditions",
            "Run Lighthouse audit and address issues"
          ],
          checked: false
        }
      ]
    },
    {
      title: "Database",
      icon: "database",
      items: [
        {
          id: "db-1",
          text: "Schema Verification",
          details: [
            "Check all table definitions for appropriate column types and sizes",
            "Verify character sets and collations (utf8mb4 is used)",
            "Test database migrations with production-like data",
            "Create schema documentation with diagrams",
            "Review foreign key constraints and cascade settings"
          ],
          checked: false
        },
        {
          id: "db-2",
          text: "Indexing and Performance",
          details: [
            "Add indexes for commonly queried fields (e.g., email, created_at)",
            "Verify composite indexes for filtered queries",
            "Test query performance with EXPLAIN",
            "Set up query monitoring for slow queries",
            "Implement database-level caching strategies if needed"
          ],
          checked: false
        },
        {
          id: "db-3",
          text: "Data Management",
          details: [
            "Configure automated backups with retention policy",
            "Test database restore procedures from backups",
            "Add data archiving strategy for old records",
            "Implement data purging policies for temporary data",
            "Verify cascade deletes work as expected",
            "Test database triggers if implemented"
          ],
          checked: false
        },
        {
          id: "db-4",
          text: "Scaling Preparation",
          details: [
            "Identify potential bottlenecks in schema design",
            "Plan for horizontal scaling if needed",
            "Implement read replicas for read-heavy workloads",
            "Test database failover scenarios",
            "Document scaling strategy for future growth"
          ],
          checked: false
        }
      ]
    },
    {
      title: "DevOps/Infrastructure",
      icon: "refresh",
      items: [
        {
          id: "devops-1",
          text: "Container Configuration",
          details: [
            "Set resource limits in Docker Compose (CPU, memory)",
            "Configure container restart policies",
            "Test container orchestration (Docker Compose or Kubernetes)",
            "Implement proper container health checks",
            "Configure logging drivers for centralized logs"
          ],
          checked: false
        },
        {
          id: "devops-2",
          text: "Monitoring Setup",
          details: [
            "Implement application metrics collection (Prometheus)",
            "Set up monitoring dashboards (Grafana)",
            "Configure alerting based on key metrics",
            "Implement distributed tracing for request flows",
            "Add custom business metrics for KPIs"
          ],
          checked: false
        },
        {
          id: "devops-3",
          text: "CI/CD Pipeline",
          details: [
            "Set up automated testing in CI pipeline",
            "Implement automated deployment for staging/production",
            "Configure environment-specific builds",
            "Implement deployment approvals for production",
            "Add post-deployment smoke tests"
          ],
          checked: false
        },
        {
          id: "devops-4",
          text: "Backup and Recovery",
          details: [
            "Set up automated database backups",
            "Test database restore procedures",
            "Document recovery processes",
            "Implement backup monitoring",
            "Create disaster recovery plan"
          ],
          checked: false
        },
        {
          id: "devops-5",
          text: "Scaling Strategy",
          details: [
            "Configure load balancing if using multiple instances",
            "Test horizontal scaling capabilities",
            "Document scaling procedures",
            "Implement auto-scaling based on metrics",
            "Test system under various load conditions"
          ],
          checked: false
        }
      ]
    },
    {
      title: "Code Quality & Testing",
      icon: "search",
      items: [
        {
          id: "qa-1",
          text: "Automated Testing",
          details: [
            "Add unit tests for critical components and utility functions",
            "Implement integration tests for API endpoints",
            "Create end-to-end tests for critical user flows",
            "Set up browser testing for frontend",
            "Configure test coverage reporting"
          ],
          checked: false
        },
        {
          id: "qa-2",
          text: "Code Quality",
          details: [
            "Run linting across all codebases (ESLint, Flake8)",
            "Configure type checking (mypy for Python, TypeScript for frontend)",
            "Implement pre-commit hooks for quality checks",
            "Review code documentation and comments",
            "Address all TODOs and FIXMEs"
          ],
          checked: false
        },
        {
          id: "qa-3",
          text: "Testing Scenarios",
          details: [
            "Test all user roles and permission combinations",
            "Verify error handling and edge cases",
            "Test with realistic data volumes",
            "Simulate various failure scenarios",
            "Test concurrent operations and race conditions"
          ],
          checked: false
        }
      ]
    },
    {
      title: "Performance",
      icon: "chart",
      items: [
        {
          id: "perf-1",
          text: "Database Optimization",
          details: [
            "Review and optimize slow queries",
            "Add appropriate indexes based on query patterns",
            "Implement query caching where appropriate",
            "Test database performance under load",
            "Monitor database connection usage"
          ],
          checked: false
        },
        {
          id: "perf-2",
          text: "API Performance",
          details: [
            "Implement response caching for suitable endpoints",
            "Add compression for API responses",
            "Optimize serialization/deserialization",
            "Test API throughput under load",
            "Measure and optimize time to first byte"
          ],
          checked: false
        },
        {
          id: "perf-3",
          text: "Frontend Performance",
          details: [
            "Optimize bundle size and code splitting",
            "Implement lazy loading for components and routes",
            "Optimize image loading and rendering",
            "Add caching strategies for API requests",
            "Measure and optimize Core Web Vitals"
          ],
          checked: false
        },
        {
          id: "perf-4",
          text: "Load Testing",
          details: [
            "Simulate expected user load",
            "Test performance degradation under heavy load",
            "Identify bottlenecks through profiling",
            "Create performance baseline for monitoring",
            "Document scaling recommendations based on test results"
          ],
          checked: false
        }
      ]
    },
    {
      title: "Operational Readiness",
      icon: "cog",
      items: [
        {
          id: "ops-1",
          text: "Documentation",
          details: [
            "Create deployment documentation with step-by-step instructions",
            "Document database schema and relationships",
            "Create runbooks for common operational tasks",
            "Document troubleshooting procedures",
            "Create user manuals and admin guides"
          ],
          checked: false
        },
        {
          id: "ops-2",
          text: "Monitoring and Alerting",
          details: [
            "Configure system monitoring (CPU, memory, disk)",
            "Set up application-specific metrics",
            "Define alert thresholds and notification channels",
            "Create monitoring dashboards for key metrics",
            "Test alerting pathways and escalation procedures"
          ],
          checked: false
        },
        {
          id: "ops-3",
          text: "Incident Response",
          details: [
            "Define severity levels for incidents",
            "Create incident response procedures",
            "Set up on-call rotation if applicable",
            "Document post-mortem process",
            "Prepare communication templates for incidents"
          ],
          checked: false
        },
        {
          id: "ops-4",
          text: "Maintenance Procedures",
          details: [
            "Document update and patching procedures",
            "Create database maintenance schedule",
            "Define backup verification procedures",
            "Implement maintenance window procedures",
            "Document rollback processes"
          ],
          checked: false
        }
      ]
    },
    {
      title: "Business Logic and User Experience",
      icon: "brain",
      items: [
        {
          id: "biz-1",
          text: "Feature Verification",
          details: [
            "Test all tool workflows from start to finish",
            "Verify admin functions and reports",
            "Test data visualization components with various datasets",
            "Verify saved progress functionality",
            "Test user onboarding flow"
          ],
          checked: false
        },
        {
          id: "biz-2",
          text: "User Experience",
          details: [
            "Test all error states and messages",
            "Verify loading indicators and transitions",
            "Test with different user personas and scenarios",
            "Gather feedback from test users",
            "Verify browser compatibility"
          ],
          checked: false
        },
        {
          id: "biz-3",
          text: "Additional Features to Consider",
          details: [
            "User activity logging for compliance",
            "Enhanced analytics dashboard",
            "Export functionality for reports and data",
            "Multi-factor authentication",
            "User notification system"
          ],
          checked: false
        }
      ]
    },
    {
      title: "Compliance and Legal",
      icon: "briefcase",
      items: [
        {
          id: "legal-1",
          text: "Compliance",
          details: [
            "Verify GDPR compliance if serving EU users",
            "Implement data export and deletion capabilities",
            "Review cookie policy and consent mechanisms",
            "Document data retention policies",
            "Conduct privacy impact assessment"
          ],
          checked: false
        },
        {
          id: "legal-2",
          text: "Legal Documentation",
          details: [
            "Create or update Terms of Service",
            "Create or update Privacy Policy",
            "Add necessary disclaimers",
            "Document data handling procedures",
            "Verify compliance with industry regulations"
          ],
          checked: false
        },
        {
          id: "legal-3",
          text: "Accessibility",
          details: [
            "Test with screen readers and assistive technologies",
            "Verify keyboard navigation",
            "Check color contrast compliance",
            "Add appropriate ARIA attributes",
            "Create accessibility statement"
          ],
          checked: false
        }
      ]
    }
  ];
}

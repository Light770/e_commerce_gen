'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/apiService';
import { Tool, ToolUsage, SavedProgress } from '@/types/tool';
import { toast } from 'react-hot-toast';

export default function ToolDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [tool, setTool] = useState<Tool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);
  const [currentUsage, setCurrentUsage] = useState<ToolUsage | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated && id) {
      const fetchToolDetails = async () => {
        try {
          setIsLoading(true);
          // Fetch tool details
          const toolResponse = await apiService.get<Tool>(`/tools/${id}`);
          setTool(toolResponse.data);

          // Try to fetch saved progress
          try {
            const progressResponse = await apiService.get<SavedProgress>(`/tools/${id}/saved-progress`);
            setSavedProgress(progressResponse.data);
          } catch (error) {
            // No saved progress is okay
            console.log('No saved progress found');
          }
        } catch (error) {
          console.error('Error fetching tool details:', error);
          toast.error('Failed to load tool details');
        } finally {
          setIsLoading(false);
        }
      };

      fetchToolDetails();
    }
  }, [isAuthenticated, id]);

  const handleSubmit = async (values: any) => {
    try {
      setProcessingStatus('processing');
      
      // Start tool usage
      const startResponse = await apiService.post<ToolUsage>(`/tools/${id}/usage`, { 
        input_data: values 
      });
      const usageId = startResponse.data.id;
      setCurrentUsage(startResponse.data);
      
      // Simulate processing (In a real app, there would be actual processing happening)
      setTimeout(async () => {
        try {
          // Update usage with completed status and results
          const results = { result: "Sample result for demonstration purposes" };
          const updateResponse = await apiService.put<ToolUsage>(`/tools/${id}/usage/${usageId}`, {
            status: 'COMPLETED',
            result_data: results
          });
          
          setCurrentUsage(updateResponse.data);
          setResults(results);
          setProcessingStatus('completed');
          toast.success('Processing completed!');
        } catch (error) {
          console.error('Error updating tool usage:', error);
          setProcessingStatus('failed');
          toast.error('Processing failed');
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error processing tool:', error);
      setProcessingStatus('failed');
      toast.error('Failed to process data');
    }
  };

  const handleSaveProgress = async (values: any) => {
    try {
      const response = await apiService.post(`/tools/${id}/save-progress`, {
        form_data: values
      });
      setSavedProgress(response.data);
      toast.success('Progress saved successfully!');
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="animate-pulse bg-secondary-200 h-8 w-1/4 rounded"></div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-secondary-200 w-1/3 rounded"></div>
                <div className="h-4 bg-secondary-100 w-full rounded"></div>
                <div className="h-4 bg-secondary-100 w-5/6 rounded"></div>
                <div className="h-32 bg-secondary-200 w-full rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!tool) {
    return (
      <Layout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-secondary-900">Tool Not Found</h1>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-secondary-600">The requested tool could not be found.</p>
              <button
                onClick={() => router.push('/tools')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Return to Tools
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // This is a simplified example - in a real application, the form fields would be dynamic based on the tool type
  const initialValues = savedProgress ? savedProgress.form_data : {
    inputText: '',
    options: {
      option1: false,
      option2: false
    }
  };

  const validationSchema = Yup.object().shape({
    inputText: Yup.string().required('Input is required'),
    options: Yup.object().shape({
      option1: Yup.boolean(),
      option2: Yup.boolean()
    })
  });

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-secondary-900">{tool.name}</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                  {getToolIcon(tool.icon)}
                </div>
                <div className="ml-4">
                  <p className="text-secondary-600">{tool.description}</p>
                </div>
              </div>

              {processingStatus === 'completed' ? (
                <div className="mt-8">
                  <h2 className="text-lg font-medium text-secondary-900 mb-4">Results</h2>
                  <div className="bg-secondary-50 p-4 rounded-md">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(results, null, 2)}</pre>
                  </div>
                  <div className="mt-4 flex justify-end space-x-4">
                    <button
                      onClick={() => {
                        setProcessingStatus('idle');
                        setResults(null);
                      }}
                      className="px-4 py-2 border border-secondary-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50"
                    >
                      Start Over
                    </button>
                    <button
                      onClick={() => router.push('/history')}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      View History
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-8">
                  <h2 className="text-lg font-medium text-secondary-900 mb-4">Tool Input</h2>
                  <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                  >
                    {({ values, isSubmitting, resetForm }) => (
                      <Form className="space-y-6">
                        <div>
                          <label htmlFor="inputText" className="block text-sm font-medium text-secondary-700">
                            Input Text
                          </label>
                          <div className="mt-1">
                            <Field
                              as="textarea"
                              id="inputText"
                              name="inputText"
                              rows={4}
                              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-secondary-300 rounded-md"
                              placeholder="Enter your text here..."
                              disabled={processingStatus === 'processing'}
                            />
                            <ErrorMessage
                              name="inputText"
                              component="p"
                              className="mt-2 text-sm text-red-600"
                            />
                          </div>
                        </div>

                        <div>
                          <fieldset>
                            <legend className="text-sm font-medium text-secondary-700">Options</legend>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center">
                                <Field
                                  type="checkbox"
                                  id="options.option1"
                                  name="options.option1"
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                                  disabled={processingStatus === 'processing'}
                                />
                                <label htmlFor="options.option1" className="ml-2 block text-sm text-secondary-700">
                                  Option 1
                                </label>
                              </div>
                              <div className="flex items-center">
                                <Field
                                  type="checkbox"
                                  id="options.option2"
                                  name="options.option2"
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                                  disabled={processingStatus === 'processing'}
                                />
                                <label htmlFor="options.option2" className="ml-2 block text-sm text-secondary-700">
                                  Option 2
                                </label>
                              </div>
                            </div>
                          </fieldset>
                        </div>

                        <div className="flex justify-end space-x-4">
                          {processingStatus !== 'processing' && (
                            <button
                              type="button"
                              onClick={() => handleSaveProgress(values)}
                              className="px-4 py-2 border border-secondary-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50"
                            >
                              Save Progress
                            </button>
                          )}
                          <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                            disabled={processingStatus === 'processing'}
                          >
                            {processingStatus === 'processing' ? (
                              <div className="flex items-center">
                                <svg
                                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Processing...
                              </div>
                            ) : processingStatus === 'failed' ? (
                              'Try Again'
                            ) : (
                              'Process'
                            )}
                          </button>
                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const getToolIcon = (iconName: string) => {
  // Same icon function from the tools page
  switch (iconName) {
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
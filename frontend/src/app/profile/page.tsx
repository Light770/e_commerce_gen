'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/apiService';
import { toast } from 'react-hot-toast';

const ProfileSchema = Yup.object().shape({
  fullName: Yup.string().required('Full name is required'),
  currentPassword: Yup.string().when('newPassword', {
    is: (val: string) => val && val.length > 0,
    then: Yup.string().required('Current password is required to set a new password'),
    otherwise: Yup.string(),
  }),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: Yup.string().when('newPassword', {
    is: (val: string) => val && val.length > 0,
    then: Yup.string()
      .oneOf([Yup.ref('newPassword')], 'Passwords must match')
      .required('Confirm password is required'),
    otherwise: Yup.string(),
  }),
});

export default function ProfilePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      
      const updateData: any = {
        full_name: values.fullName,
      };
      
      if (values.newPassword) {
        updateData.password = values.currentPassword;
        updateData.new_password = values.newPassword;
      }
      
      await apiService.put('/users/me', updateData);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
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
          <h1 className="text-2xl font-semibold text-secondary-900">Profile</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-secondary-900">User Information</h3>
                <p className="mt-1 max-w-2xl text-sm text-secondary-500">Personal details and account settings</p>
              </div>
              <div className="border-t border-secondary-200">
                <Formik
                  initialValues={{
                    fullName: user?.full_name || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  }}
                  validationSchema={ProfileSchema}
                  onSubmit={handleSubmit}
                >
                  {({ errors, touched }) => (
                    <Form className="divide-y divide-secondary-200">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="grid grid-cols-1 gap-6">
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
                              Email address
                            </label>
                            <div className="mt-1 p-2 bg-secondary-100 rounded-md">
                              <p className="text-secondary-900">{user?.email}</p>
                            </div>
                          </div>
                          
                          <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-secondary-700">
                              Full name
                            </label>
                            <div className="mt-1">
                              <Field
                                id="fullName"
                                name="fullName"
                                type="text"
                                className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-secondary-300 rounded-md ${
                                  errors.fullName && touched.fullName ? 'border-red-300' : ''
                                }`}
                              />
                              <ErrorMessage
                                name="fullName"
                                component="p"
                                className="mt-2 text-sm text-red-600"
                              />
                            </div>
                          </div>

                          <div className="pt-6">
                            <h3 className="text-lg font-medium text-secondary-900">Change Password</h3>
                            <p className="mt-1 text-sm text-secondary-500">
                              Only fill these fields if you want to change your password
                            </p>
                          </div>
                          
                          <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-secondary-700">
                              Current password
                            </label>
                            <div className="mt-1">
                              <Field
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-secondary-300 rounded-md ${
                                  errors.currentPassword && touched.currentPassword ? 'border-red-300' : ''
                                }`}
                              />
                              <ErrorMessage
                                name="currentPassword"
                                component="p"
                                className="mt-2 text-sm text-red-600"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-secondary-700">
                              New password
                            </label>
                            <div className="mt-1">
                              <Field
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-secondary-300 rounded-md ${
                                  errors.newPassword && touched.newPassword ? 'border-red-300' : ''
                                }`}
                              />
                              <ErrorMessage
                                name="newPassword"
                                component="p"
                                className="mt-2 text-sm text-red-600"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700">
                              Confirm new password
                            </label>
                            <div className="mt-1">
                              <Field
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-secondary-300 rounded-md ${
                                  errors.confirmPassword && touched.confirmPassword ? 'border-red-300' : ''
                                }`}
                              />
                              <ErrorMessage
                                name="confirmPassword"
                                component="p"
                                className="mt-2 text-sm text-red-600"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 bg-secondary-50 text-right sm:px-6">
                        <button
                          type="submit"
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : null}
                          Save
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
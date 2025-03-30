'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

const RegisterSchema = Yup.object().shape({
  fullName: Yup.string().required('Full name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

export default function RegisterPage() {
  const { register, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  const handleSubmit = async (values: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      setIsSubmitting(true);
      await register(values.email, values.password, values.fullName);
      toast.success('Registration successful! Please check your email to verify your account.');
      router.push('/login');
    } catch (error) {
      // Error is already handled in the auth context
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-secondary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-secondary-600">
          Or{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Formik
            initialValues={{ fullName: '', email: '', password: '', confirmPassword: '' }}
            validationSchema={RegisterSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched }) => (
              <Form className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-secondary-700">
                    Full name
                  </label>
                  <div className="mt-1">
                    <Field
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.fullName && touched.fullName
                          ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                          : 'border-secondary-300 placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500'
                      } rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    />
                    <ErrorMessage
                      name="fullName"
                      component="p"
                      className="mt-2 text-sm text-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.email && touched.email
                          ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                          : 'border-secondary-300 placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500'
                      } rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    />
                    <ErrorMessage
                      name="email"
                      component="p"
                      className="mt-2 text-sm text-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-secondary-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <Field
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.password && touched.password
                          ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                          : 'border-secondary-300 placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500'
                      } rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    />
                    <ErrorMessage
                      name="password"
                      component="p"
                      className="mt-2 text-sm text-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-secondary-700"
                  >
                    Confirm password
                  </label>
                  <div className="mt-1">
                    <Field
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.confirmPassword && touched.confirmPassword
                          ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                          : 'border-secondary-300 placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500'
                      } rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    />
                    <ErrorMessage
                      name="confirmPassword"
                      component="p"
                      className="mt-2 text-sm text-red-600"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
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
                    ) : null}
                    Create account
                  </button>
                </div>
              </Form>
            )}
          </Formik>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-secondary-500">
                  By signing up, you agree to our
                </span>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <Link href="/terms" className="font-medium text-primary-600 hover:text-primary-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-medium text-primary-600 hover:text-primary-500">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
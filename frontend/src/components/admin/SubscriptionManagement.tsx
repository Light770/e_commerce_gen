import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/apiService';
import { SubscriptionPlan } from '@/types/subscription';
import { toast } from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface SubscriptionFormData {
  id?: number;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  tool_limit: number;
  is_active: boolean;
  stripe_price_id_monthly: string;
  stripe_price_id_yearly: string;
}

export default function SubscriptionManagement() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionFormData>({
    name: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    features: [],
    tool_limit: -1,
    is_active: true,
    stripe_price_id_monthly: '',
    stripe_price_id_yearly: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [featuresInput, setFeaturesInput] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get<{data: SubscriptionPlan[]}>('/admin/subscription-plans');
      setPlans(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlan = () => {
    setCurrentPlan({
      name: '',
      description: '',
      price_monthly: 0,
      price_yearly: 0,
      features: [],
      tool_limit: -1,
      is_active: true,
      stripe_price_id_monthly: '',
      stripe_price_id_yearly: ''
    });
    setFeaturesInput('');
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setCurrentPlan({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      features: plan.features,
      tool_limit: plan.tool_limit,
      is_active: plan.is_active,
      stripe_price_id_monthly: plan.stripe_price_id_monthly || '',
      stripe_price_id_yearly: plan.stripe_price_id_yearly || ''
    });
    setFeaturesInput(plan.features.join('\n'));
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleTogglePlanStatus = async (plan: SubscriptionPlan) => {
    try {
      await apiService.put(`/admin/subscription-plans/${plan.id}`, {
        is_active: !plan.is_active
      });
      
      // Update local state
      setPlans(plans.map(p => p.id === plan.id ? {...p, is_active: !plan.is_active} : p));
      
      toast.success(`Plan ${plan.name} ${!plan.is_active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling plan status:', error);
      toast.error('Failed to update plan status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Parse features from textarea
      const features = featuresInput
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      const formData = {
        ...currentPlan,
        features
      };
      
      if (isEditing) {
        // Update existing plan
        await apiService.put(`/admin/subscription-plans/${currentPlan.id}`, formData);
        toast.success('Subscription plan updated');
        
        // Update local state
        setPlans(
          plans.map(plan => 
            plan.id === currentPlan.id
              ? { ...plan, ...formData, features }
              : plan
          )
        );
      } else {
        // Create new plan
        const response = await apiService.post<SubscriptionPlan>('/admin/subscription-plans', formData);
        toast.success('Subscription plan created');
        
        // Update local state
        setPlans([...plans, response.data]);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving subscription plan:', error);
      toast.error('Failed to save subscription plan');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-secondary-900">Subscription Plans</h1>
          <p className="mt-2 text-sm text-secondary-700">
            Manage your subscription plans, pricing, and features.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={handleCreatePlan}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Plan
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-secondary-300">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-secondary-900 sm:pl-6"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-secondary-900"
                      >
                        Monthly Price
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-secondary-900"
                      >
                        Yearly Price
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-secondary-900"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-200 bg-white">
                    {plans.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-secondary-900 sm:pl-6 text-center"
                        >
                          No subscription plans found. Create a new plan to get started.
                        </td>
                      </tr>
                    ) : (
                      plans.map((plan) => (
                        <tr key={plan.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <div>
                                <div className="font-medium text-secondary-900">
                                  {plan.name}
                                </div>
                                <div className="text-secondary-500 max-w-xs truncate">
                                  {plan.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-500">
                            {formatPrice(plan.price_monthly)}/mo
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-500">
                            {formatPrice(plan.price_yearly)}/yr
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-500">
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                plan.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {plan.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => handleEditPlan(plan)}
                              className="text-primary-600 hover:text-primary-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleTogglePlanStatus(plan)}
                              className={`${
                                plan.is_active
                                  ? 'text-red-600 hover:text-red-900'
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {plan.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription plan form modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-secondary-900"
                  >
                    {isEditing ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-6">
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-secondary-700"
                        >
                          Plan Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={currentPlan.name}
                          onChange={(e) =>
                            setCurrentPlan({
                              ...currentPlan,
                              name: e.target.value,
                            })
                          }
                          required
                          className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div className="sm:col-span-6">
                        <label
                          htmlFor="description"
                          className="block text-sm font-medium text-secondary-700"
                        >
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          rows={3}
                          value={currentPlan.description}
                          onChange={(e) =>
                            setCurrentPlan({
                              ...currentPlan,
                              description: e.target.value,
                            })
                          }
                          required
                          className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label
                          htmlFor="price_monthly"
                          className="block text-sm font-medium text-secondary-700"
                        >
                          Monthly Price (USD)
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-secondary-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            name="price_monthly"
                            id="price_monthly"
                            min="0"
                            step="0.01"
                            value={currentPlan.price_monthly}
                            onChange={(e) =>
                              setCurrentPlan({
                                ...currentPlan,
                                price_monthly: parseFloat(e.target.value),
                              })
                            }
                            className="pl-7 block w-full rounded-md border-secondary-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label
                          htmlFor="price_yearly"
                          className="block text-sm font-medium text-secondary-700"
                        >
                          Yearly Price (USD)
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-secondary-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            name="price_yearly"
                            id="price_yearly"
                            min="0"
                            step="0.01"
                            value={currentPlan.price_yearly}
                            onChange={(e) =>
                              setCurrentPlan({
                                ...currentPlan,
                                price_yearly: parseFloat(e.target.value),
                              })
                            }
                            className="pl-7 block w-full rounded-md border-secondary-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <label
                          htmlFor="features"
                          className="block text-sm font-medium text-secondary-700"
                        >
                          Features (one per line)
                        </label>
                        <textarea
                          id="features"
                          name="features"
                          rows={5}
                          value={featuresInput}
                          onChange={(e) => setFeaturesInput(e.target.value)}
                          className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          placeholder="Unlimited access to all tools&#10;Priority support&#10;Advanced analytics"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label
                          htmlFor="tool_limit"
                          className="block text-sm font-medium text-secondary-700"
                        >
                          Tool Usage Limit (-1 for unlimited)
                        </label>
                        <input
                          type="number"
                          name="tool_limit"
                          id="tool_limit"
                          value={currentPlan.tool_limit}
                          onChange={(e) =>
                            setCurrentPlan({
                              ...currentPlan,
                              tool_limit: parseInt(e.target.value),
                            })
                          }
                          className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div className="sm:col-span-3 flex items-center h-full">
                        <div className="flex items-center">
                          <input
                            id="is_active"
                            name="is_active"
                            type="checkbox"
                            checked={currentPlan.is_active}
                            onChange={(e) =>
                              setCurrentPlan({
                                ...currentPlan,
                                is_active: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                          />
                          <label
                            htmlFor="is_active"
                            className="ml-2 block text-sm text-secondary-900"
                          >
                            Active
                          </label>
                        </div>
                      </div>

                      {isEditing && (
                        <>
                          <div className="sm:col-span-3">
                            <label
                              htmlFor="stripe_price_id_monthly"
                              className="block text-sm font-medium text-secondary-700"
                            >
                              Stripe Monthly Price ID
                            </label>
                            <input
                              type="text"
                              name="stripe_price_id_monthly"
                              id="stripe_price_id_monthly"
                              value={currentPlan.stripe_price_id_monthly}
                              onChange={(e) =>
                                setCurrentPlan({
                                  ...currentPlan,
                                  stripe_price_id_monthly: e.target.value,
                                })
                              }
                              className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label
                              htmlFor="stripe_price_id_yearly"
                              className="block text-sm font-medium text-secondary-700"
                            >
                              Stripe Yearly Price ID
                            </label>
                            <input
                              type="text"
                              name="stripe_price_id_yearly"
                              id="stripe_price_id_yearly"
                              value={currentPlan.stripe_price_id_yearly}
                              onChange={(e) =>
                                setCurrentPlan({
                                  ...currentPlan,
                                  stripe_price_id_yearly: e.target.value,
                                })
                              }
                              className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="rounded-md border border-secondary-300 bg-white px-4 py-2 text-sm font-medium text-secondary-700 shadow-sm hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
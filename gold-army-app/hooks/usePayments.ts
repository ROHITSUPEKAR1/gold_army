import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, formatApiError } from '../services/api';
import { useAuthStore } from '../store/auth';

export type PaymentRecord = {
  id: string;
  memberId: string;
  subscriptionId?: string | null;
  amount: number;
  discount: number;
  finalAmount: number;
  method: 'CASH' | 'UPI' | 'CARD' | 'RAZORPAY';
  transactionId?: string | null;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REFUNDED';
  paidAt?: string | null;
  createdAt: string;
  subscription?: {
    plan?: {
      name: string;
    };
    service?: {
      name: string;
    };
  };
  member?: {
    user: {
      name: string;
      phone?: string;
    };
  };
};

export type CreateOrderInput = {
  planId: string;
  serviceId?: string;
  discount?: number;
};

export type CreateOrderResponse = {
  orderId: string;
  paymentId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  planId: string;
  planName: string;
  keyId: string;
};

export type VerifyPaymentInput = {
  orderId: string;
  paymentId: string;
  signature: string;
  planId: string;
  serviceId?: string;
};

/**
 * Fetch payments for current user (member or admin)
 */
export function usePayments() {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: ['payments', session?.user.role],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: PaymentRecord[] }>('/payments');
      return response.data.data;
    },
    enabled: Boolean(session),
  });
}

/**
 * Create server-side order for payment gateway
 */
export function useCreatePaymentOrder() {
  return useMutation({
    mutationFn: async (payload: CreateOrderInput) => {
      try {
        const response = await api.post<{ success: boolean; data: CreateOrderResponse }>(
          '/payments/order',
          payload
        );
        return response.data.data;
      } catch (error) {
        throw new Error(formatApiError(error));
      }
    },
  });
}

/**
 * Verify payment signature and activate subscription
 */
export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: VerifyPaymentInput) => {
      try {
        const response = await api.post<{ success: boolean; data: any }>(
          '/payments/verify',
          payload
        );
        return response.data.data;
      } catch (error) {
        throw new Error(formatApiError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['member', 'membership'] });
      queryClient.invalidateQueries({ queryKey: ['member', 'subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

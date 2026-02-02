import React, { createContext, useState, useEffect } from 'react';

export const PaymentContext = createContext();

export const PAYMENT_METHODS = {
  VNPAY: 'vnpay',
  MOMO: 'momo',
  CASH: 'cash',
  CARD: 'card',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const PAYMENT_TYPES = {
  REGISTRATION: 'registration',
  PACKAGE_SUBSCRIPTION: 'package_subscription',
  PACKAGE_UPGRADE: 'package_upgrade',
  ORDER: 'order',
};

// Initial mock payments
const initialPayments = [];

export const PaymentProvider = ({ children }) => {
  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem('payments');
    return saved ? JSON.parse(saved) : initialPayments;
  });

  // Save to localStorage when payments change
  useEffect(() => {
    localStorage.setItem('payments', JSON.stringify(payments));
  }, [payments]);

  // Create new payment
  const createPayment = (paymentData) => {
    const newPayment = {
      ...paymentData,
      id: Date.now(),
      status: PAYMENT_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPayments(prev => [newPayment, ...prev]);
    return newPayment;
  };

  // Update payment status
  const updatePaymentStatus = (paymentId, status, additionalData = {}) => {
    setPayments(prev =>
      prev.map(payment => {
        if (payment.id === paymentId) {
          return {
            ...payment,
            status,
            ...additionalData,
            updatedAt: new Date().toISOString(),
          };
        }
        return payment;
      })
    );
  };

  // Process VNPay payment (Sandbox simulation)
  const processVNPayPayment = async (paymentData) => {
    const payment = createPayment({
      ...paymentData,
      method: PAYMENT_METHODS.VNPAY,
      status: PAYMENT_STATUS.PROCESSING,
    });

    // Simulate VNPay redirect
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 90% success rate for demo
        const isSuccess = Math.random() > 0.1;
        if (isSuccess) {
          const transactionId = `VNP${Date.now()}`;
          updatePaymentStatus(payment.id, PAYMENT_STATUS.SUCCESS, {
            transactionId,
            transactionDate: new Date().toISOString(),
          });
          resolve({ 
            success: true, 
            details: {
              transactionId,
              method: 'VNPay',
              paidAt: new Date().toISOString(),
            }
          });
        } else {
          updatePaymentStatus(payment.id, PAYMENT_STATUS.FAILED, {
            error: 'Giao dịch thất bại',
          });
          resolve({ success: false, error: 'Giao dịch thất bại' });
        }
      }, 2000);
    });
  };

  // Process MoMo payment (Sandbox simulation)
  const processMoMoPayment = async (paymentData) => {
    const payment = createPayment({
      ...paymentData,
      method: PAYMENT_METHODS.MOMO,
      status: PAYMENT_STATUS.PROCESSING,
    });

    // Simulate MoMo redirect
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 90% success rate for demo
        const isSuccess = Math.random() > 0.1;
        if (isSuccess) {
          const transactionId = `MOMO${Date.now()}`;
          updatePaymentStatus(payment.id, PAYMENT_STATUS.SUCCESS, {
            transactionId,
            transactionDate: new Date().toISOString(),
          });
          resolve({ 
            success: true,
            details: {
              transactionId,
              method: 'MoMo',
              paidAt: new Date().toISOString(),
            }
          });
        } else {
          updatePaymentStatus(payment.id, PAYMENT_STATUS.FAILED, {
            error: 'Giao dịch thất bại',
          });
          resolve({ success: false, error: 'Giao dịch thất bại' });
        }
      }, 2000);
    });
  };

  // Get payments by user
  const getPaymentsByUser = (userId) => {
    return payments.filter(p => p.userId === userId);
  };

  // Get payments by restaurant
  const getPaymentsByRestaurant = (restaurantId) => {
    return payments.filter(p => p.restaurantId === restaurantId);
  };

  // Get payment by ID
  const getPaymentById = (paymentId) => {
    return payments.find(p => p.id === paymentId);
  };

  // Get pending payments (for admin)
  const getPendingPayments = () => {
    return payments.filter(p => p.status === PAYMENT_STATUS.PENDING);
  };

  // Get successful payments (for admin)
  const getSuccessfulPayments = () => {
    return payments.filter(p => p.status === PAYMENT_STATUS.SUCCESS);
  };

  // Get payment statistics
  const getPaymentStatistics = () => {
    const total = payments.length;
    const successful = payments.filter(p => p.status === PAYMENT_STATUS.SUCCESS).length;
    const pending = payments.filter(p => p.status === PAYMENT_STATUS.PENDING).length;
    const failed = payments.filter(p => p.status === PAYMENT_STATUS.FAILED).length;
    const totalRevenue = payments
      .filter(p => p.status === PAYMENT_STATUS.SUCCESS)
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      total,
      successful,
      pending,
      failed,
      totalRevenue,
      successRate: total > 0 ? ((successful / total) * 100).toFixed(1) : 0,
    };
  };

  // QR Settings management
  const [qrSettings, setQRSettings] = useState(() => {
    const saved = localStorage.getItem('qrSettings');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('qrSettings', JSON.stringify(qrSettings));
  }, [qrSettings]);

  const getQRSettings = (restaurantId) => {
    return qrSettings[restaurantId] || null;
  };

  const updateQRSettings = (restaurantId, settings) => {
    setQRSettings(prev => ({
      ...prev,
      [restaurantId]: {
        ...prev[restaurantId],
        ...settings,
        restaurantId,
        updatedAt: new Date().toISOString(),
      }
    }));
  };

  const value = {
    payments,
    createPayment,
    updatePaymentStatus,
    processVNPayPayment,
    processMoMoPayment,
    getPaymentsByUser,
    getPaymentsByRestaurant,
    getPaymentById,
    getPendingPayments,
    getSuccessfulPayments,
    getPaymentStatistics,
    getQRSettings,
    updateQRSettings,
    PAYMENT_METHODS,
    PAYMENT_STATUS,
    PAYMENT_TYPES,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

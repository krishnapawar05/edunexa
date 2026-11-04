/**
 * Razorpay Checkout SDK dynamic script loader and wrapper.
 */

export interface RazorpaySuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpaySuccessPayload) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, any>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    confirm_close?: boolean;
    escape?: boolean;
  };
}

/**
 * Loads checkout.razorpay.com/v1/checkout.js dynamically if not already in DOM.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Open Razorpay Checkout modal with Promise-based result.
 */
export async function launchRazorpayModal(options: Omit<RazorpayOptions, 'handler' | 'modal'> & {
  onDismiss?: () => void;
}): Promise<RazorpaySuccessPayload> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !(window as any).Razorpay) {
    throw new Error('Unable to initialize Razorpay SDK. Please check your internet connectivity.');
  }

  return new Promise((resolve, reject) => {
    let resolved = false;

    const checkoutOptions: RazorpayOptions = {
      ...options,
      handler: (response: RazorpaySuccessPayload) => {
        resolved = true;
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          if (!resolved) {
            if (options.onDismiss) options.onDismiss();
            reject(new Error('Payment checkout was cancelled by the user.'));
          }
        },
        escape: true,
      },
    };

    try {
      const rzp = new (window as any).Razorpay(checkoutOptions);
      rzp.on('payment.failed', (response: any) => {
        const errorMsg =
          response?.error?.description || response?.error?.reason || 'Transaction could not be completed.';
        reject(new Error(errorMsg));
      });
      rzp.open();
    } catch (err: any) {
      reject(new Error(err?.message || 'Failed to open Razorpay modal'));
    }
  });
}


// Squad Payment SDK Type Definitions

interface SquadInstance {
  setup: () => void;
  open: () => void;
}

declare global {
  interface Window {
    squad: new (config: {
      onClose: () => void;
      onLoad: () => void;
      onSuccess: (response: any) => void;
      key: string;
      email: string;
      amount: number;
      currency_code: string;
      transaction_ref?: string;
      payment_channels?: string[];
      customer_name?: string;
      callback_url?: string;
      metadata?: Record<string, any>;
      pass_charge?: boolean;
    }) => SquadInstance;
  }
}

export {};


/* eslint-disable @typescript-eslint/no-explicit-any */
// Declaración global para Google Identity
interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: any) => void;
        }) => void;
        renderButton: (
          parent: HTMLElement,
          options: Record<string, any>
        ) => void;
        prompt: () => void;
      };
    };
  };
}

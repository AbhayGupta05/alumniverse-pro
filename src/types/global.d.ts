declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
      isMetaMask?: boolean;
      isConnected?: () => boolean;
      selectedAddress?: string;
      chainId?: string;
      networkVersion?: string;
    };
    web3?: any;
    AFRAME?: any;
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    'a-scene': any
    'a-entity': any
    'a-box': any
    'a-sphere': any
    'a-plane': any
    'a-sky': any
    'a-light': any
    'a-camera': any
    'a-cursor': any
    'a-text': any
    'a-sound': any
    'a-assets': any
    'a-asset-item': any
    'a-image': any
    'a-video': any
  }
}

export {};
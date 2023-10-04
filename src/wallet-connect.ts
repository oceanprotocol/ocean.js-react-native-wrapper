import type { IProviderMetadata } from '@walletconnect/modal-react-native';
import type { ISessionParams } from '@walletconnect/modal-react-native/src/types/coreTypes';

import config from './config';

export const providerMetadata: IProviderMetadata = {
  name: 'OceanJs React Native',
  description: 'OceanJs React Native',
  url: 'https://docs.oceanprotocol.com/',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
  redirect: {
    native: 'oceanjsreactnative://',
  },
};

export const sessionParams: ISessionParams = {
  namespaces: {
    eip155: {
      methods: ['eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData'],
      chains: [`eip155:${config.network.chainId}`],
      events: ['chainChanged', 'accountsChanged'],
      rpcMap: {
        [config.network.chainId]: config.network.rpcUrl,
      },
    },
  },
};

export const PROJECT_ID = process.env.EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

import { Magic } from '@magic-sdk/react-native-expo';

import config from './config';

const customNodeOptions = {
  rpcUrl: config.network.rpcUrl,
  chainId: config.network.chainId,
};

const magic = new Magic(process.env.EXPO_PUBLIC_MAGIC_API_KEY || '', {
  network: customNodeOptions,
});

export default magic;

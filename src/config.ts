export type ConfigType = {
  network: {
    chainId: number;
    rpcUrl: string;
  };
};

const config: ConfigType = {
  network: {
    chainId: parseInt(process.env.EXPO_PUBLIC_CHAIN_ID || '', 10),
    rpcUrl: process.env.EXPO_PUBLIC_RPC_URL || '',
  },
};

export default config;

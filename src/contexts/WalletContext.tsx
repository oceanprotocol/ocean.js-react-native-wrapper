import { createContext, ReactElement, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useWalletConnectModal } from '@walletconnect/modal-react-native';

import magic from '../magic';
import { ethers } from 'ethers';

import { WalletConnectionMethodEnum } from '../consts/wallet-connection-method-enum';
import {
  deleteWalletConnectionMethod,
  getWalletConnectionMethod,
  setWalletConnectionMethod,
} from '../utils/async-storage';

type WalletContextType = {
  connectionMethod: WalletConnectionMethodEnum | undefined;
  isConnected: boolean;
  web3Provider: ethers.providers.Web3Provider | undefined;
  onConnect: (method: WalletConnectionMethodEnum) => Promise<void>;
  onDisconnect: () => Promise<void>;
  manageWallet: () => Promise<void>;
};

export const WalletContext = createContext<WalletContextType>({} as WalletContextType);

export function WalletContextProvider({ children }: { children: ReactNode }): ReactElement {
  const [connectionMethod, setConnectionMethod] = useState<WalletConnectionMethodEnum>();
  const [isConnectedMagicLink, setIsConnectedMagicLink] = useState(false);
  const [magicLinkProvider, setMagicLinkProvider] = useState();

  const {
    isConnected: isConnectedWalletConnect,
    provider: walletConnectProvider,
    open: openWalletConnect,
  } = useWalletConnectModal();

  const isConnected = useMemo(() => {
    if (!connectionMethod) {
      return false;
    }

    return connectionMethod === WalletConnectionMethodEnum.MagicLink ? isConnectedMagicLink : isConnectedWalletConnect;
  }, [connectionMethod, isConnectedMagicLink, isConnectedWalletConnect]);

  const web3Provider = useMemo(() => {
    if (!isConnected) {
      return;
    }

    let provider;
    if (connectionMethod === WalletConnectionMethodEnum.MagicLink) {
      provider = magicLinkProvider;
    }
    if (connectionMethod === WalletConnectionMethodEnum.WalletConnect) {
      provider = walletConnectProvider;
    }

    return provider ? new ethers.providers.Web3Provider(provider) : undefined;
  }, [connectionMethod, isConnected, magicLinkProvider, walletConnectProvider]);

  const onConnect = useCallback(
    async (method: WalletConnectionMethodEnum) => {
      try {
        if (method === WalletConnectionMethodEnum.MagicLink) {
          console.log('before');
          await magic.wallet.connectWithUI();
          console.log('after');
          const provider = await magic.wallet.getProvider();
          setMagicLinkProvider(provider);
          setIsConnectedMagicLink(true);
        }
        if (method === WalletConnectionMethodEnum.WalletConnect) {
          await openWalletConnect();
        }

        await setWalletConnectionMethod(method);
        setConnectionMethod(method);
      } catch (error) {
        console.log(error);
      }
    },
    [openWalletConnect],
  );

  const onDisconnect = useCallback(async () => {
    try {
      if (connectionMethod === WalletConnectionMethodEnum.MagicLink) {
        await magic.user.logout();
        setMagicLinkProvider(undefined);
        setIsConnectedMagicLink(false);
      }
      if (connectionMethod === WalletConnectionMethodEnum.WalletConnect) {
        await walletConnectProvider?.disconnect();
      }

      await deleteWalletConnectionMethod();
      setConnectionMethod(undefined);
    } catch (error) {
      console.log(error);
    }
  }, [connectionMethod, walletConnectProvider]);

  const manageWallet = useCallback(async () => {
    try {
      await magic.wallet.showUI();
    } catch (error) {
      console.log(error);
    }
  }, []);

  const init = useCallback(async () => {
    const asyncStorageConnectionMethod = await getWalletConnectionMethod();
    if (!asyncStorageConnectionMethod) {
      return;
    }

    if (asyncStorageConnectionMethod === WalletConnectionMethodEnum.MagicLink) {
      const [isLoggedIn, providerResult] = await Promise.all([magic.user.isLoggedIn(), magic.wallet.getProvider()]);
      setIsConnectedMagicLink(isLoggedIn);
      setMagicLinkProvider(providerResult);
    }

    setConnectionMethod(asyncStorageConnectionMethod);
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const value: WalletContextType = useMemo(
    () => ({
      connectionMethod,
      isConnected,
      web3Provider,
      onConnect,
      onDisconnect,
      manageWallet,
    }),
    [connectionMethod, isConnected, web3Provider, onConnect, onDisconnect, manageWallet],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export const useWalletContext = (): WalletContextType => {
  return useContext(WalletContext);
};

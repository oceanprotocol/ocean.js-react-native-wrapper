import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WalletConnectionMethodEnum } from '../consts/wallet-connection-method-enum';
import { AsyncStorageEnum } from '../consts/async-storage-enum';

export const getWalletConnectionMethod = async (): Promise<WalletConnectionMethodEnum | undefined> => {
  try {
    return (await AsyncStorage.getItem(AsyncStorageEnum.WalletConnectionMethod)) as WalletConnectionMethodEnum;
  } catch (error) {
    console.log(error);
  }
};

export const setWalletConnectionMethod = async (value: WalletConnectionMethodEnum) => {
  try {
    await AsyncStorage.setItem(AsyncStorageEnum.WalletConnectionMethod, value);
  } catch (error) {
    console.log(error);
  }
};

export const deleteWalletConnectionMethod = async () => {
  try {
    await AsyncStorage.removeItem(AsyncStorageEnum.WalletConnectionMethod);
  } catch (error) {
    console.log(error);
  }
};

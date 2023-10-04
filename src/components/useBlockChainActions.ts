import { ethers } from 'ethers';
import {
  approve,
  Asset,
  balance,
  Datatoken,
  Dispenser,
  FixedRateExchange,
  FreOrderParams,
  OrderParams,
  ProviderFees,
  ProviderInstance,
} from '@oceanprotocol/lib';
import { useCallback, useEffect, useState } from 'react';

import {
  aquarius,
  DATA_TOKEN_AMOUNT,
  ENTERPRISE_FIXED_RATE_ASSET_DID,
  ENTERPRISE_FREE_ASSET_DID,
  FIXED_RATE_ASSET_DID,
  FREE_ASSET_DID,
  oceanConfig,
} from '../ocean';
import type { AccountAction, RpcRequestParams } from '../types/methods';
import { AssetTypeEnum } from '../types/asset-type-enum';
import Toast from 'react-native-toast-message';

export function useBlockChainActions() {
  const [loading, setLoading] = useState(false);
  const [fixedRateAsset, setFixedRateAsset] = useState<Asset>();
  const [enterpriseFixedRateAsset, setEnterpriseFixedRateAsset] = useState<Asset>();
  const [freeAsset, setFreeAsset] = useState<Asset>();
  const [enterpriseFreeAsset, setEnterpriseFreeAsset] = useState<Asset>();
  const [dataTokenInProgress, setDataTokenInProgress] = useState<string>();

  const getFixedRateExchange = useCallback((signer: ethers.providers.JsonRpcSigner) => {
    return new FixedRateExchange(oceanConfig.fixedRateExchangeAddress!, signer);
  }, []);

  const getDataTokenExchangeId = useCallback(
    async (signer: ethers.providers.JsonRpcSigner, dataTokenAddress: string) => {
      return getFixedRateExchange(signer).generateExchangeId(oceanConfig.oceanTokenAddress!, dataTokenAddress);
    },
    [getFixedRateExchange],
  );

  const approveContract = useCallback(
    async (web3Provider: ethers.providers.Web3Provider, dataTokenAddress: string, contractAddress: string) => {
      const signer = web3Provider.getSigner();
      const address = await web3Provider.getSigner().getAddress();

      const fixedRateExchange = getFixedRateExchange(signer);
      const exchangeId = await getDataTokenExchangeId(signer, dataTokenAddress);

      // Calculate OCEAN amount to buy data token
      const priceInfo = await fixedRateExchange.calcBaseInGivenDatatokensOut(exchangeId, DATA_TOKEN_AMOUNT);
      const oceanAmount = priceInfo.baseTokenAmount;

      // Approve contract to buy data token
      const approveResult = await approve(
        signer,
        oceanConfig,
        address,
        oceanConfig.oceanTokenAddress!,
        contractAddress,
        oceanAmount,
      );
      if (!approveResult) {
        throw new Error('Approve contract failed');
      }

      if (typeof approveResult !== 'number') {
        await approveResult.wait(1);
      }

      return oceanAmount;
    },
    [getDataTokenExchangeId, getFixedRateExchange],
  );

  const displayBalances = useCallback(async (web3Provider: ethers.providers.Web3Provider, dataTokenAddress: string) => {
    const signer = web3Provider.getSigner();
    const address = await web3Provider.getSigner().getAddress();

    const consumerBalance = await web3Provider.getBalance(address);
    const consumerETHBalance = ethers.utils.formatEther(consumerBalance);
    console.log(`Consumer ETH balance: ${consumerETHBalance}`);

    const consumerOCEANBalance = await balance(signer, oceanConfig.oceanTokenAddress!, address);
    console.log(`Consumer OCEAN balance: ${consumerOCEANBalance}`);

    const consumerDTBalance = await balance(signer, dataTokenAddress, address);
    console.log(`Consumer DataToken balance: ${consumerDTBalance}`);
  }, []);

  const buyDataToken = useCallback(
    async (web3Provider: ethers.providers.Web3Provider, dataTokenAddress: string, assetType: AssetTypeEnum) => {
      const signer = web3Provider.getSigner();
      const address = await web3Provider.getSigner().getAddress();
      const dataTokenAmount = '1';

      console.log('Balances before:');
      await displayBalances(web3Provider, dataTokenAddress);

      if (assetType === AssetTypeEnum.FIXED_RATE) {
        const oceanAmount = await approveContract(
          web3Provider,
          dataTokenAddress,
          oceanConfig.fixedRateExchangeAddress!,
        );

        const fixedRateExchange = getFixedRateExchange(signer);
        const exchangeId = await getDataTokenExchangeId(signer, dataTokenAddress);

        const buyTx = await fixedRateExchange.buyDatatokens(exchangeId, dataTokenAmount, oceanAmount);
        if (!buyTx) {
          throw new Error('Buy data token failed');
        }

        await buyTx.wait(1);
      }

      if (assetType === AssetTypeEnum.FREE) {
        const dispenser = new Dispenser(oceanConfig.dispenserAddress!, signer);

        const dispenseTx = await dispenser.dispense(dataTokenAddress, dataTokenAmount, address);
        if (!dispenseTx) {
          throw new Error('Dispense data token failed');
        }

        await dispenseTx.wait(1);
      }

      console.log('Balances after:');
      await displayBalances(web3Provider, dataTokenAddress);
    },
    [approveContract, displayBalances, getDataTokenExchangeId, getFixedRateExchange],
  );

  const getProviderFees = useCallback(
    async (address: string, dataTokenAddress: string, asset: Asset): Promise<ProviderFees> => {
      const service = asset!.services.find((current) => current.datatokenAddress === dataTokenAddress)!;

      const initializeData = await ProviderInstance.initialize(
        asset.id,
        service.id,
        0,
        address,
        service.serviceEndpoint,
      );

      return {
        providerFeeAddress: initializeData.providerFee.providerFeeAddress,
        providerFeeToken: initializeData.providerFee.providerFeeToken,
        providerFeeAmount: initializeData.providerFee.providerFeeAmount,
        v: initializeData.providerFee.v,
        r: initializeData.providerFee.r,
        s: initializeData.providerFee.s,
        providerData: initializeData.providerFee.providerData,
        validUntil: initializeData.providerFee.validUntil,
      };
    },
    [],
  );

  const createOrder = useCallback(
    async (web3Provider: ethers.providers.Web3Provider, dataTokenAddress: string, assetType: AssetTypeEnum) => {
      const signer = web3Provider.getSigner();
      const address = await web3Provider.getSigner().getAddress();

      let asset = fixedRateAsset!;
      if (assetType === AssetTypeEnum.FREE) {
        asset = freeAsset!;
      }

      const datatoken = new Datatoken(signer);
      const providerFees: ProviderFees = await getProviderFees(address, dataTokenAddress, asset);

      const tx = await datatoken.startOrder(dataTokenAddress, address, 0, providerFees);
      if (!tx) {
        throw new Error('Create order failed');
      }

      await tx.wait(1);
    },
    [fixedRateAsset, freeAsset, getProviderFees],
  );

  const createEnterpriseOrder = useCallback(
    async (
      web3Provider: ethers.providers.Web3Provider,
      dataTokenAddress: string,
      assetType: AssetTypeEnum,
      oceanAmount?: string,
    ) => {
      const signer = web3Provider.getSigner();
      const address = await web3Provider.getSigner().getAddress();

      let asset = enterpriseFixedRateAsset!;
      if (assetType === AssetTypeEnum.FREE) {
        asset = enterpriseFreeAsset!;
      }

      const providerFees = await getProviderFees(address, dataTokenAddress, asset);
      const orderParams: OrderParams = {
        consumer: address,
        serviceIndex: 0,
        _providerFee: providerFees,
        _consumeMarketFee: {
          consumeMarketFeeAddress: ethers.constants.AddressZero,
          consumeMarketFeeToken: ethers.constants.AddressZero,
          consumeMarketFeeAmount: '0',
        },
      };

      const datatoken = new Datatoken(signer);

      if (assetType === AssetTypeEnum.FIXED_RATE) {
        const exchangeId = await getDataTokenExchangeId(signer, dataTokenAddress);

        const freParams: FreOrderParams = {
          exchangeContract: oceanConfig.fixedRateExchangeAddress!,
          exchangeId,
          maxBaseTokenAmount: oceanAmount || '1',
          baseTokenAddress: oceanConfig.oceanTokenAddress!,
          baseTokenDecimals: 18,
          swapMarketFee: '0',
          marketFeeAddress: ethers.constants.AddressZero,
        };

        const tx = await datatoken.buyFromFreAndOrder(dataTokenAddress, orderParams, freParams);
        if (!tx) {
          throw new Error('Buy from fixed rate exchange & create order failed');
        }

        await tx.wait(1);
      }

      if (assetType === AssetTypeEnum.FREE) {
        const tx = await datatoken.buyFromDispenserAndOrder(
          dataTokenAddress,
          orderParams,
          oceanConfig.dispenserAddress!,
        );
        if (!tx) {
          throw new Error('Buy from dispenser & create order failed');
        }

        await tx.wait(1);
      }
    },
    [enterpriseFixedRateAsset, enterpriseFreeAsset, getDataTokenExchangeId, getProviderFees],
  );

  const wrapRpcRequest = useCallback(
    (
      dataTokenAddress: string,
      assetType: AssetTypeEnum,
      rpcRequest: (params: RpcRequestParams) => Promise<string>,
      web3Provider?: ethers.providers.Web3Provider,
    ) =>
      async () => {
        if (!web3Provider) {
          console.error('web3Provider not defined');
          return;
        }

        setLoading(true);
        setDataTokenInProgress(dataTokenAddress);

        try {
          await rpcRequest({ web3Provider, dataTokenAddress, assetType });
          Toast.show({
            type: 'success',
            text1: 'Service bought with success!',
          });
        } catch (error: any) {
          console.error('Request failed:', error);
          Toast.show({
            type: 'error',
            text1: 'Request failed!',
          });
        } finally {
          setLoading(false);
          setDataTokenInProgress(undefined);
        }
      },
    [],
  );

  const buyService = useCallback(
    async ({ web3Provider, dataTokenAddress, assetType }: RpcRequestParams): Promise<string> => {
      if (!web3Provider) {
        throw new Error('web3Provider not connected');
      }

      await buyDataToken(web3Provider, dataTokenAddress, assetType);

      await createOrder(web3Provider, dataTokenAddress, assetType);

      return 'Service bought with success!';
    },
    [buyDataToken, createOrder],
  );

  const buyEnterpriseService = useCallback(
    async ({ web3Provider, dataTokenAddress, assetType }: RpcRequestParams): Promise<string> => {
      if (!web3Provider) {
        throw new Error('web3Provider not connected');
      }

      let oceanAmount;
      if (assetType === AssetTypeEnum.FIXED_RATE) {
        oceanAmount = await approveContract(web3Provider, dataTokenAddress, dataTokenAddress);
      }

      await createEnterpriseOrder(web3Provider, dataTokenAddress, assetType, oceanAmount);

      return 'Service bought with success!';
    },
    [approveContract, createEnterpriseOrder],
  );

  const getFixedRateActions = useCallback(
    (web3Provider?: ethers.providers.Web3Provider) => {
      const actions: AccountAction[] = [];

      if (fixedRateAsset) {
        for (const dataTokenInfo of fixedRateAsset.datatokens) {
          actions.push({
            dataToken: dataTokenInfo.address,
            title: `Buy service ${dataTokenInfo.name}`,
            callback: wrapRpcRequest(dataTokenInfo.address, AssetTypeEnum.FIXED_RATE, buyService, web3Provider),
          });
        }
      }

      return actions;
    },
    [buyService, fixedRateAsset, wrapRpcRequest],
  );

  const getFreeActions = useCallback(
    (web3Provider?: ethers.providers.Web3Provider) => {
      const actions: AccountAction[] = [];

      if (freeAsset) {
        for (const dataTokenInfo of freeAsset.datatokens) {
          actions.push({
            dataToken: dataTokenInfo.address,
            title: `Buy service ${dataTokenInfo.name}`,
            callback: wrapRpcRequest(dataTokenInfo.address, AssetTypeEnum.FREE, buyService, web3Provider),
          });
        }
      }

      return actions;
    },
    [buyService, freeAsset, wrapRpcRequest],
  );

  const getEnterpriseFixedRateActions = useCallback(
    (web3Provider?: ethers.providers.Web3Provider) => {
      const actions: AccountAction[] = [];

      if (enterpriseFixedRateAsset) {
        for (const dataTokenInfo of enterpriseFixedRateAsset.datatokens) {
          actions.push({
            dataToken: dataTokenInfo.address,
            title: `Buy service ${dataTokenInfo.name}`,
            callback: wrapRpcRequest(
              dataTokenInfo.address,
              AssetTypeEnum.FIXED_RATE,
              buyEnterpriseService,
              web3Provider,
            ),
          });
        }
      }

      return actions;
    },
    [buyEnterpriseService, enterpriseFixedRateAsset, wrapRpcRequest],
  );

  const getEnterpriseFreeActions = useCallback(
    (web3Provider?: ethers.providers.Web3Provider) => {
      const actions: AccountAction[] = [];

      if (enterpriseFreeAsset) {
        for (const dataTokenInfo of enterpriseFreeAsset.datatokens) {
          actions.push({
            dataToken: dataTokenInfo.address,
            title: `Buy service ${dataTokenInfo.name}`,
            callback: wrapRpcRequest(dataTokenInfo.address, AssetTypeEnum.FREE, buyEnterpriseService, web3Provider),
          });
        }
      }

      return actions;
    },
    [buyEnterpriseService, enterpriseFreeAsset, wrapRpcRequest],
  );

  const loadFixedRateAsset = useCallback(async () => {
    if (FIXED_RATE_ASSET_DID) {
      setFixedRateAsset(await aquarius.resolve(FIXED_RATE_ASSET_DID));
    }
  }, []);

  const loadEnterpriseFixedRateAsset = useCallback(async () => {
    if (ENTERPRISE_FIXED_RATE_ASSET_DID) {
      setEnterpriseFixedRateAsset(await aquarius.resolve(ENTERPRISE_FIXED_RATE_ASSET_DID));
    }
  }, []);

  const loadFreeAsset = useCallback(async () => {
    if (FREE_ASSET_DID) {
      setFreeAsset(await aquarius.resolve(FREE_ASSET_DID));
    }
  }, []);

  const loadEnterpriseFreeAsset = useCallback(async () => {
    if (ENTERPRISE_FREE_ASSET_DID) {
      setEnterpriseFreeAsset(await aquarius.resolve(ENTERPRISE_FREE_ASSET_DID));
    }
  }, []);

  useEffect(() => {
    loadFixedRateAsset();
    loadEnterpriseFixedRateAsset();
    loadFreeAsset();
    loadEnterpriseFreeAsset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loading,
    getFixedRateActions,
    getFreeActions,
    getEnterpriseFixedRateActions,
    getEnterpriseFreeActions,
    dataTokenInProgress,
  };
}

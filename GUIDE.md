# How to Build a React Native Dapp with Ocean.js

The following guide runs you through the process of building a simple React Native dapp that connects a wallet with **WalletConnect** or **Magic Link** and uses the **Ocean.js** library to buy assets.

## Contents

- [Prerequisites](#prerequisites)
- [Create a new Expo project with Typescript](#create-a-new-expo-project-with-typescript)
- [Connect a wallet](#connect-a-wallet)
  - [Option 1: WalletConnect](#option-1-walletconnect)
  - [Option 2: Magic Link](#option-2-magic-link)
- [Create a Web3 provider](#create-a-web3-provider)
- [Add Ocean.js](#add-oceanjs)
- [Buy an asset](#buy-an-asset)
  - [Preparation](#preparation)
  - [Asset types](#asset-types)
  - [Buy a fixed rate asset (Template 1)](#buy-a-fixed-rate-asset-template-1)
  - [Buy a fixed rate asset (Template 2)](#buy-a-fixed-rate-asset-template-2)
  - [Buy a free asset (Template 1)](#buy-a-free-asset-template-1)
  - [Buy a free asset (Template 2)](#buy-a-free-asset-template-2)
- [Test the app](#test-the-app)

## Prerequisites
- node.js ([Install from here](https://nodejs.org/en/download/)).
- phone (Android or iOS) with **Expo Go** installed.

## Create a new Expo project with Typescript

```bash
$ npx create-expo-app <your_project_name> -t expo-template-blank-typescript
$ cd <your_project_name>
```

## Connect a wallet

### Option 1: WalletConnect

1. Register on [WalletConnect](https://cloud.walletconnect.com/sign-up) and create a project. We'll need the Project ID later.

2. Install dependencies:

```bash
$ npx expo install @walletconnect/modal-react-native
$ npx expo install @react-native-async-storage/async-storage react-native-modal react-native-svg
```

Because of this [bug](https://github.com/expo/expo/issues/17270) we need to add the following in `package.json`:

```
"expo": {
    "install": {
      "exclude": [
        "react-native-get-random-values"
      ]
    }
},
```

and install `react-native-get-random-values`:

```bash
$ npm install react-native-get-random-values
```

3. Create a `.env` file and add the following:

```dotenv
EXPO_PUBLIC_CHAIN_ID=
EXPO_PUBLIC_RPC_URL=
EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID=
```

4. Add a Home screen

Create a simple file `Home.tsx` in `src/screens/` and add the following:

```typescript jsx
import { StyleSheet, Text, View } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text>Hello World</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

Export the Home screen in `App.tsx`:
```typescript jsx
export { default } from './src/screens/Home';
```

5. Add `WalletConnectModal`

Open `Home.tsx` and render `WalletConnectModal`. Add your project's info in `providerMetadata`.

```typescript jsx
import { IProviderMetadata, WalletConnectModal } from '@walletconnect/modal-react-native';
import { ISessionParams } from '@walletconnect/modal-react-native/lib/typescript/src/types/coreTypes';
import { SafeAreaView } from 'react-native';

const chainId = parseInt(process.env.EXPO_PUBLIC_CHAIN_ID || '', 10);
const rpcUrl = process.env.EXPO_PUBLIC_RPC_URL || '';
const projectId = process.env.EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

const providerMetadata: IProviderMetadata = {
  name: 'YOUR_PROJECT_NAME',
  description: 'YOUR_PROJECT_DESCRIPTION',
  url: 'https://your-project-website.com/',
  icons: ['https://your-project-logo.com/'],
  redirect: {
    native: 'YOUR_APP_SCHEME://',
    universal: 'YOUR_APP_UNIVERSAL_LINK.com',
  },
};

export const sessionParams: ISessionParams = {
  namespaces: {
    eip155: {
      methods: ['eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData'],
      chains: [`eip155:${chainId}`],
      events: ['chainChanged', 'accountsChanged'],
      rpcMap: {
        [chainId]: rpcUrl,
      },
    },
  },
};

export default function Home() {
  return (
    <SafeAreaView>
      <WalletConnectModal projectId={projectId} providerMetadata={providerMetadata} sessionParams={sessionParams} />
    </SafeAreaView>
  );
}
```

6. Add the `Connect` & `Disconnect` buttons

We start by calling `useWalletConnectModal` hook to get the necessary props:

```typescript
const { isConnected, open, provider } = useWalletConnectModal();
```

Add a callback for the connect action:
```typescript
const onPressConnect = useCallback(async () => {
    return open();
}, []);
```

Add a callback for the disconnect action:
```typescript
const onPressDisconnect = useCallback(async () => {
    return provider?.disconnect();
}, [provider]);
```

Add some simple styles:
```typescript
const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#3396FF',
        borderRadius: 20,
        width: 200,
        height: 50,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    dangerButton: {
        backgroundColor: 'red',
    },
    text: {
        color: 'white',
        fontWeight: '700',
    },
});
```

Add the `Connect` & `Disconnect` buttons:
```typescript jsx
return (
    <SafeAreaView style={styles.container}>
        {isConnected ? (
            <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={onPressDisconnect}>
                <Text style={styles.text}>Disconnect</Text>
            </TouchableOpacity>
        ) : (
            <TouchableOpacity style={styles.button} onPress={onPressConnect}>
                <Text style={styles.text}>Connect</Text>
            </TouchableOpacity>
        )}
        <WalletConnectModal projectId={projectId} providerMetadata={providerMetadata} sessionParams={sessionParams} />
    </SafeAreaView>
);
```

### Option 2: Magic Link

1. Register on [Magic Link](https://dashboard.magic.link/signup) and create a project. We'll need the API key later.

2. Install dependencies:

```bash
$ npm install @magic-sdk/react-native-expo
$ npm install react-native-webview react-native-safe-area-context @react-native-async-storage/async-storage # Required peer dependencies
```

3. Create a `.env` file and add the following:

```dotenv
EXPO_PUBLIC_CHAIN_ID=
EXPO_PUBLIC_RPC_URL=
EXPO_PUBLIC_MAGIC_API_KEY=
```

4. Add a file `magic.ts` and create an `Magic Link SDK` instance:
```typescript
import { Magic } from '@magic-sdk/react-native-expo';

const chainId = parseInt(process.env.EXPO_PUBLIC_CHAIN_ID || '', 10);
const rpcUrl = process.env.EXPO_PUBLIC_RPC_URL || '';
const apiKey = process.env.EXPO_PUBLIC_MAGIC_API_KEY || '';

const customNodeOptions = {
  rpcUrl: rpcUrl,
  chainId: chainId,
};

const magic = new Magic(apiKey, {
  network: customNodeOptions,
});

export default magic;
```

5. Render the Magic component

Open `App.tsx` and add the `magic.Relayer` component wrapped in `SafeAreaProvider`:

```typescript jsx
import { SafeAreaProvider } from 'react-native-safe-area-context';

import magic from './magic';

export default function App() {
  return (
    <SafeAreaProvider>
      <magic.Relayer />
    </SafeAreaProvider>
  );
}
```

6. Add a Home screen

Create a simple file `Home.tsx` in `src/screens/` and add the following:

```typescript jsx
import { StyleSheet, Text, View } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text>Hello World</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

Render the Home screen in `App.tsx` **AFTER** `magic.Relayer`:
```typescript jsx
return (
    <SafeAreaProvider>
        <magic.Relayer />
        <Home />
    </SafeAreaProvider>
);
```

7. Add the `Connect` & `Disconnect` buttons

We are going to use a state to know if the wallet is connected or not. We use another state for the Magic Link provider (it will be used later). Open `Home.tsx` and add the following:
```typescript
const [isConnected, setIsConnected] = useState(false);
const [provider, setProvider] = useState();
```

Add a callback to the connect action:
```typescript
const onPressConnect = useCallback(async () => {
    await magic.wallet.connectWithUI();
    const provider = await magic.wallet.getProvider();
    setProvider(provider);
    setIsConnected(true);
}, []);
```

Add a callback for the disconnect action:
```typescript
const onPressDisconnect = useCallback(async () => {
    await magic.user.logout();
    setProvider(undefined);
    setIsConnected(false);
}, []);
```

Add some simple styles:
```typescript
const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#3396FF',
        borderRadius: 20,
        width: 200,
        height: 50,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        marginTop: 4,
    },
    dangerButton: {
        backgroundColor: 'red',
    },
    text: {
        color: 'white',
        fontWeight: '700',
    },
});
```

Add the `Connect` & `Disconnect` buttons:
```typescript jsx
return (
    <SafeAreaView style={styles.container}>
        {isConnected ? (
            <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={onPressDisconnect}>
                <Text style={styles.text}>Disconnect</Text>
            </TouchableOpacity>
        ) : (
            <TouchableOpacity style={styles.button} onPress={onPressConnect}>
                <Text style={styles.text}>Connect</Text>
            </TouchableOpacity>
        )}
    </SafeAreaView>
);
```

Additionally, when the app loads we need to check if the user is already logged in:
```typescript jsx
useEffect(() => {
    const init = async () => {
        const [isLoggedIn, providerResult] = await Promise.all([magic.user.isLoggedIn(), magic.wallet.getProvider()]);
        setIsConnected(isLoggedIn);
        setProvider(providerResult);
    };

    init();
}, []);
```

8. Add the `Manage wallet` button

When you log in with Magic Link by email a wallet address is generated automatically for you. In order to do any blockchain transaction later you need some tokens in order to pay the gas fees. Magic Link provides a widget to manage your wallet address (receive & send tokens, buy tokens with debit card, etc.) and we need to add a button to show it.

Create a callback for the manage wallet action:
```typescript
const onPressManageWallet = useCallback(async () => {
    await magic.wallet.showUI();
}, []);
```

Add the `Manage wallet` button:
```typescript jsx
{isConnected ? (
    <View>
        <TouchableOpacity style={[styles.button]} onPress={onPressManageWallet}>
            <Text style={styles.text}>Manage wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={onPressDisconnect}>
            <Text style={styles.text}>Disconnect</Text>
        </TouchableOpacity>
    </View>
) : (
    <TouchableOpacity style={styles.button} onPress={onPressConnect}>
        <Text style={styles.text}>Connect</Text>
    </TouchableOpacity>
)}
```

## Create a Web3 provider

This Web3 provider will be used for all blockchain actions.

Install `ethers.js` v5 (v6 is not supported by the **Ocean.js** library):
```bash
$ npm install ethers@^5.7.2
```

Open `Home.tsx` and create a Web3 provider:
```typescript
const web3Provider = useMemo(() => (provider ? new ethers.providers.Web3Provider(provider) : undefined), [provider]);
```

## Add Ocean.js

1. Install library:
```bash
$ npm install @oceanprotocol/lib
```

2. Add an env var for the asset DID:
```dotenv
EXPO_PUBLIC_OCEAN_DID=
```

3. Create a file `ocean.ts` and add the following:
```typescript
import { Aquarius, Config, ConfigHelper } from '@oceanprotocol/lib';

export const oceanConfig: Config = new ConfigHelper().getConfig(parseInt(process.env.EXPO_PUBLIC_CHAIN_ID || '', 10));

export const aquarius = new Aquarius(oceanConfig.metadataCacheUri!);

export const ASSET_DID = process.env.EXPO_PUBLIC_OCEAN_DID || '';
```

This is the config file for **Ocean.js**. We'll use it to load & buy assets.

## Buy an asset

Buying an asset involves a two-step process: obtaining a datatoken (by buying or receiving one for free) and send it to the publisher to place the order for that asset (more info about this [here](https://docs.oceanprotocol.com/developers/ocean.js/consume-asset)).

### Preparation

We are going to add a component that loads an asset with a button to purchase it.

1. Create a simple file `BuyAsset.tsx` in `src/components/` and add the following:

```typescript jsx
import { StyleSheet, Text, View } from 'react-native';
import { ethers } from 'ethers';

type BuyAssetProps = {
  web3Provider: ethers.providers.Web3Provider;
};

export default function BuyAsset({ web3Provider }: BuyAssetProps) {
  return (
    <View style={styles.container}>
      <Text>Buy asset</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 36,
  },
});
```

Render the new component in `Home.tsx`:
```typescript jsx
{isConnected ? (
    <View>
      <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={onPressDisconnect}>
        <Text style={styles.text}>Disconnect</Text>
      </TouchableOpacity>
      <BuyAsset web3Provider={web3Provider!} />
    </View>
) : (
    <TouchableOpacity style={styles.button} onPress={onPressConnect}>
      <Text style={styles.text}>Connect</Text>
    </TouchableOpacity>
)}
```

2. Load the asset

We are going to load the asset by using his DID (Decentralized identifier).

Open `BuyAsset.tsx` and add a state for the asset:
```typescript jsx
const [asset, setAsset] = useState<Asset>();
```

Add an `useEffect` to get the asset and save it:
```typescript jsx
useEffect(() => {
  aquarius.resolve(ASSET_DID).then((result) => setAsset(result));
}, []);
```

Each asset contains multiple datatokens & services. We are going to buy the first datatoken in the list.

Add a const for the datatoken info:
```typescript jsx
const dataToken = useMemo(() => {
  if (!asset) {
    return;
  }

  return asset.datatokens[0];
}, [asset]);
```

Add a const for the datatoken service:
```typescript jsx
const dataTokenService = useMemo(() => {
  if (!asset) {
    return;
  }

  return asset.services.find((current) => current.datatokenAddress === dataToken?.address);
}, [asset, dataToken?.address]);
```

3. Add a buy button

Add a loading state to show feedback to the user while the buy action is in progress:
```typescript jsx
const [loading, setLoading] = useState(false);
```

Add a callback for the buy action. We'll add the code later for each usecase:
```typescript jsx
const onPressBuy = useCallback(() => {
  // buy code
}, []);
```

Add some simple styles:
```typescript jsx
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 36,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3396FF',
    borderRadius: 20,
    width: 200,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    color: 'white',
    fontWeight: '700',
  },
});
```

Add the buy button:
```typescript jsx
return (
  <View style={styles.container}>
    <Text>Buy asset</Text>
    {dataToken && (
      <TouchableOpacity
        style={[styles.button, loading ? styles.buttonDisabled : undefined]}
        onPress={onPressBuy}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.text}>{dataToken.name}</Text>}
      </TouchableOpacity>
    )}
  </View>
);
```

### Asset types

There are 2 pricing schema for an asset: fixed-rate and free. If the asset has a fixed-rate pricing schema you need to purchase the corresponding datatoken using `$OCEAN`. On the other hand for free pricing schema you can obtain a free datatoken from the dispenser service provided by Ocean Protocol.

Additionally, a datatoken associated with an asset can be of 2 types: Template 1 (regular template) and Template 2 (enterprise template). The type of template determines the sequence of method calls required before placing an order.

You can read more about this [here](https://docs.oceanprotocol.com/developers/ocean.js/consume-asset).

### Buy a fixed-rate asset (Template 1)

Buying an asset with fixed-rate pricing schema and datatoken of type 1 involves 2 steps: buying 1 datatoken with OCEAN tokens and sending it to the publisher to place the order for that asset.

> Note: Make sure you have enough `$OCEAN` in your wallet in order to purchase the asset. You can find [here](https://docs.oceanprotocol.com/discover/networks) all info about the supported networks

1. Add a function `buyDataToken`:

This buys 1 datatoken with `$OCEAN` from `FixedRateExchange`.

```typescript jsx
const buyDataToken = useCallback(async () => {
  const signer = web3Provider.getSigner();
  const address = await web3Provider.getSigner().getAddress();
}, [web3Provider, dataToken?.address]);
```

Calculate how much `$OCEAN` we need in order to buy 1 datatoken:
```typescript
const dataTokenAmount = '1';

const fixedRateExchange = new FixedRateExchange(oceanConfig.fixedRateExchangeAddress!, signer);
const exchangeId = await fixedRateExchange.generateExchangeId(oceanConfig.oceanTokenAddress!, dataToken?.address!);

const priceInfo = await fixedRateExchange.calcBaseInGivenDatatokensOut(exchangeId, dataTokenAmount);
const oceanAmount = priceInfo.baseTokenAmount;
```

Approve the FixedRateExchange contract to take `$OCEAN` from your wallet:
```typescript
const approveResult = await approve(
    signer,
    oceanConfig,
    address,
    oceanConfig.oceanTokenAddress!,
    oceanConfig.fixedRateExchangeAddress!,
    oceanAmount,
);
if (!approveResult) {
  throw new Error('Approve contract failed');
}

/**
 * approveResult can be:
 * - transaction response, in which case we need to wait for the transaction to be executed
 * - a number, which means no transaction was published because there is already an approval for the amount requested
 */
if (typeof approveResult !== 'number') {
  await approveResult.wait(1);
}
```

Buy 1 datatoken with `$OCEAN`:
```typescript
const buyTx = await fixedRateExchange.buyDatatokens(exchangeId, dataTokenAmount, oceanAmount);
if (!buyTx) {
  throw new Error('Buy data token failed');
}

await buyTx.wait(1);
```

2. Add a function `createOrder`:

This creates the order to send the datatoken to the published and buy the asset.

```typescript jsx
const createOrder = useCallback(async () => {
  const signer = web3Provider.getSigner();
  const address = await web3Provider.getSigner().getAddress();
}, [web3Provider, dataToken?.address, dataTokenService]);
```

Initialize the provider and add the provider fees:
```typescript
const initializeData = await ProviderInstance.initialize(
  asset?.id!,
  dataTokenService?.id!,
  0,
  address,
  dataTokenService?.serviceEndpoint!,
);

const providerFees: ProviderFees = {
  providerFeeAddress: initializeData.providerFee.providerFeeAddress,
  providerFeeToken: initializeData.providerFee.providerFeeToken,
  providerFeeAmount: initializeData.providerFee.providerFeeAmount,
  v: initializeData.providerFee.v,
  r: initializeData.providerFee.r,
  s: initializeData.providerFee.s,
  providerData: initializeData.providerFee.providerData,
  validUntil: initializeData.providerFee.validUntil,
};
```

Create the order:
```typescript
const dataTokenInstance = new Datatoken(signer);

const tx = await dataTokenInstance.startOrder(dataToken?.address!, address, 0, providerFees);
if (!tx) {
  throw new Error('Create order failed');
}

await tx.wait(1);
```

3. Call both functions in `onPressBuy`:
```typescript
const onPressBuy = useCallback(async () => {
  setLoading(true);

  try {
    await buyDataToken();
    await createOrder();
    Alert.alert('Success', 'Service bought with success!');
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
}, [buyDataToken, createOrder]);
```

### Buy a fixed-rate asset (Template 2)

Buying an asset with fixed-rate pricing schema and datatoken of type 2 is similar with buying the same asset with data token of type 1, but the process is simplified. The 2 steps involved (buying 1 datatoken and sending it to the publisher) are done in the same transaction.

> Note: Make sure you have enough `$OCEAN` in your wallet in order to purchase the asset. You can find [here](https://docs.oceanprotocol.com/discover/networks) all info about the supported networks

1. Add a function `getOceanAmount`:

This calculates how much $OCEAN we need in order to buy 1 datatoken:
```typescript jsx
const getOceanAmount = useCallback(async () => {
  const signer = web3Provider.getSigner();
  const dataTokenAmount = '1';

  const fixedRateExchange = new FixedRateExchange(oceanConfig.fixedRateExchangeAddress!, signer);
  const exchangeId = await fixedRateExchange.generateExchangeId(oceanConfig.oceanTokenAddress!, dataToken?.address!);

  const priceInfo = await fixedRateExchange.calcBaseInGivenDatatokensOut(exchangeId, dataTokenAmount);

  return priceInfo.baseTokenAmount;
}, [web3Provider, dataToken?.address]);
```

2. Add a function `approveContract`:

This approves the datatoken contract to take `$OCEAN` from your wallet:
```typescript jsx
const approveContract = useCallback(
  async (oceanAmount: string) => {
    const signer = web3Provider.getSigner();
    const address = await web3Provider.getSigner().getAddress();

    const approveResult = await approve(
      signer,
      oceanConfig,
      address,
      oceanConfig.oceanTokenAddress!,
      dataToken?.address!,
      oceanAmount,
    );
    if (!approveResult) {
      throw new Error('Approve contract failed');
    }

    /**
     * approveResult can be:
     * - transaction response, in which case we need to wait for the transaction to be executed
     * - a number, which means no transaction was published because there is already an approval for the amount requested
     */
    if (typeof approveResult !== 'number') {
      await approveResult.wait(1);
    }
  },
  [web3Provider, dataToken?.address],
);
```

3. Add a function `createOrder`:

This creates the order to buy 1 datatoken, send it to the publisher and buy the asset.

```typescript jsx
const createOrder = useCallback(
  async (oceanAmount: string) => {
    const signer = web3Provider.getSigner();
    const address = await web3Provider.getSigner().getAddress();
  },
  [web3Provider, dataToken?.address!, dataTokenService],
);
```

Initialize the provider and add the provider fees:
````typescript jsx
const initializeData = await ProviderInstance.initialize(
  asset?.id!,
  dataTokenService?.id!,
  0,
  address,
  dataTokenService?.serviceEndpoint!,
);
const providerFees: ProviderFees = {
  providerFeeAddress: initializeData.providerFee.providerFeeAddress,
  providerFeeToken: initializeData.providerFee.providerFeeToken,
  providerFeeAmount: initializeData.providerFee.providerFeeAmount,
  v: initializeData.providerFee.v,
  r: initializeData.providerFee.r,
  s: initializeData.providerFee.s,
  providerData: initializeData.providerFee.providerData,
  validUntil: initializeData.providerFee.validUntil,
};
````

Add the order params:
```typescript jsx
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
```

Add the order params for the FixedRateExchange:
```typescript jsx
const fixedRateExchange = new FixedRateExchange(oceanConfig.fixedRateExchangeAddress!, signer);
const exchangeId = await fixedRateExchange.generateExchangeId(
  oceanConfig.oceanTokenAddress!,
  dataToken?.address!,
);

const freParams: FreOrderParams = {
  exchangeContract: oceanConfig.fixedRateExchangeAddress!,
  exchangeId,
  maxBaseTokenAmount: oceanAmount || '1',
  baseTokenAddress: oceanConfig.oceanTokenAddress!,
  baseTokenDecimals: 18,
  swapMarketFee: '0',
  marketFeeAddress: ethers.constants.AddressZero,
};
```

Create the order:
```typescript jsx
const dataTokenInstance = new Datatoken(signer);

const tx = await dataTokenInstance.buyFromFreAndOrder(dataToken?.address!, orderParams, freParams);
if (!tx) {
  throw new Error('Buy from fixed rate exchange & create order failed');
}

await tx.wait(1);
```

4. Call all functions in `onPressBuy`:
```typescript jsx
const onPressBuy = useCallback(async () => {
  setLoading(true);

  try {
    const oceanAmount = await getOceanAmount();
    await approveContract(oceanAmount);
    await createOrder(oceanAmount);
    Alert.alert('Success', 'Service bought with success!');
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
}, [getOceanAmount, approveContract, createOrder]);
```

### Buy a free asset (Template 1)

Buying an asset with free pricing schema and datatoken of type 1 involves 2 steps: obtain 1 datatoken from the dispenser and sending it to the publisher to place the order for that asset.

We don't need `$OCEAN` to buy this type of asset, but we still need tokens to pay the gas fees for each transaction.

1. Add a function `obtainDataToken`:

This obtains 1 free datatoken from the dispenser:
```typescript jsx
const obtainDataToken = useCallback(async () => {
  const signer = web3Provider.getSigner();
  const address = await web3Provider.getSigner().getAddress();

  const dataTokenAmount = '1';
  const dispenser = new Dispenser(oceanConfig.dispenserAddress!, signer);

  const dispenseTx = await dispenser.dispense(dataToken?.address!, dataTokenAmount, address);
  if (!dispenseTx) {
    throw new Error('Dispense data token failed');
  }

  await dispenseTx.wait(1);
}, [web3Provider, dataToken?.address]);
```

2. Add a function `createOrder`:

This creates the order to send the datatoken to the published and buy the asset.

```typescript jsx
const createOrder = useCallback(async () => {
  const signer = web3Provider.getSigner();
  const address = await web3Provider.getSigner().getAddress();
}, [web3Provider, dataToken?.address, dataTokenService]);
```

Initialize the provider and add the provider fees:
```typescript
const initializeData = await ProviderInstance.initialize(
  asset?.id!,
  dataTokenService?.id!,
  0,
  address,
  dataTokenService?.serviceEndpoint!,
);

const providerFees: ProviderFees = {
  providerFeeAddress: initializeData.providerFee.providerFeeAddress,
  providerFeeToken: initializeData.providerFee.providerFeeToken,
  providerFeeAmount: initializeData.providerFee.providerFeeAmount,
  v: initializeData.providerFee.v,
  r: initializeData.providerFee.r,
  s: initializeData.providerFee.s,
  providerData: initializeData.providerFee.providerData,
  validUntil: initializeData.providerFee.validUntil,
};
```

Create the order:
```typescript
const dataTokenInstance = new Datatoken(signer);

const tx = await dataTokenInstance.startOrder(dataToken?.address!, address, 0, providerFees);
if (!tx) {
  throw new Error('Create order failed');
}

await tx.wait(1);
```

3. Call both functions in `onPressBuy`:
```typescript
const onPressBuy = useCallback(async () => {
  setLoading(true);

  try {
    await obtainDataToken();
    await createOrder();
    Alert.alert('Success', 'Service bought with success!');
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
}, [obtainDataToken, createOrder]);;
```

### Buy a free asset (Template 2)

Buying an asset with free pricing schema and datatoken of type 2 is similar with buying a free asset with data token of type 1, but the process is simplified. The 2 steps involved (obtaining 1 datatoken and sending it to the publisher) are done in the same transaction.

We don't need `$OCEAN` to buy this type of asset, but we still need tokens to pay the gas fees for the transaction.

1. Add a function `createOrder`:

This creates the order to obtain 1 datatoken, send it to the publisher and buy the asset.

```typescript jsx
const createOrder = useCallback(
  async (oceanAmount: string) => {
    const signer = web3Provider.getSigner();
    const address = await web3Provider.getSigner().getAddress();
  },
  [web3Provider, dataToken?.address!, dataTokenService],
);
```

Initialize the provider and add the provider fees:
````typescript jsx
const initializeData = await ProviderInstance.initialize(
  asset?.id!,
  dataTokenService?.id!,
  0,
  address,
  dataTokenService?.serviceEndpoint!,
);
const providerFees: ProviderFees = {
  providerFeeAddress: initializeData.providerFee.providerFeeAddress,
  providerFeeToken: initializeData.providerFee.providerFeeToken,
  providerFeeAmount: initializeData.providerFee.providerFeeAmount,
  v: initializeData.providerFee.v,
  r: initializeData.providerFee.r,
  s: initializeData.providerFee.s,
  providerData: initializeData.providerFee.providerData,
  validUntil: initializeData.providerFee.validUntil,
};
````

Add the order params:
```typescript jsx
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
```

Create the order:
```typescript jsx
const dataTokenInstance = new Datatoken(signer);

const tx = await dataTokenInstance.buyFromDispenserAndOrder(
  dataToken?.address!,
  orderParams,
  oceanConfig.dispenserAddress!,
);
if (!tx) {
  throw new Error('Buy from dispenser & create order failed');
}

await tx.wait(1);
```

2. Call the function in `onPressBuy`:
```typescript jsx
const onPressBuy = useCallback(async () => {
  setLoading(true);

  try {
    await createOrder();
    Alert.alert('Success', 'Service bought with success!');
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
}, [createOrder]);
```

## Test the app

1. Run the app locally
```bash
$ npm start
```

2. Install the Expo app on your phone and scan the QR code

Note: You need to be on the same network in order to connect to the app. If you cannot connect due to some network conditions/firewall rules you can run the app with tunneling:
```bash
$ npm start -- --tunnel
```




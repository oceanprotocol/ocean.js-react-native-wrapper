import { useCallback } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WalletConnectModal } from '@walletconnect/modal-react-native';
import { setStringAsync } from 'expo-clipboard';

import { BlockchainActions } from './BlockchainActions';
import { useWalletContext } from '../contexts/WalletContext';
import { WalletConnectionMethodEnum } from '../consts/wallet-connection-method-enum';
import { PROJECT_ID, providerMetadata, sessionParams } from '../wallet-connect';

export default function Home() {
  const { isConnected, onConnect, onDisconnect, manageWallet, connectionMethod } = useWalletContext();

  const onCopyClipboard = useCallback(async (value: string) => {
    setStringAsync(value);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {isConnected ? (
        <>
          <View style={styles.disconnectContainer}>
            {connectionMethod === WalletConnectionMethodEnum.MagicLink && (
              <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={manageWallet}>
                <Text style={styles.text}>Manage wallet</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={onDisconnect}>
              <Text style={styles.text}>Disconnect</Text>
            </TouchableOpacity>
          </View>
          <BlockchainActions />
        </>
      ) : (
        <View style={styles.connectContainer}>
          <TouchableOpacity style={styles.button} onPress={() => onConnect(WalletConnectionMethodEnum.WalletConnect)}>
            <Text style={styles.text}>Connect with Wallet Connect</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => onConnect(WalletConnectionMethodEnum.MagicLink)}>
            <Text style={styles.text}>Connect with Magic Link</Text>
          </TouchableOpacity>
        </View>
      )}
      <WalletConnectModal
        projectId={PROJECT_ID}
        onCopyClipboard={onCopyClipboard}
        providerMetadata={providerMetadata}
        sessionParams={sessionParams}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  connectContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  disconnectContainer: {
    alignItems: 'center',
    paddingTop: 60,
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
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  dangerButton: {
    backgroundColor: 'red',
    marginTop: 4,
  },
  text: {
    color: 'white',
    fontWeight: '700',
  },
});

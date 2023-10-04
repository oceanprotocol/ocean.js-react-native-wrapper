import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ListRenderItemInfo } from '@react-native/virtualized-lists/Lists/VirtualizedList';

import { useBlockChainActions } from './useBlockChainActions';
import type { AccountAction } from '../types/methods';
import { useWalletContext } from '../contexts/WalletContext';

export function BlockchainActions() {
  const { web3Provider } = useWalletContext();

  const {
    loading,
    dataTokenInProgress,
    getFixedRateActions,
    getFreeActions,
    getEnterpriseFixedRateActions,
    getEnterpriseFreeActions,
  } = useBlockChainActions();

  const renderAction = useCallback(
    ({ item }: ListRenderItemInfo<AccountAction>) => {
      const isInProgress = item.dataToken === dataTokenInProgress;

      return (
        <TouchableOpacity
          style={[styles.button, loading ? styles.buttonDisabled : undefined]}
          key={item.title}
          onPress={() => item.callback(web3Provider)}
          disabled={loading}
        >
          {isInProgress ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{item.title}</Text>}
        </TouchableOpacity>
      );
    },
    [dataTokenInProgress, loading, web3Provider],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={getFixedRateActions(web3Provider)}
        ListHeaderComponent={<Text>Fixed rate services:</Text>}
        contentContainerStyle={styles.listContent}
        renderItem={renderAction}
      />
      <FlatList
        data={getEnterpriseFixedRateActions(web3Provider)}
        ListHeaderComponent={<Text>Enterprise fixed rate services:</Text>}
        contentContainerStyle={[styles.listContent, styles.marginTop]}
        renderItem={renderAction}
      />
      <FlatList
        data={getFreeActions(web3Provider)}
        ListHeaderComponent={<Text>Free services:</Text>}
        contentContainerStyle={[styles.listContent, styles.marginTop]}
        renderItem={renderAction}
      />
      <FlatList
        data={getEnterpriseFreeActions(web3Provider)}
        ListHeaderComponent={<Text>Enterprise free services:</Text>}
        contentContainerStyle={[styles.listContent, styles.marginTop]}
        renderItem={renderAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    display: 'flex',
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
  buttonText: {
    color: 'white',
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontWeight: 'bold',
    marginVertical: 4,
  },
  responseText: {
    fontWeight: '300',
  },
  listContent: {
    alignItems: 'center',
  },
  marginTop: {
    marginTop: 20,
  },
  container: {
    marginTop: 60,
  },
});

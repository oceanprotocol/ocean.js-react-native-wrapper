import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import magic from '../magic';
import Home from '../components/Home';
import { WalletContextProvider } from '../contexts/WalletContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <magic.Relayer />
      <WalletContextProvider>
        <Home />
      </WalletContextProvider>
      <Toast />
    </SafeAreaProvider>
  );
}

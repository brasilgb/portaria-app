import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import "../styles/global.css";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthProvider from './contexts/auth';

export default function RootLayout() {

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="transparent" translucent />
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'slide_from_right',
              animationDuration: 320,
              animationTypeForReplace: 'push',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="naturovos/index" />
            <Stack.Screen name="naturovos/cadastro-visitante/index" />
            <Stack.Screen name="naturovos/cadastro-visitante/cadastro" />
            <Stack.Screen name="naturovos/historico/index" />
            <Stack.Screen name="naturovos/saidas-pendentes/index" />
            <Stack.Screen name="naturovos/cargas/index" />
            <Stack.Screen name="naturovos/cargas/cadastro" />
            <Stack.Screen name="naturovos/cargas/status/[status]" />
            <Stack.Screen name="solar/index" />
            <Stack.Screen name="solar/cadastro-visitante/index" />
            <Stack.Screen name="solar/cadastro-visitante/cadastro" />
            <Stack.Screen name="solar/historico/index" />
            <Stack.Screen name="solar/saidas-pendentes/index" />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

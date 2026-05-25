import { Stack } from 'expo-router';
import "../styles/global.css";
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthProvider from './contexts/auth';
interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout() {

  return (
    <SafeAreaView className='flex-1'>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="naturovos/index" options={{ headerShown: false }} />
          <Stack.Screen name="solar/index" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </SafeAreaView>
  );
}

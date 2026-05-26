import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import type { Href } from 'expo-router';
import { Truck, UserPlus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/app/contexts/auth';
import Header from './header';

interface AppLayoutProps {
  children: ReactNode;
}

const naturovosTabs = [
  {
    label: 'Visitantes',
    route: '/naturovos/cadastro-visitante',
    activeRoutes: [
      '/naturovos/cadastro-visitante',
      '/naturovos/historico',
      '/naturovos/saidas-pendentes',
    ],
    icon: UserPlus,
  },
  {
    label: 'Cargas',
    route: '/naturovos/cargas',
    activeRoutes: ['/naturovos/cargas'],
    icon: Truck,
  },
] as const;

function NaturovosBottomTabs() {
  const pathname = usePathname();
  const { historyFilial, user } = useAuth();
  const showTabs =
    user?.filial === '26' ||
    historyFilial === '26' ||
    pathname.startsWith('/naturovos');

  if (!showTabs) {
    return null;
  }

  return (
    <SafeAreaView edges={['bottom']} className="border-t border-slate-200 bg-white">
      <View className="flex-row px-4 pt-2">
        {naturovosTabs.map((item) => {
          const Icon = item.icon;
          const isActive = item.activeRoutes.some(
            (route) => pathname === route || pathname.startsWith(`${route}/`),
          );
          const contentColor = isActive ? '#F9B233' : '#64748b';

          return (
            <Pressable
              key={item.route}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              className="min-h-14 flex-1 items-center justify-center gap-1"
              onPress={() => {
                if (!isActive) {
                  router.push(item.route as Href);
                }
              }}
            >
              <Icon size={22} stroke={contentColor} strokeWidth={2.5} />
              <Text
                className="text-xs font-bold"
                style={{ color: contentColor }}
              >
                {item.label}
              </Text>
              <View
                className="mt-1 h-1 w-10 rounded-full"
                style={{ backgroundColor: isActive ? '#F9B233' : 'transparent' }}
              />
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <View className="flex-1 bg-slate-50">
      <Header />
      <View className="flex-1">{children}</View>
      <NaturovosBottomTabs />
    </View>
  );
}

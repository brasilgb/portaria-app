import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { Href } from 'expo-router';
import { Clock, History, LogOut, User, UserPlus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/app/contexts/auth';

const solarColor = '#1A9CD9';
const naturovosColor = '#F9B233';

const visitorNavItems = [
  {
    label: 'Cadastro de visitante',
    route: '/cadastro-visitante',
    activeRoutes: ['/cadastro-visitante', '/cadastro-visitante/cadastro'],
    icon: UserPlus,
  },
  {
    label: 'Historico',
    route: '/historico',
    activeRoutes: ['/historico'],
    icon: History,
  },
  {
    label: 'Saidas pendentes',
    route: '/saidas-pendentes',
    activeRoutes: ['/saidas-pendentes'],
    icon: Clock,
  },
] as const;

function getHeaderSubtitle(pathname: string) {
  if (pathname === '/naturovos/cargas/status/1') {
    return 'Controle de cargas - Informar Nota';
  }

  if (pathname === '/naturovos/cargas/status/2') {
    return 'Controle de cargas - Entrada';
  }

  if (pathname === '/naturovos/cargas/status/3') {
    return 'Controle de cargas - Saida';
  }

  if (pathname.startsWith('/naturovos/cargas')) {
    return 'Controle de entrada e saída de carga';
  }

  return 'Controle de entrada e saída de visitantes';
}

export default function Header() {
  const pathname = usePathname();
  const { historyFilial, signOut, user } = useAuth();

  const filial = user?.filial ?? historyFilial;
  const isNaturovos = filial === '26' || pathname.startsWith('/naturovos');
  const brandColor =
    filial === '1' ? solarColor : isNaturovos ? naturovosColor : solarColor;
  const headerBackgroundColor = isNaturovos ? naturovosColor : solarColor;
  const headerTextColor = isNaturovos ? '#111827' : '#ffffff';
  const headerMutedTextColor = isNaturovos ? '#374151' : '#dbeafe';
  const iconContainerBackground = isNaturovos ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.15)';
  const actionBackgroundColor = isNaturovos ? naturovosColor : brandColor;
  const actionTextColor = isNaturovos ? '#111827' : '#ffffff';
  const routePrefix =
    pathname.startsWith('/naturovos') || filial === '26' ? '/naturovos' : '/solar';
  const isNaturovosCargoEnvironment = pathname.startsWith('/naturovos/cargas');
  const showVisitorNavigation =
    filial === '1' ||
    pathname.startsWith('/solar') ||
    filial === '26' ||
    pathname.startsWith('/naturovos');
  const headerSubtitle = getHeaderSubtitle(pathname);

  const employeeName = useMemo(() => {
    if (user?.nome?.trim()) {
      return user.nome.trim();
    }

    if (user?.code) {
      return `Funcionario ${user.code}`;
    }

    return 'Funcionario';
  }, [user]);

  return (
    <SafeAreaView
      className="border-b border-slate-200"
      edges={['top']}
      style={{ backgroundColor: headerBackgroundColor }}
    >
      <StatusBar
        style={isNaturovos ? 'dark' : 'light'}
        backgroundColor="transparent"
        translucent
      />
      <View className="px-5 pb-5 pt-5">
        <View className="mb-5 h-12 flex-row items-center justify-between gap-4">
          <View className="min-w-0 flex-1 flex-row items-center gap-3">
            <View
              className="h-10 w-10 items-center justify-center rounded-full bg-white/15"
              style={{
                backgroundColor: iconContainerBackground,
                borderColor: isNaturovos ? '#111827' : brandColor,
                borderWidth: 1,
              }}
            >
              <User size={21} stroke={headerTextColor} />
            </View>

            <View className="h-10 min-w-0 flex-1 justify-center">
              <Text
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: headerMutedTextColor }}
              >
                Usuario logado
              </Text>
              <Text
                className="text-base font-bold"
                numberOfLines={1}
                style={{ color: headerTextColor }}
              >
                {employeeName}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sair"
            className="h-10 w-10 items-center justify-center rounded-lg"
            onPress={signOut}
            style={{ backgroundColor: actionBackgroundColor }}
          >
            <LogOut size={18} stroke={actionTextColor} />
          </Pressable>
        </View>

        <View className="py-4">
          <Text
            className="text-center text-2xl font-black"
            style={{ color: headerTextColor }}
          >
            SISTEMA DE GESTÃO INTEGRADA
          </Text>
          <Text
            className="mt-1 text-center text-[15px] font-medium"
            style={{ color: headerMutedTextColor }}
          >
            {headerSubtitle}
          </Text>
        </View>

        {showVisitorNavigation && !isNaturovosCargoEnvironment && (
          <View className="mt-4 flex-row gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
            {visitorNavItems.map((item) => {
              const Icon = item.icon;
              const itemRoute = `${routePrefix}${item.route}`;
              const isActive = item.activeRoutes.some(
                (route) =>
                  pathname === `${routePrefix}${route}` ||
                  pathname.startsWith(`${routePrefix}${route}/`),
              );
              const backgroundColor = isActive ? '#ffffff' : brandColor;
              const borderColor = isNaturovos ? '#111827' : brandColor;
              const contentColor = isActive
                ? isNaturovos
                  ? '#111827'
                  : brandColor
                : isNaturovos
                  ? '#111827'
                  : '#ffffff';

              return (
                <Pressable
                  key={itemRoute}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg border px-2"
                  onPress={() => {
                    if (!isActive) {
                      router.push(itemRoute as Href);
                    }
                  }}
                  style={{
                    backgroundColor,
                    borderColor,
                  }}
                >
                  <Icon size={17} stroke={contentColor} strokeWidth={2.4} />
                  <Text
                    className="text-center text-xs font-bold"
                    numberOfLines={2}
                    style={{ color: contentColor }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

    </SafeAreaView>
  );
}

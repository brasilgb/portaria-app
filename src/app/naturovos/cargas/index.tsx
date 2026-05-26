import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  PlusCircle,
} from 'lucide-react-native';

import AppLayout from '@/components/layouts/layout';

const cargoActions = [
  {
    title: 'Cadastrar chegada',
    description: 'Registrar uma nova carga aguardando atendimento.',
    route: '/naturovos/cargas/cadastro',
    icon: PlusCircle,
    color: '#F9B233',
  },
  {
    title: 'Informar Nota',
    description: 'Listar cargas aguardando nota fiscal.',
    route: '/naturovos/cargas/status/1',
    icon: FileText,
    color: '#22c55e',
  },
  {
    title: 'Entrada',
    description: 'Listar cargas aguardando entrada.',
    route: '/naturovos/cargas/status/2',
    icon: ArrowRight,
    color: '#f97316',
  },
  {
    title: 'Saida',
    description: 'Listar cargas aguardando saida.',
    route: '/naturovos/cargas/status/3',
    icon: ArrowLeft,
    color: '#1A9CD9',
  },
] as const;

export default function NaturovosCargasScreen() {
  return (
    <AppLayout>
      <View className="flex-1 px-5 py-6">
        <View className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Text className="text-xl font-black text-slate-950">
            Cadastro de cargas
          </Text>
          <Text className="mt-2 text-sm leading-5 text-slate-500">
            Selecione a etapa da carga para continuar.
          </Text>
        </View>

        <View className="mt-4 gap-3">
          {cargoActions.map((action) => {
            const Icon = action.icon;

            return (
              <Pressable
                key={action.route}
                accessibilityRole="button"
                className="flex-row items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                onPress={() => router.push(action.route as Href)}
              >
                <View
                  className="h-12 w-12 items-center justify-center rounded-lg"
                  style={{ backgroundColor: action.color }}
                >
                  <Icon size={22} stroke="#ffffff" strokeWidth={2.5} />
                </View>

                <View className="min-w-0 flex-1">
                  <Text className="text-base font-black text-slate-950">
                    {action.title}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    {action.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </AppLayout>
  );
}

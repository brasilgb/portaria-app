import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import type { Href } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import AppLayout from '@/components/layouts/layout';
import { findVisitorByDriverCpf } from '@/services/visitor';
import { getFieldErrors } from '@/utils/validation';

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

const searchSchema = z.object({
  cpfMotorista: z
    .string()
    .transform(onlyDigits)
    .refine((value) => value.length === 11, 'Informe os 11 digitos do CPF.'),
});

type SearchField = 'cpfMotorista';

export default function CadastroVisitanteScreen() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const routePrefix = pathname.startsWith('/naturovos') ? '/naturovos' : '/solar';
  const isNaturovos = routePrefix === '/naturovos';
  const actionBackgroundColor = isNaturovos ? '#F9B233' : '#1A9CD9';
  const actionContentColor = isNaturovos ? '#111827' : '#ffffff';
  const [cpfMotorista, setCpfMotorista] = useState('');
  const [errors, setErrors] = useState<Partial<Record<SearchField, string>>>({});
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    const result = searchSchema.safeParse({ cpfMotorista });

    if (!result.success) {
      setErrors(getFieldErrors<SearchField>(result.error));
      return;
    }

    const cpf = result.data.cpfMotorista;
    setLoading(true);

    try {
      const visitor = await findVisitorByDriverCpf(cpf);

      router.push({
        pathname: `${routePrefix}/cadastro-visitante/cadastro`,
        params: {
          cpf,
          visitor: visitor ? JSON.stringify(visitor) : '',
        },
      } as unknown as Href);
    } catch (error) {
      Alert.alert(
        'Erro na busca',
        error instanceof Error
          ? error.message
          : 'Nao foi possivel buscar os dados do motorista.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-6"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Text className="text-xl font-black text-slate-950">Buscar visitante</Text>
            <Text className="mt-2 text-sm leading-5 text-slate-500">
              Informe o CPF do motorista para buscar os dados cadastrados.
            </Text>

            <View className="mt-6">
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                CPF do Motorista
              </Text>
              <TextInput
                className="h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
              keyboardType="number-pad"
              maxLength={14}
              onChangeText={(value) => {
                setCpfMotorista(formatCpf(value));
                setErrors((current) => ({ ...current, cpfMotorista: undefined }));
              }}
                placeholder="000.000.000-00"
                placeholderTextColor="#64748b"
                returnKeyType="search"
                value={cpfMotorista}
              onSubmitEditing={handleSearch}
            />
            {errors.cpfMotorista && (
              <Text className="mt-2 text-sm font-semibold text-red-600">
                {errors.cpfMotorista}
              </Text>
            )}
          </View>

            <Pressable
              accessibilityRole="button"
              className="mt-5 h-14 flex-row items-center justify-center gap-2 rounded-lg"
              disabled={loading}
              onPress={handleSearch}
              style={{
                backgroundColor: actionBackgroundColor,
                opacity: loading ? 0.72 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color={actionContentColor} />
              ) : (
                <Search size={18} stroke={actionContentColor} strokeWidth={2.5} />
              )}
              <Text
                className="text-base font-bold"
                style={{ color: actionContentColor }}
              >
                {loading ? 'Buscando...' : 'Buscar dados'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}

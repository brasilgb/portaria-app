import { useMemo, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Check, Eye, EyeOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { useAuth } from './contexts/auth';
import { getFieldErrors } from '@/utils/validation';

type Company = {
  id: 'solar' | 'naturovos';
  name: string;
  department: '1' | '26';
  description: string;
  route: '/solar' | '/naturovos';
  brandColor: string;
  softColor: string;
  foregroundColor: string;
  logo: ImageSourcePropType;
};

const companies: Company[] = [
  {
    id: 'solar',
    name: 'Solar',
    department: '1',
    description: 'Departamento 1',
    route: '/solar',
    brandColor: '#1A9CD9',
    softColor: '#E8F6FC',
    foregroundColor: '#ffffff',
    logo: require('../../assets/images/logo_lojas_solar.png'),
  },
  {
    id: 'naturovos',
    name: 'Naturovos',
    department: '26',
    description: 'Departamento 26',
    route: '/naturovos',
    brandColor: '#F9B233',
    softColor: '#FFF5DF',
    foregroundColor: '#1f2937',
    logo: require('../../assets/images/logo_naturovos.png'),
  },
];

const defaultBrandColor = '#0d3b85';
const defaultSoftColor = '#e7eef8';
const defaultForegroundColor = '#ffffff';
const defaultLogo = require('../../assets/images/logo_grupo_solar.png');

const loginSchema = z.object({
  employeeNumber: z.string().trim().min(1, 'Informe o número do funcionário.'),
  password: z.string().trim().min(1, 'Informe a senha.'),
  selectedCompany: z.custom<Company['id']>(
    (value) => value === 'solar' || value === 'naturovos',
    'Selecione Solar ou Naturovos.',
  ),
});

type LoginField = 'employeeNumber' | 'password' | 'selectedCompany';

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <Text className="mt-2 text-sm font-semibold text-red-600">
      {message}
    </Text>
  );
}

export default function HomeScreen() {
  const { loading, signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company['id'] | null>(null);
  const [errors, setErrors] = useState<Partial<Record<LoginField, string>>>({});

  const company = useMemo(
    () => companies.find((item) => item.id === selectedCompany),
    [selectedCompany],
  );

  const brandColor = company?.brandColor ?? defaultBrandColor;
  const softColor = company?.softColor ?? defaultSoftColor;
  const foregroundColor = company?.foregroundColor ?? defaultForegroundColor;
  const logo = company?.logo ?? defaultLogo;

  async function handleSignIn() {
    const result = loginSchema.safeParse({
      employeeNumber,
      password,
      selectedCompany,
    });

    if (!result.success) {
      setErrors(getFieldErrors<LoginField>(result.error));
      return;
    }

    setErrors({});
    const selected = companies.find((item) => item.id === result.data.selectedCompany)!;

    await signIn({
      code: result.data.employeeNumber.trim(),
      filial: selected.department,
      keepSignedIn,
      password: result.data.password,
    });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-50"
    >
      <View
        className="flex-1 justify-between px-6 pt-8"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }}
      >
        <View className="pt-8">
          <View className="mb-8 h-20 w-48 items-start justify-center">
            <Image
              accessibilityIgnoresInvertColors
              className="h-full w-full"
              resizeMode="contain"
              source={logo}
            />
          </View>

          <Text
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: brandColor }}
          >
            Controle de portaria do Grupo Solar
          </Text>
          <Text className="mt-3 text-4xl font-black text-slate-950">
            Acesse sua conta
          </Text>
          <Text className="mt-3 text-base leading-6 text-slate-500">
            Entre com seu número de funcionário, senha e selecione a unidade de
            atendimento.
          </Text>
        </View>

        <View className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Text className="mb-3 text-sm font-semibold text-slate-700">
            Empresa e departamento
          </Text>

          <View className="mb-5 flex-row gap-3">
            {companies.map((item) => {
              const isSelected = selectedCompany === item.id;

              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  className="flex-1 rounded-lg border p-4"
                  onPress={() => {
                    setSelectedCompany(item.id);
                    setErrors((current) => ({ ...current, selectedCompany: undefined }));
                  }}
                  style={{
                    backgroundColor: isSelected ? item.brandColor : '#f8fafc',
                    borderColor: isSelected ? item.brandColor : '#e2e8f0',
                  }}
                >
                  <Text
                    className="text-base font-bold"
                    style={{ color: isSelected ? item.foregroundColor : '#0f172a' }}
                  >
                    {item.name}
                  </Text>
                  <Text
                    className="mt-1 text-sm"
                    style={{ color: isSelected ? item.foregroundColor : '#64748b' }}
                  >
                    {item.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <FieldError message={errors.selectedCompany} />

          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-slate-700">
              Número do funcionário
            </Text>
            <TextInput
              className="h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
              keyboardType="number-pad"
              onChangeText={(value) => {
                setEmployeeNumber(value);
                setErrors((current) => ({ ...current, employeeNumber: undefined }));
              }}
              placeholder="Digite seu número"
              placeholderTextColor="#64748b"
              returnKeyType="next"
              value={employeeNumber}
            />
            <FieldError message={errors.employeeNumber} />
          </View>

          <View className="mb-5">
            <Text className="mb-2 text-sm font-medium text-slate-700">
              Senha
            </Text>
            <View className="h-14 flex-row items-center rounded-lg border border-slate-200 bg-slate-50">
              <TextInput
                className="h-full flex-1 px-4 pr-2 text-base text-slate-900"
                onChangeText={(value) => {
                  setPassword(value);
                  setErrors((current) => ({ ...current, password: undefined }));
                }}
                placeholder="Digite sua senha"
                placeholderTextColor="#64748b"
                returnKeyType="done"
                secureTextEntry={!showPassword}
                value={password}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
                accessibilityState={{ selected: showPassword }}
                className="h-14 w-14 items-center justify-center"
                onPress={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <EyeOff size={22} stroke="#475569" strokeWidth={2.3} />
                ) : (
                  <Eye size={22} stroke="#475569" strokeWidth={2.3} />
                )}
              </Pressable>
            </View>
            <FieldError message={errors.password} />
          </View>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: keepSignedIn }}
            className="mb-5 flex-row items-center gap-3"
            onPress={() => setKeepSignedIn((value) => !value)}
          >
            <View
              className="h-6 w-6 items-center justify-center rounded-md border"
              style={{
                backgroundColor: keepSignedIn ? brandColor : '#ffffff',
                borderColor: keepSignedIn ? brandColor : '#cbd5e1',
              }}
            >
              {keepSignedIn && (
                <Check size={16} stroke={foregroundColor} strokeWidth={3} />
              )}
            </View>
            <Text className="flex-1 text-sm font-semibold text-slate-700">
              Continuar logado
            </Text>
          </Pressable>

          <View
            className="mb-5 rounded-lg border px-4 py-3"
            style={{
              backgroundColor: softColor,
              borderColor: brandColor,
            }}
          >
            <Text
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: brandColor }}
            >
              Departamento selecionado
            </Text>
            <Text className="mt-1 text-lg font-bold text-slate-900">
              {company ? `${company.department} - ${company.name}` : 'Selecione uma empresa'}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            className="h-14 items-center justify-center rounded-lg"
            onPress={handleSignIn}
            style={{ backgroundColor: loading ? '#94a3b8' : brandColor }}
          >
            <Text
              className="text-base font-bold"
              style={{ color: foregroundColor }}
            >
              {loading ? 'Carregando...' : 'Entrar'}
            </Text>
          </Pressable>
        </View>

        <View>
          <Text className="text-center text-xs text-slate-400">
            Acesso exclusivo para funcionários autorizados.
          </Text>
          <Text className="mt-1 text-center text-xs font-semibold text-slate-400">
            v2.0.0
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

type Company = {
  id: 'solar' | 'naturovos';
  name: string;
  department: '1' | '5';
  description: string;
  route: '/solar' | '/naturovos';
  brandColor: string;
  softColor: string;
  foregroundColor: string;
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
  },
  {
    id: 'naturovos',
    name: 'Naturovos',
    department: '5',
    description: 'Departamento 5',
    route: '/naturovos',
    brandColor: '#F9B233',
    softColor: '#FFF5DF',
    foregroundColor: '#1f2937',
  },
];

const defaultBrandColor = '#0d3b85';
const defaultSoftColor = '#e7eef8';
const defaultForegroundColor = '#0f172a';

export default function HomeScreen() {
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company['id'] | null>(null);

  const company = useMemo(
    () => companies.find((item) => item.id === selectedCompany),
    [selectedCompany],
  );

  const brandColor = company?.brandColor ?? defaultBrandColor;
  const softColor = company?.softColor ?? defaultSoftColor;
  const foregroundColor = company?.foregroundColor ?? defaultForegroundColor;

  function handleSignIn() {
    if (!employeeNumber.trim() || !password.trim()) {
      Alert.alert('Dados obrigatorios', 'Informe o numero do funcionario e a senha.');
      return;
    }

    if (!company) {
      Alert.alert('Empresa obrigatoria', 'Selecione Solar ou Naturovos para continuar.');
      return;
    }

    router.push(company.route);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-50"
    >
      <View className="flex-1 justify-between px-6 py-8">
        <View className="pt-8">
          <View
            className="mb-8 h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: softColor }}
          >
            <Text
              className="text-2xl font-black"
              style={{ color: brandColor }}
            >
              P
            </Text>
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
            Entre com seu numero de funcionario, senha e selecione a unidade de
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
                  onPress={() => setSelectedCompany(item.id)}
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

          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-slate-700">
              Numero do funcionario
            </Text>
            <TextInput
              className="h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
              keyboardType="number-pad"
              onChangeText={setEmployeeNumber}
              placeholder="Digite seu numero"
              placeholderTextColor="#64748b"
              returnKeyType="next"
              value={employeeNumber}
            />
          </View>

          <View className="mb-5">
            <Text className="mb-2 text-sm font-medium text-slate-700">
              Senha
            </Text>
            <TextInput
              className="h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
              onChangeText={setPassword}
              placeholder="Digite sua senha"
              placeholderTextColor="#64748b"
              returnKeyType="done"
              secureTextEntry
              value={password}
            />
          </View>

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
            className="h-14 items-center justify-center rounded-lg"
            onPress={handleSignIn}
            style={{ backgroundColor: brandColor }}
          >
            <Text
              className="text-base font-bold"
              style={{ color: foregroundColor }}
            >
              Entrar
            </Text>
          </Pressable>
        </View>

        <Text className="text-center text-xs text-slate-400">
          Acesso exclusivo para funcionarios autorizados.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

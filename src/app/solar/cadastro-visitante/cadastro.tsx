import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import type { Href } from 'expo-router';
import { ArrowLeft, CalendarDays, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { useAuth } from '@/app/contexts/auth';
import AppLayout from '@/components/layouts/layout';
import { saveVisitorVisit, VisitorRecord } from '@/services/visitor';
import { getFieldErrors } from '@/utils/validation';

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function parseVisitor(value: string | string[] | undefined): VisitorRecord | null {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as VisitorRecord;
  } catch {
    return null;
  }
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('pt-BR').format(value);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

function toBackendDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

function toBackendTime(value: Date) {
  const hour = String(value.getHours()).padStart(2, '0');
  const minute = String(value.getMinutes()).padStart(2, '0');

  return `${hour}${minute}`;
}

const baseVisitorSchema = z.object({
  cpfMotorista: z.string().min(1, 'Volte e informe o CPF do motorista.'),
  fornecedor: z.string().trim().min(1, 'Informe o fornecedor/prestador de servico.'),
  motorista: z.string().trim().min(1, 'Informe o visitante.'),
  placa: z.string().trim().max(7, 'A placa deve ter no maximo 7 caracteres.'),
  destino: z.string().trim().min(1, 'Informe o motivo da visita.'),
  observacao: z.string(),
  procedencia: z.string(),
});

const solarVisitorSchema = baseVisitorSchema.extend({
  motorista: z.string().trim().min(1, 'Informe o motorista.'),
  placa: z
    .string()
    .trim()
    .min(1, 'Informe a placa do veiculo.')
    .max(7, 'A placa deve ter no maximo 7 caracteres.'),
  nota: z.string().trim().max(10, 'A nota fiscal deve ter no maximo 10 caracteres.'),
  quantidade: z.string().trim().min(1, 'Informe a quantidade.'),
  produto: z.string().trim().min(1, 'Informe o produto/servico.'),
  transportadora: z.string(),
});

const naturovosVisitorSchema = baseVisitorSchema.extend({
  nota: z.string(),
  quantidade: z.string(),
  produto: z.string(),
  transportadora: z.string(),
});

type VisitorField =
  | 'cpfMotorista'
  | 'fornecedor'
  | 'motorista'
  | 'placa'
  | 'nota'
  | 'quantidade'
  | 'destino'
  | 'produto'
  | 'transportadora'
  | 'observacao'
  | 'procedencia';

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

export default function CadastroVisitanteFormScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const pathname = usePathname();
  const routePrefix = pathname.startsWith('/naturovos') ? '/naturovos' : '/solar';
  const isNaturovos = routePrefix === '/naturovos';
  const visitor = useMemo(() => parseVisitor(params.visitor), [params.visitor]);
  const cpf = Array.isArray(params.cpf) ? params.cpf[0] : params.cpf;
  const cpfMotorista = visitor?.cpfMotorista || cpf || '';

  const [motorista, setMotorista] = useState(visitor?.nomeMotorista ?? '');
  const [fornecedor, setFornecedor] = useState(visitor?.fornecedor ?? '');
  const [transportadora, setTransportadora] = useState(visitor?.transportadora ?? '');
  const [placa, setPlaca] = useState(visitor?.placaVeiculo ?? '');
  const [nota, setNota] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [destino, setDestino] = useState('');
  const [produto, setProduto] = useState('');
  const [observacao, setObservacao] = useState(visitor?.observacao ?? '');
  const [sintomas, setSintomas] = useState(false);
  const [granjas, setGranjas] = useState(false);
  const [procedencia, setProcedencia] = useState('');
  const [entryDate, setEntryDate] = useState(() => new Date());
  const [entryTime, setEntryTime] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<VisitorField, string>>>({});
  const [saving, setSaving] = useState(false);

  function clearError(field: VisitorField) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleDateChange(_event: unknown, selectedDate: Date) {
    setEntryDate(selectedDate);
    setShowDatePicker(false);
  }

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  async function handleSave() {
    const schema = isNaturovos ? naturovosVisitorSchema : solarVisitorSchema;
    const result = schema.safeParse({
      cpfMotorista,
      fornecedor,
      motorista,
      placa,
      nota,
      quantidade,
      destino,
      produto,
      transportadora,
      observacao,
      procedencia,
    });

    if (!result.success) {
      setErrors(getFieldErrors<VisitorField>(result.error));
      return;
    }

    setErrors({});

    setSaving(true);

    try {
      await saveVisitorVisit({
        filial: user?.filial,
        userCode: user?.code,
        cpf: cpfMotorista.replace(/\D/g, ''),
        motorista: motorista.trim(),
        data: toBackendDate(entryDate),
        fornecedor: fornecedor.trim(),
        transportadora: isNaturovos ? '' : transportadora.trim(),
        placa: placa.trim().toUpperCase(),
        nota: isNaturovos ? '' : nota.trim(),
        horaEntrada: toBackendTime(entryTime),
        quantidade: isNaturovos ? '' : quantidade.trim(),
        destino: destino.trim(),
        produto: isNaturovos ? '' : produto.trim(),
        observacao: observacao.trim(),
        sintomas: isNaturovos ? (sintomas ? '1' : '0') : undefined,
        granjas: isNaturovos ? (granjas ? '1' : '0') : undefined,
        procedencia: isNaturovos ? procedencia.trim() : undefined,
      });

      Alert.alert('Visita cadastrada', 'A entrada do visitante foi registrada.');
      router.replace(`${routePrefix}/cadastro-visitante` as Href);
    } catch (error) {
      Alert.alert(
        'Erro ao cadastrar',
        error instanceof Error ? error.message : 'Nao foi possivel cadastrar a visita.',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleTimeChange(_event: unknown, selectedTime: Date) {
    setEntryTime(selectedTime);
    setShowTimePicker(false);
  }

  return (
    <AppLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-6"
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 24) + keyboardHeight + 96,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-xl font-black text-slate-950">
              Cadastro de visitante
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar para busca"
              className="h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50"
              onPress={() => router.replace(`${routePrefix}/cadastro-visitante` as Href)}
            >
              <ArrowLeft size={20} stroke="#334155" strokeWidth={2.5} />
            </Pressable>
          </View>
          <Text className="mt-2 text-sm leading-5 text-slate-500">
            {visitor
              ? 'Dados recuperados. Confira as informacoes antes de registrar.'
              : 'Nenhum cadastro encontrado para este CPF. Preencha os dados para continuar.'}
          </Text>

          <View className="mt-6 gap-4">
            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                CPF do Motorista
              </Text>
              <TextInput
                className="h-14 rounded-lg border border-slate-200 bg-slate-100 px-4 text-base text-slate-700"
                editable={false}
                value={formatCpf(cpfMotorista)}
              />
              <FieldError message={errors.cpfMotorista} />
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                {isNaturovos ? 'Visitante' : 'Nome do motorista'}
              </Text>
              <TextInput
                className="h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
                onChangeText={(value) => {
                  setMotorista(value);
                  clearError('motorista');
                }}
                placeholder="Nome completo"
                placeholderTextColor="#64748b"
                value={motorista}
              />
              <FieldError message={errors.motorista} />
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                Fornecedor/prestador de servico
              </Text>
              <TextInput
                className="h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
                onChangeText={(value) => {
                  setFornecedor(value);
                  clearError('fornecedor');
                }}
                placeholder="Fornecedor ou prestador"
                placeholderTextColor="#64748b"
                value={fornecedor}
              />
              <FieldError message={errors.fornecedor} />
            </View>

            {!isNaturovos && (
              <View>
                <Text className="mb-2 text-sm font-semibold text-slate-700">
                  Transportadora
                </Text>
                <TextInput
                  className="h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
                  onChangeText={(value) => {
                    setTransportadora(value);
                    clearError('transportadora');
                  }}
                  placeholder="Transportadora"
                  placeholderTextColor="#64748b"
                  value={transportadora}
                />
                <FieldError message={errors.transportadora} />
              </View>
            )}

            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                Placa do veiculo
              </Text>
              <TextInput
                autoCapitalize="characters"
                className="h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
                maxLength={7}
                onChangeText={(value) => {
                  setPlaca(value.toUpperCase());
                  clearError('placa');
                }}
                placeholder="ABC1D23"
                placeholderTextColor="#64748b"
                value={placa}
              />
              <FieldError message={errors.placa} />
            </View>

            {!isNaturovos && (
              <View>
                <Text className="mb-2 text-sm font-semibold text-slate-700">
                  Nota fiscal
                </Text>
                <TextInput
                  className="h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
                  keyboardType="number-pad"
                  maxLength={10}
                  onChangeText={(value) => {
                    setNota(value);
                    clearError('nota');
                  }}
                  placeholder="Numero da nota"
                  placeholderTextColor="#64748b"
                  value={nota}
                />
                <FieldError message={errors.nota} />
              </View>
            )}

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-2 text-sm font-semibold text-slate-700">
                  Data de entrada
                </Text>
                <Pressable
                  accessibilityRole="button"
                  className="h-14 flex-row items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4"
                  onPress={() => setShowDatePicker(true)}
                >
                  <CalendarDays size={18} stroke="#334155" strokeWidth={2.4} />
                  <Text className="text-base font-semibold text-slate-900">
                    {formatDate(entryDate)}
                  </Text>
                </Pressable>
              </View>

              <View className="flex-1">
                <Text className="mb-2 text-sm font-semibold text-slate-700">
                  Hora de entrada
                </Text>
                <Pressable
                  accessibilityRole="button"
                  className="h-14 flex-row items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4"
                  onPress={() => setShowTimePicker(true)}
                >
                  <Clock size={18} stroke="#334155" strokeWidth={2.4} />
                  <Text className="text-base font-semibold text-slate-900">
                    {formatTime(entryTime)}
                  </Text>
                </Pressable>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                mode="date"
                onDismiss={() => setShowDatePicker(false)}
                onValueChange={handleDateChange}
                value={entryDate}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                is24Hour
                mode="time"
                onDismiss={() => setShowTimePicker(false)}
                onValueChange={handleTimeChange}
                value={entryTime}
              />
            )}

            {!isNaturovos && (
              <View>
                <Text className="mb-2 text-sm font-semibold text-slate-700">
                  Quantidade
                </Text>
                <TextInput
                  className="h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
                  keyboardType="numeric"
                  onChangeText={(value) => {
                    setQuantidade(value);
                    clearError('quantidade');
                  }}
                  placeholder="Quantidade"
                  placeholderTextColor="#64748b"
                  value={quantidade}
                />
                <FieldError message={errors.quantidade} />
              </View>
            )}

            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                {isNaturovos ? 'Motivo da visita' : 'Destino'}
              </Text>
              <TextInput
                className="h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
                onChangeText={(value) => {
                  setDestino(value);
                  clearError('destino');
                }}
                placeholder={isNaturovos ? 'Motivo da visita' : 'Destino da visita'}
                placeholderTextColor="#64748b"
                value={destino}
              />
              <FieldError message={errors.destino} />
            </View>

            {!isNaturovos && (
              <View>
                <Text className="mb-2 text-sm font-semibold text-slate-700">
                  Produto/servico
                </Text>
                <TextInput
                  className="h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
                  onChangeText={(value) => {
                    setProduto(value);
                    clearError('produto');
                  }}
                  placeholder="Produto ou servico"
                  placeholderTextColor="#64748b"
                  value={produto}
                />
                <FieldError message={errors.produto} />
              </View>
            )}

            {isNaturovos && (
              <>
                <View className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <Text className="text-sm font-semibold leading-5 text-slate-700">
                    Apresentou sintomas entericos ou respiratorios nos ultimos 15 dias?
                  </Text>
                  <View className="mt-3 flex-row items-center gap-3">
                    <Text className="text-sm font-bold text-slate-600">Nao</Text>
                    <Switch
                      onValueChange={setSintomas}
                      thumbColor={sintomas ? '#F9B233' : '#1A9CD9'}
                      trackColor={{ false: '#bfdbfe', true: '#fde68a' }}
                      value={sintomas}
                    />
                    <Text className="text-sm font-bold text-slate-600">Sim</Text>
                  </View>
                </View>

                <View className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <Text className="text-sm font-semibold leading-5 text-slate-700">
                    Visitou granjas ou frigorificos nas ultimas 72 horas?
                  </Text>
                  <View className="mt-3 flex-row items-center gap-3">
                    <Text className="text-sm font-bold text-slate-600">Nao</Text>
                    <Switch
                      onValueChange={setGranjas}
                      thumbColor={granjas ? '#F9B233' : '#1A9CD9'}
                      trackColor={{ false: '#bfdbfe', true: '#fde68a' }}
                      value={granjas}
                    />
                    <Text className="text-sm font-bold text-slate-600">Sim</Text>
                  </View>
                </View>

                <View>
                  <Text className="mb-2 text-sm font-semibold text-slate-700">
                    Ultima procedencia
                  </Text>
                  <TextInput
                    className="h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
                    onChangeText={(value) => {
                      setProcedencia(value);
                      clearError('procedencia');
                    }}
                    placeholder="Cidade, granja, frigorifico ou origem"
                    placeholderTextColor="#64748b"
                    value={procedencia}
                  />
                  <FieldError message={errors.procedencia} />
                </View>
              </>
            )}

            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                Observacao
              </Text>
              <TextInput
                className="min-h-24 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
                multiline
                onChangeText={(value) => {
                  setObservacao(value);
                  clearError('observacao');
                }}
                placeholder="Informacoes adicionais"
                placeholderTextColor="#64748b"
                textAlignVertical="top"
                value={observacao}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              className="h-14 flex-row items-center justify-center gap-2 rounded-lg"
              disabled={saving}
              onPress={handleSave}
              style={{
                backgroundColor: isNaturovos ? '#F9B233' : '#1A9CD9',
                opacity: saving ? 0.72 : 1,
              }}
            >
              {saving && <ActivityIndicator color={isNaturovos ? '#111827' : '#ffffff'} />}
              <Text
                className="text-base font-bold"
                style={{ color: isNaturovos ? '#111827' : '#ffffff' }}
              >
                {saving ? 'Salvando...' : isNaturovos ? 'Proximo' : 'Cadastrar visita'}
              </Text>
            </Pressable>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}

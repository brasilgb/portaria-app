import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle,
  Search,
  Trash2,
  Truck,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/app/contexts/auth';
import AppLayout from '@/components/layouts/layout';
import {
  CarrierRecord,
  listCarriers,
  saveCargoArrival,
} from '@/services/cargo';
import { getFieldErrors } from '@/utils/validation';
import { z } from 'zod';

const cargoEntryTypes = [
  { label: 'Entrada', value: 1 },
  { label: 'Coleta', value: 2 },
  { label: 'Integrados/Transf.', value: 3 },
] as const;

const cargoSchema = z.object({
  carrierCode: z.string().trim().min(1, 'Selecione a transportadora.').refine(
    (value) => value !== '0',
    'Selecione a transportadora.',
  ),
  carrierName: z.string().trim().min(1, 'Informe a transportadora.'),
  placa: z
    .string()
    .trim()
    .min(1, 'Informe a placa.')
    .max(7, 'A placa deve ter no maximo 7 caracteres.'),
  motorista: z.string().trim().min(1, 'Informe o nome do motorista.'),
  produto: z.string().trim().min(1, 'Informe o tipo de mercadoria.'),
  pager: z.string(),
  notas: z.string(),
});

type CargoField =
  | 'carrierCode'
  | 'carrierName'
  | 'placa'
  | 'motorista'
  | 'produto'
  | 'pager'
  | 'notas';

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

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

export default function NaturovosCadastroCargaScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [carriers, setCarriers] = useState<CarrierRecord[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierRecord | null>(null);
  const [carrierCode, setCarrierCode] = useState('0');
  const [carrierName, setCarrierName] = useState('');
  const [placa, setPlaca] = useState('');
  const [motorista, setMotorista] = useState('');
  const [produto, setProduto] = useState('');
  const [pager, setPager] = useState('');
  const [notas, setNotas] = useState('');
  const [tipoEntrada, setTipoEntrada] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [loadingCarriers, setLoadingCarriers] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<CargoField, string>>>({});
  const [saving, setSaving] = useState(false);

  function clearError(field: CargoField) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  const filteredCarriers = useMemo(() => {
    const term = normalize(searchText.trim());

    if (!term) {
      return carriers;
    }

    return carriers.filter((carrier) => {
      return (
        normalize(String(carrier.codigo)).includes(term) ||
        normalize(carrier.nome ?? '').includes(term)
      );
    });
  }, [carriers, searchText]);

  useEffect(() => {
    async function loadCarriers() {
      setLoadingCarriers(true);

      try {
        const data = await listCarriers();
        setCarriers(data);
      } catch (error) {
        Alert.alert(
          'Erro ao carregar',
          error instanceof Error
            ? error.message
            : 'Nao foi possivel carregar as transportadoras.',
        );
      } finally {
        setLoadingCarriers(false);
      }
    }

    loadCarriers();
  }, []);

  function selectCarrier(carrier: CarrierRecord) {
    setSelectedCarrier(carrier);
    setCarrierCode(String(carrier.codigo));
    setCarrierName(carrier.nome ?? '');
    setErrors((current) => ({
      ...current,
      carrierCode: undefined,
      carrierName: undefined,
    }));
    setSearchText('');
    setShowCarrierModal(false);
  }

  function clearCarrier() {
    setSelectedCarrier(null);
    setCarrierCode('0');
    setCarrierName('');
    setErrors((current) => ({ ...current, carrierCode: undefined, carrierName: undefined }));
  }

  async function handleSave() {
    const result = cargoSchema.safeParse({
      carrierCode,
      carrierName,
      placa,
      motorista,
      produto,
      pager,
      notas,
    });

    if (!result.success) {
      setErrors(getFieldErrors<CargoField>(result.error));
      return;
    }

    setErrors({});

    setSaving(true);

    try {
      await saveCargoArrival({
        filial: user?.filial,
        userCode: user?.code,
        carrierCode: carrierCode.trim(),
        carrierName: carrierName.trim(),
        placa: placa.trim().toUpperCase(),
        motorista: motorista.trim(),
        produto: produto.trim(),
        pager: pager.trim(),
        notas: notas.trim(),
        tipoEntrada,
      });

      Alert.alert('Chegada registrada', 'A chegada da carga foi registrada.');
      router.replace('/naturovos/cargas' as Href);
    } catch (error) {
      Alert.alert(
        'Erro ao registrar',
        error instanceof Error
          ? error.message
          : 'Nao foi possivel registrar a chegada da carga.',
      );
    } finally {
      setSaving(false);
    }
  }

  function renderCarrier({ item }: { item: CarrierRecord }) {
    return (
      <Pressable
        accessibilityRole="button"
        className="rounded-lg border border-slate-200 bg-white px-4 py-3"
        onPress={() => selectCarrier(item)}
      >
        <Text className="text-sm font-black text-slate-950">{item.codigo}</Text>
        <Text className="mt-1 text-sm font-semibold text-slate-600">
          {item.nome}
        </Text>
      </Pressable>
    );
  }

  return (
    <AppLayout>
      <Modal
        animationType="slide"
        onRequestClose={() => setShowCarrierModal(false)}
        transparent
        visible={showCarrierModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 px-5 py-10">
            <View className="flex-1 rounded-lg bg-slate-50 p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-12 flex-1 flex-row items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
                  <Search size={18} stroke="#64748b" strokeWidth={2.4} />
                  <TextInput
                    className="flex-1 text-base text-slate-900"
                    onChangeText={setSearchText}
                    placeholder="Buscar transportadora"
                    placeholderTextColor="#64748b"
                    value={searchText}
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Fechar busca"
                  className="h-12 w-12 items-center justify-center rounded-lg bg-white"
                  onPress={() => setShowCarrierModal(false)}
                >
                  <X size={20} stroke="#334155" strokeWidth={2.5} />
                </Pressable>
              </View>

              <View className="mt-4 flex-1">
                <FlashList
                  data={filteredCarriers}
                  keyExtractor={(item, index) => `${item.codigo}-${index}`}
                  renderItem={renderCarrier}
                  ListEmptyComponent={
                    <View className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8">
                      <Text className="text-center text-base font-bold text-slate-800">
                        Nenhuma transportadora encontrada
                      </Text>
                    </View>
                  }
                  ItemSeparatorComponent={() => <View className="h-2" />}
                  keyboardShouldPersistTaps="handled"
                  refreshing={loadingCarriers}
                  onRefresh={async () => {
                    setLoadingCarriers(true);
                    try {
                      setCarriers(await listCarriers());
                    } finally {
                      setLoadingCarriers(false);
                    }
                  }}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-6"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 72 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-xl font-black text-slate-950">
                Cadastrar chegada de carga
              </Text>
              <Text className="mt-2 text-sm leading-5 text-slate-500">
                Preencha corretamente os campos abaixo.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar para cargas"
              className="h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50"
              onPress={() => router.replace('/naturovos/cargas' as Href)}
            >
              <ArrowLeft size={20} stroke="#334155" strokeWidth={2.5} />
            </Pressable>
          </View>

          <View className="mt-6 gap-4">
            <Pressable
              accessibilityRole="button"
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              onPress={() => setShowCarrierModal(true)}
            >
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                Buscar transportadora
              </Text>
              <View className="flex-row items-center gap-3">
                <Truck size={20} stroke="#334155" strokeWidth={2.4} />
                <View className="min-w-0 flex-1">
                  <Text className="text-base font-black text-slate-950">
                    {carrierCode || '0'}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-500" numberOfLines={1}>
                    {selectedCarrier?.nome ?? 'Toque para selecionar'}
                  </Text>
                </View>
                <Search size={18} stroke="#F9B233" strokeWidth={2.5} />
              </View>
              <FieldError message={errors.carrierCode} />
            </Pressable>

            {selectedCarrier && (
              <Pressable
                accessibilityRole="button"
                className="h-11 flex-row items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white"
                onPress={clearCarrier}
              >
                <Trash2 size={17} stroke="#dc2626" strokeWidth={2.4} />
                <Text className="text-sm font-bold text-red-600">
                  Limpar transportadora
                </Text>
              </Pressable>
            )}

            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                Transportadora
              </Text>
              <TextInput
                className="h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
                onChangeText={(value) => {
                  setCarrierName(value);
                  clearError('carrierName');
                }}
                placeholder="Nome da transportadora"
                placeholderTextColor="#64748b"
                value={carrierName}
              />
              <FieldError message={errors.carrierName} />
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                Placa
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

            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                Nome do motorista
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
                Tipo de mercadoria
              </Text>
              <TextInput
                className="h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
                onChangeText={(value) => {
                  setProduto(value);
                  clearError('produto');
                }}
                placeholder="Mercadoria"
                placeholderTextColor="#64748b"
                value={produto}
              />
              <FieldError message={errors.produto} />
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                ID Pager
              </Text>
              <TextInput
                autoCapitalize="characters"
                className="h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
                onChangeText={(value) => {
                  setPager(value);
                  clearError('pager');
                }}
                placeholder="Pager"
                placeholderTextColor="#64748b"
                value={pager}
              />
              <FieldError message={errors.pager} />
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                Nota fiscal
              </Text>
              <TextInput
                autoCapitalize="characters"
                className="h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
                onChangeText={(value) => {
                  setNotas(value);
                  clearError('notas');
                }}
                placeholder="Nota fiscal"
                placeholderTextColor="#64748b"
                value={notas}
              />
              <FieldError message={errors.notas} />
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                Tipo de entrada
              </Text>
              <View className="gap-2">
                {cargoEntryTypes.map((entryType) => {
                  const isSelected = tipoEntrada === entryType.value;

                  return (
                    <Pressable
                      key={entryType.value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      className="h-12 flex-row items-center gap-3 rounded-lg border px-4"
                      onPress={() => setTipoEntrada(entryType.value)}
                      style={{
                        backgroundColor: isSelected ? '#FFF7E6' : '#f8fafc',
                        borderColor: isSelected ? '#F9B233' : '#e2e8f0',
                      }}
                    >
                      <CheckCircle
                        size={18}
                        stroke={isSelected ? '#F9B233' : '#94a3b8'}
                        strokeWidth={2.5}
                      />
                      <Text
                        className="text-sm font-bold"
                        style={{ color: isSelected ? '#92400e' : '#475569' }}
                      >
                        {entryType.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              className="h-14 flex-row items-center justify-center gap-2 rounded-lg bg-[#F9B233]"
              disabled={saving}
              onPress={handleSave}
              style={{ opacity: saving ? 0.72 : 1 }}
            >
              {saving && <ActivityIndicator color="#111827" />}
              <Text className="text-base font-black text-[#111827]">
                {saving ? 'Salvando...' : 'Registrar chegada'}
              </Text>
            </Pressable>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Info,
  Scale,
  X,
} from 'lucide-react-native';
import { Modalize } from 'react-native-modalize';
import type { Modalize as ModalizeHandle } from 'react-native-modalize';
import { z } from 'zod';

import { useAuth } from '@/app/contexts/auth';
import AppLayout from '@/components/layouts/layout';
import {
  captureCargoWeight,
  CargoStatusRecord,
  listCargoStatus,
  updateCargoStatus,
} from '@/services/cargo';
import { getFieldErrors } from '@/utils/validation';

const weightSchema = z.object({
  peso: z.string().trim().min(1, 'Informe o peso da carga.'),
});

type WeightField = 'peso';

function getStatusValue(status?: string | string[]) {
  return Array.isArray(status) ? status[0] : status ?? '1';
}

function getStatusTitle(status: string) {
  switch (status) {
    case '1':
      return 'Informar Nota';
    case '2':
      return 'Entrada';
    case '3':
      return 'Saída';
    default:
      return 'Cargas aguardando';
  }
}

function getActionText(status: string) {
  switch (status) {
    case '1':
      return 'Confirmar nota';
    case '2':
      return 'Confirmar entrada';
    case '3':
      return 'Confirmar saída';
    default:
      return 'Confirmar';
  }
}

function getActionCode(status: string) {
  return status === '3' ? '2' : '1';
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View className="border-b border-slate-100 px-4 py-3">
      <Text className="text-xs font-bold uppercase text-slate-400">{label}</Text>
      <Text className="mt-1 text-base font-semibold text-slate-900">
        {value || '-'}
      </Text>
    </View>
  );
}

interface CargoDetailsModalProps {
  cargo: CargoStatusRecord | null;
  onClose(): void;
}

function CargoDetailsModal({ cargo, onClose }: CargoDetailsModalProps) {
  const modalRef = useRef<ModalizeHandle>(null);
  const closingRef = useRef(false);
  const { height } = useWindowDimensions();

  const closeModal = useCallback(() => {
    closingRef.current = true;
    modalRef.current?.close();
  }, []);

  const handleModalClose = useCallback(() => {
    closingRef.current = true;
    onClose();
  }, [onClose]);

  const handleModalClosed = useCallback(() => {
    closingRef.current = false;
  }, []);

  const handleModalOpened = useCallback(() => {
    closingRef.current = false;
  }, []);

  useEffect(() => {
    let animationFrame: number | null = null;

    if (cargo) {
      closingRef.current = false;
      animationFrame = requestAnimationFrame(() => {
        modalRef.current?.open();
      });
    } else if (!closingRef.current) {
      modalRef.current?.close();
    }

    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [cargo]);

  return (
    <Modalize
      ref={modalRef}
      modalHeight={Math.round(height * 0.78)}
      modalStyle={{
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
      }}
      handlePosition="inside"
      handleStyle={{ backgroundColor: '#cbd5e1', width: 48 }}
      overlayStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.48)' }}
      onClose={handleModalClose}
      onClosed={handleModalClosed}
      onOpened={handleModalOpened}
      withReactModal
      scrollViewProps={{
        keyboardShouldPersistTaps: 'handled',
        showsVerticalScrollIndicator: false,
        contentContainerStyle: { paddingBottom: 24 },
      }}
      HeaderComponent={
        <View className="px-5 pb-4 pt-8">
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-xl font-black text-slate-950">
                Detalhes da carga
              </Text>
              <Text className="mt-1 text-sm text-slate-500">
                Placa {cargo?.placa || '-'}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              className="h-10 w-10 items-center justify-center rounded-lg bg-slate-100"
              onPress={closeModal}
            >
              <X size={20} stroke="#334155" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      }
    >
      <View className="px-5">
        <View className="overflow-hidden rounded-lg border border-slate-200">
          <InfoRow label="Código" value={cargo?.codigo} />
          <InfoRow label="Pager" value={cargo?.pager} />
          <InfoRow label="Placa" value={cargo?.placa} />
          <InfoRow label="Transportadora" value={cargo?.transportadora} />
          <InfoRow label="Motorista" value={cargo?.motorista} />
          <InfoRow label="Produto" value={cargo?.produto} />
          <InfoRow label="Data/Hora chegada" value={cargo?.dhChegada} />
          <InfoRow label="Setor" value={cargo?.setor} />
          <InfoRow label="Status" value={cargo?.status} />
        </View>
      </View>
    </Modalize>
  );
}

interface CargoWeightModalProps {
  cargo: CargoStatusRecord | null;
  loading: boolean;
  error?: string;
  onCaptureWeight(): Promise<void>;
  onClose(): void;
  onConfirm(weight: string): Promise<void>;
  status: string;
  weight: string;
  onWeightChange(value: string): void;
}

function CargoWeightModal({
  cargo,
  loading,
  error,
  onCaptureWeight,
  onClose,
  onConfirm,
  status,
  weight,
  onWeightChange,
}: CargoWeightModalProps) {
  const modalRef = useRef<ModalizeHandle>(null);
  const closingRef = useRef(false);
  const { height } = useWindowDimensions();

  const closeModal = useCallback(() => {
    closingRef.current = true;
    modalRef.current?.close();
  }, []);

  const handleModalClose = useCallback(() => {
    closingRef.current = true;
    onClose();
  }, [onClose]);

  const handleModalClosed = useCallback(() => {
    closingRef.current = false;
  }, []);

  const handleModalOpened = useCallback(() => {
    closingRef.current = false;
  }, []);

  useEffect(() => {
    let animationFrame: number | null = null;

    if (cargo) {
      closingRef.current = false;
      animationFrame = requestAnimationFrame(() => {
        modalRef.current?.open();
      });
    } else if (!closingRef.current) {
      modalRef.current?.close();
    }

    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [cargo]);

  return (
    <Modalize
      ref={modalRef}
      modalHeight={Math.round(height * 0.58)}
      modalStyle={{
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
      }}
      handlePosition="inside"
      handleStyle={{ backgroundColor: '#cbd5e1', width: 48 }}
      overlayStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.48)' }}
      onClose={handleModalClose}
      onClosed={handleModalClosed}
      onOpened={handleModalOpened}
      withReactModal
      scrollViewProps={{
        keyboardShouldPersistTaps: 'handled',
        showsVerticalScrollIndicator: false,
        contentContainerStyle: { paddingBottom: 24 },
      }}
      HeaderComponent={
        <View className="px-5 pb-4 pt-8">
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-xl font-black text-slate-950">
                {getActionText(status)}
              </Text>
              <Text className="mt-1 text-sm text-slate-500">
                Carga {cargo?.codigo || '-'} - placa {cargo?.placa || '-'}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              className="h-10 w-10 items-center justify-center rounded-lg bg-slate-100"
              onPress={closeModal}
            >
              <X size={20} stroke="#334155" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="px-5"
      >
        <View>
          <Text className="mb-2 text-sm font-semibold text-slate-700">
            Peso da carga
          </Text>
          <View className="h-14 flex-row items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4">
            <TextInput
              className="flex-1 text-base text-slate-900"
              keyboardType="numeric"
              onChangeText={onWeightChange}
              placeholder="Informe ou capture o peso"
              placeholderTextColor="#64748b"
            value={weight}
          />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Capturar peso"
              className="h-10 w-10 items-center justify-center rounded-lg bg-white"
              disabled={loading}
              onPress={onCaptureWeight}
            >
              {loading ? (
                <ActivityIndicator color="#F9B233" />
              ) : (
                <Scale size={19} stroke="#334155" strokeWidth={2.5} />
              )}
            </Pressable>
        </View>
        {error && (
          <Text className="mt-2 text-sm font-semibold text-red-600">
            {error}
          </Text>
        )}

        <Pressable
            accessibilityRole="button"
            className="mt-5 h-14 flex-row items-center justify-center gap-2 rounded-lg bg-[#F9B233]"
            disabled={loading}
            onPress={() => onConfirm(weight)}
            style={{ opacity: loading ? 0.72 : 1 }}
          >
            {loading && <ActivityIndicator color="#111827" />}
            <Text className="text-base font-black text-[#111827]">
              {loading ? 'Processando...' : getActionText(status)}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modalize>
  );
}

export default function NaturovosCargaStatusScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const status = getStatusValue(params.status);
  const title = getStatusTitle(status);
  const [cargas, setCargas] = useState<CargoStatusRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsCargo, setDetailsCargo] = useState<CargoStatusRecord | null>(null);
  const [actionCargo, setActionCargo] = useState<CargoStatusRecord | null>(null);
  const [weight, setWeight] = useState('');
  const [weightErrors, setWeightErrors] = useState<Partial<Record<WeightField, string>>>({});
  const [processingWeight, setProcessingWeight] = useState(false);

  const loadCargas = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const data = await listCargoStatus(status, user?.filial);
        setCargas(data);
      } catch (error) {
        Alert.alert(
          'Erro ao carregar',
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar as cargas.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [status, user?.filial],
  );

  useEffect(() => {
    loadCargas();
  }, [loadCargas]);

  function openActionModal(cargo: CargoStatusRecord) {
    setActionCargo(cargo);
    setWeight('');
    setWeightErrors({});
  }

  async function handleCaptureWeight() {
    setProcessingWeight(true);

    try {
      const capturedWeight = await captureCargoWeight(user?.filial);
      setWeight(capturedWeight);
      setWeightErrors({});
    } catch (error) {
      Alert.alert(
        'Erro ao capturar',
        error instanceof Error ? error.message : 'Não foi possível capturar o peso.',
      );
    } finally {
      setProcessingWeight(false);
    }
  }

  async function handleConfirm(weightValue: string) {
    if (!actionCargo) {
      return;
    }

    const result = weightSchema.safeParse({ peso: weightValue });

    if (!result.success) {
      setWeightErrors(getFieldErrors<WeightField>(result.error));
      return;
    }

    setProcessingWeight(true);

    try {
      await updateCargoStatus({
        userCode: user?.code,
        codigo: actionCargo.codigo,
        acao: getActionCode(status),
        peso: result.data.peso.trim(),
      });

      Alert.alert('Sucesso', `${getActionText(status)} registrada com sucesso.`);
      setActionCargo(null);
      setWeight('');
      setWeightErrors({});
      await loadCargas(false);
    } catch (error) {
      Alert.alert(
        'Erro ao confirmar',
        error instanceof Error
          ? error.message
          : 'Não foi possível alterar o status da carga.',
      );
    } finally {
      setProcessingWeight(false);
    }
  }

  function renderCargo({ item }: { item: CargoStatusRecord }) {
    const ActionIcon = status === '3' ? ArrowUpFromLine : ArrowDownToLine;

    return (
      <View className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-base font-black text-slate-950" numberOfLines={1}>
              {item.placa || 'Placa não informada'}
            </Text>
            <Text className="mt-1 text-sm font-semibold text-slate-500">
              Código: {item.codigo || '-'} | Pager: {item.pager || '-'}
            </Text>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver informações completas"
              className="h-10 w-10 items-center justify-center rounded-lg bg-white"
              onPress={() => setDetailsCargo(item)}
            >
              <Info size={18} stroke="#1A9CD9" strokeWidth={2.5} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={getActionText(status)}
              className="h-10 w-10 items-center justify-center rounded-lg bg-white"
              onPress={() => openActionModal(item)}
            >
              <ActionIcon size={19} stroke="#F9B233" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>

        <View className="mt-4 gap-2 rounded-lg bg-white px-3 py-3">
          <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>
            {item.produto || 'Produto não informado'}
          </Text>
          <Text className="text-sm text-slate-500" numberOfLines={1}>
            Motorista: {item.motorista || '-'}
          </Text>
          <Text className="text-sm text-slate-500">
            Chegada: {item.dhChegada || '-'}
          </Text>
        </View>
      </View>
    );
  }

  function renderEmpty() {
    if (loading) {
      return (
        <View className="items-center justify-center py-12">
          <ActivityIndicator color="#F9B233" />
          <Text className="mt-3 text-sm font-semibold text-slate-500">
            Carregando cargas...
          </Text>
        </View>
      );
    }

    return (
      <View className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8">
        <Text className="text-center text-base font-bold text-slate-800">
          Nenhuma carga encontrada
        </Text>
        <Text className="mt-2 text-center text-sm text-slate-500">
          Puxe para atualizar ou volte para outra etapa.
        </Text>
      </View>
    );
  }

  return (
    <AppLayout>
      <View className="flex-1 px-5 py-6">
        <View className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-xl font-black text-slate-950">{title}</Text>
              <Text className="mt-2 text-sm leading-5 text-slate-500">
                Cargas aguardando {title.toLowerCase()}.
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
        </View>

        <FlashList
          data={loading ? [] : cargas}
          keyExtractor={(item, index) => `${item.codigo}-${item.placa}-${index}`}
          renderItem={renderCargo}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadCargas(false);
          }}
        />

        <CargoDetailsModal
          cargo={detailsCargo}
          onClose={() => setDetailsCargo(null)}
        />
        <CargoWeightModal
          cargo={actionCargo}
          loading={processingWeight}
          onCaptureWeight={handleCaptureWeight}
          onClose={() => {
          setActionCargo(null);
          setWeight('');
          setWeightErrors({});
        }}
          onConfirm={handleConfirm}
          status={status}
          weight={weight}
          error={weightErrors.peso}
          onWeightChange={(value) => {
            setWeight(value);
            setWeightErrors((current) => ({ ...current, peso: undefined }));
          }}
        />
      </View>
    </AppLayout>
  );
}

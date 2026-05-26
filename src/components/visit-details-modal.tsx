import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Easing,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Modalize } from 'react-native-modalize';
import type { Modalize as ModalizeHandle } from 'react-native-modalize';

import {
  getVisitorVisitDetails,
  VisitDetailsRecord,
} from '@/services/visitor';

interface VisitDetailsModalProps {
  ident: number | null;
  onClose(): void;
  visible: boolean;
}

const MODAL_OPEN_ANIMATION_CONFIG = {
  timing: {
    duration: 360,
    easing: Easing.out(Easing.cubic),
  },
};

const MODAL_CLOSE_ANIMATION_CONFIG = {
  timing: {
    duration: 240,
    easing: Easing.in(Easing.cubic),
  },
};

function formatCpf(value?: string | number) {
  const rawValue = String(value ?? '').replace(/\D/g, '');

  if (!rawValue) {
    return '-';
  }

  const digits = rawValue.padStart(11, '0').slice(-11);

  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

function formatBackendDate(value?: string | number) {
  const rawValue = String(value ?? '').padStart(8, '0');

  if (rawValue.length !== 8 || rawValue === '00010101') {
    return '-';
  }

  return `${rawValue.slice(6, 8)}/${rawValue.slice(4, 6)}/${rawValue.slice(0, 4)}`;
}

function formatBackendTime(value?: string | number) {
  const rawValue = String(value ?? '').padStart(4, '0');

  if (rawValue === '0000') {
    return '-';
  }

  return `${rawValue.slice(0, 2)}:${rawValue.slice(2, 4)}`;
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

export default function VisitDetailsModal({
  ident,
  onClose,
  visible,
}: VisitDetailsModalProps) {
  const modalRef = useRef<ModalizeHandle>(null);
  const closingRef = useRef(false);
  const { height } = useWindowDimensions();
  const [visit, setVisit] = useState<VisitDetailsRecord | null>(null);
  const [loading, setLoading] = useState(false);

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
    setVisit(null);
    setLoading(false);
  }, []);

  const handleModalOpened = useCallback(() => {
    closingRef.current = false;
  }, []);

  const loadDetails = useCallback(async () => {
    if (!ident) {
      return;
    }

    setLoading(true);

    try {
      const details = await getVisitorVisitDetails(ident);
      setVisit(details);
    } catch (error) {
      Alert.alert(
        'Erro ao carregar',
        error instanceof Error
          ? error.message
          : 'Nao foi possivel carregar as informacoes da visita.',
      );
      onClose();
    } finally {
      setLoading(false);
    }
  }, [ident, onClose]);

  useEffect(() => {
    let animationFrame: number | null = null;

    if (visible) {
      closingRef.current = false;
      animationFrame = requestAnimationFrame(() => {
        modalRef.current?.open();
      });
      loadDetails();
    } else if (!closingRef.current) {
      modalRef.current?.close();
      setVisit(null);
      setLoading(false);
    }

    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [loadDetails, visible]);

  return (
    <Modalize
      ref={modalRef}
      modalHeight={Math.round(height * 0.86)}
      modalStyle={{
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
      }}
      handlePosition="inside"
      handleStyle={{ backgroundColor: '#cbd5e1', width: 48 }}
      overlayStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.48)' }}
      panGestureEnabled
      panGestureComponentEnabled
      closeOnOverlayTap
      threshold={80}
      velocity={1800}
      openAnimationConfig={MODAL_OPEN_ANIMATION_CONFIG}
      closeAnimationConfig={MODAL_CLOSE_ANIMATION_CONFIG}
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
                Informacoes do visitante
              </Text>
              <Text className="mt-1 text-sm text-slate-500">
                Dados completos da visita selecionada.
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
        {loading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator color="#1A9CD9" />
            <Text className="mt-3 text-sm font-semibold text-slate-500">
              Carregando informacoes...
            </Text>
          </View>
        ) : visit ? (
          <View className="overflow-hidden rounded-lg border border-slate-200">
            <InfoRow label="Visitante" value={visit.nome} />
            <InfoRow label="CPF" value={formatCpf(visit.cpf)} />
            <InfoRow label="Placa" value={visit.placa} />
            <InfoRow label="Fornecedor" value={visit.fornecedor} />
            <InfoRow label="Transportadora" value={visit.transportadora} />
            <InfoRow label="Nota" value={visit.nota} />
            <InfoRow label="Pedido" value={visit.pedido} />
            <InfoRow label="Data entrada" value={formatBackendDate(visit.dataEntrada)} />
            <InfoRow label="Hora entrada" value={formatBackendTime(visit.horaEntrada)} />
            <InfoRow label="Data saida" value={formatBackendDate(visit.dataSaida)} />
            <InfoRow label="Hora saida" value={formatBackendTime(visit.horaSaida)} />
            <InfoRow label="Quantidade" value={visit.quantidade} />
            <InfoRow label="Destino" value={visit.destino} />
            <InfoRow label="Produto/Servico" value={visit.produto} />
            <InfoRow
              label="Observacoes"
              value={visit.observacoes ?? visit.observacao}
            />
          </View>
        ) : (
          <View className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8">
            <Text className="text-center text-base font-bold text-slate-800">
              Visita nao encontrada
            </Text>
          </View>
        )}
      </View>
    </Modalize>
  );
}

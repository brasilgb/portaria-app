import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from 'expo-router';
import { CalendarDays, Info, RotateCcw } from 'lucide-react-native';

import { useAuth } from '@/app/contexts/auth';
import AppLayout from '@/components/layouts/layout';
import VisitDetailsModal from '@/components/visit-details-modal';
import {
  listVisitorHistory,
  reopenVisitorVisit,
  VisitHistoryRecord,
} from '@/services/visitor';

function toBackendDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('pt-BR').format(value);
}

function formatBackendDate(value?: string | number) {
  const rawValue = String(value ?? '').padStart(8, '0');

  if (rawValue.length !== 8 || rawValue === '00010101') {
    return '--/--/----';
  }

  return `${rawValue.slice(6, 8)}/${rawValue.slice(4, 6)}/${rawValue.slice(0, 4)}`;
}

function formatBackendTime(value?: string | number) {
  const rawValue = String(value ?? '').padStart(4, '0');

  if (rawValue === '0000') {
    return '--:--';
  }

  return `${rawValue.slice(0, 2)}:${rawValue.slice(2, 4)}`;
}

export default function HistoricoScreen() {
  const { user } = useAuth();
  const [date, setDate] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [visits, setVisits] = useState<VisitHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reopeningIdent, setReopeningIdent] = useState<number | null>(null);
  const [detailsIdent, setDetailsIdent] = useState<number | null>(null);

  const loadHistory = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const history = await listVisitorHistory(toBackendDate(date), user?.filial);
        setVisits(history);
      } catch (error) {
        Alert.alert(
          'Erro ao carregar',
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o histórico de visitas.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [date, user?.filial],
  );

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  function handleDateChange(_event: unknown, selectedDate: Date) {
    setDate(selectedDate);
    setShowDatePicker(false);
  }

  async function handleReopenVisit(visit: VisitHistoryRecord) {
    Alert.alert('Reverter saída', `Deseja reverter a saída de ${visit.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reverter',
        onPress: async () => {
          setReopeningIdent(visit.ident);

          try {
            await reopenVisitorVisit(visit.ident, user?.code);
            Alert.alert('Saída revertida', 'Horário de saída revertido.');
            await loadHistory(false);
          } catch (error) {
            Alert.alert(
              'Erro ao reverter',
              error instanceof Error
                ? error.message
                : 'Não foi possível reverter a saída.',
            );
          } finally {
            setReopeningIdent(null);
          }
        },
      },
    ]);
  }

  function renderVisit({ item: visit }: { item: VisitHistoryRecord }) {
    const isReopening = reopeningIdent === visit.ident;

    return (
      <View className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-base font-black text-slate-950" numberOfLines={1}>
              {visit.nome}
            </Text>
            <Text className="mt-1 text-sm font-semibold text-slate-500">
              Placa: {visit.placa || 'Não informada'}
            </Text>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver informações completas"
              className="h-10 w-10 items-center justify-center rounded-lg bg-white"
              onPress={() => setDetailsIdent(visit.ident)}
            >
              <Info size={18} stroke="#1A9CD9" strokeWidth={2.5} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reverter saída"
              className="h-10 w-10 items-center justify-center rounded-lg bg-white"
              disabled={isReopening}
              onPress={() => handleReopenVisit(visit)}
            >
              {isReopening ? (
                <ActivityIndicator color="#1A9CD9" />
              ) : (
                <RotateCcw size={18} stroke="#dc2626" strokeWidth={2.5} />
              )}
            </Pressable>
          </View>
        </View>

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-lg bg-white px-3 py-2">
            <Text className="text-xs font-bold uppercase text-slate-400">Entrada</Text>
            <Text className="mt-1 text-sm font-bold text-slate-800">
              {formatBackendDate(visit.dataEntrada)}
            </Text>
            <Text className="text-sm text-slate-500">
              {formatBackendTime(visit.horaEntrada)}
            </Text>
          </View>

          <View className="flex-1 rounded-lg bg-white px-3 py-2">
            <Text className="text-xs font-bold uppercase text-slate-400">Saída</Text>
            <Text className="mt-1 text-sm font-bold text-slate-800">
              {formatBackendDate(visit.dataSaida)}
            </Text>
            <Text className="text-sm text-slate-500">
              {formatBackendTime(visit.horaSaida)}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  function renderEmpty() {
    if (loading) {
      return (
        <View className="items-center justify-center py-12">
          <ActivityIndicator color="#1A9CD9" />
          <Text className="mt-3 text-sm font-semibold text-slate-500">
            Carregando histórico...
          </Text>
        </View>
      );
    }

    return (
      <View className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8">
        <Text className="text-center text-base font-bold text-slate-800">
          Nenhuma visita encontrada
        </Text>
        <Text className="mt-2 text-center text-sm text-slate-500">
          Altere a data ou puxe para atualizar.
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
              <Text className="text-xl font-black text-slate-950">
                Histórico de visitas
              </Text>
              <Text className="mt-1 text-sm text-slate-500">
                Visitantes com saída registrada na data selecionada.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              className="h-11 flex-row items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3"
              onPress={() => setShowDatePicker(true)}
            >
              <CalendarDays size={18} stroke="#1A9CD9" strokeWidth={2.4} />
              <Text className="text-sm font-bold text-slate-900">{formatDate(date)}</Text>
            </Pressable>
          </View>

          {showDatePicker && (
            <DateTimePicker
              mode="date"
              onDismiss={() => setShowDatePicker(false)}
              onValueChange={handleDateChange}
              value={date}
            />
          )}
        </View>

        <FlashList
          data={loading ? [] : visits}
          keyExtractor={(item, index) => `${item.ident}-${index}`}
          renderItem={renderVisit}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadHistory(false);
          }}
        />

        <VisitDetailsModal
          ident={detailsIdent}
          onClose={() => setDetailsIdent(null)}
          visible={detailsIdent !== null}
        />
      </View>
    </AppLayout>
  );
}

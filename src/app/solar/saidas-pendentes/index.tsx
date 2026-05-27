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
import { CalendarDays, CheckCircle, Clock, Info } from 'lucide-react-native';

import { useAuth } from '@/app/contexts/auth';
import AppLayout from '@/components/layouts/layout';
import VisitDetailsModal from '@/components/visit-details-modal';
import {
  listPendingVisitorExits,
  registerVisitorExit,
  VisitHistoryRecord,
} from '@/services/visitor';

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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('pt-BR').format(value);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
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

export default function SaidasPendentesScreen() {
  const { user } = useAuth();
  const [filterDate, setFilterDate] = useState(() => new Date());
  const [exitDate, setExitDate] = useState(() => new Date());
  const [exitTime, setExitTime] = useState(() => new Date());
  const [selectedIdent, setSelectedIdent] = useState<number | null>(null);
  const [showFilterDatePicker, setShowFilterDatePicker] = useState(false);
  const [showExitDatePicker, setShowExitDatePicker] = useState(false);
  const [showExitTimePicker, setShowExitTimePicker] = useState(false);
  const [pendingVisits, setPendingVisits] = useState<VisitHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [registeringIdent, setRegisteringIdent] = useState<number | null>(null);
  const [detailsIdent, setDetailsIdent] = useState<number | null>(null);

  const loadPendingExits = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const visits = await listPendingVisitorExits(
          toBackendDate(filterDate),
          user?.filial,
        );
        setPendingVisits(visits);
      } catch (error) {
        Alert.alert(
          'Erro ao carregar',
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar as saídas pendentes.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filterDate, user?.filial],
  );

  useFocusEffect(
    useCallback(() => {
      loadPendingExits();
    }, [loadPendingExits]),
  );

  function handleFilterDateChange(_event: unknown, selectedDate: Date) {
    setFilterDate(selectedDate);
    setShowFilterDatePicker(false);
  }

  function handleExitDateChange(_event: unknown, selectedDate: Date) {
    setExitDate(selectedDate);
    setShowExitDatePicker(false);
  }

  function handleExitTimeChange(_event: unknown, selectedTime: Date) {
    setExitTime(selectedTime);
    setShowExitTimePicker(false);
  }

  function selectVisit(visit: VisitHistoryRecord) {
    setSelectedIdent(visit.ident);
    setExitDate(new Date());
    setExitTime(new Date());
  }

  async function handleRegisterExit(visit: VisitHistoryRecord) {
    const isSelected = selectedIdent === visit.ident;
    const selectedDate = isSelected ? exitDate : new Date();
    const selectedTime = isSelected ? exitTime : new Date();

    Alert.alert(
      'Registrar saída',
      `Registrar saída de ${visit.nome} em ${formatDate(selectedDate)} às ${formatTime(
        selectedTime,
      )}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Registrar',
          onPress: async () => {
            setRegisteringIdent(visit.ident);

            try {
              await registerVisitorExit(
                visit.ident,
                toBackendDate(selectedDate),
                toBackendTime(selectedTime),
                user?.code,
              );
              Alert.alert('Saída registrada', 'Horário de saída registrado.');
              await loadPendingExits(false);
            } catch (error) {
              Alert.alert(
                'Erro ao registrar',
                error instanceof Error
                  ? error.message
                  : 'Não foi possível registrar a saída.',
              );
            } finally {
              setRegisteringIdent(null);
            }
          },
        },
      ],
    );
  }

  function renderPendingVisit({ item: visit }: { item: VisitHistoryRecord }) {
    const isSelected = selectedIdent === visit.ident;
    const isRegistering = registeringIdent === visit.ident;

    return (
      <View className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <View className="flex-row items-start justify-between gap-3">
          <Pressable className="min-w-0 flex-1" onPress={() => selectVisit(visit)}>
            <Text className="text-base font-black text-slate-950" numberOfLines={1}>
              {visit.nome}
            </Text>
            <Text className="mt-1 text-sm font-semibold text-slate-500">
              Placa: {visit.placa || 'Não informada'}
            </Text>
          </Pressable>

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
              accessibilityLabel="Registrar saída"
              className="h-10 w-10 items-center justify-center rounded-lg bg-white"
              disabled={isRegistering}
              onPress={() => handleRegisterExit(visit)}
            >
              {isRegistering ? (
                <ActivityIndicator color="#1A9CD9" />
              ) : (
                <CheckCircle size={20} stroke="#16a34a" strokeWidth={2.5} />
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
            <View className="mt-2 flex-row gap-2">
              <Pressable
                accessibilityRole="button"
                className="flex-1 flex-row items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2"
                onPress={() => {
                  selectVisit(visit);
                  setShowExitDatePicker(true);
                }}
              >
                <CalendarDays size={14} stroke="#334155" strokeWidth={2.3} />
                <Text className="text-xs font-bold text-slate-800">
                  {isSelected ? formatDate(exitDate) : formatDate(new Date())}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                className="flex-1 flex-row items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2"
                onPress={() => {
                  selectVisit(visit);
                  setShowExitTimePicker(true);
                }}
              >
                <Clock size={14} stroke="#334155" strokeWidth={2.3} />
                <Text className="text-xs font-bold text-slate-800">
                  {isSelected ? formatTime(exitTime) : formatTime(new Date())}
                </Text>
              </Pressable>
            </View>
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
            Carregando saídas pendentes...
          </Text>
        </View>
      );
    }

    return (
      <View className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8">
        <Text className="text-center text-base font-bold text-slate-800">
          Nenhuma saída pendente
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
                Saídas pendentes
              </Text>
              <Text className="mt-1 text-sm text-slate-500">
                Visitantes ainda sem horário de saída registrado.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              className="h-11 flex-row items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3"
              onPress={() => setShowFilterDatePicker(true)}
            >
              <CalendarDays size={18} stroke="#1A9CD9" strokeWidth={2.4} />
              <Text className="text-sm font-bold text-slate-900">
                {formatDate(filterDate)}
              </Text>
            </Pressable>
          </View>

          {showFilterDatePicker && (
            <DateTimePicker
              mode="date"
              onDismiss={() => setShowFilterDatePicker(false)}
              onValueChange={handleFilterDateChange}
              value={filterDate}
            />
          )}

          {showExitDatePicker && (
            <DateTimePicker
              mode="date"
              onDismiss={() => setShowExitDatePicker(false)}
              onValueChange={handleExitDateChange}
              value={exitDate}
            />
          )}

          {showExitTimePicker && (
            <DateTimePicker
              is24Hour
              mode="time"
              onDismiss={() => setShowExitTimePicker(false)}
              onValueChange={handleExitTimeChange}
              value={exitTime}
            />
          )}
        </View>

        <FlashList
          data={loading ? [] : pendingVisits}
          keyExtractor={(item, index) => `${item.ident}-${index}`}
          renderItem={renderPendingVisit}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadPendingExits(false);
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

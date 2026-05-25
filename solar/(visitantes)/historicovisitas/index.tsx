import React, { useCallback, useContext, useEffect, useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import DatePicker from "@react-native-community/datetimepicker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import moment from "moment";
import serviceportaria from "../../../../../services/serviceportaria";
import { maskHour } from "../../../../../utils/masks";
import { router, useFocusEffect } from "expo-router";
import Loading from "../../../../../components/Loading";
import { AuthContext } from "../../../../../contexts/auth";

const HistoricoVisitas = () => {
  const { user } = useContext(AuthContext);
  const [visitasPendentes, setVisitasPendentes] = useState([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [bColor, setBColor] = useState(0);
  const [dateTop, setDateTop] = useState(new Date());
  const [showDateTop, setShowDateTop] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      const getVisitasAbertas = async () => {
        await serviceportaria
          .post(`(PORT_LISTA_VISITA)`, {
            status: 2,
            data: moment(dateTop).format("YYYYMMDD"),
            filial: user?.filial,
          })
          .then((response) => {
            const { success, data } = response.data.visita;
            setVisitasPendentes(data);
            setLoading(false);
          });
      };
      getVisitasAbertas();
    }, [dateTop])
  )

  const handleExitVisita = async (vid: number) => {
    setBColor(vid);
    await serviceportaria
      .post(`(PORT_ALTERA_VISITA)`, {
        status: 1,
        user: user?.code,
        ident: vid,
        dsaida: "00010101",
        hsaida: 0,
      })
      .then(async (response) => {
        Alert.alert("Atenção", "Horário de saída revertido.", [
          {
            text: "ok",
            onPress: async () => {
              setLoading(true);
              await serviceportaria
                .post(`(PORT_LISTA_VISITA)`, {
                  status: 2,
                  data: moment(dateTop).format("YYYYMMDD"),
                  filial: user?.filial,
                })
                .then((response) => {
                  setLoading(false);
                  setVisitasPendentes(response.data.visita.data);
                });
            },
          },
        ]);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const onChangeDateTop = (event: any, selectedDateTop: any) => {
    const currentDateTop = selectedDateTop;
    setShowDateTop(false);
    setDateTop(currentDateTop);
  };

  return (
    <>
      <Loading visible={loading} spinercolor="#29ABE2" />
      <View className="border-t-4 border-green-500">
        {showDateTop && (
          <DatePicker
            value={dateTop}
            mode="date"
            is24Hour={true}
            onChange={onChangeDateTop}
          />
        )}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-col items-start justify-center border-b border-b-gray-300 py-2 mb-4">
            <Text className="text-lg uppercase text-solar-blue-dark font-semibold">
              Histórico de visitas
            </Text>
          </View>
          <View className="mb-2 flex-row items-center justify-start">
            <Ionicons
              name="calendar"
              color={"#f34b4b"}
              size={38}
              onPress={() => setShowDateTop(true)}
            />
            <Text className="ml-2 text-lg font-semibold text-[#f34b4b]">
              {moment(dateTop).format("DD/MM/YYYY")}
            </Text>
          </View>
          <View className="p-1 bg-white border-gray-300 rounded-md">
            <View className="bg-gray-100 flex-row items-center justify-between border-y border-x border-gray-300">
              <Ionicons name="alert-circle" size={34} color="#F1F1F1" />
              <Text className="flex-grow px-1 py-3 text-base font-medium">
                Motorista
              </Text>
              <Text className="w-24 border-x px-1 py-3 border-gray-300 text-base font-medium">
                Placa
              </Text>
              <Text className="w-[123px] px-1 py-3 text-base font-medium">
                Data
              </Text>
              <Text className="w-16 px-1 py-3 text-base font-medium">Hora</Text>
              <Ionicons name="checkmark-circle" size={32} color="#F1F1F1" />
            </View>
            {visitasPendentes?.map((mt: any, index: any) => (
              <View
                key={mt.cpf + index}
                className={`${index % 2 ? "bg-blue-50" : "bg-gray-50"
                  } flex-row items-center justify-between border-b border-x border-gray-300`}
              >
                <Ionicons
                  name="alert-circle"
                  size={30}
                  color="#17A2B8"
                  onPress={() =>
                    router.push({
                      pathname: "solar/infovisitantesaida",
                      params: { ident: mt.ident, nome: mt.nome },
                    })
                  }
                />
                <Text className="flex-grow px-1 py-3 text-base font-normal">
                  {mt.nome}
                </Text>
                <Text className="w-24 border-x px-1 py-3 border-gray-300 text-base font-normal">
                  {mt.placa}
                </Text>
                <View className="w-[120px] pl-1">
                  <View className="flex-row items-center justify-start pt-1 pb-0.5">
                    <MaterialCommunityIcons
                      name="arrow-right-bold"
                      size={18}
                      color="#27a716"
                    />
                    <Text className="text-base font-normal">
                      {moment(mt.dataEntrada.toString()).format("DD/MM/YYYY")}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-start pb-1 pt-0.5">
                    <MaterialCommunityIcons
                      name="arrow-left-bold"
                      size={18}
                      color="#e73e3e"
                    />
                    <Text className="text-base font-normal">
                      {moment(mt.dataSaida.toString()).format("DD/MM/YYYY")}
                    </Text>
                  </View>
                </View>
                <View className="w-16 pl-1">
                  <Text className="pb-0.5 text-base font-normal">
                    {maskHour(("0000" + mt.horaEntrada).slice(-4))}
                  </Text>
                  <Text className="pt-0.5 text-base font-normal">
                    {maskHour(("0000" + mt.horaSaida).slice(-4))}
                  </Text>
                </View>

                <Ionicons
                  name="checkmark-circle"
                  size={30}
                  color={`${bColor === mt.ident ? "#27a716" : "#e73e3e"}`}
                  onPress={() => handleExitVisita(mt.ident)}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </>
  );
};
export default HistoricoVisitas;

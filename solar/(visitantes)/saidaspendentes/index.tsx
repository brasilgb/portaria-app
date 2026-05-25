import { View, Text, Alert, ScrollView } from "react-native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import serviceportaria from "../../../../../services/serviceportaria";
import moment from "moment";
import DatePicker from "@react-native-community/datetimepicker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { maskHour } from "../../../../../utils/masks";
import { router, useFocusEffect } from "expo-router";
import { AuthContext } from "../../../../../contexts/auth";
import Loading from "../../../../../components/Loading";

const SaidasPendentes = () => {
  const [visitasPendentes, setVisitasPendentes] = useState([]);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState<boolean>(false);
  const [date, setDate] = useState(new Date());
  const [dateTop, setDateTop] = useState(new Date());
  const [hour, setHour] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showDateTop, setShowDateTop] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [newIndex, setNewIndex] = useState();
  const [bColor, setBColor] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      const getVisitasAbertas = async () => {
        await serviceportaria
          .post(`(PORT_LISTA_VISITA)`, {
            status: 1,
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

  const handleExitVisita = (vid: number, vDate: any, vHour: any) => {
    Alert.alert("Registrar saída", "Quer registrar esta saída?", [
      {
        text: "Sim",
        onPress: async () => {
          setBColor(vid);
          await serviceportaria
            .post(`(PORT_ALTERA_VISITA)`, {
              status: 2,
              user: user?.code, //user.code,
              ident: vid,
              dsaida: vDate,
              hsaida: vHour,
            })
            .then((response) => {
              if (response.data.visita.success) {
                Alert.alert("Atenção", "Horário de saída registrado.", [
                  {
                    text: "Ok",
                    onPress: async () => {
                      setLoading(true);
                      await serviceportaria
                        .post(`(PORT_LISTA_VISITA)`, {
                          status: 1,
                          data: moment(dateTop).format("YYYYMMDD"),
                          filial: 1, //user.filial
                        })
                        .then((response) => {
                          setTimeout(() => {
                            setLoading(false);
                            setVisitasPendentes(response.data.visita.data);
                          }, 500);
                        });
                    },
                  },
                ]);
              } else {
                Alert.alert("Atenção", `${response.data.visita.message}`);
              }
            })
            .catch((error) => {
              console.log(error);
            });
        },
      },
      {
        text: "Não",
      },
    ]);
  };

  const onChangeDateTop = (event: any, selectedDateTop: any) => {
    const currentDateTop = selectedDateTop;
    setShowDateTop(false);
    setDateTop(currentDateTop);
  };

  const onChangeDate = (event: any, selectedDate: any) => {
    const currentDate = selectedDate;
    setShowDate(false);
    setDate(currentDate);
  };

  const onChangeHour = (event: any, selectedHour: any) => {
    const currentHour = selectedHour;
    setShowTime(false);
    setHour(currentHour);
  };

  const handleDatePicker = (cpf: any) => {
    setNewIndex(cpf);
    setShowDate(true);
  };

  const handleTimePicker = (cpf: any) => {
    setNewIndex(cpf);
    setShowTime(true);
  };

  return (
    <>
      <Loading visible={loading} spinercolor="#29ABE2" />
      <View>
        {showDate && (
          <DatePicker
            value={date}
            mode="date"
            is24Hour={true}
            onChange={onChangeDate}
          />
        )}
        {showDateTop && (
          <DatePicker
            value={dateTop}
            mode="date"
            is24Hour={true}
            onChange={onChangeDateTop}
          />
        )}
        {showTime && (
          <DatePicker
            value={hour}
            mode="time"
            is24Hour={true}
            onChange={onChangeHour}
            display="clock"
          />
        )}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-col items-start justify-center border-b border-b-gray-300 py-2 mb-4 border-t-4 border-t-red-500">
            <Text className="text-lg uppercase text-solar-blue-dark font-semibold">
              Saídas pendentes
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
            <View className="bg-solar-gray-dark flex-row items-center justify-between border-y border-x border-gray-300">
              <Ionicons name="alert-circle" size={30} color="#F1F1F1" />
              <Text className="flex-grow px-1 py-3 text-base font-medium">
                Motorista
              </Text>
              <Text className="w-24 border-x px-1 py-3 border-gray-300 text-base font-medium">
                Placa
              </Text>
              <Text className="w-[124px] px-1 py-3 text-base font-medium">
                Data
              </Text>
              <Text className="w-16 px-1 py-3 text-base font-medium">Hora</Text>
              <Ionicons name="checkmark-circle" size={30} color="#F1F1F1" />
            </View>
            {visitasPendentes?.map((mt: any, index: any) => (
              <View
                key={mt.cpf + index}
                className={`${index % 2 ? "bg-blue-50" : "bg-red-50"
                  } flex-row items-center justify-between border-b border-x border-gray-300`}
              >
                <Ionicons
                  name="alert-circle"
                  size={30}
                  color="#17A2B8"
                  onPress={() =>
                    router.push({
                      pathname: "solar/infovisitanteentrada",
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

                <View className="w-[124px] px-1">
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
                    <Text
                      onPress={() => handleDatePicker(mt.cpf + index)}
                      className="text-base font-normal"
                    >
                      {newIndex === mt.cpf + index
                        ? date.toLocaleDateString()
                        : moment().format("DD/MM/YYYY")}
                    </Text>
                  </View>
                </View>
                <View className="w-16 px-1">
                  <Text className="pb-0.5 text-base font-normal">
                    {maskHour(("0000" + mt.horaEntrada).slice(-4))}
                  </Text>
                  <Text
                    className="pt-0.5 text-base font-normal"
                    onPress={() => handleTimePicker(mt.cpf + index)}
                  >
                    {newIndex === mt.cpf + index
                      ? moment(hour).format("HH:mm")
                      : moment().format("HH:mm")}
                  </Text>
                </View>
                <Ionicons
                  name="checkmark-circle"
                  size={30}
                  color={`${bColor === mt.ident ? "#e73e3e" : "#27a716"}`}
                  onPress={() =>
                    handleExitVisita(
                      mt.ident,
                      newIndex === mt.cpf + index
                        ? moment(date).format("YYYYMMDD")
                        : moment().format("YYYYMMDD"),
                      newIndex === mt.cpf + index
                        ? moment(hour).format("HHmm")
                        : moment().format("HHmm")
                    )
                  }
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </>
  );
};

export default SaidasPendentes;

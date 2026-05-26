import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, TextInput, Switch, Alert } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import DateTimePicker from "@react-native-community/datetimepicker";
import { Formik } from "formik"
import Loading from "@/components/Loading"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { AuthContext } from "@/contexts/auth"
import moment from "moment"
import schema from "./schema"
import { unMask } from "@/utils/masks"
import serviceportaria from "@/services/serviceportaria"

interface RegisterProps {
  dataEntrada: string;
  destino: string;
  fornecedor: string;
  nome: string;
  placa: string;
  horaEntrada: string;
  sintomas: string;
  granjas: string;
  procedencia: string;
  observacao: string;
}
const NRegisterVisitors = () => {

  const visitors: any = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState<boolean>(false);
  const [fornecedor, setFornecedor] = useState("");
  const [date, setDate] = useState(new Date());
  const [hour, setHour] = useState(new Date());
  const [show, setShow] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const [isEnabled, setIsEnabled] = useState(false);
  const [isEnabled2, setIsEnabled2] = useState(false);
  const toggleSwitch = () => {
    setIsEnabled(previousState => !previousState);
  };
  const toggleSwitch2 = () => {
    setIsEnabled2(previousState => !previousState);
  };

  useEffect(() => {
    const getFornecedor = async () => {
      await serviceportaria
        .post(`(PORT_VALIDA_PEDIDO)`, {
          pedido: visitors?.pedido,
        })
        .then((response) => {
          let loadFornecedor = response.data.pedido;
          if (loadFornecedor.success) {
            setLoading(true);
            setFornecedor(loadFornecedor.data.fornecedor);
            setLoading(false);
            return;
          }
        })
        .catch((err) => {
          console.log(err);
        });
    };
    getFornecedor();
  }, [visitors]);

  const onChange = (event: any, selectedDate: any) => {
    const currentDate = selectedDate;
    setShow(false);
    setDate(currentDate);
  };

  const onChangeHour = (event: any, selectedHour: any) => {
    const currentHour = selectedHour;
    setShowTime(false);
    setHour(currentHour);
  };

  const onsubmit = async (values: RegisterProps, { resetForm }: any) => {
    setLoading(true);
    let dataatual = values.dataEntrada.split("/");
    let formdate = dataatual[2] + dataatual[1] + dataatual[0];
    await serviceportaria
      .post(`(PORT_GRAVA_VISITA)`, {
        user: user?.code,
        filial: user?.filial,
        cpf: visitors?.cpf,
        nome: values.nome,
        data: formdate,
        fornecedor: values.fornecedor,
        placa: values.placa,
        horaEntrada: unMask(values.horaEntrada),
        destino: values.destino,
        observacao: values.observacao,
        sintomas: isEnabled ? '1' : '0',
        granjas: isEnabled2 ? '1' : '0',
        procedencia: values.procedencia,
      })
      .then((response) => {
        const { success, message } = response.data.visita;
        setLoading(false);
        if (!success) {
          Alert.alert('Error', message);
          return;
        }
        router.push({
          pathname: "naturovos/registered",
          params: { motorista: values.nome, register: 2 }, // valor 2 = visitantes
        });
        resetForm({});
      })
      .catch((error) => {
        console.log(error);
      });
    resetForm();
  };

  return (
    <>
      <Loading visible={loading} spinercolor="#F18800" />

      <KeyboardAvoidingView behavior={undefined} keyboardVerticalOffset={0}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-col items-start justify-center border-b border-b-gray-300 py-2 my-4">
            <Text className="text-lg uppercase text-solar-blue-dark font-semibold">
              Cadastrar visitante
            </Text>
          </View>
          <View className="flex-row items-center justify-start w- mx-0 py-4 border-b border-gray-300">
            <MaterialCommunityIcons name="alert" size={20} color="red" />
            <Text className="ml-1 text-base text-red-400 font-medium">
              Preencha corretamente os campos abaixo{" "}
            </Text>
          </View>
          <View className="pb-4">
            <Formik
              validationSchema={schema}
              initialValues={{
                nome: `${visitors.visitante}`,
                dataEntrada: moment().format("DD/MM/YYYY"),
                fornecedor: fornecedor,
                placa: "",
                horaEntrada: moment(hour).format("HH:mm"),
                destino: "", //motivo
                sintomas: "",
                granjas: "",
                procedencia: "",
                observacao: "",
              }}
              onSubmit={onsubmit}
            >
              {({
                handleChange,
                handleBlur,
                setValues,
                setFieldValue,
                handleSubmit,
                setFieldTouched,
                values,
                touched,
                errors,
                isValid,
              }) => (
                <View>
                  {show && (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      is24Hour={true}
                      onChange={onChange}
                    />
                  )}
                  {showTime && (
                    <DateTimePicker
                      value={hour}
                      mode="time"
                      is24Hour={true}
                      onChange={onChangeHour}
                      display="clock"
                    />
                  )}
                  <View className="mt-6">
                    <Text className="label-form">Data de entrada</Text>
                    <Pressable onPress={() => setShow(true)}>
                      <TextInput
                        pointerEvents="none"
                        className={`input-form `}
                        onChangeText={handleChange("dataEntrada")}
                        onBlur={() => setFieldTouched("dataEntrada")}
                        value={values.dataEntrada }
                        editable={false}
                      />
                    </Pressable>
                  </View>
                  <View className="mt-6">
                    <Text className="label-form">Hora de entrada</Text>
                    <Pressable onPress={() => setShowTime(true)}>
                      <TextInput
                        pointerEvents="none"
                        className={`input-form `}
                        onChangeText={handleChange("horaEntrada")}
                        onBlur={() => setFieldTouched("horaEntrada")}
                        value={values.horaEntrada}
                        editable={false}
                      />
                    </Pressable>
                  </View>
                  <View className="mt-6">
                    <Text className="label-form">
                      Fornecedor/prestador de serviço
                    </Text>
                    <TextInput
                      className={`input-form `}
                      onChangeText={handleChange("fornecedor")}
                      onBlur={() => setFieldTouched("fornecedor")}
                      value={values.fornecedor}
                    />
                    {touched && errors && (
                      <Text className="self-end pr-6 pt-1 text-base text-red-600">
                        {errors.fornecedor}
                      </Text>
                    )}
                  </View>
                  <View className="">
                    <Text className="label-form">Visitante</Text>
                    <TextInput
                      className={`input-form `}
                      onChangeText={handleChange("nome")}
                      onBlur={() => setFieldTouched("nome")}
                      value={values.nome}
                    />
                    {touched && errors && (
                      <Text className="self-end pr-6 pt-1 text-base text-red-600">
                        {errors.nome}
                      </Text>
                    )}
                  </View>
                  <View className="">
                    <Text className="label-form">Placa do veículo</Text>
                    <TextInput
                      className={`input-form `}
                      onChangeText={handleChange("placa")}
                      onBlur={() => setFieldTouched("placa")}
                      value={values.placa}
                      autoCapitalize="characters"
                    />
                  </View>
                  <View className="mt-6">
                    <Text className="label-form">Motivo da visita</Text>
                    <TextInput
                      className={`input-form `}
                      onChangeText={handleChange("destino")}
                      onBlur={() => setFieldTouched("destino")}
                      value={values.destino}
                    />
                    {touched && errors && (
                      <Text className="self-end pr-6 pt-1 text-base text-red-600">
                        {errors.destino}
                      </Text>
                    )}
                  </View>
                  <View className="mt-6">
                    <Text className="label-form">Apresentou sintomas entéricos ou respiratórios nos últimos 15 dias?</Text>
                    <View className="flex-row items-center justify-start ml-6">
                      <Text className="text-lg font-bold text-gray-600 mr-1">Não</Text>
                      <Switch
                        trackColor={{ false: '#94d6f3', true: '#F5B025' }}
                        thumbColor={isEnabled ? '#ee4670' : '#29ABE2'}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={toggleSwitch}
                        value={isEnabled}
                      />
                      <Text className="text-lg font-bold text-gray-600 ml-1">Sim</Text>
                    </View>
                  </View>
                  <View className="mt-6">
                    <Text className="label-form">Visitou granjas ou frigorificos nas últimas 72 horas?</Text>
                    <View className="flex-row items-center justify-start ml-6">
                      <Text className="text-lg font-bold text-gray-600 mr-1">Não</Text>
                      <Switch
                        trackColor={{ false: '#94d6f3', true: '#F5B025' }}
                        thumbColor={isEnabled2 ? '#ee4670' : '#29ABE2'}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={toggleSwitch2}
                        value={isEnabled2}
                      />
                      <Text className="text-lg font-bold text-gray-600 ml-1">Sim</Text>
                    </View>
                  </View>
                  <View className="mt-6">
                    <Text className="label-form">Última procedência</Text>
                    <TextInput
                      className={`input-form `}
                      onChangeText={handleChange("procedencia")}
                      onBlur={() => setFieldTouched("procedencia")}
                      value={values.procedencia}
                    />
                  </View>
                  <View className="mt-6">
                    <Text className="label-form">Observações</Text>
                    <TextInput
                      className={`input-form `}
                      onChangeText={handleChange("observacao")}
                      onBlur={() => setFieldTouched("observacao")}
                      value={values.observacao}
                      numberOfLines={3}
                    />
                  </View>
                  <View className="mt-6">
                    <Pressable
                      className={`flex items-center justify-center ${!isValid
                        ? "bg-solar-gray-dark"
                        : "bg-solar-yellow-dark"
                        } mt-10 py-4 rounded-full`}
                      onPress={handleSubmit as any}
                    >
                      <Text
                        className={`text-xl font-medium ${!isValid ? "text-gray-300" : "text-solar-gray-light"
                          }`}
                      >
                        Próximo
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </Formik>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

export default NRegisterVisitors
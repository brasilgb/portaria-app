import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import serviceportaria from "../../../../../services/serviceportaria";
import { unMask } from "../../../../../utils/masks";
import { Formik } from "formik";
import moment from "moment";
import schema from "./schema";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Loading from "../../../../../components/Loading";
import { AuthContext } from "../../../../../contexts/auth";

interface RegisterProps {
  dataEntrada: any;
  fornecedor: string;
  transportadora: string;
  motorista: string;
  placa: string;
  nota: string;
  horaEntrada: string;
  horaSaida: string;
  quantidade: string;
  destino: string;
  produto: string;
  observacao: string;
}

const RegistorsVisitors = () => {
  const visitors: any = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState<boolean>(false);
  const [fornecedor, setFornecedor] = useState("");
  const [date, setDate] = useState(new Date());
  const [hour, setHour] = useState(new Date());
  const [show, setShow] = useState(false);
  const [showTime, setShowTime] = useState(false);

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
        filial: user?.filial,
        user: user?.code,
        cpf: visitors?.cpf,
        nome: values.motorista,
        data: formdate,
        fornecedor: values.fornecedor,
        transportadora: values.transportadora,
        placa: values.placa,
        nota: values.nota,
        pedido: visitors?.pedido,
        horaEntrada: unMask(values.horaEntrada),
        quantidade: values.quantidade,
        destino: values.destino,
        produto: values.produto,
        observacao: values.observacao,
      })
      .then((response) => {
        if (response.data.visita.success) {
          router.push({
            pathname: "solar/registered",
            params: { value: values.motorista },
          });
          setLoading(false);
        }
      })
      .catch((error) => {
        console.log(error);
      });
    resetForm();
  };

  return (
    <>
      <Loading visible={loading} spinercolor="#154295" />
      <View className="">
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
            <View className="flex-row items-center justify-start mx-0 py-4 border-b border-gray-300">
              <MaterialCommunityIcons name="alert" size={20} color="red" />
              <Text className="ml-1 text-base text-red-400 font-medium">
                Preencha corretamente os campos abaixo{" "}
              </Text>
            </View>
            <View className="pb-10">
              <Formik
                // enableReinitialize
                validationSchema={schema}
                initialValues={{
                  motorista: `${visitors.visitante}`,
                  dataEntrada: moment().format("DD/MM/YYYY"),
                  fornecedor: fornecedor,
                  transportadora: visitors.transportadora,
                  placa: "",
                  nota: "",
                  horaEntrada: moment(hour).format("HH:mm"),
                  horaSaida: "",
                  quantidade: "",
                  destino: "",
                  produto: "",
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
                          value={values.dataEntrada}
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
                    <View className="mt-6">
                      <Text className="label-form">Transportadora</Text>
                      <TextInput
                        className={`input-form `}
                        onChangeText={handleChange("transportadora")}
                        onBlur={() => setFieldTouched("transportadora")}
                        value={values.transportadora}
                      />
                    </View>
                    <View className="mt-6">
                      <Text className="label-form">Motorista</Text>
                      <TextInput
                        className={`input-form `}
                        onChangeText={handleChange("motorista")}
                        onBlur={() => setFieldTouched("motorista")}
                        value={values.motorista}
                      />
                      {touched && errors && (
                        <Text className="self-end pr-6 pt-1 text-base text-red-600">
                          {errors.motorista}
                        </Text>
                      )}
                    </View>
                    <View className="mt-6">
                      <Text className="label-form">Placa do veículo</Text>
                      <TextInput
                        className={`input-form `}
                        onChangeText={handleChange("placa")}
                        onBlur={() => setFieldTouched("placa")}
                        value={values.placa}
                        autoCapitalize="characters"
                      />
                      {touched && errors && (
                        <Text className="self-end pr-6 pt-1 text-base text-red-600">
                          {errors.placa}
                        </Text>
                      )}
                    </View>
                    <View className="mt-6">
                      <Text className="label-form">Nota fiscal</Text>
                      <TextInput
                        className={`input-form `}
                        onChangeText={handleChange("nota")}
                        onBlur={() => setFieldTouched("nota")}
                        value={values.nota}
                      />
                    </View>
                    <View className="mt-6">
                      <Text className="label-form">Quantidade</Text>
                      <TextInput
                        className={`input-form `}
                        onChangeText={handleChange("quantidade")}
                        onBlur={() => setFieldTouched("quantidade")}
                        value={values.quantidade}
                      />
                      {touched && errors && (
                        <Text className="self-end pr-6 pt-1 text-base text-red-600">
                          {errors.quantidade}
                        </Text>
                      )}
                    </View>
                    <View className="mt-6">
                      <Text className="label-form">Destino</Text>
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
                      <Text className="label-form">Produto</Text>
                      <TextInput
                        className={`input-form `}
                        onChangeText={handleChange("produto")}
                        onBlur={() => setFieldTouched("produto")}
                        value={values.produto}
                      />
                      {touched && errors && (
                        <Text className="self-end pr-6 pt-1 text-base text-red-600">
                          {errors.produto}
                        </Text>
                      )}
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
                          : "bg-solar-blue-dark"
                          } mt-10 py-4 rounded-full`}
                        onPress={handleSubmit as any}
                      >
                        <Text
                          className={`text-xl font-medium ${!isValid ? "text-gray-300" : "text-gray-50"
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
      </View>
    </>
  );
};

export default RegistorsVisitors;

import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  Dimensions,
  Pressable,
  Modal,
  Alert,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons
} from "@expo/vector-icons";
import { Formik } from "formik";
import schema from "./schema";
import serviceportaria from "../../../../../services/serviceportaria";
import { FlashList } from "@shopify/flash-list";
import { AuthContext } from "../../../../../contexts/auth";
import Loading from "../../../../../components/Loading";
import { router } from "expo-router";
const WIDTH = Dimensions.get("window").width;
const HEIGHT = Dimensions.get("window").height;

interface RegisterProps {
  codigo: string;
  nome: string;
  placa: string;
  motorista: string;
  produto: string;
  pager: string;
  notas: string;
}

const Naturovos = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [transportadora, setTransportadora] = useState<any>([]);
  const [search, setSearch] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [masterData, setMasterData] = useState([]);
  const [tipoEntradaCarga, setTipoEntradaCarga] = useState<number>(1);

  const onsubmit = async (values: RegisterProps, { resetForm }: any) => {
    setLoading(true);
    await serviceportaria.post(`(PORT_CHEGADA)`, {
      caller: 0,
      user: user?.code,
      filial: user?.filial,
      transportadora: {
        codigo: values.codigo,
        nome: values.nome,
      },
      placa: values.placa,
      motorista: values.motorista,
      produto: values.produto,
      pager: values.pager,
      notas: values.notas,
      tipoEntrada: tipoEntradaCarga
    })
      .then((response) => {
        const { success, message } = response.data.genericResponse;
        setLoading(false);
        if (!success) {
          Alert.alert('Error', message);
          return;
        }
        setTransportadora([]);
        router.push({
          pathname: "naturovos/registered",
          params: { motorista: values.motorista, register: 1 }, // valor 1 = carga
        });
        resetForm({});
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    const getTransportadora = async () => {
      await serviceportaria
        .post("(PORT_TRANSPORTADORAS)", {
          caller: 0,
          filtro: "",
        })
        .then((result) => {
          const { data, success } = result.data.veiculos;
          setFilteredData(data);
          setMasterData(data);
        })
        .catch((err) => {
          console.log(err);
        });
    };
    getTransportadora();
  }, []);

  const searchFilter = (text: any) => {
    if (text.length) {
      const newData = masterData.filter(function (item: any) {
        if (item) {
          const itemData = item?.nome.toUpperCase();
          const textData = text.toUpperCase();
          return itemData.indexOf(textData) > -1;
        }
      });
      setFilteredData(newData);
    } else {
      setFilteredData(masterData);
    }
    setSearch(text);
  };

  const ItemView = ({ item }: any) => {
    return (
      <Text
        className="text-lg font-medium py-1"
        onPress={() => getItem(item)}
      >
        {item.codigo}
        {" - "}
        {item.nome}
      </Text>
    );
  };

  const getItem = (item: any) => {
    setTransportadora(item);
    setSearch("");
    setModalVisible(false);
  };

  return (
    <>
      <Loading visible={loading} spinercolor="#29ABE2" />
      <Modal
        statusBarTranslucent={true}
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-[#00000060]">
          <View
            className=" bg-white shadow-lg shadow-black py-4 px-3 mx-2"
            style={{ width: WIDTH - 100, height: HEIGHT - 100 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <TextInput
                  className="py-2 px-3 rounded-lg text-xl bg-white  border border-gray-200 placeholder:text-slate-400 shadow-md shadow-slate-500"
                  onChangeText={(text) => searchFilter(text)}
                  value={search}
                />
              </View>
              <View className="flex-none ml-2">
                <Ionicons
                  name="close"
                  size={32}
                  color="#919090"
                  onPress={() => {
                    setModalVisible(false)
                    setTransportadora([])
                  }}
                />
              </View>
            </View>
            <View className="flex-1 mt-4">
              <FlashList
                data={filteredData}
                keyExtractor={(item: any) => item.codigo}
                renderItem={({ item }: any) => <ItemView item={item} />}
                estimatedItemSize={50}
                keyboardShouldPersistTaps={"always"}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </View>
      </Modal>
      <View>
        <KeyboardAvoidingView behavior={undefined} keyboardVerticalOffset={0}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            <View className="flex-col items-start justify-center border-b border-b-gray-300 py-2 my-4">
              <Text className="text-lg uppercase text-solar-blue-dark font-semibold">
                Cadastrar chegada de carga
              </Text>
            </View>
            <View className="flex-row items-center justify-start w- mx-0 py-4 border-b border-gray-300">
              <MaterialCommunityIcons name="alert" size={20} color="red" />
              <Text className="ml-1 text-base text-red-400 font-medium">
                Preencha corretamente os campos abaixo{" "}
              </Text>
            </View>

            <View className="pb-10">
              <Formik
                validationSchema={schema}
                initialValues={{
                  codigo: `${transportadora.codigo > "0" ? transportadora.codigo : "0"}`,
                  nome: `${transportadora.nome?transportadora.nome:""}`,
                  placa: "",
                  motorista: "",
                  produto: "",
                  pager: "",
                  notas: "",
                }}
                enableReinitialize
                onSubmit={onsubmit}
              >
                {({
                  handleChange,
                  handleSubmit,
                  setFieldTouched,
                  values,
                  touched,
                  errors,
                  isValid,
                }) => (
                  <View className="mt-6">
                    <Pressable onPress={() => setModalVisible(true)}>
                      <View pointerEvents="none">
                        <Text className="label-form">
                          Buscar transportadora
                        </Text>
                        <TextInput
                          className={`input-form relative`}
                          onChangeText={handleChange("codigo")}
                          onBlur={() => setFieldTouched("codigo")}
                          value={values.codigo || `${transportadora.codigo}`}
                          underlineColorAndroid="transparent"
                        />
                        {touched && errors && (
                          <Text className="self-end pr-6 pt-1 text-base text-red-600">
                            {errors.codigo}
                          </Text>
                        )}
                      </View>
                      <MaterialIcons onPress={() => setTransportadora([])} name="cleaning-services" className="absolute right-4 top-11" size={25} color="#374151" />
                    </Pressable>
                    <View>
                      <Text className="label-form">Transportadora</Text>
                      <TextInput
                        className={`input-form `}
                        onChangeText={handleChange("nome")}
                        onBlur={() => { setFieldTouched("nome") }}
                        value={values.nome || transportadora.nome}
                      />
                      {touched && errors && (
                        <Text className="self-end pr-6 pt-1 text-base text-red-600">
                          {errors.nome}
                        </Text>
                      )}
                    </View>
                    <View className="">
                      <Text className="label-form">Placa</Text>
                      <TextInput
                        className={`input-form `}
                        onChangeText={handleChange("placa")}
                        onBlur={() => setFieldTouched("placa")}
                        value={values.placa}
                        autoCapitalize="characters"
                        maxLength={7}
                      />
                      {touched && errors && (
                        <Text className="self-end pr-6 pt-1 text-base text-red-600">
                          {errors.placa}
                        </Text>
                      )}
                    </View>
                    <View className="">
                      <Text className="label-form">Nome do motorista</Text>
                      <TextInput
                        className={`input-form `}
                        onChangeText={handleChange("motorista")}
                        onBlur={() => setFieldTouched("motorista")}
                        value={values.motorista}
                        autoCapitalize="characters"
                      />
                      {touched && errors && (
                        <Text className="self-end pr-6 pt-1 text-base text-red-600">
                          {errors.motorista}
                        </Text>
                      )}
                    </View>
                    <View className="">
                      <Text className="label-form">Tipo de mercadoria</Text>
                      <TextInput
                        className={`input-form `}
                        onChangeText={handleChange("produto")}
                        onBlur={() => setFieldTouched("produto")}
                        value={values.produto}
                        autoCapitalize="characters"
                      />
                      {touched && errors && (
                        <Text className="self-end pr-6 pt-1 text-base text-red-600">
                          {errors.produto}
                        </Text>
                      )}
                    </View>
                    <View className="">
                      <Text className="label-form">ID Pager</Text>
                      <TextInput
                        className={`input-form `}
                        onChangeText={handleChange("pager")}
                        onBlur={() => setFieldTouched("pager")}
                        value={values.pager}
                        autoCapitalize="characters"
                      />
                    </View>
                    <View className="mt-6">
                      <Text className="label-form">Nota fiscal</Text>
                      <TextInput
                        className={`input-form `}
                        onChangeText={handleChange("notas")}
                        onBlur={() => setFieldTouched("notas")}
                        value={values.notas}
                        autoCapitalize="characters"
                      />
                    </View>
                    <View className="mt-8 flex-row items-center justify-center px-2">
                      <View className="flex-1">
                        <Pressable className="flex-row items-center justify-start" onPress={() => setTipoEntradaCarga(1)}>
                          <Ionicons name={tipoEntradaCarga === 1 ? "radio-button-on" : "radio-button-off"} size={22} color="#F18800" />
                          <Text className={`ml-1 label-form`}>Entrada</Text>
                        </Pressable>
                      </View>
                      <View className="flex-1">
                        <Pressable className="flex-row items-center justify-start" onPress={() => setTipoEntradaCarga(2)}>
                          <Ionicons name={tipoEntradaCarga === 2 ? "radio-button-on" : "radio-button-off"} size={22} color="#F18800" />
                          <Text className={`ml-1 label-form`}>Coleta</Text>
                        </Pressable>
                      </View>
                      <View className="flex-1">
                        <Pressable className="flex-row items-center justify-start" onPress={() => setTipoEntradaCarga(3)}>
                          <Ionicons name={tipoEntradaCarga === 3 ? "radio-button-on" : "radio-button-off"} size={22} color="#F18800" />
                          <Text className={`ml-1 label-form`}>Integrados/Transf.</Text>
                        </Pressable>
                      </View>
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
                          className={`text-xl font-medium ${!isValid ? "text-gray-300" : "text-gray-700"
                            }`}
                        >
                          Registrar chegada
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

export default Naturovos;

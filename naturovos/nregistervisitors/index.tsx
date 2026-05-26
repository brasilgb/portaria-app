import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, ScrollView } from "react-native";
import React, { useContext, useState } from "react";
import { ButtonAction } from "../../../../components/Buttons";
import { Formik } from "formik";
import schemadoc from "./schemadoc";
import { cpf } from "cpf-cnpj-validator";
import serviceportaria from "../../../../services/serviceportaria";
import { router } from "expo-router";
import Loading from "../../../../components/Loading";
import { AuthContext } from "../../../../contexts/auth";

interface HomeProps {
  cpf: string;
  pedido: string;
}

const Solar = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const onsubmit = async (values: HomeProps, { resetForm }: any) => {
    setLoading(true);
    await serviceportaria
      .post('(PORT_VALIDA_VISITANTE)', {
        cpf: values.cpf,
      })
      .then((response) => {
        const { success, message, data } = response.data.visitante;
        resetForm();
        setLoading(false);
        let visitantes = {
          cpf: values.cpf,
          pedido: values.pedido,
          visitante: success ? data.visitante : "",
          transportadora: success ? data.transportadora : "",
        };
        router.push({
          pathname: "naturovos/nregistervisitors/register",
          params: visitantes,
        });
      })
      .catch((err) => {
        console.log(err);
      });
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

          <View>
            <Formik
              validationSchema={schemadoc}
              initialValues={{
                cpf: " ",
                pedido: " ",
              }}
              enableReinitialize
              onSubmit={onsubmit}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                setFieldTouched,
                values,
                touched,
                errors,
                isValid,
              }) => (
                <View className="my-4">
                  {/* <FormObserver /> */}
                  <View className="">
                    <Text className="label-form">CPF do visitante</Text>

                    <TextInput
                      className={`input-form ${touched && errors.cpf
                        ? "text-red-600 border-red-600"
                        : "text-solar-blue-dark border-gray-400"
                        }`}
                      onChangeText={handleChange("cpf")}
                      onBlur={() => setFieldTouched("cpf")}
                      value={cpf.format(values.cpf)}
                      autoComplete="off"
                      autoCorrect={false}
                      keyboardType="numeric"
                    />
                    {touched && errors && (
                      <Text className="self-end pr-6 pt-1 text-xs text-red-600">
                        {errors.cpf}
                      </Text>
                    )}
                  </View>
                  <View className="mt-6">
                    <Text className="label-form">Número do pedido</Text>
                    <TextInput
                      className={`input-form ${touched && errors.pedido
                        ? "text-red-600 border-red-600"
                        : "text-solar-blue-dark border-gray-400"
                        }`}
                      onChangeText={handleChange("pedido")}
                      onBlur={() => setFieldTouched("pedido")}
                      value={values.pedido}
                      keyboardType="numeric"
                    />
                    {touched && errors && (
                      <Text className="self-end pr-6 pt-1 text-xs text-red-600 font-">
                        {errors.pedido}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    className={`flex items-center justify-center ${!isValid ? "bg-solar-gray-dark" : "bg-solar-yellow-dark"
                      } mt-10 py-4 rounded-full`}
                    onPress={handleSubmit as any}
                  >
                    <Text
                      className={`text-xl font-medium ${!isValid ? "text-gray-300" : "text-solar-gray-light"
                        }`}
                    >
                      Continuar
                    </Text>
                  </Pressable>
                </View>
              )}
            </Formik>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default Solar;

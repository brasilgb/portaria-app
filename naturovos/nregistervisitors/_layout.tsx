import { View, Text, SafeAreaView, Pressable } from 'react-native'
import React from 'react'
import { Link, Slot, Stack, usePathname } from "expo-router"
import { StatusBar } from "expo-status-bar";
import Header from "../../../../components/Header";
import { ButtonAction } from "@/components/Buttons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const RegisterLayout = () => {
  const pathname = usePathname();
  return (
    <SafeAreaView className="flex-1">
      <Header
        title="Sistema de Gestão Integrada"
        subtitle="Controle de entrada e saída de visitantes"
        textbottom="Cadastro de visitantes Naturovos"
        textcolor="text-gray-800"
        bgcolor="bg-solar-yellow-dark"
        color="#131212"
      />
      <View className="flex-row items-end justify-between border-b border-b-gray-300 py-2 mb-4 mx-3">
        <Text className="text-lg uppercase text-gray-700 font-semibold">
          
        </Text>
        <Link
          asChild
          className="flex-row items-center justify-between bg-solar-orange-middle text-gray-700 px-3 py-0.5 rounded"
          href="naturovos/statuscarga/carga"
        >
          <Pressable>
            <MaterialCommunityIcons name="truck" size={26} />
            <Text className="ml-2">Cadastrar carga</Text>
          </Pressable>
        </Link>
      </View>
      <View className="flex-row items-center justify-between gap-4 mx-3">
        <ButtonAction
          bgcolor="bg-green-500"
          textcolor="text-gray-50"
          title="Histórico"
          icon="history"
          href="naturovos/nregistervisitors/historicovisitas"
          btnwidth="w-60"
        />
         {pathname !== '/naturovos/nregistervisitors' &&
        <ButtonAction
        bgcolor="bg-blue-500"
        textcolor="text-gray-50"
        title=""
        icon="home"
        href="/naturovos/nregistervisitors"
        btnwidth="w-20"
      />
        }
        <ButtonAction
          bgcolor="bg-red-500"
          textcolor="text-gray-50"
          title="Saídas pendentes"
          icon="exit-run"
          href="naturovos/nregistervisitors/saidaspendentes"
          btnwidth="w-60"
        />
      </View>
      <View className="p-3 flex-1">
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            presentation: 'card',
            animationTypeForReplace: 'push',
            animation: 'slide_from_right',
            animationDuration: 5000
          }}
        />
      </View>
      <StatusBar backgroundColor="#F18800" style="dark" />
    </SafeAreaView>
  )
}

export default RegisterLayout
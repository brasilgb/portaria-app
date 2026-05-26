import { View, Text, SafeAreaView, Pressable } from 'react-native'
import React from 'react'
import { Link, Slot, Stack, usePathname } from "expo-router"
import { StatusBar } from "expo-status-bar";
import Header from "../../../../components/Header";
import { ButtonAction } from "@/components/Buttons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const NaturovosLayout = () => {
  const pathname = usePathname();
  
  return (
    <SafeAreaView className="flex-1">
      <Header
        title="Sistema de Gestão Integrada"
        subtitle="Controle de entrada de carga"
        textbottom="Cadastro de cargas Naturovos"
        textcolor="text-gray-800"
        bgcolor="bg-solar-yellow-dark"
        color="#131212"
      />
      <View className="flex-row items-end justify-between border-b border-b-gray-300 py-2 mb-4 mx-3">
        <Text className="text-lg uppercase text-gray-700 font-semibold">
          Cargas aguardando
        </Text>
        {pathname === '/naturovos/statuscarga/status' &&
          <Link
            asChild
            className="flex-row items-center justify-between bg-blue-500 text-gray-700 px-3 py-0.5 rounded"
            href="naturovos/statuscarga/carga"
          >
            <Pressable>
              <MaterialCommunityIcons name="home" size={26} color="#FFF" />
            </Pressable>
          </Link>
        }
        <Link
          asChild
          className="flex-row items-center justify-between bg-solar-orange-middle text-gray-700 px-3 py-0.5 rounded"
          href="naturovos/nregistervisitors"
        >
          <Pressable>
            <MaterialCommunityIcons name="account-plus" size={26} />
            <Text className="ml-2">Cadastrar visitante</Text>
          </Pressable>
        </Link>
      </View>
      <View className="flex-row items-center justify-between gap-4 mx-3">
        <ButtonAction
          bgcolor="bg-green-500"
          textcolor="text-gray-50"
          title="Informar Nota"
          icon="file-document"
          href="naturovos/statuscarga/status"
          params="1"
          btnwidth="w-60"
        />
        <ButtonAction
          bgcolor="bg-orange-500"
          textcolor="text-gray-50"
          title="Entrada"
          icon="arrow-right-bold-box"
          href="naturovos/statuscarga/status"
          params="2"
          btnwidth="w-48"
        />
        <ButtonAction
          bgcolor="bg-blue-500"
          textcolor="text-gray-50"
          title="Saída"
          icon="arrow-left-bold-box"
          href="naturovos/statuscarga/status"
          params="3"
          btnwidth="w-48"
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

export default NaturovosLayout
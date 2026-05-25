import { View, Text } from 'react-native'
import React from 'react'
import { Slot, Stack, usePathname } from "expo-router"
import { StatusBar } from "expo-status-bar";
import Header from "../../../../components/Header";
import { ButtonAction } from "@/components/Buttons";

const SolarLayout = () => {
  const pathname = usePathname();
  return (
    <>
      <Header
        title="Sistema de Gestão Integrada"
        subtitle="Controle de entrada e saída de visitantes"
        textbottom="Cadastro de visitantes Solar Matriz"
        textcolor="text-solar-gray-light"
        bgcolor="bg-solar-blue-dark"
        color="#ffffff"
      />
      <View className="flex-row items-center justify-between px-3 mt-3">
        <ButtonAction
          bgcolor="bg-green-500"
          textcolor="text-gray-50"
          title="Histórico"
          icon="history"
          href="solar/historicovisitas"
          btnwidth="w-60"
        />
        {pathname !== '/solar' &&
        <ButtonAction
        bgcolor="bg-blue-500"
        textcolor="text-gray-50"
        title=""
        icon="home"
        href="solar"
        btnwidth="w-20"
      />
        }
        <ButtonAction
          bgcolor="bg-red-500"
          textcolor="text-gray-50"
          title="Saídas pendentes"
          icon="exit-run"
          href="solar/saidaspendentes"
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
          animation: 'slide_from_left',
          // animationDuration: 5000
        }}
      >
      </Stack>
      </View>
      <StatusBar backgroundColor="#154295" style="light" />
    </>
  )
}

export default SolarLayout
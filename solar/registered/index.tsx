import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";

const Registered = () => {
    const visitors: any = useLocalSearchParams();
    return (
        <View className="flex-col items-center justify-center h-[80%]">
            <View className="flex-col items-center justify-center">
                <Ionicons name="checkmark-sharp" size={140} color="#1542959b" />
            </View>
            <View className="flex-col items-center justify-center">
            <Text className="mt-10 font-medium text-4xl text-center text-gray-400">Acesso cadastrado</Text>
            <Text className="mt-4 font-medium text-4xl text-center text-gray-400">com sucesso!</Text>
            <Text className="mt-1 font-medium text-[14px] text-center text-gray-500">para</Text>
            <Text className="mt-1 font-medium text-[18px] text-center text-gray-400">
                    {visitors.value}
            </Text>
                <Pressable
                    onPress={() => router.push("solar")}
                    className="flex items-center justify-center bg-solar-orange-middle mt-6 py-4 px-12 rounded-full"
                >
                    <Text className="text-lg uppercase font-medium text-solar-gray-light">Continuar</Text>
                </Pressable>
            </View>
            <StatusBar backgroundColor="#F1F1F1" style="dark" />
        </View>
    )
}

export default Registered;
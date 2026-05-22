import { View, Text, Touchable, TouchableOpacity, Alert } from 'react-native';

export default function HomeScreen() {
  return (
    <View className='flex-1 items-center justify-center'>
      <Text className='text-2xl font-bold'>Home Screen</Text>
      <View
        className='flex-1 flex-row px-4 py-6 bg-gray-100 rounded-lg mt-6'
      >
        <TouchableOpacity
          className='mt-4 px-4 py-2 bg-blue-500 rounded flex-1'
          onPress={() => Alert.alert('Button Pressed', 'Foi pressionado o botão!')}
        >
          <Text className='text-white'>Solar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className='mt-4 px-4 py-2 bg-blue-500 rounded flex-1'
          onPress={() => Alert.alert('Button Pressed', 'Foi pressionado o botão!')}
        >
          <Text className='text-white'>Naturovos</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}
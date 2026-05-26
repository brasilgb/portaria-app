import { Redirect } from 'expo-router';
import type { Href } from 'expo-router';

export default function NaturovosScreen() {
  return <Redirect href={'/naturovos/cadastro-visitante' as Href} />;
}

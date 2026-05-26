import { Redirect } from 'expo-router';
import type { Href } from 'expo-router';

export default function SolarScreen() {
  return <Redirect href={'/solar/cadastro-visitante' as Href} />;
}

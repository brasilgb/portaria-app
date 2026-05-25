import TextoModal from "@/components/TextoModal";
import Loading from "../../../../../components/Loading";
import serviceportaria from "../../../../../services/serviceportaria";
import { hiddenCpf, maskHour } from "../../../../../utils/masks";
import { cpf } from "cpf-cnpj-validator";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { useEffect, useState } from "react";
import { ScrollView, View, Text } from "react-native";

interface VisitasProps {
  userIn: number;
  filial: number;
  fornecedor: string;
  transportadora: string;
  cpf: number;
  nome: string;
  placa: string;
  nota: number;
  pedido: number;
  horaEntrada: number;
  horaSaida: number;
  dataEntrada: number;
  dataSaida: number;
  quantidade: number;
  destino: string;
  produto: string;
  observacao: string;
}

const InfoVisitanteEntrada = () => {
  const data = useLocalSearchParams();

  const [visitasInfo, setVisitasInfo] = useState<any>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getVisitasAbertas = async () => {
      setLoading(true);
      await serviceportaria
      .post(`(PORT_LISTA_VISITA_ID)`, {
        ident: data?.ident,
      })
      .then((response) => {
          setLoading(false);
          setVisitasInfo(response.data.visita.data);
        })
        .catch((err) => {
          console.log(err);
        });
    };
    getVisitasAbertas();
  },[]);

  return (
    <>
      <Loading visible={loading} spinercolor="#29ABE2" />
      <View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-col items-start justify-center border-b border-b-gray-300 py-2 mb-4">
            <Text className="text-lg uppercase text-solar-blue-dark font-semibold">
              Informações do visitante
            </Text>
          </View>
          <View className="bg-white border border-gray-300 rounded-lg">
            <TextoModal title="Visitante" value={visitasInfo.nome} />
            <TextoModal title="CPF" value={hiddenCpf(`${("00000000000" + visitasInfo.cpf).slice(-11)}`)} />
            <TextoModal title="Placa" value={visitasInfo.placa} />
            <TextoModal title="Fornecedor" value={visitasInfo.fornecedor} />
            <TextoModal title="Transportadora" value={visitasInfo.transportadora} />
            <TextoModal title="Nota" value={visitasInfo.nota} />
            <TextoModal title="Pedido" value={visitasInfo.pedido} />
            <TextoModal title="Data entrada" value={moment((visitasInfo.dataEntrada)?.toString()).format("DD/MM/YYYY")} />
            <TextoModal title="Hora entrada" value={maskHour(("0000" + visitasInfo.horaEntrada).slice(-4))} />
            <TextoModal title="Quantidade" value={visitasInfo.quantidade} />
            <TextoModal title="Destino" value={visitasInfo.destino} />
            <TextoModal title="Produto/Serviço" value={visitasInfo.produto} />
            <TextoModal title="Observações" value={visitasInfo.observacoes} />
          </View>
        </ScrollView>
      </View>
    </>
  );
};

export default InfoVisitanteEntrada;

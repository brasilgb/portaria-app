import serviceportaria from './serviceportaria';

export interface VisitorRecord {
  cpfMotorista: string;
  nomeMotorista?: string;
  fornecedor?: string;
  placaVeiculo?: string;
  transportadora?: string;
  observacao?: string;
}

function pickVisitorRecord(data: any): VisitorRecord | null {
  const responseData = data?.visitante?.data ?? data?.data ?? data;
  const record =
    responseData?.visitante && typeof responseData.visitante === 'object'
      ? responseData.visitante
      : responseData;

  if (!record || typeof record !== 'object') {
    return null;
  }

  const success = data?.visitante?.success ?? record.success ?? data?.success;
  if (success === false) {
    return null;
  }

  return {
    cpfMotorista:
      String(
        record.cpfMotorista ??
          record.cpf_motorista ??
          record.cpf ??
          data?.cpfMotorista ??
          '',
      ),
    nomeMotorista:
      record.nomeMotorista ??
      record.nome_motorista ??
      record.motorista ??
      record.nome ??
      record.name ??
      responseData?.visitante,
    fornecedor: record.fornecedor,
    placaVeiculo:
      record.placaVeiculo ?? record.placa_veiculo ?? record.placa ?? record.vehiclePlate,
    transportadora: record.transportadora ?? responseData?.transportadora,
    observacao: record.observacao ?? record.observation,
  };
}

export async function findVisitorByDriverCpf(cpfMotorista: string) {
  const response = await serviceportaria.post('(PORT_VALIDA_VISITANTE)', {
    cpf: cpfMotorista,
  });

  if (response.status !== 200) {
    throw new Error('Nao foi possivel buscar os dados do visitante.');
  }

  return pickVisitorRecord(response.data);
}

export interface SaveVisitorVisitValues {
  filial?: string;
  userCode?: string;
  cpf: string;
  motorista: string;
  data: string;
  fornecedor: string;
  transportadora?: string;
  placa?: string;
  nota?: string;
  horaEntrada: string;
  quantidade?: string;
  destino: string;
  produto?: string;
  observacao?: string;
  sintomas?: string;
  granjas?: string;
  procedencia?: string;
}

export async function saveVisitorVisit(values: SaveVisitorVisitValues) {
  const response = await serviceportaria.post('(PORT_GRAVA_VISITA)', {
    filial: values.filial,
    user: values.userCode,
    cpf: values.cpf,
    nome: values.motorista,
    data: values.data,
    fornecedor: values.fornecedor,
    transportadora: values.transportadora ?? '',
    placa: values.placa ?? '',
    nota: values.nota ?? '',
    horaEntrada: values.horaEntrada,
    quantidade: values.quantidade ?? '',
    destino: values.destino,
    produto: values.produto ?? '',
    observacao: values.observacao ?? '',
    sintomas: values.sintomas,
    granjas: values.granjas,
    procedencia: values.procedencia,
  });

  if (response.status !== 200) {
    throw new Error('Nao foi possivel gravar a visita.');
  }

  const success = Boolean(response.data?.visita?.success);
  if (!success) {
    throw new Error(response.data?.visita?.message ?? 'Nao foi possivel gravar a visita.');
  }

  return response.data.visita;
}

export interface VisitHistoryRecord {
  ident: number;
  cpf?: string;
  nome: string;
  placa?: string;
  dataEntrada?: string | number;
  dataSaida?: string | number;
  horaEntrada?: string | number;
  horaSaida?: string | number;
}

export interface VisitDetailsRecord extends VisitHistoryRecord {
  userIn?: string | number;
  userOut?: string | number;
  filial?: string | number;
  fornecedor?: string;
  transportadora?: string;
  nota?: string | number;
  pedido?: string | number;
  quantidade?: string | number;
  destino?: string;
  produto?: string;
  observacao?: string;
  observacoes?: string;
}

export async function getVisitorVisitDetails(ident: number | string) {
  const response = await serviceportaria.post('(PORT_LISTA_VISITA_ID)', {
    ident,
  });

  if (response.status !== 200) {
    throw new Error('Nao foi possivel carregar as informacoes da visita.');
  }

  const visit = response.data?.visita;
  if (visit?.success === false) {
    throw new Error(visit?.message ?? 'Nao foi possivel carregar a visita.');
  }

  return (visit?.data ?? null) as VisitDetailsRecord | null;
}

export async function listVisitorHistory(data: string, filial?: string) {
  const response = await serviceportaria.post('(PORT_LISTA_VISITA)', {
    status: 2,
    data,
    filial,
  });

  if (response.status !== 200) {
    throw new Error('Nao foi possivel carregar o historico de visitas.');
  }

  const visit = response.data?.visita;
  if (visit?.success === false) {
    return [] as VisitHistoryRecord[];
  }

  return (visit?.data ?? []) as VisitHistoryRecord[];
}

export async function listPendingVisitorExits(data: string, filial?: string) {
  const response = await serviceportaria.post('(PORT_LISTA_VISITA)', {
    status: 1,
    data,
    filial,
  });

  if (response.status !== 200) {
    throw new Error('Nao foi possivel carregar as saidas pendentes.');
  }

  const visit = response.data?.visita;
  if (visit?.success === false) {
    return [] as VisitHistoryRecord[];
  }

  return (visit?.data ?? []) as VisitHistoryRecord[];
}

export async function registerVisitorExit(
  ident: number,
  dsaida: string,
  hsaida: string,
  userCode?: string,
) {
  const response = await serviceportaria.post('(PORT_ALTERA_VISITA)', {
    status: 2,
    user: userCode,
    ident,
    dsaida,
    hsaida,
  });

  if (response.status !== 200) {
    throw new Error('Nao foi possivel registrar a saida.');
  }

  const visit = response.data?.visita;
  if (visit?.success === false) {
    throw new Error(visit?.message ?? 'Nao foi possivel registrar a saida.');
  }

  return visit;
}

export async function reopenVisitorVisit(ident: number, userCode?: string) {
  const response = await serviceportaria.post('(PORT_ALTERA_VISITA)', {
    status: 1,
    user: userCode,
    ident,
    dsaida: '00010101',
    hsaida: 0,
  });

  if (response.status !== 200) {
    throw new Error('Nao foi possivel reverter a saida.');
  }

  return response.data;
}

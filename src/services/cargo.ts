import serviceportaria from './serviceportaria';

export interface CarrierRecord {
  codigo: string;
  nome: string;
}

export interface SaveCargoArrivalValues {
  filial?: string;
  userCode?: string;
  carrierCode: string;
  carrierName: string;
  placa: string;
  motorista: string;
  produto: string;
  pager: string;
  notas: string;
  tipoEntrada: number;
}

export interface CargoStatusRecord {
  codigo: string | number;
  pager?: string | number;
  placa?: string;
  transportadora?: string;
  motorista?: string;
  produto?: string;
  dhChegada?: string;
  setor?: string;
  status?: string;
}

export interface UpdateCargoStatusValues {
  userCode?: string;
  codigo: string | number;
  acao: string;
  peso: string;
}

export async function listCarriers(filter = '') {
  const response = await serviceportaria.post('(PORT_TRANSPORTADORAS)', {
    caller: 0,
    filtro: filter,
  });

  if (response.status !== 200) {
    throw new Error('Nao foi possivel carregar as transportadoras.');
  }

  const veiculos = response.data?.veiculos;
  if (veiculos?.success === false) {
    return [] as CarrierRecord[];
  }

  return (veiculos?.data ?? []) as CarrierRecord[];
}

export async function saveCargoArrival(values: SaveCargoArrivalValues) {
  const response = await serviceportaria.post('(PORT_CHEGADA)', {
    caller: 0,
    user: values.userCode,
    filial: values.filial,
    transportadora: {
      codigo: values.carrierCode,
      nome: values.carrierName,
    },
    placa: values.placa,
    motorista: values.motorista,
    produto: values.produto,
    pager: values.pager,
    notas: values.notas,
    tipoEntrada: values.tipoEntrada,
  });

  if (response.status !== 200) {
    throw new Error('Nao foi possivel registrar a chegada da carga.');
  }

  const genericResponse = response.data?.genericResponse;
  if (genericResponse?.success === false) {
    throw new Error(
      genericResponse?.message ?? 'Nao foi possivel registrar a chegada da carga.',
    );
  }

  return genericResponse;
}

export async function listCargoStatus(status: string, filial?: string) {
  const response = await serviceportaria.post('(PORT_STATUS_VEICULOS)', {
    caller: 0,
    filial,
    status,
  });

  if (response.status !== 200) {
    throw new Error('Nao foi possivel carregar as cargas.');
  }

  const veiculos = response.data?.veiculos;
  if (veiculos?.success === false) {
    return [] as CargoStatusRecord[];
  }

  return (veiculos?.data ?? []) as CargoStatusRecord[];
}

export async function captureCargoWeight(filial?: string) {
  const response = await serviceportaria.post('(PORT_CAPTURA_PESO)', {
    caller: 0,
    filial: filial ?? 26,
  });

  if (response.status !== 200) {
    throw new Error('Nao foi possivel capturar o peso da carga.');
  }

  return String(response.data?.peso?.peso ?? '');
}

export async function updateCargoStatus(values: UpdateCargoStatusValues) {
  const response = await serviceportaria.post('(PORT_ENTRADA_SAIDA)', {
    caller: 0,
    user: values.userCode,
    codigo: values.codigo,
    acao: values.acao,
    peso: values.peso,
  });

  if (response.status !== 200) {
    throw new Error('Nao foi possivel alterar o status da carga.');
  }

  const genericResponse = response.data?.genericResponse;
  if (genericResponse?.success === false) {
    throw new Error(
      genericResponse?.message ?? 'Nao foi possivel alterar o status da carga.',
    );
  }

  return genericResponse;
}

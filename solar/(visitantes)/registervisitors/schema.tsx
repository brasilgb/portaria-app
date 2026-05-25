import * as Yup from "yup";
import { ptForm } from "yup-locale-pt";
Yup.setLocale(ptForm);

export default Yup.object().shape({
    dataEntrada: Yup.string().required("Selecione a data de entrada"),
    horaEntrada: Yup.string().min(4).required("Digite o horário de entrada"),
    fornecedor: Yup.string().required("Digite o fornecedor/prestador serviço"),
    motorista: Yup.string().required("Digite o motorista"),
    placa: Yup.string().max(7).required("Digite o número da placa"),
    nota: Yup.string().max(10).notRequired(),
    quantidade: Yup.string().required("Digite a quantidade"),
    destino: Yup.string().required("Digite o destino da visita"),
    produto: Yup.string().required("Digite o produto/serviço")
});
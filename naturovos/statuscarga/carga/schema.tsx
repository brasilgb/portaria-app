import * as Yup from "yup";
import { ptForm } from "yup-locale-pt";
Yup.setLocale(ptForm);

export default Yup.object().shape({
    codigo: Yup.string().required("Digite o código!"),
    nome: Yup.string().required("Digite o nome!"),
    placa: Yup.string().required("Digite o placa!"),
    motorista: Yup.string().required("Digite o motorista!"),
    produto: Yup.string().required("Digite o produto!"),
    pager: Yup.string(),
    notas: Yup.string()
});
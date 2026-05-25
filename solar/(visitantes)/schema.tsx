import * as Yup from "yup";
import { ptForm } from "yup-locale-pt";
import { cpf } from 'cpf-cnpj-validator';
Yup.setLocale(ptForm);

export default Yup.object().shape({
    cpf: Yup.string().required()
        .test("cpfcnpj_check", "CPF ou CNPJ inválido",
            async value => await cpf.isValid(value) === true),
    // name: Yup.string().required("O campo nome é obrigatório!"),
    // pedido: Yup.number().typeError("Somente números")
})
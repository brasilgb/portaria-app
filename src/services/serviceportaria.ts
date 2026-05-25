import axios, { InternalAxiosRequestConfig } from 'axios';

let BASE_URL = '';

let requestCustom: InternalAxiosRequestConfig<any>;
let data: any;

const serviceportaria = axios.create({
  withCredentials: true
});

serviceportaria.interceptors.request.use(async (request) => {

  request.baseURL = `http://172.16.1.46:8080/servicesgruposolar/servlet/isCobol`;
  BASE_URL = `http://172.16.1.46:8080/servicesgruposolar/servlet/isCobol`;
  request.baseURL = request.baseURL;
  BASE_URL = BASE_URL;

  requestCustom = request;
  data = request.data;

  return request;
});

serviceportaria.interceptors.response.use(
  response => response,
  async _error => {
    // console.log('Abrindo sessão com o servidor novamente');

    const axiosNew = axios.create({
      baseURL: BASE_URL,
      withCredentials: true
    });

    let session = await axiosNew
      .get('(portariaApp)')
      .then(resp => resp)
      .catch(_err => {
        return {
          status: 404,
          success: false,
          message: 'Não foi possível conectar ao servidor'
        };
      });

    if (session.status !== 200) {
      session = {
        status: 404,
        success: false,
        message: 'Não foi possível conectar ao servidor',
      };

      return session;
    }

    // console.log('Refazendo a chamada original...');
    let originalResponse;
    if (requestCustom.method === 'POST' || requestCustom.method === 'post') {
      originalResponse = await serviceportaria.post(`${requestCustom.url}`, data);
    } else {
      originalResponse = await serviceportaria.get(`${requestCustom.url}`);
    }
    if (originalResponse.status !== 200) {
      session = {
        status: 404,
        success: false,
        message: 'Não foi possível conectar ao servidor'
      };
      return session;
    }
    return originalResponse;
  },
);

export default serviceportaria;

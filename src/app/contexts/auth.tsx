import servicelogin from '@/services/servicelogin';
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextData {
    signed: boolean;
    user: object | null;
    signIn(): void;
    signOut(): void;
}

interface AuthProviderProps {
    children: React.ReactNode;
}

interface SignInProps {
    code: string;
    nome: string;
    filial: string;
    password: string;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export default function AuthProvider({ children }: AuthProviderProps) {

const [user, setUser] = useState<any>();
  const [userLogged, setUserLogged] = useState<any>(null);
  const [historyFilial, setHistoryFilial] = useState("");

  // Armazena usuário no storage
  useEffect(() => {
    async function loadStorage() {
      const storageUser = await AsyncStorage.getItem("Auth_user");
      const storageFilial = await AsyncStorage.getItem("Auth_filial");
      if (storageUser) {
        setUser(JSON.parse(storageUser));
        setUserLogged(JSON.parse(storageUser))
      }
      if (storageFilial) {
        setHistoryFilial(JSON.parse(storageFilial));
      }
    }
    loadStorage();
  }, []);

  const signIn = useCallback(
    async ({ code, nome, filial, password }: SignInProps) => {
      const response = await servicelogin.post("(LOG_USU_VALIDATE_LOGIN)", {
        code: code,
        password: password,
      });
      if (response.status !== 200) {
        throw new Error(
          "Erro ao conectar-se ao servidor. O serviço da aplicação parece estar parado."
        );
      }
      const { success, message, detailMessage } = response.data.login;
      if (!success) {
        setUser(undefined);
        Alert.alert("Erro de Acesso ", message);

        return false;
      }
      const portariaAccess = await validateAccessLevel(code, 2888, 10);
      let udata = {
        filial: filial,
        code: code,
        nome: nome,
        levelPortaria: portariaAccess,
      };
      storageUser(udata);
      setUser(udata);
      storageFilial(filial);
      setHistoryFilial(filial);

      if (filial === "1") {
        router.push("solar");
      }

      if (filial === "26") {
        router.push("naturovos/statuscarga/carga");
      }
      return true;
    },
    []
  );

  const alterPassword = useCallback(async (values: any, user: any ) => {
    await servicelogin.post('(LOG_USU_CHANGE_PASSWORD)', {
      code: user?.code,
      oldPassword: values.password,
      newPassword: values.password2
    })
      .then((response) => {
        const { success, message } = response.data.change;
        if (!success) {
          Alert.alert('Error', message);
          return;
        }
        router.push({
          pathname: "(auth)/alterpassword/altered",
          params: { user },
        });
      })
      .catch((err) => {
        console.log(err);
      })
  }, []);

  const validateUser = useCallback(async ({ alternative }: any) => {
    const response = await servicelogin.post("(LOG_USU_VALIDATE_USER)", {
      alternative,
    });
    if (response.status !== 200) {
      throw new Error(
        "Erro ao conectar-se ao servidor. O serviço da aplicação parece estar parado."
      );
    }
    const { success, message, detailMessage, userName, userCode } =
      response.data.user;
    if (!success) {
      setUser(undefined);
      Alert.alert("Erro de Acesso", message);
      throw new Error(`${message}\n\nDetalhes:\n${detailMessage}`);
    }
    return {
      userName,
      userCode,
    };
  }, []);

  const validateAccessLevel = useCallback(
    async (userCode: any, programCode: any, module: any) => {
      const response = await servicelogin.post("(LOG_USU_VALIDATE_ACCESS)", {
        userCode,
        programCode,
        module,
      });
      if (response.status !== 200) {
        throw new Error(
          "Erro ao conectar-se ao servidor. O serviço da aplicação parece estar parado."
        );
      }
      const { success } = response.data.access;
      return success;
    },
    []
  );

  async function storageUser(data: any) {
    await AsyncStorage.setItem("Auth_user", JSON.stringify(data));
  }

  async function storageFilial(data: any) {
    await AsyncStorage.setItem("Auth_filial", JSON.stringify(data));
  }

  async function signOut() {
    Alert.alert(
      "Atenção - Ação de Logout",
      "Você será desconectado, deseja continuar?",
      [
        { text: "Sim", onPress: () => disconnect() },
        {
          text: "Não",
          style: "cancel",
        },
      ],
      { cancelable: false }
    );
  }

  async function disconnect() {
    await AsyncStorage.clear().then(() => {
      setUser(undefined);
      router.push("index");
    });
  }

    return (
        <AuthContext.Provider value={{ signed: false, user: null, signIn() { }, signOut() { } }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
  return useContext(AuthContext);
};
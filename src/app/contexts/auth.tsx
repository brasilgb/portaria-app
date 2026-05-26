import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert } from 'react-native';

import servicelogin from '@/services/servicelogin';

type Filial = '1' | '26';

interface AuthUser {
  code: string;
  nome?: string;
  filial: Filial;
  levelPortaria: boolean;
}

interface SignInProps {
  code: string;
  filial: Filial;
  keepSignedIn?: boolean;
  password: string;
  nome?: string;
}

interface ValidateUserProps {
  alternative: string;
}

interface ChangePasswordValues {
  password: string;
  password2: string;
}

interface AuthContextData {
  signed: boolean;
  loading: boolean;
  user: AuthUser | null;
  historyFilial: Filial | null;
  signIn(data: SignInProps): Promise<boolean>;
  signOut(): Promise<void>;
  validateUser(data: ValidateUserProps): Promise<{
    userName: string;
    userCode: string;
  }>;
  validateAccessLevel(
    userCode: string,
    programCode: number,
    moduleCode: number,
  ): Promise<boolean>;
  alterPassword(values: ChangePasswordValues, user: AuthUser): Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AUTH_USER_KEY = 'Auth_user';
const AUTH_FILIAL_KEY = 'Auth_filial';

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

function getHomeRoute(filial: Filial) {
  return filial === '1' ? '/solar' : '/naturovos';
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [historyFilial, setHistoryFilial] = useState<Filial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorage() {
      try {
        const [storageUser, storageFilial] = await Promise.all([
          AsyncStorage.getItem(AUTH_USER_KEY),
          AsyncStorage.getItem(AUTH_FILIAL_KEY),
        ]);

        if (storageUser) {
          setUser(JSON.parse(storageUser) as AuthUser);
        }

        if (storageFilial) {
          setHistoryFilial(JSON.parse(storageFilial) as Filial);
        }
      } finally {
        setLoading(false);
      }
    }

    loadStorage();
  }, []);

  const validateAccessLevel = useCallback(
    async (userCode: string, programCode: number, moduleCode: number) => {
      const response = await servicelogin.post('(LOG_USU_VALIDATE_ACCESS)', {
        userCode,
        programCode,
        module: moduleCode,
      });

      if (response.status !== 200) {
        throw new Error(
          'Erro ao conectar-se ao servidor. O serviço da aplicação parece estar parado.',
        );
      }

      return Boolean(response.data.access?.success);
    },
    [],
  );

  const validateUser = useCallback(async ({ alternative }: ValidateUserProps) => {
    const response = await servicelogin.post('(LOG_USU_VALIDATE_USER)', {
      alternative,
    });

    if (response.status !== 200) {
      throw new Error(
        'Erro ao conectar-se ao servidor. O serviço da aplicação parece estar parado.',
      );
    }

    const { success, message, detailMessage, userName, userCode } =
      response.data.user;

    if (!success) {
      setUser(null);
      Alert.alert('Erro de acesso', message);
      throw new Error(`${message}\n\nDetalhes:\n${detailMessage}`);
    }

    return {
      userName,
      userCode,
    };
  }, []);

  const signIn = useCallback(
    async ({ code, filial, keepSignedIn = false, password, nome }: SignInProps) => {
      setLoading(true);

      try {
        const response = await servicelogin.post('(LOG_USU_VALIDATE_LOGIN)', {
          code,
          password,
        });

        if (response.status !== 200) {
          throw new Error(
            'Erro ao conectar-se ao servidor. O serviço da aplicação parece estar parado.',
          );
        }

        const { success, message, userName, nome: responseName } = response.data.login;

        if (!success) {
          setUser(null);
          Alert.alert('Erro de acesso', message);
          return false;
        }

        const portariaAccess = await validateAccessLevel(code, 2888, 10);
        const validatedUser = await validateUser({ alternative: code });
        const userData: AuthUser = {
          code,
          filial,
          nome: nome ?? userName ?? responseName ?? validatedUser.userName,
          levelPortaria: portariaAccess,
        };

        if (keepSignedIn) {
          await Promise.all([
            AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData)),
            AsyncStorage.setItem(AUTH_FILIAL_KEY, JSON.stringify(filial)),
          ]);
        } else {
          await Promise.all([
            AsyncStorage.removeItem(AUTH_USER_KEY),
            AsyncStorage.removeItem(AUTH_FILIAL_KEY),
          ]);
        }

        setUser(userData);
        setHistoryFilial(filial);
        router.replace(getHomeRoute(filial));
        return true;
      } catch (error) {
        Alert.alert(
          'Erro de conexão',
          error instanceof Error
            ? error.message
            : 'Não foi possível autenticar o usuário.',
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [validateAccessLevel, validateUser],
  );

  const alterPassword = useCallback(
    async (values: ChangePasswordValues, authUser: AuthUser) => {
      try {
        const response = await servicelogin.post('(LOG_USU_CHANGE_PASSWORD)', {
          code: authUser.code,
          oldPassword: values.password,
          newPassword: values.password2,
        });

        const { success, message } = response.data.change;

        if (!success) {
          Alert.alert('Erro', message);
          return;
        }

        Alert.alert('Senha alterada', 'Sua senha foi alterada com sucesso.');
      } catch (error) {
        Alert.alert(
          'Erro de conexão',
          error instanceof Error
            ? error.message
            : 'Não foi possível alterar a senha.',
        );
      }
    },
    [],
  );

  const disconnect = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_USER_KEY),
      AsyncStorage.removeItem(AUTH_FILIAL_KEY),
    ]);

    setUser(null);
    setHistoryFilial(null);
    router.replace('/');
  }, []);

  const signOut = useCallback(async () => {
    Alert.alert(
      'Atenção - Ação de Logout',
      'Você será desconectado, deseja continuar?',
      [
        { text: 'Sim', onPress: disconnect },
        {
          text: 'Não',
          style: 'cancel',
        },
      ],
      { cancelable: false },
    );
  }, [disconnect]);

  const value = useMemo(
    () => ({
      signed: Boolean(user),
      loading,
      user,
      historyFilial,
      signIn,
      signOut,
      validateUser,
      validateAccessLevel,
      alterPassword,
    }),
    [
      alterPassword,
      historyFilial,
      loading,
      signIn,
      signOut,
      user,
      validateAccessLevel,
      validateUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};

import * as React from 'react';
import { AsyncStorage } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons,FontAwesome5,Entypo } from '@expo/vector-icons';
import Splash from "./src/pages/splash";
import Biblia from "./src/pages/bibliaPage";
import Principal from "./src/pages/homePage"
import Devocional from "./src/pages/devocionalPage"; //alterado para testar infinite scroll
import DevConteudo from "./src/pages/devConteudo";
import Intro from "./src/pages/introPage";
import SignIn from './src/pages/signInPage';
import SignUp from './src/pages/signUpPage';


import firebase from './src/config/firebase';
import 'firebase/auth';
import { AuthContext } from "./src/context/authContext";
import { DevContext } from "./src/context/devContext";

const SplashStack = createStackNavigator();
const AuthStack = createStackNavigator();
const Tabs = createBottomTabNavigator();
const AppStack = createStackNavigator();



export default function App ({ navigation }) {
  const [isLoading, setIsLoading] = React.useState(true);
//   const [userToken, setUserToken] = React.useState(null);
  const [userEmail, setEmail] = React.useState(null);
  const [msg, setMsg] = React.useState();
  const [goIntro, setGoIntro] = React.useState(false);

  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            // userToken: action.token,
            userEmail: action.email,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            // userToken: action.token,
            userEmail: action.email
          };
        case 'SIGN_UP':
            return {
              ...prevState,
              isSignout: false,
              // userToken: action.token,
              userEmail: action.email,
              goIntro: true
            };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            // userToken: null,
            userEmail: null
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
    //   userToken: null,
      userEmail: null
    }
  );

  React.useEffect(() => {
    // Fetch the token from storage then navigate to our appropriate place
    const bootstrapAsync = async () => {
    //   let userToken;
      let userEmail;
      try {
        userEmail = await AsyncStorage.getItem('userEmail');
        // userToken = await AsyncStorage.getItem('userToken');
      } catch (e) {
        // Restoring token failed
        console.log('Erro ao recuperar: ',e)
      }

      // After restoring token, we may need to validate it in production apps

      // This will switch to the App screen or Auth screen and this loading
      // screen will be unmounted and thrown away.
      dispatch({ type: 'RESTORE_TOKEN', email: userEmail /*, token: userToken*/ });
    };

    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async ({email,password}) => {
        firebase.auth().signInWithEmailAndPassword(email, password).then(result => {
            // console.log(result)
            setEmail(email);
            dispatch({ type: 'SIGN_IN', email: email/*, token: 'dummy-auth-token'*/ });
         }).catch(err => {
            console.log(err);
         })
      },
      signOut: () => {
        dispatch({ type: 'SIGN_OUT' })
      } ,
      signUp: async ({email}) => {
          setEmail(email);
          dispatch({ type: 'SIGN_UP', email: email /* ,token: 'dummy-auth-token' */});
      },
    }),
    []
  );

  const AuthStackScreens = () => {
    return(
    <AuthStack.Navigator initialRouteName="SignIn">
      <AuthStack.Screen name="SignIn" component={SignIn} options={{
          title: 'Acesso',
          // Quando o usuario faz o loggout uma animação intuitiva ocorre
          animationTypeForReplace: state.isSignout ? 'pop' : 'push',
      }} />
      <AuthStack.Screen name="SignUp" component={SignUp} options={{title: 'Cadastro' }}/>
      <AuthStack.Screen name="Intro" component={Intro} options={{title: 'Tutorial'}} />
    </AuthStack.Navigator>
    )
  }

  const TabScreens = () => {
    return(
    <Tabs.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Bíblia') {
          iconName = focused
            ? 'book-open'
            : 'bible';
        } else if (route.name === 'Principal') {
          iconName = focused ? 'home' : 'home';
        } else if (route.name === 'Devocional') {
          iconName = focused ? 'dove' : 'dove';
        }

        // You can return any component that you like here!
        return <FontAwesome5 name={iconName} size={size} color={color} />;
      },
    })}
    tabBarOptions={{
      activeTintColor: 'steelblue',
      inactiveTintColor: 'gray',
    }}>
      <Tabs.Screen name="Bíblia" component={Biblia} options={{ title: "Bíblia"}}/>
      <Tabs.Screen name="Principal" component={Principal} options={{ title: "Principal"}}/>
      <Tabs.Screen name="Devocional" component={Devocional} options={{ title: "Devocional"}}/>
    </Tabs.Navigator> 
    )
  }
  const AppScreens = () => {
    return(
      <AppStack.Navigator>
        <AppStack.Screen name = "Home" component ={TabScreens} options={{ title: 'Arsenal'}}/>
        <AppStack.Screen name = "DevConteudo" component ={DevConteudo} options={{ title: 'Devocional'}}/>
      </AppStack.Navigator>
      );
  }
  return (
    <DevContext.Provider>
      <AuthContext.Provider value={ authContext }>
        <NavigationContainer>
            {
              state.isLoading ? (
                <SplashStack.Navigator>
                  <SplashStack.Screen name="Splash" component={Splash} />
                </SplashStack.Navigator>
              ) : state.userEmail == null ? (
                <AuthStackScreens/>
              ) : (
              <AppScreens/>
              )
          }
        </NavigationContainer>
      </AuthContext.Provider>
    </DevContext.Provider>
  );
}

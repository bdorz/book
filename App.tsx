import React, {useEffect} from 'react';
import {StatusBar, AppState} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import AddEditTransactionScreen from './src/screens/AddEditTransactionScreen';
import {RootStackParamList} from './src/types';
import {replenishRemindersIfNeeded} from './src/utils/notifications';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    replenishRemindersIfNeeded();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        replenishRemindersIfNeeded();
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="AddEditTransaction"
            component={AddEditTransactionScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

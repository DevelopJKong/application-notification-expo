import { useEffect, useRef, useState } from 'react';

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { Button, NativeBaseProvider } from 'native-base';
import { Platform, Text, View } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function schedulePushNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `You've got mail! 📬`,
      body: 'Here is the notification body',
      data: { data: 'goes here' },
    },
    trigger: null,
  });
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    console.log(Constants?.expoConfig?.extra?.eas?.projectId);
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants?.expoConfig?.extra?.eas?.projectId || 'notification-app',
      })
    ).data;
    console.log('token', token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return token;
}

export default function App() {
  // ! 기본 state 모음
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<any>(false);

  // ! useRef 모음
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  const router = useRouter();

  // ! useEffect 모음
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      console.log(token);
      if (!token) return;
      // fetch('http://localhost:8000/token', {
      //   method: 'POST',
      //   headers: {
      //     Accept: 'application/json',
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     token: {
      //       value: token,
      //     },
      //   }),
      // })
      //   .then(() => console.log('send!'))
      //   .catch((err) => console.log(err));
      setExpoPushToken(token);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(response);
    });

    return () => {
      if (typeof notificationListener.current !== 'undefined' && typeof responseListener.current !== 'undefined') {
        Notifications.removeNotificationSubscription(notificationListener.current);
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <NativeBaseProvider>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        <Text>Your expo push token: {expoPushToken}</Text>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text>Title: {notification && notification.request.content.title} </Text>
          <Text>Body: {notification && notification.request.content.body}</Text>
          <Text>Data: {notification && JSON.stringify(notification.request.content.data)}</Text>
        </View>

        <Button
          onPress={async () => {
            await schedulePushNotification();
          }}
        >
          <Text>Press to schedule a notification</Text>
        </Button>
        <Button
          onPress={() => {
            router.push('/setting');
          }}
        >
          <Text>Setting</Text>
        </Button>
      </View>
    </NativeBaseProvider>
  );
}

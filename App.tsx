import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Button, Platform, StyleSheet, Text, View } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Expo push token:", token);
  } else {
    alert("Must use physical device for Push Notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

export default function App() {
  async function sendPushNotification(expoPushToken: any) {
    const message = {
      to: expoPushToken,
      sound: "default",
      title: "Test title",
      body: "Test body",
      data: { testData: "test data" },
    };
    setMessageText(message.data.testData);
    // await fetch("https://exp.host/--/api/v2/push/send", {
    //   method: "POST",
    //   headers: {
    //     Accept: "application/json",
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(message),
    // });
  }

  const [expoPushToken, setExpoPushToken] = useState("");
  const [messageText, setMessageText] = useState("");
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token: any) =>
      setExpoPushToken(token)
    );
    if (!notificationListener.current) return;
    if (!responseListener.current) return;

    (notificationListener.current as any) =
      Notifications.addNotificationReceivedListener((notification: any) => {
        setNotification(notification);
      });

    (responseListener.current as any) =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current as any
      );
      Notifications.removeNotificationSubscription(
        responseListener.current as any
      );
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "space-around",
      }}
    >
      <Text>Your expo push token: {expoPushToken}</Text>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Text>Notification Title: {notification && messageText} </Text>
        <Text>Notification Body: {notification && messageText}</Text>
        <Text>Notification Data: {notification && messageText}</Text>
      </View>
      <Button
        title="Press to Send Notification"
        onPress={async () => {
          await sendPushNotification(expoPushToken);
        }}
      />
    </View>
  );
}

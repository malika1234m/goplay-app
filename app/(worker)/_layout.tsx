import { useRef, useEffect } from "react";
import { View, Text, Animated, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { Tabs, useRouter, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useColors } from "@/lib/theme";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const WORKER_ROUTES = ["index", "bookings", "schedule", "profile"];

function PillIcon({ name, focused, label }: { name: IoniconsName; focused: boolean; label: string }) {
  const Colors = useColors();
  const bg = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(bg, { toValue: focused ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [focused]);

  const pillBg = bg.interpolate({
    inputRange:  [0, 1],
    outputRange: ["rgba(8,145,178,0)", Colors.infoLight],
  });

  const s = StyleSheet.create({
    item: {
      alignItems:        "center",
      justifyContent:    "center",
      borderRadius:      14,
      paddingVertical:   5,
      paddingHorizontal: 8,
      gap:               2,
    },
    label:    { fontSize: 10, fontWeight: "600", letterSpacing: 0.1, textAlign: "center" },
    labelOn:  { color: Colors.info },
    labelOff: { color: Colors.textMuted },
  });

  return (
    <Animated.View style={[s.item, { backgroundColor: pillBg }]}>
      <Ionicons
        name={focused ? name : (`${name}-outline` as IoniconsName)}
        size={21}
        color={focused ? Colors.info : Colors.textMuted}
      />
      <Text style={[s.label, focused ? s.labelOn : s.labelOff]} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

function WorkerTabBar({ state, descriptors, navigation }: any) {
  const Colors   = useColors();
  const router   = useRouter();
  const segments = useSegments();
  const current  = (segments as string[])[1] ?? "index";
  const idx      = Math.max(WORKER_ROUTES.indexOf(current), 0);

  const s = StyleSheet.create({
    overlay: {
      position: "absolute",
      left: 0, right: 0, top: 0, bottom: 0,
      justifyContent: "flex-end",
    },
    bar: {
      flexDirection:     "row",
      alignItems:        "center",
      backgroundColor:   Colors.card,
      marginHorizontal:  14,
      marginBottom:      Platform.OS === "ios" ? 22 : 12,
      borderRadius:      28,
      paddingVertical:   6,
      paddingHorizontal: 4,
      shadowColor:       "#000",
      shadowOffset:      { width: 0, height: 8 },
      shadowOpacity:     0.14,
      shadowRadius:      24,
      elevation:         18,
    },
    tab: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-30, 30])
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      if (e.translationX < -60 && idx < WORKER_ROUTES.length - 1) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.navigate(`/(worker)/${WORKER_ROUTES[idx + 1]}` as never);
      } else if (e.translationX > 60 && idx > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.navigate(`/(worker)/${WORKER_ROUTES[idx - 1]}` as never);
      }
    });

  return (
    <GestureDetector gesture={swipe}>
      <View style={s.overlay} pointerEvents="box-none">
        <View style={s.bar}>
          {state.routes.map((route: any, i: number) => {
            const { options } = descriptors[route.key];
            const focused = state.index === i;

            function onPress() {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params as never);
            }

            return (
              <TouchableOpacity key={route.key} style={s.tab} onPress={onPress} activeOpacity={0.75}>
                {options.tabBarIcon?.({ focused, color: focused ? Colors.info : Colors.textMuted, size: 21 })}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </GestureDetector>
  );
}

export default function WorkerLayout() {
  return (
    <Tabs
      tabBar={(props) => <WorkerTabBar {...(props as any)} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"    options={{ tabBarIcon: ({ focused }) => <PillIcon name="grid"     focused={focused} label="Home"     /> }} />
      <Tabs.Screen name="bookings" options={{ tabBarIcon: ({ focused }) => <PillIcon name="calendar" focused={focused} label="Bookings" /> }} />
      <Tabs.Screen name="schedule" options={{ tabBarIcon: ({ focused }) => <PillIcon name="time"     focused={focused} label="Schedule" /> }} />
      <Tabs.Screen name="profile"  options={{ tabBarIcon: ({ focused }) => <PillIcon name="person"   focused={focused} label="Profile"  /> }} />
    </Tabs>
  );
}

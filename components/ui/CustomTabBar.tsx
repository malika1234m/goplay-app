import { useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/lib/theme";

interface TabItemProps {
  focused:     boolean;
  label:       string;
  icon:        React.ReactNode;
  onPress:     () => void;
  accentColor: string;
  accentLight: string;
}

function TabItem({ focused, label, icon, onPress, accentColor, accentLight }: TabItemProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const bg    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue:         focused ? 1.1 : 1,
        useNativeDriver: true,
        tension:         140,
        friction:        8,
      }),
      Animated.timing(bg, {
        toValue:         focused ? 1 : 0,
        duration:        180,
        useNativeDriver: false,
      }),
    ]).start();
  }, [focused]);

  const pillBg = bg.interpolate({
    inputRange:  [0, 1],
    outputRange: ["rgba(0,0,0,0)", accentLight],
  });

  return (
    <TouchableOpacity onPress={onPress} style={s.tab} activeOpacity={0.75}>
      <Animated.View style={[s.pill, { backgroundColor: pillBg }]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          {icon}
        </Animated.View>
        {focused && (
          <Text style={[s.label, { color: accentColor }]} numberOfLines={1}>
            {label}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function CustomTabBar({ state, descriptors, navigation }: any) {
  const Colors = useColors();
  const insets = useSafeAreaInsets();

  const barStyle = StyleSheet.create({
    bar: {
      flexDirection:    "row",
      alignItems:       "center",
      backgroundColor:  Colors.card,
      borderRadius:     30,
      paddingVertical:  6,
      paddingHorizontal: 6,
      shadowColor:      "#000",
      shadowOffset:     { width: 0, height: 6 },
      shadowOpacity:    0.13,
      shadowRadius:     20,
      elevation:        16,
    },
  });

  return (
    <View style={[s.wrapper, { paddingBottom: insets.bottom + 8 }]}>
      <View style={barStyle.bar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;

          const accentColor = (options.tabBarActiveTintColor as string) ?? Colors.primary;
          const accentLight = accentColor === Colors.info ? Colors.infoLight : Colors.primaryLight;

          const icon = options.tabBarIcon?.({
            focused,
            color: focused ? accentColor : Colors.textMuted,
            size:  22,
          });

          const label = (options.title ?? route.name) as string;

          function onPress() {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type:              "tabPress",
              target:            route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params as never);
            }
          }

          return (
            <TabItem
              key={route.key}
              focused={focused}
              label={label}
              icon={icon}
              onPress={onPress}
              accentColor={accentColor}
              accentLight={accentLight}
            />
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    backgroundColor: "transparent",
    paddingHorizontal: 14,
    paddingTop: 8,
  },

  tab: {
    flex:            1,
    alignItems:      "center",
    justifyContent:  "center",
  },

  pill: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "center",
    borderRadius:    22,
    paddingVertical:  8,
    paddingHorizontal: 10,
    gap:             5,
  },

  label: {
    fontSize:    11,
    fontWeight:  "700",
    letterSpacing: 0.1,
    flexShrink:  1,
  },
});

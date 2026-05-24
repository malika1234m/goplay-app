import { useRef, useEffect, useState } from "react";
import {
  View, Text, Animated, StyleSheet, Platform,
  TouchableOpacity, Modal, Pressable, Dimensions,
} from "react-native";
import { Tabs, useRouter, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/lib/theme";
import { useUnreadCount } from "@/lib/queries/notifications";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];
type Colors = ReturnType<typeof useColors>;

// Routes shown in the tab bar
const MAIN_ROUTES = ["index", "bookings", "schedule", "earnings"];
// Routes hidden in the "Menu" sheet
const MENU_ROUTES = ["grounds", "reviews", "notifications", "profile"];

const MENU_ITEMS: { route: string; icon: IoniconsName; label: string }[] = [
  { route: "grounds",       icon: "business",      label: "Grounds"  },
  { route: "reviews",       icon: "star",          label: "Reviews"  },
  { route: "notifications", icon: "notifications", label: "Alerts"   },
  { route: "profile",       icon: "person",        label: "Profile"  },
];

const { width } = Dimensions.get("window");

// ── Pill icon (icon + label stacked) ────────────────────────────────────────
function PillIcon({ name, focused, label, badge }: {
  name: IoniconsName; focused: boolean; label: string; badge?: boolean;
}) {
  const Colors = useColors();
  const bg = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(bg, { toValue: focused ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [focused]);

  const pillBg = bg.interpolate({ inputRange: [0, 1], outputRange: ["rgba(22,163,74,0)", Colors.primaryLight] });

  const s = StyleSheet.create({
    item: {
      alignItems:        "center",
      justifyContent:    "center",
      borderRadius:      14,
      paddingVertical:   5,
      paddingHorizontal: 6,
      gap:               2,
    },
    itemLabel: { fontSize: 9, fontWeight: "600", letterSpacing: 0.1 },
    badge: {
      position: "absolute", top: -1, right: -2,
      width: 7, height: 7, borderRadius: 4,
      backgroundColor: Colors.error,
      borderWidth: 1.5, borderColor: Colors.white,
    },
  });

  return (
    <Animated.View style={[s.item, { backgroundColor: pillBg }]}>
      <View>
        <Ionicons
          name={focused ? name : (`${name}-outline` as IoniconsName)}
          size={22}
          color={focused ? Colors.primary : Colors.textMuted}
        />
        {badge && <View style={s.badge} />}
      </View>
      <Text style={[s.itemLabel, { color: focused ? Colors.primary : Colors.textMuted }]}>
        {label}
      </Text>
    </Animated.View>
  );
}

// ── Menu bottom sheet ────────────────────────────────────────────────────────
function MenuSheet({ visible, onClose, activeRoute, Colors }: {
  visible: boolean; onClose: () => void; activeRoute: string; Colors: Colors;
}) {
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const slideY     = useRef(new Animated.Value(300)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const notifCount = useUnreadCount();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY,  { toValue: 0,   useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacity, { toValue: 1,   duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY,  { toValue: 300, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0,   duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function navigate(route: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => router.navigate(`/(owner)/${route}` as never), 100);
  }

  const sheet = StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    container: {
      position:        "absolute",
      bottom:          0,
      left:            0,
      right:           0,
      backgroundColor: Colors.card,
      borderTopLeftRadius:  28,
      borderTopRightRadius: 28,
      paddingHorizontal:    20,
      paddingTop:           12,
      shadowColor:    "#000",
      shadowOffset:   { width: 0, height: -4 },
      shadowOpacity:  0.1,
      shadowRadius:   16,
      elevation:      20,
    },
    handle: {
      alignSelf:     "center",
      width:         40,
      height:        4,
      borderRadius:  2,
      backgroundColor: Colors.border,
      marginBottom:  16,
    },
    header: {
      flexDirection:  "row",
      alignItems:     "center",
      justifyContent: "space-between",
      marginBottom:   20,
    },
    title:    { fontSize: 18, fontWeight: "800", color: Colors.text },
    closeBtn: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: Colors.background,
      alignItems: "center", justifyContent: "center",
    },
    grid: {
      flexDirection:  "row",
      flexWrap:       "wrap",
      gap:            12,
      marginBottom:   8,
    },
    cell: {
      width:           (width - 40 - 12) / 2,
      backgroundColor: Colors.surfaceAlt,
      borderRadius:    16,
      paddingVertical: 18,
      paddingHorizontal: 16,
      alignItems:      "flex-start",
      gap:             8,
      borderWidth:     1.5,
      borderColor:     "transparent",
    },
    cellActive: {
      backgroundColor: Colors.primaryLight,
      borderColor:     Colors.primaryMid,
    },
    cellIconWrap: { position: "relative" },
    notifDot: {
      position: "absolute", top: -2, right: -4,
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: Colors.error,
      borderWidth: 1.5, borderColor: Colors.white,
    },
    cellLabel:       { fontSize: 15, fontWeight: "700", color: Colors.textSecondary },
    cellLabelActive: { color: Colors.primary },
    activeDot: {
      width: 6, height: 6, borderRadius: 3,
      backgroundColor: Colors.primary,
      marginTop: 2,
    },
  });

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[sheet.backdrop, { opacity }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[sheet.container, { transform: [{ translateY: slideY }], paddingBottom: insets.bottom + 16 }]}>
        {/* Handle + header */}
        <View style={sheet.handle} />
        <View style={sheet.header}>
          <Text style={sheet.title}>More</Text>
          <TouchableOpacity onPress={onClose} style={sheet.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 2×2 grid */}
        <View style={sheet.grid}>
          {MENU_ITEMS.map((item) => {
            const active    = activeRoute === item.route;
            const hasBadge  = item.route === "notifications" && notifCount > 0;
            return (
              <TouchableOpacity
                key={item.route}
                style={[sheet.cell, active && sheet.cellActive]}
                onPress={() => navigate(item.route)}
                activeOpacity={0.75}
              >
                <View style={sheet.cellIconWrap}>
                  <Ionicons
                    name={active ? item.icon : (`${item.icon}-outline` as IoniconsName)}
                    size={26}
                    color={active ? Colors.primary : Colors.textSecondary}
                  />
                  {hasBadge && <View style={sheet.notifDot} />}
                </View>
                <Text style={[sheet.cellLabel, active && sheet.cellLabelActive]}>
                  {item.label}
                </Text>
                {active && <View style={sheet.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </Modal>
  );
}

// ── Menu pill (5th tab button) ───────────────────────────────────────────────
function MenuPill({ active, Colors }: { active: boolean; Colors: Colors }) {
  const bg         = useRef(new Animated.Value(active ? 1 : 0)).current;
  const notifCount = useUnreadCount();

  useEffect(() => {
    Animated.timing(bg, { toValue: active ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [active]);

  const pillBg = bg.interpolate({ inputRange: [0, 1], outputRange: ["rgba(22,163,74,0)", Colors.primaryLight] });

  const s = StyleSheet.create({
    item: {
      alignItems:        "center",
      justifyContent:    "center",
      borderRadius:      14,
      paddingVertical:   5,
      paddingHorizontal: 6,
      gap:               2,
    },
    itemLabel: { fontSize: 9, fontWeight: "600", letterSpacing: 0.1 },
    badge: {
      position: "absolute", top: -1, right: -2,
      width: 7, height: 7, borderRadius: 4,
      backgroundColor: Colors.error,
      borderWidth: 1.5, borderColor: Colors.white,
    },
  });

  return (
    <Animated.View style={[s.item, { backgroundColor: pillBg }]}>
      <View>
        <Ionicons name="menu" size={22} color={active ? Colors.primary : Colors.textMuted} />
        {notifCount > 0 && <View style={s.badge} />}
      </View>
      <Text style={[s.itemLabel, { color: active ? Colors.primary : Colors.textMuted }]}>Menu</Text>
    </Animated.View>
  );
}

// ── Custom tab bar ───────────────────────────────────────────────────────────
function OwnerTabBar({ state, descriptors, navigation }: any) {
  const Colors    = useColors();
  const router    = useRouter();
  const segments  = useSegments();
  const insets    = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const current     = (segments as string[])[1] ?? "index";
  const mainIdx     = MAIN_ROUTES.indexOf(current);
  const inMenuRoute = MENU_ROUTES.includes(current);

  const s = StyleSheet.create({
    overlay: {
      position: "absolute",
      left: 0, right: 0,
      alignItems: "center",
    },
    bar: {
      flexDirection:     "row",
      alignItems:        "center",
      backgroundColor:   Colors.card,
      width:             width - 28,
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

  // Swipe left/right between main tabs
  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-30, 30])
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      if (mainIdx < 0) return; // in a menu route, swipe not active
      if (e.translationX < -60 && mainIdx < MAIN_ROUTES.length - 1) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.navigate(`/(owner)/${MAIN_ROUTES[mainIdx + 1]}` as never);
      } else if (e.translationX > 60 && mainIdx > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.navigate(`/(owner)/${MAIN_ROUTES[mainIdx - 1]}` as never);
      }
    });

  // Only render the 4 main routes
  const mainRoutes = state.routes.filter((r: any) => MAIN_ROUTES.includes(r.name));

  return (
    <>
      <MenuSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeRoute={current}
        Colors={Colors}
      />

      <GestureDetector gesture={swipe}>
        <View style={[s.overlay, { bottom: insets.bottom + 12 }]} pointerEvents="box-none">
          <View style={s.bar}>
            {/* 4 main tabs */}
            {mainRoutes.map((route: any) => {
              const { options } = descriptors[route.key];
              const focused = state.index === state.routes.indexOf(route) && !inMenuRoute;

              function onPress() {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }

              return (
                <TouchableOpacity key={route.key} style={s.tab} onPress={onPress} activeOpacity={0.75}>
                  {options.tabBarIcon?.({ focused, color: focused ? Colors.primary : Colors.textMuted, size: 22 })}
                </TouchableOpacity>
              );
            })}

            {/* Menu button (5th item) */}
            <TouchableOpacity
              style={s.tab}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setMenuOpen(true); }}
              activeOpacity={0.75}
            >
              <MenuPill active={inMenuRoute} Colors={Colors} />
            </TouchableOpacity>
          </View>
        </View>
      </GestureDetector>
    </>
  );
}

// ── Layout ───────────────────────────────────────────────────────────────────
export default function OwnerLayout() {
  return (
    <Tabs
      tabBar={(props) => <OwnerTabBar {...(props as any)} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"         options={{ tabBarIcon: ({ focused }) => <PillIcon name="grid"          focused={focused} label="Home"     /> }} />
      <Tabs.Screen name="bookings"      options={{ tabBarIcon: ({ focused }) => <PillIcon name="calendar"      focused={focused} label="Bookings" /> }} />
      <Tabs.Screen name="schedule"      options={{ tabBarIcon: ({ focused }) => <PillIcon name="time"          focused={focused} label="Schedule" /> }} />
      <Tabs.Screen name="earnings"      options={{ tabBarIcon: ({ focused }) => <PillIcon name="cash"          focused={focused} label="Earnings" /> }} />
      <Tabs.Screen name="grounds"       options={{ tabBarIcon: ({ focused }) => <PillIcon name="business"      focused={focused} label="Grounds"  /> }} />
      <Tabs.Screen name="reviews"       options={{ tabBarIcon: ({ focused }) => <PillIcon name="star"          focused={focused} label="Reviews"  /> }} />
      <Tabs.Screen name="notifications" options={{ tabBarIcon: ({ focused }) => <PillIcon name="notifications" focused={focused} label="Alerts"   /> }} />
      <Tabs.Screen name="profile"       options={{ tabBarIcon: ({ focused }) => <PillIcon name="person"        focused={focused} label="Profile"  /> }} />
    </Tabs>
  );
}

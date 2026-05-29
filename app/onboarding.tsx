import { useRef, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Dimensions, Animated, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

export const ONBOARDING_KEY = "goplay_onboarding_seen";

const { width } = Dimensions.get("window");

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface TitlePart { text: string; accent?: boolean }

interface Slide {
  id:       string;
  num:      string;
  icon:     IoniconsName;
  title:    TitlePart[];
  subtitle: string;
  chips:    { icon: IoniconsName; label: string }[];
  orbs:     { top?: number; bottom?: number; left?: number; right?: number; size: number; color: string }[];
}

const SLIDES: Slide[] = [
  {
    id:  "welcome",
    num: "01",
    icon: "football-outline",
    title: [
      { text: "Your Facility,\n" },
      { text: "Your Rules", accent: true },
    ],
    subtitle: "Designed for ground owners and workers who run their business from the field — not the office.",
    chips: [
      { icon: "phone-portrait-outline",   label: "Mobile-first"  },
      { icon: "shield-checkmark-outline", label: "Role-based"    },
      { icon: "flash-outline",            label: "Real-time"     },
    ],
    orbs: [
      { top: -40,  left: -50,  size: 220, color: "rgba(22,163,74,0.10)" },
      { bottom: 160, right: -70, size: 180, color: "rgba(22,163,74,0.07)" },
      { top: 260,  right: -30, size: 110, color: "rgba(56,189,248,0.06)" },
    ],
  },
  {
    id:  "manage",
    num: "02",
    icon: "calendar-outline",
    title: [
      { text: "Every Booking\n" },
      { text: "Under Control", accent: true },
    ],
    subtitle: "Confirm, complete, or cancel bookings in one tap. Add walk-ins instantly and never miss a beat.",
    chips: [
      { icon: "checkmark-circle-outline", label: "Instant confirm" },
      { icon: "bar-chart-outline",        label: "Revenue stats"   },
      { icon: "add-circle-outline",       label: "Walk-ins"        },
    ],
    orbs: [
      { top: -60,   right: -40, size: 240, color: "rgba(22,163,74,0.09)" },
      { bottom: 140, left: -60, size: 160, color: "rgba(22,163,74,0.06)" },
      { top: 300,   left: 40,   size: 90,  color: "rgba(56,189,248,0.05)" },
    ],
  },
  {
    id:  "ready",
    num: "03",
    icon: "rocket-outline",
    title: [
      { text: "Ready to\n" },
      { text: "Get Started?", accent: true },
    ],
    subtitle: "Sign in to your account or apply to list your sports facility and start receiving bookings today.",
    chips: [
      { icon: "business-outline", label: "Ground owners"   },
      { icon: "people-outline",   label: "Workers"         },
      { icon: "star-outline",     label: "Easy setup"      },
    ],
    orbs: [
      { bottom: 200, left: -80,  size: 260, color: "rgba(22,163,74,0.09)" },
      { top: -30,   right: -50, size: 180, color: "rgba(22,163,74,0.07)" },
      { top: 180,   left: -20,  size: 100, color: "rgba(56,189,248,0.06)" },
    ],
  },
];

// ─── Slide component — defined at file level to prevent remount ───────────────

function SlideItem({ slide }: { slide: Slide }) {
  return (
    <View style={sl.slide}>
      {/* Decorative background orbs */}
      {slide.orbs.map((orb, i) => (
        <View
          key={i}
          style={[
            sl.orb,
            {
              width: orb.size, height: orb.size, borderRadius: orb.size / 2,
              backgroundColor: orb.color,
              top: orb.top, bottom: orb.bottom, left: orb.left, right: orb.right,
            },
          ]}
        />
      ))}

      {/* Ghost slide number */}
      <Text style={sl.ghostNum}>{slide.num}</Text>

      {/* Icon */}
      <View style={sl.iconOuter}>
        <View style={sl.iconMid}>
          <LinearGradient
            colors={["rgba(22,163,74,0.28)", "rgba(22,163,74,0.12)"]}
            style={sl.iconInner}
          >
            <Ionicons name={slide.icon} size={38} color="#22c55e" />
          </LinearGradient>
        </View>
      </View>

      {/* Step label */}
      <View style={sl.stepRow}>
        <View style={sl.stepDot} />
        <Text style={sl.stepLabel}>STEP {slide.num} OF 03</Text>
      </View>

      {/* Title */}
      <Text style={sl.title}>
        {slide.title.map((part, i) =>
          part.accent
            ? <Text key={i} style={sl.titleAccent}>{part.text}</Text>
            : <Text key={i}>{part.text}</Text>
        )}
      </Text>

      {/* Subtitle */}
      <Text style={sl.subtitle}>{slide.subtitle}</Text>

      {/* Divider */}
      <View style={sl.divider} />

      {/* Chips */}
      <View style={sl.chipRow}>
        {slide.chips.map((c) => (
          <View key={c.label} style={sl.chip}>
            <Ionicons name={c.icon} size={13} color="#22c55e" />
            <Text style={sl.chipText}>{c.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const sl = StyleSheet.create({
  slide: {
    width,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingTop: Platform.OS === "ios" ? 90 : 64,
    paddingBottom: 210,
    overflow: "hidden",
  },

  orb: { position: "absolute" },

  ghostNum: {
    position: "absolute",
    fontSize: 200,
    fontWeight: "900",
    color: "rgba(255,255,255,0.025)",
    top: Platform.OS === "ios" ? 40 : 20,
    letterSpacing: -8,
    alignSelf: "center",
  },

  iconOuter: {
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: "rgba(22,163,74,0.07)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 28,
    borderWidth: 1, borderColor: "rgba(22,163,74,0.12)",
  },
  iconMid: {
    width: 98, height: 98, borderRadius: 49,
    backgroundColor: "rgba(22,163,74,0.10)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(22,163,74,0.18)",
  },
  iconInner: {
    width: 70, height: 70, borderRadius: 35,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(34,197,94,0.35)",
  },

  stepRow:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  stepDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: "#22c55e" },
  stepLabel:{ fontSize: 11, fontWeight: "700", color: "rgba(34,197,94,0.8)", letterSpacing: 1.8 },

  title: {
    fontSize: 32, fontWeight: "800", color: "#f0fdf4",
    textAlign: "center", lineHeight: 42, marginBottom: 14,
    letterSpacing: -0.5,
  },
  titleAccent: { color: "#22c55e" },

  subtitle: {
    fontSize: 14, color: "rgba(255,255,255,0.45)",
    textAlign: "center", lineHeight: 23, marginBottom: 24,
  },

  divider: {
    width: 40, height: 1,
    backgroundColor: "rgba(34,197,94,0.3)",
    marginBottom: 20,
  },

  chipRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(34,197,94,0.08)",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: "rgba(34,197,94,0.18)",
  },
  chipText: { fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: "600" },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080e1a" },

  controls: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    paddingTop: 16,
  },

  progressTrack: {
    height: 3, backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2, marginBottom: 22, overflow: "hidden",
  },
  progressFill: {
    height: 3, backgroundColor: "#16a34a", borderRadius: 2,
  },

  btnRow:   { flexDirection: "row", alignItems: "center", gap: 10 },
  skipBtn:  {
    paddingHorizontal: 22, paddingVertical: 15,
    borderRadius: 16, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  skipText: { fontSize: 14, color: "rgba(255,255,255,0.45)", fontWeight: "600" },

  nextBtn:  { flex: 1, borderRadius: 16, overflow: "hidden" },
  fullBtn:  { flex: 1, borderRadius: 16, overflow: "hidden" },
  nextGrad: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, gap: 7,
  },
  nextText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});

export default function OnboardingScreen() {
  const router  = useRouter();
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [current, setCurrent] = useState(0);

  const isLast = current === SLIDES.length - 1;

  async function finish() {
    await SecureStore.setItemAsync(ONBOARDING_KEY, "1");
    router.replace("/(auth)/login");
  }

  function next() {
    if (!isLast) {
      flatRef.current?.scrollToIndex({ index: current + 1, animated: true });
    } else {
      finish();
    }
  }

  const progressWidth = scrollX.interpolate({
    inputRange: [0, width * (SLIDES.length - 1)],
    outputRange: ["33%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* Subtle base gradient */}
      <LinearGradient
        colors={["#080e1a", "#0b1420", "#080e1a"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onScrollToIndexFailed={() => {}}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          setCurrent(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => <SlideItem slide={item} />}
      />

      {/* Controls */}
      <SafeAreaView edges={["bottom"]} style={s.controls}>
        {/* Progress bar */}
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, { width: progressWidth }]} />
        </View>

        <View style={s.btnRow}>
          {!isLast && (
            <TouchableOpacity style={s.skipBtn} onPress={finish} activeOpacity={0.7}>
              <Text style={s.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={isLast ? s.fullBtn : s.nextBtn}
            onPress={next}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#16a34a", "#15803d"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.nextGrad}
            >
              <Text style={s.nextText}>{isLast ? "Get Started" : "Next"}</Text>
              <Ionicons
                name={isLast ? "arrow-forward-circle" : "chevron-forward"}
                size={isLast ? 20 : 17}
                color="#fff"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

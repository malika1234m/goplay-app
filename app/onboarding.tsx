import { useRef, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Dimensions, Animated, Platform, Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useColors } from "@/lib/theme";

export const ONBOARDING_KEY = "goplay_onboarding_seen";

const { width } = Dimensions.get("window");

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface Slide {
  id: string;
  gradient: [string, string, string];
  icon: IoniconsName;
  iconBg: string;
  tag: string;
  title: string;
  subtitle: string;
  features: { icon: IoniconsName; label: string }[];
}

export default function OnboardingScreen() {
  const Colors = useColors();
  const router = useRouter();
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const SLIDES: Slide[] = [
    {
      id: "welcome",
      gradient: [Colors.navy, Colors.navyDark, "#0a1628"],
      icon: "football-outline",
      iconBg: "rgba(22,163,74,0.2)",
      tag: "WELCOME TO GOPLAY",
      title: "Your Sports Facility,\nIn Your Pocket",
      subtitle: "Built for Ground Owners and Workers to run their facilities without being tied to a desk.",
      features: [
        { icon: "phone-portrait-outline", label: "Mobile-first management" },
        { icon: "shield-checkmark-outline", label: "Secure & role-based access" },
        { icon: "flash-outline", label: "Real-time updates" },
      ],
    },
    {
      id: "bookings",
      gradient: ["#0f3d2e", "#14532d", "#0a2018"],
      icon: "calendar-outline",
      iconBg: "rgba(22,163,74,0.2)",
      tag: "BOOKINGS",
      title: "Manage Every\nBooking Effortlessly",
      subtitle: "View, confirm, complete, or cancel bookings from anywhere. Add walk-ins on the spot.",
      features: [
        { icon: "checkmark-circle-outline", label: "Confirm & complete with one tap" },
        { icon: "search-outline", label: "Search & filter by status" },
        { icon: "add-circle-outline", label: "Add walk-in bookings instantly" },
      ],
    },
    {
      id: "earnings",
      gradient: ["#1c1009", "#431407", "#1c1009"],
      icon: "trending-up-outline",
      iconBg: "rgba(249,115,22,0.2)",
      tag: "EARNINGS",
      title: "Track Revenue\n& Hit Your Goals",
      subtitle: "Set monthly revenue goals, watch animated stats, and monitor payout history.",
      features: [
        { icon: "bar-chart-outline", label: "Live revenue & booking stats" },
        { icon: "trophy-outline", label: "Set & track revenue goals" },
        { icon: "wallet-outline", label: "Payout history & bank details" },
      ],
    },
    {
      id: "team",
      gradient: ["#0c1a3d", "#1e3464", "#0c1a3d"],
      icon: "people-outline",
      iconBg: "rgba(99,150,255,0.2)",
      tag: "YOUR TEAM",
      title: "Stay on Top\nof Everything",
      subtitle: "Manage your grounds, courts, workers, and schedule — all in one place.",
      features: [
        { icon: "business-outline", label: "Manage grounds & courts" },
        { icon: "person-add-outline", label: "Assign & manage workers" },
        { icon: "notifications-outline", label: "Instant notifications" },
      ],
    },
  ];

  const s = StyleSheet.create({
    root:          { flex: 1, backgroundColor: Colors.navy },

    slide:         {
      width,
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      paddingTop: Platform.OS === "ios" ? 80 : 60,
      paddingBottom: 180,
    },

    logo:          {
      width: 72, height: 72, marginBottom: 20,
      borderRadius: 16, overflow: "hidden",
    },

    iconWrap:      {
      width: 80, height: 80, borderRadius: 26,
      alignItems: "center", justifyContent: "center",
      marginBottom: 20,
    },

    tagWrap:       {
      borderWidth: 1, borderColor: "rgba(22,163,74,0.5)",
      borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
      marginBottom: 20,
    },
    tag:           { fontSize: 11, fontWeight: "700", color: Colors.primary, letterSpacing: 2 },

    title:         {
      fontSize: 30, fontWeight: "800", color: "#ffffff",
      textAlign: "center", lineHeight: 38, marginBottom: 14,
    },

    subtitle:      {
      fontSize: 15, color: "rgba(255,255,255,0.65)",
      textAlign: "center", lineHeight: 23, marginBottom: 36,
    },

    featureList:   { width: "100%", gap: 12 },
    featureRow:    { flexDirection: "row", alignItems: "center", gap: 12 },
    featureIconWrap: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: "rgba(22,163,74,0.15)",
      alignItems: "center", justifyContent: "center",
    },
    featureLabel:  { fontSize: 14, color: "rgba(255,255,255,0.85)", fontWeight: "500", flex: 1 },

    // Controls
    controls:      {
      position: "absolute", bottom: 0, left: 0, right: 0,
      paddingHorizontal: 28,
      paddingBottom: Platform.OS === "ios" ? 48 : 32,
      paddingTop: 20,
      backgroundColor: "rgba(0,0,0,0.25)",
    },

    dots:          { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 20, gap: 6 },
    dot:           { height: 8, borderRadius: 4, backgroundColor: Colors.primary },

    btnRow:        { flexDirection: "row", alignItems: "center", gap: 12 },
    skipBtn:       {
      paddingHorizontal: 20, paddingVertical: 14,
      borderRadius: 14, borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
    },
    skipText:      { fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: "600" },

    nextBtn:       { flex: 1, borderRadius: 14, overflow: "hidden" },
    nextBtnFull:   { flex: 1 },
    nextGradient:  {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      paddingVertical: 16, paddingHorizontal: 24,
    },
    nextText:      { fontSize: 16, fontWeight: "700", color: "#fff" },
  });

  async function finish() {
    await SecureStore.setItemAsync(ONBOARDING_KEY, "1");
    router.replace("/(auth)/login");
  }

  function next() {
    if (currentIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      finish();
    }
  }

  const isLast = currentIndex === SLIDES.length - 1;

  function SlideView({ slide }: { slide: Slide }) {
    return (
      <LinearGradient colors={slide.gradient} style={s.slide}>
        <Image
          source={require("@/assets/icon.png")}
          style={s.logo}
          resizeMode="contain"
        />
        <View style={[s.iconWrap, { backgroundColor: slide.iconBg }]}>
          <Ionicons name={slide.icon} size={48} color={Colors.primary} />
        </View>
        <View style={s.tagWrap}>
          <Text style={s.tag}>{slide.tag}</Text>
        </View>
        <Text style={s.title}>{slide.title}</Text>
        <Text style={s.subtitle}>{slide.subtitle}</Text>
        <View style={s.featureList}>
          {slide.features.map((f, i) => (
            <View key={i} style={s.featureRow}>
              <View style={s.featureIconWrap}>
                <Ionicons name={f.icon} size={18} color={Colors.primary} />
              </View>
              <Text style={s.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onScrollToIndexFailed={() => {}}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => <SlideView slide={item} />}
      />

      {/* Bottom controls */}
      <View style={s.controls}>
        {/* Dot indicators */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: "clamp",
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: "clamp",
            });
            return (
              <Animated.View key={i} style={[s.dot, { width: dotWidth, opacity }]} />
            );
          })}
        </View>

        <View style={s.btnRow}>
          {!isLast && (
            <TouchableOpacity style={s.skipBtn} onPress={finish} activeOpacity={0.7}>
              <Text style={s.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[s.nextBtn, isLast && s.nextBtnFull]}
            onPress={next}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.nextGradient}
            >
              <Text style={s.nextText}>{isLast ? "Get Started" : "Next"}</Text>
              <Ionicons
                name={isLast ? "arrow-forward-circle" : "chevron-forward"}
                size={isLast ? 20 : 16}
                color="#fff"
                style={{ marginLeft: 6 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

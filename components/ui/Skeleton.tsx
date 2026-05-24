import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { useColors } from "@/lib/theme";

function SkeletonBox({ style }: { style?: ViewStyle }) {
  const Colors = useColors();
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[{ backgroundColor: Colors.border, borderRadius: 8 }, style, { opacity: anim }]} />;
}

export function SkeletonCard() {
  const Colors = useColors();

  const s = StyleSheet.create({
    card:     { flexDirection: "row", backgroundColor: Colors.card, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, overflow: "hidden", height: 88 },
    accent:   { width: 4 },
    cardBody: { flex: 1, padding: 14, gap: 8, justifyContent: "center" },
    line1:    { height: 14, width: "60%", borderRadius: 7 },
    line2:    { height: 11, width: "40%", borderRadius: 6 },
    line3:    { height: 11, width: "30%", borderRadius: 6 },
  });

  return (
    <View style={s.card}>
      <SkeletonBox style={s.accent} />
      <View style={s.cardBody}>
        <SkeletonBox style={s.line1} />
        <SkeletonBox style={s.line2} />
        <SkeletonBox style={s.line3} />
      </View>
    </View>
  );
}

export function SkeletonStatRow() {
  const Colors = useColors();

  const s = StyleSheet.create({
    statRow:  { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 14 },
    statBox:  { flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 14, alignItems: "center", gap: 8, borderWidth: 1, borderColor: Colors.border },
    statNum:  { height: 26, width: 60, borderRadius: 6 },
    statLbl:  { height: 10, width: 70, borderRadius: 5 },
  });

  return (
    <View style={s.statRow}>
      {[1, 2, 3].map((k) => (
        <View key={k} style={s.statBox}>
          <SkeletonBox style={s.statNum} />
          <SkeletonBox style={s.statLbl} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

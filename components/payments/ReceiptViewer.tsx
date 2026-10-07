import { Modal, View, Image, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Linking, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const isPdfReceipt = (url: string) => /\.pdf($|\?)/i.test(url) || url.includes("/raw/upload/");

/** Opens a receipt: images in the full-screen viewer, PDFs in the browser. */
export function openReceipt(url: string, showImage: (url: string) => void) {
  if (isPdfReceipt(url)) Linking.openURL(url);
  else showImage(url);
}

/** Full-screen receipt image (pinch to zoom on iOS). */
export default function ReceiptViewer({ url, onClose }: { url: string | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get("window");
  return (
    <Modal visible={!!url} animationType="fade" transparent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <ScrollView
          contentContainerStyle={s.center}
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          {url && <Image source={{ uri: url }} style={{ width, height: height * 0.85 }} resizeMode="contain" />}
        </ScrollView>
        <TouchableOpacity style={[s.close, { top: insets.top + 12 }]} onPress={onClose} accessibilityLabel="Close receipt">
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        {url && (
          <TouchableOpacity style={[s.open, { bottom: insets.bottom + 20 }]} onPress={() => Linking.openURL(url)}>
            <Ionicons name="open-outline" size={16} color="#fff" />
            <Text style={s.openText}>Open in browser</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)" },
  center:   { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  close:    { position: "absolute", right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  open:     { position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  openText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});

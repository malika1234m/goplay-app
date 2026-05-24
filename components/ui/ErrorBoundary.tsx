import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/lib/theme";

interface State { hasError: boolean; message: string }

type Colors = ReturnType<typeof useColors>;

class ErrorBoundaryClass extends React.Component<
  { children: React.ReactNode; colors: Colors },
  State
> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  reset = () => this.setState({ hasError: false, message: "" });

  render() {
    if (!this.state.hasError) return this.props.children;

    const { colors: Colors } = this.props;

    const s = StyleSheet.create({
      container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: Colors.background },
      icon:      { marginBottom: 16 },
      title:     { fontSize: 20, fontWeight: "700", color: Colors.text, marginBottom: 8 },
      message:   { fontSize: 14, color: Colors.textMuted, textAlign: "center", lineHeight: 20, marginBottom: 24 },
      btn:       { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 32 },
      btnText:   { fontSize: 15, fontWeight: "700", color: Colors.white },
    });

    return (
      <View style={s.container}>
        <Ionicons name="warning-outline" size={56} color={Colors.warning} style={s.icon} />
        <Text style={s.title}>Something went wrong</Text>
        <Text style={s.message} numberOfLines={4}>{this.state.message}</Text>
        <TouchableOpacity style={s.btn} onPress={this.reset}>
          <Text style={s.btnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

export default function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return <ErrorBoundaryClass colors={colors}>{children}</ErrorBoundaryClass>;
}

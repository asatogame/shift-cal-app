import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function PremiumPlanScreen({ navigation }) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);

  const handleSubscribe = () => {
    // TODO: RevenueCat / StoreKit でサブスク購入処理
    Alert.alert("準備中", "サブスクリプションは近日公開予定です");
  };

  const handleBuyPack = () => {
    // TODO: RevenueCat / StoreKit で追加パック購入処理
    Alert.alert("準備中", "追加パックは近日公開予定です");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
    >
      {/* ヘッダー */}
      <Text style={styles.heroEmoji}>✨</Text>
      <Text style={[styles.heroTitle, { color: colors.text }]}>プレミアムプラン</Text>
      <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
        広告なしの快適な体験と{"\n"}AI写真取り込みをフル活用
      </Text>

      {/* おすすめバッジ */}
      <View style={styles.recommendBadge}>
        <Text style={styles.recommendText}>おすすめ</Text>
      </View>

      {/* プレミアムカード */}
      <View style={styles.premiumCard}>
        <Text style={styles.premiumLabel}>プレミアム</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceYen}>¥</Text>
          <Text style={styles.priceAmount}>300</Text>
          <Text style={styles.pricePeriod}>/月</Text>
        </View>

        <View style={styles.featureList}>
          <Text style={styles.featureItem}>広告を完全非表示</Text>
          <Text style={styles.featureItem}>AI写真取り込み 月10回</Text>
          <Text style={styles.featureItem}>優先サポート</Text>
        </View>

        <Pressable
          style={[styles.subscribeBtn, busy && { opacity: 0.6 }]}
          onPress={handleSubscribe}
          disabled={busy}
        >
          <Text style={styles.subscribeBtnText}>登録する</Text>
        </Pressable>
      </View>

      {/* 追加パック */}
      <View style={[styles.packCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.packLabel, { color: colors.text }]}>追加パック</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.packPriceYen, { color: colors.accent }]}>¥</Text>
          <Text style={[styles.packPriceAmount, { color: colors.accent }]}>200</Text>
          <Text style={[styles.packPricePeriod, { color: colors.textSecondary }]}> / 10回分</Text>
        </View>

        <Text style={[styles.packDesc, { color: colors.textSecondary }]}>
          AI写真取り込み +10回分。有効期限なしで繰り越せます。
        </Text>

        <Pressable
          style={[styles.packBtn, { backgroundColor: colors.accent }]}
          onPress={handleBuyPack}
          disabled={busy}
        >
          <Text style={styles.packBtnText}>購入する</Text>
        </Pressable>
      </View>

      {/* 注意事項 */}
      <View style={styles.notes}>
        <Text style={[styles.noteText, { color: colors.textVeryMuted }]}>
          ・サブスクリプションはいつでもキャンセルできます
        </Text>
        <Text style={[styles.noteText, { color: colors.textVeryMuted }]}>
          ・購入はApple IDに紐づくApp Storeアカウントに請求されます
        </Text>
        <Text style={[styles.noteText, { color: colors.textVeryMuted }]}>
          ・月額プランは自動更新されます
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 24,
    paddingBottom: 60,
    alignItems: "center",
  },
  heroEmoji: { fontSize: 48, marginTop: 20, marginBottom: 12 },
  heroTitle: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
  heroDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  recommendBadge: {
    backgroundColor: "#F59E0B",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: -14,
    zIndex: 1,
  },
  recommendText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "800",
  },
  premiumCard: {
    backgroundColor: "#3A50E0",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 32,
  },
  premiumLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 20,
  },
  priceYen: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  priceAmount: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "800",
  },
  pricePeriod: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "600",
  },
  featureList: {
    width: "100%",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  featureItem: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
  },
  subscribeBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  subscribeBtnText: {
    color: "#3A50E0",
    fontSize: 16,
    fontWeight: "700",
  },
  packCard: {
    borderRadius: 20,
    padding: 28,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 24,
  },
  packLabel: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  packPriceYen: { fontSize: 18, fontWeight: "700" },
  packPriceAmount: { fontSize: 36, fontWeight: "800" },
  packPricePeriod: { fontSize: 14, fontWeight: "600" },
  packDesc: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 18,
  },
  packBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  packBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  notes: {
    width: "100%",
    gap: 4,
  },
  noteText: { fontSize: 11, lineHeight: 18 },
});

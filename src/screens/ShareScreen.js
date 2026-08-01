import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Share, FlatList } from "react-native";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import UpgradeAccountModal from "../components/UpgradeAccountModal";

export default function ShareScreen({ route, navigation }) {
  const { calendarId } = route.params;
  const { isGuest } = useAuth();
  const [calendarInfo, setCalendarInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (isGuest()) {
      setShowUpgrade(true);
    }
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "calendars", calendarId), async (snap) => {
      if (!snap.exists()) return;
      const data = { id: snap.id, ...snap.data() };
      setCalendarInfo(data);
      const memberDocs = await Promise.all(
        (data.memberIds || []).map((uid) => getDoc(doc(db, "users", uid)))
      );
      setMembers(
        memberDocs
          .filter((d) => d.exists())
          .map((d) => ({ id: d.id, ...d.data() }))
      );
    });
    return unsub;
  }, [calendarId]);

  if (!calendarInfo) return null;

  const handleShare = () => {
    if (isGuest()) {
      setShowUpgrade(true);
      return;
    }
    Share.share({
      message: `「${calendarInfo.name}」に招待します。シフトカレンダー共有アプリで招待コード「${calendarInfo.inviteCode}」を入力して参加してください。`,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.calName}>{calendarInfo.name}</Text>

      <View style={styles.codeBox}>
        <Text style={styles.codeLabel}>招待コード</Text>
        <Text style={styles.code}>{calendarInfo.inviteCode}</Text>
        <Text style={styles.codeHint}>
          このコードを共有すると、相手はアプリから参加できます
        </Text>
        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>招待コードを送る</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>メンバー（{members.length}人）</Text>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>
                {(item.displayName || item.email || "?")[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{item.displayName || item.email}</Text>
              {item.id === calendarInfo.ownerId && (
                <Text style={styles.ownerBadge}>作成者</Text>
              )}
            </View>
          </View>
        )}
      />

      <UpgradeAccountModal
        visible={showUpgrade}
        onClose={() => {
          setShowUpgrade(false);
          if (isGuest()) navigation.goBack();
        }}
        onSuccess={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFBFC", padding: 20 },
  calName: { fontSize: 20, fontWeight: "800", color: "#1F2937", marginBottom: 20 },
  codeBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  codeLabel: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" },
  code: {
    fontSize: 36,
    fontWeight: "800",
    color: "#3A50E0",
    letterSpacing: 6,
    marginVertical: 10,
  },
  codeHint: { fontSize: 12, color: "#9CA3AF", textAlign: "center", marginBottom: 16 },
  shareButton: {
    backgroundColor: "#3A50E0",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 32,
  },
  shareButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#9CA3AF", marginBottom: 12 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: { color: "#3A50E0", fontWeight: "700", fontSize: 15 },
  memberInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  memberName: { fontSize: 15, color: "#1F2937", fontWeight: "500" },
  ownerBadge: {
    fontSize: 11,
    color: "#3A50E0",
    fontWeight: "700",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
});

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  subscribeMyCalendars,
  createCalendar,
  joinCalendarByCode,
  updateCalendarColor,
  updateCalendarName,
  setDefaultCalendar,
  getDefaultCalendar,
  getMembers,
  leaveCalendar,
  deleteCalendar,
} from "../services/calendarService";
import UpgradeAccountModal from "../components/UpgradeAccountModal";

const CAL_COLORS = ["#3A50E0", "#16A34A", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];

export default function CalendarListScreen({ navigation }) {
  const { user, isGuest } = useAuth();
  const { colors } = useTheme();
  const [calendars, setCalendars] = useState([]);
  const [modalMode, setModalMode] = useState(null); // "create" | "join" | null
  const [inputValue, setInputValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [defaultCalId, setDefaultCalId] = useState(null);
  const [editingCal, setEditingCal] = useState(null); // カレンダー管理モーダル用
  const [members, setMembers] = useState([]); // editingCalのメンバー
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeMyCalendars(user.uid, setCalendars);
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getDefaultCalendar(user.uid).then(setDefaultCalId);
  }, [user]);

  const closeModal = () => {
    setModalMode(null);
    setInputValue("");
  };

  const requireAccount = (action) => {
    if (isGuest()) {
      setPendingAction(action);
      setShowUpgrade(true);
      return true;
    }
    return false;
  };

  const handleUpgradeSuccess = () => {
    if (pendingAction === "join") {
      setModalMode("join");
    }
    setPendingAction(null);
  };

  const handleJoinPress = () => {
    if (!requireAccount("join")) {
      setModalMode("join");
    }
  };

  const handleConfirm = async () => {
    if (!inputValue.trim()) return;
    setBusy(true);
    try {
      if (modalMode === "create") {
        const id = await createCalendar(user.uid, inputValue.trim());
        closeModal();
        navigation.navigate("Calendar", { calendarId: id });
      } else {
        if (isGuest()) {
          closeModal();
          requireAccount("join");
          return;
        }
        const id = await joinCalendarByCode(user.uid, inputValue.trim());
        closeModal();
        navigation.navigate("Calendar", { calendarId: id });
      }
    } catch (e) {
      Alert.alert("エラー", e.message || "処理に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  // カレンダー管理モーダルを開く
  const openCalendarSettings = async (cal) => {
    setEditingCal(cal);
    setEditName(cal.name);
    setEditColor(cal.color || CAL_COLORS[calendars.indexOf(cal) % CAL_COLORS.length]);
    try {
      const m = await getMembers(cal.memberIds || []);
      setMembers(m);
    } catch {
      setMembers([]);
    }
  };

  const closeCalSettings = () => {
    setEditingCal(null);
    setMembers([]);
    setEditName("");
    setEditColor("");
  };

  const handleSaveCalSettings = async () => {
    if (!editingCal) return;
    setBusy(true);
    try {
      if (editName !== editingCal.name) {
        await updateCalendarName(editingCal.id, editName);
      }
      if (editColor !== (editingCal.color || "")) {
        await updateCalendarColor(editingCal.id, editColor);
      }
      closeCalSettings();
    } catch (e) {
      Alert.alert("エラー", "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const handleSetDefault = async (calId) => {
    try {
      await setDefaultCalendar(user.uid, calId);
      setDefaultCalId(calId);
    } catch {
      Alert.alert("エラー", "設定に失敗しました");
    }
  };

  const handleLeave = (cal) => {
    if (cal.ownerId === user.uid) {
      Alert.alert("退出不可", "オーナーはカレンダーを退出できません。削除してください。");
      return;
    }
    Alert.alert("カレンダーを退出", `「${cal.name}」から退出しますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "退出",
        style: "destructive",
        onPress: async () => {
          await leaveCalendar(cal.id, user.uid);
          closeCalSettings();
        },
      },
    ]);
  };

  const handleDelete = (cal) => {
    if (cal.ownerId !== user.uid) {
      Alert.alert("削除不可", "オーナーのみカレンダーを削除できます。");
      return;
    }
    Alert.alert("カレンダーを削除", `「${cal.name}」を削除しますか？\nすべての予定が完全に削除されます。`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除する",
        style: "destructive",
        onPress: async () => {
          await deleteCalendar(cal.id);
          closeCalSettings();
        },
      },
    ]);
  };

  const getCalColor = (cal, index) => cal.color || CAL_COLORS[index % CAL_COLORS.length];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.bg }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>マイカレンダー</Text>
        {isGuest() && (
          <Pressable style={[styles.registerBtn, { backgroundColor: colors.accentLight }]} onPress={() => setShowUpgrade(true)}>
            <Text style={[styles.registerBtnText, { color: colors.accentText }]}>アカウント登録</Text>
          </Pressable>
        )}
      </View>

      {/* チーム機能メニュー */}
      <View style={[styles.featureMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable
          style={[styles.featureItem, { borderRightColor: colors.border }]}
          onPress={() => navigation.navigate("MemberShiftList")}
        >
          <Text style={styles.featureIcon}>👥</Text>
          <Text style={[styles.featureLabel, { color: colors.text }]}>メンバー{"\n"}シフト</Text>
        </Pressable>
        <Pressable
          style={[styles.featureItem, { borderRightColor: colors.border }]}
          onPress={() => navigation.navigate("DailyMemo")}
        >
          <Text style={styles.featureIcon}>💬</Text>
          <Text style={[styles.featureLabel, { color: colors.text }]}>日別メモ{"\n"}引き継ぎ</Text>
        </Pressable>
        <Pressable
          style={styles.featureItem}
          onPress={() => navigation.navigate("MonthlyShiftTable")}
        >
          <Text style={styles.featureIcon}>📋</Text>
          <Text style={[styles.featureLabel, { color: colors.text }]}>月間{"\n"}シフト表</Text>
        </Pressable>
      </View>

      <FlatList
        data={calendars}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>カレンダーがありません</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              新規作成するか、招待コードで{"\n"}仲間のカレンダーに参加しましょう
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const color = getCalColor(item, index);
          const isDefault = defaultCalId === item.id;
          return (
            <Pressable
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate("Calendar", { calendarId: item.id })}
            >
              <View style={[styles.cardAccent, { backgroundColor: color }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                  {isDefault && (
                    <View style={[styles.defaultBadge, { backgroundColor: colors.accent }]}>
                      <Text style={styles.defaultBadgeText}>デフォルト</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardMeta}>
                  <View style={[styles.memberBadge, { backgroundColor: colors.surfaceAlt }]}>
                    <Text style={[styles.memberBadgeText, { color: colors.textMuted }]}>
                      {item.memberIds?.length || 1}人
                    </Text>
                  </View>
                  <Text style={[styles.cardCode, { color: colors.textVeryMuted }]}>#{item.inviteCode}</Text>
                </View>
              </View>
              {/* 管理ボタン */}
              <Pressable
                style={styles.settingsBtn}
                onPress={() => openCalendarSettings(item)}
                hitSlop={8}
              >
                <Text style={[styles.settingsBtnText, { color: colors.textMuted }]}>⋯</Text>
              </Pressable>
              <Text style={[styles.cardArrow, { color: colors.textVeryMuted }]}>›</Text>
            </Pressable>
          );
        }}
      />

      <View style={[styles.actions, { backgroundColor: colors.bg }]}>
        <Pressable style={styles.createBtn} onPress={() => setModalMode("create")}>
          <Text style={styles.createBtnText}>+ 新規作成</Text>
        </Pressable>
        <Pressable style={[styles.joinBtn, { backgroundColor: colors.surface, borderColor: colors.accent }]} onPress={handleJoinPress}>
          <Text style={[styles.joinBtnText, { color: colors.accentText }]}>コードで参加</Text>
        </Pressable>
      </View>

      {/* 作成/参加モーダル */}
      <Modal visible={modalMode !== null} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalBox, { backgroundColor: colors.modalBg }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {modalMode === "create" ? "新しいカレンダー" : "招待コードで参加"}
            </Text>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }]}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={modalMode === "create" ? "カレンダー名を入力" : "招待コードを入力"}
              placeholderTextColor={colors.textMuted}
              autoCapitalize={modalMode === "create" ? "none" : "characters"}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable onPress={closeModal} style={styles.modalCancel}>
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>キャンセル</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                style={[styles.modalConfirm, !inputValue.trim() && { opacity: 0.4 }]}
                disabled={busy || !inputValue.trim()}
              >
                <Text style={styles.modalConfirmText}>
                  {busy ? "処理中..." : modalMode === "create" ? "作成" : "参加"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* カレンダー管理モーダル */}
      <Modal visible={editingCal !== null} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.settingsModal, { backgroundColor: colors.modalBg }]}>
            <View style={styles.settingsHeader}>
              <Text style={[styles.settingsTitle, { color: colors.text }]}>カレンダー設定</Text>
              <Pressable onPress={closeCalSettings}>
                <Text style={[styles.settingsClose, { color: colors.textSecondary }]}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.settingsBody} showsVerticalScrollIndicator={false}>
              {/* カレンダー名 */}
              <Text style={[styles.settingsLabel, { color: colors.textSecondary }]}>カレンダー名</Text>
              <TextInput
                style={[styles.modalInput, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }]}
                value={editName}
                onChangeText={setEditName}
              />

              {/* カラー選択 */}
              <Text style={[styles.settingsLabel, { color: colors.textSecondary }]}>カラー</Text>
              <View style={styles.colorGrid}>
                {CAL_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    style={[
                      styles.colorOption,
                      { backgroundColor: c },
                      editColor === c && styles.colorSelected,
                    ]}
                    onPress={() => setEditColor(c)}
                  >
                    {editColor === c && <Text style={styles.colorCheck}>✓</Text>}
                  </Pressable>
                ))}
              </View>

              {/* デフォルト設定 */}
              <Pressable
                style={[styles.settingsRow, { borderColor: colors.border }]}
                onPress={() => editingCal && handleSetDefault(editingCal.id)}
              >
                <Text style={[styles.settingsRowText, { color: colors.text }]}>デフォルトに設定</Text>
                {defaultCalId === editingCal?.id && (
                  <Text style={{ color: colors.accent, fontWeight: "700" }}>✓</Text>
                )}
              </Pressable>

              {/* メンバー一覧 */}
              <Text style={[styles.settingsLabel, { color: colors.textSecondary, marginTop: 16 }]}>
                メンバー（{members.length}人）
              </Text>
              {members.map((m) => (
                <View key={m.uid} style={[styles.memberRow, { borderColor: colors.border }]}>
                  <View style={[styles.memberAvatar, { backgroundColor: colors.avatar }]}>
                    <Text style={[styles.memberAvatarText, { color: colors.avatarText }]}>
                      {(m.displayName || m.email || "?")[0]}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text }]}>
                      {m.displayName || "名前未設定"}
                    </Text>
                    <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>
                      {m.email || ""}
                    </Text>
                  </View>
                  {m.uid === editingCal?.ownerId && (
                    <View style={[styles.ownerBadge, { backgroundColor: colors.accentLight }]}>
                      <Text style={[styles.ownerBadgeText, { color: colors.accentText }]}>オーナー</Text>
                    </View>
                  )}
                </View>
              ))}

              {/* 招待コード表示 */}
              <Text style={[styles.settingsLabel, { color: colors.textSecondary, marginTop: 16 }]}>招待コード</Text>
              <View style={[styles.inviteCodeBox, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.inviteCodeText, { color: colors.text }]}>
                  {editingCal?.inviteCode}
                </Text>
              </View>

              {/* 保存ボタン */}
              <Pressable
                style={[styles.saveBtn, busy && { opacity: 0.6 }]}
                onPress={handleSaveCalSettings}
                disabled={busy}
              >
                <Text style={styles.saveBtnText}>{busy ? "保存中..." : "保存"}</Text>
              </Pressable>

              {/* 危険ゾーン */}
              <View style={styles.dangerZone}>
                {editingCal?.ownerId !== user?.uid && (
                  <Pressable style={styles.dangerBtn} onPress={() => editingCal && handleLeave(editingCal)}>
                    <Text style={styles.dangerBtnText}>このカレンダーから退出</Text>
                  </Pressable>
                )}
                {editingCal?.ownerId === user?.uid && (
                  <Pressable style={styles.dangerBtn} onPress={() => editingCal && handleDelete(editingCal)}>
                    <Text style={styles.dangerBtnText}>カレンダーを削除</Text>
                  </Pressable>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <UpgradeAccountModal
        visible={showUpgrade}
        onClose={() => {
          setShowUpgrade(false);
          setPendingAction(null);
        }}
        onSuccess={handleUpgradeSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: "800" },
  registerBtn: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  registerBtnText: { fontSize: 13, fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  emptyBox: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptyDesc: {
    textAlign: "center",
    lineHeight: 22,
    fontSize: 14,
  },
  card: {
    flexDirection: "row",
    borderRadius: 16,
    marginBottom: 10,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
  },
  cardAccent: { width: 5, alignSelf: "stretch" },
  cardBody: { flex: 1, padding: 16 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  defaultBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  defaultBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  memberBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  memberBadgeText: { fontSize: 11, fontWeight: "600" },
  cardCode: { fontSize: 11 },
  settingsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  settingsBtnText: { fontSize: 20, fontWeight: "700" },
  cardArrow: { fontSize: 20, marginRight: 16 },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 30,
    paddingTop: 8,
    gap: 10,
  },
  createBtn: {
    flex: 1,
    backgroundColor: "#3A50E0",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  joinBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  joinBtnText: { fontWeight: "700", fontSize: 15 },

  // モーダル共通
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  modalBox: { borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 16 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 8 },
  modalCancelText: { fontSize: 15 },
  modalConfirm: {
    backgroundColor: "#3A50E0",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalConfirmText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // カレンダー設定モーダル
  settingsModal: {
    borderRadius: 20,
    padding: 24,
    maxHeight: "80%",
  },
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  settingsTitle: { fontSize: 18, fontWeight: "700" },
  settingsClose: { fontSize: 18, padding: 4 },
  settingsBody: {},
  settingsLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: "#fff",
  },
  colorCheck: { color: "#fff", fontWeight: "700", fontSize: 16 },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  settingsRowText: { fontSize: 15 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  memberAvatarText: { fontSize: 14, fontWeight: "700" },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: "600" },
  memberEmail: { fontSize: 11 },
  ownerBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  ownerBadgeText: { fontSize: 10, fontWeight: "600" },
  inviteCodeBox: {
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  inviteCodeText: { fontSize: 20, fontWeight: "800", letterSpacing: 4 },
  saveBtn: {
    backgroundColor: "#3A50E0",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  dangerZone: { marginBottom: 20 },
  dangerBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EF4444",
    marginBottom: 8,
  },
  dangerBtnText: { color: "#EF4444", fontWeight: "600", fontSize: 14 },
  // チーム機能メニュー
  featureMenu: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  featureItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRightWidth: 0.5,
  },
  featureIcon: { fontSize: 24, marginBottom: 4 },
  featureLabel: { fontSize: 11, fontWeight: "600", textAlign: "center", lineHeight: 15 },
});

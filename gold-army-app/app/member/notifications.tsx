import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MemberNav, MemberScreen, memberStyles as s } from '../../components/MemberScreen';
import { Badge, Card } from '../../components/ui';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  type NotificationItem,
} from '../../hooks/useNotifications';

export default function MemberNotificationsScreen() {
  const { data: notifications = [], isLoading, refetch, isRefetching } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = notifications.filter((n) => {
    if (activeTab === 'UNREAD') return !n.isRead;
    return true;
  });

  const handleMarkRead = async (item: NotificationItem) => {
    if (item.isRead) return;
    try {
      await markReadMutation.mutateAsync(item.id);
    } catch {
      // Ignore background failure
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      Alert.alert('Success', 'All notifications marked as read.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to mark notifications read.';
      Alert.alert('Error', msg);
    }
  };

  return (
    <MemberScreen title="Notifications">
      {/* Top Action Bar */}
      <View style={styles.topBar}>
        <View style={styles.tabGroup}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'ALL' && styles.tabBtnActive]}
            onPress={() => setActiveTab('ALL')}
          >
            <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
              All ({notifications.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'UNREAD' && styles.tabBtnActive]}
            onPress={() => setActiveTab('UNREAD')}
          >
            <Text style={[styles.tabText, activeTab === 'UNREAD' && styles.tabTextActive]}>
              Unread ({unreadCount})
            </Text>
          </Pressable>
        </View>

        {unreadCount > 0 && (
          <Pressable
            onPress={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
            style={styles.markAllBtn}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {/* Notification List */}
      {isLoading ? (
        <ActivityIndicator color={colors.goldSoft} style={{ marginVertical: 24 }} />
      ) : filtered.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            {activeTab === 'UNREAD' ? 'No Unread Notifications' : 'Notification Center Empty'}
          </Text>
          <Text style={[s.muted, { textAlign: 'center', marginTop: 4 }]}>
            {activeTab === 'UNREAD'
              ? 'You are all caught up! No unread gym announcements or reminders.'
              : 'You have not received any notifications or announcements yet.'}
          </Text>
        </Card>
      ) : (
        filtered.map((item) => {
          const dateStr = new Date(item.createdAt).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <Pressable key={item.id} onPress={() => handleMarkRead(item)}>
              <Card style={[styles.notifCard, !item.isRead ? styles.notifCardUnread : undefined]}>
                <View style={s.row}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={styles.titleRow}>
                      {!item.isRead && <View style={styles.unreadDot} />}
                      <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>
                        {item.title}
                      </Text>
                    </View>
                    <Text style={styles.notifMessage}>{item.message}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.notifTime}>{dateStr}</Text>
                      <Text style={styles.notifSender}>· {item.createdBy}</Text>
                    </View>
                  </View>
                  <Badge
                    label={!item.isRead ? 'NEW' : 'READ'}
                    tone={!item.isRead ? 'gold' : undefined}
                  />
                </View>
              </Card>
            </Pressable>
          );
        })
      )}

      <MemberNav />
    </MemberScreen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tabGroup: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  tabBtnActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.goldSoft,
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  markAllText: {
    color: colors.goldSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  notifCard: {
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.line,
  },
  notifCardUnread: {
    borderLeftColor: colors.goldSoft,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.goldSoft,
    marginRight: 6,
  },
  notifTitle: {
    color: colors.text2,
    fontSize: 14,
    fontWeight: '700',
  },
  notifTitleUnread: {
    color: colors.white,
    fontWeight: '800',
  },
  notifMessage: {
    color: colors.text2,
    fontSize: 12,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  notifTime: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  notifSender: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
});

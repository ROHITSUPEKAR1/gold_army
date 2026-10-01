import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { Badge, Card, PrimaryButton } from '../../components/ui';
import { MemberScreen, memberStyles as s } from '../../components/MemberScreen';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useCheckIn, type CheckInResponse } from '../../hooks/useAttendance';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<CheckInResponse | null>(null);

  const checkInMutation = useCheckIn();

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isProcessing || successData || errorMessage || scannedData === data) {
      return;
    }

    setScannedData(data);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await checkInMutation.mutateAsync({ qrToken: data.trim() });
      setSuccessData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to verify check-in.';
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScan = () => {
    setScannedData(null);
    setErrorMessage(null);
    setIsProcessing(false);
  };

  // Permission: Not yet loaded
  if (!permission) {
    return (
      <MemberScreen title="Scan to Check-in">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.goldSoft} />
        </View>
      </MemberScreen>
    );
  }

  // Permission: Denied or blocked
  if (!permission.granted) {
    return (
      <MemberScreen title="Scan to Check-in">
        <Card style={styles.permissionCard}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionHeading}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Gold Army Fitness Club needs camera access to scan the gym entrance QR code and verify your attendance.
          </Text>
          <View style={{ marginTop: 18, width: '100%' }}>
            <PrimaryButton label="Grant Camera Access" onPress={requestPermission} />
          </View>
        </Card>
      </MemberScreen>
    );
  }

  return (
    <MemberScreen title="Scan to Check-in" scroll={false}>
      <View style={styles.container}>
        {/* Scanner Viewport */}
        <View style={styles.scannerWrapper}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={isProcessing || successData ? undefined : handleBarcodeScanned}
          />

          {/* Scanner Overlay Frame */}
          <View style={styles.overlay}>
            <View style={styles.targetFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              {isProcessing && (
                <View style={styles.verifyingOverlay}>
                  <ActivityIndicator size="large" color={colors.goldSoft} />
                  <Text style={styles.verifyingText}>Verifying QR...</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Guidance / Error Card */}
        {errorMessage ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorHeading}>Check-in Failed</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <View style={{ marginTop: 14 }}>
              <PrimaryButton label="Try Again" onPress={resetScan} />
            </View>
          </Card>
        ) : (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Align QR code inside frame</Text>
            <Text style={styles.instructionsText}>
              Point your camera at the official Gold Army gym entrance QR code at the turnstile.
            </Text>
          </View>
        )}

        {/* Success Modal Experience */}
        <Modal visible={Boolean(successData)} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.successModalCard}>
              <View style={styles.successCheckCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>

              <Text style={styles.successTitle}>CHECK-IN SUCCESSFUL</Text>
              <Text style={styles.brandTitle}>GOLD ARMY FITNESS CLUB</Text>

              <View style={styles.successDivider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Time:</Text>
                <Text style={styles.infoValue}>
                  Today •{' '}
                  {new Date().toLocaleTimeString('en-IN', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Service:</Text>
                <Text style={styles.infoValue}>
                  {successData?.attendance?.service?.name || 'General Gym Access'}
                </Text>
              </View>

              <View style={[styles.infoRow, { marginTop: 10 }]}>
                <Text style={styles.infoLabel}>Current Streak:</Text>
                <Badge
                  label={`🔥 ${successData?.currentStreak ?? 1} DAYS`}
                  tone="gold"
                />
              </View>

              <View style={styles.actionRow}>
                <PrimaryButton
                  label="VIEW ATTENDANCE"
                  onPress={() => {
                    setSuccessData(null);
                    router.replace('/member/attendance');
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </MemberScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  permissionCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: 40,
  },
  permissionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  permissionHeading: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  scannerWrapper: {
    width: 280,
    height: 280,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginTop: 20,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetFrame: {
    width: 220,
    height: 220,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.goldSoft,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  verifyingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 10,
  },
  verifyingText: {
    color: colors.goldSoft,
    fontSize: 13,
    fontWeight: '700',
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  instructionsTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  instructionsText: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorCard: {
    width: '100%',
    borderColor: colors.red,
    backgroundColor: '#24120F',
    marginTop: 20,
  },
  errorHeading: {
    color: colors.redBright,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  errorText: {
    color: colors.text2,
    fontSize: 13,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderColor: colors.goldSoft,
    borderWidth: 1.5,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  successCheckCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1C3A27',
    borderColor: '#5FD39E',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkMark: {
    color: '#5FD39E',
    fontSize: 32,
    fontWeight: '900',
  },
  successTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  brandTitle: {
    color: colors.goldSoft,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  successDivider: {
    height: 1,
    backgroundColor: colors.line,
    width: '100%',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginVertical: 4,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  actionRow: {
    width: '100%',
    marginTop: 24,
  },
});

import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  RichText,
  ScreenContainer,
} from '@/components';
import { getEducationSection } from '@/features/content/api';
import { useAsync } from '@/lib/useAsync';
import { colors, radius, spacing, typography } from '@/theme';

export default function VideoScreen() {
  const { data, loading, error, refetch } = useAsync(() => getEducationSection('video'), []);

  const videoUrl = data?.video_url ?? null;
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
  });

  if (loading) return <LoadingState />;
  if (error) {
    return (
      <ScreenContainer scroll={false}>
        <View style={styles.center}>
          <ErrorState message={error} onRetry={refetch} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>{data?.title ?? 'Eğitim Videosu'}</Text>

      {videoUrl ? (
        <View style={styles.playerWrap}>
          <VideoView
            player={player}
            style={styles.player}
            fullscreenOptions={{ enable: true }}
            allowsPictureInPicture
            contentFit="contain"
            nativeControls
          />
        </View>
      ) : (
        <Card style={styles.placeholder}>
          <EmptyState
            icon="videocam-outline"
            title="Video henüz yüklenmemiş"
            description="Subkutan enjeksiyon eğitim videosu araştırmacı tarafından yakında eklenecek."
            actionLabel="Yenile"
            onAction={refetch}
          />
        </Card>
      )}

      {data?.body ? (
        <Card style={styles.card}>
          <RichText content={data.body} />
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, marginBottom: spacing.md },
  playerWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: spacing.lg,
  },
  player: { width: '100%', aspectRatio: 16 / 9 },
  placeholder: { marginBottom: spacing.lg },
  card: { marginBottom: spacing.lg },
  center: { flex: 1, justifyContent: 'center' },
});

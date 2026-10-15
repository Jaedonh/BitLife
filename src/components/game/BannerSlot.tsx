import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ads } from '@/services/ads';
import { useSettingsStore } from '@/store/settingsStore';

/** Anchored banner for free users; renders nothing for premium or where unsupported. */
export function BannerSlot({ onHeight }: { onHeight?: (h: number) => void }) {
  const premium = useSettingsStore((s) => s.premium);
  const [, setHeight] = useState(0);
  const Banner = ads.Banner;
  if (premium || !Banner || !ads.isReady()) return null;
  return (
    <View style={styles.slot}>
      <Banner
        onHeight={(h) => {
          setHeight(h);
          onHeight?.(h);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ slot: { alignItems: 'center', width: '100%' } });

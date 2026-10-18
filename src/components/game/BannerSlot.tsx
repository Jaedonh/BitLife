import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ads } from '@/services/ads';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Anchored banner for free users; renders nothing for premium or where unsupported.
 * `clearance` keeps UI that overhangs from below (the round Age button) off the ad:
 * ad policies forbid controls on top of a banner.
 */
export function BannerSlot({ onHeight, clearance = 0 }: { onHeight?: (h: number) => void; clearance?: number }) {
  const premium = useSettingsStore((s) => s.premium);
  // Subscribed so the slot appears as soon as the SDK finishes starting, not on the next unrelated render.
  useSettingsStore((s) => s.adsReady);
  const [, setHeight] = useState(0);
  const Banner = ads.Banner;
  if (premium || !Banner || !ads.isReady()) return null;
  return (
    <View style={[styles.slot, { paddingBottom: clearance }]}>
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

import { Image, type ImageStyle, type StyleProp } from 'react-native';

/** The sunrise from the app icon, on a transparent background (drawn by scripts/generate-icons.sh). */
const SUNRISE = require('../../../assets/images/splash-icon.png');

/** The game's mark, as on the home screen. Decorative, so screen readers skip it. */
export function BrandMark({ size, style }: { size: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={SUNRISE} style={[{ width: size, height: size }, style]} resizeMode="contain" accessible={false} accessibilityIgnoresInvertColors />;
}

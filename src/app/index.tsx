import { StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/theme';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={typography.title}>LifeLoop</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});

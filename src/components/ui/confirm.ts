import { Alert, Platform } from 'react-native';

/**
 * Asks the player to confirm a destructive or irreversible action (drop out, quit,
 * divorce, sell...). Uses the browser dialog on web and a native alert elsewhere.
 * Resolves true only when the player confirms.
 */
export function confirmAction(title: string, message: string, confirmLabel = 'Confirm'): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(Boolean(globalThis.confirm?.(`${title}\n\n${message}`)));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

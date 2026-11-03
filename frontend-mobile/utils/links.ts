// utils/links.ts
// External links shown in the app. privacyPolicy must match the Privacy
// Policy URL entered in App Store Connect / Google Play Console.
import { Alert, Linking } from 'react-native';

export const links = {
  supportEmail: 'support@izimorocco.com',
  contactPage: 'https://izimorocco.com/fr/contact',
  privacyPolicy: 'https://morocco-quest-finder.lovable.app/privacy',
  phone: '+212663561858',
};

// Open an external URL; show fallbackMessage if the device can't open it
export const openLink = async (url: string, fallbackMessage?: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    if (fallbackMessage) Alert.alert('IZI Morocco', fallbackMessage);
  }
};

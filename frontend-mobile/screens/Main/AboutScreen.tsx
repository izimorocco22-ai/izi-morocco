
import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import commonStyles from '../../styles/commonStyles';
import { RFValue } from '../../utils/responsive';
import colors from '../../styles/colors';

const AboutScreen = () => {
  return (
    <ScreenWrapper backgroundColor="#ffffff">
      <ScrollView
        style={commonStyles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/images/logo/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>IZI Morocco</Text>
          <Text style={styles.version}>Version 1.1.0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About the App</Text>
          <Text style={styles.description}>
            IZI Morocco is an immersive treasure hunt experience that takes you on an adventure through the beautiful landscapes and hidden gems of Morocco. Explore the map, discover hidden checkpoints, solve puzzles, and unlock the secrets of Morocco's rich culture.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Features</Text>
          {['Interactive treasure hunt map', 'QR code scanning', 'Photo & video challenges', 'Real-time GPS tracking', 'Offline support'].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.dot} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.copyright}>© 2026 Izi Morocco. All rights reserved.</Text>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: RFValue(30),
    paddingBottom: RFValue(60),
    paddingHorizontal: RFValue(20),
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: RFValue(30),
  },
  logo: {
    width: RFValue(80),
    height: RFValue(80),
    marginBottom: RFValue(12),
  },
  appName: {
    fontSize: RFValue(22),
    fontFamily: 'Neue-ExtraBold',
    color: colors.textPrimary,
  },
  version: {
    fontSize: RFValue(13),
    color: colors.textSecondary,
    marginTop: RFValue(4),
    fontFamily: 'Neue-Regular',
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: RFValue(12),
    padding: RFValue(16),
    marginBottom: RFValue(16),
  },
  sectionTitle: {
    fontSize: RFValue(16),
    fontFamily: 'Neue-Bold',
    color: colors.textPrimary,
    marginBottom: RFValue(10),
  },
  description: {
    fontSize: RFValue(14),
    color: colors.textSecondary,
    fontFamily: 'Neue-Regular',
    lineHeight: RFValue(22),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFValue(8),
  },
  dot: {
    width: RFValue(7),
    height: RFValue(7),
    borderRadius: RFValue(4),
    backgroundColor: colors.primary,
    marginRight: RFValue(10),
  },
  featureText: {
    fontSize: RFValue(14),
    color: colors.textSecondary,
    fontFamily: 'Neue-Regular',
  },
  copyright: {
    textAlign: 'center',
    fontSize: RFValue(12),
    color: colors.textSecondary,
    fontFamily: 'Neue-Regular',
    marginTop: RFValue(10),
  },
});

export default AboutScreen;

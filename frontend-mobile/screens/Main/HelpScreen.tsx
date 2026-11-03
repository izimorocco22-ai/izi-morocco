import React from 'react';
import { Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import BackHeader from '../../components/BackHeader';
import commonStyles from '../../styles/commonStyles';
import { RFValue } from '../../utils/responsive';
import colors from '../../styles/colors';
import { links, openLink } from '../../utils/links';

const CONTACTS = [
  {
    label: 'Email',
    value: links.supportEmail,
    url: `mailto:${links.supportEmail}`,
  },
  {
    label: 'Phone',
    value: '+212 6 63 56 18 58',
    url: `tel:${links.phone}`,
  },
  {
    label: 'Website',
    value: 'izimorocco.com/fr/contact',
    url: links.contactPage,
  },
];

const HelpScreen = () => {
  return (
    <ScreenWrapper backgroundColor="#ffffff">
      <BackHeader title="Help Center" />
      <ScrollView
        style={commonStyles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Need help with a game or your account? Contact the IZI Morocco team.
        </Text>

        {CONTACTS.map(item => (
          <TouchableOpacity
            key={item.label}
            style={styles.contactBtn}
            activeOpacity={0.8}
            onPress={() => openLink(item.url, `${item.label}: ${item.value}`)}
          >
            <Text style={styles.contactLabel}>{item.label}</Text>
            <Text style={styles.contactValue}>{item.value}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: RFValue(20),
    paddingBottom: RFValue(60),
    paddingHorizontal: RFValue(20),
  },
  intro: {
    fontSize: RFValue(14),
    fontFamily: 'Neue-Regular',
    color: colors.textSecondary,
    lineHeight: RFValue(22),
    marginBottom: RFValue(20),
  },
  contactBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: RFValue(12),
    padding: RFValue(16),
    marginBottom: RFValue(12),
  },
  contactLabel: {
    fontSize: RFValue(13),
    fontFamily: 'Neue-Regular',
    color: colors.textSecondary,
  },
  contactValue: {
    fontSize: RFValue(16),
    fontFamily: 'Neue-Bold',
    color: colors.textPrimary,
    marginTop: RFValue(4),
  },
});

export default HelpScreen;

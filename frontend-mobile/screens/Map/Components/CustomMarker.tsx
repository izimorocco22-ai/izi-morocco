import React from 'react';
import { View, Image } from 'react-native';
import commonStyles from '../../../styles/commonStyles';
import { RFValue } from '../../../utils/responsive';
import { getCleanImageUrl } from '../../../utils/imageUtils';

const CustomMarker = ({ icon }) => {
  try {
    const uri = typeof icon === 'string' ? getCleanImageUrl(icon) : null;

    if (!uri) {
      return (
        <View
          style={[
            commonStyles.alignCenter,
            commonStyles.justifyCenter,
            {
              width: RFValue(60),
              height: RFValue(60),
              borderRadius: 20,
              backgroundColor: '#ddd',
            },
          ]}
        />
      );
    }

    return (
      <View style={[commonStyles.alignCenter, commonStyles.justifyCenter]}>
        <Image
          source={{ uri }}
          style={{ width: RFValue(60), height: RFValue(60), borderRadius: 20 }}
          resizeMode="contain"
          onError={(error) => {
            console.error('CustomMarker image load error:', error);
          }}
        />
      </View>
    );
  } catch (error) {
    console.error('CustomMarker error:', error);
    return (
      <View
        style={[
          commonStyles.alignCenter,
          commonStyles.justifyCenter,
          {
            width: RFValue(60),
            height: RFValue(60),
            borderRadius: 20,
            backgroundColor: '#ff6b6b',
          },
        ]}
      />
    );
  }
};

export default CustomMarker;

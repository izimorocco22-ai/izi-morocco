import React from 'react';
import { View, Image } from 'react-native';
import commonStyles from '../../../styles/commonStyles';
import { RFValue } from '../../../utils/responsive';
import { getCleanImageUrl } from '../../../utils/imageUtils';

const CustomMarker = ({ icon, size = 60 }) => {
  try {
    const uri = typeof icon === 'string' ? getCleanImageUrl(icon) : null;

    if (!uri) {
      return (
        <View
          style={[
            commonStyles.alignCenter,
            commonStyles.justifyCenter,
            {
              width: RFValue(size),
              height: RFValue(size),
              borderRadius: size / 3,
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
          style={{ width: RFValue(size), height: RFValue(size), borderRadius: size / 3 }}
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
            width: RFValue(size),
            height: RFValue(size),
            borderRadius: size / 3,
            backgroundColor: '#ff6b6b',
          },
        ]}
      />
    );
  }
};

export default CustomMarker;

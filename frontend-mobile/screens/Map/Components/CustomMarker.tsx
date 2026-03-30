import React from 'react';
import { View, Image } from 'react-native';
import commonStyles from '../../../styles/commonStyles';
import { RFValue } from '../../../utils/responsive';
import { getCleanImageUrl } from '../../../utils/imageUtils';

const CustomMarker = ({ icon, size = 60, useRawSize = false }) => {
  try {
    const uri = typeof icon === 'string' ? getCleanImageUrl(icon) : null;
    const resolvedSize = useRawSize ? size : RFValue(size);

    if (!uri) {
      return (
        <View
          style={[
            commonStyles.alignCenter,
            commonStyles.justifyCenter,
            {
              width: resolvedSize,
              height: resolvedSize,
              borderRadius: resolvedSize / 3,
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
          style={{ width: resolvedSize, height: resolvedSize, borderRadius: resolvedSize / 3 }}
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
            width: useRawSize ? size : RFValue(size),
            height: useRawSize ? size : RFValue(size),
            borderRadius: size / 3,
            backgroundColor: '#ff6b6b',
          },
        ]}
      />
    );
  }
};

export default CustomMarker;

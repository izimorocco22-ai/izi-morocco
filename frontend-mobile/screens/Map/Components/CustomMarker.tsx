import React from 'react';
import { View, Image } from 'react-native';
import commonStyles from '../../../styles/commonStyles';
import { RFValue } from '../../../utils/responsive';
import { getCleanImageUrl } from '../../../utils/imageUtils';

const CustomMarker = ({ icon }) => {
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
      />
    </View>
  );
};

export default CustomMarker;

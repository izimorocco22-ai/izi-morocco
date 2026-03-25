import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { RFValue } from '../../../utils/responsive';
import colors from '../../../styles/colors';

const ListShowButton = ({ onPress, count }: { onPress: any; count: number }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        position: 'absolute',
        bottom: 15,
        right: 15,
        backgroundColor: colors.primary,
        padding: RFValue(8),
        borderRadius: RFValue(8),
        elevation: 10,
      }}
    >
      {/* Icon */}
      <Image
        style={{
          height: RFValue(28),
          width: RFValue(28),
          // tintColor: '#fff',
        }}
        source={require('../../../assets/images/map/list.png')}
      />

      {/* Counter Badge - always visible */}
      <View
        style={{
          position: 'absolute',
          top: -5,
          right: -5,
          backgroundColor: count > 0 ? 'red' : '#888',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 20,
          minWidth: 20,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: RFValue(10), fontWeight: '700' }}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default ListShowButton;

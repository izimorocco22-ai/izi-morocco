import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import commonStyles from '../../../styles/commonStyles';
import colors from '../../../styles/colors';
import { RFValue } from '../../../utils/responsive';
import { handleListQuestionPress } from '../utils/mapHandlers';

const ListModal = ({ state, dispatch, list, onClose }) => {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
        alignItems: 'center',
        zIndex: 9,
      }}
    >
      {/* Modal Box */}
      <View
        style={{
          backgroundColor: colors.modalBg,
          width: '100%',
          height: '50%',
          padding: RFValue(20),
          borderTopLeftRadius: RFValue(20),
          borderTopRightRadius: RFValue(20),
        }}
      >
        {/* Close Button */}
        <TouchableOpacity
          onPress={onClose}
          style={{ alignSelf: 'flex-end', padding: 8 }}
        >
          <Text
            style={[commonStyles.h3Text, { fontSize: 18, fontWeight: 'bold' }]}
          >
            ✕
          </Text>
        </TouchableOpacity>

        {/* List Title */}
        <Text style={[commonStyles.h2Text, { marginBottom: 10 }]}>
          Task List
        </Text>

        {/* List Content */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {list.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: RFValue(40) }}>
              <Text
                style={[commonStyles.h3Text, { fontSize: 16, opacity: 0.6 }]}
              >
                No tasks available
              </Text>
            </View>
          ) : (
            list.map((item, index) => {
              const icon = item?.question?.icon;
              const uri = (icon && icon.startsWith('http')) 
                          ? icon 
                          : `https://res.cloudinary.com/dxoipnmx0/image/upload/v1759483737/${icon}`;
              return (
              <>
                <TouchableOpacity
                  onPress={() => {
                    handleListQuestionPress(state,item, dispatch);
                  }}
                  key={index}
                  style={[
                    commonStyles.row,
                    {
                      padding: 10,
                      backgroundColor: colors.white,
                      borderWidth: 1,
                      borderBottomWidth: 3,
                      borderRightWidth: 3,
                      borderColor: `${item?.question?.radiusColor}`,
                      marginBottom: 10,
                      borderRadius: 8,
                      gap: RFValue(12),
                    },
                  ]}
                >
                  <View>
                    <Image
                      source={{
                        uri: uri,
                      }}
                      style={{
                        width: RFValue(60),
                        height: RFValue(60),
                        borderRadius: RFValue(8),
                        resizeMode: 'cover',
                      }}
                      resizeMode="contain"
                      onError={() =>
                        console.warn('Image failed to load:', uri)
                      }
                    />
                  </View>
                  <View style={[{ flex: 1 }]}>
                    <Text
                      style={[commonStyles.h3Text, { fontSize: 16, flex: 1 }]}
                    >
                      {index + 1}. {item?.question?.questionName}
                    </Text>

                    <Text
                      style={[
                        commonStyles.h3Text,
                        { fontSize: 14, opacity: 0.6 },
                      ]}
                    >
                      Points: {item?.question?.points}
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )})
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default ListModal;

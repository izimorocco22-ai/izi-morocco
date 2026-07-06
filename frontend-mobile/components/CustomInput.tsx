import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Image } from 'react-native';
import commonStyles from '../styles/commonStyles';
import colors from '../styles/colors';
import { RFValue } from '../utils/responsive';

const CustomInput = ({
  value,
  onChangeText,
  placeholder = '',
  secureTextEntry = false,
  style = {},
  keyboardType = 'default',
  label = '',
  error,
  autoCapitalize = 'sentences',
  autoCorrect = true,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordField = secureTextEntry;

  return (
    <View
      style={[
        commonStyles.col,
        commonStyles.justifyCenter,
        { marginVertical: 2, width: '100%' },
      ]}
    >
      {label ? (
        <Text
          style={[
            commonStyles.h3Text,
            { marginBottom: 10, color: colors.black },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View style={{ position: 'relative', width: '100%' }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={isPasswordField && !showPassword}
          placeholderTextColor={colors.textSecondary}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          style={[
            commonStyles.input,
            style,
            isPasswordField ? { paddingRight: RFValue(40) } : null,
          ]}
        />
        {isPasswordField && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: RFValue(10),
              top: '30%',
            }}
          >
            <Image
              source={
                showPassword
                  ? require('../assets/images/icon/view.png') // 👁️ open eye icon
                  : require('../assets/images/icon/hide.png') // 🙈 closed eye icon
              }
              style={{ width: RFValue(20), height: RFValue(20), tintColor: colors.black }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={{ color: 'red', marginTop: RFValue(2) }}>{error}</Text>
      )}
    </View>
  );
};

export default CustomInput;

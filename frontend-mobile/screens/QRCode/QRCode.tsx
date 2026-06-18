import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  Vibration,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import commonStyles from '../../styles/commonStyles';
import { RFValue } from '../../utils/responsive';
import ScreenWrapper from '../../components/ScreenWrapper';

interface QRData {
  id: number;
  playerId: string;
  gameid: string;
  activecode: string;
}

const QRCode = ({ navigation }) => {
  const [scannedData, setScannedData] = useState<QRData | null>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const shakeAnim = useState(new Animated.Value(0))[0];
  const [errorFlash, setErrorFlash] = useState(false);
  console.log({errorFlash})

  const triggerErrorAnimation = () => {
    setErrorFlash(true);

    // Vibrate device
    Vibration.vibrate(200);

    // Shake animation sequence
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => setErrorFlash(false), 200);
    });
  };

  const handleScannedText = (text: string) => {
    try {
      let jsonData: any = JSON.parse(text);

      // Case: playerId contains nested JSON
      if (
        typeof jsonData.playerId === 'string' &&
        jsonData.playerId.trim().startsWith('{')
      ) {
        const nested = JSON.parse(jsonData.playerId);
        jsonData = { ...jsonData, ...nested };
      }

      // Normalize values
      const finalData: QRData = {
        id: jsonData.id ?? null,
        playerId: jsonData.playerId ?? null,
        gameid: jsonData.gameId ?? null,
        activecode: jsonData.activationCode ?? null,
      };

      const missingFields = [];

      if (!finalData.id) missingFields.push('id');
      if (!finalData.playerId) missingFields.push('playerId');
      if (!finalData.gameid) missingFields.push('gameid');
      if (!finalData.activecode) missingFields.push('activationCode');

      if (missingFields.length > 0) {
        triggerErrorAnimation();
        return;
      }

      // Save the parsed data
      setScannedData(finalData);

      // Navigate only when perfect
      navigation.navigate('GameLogin', {
        playerId: finalData.playerId,
        qrGameID: finalData.gameid,
        activationCode: finalData.activecode,
      });
    } catch (error) {
      Alert.alert('Invalid QR Code!', 'Scanned data is not valid JSON');
    }
  };

  const onSuccess = (e: any) => {
    handleScannedText(e.data);
  };

  // 📌 Decode QR from gallery image using API
  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 1 });

    if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);

      try {
        const formData = new FormData();
        formData.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' });

        const response = await fetch(
          'https://api.qrserver.com/v1/read-qr-code/',
          {
            method: 'POST',
            body: formData,
          },
        );

        const data = await response.json();
        const qrResult = data[0]?.symbol[0]?.data;

        if (qrResult) {
          handleScannedText(qrResult);
        } else {
          Alert.alert('No QR code found in this image');
        }
      } catch (error) {
        Alert.alert('Error decoding QR');
      }
    }
  };

  return (
    <ScreenWrapper backgroundColor="#ffffff">
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateX: shakeAnim }],
          backgroundColor: errorFlash ? 'rgba(255,0,0,0.2)' : 'transparent',
        }}
      >
        <View style={[commonStyles.container, styles.wrapper]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[commonStyles.h1Text, styles.headerTitle]}>
              Scan QR Code
            </Text>
            <Text style={[commonStyles.pText, styles.headerSubtitle]}>
              Position the QR code within the frame to scan
            </Text>
          </View>

          {/* Scanner */}
          <View style={styles.scannerWrapper}>
            <QRCodeScanner
              onRead={onSuccess}
              flashMode={RNCamera.Constants.FlashMode.off}
              cameraStyle={styles.camera}
              showMarker={true}
              customMarker={
                <View style={styles.markerContainer}>
                  <View style={styles.scanOverlay}>
                    <View style={styles.cornerTopLeft} />
                    <View style={styles.cornerTopRight} />
                    <View style={styles.cornerBottomLeft} />
                    <View style={styles.cornerBottomRight} />
                  </View>
                  <View style={styles.scanLineContainer}>
                    <View style={styles.scanLine} />
                  </View>
                </View>
              }
            />
          </View>

          {/* Gallery Upload Button */}
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Image
              style={styles.galleryIcon}
              source={require('../../assets/images/icon/gallery.png')}
            />
            <Text style={[commonStyles.pText, styles.uploadText]}>
              Upload from Gallery
            </Text>
          </TouchableOpacity>

          {/* Image Preview */}
          {selectedImage && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.preview} />
            </View>
          )}
        </View>
      </Animated.View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor:'transparent',
  },
  header: {
    paddingHorizontal: RFValue(20),
    paddingTop: RFValue(50),
    paddingBottom: RFValue(20),
    zIndex: 10,
  },
  headerTitle: {
    textAlign: 'center',
    marginBottom: RFValue(8),
  },
  headerSubtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  scannerWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  markerContainer: {
    width: RFValue(280),
    height: RFValue(280),
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanOverlay: {
    width: '100%',
    height: '100%',
    borderRadius: RFValue(24),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: RFValue(40),
    height: RFValue(40),
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: '#ffffff',
    borderTopLeftRadius: RFValue(24),
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: RFValue(40),
    height: RFValue(40),
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderColor: '#ffffff',
    borderTopRightRadius: RFValue(24),
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: RFValue(40),
    height: RFValue(40),
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#ffffff',
    borderBottomLeftRadius: RFValue(24),
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: RFValue(40),
    height: RFValue(40),
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#ffffff',
    borderBottomRightRadius: RFValue(24),
  },
  scanLineContainer: {
    position: 'absolute',
    width: '100%',
    height: 2,
    overflow: 'hidden',
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadButton: {
    position: 'absolute',
    bottom: RFValue(40),
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingVertical: RFValue(14),
    paddingHorizontal: RFValue(24),
    borderRadius: RFValue(30),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFValue(10),
  },
  galleryIcon: {
    height: RFValue(24),
    width: RFValue(24),
  },
  uploadText: {
    fontSize: RFValue(14),
    fontWeight: '600',
    marginTop: 0,
  },
  previewContainer: {
    position: 'absolute',
    bottom: RFValue(120),
    right: RFValue(20),
    borderRadius: RFValue(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  preview: {
    width: RFValue(80),
    height: RFValue(80),
  },
});

export default QRCode;

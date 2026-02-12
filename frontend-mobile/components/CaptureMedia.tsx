import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import Video from 'react-native-video';
import colors from '../styles/colors';
import { RFValue } from '../utils/responsive';
import commonStyles from '../styles/commonStyles';
import { Camera, Video as VideoIcon, Trash2, Image as ImageIcon } from 'lucide-react-native';

interface CaptureMediaProps {
  type: 'photo' | 'video' | 'augmented_photo';
  value: string | null;
  onChange: (uri: string | null) => void;
}

const CaptureMedia: React.FC<CaptureMediaProps> = ({ type, value, onChange }) => {
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const cameraPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission to capture media.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (cameraPermission !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Camera permission is required.');
          return false;
        }

        if (type === 'video') {
          const recordAudioPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission',
              message: 'App needs microphone permission to record video.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

          if (recordAudioPermission !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission Denied', 'Microphone permission is required for video.');
            return false;
          }
        }
        
        return true;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleCapture = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const options: any = {
      mediaType: type === 'video' ? 'video' : 'photo',
      saveToPhotos: false, // Changed to false to avoid permission issues and extra copies
      quality: 0.7,
      videoQuality: 'medium',
      durationLimit: 30, // 30 seconds limit for video
      includeBase64: false,
    };

    setLoading(true);
    launchCamera(options, (response) => {
      setLoading(false);
      if (response.didCancel) {
        console.log('User cancelled camera picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', response.errorMessage || 'Failed to capture media');
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const uri = asset.uri;
        console.log('[CaptureMedia] Captured asset:', {
          uri: asset.uri,
          type: asset.type,
          fileName: asset.fileName
        });
        if (uri) {
          onChange(uri);
        }
      }
    });
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <View style={styles.container}>
      {value ? (
        <View style={styles.previewContainer}>
          {type === 'video' ? (
            <Video
              source={{ uri: value }}
              style={styles.previewMedia}
              resizeMode="cover"
              controls={true}
              paused={true}
            />
          ) : (
            <Image source={{ uri: value }} style={styles.previewMedia} />
          )}
          <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
            <Trash2 size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.captureButton} 
          onPress={handleCapture}
          disabled={loading}
        >
          {type === 'video' ? (
            <VideoIcon size={32} color={colors.primary} />
          ) : (
            <Camera size={32} color={colors.primary} />
          )}
          <Text style={styles.captureText}>
            {loading ? 'Opening Camera...' : `Capture ${type === 'video' ? 'Video' : 'Photo'}`}
          </Text>
          {type === 'augmented_photo' && (
            <Text style={styles.subText}>(Augmented Reality Mode)</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CaptureMedia;

const styles = StyleSheet.create({
  container: {
    marginVertical: RFValue(10),
    width: '100%',
  },
  captureButton: {
    height: RFValue(150),
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  captureText: {
    marginTop: RFValue(10),
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  subText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  previewContainer: {
    height: RFValue(200),
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  previewMedia: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 20,
  },
});

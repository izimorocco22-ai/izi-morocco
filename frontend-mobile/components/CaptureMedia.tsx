import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
  PermissionsAndroid,
  Modal,
  Dimensions,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import { launchCamera } from 'react-native-image-picker';
import Video from 'react-native-video';
import colors from '../styles/colors';
import { RFValue } from '../utils/responsive';
import { Camera, Video as VideoIcon, Trash2, X, Download } from 'lucide-react-native';
import RNFS from 'react-native-fs';
import ViewShot from 'react-native-view-shot';

const { width, height } = Dimensions.get('window');

interface CaptureMediaProps {
  type: 'photo' | 'video' | 'augmented_photo';
  value: string | null;
  onChange: (uri: string | null) => void;
  overlayImageUrl?: string | null;
}

const CaptureMedia: React.FC<CaptureMediaProps> = ({
  type,
  value,
  onChange,
  overlayImageUrl,
}) => {
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef<RNCamera>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const previewShotRef = useRef<ViewShot>(null);
  const [cameraLayout, setCameraLayout] = useState({ width, height });
  const [overlayReady, setOverlayReady] = useState(false);
  const [cameraType, setCameraType] = useState(
    RNCamera.Constants.Type.back,
  );

  useEffect(() => {
    let isMounted = true;
    if (type === 'augmented_photo' && overlayImageUrl) {
      Image.prefetch(overlayImageUrl)
        .then(() => {
          if (isMounted) setOverlayReady(true);
        })
        .catch(() => {
          if (isMounted) setOverlayReady(false);
        });
    } else {
      setOverlayReady(false);
    }
    return () => {
      isMounted = false;
    };
  }, [type, overlayImageUrl]);

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

    if (type === 'augmented_photo' && overlayImageUrl) {
      if (!overlayReady) {
        setLoading(true);
        try {
          await Image.prefetch(overlayImageUrl);
          setOverlayReady(true);
        } catch (e) {
          Alert.alert('Error', 'Failed to load overlay image');
          setLoading(false);
          return;
        }
        setLoading(false);
      }
      setCameraType(RNCamera.Constants.Type.back);
      setShowCamera(true);
    } else if (type === 'photo') {
      // For regular photos, directly open camera without picker
      const options: any = {
        mediaType: 'photo',
        saveToPhotos: false,
        quality: 0.8,
        includeBase64: false,
        cameraType: 'back',
      };

      setLoading(true);
      launchCamera(options, async (response) => {
        setLoading(false);
        if (response.didCancel) {
          console.log('User cancelled camera picker');
        } else if (response.errorCode) {
          console.log('ImagePicker Error: ', response.errorMessage);
          Alert.alert('Error', response.errorMessage || 'Failed to capture media');
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          const uri = asset.uri;
          
          if (uri) {
            onChange(uri);
          }
        }
      });
    } else {
      // For video
      const options: any = {
        mediaType: 'video',
        saveToPhotos: false,
        quality: 0.8,
        videoQuality: 'medium',
        durationLimit: 30,
        includeBase64: false,
        cameraType: 'back',
      };

      setLoading(true);
      launchCamera(options, async (response) => {
        setLoading(false);
        if (response.didCancel) {
          console.log('User cancelled camera picker');
        } else if (response.errorCode) {
          console.log('ImagePicker Error: ', response.errorMessage);
          Alert.alert('Error', response.errorMessage || 'Failed to capture media');
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          const uri = asset.uri;
          
          if (uri) {
            onChange(uri);
          }
        }
      });
    }
  };

  const takePicture = async () => {
    if (!viewShotRef.current) return;
    
    try {
      setLoading(true);
      const uri = await viewShotRef.current.capture();
      const outputUri = uri.startsWith('file://') ? uri : `file://${uri}`;

      onChange(outputUri);
      setShowCamera(false);
      setLoading(false);
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
      setLoading(false);
    }
  };

  const downloadImage = async () => {
    if (!value) return;

    try {
      if (Platform.OS === 'android') {
        const permission =
          Platform.Version >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

        const result = await PermissionsAndroid.request(permission);
        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Storage permission is required to download image.');
          return;
        }
      }

      let sourceUri: string | null = null;

      if (type === 'augmented_photo' && overlayImageUrl && previewShotRef.current) {
        const captured = await previewShotRef.current.capture();
        sourceUri = captured.startsWith('file://') ? captured : `file://${captured}`;
      } else {
        const uri = value;
        if (!uri.startsWith('file://')) {
          Alert.alert('Error', 'Cannot download this image.');
          return;
        }
        sourceUri = uri;
      }

      if (!sourceUri) {
        Alert.alert('Error', 'Failed to prepare image for download.');
        return;
      }

      const sourcePath = sourceUri.replace('file://', '');
      const dir =
        Platform.OS === 'android'
          ? RNFS.DownloadDirectoryPath || RNFS.DocumentDirectoryPath
          : RNFS.DocumentDirectoryPath;
      const fileName = `chronophage_${Date.now()}.jpg`;
      const destPath = `${dir}/${fileName}`;

      await RNFS.copyFile(sourcePath, destPath);

      Alert.alert(
        'Downloaded',
        Platform.OS === 'android'
          ? 'Image saved to Downloads folder.'
          : 'Image saved to app documents folder.',
      );
    } catch (error) {
      console.error('Download image error:', error);
      Alert.alert('Error', 'Failed to download image.');
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  const closeCamera = () => {
    setShowCamera(false);
  };

  const toggleCameraType = () => {
    setCameraType(prev =>
      prev === RNCamera.Constants.Type.back
        ? RNCamera.Constants.Type.front
        : RNCamera.Constants.Type.back,
    );
  };

  return (
    <View style={styles.container}>
      <Modal
        visible={showCamera && type === 'augmented_photo' && !!overlayImageUrl}
        animationType="slide"
        onRequestClose={closeCamera}
      >
        <View style={styles.fullScreen}>
          <ViewShot
            ref={viewShotRef}
            style={styles.fullScreen}
            options={{ format: 'jpg', quality: 0.9 }}
            onLayout={(event) => {
              const { width: layoutWidth, height: layoutHeight } = event.nativeEvent.layout;
              setCameraLayout({ width: layoutWidth, height: layoutHeight });
            }}
          >
            <RNCamera
              ref={cameraRef}
              style={styles.fullScreen}
              type={cameraType}
              captureAudio={false}
              androidCameraPermissionOptions={{
                title: 'Permission to use camera',
                message: 'We need your permission to use your camera',
                buttonPositive: 'Ok',
                buttonNegative: 'Cancel',
              }}
            />
            <Image
              source={{ uri: overlayImageUrl }}
              style={[
                styles.overlayCharacter,
                { width: cameraLayout.width, height: cameraLayout.height },
              ]}
              resizeMode="cover"
              pointerEvents="none"
              onLoad={() => setOverlayReady(true)}
            />
          </ViewShot>
          
          <TouchableOpacity style={styles.closeButton} onPress={closeCamera}>
            <X size={30} color="#fff" />
          </TouchableOpacity>

          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={toggleCameraType}
              disabled={loading}
            >
              <Camera size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.captureCircle} 
              onPress={takePicture}
              disabled={loading}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
            <View style={styles.placeholder} />
          </View>
        </View>
      </Modal>

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
            <ViewShot
              ref={previewShotRef}
              style={styles.previewMedia}
              options={{ format: 'jpg', quality: 0.9 }}
            >
              {overlayImageUrl ? (
                <View style={styles.previewMedia}>
                  <Image source={{ uri: value }} style={styles.previewMedia} />
                  <Image
                    source={{ uri: overlayImageUrl }}
                    style={styles.previewOverlay}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <Image source={{ uri: value }} style={styles.previewMedia} />
              )}
            </ViewShot>
          )}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.downloadButton} onPress={downloadImage}>
              <Download size={18} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
              <Trash2 size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
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
            {loading ? 'Processing...' : `Capture ${type === 'video' ? 'Video' : 'Photo'}`}
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
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 1,
  },
  removeButton: {
    marginLeft: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 20,
  },
  actionButtons: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 20,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlayCharacter: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 5,
    opacity: 0.9,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 25,
    zIndex: 10,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  captureCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  placeholder: {
    width: 60,
  },
  switchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

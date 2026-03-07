import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import CustomMarker from './CustomMarker';

const { width, height } = Dimensions.get('window');

interface PlaygroundViewProps {
  playgroundImage?: string;
  playgrounds?: Array<{ name: string; image: string }>;
  currentView: string;
  targets: any[];
  completedTargets: string[];
}

const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  playgroundImage,
  playgrounds,
  currentView,
  targets = [],
  completedTargets = [],
}) => {
  console.log('PlaygroundView:', { playgroundImage, playgrounds, currentView });
  
  const imageToShow = playgrounds && playgrounds.length > 0
    ? playgrounds.find(p => p.name.toLowerCase() === currentView)?.image
    : playgroundImage;

  console.log('Image to show:', imageToShow);

  if (!imageToShow) {
    return <View style={styles.container} />;
  }

  const playgroundTargets = targets.filter(
    t => t?.isShownOnPlayground && !completedTargets.includes(t?.question?._id)
  );

  console.log('Playground targets:', playgroundTargets.length);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: imageToShow }}
        style={styles.playgroundImage}
        resizeMode="contain"
      />
      {playgroundTargets.map((target, index) => {
        if (!target?.question?._id) return null;
        
        const xPos = (target.playgroundPosition?.x || 50) * width / 100;
        const yPos = (target.playgroundPosition?.y || 50) * height / 100;
        
        return (
          <View
            key={`playground_marker_${target.question._id}_${index}`}
            style={[
              styles.markerContainer,
              {
                left: xPos - 20,
                top: yPos - 40,
              },
            ]}
          >
            <CustomMarker icon={target?.question?.icon} />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  playgroundImage: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
});

export default PlaygroundView;

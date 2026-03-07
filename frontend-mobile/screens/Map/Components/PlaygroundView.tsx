import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import CustomMarker from './CustomMarker';

const { width, height } = Dimensions.get('window');

interface PlaygroundViewProps {
  playgroundImage: string;
  targets: any[];
  completedTargets: string[];
}

const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  playgroundImage,
  targets,
  completedTargets,
}) => {
  const playgroundTargets = targets.filter(
    t => t.isShownOnPlayground && !completedTargets.includes(t.question?._id)
  );

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: playgroundImage }}
        style={styles.playgroundImage}
        resizeMode="contain"
      />
      {playgroundTargets.map((target, index) => {
        const xPos = (target.playgroundPosition?.x || 50) * width / 100;
        const yPos = (target.playgroundPosition?.y || 50) * height / 100;
        
        return (
          <View
            key={`playground_marker_${target.question?._id}_${index}`}
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

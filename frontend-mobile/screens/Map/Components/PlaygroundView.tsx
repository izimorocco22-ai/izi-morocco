import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, Text } from 'react-native';
import CustomMarker from './CustomMarker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PlaygroundViewProps {
  playgroundImage?: string;
  playgrounds?: Array<{ name: string; image: string }>;
  playgroundName?: string;
  currentView: string;
  targets: any[];
  completedTargets: string[];
}

const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  playgroundImage,
  playgrounds,
  playgroundName,
  currentView,
  targets = [],
  completedTargets = [],
}) => {
  const [containerDimensions, setContainerDimensions] = useState({ 
    width: Dimensions.get('window').width, 
    height: Dimensions.get('window').height 
  });
  const [imageDimensions, setImageDimensions] = useState({ 
    width: Dimensions.get('window').width, 
    height: Dimensions.get('window').height 
  });
  
  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerDimensions({ width, height });
    console.log('Playground container layout:', { width, height });
  };

  try {
  // Get the current playground index based on the view name
  const getCurrentPlaygroundIndex = () => {
    if (currentView === 'map') return null;
    
    if (playgrounds && playgrounds.length > 0) {
      const playgroundIndex = playgrounds.findIndex(p => p.name.toLowerCase() === currentView.toLowerCase());
      if (playgroundIndex !== -1) {
        // Return 1-based index
        return playgroundIndex + 1;
      }
    }
    
    // If using legacy single playground, check if current view matches playground name
    if (playgroundName && currentView.toLowerCase() === playgroundName.toLowerCase()) {
      return 1;
    }
    
    // Default fallback
    return 1;
  };

  const currentPlaygroundIndex = getCurrentPlaygroundIndex();
  
  const playgroundTargets = targets.filter(t => {
    try {
      // Only show tasks that are marked to be shown on playground
      if (!t?.isShownOnPlayground) return false;
      
      // Don't show completed tasks
      if (completedTargets.includes(t?.question?._id)) return false;
      
      // Filter by playground index - only show tasks assigned to current playground
      if (currentPlaygroundIndex && t?.playgroundIndex) {
        return t.playgroundIndex === currentPlaygroundIndex;
      }
      
      // If no playground index specified, show on playground 1 by default
      return currentPlaygroundIndex === 1;
    } catch (error) {
      console.error('Error filtering playground target:', error, t);
      return false;
    }
  });

  const imageToShow = playgrounds && playgrounds.length > 0
    ? playgrounds.find(p => p.name.toLowerCase() === currentView)?.image
    : playgroundImage;

  if (!imageToShow) {
    return <View style={styles.container} onLayout={handleLayout} />;
  }

  // Handle image load to get actual dimensions
  const handleImageLoad = (event: any) => {
    const { width: imgWidth, height: imgHeight } = event.nativeEvent.source;
    setImageDimensions({ width: imgWidth, height: imgHeight });
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Image
        source={{ uri: imageToShow }}
        style={styles.playgroundImage}
        resizeMode="contain"
        onLoad={handleImageLoad}
      />
      {playgroundTargets.map((target, index) => {
        try {
          if (!target?.question?._id) return null;
          
          // Get the playground position from the target
          const playgroundPos = target.playgroundPosition;
          
          // Calculate position - use playgroundPosition if available, otherwise default
          let xPos, yPos;
          
          // Default icon size to match admin (40)
          const iconSize = target?.question?.iconSize || 40;

          if (playgroundPos && typeof playgroundPos.x === 'number' && typeof playgroundPos.y === 'number') {
            // Convert percentage to pixels based on the actual container size
            const { width: containerWidth, height: containerHeight } = containerDimensions;
            
            // Calculate the actual displayed image size (with contain mode)
            const imageAspectRatio = imageDimensions.width / imageDimensions.height;
            const containerAspectRatio = containerWidth / containerHeight;
            
            let displayWidth, displayHeight, offsetX, offsetY;
            
            if (imageAspectRatio > containerAspectRatio) {
              // Image is wider, fit to width
              displayWidth = containerWidth;
              displayHeight = containerWidth / imageAspectRatio;
              offsetX = 0;
              offsetY = (containerHeight - displayHeight) / 2;
            } else {
              // Image is taller, fit to height
              displayHeight = containerHeight;
              displayWidth = containerHeight * imageAspectRatio;
              offsetX = (containerWidth - displayWidth) / 2;
              offsetY = 0;
            }
            
            // Convert percentage to pixels based on actual display size
            // Admin stores the top-left percentage of the icon, so we use it directly
            xPos = (playgroundPos.x / 100) * displayWidth + offsetX;
            yPos = (playgroundPos.y / 100) * displayHeight + offsetY;
            
            console.log(`Playground positioning debug:`, {
              questionId: target.question._id,
              playgroundPos,
              containerDimensions,
              imageDimensions,
              displaySize: { displayWidth, displayHeight },
              offset: { offsetX, offsetY },
              finalPosition: { xPos, yPos },
              iconSize
            });
          } else {
            // Fallback to center if no position data
            xPos = containerDimensions.width * 0.5 - (iconSize / 2);
            yPos = containerDimensions.height * 0.5 - (iconSize / 2);
            console.log(`No playground position data for question ${target.question._id}, using center fallback`);
          }
          
          return (
            <View
              key={`playground_marker_${target.question._id}_${index}`}
              style={[
                styles.markerContainer,
                {
                  left: xPos, 
                  top: yPos,
                  width: iconSize,
                  height: iconSize,
                },
              ]}
            >
              <CustomMarker icon={target?.question?.icon} size={iconSize} />
            </View>
          );
        } catch (error) {
          console.error('Error rendering playground marker:', error, target);
          return null;
        }
      })}
    </View>
  );
} catch (error) {
  console.error('PlaygroundView crashed:', error);
  return (
    <View style={styles.container}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error loading playground</Text>
      </View>
    </View>
  );
}
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
  },
});

export default PlaygroundView;

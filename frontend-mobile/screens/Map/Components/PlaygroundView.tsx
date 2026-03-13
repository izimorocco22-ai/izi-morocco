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
  const [imageDimensions, setImageDimensions] = useState({ width: screenWidth, height: screenHeight });
  
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
      console.log('Filtering target:', {
        questionId: t?.question?._id,
        isShownOnPlayground: t?.isShownOnPlayground,
        playgroundIndex: t?.playgroundIndex,
        currentPlaygroundIndex,
        isCompleted: completedTargets.includes(t?.question?._id)
      });
      
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

  console.log('PlaygroundView:', { 
    playgroundImage, 
    playgrounds, 
    playgroundName,
    currentView,
    currentPlaygroundIndex,
    totalTargets: targets.length,
    filteredTargets: playgroundTargets.length,
    sampleTarget: targets[0] // Show first target to debug data structure
  });
  
  const imageToShow = playgrounds && playgrounds.length > 0
    ? playgrounds.find(p => p.name.toLowerCase() === currentView)?.image
    : playgroundImage;

  console.log('Image to show:', imageToShow);

  if (!imageToShow) {
    return <View style={styles.container} />;
  }

  // Handle image load to get actual dimensions
  const handleImageLoad = (event: any) => {
    const { width: imgWidth, height: imgHeight } = event.nativeEvent.source;
    setImageDimensions({ width: imgWidth, height: imgHeight });
    console.log('Image loaded with dimensions:', { width: imgWidth, height: imgHeight });
  };

  console.log('Playground targets:', playgroundTargets.length);

  return (
    <View style={styles.container}>
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
          
          if (playgroundPos && typeof playgroundPos.x === 'number' && typeof playgroundPos.y === 'number') {
            // Convert percentage to pixels based on the container size
            // The image is displayed with 'contain' mode, so we need to calculate the actual display size
            const containerWidth = screenWidth;
            const containerHeight = screenHeight;
            
            // Calculate the actual displayed image size (with contain mode)
            const imageAspectRatio = imageDimensions.width / imageDimensions.height;
            const containerAspectRatio = containerWidth / containerHeight;
            
            let displayWidth, displayHeight;
            if (imageAspectRatio > containerAspectRatio) {
              // Image is wider, fit to width
              displayWidth = containerWidth;
              displayHeight = containerWidth / imageAspectRatio;
            } else {
              // Image is taller, fit to height
              displayHeight = containerHeight;
              displayWidth = containerHeight * imageAspectRatio;
            }
            
            // Convert percentage to pixels based on actual display size
            xPos = (playgroundPos.x / 100) * displayWidth;
            yPos = (playgroundPos.y / 100) * displayHeight;
            
            // Center the image in the container
            const offsetX = (containerWidth - displayWidth) / 2;
            const offsetY = (containerHeight - displayHeight) / 2;
            
            xPos += offsetX;
            yPos += offsetY;
          } else {
            // Fallback to center if no position data
            xPos = screenWidth * 0.5;
            yPos = screenHeight * 0.5;
          }
          
          console.log(`Task ${target.question._id} positioned at playground ${target?.playgroundIndex || 1}:`, {
            playgroundPosition: playgroundPos,
            calculatedX: xPos,
            calculatedY: yPos,
            screenWidth,
            screenHeight,
            imageDimensions,
            playgroundIndex: target?.playgroundIndex
          });
          
          return (
            <View
              key={`playground_marker_${target.question._id}_${index}`}
              style={[
                styles.markerContainer,
                {
                  left: xPos - 30, // Center the 60px marker
                  top: yPos - 30,  // Center the 60px marker
                },
              ]}
            >
              <CustomMarker icon={target?.question?.icon} />
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
    width: 60,
    height: 60,
  },
});

export default PlaygroundView;

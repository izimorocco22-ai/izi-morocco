// components/MediaRenderer.js
import React from "react";
import { View, Image, StyleSheet } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import Video from "react-native-video";
import { RFValue } from "../../../utils/responsive";

const CLOUDINARY_BASE_IMAGE = "https://res.cloudinary.com/dxoipnmx0/image/upload/v1759483737/";
const CLOUDINARY_BASE_VIDEO = "https://res.cloudinary.com/dxoipnmx0/video/upload/v1759483737/";

const MediaRenderer = ({ media }) => {
  if (!media) return null;

  const renderYouTube = url => {
    let videoId = null;

    if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("/embed/")) {
      videoId = url.split("/embed/")[1].split("?")[0];
    }

    if (!videoId) return null;

    return (
      <View style={styles.youtubeContainer} key={url}>
        <YoutubePlayer
          height={230}
          objectSize={'contain'}
          videoId={videoId}
          play={false}
          initialPlayerParams={{
            modestbranding: false,
            controls: true,
            rel: false,
            showinfo: false,
            playsinline: true,
            
          }}
        />
      </View>
    );
  };

  return (
    <View style={styles.mediaWrapper}>

      {/* Render Images */}
      {media?.images?.map((img, index) => {
        const uri = (img && img.startsWith('http')) ? img : CLOUDINARY_BASE_IMAGE + img;
        return (
          <Image
            key={`img-${index}`}
            source={{ uri }}
            style={styles.image}
            resizeMode="contain"
          />
        );
      })}

      {/* Render YouTube Videos */}
      {media?.videoUrls?.map((url, index) => renderYouTube(url))}

      {/* Render Cloudinary Videos */}
      {media?.videos?.map((vid, index) => {
        const uri = (vid && vid.startsWith('http')) ? vid : CLOUDINARY_BASE_VIDEO + vid;
        return (
          <Video
            key={`vid-${index}`}
            source={{ uri }}
            style={styles.video}
            controls={true}
            resizeMode="contain"
          />
        );
      })}

    </View>
  );
};

const styles = StyleSheet.create({
  mediaWrapper: {
    width: "100%",
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: RFValue(8),
    marginBottom: RFValue(10),
  },
  video: {
    width: "100%",
    height: 220,
    borderRadius: RFValue(8),
    marginBottom: RFValue(10),
    backgroundColor: "#000",
  },
  youtubeContainer: {
    width: "100%",
    overflow: "hidden",
    marginBottom: RFValue(10),
  },
});

export default MediaRenderer;

import React from 'react';
import { Text, Image, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Video from 'react-native-video';
import colors from '../styles/colors';
import { RFValue } from '../utils/responsive';
import commonStyles from '../styles/commonStyles';
import YoutubePlayer from 'react-native-youtube-iframe';

const QuillRenderer = ({ questionName }) => {
  {
    console.log({ questionName });
  }
  if (typeof questionName === 'string') {
    return <Text style={{ fontSize: 16 }}>{questionName}</Text>;
  }

  if (questionName?.ops && Array.isArray(questionName.ops)) {
    return (
      <View style={[{ flexDirection: 'column' }]}>
        {questionName.ops.map((op, idx) => {
          // --- IMAGE ---
          if (op.insert?.image) {
            return (
              <View
                key={op.insert.image}
                style={{
                  width: '100%',
                }}
              >
                <Image
                  source={{ uri: op.insert.image }}
                  style={{
                    width: '100%',
                    height: undefined,
                    aspectRatio: 0.65,
                    resizeMode: 'contain',
                    borderRadius: RFValue(8),
                  }}
                />
              </View>
            );
          }

          // --- VIDEO (YouTube, Shorts, MP4, everything) ---
          if (op.insert?.video) {
            let videoUrl = op.insert.video;

            // Extract URL from iframe
            if (videoUrl.includes('<iframe')) {
              const match = videoUrl.match(/src="([^"]+)"/);
              videoUrl = match ? match[1] : null;
            }

            if (!videoUrl) return null;

            // ───── Extract YouTube Video ID ─────
            const getVideoId = url => {
              if (!url) return null;

              // YouTube Shorts
              if (url.includes('/shorts/')) {
                return {
                  id: url.split('/shorts/')[1].split('?')[0],
                  ratio: 9 / 16,
                };
              }

              // watch?v=
              if (url.includes('watch?v=')) {
                return {
                  id: url.split('watch?v=')[1].split('&')[0],
                  ratio: 16 / 9,
                };
              }

              // youtu.be
              if (url.includes('youtu.be/')) {
                return {
                  id: url.split('youtu.be/')[1].split('?')[0],
                  ratio: 16 / 9,
                };
              }

              // embed/
              if (url.includes('/embed/')) {
                return {
                  id: url.split('/embed/')[1].split('?')[0],
                  ratio: 16 / 9,
                };
              }

              return null;
            };

            const yt = getVideoId(videoUrl);

            // ───── Case 1: YouTube video → use YouTubePlayer (NO WebView) ─────
            if (yt?.id) {
              const isShort = yt.ratio === 9 / 16;

              return (
                <View
                  key={idx}
                  style={{
                    width: '100%',
                    aspectRatio:  16/9, // 👈 MAKE SHORT TALLER
                    overflow: 'hidden',
                    marginVertical: RFValue(5),
                  }}
                >
                  <YoutubePlayer
                    height={280} // 👈 SHORTS GET MORE HEIGHT
                    videoId={yt.id}
                    play={false}
                    initialPlayerParams={{
                      modestbranding: true,
                      controls: true,
                      rel: false,
                      playsinline: true,
                    }}
                  />
                </View>
              );
            }

            // ───── Case 2: Direct MP4 files ─────
            const isDirectVideo = videoUrl.match(
              /\.(mp4|mov|m4v|avi|m3u8)(\?.*)?$/i,
            );

            if (isDirectVideo) {
              return (
                <Video
                  key={idx}
                  source={{ uri: videoUrl }}
                  style={{
                    width: '100%',
                    height: 220,
                    marginVertical: 4,
                    borderRadius: 8,
                    backgroundColor: '#000',
                  }}
                  controls={true}
                  resizeMode="contain"
                />
              );
            }

            // ───── Case 3: Fallback → embed webpage in WebView ─────
            return (
              <View
                key={idx}
                style={{
                  width: '100%',
                  height: 230,
                  marginVertical: 4,
                  borderRadius: 8,
                  overflow: 'hidden',
                  backgroundColor: '#000',
                }}
              >
                <WebView
                  source={{ uri: videoUrl }}
                  style={{ flex: 1 }}
                  javaScriptEnabled
                  domStorageEnabled
                />
              </View>
            );
          }

          // --- TEXT ---
          let textStyle = {};
          if (op.attributes?.bold) textStyle.fontWeight = 'bold';
          if (op.attributes?.italic) textStyle.fontStyle = 'italic';
          if (op.attributes?.underline)
            textStyle.textDecorationLine = 'underline';
          if (op.attributes?.strike)
            textStyle.textDecorationLine = 'line-through';
          if (op.attributes?.header) textStyle.fontSize = 20;
          if (op.attributes?.size === 'small') textStyle.fontSize = 12;
          if (op.attributes?.size === 'large') textStyle.fontSize = 20;
          if (op.attributes?.size === 'huge') textStyle.fontSize = 28;
          if (op.attributes?.color) textStyle.color = op.attributes.color;
          if (op.attributes?.background)
            textStyle.backgroundColor = op.attributes.background;
          if (op.attributes?.align) textStyle.textAlign = op.attributes.align;

          if (typeof op.insert === 'string') {
            const cleaned = op.insert.replace(/\n/g, '').trim();
            if (cleaned === '') return null;
          }
          return (
            <Text
              key={idx}
              style={[
                {
                  fontSize: 16,
                  color: colors.black,
                  fontFamily: 'Neue-Regular',
                  marginVertical: 1,
                },
                textStyle,
              ]}
            >
              {op.insert}
            </Text>
          );
        })}
      </View>
    );
  }

  return null;
};

export default QuillRenderer;

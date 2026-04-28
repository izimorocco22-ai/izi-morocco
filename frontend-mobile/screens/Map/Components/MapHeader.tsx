import { Text, View } from 'react-native';
import commonStyles from '../../../styles/commonStyles';
import { ConvertGameTime, useGameTimer } from '../utils/gameTimer';
import { RFValue } from '../../../utils/responsive';
import colors from '../../../styles/colors';

const MapHeader = ({ game, state, gameId, activeCode }: { game: any; state: any; gameId?: string; activeCode?: string }) => {
  const [timeLeft, formattedTime, elapsedTime] = useGameTimer(game, gameId, state.time, activeCode);

  console.log('MapHeader timer values:', {
    timeLeft,
    formattedTime,
    elapsedTime,
    stateTime: state.time,
    gameTimeLimit: game?.game?.timeLimit,
    gameDuration: game?.game?.duration
  });

  // Format score to handle large numbers
  const formatScore = (score: number) => {
    if (score >= 1000000) {
      return `${(score / 1000000).toFixed(1)}M`;
    } else if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}K`;
    }
    return score.toString();
  };

  return (
    <View
      style={[
        commonStyles.row,
        commonStyles.alignCenter,
        commonStyles.justifyBetween,
        {
          height: RFValue(50),
          paddingHorizontal: 16,
          backgroundColor: colors.white,
          gap: RFValue(10),
        },
      ]}
    >
      <View style={[{ flex: 1, minWidth: 0 }]}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            commonStyles.h3Text,
            { fontSize: RFValue(14), color: colors.black },
          ]}
        >
          {game?.game?.title}
        </Text>
      </View>
      <View
        style={[
          commonStyles.row,
          commonStyles.alignCenter,
          { gap: RFValue(10), flexShrink: 0, minWidth: RFValue(140) },
        ]}
      >
        <Text 
          numberOfLines={1}
          ellipsizeMode="clip"
          style={[commonStyles.h3Text, { fontSize: RFValue(13), minWidth: RFValue(70) }]}
        >
          ⏰{' '}
          {formattedTime ||
            ConvertGameTime(
              game?.game?.timeLimit,
              game?.game?.endTime,
              game?.game?.duration,
            )}
        </Text>
        <Text 
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[commonStyles.h3Text, { fontSize: RFValue(13), minWidth: RFValue(50) }]}
        >
          🏆 {formatScore(state.score)}
        </Text>
      </View>
    </View>
  );
};

export default MapHeader;

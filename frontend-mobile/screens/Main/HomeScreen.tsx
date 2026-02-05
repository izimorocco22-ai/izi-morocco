import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  Platform,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getGame } from '../../store/gameSlice';
import { RootState, AppDispatch } from '../../store/store';
import commonStyles from '../../styles/commonStyles';
import colors from '../../styles/colors';
import LinearGradient from 'react-native-linear-gradient';
import ScreenWrapper from '../../components/ScreenWrapper';
import SearchIcon from '../../assets/icons/Search';
import { RFValue } from '../../utils/responsive';
import LottieView from 'lottie-react-native';
import { ConvertGameTime } from '../Map/utils/gameTimer';
import { API_URL, VITE_MEDIA_URL } from '@env';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [refreshing, setRefreshing] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const games = useSelector((state: RootState) => state.game.games);
  const [gamesList, setGamesList] = useState(games?.docs || []);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = React.useState('');
  const isGameLoading = useSelector(
    (state: RootState) => state.game.isGameLoading,
  );

  const fetchGames = async (newPage = 1) => {
    const res = await dispatch(getGame({ page: newPage, limit: 10 })).unwrap();
    const newGames = res?.data?.docs || [];

    if (newPage === 1) {
      setGamesList(newGames);
    } else {
      setGamesList((prev: any) => [...prev, ...newGames]);
    }
    setHasMore(res?.data?.hasNextPage);
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleLoadMore = () => {
    if (!isGameLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchGames(nextPage);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchGames(1);
    setRefreshing(false);
  };

  const resolveThumbnailUri = (thumb?: string) => {
    if (!thumb) return null;
    if (/^https?:\/\//.test(thumb)) return thumb;

    if (VITE_MEDIA_URL) {
      const mediaUrl = VITE_MEDIA_URL.trim().replace(/\/$/, '');
      const path = thumb.startsWith('/') ? thumb.slice(1) : thumb;
      // If thumb doesn't start with uploads/ and mediaUrl is Cloudinary, 
      // we might need to be careful, but usually it comes as uploads/filename
      return `${mediaUrl}/${path}`;
    }

    const base = (API_URL || 'https://izi-morocco-1.onrender.com').replace(/\/$/, '');
    const path = thumb.startsWith('uploads/') ? thumb : `uploads/${thumb}`;
    return `${base}/public/${path}`;
  };

  const Card = card => {
    return (
      <>
      <TouchableOpacity
        onPress={() => {
          navigation.navigate('GameLogin', {
            game: card,
            duration: ConvertGameTime(
              card?.timeLimit,
              card?.endTime,
              card?.duration,
            ),
          });
        }}
        style={[
          {
            padding: RFValue(10),
            borderWidth: 1,
            borderColor: colors.primary,
            borderRadius: 10,
            overflow: 'hidden',
            backgroundColor: colors.white,
          },
        ]}
        >
        {/* upper main image */}
        <View
          style={[
            { height: RFValue(150), overflow: 'hidden', borderRadius: 10 },
          ]}
        >
          {card?.thumbnail ? (
            <Image
              style={[
                { resizeMode: 'cover', width: '100%', height: RFValue(150) },
              ]}
              source={{
                uri: resolveThumbnailUri(card.thumbnail) || undefined,
              }}
            />
          ) : (
            <Image
              style={[
                { resizeMode: 'cover', width: '100%', height: RFValue(150) },
              ]}
              source={require('../../assets/images/game/game1.webp')}
            />
          )}
        </View>
        {/* content */}
        <View>
          {/* heading and rating */}
          <View
            style={[
              commonStyles.row,
              commonStyles.justifyBetween,
              commonStyles.alignCenter,
              { marginTop: RFValue(10) },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[commonStyles.h2Text, commonStyles.fullFlex]}
            >
              {card.title}
            </Text>
            <View
              style={[commonStyles.row, commonStyles.alignCenter, { gap: 5 }]}
            >
              <Image
                style={{
                  height: RFValue(20),
                  width: RFValue(20),
                  resizeMode: 'contain',
                }}
                source={require('../../assets/images/icon/star.png')}
              />
              <Text style={[commonStyles.pText, { marginTop: 0 }]}>
                {card.rating ? card.rating : '0.0'}
              </Text>
            </View>
          </View>
          {/* description */}
          <View
            style={[
              commonStyles.row,
              { gap: RFValue(15), marginTop: RFValue(10) },
            ]}
          >
            {/* time */}
            <View style={[commonStyles.row, { gap: RFValue(10) }]}>
              <Image
                style={[
                  {
                    height: RFValue(20),
                    width: RFValue(20),
                    resizeMode: 'contain',
                  },
                ]}
                source={require('../../assets/images/icon/clock.png')}
              />
              <Text style={[commonStyles.pText, { marginTop: 0 }]}>
                {ConvertGameTime(
                  card?.timeLimit,
                  card?.endTime,
                  card?.duration,
                )}
              </Text>
            </View>
            {/* active user */}
            {/* <View style={[commonStyles.row, { gap: RFValue(10) }]}>
              <Image
                style={[
                  {
                    height: RFValue(20),
                    width: RFValue(20),
                    resizeMode: 'contain',
                  },
                ]}
                source={require('../../assets/images/icon/user.png')}
              />
              <Text style={[commonStyles.pText, { marginTop: 0 }]}>
                {card.status}
              </Text>
            </View> */}
          </View>
        </View>
      </TouchableOpacity>
      </>
    );
  };

  return (
    <ScreenWrapper>
      <LinearGradient
        colors={[
          colors.white,
          colors.white,
          colors.primaryLight,
          colors.primary,
        ]}
        style={[
          commonStyles.container,
          { paddingBottom: Platform.OS === 'ios' ? RFValue(80) : RFValue(60) },
        ]}
      >
        <FlatList
  data={gamesList}
  keyExtractor={(item: any) => item._id}
  renderItem={({ item }) => <Card {...item} />}
  ListHeaderComponent={
    <>
      <View>
        <Text style={commonStyles.h1Text}>
          Hi, {user?.name}
        </Text>
        <Text style={[commonStyles.pText, { marginTop: 0 }]}>
          Good Morning!
        </Text>
      </View>

      {/* Search Bar */}
      <View
        style={[
          commonStyles.row,
          commonStyles.alignCenter,
          commonStyles.justifyBetween,
          { gap: RFValue(10), marginTop: RFValue(10) },
        ]}
      >
        <View
          style={[
            commonStyles.row,
            {
              gap: RFValue(5),
              borderWidth: 1,
              borderColor: colors.black,
              borderRadius: 10,
              paddingHorizontal: RFValue(15),
              flex: 1,
            },
          ]}
        >
          <SearchIcon />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search"
            placeholderTextColor={"#565656"}
            style={[commonStyles.fullFlex,{color:colors.black,paddingHorizontal:RFValue(5)}]}
          />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('QRCode')}>
          <Image
            style={{
              height: RFValue(45),
              width: RFValue(45),
              resizeMode: 'contain',
            }}
            source={require('../../assets/images/icon/qrcode.png')}
          />
        </TouchableOpacity>
      </View>
    </>
  }
  ListFooterComponent={
    isGameLoading && page > 1 ? (
      <LottieView
        source={require('../../assets/animation/cardLoading.json')}
        autoPlay
        loop
        style={{
          width: RFValue(100),
          height: RFValue(80),
          alignSelf: 'center',
        }}
      />
    ) : null
  }
  onEndReached={() => {
    if (!isGameLoading && hasMore) {
      handleLoadMore();
    }
  }}
  onEndReachedThreshold={0.5} // triggers when 50% before reaching bottom
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[colors.primary]}
      tintColor={colors.primary}
    />
  }
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{
    paddingBottom: RFValue(Platform.OS === 'ios' ? 80 : 60),
    paddingTop: RFValue(20),
    gap: RFValue(15),
  }}
/>
      </LinearGradient>
    </ScreenWrapper>
  );
};

export default HomeScreen;

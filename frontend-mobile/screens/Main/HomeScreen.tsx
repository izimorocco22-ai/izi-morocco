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
import { getCleanImageUrl } from '../../utils/imageUtils';
import ApiService from '../../utils/apiService';
import { apiPaths } from '../../utils/apiPaths';
import { offlineManager } from '../../utils/offlineManager';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [refreshing, setRefreshing] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const games = useSelector((state: RootState) => state.game.games);
  const [gamesList, setGamesList] = useState(games?.docs || []);
  const [filteredGames, setFilteredGames] = useState(games?.docs || []);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = React.useState('');
  const isGameLoading = useSelector(
    (state: RootState) => state.game.isGameLoading,
  );

  const fetchGames = async (newPage = 1) => {
    try {
      const res = await dispatch(getGame({ page: newPage, limit: 10 })).unwrap();
      const newGames = res?.data?.docs || [];

      if (newPage === 1) {
        setGamesList(newGames);
        setFilteredGames(newGames);
        // Save the first page of games for offline display
        await offlineManager.saveGamesList(newGames);
      } else {
        setGamesList((prev: any) => {
          const merged = [...prev, ...newGames];
          return merged;
        });
      }
      setHasMore(res?.data?.hasNextPage);
    } catch (error) {
      console.log('Error fetching games, trying offline load:', error);
      // If network fails and it's the first page, try to load from offline storage
      if (newPage === 1) {
        const offlineGames = await offlineManager.loadGamesList();
        if (offlineGames && offlineGames.length > 0) {
          setGamesList(offlineGames);
          // Assuming we can't paginate offline easily or just show what we have
          setHasMore(false); 
        }
      }
    }
  };

  useEffect(() => {
    fetchGames();
    
    // Sync offline results
    const syncResults = async () => {
      const pending = await offlineManager.getPendingResults();
      if (pending.length > 0) {
        console.log('Syncing pending results...', pending.length);
        const syncedIds: string[] = [];
        
        for (const result of pending) {
          try {
             await ApiService({
                method: 'PUT',
                endpoint: apiPaths.getGame,
                data: { 
                    gameId: result.gameId, 
                    activationCode: result.activationCode, 
                    playerId: result.playerId, 
                    status: result.status, 
                    questions: result.questions, 
                    score: result.score 
                },
             });
             syncedIds.push(result.id);
          } catch (e) {
             console.log('Sync failed for', result.id);
          }
        }
        
        if (syncedIds.length > 0) {
           await offlineManager.removePendingResults(syncedIds);
           console.log('Synced results removed.');
        }
      }
    };
    syncResults();
  }, []);

  useEffect(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      setFilteredGames(gamesList);
      return;
    }

    const next = gamesList.filter((g: any) => {
      const titleMatch = g?.title?.toLowerCase().includes(query);
      const tagMatch = Array.isArray(g?.tags)
        ? g.tags.some((t: any) =>
            t?.name ? String(t.name).toLowerCase().includes(query) : false,
          )
        : false;
      return titleMatch || tagMatch;
    });

    setFilteredGames(next);
  }, [searchText, gamesList]);

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
                uri: getCleanImageUrl(card.thumbnail) || undefined,
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
    <ScreenWrapper backgroundColor="#ffffff">
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
          data={filteredGames}
          keyExtractor={(item: any) => item._id}
          numColumns={2}
          columnWrapperStyle={{ gap: RFValue(12) }}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <Card {...item} />
            </View>
          )}
          ListHeaderComponent={
            <>
              <View>
                <Text style={commonStyles.h1Text}>Hi, {user?.name}</Text>
                <Text style={[commonStyles.pText, { marginTop: 0 }]}>Good Morning!</Text>
              </View>
              <View
                style={[
                  commonStyles.row,
                  commonStyles.alignCenter,
                  commonStyles.justifyBetween,
                  { gap: RFValue(10), marginTop: RFValue(10), marginBottom: RFValue(10) },
                ]}
              >
                <View
                  style={[
                    commonStyles.row,
                    commonStyles.alignCenter,
                    {
                      gap: RFValue(5),
                      borderWidth: 1,
                      borderColor: colors.black,
                      borderRadius: 10,
                      paddingHorizontal: RFValue(15),
                      height: RFValue(48),
                      flex: 1,
                    },
                  ]}
                >
                  <SearchIcon />
                  <TextInput
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Search"
                    placeholderTextColor="#565656"
                    style={[
                      commonStyles.fullFlex,
                      {
                        color: colors.black,
                        paddingHorizontal: RFValue(5),
                        paddingVertical: 0,
                        height: '100%',
                      },
                    ]}
                  />
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('QRCode')}>
                  <Image
                    style={{ height: RFValue(45), width: RFValue(45), resizeMode: 'contain' }}
                    source={require('../../assets/images/icon/qrcode.png')}
                  />
                </TouchableOpacity>
              </View>
            </>
          }
          ListEmptyComponent={
            !isGameLoading ? (
              <View style={{ alignItems: 'center', marginTop: RFValue(40) }}>
                <Text style={[commonStyles.pText, { textAlign: 'center' }]}>No games available</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            isGameLoading ? (
              <LottieView
                source={require('../../assets/animation/cardLoading.json')}
                autoPlay
                loop
                style={{ width: RFValue(100), height: RFValue(80), alignSelf: 'center' }}
              />
            ) : null
          }
          onEndReached={() => { if (!isGameLoading && hasMore) handleLoadMore(); }}
          onEndReachedThreshold={0.5}
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
            gap: RFValue(12),
          }}
        />
      </LinearGradient>
    </ScreenWrapper>
  );
};

export default HomeScreen;

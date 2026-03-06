import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { getCleanImageUrl, getCleanMediaUrl } from './imageUtils';

const GAME_PREFIX = 'offline_game_';
const GAME_LIST_KEY = 'offline_game_list';
const PENDING_RESULTS_KEY = 'pending_game_results';

export const offlineManager = {
  // --- Game Data Management ---

  /**
   * Save game data for offline use.
   * Downloads media assets and replaces URLs with local paths.
   */
  saveGame: async (gameId: string, data: any) => {
    try {
      // 1. Clone data to avoid mutating the original object
      const gameData = JSON.parse(JSON.stringify(data));
      
      // 2. Process questions to download media
      if (gameData.game && Array.isArray(gameData.game.questions)) {
        for (const question of gameData.game.questions) {
          if (question.media) {
            if (question.media.images && Array.isArray(question.media.images)) {
              const newImages = [];
              for (const img of question.media.images) {
                const raw =
                  typeof img === 'string'
                    ? img
                    : img && typeof img === 'object' && 'url' in img
                    ? (img as any).url
                    : '';
                const url = getCleanMediaUrl(raw, 'image');
                const localPath =
                  url && typeof url === 'string' && url.startsWith('http')
                    ? await downloadMedia(url)
                    : null;
                newImages.push(localPath || img);
              }
              question.media.images = newImages;
            }

            if (question.media.videos && Array.isArray(question.media.videos)) {
              const newVideos = [];
              for (const vid of question.media.videos) {
                const raw =
                  typeof vid === 'string'
                    ? vid
                    : vid && typeof vid === 'object' && 'url' in vid
                    ? (vid as any).url
                    : '';
                const url = getCleanMediaUrl(raw, 'video');
                const localPath =
                  url && typeof url === 'string' && url.startsWith('http')
                    ? await downloadMedia(url)
                    : null;
                newVideos.push(localPath || vid);
              }
              question.media.videos = newVideos;
            }

            if (question.media.audios && Array.isArray(question.media.audios)) {
              const newAudios = [];
              for (const audio of question.media.audios) {
                if (audio && audio.url) {
                  const url = getCleanMediaUrl(audio.url, 'video');
                  const localPath =
                    url && typeof url === 'string' && url.startsWith('http')
                      ? await downloadMedia(url)
                      : null;
                  newAudios.push({
                    ...audio,
                    url: localPath || audio.url,
                  });
                } else {
                  newAudios.push(audio);
                }
              }
              question.media.audios = newAudios;
            }
          }

          if (
            question.question &&
            question.question.ops &&
            Array.isArray(question.question.ops)
          ) {
            for (const op of question.question.ops) {
              if (op.insert && typeof op.insert.image === 'string') {
                const imgUrl = getCleanMediaUrl(op.insert.image, 'image');
                const localImg =
                  imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')
                    ? await downloadMedia(imgUrl)
                    : null;
                if (localImg) {
                  op.insert.image = localImg;
                }
              }
            }
          }
        }
      }

      if (gameData.game && gameData.game.thumbnail) {
        const thumbUrl = getCleanImageUrl(gameData.game.thumbnail);
        if (thumbUrl && thumbUrl.startsWith('http')) {
          const localThumb = await downloadMedia(thumbUrl);
          if (localThumb) {
            gameData.game.thumbnail = localThumb;
          }
        }
      }

      // 3. Save to AsyncStorage
      await AsyncStorage.setItem(`${GAME_PREFIX}${gameId}`, JSON.stringify(gameData));
      console.log(`Game ${gameId} saved offline.`);
      return true;
    } catch (error) {
      console.error('Failed to save game offline:', error);
      return false;
    }
  },

  /**
   * Load game data from offline storage.
   */
  loadGame: async (gameId: string) => {
    try {
      const data = await AsyncStorage.getItem(`${GAME_PREFIX}${gameId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load offline game:', error);
      return null;
    }
  },

  /**
   * Check if a game is available offline.
   */
  isGameOfflineAvailable: async (gameId: string) => {
      const data = await AsyncStorage.getItem(`${GAME_PREFIX}${gameId}`);
      return !!data;
  },

  /**
   * Update stored game state (questions/score/status) without re-downloading media.
   */
  updateGameState: async (
    gameId: string,
    {
      questions,
      score,
      status,
    }: { questions?: any; score?: number; status?: string },
  ) => {
    try {
      const existing = await AsyncStorage.getItem(`${GAME_PREFIX}${gameId}`);
      if (!existing) {
        return false;
      }

      const data = JSON.parse(existing);
      if (!data.game) {
        data.game = {};
      }

      if (questions) {
        if (Array.isArray(questions) && Array.isArray(data.game.questions)) {
          const byId: Record<string, any> = {};
          for (const q of data.game.questions) {
            if (q && q._id) {
              byId[String(q._id)] = q;
            }
          }

          const merged = questions.map((q: any) => {
            const key = q && q._id ? String(q._id) : undefined;
            const base = key && byId[key] ? byId[key] : {};
            return {
              ...base,
              latitude: q.latitude ?? base.latitude,
              longitude: q.longitude ?? base.longitude,
              radius: q.radius ?? base.radius,
              order: q.order ?? base.order,
              isFinished: q.isFinished ?? base.isFinished,
              isCorrect: q.isCorrect ?? base.isCorrect,
              userAnswer: q.userAnswer ?? base.userAnswer,
              isDisplayed: q.isDisplayed ?? base.isDisplayed,
              isShownOnPlayground:
                q.isShownOnPlayground ?? base.isShownOnPlayground,
              points: q.points ?? base.points,
            };
          });

          data.game.questions = merged;
        } else {
          data.game.questions = questions;
        }
      }
      if (typeof score === 'number') {
        data.game.score = score;
      }
      if (status) {
        data.game.status = status;
      }

      await AsyncStorage.setItem(`${GAME_PREFIX}${gameId}`, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to update offline game state:', error);
      return false;
    }
  },

  // --- Game List Management ---

  /**
   * Save the list of games for offline display.
   */
  saveGamesList: async (gamesList: any[]) => {
      try {
          const gamesToSave = JSON.parse(JSON.stringify(gamesList));
          
          // Download thumbnails for each game
          for (const game of gamesToSave) {
              if (game.thumbnail) {
                  const url = getCleanImageUrl(game.thumbnail);
                  if (url && url.startsWith('http')) {
                      const localPath = await downloadMedia(url);
                      if (localPath) {
                          game.thumbnail = localPath;
                      }
                  }
              }
          }

          await AsyncStorage.setItem(GAME_LIST_KEY, JSON.stringify(gamesToSave));
          console.log('Games list saved offline with thumbnails.');
          return true;
      } catch (error) {
          console.error('Failed to save games list:', error);
          return false;
      }
  },

  /**
   * Load the games list from offline storage.
   */
  loadGamesList: async () => {
      try {
          const data = await AsyncStorage.getItem(GAME_LIST_KEY);
          return data ? JSON.parse(data) : [];
      } catch (error) {
          console.error('Failed to load games list:', error);
          return [];
      }
  },

  // --- Result Management ---

  /**
   * Save a game result locally when offline.
   */
  savePendingResult: async (resultData: any) => {
    try {
      const existingResultsStr = await AsyncStorage.getItem(PENDING_RESULTS_KEY);
      const existingResults = existingResultsStr ? JSON.parse(existingResultsStr) : [];
      
      // Add new result
      existingResults.push({
        ...resultData,
        timestamp: Date.now(),
        id: Math.random().toString(36).substr(2, 9), // Simple ID
      });

      await AsyncStorage.setItem(PENDING_RESULTS_KEY, JSON.stringify(existingResults));
      console.log('Result saved locally.');
      return true;
    } catch (error) {
      console.error('Failed to save pending result:', error);
      return false;
    }
  },

  /**
   * Get all pending results.
   */
  getPendingResults: async () => {
    try {
      const str = await AsyncStorage.getItem(PENDING_RESULTS_KEY);
      return str ? JSON.parse(str) : [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Clear specific pending results (after successful sync).
   */
  removePendingResults: async (idsToRemove: string[]) => {
      try {
          const str = await AsyncStorage.getItem(PENDING_RESULTS_KEY);
          if(!str) return;
          
          let results = JSON.parse(str);
          results = results.filter((r: any) => !idsToRemove.includes(r.id));
          
          await AsyncStorage.setItem(PENDING_RESULTS_KEY, JSON.stringify(results));
      } catch(error) {
          console.error('Failed to remove pending results', error);
      }
  }
};

// Helper: Download Media
const downloadMedia = async (url: string): Promise<string | null> => {
    try {
        if (!url || typeof url !== 'string') return null;

        const filename = url.split('/').pop()?.split('?')[0] || `file_${Date.now()}`;
        // Create a dedicated folder for game assets
        const dir = `${RNFS.DocumentDirectoryPath}/game_assets`;
        
        // Ensure directory exists
        const exists = await RNFS.exists(dir);
        if (!exists) {
            await RNFS.mkdir(dir);
        }

        const destPath = `${dir}/${filename}`;

        // Check if file already exists
        if (await RNFS.exists(destPath)) {
            return `file://${destPath}`;
        }

        const download = RNFS.downloadFile({
            fromUrl: url,
            toFile: destPath,
        });

        const result = await download.promise;
        if (result.statusCode === 200) {
            return `file://${destPath}`;
        }
        return null;
    } catch (error) {
        console.warn('Failed to download asset:', url, error);
        return null;
    }
};

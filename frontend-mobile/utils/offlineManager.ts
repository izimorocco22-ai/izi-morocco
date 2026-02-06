import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { getCleanImageUrl } from './imageUtils';

const GAME_PREFIX = 'offline_game_';
const GAME_LIST_KEY = 'offline_game_list';
const PENDING_RESULTS_KEY = 'pending_game_results';
const CLOUDINARY_BASE_IMAGE = "https://res.cloudinary.com/dik1l8tqu/image/upload/v1759483737/";
const CLOUDINARY_BASE_VIDEO = "https://res.cloudinary.com/dik1l8tqu/video/upload/v1759483737/";

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
      if (gameData.game && gameData.game.questions) {
        for (const question of gameData.game.questions) {
            if (question.media) {
                 // Handle Images
                 if (question.media.images && Array.isArray(question.media.images)) {
                     const newImages = [];
                     for (const img of question.media.images) {
                         // Construct full URL if it's a relative path (ID)
                         const url = (typeof img === 'string' && img.startsWith('http')) 
                            ? img 
                            : CLOUDINARY_BASE_IMAGE + img;
                         
                         const localPath = await downloadMedia(url);
                         newImages.push(localPath || img); 
                     }
                     question.media.images = newImages;
                 }
                 
                 // Handle Videos (Cloudinary)
                 if (question.media.videos && Array.isArray(question.media.videos)) {
                     const newVideos = [];
                     for (const vid of question.media.videos) {
                         const url = (typeof vid === 'string' && vid.startsWith('http')) 
                            ? vid 
                            : CLOUDINARY_BASE_VIDEO + vid;
                         
                         const localPath = await downloadMedia(url);
                         newVideos.push(localPath || vid);
                     }
                     question.media.videos = newVideos;
                 }

                 // Handle Audios
                 if (question.media.audios && Array.isArray(question.media.audios)) {
                    const newAudios = [];
                    for (const audio of question.media.audios) {
                        if (audio && audio.url) {
                            const url = (audio.url.startsWith('http'))
                                ? audio.url
                                : CLOUDINARY_BASE_VIDEO + audio.url; // Uses video base url per QuestionModal
                            
                            const localPath = await downloadMedia(url);
                            newAudios.push({ ...audio, url: localPath || audio.url });
                        } else {
                            newAudios.push(audio);
                        }
                    }
                    question.media.audios = newAudios;
                 }
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

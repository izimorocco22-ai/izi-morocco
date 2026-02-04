import httpStatus from 'http-status';
import { buildResponse, handleError } from '../utils/response.util.js';
import GameInfo from '../models/game-info.schema.js';
import Questions from '../models/question.schema.js';
import Player from '../models/players.schema.js';
import GameActivationCodes from '../models/game-activation.schema.js';

export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Games Stats
    const totalGames = await GameInfo.countDocuments({ isDeleted: { $ne: true } });
    const activeGames = await GameInfo.countDocuments({ isDeleted: { $ne: true }, status: 'active' });
    const inactiveGames = await GameInfo.countDocuments({ isDeleted: { $ne: true }, status: 'inactive' });
    const newGamesLastMonth = await GameInfo.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: lastMonth, $lt: thisMonth } });
    const newGamesThisMonth = await GameInfo.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: thisMonth } });
    
    let gamesTrending = "+0%";
    if (newGamesLastMonth > 0) {
        const growth = ((newGamesThisMonth - newGamesLastMonth) / newGamesLastMonth * 100);
        gamesTrending = (growth > 0 ? "+" : "") + growth.toFixed(1) + "%";
    } else if (newGamesThisMonth > 0) {
        gamesTrending = "+100%";
    }

    // Questions Stats
    const totalQuestions = await Questions.countDocuments({ isDeleted: { $ne: true } });
    const questionsPerGame = totalGames > 0 ? (totalQuestions / totalGames).toFixed(1) : 0;
    
    // Players/Users Stats
    const totalPlayers = await Player.countDocuments({ isVerified: true });
    const newPlayersLastMonth = await Player.countDocuments({ isVerified: true, createdAt: { $gte: lastMonth, $lt: thisMonth } });
    const newPlayersThisMonth = await Player.countDocuments({ isVerified: true, createdAt: { $gte: thisMonth } });
    
    let playersTrending = "+0%";
    if (newPlayersLastMonth > 0) {
        const growth = ((newPlayersThisMonth - newPlayersLastMonth) / newPlayersLastMonth * 100);
        playersTrending = (growth > 0 ? "+" : "") + growth.toFixed(1) + "%";
    } else if (newPlayersThisMonth > 0) {
        playersTrending = "+100%";
    }

    // Tags Distribution
    const tagsDistribution = await Questions.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $lookup: { from: 'Tags', localField: '_id', foreignField: '_id', as: 'tagDetails' } },
      { $unwind: '$tagDetails' },
      { $project: { tag: '$tagDetails.name', visitors: '$count', fill: { $literal: '#8884d8' } } },
      { $sort: { visitors: -1 } },
      { $limit: 5 }
    ]);

    // Assign dynamic colors to tags
    const colors = ["#0d3b66", "#f4d35e", "#f95738", "#faf0ca", "#ee964b"];
    tagsDistribution.forEach((item, index) => {
        item.fill = colors[index % colors.length];
    });

    // Recent Activity (from Game Activations)
    const recentActivity = await GameActivationCodes.aggregate([
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: 'GameInfo',
                localField: 'gameId',
                foreignField: '_id',
                as: 'game'
            }
        },
        { $unwind: { path: '$game', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                id: '$_id',
                user: '$playerId', // Using playerId as user name for now
                action: 'activated',
                game: { $ifNull: ['$game.title', 'Unknown Game'] },
                timestamp: '$createdAt',
                points: null 
            }
        }
    ]);

    const dashboardData = {
      games: {
        total: totalGames,
        trending: gamesTrending,
        breakdown: {
          published: activeGames,
          draft: inactiveGames
        }
      },
      questions: {
        total: totalQuestions,
        trending: "+0%", // Placeholder
        breakdown: {}, 
        averagePerGame: questionsPerGame
      },
      activeUsers: {
        total: totalPlayers,
        trending: playersTrending,
        retentionRate: "N/A"
      },
      tagsChartData: tagsDistribution,
      recentActivity
    };

    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, dashboardData, 'Dashboard stats fetched successfully'));
  } catch (error) {
    handleError(res, error);
  }
};

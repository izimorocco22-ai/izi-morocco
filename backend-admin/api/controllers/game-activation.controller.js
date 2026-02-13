import mongoose from 'mongoose'
import handleError from '../utils/handleError.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import buildResponse from '../utils/buildResponse.js'
import httpStatus from 'http-status'
import { matchedData } from 'express-validator'
import Player from '../models/players.schema.js'
import GameInfo from '../models/game-info.schema.js'
import GameActivation from '../models/game-activation.schema.js'
import QRCode from 'qrcode'
import generateRandomCode from '../helpers/generateRandomCode.js'
import { v4 as uuidv4 } from 'uuid'




export const createGameActivationCode = async (req, res) => {
  try {
    let { playerId, gameId, expiresAt, quantity } = matchedData(req);

    if (!expiresAt) {
      expiresAt = new Date(Date.now() + 360000000);
    }
    quantity = Number(quantity) || 1;
    const batchId = uuidv4();

    const [player, game] = await Promise.all([
      Player.findOne({ playerId: playerId, isDeleted: { $ne: true }, isVerified: { $ne: false } }),
      GameInfo.findOne({ _id: gameId, isDeleted: { $ne: true }, status: 'active' })
    ]);

    if (!player) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Player not found');
    }

    if (!game) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Game not found');
    }
    console.log({ player })
    let activationCodeFor = player?.role === 'A' ? 'Admin' : 'Player';
    const createdItems = [];
    let lastCreated;

    for (let i = 0; i < quantity; i++) {
      let success = false;
      while (!success) {
        try {
          const activationCode = generateRandomCode(8);
          const playerGame = await GameActivation.create({
            playerId,
            gameId,
            activationCode,
            expiresAt,
            activationCodeFor,
            activationBatchId: batchId
          });
          const qrPayload = JSON.stringify({ playerId, gameId, activationCode, expiresAt });
          const qrCodeDataURL = await QRCode.toDataURL(qrPayload);
          createdItems.push({
            _id: playerGame._id,
            playerId: playerGame.playerId,
            gameId: playerGame.gameId,
            activationCode: playerGame.activationCode,
            expiresAt: playerGame.expiresAt,
            qrCodeDataURL,
            activationBatchId: batchId
          });
          lastCreated = playerGame;
          success = true;
        } catch (err) {
          if (err.code === 11000) {
            console.warn('Duplicate code detected, regenerating...');
          } else {
            throw err;
          }
        }
      }
    }

    if (quantity === 1) {
      const single = createdItems[0];
      return res.status(httpStatus.CREATED).json(
        buildResponse(
          httpStatus.CREATED,
          { ...single, activationBatchId: batchId },
          'Game activation code created successfully'
        )
      );
    }

    return res.status(httpStatus.CREATED).json(
      buildResponse(
        httpStatus.CREATED,
        { createdCount: createdItems.length, batchId, codes: createdItems },
        'Game activation codes created successfully'
      )
    );
  } catch (err) {
    handleError(res, err)
  }
}

export const getActivationCodesByBatchId = async (req, res) => {
  try {
    const { batchId } = matchedData(req, { locations: ['params'] });

    const filter = { isDeleted: { $ne: true } };
    const orFilters = [{ activationBatchId: batchId }];
    if (mongoose.Types.ObjectId.isValid(batchId)) {
      orFilters.push({ _id: new mongoose.Types.ObjectId(batchId) });
    }

    const result = await GameActivation.aggregate([
      { $match: { ...filter, $or: orFilters } },
      {
        $lookup: {
          from: 'GameInfo',
          localField: 'gameId',
          foreignField: '_id',
          as: 'gameDetails'
        }
      },
      {
        $lookup: {
          from: 'Players',
          localField: 'playerId',
          foreignField: 'playerId',
          as: 'playerDetails'
        }
      },
      { $unwind: { path: '$gameDetails', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$playerDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          playerId: 1,
          activationCode: 1,
          gameDetails: {
            _id: "$gameDetails._id",
            title: "$gameDetails.title",
            description: "$gameDetails.description"
          },
          playerDetails: {
            name: "$playerDetails.name",
            email: "$playerDetails.email"
          },
          expiresAt: 1,
          createdAt: 1,
          activationBatchId: 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.status(httpStatus.OK).json({ response: { data: result }, message: 'Batch codes fetched successfully' });
  } catch (err) {
    handleError(res, err);
  }
}

const pipeLineForAdminCodes = (filter, sort, limit, page) => {
  return [
    { $match: filter },
    {
      $lookup: {
        from: 'GameInfo',
        localField: 'gameId',
        foreignField: '_id',
        as: 'gameDetails'
      }
    },
    {
      $lookup: {
        from: 'Players',
        localField: 'playerId',
        foreignField: 'playerId',
        as: 'playerDetails'
      }
    },
    { $match: { 'gameDetails.isDeleted': { $ne: true }, 'playerDetails.role': "A" } },
    {
      $unwind: {
        path: '$gameDetails',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path: '$playerDetails',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        playerId: 1,
        activationCode: 1,
        activationBatchId: 1,
        gameDetails: {
          _id: "$gameDetails._id",
          title: "$gameDetails.title",
          description: "$gameDetails.description"
        },
        playerDetails: {
          name: "$playerDetails.name",
          email: "$playerDetails.email"
        },
        expiresAt: 1,
        createdAt: 1
      }
    },
    {
      $group: {
        _id: { $ifNull: ['$activationBatchId', '$_id'] },
        batchId: { $first: { $ifNull: ['$activationBatchId', '$_id'] } },
        playerId: { $first: '$playerId' },
        gameDetails: { $first: '$gameDetails' },
        playerDetails: { $first: '$playerDetails' },
        expiresAt: { $max: '$expiresAt' },
        createdAt: { $min: '$createdAt' },
        codeCount: { $sum: 1 }
      }
    },
    { $sort: sort },
    {
      $facet: {
        data: [
          { $skip: (page - 1) * limit },
          { $limit: limit }
        ],
        totalCount: [
          { $count: "count" }
        ]
      }
    }
  ]
};


export const getAllActivationCodesForAdmin = async (req, res) => {
  try {
    let { page = 1, limit = 50, search = '' } = matchedData(req)
    page = Number(page) || 1
    limit = Number(limit) || 50
    if (limit > 50) limit = 50
    const filter = { isDeleted: { $ne: true }, activationCodeFor: 'Admin' }

    if (search) {
      filter.$or = [
        { playerId: { $regex: search, $options: 'i' } },
        { activationCode: { $regex: search, $options: 'i' } }
      ]
    }

    const result = await GameActivation.aggregate(
      pipeLineForAdminCodes(filter, { createdAt: -1 }, limit, page)
    );

    const data = result[0]?.data || [];
    const totalDocs = result[0]?.totalCount?.[0]?.count || 0;
    const totalPages = Math.ceil(totalDocs / limit);

    const response = {
      page,
      limit,
      totalDocs,
      totalPages,
      data
    };
    res.status(httpStatus.OK).json({ response, message: 'Activation codes fetched successfully' });
  }
  catch (err) {
    handleError(res, err)
  }
}


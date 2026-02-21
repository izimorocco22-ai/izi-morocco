import httpStatus from 'http-status'
import mongoose from 'mongoose'
import Team from '../models/team.schema.js'
import Player from '../models/players.schema.js'
import buildResponse from '../utils/buildResponse.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import handleError from '../utils/handleError.js'

export const getAllTeamsController = async (req, res) => {
  try {
    const teams = await Team.find({}).sort({ createdAt: -1 }).lean()

    res
      .status(httpStatus.OK)
      .json(
        buildResponse(httpStatus.OK, teams, 'Teams retrieved successfully')
      )
  } catch (err) {
    handleError(res, err)
  }
}

export const getTeamWithPlayersController = async (req, res) => {
  try {
    const { id } = req.params

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Invalid team id')
    }

    const team = await Team.findById(id).lean()

    if (!team) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Team not found')
    }

    const playerIds = [
      team.ownerPlayerId,
      ...(team.members || [])
    ].filter(Boolean)

    const players = await Player.find(
      { playerId: { $in: playerIds } },
      { password: 0 }
    )
      .sort({ name: 1 })
      .lean()

    res.status(httpStatus.OK).json(
      buildResponse(
        httpStatus.OK,
        {
          team,
          players
        },
        'Team and players retrieved successfully'
      )
    )
  } catch (err) {
    handleError(res, err)
  }
}


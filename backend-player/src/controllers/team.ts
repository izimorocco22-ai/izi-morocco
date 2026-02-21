import { Request, Response } from 'express'
import Team from '../db/models/team.schema'
import httpStatus from 'http-status'

export const createTeam = async (req: Request, res: Response) => {
  const { user } = res.locals as any
  const { name } = req.body as { name?: string }

  if (!name || !name.trim()) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Team name is required'
    })
  }

  const trimmedName = name.trim()

  const existingForUser = await Team.findOne({ ownerPlayerId: user.playerId })
  if (existingForUser) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'You have already created a team'
    })
  }

  const existingByName = await Team.findOne({
    name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
  })

  if (existingByName) {
    return res.status(httpStatus.CONFLICT).json({
      success: false,
      message: 'Team name already taken'
    })
  }

  const team = await Team.create({
    name: trimmedName,
    ownerPlayerId: user.playerId,
    members: []
  })

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Team created successfully',
    data: team
  })
}

export const getMyTeam = async (req: Request, res: Response) => {
  const { user } = res.locals as any

  const team = await Team.findOne({
    $or: [
      { ownerPlayerId: user.playerId },
      { members: user.playerId }
    ]
  }).lean()

  if (!team) {
    return res.status(httpStatus.OK).json({
      success: true,
      message: 'No team found',
      data: null
    })
  }

  return res.status(httpStatus.OK).json({
    success: true,
    message: 'Team fetched successfully',
    data: team
  })
}

export const joinTeam = async (req: Request, res: Response) => {
  const { user } = res.locals as any
  const { name } = req.body as { name?: string }

  if (!name || !name.trim()) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Team name is required'
    })
  }

  const trimmedName = name.trim()

  const team = await Team.findOne({
    name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
  })

  if (!team) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'Team not found'
    })
  }

  if (team.ownerPlayerId === user.playerId) {
    return res.status(httpStatus.OK).json({
      success: true,
      message: 'You are the host of this team',
      data: team
    })
  }

  if (team.members.includes(user.playerId)) {
    return res.status(httpStatus.OK).json({
      success: true,
      message: 'Already in team',
      data: team
    })
  }

  if (team.members.length >= 4) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Team is full (max 5 players)'
    })
  }

  team.members.push(user.playerId)
  await team.save()

  return res.status(httpStatus.OK).json({
    success: true,
    message: 'Joined team successfully',
    data: team
  })
}

export const getTeamMembersForHost = async (req: Request, res: Response) => {
  const { user } = res.locals as any

  const team = await Team.findOne({ ownerPlayerId: user.playerId }).lean()

  if (!team) {
    return res.status(httpStatus.OK).json({
      success: true,
      message: 'No team found for host',
      data: { team: null, members: [] }
    })
  }

  const members = team.members || []

  if (!members.length) {
    return res.status(httpStatus.OK).json({
      success: true,
      message: 'No members in team',
      data: { team, members: [] }
    })
  }

  const Players = (await import('../db/models/players.schema')).default

  const users = await Players.find(
    { playerId: { $in: members } },
    { password: 0 }
  ).lean()

  return res.status(httpStatus.OK).json({
    success: true,
    message: 'Team members fetched successfully',
    data: { team, members: users }
  })
}


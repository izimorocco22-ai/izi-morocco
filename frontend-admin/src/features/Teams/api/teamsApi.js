import { callAPI } from '../../../services/callApi'

export const fetchTeams = async () => {
  const res = await callAPI('/teams', {
    method: 'GET',
  })
  return res.data?.data || []
}

export const fetchTeamWithPlayers = async (id) => {
  const res = await callAPI(`/teams/${id}`, {
    method: 'GET',
  })
  return res.data?.data
}

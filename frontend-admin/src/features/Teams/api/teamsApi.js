import axiosInstance from '../../../utils/axios'

export const fetchTeams = async () => {
  const res = await axiosInstance.get('/teams')
  return res.data?.data || []
}

export const fetchTeamWithPlayers = async (id) => {
  const res = await axiosInstance.get(`/teams/${id}`)
  return res.data?.data
}


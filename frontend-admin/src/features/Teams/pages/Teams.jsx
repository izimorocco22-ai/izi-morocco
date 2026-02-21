import { useEffect, useState } from 'react'
import { fetchTeams, fetchTeamWithPlayers } from '../api/teamsApi'
import Button from '../../../components/Button'

const Teams = () => {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadTeams = async () => {
    try {
      setLoading(true)
      const data = await fetchTeams()
      setTeams(data)
    } finally {
      setLoading(false)
    }
  }

  const handleViewPlayers = async (team) => {
    try {
      setDetailLoading(true)
      const data = await fetchTeamWithPlayers(team._id)
      setSelected(data)
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    loadTeams()
  }, [])

  return (
    <div className="common-page">
      <div className="flex items-center justify-between">
        <h1 className="text-lg lg:text-xl font-semibold text-primary">
          Team Management
        </h1>
      </div>

      <div className="bg-background rounded-lg border border-accent/30 p-4">
        {loading ? (
          <p>Loading teams...</p>
        ) : teams.length === 0 ? (
          <p>No teams yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs lg:text-sm">
              <thead>
                <tr className="bg-accent text-white">
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Owner PlayerId</th>
                  <th className="px-3 py-2 text-left">Created At</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr
                    key={team._id}
                    className="border-b border-accent/10 hover:bg-orange-50/70"
                  >
                    <td className="px-3 py-2">{team.name}</td>
                    <td className="px-3 py-2">{team.ownerPlayerId}</td>
                    <td className="px-3 py-2">
                      {team.createdAt
                        ? new Date(team.createdAt).toLocaleString()
                        : '-'}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        size="sm"
                        variant="light"
                        onClick={() => handleViewPlayers(team)}
                      >
                        View Players
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base lg:text-lg font-semibold text-primary">
                {selected.team?.name} - Players
              </h2>
              <button
                className="text-sm text-accent font-semibold"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>

            {detailLoading ? (
              <p>Loading players...</p>
            ) : selected.players?.length ? (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {selected.players.map((p) => (
                  <li
                    key={p.playerId}
                    className="flex flex-col border border-accent/20 rounded-md px-3 py-2 bg-background"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-gray-600">{p.email}</span>
                    <span className="text-xs text-gray-500">
                      Player ID: {p.playerId}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No players in this team yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Teams


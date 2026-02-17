import {
  Label,
  Pie,
  PieChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../../components/ui/chart";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getDashboardStats } from "../../../slices/dashboardSlice";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { getDashboardStatsApi } = useSelector((state) => state.dashboard);
  const { data, isLoading } = getDashboardStatsApi;

  useEffect(() => {
    dispatch(getDashboardStats());
  }, [dispatch]);

  const dashboardData = data?.response || {
    games: { total: 0, trending: "+0%", breakdown: { published: 0, draft: 0 } },
    questions: { total: 0, trending: "+0%", breakdown: {}, averagePerGame: 0 },
    activeUsers: { total: 0, trending: "+0%", retentionRate: "N/A" },
    tagsChartData: [],
    recentActivity: [],
    activationCodes: { total: 0, perGame: [] },
  };

  const {
    games,
    questions,
    tagsChartData,
    activeUsers,
    recentActivity,
    activationCodes,
  } = dashboardData;

  const tagsChartConfig = useMemo(() => {
    const config = {
      visitors: {
        label: "Questions",
      },
    };
    tagsChartData.forEach((item) => {
      config[item.tag] = {
        label: item.tag,
        color: item.fill,
      };
    });
    return config;
  }, [tagsChartData]);

  const totalQuestions = questions.total;

  const safeActivationCodes = activationCodes || {
    total: 0,
    perGame: [],
  };

  const activationCodesChartConfig = useMemo(
    () => ({
      count: {
        label: "Codes",
        color: "#f97316",
      },
    }),
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="common-page">
      <h1 className="text-2xl font-bold">Platform Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 justify-between min-h-[15dvh]">
        {/* game section */}
        <div className="border border-warning/50 rounded-lg h-full p-4 bg-accent/5">
          <h3 className="font-semibold mb-2 text-xl">Total Games</h3>
          <div className="flex items-baseline">
            <span className="text-3xl text-accent font-semibold">
              {games.total}
            </span>
            <span className="font-medium text-green-500 ml-2">
              {games.trending}
            </span>
          </div>
          <div className="mt-2 text-sm">
            {games.breakdown.published} published • {games.breakdown.draft}{" "}
            draft
          </div>
        </div>
        {/* task section */}
        <div className="border border-warning/50 rounded-lg h-full p-4 bg-accent/5">
          <h3 className="font-semibold mb-2 text-xl">Total Questions</h3>
          <div className="flex items-baseline">
            <span className="font-semibold text-3xl text-accent">
              {questions.total}
            </span>
            <span className="font-medium text-green-500 ml-2">
              {questions.trending}
            </span>
          </div>
          <div className="mt-2 text-sm">
            Avg. {questions.averagePerGame} per game
          </div>
        </div>
        {/* active users */}
        <div className="border border-warning/50 rounded-lg h-full p-4 bg-accent/5">
          <h3 className="font-semibold mb-2 text-xl">Active Users</h3>
          <div className="flex items-baseline">
            <span className="font-semibold text-3xl text-orange-600">
              {activeUsers.total}
            </span>
            <span className="font-medium text-green-500 ml-2">
              {activeUsers.trending}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Retention: {activeUsers.retentionRate}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 justify-between min-h-[50dvh]">
        <div className="border border-warning/50 rounded-lg h-full p-4 ">
          <h3 className="font-semibold mb-2 text-xl">Tags Distribution</h3>
          <div className="flex items-end">
            {/* main chart */}
            {tagsChartData.length > 0 ? (
              <>
                <ChartContainer
                  config={tagsChartConfig}
                  className="aspect-square max-h-[300px] min-h-[150px] w-full"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={tagsChartData}
                      dataKey="visitors"
                      nameKey="tag"
                      innerRadius={60}
                      strokeWidth={5}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-foreground text-3xl font-bold"
                                >
                                  {totalQuestions.toLocaleString()}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 24}
                                  className="fill-muted-foreground"
                                >
                                  Questions
                                </tspan>
                              </text>
                            );
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
                {/* Legend for top tags */}
                <div className="space-y-2 w-fit">
                  <h4 className="font-medium text-sm">Top Tags</h4>
                  {tagsChartData.slice(0, 5).map((item) => (
                    <div key={item.tag} className="flex items-center text-xs gap-1">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span>{item.tag}</span>
                      </div>
                      <span className="font-medium">{item.visitors}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full text-center text-gray-500 py-10">
                No tag data available
              </div>
            )}
          </div>
        </div>

        {/* recent activity */}
        <div className="border border-warning/50 rounded-lg h-full p-4">
          <h3 className="font-bold text-xl mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 border-b border-warning/50"
                >
                  <div>
                    <span className="font-semibold">{activity.user}</span>
                    <span className="text-gray-600 ml-2">
                      {activity.action}{" "}
                      <span className="font-medium text-accent">
                        {activity.game}
                      </span>
                    </span>
                    {activity.points && (
                      <span className="font-medium text-green-600 ml-2">
                        +{activity.points} pts
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-6 border border-warning/50 rounded-lg h-full p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-xl">Activation Codes by Game</h3>
          <span className="text-sm text-gray-600">
            Total Codes:{" "}
            <span className="font-semibold">
              {safeActivationCodes.total.toLocaleString()}
            </span>
          </span>
        </div>
        {safeActivationCodes.perGame &&
        safeActivationCodes.perGame.length > 0 ? (
          <ChartContainer
            config={activationCodesChartConfig}
            className="w-full max-h-[320px] min-h-[220px]"
          >
            <BarChart data={safeActivationCodes.perGame}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="gameTitle"
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                name="Codes"
                fill="var(--color-count)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="w-full text-center text-gray-500 py-10">
            No activation codes generated yet
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

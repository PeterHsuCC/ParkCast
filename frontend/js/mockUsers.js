const mockUsers = [
  {
    id: 1,
    username: "peter",
    password: "123456",
    displayName: "Peter Hsu",
    email: "peter@example.com",
    avatar: "🌲",
    role: "user",
    joinedAt: "2026-05-01",
    favoriteParkIds: [1, 2]
  },
  {
    id: 2,
    username: "demo",
    password: "demo123",
    displayName: "Demo User",
    email: "demo@example.com",
    avatar: "🏃",
    role: "user",
    joinedAt: "2026-05-03",
    favoriteParkIds: [3]
  },
  {
    id: 3,
    username: "admin",
    password: "admin123",
    displayName: "Admin User",
    email: "admin@example.com",
    avatar: "🛠️",
    role: "admin",
    joinedAt: "2026-04-20",
    favoriteParkIds: []
  }
];

if (typeof module !== "undefined") module.exports = { mockUsers };
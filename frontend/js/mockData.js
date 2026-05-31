const mockParks = [

  // ── Seattle (5 parks) ──────────────────────────────────────────────────────

  {
    id: "1",
    name: "Green Lake Park",
    lat: 47.6796, lng: -122.3251,
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80",
    description: "Popular park for walking, jogging, lake views, and relaxing outdoors.",
    weather: null, score: 83,
    ratings: [{ userId: 1, rating: 5 }, { userId: 2, rating: 4 }, { userId: 3, rating: 4 }],
    posts: [
      {
        id: "post_p1_1",
        user: "User 1", text: "Nice place for walking today.", likes: 12, liked: false,
        timestamp: 1747000000000,
        comments: [
          {
            id: "comment_p1_1_1", user: "User A", text: "Agree! The lake view is really nice.",
            likes: 4, liked: false, repliesVisible: false,
            replies: [
              { id: "reply_p1_1_1_1", user: "User B", text: "Yes! Especially near sunset.", likes: 2, liked: false },
              { id: "reply_p1_1_1_2", user: "User C", text: "I took photos there yesterday.", likes: 1, liked: false }
            ]
          },
          {
            id: "comment_p1_1_2", user: "User F", text: "I came here yesterday evening, it was super packed.",
            likes: 6, liked: false, repliesVisible: false,
            replies: [
              { id: "reply_p1_1_2_1", user: "User G", text: "Yeah evenings are always busy", likes: 2, liked: false },
              { id: "reply_p1_1_2_2", user: "User H", text: "Try early morning instead", likes: 3, liked: false }
            ]
          },
          {
            id: "comment_p1_1_3", user: "User I", text: "Best place to relax after work 👍",
            likes: 10, liked: true, repliesVisible: false,
            replies: [
              { id: "reply_p1_1_3_1", user: "User J", text: "Totally agree!", likes: 1, liked: false }
            ]
          },
          {
            id: "comment_p1_1_4", user: "User K", text: "Is parking easy to find?",
            likes: 2, liked: false, repliesVisible: false,
            replies: [
              { id: "reply_p1_1_4_1", user: "User L", text: "Depends on the time", likes: 1, liked: true },
              { id: "reply_p1_1_4_2", user: "User M", text: "Morning is fine", likes: 1, liked: false },
              { id: "reply_p1_1_4_3", user: "User N", text: "Evening is hard 😅", likes: 2, liked: false }
            ]
          },
          {
            id: "comment_p1_1_5", user: "User O", text: "Weather looks great today!",
            likes: 4, liked: false, repliesVisible: false, replies: []
          }
        ]
      }
    ]
  },

  {
    id: "2",
    name: "Gas Works Park",
    lat: 47.6456, lng: -122.3344,
    image: "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1000&q=80",
    description: "Open outdoor area with city views. Good for short walks, photos, and relaxing outside.",
    weather: null, score: 55,
    ratings: [{ userId: 1, rating: 2 }, { userId: 2, rating: 1 }, { userId: 3, rating: 4 }],
    posts: [
      {
        id: "post_p2_1",
        user: "User P", text: "Great view of the city skyline!", likes: 8, liked: false,
        timestamp: 1747100000000,
        comments: [
          {
            id: "comment_p2_1_1", user: "User Q", text: "Best spot for kite flying too.",
            likes: 3, liked: false, repliesVisible: false, replies: []
          }
        ]
      }
    ]
  },

  {
    id: "3",
    name: "Volunteer Park",
    lat: 47.6300, lng: -122.3150,
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=80",
    description: "Quiet forest-like park area with trees and walking space. Good for a calm outdoor break.",
    weather: null, score: 76,
    ratings: [{ userId: 1, rating: 3 }, { userId: 2, rating: 3 }, { userId: 3, rating: 4 }],
    posts: [
      {
        id: "post_p3_1",
        user: "User R", text: "Very peaceful today.", likes: 5, liked: false,
        timestamp: 1747200000000,
        comments: [
          {
            id: "comment_p3_1_1", user: "User S", text: "Love the old water tower view!",
            likes: 2, liked: false, repliesVisible: false, replies: []
          }
        ]
      }
    ]
  },

  {
    id: "4",
    name: "Discovery Park",
    lat: 47.6575, lng: -122.4096,
    image: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?auto=format&fit=crop&w=1000&q=80",
    description: "Seattle's largest park with sea cliffs, meadows, and forest trails overlooking Puget Sound.",
    weather: null, score: 88,
    ratings: [{ userId: 1, rating: 5 }, { userId: 2, rating: 5 }, { userId: 3, rating: 4 }],
    posts: [
      {
        id: "post_p4_1",
        user: "Hiker_Dave", text: "Walked the Loop Trail this morning — absolutely stunning views of the Sound.",
        likes: 21, liked: false, timestamp: 1747300000000,
        comments: [
          {
            id: "comment_p4_1_1", user: "NatureLover99", text: "Did you see the lighthouse from the bluff?",
            likes: 5, liked: false, repliesVisible: false,
            replies: [
              { id: "reply_p4_1_1_1", user: "Hiker_Dave", text: "Yes! Crystal clear today.", likes: 3, liked: false }
            ]
          }
        ]
      },
      {
        id: "post_p4_2",
        user: "BirdWatcher", text: "Spotted three bald eagles near the south meadow!",
        likes: 34, liked: true, timestamp: 1747350000000,
        comments: []
      }
    ]
  },

  {
    id: "5",
    name: "Lincoln Park",
    lat: 47.5306, lng: -122.3897,
    image: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?auto=format&fit=crop&w=1000&q=80",
    description: "Forested park with beach access, saltwater pool, and trails along the west Seattle shoreline.",
    weather: null, score: 79,
    ratings: [{ userId: 1, rating: 4 }, { userId: 2, rating: 4 }, { userId: 3, rating: 5 }],
    posts: [
      {
        id: "post_p5_1",
        user: "BeachRunner", text: "The shoreline trail is gorgeous, especially with low tide!",
        likes: 16, liked: false, timestamp: 1747400000000,
        comments: [
          {
            id: "comment_p5_1_1", user: "LocalMom", text: "Kids love the tide pools here.",
            likes: 7, liked: false, repliesVisible: false, replies: []
          },
          {
            id: "comment_p5_1_2", user: "BeachRunner", text: "Agreed, great for families!",
            likes: 4, liked: true, repliesVisible: false, replies: []
          }
        ]
      }
    ]
  },

  // ── Taipei (8 parks) ──────────────────────────────────────────────────────

  {
    id: "6",
    name: "Da'an Forest Park",
    lat: 25.0296, lng: 121.5347,
    image: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=1000&q=80",
    description: "Taipei's beloved urban green lung with a lake, jogging paths, and abundant wildlife in the city center.",
    weather: null, score: 85,
    ratings: [{ userId: 1, rating: 5 }, { userId: 2, rating: 4 }, { userId: 3, rating: 5 }],
    posts: [
      {
        id: "post_p6_1",
        user: "TaipeiRunner", text: "Best morning jog spot in the whole city. The air is so fresh!",
        likes: 29, liked: false, timestamp: 1747500000000,
        comments: [
          {
            id: "comment_p6_1_1", user: "YogaFan", text: "I do yoga here every weekend, highly recommend early morning.",
            likes: 11, liked: false, repliesVisible: false,
            replies: [
              { id: "reply_p6_1_1_1", user: "TaipeiRunner", text: "Same! Way less crowded before 7am.", likes: 4, liked: false }
            ]
          }
        ]
      },
      {
        id: "post_p6_2",
        user: "PhotoWalker", text: "The lotus pond is in full bloom right now, gorgeous!",
        likes: 42, liked: true, timestamp: 1747550000000,
        comments: []
      }
    ]
  },

  {
    id: "7",
    name: "Elephant Mountain",
    lat: 25.0274, lng: 121.5773,
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1000&q=80",
    description: "Iconic hiking trail with famous Taipei 101 viewpoints and large boulder formations.",
    weather: null, score: 78,
    ratings: [{ userId: 1, rating: 4 }, { userId: 2, rating: 5 }, { userId: 3, rating: 4 }],
    posts: [
      {
        id: "post_p7_1",
        user: "MountainClimber", text: "The night view of 101 from the top is breathtaking. Worth every step!",
        likes: 55, liked: false, timestamp: 1747600000000,
        comments: [
          {
            id: "comment_p7_1_1", user: "FirstTimer", text: "How long does it take to hike up?",
            likes: 3, liked: false, repliesVisible: false,
            replies: [
              { id: "reply_p7_1_1_1", user: "MountainClimber", text: "About 20-30 minutes from the trailhead.", likes: 6, liked: false }
            ]
          },
          {
            id: "comment_p7_1_2", user: "WeekendHiker", text: "Bring water, the stairs are steep!",
            likes: 14, liked: true, repliesVisible: false, replies: []
          }
        ]
      }
    ]
  },

  {
    id: "8",
    name: "Yangmingshan National Park",
    lat: 25.1575, lng: 121.5619,
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1000&q=80",
    description: "Volcanic mountain park north of Taipei with hot springs, flower seasons, and panoramic city views.",
    weather: null, score: 91,
    ratings: [{ userId: 1, rating: 5 }, { userId: 2, rating: 5 }, { userId: 3, rating: 4 }],
    posts: [
      {
        id: "post_p8_1",
        user: "CherryBlossom", text: "Cherry blossoms are stunning up here right now! Arrived early to avoid the crowd.",
        likes: 78, liked: true, timestamp: 1747650000000,
        comments: [
          {
            id: "comment_p8_1_1", user: "SpringLover", text: "Which trail has the best flowers?",
            likes: 8, liked: false, repliesVisible: false,
            replies: [
              { id: "reply_p8_1_1_1", user: "CherryBlossom", text: "Zhuzihu area is the best for calla lilies and sakura!", likes: 12, liked: false }
            ]
          }
        ]
      },
      {
        id: "post_p8_2",
        user: "SulfurSmell", text: "The fumaroles near the main peak smell strong today but the scenery is unreal.",
        likes: 19, liked: false, timestamp: 1747700000000,
        comments: []
      }
    ]
  },

  {
    id: "9",
    name: "Dajia Riverside Park",
    lat: 25.0757, lng: 121.5368,
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1000&q=80",
    description: "Long riverside greenway along the Keelung River, popular for cycling, BBQ, and family outings.",
    weather: null, score: 72,
    ratings: [{ userId: 1, rating: 3 }, { userId: 2, rating: 4 }, { userId: 3, rating: 4 }],
    posts: [
      {
        id: "post_p9_1",
        user: "CyclistTW", text: "Cycled the full riverside trail today — about 15km round trip, flat and easy!",
        likes: 23, liked: false, timestamp: 1747750000000,
        comments: [
          {
            id: "comment_p9_1_1", user: "FamilyBiker", text: "Is it kid-friendly? My kids are 6 and 8.",
            likes: 5, liked: false, repliesVisible: false,
            replies: [
              { id: "reply_p9_1_1_1", user: "CyclistTW", text: "Very! Completely flat and wide, perfect for kids.", likes: 7, liked: false }
            ]
          }
        ]
      }
    ]
  },

  {
    id: "10",
    name: "Taipei Botanical Garden",
    lat: 25.0317, lng: 121.5085,
    image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1000&q=80",
    description: "Tranquil garden with a beautiful lotus pond, rare plants, and a historic herb garden in Zhongzheng District.",
    weather: null, score: 80,
    ratings: [{ userId: 1, rating: 4 }, { userId: 2, rating: 4 }, { userId: 3, rating: 3 }],
    posts: [
      {
        id: "post_p10_1",
        user: "PlantNerd", text: "The lotus pond is unreal in July. Hundreds of pink flowers all at once.",
        likes: 31, liked: false, timestamp: 1747800000000,
        comments: [
          {
            id: "comment_p10_1_1", user: "Photographer_Lin", text: "Best golden hour shots in Taipei for sure.",
            likes: 9, liked: true, repliesVisible: false, replies: []
          }
        ]
      }
    ]
  },

  {
    id: "11",
    name: "Bitan Scenic Area",
    lat: 24.9558, lng: 121.5426,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80",
    description: "Scenic riverside area in Xindian with paddle boats, suspension bridge, and hillside hiking paths.",
    weather: null, score: 74,
    ratings: [{ userId: 1, rating: 4 }, { userId: 2, rating: 3 }, { userId: 3, rating: 4 }],
    posts: [
      {
        id: "post_p11_1",
        user: "BoatRider", text: "Rented a paddle boat with my girlfriend — super romantic afternoon!",
        likes: 38, liked: true, timestamp: 1747850000000,
        comments: [
          {
            id: "comment_p11_1_1", user: "Couple_Goals", text: "How much to rent a boat?",
            likes: 4, liked: false, repliesVisible: false,
            replies: [
              { id: "reply_p11_1_1_1", user: "BoatRider", text: "Around NT$200 for 30 min last weekend.", likes: 6, liked: false }
            ]
          }
        ]
      }
    ]
  },

  {
    id: "12",
    name: "Maokong Gondola Area",
    lat: 24.9699, lng: 121.5848,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80",
    description: "Tea-growing hillside with gondola rides, tea houses, and panoramic views of Taipei at night.",
    weather: null, score: 87,
    ratings: [{ userId: 1, rating: 5 }, { userId: 2, rating: 4 }, { userId: 3, rating: 5 }],
    posts: [
      {
        id: "post_p12_1",
        user: "TeaLover", text: "Had the best oolong tea with a view of the whole city. Life is good.",
        likes: 47, liked: false, timestamp: 1747900000000,
        comments: [
          {
            id: "comment_p12_1_1", user: "NightOwl_Taipei", text: "Night gondola is 10/10, do not miss it.",
            likes: 18, liked: true, repliesVisible: false, replies: []
          },
          {
            id: "comment_p12_1_2", user: "TeaLover", text: "Agreed, the crystal gondola car at night is magical!",
            likes: 9, liked: false, repliesVisible: false, replies: []
          }
        ]
      }
    ]
  },

  {
    id: "13",
    name: "Zhongshan Park",
    lat: 25.0478, lng: 121.5173,
    image: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1000&q=80",
    description: "Central city park beside the National Theater, great for picnics, tai chi, and evening strolls.",
    weather: null, score: 68,
    ratings: [{ userId: 1, rating: 3 }, { userId: 2, rating: 4 }, { userId: 3, rating: 3 }],
    posts: [
      {
        id: "post_p13_1",
        user: "MorningTaiChi", text: "Joined the elderly tai chi group here at 6am — best way to start the day!",
        likes: 22, liked: false, timestamp: 1747950000000,
        comments: [
          {
            id: "comment_p13_1_1", user: "EarlyBird_TW", text: "They are so welcoming of newcomers too.",
            likes: 8, liked: false, repliesVisible: false, replies: []
          }
        ]
      },
      {
        id: "post_p13_2",
        user: "LunchBreak", text: "Perfect spot to eat lunch and decompress from the office.",
        likes: 14, liked: false, timestamp: 1747960000000,
        comments: []
      }
    ]
  }

];

if (typeof module !== "undefined") module.exports = { mockParks };

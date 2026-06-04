# ParkCast

A web app that recommends Seattle-area parks using real-time weather data, outdoor suitability scores, user ratings, and community posts.

---

## Features

- **Park Map** — Interactive Leaflet map showing all parks with markers
- **Weather Score** — Real-time outdoor suitability score (0–100) calculated from temperature, precipitation, wind speed, and weather code
- **User Ratings** — Star ratings (1–5) per park with live average display
- **Community Posts** — Users can post, comment, reply, and like within each park page
- **Login System** — User authentication backed by DynamoDB
- **Auto Weather Update** — EventBridge triggers Lambda every hour to refresh weather data from Open-Meteo API

---

## Architecture

```
Browser (HTML/CSS/JS + Leaflet)
        │
        ▼
AWS API Gateway
        │
        ▼
AWS Lambda (handler.js)
        │
        ├──► DynamoDB (Parks, Posts, Ratings, Users, Likes, Locations)
        └──► Open-Meteo API (real-time weather)

AWS EventBridge ──► Lambda (hourly weather refresh)
```

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | HTML, CSS, JavaScript, Leaflet.js |
| Backend  | AWS Lambda (Node.js)              |
| Database | AWS DynamoDB                      |
| Weather  | Open-Meteo API (free, no key)     |
| Hosting  | AWS API Gateway                   |
| Schedule | AWS EventBridge (hourly trigger)  |

---

## DynamoDB Tables

| Table     | Partition Key | Sort Key | Description                        |
|-----------|---------------|----------|------------------------------------|
| Parks     | parkId        | —        | Park info, weather, score          |
| Posts     | parkId        | postId   | Community posts per park           |
| Ratings   | parkId        | userId   | One rating per user per park       |
| Users     | username      | —        | User accounts (hashed password)    |
| Likes     | userId        | itemId   | Tracks liked posts/comments/replies|
| Locations | locationId    | —        | Home location weather cache        |

---

## API Endpoints

| Method | Path                                                        | Description              |
|--------|-------------------------------------------------------------|--------------------------|
| GET    | /parks                                                      | List all parks           |
| GET    | /parks/:id                                                  | Get park by ID           |
| GET    | /parks/:id/posts                                            | Get posts for a park     |
| POST   | /parks/:id/posts                                            | Create a post            |
| POST   | /parks/:id/posts/:postId/comments                           | Add a comment            |
| POST   | /parks/:id/posts/:postId/comments/:commentId/replies        | Add a reply              |
| PATCH  | /parks/:id/posts/:postId/like                               | Like/unlike a post       |
| GET    | /parks/:id/ratings                                          | Get ratings for a park   |
| POST   | /parks/:id/ratings                                          | Submit a rating          |
| GET    | /locations/:id                                              | Get location weather     |
| GET    | /likes/:userId                                              | Get user's liked items   |
| POST   | /auth/login                                                 | User login               |
| POST   | /weather/refresh                                            | Manual weather update    |

---

## Local Development

### Frontend

Open any `.html` file in the `frontend/` folder directly in a browser. The frontend connects to the live AWS API by default (`USE_API = true` in `dataService.js`).

To use local mock data instead, set `USE_API = false` in [frontend/js/dataService.js](frontend/js/dataService.js).

### Backend (Lambda)

```bash
cd lambda
npm install
```

Deploy to AWS Lambda or run locally with the Express server:

```bash
node server.js   # local Express server on port 3000
```

### Seed DynamoDB

```bash
cd lambda
node seed.js          # seed all tables
node seed.js likes    # seed only Likes table
```

Requires AWS credentials configured (`aws configure`).

---

## Outdoor Score Formula

Score starts at 100 and is reduced by:

| Condition             | Penalty   |
|-----------------------|-----------|
| Extreme temp (< 0°C or > 35°C) | −40 |
| Rain ≥ 5mm            | −45       |
| Wind ≥ 35 km/h        | −30       |
| Thunderstorm (code ≥ 95) | −40    |
| Moderate rain (code 61–80) | −20  |

Final score is clamped to `[0, 100]`.

---

## Course Info

**CPSC 5110 — Fundamentals of Software Engineering**  
Project: ParkCast

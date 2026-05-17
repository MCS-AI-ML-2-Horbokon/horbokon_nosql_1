db = db.getSiblingDB('spotify');

// Завдання 1. Топ-10 виконавців за середньою популярністю
const topArtists = db.tracks.aggregate([
  { $unwind: "$artists" },
  {
    $group: {
      _id: "$artists",
      tracks_count: { $sum: 1 },
      avg_popularity: { $avg: "$popularity" }
    }
  },
  {
    $match: {
      tracks_count: { $gte: 5 }
    }
  },
  {
    $project: {
      _id: 0,
      artist: "$_id",
      avg_popularity: { $round: ["$avg_popularity", 1] }
    }
  },
  { $sort: { avg_popularity: -1 } },
  { $limit: 10 }
]).toArray();
print("\nЗавдання 1. Топ-10 виконавців за середньою популярністю");
printjson(topArtists);

// Завдання 2. Розподіл треків за настроєм
const moodDistribution = db.tracks.aggregate([
  {
    $project: {
      mood: {
        $switch: {
          branches: [
            { case: { $and: [{ $gte: ["$audio_features.valence", 0.5] }, { $gte: ["$audio_features.energy", 0.5] }] }, then: "happy" },
            { case: { $and: [{ $lt: ["$audio_features.valence", 0.5] }, { $gte: ["$audio_features.energy", 0.5] }] }, then: "angry" },
            { case: { $and: [{ $gte: ["$audio_features.valence", 0.5] }, { $lt: ["$audio_features.energy", 0.5] }] }, then: "calm" },
            { case: { $and: [{ $lt: ["$audio_features.valence", 0.5] }, { $lt: ["$audio_features.energy", 0.5] }] }, then: "sad" }
          ],
          default: "unknown"
        }
      }
    }
  },
  {
    $group: {
      _id: "$mood",
      count: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      mood: "$_id",
      count: 1
    }
  },
  { $sort: { count: -1 } }
]).toArray();
print("\nЗавдання 2. Розподіл треків за настроєм");
printjson(moodDistribution);

// Завдання 3. Найбільш «танцювальний» жанр
const danceableGenres = db.tracks.aggregate([
  {
    $group: {
      _id: "$track_genre",
      avg_danceability: { $avg: "$audio_features.danceability" },
      avg_energy: { $avg: "$audio_features.energy" },
      avg_valence: { $avg: "$audio_features.valence" },
      tracks_count: { $sum: 1 }
    }
  },
  {
    $match: {
      tracks_count: { $gte: 100 }
    }
  },
  {
    $project: {
      _id: 0,
      genre: "$_id",
      avg_danceability: "$avg_danceability",
      avg_energy: "$avg_energy",
      avg_valence: "$avg_valence",
      tracks_count: 1
    }
  },
  { $sort: { avg_danceability: -1 } }
]).toArray();
print("\nЗавдання 3. Найбільш танцювальний жанр (Top 3)");
printjson(danceableGenres.slice(0, 3));

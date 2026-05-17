// Підключення до бази даних
db = db.getSiblingDB('spotify');

// Завдання 1. Треки для вечірки
const partyTracks = db.tracks.find({
  "audio_features.danceability": { $gt: 0.7 },
  "audio_features.energy": { $gt: 0.7 },
  "duration_ms": { $gte: 180000, $lte: 300000 }
}).toArray();
print("\nЗавдання 1. Треки для вечірки:");
print(`Знайдено треків: ${partyTracks.length}`);
print("Декілька прикладів:")
printjson(partyTracks.slice(0, 3));

// Завдання 2. Виконавці, у яких усі треки популярні
const popularArtists = db.tracks.aggregate([
  { $unwind: "$artists" },
  {
    $group: {
      _id: "$artists",
      tracks_count: { $sum: 1 },
      min_popularity: { $min: "$popularity" },
      avg_popularity: { $avg: "$popularity" }
    }
  },
  {
    $match: {
      tracks_count: { $gte: 3 },
      min_popularity: { $gte: 60 }
    }
  },
  { $sort: { avg_popularity: -1 } },
  { $limit: 20 },
  {
    $set: {
      min_popularity: { $round: ["$min_popularity", 1] },
      avg_popularity: { $round: ["$avg_popularity", 1] }
    }
  },
  {
    $project: {
      _id: 0,
      artist: "$_id",
      tracks_count: 1,
      min_popularity: 1,
      avg_popularity: 1
    }
  }
]).toArray();
print("\nЗавдання 2. Виконавці, у яких усі треки популярні:");
printjson(popularArtists);

// Завдання 3. Нетипові треки
const genresWithOutlierTracks = db.tracks.aggregate([
  {
    $group: {
      _id: "$track_genre",
      avg_tempo: { $avg: "$audio_features.tempo" },
      stdDev_tempo: { $stdDevPop: "$audio_features.tempo" },
      tracks: {
        $push: {
          _id: "$_id",
          track_name: "$track_name",
          popularity: "$popularity",
          artists: "$artists",
          audio_features: { tempo: "$audio_features.tempo" }
        }
      }
    }
  },
  {
    $addFields: {
      outlier_threshold: {
        $add: [ "$avg_tempo", { $multiply: [ 2, "$stdDev_tempo" ] } ]
      }
    }
  },
  {
    $project: {
      _id: 0,
      genre: "$_id",
      avg_tempo: 1,
      outlier_threshold: 1,
      outlier_tracks: {
        $filter: {
          input: "$tracks",
          as: "track",
          cond: { $gt: [ "$$track.audio_features.tempo", "$outlier_threshold" ] }
        }
      }
    }
  },
  {
    $match: {
      outlier_tracks: { $ne: [] }
    }
  }
]).toArray();
print("\nЗавдання 3. Нетипові треки");
print(`Знайдено жанрів з нетиповими треками: ${genresWithOutlierTracks.length}`);
print("Приклад (з трьома нетиповими треками):")

const outlierExample = {
  ...genresWithOutlierTracks[0],
  outlier_tracks: genresWithOutlierTracks[0].outlier_tracks.slice(0, 3)
}

printjson(outlierExample);

// Завдання 4: Треки для фонової роботи
print("\nЗавдання 4. Треки для фонової роботи");
const backgroundTracks = db.tracks.find({
  "audio_features.loudness": { $lt: -10 },
  "audio_features.speechiness": { $lt: 0.1 },
  "audio_features.instrumentalness": { $gt: 0.5 },
  "explicit": false
}).toArray();
print(`Знайдено треків: ${backgroundTracks.length}`);
print("Декілька прикладів:")
printjson(backgroundTracks.slice(0, 3));

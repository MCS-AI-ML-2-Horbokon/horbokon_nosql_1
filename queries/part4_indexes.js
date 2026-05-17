db = db.getSiblingDB('spotify');

// Розкоментуйте, якщо виконуєте вдруге
// db.tracks.dropIndex({
//   "track_genre": 1,
//   "popularity": -1,
//   "audio_features.danceability": 1
// });

// Завдання 1. Аналіз запиту та індексація
print("\nЗавдання 1. Аналіз запиту без індексу");

const before = db.tracks.find({
  track_genre: "pop",
  "audio_features.danceability": { $gte: 0.7 }
}).sort({ popularity: -1 }).explain("executionStats");

db.tracks.createIndex({
  "track_genre": 1,
  "popularity": -1,
  "audio_features.danceability": 1
});

const after = db.tracks.find({
  track_genre: "pop",
  "audio_features.danceability": { $gte: 0.7 }
}).sort({ popularity: -1 }).explain("executionStats");


print(`До створення індексу (${before.executionStats.executionTimeMillis} мс, ${before.executionStats.totalDocsExamined} документів оброблено)`)
printjson(before.queryPlanner.winningPlan)

print(`Після створення індексу (${after.executionStats.executionTimeMillis} мс, ${after.executionStats.totalDocsExamined} документів оброблено)`)
printjson(after.queryPlanner.winningPlan)

// Завдання 2. Індекс для інших полів
print("\nЗавдання 2. Складений індекс для фонової музики");
db.tracks.createIndex({
  "explicit": 1,
  "audio_features.instrumentalness": 1,
  "audio_features.speechiness": 1
});

const compositeAfter = db.tracks.find({
  explicit: false,
  "audio_features.speechiness": { $lte: 0.1 },
  "audio_features.instrumentalness": { $gte: 0.5 },
}).explain("executionStats");

printjson(compositeAfter.queryPlanner.winningPlan)

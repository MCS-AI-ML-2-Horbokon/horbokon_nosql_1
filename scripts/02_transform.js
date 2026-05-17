// 1. Створити нову колекцію tracks
// Використовуйте базу spotify.
// Перед трансформацією видаліть стару колекцію tracks, якщо вона існує.
db = db.getSiblingDB('spotify');
db.tracks.drop();

// 2. Проєкція полів
// Залиште лише потрібні поля для аналізу:
// track_id, track_name, album_name, explicit, popularity, duration_ms, track_genre та рядок із артистами (artists_raw)
db.tracks_raw.aggregate([
  {
    $project: {
      _id: 0,
      track_id: 1,
      track_name: 1,
      album_name: 1,
      explicit: 1,
      popularity: 1,
      duration_ms: 1,
      track_genre: 1,
      artists_raw: "$artists",

      // 4. Формування аудіо-характеристик та обчислюваних полів
      // Створіть вкладений об'єкт audio_features, що включає всі аудіофічі: danceability, energy, loudness, speechiness, acousticness, instrumentalness, liveness, valence, tempo, key, mode, time_signature.
      audio_features: {
        danceability: "$danceability",
        energy: "$energy",
        loudness: "$loudness",
        speechiness: "$speechiness",
        acousticness: "$acousticness",
        instrumentalness: "$instrumentalness",
        liveness: "$liveness",
        valence: "$valence",
        tempo: "$tempo",
        key: "$key",
        mode: "$mode",
        time_signature: "$time_signature"
      },
      // Додайте поле duration_sec — тривалість треку в секундах (округлена до одного знака).
      duration_sec: { $round: [{ $divide: ["$duration_ms", 1000] }, 1] },
      // Додайте поле popularity_tier:
      popularity_tier: {
        $switch: {
          branches: [
            { case: { $gte: ["$popularity", 70] }, then: "high" },
            { case: { $gte: ["$popularity", 40] }, then: "medium" }
          ],
          default: "low"
        }
      }
    } // $project
  },
  // 3. Перетворення артистів
  // Розбийте рядок артистів по ; та приберіть пробіли навколо кожного імені.
  // Збережіть результат у полі artists як масив.
  {
    $set: {
      artists: {
        $map: {
          input: { $split: ["$artists_raw", ";"] },
          as: "artist",
          in: {
            $trim: {
              input: "$$artist",
              chars: " "
            }
          }
        } // $map
      }
    } // $set
  },
  // 5. Очищення зайвих полів
  // Приберіть вихідні аудіофічі та поле artists_raw.
  {
    $unset: "artists_raw"
  },
  // 6. Збереження результату
  // Збережіть перетворені документи в колекцію tracks.
  { $out: "tracks" }
]);

// 7. Перевірка результату
// Виведіть кількість документів у tracks.
// Виведіть один приклад документа для перевірки структури.
print(`Кількість документів у tracks: ${db.tracks.countDocuments()}`);
print("Приклад документа:");
printjson(db.tracks.findOne());

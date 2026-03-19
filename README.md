# Vehicle Insurance API

API שרת לקבלת פרטי רכב לפי מספר לוחית — חלק א' בתרגיל הבית של Insait לביטוח רכב.

## ארכיטקטורה

```
Client (Insait Flow) ──POST /vehicle-info──▶ Express Server (Cloud Run)
                                                │
                                         Vehicle Database
                                         (in-memory mock)
```

- **Express.js** — שרת HTTP קל וגמיש
- **CORS** — מאפשר קריאות cross-origin מפלטפורמת Insait
- **Cloud Run** — פריסה serverless על Google Cloud עם Dockerfile

## הרצה מקומית

```bash
npm install
npm start
```

השרת עולה על פורט 8080 (ברירת מחדל).

## Endpoints

### `POST /vehicle-info`

קבלת פרטי רכב לפי מספר לוחית רישוי.

**Request:**
```json
{
  "license_plate": "12345678"
}
```

**Response — הצלחה (200):**
```json
{
  "success": true,
  "data": {
    "license_plate": "12345678",
    "manufacturer": "טויוטה",
    "model": "קורולה",
    "year": 2020,
    "color": "לבן"
  }
}
```

**Response — רכב לא נמצא (404):**
```json
{
  "success": false,
  "error": "Vehicle not found"
}
```

**Response — קלט לא תקין (400):**
```json
{
  "success": false,
  "error": "Invalid license plate format. Expected 7-8 digits."
}
```

### `GET /docs`

תיעוד אוטומטי של ה-API בפורמט JSON.

### `GET /health`

Health check לבדיקת זמינות השרת.

## Edge Cases שטופלו

| מקרה | התנהגות |
|---|---|
| מספר לוחית ריק או חסר | 400 — `license_plate is required` |
| פורמט לא תקין (אותיות, קצר מדי) | 400 — `Invalid license plate format` |
| מספר תקין אבל לא קיים במערכת | 404 — `Vehicle not found` |
| מספר עם מקפים/רווחים (`123-456-78`) | מנוקה אוטומטית ומעובד כרגיל |

## פריסה ל-Google Cloud Run

```bash
# בניית Docker image
gcloud builds submit --tag gcr.io/PROJECT_ID/insait-insurance

# פריסה ל-Cloud Run
gcloud run deploy insait-insurance \
  --image gcr.io/PROJECT_ID/insait-insurance \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## אינטגרציה עם Insait Flow

בשלב "פרטי רכב" בפלואו, מתבצעת קריאת POST ל-endpoint עם מספר הרכב שהמשתמש הזין.
התשובה נשמרת ב-variables של הפלואו ומוצגת למשתמש לאישור.
במקרה שגיאה — מוצגת הודעה מתאימה ואפשרות לנסות שוב.

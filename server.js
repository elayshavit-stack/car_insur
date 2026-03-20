const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

function isValidLicensePlate(plate) {
    if (!plate || typeof plate !== 'string') return false;
    const cleaned = plate.replace(/[-\s]/g, '');
    return /^\d{7,8}$/.test(cleaned);
}

app.post('/vehicle-info', async (req, res) => {
    const { license_plate } = req.body;

    if (!license_plate) {
        return res.status(400).json({ success: false, error: "license_plate is required" });
    }

    if (!isValidLicensePlate(license_plate)) {
        return res.status(400).json({ success: false, error: "Invalid license plate format. Expected 7-8 digits." });
    }

    const cleaned = license_plate.replace(/[-\s]/g, '');

    try {
        const externalApiUrl = 'https://insurance-webhook-945894769129.us-centrall.run.app/vehicle-info'; 
        
        // ביצוע הקריאה לשרת של המטלה
        const apiResponse = await fetch(externalApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ license_plate: cleaned })
        });

        // קבלת התשובה מהשרת
        const data = await apiResponse.json();

        // אם השרת החיצוני החזיר שגיאה (למשל רכב לא נמצא)
        if (!apiResponse.ok || data.success === false) {
            return res.status(apiResponse.status === 200 ? 404 : apiResponse.status).json({
                success: false,
                error: "Vehicle not found in the external database"
            });
        }

        return res.json(data);

    } catch (error) {
        console.error("Error fetching from external API:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error while connecting to external API"
        });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

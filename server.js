const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ה-Mock Database שלך (בדיוק מה שהמטלה דורשת בחלק א')
const vehicleDatabase = {
    "12345678": {
        license_plate: "12345678",
        manufacturer: "טויוטה",
        model: "קורולה",
        year: 2020,
        color: "לבן"
    },
    "87654321": {
        license_plate: "87654321",
        manufacturer: "יונדאי",
        model: "i20",
        year: 2022,
        color: "כסוף"
    }
};

function isValidLicensePlate(plate) {
    if (!plate || typeof plate !== 'string') return false;
    const cleaned = plate.replace(/[-\s]/g, '');
    return /^\d{7,8}$/.test(cleaned);
}

app.post('/vehicle-info', (req, res) => {
    const { license_plate } = req.body;

    if (!license_plate) {
        return res.status(400).json({ success: false, error: "license_plate is required" });
    }

    if (!isValidLicensePlate(license_plate)) {
        return res.status(400).json({ success: false, error: "Invalid license plate format." });
    }

    const cleaned = license_plate.replace(/[-\s]/g, '');
    const vehicle = vehicleDatabase[cleaned];

    if (vehicle) {
        return res.json({
            success: true,
            data: vehicle
        });
    }

    return res.status(404).json({
        success: false,
        error: "Vehicle not found"
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

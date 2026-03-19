const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

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
    },
    "11223344": {
        license_plate: "11223344",
        manufacturer: "מאזדה",
        model: "3",
        year: 2019,
        color: "אדום"
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
        return res.status(400).json({
            success: false,
            error: "license_plate is required"
        });
    }

    if (!isValidLicensePlate(license_plate)) {
        return res.status(400).json({
            success: false,
            error: "Invalid license plate format. Expected 7-8 digits."
        });
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

app.get('/docs', (req, res) => {
    res.json({
        name: "Vehicle Insurance API",
        version: "1.0.0",
        endpoints: [
            {
                method: "POST",
                path: "/vehicle-info",
                description: "Get vehicle information by license plate",
                request: {
                    body: { license_plate: "string (7-8 digits)" }
                },
                responses: {
                    200: { success: true, data: { license_plate: "string", manufacturer: "string", model: "string", year: "number", color: "string" } },
                    400: { success: false, error: "Validation error message" },
                    404: { success: false, error: "Vehicle not found" }
                }
            }
        ]
    });
});

app.get('/health', (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API docs available at http://localhost:${PORT}/docs`);
    console.log(`Health check at http://localhost:${PORT}/health`);
});

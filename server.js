const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const app = express();

app.use(helmet());

app.use(cors({
  origin: ['https://platform.insait.io'],
  methods: ['POST'],
}));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/vehicle-info', limiter);

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
    }
};

function isValidLicensePlate(plate) {
    if (!plate || typeof plate !== 'string') return false;
    const cleaned = plate.replace(/[-\s]/g, '');
    return /^\d{7,8}$/.test(cleaned);
}

async function fetchVehicleFromAPI(licensePlate) {
    const cleaned = licensePlate.replace(/[-\s]/g, '');

    const localVehicle = vehicleDatabase[cleaned];
    if (localVehicle) {
        return { success: true, data: localVehicle };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await axios.post(
            'https://insurance-webhook-945894769129.us-central1.run.app/vehicle-info',
            { license_plate: cleaned },
            { signal: controller.signal, timeout: 5000 }
        );
        return { success: true, data: response.data };
    } catch (err) {
        if (err.code === 'ECONNABORTED' || err.name === 'AbortError') {
            return { success: false, error: 'timeout' };
        }
        return { success: false, error: 'not_found' };
    } finally {
        clearTimeout(timeout);
    }
}

app.post('/vehicle-info', async (req, res) => {
    const { license_plate } = req.body;

    if (!license_plate)
        return res.status(400).json({ success: false, error: 'license_plate is required', error_type: 'validation' });

    if (!isValidLicensePlate(license_plate))
        return res.status(400).json({ success: false, error: 'Invalid format', error_type: 'validation' });

    const result = await fetchVehicleFromAPI(license_plate);

    if (!result.success) {
        const status = result.error === 'timeout' ? 503 : 404;
        return res.status(status).json({
            success: false,
            error: result.error === 'timeout'
                ? 'Service temporarily unavailable'
                : 'Vehicle not found',
            error_type: result.error
        });
    }

    return res.json({ success: true, data: result.data });
});

app.get('/docs', (req, res) => {
    res.json({
        name: "Vehicle Insurance API",
        version: "1.1.0",
        endpoints: [
            {
                method: "POST",
                path: "/vehicle-info",
                description: "Get vehicle information by license plate",
                request: { body: { license_plate: "string (7-8 digits)" } },
                responses: {
                    200: { success: true, data: { license_plate: "string", manufacturer: "string", model: "string", year: "number", color: "string" } },
                    400: { success: false, error: "Validation error", error_type: "validation" },
                    404: { success: false, error: "Vehicle not found", error_type: "not_found" },
                    503: { success: false, error: "Service temporarily unavailable", error_type: "timeout" }
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
});

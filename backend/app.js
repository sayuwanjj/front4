const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = Number(process.env.PORT) || 3000;
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "products.json");
const swaggerDefinition = {
    openapi: "3.0.3",
    info: {
        title: "Users API documentation",
        version: "1.0.0",
        description: "Interactive CRUD documentation for the users resource.",
    },
    servers: [
        {
            url: `http://localhost:${port}`,
            description: "Local development server",
        },
    ],
    tags: [
        {
            name: "Users",
            description: "CRUD operations for users",
        },
    ],
    components: {
        schemas: {
            UserInput: {
                type: "object",
                required: ["name", "category", "description", "price", "stock"],
                properties: {
                    name: { type: "string", example: "Aurora Mechanical Keyboard" },
                    category: { type: "string", example: "Peripherals" },
                    description: {
                        type: "string",
                        example: "Compact 75% keyboard with hot-swap switches and RGB.",
                    },
                    price: { type: "number", format: "float", minimum: 0, example: 109.99 },
                    stock: { type: "integer", minimum: 0, example: 24 },
                    rating: { type: "number", format: "float", minimum: 0, maximum: 5, example: 4.7 },
                    imageUrl: { type: "string", example: "https://example.com/image.jpg" },
                },
            },
            UserPatchInput: {
                type: "object",
                minProperties: 1,
                properties: {
                    name: { type: "string", example: "Aurora Mechanical Keyboard" },
                    category: { type: "string", example: "Peripherals" },
                    description: {
                        type: "string",
                        example: "Compact 75% keyboard with hot-swap switches and RGB.",
                    },
                    price: { type: "number", format: "float", minimum: 0, example: 109.99 },
                    stock: { type: "integer", minimum: 0, example: 24 },
                    rating: { type: "number", format: "float", minimum: 0, maximum: 5, example: 4.7 },
                    imageUrl: { type: "string", example: "https://example.com/image.jpg" },
                },
            },
            ErrorResponse: {
                type: "object",
                properties: {
                    error: { type: "string", example: "Product not found" },
                },
            },
            ValidationErrorResponse: {
                type: "object",
                properties: {
                    error: { type: "string", example: "Validation error" },
                    details: {
                        type: "array",
                        items: { type: "string" },
                        example: ["name is required"],
                    },
                },
            },
        },
    },
};
const swaggerSpec = swaggerJsdoc({
    definition: swaggerDefinition,
    apis: [__filename],
});

app.use(
    cors({
        origin: "http://localhost:3001",
        methods: ["GET", "POST", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get("/api-docs.json", (req, res) => {
    res.json(swaggerSpec);
});

app.use((req, res, next) => {
    res.on("finish", () => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${res.statusCode} ${req.path}`);
        if (["POST", "PATCH", "PUT"].includes(req.method)) {
            console.log("Body:", req.body);
        }
    });
    next();
});

function getDefaultProducts() {
    return [
        {
            id: nanoid(6),
            name: "Aurora Mechanical Keyboard",
            category: "Peripherals",
            description: "Compact 75% keyboard with hot-swap switches and RGB.",
            price: 109.99,
            stock: 24,
            rating: 4.7,
            imageUrl: "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        },
        {
            id: nanoid(6),
            name: "Pulse Wireless Mouse",
            category: "Peripherals",
            description: "Lightweight gaming mouse with 26K DPI sensor.",
            price: 59.5,
            stock: 41,
            rating: 4.5,
            imageUrl: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=800&q=80",
        },
        {
            id: nanoid(6),
            name: "Nebula 27 Monitor",
            category: "Displays",
            description: "27-inch IPS 165Hz monitor with 1440p resolution.",
            price: 299.0,
            stock: 12,
            rating: 4.8,
            imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
        },
        {
            id: nanoid(6),
            name: "Drift USB-C Dock",
            category: "Accessories",
            description: "8-in-1 USB-C dock with HDMI, Ethernet and SD slots.",
            price: 79.0,
            stock: 33,
            rating: 4.4,
            imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
        },
        {
            id: nanoid(6),
            name: "Echo Studio Headset",
            category: "Audio",
            description: "Closed-back headset with detachable boom microphone.",
            price: 129.0,
            stock: 18,
            rating: 4.6,
            imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
        },
        {
            id: nanoid(6),
            name: "Spark Portable SSD 1TB",
            category: "Storage",
            description: "NVMe portable SSD with up to 1050 MB/s transfer speed.",
            price: 119.99,
            stock: 26,
            rating: 4.7,
            imageUrl: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80",
        },
        {
            id: nanoid(6),
            name: "Orbit Webcam Pro",
            category: "Streaming",
            description: "4K webcam with auto-focus and noise-canceling mics.",
            price: 149.0,
            stock: 14,
            rating: 4.3,
            imageUrl: "https://images.unsplash.com/photo-1580906853203-f82db0bd84b2?auto=format&fit=crop&w=800&q=80",
        },
        {
            id: nanoid(6),
            name: "Volt GaN Charger 100W",
            category: "Power",
            description: "Fast multi-port GaN charger for laptop and phone.",
            price: 64.9,
            stock: 57,
            rating: 4.5,
            imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
        },
        {
            id: nanoid(6),
            name: "Atlas Laptop Stand",
            category: "Accessories",
            description: "Adjustable aluminum stand for 13 to 17-inch laptops.",
            price: 39.99,
            stock: 48,
            rating: 4.2,
            imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
        },
        {
            id: nanoid(6),
            name: "Nova Bluetooth Speaker",
            category: "Audio",
            description: "Portable speaker with IPX7 water resistance.",
            price: 89.0,
            stock: 22,
            rating: 4.4,
            imageUrl: "https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=800&q=80",
        },
    ];
}

function saveProductsToFile(nextProducts) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(nextProducts, null, 2), "utf8");
}

function loadProductsFromFile() {
    if (!fs.existsSync(dataFile)) {
        const defaultProducts = getDefaultProducts();
        saveProductsToFile(defaultProducts);
        return defaultProducts;
    }

    try {
        const raw = fs.readFileSync(dataFile, "utf8");
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            throw new Error("Products data must be an array");
        }
        return parsed;
    } catch (error) {
        console.error("Failed to read products from file, restoring defaults.", error);
        const defaultProducts = getDefaultProducts();
        saveProductsToFile(defaultProducts);
        return defaultProducts;
    }
}

let products = loadProductsFromFile();

function findProductOr404(id, res) {
    const product = products.find((item) => item.id === id);
    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }
    return product;
}

function validateString(value, fieldName, errors) {
    if (typeof value !== "string" || !value.trim()) {
        errors.push(`${fieldName} must be a non-empty string`);
    }
}

function validateNumber(value, fieldName, errors, { min = 0, integer = false } = {}) {
    if (!Number.isFinite(Number(value))) {
        errors.push(`${fieldName} must be a valid number`);
        return;
    }

    const parsed = Number(value);
    if (parsed < min) {
        errors.push(`${fieldName} must be >= ${min}`);
    }
    if (integer && !Number.isInteger(parsed)) {
        errors.push(`${fieldName} must be an integer`);
    }
}

function validateProductPayload(body, { partial = false } = {}) {
    if (!body || typeof body !== "object") {
        return ["Request body must be a JSON object"];
    }

    const errors = [];
    const requiredFields = ["name", "category", "description", "price", "stock"];

    if (!partial) {
        requiredFields.forEach((field) => {
            if (body[field] === undefined) {
                errors.push(`${field} is required`);
            }
        });
    }

    if (body.name !== undefined) validateString(body.name, "name", errors);
    if (body.category !== undefined) validateString(body.category, "category", errors);
    if (body.description !== undefined) validateString(body.description, "description", errors);
    if (body.price !== undefined) validateNumber(body.price, "price", errors, { min: 0 });
    if (body.stock !== undefined) validateNumber(body.stock, "stock", errors, { min: 0, integer: true });

    if (body.rating !== undefined) {
        validateNumber(body.rating, "rating", errors, { min: 0 });
        if (Number(body.rating) > 5) {
            errors.push("rating must be <= 5");
        }
    }

    if (body.imageUrl !== undefined && body.imageUrl !== null && typeof body.imageUrl !== "string") {
        errors.push("imageUrl must be a string");
    }

    return errors;
}

function normalizeProductInput(body) {
    return {
        name: body.name?.trim(),
        category: body.category?.trim(),
        description: body.description?.trim(),
        price: body.price !== undefined ? Number(body.price) : undefined,
        stock: body.stock !== undefined ? Number(body.stock) : undefined,
        rating: body.rating !== undefined ? Number(body.rating) : undefined,
        imageUrl: body.imageUrl !== undefined ? String(body.imageUrl).trim() : undefined,
    };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           example: prd001
 *         name:
 *           type: string
 *           example: Aurora Mechanical Keyboard
 *         category:
 *           type: string
 *           example: Peripherals
 *         description:
 *           type: string
 *           example: Compact 75% keyboard with hot-swap switches and RGB.
 *         price:
 *           type: number
 *           format: float
 *           minimum: 0
 *           example: 109.99
 *         stock:
 *           type: integer
 *           minimum: 0
 *           example: 24
 *         rating:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 5
 *           example: 4.7
 *         imageUrl:
 *           type: string
 *           nullable: true
 *           example: https://example.com/image.jpg
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products
 *     description: Returns all products. You can optionally filter by category with the `category` query parameter.
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter products by category.
 *     responses:
 *       200:
 *         description: Products list.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
app.get("/api/products", (req, res) => {
    const category = req.query.category?.trim().toLowerCase();
    const result = category
        ? products.filter((item) => item.category.toLowerCase() === category)
        : products;

    res.json(result);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get user by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get("/api/products/:id", (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;
    res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: User created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */
app.post("/api/products", (req, res) => {
    const errors = validateProductPayload(req.body, { partial: false });
    if (errors.length) {
        return res.status(400).json({ error: "Validation error", details: errors });
    }

    const normalized = normalizeProductInput(req.body);
    const newProduct = {
        id: nanoid(6),
        name: normalized.name,
        category: normalized.category,
        description: normalized.description,
        price: normalized.price,
        stock: normalized.stock,
        rating: normalized.rating ?? 0,
        imageUrl: normalized.imageUrl || "",
    };

    products.push(newProduct);
    saveProductsToFile(products);
    return res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update user by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPatchInput'
 *     responses:
 *       200:
 *         description: User updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.patch("/api/products/:id", (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;

    if (!Object.keys(req.body || {}).length) {
        return res.status(400).json({ error: "Nothing to update" });
    }

    const errors = validateProductPayload(req.body, { partial: true });
    if (errors.length) {
        return res.status(400).json({ error: "Validation error", details: errors });
    }

    const normalized = normalizeProductInput(req.body);
    Object.entries(normalized).forEach(([key, value]) => {
        if (value !== undefined) {
            product[key] = value;
        }
    });

    saveProductsToFile(products);
    return res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete user by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted.
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.delete("/api/products/:id", (req, res) => {
    const exists = products.some((item) => item.id === req.params.id);
    if (!exists) {
        return res.status(404).json({ error: "Product not found" });
    }

    products = products.filter((item) => item.id !== req.params.id);
    saveProductsToFile(products);
    return res.status(204).send();
});

app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

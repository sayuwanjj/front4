const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = Number(process.env.PORT) || 3000;
const dataDir = path.join(__dirname, "data");
const productsFile = path.join(dataDir, "products.json");
const usersFile = path.join(dataDir, "users.json");

const JWT_SECRET = "access_secret"; 
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_SECRET = "refresh_secret";
const REFRESH_EXPIRES_IN = "7d";
const ROLES = {
    USER: "user",
    SELLER: "seller",
    ADMIN: "admin",
};

// --- MIDDLEWARE ---
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const dbUser = users.find((u) => u.id === payload.sub);
        if (!dbUser) return res.status(401).json({ error: "User not found" });
        if (dbUser.blocked) return res.status(403).json({ error: "User is blocked" });
        req.user = payload;
        req.dbUser = dbUser;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

function roleRank(role) {
    switch (role) {
        case ROLES.ADMIN:
            return 3;
        case ROLES.SELLER:
            return 2;
        case ROLES.USER:
            return 1;
        default:
            return 0;
    }
}

function requireRole(minRole) {
    return (req, res, next) => {
        const currentRole = req.dbUser?.role || ROLES.USER;
        if (roleRank(currentRole) < roleRank(minRole)) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        next();
    };
}

function getRefreshTokenFromHeaders(req) {
    const header = req.headers["x-refresh-token"] || req.headers["x-refresh"] || "";
    if (header) return header;
    const auth = req.headers.authorization || "";
    const [scheme, token] = auth.split(" ");
    if (scheme === "Bearer" && token) return token;
    return "";
}

function issueTokens(user) {
    const accessToken = jwt.sign(
        { sub: user.id, username: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
    const refreshToken = jwt.sign(
        { sub: user.id },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
    if (!Array.isArray(user.refresh_tokens)) user.refresh_tokens = [];
    user.refresh_tokens.push(refreshToken);
    save(usersFile, users);
    return { accessToken, refreshToken };
}

// Данные для "быстрого" входа (сидирование)
const SEED_USER = {
    email: "admin@test.com",
    password: "123",
    first_name: "Арина",
    last_name: "Грязнова",
    role: ROLES.ADMIN
};

// --- SWAGGER С АВТОЗАПОЛНЕНИЕМ ПОЛЕЙ ---
const swaggerDocument = {
  openapi: "3.0.3",
  info: { title: "Store API JWT", version: "1.1.0" },
  servers: [{ url: `http://localhost:${port}` }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    },
    schemas: {
      TokenPair: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" }
        }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "u1" },
          email: { type: "string", example: SEED_USER.email },
          first_name: { type: "string", example: SEED_USER.first_name },
          last_name: { type: "string", example: SEED_USER.last_name }
        }
      },
      RegisterInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: SEED_USER.email },
          password: { type: "string", example: SEED_USER.password },
          first_name: { type: "string", example: SEED_USER.first_name },
          last_name: { type: "string", example: SEED_USER.last_name }
        }
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: SEED_USER.email },
          password: { type: "string", example: SEED_USER.password }
        }
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string", example: "p1" },
          title: { type: "string", example: "Notebook" },
          category: { type: "string", example: "Electronics" },
          description: { type: "string", example: "Lightweight laptop" },
          price: { type: "number", example: 999 }
        }
      },
      ProductInput: {
        type: "object",
        properties: {
          title: { type: "string", example: "Notebook" },
          category: { type: "string", example: "Electronics" },
          description: { type: "string", example: "Lightweight laptop" },
          price: { type: "number", example: 999 }
        }
      }
    }
  },
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Регистрация пользователя",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterInput" }
            }
          }
        },
        responses: {
          201: {
            description: "Created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } }
          },
          409: { description: "User already exists" }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Вход в систему",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginInput" }
            }
          }
        },
        responses: {
          200: {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/TokenPair" } } }
          },
          401: { description: "Invalid credentials" }
        }
      }
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Обновление пары токенов",
        parameters: [
          {
            name: "x-refresh-token",
            in: "header",
            required: true,
            schema: { type: "string" },
            description: "Refresh токен"
          }
        ],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/TokenPair" } } } },
          401: { description: "Invalid refresh token" }
        }
      }
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Product" } } } } }
        }
      },
      post: {
        tags: ["Products"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProductInput" } } }
        },
        responses: {
          201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } }
        }
      }
    },
    "/api/products/{id}": {
      get: {
        tags: ["Products"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
          404: { description: "Product not found" }
        }
      },
      put: {
        tags: ["Products"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProductInput" } } }
        },
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
          404: { description: "Product not found" }
        }
      },
      delete: {
        tags: ["Products"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          204: { description: "No Content" },
          401: { description: "Unauthorized" },
          404: { description: "Product not found" }
        }
      }
    }
  }
};

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- РАБОТА С ФАЙЛАМИ И СИДИРОВАНИЕ ---
const load = (f) => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : [];
const save = (f, d) => {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    fs.writeFileSync(f, JSON.stringify(d, null, 2));
};

let products = load(productsFile);
let users = load(usersFile);

const normalizeProductIds = () => {
    const used = new Set();
    let next = 1;
    let changed = false;

    const takeNextAvailable = () => {
        while (used.has(next)) next += 1;
        const value = next;
        used.add(value);
        next += 1;
        return value;
    };

    const parseNumericId = (id) => {
        if (typeof id === "number" && Number.isFinite(id)) return id;
        const str = String(id ?? "");
        const digits = str.match(/\d+/g);
        if (!digits) return null;
        const num = Number(digits.join(""));
        return Number.isFinite(num) && num > 0 ? num : null;
    };

    products = products.map((p) => {
        const parsed = parseNumericId(p.id);
        let newId = parsed;
        if (!newId || used.has(newId)) {
            newId = takeNextAvailable();
        } else {
            used.add(newId);
        }
        if (newId !== p.id) changed = true;
        return { ...p, id: newId };
    });

    if (changed) {
        save(productsFile, products);
    }
};

normalizeProductIds();
let nextProductId = products.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;

let usersChanged = false;
users = users.map((u) => {
    const normalized = {
        ...u,
        role: u.role ?? (u.email === SEED_USER.email ? ROLES.ADMIN : ROLES.USER),
        blocked: u.blocked ?? false,
        refresh_tokens: Array.isArray(u.refresh_tokens) ? u.refresh_tokens : [],
    };
    if (normalized.role !== u.role || normalized.blocked !== u.blocked || normalized.refresh_tokens !== u.refresh_tokens) {
        usersChanged = true;
    }
    return normalized;
});
if (usersChanged) {
    save(usersFile, users);
}

// Если файл users.json пустой, создаем админа автоматически
if (users.length === 0) {
    const hash = bcrypt.hashSync(SEED_USER.password, 10);
    users.push({ id: "seed-id", ...SEED_USER, password: hash, refresh_tokens: [], blocked: false });
    save(usersFile, users);
    console.log("Тестовый пользователь создан: " + SEED_USER.email);
}

// --- МАРШРУТЫ ---
app.post("/api/auth/register", async (req, res) => {
    const { email, first_name, last_name, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    if (users.some(u => u.email === email)) {
        return res.status(409).json({ error: "User already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const newUser = {
        id: nanoid(8),
        email,
        first_name,
        last_name,
        password: hashed,
        refresh_tokens: [],
        role: ROLES.USER,
        blocked: false,
    };
    users.push(newUser);
    save(usersFile, users);
    res.status(201).json({ id: newUser.id, email: newUser.email });
});

app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body || {};
    const user = users.find(u => u.email === email);
    if (user && user.blocked) {
        return res.status(403).json({ error: "User is blocked" });
    }
    if (user && await bcrypt.compare(password, user.password)) {
        const tokens = issueTokens(user);
        return res.json(tokens);
    }
    res.status(401).json({ error: "Invalid credentials" });
});

app.post("/api/auth/refresh", (req, res) => {
    const refreshToken = getRefreshTokenFromHeaders(req);
    if (!refreshToken) return res.status(401).json({ error: "Missing refresh token" });
    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = users.find(u => u.id === payload.sub);
        if (!user || !Array.isArray(user.refresh_tokens) || !user.refresh_tokens.includes(refreshToken)) {
            return res.status(401).json({ error: "Invalid refresh token" });
        }
        if (user.blocked) return res.status(403).json({ error: "User is blocked" });
        user.refresh_tokens = user.refresh_tokens.filter(t => t !== refreshToken);
        const tokens = issueTokens(user);
        return res.json(tokens);
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
    const user = users.find(u => u.id === req.user.sub);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        blocked: user.blocked,
    });
});

app.get("/api/products", authMiddleware, requireRole(ROLES.USER), (req, res) => res.json(products));
app.post("/api/products", authMiddleware, requireRole(ROLES.SELLER), (req, res) => {
    const {
        title,
        name,
        category,
        description,
        price,
        stock,
        rating,
        imageUrl
    } = req.body || {};
    const newP = {
        id: nextProductId,
        title: title ?? name,
        category,
        description,
        price: Number(price),
        stock: stock != null ? Number(stock) : undefined,
        rating: rating != null ? Number(rating) : undefined,
        imageUrl: imageUrl || ""
    };
    products.push(newP);
    nextProductId += 1;
    save(productsFile, products);
    res.status(201).json(newP);
});

app.get("/api/products/:id", authMiddleware, requireRole(ROLES.USER), (req, res) => {
    const product = products.find(p => String(p.id) === String(req.params.id));
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
});

app.put("/api/products/:id", authMiddleware, requireRole(ROLES.SELLER), (req, res) => {
    const idx = products.findIndex(p => String(p.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: "Product not found" });
    const {
        title,
        name,
        category,
        description,
        price,
        stock,
        rating,
        imageUrl
    } = req.body || {};
    const updated = {
        ...products[idx],
        title: title ?? name ?? products[idx].title,
        category: category ?? products[idx].category,
        description: description ?? products[idx].description,
        price: price != null ? Number(price) : products[idx].price,
        stock: stock != null ? Number(stock) : products[idx].stock,
        rating: rating != null ? Number(rating) : products[idx].rating,
        imageUrl: imageUrl != null ? imageUrl : products[idx].imageUrl
    };
    products[idx] = updated;
    save(productsFile, products);
    res.json(updated);
});

app.delete("/api/products/:id", authMiddleware, requireRole(ROLES.ADMIN), (req, res) => {
    const before = products.length;
    products = products.filter(p => String(p.id) !== String(req.params.id));
    if (products.length === before) return res.status(404).json({ error: "Product not found" });
    save(productsFile, products);
    res.status(204).send();
});

app.get("/api/users", authMiddleware, requireRole(ROLES.ADMIN), (req, res) => {
    const list = users.map((u) => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        role: u.role,
        blocked: u.blocked,
    }));
    res.json(list);
});

app.get("/api/users/:id", authMiddleware, requireRole(ROLES.ADMIN), (req, res) => {
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        blocked: user.blocked,
    });
});

app.put("/api/users/:id", authMiddleware, requireRole(ROLES.ADMIN), (req, res) => {
    const idx = users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "User not found" });
    const { email, first_name, last_name, role, blocked } = req.body || {};
    const allowedRoles = new Set([ROLES.USER, ROLES.SELLER, ROLES.ADMIN]);
    if (role && !allowedRoles.has(role)) {
        return res.status(400).json({ error: "Invalid role" });
    }
    const updated = {
        ...users[idx],
        email: email ?? users[idx].email,
        first_name: first_name ?? users[idx].first_name,
        last_name: last_name ?? users[idx].last_name,
        role: role ?? users[idx].role,
        blocked: blocked != null ? Boolean(blocked) : users[idx].blocked,
    };
    users[idx] = updated;
    save(usersFile, users);
    res.json({
        id: updated.id,
        email: updated.email,
        first_name: updated.first_name,
        last_name: updated.last_name,
        role: updated.role,
        blocked: updated.blocked,
    });
});

app.delete("/api/users/:id", authMiddleware, requireRole(ROLES.ADMIN), (req, res) => {
    const idx = users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "User not found" });
    users[idx].blocked = true;
    save(usersFile, users);
    res.status(204).send();
});

app.listen(port, () => console.log(`Сервер: http://localhost:${port}`));

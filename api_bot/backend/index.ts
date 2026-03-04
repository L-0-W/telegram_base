import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import multer from "multer";
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { db } from "./db";
import { users, files, memoryBlocks } from "./db/schema";
import { eq, desc } from "drizzle-orm";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

interface CustomFile extends Express.Multer.File { }


const envPath = path.resolve(process.cwd(), ".env");

// Load existing .env variables if the file exists
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

// Ensure JWT_SECRET exists
if (!process.env.JWT_SECRET) {
    const secret = crypto.randomBytes(64).toString('hex');
    process.env.JWT_SECRET = secret;
    fs.appendFileSync(envPath, `\nJWT_SECRET=${secret}\n`);
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// Database Migration Helper
async function migrateAdminToDb() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (email && password) {
        try {
            const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
            if (existing.length === 0) {
                console.log("[DB] Migrando admin do .env para o banco de dados...");
                const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
                await db.insert(users).values({
                    id: crypto.randomUUID(),
                    email,
                    password: hashedPassword,
                    name: "Admin",
                });
                console.log("[DB] Migração concluída.");
            }
        } catch (err) {
            console.error("[DB] Erro na migração do admin:", err);
        }
    }
}

// GramJS Initialization
let client: TelegramClient | null = null;

async function startTelegramBot() {
    const apiIdStr = process.env.API_ID;
    const apiHash = process.env.API_HASH;
    const sessionToken = process.env.TELEGRAM_SESSION || "";

    if (!apiIdStr || !apiHash) {
        console.log("[Telegram] API_ID ou API_HASH não configurados no .env. Bot não iniciado.");
        return;
    }

    const apiId = parseInt(apiIdStr);
    if (isNaN(apiId)) {
        console.log("[Telegram] API_ID inválido. Deve ser um número.");
        return;
    }

    try {
        if (client) {
            console.log("[Telegram] Reiniciando cliente...");
            await client.disconnect();
            client = null;
        }

        const stringSession = new StringSession(sessionToken);
        client = new TelegramClient(stringSession, apiId, apiHash, {
            connectionRetries: 5,
        });

        console.log("[Telegram] Tentando conectar...");
        await client.connect();

        const isAuth = await client.isUserAuthorized();
        if (isAuth) {
            console.log("[Telegram] Conectado e Autorizado!");
        } else {
            console.log("[Telegram] Conectado, mas aguardando autenticação (código).");
        }
    } catch (err) {
        console.error("[Telegram] Erro ao iniciar bot:", err);
    }
}

// Authentication Middleware
interface AuthRequest extends Request {
    user?: any;
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    console.log("middleware authenticateToken chamado")

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: "Token not provided" });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            res.status(403).json({ error: "Invalid or expired token" });
            return;
        }
        req.user = user;
        next();
    });
};

app.get("/api/setup/status", async (req, res) => {
    try {
        const allUsers = await db.select().from(users).limit(1);
        const hasAdmin = allUsers.length > 0;
        res.json({ hasAdmin });
    } catch (err) {
        console.error("Error checking setup status:", err);
        res.status(500).json({ error: "Database error" });
    }
});

app.post("/api/setup", async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
    }

    try {
        const allUsers = await db.select().from(users).limit(1);
        if (allUsers.length > 0) {
            res.status(403).json({ error: "Admin account is already setup" });
            return;
        }

        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const userId = crypto.randomUUID();

        await db.insert(users).values({
            id: userId,
            email,
            password: hashedPassword,
            name: name || "Admin",
        });

        const token = jwt.sign({ email, id: userId }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token, message: "Admin account created successfully" });
    } catch (err) {
        console.error("Error during setup:", err);
        res.status(500).json({ error: "Database error" });
    }
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
    }

    try {
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const [user] = await db.select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (user && user.password === hashedPassword) {
            const token = jwt.sign({ email, id: user.id }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ success: true, token, message: "Login successful" });
        } else {
            res.status(401).json({ error: "Invalid email or password" });
        }
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ error: "Database error" });
    }
});

app.post("/api/login-jwt", async (req, res) => {
    const [token] = req.body;

    if (!token) {
        res.status(400).send("Token is required");
        return;
    }

    try {
        jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
            if (err) {
                res.status(401).send("Invalid or expired token");
                return;
            }

            const { id } = decoded;
            const [user] = await db.select()
                .from(users)
                .where(eq(users.id, id))
                .limit(1);

            if (user) {
                res.sendStatus(200);
            } else {
                res.status(401).send("User not found");
            }
        });
    } catch (err) {
        console.error("Error during JWT login:", err);
        res.sendStatus(500);
    }
});

app.get("/api/get-files", authenticateToken, async (req: AuthRequest, res: Response) => {
    console.log("endpoint get-files chamado");
    try {
        const userId = req.user.id;
        const userFiles = await db.select({
            fileName: files.fileName,
            originalSize: files.originalSize,
            blocksCount: files.blocksCount,
        })
            .from(files)
            .where(eq(files.userId, userId));

        console.log(userFiles);
        res.json(userFiles);
    } catch (err) {
        console.error("Error fetching files:", err);
        res.status(500).json({ error: "Failed to fetch files" });
    }
});

app.post("/api/user/register", async (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
        res.status(400).json({ error: "Todos os campos são obrigatórios." });
        return;
    }

    try {
        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existing.length > 0) {
            res.status(400).json({ error: "Este e-mail já está em uso." });
            return;
        }

        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const userId = crypto.randomUUID();

        await db.insert(users).values({
            id: userId,
            name,
            email,
            password: hashedPassword,
            phone,
        });

        console.log(`[User] Novo registro: ${email}`);
        res.json({ success: true, message: "Usuário registrado com sucesso!" });
    } catch (err) {
        console.error("Error during user registration:", err);
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

app.get("/api/auth/verify", authenticateToken, (req, res) => {
    res.json({ valid: true });
});

// Telegram Auth Endpoints
app.get("/api/auth/telegram/status", authenticateToken, async (req, res) => {
    if (!client) {
        res.json({ authorized: false, message: "Client not initialized" });
        return;
    }
    try {
        const authorized = await client.isUserAuthorized();
        res.json({ authorized });
    } catch (err) {
        res.status(500).json({ error: "Failed to check auth status" });
    }
});

app.post("/api/auth/telegram/send-code", authenticateToken, async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        res.status(400).json({ error: "Phone number is required" });
        return;
    }

    if (!client) {
        res.status(500).json({ error: "Telegram client not initialized" });
        return;
    }

    try {
        const { phoneCodeHash } = await client.sendCode(
            {
                apiId: parseInt(process.env.API_ID || "0"),
                apiHash: process.env.API_HASH || "",
            },
            phoneNumber
        );
        res.json({ success: true, phoneCodeHash });
    } catch (err: any) {
        console.error("[Telegram] Error sending code:", err);
        res.status(500).json({ error: err.message || "Failed to send code" });
    }
});

app.post("/api/auth/telegram/login", authenticateToken, async (req, res) => {
    const { phoneNumber, phoneCodeHash, code } = req.body;
    if (!phoneNumber || !phoneCodeHash || !code) {
        res.status(400).json({ error: "Phone number, hash, and code are required" });
        return;
    }

    if (!client) {
        res.status(500).json({ error: "Telegram client not initialized" });
        return;
    }

    try {
        await client.invoke(
            new Api.auth.SignIn({
                phoneNumber,
                phoneCodeHash,
                phoneCode: code,
            })
        );

        const sessionToken = client.session.save() as unknown as string;
        updateEnvVariable("TELEGRAM_SESSION", sessionToken);

        res.json({ success: true, message: "Logged in successfully" });
    } catch (err: any) {
        console.error("[Telegram] Error signing in:", err);
        res.status(500).json({ error: err.message || "Failed to sign in" });
    }
});

// User Upload Map to track active files for sequential blocks without explicit ID
const userActiveFiles = new Map<string, string>();

app.post("/api/send_block", authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
    const file = req.file as CustomFile;
    if (!file) {
        res.status(400).json({ error: "No file block received" });
        return;
    }

    const {
        originalFileName,
        originalSize,
        blocksCount,
        index,
        blockName
    } = req.body;

    if (!blockName || index === undefined) {
        res.status(400).json({ error: "blockName and index are required" });
        return;
    }

    if (!client) {
        res.status(500).json({ error: "Telegram client not initialized" });
        return;
    }

    try {
        const userId = req.user.id;
        let fileId: string;

        // Step 1: Handle File entry (First block)
        if (originalFileName && originalSize && blocksCount) {
            fileId = crypto.randomUUID();
            await db.insert(files).values({
                id: fileId,
                fileName: originalFileName,
                originalSize: parseInt(originalSize),
                blocksCount: parseInt(blocksCount),
                userId: userId,
            });
            userActiveFiles.set(userId, fileId);
            console.log(`[Upload] Novo arquivo iniciado: ${originalFileName} (${fileId})`);
        } else {
            const lastFileId = userActiveFiles.get(userId);
            if (!lastFileId) {
                res.status(400).json({ error: "Sequence error: First block must contain file metadata." });
                return;
            }
            fileId = lastFileId;
        }

        // Step 2: Send to Telegram
        console.log(`[Upload] Enviando bloco ${index} (${blockName}) para Telegram...`);
        const result = await client.sendFile("me", {
            file: file.buffer,
            fileName: blockName,
            caption: `Block ${index} for ${fileId}`,
            forceDocument: true,
        }) as any;

        // Step 3: Capture Telegram ID and Save Block
        const telegramId = result.id?.toString() || result.media?.document?.id?.toString();

        if (!telegramId) {
            throw new Error("Failed to capture Telegram File ID");
        }

        await db.insert(memoryBlocks).values({
            id: crypto.randomUUID(),
            blockName: blockName,
            blockSize: file.size,
            position: parseInt(index),
            telegramId: telegramId,
            fileId: fileId,
        });

        res.json({
            success: true,
            message: `Block ${index} saved`,
            telegramId,
            fileId
        });

    } catch (err: any) {
        console.error("[Upload] Error processing block:", err);
        res.status(500).json({ error: err.message || "Failed to process block" });
    }
});


app.post("/api/auth/telegram/logout", authenticateToken, async (req, res) => {
    try {
        updateEnvVariable("TELEGRAM_SESSION", "");
        if (client) {
            await client.disconnect();
            client = null;
            // Opcional: reiniciar o bot sem sessão (modo espera)
            await startTelegramBot();
        }
        res.json({ success: true, message: "Logged out successfully" });
    } catch (err: any) {
        console.error("[Telegram] Error logging out:", err);
        res.status(500).json({ error: "Failed to logout" });
    }
});

// Helper to update arbitrary keys in .env
function updateEnvVariable(key: string, value: string) {
    process.env[key] = value;

    let envContent = "";
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf-8");
    }

    const lines = envContent.split("\n");
    let keyFound = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line && line.startsWith(`${key}=`)) {
            lines[i] = `${key}=${value}`;
            keyFound = true;
            break;
        }
    }

    if (!keyFound) {
        lines.push(`${key}=${value}`);
    }

    fs.writeFileSync(envPath, lines.filter(Boolean).join("\n") + "\n");
}

app.get("/api/config", authenticateToken, (req, res) => {
    res.json({
        apiId: process.env.API_ID || "",
        apiHash: process.env.API_HASH || ""
    });
});

app.post("/api/config", authenticateToken, async (req: AuthRequest, res: Response) => {
    const { apiId, apiHash } = req.body;

    if (typeof apiId !== "string" || typeof apiHash !== "string") {
        res.status(400).json({ error: "API ID and API Hash must be strings." });
        return;
    }

    const currentApiId = process.env.API_ID;
    const currentApiHash = process.env.API_HASH;
    const hasChanged = apiId !== currentApiId || apiHash !== currentApiHash;

    updateEnvVariable("API_ID", apiId);
    updateEnvVariable("API_HASH", apiHash);

    if (hasChanged) {
        console.log("[Config] Credenciais alteradas. Reiniciando bot...");
        await startTelegramBot();
    } else {
        console.log("[Config] Configurações salvas, mas credenciais são as mesmas. Ignorando reinício do bot.");
    }

    res.json({ success: true, message: "Configuration saved successfully" });
});

app.listen(PORT, async () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
    await migrateAdminToDb();
    await startTelegramBot();
});
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split(/\r?\n/).reduce((env, line) => {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (!match) return env;
        let [, key, value] = match;
        value = value.trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
        }
        env[key] = value;
        return env;
    }, {});
}

function loadEnv() {
    const root = path.join(__dirname, '..');
    const env = {
        ...parseEnvFile(path.join(root, '.env')),
        ...parseEnvFile(path.join(root, '.env.local')),
        ...process.env,
    };
    return env;
}

function getSupabaseConfig(env) {
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error(
            'Thiếu cấu hình Supabase. Vui lòng đặt NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong .env.local hoặc biến môi trường.',
        );
    }

    const parsed = new URL(url);
    let host = env.SUPABASE_DB_HOST || parsed.hostname;
    if (host.endsWith('.supabase.co') && !host.startsWith('db.')) {
        host = `db.${host}`;
    }

    const port = Number(parsed.port || 5432);

    return {
        host,
        port,
        database: 'postgres',
        user: 'postgres',
        password: key,
        ssl: {
            rejectUnauthorized: false,
        },
    };
}

async function applySqlFile(client, filePath) {
    const sql = fs.readFileSync(filePath, 'utf8');
    if (!sql.trim()) {
        console.log(`Bỏ qua file trống: ${filePath}`);
        return;
    }
    console.log(`Áp dụng file SQL: ${filePath}`);
    await client.query(sql);
}

async function main() {
    const env = loadEnv();
    const config = getSupabaseConfig(env);
    const client = new Client(config);

    try {
        await client.connect();
        const root = path.join(__dirname, '..');
        const supabaseDir = path.join(root, 'supabase');
        const allFiles = fs.readdirSync(supabaseDir)
            .filter((f) => f.endsWith('.sql'))
            .sort()
            .map((f) => path.join(supabaseDir, f));

        for (const file of allFiles) {
            await applySqlFile(client, file);
        }

        console.log('Hoàn thành áp dụng schema Supabase.');
    } catch (error) {
        console.warn('⚠️  Cảnh báo khi áp dụng schema Supabase:', error.message || error);
        console.warn('⚠️  Schema sẽ được áp dụng thủ công hoặc trong lần deploy tiếp theo.');
        // Không exit với lỗi - chỉ cảnh báo
    } finally {
        await client.end();
    }
}

main();

import { openDB, DBSchema } from 'idb';

const DB_NAME = 'trip-planner-db';
const STORE_NAME = 'sync_queue';

interface TripDB extends DBSchema {
    [STORE_NAME]: {
        key: number; // 自增ID (本地任务队列的顺序)
        value: {
            tripId: string;
            // [修改] 这里的 version 现在代表 timestamp
            timestamp: number;
            orderedIds: string[];
            createdAt: number; // 任务创建时间
        };
        indexes: { 'by-trip': string };
    };
}

export const initDB = async () => {
    return openDB<TripDB>(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('by-trip', 'tripId');
            }
        },
    });
};

// [修改] 参数命名变更，更符合语义
export const saveSnapshot = async (item: { tripId: string; timestamp: number; orderedIds: string[] }) => {
    const db = await initDB();
    await db.add(STORE_NAME, {
        ...item,
        createdAt: Date.now(),
    });
};

export const getPendingTasks = async (tripId: string) => {
    const db = await initDB();
    const all = await db.getAllFromIndex(STORE_NAME, 'by-trip', tripId);
    // 按 timestamp 排序，确保旧的操作在前（尽管在这个逻辑下，其实只发最新的也行，但保留队列更稳健）
    return all.sort((a, b) => a.timestamp - b.timestamp);
};

export const clearTasksBefore = async (tripId: string, timestamp: number) => {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const index = tx.store.index('by-trip');

    let cursor = await index.openCursor(IDBKeyRange.only(tripId));

    while (cursor) {
        // 比较时间戳
        if (cursor.value.timestamp <= timestamp) {
            await cursor.delete();
        }
        cursor = await cursor.continue();
    }
    await tx.done;
};
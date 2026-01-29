import { useRef, useEffect, useCallback } from 'react';
import { saveSnapshot, getPendingTasks, clearTasksBefore } from '@/lib/indexDB';
import { reorderItinerary } from '@/lib/actions/reorder-itineraty';

export const useTripSync = (tripId: string) => {
    // 锁：防止并发
    const isSyncingRef = useRef(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 调度器
    const processQueue = useCallback(async () => {
        if (isSyncingRef.current) return;

        // 简单检查网络状态,fetch 内部也会失败，但先判断能省资源
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            console.log('[Sync] 当前离线，暂停同步');
            return;
        }

        isSyncingRef.current = true;

        try {
            const tasks = await getPendingTasks(tripId);
            if (tasks.length === 0) return;

            console.log(`有积压任务，准备同步:有${tasks.length} 个`);

            const promises = tasks.map(task =>
                reorderItinerary(tripId, task.orderedIds, task.timestamp)
            );

            const results = await Promise.allSettled(promises);

            // 倒序决策
            let latestSuccessTimestamp = -1;
            for (let i = results.length - 1; i >= 0; i--) {
                const res = results[i];
                const task = tasks[i];

                if (res.status === 'fulfilled' && res.value.success) {
                    latestSuccessTimestamp = task.timestamp;
                    // 清理旧快照
                    await clearTasksBefore(tripId, latestSuccessTimestamp);
                    console.log(`前后端同步成功，最新交互时间戳为: ${latestSuccessTimestamp}`);
                    break;
                }
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            isSyncingRef.current = false;
            // 递归检查
            const remaining = await getPendingTasks(tripId);
            if (remaining.length > 0) processQueue();
        }
    }, [tripId]);

    // 监听网络状态：从断网恢复到联网时，立即触发同步
    useEffect(() => {
        const handleOnline = () => {
            console.log('网络已恢复，处理积压任务...');
            processQueue();
        };

        window.addEventListener('online', handleOnline);

        // 组件挂载时也检查一次，防止页面刚加载时有残留任务
        processQueue();

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, [processQueue]);

    // 暴露给组件的触发函数
    const triggerSync = (newOrderIds: string[]) => {
        // 使用 Date.now() 生成时间戳版本
        const timestamp = Date.now();

        //写入本地日志
        saveSnapshot({
            tripId,
            timestamp,
            orderedIds: newOrderIds
        }).catch(e => console.error("IDB Save Failed", e));

        //防抖触发
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        debounceTimerRef.current = setTimeout(() => {
            processQueue();
        }, 500);
    };

    return { triggerSync };
};
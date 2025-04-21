console.log(`插件将自动创建，无需用户执行它们。`);

eagle.onPluginCreate((plugin) => {
    console.log('eagle.onPluginCreate - 插件创建');
    console.log(plugin);
});

eagle.onPluginRun(async () => {
    console.log('eagle.onPluginRun - 插件运行');

    let fileId = null;

    try {
        console.log("正在获取 Eagle 中选中的项目...");
        const selectedItems = await eagle.item.getSelected(); // 获取选中项

        if (selectedItems && selectedItems.length > 0) {
            const firstItem = selectedItems[0]; // 获取第一个选中项
            console.log("选中的第一个项目数据:", firstItem); // 打印完整数据以供参考

            // --- 修正：直接访问 'id' 属性 ---
            // 根据日志显示 #id 存在，并且文档使用 id 作为标识符，尝试直接访问公共 'id' 属性
            if (firstItem && firstItem.id) { // 检查 firstItem 对象存在，并且其 'id' 属性有值（不为 null, undefined, 空字符串等）
                fileId = firstItem.id; // 将获取到的 ID 赋值给 fileId
                console.log(`成功获取到 File ID: ${fileId}`);
            } else {
                // 如果直接访问 firstItem.id 仍然失败，则记录更详细的错误
                console.error('错误：尝试直接访问 firstItem.id 未能获取到有效的 File ID。请再次检查日志中的项目数据结构。', firstItem);
                eagle.showNotification('无法获取选中项的 File ID。请检查项目数据或联系插件开发者。', 'warning');
                return; // 获取失败，停止执行
            }

        } else {
            console.log('用户没有选中任何项目。');
            eagle.showNotification('请先在 Eagle 中选择一个项目。', 'info');
            return; // 没有选中项，停止执行
        }

    } catch (error) {
        console.error('在获取 Eagle 选中项或 File ID 时发生错误:', error);
        eagle.showNotification('获取选中项信息时出错，请重试或检查插件。', 'error');
        return; // 发生错误，停止执行
    }

    // 如果成功获取到了 fileId
    if (fileId) {
        // 构建 Obsidian Search URI
        const encodedFileId = encodeURIComponent(fileId); // 对 ID 进行 URL 编码
        const obsidianSearchUri = `obsidian://search?vault=adbba5532cfb5f8d&query=${encodedFileId}`;
        console.log(`构建完成的 Obsidian URI: ${obsidianSearchUri}`);

        // 尝试打开 URI
        try {
            // --- 确认并使用正确的函数打开 URL ---
            if (typeof eagle.openUrl === 'function') {
                 eagle.openUrl(obsidianSearchUri);
                 console.log(`尝试通过 eagle.openUrl 打开 URI`);
            } else if (typeof eagle.shell === 'object' && typeof eagle.shell.openExternal === 'function') {
                 eagle.shell.openExternal(obsidianSearchUri);
                 console.log(`尝试通过 eagle.shell.openExternal 打开 URI`);
            }
            // ... 其他可能的打开方式 ...
            else {
                console.error('错误：在 Eagle API 中未找到用于打开外部 URL 的函数。');
                eagle.showNotification('无法打开链接，请检查插件或 Eagle 版本。', 'error');
            }
        } catch (error) {
            console.error('尝试打开 Obsidian URI 时发生错误:', error);
            eagle.showNotification('打开 Obsidian 链接时出错。', 'error');
        }
    }
});

// eagle.onPluginShow(() => {
//     console.log('eagle.onPluginShow - 插件显示');
// });

// eagle.onPluginHide(() => {
//     console.log('eagle.onPluginHide - 插件隐藏');
// });
// plugin.js 最后一行加上
setTimeout(() => {
    window.close();  // 关闭当前插件窗口
}, 500);  // 延时一点时间，确保日志打印完
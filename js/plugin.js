console.log(`插件将自动创建，无需用户执行它们。`);

eagle.onPluginCreate((plugin) => {
    console.log('eagle.onPluginCreate - 插件创建');
    console.log(plugin);
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('eagle.onPluginRun - 插件运行');

    let fileId = null;

    // 获取选中项的逻辑
    eagle.onPluginRun(async () => {
        try {
            console.log("正在获取 Eagle 中选中的项目...");
            const selectedItems = await eagle.item.getSelected(); // 获取选中项

            if (selectedItems && selectedItems.length > 0) {
                const firstItem = selectedItems[0]; // 获取第一个选中项
                console.log("选中的第一个项目数据:", firstItem);

                if (firstItem && firstItem.id) {
                    fileId = firstItem.id;
                    console.log(`成功获取到 File ID: ${fileId}`);
                } else {
                    console.error('错误：尝试直接访问 firstItem.id 未能获取到有效的 File ID。', firstItem);
                    eagle.showNotification('无法获取选中项的 File ID。请检查项目数据或联系插件开发者。', 'warning');
                    return;
                }
            } else {
                console.log('用户没有选中任何项目。');
                eagle.showNotification('请先在 Eagle 中选择一个项目。', 'info');
                return;
            }
        } catch (error) {
            console.error('在获取 Eagle 选中项或 File ID 时发生错误:', error);
            eagle.showNotification('获取选中项信息时出错，请重试或检查插件。', 'error');
            return;
        }
    });

    // 动态添加输入框和按钮的逻辑
    const vaultsContainer = document.getElementById('vaults-container');
    const addVaultButton = document.getElementById('add-vault');

    // Debounce 函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // 将 saveVaults 定义移到外部
    const saveVaults = () => {
        const vaults = Array.from(vaultsContainer.querySelectorAll('.vault-entry')).map(div => {
            const aliasElement = div.querySelector('input[placeholder="obsidian vault name"]');
            const vaultIdElement = div.querySelector('input[placeholder="obsidian vault id"]');
            
            const alias = aliasElement ? aliasElement.value.trim() : '';
            const vaultId = vaultIdElement ? vaultIdElement.value.trim() : '';
            
            return { alias, vaultId };
        }).filter(({ vaultId }) => vaultId);
        localStorage.setItem('vaults', JSON.stringify(vaults));
    };

    // 创建 saveVaults 的 debounced 版本
    const debouncedSaveVaults = debounce(saveVaults, 250);

    // 在 vaultsContainer 上使用事件委托处理 input 事件
    vaultsContainer.addEventListener('input', (event) => {
        if (event.target.matches('input[placeholder="obsidian vault name"]') || event.target.matches('input[placeholder="obsidian vault id"]')) {
            debouncedSaveVaults();
        }
    });

    // 在 vaultsContainer 上添加粘贴事件的监听
    vaultsContainer.addEventListener('paste', (event) => {
        if (event.target.matches('input[placeholder="obsidian vault name"]') || event.target.matches('input[placeholder="obsidian vault id"]')) {
            event.preventDefault();
            const pastedText = (event.clipboardData || window.clipboardData).getData('text');
            event.target.value = pastedText;
            debouncedSaveVaults();
        }
    });

    // 从 localStorage 加载地址和别名
    const savedVaults = JSON.parse(localStorage.getItem('vaults') || '[]');
    savedVaults.forEach(({ vaultId, alias }) => {
        addVaultInput(vaultId, alias, vaultsContainer, saveVaults); // 删除时仍直接调用 saveVaults
    });

    addVaultButton.textContent = '➕'; // 使用 Unicode 图标替换文本

    // 确保退出按钮只添加一次
    if (!document.getElementById('exit-button')) {
        const exitButton = document.createElement('button');
        exitButton.id = 'exit-button';
        exitButton.textContent = '❌'; // 使用 Unicode 图标替换文本
        exitButton.addEventListener('click', () => {
            window.close();
        });
        document.body.appendChild(exitButton);
    }

    addVaultButton.addEventListener('click', () => {
        addVaultInput('', '', vaultsContainer, saveVaults); // 删除时仍直接调用 saveVaults
    });

    // 修改 addVaultInput 函数签名以接收 container 和 saveFunc (用于删除)
    function addVaultInput(initialVaultId, initialAlias, container, saveFunc) {
        const vaultDiv = document.createElement('div');
        vaultDiv.className = 'vault-entry';  // 添加类名以应用样式
        
        const aliasInput = document.createElement('input');
        aliasInput.type = 'text';
        aliasInput.placeholder = 'obsidian vault name';
        aliasInput.value = initialAlias;

        const vaultInput = document.createElement('input');
        vaultInput.type = 'text';
        vaultInput.placeholder = 'obsidian vault id';
        vaultInput.value = initialVaultId;
        
        // 替换跳转按钮为图标
        const jumpIcon = document.createElement('span');
        jumpIcon.textContent = '➡️'; // 使用 Unicode 字符
        jumpIcon.style.cursor = 'pointer';
        jumpIcon.addEventListener('click', () => {
            const vaultId = vaultInput.value.trim();
            if (vaultId && fileId) {
                const encodedFileId = encodeURIComponent(fileId);
                const obsidianSearchUri = `obsidian://search?vault=${vaultId}&query=${encodedFileId}`;
                if (typeof eagle.shell === 'object' && typeof eagle.shell.openExternal === 'function') {
                    eagle.shell.openExternal(obsidianSearchUri);
                    console.log(`尝试通过 eagle.shell.openExternal 打开 URI`);
                    setTimeout(() => {
                        window.close();
                    }, 500);
                } else {
                    console.error('错误：在 Eagle API 中未找到用于打开外部 URL 的函数。');
                    eagle.showNotification('无法打开链接，请检查插件或 Eagle 版本。', 'error');
                }
            } else {
                console.error('错误：未能获取到有效的 vaultId 或 fileId。');
                eagle.showNotification('请确保已选择项目并输入有效的仓库地址。', 'warning');
            }
        });

        // 替换删除按钮为图标
        const deleteIcon = document.createElement('span');
        deleteIcon.textContent = '🗑️'; // 使用 Unicode 字符
        deleteIcon.style.cursor = 'pointer';
        deleteIcon.addEventListener('click', () => {
            vaultDiv.remove();
            saveFunc(); // 删除时立即保存，调用原始 saveVaults
        });

        vaultDiv.appendChild(deleteIcon);
        vaultDiv.appendChild(aliasInput);
        vaultDiv.appendChild(vaultInput);
        vaultDiv.appendChild(jumpIcon);
        container.appendChild(vaultDiv); // 使用传入的 container
    }
});

// eagle.onPluginShow(() => {
//     console.log('eagle.onPluginShow - 插件显示');
// });

// eagle.onPluginHide(() => {
//     console.log('eagle.onPluginHide - 插件隐藏');
// });
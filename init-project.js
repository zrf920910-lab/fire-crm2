const fs = require('fs');
const path = require('path');

// 所有项目文件的内容配置
const projectFiles = {
  // 1. package.json
  "package.json": `{
  "name": "fire-crm-firebase",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "firebase": "^10.12.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.1"
  }
}`,

  // 2. vite.config.js
  "vite.config.js": `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()]
})`,

  // 3. tailwind.config.js
  "tailwind.config.js": `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}`,

  // 4. postcss.config.js
  "postcss.config.js": `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,

  // 5. index.html
  "index.html": `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>消防器材智能 CRM</title>
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="apple-touch-icon" href="/icon-192.png">
    <link rel="manifest" href="/manifest.json" />
  </head>
  <body class="bg-slate-100 text-slate-900 antialiased overflow-x-hidden select-none">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker 注册成功:', reg.scope))
            .catch(err => console.log('Service Worker 注册失败:', err));
        });
      }
    </script>
  </body>
</html>`,

  // 6. .gitignore
  ".gitignore": `node_modules
dist
.DS_Store
.env
.vercel`,

  // 7. public/manifest.json
  "public/manifest.json": `{
  "short_name": "消防CRM",
  "name": "消防器材智能 CRM 管理系统",
  "icons": [
    {
      "src": "/icon-192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "/icon-512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": "/",
  "background_color": "#f8fafc",
  "theme_color": "#ef4444",
  "display": "standalone",
  "orientation": "portrait"
}`,

  // 8. public/sw.js
  "public/sw.js": `const CACHE_NAME = 'fire-crm-firebase-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});`,

  // 9. src/firebase.js
  "src/firebase.js": `import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 请在此替换为您在 Firebase Console -> 项目设置 中获取到的真实配置
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);`,

  // 10. src/index.css
  "src/index.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

/* 隐藏滚动条以带来更原生APP的质感 */
::-webkit-scrollbar {
  display: none;
}

body {
  -webkit-tap-highlight-color: transparent;
}

/* 打印 PDF 专用样式 */
@media print {
  body {
    background-color: white !important;
    color: black !important;
  }
  .no-print {
    display: none !important;
  }
  .print-area {
    width: 100% !important;
    max-width: 100% !important;
    position: absolute;
    left: 0;
    top: 0;
    margin: 0;
    padding: 20px;
    box-shadow: none !important;
    border: none !important;
  }
}`,

  // 11. src/main.jsx
  "src/main.jsx": `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,

  // 12. src/App.jsx (包含写锁防覆盖逻辑)
  "src/App.jsx": `import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// 初始默认模拟演示数据
const defaultSkus = [
  { id: '1', name: '手提式干粉灭火器', price: 45, brand: '消防先锋', model: 'MFZ/ABC4', unit: '具', note: '常用规格', updatedAt: new Date().toLocaleString() },
  { id: '2', name: '感烟探测器', price: 28, brand: '智能安防', model: 'JTY-GD-FSP5', unit: '个', note: '工程款', updatedAt: new Date().toLocaleString() }
];

const defaultClients = [
  { id: 'c1', name: '恒大消防工程公司', contact: '张经理', skuPrices: { '1': 55, '2': 35 }, updatedAt: new Date().toLocaleString() },
  { id: 'c2', name: '万科物业管理部', contact: '李主管', skuPrices: { '1': 58 }, updatedAt: new Date().toLocaleString() }
];

export default function App() {
  // ---- 1. 本地状态 ----
  const [skus, setSkus] = useState(() => JSON.parse(localStorage.getItem('crm_skus')) || defaultSkus);
  const [clients, setClients] = useState(() => JSON.parse(localStorage.getItem('crm_clients')) || defaultClients);
  const [recycleBin, setRecycleBin] = useState(() => JSON.parse(localStorage.getItem('crm_recycle_bin')) || []);
  const [currentTab, setCurrentTab] = useState('home'); // home, sales, quote, contract, backup
  
  // 基础文档设定
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('crm_comp_name') || '消防器材智能设备有限公司');
  const [creatorName, setCreatorName] = useState(() => localStorage.getItem('crm_creator') || '张三');

  // ---- 2. Firebase 安全与多端状态 ----
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [databaseReady, setDatabaseReady] = useState(false); // 🚨 核心写入锁：默认为关闭状态 (false)
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => localStorage.getItem('crm_last_sync') || '本地离线存储');
  
  // 登录认证表单
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // ---- 3. UI 交互控制状态 ----
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSku, setSelectedSku] = useState(null);
  const [showAddSkuModal, setShowAddSkuModal] = useState(false);
  const [addSkuTab, setAddSkuTab] = useState('single'); // single, batch
  const [batchPasteText, setBatchPasteText] = useState('');
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [notification, setNotification] = useState(null);

  // ---- 4. 业务单据编辑状态 ----
  const [activeClient, setActiveClient] = useState('');
  const [activeItems, setActiveItems] = useState([]); // [{ skuId, qty, price }]
  const [documentNo, setDocumentNo] = useState('XF-' + Date.now().toString().slice(-6));
  const [activeDate, setActiveDate] = useState(() => new Date().toISOString().split('T')[0]);

  // ==========================================
  // 🛡️ 底层防御：登录监听与【单向安全下载】
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser) {
        setIsCloudSyncing(true);
        try {
          // 锁死写入锁，防止在此阶段将默认初始数据上传到云端覆盖客户的原数据
          setDatabaseReady(false);

          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const cloudData = docSnap.data();
            // 安全防线：如果云端确实存在数据才将其写入本地，否则不覆盖
            if (cloudData.skus) setSkus(cloudData.skus);
            if (cloudData.clients) setClients(cloudData.clients);
            if (cloudData.recycleBin) setRecycleBin(cloudData.recycleBin);
            setLastSyncTime(cloudData.lastSyncTime || '已安全拉取云端');
            showToast("已成功下载拉取云端历史数据，状态已激活");
          } else {
            // 云端没有任何数据（首次注册登录的新账户），自动用当前本地临时数据初始化云端数据库
            await setDoc(docRef, {
              skus,
              clients,
              recycleBin,
              lastSyncTime: new Date().toLocaleString()
            });
            setLastSyncTime(new Date().toLocaleString());
            showToast("成功初始化云端数据库");
          }
        } catch (error) {
          showToast("云端同步初始化失败: " + error.message);
        } finally {
          setIsCloudSyncing(false);
          // 🚨 云端下载和确认工作全部结束，安全释放写入锁！
          setDatabaseReady(true);
        }
      } else {
        // 未登录状态，禁止向云端上行任何修改
        setDatabaseReady(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ==========================================
  // 🛡️ 底层防御：自动同步到云端（带防抖和写锁防护）
  // ==========================================
  useEffect(() => {
    // 必须通过 databaseReady 安全释放检测，才允许进行 Firestore 上传更新
    if (!user || !databaseReady) return;

    const autoSaveToCloud = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const now = new Date().toLocaleString();
        
        await setDoc(docRef, {
          skus,
          clients,
          recycleBin,
          lastSyncTime: now
        }, { merge: true });

        setLastSyncTime(now);
        localStorage.setItem('crm_last_sync', now);
      } catch (error) {
        console.error("Firebase 云端同步失败:", error);
      }
    };

    // 2秒的延时，避免频繁写操作产生过多无意义数据库并发调用
    const delayTimer = setTimeout(autoSaveToCloud, 2000);
    return () => clearTimeout(delayTimer);
  }, [skus, clients, recycleBin, user, databaseReady]);

  // 本地 LocalStorage 做双冗余，无网环境也可完整备份
  useEffect(() => {
    localStorage.setItem('crm_skus', JSON.stringify(skus));
    localStorage.setItem('crm_clients', JSON.stringify(clients));
    localStorage.setItem('crm_recycle_bin', JSON.stringify(recycleBin));
  }, [skus, clients, recycleBin]);

  // 通用吐司提醒
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // ---- 业务处理：新增 SKU ----
  const handleAddSku = (newSku) => {
    const skuWithId = { 
      ...newSku, 
      id: Date.now().toString(),
      price: Number(newSku.price) || 0,
      updatedAt: new Date().toLocaleString()
    };
    setSkus([skuWithId, ...skus]);
    showToast(\`已新增SKU: \${newSku.name}\`);
  };

  // CSV表格文件解析
  const handleCsvImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\\n');
      const newSkusList = [];
      const startIdx = (lines[0].includes('名称') || lines[0].includes('品名') || lines[0].includes('name')) ? 1 : 0;
      
      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));
        if (cols[0]) {
          newSkusList.push({
            id: (Date.now() + i).toString(),
            name: cols[0],
            price: Number(cols[1]) || 0,
            brand: cols[2] || '',
            model: cols[3] || '',
            unit: cols[4] || '个',
            note: cols[5] || '',
            updatedAt: new Date().toLocaleString()
          });
        }
      }

      if (newSkusList.length > 0) {
        setSkus(prev => [...newSkusList, ...prev]);
        showToast(\`成功导入 \${newSkusList.length} 个 SKU\`);
        setShowAddSkuModal(false);
      } else {
        showToast("未检测到有效数据");
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // 解析并导入从 Excel 直接复制粘贴的文本数据
  const handleBatchTextImport = () => {
    if (!batchPasteText.trim()) return;

    const lines = batchPasteText.split('\\n');
    const newSkusList = [];

    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      const delimiter = trimmedLine.includes('\\t') ? '\\t' : ',';
      const cols = trimmedLine.split(delimiter).map(col => col.trim());

      if (cols[0]) {
        newSkusList.push({
          id: (Date.now() + idx).toString(),
          name: cols[0],
          price: Number(cols[1]) || 0,
          brand: cols[2] || '',
          model: cols[3] || '',
          unit: cols[4] || '个',
          note: cols[5] || '',
          updatedAt: new Date().toLocaleString()
        });
      }
    });

    if (newSkusList.length > 0) {
      setSkus(prev => [...newSkusList, ...prev]);
      showToast(\`成功批量导入 \${newSkusList.length} 个 SKU\`);
      setBatchPasteText('');
      setShowAddSkuModal(false);
    } else {
      showToast("解析格式失败");
    }
  };

  const handleEditSku = (updatedSku) => {
    setSkus(skus.map(item => item.id === updatedSku.id ? { ...updatedSku, price: Number(updatedSku.price), updatedAt: new Date().toLocaleString() } : item));
    showToast(\`已修改SKU: \${updatedSku.name}\`);
  };

  const handleDeleteSku = (skuId) => {
    const target = skus.find(item => item.id === skuId);
    if (target) {
      setRecycleBin([...recycleBin, { type: 'sku', data: target, deletedAt: new Date().toLocaleString() }]);
      setSkus(skus.filter(item => item.id !== skuId));
      showToast(\`已将 "\${target.name}" 移至回收站\`);
    }
  };

  const handleDeleteClient = (clientId) => {
    const target = clients.find(item => item.id === clientId);
    if (target) {
      setRecycleBin([...recycleBin, { type: 'client', data: target, deletedAt: new Date().toLocaleString() }]);
      setClients(clients.filter(item => item.id !== clientId));
      showToast(\`已将客户 "\${target.name}" 移至回收站\`);
    }
  };

  // 恢复回收站数据
  const handleRestore = (index) => {
    const item = recycleBin[index];
    if (item.type === 'sku') {
      setSkus([item.data, ...skus]);
    } else if (item.type === 'client') {
      setClients([item.data, ...clients]);
    }
    const updatedBin = [...recycleBin];
    updatedBin.splice(index, 1);
    setRecycleBin(updatedBin);
    showToast("数据已成功拉回");
  };

  // 快捷检索建议
  const filteredSkus = useMemo(() => {
    if (!searchQuery) return skus;
    return skus.filter(sku => 
      sku.name.includes(searchQuery) || 
      (sku.brand && sku.brand.includes(searchQuery)) ||
      (sku.model && sku.model.includes(searchQuery))
    );
  }, [skus, searchQuery]);

  // ---- 智能开单、子售价绑定逻辑 ----
  const handleSelectClientForDoc = (clientName) => {
    setActiveClient(clientName);
    const clientExists = clients.some(c => c.name === clientName);
    if (clientName && !clientExists) {
      const newClient = {
        id: 'c_' + Date.now(),
        name: clientName,
        contact: '默认联系人',
        skuPrices: {},
        updatedAt: new Date().toLocaleString()
      };
      setClients([...clients, newClient]);
      showToast(\`已自动将新客户 "\${clientName}" 登记入库\`);
    }
  };

  const handleAddSkuToDoc = (skuId) => {
    const targetSku = skus.find(s => s.id === skuId);
    if (!targetSku) return;

    const clientObj = clients.find(c => c.name === activeClient);
    const savedClientPrice = clientObj?.skuPrices?.[skuId] || 0;

    setActiveItems([...activeItems, {
      skuId: targetSku.id,
      qty: 1,
      price: savedClientPrice
    }]);
  };

  // 变更开单时的售价时（自动更新至该客户名下的次生SKU子价格中，不破坏原生SKU库进货底价）
  const handleDocPriceChange = (index, newPrice) => {
    const updated = [...activeItems];
    updated[index].price = Number(newPrice) || 0;
    setActiveItems(updated);

    const currentItem = updated[index];
    if (activeClient) {
      setClients(prevClients => prevClients.map(c => {
        if (c.name === activeClient) {
          return {
            ...c,
            skuPrices: { ...c.skuPrices, [currentItem.skuId]: Number(newPrice) },
            updatedAt: new Date().toLocaleString()
          };
        }
        return c;
      }));
    }
  };

  // ---- 手动强制重载同步云端（强覆盖本地） ----
  const handleForcePullFromCloud = async () => {
    if (!user) {
      showToast("请先登录账户");
      return;
    }
    if (confirm("🚨 警告：重新下载覆盖后，您当前设备上所有未提交的临时改动都将被云端记录替换。\\n\\n确认强行同步吗？")) {
      setIsCloudSyncing(true);
      setDatabaseReady(false); // 闭锁
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const cloudData = docSnap.data();
          if (cloudData.skus) setSkus(cloudData.skus);
          if (cloudData.clients) setClients(cloudData.clients);
          if (cloudData.recycleBin) setRecycleBin(cloudData.recycleBin);
          showToast("已重置本地并加载云端最新状态");
        }
      } catch (e) {
        showToast("重拉失败: " + e.message);
      } finally {
        setIsCloudSyncing(false);
        setDatabaseReady(true); // 解锁
      }
    }
  };

  // Firebase 登录注册方法
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      showToast("请填写完整的账号密码");
      return;
    }
    setIsCloudSyncing(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        showToast("注册成功！数据通道已为您自动分配");
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        showToast("登录成功，正在检索您的专属数据库...");
      }
    } catch (err) {
      showToast("操作失败: " + err.message);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const triggerPdfPrint = () => {
    if (!activeClient) {
      showToast("请先选择或录入客户名称");
      return;
    }
    window.print();
  };

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col relative">
      
      {/* 1. iOS 原生风格毛玻璃页眉 */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/70 border-b border-white/20 px-4 py-3 flex items-center justify-between shadow-sm no-print">
        <div className="flex items-center space-x-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 active:scale-95 transition-transform">
            <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-lg text-slate-800 tracking-wide">消防器材CRM</span>
        </div>
        <div className="flex items-center space-x-2">
          {currentTab === 'home' && (
            <button 
              onClick={() => {
                setAddSkuTab('single');
                setShowAddSkuModal(true);
              }} 
              className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-1.5 rounded-full text-sm shadow-md shadow-red-200 active:scale-95 transition-all flex items-center space-x-1 animate-pulse"
            >
              <span>+ 添加SKU</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. 核心主看板 */}
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        
        {/* TAB 1: 首页 */}
        {currentTab === 'home' && (
          <div className="space-y-4 no-print">
            {/* 顶端快捷搜索 */}
            <div className="relative">
              <input
                type="text"
                placeholder="搜索 SKU 名称 / 品牌 / 型号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 pl-11 outline-none text-slate-700 placeholder-slate-400 focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all shadow-sm"
              />
              <svg className="w-5 h-5 text-slate-400 absolute left-4 top-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* 列表看板 */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-slate-800 text-md">原生 SKU 进货价库 ({filteredSkus.length})</h2>
                <button onClick={handleExportData} className="text-xs text-slate-500 hover:text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                  备份本地数据(JSON)
                </button>
              </div>

              {filteredSkus.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">暂无符合条件的产品</div>
              ) : (
                <div className="space-y-2">
                  {filteredSkus.map((sku) => (
                    <div 
                      key={sku.id} 
                      onClick={() => setSelectedSku(sku)}
                      className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl hover:bg-slate-100/70 transition-all cursor-pointer border border-transparent hover:border-slate-100"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{sku.name}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {sku.brand || '无品牌'} · {sku.model || '无型号'} · {sku.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-red-500">￥{sku.price} 元</div>
                        <div className="text-[10px] text-slate-400 mt-1">原生进售价</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: 销售单 */}
        {currentTab === 'sales' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4 no-print">
              <h3 className="font-semibold text-slate-800">开送货单控制台</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">销售公司名</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">客户名称 (支持自动登记)</label>
                  <input type="text" value={activeClient} onChange={e => handleSelectClientForDoc(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm" placeholder="请选择或输入" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">单据日期</label>
                  <input type="date" value={activeDate} onChange={e => setActiveDate(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">制单员</label>
                  <input type="text" value={creatorName} onChange={e => setCreatorName(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">点击下方产品加入明细：</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto py-1">
                  {skus.map(s => (
                    <button key={s.id} onClick={() => handleAddSkuToDoc(s.id)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-lg">
                      + {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {activeItems.length > 0 && (
                <div className="space-y-2 mt-2">
                  <div className="text-xs font-semibold text-slate-600">已添加清单：</div>
                  {activeItems.map((item, index) => {
                    const originalSku = skus.find(s => s.id === item.skuId);
                    return (
                      <div key={index} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl text-xs">
                        <span className="font-medium text-slate-800">{originalSku?.name} ({originalSku?.brand})</span>
                        <div className="flex space-x-2 items-center">
                          <input 
                            type="number" 
                            className="w-12 text-center bg-white border border-slate-200 rounded px-1" 
                            value={item.qty} 
                            onChange={(e) => {
                              const updated = [...activeItems];
                              updated[index].qty = Number(e.target.value);
                              setActiveItems(updated);
                            }}
                          />
                          <span>{originalSku?.unit}</span>
                          <span>x</span>
                          <input 
                            type="number" 
                            className="w-16 text-center bg-white border border-slate-200 rounded px-1 font-semibold text-red-500" 
                            value={item.price} 
                            onChange={(e) => handleDocPriceChange(index, e.target.value)}
                          />
                          <span>元</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button onClick={triggerPdfPrint} className="w-full bg-slate-800 text-white rounded-xl py-3 text-sm font-semibold active:scale-95 transition-transform">
                保存为PDF / 发送打印
              </button>
            </div>

            {/* 销售单打印区 */}
            <div id="print-area" className="print-area bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6 text-slate-800">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-widest">{companyName}</h1>
                <p className="text-sm tracking-widest mt-1 text-slate-500">销 售 送 货 单</p>
              </div>

              <div className="grid grid-cols-2 text-xs text-slate-600 gap-y-2">
                <div>购货单位：<strong className="text-slate-800">{activeClient || '(待选择客户)'}</strong></div>
                <div className="text-right">送货单号：{documentNo}</div>
                <div>送货日期：{activeDate}</div>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-200 p-2 text-center">序号</th>
                    <th className="border border-slate-200 p-2">品名</th>
                    <th className="border border-slate-200 p-2">品牌/型号</th>
                    <th className="border border-slate-200 p-2 text-center">单位</th>
                    <th className="border border-slate-200 p-2 text-center">数量</th>
                    <th className="border border-slate-200 p-2 text-center">单价</th>
                    <th className="border border-slate-200 p-2 text-center">金额</th>
                  </tr>
                </thead>
                <tbody>
                  {activeItems.map((item, index) => {
                    const originalSku = skus.find(s => s.id === item.skuId);
                    return (
                      <tr key={index}>
                        <td className="border border-slate-200 p-2 text-center">{index + 1}</td>
                        <td className="border border-slate-200 p-2">{originalSku?.name}</td>
                        <td className="border border-slate-200 p-2">{originalSku?.brand} {originalSku?.model}</td>
                        <td className="border border-slate-200 p-2 text-center">{originalSku?.unit}</td>
                        <td className="border border-slate-200 p-2 text-center">{item.qty}</td>
                        <td className="border border-slate-200 p-2 text-center">￥{item.price}</td>
                        <td className="border border-slate-200 p-2 text-center">￥{item.qty * item.price}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td colSpan="5" className="border border-slate-200 p-2 text-right font-semibold">合计金额</td>
                    <td colSpan="2" className="border border-slate-200 p-2 text-center font-bold text-red-600">
                      ￥{activeItems.reduce((acc, curr) => acc + (curr.qty * curr.price), 0)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="grid grid-cols-3 text-xs text-slate-600 pt-4">
                <div>制单人：{creatorName}</div>
                <div className="text-center">送货人签字：_______________</div>
                <div className="text-right">收货人签字：_______________</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 报价单 */}
        {currentTab === 'quote' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4 no-print">
              <h3 className="font-semibold text-slate-800">一键生成标准报价单</h3>
              <button onClick={triggerPdfPrint} className="w-full bg-slate-800 text-white rounded-xl py-3 text-sm font-semibold active:scale-95 transition-transform">
                生成 PDF 并打印
              </button>
            </div>

            <div id="print-area" className="print-area bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6 text-slate-800">
              <div className="border-b-2 border-slate-800 pb-4">
                <h1 className="text-2xl font-bold tracking-widest text-slate-800">{companyName}</h1>
                <p className="text-xs tracking-wider text-slate-500 mt-1">地址：智能工业园区消防产业基地 ｜ 电话：138-0000-0000</p>
              </div>

              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">产 品 报 价 单</h2>
                <span className="text-xs text-slate-500">日期：{activeDate}</span>
              </div>

              <p className="text-xs">致：<strong className="text-slate-800">{activeClient || '（未输入客户）'}</strong></p>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="p-2.5">序号</th>
                    <th className="p-2.5">产品名称</th>
                    <th className="p-2.5">品牌规格</th>
                    <th className="p-2.5 text-center">数量</th>
                    <th className="p-2.5 text-center">单价</th>
                    <th className="p-2.5 text-center">小计</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeItems.map((item, index) => {
                    const originalSku = skus.find(s => s.id === item.skuId);
                    return (
                      <tr key={index}>
                        <td className="p-2.5">{index + 1}</td>
                        <td className="p-2.5 font-medium">{originalSku?.name}</td>
                        <td className="p-2.5 text-slate-500">{originalSku?.brand} {originalSku?.model}</td>
                        <td className="p-2.5 text-center">{item.qty} {originalSku?.unit}</td>
                        <td className="p-2.5 text-center">￥{item.price}</td>
                        <td className="p-2.5 text-center font-semibold">￥{item.qty * item.price}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center text-xs">
                <span>报价总计：</span>
                <span className="text-lg font-bold text-red-500">￥{activeItems.reduce((acc, curr) => acc + (curr.qty * curr.price), 0)} 元</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: 销售合同 */}
        {currentTab === 'contract' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4 no-print">
              <h3 className="font-semibold text-slate-800">生成采购合同书</h3>
              <button onClick={triggerPdfPrint} className="w-full bg-slate-800 text-white rounded-xl py-3 text-sm font-semibold active:scale-95 transition-transform">
                生成合同 PDF 并签约
              </button>
            </div>

            <div id="print-area" className="print-area bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6 text-slate-800">
              <div className="text-center space-y-1">
                <h1 className="text-xl font-bold tracking-widest">消 防 器 材 采 购 合 同</h1>
                <p className="text-xs text-slate-500">合同编号：HT-{documentNo}</p>
              </div>

              <div className="text-xs space-y-1 leading-relaxed">
                <p><strong>甲方（采购方）：</strong>{activeClient || '(客户名称)'}</p>
                <p><strong>乙方（供应方）：</strong>{companyName}</p>
              </div>

              <table className="w-full text-left text-xs border border-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-200 p-2">产品名称</th>
                    <th className="border border-slate-200 p-2">单位</th>
                    <th className="border border-slate-200 p-2 text-center">数量</th>
                    <th className="border border-slate-200 p-2 text-center">合同单价</th>
                    <th className="border border-slate-200 p-2 text-center">合价</th>
                  </tr>
                </thead>
                <tbody>
                  {activeItems.map((item, index) => {
                    const originalSku = skus.find(s => s.id === item.skuId);
                    return (
                      <tr key={index}>
                        <td className="border border-slate-200 p-2">{originalSku?.name}</td>
                        <td className="border border-slate-200 p-2">{originalSku?.unit}</td>
                        <td className="border border-slate-200 p-2 text-center">{item.qty}</td>
                        <td className="border border-slate-200 p-2 text-center">￥{item.price}</td>
                        <td className="border border-slate-200 p-2 text-center">￥{item.qty * item.price}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="text-[10px] text-slate-600 space-y-1 leading-relaxed border-t pt-4">
                <p><strong>一、质量标准：</strong>乙方交付的产品必须符合国家消防器材质量检测标准及行业合格规范。</p>
                <p><strong>二、交货时间：</strong>乙方负责于本合同签署后 3 日内配送至甲方指定仓库点。</p>
              </div>

              <div className="grid grid-cols-2 text-xs pt-8 gap-x-12">
                <div className="space-y-12">
                  <p>甲方代表签字 (盖章)：</p>
                  <p>日期：______年___月___日</p>
                </div>
                <div className="space-y-12">
                  <p>乙方代表签字 (盖章)：</p>
                  <p>日期：______年___月___日</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: 云端备份（Firebase 安全中心） */}
        {currentTab === 'backup' && (
          <div className="space-y-4 no-print animate-fade-in">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Firebase 安全云备份中心</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    实时加密通道：防时序冲突、防覆盖抹除机制已全面保护。
                  </p>
                </div>
              </div>

              {/* A. 用户已登录看板 */}
              {user ? (
                <div className="space-y-4">
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">当前账号</span>
                      <strong className="text-slate-700">{user.email}</strong>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">安全写入状态</span>
                      {databaseReady ? (
                        <span className="text-emerald-500 font-bold flex items-center space-x-1">
                          <span>🔓 通道就绪 (实时同步激活)</span>
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold flex items-center space-x-1">
                          <span>🔒 通道锁定 (保护中)</span>
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">上次云备份时间</span>
                      <span className="text-slate-700 font-semibold">{lastSyncTime}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">本地数据规模</span>
                      <span className="text-slate-700 font-semibold">{skus.length} SKU / {clients.length} 客户</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={handleForcePullFromCloud}
                      disabled={isCloudSyncing}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3.5 rounded-2xl text-xs active:scale-95 transition-transform flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      <span>🔄 从云端重载数据</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        signOut(auth);
                        showToast("已成功登出账户");
                      }} 
                      className="bg-red-50 hover:bg-red-100 text-red-500 font-semibold py-3.5 rounded-2xl text-xs active:scale-95 transition-transform flex items-center justify-center space-x-2"
                    >
                      <span>🚪 退出登录</span>
                    </button>
                  </div>
                </div>
              ) : (
                // B. 用户未登录注册表单
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div className="p-3 bg-red-50/50 rounded-2xl border border-red-100 text-[11px] text-red-600/90 leading-relaxed">
                    <strong>🛡️ 安全防护提醒：</strong><br />
                    新设备首次绑定账号时，系统会自动将云端数据<strong>安全合并下载</strong>到此设备，确保您此前的云备份数据不被任何空白缓存覆盖。
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">电子邮件地址</label>
                      <input 
                        type="email" 
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-red-400" 
                        placeholder="example@yourdomain.com"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">登录密码</label>
                      <input 
                        type="password" 
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-red-400" 
                        placeholder="请输入您的密码 (不小于6位)"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isCloudSyncing}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3.5 rounded-2xl text-xs active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {isCloudSyncing ? "建立加密连接中..." : (isSignUp ? "创建新安全账户" : "安全验证登录")}
                  </button>

                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-xs text-slate-400 hover:text-slate-600 underline"
                    >
                      {isSignUp ? "已有安全账户？去登录" : "未建立备份账户？点此免费注册"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </main>

      {/* 3. 全局弹窗：新增 SKU (支持 单个 + 批量 选项卡) */}
      {showAddSkuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm no-print">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 shadow-xl">
            
            <div className="flex border-b border-slate-100 pb-2">
              <button 
                onClick={() => setAddSkuTab('single')}
                className={\`flex-1 text-center py-2 text-sm font-semibold transition-all \${addSkuTab === 'single' ? 'text-red-500 border-b-2 border-red-500' : 'text-slate-400'}\`}
              >
                单个录入
              </button>
              <button 
                onClick={() => setAddSkuTab('batch')}
                className={\`flex-1 text-center py-2 text-sm font-semibold transition-all \${addSkuTab === 'batch' ? 'text-red-500 border-b-2 border-red-500' : 'text-slate-400'}\`}
              >
                批量导入表格
              </button>
            </div>

            {addSkuTab === 'single' && (
              <div className="space-y-2 text-xs">
                <input type="text" placeholder="产品名称" id="add-name" className="w-full bg-slate-50 border-none rounded-xl px-3.5 py-2.5" />
                <input type="number" placeholder="原生进货单价 (元)" id="add-price" className="w-full bg-slate-50 border-none rounded-xl px-3.5 py-2.5" />
                <input type="text" placeholder="生产品牌" id="add-brand" className="w-full bg-slate-50 border-none rounded-xl px-3.5 py-2.5" />
                <input type="text" placeholder="规格型号" id="add-model" className="w-full bg-slate-50 border-none rounded-xl px-3.5 py-2.5" />
                <input type="text" placeholder="计量单位 (例如: 具、个)" id="add-unit" className="w-full bg-slate-50 border-none rounded-xl px-3.5 py-2.5" />
                <textarea placeholder="备注说明" id="add-note" className="w-full bg-slate-50 border-none rounded-xl px-3.5 py-2.5 h-16 resize-none" />
                
                <div className="flex space-x-2 pt-2">
                  <button 
                    onClick={() => setShowAddSkuModal(false)} 
                    className="flex-1 bg-slate-100 text-slate-700 rounded-xl py-2.5 text-xs font-semibold"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => {
                      const name = document.getElementById('add-name').value;
                      const price = document.getElementById('add-price').value;
                      const brand = document.getElementById('add-brand').value;
                      const model = document.getElementById('add-model').value;
                      const unit = document.getElementById('add-unit').value || '个';
                      const note = document.getElementById('add-note').value;
                      if (!name) return showToast("名称不能为空");
                      handleAddSku({ name, price, brand, model, unit, note });
                      setShowAddSkuModal(false);
                    }} 
                    className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-xs font-semibold"
                  >
                    确定新增
                  </button>
                </div>
              </div>
            )}

            {addSkuTab === 'batch' && (
              <div className="space-y-4">
                <div className="p-3 bg-red-50/50 rounded-2xl border border-red-100 text-[10px] text-red-600 leading-relaxed">
                  <strong>💡 批量导入指南：</strong><br />
                  1. 支持导入标准 <strong>.csv</strong> 逗号分隔表格。<br />
                  2. 支持直接从 <strong>Excel/WPS</strong> 复制所需多行，并在下方文本框内粘贴。<br />
                  列排列推荐：<span className="font-semibold underline">品名, 进价, 品牌, 型号, 单位, 备注</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">方法一：导入 CSV 表格</label>
                  <div className="relative border border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 cursor-pointer">
                    <input type="file" accept=".csv" onChange={handleCsvImport} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="text-xs text-slate-500">📂 拖拽或点击选择您的 CSV 文件</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">方法二：直接粘贴表格数据</label>
                  <textarea 
                    value={batchPasteText}
                    onChange={(e) => setBatchPasteText(e.target.value)}
                    placeholder="在此处 Ctrl+V 直接粘贴从 Excel/WPS 复制的物料行数据..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs h-32 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                  />
                  
                  <div className="flex space-x-2">
                    <button onClick={() => setShowAddSkuModal(false)} className="flex-1 bg-slate-100 text-slate-700 rounded-xl py-2.5 text-xs font-semibold">
                      取消
                    </button>
                    <button onClick={handleBatchTextImport} className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-xs font-semibold">
                      开始执行批量导入
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 4. 全局弹窗：单个 SKU 查看/编辑编辑 */}
      {selectedSku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm no-print">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-800">编辑 SKU 规格数据</h3>
            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">产品名称</label>
                <input type="text" defaultValue={selectedSku.name} id="edit-name" className="w-full bg-slate-50 border-none rounded-xl px-3.5 py-2.5" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">原生进货底价 (元)</label>
                <input type="number" defaultValue={selectedSku.price} id="edit-price" className="w-full bg-slate-50 border-none rounded-xl px-3.5 py-2.5" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">生产厂家/品牌</label>
                <input type="text" defaultValue={selectedSku.brand} id="edit-brand" className="w-full bg-slate-50 border-none rounded-xl px-3.5 py-2.5" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">规格型号</label>
                <input type="text" defaultValue={selectedSku.model} id="edit-model" className="w-full bg-slate-50 border-none rounded-xl px-3.5 py-2.5" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">计量单位</label>
                <input type="text" defaultValue={selectedSku.unit} id="edit-unit" className="w-full bg-slate-50 border-none rounded-xl px-3.5 py-2.5" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">备注说明</label>
                <textarea defaultValue={selectedSku.note} id="edit-note" className="w-full bg-slate-50 border-none rounded-xl px-3.5 py-2.5 h-16 resize-none" />
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  handleDeleteSku(selectedSku.id);
                  setSelectedSku(null);
                }} 
                className="bg-red-50 hover:bg-red-100 text-red-500 rounded-xl px-3.5 text-xs font-semibold"
              >
                删除
              </button>
              <button 
                onClick={() => setSelectedSku(null)} 
                className="flex-1 bg-slate-100 text-slate-700 rounded-xl py-2.5 text-xs font-semibold"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  const name = document.getElementById('edit-name').value;
                  const price = document.getElementById('edit-price').value;
                  const brand = document.getElementById('edit-brand').value;
                  const model = document.getElementById('edit-model').value;
                  const unit = document.getElementById('edit-unit').value;
                  const note = document.getElementById('edit-note').value;
                  handleEditSku({ id: selectedSku.id, name, price, brand, model, unit, note });
                  setSelectedSku(null);
                }} 
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-xs font-semibold"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. 侧边栏抽屉 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex no-print">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex flex-col w-72 max-w-xs h-full bg-white shadow-xl z-50 p-5 space-y-6">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">CRM 数据面板</h3>
              <p className="text-[10px] text-slate-400">消防器材高效移动端工具箱</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2">已登记客户名录</span>
                <div className="space-y-1.5">
                  {clients.map(client => (
                    <div key={client.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs">
                      <div>
                        <div className="font-semibold text-slate-700">{client.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{client.contact}</div>
                      </div>
                      <button 
                        onClick={() => handleDeleteClient(client.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowRecycleBin(true);
                  setSidebarOpen(false);
                }} 
                className="w-full border border-slate-200 text-slate-600 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2"
              >
                <span>♻️ 查看回收站 ({recycleBin.length})</span>
              </button>
            </div>
            
            <div className="border-t pt-4">
              <span className="text-[10px] text-slate-400 block">版本号 1.0.0</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. 回收站面板 */}
      {showRecycleBin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm no-print">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-800 flex items-center space-x-2">
              <span>回收站</span>
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {recycleBin.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">回收站是空的</div>
              ) : (
                recycleBin.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="bg-slate-200 text-slate-600 scale-90 px-1.5 py-0.5 rounded text-[10px] mr-1.5 inline-block">
                        {item.type === 'sku' ? '产品' : '客户'}
                      </span>
                      <strong className="text-slate-700">{item.data.name}</strong>
                    </div>
                    <button 
                      onClick={() => handleRestore(index)}
                      className="text-blue-500 hover:text-blue-600 font-semibold"
                    >
                      恢复
                    </button>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => setShowRecycleBin(false)} 
              className="w-full bg-slate-800 text-white rounded-xl py-2.5 text-xs font-semibold"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 7. 全局消息吐司 */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs px-4 py-2.5 rounded-full backdrop-blur shadow-lg flex items-center space-x-2 no-print animate-bounce">
          <span>🔔 {notification}</span>
        </div>
      )}

      {/* 8. 底栏导航 */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md bg-white/75 border-t border-slate-200/50 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] flex justify-around py-3 px-2 no-print safe-bottom">
        {[
          { id: 'home', label: '首页', icon: '⛺' },
          { id: 'sales', label: '送货单', icon: '📋' },
          { id: 'quote', label: '报价单', icon: '📊' },
          { id: 'contract', label: '合同', icon: '✒️' },
          { id: 'backup', label: '备份中心', icon: '🛡️' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={\`flex flex-col items-center space-y-1 py-1 px-3.5 rounded-2xl transition-all \${currentTab === tab.id ? 'text-red-500 bg-red-50/50' : 'text-slate-400 hover:text-slate-600'}\`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );

  // 本地冗余备份数据导出为JSON
  function handleExportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ skus, clients, recycleBin }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", \`fire_crm_backup_\${new Date().toISOString().slice(0,10)}.json\`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("备份已安全导出到本地");
  }
}`
};

// 自动生成项目结构
console.log("🚀 正在为您安全生成消防器材 CRM 全套 PWA + Firebase 源码...");

Object.entries(projectFiles).forEach(([filePath, content]) => {
  const dir = path.dirname(filePath);
  if (dir !== '.') {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ [已创建] ${filePath}`);
});

console.log("\n🎉 项目初始化成功！后续操作步骤：");
console.log("1. 在当前目录下运行: npm install");
console.log("2. 在 src/firebase.js 中配置您的 Firebase API key");
console.log("3. 运行: npm run dev 即可在本地启动。完成后提交至 GitHub，Vercel 即可一键拉取发布！");
# 免费云端同步配置

网站支持 Supabase Free 方案。未配置时，页面仍使用浏览器本地存储；配置后，快团结算、读书瞳进销存和微信群退群侦测会同步到同一个云端项目。

## 配置步骤

1. 在 Supabase 创建 Free 项目。
2. 在 SQL Editor 执行 `supabase-schema.sql`。
3. 复制 `cloud-config.example.js` 为 `cloud-config.js`。
4. 将项目 URL 和 Publishable/anon key 填入 `cloud-config.js`。
5. 将 `cloud-config.js` 放在本项目根目录后发布。

不要填写 Database Password 或 Service Role Key。`cloud-config.js` 只应填写前端公开 key。

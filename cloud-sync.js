(function () {
  const config = window.CLOUD_CONFIG || {};
  const client = window.supabase && config.url && config.anonKey
    ? window.supabase.createClient(config.url, config.anonKey)
    : null;

  function start(options) {
    const { appId, keys, onRemote } = options;
    if (!client) return Promise.resolve(false);
    const storage = {};
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) storage[key] = value;
    });

    const applyRemote = data => {
      if (!data || typeof data !== 'object') return;
      Object.entries(data).forEach(([key, value]) => {
        if (keys.includes(key)) localStorage.setItem(key, value);
      });
      onRemote?.();
    };

    const publish = async () => {
      const data = {};
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) data[key] = value;
      });
      await client.from('shared_app_state').upsert({ app_id: appId, state: data, updated_at: new Date().toISOString() });
    };

    keys.forEach(key => {
      const originalSetItem = localStorage.setItem.bind(localStorage);
      const originalRemoveItem = localStorage.removeItem.bind(localStorage);
      if (!localStorage.__cloudSyncPatched) {
        localStorage.setItem = (name, value) => {
          originalSetItem(name, value);
          if (keys.includes(name)) window.clearTimeout(start.publishTimer), start.publishTimer = window.setTimeout(publish, 250);
        };
        localStorage.removeItem = name => {
          originalRemoveItem(name);
          if (keys.includes(name)) window.clearTimeout(start.publishTimer), start.publishTimer = window.setTimeout(publish, 250);
        };
        localStorage.__cloudSyncPatched = true;
      }
    });

    return client.from('shared_app_state').select('state').eq('app_id', appId).maybeSingle().then(({ data, error }) => {
      if (error) throw error;
      if (data?.state && Object.keys(data.state).length) applyRemote(data.state);
      else return publish();
      return true;
    }).then(() => {
      client.channel(`shared-app-state-${appId}`).on('postgres_changes', {
        event: '*', schema: 'public', table: 'shared_app_state', filter: `app_id=eq.${appId}`
      }, payload => applyRemote(payload.new?.state)).subscribe();
      return true;
    }).catch(error => {
      console.warn('Cloud sync unavailable:', error);
      return false;
    });
  }

  window.cloudSync = { start, enabled: Boolean(client) };
})();

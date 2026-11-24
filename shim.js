// Android WebView ignores <a download> for blob: URLs. Remember blobs, and when
// a script "clicks" such a link, save the file and open the Android share sheet.
(function () {
  const blobs = new Map();
  const origCreate = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function (obj) {
    const url = origCreate(obj);
    if (obj instanceof Blob) blobs.set(url, obj);
    return url;
  };
  function toBase64(blob) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(',')[1]);
      r.onerror = () => rej(r.error);
      r.readAsDataURL(blob);
    });
  }
  async function saveAndShare(blob, name) {
    const P = window.Capacitor && window.Capacitor.Plugins;
    if (!P || !P.Filesystem || !P.Share) throw new Error('Native plugins missing');
    const data = await toBase64(blob);
    const w = await P.Filesystem.writeFile({ path: name, data, directory: 'CACHE' });
    await P.Share.share({ title: name, url: w.uri, dialogTitle: 'Save ' + name });
  }
  const origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.download && this.href.startsWith('blob:') && window.Capacitor && window.Capacitor.isNativePlatform()) {
      const blob = blobs.get(this.href);
      if (blob) {
        saveAndShare(blob, this.download).catch(e => alert('Save failed: ' + e.message));
        return;
      }
    }
    return origClick.call(this);
  };
})();

export default {
  async fetch(request, env, ctx) {
    // Kode ini berfungsi sebagai router/middleware jika Anda ingin membuat API di kemudian hari
    // Jika request diarahkan ke aset statis, Cloudflare secara otomatis akan menghandlenya dari folder ./dist
    return env.ASSETS.fetch(request);
  },
};

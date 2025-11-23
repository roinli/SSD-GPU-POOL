/*eslint-disable*/
const path = require('path');
const sass = require('sass');
const Promise = require('bluebird');
const fs = require('fs-extra');
const { match } = require('path-to-regexp');

const proxy = require('express-http-proxy');
const defaultSettings = require('./src/settings.js');

function resolve(dir) {
  return path.join(__dirname, dir);
}

const name = defaultSettings.title; // 网址标题
const port = 8013; // 端口配置

// All configuration item explanations can be find in https://cli.vuejs.org/config/
module.exports = {
  publicPath: '/',
  outputDir: 'dist',
  assetsDir: 'static',
  lintOnSave: process.env.NODE_ENV === 'development',
  productionSourceMap: false,
  devServer: {
    port,
    open: false,
    overlay: {
      warnings: false,
      errors: true,
    },
    before (app){
      function requireUncached(module) {
        try {
          // 删除缓存，动态加载
          delete require.cache[require.resolve(module)];
          return require(module);
        } catch (e) {
          // console.log(`can't load module in ${module}`);
          return false
        }
      }

      // 根据 mock 请求发送响应
      function sendValue(req, res, value) {
        if (typeof value === 'function') {
          value = value(req, res);
        }

        if (value.$$header) {
          Object.keys(value.$$header).forEach(key => {
            res.setHeader(key, value.$$header[key]);
          });
        }

        const delay = value.$$delay || 0;
        delete value.$$header;
        delete value.$$delay;

        Promise.delay(delay, value).then(result => {
          res.send(result);
        });
      }

      // 分解mockPath
      const splitUrl = resouce => {
        const splitUrl = resouce.split('::');
        let verb = 'get', url = '';
        if (splitUrl.length > 2) {
          throw new Error('url 格式不对');
        }
        if (splitUrl.length === 2) {
          verb = splitUrl[0].toLowerCase();
          url = splitUrl[1];
        } else if (splitUrl.length === 1) {
          verb = 'get';
          url = splitUrl[0];
        }
        return [verb, url];
      }

      // 处理 restful mock 接口
      const mockMap = require(path.join(__dirname, 'mock/mock-map'));
      // 根据用户是否添加 mock 文件来决定走本地 mock 或者转发到 dev 接口
      app.use('/mock', proxy(process.env.VUE_APP_BASE_API, {
        filter: function(req, res){
          // 是否匹配到本地 rest 风格 api mockUrl
          const matchRESTApi = Object.keys(mockMap).findIndex(d => {
            const [,uri] = splitUrl(d);
            const matcher = match(uri, { decode: decodeURIComponent })
            return matcher(req.path)
          }) > -1
          // 如果匹配到 restApi 走本地 mock
          if (matchRESTApi) return false
          // 其他路径
          const mockPath = path.join(__dirname, 'mock', req.path);
          const value = requireUncached(mockPath);
          return value === false
        }
      }));
        // 对于每个 mock 请求，require mock 文件夹下的对应路径文件，并返回响应
      Object.keys(mockMap).forEach(mockPath => {
        const [verb, uri] = splitUrl(mockPath);
        app[verb](path.posix.join('/mock', uri), function(req, res) {
          const value = requireUncached(path.join(__dirname, 'mock', mockMap[mockPath]))
          sendValue(req, res, value)
        })
      })

      app.all('/mock/*', function(req, res) {
        const mockPath = path.join(__dirname, req.path)
        const value = requireUncached(mockPath)
        if (value) {
          sendValue(req, res, value)
        } else {
          res.sendStatus(404)
        }
      })
    },
  },
  css: {
    loaderOptions: {
      sass: {
        implementation: sass,
      },
    },
  },
  configureWebpack: {
    // provide the app's title in webpack's name field, so that
    // it can be accessed in index.html to inject the correct title.
    name,
    resolve: {
      alias: {
        '@': resolve('src'),
        '@crud': resolve('src/components/Crud'),
      },
    },
  },
  chainWebpack(config) {
    config.plugins.delete('preload');
    config.plugins.delete('prefetch');

    // set preserveWhitespace
    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap(options => {
        options.compilerOptions.preserveWhitespace = true;
        return options;
      })
      .end();
    
    config.module.rule('svg').exclude.add(resolve('src/svgs')).end();
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/svgs'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]',
      })
      .end();
    
    config
      // https://webpack.js.org/configuration/devtool/#development
      .when(process.env.NODE_ENV === 'development',
        config => config.devtool('eval-source-map'),
      );

    config
      .when(process.env.NODE_ENV !== 'development',
        config => {
          config
            .plugin('ScriptExtHtmlWebpackPlugin')
            .after('html')
            .use('script-ext-html-webpack-plugin', [{
            // `runtime` must same as runtimeChunk name. default is `runtime`
              inline: /runtime\..*\.js$/,
            }])
            .end();
          config
            .optimization.splitChunks({
              chunks: 'all',
              cacheGroups: {
                libs: {
                  name: 'chunk-libs',
                  test: /[\\/]node_modules[\\/]/,
                  priority: 10,
                  chunks: 'initial', // only package third parties that are initially dependent
                },
                elementUI: {
                  name: 'chunk-elementUI', // split elementUI into a single package
                  priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
                  test: /[\\/]node_modules[\\/]_?element-ui(.*)/, // in order to adapt to cnpm
                },
                commons: {
                  name: 'chunk-commons',
                  test: resolve('src/components'), // can customize your rules
                  minChunks: 3, //  minimum common number
                  priority: 5,
                  reuseExistingChunk: true,
                },
              },
            });
          config.optimization.runtimeChunk('single');
        },
      );
  },
};

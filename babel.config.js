const plugins = ['@vue/babel-plugin-transform-vue-jsx', '@babel/plugin-proposal-optional-chaining'];
// 生产环境移除console
if (process.env.NODE_ENV === 'production') {
  plugins.push('transform-remove-console');
}
module.exports = {
  plugins,
  presets: [['@vue/app', { useBuiltIns: 'entry' }]],
};

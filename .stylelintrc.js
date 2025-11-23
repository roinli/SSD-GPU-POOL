module.exports = {
  extends: ["stylelint-config-standard","stylelint-config-recess-order"],
  plugins: ["stylelint-scss", "stylelint-order"],
  rules: {
    // 自定义规则
    "at-rule-no-unknown": [true, {
      "ignoreAtRules": ["function", "if", "else", "each", "include", "mixin"]
    }],
    "selector-pseudo-element-no-unknown": [true, {
      "ignorePseudoElements": ["v-deep"]
    }],
    "font-family-no-missing-generic-family-keyword": [true, {
      "ignoreFontFamilies": ["Lato", "iconfont"]
    }]
  }
}
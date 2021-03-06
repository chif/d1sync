module.exports = {
  extends: 'erb/typescript',
  rules: {
    // A temporary hack related to IDE not resolving correct package.json
    'import/no-extraneous-dependencies': 'off',
    // we are using typeScript, PropTypes is an unnecessary overhead
    'react/prop-types': 'off',
    'no-plusplus': [2, { allowForLoopAfterthoughts: true }],
    'no-param-reassign': [2, { props: false }],
    'max-len': [2, { code: 120, tabWidth: 2, ignoreUrls: true }]
  },
  settings: {
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {},
      webpack: {
        config: require.resolve('./configs/webpack.config.eslint.js')
      }
    }
  }
};

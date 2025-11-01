export default {
  plugins: {
    'postcss-preset-env': {
      stage: 3, // Use stable features
      features: {
        'nesting-rules': true, // Enable CSS nesting
        'custom-media-queries': true, // Enable custom media queries
      },
    },
    autoprefixer: {
      // Automatically add vendor prefixes for the last 2 versions of browsers
      overrideBrowserslist: [
        'last 2 versions',
        '> 1%',
        'not dead',
      ],
    },
  },
}

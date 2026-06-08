const { withGradleProperties } = require('@expo/config-plugins');

module.exports = function withEdgeToEdgeDisabled(config) {
  return withGradleProperties(config, (props) => {
    // Remove existing edgeToEdgeEnabled entry
    props.modResults = props.modResults.filter(
      item => !(item.type === 'property' && item.key === 'edgeToEdgeEnabled')
    );
    // Add disabled
    props.modResults.push({
      type: 'property',
      key: 'edgeToEdgeEnabled',
      value: 'false',
    });
    return props;
  });
};

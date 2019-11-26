function getModuleExportList(body) {
  var exportedList = [];
  body.some(item => {
    if (item.type === 'ExpressionStatement' && item.expression.operator === '=') {
      var left = item.expression.left;
      if (left.object.name === 'apimodule' && left.property.name === 'exports') {
        var right = item.expression.right;
        if (right.type === 'ObjectExpression') {
          exportedList = right.properties.map(prop => {
            /*
            if (prop.value.params) {
              addError(`Exported function named '${prop.key.name}' was incorrectly declared inline`,'https://github.com/IMAT-Solutions/omega/blob/master/docs/lib/api.md#exported-functions');
            }
            */
            return {
              key: prop.key.name,
              fnName: prop.value.name || prop.key.name
            }
          });

        }

        return true;
      }
    }
  });

  return exportedList;
}
module.exports = getModuleExportList;
